// Modules
const express = require('express');

const app = express();

const cookieParser = require('cookie-parser');

// Routers
const TradeRouter = require('./Routes/tradeRoutes');
const AuthRouter = require('./Routes/authRoutes');
const RepRouter = require('./Routes/repRoutes');

const errorController = require('./misc/errorController');


app.set('trust proxy', 1);


app.use(express.json());
app.use(cookieParser());


app.use('/api/trades/', TradeRouter);

app.use('/api/auth/', AuthRouter);

app.use('/api/reputation', RepRouter);

app.use(errorController);


module.exports = app;
