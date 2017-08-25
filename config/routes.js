module.exports = function(app) {
	app.post('/users', function(request, response) {
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
};

