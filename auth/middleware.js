var apiRequest = require('superagent');
var User = require('../models/User');

/**
 * Attaches session and user to request if logged in.
 * Always calls next() - doesn't block unauthenticated users.
 * Use on all routes via app.use().
 */
async function attachSession(req, res, next) {
	req.session = null;

	if (!req.cookies.sessionKey) {
		return next();
	}

	try {
		var request = apiRequest
			.post(process.env.LOGIN_SERVICE_INTERNAL + '/sessions/retrieve')
			.send({ key: req.cookies.sessionKey });

		// In development, allow self-signed certificates for local login service
		if (process.env.NODE_ENV === 'dev') {
			request.disableTLSCerts();
		}

		var response = await request;

		if (response.body?.user) {
			var user = await User.findOne({ username: response.body.user.username });

			if (user) {
				req.session = { username: user.username, user: user };
			}
		}
	} catch (err) {
		// Log but don't crash - treat as unauthenticated
		console.error('Auth service error:', err.message);
	}

	next();
}

/**
 * Requires a logged-in user. Redirects to /login if not.
 * Use on specific routes: app.get('/profile', requireLogin, handler)
 */
function requireLogin(req, res, next) {
	if (!req.session) {
		return res.redirect('/login');
	}
	next();
}

/**
 * Requires an admin user. Redirects to / if not logged in or not admin.
 */
function requireAdmin(req, res, next) {
	if (!req.session || !req.session.user || !req.session.user.admin) {
		return res.redirect('/');
	}
	next();
}

module.exports = {
	attachSession: attachSession,
	requireLogin: requireLogin,
	requireAdmin: requireAdmin
};
