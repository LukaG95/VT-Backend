const rateLimit = require('express-rate-limit');


const limiter = rateLimit({
    windowMs: 1 * 15 * 1000, // 15 seconds
    max: 5, // limit each IP to 5 requests per windowMs
    headers: false,
    message: { status: 'blocked' },
});

module.exports = limiter;
