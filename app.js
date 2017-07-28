var http = require('http');
var express = require('express');
var app = express();
var server = http.createServer(app);
var bodyParser = require('body-parser');


// all environments

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded


//declare all the routes for all the logic to
//to applied for this app
require('./routes/post.js')(app);

server.listen(process.env.PORT || 5000);
console.log('Listening at 127.0.0.1:' + 5000);

process.on('uncaughtException', function (err) {
    if (err) {
        console.error(err);
        process.exit(1);
    }
})