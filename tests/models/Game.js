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

	it('should allow a start time to be optionally specified', function() {
		var game = new Game({ awayTeam: 'BOS', homeTeam: 'HOU', startTime: '2017-10-01 19:07:00' });

		expect(game).to.have.property('startTime');
		expect(game.startTime.toString()).to.be('Sun Oct 01 2017 19:07:00 GMT-0700 (PDT)');
	});

	describe('.hasStarted()', function() {
		describe('for a game with no startTime set', function() {
			it('should return false', function() {
				var game = new Game({ awayTeam: 'BOS', homeTeam: 'HOU' });

				expect(game.hasStarted()).to.be(false);
			});
		});

		describe('for a game with a startTime in the future', function() {
			it('should return false', function() {
				var game = new Game({ awayTeam: 'BOS', homeTeam: 'HOU', startTime: Date.now() + 600000 });

				expect(game.hasStarted()).to.be(false);
			});
		});
	});
});
