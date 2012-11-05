//
//
var pad = function(n) {
	return (n < 10) ? ("0" + n) : n;
};

var isEmpty = function(s) {
	return (s == undefined) || (s == null) || (s == '');
};

var btnClass = [ 'btn-primary', 'btn-danger', 'btn-warning', 'btn-success' ];

var Mento = (function() {
	
	var mentoWS = null;
		
	//
	function connect() {
		var href = $(location).attr('href');
		mentoWS = WSocket(href.substring(0, href.lastIndexOf('/')));


		mentoWS.listen('openWelcomePage', function() {
			console.log('openWelcomePage');
			$('#quiz').slideUp('fast');
			$('#welcome').removeClass('hide');
			$('#num-answers').addClass('hide');
		});


		
		mentoWS.listen('openToplistPage', function(data) {
			$('#chart').empty();
			
			var count = [];
			$.each(data, function(n, question) {
				console.log(JSON.stringify(question));
				if (question.answer > -1) {
					$.each(question.answers, function(i, answer) {
						console.log(JSON.stringify(answer));
						var inc = (answer.option == question.answer) ? 1 : 0;
						count[answer.name] = (count[answer.name] == undefined) ? inc : count[answer.name]+inc;
					});
				}
			});
			
			var sortedCount = [];
			
			var i = 0;
			for (x in count) {
				sortedCount[i++] = { "name": x, "count": count[x] };
			}
			count = null;
			
			sortedCount.sort(function(a, b) {
				return (a.count == b.count) ? 0 : (b.count - a.count);
			});
			
			var dataArray = [];
			dataArray.push(['Deltagare', 'Antal']);
			for (var n = 0; n < sortedCount.length && n < 10; n++) {
				dataArray.push([sortedCount[n].name, sortedCount[n].count]);
			}
					
			var table = google.visualization.arrayToDataTable(dataArray);
			
			var options = {
					backgroundColor : { "fill": 'transparent' },
					vAxis: { "title": 'Deltagare' },
					hAxis: { "title": 'Antal', "format": '##', "gridlines" : { "count" : 3 } }
			};

			$('#question').text('Topp 10 lista');
			
			if (!$('#welcome').hasClass('hide')) {
				$('#welcome').addClass('hide');
			}			
			$('#option').slideUp(1000);
			$('#quiz').slideDown(1000).fadeIn(1000);
			$('#chart').fadeIn(1000).slideDown(1000, function() {
				var chart = new google.visualization.BarChart($('#chart').get()[0]);
				chart.draw(table, options);				
			});
		});

		//
		mentoWS.listen('results', function(data) {
			$('#chart').empty();

			var count = [];
			
			// set result counters to zero
			$.each(data.options, function(i, option) {
				count[i] = 0;
			});
			
			// sum the results
			$.each(data.answers, function(i, answer) {
				count[answer.option]++;
			});
			
			var array = [];
			array[0] = ['Option', 'Votes' ];
			$.each(data.options, function(i, option) {
				var text = (i+1) + '. ' + option;
				if (data.answer >= 0 && data.answer == i) {
					text += " *";
				}
				array[i+1] = [ text, count[i] ];
			});
			
			var table = google.visualization.arrayToDataTable(array);

			var options = {
					chartArea : {left:10,top:0,width:"100%",height:"100%"},
					is3D : true,
					backgroundColor : { fill:'transparent' },
					pieSliceText : 'value'
			};

			$('#option').slideUp(1000);
			$('#quiz').slideDown(1000).fadeIn(1000);
			$('#chart').fadeIn(1000).slideDown(1000, function() {
				var chart = new google.visualization.PieChart($('#chart').get()[0]);
				chart.draw(table, options);				
			});	

		});
		

	}
	
	function login(email, callback) {
		if (mentoWS && !isEmpty(email)) {
			var regex = /^([a-zA-Z0-9_\.\-\+])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
			if (!regex.test(email)) {
				console.log("email invalid: ", email);
				callback(false);
				return;
			}
			mentoWS.send('email', email);
			mentoWS.listen('email', callback);
		} else {
			callback(false);
		}
	}
	
	function questions(callback) {
		if (mentoWS) {
			mentoWS.send("questions");
			//
			mentoWS.listen('questions', function(data) {
				callback(data);
			});
		}
	}
	
	function openWelcomePage() {
		if (mentoWS) {
			mentoWS.send('openWelcomePage');
		}
	}
	
	function openToplistPage() {
		if (mentoWS) {
			mentoWS.send('openToplistPage');
		}
	}
		

	function toQuestion(data) {
		if (mentoWS) {
			mentoWS.send('openQuestion', data);
		}
	}


	return {
		ready: function() {
			connect();

//			document.addEventListener('keypress', function(e) {
//				console.log(e.keyCode);
//				switch(e.keyCode){
//				case 100 /* d */:
//					break;
//				}
//			});
		},
			
		questions : function(callback) {
			questions(callback);
		},
		
		openWelcomePage : function() {
			openWelcomePage();
		},
		
		openToplistPage : function() {
			openToplistPage();
		},
				
		toQuestion : function(data) {
			toQuestion(data);
		},
		
		login : function(email, callback) {
			login(email, callback);
		},
		
		send : function(cmd, data) {
			if (mentoWS) {
				mentoWS.send(cmd, data);
			}
		},
		
		openHandler : function(callback) {
			if (mentoWS) {
				mentoWS.listen('openQuestion', callback);
			}
		},
		
		userUpdateHandler : function(callback) {
			if (mentoWS) {
				mentoWS.listen('users', callback);
			}
		},
		
		answerUpdateHandler : function(callback) {
			if (mentoWS) {
				mentoWS.listen('answers', callback);
			}
		},
		
		
	};
}());
