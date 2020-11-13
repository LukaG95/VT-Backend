const rateLimit = require("express-rate-limit");

let max;

if (process.env.NODE_ENV === "test") max = 1000;
else max = 5;

const limiter = rateLimit({
    windowMs: 1 * 30 * 1000, // 30 seconds
    max: max, // limit each IP to 5 requests per windowMs
    headers: false,
    message: { status: "blocked" }
});

module.exports = limiter;
