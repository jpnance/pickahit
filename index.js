var express = require('express');
var app = express();

process.env.PORT = process.env.PORT || 3333;

app.post('/user', function(request, response) {
	response.sendStatus(400);
});

app.listen(process.env.PORT);

module.exports = app;
