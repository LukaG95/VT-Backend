const mongoose = require("mongoose");

const { Messages, validateMessage, validateMessageQuery } = require("../Models/MessagesModel");
const { User } = require("../Models/userModel");
const { readableActiveAt } = require("../misc/time");

<<<<<<< HEAD
exports.getMessages = async (req, res, next) => {
    const user = await User.findById(req.user.id).select("-__v");
=======
exports.getDialogues = async (req, res, next) => {
	const user = await User.findById(req.user.id).select('-__v');
	// let { page } = req.query;
	// if(!page) page = 0;
	
	// const messages = await Messages.find({$or:[{'participants.0':user._id},{'participants.1':user._id}]}).slice('messages', 0).skip(page*20).limit(20).sort('-editedAt').populate({path:"participants.0 participants.1", select: 'username' });
	// const messages = await Messages.find({$or:[{'participants.0':user._id},{'participants.1':user._id}]}).skip(page*20).limit(1).sort('-editedAt').populate({path:"participants.0 participants.1", select: 'username' });

	let dialogues = await Messages.aggregate([
		{
		$match: {
			$or:[{'participants.0':user._id},{'participants.1':user._id}]
		}},
		{
		
		$addFields: {
		"conversationWith": {
			$cond: {
			if: {
				$eq: [
				"$participants.0",
				user._id
				]
			},
			then: "$participants.1",
			else: "$participants.0"
			}
		}
	}},
	{
		$sort: {
			"editedAt": -1 
		}
	},

		{
		$group: {
			_id: "$conversationWith",
			message: {
			  $first: "$$ROOT"
			}
		  }	},
		
		{$limit: 20}])
		
		

	dialogues = await Messages.populate(dialogues, {path:"message.participants.0 message.participants.1", select: 'username', model: 'User' })
	
	if (dialogues.length < 1) return res.status(200).json({info: "no messages", message: "user has no messages", dialogues: []});
	
	return res.status(200).json({ info: 'success', dialogues });
}
>>>>>>> 811b92f8b8953cfa2eb1754ff7fc723306cfe1b1

    const { recipientId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(recipientId))
        return res.status(400).json({ info: "recipientId", message: "Invalid recipientId" });

<<<<<<< HEAD
    participants = { "participants.0": user._id, "participants.1": user._id };
    if (recipientId < user._id) participants["participants.0"] = recipientId;
    else participants["participants.1"] = recipientId;

    console.log(participants);
    const messages = await Messages.find(participants)
        .populate(["participants.0", "participants.1"])
        .sort("-createdAt");
    console.log(messages);
    if (messages.length < 1)
        return res
            .status(200)
            .json({ info: "no messages", message: "user has no messages with the recipient", messages: [] });

    return res.status(200).json({ info: "success", messages: messages });
};
=======
	if (!mongoose.Types.ObjectId.isValid(recipientId)) return res.status(400).json({info: "recipientId", message: "Invalid recipientId"});
	
	participants = { 'participants.0': user._id, 'participants.1': user._id };
	if(recipientId < user._id) participants['participants.0'] = recipientId;
	else participants['participants.1'] = recipientId;
	
	const messages = await Messages.find(participants).skip(page * 20).limit(20).populate({path:"participants.0 participants.1", select: 'username' }).sort("-editedAt");;
	if (!messages) return res.status(200).json({info: "no messages", message: "user has no messages with the recipient", messages: []});
	
	return res.status(200).json({ info: 'success', messages: messages});
}
>>>>>>> 811b92f8b8953cfa2eb1754ff7fc723306cfe1b1

exports.sendMessage = async (req, res, next) => {
    const user = await User.findById(req.user.id).select("-__v");
    const { recipientId, message } = req.body;

    const { error } = await validateMessage(req.body, user, req);
    if (error) return res.status(400).json({ info: "invalid credentials", message: error.details[0].message });

<<<<<<< HEAD
    participants = { 0: user._id, 1: user._id };
    if (recipientId < user._id) participants[0] = recipientId;
    else participants[1] = recipientId;

    const messageDetails = {
        participants: participants,
        message: message,
        sender: user._id == participants[0] ? 0 : 1,
        createdAt: Date.now(),
        editedAt: Date.now()
    };

    await new Messages(messageDetails).save();
    return res.status(200).json({ info: "success", message: "message was send" });
};
=======
	const recipientDB = await User.findById(recipientId).select('-__v');
	if (!recipientDB) return res.status(400).json({info: "invalid receiver", message: 'recepient could not be found'})
	
	participants = { 0: user._id, 1: user._id };
    if (recipientId < user._id) participants[0] = recipientId;
    else participants[1] = recipientId;

    const messageDetails = {
        participants: participants,
        message: message,
        sender: user._id == participants[0] ? 0 : 1,
        createdAt: Date.now(),
        editedAt: Date.now()
    };

    await new Messages(messageDetails).save();
	
	const socket = req.app.get('socket');
	socket.sendMessage(user._id, recipientId, message);

	return res.status(200).json({info: "success", message: "message was sent"});
}

// exports.blockUser = async (req, res, next) => {
// 	const user = await User.findById(req.user.id).select('-__v');
// 	const { recipientId } = req.body;
	
// 	if(recipientId == user._id) return res.status(400).json({info: "invalid credentials", message: 'can\'t block yourself you silly'});
	
// 	participants = { 'participants.0': user._id, 'participants.1': user._id };
// 	if(recipientId < user._id) participants['participants.0'] = recipientId;
// 	else participants['participants.1'] = recipientId;
// 	let selfid = user._id == participants['participants.0'] ? 0 : 1;
	
// 	let messages = await Messages.findOne(participants);
// 	if(!messages) {
// 		messageDetails = {
// 			participants: {0:participants['participants.0'],1:participants['participants.1']},
// 			messages: [],
// 			createdAt: Date.now(),
// 			editedAt: Date.now(),
// 		}
// 		messageDetails['blockedBy'+selfid] = true;
// 		await new Messages(messageDetails).save();
// 	}else{
// 		if(messages['blockedBy'+selfid] === true) return res.status(304).json({info: "not modified", message: "recipient is already blocked"});
// 		messages['blockedBy'+selfid] = true;
// 		await messages.save();
// 	}
// 	return res.status(200).json({info: "success", message: "user was blocked"});
// }

// exports.unblockUser = async (req, res, next) => {
// 	const user = await User.findById(req.user.id).select('-__v');
// 	const { recipientId } = req.body;
	
// 	if(recipientId == user._id) return res.status(400).json({info: "invalid credentials", message: 'can\'t unblock yourself you silly'});
	
// 	participants = { 'participants.0': user._id, 'participants.1': user._id };
// 	if(recipientId < user._id) participants['participants.0'] = recipientId;
// 	else participants['participants.1'] = recipientId;
// 	let selfid = user._id == participants['participants.0'] ? 0 : 1;
	
// 	let messages = await Messages.findOne(participants);
// 	if(!messages) {
// 		return res.status(304).json({info: "not modified", message: "recipient is not blocked"});
// 	}else{
// 		if(messages['blockedBy'+selfid] === false) return res.status(304).json({info: "not modified", message: "recipient is not blocked"});
// 		messages['blockedBy'+selfid] = false;
// 		await messages.save();
// 	}
// 	return res.status(200).json({info: "success", message: "user in no longer blocked"});
// }
>>>>>>> 811b92f8b8953cfa2eb1754ff7fc723306cfe1b1

exports.editMessage = async (req, res, next) => {
    return res.status(501).json({ info: "not implemented", message: "editing messages is not implemented" });
};

exports.deleteMessage = async (req, res, next) => {
    return res.status(501).json({ info: "not implemented", message: "deleting messages is not implemented" });
};
