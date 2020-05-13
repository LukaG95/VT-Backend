// Modules
const express = require('express');

const app = express();

const cookieParser = require('cookie-parser');

// Routers
const TradeRouter = require('./Routes/tradeRoutes');
const AuthRouter = require('./Routes/authRoutes');

const errorController = require('./misc/errorController');


app.set('trust proxy', 1);


app.use(express.json());
app.use(cookieParser());


app.use('/trades/', TradeRouter);

app.use('/auth/', AuthRouter);

app.use(errorController);


module.exports = app;
