mento
=====

Node.js server for quiz, and voting during Live presentations (and seminars).

Clients are assumed to be mobile phones, and a Web application displays results of votings etc on a big screen.

Requires: socket.io

Run
===

Prerequisite: node.js is installed

# Install required package (once)
$ npm install socket.io

# edit questions.json

# Start server
$ node mento-server.js

Vote app, open browser and navigate to http://<server>:8080
Control app, naviagte to http://<server>:8080/mento-coontrol.html

