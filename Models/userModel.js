const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const crypto = require('crypto')
const { promisify } = require('util')
const Joi = require('joi')

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    minlength: 2,
    maxlength: 15,
    unique: true,
    required: true
  },

  email: {
    type: String,
    maxlength: 255,
    sparse: true,
    unique: true,
    required: function () { return !(this.steam || this.discord) }
  },

  activatedAccount: {
    type: Boolean,
    maxlength: 255,
    default: false
  },

  password: {
    type: String,
    minlength: 6,
    maxlength: 255,
    select: false,
    required: function () { return !(this.steam || this.discord) }
  },

  passwordConfirm: {
    type: String,
    maxlength: 255,
    validate: {
      validator(el) {
        return el === this.password;
      }
    }
  },

  role: {
    type: String,
    minlength: 1,
    maxlength: 255,
    default: 'user'
  },

  isPremium: {
    type: Boolean,
    default: false
  },

  restricted: {
    isMuted: {
      type: Boolean,
      default: false
    },
    isBanned: {
      type: Boolean,
      default: false
    },
    mutedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    unMutedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    bannedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    unBannedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },

  /*
  reported: [{
    user: 
    reason:
    trade:
  }]
*/

  discord: {
    type: String,
    maxlength: 255,
    unique: true,
    sparse: true
  },

  steam: {
    type: String,
    maxlength: 255,
    unique: true,
    sparse: true
  },

  verificationToken: {
    type: String,
    maxlength: 255,
    select: false
  },

  tokenCreatedAt: {
    type: Date,
    default: Date.now
  },

  usernameChangedAt: {
    type: Date
  },

  createdAt: {
    type: Date,
    default: Date.now
  },

  __v: {
    type: Number,
    select: false
  }
})

// userSchema.plugin(uniqueValidator)

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()

  this.password = await bcrypt.hash(this.password, 12)

  this.passwordConfirm = undefined
  next()
})

userSchema.methods.correctPassword = async function (receivedPassword, userPassword) {
  return await bcrypt.compare(receivedPassword, userPassword)
}

userSchema.methods.generateEmailToken = async function () {
  const emailToken = (await promisify(crypto.randomBytes)(16)).toString('hex')
  this.verificationToken = await bcrypt.hash(emailToken, 8)
  this.tokenCreatedAt = Date.now()
  return emailToken
}

userSchema.methods.compareTokens = async function (Token, HashedToken) {
  return await bcrypt.compare(Token, HashedToken)
}

userSchema.index({ username: 1, email: 1 }, { collation: { locale: 'en', strength: 2 } })
userSchema.set('autoIndex', true);
// Read this - https://mongoosejs.com/docs/guide.html - userSchema.set('autoIndex', true)

const User = mongoose.model('User', userSchema)

User.collection.dropIndexes(function (err, results) {
  // Handle errors
})

exports.User = User

exports.validateSignup = (user) => {
  const schema = Joi.object({
    username: Joi.string().min(2).max(15).regex(/^(?!.*[ ]{2,})[a-zA-Z0-9 _-]{2,15}$/m).required(),
    password: Joi.string().min(6).max(255).regex(/^[\!@#$%^&*()\\[\]{}\-_+=~`|:;"'<>,./?a-zA-Z0-9]{6,30}$/m).required(),
    passwordConfirm: Joi.string().min(6).max(255).required(),
    email: Joi.string().min(1).max(255).email().required()
  })

  return schema.validate(user)
}

exports.validateLogin = (user) => {
  const schema = Joi.object({
    email: Joi.string().min(1).max(255).required(),
    password: Joi.string().min(6).max(255).required()
  })

  return schema.validate(user)
}

exports.validateEmail = async (email) => {
  const user = await User.findOne({ email }).collation({ locale: "en", strength: 2 })
  if (user) {

    if (user.confirmedEmail === false && user.tokenCreatedAt.getTime() < (Date.now() - 15 * 60 * 1000)) {
      await User.deleteOne({ _id: user._id })
      return true
    }
    else return false

  }

  return true
}

exports.validateUsername = async (username) => {
  const user = await User.findOne({ username }).collation({ locale: "en", strength: 2 })
  if (user) {

    if (user.confirmedEmail === false && user.tokenCreatedAt.getTime() < (Date.now() - 15 * 60 * 1000)) {
      await User.deleteOne({ _id: user._id })
      return true
    }
    else return false

  }

  return true
}




