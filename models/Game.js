var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Team = require('../models/Team');
var Player = require('../models/Player');

var gameSchema = new Schema({
	_id: { type: Number },
	startTime: { type: Date },
	away: {
		team: { type: Number, ref: 'Team', required: true },
		batters: [{ type: Number, ref: 'Player' }],
		pitchers: [{ type: Number, ref: 'Player' }],
		probablePitcher: { type: Number, ref: 'Player' }
	},
	home: {
		team: { type: Number, ref: 'Team', required: true },
		batters: [{ type: Number, ref: 'Player' }],
		pitchers: [{ type: Number, ref: 'Player' }],
		probablePitcher: { type: Number, ref: 'Player' }
	},
	picks: [{
		user: { type: Schema.Types.ObjectId, ref: 'User' },
		player: { type: Number, ref: 'Player' }
	}],
	hits: [{ type: Number, ref: 'Player' }],
	status: { type: String, required: true },
	gameDescription: { type: String },
	seriesDescription: { type: String },
	seriesGameNumber: { type: Number },
	gamesInSeries: { type: Number },
	ifNecessary: { type: String },
	points: { type: Number }
});

gameSchema.methods.hasStarted = function() {
	if (this.startTime) {
		return Date.now() >= this.startTime;
	}

	return false;
};

gameSchema.methods.isFinal = function() {
	return this.status == 'F';
};

module.exports = mongoose.model('Game', gameSchema);
