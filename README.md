Mento
=====

Node.js server for quiz, and voting during Live presentations (and seminars).

Clients are assumed to be mobile phones, and a Web application displays results of votings etc on a big screen.

Requires: socket.io

Run
===

Prerequisite: node.js is installed

# Install required package (once)
$ npm install socket.io

# Edit questions

Check file questions.json

An json array of questions objects
{
"question" : "<The questiuon to ask>",
"options" : [ "<option-string1>", ..., "<option-string4>" ],
"answer" : <right-option (0-4)>,
"answers" : [<placeholder for all answers on the form: { "name": "<email>", "option": <0-4> }> ],
}
 

# Start server
$ node mento-server.js

Vote app, open browser and navigate to http://<server>:8080
Control app, naviagte to http://<server>:8080/mento-coontrol.html

