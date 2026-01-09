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
				Game.findOneAndUpdate({ _id: gameId, 'picks.user': session.user._id }, { '$set': { 'picks.$.player': player._id } }, { returnDocument: 'after' })
					.then(function(game) {
						if (!game) {
							return Game.findOneAndUpdate({ _id: gameId }, { '$push': { picks: { user: session.user._id, player: playerId } } }, { returnDocument: 'after' });
						}
						return game;
					})
					.then(function(game) {
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
				.populate({
					path: 'away.batters',
					match: { active: true }
				})
				.populate({
					path: 'home.batters',
					match: { active: true }
				})
				.populate('away.pitchers')
				.populate('home.pitchers')
				.populate('away.probablePitcher')
				.populate('home.probablePitcher')
				.populate('away.startingLineup')
				.populate('home.startingLineup')
				.populate('hits.player')
				.populate({ path: 'picks.user' })
				.populate('picks.player'),

			Game.find({ season: process.env.SEASON, picks: { '$elemMatch': { user: session.user._id } }})
		];

		Promise.all(data).then(function(values) {
			var responseData = {
				success: true,
				game: values[0],
				alreadyPicked: [],
				teamPlayerPicks: {}
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

			['away', 'home'].forEach(function(side) {
				responseData.teamPlayerPicks[side] = [];

				responseData.game.picks.forEach(function(pick) {
					if (pick.player.team == responseData.game[side].team._id) {
						var playerPicks = responseData.teamPlayerPicks[side].find(function(playerPick) {
							return playerPick.player._id == pick.player._id;
						});

						if (!playerPicks) {
							playerPicks = {
								player: pick.player,
								users: []
							};

							responseData.teamPlayerPicks[side].push(playerPicks);
						}

						playerPicks.users.push(`${pick.user.firstName} ${pick.user.lastName}`);
					}
				});

				responseData.teamPlayerPicks[side].forEach(function(playerPick) {
					playerPick.users.sort(function(a, b) {
						return a.localeCompare(b);
					});
				});

				responseData.teamPlayerPicks[side].sort(function(a, b) {
					return a.player.name.localeCompare(b.player.name);
				});

				responseData.teamPlayerPicks[side].forEach(function(playerPicks) {
					if (responseData.game.hits.find(function(hit) {
						return hit.player._id == playerPicks.player._id;
					})) {
						playerPicks.correct = true;
					}
					else {
						playerPicks.correct = false;
					}
				});
			});

			if (!responseData.game.hasStarted()) {
				response.render('game/not-started', responseData);
			}
			else {
				response.render('game/started', responseData);
			}
		});
	});
};

module.exports.test = function(request, response) {
	var data = [
		Game
			.findById(715719)
			.populate('away.team')
			.populate('home.team')
			.populate({ path: 'picks.user' })
			.populate('picks.player')
			.populate('away.probablePitcher')
			.populate('home.probablePitcher')
			.populate('hits.player')
	];

	Promise.all(data).then(function(values) {
		var game = values[0].toObject();

		var userScores = {};
		var userTiebreakers = {};

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
		});

		response.render('test', { game: game });
	});
};
