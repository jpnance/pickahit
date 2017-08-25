var express = require('express');
var bodyParser = require('body-parser');
var app = express();

app.use(bodyParser.json());
require('./config/routes')(app);

process.env.PORT = process.env.PORT || 3333;
app.listen(process.env.PORT);

module.exports = app;
