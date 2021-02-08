const express = require("express");

const authController = require("../Controllers/authController");
const messagesController = require("../Controllers/messagesController");

const router = express.Router();

<<<<<<< HEAD
router.get("/:recipientId", authController.protect, messagesController.getMessages);
=======
router.get('/', authController.protect, messagesController.getDialogues)
>>>>>>> 811b92f8b8953cfa2eb1754ff7fc723306cfe1b1

router.post("/message", authController.protect, messagesController.sendMessage);

<<<<<<< HEAD
router.put("/message", authController.protect, messagesController.editMessage);
=======
router.post('/message', authController.protect, limiter, messagesController.sendMessage)
// router.post('/blockUser', authController.protect, limiter, messagesController.blockUser)
>>>>>>> 811b92f8b8953cfa2eb1754ff7fc723306cfe1b1

router.delete("/message", authController.protect, messagesController.deleteMessage);

<<<<<<< HEAD
module.exports = router;
=======
// router.delete('/blockUser', authController.protect, limiter, messagesController.unblockUser)
router.delete('/message', authController.protect, messagesController.deleteMessage)

module.exports = router
>>>>>>> 811b92f8b8953cfa2eb1754ff7fc723306cfe1b1
