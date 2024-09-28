var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var teamSchema = new Schema({
	_id: { type: Number },
	name: { type: String, required: true },
	abbreviation: { type: String, required: true },
	locationName: { type: String, required: true },
	teamName: { type: String, required: true }
});

teamSchema.methods.isActualMlbTeam = function() {
	var mlbAbbreviations = [
		'ATL', 'AZ', 'BAL', 'BOS', 'CHC',
		'CIN', 'CLE', 'COL', 'CWS', 'DET',
		'HOU', 'KC', 'LAA', 'LAD', 'MIA',
		'MIL', 'MIN', 'NYM', 'NYY', 'OAK',
		'PHI', 'PIT', 'SD', 'SEA', 'SF',
		'STL', 'TB', 'TEX', 'TOR', 'WSH'
	];

	return mlbAbbreviations.includes(this.abbreviation);
};

teamSchema.methods.imageAbbreviation = function() {
	var abbreviation = this.abbreviation;

	if (!this.isActualMlbTeam()) {
		if (abbreviation.startsWith('AL')) {
			abbreviation = 'AL';
		}
		else if (abbreviation.startsWith('NL')) {
			abbreviation = 'NL';
		}
		else if (abbreviation.startsWith('LG')) {
			abbreviation = 'MLB';
		}
		else if (abbreviation.match('/')) {
			abbreviation = 'MLB';
		}
	}

	return abbreviation.toLowerCase();
};

module.exports = mongoose.model('Team', teamSchema);
