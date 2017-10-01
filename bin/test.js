var User = require('../models/User');
var Game = require('../models/Game');
var Player = require('../models/Player');

var mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI);

var data = [
	Game
		.findById(492508)
		.populate('picks.player')
		.populate('picks.user')
];

Promise.all(data).then(function(values) {
	var game = values[0];

	console.log(game.picks);
	mongoose.disconnect();
	process.exit();
});
