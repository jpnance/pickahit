var crypto = require('crypto');

var sessions = require('../services/sessions');
var users = require('../services/users');
var games = require('../services/games');

module.exports = function(app) {
	app.get('/', games.showAll);

	app.post('/sessions', sessions.logIn);
	app.get('/logout', sessions.logOut);

	app.get('/users', users.showAll);
	app.post('/users', users.signUp);
	app.get('/users/add', users.add);
	app.get('/users/edit/:userId', users.edit);
	app.post('/users/edit/:userId', users.update);
};
