const mongoose = require('mongoose')

const { Messages, validateMessage, validateMessageQuery } = require('../Models/messagesModel')
const { User } = require('../Models/userModel')
const {readableActiveAt} = require('../misc/time')

exports.getMessages = async (req, res, next) => {
  const user = await User.findById(req.user.id).select('-__v')

  const { recipientId } = req.params
  if (!mongoose.Types.ObjectId.isValid(recipientId)) return res.status(400).json({info: "recipientId", message: "Invalid recipientId"})

  participants = { 'participants.0': user._id, 'participants.1': user._id };
  if(recipientId < user._id) participants['participants.0'] = recipientId;
  else participants['participants.1'] = recipientId;

  console.log(participants);
  const messages = await Messages.find(participants).populate(['participants.0', 'participants.1']).sort('-createdAt')
  console.log(messages);
  if (messages.length < 1) return res.status(200).json({info: "no messages", message: "user has no messages with the recipient", messages: []})

  return res.status(200).json({ info: 'success', messages: messages})
}

exports.sendMessage = async (req, res, next) => {
  const user = await User.findById(req.user.id).select('-__v')
  const { recipientId, message } = req.body

  const { error } = await validateMessage(req.body, user, req)
  if (error) return res.status(400).json({info: "invalid credentials", message: error.details[0].message})
  
  participants = {0: user._id, 1: user._id};
  if(recipientId < user._id) participants[0] = recipientId;
  else participants[1] = recipientId;

  const messageDetails = {
    participants: participants,
    message: message,
    sender: user._id == participants[0] ? 0 : 1,
    createdAt: Date.now(),
	editedAt: Date.now()
  }

  await new Messages(messageDetails).save()
  return res.status(200).json({info: "success", message: "message was send"})
}

exports.editMessage = async (req, res, next) => {
  return res.status(501).json({info: "not implemented", message: "editing messages is not implemented"})
}

exports.deleteMessage = async (req, res, next) => {
  return res.status(501).json({info: "not implemented", message: "deleting messages is not implemented"})
}
