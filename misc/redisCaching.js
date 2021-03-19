const redis = require("redis");
const util = require("util");

//const redisUrl = 'redis://127.0.0.1:6379'
const redisUrl = process.env.REDIS_URL
const client = redis.createClient(redisUrl)


// const client = redis.createClient(6379)

// Make redis functions promise based
  client.get = util.promisify(client.get);
  client.hget = util.promisify(client.hget);
  client.del = util.promisify(client.del);
  client.hdel = util.promisify(client.hdel);
  client.set = util.promisify(client.set);
  client.hset = util.promisify(client.hset);
//


// Clear online status db on startup
  client.del('status');
//

exports.cache = async (name, value, time = 86400) => {
  client.set(name, JSON.stringify(value), 'EX', time)
}

exports.cacheNested = async (key, id, value) => {
  client.hset(key, id, value);
}

exports.isCached = async (key) => {
    const stored = client.get(key);
    if (stored) return stored;

    return null;
};

exports.isCachedNested = async (key, id) => {
  const stored = client.hget(key,id);
  if (stored) return stored;

  return null;
}

exports.removeKey = async (key) => {
    client.del(key);
};

exports.removeKeyNested = async (key, id, value) => {
  client.hdel(key, id, value)
}

exports.removeAll = async () => {
  client.flushall()
}
