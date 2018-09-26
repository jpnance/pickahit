var request = require('superagent');
var cheerio = require('cheerio');

var Team = require('../models/Team');
var Player = require('../models/Player');

var mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI);

var playerPromises = [];

Team.find({}, function(error, teams) {
	teams.forEach(function(team) {
		request.get('http://m.mlb.com/' + team.abbreviation.toLowerCase() + '/roster/40-man/', function(error, response) {
			if (!response || !response.text) { return; }

			var $ = cheerio.load(response.text);

			$('td.dg-name_display_first_last a').each(function(i, e) {
				var playerId = $(this).attr('href').split('/')[2];

				request.get('https://statsapi.mlb.com/api/v1/people/' + playerId, function(error, response) {
					if (!response || !response.text) { return; }

					var data = JSON.parse(response.text);
					var player = data.people[0];

					var newPlayer = {
						team: team.id,
						number: player.primaryNumber,
						name: player.fullName,
						position: player.primaryPosition.abbreviation,
						bats: player.batSide.code,
						throws: player.pitchHand.code
					};

					Player.findByIdAndUpdate(player.id, newPlayer, { upsert: true }).exec();
				});
			});
		});
	});
});
