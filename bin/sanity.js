var User = require('../models/User');
var Game = require('../models/Game');

var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGODB_URI);

Game.find({ season: process.env.SEASON }).sort('startTime').then(games => {
	games.forEach(game => {
		var users = [];

		if (game.picks.length) {
			game.picks.forEach(pick => {
				if (users.includes(pick.user.toString())) {
					console.log('ALERT', game._id, pick.user);
				}

				users.push(pick.user.toString());
			});
		}
	});

	mongoose.disconnect();
	process.exit();
});
