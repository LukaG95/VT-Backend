const express = require('express');
const { resolveConfigFile } = require('prettier');

const router = express.Router();

const authController = require('../Controllers/authController');
const refController = require('../Controllers/referralController');
const limiter = require('../misc/rateLimiter');

// Count clicks
router.post('/:name', refController.countClick);

router.get('/', authController.protect, authController.adminOnly, refController.getReferrals);
router.post('/', authController.protect, authController.adminOnly, refController.createReferral);
router.delete('/', authController.protect, authController.adminOnly, refController.deleteReferral);

// For admins
router.get('/stats/:id', authController.protect, authController.adminOnly, refController.getStats);
// For partners
router.get('/tracking/:tracking', limiter(30, 60), refController.getStatsForPartners);

module.exports = router;
