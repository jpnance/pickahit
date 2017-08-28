var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var gameSchema = new Schema({
	startTime: { type: Date },
	awayTeam: { type: String, required: true },
	homeTeam: { type: String, required: true }
});

gameSchema.methods.hasStarted = function() {
	if (this.startTime) {
		return Date.now() >= this.startTime;
	}

	return false;
};

module.exports = mongoose.model('Game', gameSchema);
