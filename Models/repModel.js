const mongoose = require('mongoose');


const repSchema = new mongoose.Schema({
    userId: {
        type: String,
        unique: true,
        required: true,
    },
    title: {
        type: String,
        default: 'Veteran',
    },
    username: {
        type: String,
        required: true,
    },

    grade: {
        type: String,
        default: '5.0',
    },

    reps: [
        {
            good: {
                type: Boolean,
                required: true,
            },
            createdBy: {
                type: String,
                required: true,
            },
            createdAt: {
                type: Date,
                default: Date.now(),
            },
            feedback: {
                type: String,
                required: true,
            },
            game: {
                type: String,
                required: true,
                enum: ['rl', 'csgo', 'other'],
            },
        },
    ],

    __v: { type: Number, select: false },
});


const repModel = mongoose.model('Reputation', repSchema);


module.exports = repModel;
