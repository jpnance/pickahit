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
		pitchers: [{ type: Number, ref: 'Player' }]
	},
	home: {
		team: { type: Number, ref: 'Team', required: true },
		batters: [{ type: Number, ref: 'Player' }],
		pitchers: [{ type: Number, ref: 'Player' }]
	},
	picks: { type: Schema.Types.Mixed },
	hits: [{ type: Number, ref: 'Player' }],
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

gameSchema.methods.makePick = function(userId, playerId) {
	if (!this.picks) {
		this.picks = {};
	}

	this.picks[userId] = playerId;
	this.markModified('picks');
};

module.exports = mongoose.model('Game', gameSchema);
