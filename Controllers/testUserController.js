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

exports.protect = catchAsync(async (req, res, next) => { 
  const token = req.cookies.test
  if (!token) return res.status(401).json({info: "unauthorized", message: "no token provided"})

  try{
    const decoded = await decodeToken(token)
    req.user = decoded

    next()
  } catch {
    res.status(400).send('Invalid token.')
  }
})

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
   // .then(result => res.json({ status: `Deleted ${result.deletedCount} item.`}))
   // .catch(err => res.json({ status: `Delete failed with error: ${err}`}))
      
  return res.json({ status: 'success', info: username})
})

exports.login = catchAsync(async (req, res, next) => {
  const { username, password } = req.body
  const user = await TestUser.findOne({ username })
  
  if (!user || user.password != password) return next(new AppError('error'))

  return createSendToken(user, res)
})

exports.getTestUser = catchAsync(async (req, res, next) => { 
  const test_user = await TestUser.findById(req.user.id).select('-__v')
  
  return res.status(200).json({info: "success", message: "successfully got test user", user: test_user})
})


exports.adminOnly = catchAsync(async (req, res, next) => {
  const test_user = await TestUser.findById(req.user.id).select('-__v')
  
  if (test_user.role !== 'admin') 
  return res.status(403).json({info: "forbidden", message: "looks like you don't have the permission to access this floor"})

  next()
})

exports.aggregateUsers = catchAsync(async (req, res, next) => {
  const testers = await TestUser.find({ }).select('-_id -__v')

  return res.json({testers})
})