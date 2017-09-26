var crypto = require('crypto');

var sessions = require('../services/sessions');
var users = require('../services/users');

var Session = require('../models/Session');
var Game = require('../models/Game');

module.exports = function(app) {
	app.get('/', function(request, response) {
		var data = {};

		Game.find({}).sort({ startTime: 1 }).populate('awayTeam').populate('homeTeam').exec(function(error, games) {
			if (error) {
				response.send(error);
			}
			else {
				data.games = games;

				if (request.cookies.sessionId) {
					Session.find({
						_id: request.cookies.sessionId
					}, function(error, sessions) {
						if (error) {
							response.send(error);
						}
						else if (sessions.length == 1) {
							data.session = sessions[0];
							response.render('index', data);
						}
						else {
							response.render('index', data);
						}
					});
				}
				else {
					response.render('index', data);
				}
			}
		});
	});

	app.post('/sessions', sessions.logIn);
	app.post('/users', users.signUp);
	app.get('/users/add', users.add);
};
