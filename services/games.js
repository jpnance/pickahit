var Session = require('../models/Session');
var User = require('../models/User');
var Game = require('../models/Game');
var Player = require('../models/Player');

module.exports.pick = function(request, response) {
	Session.withActiveSession(request, function(error, session) {
		if (error || !session || !request.params.gameId || !request.params.playerId) {
			response.send({ success: false, redirect: '/' });
			return;
		}

		var userId = session.user._id;
		var gameId = parseInt(request.params.gameId);
		var playerId = parseInt(request.params.playerId);

		var data = [
			Game.findById(gameId),
			Player.findById(playerId),
			Game.find({ season: process.env.SEASON, picks: { '$elemMatch': { user: session.user._id, player: playerId } } })
		];

		Promise.all(data).then(function(values) {
			var game = values[0];
			var player = values[1];
			var collision = values[2];

			if (collision.length > 0) {
				response.send({ success: false, error: player.name + ' has already been picked by ' + session.user.username });
			}
			else if (game && !game.hasStarted() && (game.away.batters.indexOf(playerId) != -1 || game.home.batters.indexOf(playerId) != -1) && player) {
				console.log('pick', session.user._id, game._id, player._id);
				Game.findOneAndUpdate({ _id: gameId, 'picks.user': session.user._id }, { '$set': { 'picks.$.player': player._id } }).exec(function(error, game) {
					if (!game) {
						Game.findOneAndUpdate({ _id: gameId }, { '$push': { picks: { user: session.user._id, player: playerId } } }).exec(function(error, game) {
							if (!error) {
								response.send({ success: true, player: player });
							}
						});
					}
					else if (!error) {
						response.send({ success: true, player: player });
					}
				});
			}
			else {
				response.send({ success: false, error: 'You are hacking. Please stop.' });
			}
		});
	});
};

module.exports.showAll = function(request, response) {
	Session.withActiveSession(request, function(error, session) {
		var data = [
			User
				.find({})
				.select('-password')
				.sort({ username: 1 }),

			Game
				.find({ season: process.env.SEASON })
				.sort({ startTime: 1 })
				.populate('away.team')
				.populate('home.team')
				.populate('picks.user')
				.populate('picks.player')
		];

		Promise.all(data).then(function(values) {
			var responseData = {
				session: session,
				users: values[0].filter(function(user) {
					return user.isEligibleFor(process.env.SEASON);
				}),
				games: values[1].sort(function(a, b) {
					if (a.isFinalAndCool() && !b.isFinalAndCool()) {
						return 1;
					}
					else if (!a.isFinalAndCool() && b.isFinalAndCool()) {
						return -1;
					}
					else {
						if (a.startTime < b.startTime) {
							return -1;
						}
						else if (a.startTime > b.startTime) {
							return 1;
						}
						else {
							if (a.away.team.teamName < b.away.team.teamName) {
								return -1;
							}
							else if (a.away.team.teamName > b.away.team.teamName) {
								return 1;
							}
							else {
								return 0;
							}
						}
					}
				}),
				dateFormat: require('dateformat')
			};

			var userScores = {};

			responseData.games.forEach(function(game) {
				if (!game.picks) {
					return;
				}

				game.mappedPicks = {};

				game.picks.forEach(function(pick) {
					if (!userScores[pick.user._id]) {
						userScores[pick.user._id] = 0;
					}

					if (game.hits.indexOf(pick.player._id) != -1) {
						userScores[pick.user._id] += game.points;
					}

					game.mappedPicks[pick.user._id] = pick.player;
				});
			});

			responseData.users.forEach(function(user) {
				if (userScores[user._id]) {
					user.score = userScores[user._id];
				}
				else {
					user.score = 0;
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
			});

			if (request.query.error) {
				responseData.error = request.query.error;
			}

			response.render('index', responseData);
		});
	});
};

module.exports.showOne = function(request, response) {
	Session.withActiveSession(request, function(error, session) {
		if (error || !session) {
			response.send({ success: false, redirect: '/' });
			return;
		}

		var data = [
			Game
				.findById(request.params.gameId)
				.populate('away.team')
				.populate('home.team')
				.populate('away.batters')
				.populate('home.batters')
				.populate('away.pitchers')
				.populate('home.pitchers')
				.populate('away.probablePitcher')
				.populate('home.probablePitcher')
				.populate('away.startingLineup')
				.populate('home.startingLineup')
				.populate('hits')
				.populate({
					path: 'picks.user',
					select: '-password'
				})
				.populate('picks.player'),

			Game.find({ season: process.env.SEASON, picks: { '$elemMatch': { user: session.user._id } }})
		];

		Promise.all(data).then(function(values) {
			var responseData = {
				success: true,
				game: values[0],
				alreadyPicked: []
			};

			var games = values[1];

			games.forEach(function(game) {
				if (!game.picks) {
					return;
				}

				game.picks.forEach(function(pick) {
					if (pick.user.toString() == session.user._id.toString()) {
						responseData.alreadyPicked.push(pick.player);
					}
				});
			});

			response.send(responseData);
		});
	});
};
