const express = require('express');

const router = express.Router();

const tradesController = require('../Controllers/tradesController');

router.route('/getTrades')
    .get(tradesController.getTrades);


module.exports = router;
