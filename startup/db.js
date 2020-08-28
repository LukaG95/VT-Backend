const mongoose = require('mongoose')
const logger = require('./logging')

module.exports = function(){
  /*const DB = process.env.DATABASE.replace(
    '<PASSWORD>',
    process.env.DATABASE_PASSWORD,
  )*/

  const DB = process.env.DATABASE

  mongoose.connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true
    // useUnifiedTopology: true
  })
  .then(() => logger.info(`Connected to ${DB}...`))
}
