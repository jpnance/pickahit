var request = require('superagent');
var cheerio = require('cheerio');

var Team = require('../models/Team');
var Player = require('../models/Player');

var mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI);

var mlbTeams = [
	{ location: 'Baltimore', name: 'Orioles', abbreviation: 'BAL' },
	{ location: 'Boston', name: 'Red Sox', abbreviation: 'BOS' },
	{ location: 'New York', name: 'Yankees', abbreviation: 'NYY' },
	{ location: 'Tampa Bay', name: 'Rays', abbreviation: 'TB' },
	{ location: 'Toronto', name: 'Blue Jays', abbreviation: 'TOR' },
	{ location: 'Atlanta', name: 'Braves', abbreviation: 'ATL' },
	{ location: 'Miami', name: 'Marlins', abbreviation: 'MIA' },
	{ location: 'New York', name: 'Mets', abbreviation: 'NYM' },
	{ location: 'Philadelphia', name: 'Phillies', abbreviation: 'PHI' },
	{ location: 'Washington', name: 'Nationals', abbreviation: 'WSH' },
	{ location: 'Chicago', name: 'White Sox', abbreviation: 'CHW' },
	{ location: 'Cleveland', name: 'Indians', abbreviation: 'CLE' },
	{ location: 'Detroit', name: 'Tigers', abbreviation: 'DET' },
	{ location: 'Kansas City', name: 'Royals', abbreviation: 'KC' },
	{ location: 'Minnesota', name: 'Twins', abbreviation: 'MIN' },
	{ location: 'Chicago', name: 'Cubs', abbreviation: 'CHC' },
	{ location: 'Cincinnati', name: 'Reds', abbreviation: 'CIN' },
	{ location: 'Milwaukee', name: 'Brewers', abbreviation: 'MIL' },
	{ location: 'Pittsburgh', name: 'Pirates', abbreviation: 'PIT' },
	{ location: 'St. Louis', name: 'Cardinals', abbreviation: 'STL' },
	{ location: 'Houston', name: 'Astros', abbreviation: 'HOU' },
	{ location: 'Los Angeles', name: 'Angels', abbreviation: 'LAA' },
	{ location: 'Oakland', name: 'Athletics', abbreviation: 'OAK' },
	{ location: 'Seattle', name: 'Mariners', abbreviation: 'SEA' },
	{ location: 'Texas', name: 'Rangers', abbreviation: 'TEX' },
	{ location: 'Arizona', name: 'Diamondbacks', abbreviation: 'ARI' },
	{ location: 'Colorado', name: 'Rockies', abbreviation: 'COL' },
	{ location: 'Los Angeles', name: 'Dodgers', abbreviation: 'LAD' },
	{ location: 'San Diego', name: 'Padres', abbreviation: 'SD' },
	{ location: 'San Francisco', name: 'Giants', abbreviation: 'SF' }
];

var playerPromises = [];

mlbTeams.forEach(function(team) {
	request.get('http://espn.go.com/mlb/team/roster/_/name/' + team.abbreviation.toLowerCase() + '/type/active', function(error, response) {
		var $ = cheerio.load(response.text);

		var teamIdPattern = /teamId:(\d+)/;
		var teamId = parseInt($('body').attr('class').match(teamIdPattern)[1]);

		Team.findByIdAndUpdate(teamId, team, { upsert: true }, function() {
			$('tr[class*=player]').each(function(rowIndex, rowElement) {
				var $playerRow = $(this);

				playerPromises.push(new Promise(function(resolve, reject) {
					var player = { team: teamId };

					$playerRow.find('td').each(function(cellIndex, cellElement) {
						var $cell = $(cellElement);

						if (cellIndex == 0) {
							player.number = parseInt($cell.text());
						}
						else if (cellIndex == 1) {
							player._id = parseInt($cell.find('a').attr('href').split('/')[7]);
							player.name = $cell.find('a').text();
						}
						else if (cellIndex == 2) {
							player.position = $cell.text();
						}
						else if (cellIndex == 3) {
							player.bats = $cell.text();
						}
						else if (cellIndex == 4) {
							player.throws = $cell.text();
							resolve(player);
						}
					});
				}).then(function(player) {
					Player.findByIdAndUpdate(player._id, player, { upsert: true }, function(error) {
						if (error) {
							console.log(error);
						}
					});
				}, function(error) {
					console.log(error);
				}));
			});
		});
	});
});

/*
playerPromises.push(new Promise(function(resolve, reject) {
	var player = {
		_id: 31337,
		name: 'Dun Know',
		number: 12,
		teamId: 10,
		position: '1B',
		bats: 'L',
		throws: 'R'
	}

	resolve(player);
}).then(function(player) {
	console.log(player);
	Player.findByIdAndUpdate(player._id, player, { upsert: true }, function(error) { console.log(error); });
}));
*/
