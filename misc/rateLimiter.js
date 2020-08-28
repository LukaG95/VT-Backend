const rateLimit = require('express-rate-limit');


const limiter = rateLimit({
    windowMs: 1 * 30 * 1000, // 30 seconds
    max: 5, // limit each IP to 5 requests per windowMs
    headers: false,
    message: { status: 'blocked' },
});

module.exports = limiter;
