var crypto = require('crypto');

var Session = require('../models/Session');
var User = require('../models/User');

module.exports.add = function(request, response) {
	var responseData = {};

	if (request.cookies.sessionId) {
		Session.find({
			_id: request.cookies.sessionId
		}, function(error, sessions) {
			if (error) {
				response.send(error);
			}
			else if (sessions.length == 1) {
				responseData.session = sessions[0];
				response.render('users/add', responseData);
			}
			else {
				response.render('users/add', responseData);
			}
		});
	}
};

module.exports.edit = function(request, response) {
	var data = [
		User.findById(request.params.userId)
	];

	Promise.all(data).then(function(values) {
		var responseData = {
			user: values[0]
		};

		if (request.cookies.sessionId) {
			Session.find({
				_id: request.cookies.sessionId
			}, function(error, sessions) {
				if (error) {
					response.send(error);
				}
				else if (sessions.length == 1) {
					responseData.session = sessions[0];
					response.render('users/edit', responseData);
				}
				else {
					response.redirect('/');
				}
			});
		}
	});
};

module.exports.showAll = function(request, response) {
	User.find({}).sort({ username: 1 }).then(function(users) {
		response.render('users', { users: users });
	});
};

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
