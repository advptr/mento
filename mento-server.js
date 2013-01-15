//
var root = '/html',
	io = require('socket.io'), express = require('express'), http = require('http'),
	argv = require('optimist').usage('Usage: $0 --port [http_port]').default('port', 8080).argv,
	app = express(),
	Db = require('./lib/mongo-db'),
	db = Db('cadec-quiz-2013');


process.on('uncaughtException', function (err) {
  console.log('Ouch! uncaughtException', err);
});

db.open(function(err) {
	if (err) {
		console.log(err);
		return;
	}
	
	console.log('connected to db');

	app.configure(function() {
		app.use(express.favicon());
		app.use(express.static(__dirname + root));	
		app.use(express.errorHandler({ showStack: true, dumpExceptions: true }));
	});

	// WebServer
	var server = http.createServer(app).listen(argv.port, function() {
		console.log('Listening at: http://localhost:' + argv.port);
	});


	// Keeps track of (user) sessions
	function Session(socket) {
		this.socket = socket;
		this.participant = null;
	}

	// Participant
	function Participant(email) {
		this.email = email;
		this.answers = [];
		this.correct = 0;

		this.reset = function() {
			this.answers = [];
			this.correct = 0;
		}
	}

	// Answer
	function Answer(round, option) {
		this.round = round;
		this.option = option;
	}

	// Vote or Quiz round
	function Round() {
		this.id = 0;
		this.timeout = 0;
		this.opened = 0;
		this.numQuiz = 0;
		this.numVote = 0;
		this.answers = [];
		this.question = null;

		//
		this.activate = function(id, timeout) {
			this.id = id;
			this.timeout = ((timeout+2) * 1000);
			this.opened = Date.now();
			this.question = Session.questions[this.id];
			if (this.question.answer > -1) {
				this.numQuiz++;
			} else {
				this.numVote++;
			}
			this.answers = [];
		}

		// timeout in seconds
		this.getTimeout = function() {
			var t = (this.timeout - (Date.now() - this.opened));
			return Math.round(t / 1000);
		}

		//
		this.addAnswer = function(answer) {
			if (this.isActive()) {
				this.answers.push(answer);
			}
		}

		//
		this.isActive = function() {
			return ((Date.now() - this.opened) < this.timeout);
		}
	}

	Session.reset = function() {
		if (Session.sessions == undefined) {
			Session.sessions = [];
		}
		Session.sessions.forEach(function(session) {
			if (session.participant) {
				if (session.participant.reset !== undefined) {
					session.participant.reset();
				}
			}
		});
		Session.round = new Round();
		db.findQuestions(function(err, questions) {
			console.log(err ? err : questions.length + ' questions fetched from db.');
			Session.questions = questions;
		});
	}

	Session.reset();

	Session.prototype.sendAll = function(cmd, object) {
	   this.send(cmd, object);
	   this.socket.broadcast.emit(cmd, object);	
	   return this;
	}

	Session.prototype.send = function(cmd, object) {
		this.socket.emit(cmd, object);
		return this;	
	}

	Array.prototype.remove = function(e) {
		var i = this.indexOf(e);
		if (i != -1) {
			return this.splice(i, 1);
		}
		return this;
	}

	var openPage = function(pageName, data) {
		Session.sessions.forEach(function(session) {
			if (session.participant) {
				session.send(pageName, data);
			}
		});
	};

	var openQuestion = function(data) {
		Session.round.activate(data.num, data.timeout);
		openPage('openQuestion', { "question" : Session.round.question, "timeout" : data.timeout });
	};

	// most correct answers wins
	// use random algorithm to ensure one winner
	var getWinningSlot = function(sortedParticipants) {
		var numFirst = 0;
		sortedParticipants.forEach(function(participant) {
			if (participant.correct == sortedParticipants[0].correct) {
				numFirst++;
			} else {
				return;
			}
		});
		return Math.floor(Math.random()*numFirst);		
	};

	// Listens on connections from clients
	io.listen(server, { log: false }).on('connection', function(socket) {

		var session = new Session(socket);
		Session.sessions.push(session);
		session.send('ack');
		session.sendAll('users', Session.sessions.length);

		console.log(socket.id, ' connected');

		socket.on('disconnect', function() {
			console.log('disconnected', session.participant);
			Session.sessions.remove(session);
			session.sendAll('users', Session.sessions.length);
		}).on('logout', function() {
			console.log('logout');
			Session.sessions.remove(session);
			session.sendAll('users', Session.sessions.length);
		}).on('openWelcomePage', function() {
			openPage('openWelcomePage');
		}).on('openToplistPage', function() {
			db.findParticipants(function(err, participants) {
				if (err) {
					console.log(err);
				} else {
					// sort in descending order
					participants.sort(function(a, b) {
						return (a.correct == b.correct) ? 0 : (b.correct - a.correct);
					});
					var winner = getWinningSlot(participants);
					console.log('winner', participants[winner]);
					openPage('openToplistPage', { participants : participants, num : Session.round.numQuiz, winner : winner });
				}
			});
		}).on('openQuestion', function(data) {
			openQuestion(data);		
		}).on('scratch', function(data) {
			db.cleanParticipant(function(err) {
				if (err) {
					console.log('unexpected error', err);
				} else {
					Session.reset();
					socket.broadcast.emit('ack');
					console.log('Database scratched, new round!');
				}
			});
		}).on('email', function(email) {
			console.log('email attempt: ', email);
			// cannot connect if exists
			Session.sessions.forEach(function(session) {
				if (session.participant && session.participant.email == email) {
					session.send('email', false);
					console.log('email bound to existing session', email);
					return;
				}
			});
			db.findParticipant(email, function(err, participant) {
				if (err) {
					console.log('find', err);
					session.send('email', false);
				} else if (participant) {
					session.participant = participant;
					console.log('found', session.participant);
					session.send('email', true);
				} else {
					session.participant = new Participant(email);
					db.saveParticipant(session.participant, function(err) {
						var rc = false;
						if (!err) {
							if (Session.round.isActive()) {
								session.send('openQuestion', { question : Session.round.question, timeout : Session.round.getTimeout() });
							}
							console.log('saved', session.participant);
							rc = true;
						} else {
							console.log('unexpected error', err);
						}
						session.send('email', rc);
					});
				}
			});
		}).on('results', function() {
			var results = { question : Session.round.question, answers : Session.round.answers, score : { total : Session.round.numQuiz, correct : session.participant.correct } };
			session.send('results', results);
		}).on('answer', function(data) {
			if (session.participant) {
				var num = Session.round.id;
				Session.round.addAnswer(data);
				session.participant.answers.push(new Answer(num, data.option));
				if (data.option == Session.round.question.answer) {
					session.participant.correct++;
				}
				db.saveParticipant(session.participant, function(err) {
					if (!err) {
						session.sendAll('answers', Session.round.answers.length);
					} else {
						console.log('unexpected error', err);
					}
				});
			}
		}).on('updateQuestions', function(questions) {
			console.log('updateQuestions');
			db.cleanQuestions(function(err, name) {
				console.log('cleaned', name);
				if (err) {
					console.log(err);
				} else {
	 				db.saveQuestions(questions, function(err, updated) {
						if (!err) {
							session.send('updateQuestions', updated);
						} else {
							console.log(err);
						}
					});
 				}
			});
		}).on('questions', function() {
			session.send('questions', Session.questions);
		});
	});

});

