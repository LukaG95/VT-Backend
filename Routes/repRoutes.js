const express = require('express');

const router = express.Router();

const authController = require('../Controllers/authController');
const repController = require('../Controllers/repController');
const limiter = require('../misc/rateLimiter');

router.get('/top10', repController.getTop10);
router.get('/compact/:user', repController.getReputation_compact);
router.get('/:user', repController.getReputation);

router.post('/addRep/:user', limiter(10, 60), authController.protect, authController.activatedAccountOnly, repController.addReputation);

module.exports = router;
