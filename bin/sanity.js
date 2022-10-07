var dotenv = require('dotenv').config({ path: '/app/.env' });

var User = require('../models/User');
var Game = require('../models/Game');

var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGODB_URI);

Game.find({ season: process.env.SEASON }).sort('startTime').then((games) => {
	games.forEach((game) => {
		if (game.picks.length) {
			game.picks.forEach((pick) => {
				if (!game.away.batters?.includes(pick.player) && !game.home.batters?.includes(pick.player)) {
					console.log('ALERT', game._id, pick.player);
				}
			});
		}
	});

	mongoose.disconnect();
	process.exit();
});
