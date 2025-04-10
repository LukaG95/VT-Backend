const mongoose = require('mongoose');
const Joi = require('joi');

const messagesSchema = new mongoose.Schema({
    participants: {
        0: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        1: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },

    sender: {
        type: Number,
        min: 0,
        max: 1,
        required: true,
    },

    message: {
        type: String,
        minlength: 1,
        maxlength: 100,
        required: true,
    },

    createdAt: {
        type: Date,
        default: Date.now,
    },

    editedAt: {
        type: Date,
        default: Date.now,
    },

    __v: { type: Number, select: false },
});

const Messages = mongoose.model("Messages", messagesSchema);
/*
Messages.collection.dropIndex({ createdAt: 1 }, function (err, result) {
    Messages.collection.createIndex({ createdAt: 1 }, { expireAfterSeconds: 864000 });
});
*/
Messages.collection.dropIndexes(function (err, result) {

})


// Messages.collection.deleteMany({})

exports.Messages = Messages;

exports.validateMessage = async (message, user, req) => {
    if (
        message.message.match(
            /\b(?:http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+(?:[\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(?::[0-9]{1,5})?(?:\/.*)?\b/gm,
        )
    ) {
        return { error: { details: [{ message: 'No links allowed' }] } };
    }

    if (user._id == message.recipientId) {
        return {
            error: { details: [{ message: "Recipient can't be same as sender" }] },
        };
    }

    const schema = Joi.object({
        recipientId: Joi.string().required(),
        message: Joi.string().min(1).max(100).required(),
    });

    return schema.validate(message);
};