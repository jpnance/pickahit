var Session = require('../models/Session');
var User = require('../models/User');
var Game = require('../models/Game');

module.exports.showAll = function(request, response) {
	var data = [
		User.find({}).sort({ username: 1}),
		Game.find({}).sort({ startTime: 1 }).populate('awayTeam').populate('homeTeam')
	];

	Promise.all(data).then(function(values) {
		var responseData = {
			users: values[0],
			games: values[1]
		};

		if (request.cookies.sessionId) {
			Session.find({
				_id: request.cookies.sessionId
			}, function(error, sessions) {
				if (error) {
					response.send(error);
				}
				else if (sessions.length == 1) {
					responseData.session = sessions[0];
					response.render('index', responseData);
				}
				else {
					response.render('index', responseData);
				}
			});
		}
		else {
			response.render('index', responseData);
		}
	});
};
