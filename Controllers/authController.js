const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { promisify } = require('util');

const EmailingSystem = require('../misc/EmailingSystem');
const catchAsync = require('../misc/catchAsync');
const AppError = require('../misc/AppError');
const {
    User, validateSignup, validateLogin, validateUsername,
} = require('../Models/userModel');
const { TestUser } = require('../Models/testUserModel');
const Reputation = require('../Models/repModel');
const user = require('../Models/userModel'); // this is here because of jest tests


const envURL = process.env.NODE_ENV === "production" ? "https://virtrade.gg/" : "http://localhost:3000/";

const createToken = (id, expires, code = 0, email) => jwt.sign({ id, code, email }, process.env.JWT_SECRET, {
    expiresIn: expires + (code != 0 ? 'm' : 'd'),
});

const decodeToken = async (token) => promisify(jwt.verify)(token, process.env.JWT_SECRET);

const createSendToken = (user, res, options) => {
    let expires;


    if (options && options.keepLogged === 'true') expires = process.env.JWT_EXPIRES_IN.slice(0, -1);  // Delete 'd' from the end
    else expires = 1;

    const token = createToken(user._id, expires);

    const cookieSettings = {
        expires: new Date(
            Date.now() + expires * 86400 * 1000,
        ),
        httpOnly: true,
    };

    if (process.env.NODE_ENV === "production") cookieSettings.secure = true; cookieSettings.domain = '.virtrade.gg';

    res.cookie('jwt', token, cookieSettings);

    if (options && options.redirect === 'true') {
        return res.redirect('/');
    }

    return res.status(200).json({ info: 'success', message: 'successfully added jwt cookie' });
};

exports.protect = async (req, res, next) => {
    const token = req.cookies.jwt;
    if (!token) return res.status(401).json({ info: 'unauthorized', message: 'No token provided' });

    try {
        const decoded = await decodeToken(token);
        req.user = decoded;

        next();
    } catch (err) {
        return res.status(400).json('Invalid token.');
    }
};

exports.getUserIdFromJwt = async (jwt) => {
    if (!jwt) return false;

    try {
        return (await decodeToken(jwt)).id;
    } catch (e) {
        // console.error(e);
        return false;
    }
};

// GET api/auth/getUser
exports.getUser = async (req, res, next) => {
    const user = await User.findById(req.user.id).select('-__v');

    return res.status(200).json({ info: 'success', message: 'successfully got user', user });
};

// Currently used for messaging
exports.getUsernameById = async (req, res, next) => {
    
    const { userId } = req.params;

    const userDB = await User.findOne({ "_id": userId }, { username: 1 });

    if (!userDB) {
        return res
            .status(400)
            .json({ info: 'userId', message: 'Invalid userId' });
    }


    return res.status(200).json({ info: 'success', username: userDB.username})
    
}

// Currently used for reputation search
exports.getIdsByUsername = async (req, res, next) => {

    let { username } = req.body;

    username = username.replace(/\|/g, '\\|');

    if (!username) return res.status(400).json({ info: 'error', message: 'No username provided' });

    const usersDB = await User.find({ username: {'$regex': `^${username}`, '$options': 'i'}}, { username: 1}).sort({ username: 1 }).limit(15).maxTimeMS(3000);

    if (usersDB.length < 1) return res.status(400).json({ info: 'error', message: 'No users were found' });

    return res.status(200).json({ info: 'success', users: usersDB })
}


// GET api/auth/getUserByUsername
exports.getUserByUsername = async (req, res, next) => {
    const { username } = req.params;
    // if (!username) return res ...
    
    const regex = new RegExp(['^', username, '$'].join(''), 'i'); // make the search case insensitive
    const user = await User.find({ username: regex }, { _id: 1 });
    if (user.length < 1) return res.status(400).json({ info: 'no user', message: `user was not found by the name of ${username}` });

    return res.status(200).json({ info: 'success', message: 'successfully got user', user: user[0] });
};

// POST api/auth/login
exports.login = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    const { keepLogged } =  req.query;
    let email, password;

    // Decode base64 credentials
    if (authHeader) {
        const decodedAuth = Buffer.from(authHeader.split(" ")[1], 'base64').toString();
    
            email = decodedAuth.split(":")[0];
            password = decodedAuth.split(":")[1];
    }
    

    const { error } = validateLogin({ email, password });
    if (error) return res.status(400).json({ info: 'invalid credentials', message: error.details[0].message });

    const query = parseEmail(email) === true ? { email } : { username: email };
    const user = await User.findOne(query).select('+password');


    if (!user || !user.password || !(await user.correctPassword(password, user.password))) {
        return res.status(400).json({ info: 'logorpass', message: "credentials don't match any users" });
    }

    return createSendToken(user, res, { keepLogged });
};


// POST api/auth/signup
exports.signup = async (req, res, next) => {
   
    const authHeader = req.headers.authorization;
    let username, email, password, passwordConfirm;

    // Decode base64 credentials
    if (authHeader) {
        const decodedAuth = Buffer.from(authHeader.split(" ")[1], 'base64').toString();
    
            username = decodedAuth.split(":")[0]
            email = decodedAuth.split(":")[1];
            password = decodedAuth.split(":")[2];
            passwordConfirm = decodedAuth.split(":")[3]
    }

    const { error } = validateSignup({ username, email, password, passwordConfirm });
    if (error) return res.status(400).json({ info: 'invalid credentials', message: error.details[0].message });

    let result = await user.validateEmail(email);
    if (!result) return res.status(400).json({ info: 'email', message: 'this email is taken' });

    result = await user.validateUsername(username);
    if (!result) return res.status(400).json({ info: 'username', message: 'this username is taken' });

    const newUser = await User.create({
        username, email, password, passwordConfirm, activatedAccount: false
    });

    await sendEmail('signup', newUser);

    return createSendToken(newUser, res);
};

// POST api/auth/createTestUser
exports.createTestUser = async (req, res, next) => {
    const { username } = req.body;

    const password = crypto.randomBytes(8).toString('hex');

    const user = new TestUser({ username, password });
    await user.save();

    return res.json({ status: 'success', message: 'successfully created a test user' });
};

// GET api/auth/getTestUsers
exports.getTestUsers = async (req, res, next) => {
    const testers = await TestUser.find({}).select('-_id -__v');

    return res.status(200).json({ info: 'success', message: 'successfully got all test user', testers });
};

// DELETE api/auth/deleteTestUser
exports.deleteTestUser = async (req, res, next) => {
    const { username } = req.body;

    await TestUser.deleteOne({ username });
    // .then(result => res.json({ status: `Deleted ${result.deletedCount} item.`}))
    // .catch(err => res.json({ status: `Delete failed with error: ${err}`}))

    return res.json({ status: 'success', info: `test user ${username} was deleted` });
};

// MIDDLEWARE
exports.adminOnly = async (req, res, next) => {
    const user = await User.findById(req.user.id).select('-__v');

    if (user.role !== 'admin') { return res.status(403).json({ info: 'forbidden', message: "looks like you don't have the permission to access this floor" }); }

    next();
};

exports.activatedAccountOnly = async (req, res, next) => {
    const user = await User.findById(req.user.id);

    if (!user.activatedAccount) return res.status(200).json({ info: 'error', message: 'Confirmed email is required to access this feature!' });

    next();

}

exports.passportLoginOrCreate = async (req, res, next) => {
    const { user } = req;
    let passportUser;
    const loginMethod = user.method;
    let { username } = user;

    // Checks if user already exists in DataBase
    passportUser = await User.findOne({ [`${loginMethod}.id`]: user.id });

    if (passportUser) {
        return createSendToken(passportUser, res, { redirect: 'true', keepLogged: 'true' });
    }

    // Checks if username is available
    let registeredUser = await validateUsername(username);

    // If not, Slice username to 11 char + add 4 random numbers
    if (!registeredUser) username = username.slice(0, 11) + genNumber(4);

    // Checks if its still available after adding 4 random numbers. Just in case
    registeredUser = await validateUsername(username);
    if (!registeredUser) return res.status(400).json({ info: 'error', message: 'Taken username. Please try again!' });

    // Create user
    passportUser = await User.create({ [`${loginMethod}.id`]: user.id, [`${loginMethod}.username`]: user.username, [`${loginMethod}.signedUpWith`]: true, username, activatedAccount: true });

    return createSendToken(passportUser, res, { redirect: 'true', keepLogged: 'true' });
};


// For xbox, steam and discord linking
exports.passportLinkPlatform = async(req, res, next) => {

    const { user, userJwt } = req;

    const platform = user.method;

    // if (!platform) return res.status(200).json({ info: 'error', message: 'invalid platform provided' });
    if (!platform) return res.redirect(`${envURL}account/settings/platforms`);

    // if (!user || !user.username || !user.id) return res.status(200).json({ info: 'error', message: 'Unknown error. Please try again later' });
    if (!user || !user.username || !user.id) return res.redirect(`${envURL}account/settings/platforms`);

    const userDb = await User.findById(userJwt.id).select('-__v');

    // if (!userDb) return res.status(200).json({ info: 'error', message: 'invalid user' });
    if (!userDb) return res.redirect(`${envURL}account/settings/platforms`);

    // if (userDb[platform].id) return res.status(200).json({ info: 'error', message: `${platform} account already linked` });
    if (userDb[platform].id) return res.redirect(`${envURL}account/settings/platforms`);

    const usernameAvailability = await User.findOne({ [`${platform}.username`]: user.username });
    const idAvailability = await User.findOne({ [`${platform}.id`]: user.id });

    // if (usernameAvailability || idAvailability) return res.status(200).json({ info: 'error', message: 'username already linked to another virtrade account' });
    if (usernameAvailability || idAvailability) return res.redirect(`${envURL}account/settings/platforms`);
    
    userDb[platform].username = user.username;
    userDb[platform].id = user.id;
    if (platform === 'steam' || platform === 'discord') userDb[platform].signedUpWith = false;

    await userDb.save();

    return res.redirect(`${envURL}account/settings/platforms`);

}


// rename user into userJwt, since req.user would be overwritten by passport
exports.passportPlatformHelper = async(req, res, next) => {
    req.userJwt = req.user;
    next();
}

// PUT api/auth/confirmEmail
exports.confirmEmail = async (req, res, next) => {
    const { code } = req.body;
    const decodedCode = await decodeToken(code);

    const userDB = await User.findById(decodedCode.id).select('verificationToken');
    if (!userDB) return res.status(200).json({ info: 'error', message: 'user not found' });

    const result = await userDB.compareTokens(decodedCode.code, userDB.verificationToken);

    if (!result || userDB.activatedAccount) return res.status(200).json({ info: 'error', message: 'invalid verification code or account already activated' });
        
    userDB.activatedAccount = true;
    userDB.verificationToken = null;
    await userDB.save();

    return res.status(200).json({ info: 'success', message: 'successfully confirmed email!' });
    
};

exports.resendSignupEmail = async (req, res, next) => {
    const user = await User.findById(req.user.id)

    if (user.activatedAccount === true) return res.status(200).json({ info: 'error', message: 'email is already verified' });

    await sendEmail('signup', user);

    return res.status(200).json({ info: 'success', message: 'successfully sent a verification token' });
};

// DELETE api/auth/logout
exports.logout = async (req, res, next) => {
    res.clearCookie('jwt');

    return res.json({ status: 'success' });
};

// PUT api/auth/updateUsername
exports.updateUsername = async (req, res, next) => {
    const user = await User.findById(req.user.id).select('-__v');
    const { newUsername } = req.body;

    // Find user, if user exists change his username if new one matches the regex and hasn't been changed in the past 30 days
    if (!newUsername || !newUsername.match(/^(?!.*[ ]{2,})[a-zA-Z0-9 _-]{2,15}$/gm)) return res.status(200).json({ info: 'error', message: 'invalid username provided!' });

    if (user.usernameChangedAt > new Date(Date.now() - 86400 * 1000 * 30)) return res.status(200).json({ info: 'error', message: 'days30' });

    const validateName = await User.findOne({ username: newUsername }).collation({ locale: 'en', strength: 2 });
    if (validateName) return res.status(200).json({ info: 'error', message: 'username' });

    user.username = newUsername;
    user.usernameChangedAt = Date.now();

    await user.save();

    return res.status(200).json({ info: 'success', message: 'successfully changed the username', newUsername });
};

// PUT api/auth/updateEmail
exports.updateEmail = async (req, res, next) => {
    const { code } = req.body;
    const decodedCode = await decodeToken(code);

    const user = await User.findById(decodedCode.id).select('-__v +verificationToken');
    if (!user) return res.status(200).json({ info: 'error', message: 'invalid user' });

    const takenEmail = await User.findOne({ email: decodedCode.email }).collation({ locale: 'en', strength: 2 });
    if (takenEmail || !decodedCode.email) return res.status(200).json({ info: 'error', message: 'email is already taken' });

    user.email = decodedCode.email;
    await user.save();

    return res.status(200).json({ info: 'success', username: user.username, newEmail: decodedCode.email });
};

// POST api/auth/sendResetEmailToken
exports.sendUpdateEmailToken = async (req, res, next) => {
    const user = await User.findById(req.user.id).select('-__v');
    if (!user) return res.status(200).json({ info: 'error', message: 'invalid user' });

    const { newEmail } = req.body;

    const takenEmail = await User.findOne({ email: newEmail }).collation({ locale: 'en', strength: 2 });
    if (takenEmail) return res.status(200).json({ info: 'error', message: 'email is already taken' });

    if (!newEmail || !parseEmail(newEmail)) {
        return res.status(200).json({ info: 'error', message: 'invalid email format provided' });
    }

    await sendEmail('emailUpdate', user, newEmail);

    return res.status(200).json({ info: 'success', message: `successfully sent a verification link to ${user.email}` });
};


// PUT api/auth/updatePassword
exports.updatePassword = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.user.id).select('-__v');
    const { password, passwordConfirm, newPassword } = req.body;
    const userDB = await User.findById(user._id).select('+password');

    if (!newPassword.match(/^[\!@#$%^&*()\\[\]{}\-_+=~`|:;"'<>,./?a-zA-Z0-9]{6,30}$/m)) { return res.status(200).json({ info: 'regex', message: 'password contains innapropriate characters' }); }

    if (await userDB.correctPassword(password, userDB.password) === false) { return res.status(200).json({ info: 'wrongpass', message: 'current password doesn\'t match' }); }

    userDB.password = newPassword;
    await userDB.save();

    return res.status(200).json({ info: 'success', message: 'successfully updated password' });
});


// PUT api/auth/resetPassword
exports.resetPassword = catchAsync(async (req, res, next) => {
    const { code, password, passwordConfirm } = req.body;
    const decodedCode = await decodeToken(code);
    const user = await User.findById(decodedCode.id).select('-__v +verificationToken');

    if (await user.compareTokens(decodedCode.code, user.verificationToken) && password === passwordConfirm) {
        user.password = password;
        user.verificationToken = null;
        await user.save();
        return res.status(200).json({ info: 'success', message: 'successfully updated password' });
    }

    return res.status(200).json({ info: 'error', message: 'error resetting the password' });
});

// POST api/auth/sendResetPasswordToken
exports.sendResetPasswordToken = async (req, res, next) => {
    const { email } = req.body;

    const user = await User.findOne({ email }).collation({ locale: 'en', strength: 2 });


    if (!user) return res.status(200).json({ info: 'error', message: 'user with specified email does not exist' });
    if (!user.activatedAccount) return res.status(200).json({ info: 'error', message: 'email address needs to be confirmed' });

    await sendEmail('passwordReset', user);

    return res.status(200).json({ info: 'success', message: 'successfully sent an email' });
};


exports.linkPlatform = async (req, res, next) => {

    const { platform } = req.query;
    const { username } = req.body;


    const validPlatforms = ['psn', 'epic', 'switch'];
    if (!validPlatforms.includes(platform)) return res.status(200).json({ info: 'error', message: 'invalid platform provided' });
    if (!username) return res.status(200).json({ info: 'error', message: 'no username provided' });

    if (platform === 'switch' && !username.match(/SW-\d{4}-\d{4}-\d{4}$/)) return res.status(200).json({ info: 'error', message: `invalid ${platform} username format` });
    if (platform === 'psn' && username.length > 16) return res.status(200).json({ info: 'error', message: `invalid ${platform} username format` });
    if (platform === 'epic' && username.length > 20) return res.status(200).json({ info: 'error', message: `invalid ${platform} username format` });

    const user = await User.findById(req.user.id).select('-__v');
    if (!user) return res.status(200).json({ info: 'error', message: 'invalid user' });

    if (user[platform].username) return res.status(200).json({ info: 'error', message: `${platform} account already linked` });



    const usernameAvailability = await User.findOne({ [`${platform}.username`]: username }).select('-__v');
    if (usernameAvailability) return res.status(200).json({ info: 'error', message: 'username already linked to another account' });

    user[`${platform}`].username = username;
    user[`${platform}`].verified = false;

    await user.save();

    return res.status(200).json({ info: 'success', message: 'successfully linked platform' });

}

exports.unlinkPlatform = async (req, res, next) => {

    const { platform } = req.query;

    
    const validPlatforms = ['psn', 'epic', 'switch', 'xbox', 'steam', 'discord'];
    if (!validPlatforms.includes(platform)) return res.status(200).json({ info: 'error', message: 'invalid platform provided' });

    const user = await User.findById(req.user.id).select('-__v');
    if (!user) return res.status(200).json({ info: 'error', message: 'invalid user' });

    if ((platform === 'steam' || platform === 'discord') && user[platform].signedUpWith) return res.status(200).json({ info: 'error', message: "Can't unlink platform you signed up with. Please contact us on discord or at support@virtrade.gg if you'd like to do so!" });

    user[`${platform}`] = {};
    await user.save();

    return res.status(200).json({ info: 'success', message: 'successfully unlinked platform' });

}

exports.getPlatformUnverifiedUsers = async (req, res, next) => {

    if (req.query.from !== 'platformserver') {
        return res.status(401).json({ info: 'error', message: 'Unauthorized' });
    }

    const { platform } = req.query;


    if (platform !== 'psn' && platform !== 'epic') return res.status(200).json({ info: 'error', message: 'invalid platform provided' });

    
   
    const users = await User.find( { [`${platform}.verified`]: false}, { [platform]: 1 });

    
    if (users.length < 1) return res.status(200).json({ info: 'error', message: 'none unverified users' });

    return res.status(200).json({ info: 'success', users });


}

exports.verifyPlatformUser = async (req, res, next) => {

    if (req.query.from !== 'platformserver') {
        return res.status(401).json({ info: 'error', message: 'Unauthorized' });
    }

    const { platform } = req.query;
    if (platform !== 'psn' && platform !== 'epic') return res.status(200).json({ info: 'error', message: 'invalid platform provided' });

    const { user } = req.body;


    const userDb = await User.findById(user._id);

    if (userDb && userDb[platform].username === user[platform].username) {
        userDb[platform].verified = true;
        await userDb.save();
        const socket = req.app.get('socket');
        socket.notifyPlatformConfirmation(user._id, platform);
        return res.status(200).json({ info: 'success', message: 'successfuly verified the user' });
    }

    return res.status(200).json({ info: 'error' });

}

async function sendEmail(type, user, newEmail) {

    const emailToken = await user.generateEmailToken();
    await user.save();

    const token = await createToken(user._id, 1, emailToken, newEmail);
    const Email = new EmailingSystem({ email: user.email })

    if (type === 'signup') await Email.sendSignup(token);
    if (type === 'passwordReset') await Email.sendPasswordReset(token);
    if (type === 'emailUpdate') await Email.sendEmailUpdate(token, newEmail);

}


function parseEmail(email) {
    const regex = /^[^\s@]+@[^\s@\.]+(\.[^\s@.]+)+$/;

    return regex.test(email);
}

function genNumber(times = 1) {
    let num = '';

    for (let i = 0; i < times; i++) {
        const j = Math.round(Math.random() * (9 - 0) + 0);
        num += j;
    }

    return num;
}

exports.createToken = createToken;
