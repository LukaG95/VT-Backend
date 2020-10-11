const jwt = require('jsonwebtoken')
const crypto = require("crypto")
const { promisify } = require('util')

const EmailingSystem = require('../misc/EmailingSystem')
const catchAsync = require('../misc/catchAsync')
const AppError = require('../misc/AppError')
const { User, validateSignup, validateLogin, validateUsername } = require('../Models/userModel')
const { TestUser } = require("../Models/testUserModel")
const Reputation = require('../Models/repModel')
const user = require('../Models/userModel') // this is here because of jest tests


const createToken = (id, code = 0, email) => jwt.sign({ id, code, email }, process.env.JWT_SECRET, {
  expiresIn: process.env.JWT_EXPIRES_IN,
})

const decodeToken = async (token) => promisify(jwt.verify)(token, process.env.JWT_SECRET)

const createSendToken = (user, res, option) => {
  const expires = process.env.JWT_EXPIRES_IN.slice(0, -1) // Delete 'd' from the end
  const token = createToken(user._id)

  const cookieSettings = {
    expires: new Date(
      Date.now() + expires * 86400 * 1000,
    ),
    httpOnly: true,
  }

  if (process.env.NODE_ENV === 'production') cookieSettings.secure = true

  res.cookie('jwt', token, cookieSettings)

  if (option === 'redirect') {
    return res.redirect('/')
  }

  return res.status(200).json({ info: 'success', message: 'successfully added jwt cookie' })
}

exports.protect = async (req, res, next) => {
  const token = req.cookies.jwt
  if (!token) return res.status(401).json({ info: "unauthorized", message: "No token provided" })

  try {
    const decoded = await decodeToken(token)
    req.user = decoded

    next()
  } catch {
    return res.status(400).json('Invalid token.')
  }
}

// GET api/auth/getUser
exports.getUser = async (req, res, next) => {
  const user = await User.findById(req.user.id).select('-__v')

  return res.status(200).json({ info: "success", message: "successfully got user", user: user })
}

// GET api/auth/getUserByUsername
exports.getUserByUsername = async (req, res, next) => {
  const { username } = req.params
  // if (!username) return res ...

  let regex = new RegExp(["^", username, "$"].join(""), "i") // make the search case insensitive
  const user = await User.find({ username: regex }, { _id: 1 })
  if (user.length < 1) return res.status(400).json({ info: "no user", message: `user was not found by the name of ${username}` })

  return res.status(200).json({ info: "success", message: "successfully got user", user: user[0] })
}

// POST api/auth/login
exports.login = async (req, res, next) => {
  const { email, password } = req.body

  const { error } = validateLogin(req.body)
  if (error) return res.status(400).json({ info: "invalid credentials", message: error.details[0].message })

  const query = parseEmail(email) === true ? { email } : { username: email }
  const user = await User.findOne(query).select('+password')

  if (!user || !(await user.correctPassword(password, user.password))) {
    return res.status(400).json({ info: "logorpass", message: "credentials don't match any users" })
  }

  return createSendToken(user, res)
}

// POST api/auth/signup
exports.signup = async (req, res, next) => {
  let { username, email, password, passwordConfirm } = req.body

  const { error } = validateSignup(req.body)
  if (error) return res.status(400).json({ info: "invalid credentials", message: error.details[0].message })

  let result = await user.validateEmail(email)
  if (!result) return res.status(400).json({ info: "email", message: "this email is taken" })

  result = await user.validateUsername(username)
  if (!result) return res.status(400).json({ info: "username", message: "this username is taken" })

  const newUser = await User.create({
    username, email, password, passwordConfirm
  })

  // await sendSignupEmail(newUser)
  return createSendToken(newUser, res)
}

// POST api/auth/createTestUser
exports.createTestUser = async (req, res, next) => {
  const { username } = req.body

  const password = crypto.randomBytes(8).toString('hex')

  const user = new TestUser({ username, password })
  await user.save()

  return res.json({ status: 'success', message: 'successfully created a test user' })
}

// GET api/auth/getTestUsers
exports.getTestUsers = async (req, res, next) => {
  const testers = await TestUser.find({}).select('-_id -__v')

  return res.status(200).json({ info: "success", message: "successfully got all test user", testers })
}

// DELETE api/auth/deleteTestUser
exports.deleteTestUser = async (req, res, next) => {
  const { username } = req.body

  await TestUser.deleteOne({ username })
  // .then(result => res.json({ status: `Deleted ${result.deletedCount} item.`}))
  // .catch(err => res.json({ status: `Delete failed with error: ${err}`}))

  return res.json({ status: 'success', info: `test user ${username} was deleted` })
}

// MIDDLEWARE
exports.adminOnly = async (req, res, next) => {
  const user = await User.findById(req.user.id).select('-__v')

  if (user.role !== 'admin')
    return res.status(403).json({ info: "forbidden", message: "looks like you don't have the permission to access this floor" })

  next()
}

exports.passportLoginOrCreate = async (req, res, next) => {
  const { user } = req
  let passportUser
  let loginMethod = user.method
  let username = user.username


  // Checks if user already exists in DataBase
  passportUser = await User.findOne({ [loginMethod]: user.id })


  if (passportUser) {
    return createSendToken(passportUser, res, 'redirect')
  }

  // Checks if username is available
  let registeredUser = await validateUsername(username)

  // If not, Slice username to 12 char + add 4 random numbers
  if (!registeredUser) username = username.slice(0, 12) + genNumber(4)


  // Checks if its still available after adding 4 random numbers. Just in case
  registeredUser = await validateUsername(username)
  if (!registeredUser) return res.status(400).json({ info: "error", message: "Taken username. Please try again!" });

  // Create user
  passportUser = await User.create({ [loginMethod]: user.id, username, activatedAccount: true })

  return createSendToken(passportUser, res, 'redirect')
}

// PUT api/auth/confirmEmail
exports.confirmEmail = catchAsync(async (req, res, next) => {
  const { code } = req.body
  const decodedCode = await decodeToken(code)

  const userDB = await User.findById(decodedCode.id).select('verificationToken')
  if (!userDB) return next(new AppError())

  const result = await userDB.compareTokens(decodedCode.code, userDB.verificationToken)

  if (result === true && !userDB.confirmedEmail) {
    userDB.confirmedEmail = true
    userDB.verificationToken = null
    await userDB.save()
    return res.json({ status: 'success' })
  }

  next(new AppError('OldOrInvalid'))
})

// exports.resendCode = catchAsync(async (req, res, next) => {
//     const { user } = req

//     if (user.confirmedEmail === true) return next(new AppError())

//     await sendEmail(user)
//     return res.json({ status: 'success' })
// })

// DELETE api/auth/logout
exports.logout = catchAsync(async (req, res, next) => {
  res.clearCookie('jwt')

  return res.json({ status: 'success' })
})

// PUT api/auth/updateUsername
exports.updateUsername = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('-__v')
  const { newUsername } = req.body

  // Find user, if user exists change his username if new one matches the regex and hasn't been changed in the past 30 days
  if (!newUsername || !newUsername.match(/^(?!.*[ ]{2,})[a-zA-Z0-9 _-]{2,15}$/gm)) return next(new AppError(1))

  if (user.usernameChangedAt > new Date(Date.now() - 86400 * 1000)) return next(new AppError('days30'))

  const validateName = await User.findOne({ username: newUsername }).collation({ locale: "en", strength: 2 })
  if (validateName) return next(new AppError('username'))

  user.username = newUsername
  user.usernameChangedAt = Date.now()

  await user.save()

  return res.json({ status: 'success' })
})

// PUT api/auth/updateEmail
exports.updateEmail = catchAsync(async (req, res, next) => {
  const { code } = req.body
  const decodedCode = await decodeToken(code)

  const user = await User.findById(decodedCode.id).select('-__v +verificationToken')
  if (!user) return next(new AppError('error1'))

  const takenEmail = await User.findOne({ email: decodedCode.email }).collation({ locale: "en", strength: 2 })
  if (takenEmail || !decodedCode.email) return next(new AppError('email'))

  user.email = decodedCode.email
  await user.save()

  return res.json({ status: 'success', username: user.username, newEmail: decodedCode.email })
})

// POST api/auth/sendResetEmailToken
exports.sendResetEmail = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('-__v')
  const { newEmail } = req.body

  const takenEmail = await User.findOne({ email: newEmail }).collation({ locale: "en", strength: 2 })
  if (takenEmail) return next(new AppError('email'))

  if (!newEmail || !parseEmail(newEmail)) {
    return next(new AppError('error'))
  }

  await sendEmailUpdateEmail(user, newEmail)

  return res.json({ status: 'success' })
})

// PUT api/auth/updatePassword
exports.updatePassword = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('-__v')
  const { password, passwordConfirm, newPassword } = req.body
  const userDB = await User.findById(user._id).select('+password')

  if (newPassword.match(/^[\!@#$%^&*()\\[\]{}\-_+=~`|:"'<>,./?a-zA-Z0-9]{4,30}$/gm) && (await userDB.correctPassword(password, userDB.password))) {
    userDB.password = newPassword
    await userDB.save()

    return res.json({ status: 'success' })
  }

  return next(new AppError('error'))
})

// POST api/auth/sendResetPasswordToken
exports.sendResetToken = catchAsync(async (req, res, next) => {
  const { email } = req.body
  const user = await User.findOne({ email }).collation({ locale: "en", strength: 2 })

  if (!user.confirmedEmail) return next(new AppError('invalid'))
  await sendPasswordResetEmail(user)

  return res.json({ status: 'success' })
})

// PUT api/auth/resetPassword
exports.resetPassword = catchAsync(async (req, res, next) => {
  const { code, password, passwordConfirm } = req.body
  const decodedCode = await decodeToken(code)
  const user = await User.findById(decodedCode.id).select('-__v +verificationToken')

  if (await user.compareTokens(decodedCode.code, user.verificationToken) && password === passwordConfirm && user.confirmedEmail) {
    user.password = password
    user.verificationToken = null
    await user.save()
    return res.json({ status: 'success' })
  }

  if (!user.confirmedEmail) return next(new AppError('invalid'))
})

async function sendSignupEmail(user) {
  const emailToken = await user.generateEmailToken()
  await user.save()
  const token = await createToken(user._id, emailToken)
  const Email = new EmailingSystem({ email: user.email })
    .sendSignup(token)
  await Email
}

async function sendPasswordResetEmail(user) {
  const emailToken = await user.generateEmailToken()
  await user.save()
  const token = await createToken(user._id, emailToken)
  const Email = new EmailingSystem({ email: user.email })
    .sendPasswordReset(token)
  await Email
}

async function sendEmailUpdateEmail(user, newEmail) {
  const emailToken = await user.generateEmailToken()
  await user.save()
  const token = await createToken(user._id, emailToken, newEmail)
  const Email = new EmailingSystem({ email: user.email })
    .sendEmailUpdate(token)
  await Email
}

function parseEmail(email) {
  var regex = /^[^\s@]+@[^\s@\.]+(\.[^\s@.]+)+$/

  return regex.test(email)
}

function genNumber(times = 1) {
  let num = ''

  for (let i = 0; i < times; i++) {
    let j = Math.round(Math.random() * (9 - 0) + 0)
    num = num + j
  }

  return num
}



exports.createToken = createToken