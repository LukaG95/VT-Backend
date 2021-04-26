const express = require('express');

const helmet = require('helmet');
const compression = require('compression');
// const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');

const app = express();

app.use(helmet({
    contentSecurityPolicy: false,
  }));
app.use(compression());
// app.use(mongoSanitize());
app.use(xss());


module.exports = app;