var crypto = require('crypto');

var sessions = require('../services/sessions');
var users = require('../services/users');
var games = require('../services/games');

module.exports = function(app) {
	app.get('/', games.showAll);

	app.post('/sessions', sessions.logIn);

	app.post('/users', users.signUp);
	app.get('/users/add', users.add);
};
