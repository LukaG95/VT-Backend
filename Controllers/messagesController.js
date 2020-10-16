const mongoose = require('mongoose')

const { Messages, validateMessage, validateMessageQuery } = require('../Models/messagesModel')
const { User } = require('../Models/userModel')
const {readableActiveAt} = require('../misc/time')

exports.getMessages = async (req, res, next) => {
	const user = await User.findById(req.user.id).select('-__v');
	let { page } = req.query;
	if(!page) page = 0;
	
	const messages = await Messages.find({$or:[{'participants.0':user._id},{'participants.1':user._id}]}).slice('messages', -1).skip(page*20).limit(20).sort('-editedAt').populate(['participants.0', 'participants.1']);
	if (messages.length < 1) return res.status(200).json({info: "no messages", message: "user has no messages", messages: []});
	
	return res.status(200).json({ info: 'success', messages: messages});
}

exports.getMessagesWithUser = async (req, res, next) => {
	const user = await User.findById(req.user.id).select('-__v');
	
	const { recipientId } = req.params;
	let { page } = req.query;
	if(!page) page = 0;
	page++;
	console.log(page);
	if (!mongoose.Types.ObjectId.isValid(recipientId)) return res.status(400).json({info: "recipientId", message: "Invalid recipientId"});
	
	participants = { 'participants.0': user._id, 'participants.1': user._id };
	if(recipientId < user._id) participants['participants.0'] = recipientId;
	else participants['participants.1'] = recipientId;
	
	const messages = await Messages.findOne(participants).slice('messages',[-20*page, 20]).populate(['participants.0', 'participants.1']);
	if (!messages) return res.status(200).json({info: "no messages", message: "user has no messages with the recipient", messages: []});
	
	return res.status(200).json({ info: 'success', messages: messages});
}

exports.sendMessage = async (req, res, next) => {
	const user = await User.findById(req.user.id).select('-__v');
	const { recipientId, message } = req.body;
	
	const { error } = await validateMessage(req.body, user, req);
	if (error) return res.status(400).json({info: "invalid credentials", message: error.details[0].message});
	
	participants = { 'participants.0': user._id, 'participants.1': user._id };
	if(recipientId < user._id) participants['participants.0'] = recipientId;
	else participants['participants.1'] = recipientId;
	
	let messages = await Messages.findOne(participants);
	if(!messages) {
		messageDetails = {
			participants: {0:participants['participants.0'],1:participants['participants.1']},
			messages: [{
				message: message,
				sender: user._id == participants['participants.0'] ? 0 : 1,
				sendAt: Date.now()
			}],
			createdAt: Date.now(),
			editedAt: Date.now()
		}
		await new Messages(messageDetails).save();
	}else{
		messages.messages.push({message: message, sendAt: Date.now(), sender: user._id == participants['participants.0'] ? 0 : 1});
		messages.editedAt = Date.now();
		await messages.save();
	}
	return res.status(200).json({info: "success", message: "message was send"});
}

exports.editMessage = async (req, res, next) => {
	return res.status(501).json({info: "not implemented", message: "editing messages is not implemented"})
}

exports.deleteMessage = async (req, res, next) => {
	return res.status(501).json({info: "not implemented", message: "deleting messages is not implemented"})
}
