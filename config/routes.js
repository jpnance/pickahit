var crypto = require('crypto');

var users = require('../services/users');
var games = require('../services/games');
var override = require('../services/override');

var Session = require('../models/Session');

var preview = {
	crossroads: function(request, response) {
		if (request.cookies.preview) {
			games.showAll(request, response);
		}
		else {
			response.render('verifier');
		}
	},

	disablePreview: function(request, response) {
		response.clearCookie('preview').redirect('/');
	},

	enablePreview: function(request, response) {
		response.cookie('preview', true).redirect('/');
	}
};

module.exports = function(app) {
	app.get('/', games.showAll);

	app.get('/login', users.loginPrompt);

	app.get('/users', users.showAll);
	app.get('/users/add', users.add);
	app.post('/users/add', users.signUp);
	app.get('/users/edit/:username', users.edit);
	app.post('/users/edit/:username', users.update);

	app.get('/games/:gameId', games.showOne);
	app.post('/games/pick/:gameId/:playerId', games.pick);
	app.post('/games/unpick/:gameId/:playerId', games.unpick);

	app.get('/override/pick/:username/:gameId/:playerId', override.pick);

	app.get('/rules', function(request, response) {
		Session.withActiveSession(request, function(error, session) {
			response.render('rules', { session: session });
		});
	});
};
