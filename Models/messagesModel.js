// https://stackoverflow.com/questions/26936645/mongoose-private-chat-message-model

const mongoose = require('mongoose')
const Joi = require('joi')

const messagesSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  message:{
    text: { 
      type: String, 
      required: true 
    }
    /*
    image: {
      ...
    }
    */
  },
  
  recipients:[{
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    }
  }],
  
  read: { 
    type: Boolean,
    default: false
  },

  createdAt: {
		type: Date,
		default: Date.now 
	},
	
	editedAt: {
		type: Date,
		default: Date.now
	},
	
	__v: { type: Number, select: false }
});

const Messages = mongoose.model('Messages', messagesSchema)

exports.Messages = Messages

exports.validateMessage = async (message) => { 
  if (message.message.text.match(/\b(?:http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+(?:[\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(?::[0-9]{1,5})?(?:\/.*)?\b/gm))
    return {error: {details: [{message: 'No links allowed'}]}}

  const recipient = Joi.object({
    user: Joi.string().required()
  })

  const schema = Joi.object({
    recipients: Joi.array().items(recipient).required(),
    message: Joi.object().keys({
      text: Joi.string().min(1).max(100).required()
    })
  })

  return schema.validate(message)
}

exports.validateMessageQuery = (query) => {
  if(message.participants[0]._id == message.participants[1]._id)
    return {error: {details: [{message: 'Recipient can\'t be same as sender'}]}}

  const schema = Joi.object({})
  return schema.validate(query)
}