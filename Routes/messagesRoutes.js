const express = require('express')

const authController = require('../Controllers/authController')
const messagesController = require('../Controllers/messagesController')

const router = express.Router()

router.get('/', authController.protect, messagesController.getMessages)

router.get('/:recipientId', authController.protect, messagesController.getMessagesWithUser)

router.post('/message', authController.protect, messagesController.sendMessage)

router.put('/message', authController.protect, messagesController.editMessage)

router.delete('/message', authController.protect, messagesController.deleteMessage)

module.exports = router
