const rateLimit = require('express-rate-limit');

module.exports = function (max, windowS){
	return rateLimit({
		windowMs: windowS * 1000, // 30 seconds
		max: max, // limit each IP to 5 requests per windowMs
		headers: false,
		message: { status: 'blocked' },
	});
}
