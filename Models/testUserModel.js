const mongoose = require('mongoose')
const Joi = require('joi')

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  
  password: {
    type: String,
    required: true,
    minlength: 8
  }
})

exports.TestUser = mongoose.model('TestUser', userSchema)