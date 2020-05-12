const express = require('express');

const router = express.Router();

const authController = require('../Controllers/authController');
const tradesController = require('../Controllers/tradesController');

router.route('/getTrades')
    .get(tradesController.getTrades);

router.route('/createTrade')
    .post(authController.protect, tradesController.createTrade);


module.exports = router;
