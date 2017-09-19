var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var teamSchema = new Schema({
	_id: { type: Number },
	location: { type: String, required: true },
	name: { type: String, required: true },
	abbreviation: { type: String, required: true, unique: true },
	players: [ { type: Number, ref: 'Player' } ]
});

module.exports = mongoose.model('Team', teamSchema);
