var expect = require('expect.js');
var User = require('../../models/User');

describe('User', function() {
	it('should be invalid if username is empty', function(done) {
		var user = new User();

		user.validate(function(error) {
			expect(error).to.have.property('errors');
			expect(error.errors).to.have.property('username');

			done();
		});
	});

	it('should be invalid if password is empty', function(done) {
		var user = new User({ username: 'jpnance' });

		user.validate(function(error) {
			expect(error).to.have.property('errors');
			expect(error.errors).to.have.property('password');

			done();
		});
	});

	it('should be valid if username and password are both present', function(done) {
		var user = new User({ username: 'jpnance', password: 'VerySecure' });

		user.validate(function(error) {
			expect(error).to.be.null;

			done();
		});
	});

	describe('.makeEligibleFor(2017)', function() {
		describe('for a user without a seasons list', function() {
			it('should create a seasons list that includes 2017', function(done) {
				var user = new User({ username: 'jpnance', password: 'VerySecure' });

				expect(user).to.not.have.property('seasons');

				user.makeEligibleFor(2017);

				expect(user).to.have.property('seasons');
				expect(user.seasons).to.be.an('array');
				expect(user.seasons).to.contain(2017);

				done();
			});
		});

		describe('for a user with an existing seasons list that doesn\'t include 2017', function() {
			it('should add 2017 to the seasons list, preserving existing values', function(done) {
				var user = new User({ username: 'jpnance', password: 'VerySecure' });
				user.seasons = [2016];

				expect(user).to.have.property('seasons');
				expect(user.seasons).to.be.an('array');
				expect(user.seasons).to.not.contain(2017);

				user.makeEligibleFor(2017);

				expect(user.seasons).to.contain(2016);
				expect(user.seasons).to.contain(2017);

				done();
			});
		});

		describe('for a user with an existing seasons list that includes 2017', function() {
			it('shouldn\'t do anything, preserving existing values', function(done) {
				var user = new User({ username: 'jpnance', password: 'VerySecure' });
				user.seasons = [2016, 2017];

				expect(user).to.have.property('seasons');
				expect(user.seasons).to.be.an('array');
				expect(user.seasons).to.have.length(2);

				user.makeEligibleFor(2017);

				expect(user.seasons).to.contain(2016);
				expect(user.seasons).to.contain(2017);
				expect(user.seasons).to.have.length(2);

				done();
			});
		});
	});
});
