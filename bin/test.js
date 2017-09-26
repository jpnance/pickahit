var User = require('../models/User');
var Game = require('../models/Game');

var mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI);

var data = [
	User.find({}),
	Game.find({}).sort({ startTime: 1 }).populate('awayTeam').populate('homeTeam')
];

Promise.all(data).then(function(values) {
	console.log(values);
	mongoose.disconnect();
	process.exit();
});
