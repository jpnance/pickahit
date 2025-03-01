const dotenv = require('dotenv').config({ path: '/app/.env' });

const mongoose = require('mongoose');
const mongoUri = process.env.MONGODB_URI || null;

mongoose.connect(mongoUri);

const User = require('./models/User');

User.find({}).then(handleUsers).then(console.log).then(disconnect);

function handleUsers(users) {
	return Promise.all(users.map(convertUsername));
}

function disconnect() {
	mongoose.disconnect();
	process.exit();
}

function convertUsername(user) {
	const { firstName, lastName } = user;
	const newUsername = [firstName, lastName].join('-').toLowerCase().replace(/[']/g, '').replace(/ .*/, '');

	user.username = newUsername;

	return user.save();
}
