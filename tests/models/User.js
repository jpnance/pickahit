var expect = require('expect.js');
var User = require('../../models/User');

describe('User', function() {
	it('should be invalid if username is empty', function() {
		var user = new User();

		user.validate(function(error) {
			expect(error).to.have.property('errors');
			expect(error.errors).to.have.property('username');
		});
	});

	it('should be invalid if password is empty', function() {
		var user = new User({ username: 'jpnance' });

		user.validate(function(error) {
			expect(error).to.have.property('errors');
			expect(error.errors).to.have.property('password');
		});
	});

	it('should be valid if username and password are both present', function() {
		var user = new User({ username: 'jpnance', password: 'VerySecure' });

		user.validate(function(error) {
			expect(error).to.be.null;
		});

		expect(user).to.have.property('username');
		expect(user.username).to.be('jpnance');
	});

	it('should allow a seasons list to be optionally specified', function() {
		var user = new User({ username: 'jpnance', password: 'VerySecure', seasons: [2016] });

		expect(user).to.have.property('seasons');
		expect(user.seasons).to.be.an('array');
		expect(user.seasons).to.contain(2016);
	});

	describe('.makeEligibleFor(2017)', function() {
		describe('for a user with an empty seasons list', function() {
			it('should create a seasons list that includes 2017', function() {
				var user = new User({ username: 'jpnance', password: 'VerySecure' });

				user.makeEligibleFor(2017);

				expect(user).to.have.property('seasons');
				expect(user.seasons).to.be.an('array');
				expect(user.seasons).to.contain(2017);
			});
		});

		describe('for a user with a seasons list that doesn\'t include 2017', function() {
			it('should add 2017 to the seasons list, preserving existing values', function() {
				var user = new User({ username: 'jpnance', password: 'VerySecure', seasons: [2016] });

				expect(user).to.have.property('seasons');
				expect(user.seasons).to.be.an('array');
				expect(user.seasons).to.not.contain(2017);

				user.makeEligibleFor(2017);

				expect(user.seasons).to.contain(2016);
				expect(user.seasons).to.contain(2017);
			});
		});

		describe('for a user with a seasons list that includes 2017', function() {
			it('shouldn\'t do anything, preserving existing values', function() {
				var user = new User({ username: 'jpnance', password: 'VerySecure', seasons: [2016, 2017] });

				expect(user).to.have.property('seasons');
				expect(user.seasons).to.be.an('array');
				expect(user.seasons).to.have.length(2);

				user.makeEligibleFor(2017);

				expect(user.seasons).to.contain(2016);
				expect(user.seasons).to.contain(2017);
				expect(user.seasons).to.have.length(2);
			});
		});
	});

	describe('.isEligibleFor(2017)', function() {
		describe('for a user with an empty seasons list', function() {
			it('should return false', function() {
				var user = new User({ username: 'jpnance', password: 'VerySecure' });

				expect(user.isEligibleFor(2017)).to.be(false);
			});
		});

		describe('for a user with a seasons list that doesn\'t include 2017', function() {
			it('should return false', function() {
				var user = new User({ username: 'jpnance', password: 'VerySecure', seasons: [2016] });

				expect(user.isEligibleFor(2017)).to.be(false);
			});
		});

		describe('for a user with a seasons list that includes 2017', function() {
			it('should return true', function() {
				var user = new User({ username: 'jpnance', password: 'VerySecure', seasons: [2016, 2017] });

				expect(user.isEligibleFor(2017)).to.be(true);
			});
		});
	});
});
