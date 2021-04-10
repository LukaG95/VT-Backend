const rateLimit = require("express-rate-limit");

const RedisStore = require("rate-limit-redis");

const redisClient = require("./redisCaching").client;

// const Redis = require("ioredis");
// const client = new Redis("/tmp/redis.sock");

// let max;

// if (process.env.NODE_ENV === "test") max = 1000;
// else max = 5;

const limiter = function(max, seconds) {
    return rateLimit({
        store: new RedisStore({
            client: redisClient,
            expiry: seconds
          }),
        windowMs: seconds * 1000, // seconds
        max, // limit each IP to x requests per windowMs
        headers: false,
        message: { status: "blocked" },
    });

} 



module.exports = limiter;
