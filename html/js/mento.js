//
var pad = function(n) {
	return (n < 10) ? ("0" + n) : n;
};

var isEmpty = function(s) {
	return (s == undefined) || (s == null) || (s == '');
};

// HTML5 local store
var Store = (function() {
	var hasStorage = function() {
		return (window.localStorage === undefined) ? false : true;
	};
	var altStore = [];

	return {
		set : function(name, value) {
			if (hasStorage()) {
				window.localStorage.setItem(name, value);
			} else {
				altStore[name] = value; 
			}
		},

		get : function(name) {
			if (hasStorage()) {
				return window.localStorage.getItem(name);
			} else {
				var value = altStore[name];
				return (value === undefined) ? null : value;
			}
		},

		remove : function(name) {
			if (hasStorage()) {
				window.localStorage.removeItem(name);
			} else {
				altStore[name] = null;
			}
		},
	};
})();

// Quiz and Vote Events
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
		if (!isEmpty(email)) {
			var regex = /^([a-zA-Z0-9_\.\-\+])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
			if (!regex.test(email)) {
				console.log("email invalid: ", email);
				callback(false);
				return;
			}
			mentoWS.send('email', email);
			mentoWS.once('email', callback);
			console.log('server validation of email address');
		} else {
			console.log('empty email address');
			callback(false);
		}
	}
	
	function questions(callback) {
		mentoWS.send("questions");
		mentoWS.once('questions', function(data) {
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

		connected : function(callback) {
			mentoWS.listen('ack', callback);
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

		listen : function(cmd, callback) {
			mentoWS.listen(cmd, callback);
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

(function($){
     $.fn.extend({
         airport: function(array, callback) {

                        var self = $(this);
                        var chars = ['a','b','c','d','e','f','g',' ','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z','å','ä','ö','-','+','@','.'];
                        var longest = 0;
                        var items = items2 = array.length;

                        function pad(a,b) { return a + new Array(b - a.length + 1).join(' '); }

                        $(this).empty();

                        while(items--)
                                if(array[items].length > longest) longest = array[items].length;

                        while(items2--)
                                array[items2] = pad(array[items2],longest);

                        spans = longest;
                        while(spans--)
                                $(this).prepend("<span class='c" + spans + "'></span>");


                        function testChar(a,b,c,d, callback){
                                if(c >= array.length)
                                        callback();
                                else if(d >= longest)
                                        setTimeout(function() { testChar(0,0,c+1,0, callback); }, 1000);
                                else {
                                        $(self).find('.c'+a).html((chars[b]==" ")?"&nbsp;":chars[b]);
                                        setTimeout(function() {
                                                if(b > chars.length)
                                                        testChar(a+1,0,c,d+1, callback);
                                                else if(chars[b] != array[c].substring(d,d+1).toLowerCase())
                                                        testChar(a,b+1,c,d, callback);
                                                else
                                                        testChar(a+1,0,c,d+1, callback);
                                        }, 20);
                                }
                        }

                        testChar(0,0,0,0, callback);
        }
    });
})(jQuery);

