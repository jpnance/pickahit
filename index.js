var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static('public'));

app.set('view engine', 'pug');

require('./config/routes')(app);

var mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI);

process.env.PORT = process.env.PORT || 3333;
app.listen(process.env.PORT);

module.exports = app;
