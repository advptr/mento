// globals
var root = '/html',
io = require('socket.io'), express = require('express'), fs = require('fs'), http = require('http'),
argv = require('optimist').usage('Usage: $0 --port [http_port]').default('port', 8080).argv,
questions = JSON.parse(fs.readFileSync('questions.json', 'utf8')),
app = express(),
Client = require('./lib/Client.js');

app.configure(function() {
	app.use(express.favicon());
	app.use(express.static(__dirname + root));	
	app.use(express.errorHandler({ showStack: true, dumpExceptions: true }));
});


// WebServer
var server = http.createServer(app).listen(argv.port, function() {
	console.log('Listening at: http://localhost:' + argv.port);
});

var clients = [];

var activeQuestion = new function() {
	var _id;
	var _timeout = 0;
	var _opened = 0;
	var _numQuiz = 0;
	var _numVote = 0;

	this.now = function() {
		return new Date().getTime();
	}

	//
	this.activate = function(id, quiz, timeout) {
		_id = id;
		_timeout = (timeout * 1000);
		_opened = this.now();
		if (quiz) {
			_numQuiz++;
		} else {
			_numVote++;
		}
		console.log("numQuiz = %d", _numQuiz);
	}

	//
	this.getNumQuiz = function() {
		return _numQuiz;
	}

	//
	this.getNumVote = function() {
		return _numVote;
	}


	// timeout in seconds
	this.getTimeout = function() {
		var t = (_timeout - (this.now() - _opened));
		return Math.round(t / 1000);
	}

	this.getId = function() {
		return _id;
	}

	this.isActive = function() {
		return ((this.now() - _opened) < (_timeout - 3000));
	}
}

Array.prototype.remove = function(e) {
	var i = this.indexOf(e);
	if (i != -1) {
		return this.splice(i, 1);
	}
	return this;
}

var saveQuestion = function() {
	var num = activeQuestion.getId();
	fs.writeFile('Q' + num + '.result', JSON.stringify(questions[num]));
}

var openPage = function(pageName, data) {
	for (var i = 0; i < clients.length; i++) {
		clients[i].emit(pageName, data);
	}		
}

var openQuestion = function(data) {
	var num = data.num;
	questions[num].answers = [];
	activeQuestion.activate(num, (questions[num].answer > -1), data.timeout);
	openPage('openQuestion', { "question" : questions[num], "timeout" : data.timeout });
}


// Listens on connections from clients
io.listen(server, { log: false }).on('connection', function (socket) {

	var client = Client(socket);
	clients.push(client);
	socket.emit('ack');

	console.log("connection: " + socket.id);

	socket.on('disconnect', function() {
		console.log('Disconnected: ' + client.getEmail());
		clients.remove(client);
		client.emitAll('users', clients.length);
	});

	socket.on('logout', function() {
		console.log('logout');
		clients.remove(client);
		client.emitAll('users', clients.length);
	});

	socket.on('openWelcomePage', function() {
		openPage('openWelcomePage');
	});

	socket.on('openToplistPage', function() {
		openPage('openToplistPage', questions);
	});

	socket.on('openQuestion', function(data) {
		openQuestion(data);		
	});

	socket.on('email', function(email) {
		console.log('email attempt: ', email);
		for (var i = 0; i < clients.length; i++) {
			if (email == clients[i].email) {
				socket.emit('email', false);
				console.log('invalid email: ', email);
				return;
			}
		}
		client.setEmail(email);
		console.log('accepted email: ', email);
		socket.emit('email', true);
		if (activeQuestion.isActive()) {
			client.emit('openQuestion', { "question" : questions[activeQuestion.getId()], "timeout" : activeQuestion.getTimeout() });
		}
		client.emitAll('users', clients.length);
	});

	socket.on('results', function() {
		socket.emit('results', questions[activeQuestion.getId()]);
	});

	socket.on('answer', function(data) {
		var num = activeQuestion.getId();
		if (num >= 0 && num < questions.length) {
			questions[num].answers.push(data);
			if (questions[num].answer > -1) {
				client.answer(num, (data.option == questions[num].answer));
				client.emit('actualResult', client.result(activeQuestion.getNumQuiz()));
			}
			client.emitAll('answers', questions[num].answers.length);
		}
	});

	socket.on('questions', function() {
		socket.emit('questions', questions);
	});
});
