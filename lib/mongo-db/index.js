//
var mongo = require('mongodb'),
	C_QUESTIONS = 'question',
	C_PARTICIPANT = 'participant';

exports = module.exports = createDb;

//
function createDb(name) {
	var self = this;

	self.client = new mongo.Db(name, 
		new mongo.Server('localhost', mongo.Connection.DEFAULT_PORT, {auto_reconnect: true, poolSize: 1, ssl: false}), {w: 0});

	//
	self.open = function(callback) {
		self.client.open(function(err, db) {
			callback(err);
		});
	}

	//
	self.close = function(callback) {
		self.client.close();
		callback();
	}

	//
	var save = function(name, docs, callback) {
		self.client.collection(name, function(err, collection) {
			if (err) {
				callback(err);
			} else {
				collection.save(docs, function(err) {
					callback(err, docs);
				});
			}
		});
	}

	//
	var remove = function(name, callback) {
		self.client.collection(name, function(err, collection) {
			if (err) {
				callback(err);
			} else {
				collection.remove(function(err) {
					callback(err, name);
				});
			}
		});		
	}

	//
	var find = function(name, query, callback) {
		self.client.collection(name, function(err, collection) {
			if (err) {
				callback(err);
			} else {
				collection.find(query).toArray(function(err, docs) {
					callback(err, docs);
				});
			}
		});		
	}

	//
	var findOne = function(name, query, callback) {
		self.client.collection(name, function(err, collection) {
			if (err) {
				callback(err);
			} else {
				collection.findOne(query, function(err, object) {
					callback(err, object);
				});
			}
		});		
	}

	//
	self.cleanQuestions = function(callback) {
		remove(C_QUESTIONS, callback);
	}

	//
	self.cleanParticipant = function(callback) {
		remove(C_PARTICIPANT, callback);
	}

	//
	self.findQuestions = function(callback) {
		find(C_QUESTIONS, null, callback);
	}

	//
	self.saveQuestions = function(questions, callback) {
		save(C_QUESTIONS, questions, callback);
	}

	//
	self.saveParticipant = function(participant, callback) {
		save(C_PARTICIPANT, participant, callback);
	}

	//
	self.findParticipants = function(callback) {
		find(C_PARTICIPANT, null, callback);
	}

	//
	self.findParticipant = function(email, callback) {
		findOne(C_PARTICIPANT, { email : email }, callback);
	}


	return self;
}