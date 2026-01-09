var Session = require('../models/Session');
var User = require('../models/User');
var Game = require('../models/Game');
var Player = require('../models/Player');

module.exports.pick = function(request, response) {
	Session.withActiveSession(request, function(error, session) {
		if (error || !session || !session.user || !session.user.admin) {
			response.send({ success: false, redirect: '/' });
			return;
		}

		var username = request.params.username;
		var gameId = parseInt(request.params.gameId);
		var playerId = parseInt(request.params.playerId);

		var data = [
			User.findOne({ username: username }),
			Game.findById(gameId),
			Player.findById(playerId),
		];

		Promise.all(data).then(function(values) {
			var user = values[0];
			var game = values[1];
			var player = values[2];

		if (user && game && (game.away.batters.indexOf(player._id) != -1 || game.home.batters.indexOf(player._id) != -1) && player) {
			console.log('overridden pick', user._id, game._id, player._id);

			Game.findOneAndUpdate({ _id: game._id, 'picks.user': user._id }, { '$set': { 'picks.$.player': player._id } }, { returnDocument: 'after' })
				.then(function(updatedGame) {
					if (!updatedGame) {
						return Game.findOneAndUpdate({ _id: gameId }, { '$push': { picks: { user: user._id, player: player._id } } }, { returnDocument: 'after' });
					}
					return updatedGame;
				})
				.then(function(updatedGame) {
					response.send({ success: true, player: player });
				})
				.catch(function(error) {
					response.send({ success: false, error: error.message });
				});
		}
			else {
				response.send({ success: false, error: 'You are hacking. Please stop.' });
			}
		});
	});
};
