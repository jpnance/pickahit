var Session = require('../models/Session');
var User = require('../models/User');
var Game = require('../models/Game');

module.exports.showAll = function(request, response) {
	var data = [
		User.find({}).sort({ username: 1 }),
		Game.find({}).sort({ startTime: 1 }).populate('away.team').populate('home.team')
	];

	Promise.all(data).then(function(values) {
		var responseData = {
			users: values[0].filter(function(user) {
				return user.isEligibleFor(2017);
			}),
			games: values[1],
			dateFormat: require('dateformat')
		};

		if (request.cookies.sessionId) {
			Session.find({
				_id: request.cookies.sessionId
			}).populate('user').exec(function(error, sessions) {
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
