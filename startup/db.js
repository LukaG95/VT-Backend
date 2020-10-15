const mongoose = require('mongoose')
const logger = require('./logging')

<<<<<<< HEAD
module.exports = function(){
=======
module.exports = function () {
>>>>>>> efa3ece8a8f1979145e4cec11cdf937611aac9a1
  /*const DB = process.env.DATABASE.replace(
    '<PASSWORD>',
    process.env.DATABASE_PASSWORD,
  )*/
  let DB
  if (process.env.NODE_ENV === "test")
    DB = process.env.DATABASE_TEST
  else
    DB = process.env.DATABASE

  mongoose.connect(DB, {
    useNewUrlParser: true,
<<<<<<< HEAD
    useCreateIndex: true
    // useUnifiedTopology: true
  })
  .then(() => process.env.NODE_ENV !== "test" && logger.info(`Connected to ${DB}.`))
=======
    useCreateIndex: true,
    // useUnifiedTopology: true
  })
    .then(() => process.env.NODE_ENV !== "test" && logger.info(`Connected to ${DB}.`))
>>>>>>> efa3ece8a8f1979145e4cec11cdf937611aac9a1
}
