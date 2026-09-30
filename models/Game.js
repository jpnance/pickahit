var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Team = require('../models/Team');
var Player = require('../models/Player');

var LIVE_SCORE_STATUS_CODES = ['I', 'MA', 'MF', 'MI', 'O', 'UR', 'F', 'FR', 'FG', 'FO'];
var FINAL_STATUS_CODES = ['F', 'FR', 'FG', 'FO'];

var gameSchema = new Schema({
	_id: { type: Number },
	season: { type: Number },
	startTime: { type: Date },
	away: {
		team: { type: Number, ref: 'Team', required: true },
		batters: [{ type: Number, ref: 'Player' }],
		pitchers: [{ type: Number, ref: 'Player' }],
		probablePitcher: { type: Number, ref: 'Player' },
		startingLineup: [{ type: Number, ref: 'Player' }],
		score: { type: Number, default: 0 }
	},
	home: {
		team: { type: Number, ref: 'Team', required: true },
		batters: [{ type: Number, ref: 'Player' }],
		pitchers: [{ type: Number, ref: 'Player' }],
		probablePitcher: { type: Number, ref: 'Player' },
		startingLineup: [{ type: Number, ref: 'Player' }],
		score: { type: Number, default: 0 }
	},
	picks: [{
		user: { type: Schema.Types.ObjectId, ref: 'User' },
		player: { type: Number, ref: 'Player' }
	}],
	hits: [{
		player: { type: Number, ref: 'Player' },
		hits: { type: Number, required: true }
	}],
	status: { type: String, required: true },
	inning: {
		number: { type: Number },
		ordinal: { type: String },
		state: { type: String },
		half: { type: String }
	},
	gameDescription: { type: String },
	seriesDescription: { type: String },
	seriesGameNumber: { type: Number },
	gamesInSeries: { type: Number },
	ifNecessary: { type: String },
	points: { type: Number }
});

gameSchema.methods.hasStartTime = function() {
	return this.startTime;
};

gameSchema.methods.isPastStartTime = function() {
	return this.startTime && Date.now() >= this.startTime;
};

gameSchema.methods.isWarmingUp = function() {
	return this.status == 'PW';
};

gameSchema.methods.isDelayed = function() {
	return this.status == 'PI' || this.status == 'PR' || this.status == 'PS' || this.status == 'PY';
};

gameSchema.methods.hasBeenPostponed = function() {
	return this.status == 'DI' || this.status == 'DR' || this.status == 'DS' || this.status == 'DV';
};

gameSchema.methods.hasBeenCanceled = function() {
	return this.status == 'CO';
};

gameSchema.methods.hasPotentiallyStarted = function() {
	return this.isPastStartTime() && !this.isDelayed();
};

gameSchema.methods.hasDefinitelyStarted = function() {
	return (this.hasPotentiallyStarted() || this.hasBeenSuspended()) && this.inning && this.inning.number;
};

gameSchema.methods.hasBeenSuspended = function() {
	return ['TI', 'TR', 'UI', 'UR'].includes(this.status);
};

gameSchema.methods.isCool = function(hours) {
	var later = new Date(this.startTime);
	later.setHours(later.getHours() + 6);

	return Date.now() >= later;
};

gameSchema.methods.isFinal = function() {
	return FINAL_STATUS_CODES.includes(this.status);
};

gameSchema.methods.isFinalAndCool = function() {
	return this.isFinal() && this.isCool();
};

gameSchema.methods.isOver = function() {
	return this.status == 'O' || FINAL_STATUS_CODES.includes(this.status);
};

gameSchema.methods.applyFeedLiveState = function(data) {
	if (!data || !data.gameData) {
		return;
	}

	if (data.gameData.datetime && data.gameData.datetime.dateTime) {
		this.startTime = data.gameData.datetime.dateTime;
	}

	if (data.gameData.status && data.gameData.status.statusCode) {
		this.status = data.gameData.status.statusCode;
	}

	if (!data.liveData || !data.liveData.linescore || !data.liveData.linescore.teams) {
		return;
	}

	if (LIVE_SCORE_STATUS_CODES.includes(this.status)) {
		this.away.score = data.liveData.linescore.teams.away.runs;
		this.home.score = data.liveData.linescore.teams.home.runs;

		this.inning.number = data.liveData.linescore.currentInning;
		this.inning.ordinal = data.liveData.linescore.currentInningOrdinal;
		this.inning.state = data.liveData.linescore.inningState;
		this.inning.half = data.liveData.linescore.inningHalf;
	}
};

gameSchema.methods.syncWithApi = function() {
	var thisGame = this;

	return new Promise(function(resolve, reject) {
		var request = require('superagent');

		request.get('https://statsapi.mlb.com/api/v1.1/game/' + thisGame._id + '/feed/live', function(error, response) {
			if (error) {
				reject(error);
				return;
			}

			if (!response || !response.text) {
				reject('not really sure but bad');
				return;
			}

			try {
				var data = JSON.parse(response.text);
			} catch (error) {
				reject('probably unexpected end of input');
				return;
			}

			thisGame.applyFeedLiveState(data);

			thisGame.save().then(resolve).catch(reject);
		});
	});
};

module.exports = mongoose.model('Game', gameSchema);
