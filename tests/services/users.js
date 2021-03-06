var http = require('http');
var expect = require('expect.js');
var request = require('superagent');
var prefix = require('superagent-prefix')('http://localhost:3333');

var app = require('../../index.js');

describe('POST to /users', function() {
	describe('with no data', function() {
		it('should return a 400 error', function(done) {
			request
				.post('/users')
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
				.post('/users')
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
				.post('/users')
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

	describe('with a username and a password', function() {
		it('should return an object reflecting the parameters', function(done) {
			request
				.post('/users')
				.use(prefix)
				.send({ username: 'jpnance', password: 'VerySecure' })
				.end(function(error, response) {
					expect(error).to.be.null;

					expect(response).to.not.be.null;
					expect(response.body).to.have.property('username', 'jpnance');
					expect(response.body).to.have.property('password');

					done();
				});
		});
	});
});
