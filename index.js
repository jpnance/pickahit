var express = require('express');
var bodyParser = require('body-parser');
var app = express();

app.use(bodyParser.json());

process.env.PORT = process.env.PORT || 3333;

app.post('/user', function(request, response) {
	if (request.body.username && !request.body.password) {
		response.status(400).send('No password supplied');
	}
	else {
		response.status(400).send('No data supplied');
	}
});

app.listen(process.env.PORT);

module.exports = app;
