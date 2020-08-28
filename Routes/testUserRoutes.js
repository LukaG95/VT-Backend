const express = require('express')
const cors = require('cors')

const authController = require('../Controllers/authController')
const testUserController = require('../Controllers/testUserController')

const router = express.Router()

router.use(cors())

router.get('/getUser', testUserController.protect, authController.getUser)
router.get('/aggregateUsers', testUserController.protect, testUserController.adminOnly, testUserController.aggregateUsers)

router.post('/login', testUserController.login)
router.post('/createUser', testUserController.protect, testUserController.adminOnly, testUserController.createUser)

router.delete('/deleteUser', testUserController.protect, testUserController.adminOnly, testUserController.deleteUser)

module.exports = router