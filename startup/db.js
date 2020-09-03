const mongoose = require('mongoose')
const logger = require('./logging')

module.exports = function(){
  /*const DB = process.env.DATABASE.replace(
    '<PASSWORD>',
    process.env.DATABASE_PASSWORD,
  )*/
  let DB
  if (process.env.NODE_ENV === "test")
    DB = process.env.DATABASE_TEST
  else
    DB = process.env.DATABASE
  
  console.log(DB)

  mongoose.connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true
    // useUnifiedTopology: true
  })
  .then(() => logger.info(`Connected to ${DB}.`))
}
