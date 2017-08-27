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
		it('should create a seasons property that includes 2017', function(done) {
			var user = new User({ username: 'jpnance', password: 'VerySecure' });

			expect(user).to.not.have.property('seasons');

			user.makeEligibleFor(2017);

			expect(user).to.have.property('seasons');
			expect(user.seasons).to.be.an('array');
			expect(user.seasons).to.contain(2017);

			done();
		});
	});
});
