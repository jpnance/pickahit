var Session = require('../models/Session');
var User = require('../models/User');
var Game = require('../models/Game');
var Player = require('../models/Player');
var Team = require('../models/Team');

module.exports.showPicksForUser = function(request, response) {
	Session.withActiveSession(request, function(error, session) {
		var username = request.params.username || session.user.username;

		var data = [
			User.findOne({ username: username }),
			Game
				.find({ season: process.env.SEASON })
				.sort({ startTime: 1 })
				.populate('away.team')
				.populate('home.team')
				.populate('picks.user')
				.populate('picks.player')
				.populate('hits.player'),
			Team.find({})
		];

		Promise.all(data).then(function(values) {
			var responseData = {
				user: values[0],
				gamePicks: [],
				teams: values[2],
			};

			var games = values[1];

			responseData.gamePicks =
				games
					.filter(function(game) {
						return game.hasStarted();
					})
					.map(function(game) {
						var correct = false;

						var pick = game.picks.find(function(pick) {
							return pick.user._id.toString() == responseData.user._id.toString();
						});

						if (!pick) {
							correct = false;
						}
						else {
							var hit = game.hits.find(function(hit) {
								return hit.player._id == pick.player._id;
							});

							if (hit) {
								correct = true;
							}
							else {
								correct = false;
							}
						}

						return { game, pick, correct };
					});

			responseData.mappedTeams =
				responseData.teams
					.reduce(function(mappedTeams, team) {
						return { ...mappedTeams, [team._id]: team };
					}, {});

			response.render('picks', responseData);
		});
	});
}
