const mongoose = require('mongoose')

const { Messages, validateMessage, validateMessageQuery } = require('../Models/messagesModel')
const { User } = require('../Models/userModel')
const {readableActiveAt} = require('../misc/time')

exports.getMessages = async (req, res, next) => {
	const user = await User.findById(req.user.id).select('-__v');
	
	const messages = await Messages.find();
	return res.status(200).json({ info: 'success', messages: messages});
}

exports.sendMessage = async (req, res, next) => {
  const user = await User.findById(req.user.id).select('-__v')
  const { recipients, message } = req.body

  const { error } = await validateMessage(req.body)
  if (error) return res.status(400).json({info: "invalid credentials", message: error.details[0].message})

  recipients.push({user: user._id})
  
  const messageDetails = {
    sender: user._id,
    message: message,
    recipients: recipients,
    createdAt: Date.now(),
	  editedAt: Date.now()
  }

  await new Messages(messageDetails).save()
  return res.status(200).json({info: "success", message: "message was sent"})
}

exports.editMessage = async (req, res, next) => {
  return res.status(501).json({info: "not implemented", message: "editing messages is not implemented"})
}

exports.deleteMessage = async (req, res, next) => {
  return res.status(501).json({info: "not implemented", message: "deleting messages is not implemented"})
}
