const redis = require("redis");
const util = require("util");

//const redisUrl = 'redis://127.0.0.1:6379'
const redisUrl = process.env.REDIS_URL;
const client = redis.createClient(redisUrl);
// const client = redis.createClient(6379)

client.get = util.promisify(client.get);

exports.cache = (name, value, time = 86400) => {
    client.set(name, JSON.stringify(value), "EX", time);
};

exports.isCached = async (key) => {
    const stored = client.get(key);
    if (stored) return stored;

    return null;
};

exports.removeKey = async (key) => {
    client.del(key);
};

exports.removeAll = async () => {
    client.flushall();
};
