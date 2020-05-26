const express = require('express');

const router = express.Router();

const authController = require('../Controllers/authController');
const repController = require('../Controllers/repController');

router.route('/top10')
    .get(repController.getTop10);

router.route('/:user')
    .get(repController.getReputation);


router.route('/addRep/:user')
    .post(authController.protect, repController.addReputation);


module.exports = router;
