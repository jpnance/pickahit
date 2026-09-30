var dotenv = require('dotenv').config({ path: '/app/.env' });

var request = require('superagent');

var Game = require('../models/Game');
var Team = require('../models/Team');

var mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI);

Game.find({ season: process.env.SEASON }).sort('startTime')
	.then(function(games) {
		var gamePromises = [];

		games.forEach(function(game) {
			gamePromises.push(new Promise(function(resolve, reject) {
				request.get('https://statsapi.mlb.com/api/v1.1/game/' + game._id + '/feed/live', function(error, response) {
					if (error || !response || !response.text) {
						resolve('error');
						return;
					}

					var data;

					try {
						data = JSON.parse(response.text);
					} catch (parseError) {
						resolve('error');
						return;
					}

					game.applyFeedLiveState(data);

					if (!data.liveData || !data.liveData.boxscore || !data.liveData.boxscore.teams) {
						game.save()
							.then(function() {
								resolve('good');
							})
							.catch(function(saveError) {
								console.error(saveError);
								resolve('error');
							});
						return;
					}

					var awayTeam = data.liveData.boxscore.teams.away;
					var homeTeam = data.liveData.boxscore.teams.home;
					var rebuiltHits = [];

					[ { team: awayTeam, name: 'away' }, { team: homeTeam, name: 'home' } ].forEach(tuple => {
						var team = tuple.team;
						var name = tuple.name;

						Object.keys(team.players).forEach(function(key) {
							var player = team.players[key];

							if (player.batterPitcher) {
								var playerId = parseInt(player.id);

								if (player.batterPitcher == 'p') {
									if (game[name].pitchers.indexOf(playerId) == -1) {
										game[name].pitchers.push(playerId);
									}
								}
								else if (player.batterPitcher == 'b') {
									if (game[name].batters.indexOf(playerId) == -1) {
										game[name].batters.push(playerId);
									}
								}
							}
							else if (player.person) {
								var playerId = parseInt(player.person.id);

								if (player.position.code == '1') {
									if (game[name].pitchers.indexOf(playerId) == -1) {
										game[name].pitchers.push(playerId);
									}
								}
								else if (player.position.code != '1') {
									if (game[name].batters.indexOf(playerId) == -1) {
										game[name].batters.push(playerId);
									}

									if (player.stats && player.stats.batting && parseInt(player.stats.batting.hits) > 0) {
										rebuiltHits.push({
											player: playerId,
											hits: parseInt(player.stats.batting.hits, 10)
										});
									}
								}
							}
						});
					});

					game.hits = rebuiltHits;

					if (data.gameData.probablePitchers) {
						if (data.gameData.probablePitchers.away) {
							game.away.probablePitcher = data.gameData.probablePitchers.away.id;
						}
						if (data.gameData.probablePitchers.home) {
							game.home.probablePitcher = data.gameData.probablePitchers.home.id;
						}
					}

					if (awayTeam.battingOrder && awayTeam.battingOrder.length > 0) {
						if (!game.away.startingLineup || game.away.startingLineup.length == 0) {
							awayTeam.battingOrder.forEach(function(playerId) {
								game.away.startingLineup.push(parseInt(playerId));
							});
						}
					}

					if (homeTeam.battingOrder && homeTeam.battingOrder.length > 0) {
						if (!game.home.startingLineup || game.home.startingLineup.length == 0) {
							homeTeam.battingOrder.forEach(function(playerId) {
								game.home.startingLineup.push(parseInt(playerId));
							});
						}
					}

					game.save()
						.then(function() {
							resolve('good');
						})
						.catch(function(saveError) {
							console.error(saveError);
							resolve('error');
						});
				});
			}));
		});

		Promise.all(gamePromises).then(function() {
			mongoose.disconnect();
		});
	})
	.catch(function(error) {
		console.error(error);
		mongoose.disconnect();
	});
