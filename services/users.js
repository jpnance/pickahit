var crypto = require('crypto');

var Session = require('../models/Session');
var User = require('../models/User');

module.exports.add = function(request, response) {
	Session.withActiveSession(request, function(error, session) {
		if (session && session.user.username == 'jpnance') {
			response.render('users/add');
		}
		else {
			response.redirect('/');
		}
	});
};

module.exports.edit = function(request, response) {
	Session.withActiveSession(request, function(error, session) {
		if (session && (request.params.userId == session.user._id || session.user.username == 'jpnance')) {
			User.findById(request.params.userId).exec(function(error, user) {
				var responseData = {
					user: user,
					session: session
				};

				if (error) {
					response.send(error);
				}

				response.render('users/edit', responseData);
			});
		}
		else {
			response.redirect('/');
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
			firstName: request.body.firstName,
			lastName: request.body.lastName,
			displayName: request.body.displayName,
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

module.exports.update = function(request, response) {
	var data = [
		User.findById(request.params.userId)
	];

	Promise.all(data).then(function(values) {
		var user = values[0];

		user.firstName = request.body.firstName;
		user.lastName = request.body.lastName;
		user.displayName = request.body.displayName;

		user.save(function(error) {
			if (error) {
				response.send(error);
			}
			else {
				response.redirect('/');
			}
		});
	});
};
