const express = require('express');
const cors = require('cors');

const limiter = require('../misc/rateLimiter');
const passport = require('../misc/passport');
const authController = require('../Controllers/authController');
const testUserController = require('../Controllers/testUserController');

const envURL = process.env.HOST === "heroku" ? "https://www.virtrade.gg/" : "http://localhost:3000/";

const router = express.Router();

router.use(cors());
router.use(passport.initialize());

router.get('/getUser', authController.protect, authController.getUser);
router.get('/getUserById/:userId', authController.protect, authController.getUsernameById);
router.get('/getUserByUsername/:username', authController.getUserByUsername);
router.get('/getTestUsers', authController.protect, authController.adminOnly, authController.getTestUsers);

router.post('/getIdsByUsername/', authController.getIdsByUsername);
router.post('/signup', limiter, authController.signup);
router.post('/login', limiter, authController.login);
router.post('/createTestUser', authController.protect, authController.adminOnly, authController.createTestUser);
router.delete('/deleteTestUser', authController.protect, authController.adminOnly, authController.deleteTestUser);

router.delete('/logout', authController.protect, authController.logout);

router.put('/updateUsername', authController.protect, authController.updateUsername);
router.put('/updatePassword', authController.protect, authController.updatePassword);
router.put('/updateEmail', authController.protect, authController.updateEmail);

router.get('/steam', passport.authenticate('steam-login'));
router.get('/steam/return', passport.authenticate('steam-login'), authController.passportLoginOrCreate);

router.get('/discord', passport.authenticate('discord'));
router.get('/discord/callback', passport.authenticate('discord'), authController.passportLoginOrCreate);

router.get('/linkDiscord', authController.protect, (req, res, next) =>
    passport.authenticate('discord', {callbackURL: `${env}api/auth/linkDiscord/callback`})(req, res, next));
router.get('/linkDiscord/callback', authController.protect, authController.passportPlatformHelper, (req, res, next) =>
    passport.authenticate('discord', {callbackURL: `${env}api/auth/linkDiscord/callback`})(req, res, next), authController.passportLinkPlatform);

router.get('/linkSteam', authController.protect, passport.authenticate('steam-link'));
router.get('/linkSteam/return', authController.protect, authController.passportPlatformHelper, 
    passport.authenticate('steam-link'), authController.passportLinkPlatform);

router.get('/xbox', authController.protect, passport.authenticate('xbox'));
router.get('/xbox/callback', authController.protect, authController.passportPlatformHelper, passport.authenticate('xbox'), authController.passportLinkPlatform);

router.put('/confirmEmail/', authController.confirmEmail);

router.post('/sendResetPasswordToken', authController.sendResetToken);

router.put('/resetPassword', authController.resetPassword);

router.post('/sendResetEmailToken', authController.protect, authController.sendResetEmail);


router.post('/linkPlatform', authController.protect, authController.linkPlatform);
router.delete('/linkPlatform', authController.protect, authController.unlinkPlatform);
router.get('/getPlatformUnverifiedUsers', authController.getPlatformUnverifiedUsers);
router.post('/verifyPlatformUser', authController.verifyPlatformUser);

// router.post('/resendCode', authController.protect, authController.resendCode)

module.exports = router;