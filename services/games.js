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
			Player.findById(playerId)
		];

		Promise.all(data).then(function(values) {
			var game = values[0];
			var player = values[1];

			if (game && !game.hasStarted() && player) {
				game.makePick(userId, playerId);

				game.save(function(error) {
					if (!error) {
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
			User.find({}).sort({ username: 1 }),
			Game.find({}).sort({ startTime: 1 }).populate('away.team').populate('home.team')
		];

		Promise.all(data).then(function(values) {
			var responseData = {
				users: values[0].filter(function(user) {
					return user.isEligibleFor(2017);
				}),
				games: values[1],
				dateFormat: require('dateformat')
			};

			if (session) {
				responseData.session = session;
			}

			response.render('index', responseData);
		});
	});
};

module.exports.showOne = function(request, response) {
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
	];

	Promise.all(data).then(function(values) {
		var game = values[0];

		response.send(game);
	});
};
