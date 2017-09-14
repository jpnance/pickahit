var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var sessionSchema = new Schema({
	_id: { type: String, required: true },
	username: { type: String, required: true },
	expires: { type: Date, required: true }
});

module.exports = mongoose.model('Session', sessionSchema);
