    //   
    exports = module.exports = createClient;

    function createClient(socket) {
        var client = new Client(socket);
        return client;
    }


    // client object
    var Client = function(socket) {
        this.socket = socket;
        this.email = null;
        this.answers = [];

        this.setEmail = function(email) {
            this.email = email;
            return this;
        }

        this.answer = function(num, correct) {
            this.answers[num] = correct;
            console.log('answer %d is %s', num, correct);
        }

        this.result = function(total) {
            var correct = 0;
            for (var x in this.answers) {
                if (this.answers[x] === true) {
                    correct++;
                }
            }
            return { total : total, correct : correct };
        }

        this.getEmail = function() {
            return this.email;
        }

        this.emit = function(cmd, object) {
        	if (this.email != null) {
               this.socket.emit(cmd, object);
           }
           return this;
       }

       this.emitAll = function(cmd, object) {
           this.socket.emit(cmd, object);
           this.socket.broadcast.emit(cmd, object);	
           return this;
       }
   }



