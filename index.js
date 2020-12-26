const path = require('path')
const express = require('express')
const app = express()

const logger = require('./startup/logging')

require('./startup/config')()
require('./startup/routes')(app)
require('./startup/db')()
require('./startup/validation')()
require('./startup/prod')(app)

app.use(express.static(path.join(__dirname, 'build')))
 
app.get('/*', function(req, res) {
  res.sendFile(path.join(__dirname, 'build', 'index.html'))
})

const port = process.env.PORT || 5000
//const server = app.listen(port, ()=> logger.info(`Listening on port ${port}...`))

const server = require('./startup/socket')(app, port);


module.exports = server


 /* Socket.io 

const path = require('path')
const express = require('express')
const app = express()

var http = require('http').createServer(app)
var io = require('socket.io')(http)

const logger = require('./startup/logging')

require('./startup/config')()
require('./startup/routes')(app) 
require('./startup/db')()
require('./startup/validation')()
require('./startup/prod')(app)

app.use(express.static(path.join(__dirname, 'build')))

app.get('/*', function(req, res) {
  res.sendFile(path.join(__dirname, 'build', 'index.html'))
})

io.on('connection', (socket) => {
  console.log('a user connected', socket.id);
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
})

const port = process.env.PORT || 5000
const server = http.listen(port, ()=> logger.info(`Listening on port ${port}...`))

module.exports = server
*/

/*
var app = require('express')();

var http = require('http').createServer(app);
var io = require('socket.io')(http);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

http.listen(5000, () => {
  console.log('listening on *:5000');
});
*/