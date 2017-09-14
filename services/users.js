var crypto = require('crypto');

var User = require('../models/User');

module.exports.signUp = function(request, response) {
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
		var user = new User({
			username: request.body.username,
			password: crypto.createHash('sha256').update(request.body.password).digest('hex')
		});

		user.save(function(error) {
			if (!error) {
				response.send(user);
			}
			else {
				response.status(400).send(error);
			}
		});
	}
};
