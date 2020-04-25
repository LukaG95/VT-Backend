const express = require('express');

const Trade = require('./Models/tradesModel');

const app = express();

app.get('/', async (req, res) => {
    const trades = await Trade.find({}, { _id: 0, __v: 0 });
    res.json(trades);
});


module.exports = app;
