var express = require('express');
var bodyParser = require('body-parser');
var app = express();

app.use(bodyParser.json());

process.env.PORT = process.env.PORT || 3333;

app.post('/user', function(request, response) {
	if (!request.body.username && !request.body.password) {
		response.status(400).send('No data supplied');
	}
	else if (!request.body.username) {
		response.status(400).send('No username supplied');
	}
	else if (!request.body.password) {
		response.status(400).send('No password supplied');
	}
	else {
		response.send({
			username: request.body.username,
			password: request.body.password
		});
	}
});

app.listen(process.env.PORT);

module.exports = app;
