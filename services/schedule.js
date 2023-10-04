var Session = require('../models/Session');
var User = require('../models/User');
var Game = require('../models/Game');
var Team = require('../models/Team');

var dateFormat = require('dateformat');

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

			response.render('legacy/index', responseData);
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
					if (a.isFinal() && !b.isFinal()) {
						return 1;
					}
					else if (!a.isFinal() && b.isFinal()) {
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

			response.render('schedule/all', responseData);
		});
	});
};

module.exports.showAllForTeam = function(request, response) {
	Session.withActiveSession(request, function(error, session) {
		Team.findOne({ abbreviation: request.params.teamAbbreviation }, function(error, team) {
			if (error) {
				response.sendStatus(500);
				return;
			}

			if (!team || !team.isActualMlbTeam()) {
				response.sendStatus(404);
				return;
			}

			var data = [
				User
					.find({})
					.sort({ username: 1 }),

				Game
					.find({
						season: process.env.SEASON,
						'$or': [
							{ 'home.team': team._id },
							{ 'away.team': team._id }
						]
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
					games: values[1],
					team: team,
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

				response.render('schedule/team', responseData);
			});
		});
	});
};

module.exports.debug = function(request, response) {
	const phillies = {
		team: {
			_id: 143,
			name: 'Philadelphia Phillies',
			abbreviation: 'PHI',
			locationName: 'Philadelphia',
			teamName: 'Phillies',
			imageAbbreviation: () => 'phi',
			isActualMlbTeam: () => true
		},
		batters: [ 516416, 669016, 547180, 592663, 624641, 592206, 664761, 681082, 656941, 596117, 663837, 656495, 656555, 665155 ],
		pitchers: [ 621237, 554430, 641401, 592789, 622554, 621107, 624133, 571479, 605400, 663559, 543272, 502043, 502085, 656793 ],
		probablePitcher: {
			_id: 554430,
			team: 143,
			number: 45,
			name: 'Zack Wheeler',
			position: 'P',
			bats: 'L',
			throws: 'R',
			active: true
		},
		startingLineup: [ 656941, 656555, 592663, 547180, 592206, 664761, 516416, 663837, 624641 ]
	};

	const astros = {
		team: {
			_id: 143,
			name: 'Houston Astros',
			abbreviation: 'HOU',
			locationName: 'Houston',
			teamName: 'Astros',
			imageAbbreviation: () => 'hou',
			isActualMlbTeam: () => true
		},
		batters: [ 455117, 641820, 663656, 643289, 608324, 493329, 682073, 514888, 665161, 649557, 676801, 543877, 670541 ],
		pitchers: [ 664285, 650556, 593576, 606160, 686613, 661527, 592773, 621121, 664353, 664299, 519151, 677651, 434378, 519293 ],
		probablePitcher: {
			_id: 664285,
			bats: 'R',
			name: 'Framber Valdez',
			number: 59,
			position: 'P',
			team: 117,
			throws: 'L',
			active: true
		},
		startingLineup: [ 514888, 665161, 670541, 608324, 663656, 493329, 649557, 676801, 455117 ]
	};

	const fn = {
		echo: (value) => () => value,
	};

	Session.withActiveSession(request, function(error, session) {
		var game = {
			_id: 123456,
			season: 2022,
			startTime: new Date('2022-10-30T00:03:00.000Z'),
			away: { ...phillies },
			home: { ...astros },
			picks: [],
			hits: [],
			gameDescription: 'World Series Game 2',
			seriesDescription: 'World Series',
			seriesGameNumber: 2,
			gamesInSeries: 7,
			ifNecessary: 'N',
			points: 8,
			mappedPicks: {}
		};

		var patrick = {
			seasons: [ 2017, 2018, 2019, 2020, 2021, 2022 ],
			admin: true,
			_id: '59ba0e9009335a0004714e26',
			username: 'jpnance',
			__v: 6,
			displayName: 'Patrick',
			firstName: 'Patrick',
			lastName: 'Nance (\'14, \'22)'
		}

		var yordan = {
			_id: 670541,
			__v: 0,
			bats: 'L',
			name: 'Yordan Alvarez',
			number: 44,
			position: 'DH',
			team: 117,
			throws: 'R',
			active: true
        };

		var games = [
			{
				...game,
				status: 'S',
				hasStarted: fn.echo(false),
				isFinal: fn.echo(false)
			},
			{
				...game,
				status: 'S',
				picks: [ { user: patrick, player: yordan } ],
				hits: [],
				hasStarted: fn.echo(false),
				isFinal: fn.echo(false)
			},
			{
				...game,
				status: 'I',
				hasStarted: fn.echo(true),
				isFinal: fn.echo(false)
			},
			{
				...game,
				status: 'I',
				picks: [ { user: patrick, player: yordan } ],
				hits: [],
				hasStarted: fn.echo(true),
				isFinal: fn.echo(false)
			},
			{
				...game,
				status: 'I',
				picks: [ { user: patrick, player: yordan } ],
				hits: [ { player: yordan, hits: 1 } ],
				hasStarted: fn.echo(true),
				isFinal: fn.echo(false)
			},
			{
				...game,
				status: 'F',
				hasStarted: fn.echo(true),
				isFinal: fn.echo(true)
			},
			{
				...game,
				status: 'F',
				picks: [ { user: patrick, player: yordan } ],
				hits: [],
				hasStarted: fn.echo(true),
				isFinal: fn.echo(true)
			},
			{
				...game,
				status: 'F',
				picks: [ { user: patrick, player: yordan } ],
				hits: [ { player: yordan, hits: 1 } ],
				hasStarted: fn.echo(true),
				isFinal: fn.echo(true)
			},
		];

		games.forEach(game => {
			game.mappedPicks = game.picks.reduce((mappedPicks, pick) => {
				return {
					...mappedPicks,
					[pick.user._id.toString()]: pick.player
				};
			}, {});

			game.flatHits = game.hits.map(playerHits => { return playerHits.player._id });
		});

		response.render('schedule/all', {
			session: session,
			games: games,
			today: '2022-10-15',
			tomorrow: '2022-10-16',
			yesterday: '2022-10-14',
			dateFormat: dateFormat
		});
	});
};
