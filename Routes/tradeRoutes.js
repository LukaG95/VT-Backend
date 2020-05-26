const express = require('express');

const router = express.Router();

const authController = require('../Controllers/authController');
const tradesController = require('../Controllers/tradesController');
const repController = require('../Controllers/repController');

router.route('/getTrades')
    .get(tradesController.getTrades);

router.route('/createTrade')
    .post(authController.protect, repController.getRepMiddleware,
        tradesController.createTrade);

router.route('/deleteTrade/')
    .delete(authController.protect, tradesController.deleteTrade);


module.exports = router;
