//
var pad = function(n) {
	return (n < 10) ? ("0" + n) : n;
};

var isEmpty = function(s) {
	return (s == undefined) || (s == null) || (s == '');
};


var Mento = (function() {
	
	var mentoWS = null;
		
	//
	function connect() {
		var href = $(location).attr('href');
		if (mentoWS) {
			mentoWS.send('logout');
		}
		mentoWS = WSocket(href.substring(0, href.lastIndexOf('/')));
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
		mentoWS.send("questions");
		mentoWS.listen('questions', function(data) {
			callback(data);
		});
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
		
		openWelcomePage : function(callback) {
			mentoWS.listen('openWelcomePage', callback);
		},
		
		openToplistPage : function(callback) {
			mentoWS.listen('openToplistPage', callback);	
		},

		showResults : function(callback) {
			mentoWS.listen('results', callback);	
		},
				
		toQuestion : function(data) {
			toQuestion(data);
		},
		
		login : function(email, callback) {
			login(email, callback);
		},
		
		send : function(cmd, data) {
			mentoWS.send(cmd, data);
		},
		
		openHandler : function(callback) {
			mentoWS.listen('openQuestion', callback);
		},
		
		userUpdateHandler : function(callback) {
			mentoWS.listen('users', callback);
		},
		
		answerUpdateHandler : function(callback) {
			mentoWS.listen('answers', callback);
		},
		
		loginHandler : function(callback) {
			mentoWS.listen('email', callback);
		}	
		
	};
}());
