var Session = require('../models/Session');
var User = require('../models/User');
var Game = require('../models/Game');

module.exports.showAll = function(request, response) {
	Session.withActiveSession(request, function(error, session) {
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

			if (session) {
				responseData.session = session;
			}

			response.render('index', responseData);
		});
	});
};

module.exports.showOne = function(request, response) {
	var data = [
		Game
			.findById(request.params.gameId)
			.populate('away.team')
			.populate('home.team')
			.populate('away.batters')
			.populate('home.batters')
			.populate('away.pitchers')
			.populate('home.pitchers')
			.populate('hits')
	];

	Promise.all(data).then(function(values) {
		var game = values[0];

		response.send(game);
	});
};
