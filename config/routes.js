var crypto = require('crypto');

var sessions = require('../services/sessions');
var users = require('../services/users');

var Session = require('../models/Session');

module.exports = function(app) {
	app.get('/', function(request, response) {
		if (request.cookies.sessionId) {
			Session.find({
				_id: request.cookies.sessionId,
				expires: {
					$gte: Date.now()
				}
			}, function(error, documents) {
				if (error) {
					response.send(error);
				}
				else if (documents.length == 1) {
					response.render('index', { session: documents[0] });
				}
			});
		}
		else {
			response.render('index');
		}
	});

	app.post('/sessions', sessions.logIn);
	app.post('/users', users.signUp);
};
