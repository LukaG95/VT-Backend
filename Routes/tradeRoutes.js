const express = require('express')

const authController = require('../Controllers/authController')
const tradesController = require('../Controllers/tradesController')
const repController = require('../Controllers/repController')

const router = express.Router()

router.get('/getTrades', tradesController.getTrades)
router.get('/getUserTrades', authController.protect, tradesController.getUserTrades)
router.get('/getTrade/:tradeId', authController.protect, tradesController.getTrade)

router.post('/createTrade', authController.protect, tradesController.createTrade)
router.post('/editTrade', authController.protect, tradesController.editTrade)

router.put('/bumpTrade', authController.protect, tradesController.bumpTrade)

router.delete('/deleteTrade', authController.protect, tradesController.deleteTrade)
router.delete('/deleteTrades', authController.protect, tradesController.deleteTrades)

module.exports = router
