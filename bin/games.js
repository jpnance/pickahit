var request = require('superagent');

var Game = require('../models/Game');
var Team = require('../models/Team');

var mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI);

Game.find({}).sort('startTime').exec(function(error, games) {
	var gamePromises = [];

	games.forEach(function(game) {
		gamePromises.push(new Promise(function(resolve, reject) {
			request.get('https://statsapi.mlb.com/api/v1/game/' + game._id + '/feed/live', function(error, response) {
				var data = JSON.parse(response.text);

				var awayTeam = data.liveData.boxscore.teams.away;
				var homeTeam = data.liveData.boxscore.teams.home;

				Object.keys(awayTeam.players).forEach(function(key) {
					var player = awayTeam.players[key];

					if (player.batterPitcher) {
						var playerId = parseInt(player.id);

						if (player.batterPitcher == 'p') {
							if (game.away.pitchers.indexOf(playerId) == -1) {
								game.away.pitchers.push(playerId);
							}
						}
						else if (player.batterPitcher == 'b') {
							if (game.away.batters.indexOf(playerId) == -1) {
								game.away.batters.push(playerId);
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
							if (game.away.pitchers.indexOf(playerId) == -1) {
								game.away.pitchers.push(playerId);
							}
						}
						else if (player.position.code != '1') {
							if (game.away.batters.indexOf(playerId) == -1) {
								game.away.batters.push(playerId);
							}
						}
					}
				});

				Object.keys(homeTeam.players).forEach(function(key) {
					var player = homeTeam.players[key];

					if (player.batterPitcher) {
						var playerId = parseInt(player.id);

						if (player.batterPitcher == 'p') {
							if (game.home.pitchers.indexOf(playerId) == -1) {
								game.home.pitchers.push(playerId);
							}
						}
						else if (player.batterPitcher == 'b') {
							if (game.home.batters.indexOf(playerId) == -1) {
								game.home.batters.push(playerId);
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
							if (game.home.pitchers.indexOf(playerId) == -1) {
								game.home.pitchers.push(playerId);
							}
						}
						else if (player.position.code != '1') {
							if (game.home.batters.indexOf(playerId) == -1) {
								game.home.batters.push(playerId);
							}
						}
					}
				});

				game.status = data.gameData.status.statusCode;

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
