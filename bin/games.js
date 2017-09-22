var request = require('superagent');
var cheerio = require('cheerio');

var Game = require('../models/Game');
var Team = require('../models/Team');

var mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI);

var dateRange = {
	start: new Date('2017-10-03 00:00:00'),
	end: new Date('2017-11-01 00:00:00')
};

var days = (dateRange.end - dateRange.start) / 86400000;

for (var i = 0; i <= days; i++) {
	var date = new Date(dateRange.start.getFullYear(), dateRange.start.getMonth(), dateRange.start.getDate() + i);

	var year = date.getFullYear();
	var month = date.getMonth();
	var date = date.getDate();

	var dateString = year + '-' + (month + 1) + '-' + (date < 10 ? '0' : '') + date;

	request.get('https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=' + dateString + '&hydrate=team', function(error, response) {
		var data = JSON.parse(response.text);

		data.dates.forEach(function(date) {
			date.games.forEach(function(game) {
				var awayTeam = game.teams.away.team;
				var homeTeam = game.teams.home.team;

				var newGame = {
					startTime: game.gameDate,
					awayTeam: awayTeam.id,
					homeTeam: homeTeam.id
				};

				if (awayTeam.placeholder) {
					console.log(awayTeam.id);
					Team.findByIdAndUpdate(awayTeam.id, { name: awayTeam.name, abbreviation: awayTeam.abbreviation }, { upsert: true }, function(error) { console.log(error); });
				}

				if (homeTeam.placeholder) {
					console.log(homeTeam.id);
					Team.findByIdAndUpdate(homeTeam.id, { name: homeTeam.name, abbreviation: homeTeam.abbreviation }, { upsert: true }, function(error) { console.log(error); });
				}

				Game.findByIdAndUpdate(game.gamePk, newGame, { upsert: true }).exec();
			});
		});
	});
}
