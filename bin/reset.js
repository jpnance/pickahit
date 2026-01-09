var dotenv = require('dotenv').config({ path: '/app/.env' });

var Player = require('../models/Player');

var mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI);

Player.updateMany({}, { active: false })
	.then(function(response) {
		mongoose.disconnect();
	})
	.catch(function(error) {
		console.error(error);
		mongoose.disconnect();
	});
