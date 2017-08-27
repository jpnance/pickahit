var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
	username: { type: String, required: true, unique: true },
	password: { type: String, required: true },
	seasons: { type: [Number] }
});

userSchema.methods.makeEligibleFor = function(season) {
	if (!this.seasons) {
		this.seasons = [];
	}

	if (this.seasons.indexOf(season) == -1) {
		this.seasons.push(season);
	}
};

module.exports = mongoose.model('User', userSchema);
