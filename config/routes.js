var crypto = require('crypto');

var users = require('../services/users');
var schedule = require('../services/schedule');
var games = require('../services/games');
var standings = require('../services/standings');
var picks = require('../services/picks');
var override = require('../services/override');

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

function scheduleForParam(request, response) {
	if (/^\d{4}-\d{2}-\d{2}$/.test(request.params.param)) {
		request.params.date = request.params.param;
		schedule.showAllForDate(request, response);
		return;
	}

	request.params.teamAbbreviation = request.params.param;
	schedule.showAllForTeam(request, response);
}

module.exports = function(app) {
	app.get('/', schedule.showAllForDate);
	app.get('/schedule/debug', schedule.debug);
	app.get('/schedule/:param', scheduleForParam);

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
		response.render('rules', { session: request.session });
	});

	app.get('/bigboard', schedule.showAll);
};
