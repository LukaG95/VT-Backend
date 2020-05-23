const mongoose = require('mongoose');


const repSchema = new mongoose.Schema({
    userId: {
        type: String,
        unique: true,
        required: true,
    },
    username: {
        type: String,
        Default: 'Test',
    },
    title: {
        type: String,
        Default: 'Veteran',
    },
    grade: {
        type: String,
        Default: '5.0',
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
                enum: ['rl', 'csgo'],
            },
        },
    ],

});


const repModel = mongoose.model('Reputation', repSchema);

module.exports = repModel;
