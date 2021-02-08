const mongoose = require("mongoose");

const repSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    title: {
        type: String,
        minlength: 1,
        maxlength: 255,
        default: "Novice" // should be get?
    },

    grade: {
        type: String,
        minlength: 1,
        maxlength: 255,
        default: "1.0" // should be get?
    },

    reps: [
        {
            good: {
                type: Boolean,
                required: true
            },

            category: {
                type: String,
                enum: ["rl", "csgo", "other"],
                required: true
            },

            feedback: {
                type: String,
                minlength: 5,
                maxlength: 100,
                required: true
            },

            createdBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true
            },

            createdAt: {
                type: Date,
                default: Date.now
            }
        }
    ],

    __v: { type: Number, select: false }
});

const repModel = mongoose.model("Reputation", repSchema);

module.exports = repModel;
