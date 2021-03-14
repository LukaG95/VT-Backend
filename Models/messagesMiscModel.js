const mongoose = require('mongoose');
const Joi = require('joi');


const messagesMiscSchema = new mongoose.Schema({
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

    blockedBy0: {
		type: Boolean,
		default: false
	},
	blockedBy1: {
		type: Boolean,
		default: false
	},

    createdAt: {
        type: Date,
        default: Date.now,
    },



    __v: { type: Number, select: false },
});


const MessagesMisc = mongoose.model('MessagesMisc', messagesMiscSchema);


MessagesMisc.collection.dropIndexes((err, results) => {

});


exports.MessagesMisc = MessagesMisc;