var crypto = require('crypto');

var sessions = require('../services/sessions');
var users = require('../services/users');
var games = require('../services/games');

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
	app.get('/', preview.crossroads);

	app.get('/preview', preview.enablePreview);
	app.get('/placeholder', preview.disablePreview);

	app.post('/sessions', sessions.logIn);
	app.post('/login', sessions.logIn);
	app.get('/logout', sessions.logOut);

	app.get('/users', users.showAll);
	app.post('/users', users.signUp);
	app.get('/users/add', users.add);
	app.get('/users/edit/:username', users.edit);
	app.post('/users/edit/:username', users.update);

	app.get('/games/:gameId', games.showOne);
};
