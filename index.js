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

app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, 'build', 'index.html'))
})

const port = process.env.PORT || 5000
const server = app.listen(port, ()=> logger.info(`Listening on port ${port}...`))

module.exports = server
