const express = require('express');

const authController = require('../Controllers/authController');
const tradesController = require('../Controllers/tradesController');
const repController = require('../Controllers/repController');
const limiter = require('../misc/rateLimiter');

const router = express.Router();

router.get('/getTrades', tradesController.getTrades, repController.getReputation_compactV2_middleware);
router.get('/getUserTrades', authController.protect, tradesController.getUserTrades, repController.getReputation_compactV2_middleware);
router.get('/getTrade/:tradeId', authController.protect, tradesController.getTrade);

router.post('/createTrade', limiter(15, 60), authController.protect, authController.activatedAccountOnly, tradesController.createTrade);
router.post('/editTrade', limiter(10, 60), authController.protect, tradesController.editTrade);

router.put('/bumpTrade', limiter(15, 60), authController.protect, tradesController.bumpTrade);

router.delete('/deleteTrade', limiter(15, 60), authController.protect, tradesController.deleteTrade);
router.delete('/deleteTrades', limiter(10, 60), authController.protect, tradesController.deleteTrades);

module.exports = router;
