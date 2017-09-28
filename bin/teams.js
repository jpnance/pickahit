var request = require('superagent');
var cheerio = require('cheerio');

var Team = require('../models/Team');
var Player = require('../models/Player');

var mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI);

var teamPromises = [];

request.get('https://statsapi.mlb.com/api/v1/teams', function(error, response) {
	if (error) {
		console.log(error);
		process.exit();
	}

	var data = JSON.parse(response.text);

	data.teams.forEach(function(team) {
		if (!team.active) {
			return;
		}

		if (team.league.id == 103 || team.league.id == 104) {
			var newTeam = {
				name: team.name,
				abbreviation: team.abbreviation
			};

			teamPromises.push(Team.findByIdAndUpdate(team.id, newTeam, { upsert: true }));
		}
	});

	Promise.all(teamPromises).then(function() {
		mongoose.disconnect();
	});
});
