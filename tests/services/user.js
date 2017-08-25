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

					expect(response).to.be.null;

					done();
				});
		});
	});
});
