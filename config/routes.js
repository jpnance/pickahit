var users = require('../services/users');

module.exports = function(app) {
	app.post('/users', users.signUp);
};

