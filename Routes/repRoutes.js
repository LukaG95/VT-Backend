const express = require('express')
const router = express.Router()

const authController = require('../Controllers/authController')
const repController = require('../Controllers/repController')

router.get('/top10', repController.getTop10)
router.get('/:user', repController.getReputation)

router.post('/addRep/:user', authController.protect, authController.getUser, repController.addReputation)


module.exports = router
