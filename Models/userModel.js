const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const findOrCreate = require('mongoose-find-or-create');


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

userSchema.plugin(findOrCreate);

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// userSchema.methods.correctPassword = async function (receivedPassword, userPassword) {
//     return await bcrypt.compare(receivedPassword, userPassword);
// };

userSchema.methods.correctPassword = async function (
    candidatePassword,
    userPassword,
) {
    return await bcrypt.compare(candidatePassword, userPassword);
};


const User = mongoose.model('User', userSchema);


module.exports = User;
