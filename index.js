const path = require('path');
const express = require('express');


const logger = require('./startup/logging');

const app = require('./app');

require('./startup/config')();
require('./startup/routes')(app);
require('./startup/db')();
// require('./startup/prod')(app);
require('./startup/validation')();



app.use(express.static(path.join(__dirname, 'build')));

app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const port = process.env.PORT || 5000;
// const server = app.listen(port, ()=> logger.info(`Listening on port ${port}...`))


const server = require('./startup/socket')(app, port);

module.exports = server;