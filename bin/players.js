var dotenv = require('dotenv').config({ path: __dirname + '/../.env' });

var request = require('superagent');
var cheerio = require('cheerio');

var Team = require('../models/Team');
var Player = require('../models/Player');

var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });

var playerPromises = [];

Team.find({}, function(error, teams) {
	teams.forEach(function(team) {
		request.get('http://m.mlb.com/' + team.abbreviation.toLowerCase() + '/roster/40-man/', function(error, response) {
			if (!response || !response.text) { return; }

			var $ = cheerio.load(response.text);

			$('td.info a').each(function(i, e) {
				var hrefSections = $(this).attr('href').split('-');
				var playerId = hrefSections[hrefSections.length - 1];

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
						throws: player.pitchHand.code,
						active: true
					};

					Player.findByIdAndUpdate(player.id, newPlayer, { upsert: true }).exec();
				});
			});
		});
	});
});
