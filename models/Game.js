var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Team = require('../models/Team');

var gameSchema = new Schema({
	_id: { type: Number },
	startTime: { type: Date },
	awayTeam: { type: Number, ref: 'Team', required: true },
	homeTeam: { type: Number, ref: 'Team', required: true },
	gameDescription: { type: String },
	seriesDescription: { type: String },
	seriesGameNumber: { type: Number },
	gamesInSeries: { type: Number },
	ifNecessary: { type: String }
});

gameSchema.methods.hasStarted = function() {
	if (this.startTime) {
		return Date.now() >= this.startTime;
	}

	return false;
};

module.exports = mongoose.model('Game', gameSchema);
