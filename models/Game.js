var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var gameSchema = new Schema({
	awayTeam: { type: String, required: true },
	homeTeam: { type: String, required: true }
});

module.exports = mongoose.model('Game', gameSchema);
