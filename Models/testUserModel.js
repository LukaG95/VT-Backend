const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },

  role: {
    type: String,
    enum: ['admin', 'moderator', 'support', 'user'],
    default: 'user'
  },
  
  password: {
    type: String,
    required: true,
    minlength: 8
  }
})

const TestUser = mongoose.model('TestUser', userSchema)

// const user = new TestUser({ username: 'NikForce', password: '12345678' })

// user.save()

module.exports = TestUser