var dotenv = require('dotenv').config({ path: __dirname + '/../.env' });

var request = require('superagent');

var Team = require('../models/Team');
var Player = require('../models/Player');

var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });

var teamPromises = [];
var playerPromises = [];

Team.find({}, function(error, teams) {
	teams.forEach(function(team) {
		teamPromises.push(new Promise(function(teamResolve, teamReject) {
			request.get('https://statsapi.mlb.com/api/v1/teams/' + team._id + '/roster?rosterType=40Man', function(error, response) {
				if (error) {
					teamResolve(null);
					return;
				}

				if (!response || !response.text) { teamResolve(null); return; }

				var data = JSON.parse(response.text);

				if (!data.roster) {
					teamResolve(null);
					return;
				}

				data.roster.forEach((player) => {
					var playerId = player.person.id;

					playerPromises.push(new Promise(function(playerResolve, playerReject) {
						request.get('https://statsapi.mlb.com/api/v1/people/' + playerId, function(error, response) {
							if (error) {
								playerResolve(null);
								return;
							}

							if (!response || !response.text) { playerResolve(null); return; }

							var data = JSON.parse(response.text);
							var player = data.people[0];

							var newPlayer = {
								team: team.id,
								number: player.primaryNumber,
								name: player.fullName,
								position: player.primaryPosition.abbreviation,
								bats: player.batSide.code,
								throws: player.pitchHand.code,
								active: true
							};

							Player.findByIdAndUpdate(player.id, newPlayer, { upsert: true }).exec(function(error, player) {
								playerResolve(null);
							});
						});
					}));

					teamResolve(team.abbreviation);
				});
			});
		}));
	});

	Promise.all(teamPromises).then((teamValues) => {
		Promise.all(playerPromises).then((playerValues) => {
			mongoose.disconnect();
		});
	});
});
