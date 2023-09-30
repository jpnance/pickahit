var dotenv = require('dotenv').config({ path: '/app/.env' });

var Player = require('../models/Player');

var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });

Player.updateMany({}, { active: false }, function(error, response) {
	mongoose.disconnect();
});
