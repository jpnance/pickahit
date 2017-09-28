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

sessionSchema.statics.withActiveSession = function(request, callback) {
	if (request.cookies.sessionId) {
		this.findById(request.cookies.sessionId).populate('user').exec(function(error, session) {
			if (error) {
				callback(error, null);
			}
			else {
				callback(null, session);
			}
		});
	}
	else {
		callback(null, null);
	}
};

module.exports = mongoose.model('Session', sessionSchema);
