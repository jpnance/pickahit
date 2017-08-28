var expect = require('expect.js');
var Game = require('../../models/Game');

describe('Game', function() {
	it('should be invalid if awayTeam is empty', function(done) {
		var game = new Game();

		game.validate(function(error) {
			expect(error).to.have.property('errors');
			expect(error.errors).to.have.property('awayTeam');

			done();
		});
	});

	it('should be invalid if homeTeam is empty', function(done) {
		var game = new Game({ awayTeam: 'BOS' });

		game.validate(function(error) {
			expect(error).to.have.property('errors');
			expect(error.errors).to.have.property('homeTeam');

			done();
		});
	});
});
