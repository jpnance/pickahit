var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var teamSchema = new Schema({
	_id: { type: Number },
	name: { type: String, required: true },
	abbreviation: { type: String, required: true }
});

module.exports = mongoose.model('Team', teamSchema);
