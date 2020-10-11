const express = require('express')
//const cors = require('cors')

const testUserController = require('../Controllers/testUserController')

const router = express.Router()

//router.use(cors())

router.get('/getUser', testUserController.protect, testUserController.getTestUser)
router.post('/login', testUserController.login)

module.exports = router