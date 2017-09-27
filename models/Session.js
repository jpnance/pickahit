var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var User = require('../models/User');

var sessionSchema = new Schema({
	_id: { type: String, required: true },
	username: { type: String, required: true },
	createdAt: { type: Date, expires: 600, required: true }
});

sessionSchema.virtual('user', {
	ref: 'User',
	localField: 'username',
	foreignField: 'username',
	justOne: true
});

module.exports = mongoose.model('Session', sessionSchema);
