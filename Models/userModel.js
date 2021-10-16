const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { promisify } = require('util');
const Joi = require('joi');

const userSchema = new mongoose.Schema({
    
    username: {
        type: String,
        minlength: 2,
        maxlength: 15,
        required: true
        
    },

    email: {
        type: String,
        maxlength: 255,   
        required() { return !(this.steam || this.discord); },
    },

    activatedAccount: {
        type: Boolean,
        default: false,
    },

    password: {
        type: String,
        minlength: 6,
        maxlength: 255,
        select: false,
        required() { return !(this.steam || this.discord); },
    },

    passwordConfirm: {
        type: String,
        maxlength: 255,
        validate: {
            validator(el) {
                return el === this.password;
            },
        },
    },

    role: {
        type: String,
        minlength: 1,
        maxlength: 255,
        default: 'user',
    },

    isPremium: {
        type: Boolean,
        default: false,
    },

    restricted: {
        isMuted: {
            type: Boolean,
            default: false,
        },
        isBanned: {
            type: Boolean,
            default: false,
        },
        mutedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        unMutedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        bannedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        unBannedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    },

    /*
  reported: [{
    user:
    reason:
    trade:
  }]
*/
    discord: {
        id: {
            type: String,
            maxlength: 20,
            unique: true,
            sparse: true

        },
        username: {
            type: String,
            maxlength: 36
        },
        
        signedUpWith: {
            type: Boolean,
        }
        
    },

    steam: {
        id: {
            type: String,
            maxlength: 20,
            unique: true,
            sparse: true
        },
        username: {
            type: String,
            maxlength: 36
        },
        
        signedUpWith: {
            type: Boolean,
        },
        verified: {
          type: Boolean,
          default: false,
          required: true
      }
    },
    
    xbox: {
        username: {
            type: String,
            unique: true,
            sparse: true
        },
        id: {
            type: String,
            unique: true,
            sparse: true
        },
        verified: {
          type: Boolean,
          default: false,
          required: true
      }
    },

    epic: {
        username: {
            type: String,
            unique: true,
            maxlength: 20,
            sparse: true
        },
        verified: {
            type: Boolean,
            default: false,
            required: true
        }
    },

    psn: {
        username: {
            type: String,
            unique: true,
            maxlength: 16,
            sparse: true
        },
        verified: {
            type: Boolean,
            default: false,
            required: true
        }
    },

    switch: {
        username: {
            type: String,
            unique: true,
            maxlength: 17,
            sparse: true
        },
        verified: {
            type: Boolean,
            default: false,
            required: true
        }
    },

    verificationToken: {
        type: String,
        maxlength: 255,
        select: false,
    },

    tokenCreatedAt: {
        type: Date,
        default: Date.now,
    },

    usernameChangedAt: {
        type: Date,
    },

    createdAt: {
        type: Date,
        default: Date.now,
    },

    __v: {
        type: Number,
        select: false,
    },
});

// userSchema.plugin(uniqueValidator)

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    this.password = await bcrypt.hash(this.password, 12);

    this.passwordConfirm = undefined;
    next();
});

userSchema.methods.correctPassword = async function (receivedPassword, userPassword) {
    return await bcrypt.compare(receivedPassword, userPassword);
};

userSchema.methods.generateEmailToken = async function () {
    const emailToken = (await promisify(crypto.randomBytes)(16)).toString('hex');
    this.verificationToken = await bcrypt.hash(emailToken, 8);
    this.tokenCreatedAt = Date.now();
    return emailToken;
};

userSchema.methods.compareTokens = async function (Token, HashedToken) {
    return await bcrypt.compare(Token, HashedToken);
};

userSchema.index({ username: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });
userSchema.index({ email: 1 }, { unique: true, sparse: true, collation: { locale: 'en', strength: 2 } });


        // required: true,
        // collation: { locale: 'en', strength: 2 }


userSchema.index(
    { 'createdAt': 1 },
    {
      expireAfterSeconds: 900,
      partialFilterExpression: { 'activatedAccount': false }
    }
  );
// userSchema.set('autoIndex', true); // Read this - https://mongoosejs.com/docs/guide.html

const User = mongoose.model('User', userSchema);



// User.collection.dropIndexes((err, results) => {});



exports.User = User;

exports.validateSignup = (user) => {
    const schema = Joi.object({
        username: Joi.string().min(2).max(15).regex(/^(?!.*[ ]{2,})[a-zA-Z0-9 _-]{2,15}$/m)
            .required(),
        password: Joi.string().min(6).max(255).regex(/^[\!@#$%^&*()\\[\]{}\-_+=~`|:;"'<>,./?a-zA-Z0-9]{6,30}$/m)
            .required(),
        passwordConfirm: Joi.ref('password'),
        email: Joi.string().min(1).max(255).email()
            .required(),
    });

    return schema.validate(user);
};

exports.validateLogin = (user) => {
    const schema = Joi.object({
        email: Joi.string().min(1).max(255).required(),
        password: Joi.string().min(6).max(255).required(),
    });

    return schema.validate(user);
};

exports.validateEmail = async (email) => {
    const user = await User.findOne({ email }).collation({ locale: 'en', strength: 2 });
    if (user) return false;
    return true;
};

exports.validateUsername = async (username) => {
    const user = await User.findOne({ username }).collation({ locale: 'en', strength: 2 });
    if (user) return false;
    return true;
};
