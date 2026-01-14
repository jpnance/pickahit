var User = require('../models/User');
var Game = require('../models/Game');
var Player = require('../models/Player');

module.exports.showStandings = function(request, response) {
	var session = request.session;

	var data = [
		User
			.find({})
			.sort({ username: 1 }),

		Game
			.find({ season: process.env.SEASON })
			.sort({ startTime: 1 })
			.populate('away.team')
			.populate('home.team')
			.populate('picks.user')
			.populate('picks.player')
			.populate('hits.player')
			.populate('away.probablePitcher')
			.populate('home.probablePitcher')
	];

	Promise.all(data).then(function(values) {
		var responseData = {
			session: session,
			users: values[0].filter(function(user) {
				return user.isEligibleFor(process.env.SEASON);
			}),
			games: values[1]
		};

		var userScores = {};
		var userTiebreakers = {};

		responseData.games.forEach(function(game) {
			if (!game.picks) {
				return;
			}

			game.mappedPicks = {};

			game.picks.forEach(function(pick) {
				if (!userScores[pick.user._id]) {
					userScores[pick.user._id] = 0;
				}

				if (!userTiebreakers[pick.user._id]) {
					userTiebreakers[pick.user._id] = 0;
				}

				var playerHits = game.hits.find(playerHits => { return playerHits.player._id == pick.player._id; });

				if (playerHits) {
					userScores[pick.user._id] += game.points;
					userTiebreakers[pick.user._id] += playerHits.hits;
				}

				game.mappedPicks[pick.user._id] = pick.player;

				game.flatHits = game.hits.map(playerHits => { return playerHits.player._id });
			});
		});

		responseData.users.forEach(function(user) {
			if (userScores[user._id]) {
				user.score = userScores[user._id];
			}
			else {
				user.score = 0;
			}

			if (userTiebreakers[user._id]) {
				user.tiebreaker = userTiebreakers[user._id];
			}
			else {
				user.tiebreaker = 0;
			}

		});

		responseData.users = responseData.users.sort(function(a, b) {
			if (a.score < b.score) {
				return 1;
			}
			else if (a.score > b.score) {
				return -1;
			}
			else {
				if (a.tiebreaker < b.tiebreaker) {
					return 1;
				}
				else if (a.tiebreaker > b.tiebreaker) {
					return -1;
				}
				else {
					var aName = a.firstName + a.lastName;
					var bName = b.firstName + b.lastName;

					if (aName < bName) {
						return -1;
					}
					else if (aName > bName) {
						return 1;
					}

					return 0;
				}
			}
		});

		for (var i = 0; i < responseData.users.length; i++) {
			if (i == 0) {
				responseData.users[i].rank = 1;
			}
			else if (responseData.users[i].score != responseData.users[i - 1].score || responseData.users[i].tiebreaker != responseData.users[i - 1].tiebreaker) {
				responseData.users[i].rank = i + 1;
			}
		}

		if (request.query.error) {
			responseData.error = request.query.error;
		}
		else if (request.query.success) {
			responseData.success = request.query.success;
		}

		response.render('standings', responseData);
	});
};
