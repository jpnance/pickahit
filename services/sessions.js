var crypto = require('crypto');

var Session = require('../models/Session');
var User = require('../models/User');

module.exports.logIn = function(request, response) {
	if (request.body.username && request.body.password) {
		User.find({
			username: request.body.username,
			password: crypto.createHash('sha256').update(request.body.password).digest('hex')
		}, function(error, documents) {
			if (request.body.justVerify) {
				if (error) {
					response.send({ success: false, error: error.message });
				}
				else if (documents.length == 1) {
					var user = documents[0];
					response.send({ success: true, user: { username: user.username, displayName: user.displayName } });
				}
				else {
					response.send({ success: false, error: new Error('No clue really') });
				}

				return;
			}

			if (error) {
				response.send(error);
			}
			else if (documents.length == 1) {
				var sessionId = crypto.randomBytes(20).toString('hex');

				var sessionUpdate = {
					username: request.body.username,
					createdAt: Date.now()
				};

				var options = {
					upsert: true
				};

				if (request.cookies && request.cookies.sessionId) {
					sessionId = request.cookies.sessionId;
				}

				Session.findByIdAndUpdate(sessionId, sessionUpdate, options, function(error, session) {
					if (error) {
						response.send(error);
					}
					else {
						response.cookie('sessionId', sessionId).redirect('/');
					}
				});
			}
			else {
				response.status(400).send('Invalid username/password combination');
			}
		});
	}
	else {
		response.status(400).send('Invalid username/password combination');
	}
};

module.exports.logOut = function(request, response) {
	response.clearCookie('sessionId').redirect('/');
};
