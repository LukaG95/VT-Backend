const express = require('express');
const cors = require('cors');

const limiter = require('../misc/rateLimiter');
const passport = require('../misc/passport');
const authController = require('../Controllers/authController');
const testUserController = require('../Controllers/testUserController');

const envURL = process.env.NODE_ENV === "production" ? "https://virtrade.gg/" : "http://localhost:3000/";

const router = express.Router();

router.use(cors());
router.use(passport.initialize());

router.get('/getUser', authController.protect, authController.getUser);
router.get('/getUserById/:userId', authController.protect, authController.getUsernameById);
router.get('/getUserByUsername/:username', authController.getUserByUsername);
router.get('/getTestUsers', authController.protect, authController.adminOnly, authController.getTestUsers);

router.post('/getIdsByUsername/', authController.getIdsByUsername);
router.post('/signup', limiter(3, 300), authController.signup);
router.post('/login', limiter(5, 30), authController.login);
router.post('/createTestUser', authController.protect, authController.adminOnly, authController.createTestUser);
router.delete('/deleteTestUser', authController.protect, authController.adminOnly, authController.deleteTestUser);

router.delete('/logout', authController.protect, authController.logout);

router.put('/updateUsername', authController.protect, authController.updateUsername);
router.put('/updatePassword', authController.protect, authController.updatePassword);

router.post('/sendUpdateEmailToken', limiter(2, 1800), authController.protect, authController.sendUpdateEmailToken);
router.put('/updateEmail', authController.protect, authController.updateEmail);

router.post('/resendSignupEmail', limiter(2, 1800), authController.protect, authController.resendSignupEmail);
router.put('/confirmEmail/', authController.confirmEmail);

router.post('/sendResetPasswordToken', limiter(2, 1800), authController.sendResetPasswordToken);
router.put('/resetPassword', authController.resetPassword);


router.get('/steam', limiter(5, 30), passport.authenticate('steam-login'));
router.get('/steam/return', passport.authenticate('steam-login'), authController.passportLoginOrCreate);

router.get('/discord', limiter(5, 30), passport.authenticate('discord'));
router.get('/discord/callback', passport.authenticate('discord'), authController.passportLoginOrCreate);

router.get('/linkDiscord', limiter(5, 30), authController.protect, (req, res, next) =>
    passport.authenticate('discord', {callbackURL: `${envURL}api/auth/linkDiscord/callback`})(req, res, next));
router.get('/linkDiscord/callback', authController.protect, authController.passportPlatformHelper, (req, res, next) =>
    passport.authenticate('discord', {callbackURL: `${envURL}api/auth/linkDiscord/callback`})(req, res, next), authController.passportLinkPlatform);

router.get('/linkSteam', limiter(5, 30), authController.protect, passport.authenticate('steam-link'));
router.get('/linkSteam/return', authController.protect, authController.passportPlatformHelper, 
    passport.authenticate('steam-link'), authController.passportLinkPlatform);

router.get('/xbox', limiter(5, 30), authController.protect, passport.authenticate('xbox'));
router.get('/xbox/callback', authController.protect, authController.passportPlatformHelper, passport.authenticate('xbox'), authController.passportLinkPlatform);


router.post('/linkPlatform', limiter(10, 30), authController.protect, authController.linkPlatform);
router.delete('/linkPlatform', limiter(10, 30), authController.protect, authController.unlinkPlatform);
router.get('/getPlatformUnverifiedUsers', authController.getPlatformUnverifiedUsers);
router.post('/verifyPlatformUser', authController.verifyPlatformUser);





module.exports = router;