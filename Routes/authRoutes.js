const express = require('express');

const router = express.Router();

const passport = require('../misc/passport');


const authController = require('../Controllers/authController');


router.use(passport.initialize());

router.route('/signup')
    .post(authController.signup);


router.route('/login')
    .post(authController.login);


router.route('/steam')
    .get(passport.authenticate('steam'));

router.route('/steam/return')
    .get(passport.authenticate('steam'), authController.passportLoginOrCreate);


router.route('/discord')
    .get(passport.authenticate('discord'));

router.route('/discord/callback')
    .get(passport.authenticate('discord'), authController.passportLoginOrCreate);


router.route('/getUser')
    .get(authController.getUser);

module.exports = router;
