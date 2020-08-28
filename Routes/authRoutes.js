const express = require('express')
//const cors = require('cors')

const limiter = require('../misc/rateLimiter')
const passport = require('../misc/passport') 
const authController = require('../Controllers/authController')

const router = express.Router()

//router.use(cors())
// router.use(passport.initialize())

router.post('/signup', limiter, authController.signup)
router.post('/login', limiter, authController.login)

router.delete('/logout', authController.protect, authController.logout)

router.put('/updateUsername', authController.protect, authController.updateUsername)
router.put('/updatePassword', authController.protect, authController.updatePassword)

// router.get('/steam', passport.authenticate('steam'))
// router.get('/steam/return', passport.authenticate('steam'), authController.passportLoginOrCreate)

// router.get('/discord', passport.authenticate('discord'))
// router.get('/discord/callback', passport.authenticate('discord'), authController.passportLoginOrCreate)

router.get('/getUser', authController.protect, authController.getUser)

router.put('/confirmEmail/', authController.confirmEmail)

router.post('/sendResetPasswordToken', authController.sendResetToken)

router.put('/resetPassword', authController.resetPassword)

router.post('/sendResetEmailToken', authController.protect, authController.sendResetEmail)
router.put('/updateEmail', authController.protect, authController.updateEmail)

// router.post('/resendCode', authController.protect, authController.resendCode)

module.exports = router
