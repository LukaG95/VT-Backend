require('express-async-errors')
require('winston-mongodb')     

const { createLogger, format, transports } = require('winston')
const { combine, timestamp, prettyPrint } = format

module.exports = createLogger({
  format: combine(
    timestamp(),
    prettyPrint()
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: './errorLogs/logfile.log' })
    /*new transports.MongoDB({
      db: 'mongodb://localhost/vidly'
    })*/
  ],
  exceptionHandlers: [
    new transports.Console({colorize: true, prettyPrint: true}),
    new transports.File({ filename: './errorLogs/exceptions.log' })
  ],
  rejectionHandlers: [
    new transports.Console({colorize: true, prettyPrint: true}),
    new transports.File({ filename: './errorLogs/rejections.log'}),
  ]
})

