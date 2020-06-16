const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { promisify } = require('util');
const validator = require('validator');

// var uniqueValidator = require('mongoose-unique-validator');


const userSchema = new mongoose.Schema({
    username: {
        type: String,
        maxlength: 20,
        unique: true,
    },
    email: {
        type: String,
        sparse: true,
        unique: true
    },
    confirmedEmail: {
        type: Boolean,
        default: false,
    },
    password: {
        type: String,
        minlength: 8,
        select: false,
    },
    passwordConfirm: {
        type: String,

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
    verificationToken: {
        type: String,
    },
    __v: { type: Number, select: false },

});

// userSchema.plugin(uniqueValidator);


userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    this.password = await bcrypt.hash(this.password, 12);

    this.passwordConfirm = undefined;
    next();
});

userSchema.methods.correctPassword = async function (receivedPassword, userPassword) {
    return await bcrypt.compare(receivedPassword, userPassword);
};

userSchema.methods.generateToken = async function () {
    const emailToken = (await promisify(crypto.randomBytes)(32)).toString('hex');
    this.verificationToken = await bcrypt.hash(emailToken, 8);
    return emailToken;
};

userSchema.methods.compareTokens = async function (Token, HashedToken) {
    return await bcrypt.compare(Token, HashedToken);
};

userSchema.index({ username: 1, email: 1 }, { collation: { locale: 'en', strength: 2 } });
// userSchema.set('autoIndex', true);
const User = mongoose.model('User', userSchema);






User.collection.dropIndexes(function (err, results) {
    // Handle errors
});



module.exports = User;
