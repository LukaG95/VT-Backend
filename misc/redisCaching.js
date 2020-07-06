const redis = require('redis');
const util = require('util');

const redisUrl = 'redis://127.0.0.1:6379';
const client = redis.createClient(redisUrl);



client.get = util.promisify(client.get);


exports.cache = (name, value, time) => {
    if (time) {
        client.set(name, JSON.stringify(value), 'EX', time);
    } else {
        client.set(name, JSON.stringify(value), 'EX', 86400);
    }
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