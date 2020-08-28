const crypto = require("crypto")

const TestUser = require("../Models/testUserModel")

const catchAsync = require('../misc/catchAsync')

const jwt = require('jsonwebtoken')
const AppError = require("../misc/AppError")

const { promisify } = require('util')


const createToken = (id, code = 0) => jwt.sign({ id, code }, process.env.JWT_SECRET, {
  expiresIn: process.env.JWT_EXPIRES_IN,
})

const decodeToken = async (token) => promisify(jwt.verify)(token, process.env.JWT_SECRET)


const createSendToken = (user, res, option) => {
  const token = createToken(user._id)

  const cookieSettings = {
    expires: new Date(
      Date.now() + 1 * 86400 * 1000,
    ),
    httpOnly: true,
  }

  if (process.env.NODE_ENV === 'production') cookieSettings.secure = true

  res.cookie('test', token, cookieSettings)

  return res.json({ status: 'success' })
}

exports.createUser = catchAsync(async (req, res, next) => {
  const { username } = req.body
  const password = crypto.randomBytes(8).toString('hex')

  const user = new TestUser({ username, password })
  await user.save()

  return res.json({ status: 'success' })
})

exports.deleteUser = catchAsync(async (req, res, next) => {
  const { username } = req.body
  await TestUser.deleteOne({ username })

  return res.json({ status: 'success' })
})

exports.aggregateUsers = catchAsync(async (req, res, next) => {
  const users = await TestUser.find({ role: 'user' }).select('-_id -__v')

  return res.json(users)
})

exports.login = catchAsync(async (req, res, next) => {
  const { username, password } = req.body
  const user = await TestUser.findOne({ username })
  console.log(req.body)
  if (!user || user.password != password) return next(new AppError('error'))

  return createSendToken(user, res)
})

exports.protect = catchAsync(async (req, res, next) => {
  const token = req.cookies.test
  if (!token) return next(new AppError('unauthorized'))

  const decoded = await decodeToken(token)

  const user = await TestUser.findById(decoded.id).select('-__v -password')

  req.user = user
  next()
})

exports.adminOnly = catchAsync(async (req, res, next) => {
  const { user } = req
  if (user.role !== 'admin') return next(new AppError('notAllowed'))

  next()
})