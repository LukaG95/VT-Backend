const express = require('express')

const authController = require('../Controllers/authController')
const tradesController = require('../Controllers/tradesController')
const repController = require('../Controllers/repController')

const router = express.Router()

router.get('/getTrades', tradesController.getTrades)
router.get('/getTrade/:id', tradesController.getTrade)

router.post('/createTrade', authController.protect, repController.getRepMiddleware, tradesController.createTrade)
router.delete('/deleteTrade/', authController.protect, tradesController.deleteTrade)
router.put('/bumpTrade/:id', authController.protect, tradesController.bumpTrade)

module.exports = router
