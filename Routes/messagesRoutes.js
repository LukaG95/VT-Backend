const express = require('express');

const limiter = require('../misc/generalRateLimiter')(5, 3);
const authController = require('../Controllers/authController');
const messagesController = require('../Controllers/messagesController');

const router = express.Router();

router.get('/', authController.protect, messagesController.getDialogues);
router.get('/status/online/:userId', authController.protect, messagesController.isOnline);
router.get('/status/blocked/:userId', authController.protect, messagesController.isBlocked);

router.get('/:recipientId', authController.protect, messagesController.getMessagesWithUser);

router.post('/message', authController.protect, limiter, messagesController.sendMessage);
router.post('/blockUser', authController.protect, limiter, messagesController.blockUser)

router.put('/message', authController.protect, messagesController.editMessage);

router.delete('/blockUser', authController.protect, limiter, messagesController.unblockUser)
router.delete('/message', authController.protect, messagesController.deleteMessage);


module.exports = router;
