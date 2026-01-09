var User = require('../models/User');
var Game = require('../models/Game');
var Player = require('../models/Player');

var mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI);

var dateFormat = require('dateformat');

var data = [
	Game.findById(526476),
	Game.findById(526475)
];

Promise.all(data).then(function(values) {
	var game1 = values[0];
	var game2 = values[1];

	game1.isCool();

	mongoose.disconnect();
	process.exit();
});
