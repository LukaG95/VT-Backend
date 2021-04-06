const rateLimit = require("express-rate-limit");

// let max;

// if (process.env.NODE_ENV === "test") max = 1000;
// else max = 5;

const limiter = function(max, seconds) {
    return rateLimit({
        windowMs: seconds * 1 * 1000, // seconds
        max, // limit each IP to x requests per windowMs
        headers: false,
        message: { status: "blocked" }
    });

} 



module.exports = limiter;
