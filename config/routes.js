var crypto = require('crypto');

var users = require('../services/users');
var schedule = require('../services/schedule');
var games = require('../services/games');
var standings = require('../services/standings');
var picks = require('../services/picks');
var override = require('../services/override');

var Session = require('../models/Session');

var preview = {
	crossroads: function(request, response) {
		if (request.cookies.preview) {
			schedule.showAll(request, response);
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
	app.get('/', schedule.showAllForDate);
	app.get('/schedule/debug', schedule.debug);
	app.get('/schedule/:date(\\d\\d\\d\\d-\\d\\d-\\d\\d)', schedule.showAllForDate);
	app.get('/schedule/:teamAbbreviation(\\w+)', schedule.showAllForTeam);

	app.get('/standings', standings.showStandings);

	app.get('/picks', picks.showPicksForUser);
	app.get('/picks/:username', picks.showPicksForUser);

	app.get('/login', users.loginPrompt);

	app.get('/users', users.showAll);
	app.get('/users/add', users.add);
	app.post('/users/add', users.signUp);
	app.get('/users/edit/:username', users.edit);
	app.post('/users/edit/:username', users.update);

	app.get('/games/:gameId', games.showOne);
	app.post('/games/pick/:gameId/:playerId', games.pick);

	app.get('/override/pick/:username/:gameId/:playerId', override.pick);

	app.get('/rules', function(request, response) {
		Session.withActiveSession(request, function(error, session) {
			response.render('rules', { session: session });
		});
	});

	app.get('/bigboard', schedule.showAll);
};
