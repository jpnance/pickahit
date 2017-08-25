var http = require('http');
var expect = require('expect.js');
var request = require('superagent');
var prefix = require('superagent-prefix')('http://localhost:3333');

var app = require('../../index.js');

describe('POST to /user', function() {
	describe('with no data', function() {
		it('should return a 400 error', function(done) {
			request
				.post('/user')
				.use(prefix)
				.end(function(error, response) {
					expect(error).to.not.be.null;
					expect(error.status).to.be(400);
					expect(error.response.text).to.be('No data supplied');

					expect(response).to.be.null;

					done();
				});
		});
	});

	describe('with a username but no password', function() {
		it('should return a 400 error', function(done) {
			request
				.post('/user')
				.use(prefix)
				.send({ username: 'jpnance' })
				.end(function(error, response) {
					expect(error).to.not.be.null;
					expect(error.status).to.be(400);
					expect(error.response.text).to.be('No password supplied');

					expect(response).to.be.null;

					done();
				});
		});
	});

	describe('with a password but no username', function() {
		it('should return a 400 error', function(done) {
			request
				.post('/user')
				.use(prefix)
				.send({ password: 'VerySecure' })
				.end(function(error, response) {
					expect(error).to.not.be.null;
					expect(error.status).to.be(400);
					expect(error.response.text).to.be('No username supplied');

					expect(response).to.be.null;

					done();
				});
		});
	});
});
