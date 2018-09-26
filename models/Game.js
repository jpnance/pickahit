var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Team = require('../models/Team');
var Player = require('../models/Player');

var gameSchema = new Schema({
	_id: { type: Number },
	season: { type: Number },
	startTime: { type: Date },
	away: {
		team: { type: Number, ref: 'Team', required: true },
		batters: [{ type: Number, ref: 'Player' }],
		pitchers: [{ type: Number, ref: 'Player' }],
		probablePitcher: { type: Number, ref: 'Player' },
		startingLineup: [{ type: Number, ref: 'Player' }]
	},
	home: {
		team: { type: Number, ref: 'Team', required: true },
		batters: [{ type: Number, ref: 'Player' }],
		pitchers: [{ type: Number, ref: 'Player' }],
		probablePitcher: { type: Number, ref: 'Player' },
		startingLineup: [{ type: Number, ref: 'Player' }]
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
	var rainDelayed = false;
	var pastStartTime = false;

	if (this.status && this.status == 'PR') {
		rainDelayed = true;
	}

	if (this.startTime && Date.now() >= this.startTime) {
		pastStartTime = true;
	}

	return !rainDelayed && pastStartTime;
};

gameSchema.methods.isCool = function(hours) {
	var later = new Date(this.startTime);
	later.setHours(later.getHours() + 6);

	return Date.now() >= later;
};

gameSchema.methods.isFinal = function() {
	return this.status == 'F';
};

gameSchema.methods.isFinalAndCool = function() {
	return this.isFinal() && this.isCool();
};

gameSchema.methods.isOver = function() {
	return this.status == 'O' || this.status == 'F';
};

module.exports = mongoose.model('Game', gameSchema);
