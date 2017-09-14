var crypto = require('crypto');

var sessions = require('../services/sessions');
var users = require('../services/users');

module.exports = function(app) {
	app.get('/', function(request, response) {
		if (request.cookies.sessionId) {
			response.send(request.cookies.sessionId);
		}
		else {
			response.send('no active session');
		}
	});

	app.post('/sessions', sessions.logIn);
	app.post('/users', users.signUp);
};
