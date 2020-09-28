const mongoose = require('mongoose')

const repSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  title: {
    type: String,
    default: 'Novice' // should be get?
  },

  grade: {
    type: String,
    default: '1.0' // should be get?
  },

  reps: [
    {
      good: {
        type: Boolean,
        required: true
      },

      category: {
        type: String,
        enum: ['rl', 'csgo', 'other'],
        required: true
      },

      feedback: {
        type: String,
        required: true
      },

      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },

      createdAt: {
        type: Date,
        default: Date.now()
      }
      
    }
  ],

  __v: { type: Number, select: false }
})

const repModel = mongoose.model('Reputation', repSchema)

module.exports = repModel
