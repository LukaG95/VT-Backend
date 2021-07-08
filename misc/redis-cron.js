// const redis = require('./redisCaching').client;

const redis = require('redis').createClient()
const cronJob = require('cron-cluster')(redis).CronJob;


const { updateBumpedTime } = require('../Controllers/tradesController');



// Bump 24 hours old trades every 30 seconds
function doCron () {
    var job = new cronJob('*/30 * * * * *', async () => {
      // Do some stuff here

      const res = await updateBumpedTime();
      if (res && res.nModified > 0) console.log(`Bumped ${res.nModified} trades!`);
    })
    job.start()
  }

module.exports = doCron;

