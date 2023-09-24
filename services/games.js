var Session = require('../models/Session');
var User = require('../models/User');
var Game = require('../models/Game');
var Player = require('../models/Player');

var dateFormat = require('dateformat');

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
				.sort({ username: 1 }),

			Game
				.find({ season: process.env.SEASON })
				.sort({ startTime: 1 })
				.populate('away.team')
				.populate('home.team')
				.populate('picks.user')
				.populate('picks.player')
				.populate('hits.player')
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

			if (request.query.error) {
				responseData.error = request.query.error;
			}
			else if (request.query.success) {
				responseData.success = request.query.success;
			}

			response.render('legacy', responseData);
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

module.exports.showAllForDate = function(request, response) {
	Session.withActiveSession(request, function(error, session) {
		var dateTimeString;

		if (!request.params.date) {
			var now = new Date();
			now.setHours(0);
			now.setMinutes(0);
			now.setSeconds(0);

			dateTimeString = dateFormat(now, 'yyyy-mm-dd HH:MM:ss');
		}
		else {
			dateTimeString = dateFormat(new Date(`${request.params.date} 00:00:00`), 'yyyy-mm-dd HH:MM:ss');
		}

		if (dateTimeString < process.env.POSTSEASON_START_TIME) {
			dateTimeString = process.env.POSTSEASON_START_TIME // 2023-10-15 00:00:00;
		}

		if (dateTimeString > process.env.POSTSEASON_END_TIME) {
			dateTimeString = process.env.POSTSEASON_END_TIME // 2023-10-15 00:00:00;
		}

		var today = new Date(dateTimeString);

		var tomorrow = new Date(dateTimeString);
		tomorrow.setTime(tomorrow.getTime() + (24 * 60 * 60 * 1000));

		var yesterday = new Date(dateTimeString);
		yesterday.setTime(yesterday.getTime() - (24 * 60 * 60 * 1000));

		var data = [
			User
				.find({})
				.sort({ username: 1 }),

			Game
				.find({
					season: process.env.SEASON,
					startTime: {
						'$gte': dateFormat(today, 'isoUtcDateTime'),
						'$lt': dateFormat(tomorrow, 'isoUtcDateTime')
					}
				})
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
				yesterday: yesterday,
				today: today,
				tomorrow: tomorrow,
				dateFormat: require('dateformat')
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

			if (request.query.error) {
				responseData.error = request.query.error;
			}
			else if (request.query.success) {
				responseData.success = request.query.success;
			}

			response.render('index', responseData);
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
