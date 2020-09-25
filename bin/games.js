var dotenv = require('dotenv').config({ path: '../.env' });

var request = require('superagent');

var Game = require('../models/Game');
var Team = require('../models/Team');

var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });

Game.find({ season: process.env.SEASON }).sort('startTime').exec(function(error, games) {
	var gamePromises = [];

	games.forEach(function(game) {
		gamePromises.push(new Promise(function(resolve, reject) {
			request.get('https://statsapi.mlb.com/api/v1.1/game/' + game._id + '/feed/live', function(error, response) {
				var data = JSON.parse(response.text);

				if (!data.liveData || !data.liveData.boxscore || !data.liveData.boxscore.teams) {
					resolve('fine');
					return;
				}

				var awayTeam = data.liveData.boxscore.teams.away;
				var homeTeam = data.liveData.boxscore.teams.home;

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

								if (parseInt(player.gameStats.batting.hits) > 0) {
									if (game.hits.indexOf(playerId) == -1) {
										game.hits.push(playerId);
									}
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
								//if ([599336, 599335].includes(game._id) && [519058, 669221].includes(playerId)) {
									var playerHits = game.hits.find(playerHits => { return playerHits.player == playerId; });
									//var lolHits = Math.floor(Math.random() * 9) + 1;

									if (!playerHits) {
										game.hits.push({ player: playerId, hits: player.stats.batting.hits });
										//game.hits.push({ player: playerId, hits: lolHits });
									}
									else {
										playerHits.hits = player.stats.batting.hits;
										//playerHits.hits = lolHits;
									}
								}
							}
						}
					});
				});

				if (data.gameData.probablePitchers) {
					if (data.gameData.probablePitchers.away) {
						game.away.probablePitcher = data.gameData.probablePitchers.away.id;
					}
					if (data.gameData.probablePitchers.home) {
						game.home.probablePitcher = data.gameData.probablePitchers.home.id;
					}
				}

				game.status = data.gameData.status.statusCode;

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

				game.save(function(error) {
					if (!error) {
						resolve('good');
					}
				});
			});
		}));
	});

	Promise.all(gamePromises).then(function() {
		mongoose.disconnect();
	});
});
