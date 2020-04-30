const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const validator = require('validator');


const userSchema = new mongoose.Schema({
    username: {
        type: String,
        maxlength: 20,
    },
    email: {
        type: String,
        unique: true,
        sparse: true,
    },
    password: {
        type: String,
        minlength: 8,
        select: false,
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Please confirm a password'],
        validate: {
            validator(el) {
                return el === this.password;
            },
        },
    },
    discord: {
        type: String,
        unique: true,
        sparse: true,
    },
    steam: {
        type: String,
        unique: true,
        sparse: true,

    },
});


userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    this.password = await bcrypt.hash(this.password, 12);

    this.passwordConfirm = undefined;
    next();
});

userSchema.methods.correctPassword = async function (receivedPassword, userPassword) {
    return await bcrypt.compare(receivedPassword, userPassword);
};


const User = mongoose.model('User', userSchema);


module.exports = User;
