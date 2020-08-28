const cookieParser = require('cookie-parser')
const express = require('express')
const cors = require('cors')

const TradeRouter = require('../Routes/tradeRoutes')
const AuthRouter = require('../Routes/authRoutes')
const RepRouter = require('../Routes/repRoutes')
const TestUserRouter = require('../Routes/testUserRoutes')
const errorController = require('../misc/errorController')

module.exports = function(app){
  app.set('trust proxy', 1)

  app.use(cors())
  app.use(express.json())
  app.use(cookieParser())

  app.use('/api/trades/', TradeRouter)
  app.use('/api/auth/', AuthRouter)
  app.use('/api/test', TestUserRouter)
  app.use('/api/reputation', RepRouter)

  app.use(errorController)
}
