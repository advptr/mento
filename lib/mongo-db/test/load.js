// simple test script
var Db = require('../index.js'),
fs = require('fs'),
file = 'questions.json',
test = require('tap').test;

var db = Db('cadec-quiz-2013-test');

test('load', function(t) {
	db.open(function(err) {
		t.error(err);
		db.cleanQuestions(function(err, name) {
			t.error(err);
			var questions = JSON.parse(fs.readFileSync(file, 'utf8'));
			db.saveQuestions(questions, function(err) {
				t.error(err);
				db.cleanParticipant(function(err) {
					t.error(err);
				});

				db.saveParticipant({ email : 'peter.larsson@callistaenterprise.se', answers : [] }, function(err, participant) {
					t.error(err);
					t.same(participant.email, 'peter.larsson@callistaenterprise.se');
				});

				db.findParticipant('peter.larsson@callistaenterprise.se', function(err, docs) {
					t.error(err);
					t.ok(docs != null);
				});

				db.findQuestions(function(err, docs) {
					t.same(11, docs.length);
					db.close(function(err) { 
						t.error(err);
						t.end(); 
					});
				});
			});
		});
	});
});
