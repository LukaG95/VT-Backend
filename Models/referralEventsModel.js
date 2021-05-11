const mongoose = require('mongoose');

const referralEventsSchema = new mongoose.Schema({

    partner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Referral',
        required: true
    },

    event: {
        type: String,
        enum: ['click', 'signup'],
        required: true,
    },

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required() { return (this.event === 'signup')}
    },

    createdAt: {
        type: Date,
        default: Date.now
    },

    __v: { type: Number, select: false },
});

const ReferralEvents = mongoose.model("ReferralEvents", referralEventsSchema);


exports.ReferralEvents = ReferralEvents;