var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
	username: { type: String, required: true, unique: true },
	password: { type: String, required: true },
	firstName: { type: String },
	lastName: { type: String },
	displayName: { type: String },
	seasons: { type: [Number] },
	admin: { type: Boolean, default: false }
});

userSchema.methods.isEligibleFor = function(season) {
	return this.seasons.indexOf(season) > -1;
};

userSchema.methods.makeEligibleFor = function(season) {
	if (!this.seasons) {
		this.seasons = [];
	}

	if (this.seasons.indexOf(season) == -1) {
		this.seasons.push(season);
	}
};

module.exports = mongoose.model('User', userSchema);
