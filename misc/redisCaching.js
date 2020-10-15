<<<<<<< HEAD
/*
=======

>>>>>>> efa3ece8a8f1979145e4cec11cdf937611aac9a1
const redis = require('redis')
const util = require('util')

const redisUrl = 'redis://127.0.0.1:6379'
<<<<<<< HEAD
//const client = redis.createClient(redisUrl)
const client = redis.createClient(6379)
=======
const client = redis.createClient(redisUrl)
// const client = redis.createClient(6379)
>>>>>>> efa3ece8a8f1979145e4cec11cdf937611aac9a1

client.get = util.promisify(client.get)

exports.cache = (name, value, time = 86400) => {
  client.set(name, JSON.stringify(value), 'EX', time)
}

exports.isCached = async (key) => {
  const stored = client.get(key)
  if (stored) return stored

  return null
}

exports.removeKey = async (key) => {
  client.del(key)
}

exports.removeAll = async () => {
  client.flushall()
}
<<<<<<< HEAD
*/
=======
>>>>>>> efa3ece8a8f1979145e4cec11cdf937611aac9a1
