const mongoose = require('mongoose');

const referralsSchema = new mongoose.Schema({

    partner: {
        type: String,
        unique: true,
        required: true
    },

    tracking: {
        type: String,
        min: 32,
        max: 32,
        unique: true,
        required: true
    },
    
    createdAt: {
        type: Date,
        default: Date.now,
    },

    __v: { type: Number, select: false },
});

const Referral = mongoose.model("Referral", referralsSchema);


exports.Referral = Referral;