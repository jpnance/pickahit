var dotenv = require('dotenv').config();

var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static('public'));

app.set('view engine', 'pug');

require('./config/routes')(app);

var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });

if (process.env.NODE_ENV == 'dev') {
	var fs = require('fs');
	var https = require('https');

	var options = {
		key: fs.readFileSync('../ssl/server.key'),
		cert: fs.readFileSync('../ssl/server.crt'),
		requestCert: false
	};

	var server = https.createServer(options, app);

	server.listen(process.env.PORT, function() { console.log('https, listening on port ' + process.env.PORT) });
}
else {
	app.listen(process.env.PORT, function() { console.log('http, listening on port ' + process.env.PORT) });
}

module.exports = app;
