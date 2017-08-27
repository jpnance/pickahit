var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
	username: { type: String, required: true, unique: true },
	password: { type: String, required: true }
});

userSchema.methods.makeEligibleFor = function(season) {
	this.seasons = [2017];
};

module.exports = mongoose.model('User', userSchema);
