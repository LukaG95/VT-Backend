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
	let selfid = user._id == participants['participants.0'] ? 0 : 1;
	
	let messages = await Messages.findOne(participants);
	if(!messages) {
		messageDetails = {
			participants: {0:participants['participants.0'],1:participants['participants.1']},
			messages: [{
				message: message,
				sender: selfid,
				sendAt: Date.now()
			}],
			createdAt: Date.now(),
			editedAt: Date.now()
		}
		await new Messages(messageDetails).save();
	}else{
		if(messages['blockedBy'+(1-selfid)] === true) return res.status(403).json({info: "forbidden", message: "the recipient has blocked you"});
		if(messages['blockedBy'+selfid] === true) return res.status(403).json({info: "forbidden", message: "you have blocked the recipient"});
		
		messages.messages.push({message: message, sendAt: Date.now(), sender: selfid});
		messages.editedAt = Date.now();
		await messages.save();
	}
	let socket = req.app.get('socket');
	socket.sendMessage(selfid, recipientId, message);
	return res.status(200).json({info: "success", message: "message was send"});
}

exports.blockUser = async (req, res, next) => {
	const user = await User.findById(req.user.id).select('-__v');
	const { recipientId } = req.body;
	
	if(recipientId == user._id) return res.status(400).json({info: "invalid credentials", message: 'can\'t block yourself you silly'});
	
	participants = { 'participants.0': user._id, 'participants.1': user._id };
	if(recipientId < user._id) participants['participants.0'] = recipientId;
	else participants['participants.1'] = recipientId;
	let selfid = user._id == participants['participants.0'] ? 0 : 1;
	
	let messages = await Messages.findOne(participants);
	if(!messages) {
		messageDetails = {
			participants: {0:participants['participants.0'],1:participants['participants.1']},
			messages: [],
			createdAt: Date.now(),
			editedAt: Date.now(),
		}
		messageDetails['blockedBy'+selfid] = true;
		await new Messages(messageDetails).save();
	}else{
		if(messages['blockedBy'+selfid] === true) return res.status(304).json({info: "not modified", message: "recipient is already blocked"});
		messages['blockedBy'+selfid] = true;
		await messages.save();
	}
	return res.status(200).json({info: "success", message: "user was blocked"});
}

exports.unblockUser = async (req, res, next) => {
	const user = await User.findById(req.user.id).select('-__v');
	const { recipientId } = req.body;
	
	if(recipientId == user._id) return res.status(400).json({info: "invalid credentials", message: 'can\'t unblock yourself you silly'});
	
	participants = { 'participants.0': user._id, 'participants.1': user._id };
	if(recipientId < user._id) participants['participants.0'] = recipientId;
	else participants['participants.1'] = recipientId;
	let selfid = user._id == participants['participants.0'] ? 0 : 1;
	
	let messages = await Messages.findOne(participants);
	if(!messages) {
		return res.status(304).json({info: "not modified", message: "recipient is not blocked"});
	}else{
		if(messages['blockedBy'+selfid] === false) return res.status(304).json({info: "not modified", message: "recipient is not blocked"});
		messages['blockedBy'+selfid] = false;
		await messages.save();
	}
	return res.status(200).json({info: "success", message: "user in no longer blocked"});
}

exports.editMessage = async (req, res, next) => {
	return res.status(501).json({info: "not implemented", message: "editing messages is not implemented"})
}

exports.deleteMessage = async (req, res, next) => {
	return res.status(501).json({info: "not implemented", message: "deleting messages is not implemented"})
}
