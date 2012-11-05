Mento
=====

Node.js server for quiz, and voting during Live presentations (and seminars).

Clients are assumed to be mobile phones, and a Web application displays results of votings etc on a big screen.

Prerequisite: node.js is installed

# Install required package (once)

<code>
$ npm install socket.io
</code>

# Edit questions

Check file questions.json

An json array of questions objects, each with the following attributes:
<pre>
"question" : String, The question to ask
"options"  : Array of Strings, max 4 is assumed
"answer"   : Int, -1 for polls, otherwise the right answer as slot in the array above (0-4) 
"answers"  : Empty array, a placeholder for the server to store answer objects
</pre>

# Start server

<code>
$ node mento-server.js
</code>

Vote app, open browser and navigate to http://<server>:8080
Control app, naviagte to http://<server>:8080/mento-coontrol.html

