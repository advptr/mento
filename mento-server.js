console.log('mento');

var homePage = '/mento.html';
var root = 'html';

var io = require('socket.io'),
fs = require('fs'),
url = require('url'),
http = require('http'),
argv = require('optimist').usage('Usage: $0 --port [http_port]').default('port', 8080).argv;

var questions = JSON.parse(fs.readFileSync('questions.json', 'utf8'));

var mimeType = function(file) {
	var index = file.lastIndexOf('.');
	if (index == -1) {
		return "text/plain";
	}
	var ext = file.substring(index+1);
	switch (ext) {
	case 'html':
		return 'text/html';
	case 'css':
		return 'text/css';
	case 'js':
		return 'application/javascript';
	case 'woff':
		return 'application/x-font-woff';
	case 'eot':
		return 'application/vnd.ms-fontobject';
	case 'svg':
	case 'svgz':
		return 'image/svg+xml';
	case 'ttf':
		return 'application/x-font-ttf';
	default:
		return 'text/plain';
	}
};

var log = function(rec) {
    console.log(rec.time + ' - ' + rec.code + ' ' + rec.client + ', ' + rec.file + ', ' + rec.mime);
};

// Tiny WebServer
var server = http.createServer(function(req, res) {
	var path = url.parse(req.url).pathname;
	var file = root + ((path == '/') ? homePage : path);
	var rec = { "time" : new Date().toISOString(), "client" : req.connection.remoteAddress, "file" : file, "mime" : null, "code" : 200, "err" : null };

	fs.exists(file, function(exists) {
		if (exists) {
			rec.mime = mimeType(file);
			res.writeHead(200, { 'Content-type': rec.mime });
			fs.readFile(file, function(err, data) {
				if (err) {
					res.writeHead(500, { 'Content-type': 'text/plain'});
					res.end("500 - " + http.STATUS_CODES[500] + ', ' + err);
					rec.err = err;
					rec.code = 500;
				} else {
					res.end(data);
					res.writeHead(200, { 'Content-type': rec.mime });
				}
				//log(rec);
			});
		} else {
			res.writeHead(404, { 'Content-type': 'text/plain'});
			res.end("404 - " + http.STATUS_CODES[404]);
			rec.code = 404;
			log(rec);
		}
	});
}).listen(argv.port, function() {
	console.log('Listening at: http://localhost:' + argv.port);
});

var num = -1;
var clients = [];

var Client = function(socket) {
	this.socket = socket;
	this.email = null;
};

Client.prototype.emit = function(cmd, object) {
	if (this.email != null) {
		this.socket.emit(cmd, object);
	}
	return this;
};


Client.prototype.emitAll = function(cmd, object) {
	this.socket.emit(cmd, object);
	this.socket.broadcast.emit(cmd, object);
	return this;
};

Client.prototype.userUpdate = function(n) {
	this.emitAll('users', n);
	return this;
};

Client.prototype.answerUpdate = function(n) {
	this.emitAll('answers', n);
	return this;
};

Array.prototype.remove = function(e) {
	var i = this.indexOf(e);
	if (i != -1) {
		return this.splice(i, 1);
	}
	return this;
};

var userUpdate = function () {
	for (var i = 0; i < clients.length; i++) {
		clients[i].userUpdate(clients.length);
	}
};

var answerUpdate = function () {
	for (var i = 0; i < clients.length; i++) {
		clients[i].answerUpdate(questions[num].answers.length);
	}
};

var saveQuestion = function() {
	fs.writeFile('Q' + num + '.result', JSON.stringify(questions[num]));
};

var openQuestion = function(data) {
	if (num >= 0) {
		saveQuestion();
	}
	num = data.num;
	console.log('send: ' + JSON.stringify(questions[num]));
	for (var i = 0; i < clients.length; i++) {
		questions[num].answers = [];
		clients[i].emit('openQuestion', { "question" : questions[num], "timeout" : data.timeout });
	}	
};

var openPage = function(pageName, data) {
	if (num >= 0) {
		saveQuestion();		
	}
	for (var i = 0; i < clients.length; i++) {
		clients[i].emit(pageName, data);
	}		
};


//Listens on connections from clients

io.listen(server, { log: false }).on('connection', function (socket) {

	var client = new Client(socket);

	clients.push(client);

	console.log("connection: " + socket.id);

	socket.on('disconnect', function() {
		console.log('disconnect');
		clients.remove(client);
		userUpdate();
	});

	socket.on('logout', function() {
		console.log('logout');
		clients.remove(client);
		userUpdate();
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
		console.log('connected email: ', email);
		for (var i = 0; i < clients.length; i++) {
			if (email == clients[i].email) {
				socket.emit('email', false);
				console.log('invalid email: ', email);
				return;
			}
		}
		client.email = email;
		console.log('accepted email: ', email);
		socket.emit('email', true);
		userUpdate();
	});

	socket.on('results', function() {
		socket.emit('results', questions[num]);
	});

	socket.on('answer', function(data) {
		if (num >= 0 && num < questions.length) {
			questions[num].answers.push(data);
			answerUpdate();
		}
	});

	socket.on('questions', function() {
		socket.emit('questions', questions);
	});
});
