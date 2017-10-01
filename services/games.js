var Session = require('../models/Session');
var User = require('../models/User');
var Game = require('../models/Game');
var Player = require('../models/Player');

module.exports.pick = function(request, response) {
	Session.withActiveSession(request, function(error, session) {
		if (!request.params.gameId || !request.params.playerId) {
			response.redirect('/');
		}

		var userId = session.user._id;
		var gameId = parseInt(request.params.gameId);
		var playerId = parseInt(request.params.playerId);

		var data = [
			Game.findById(gameId),
			Player.findById(playerId),
			Game.find({ picks: { '$elemMatch': { user: session.user._id, player: playerId } } })
		];

		Promise.all(data).then(function(values) {
			var game = values[0];
			var player = values[1];
			var collision = values[2];

			if (collision.length > 0) {
				response.send({ success: false, error: new Error(player.name + ' has already been picked by ' + session.user.username) });
			}
			else if (game && !game.hasStarted() && player) {
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
				.find({})
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
					return user.isEligibleFor(2017);
				}),
				games: values[1],
				dateFormat: require('dateformat')
			};

			responseData.games.forEach(function(game) {
				if (!game.picks) {
					return;
				}

				game.mappedPicks = {};

				game.picks.forEach(function(pick) {
					game.mappedPicks[pick.user._id] = pick.player;
				});
			});

			response.render('index', responseData);
		});
	});
};

module.exports.showOne = function(request, response) {
	Session.withActiveSession(request, function(error, session) {
		if (error || !session) {
			response.redirect('/');
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
				.populate('hits')
				.populate('picks.user')
				.populate('picks.player'),

			Game.find({ picks: { '$elemMatch': { user: session.user._id } }})
		];

		Promise.all(data).then(function(values) {
			var responseData = {
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
