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
