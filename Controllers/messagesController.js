/* eslint-disable no-tabs */
const mongoose = require('mongoose');

const {
    Messages,
    validateMessage,
} = require('../Models/messagesModel');
const { User } = require('../Models/userModel');
const {
    readableDialoguesCreatedAt,
} = require('../misc/time');

exports.getDialogues = async (req, res, next) => {
    const user = await User.findById(req.user.id).select('-__v');
    // let { page } = req.query;
    // if(!page) page = 0;

    // const messages = await Messages.find({$or:[{'participants.0':user._id},{'participants.1':user._id}]}).slice('messages', 0).skip(page*20).limit(20).sort('-editedAt').populate({path:"participants.0 participants.1", select: 'username' });
    // const messages = await Messages.find({$or:[{'participants.0':user._id},{'participants.1':user._id}]}).skip(page*20).limit(1).sort('-editedAt').populate({path:"participants.0 participants.1", select: 'username' });

    let dialogues = await Messages.aggregate([
        {
            $match: {
                $or: [{ 'participants.0': user._id }, { 'participants.1': user._id }],
            },
        },

        {
            $addFields: {
                createdAt: {
                    default: '$createdAt',
                    timestamp: { $toLong: '$createdAt' },
                    hourminutes: {
                        $dateToString: {
                            date: '$createdAt',
                            format: '%H:%M',
                        },
                    },
                    fulldate: {
                        $dateToString: {
                            date: '$createdAt',
                            format: '%d/%m/%Y',
                        },
                    },
                },
                conversationWith: {
                    $cond: {
                        if: {
                            $eq: ['$participants.0', user._id],
                        },
                        then: '$participants.1',
                        else: '$participants.0',
                    },
                },
            },
        },

        {
            $sort: {
                createdAt: -1,
            },
        },

        {
            $group: {
                _id: '$conversationWith',
                createdAt: {
                    $first: '$createdAt',
                },
                lastMessage: {
                    $first: '$message',
                },
                conversationWith: {
                    $first: '$conversationWith',
                },
            },
        },

        {
            $sort: {
                'createdAt.default': -1,
            },
        },

        {
            $project: {
                _id: 0,
            },
        },

        { $limit: 20 },
    ]);

    dialogues = await Messages.populate(dialogues, {
        path: 'conversationWith',
        select: 'username',
        model: 'User',
    });

    if (dialogues.length < 1) {
        return res.status(200).json({
            info: 'no messages',
            message: 'user has no messages',
            dialogues: [],
        });
    }

    return res.status(200).json({
        info: 'success',
        dialogues: readableDialoguesCreatedAt(dialogues),
    });
};

exports.getMessagesWithUser = async (req, res, next) => {
    const user = await User.findById(req.user.id).select('-__v');

    const { recipientId } = req.params;
    let { page } = req.query;
    if (!page) page = 1;
    page--;

    if (!mongoose.Types.ObjectId.isValid(recipientId)) {
        return res
            .status(400)
            .json({ info: 'recipientId', message: 'Invalid recipientId' });
    }

    const participants = { 'participants.0': `${user._id}`, 'participants.1': user._id };
    if (recipientId < user._id) participants['participants.0'] = mongoose.Types.ObjectId(recipientId);
    else participants['participants.1'] = mongoose.Types.ObjectId(recipientId);

    // const messages = await Messages.find(participants)
    //     .skip(page * 20)
    //     .limit(20)
    //     .populate({ path: 'participants.0 participants.1', select: 'username' })
    //     .sort('-createdAt');
  
    let messages = await Messages.aggregate([
        
            {$match: participants},
            {
            
            
                $sort: {
                    createdAt: -1,
                },
            },
                
        
        {
            $addFields: {
                createdAt: {
                    default: '$createdAt',
                    timestamp: { $toLong: '$createdAt' },
                    hourminutes: {
                        $dateToString: {
                            date: '$createdAt',
                            format: '%H:%M',
                        },
                    },
                    fulldate: {
                        $dateToString: {
                            date: '$createdAt',
                            format: '%d/%m/%Y',
                        },
                    },
                },
                sender: {
                    $cond: {
                        if: {
                            $eq: ['$sender', 0],
                        },
                        then: '$participants.0',
                        else: '$participants.1',
                    },
                },
            },
        },
        {
            $project: {
                _id:0,
                message:1,
                sender: 1,

                createdAt:1,

            },
        },

        { $limit: 20 },
        { $skip: page * 20}

    ]);

    messages = await Messages.populate(messages, {
        path: 'sender',
        select: 'username',
        model: 'User',
    });
    

    if (!messages) {
        return res.status(200).json({
            info: 'no messages',
            message: 'user has no messages with the recipient',
            messages: [],
        });
    }

    console.log(messages)

    return res.status(200).json({ info: 'success', messages: readableDialoguesCreatedAt(messages) });
};




exports.sendMessage = async (req, res, next) => {
    const user = await User.findById(req.user.id).select('-__v');

    const { recipientId, message } = req.body;

    const { error } = await validateMessage(req.body, user, req);
    if (error) {
        return res
            .status(400)
            .json({ info: 'invalid credentials', message: error.details[0].message });
    }

    const recipientDB = await User.findById(recipientId).select('-__v');
    if (!recipientDB) {
        return res.status(400).json({
            info: 'invalid receiver',
            message: 'recepient could not be found',
        });
    }

    const participants = { 0: user._id, 1: user._id };
    if (recipientId < user._id) participants[0] = recipientId;
    else participants[1] = recipientId;

    const messageDetails = {
        participants,
        message,
        sender: user._id == participants[0] ? 0 : 1,
        createdAt: Date.now(),
        editedAt: Date.now(),
    };

    await new Messages(messageDetails).save();

    const socket = req.app.get('socket');
    socket.sendMessage(user._id, recipientId, message);

    return res.status(200).json({ info: 'success', message: 'message was sent' });
};

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

exports.editMessage = async (req, res, next) => res.status(501).json({
    info: 'not implemented',
    message: 'editing messages is not implemented',
});

exports.deleteMessage = async (req, res, next) => res.status(501).json({
    info: 'not implemented',
    message: 'deleting messages is not implemented',
});