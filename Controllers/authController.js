const jwt = require('jsonwebtoken');
const { promisify } = require('util');


const EmailingSystem = require('../misc/EmailingSystem');
const catchAsync = require('../misc/catchAsync');
const AppError = require('../misc/AppError');


const User = require('../Models/userModel');

const createToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
});

const createSendToken = (user, res, option) => {
    const expires = process.env.JWT_EXPIRES_IN.slice(0, -1); // Delete 'd' from the end
    const token = createToken(user._id);


    const cookieSettings = {
        expires: new Date(
            Date.now() + expires * 86400 * 1000,
        ),
        httpOnly: true,
    };

    if (process.env.NODE_ENV === 'production') cookieSettings.secure = true;


    res.cookie('jwt', token, cookieSettings);


    if (option === 'redirect') {
        return res.redirect('/');
    }
    return res.json({ status: 'success' });
};


const sendEmail = async (user) => {
    // const user = await User.findById('5ea87e2930da1617545e0c6f');
    const emailToken = await user.generateToken();
    await user.save();
    const Email = new EmailingSystem({ email: user.email, id: user._id })
        .sendSignup(emailToken);
    await Email;
};

function validateEmail(email) {
    var regex = /^[^\s@]+@[^\s@\.]+(\.[^\s@.]+)+$/;
    return regex.test(email);
}

function genNumber(times = 1) {
    let num = '';

    for (let i = 0; i < times; i++) {

        let j = Math.round(Math.random() * (9 - 0) + 0);
        num = num + j

    }

    return num;
}


exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;


    if (!email || !password) return next(new AppError('invalid'));

    // Check if email or username supplied
    const query = validateEmail(email) === true ? { email } : { username: email };



    const user = await User.findOne(query).select('+password');



    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError('logorpass'));
    }

    return createSendToken(user, res);
});


exports.signup = catchAsync(async (req, res, next) => {


    let {
        username, email, password, passwordConfirm,
    } = req.body;


    if (username == null || email == null) return next(new AppError());


    const validateEmail = await User.findOne({ email }).collation({ locale: "en", strength: 2 });
    if (validateEmail) {

        if (validateEmail.confirmedEmail === false && validateEmail.tokenCreatedAt > (Date.now() - 15 * 60 * 1000)) {

            // Remove account with unconfirmed email created 15+ mins ago
            await User.deleteOne({ id: validateEmail._id });

        } else {
            return next(new AppError('email'));
        }
    }

    const validateName = await User.findOne({ username }).collation({ locale: "en", strength: 2 });
    if (validateName) return next(new AppError('username'));



    const newUser = await User.create({
        username, email, password, passwordConfirm,
    });

    await sendEmail(newUser);
    return createSendToken(newUser, res);
});

exports.passportLoginOrCreate = catchAsync(async (req, res, next) => {
    const { user } = req;
    let passportUser;
    let loginMethod = user.method;
    let username = user.username;

    // returnResponse - sets JWT token in cookie
    const returnResponse = createSendToken(passportUser, res, 'redirect');

    // Checks if user already exists in DataBase
    passportUser = await User.findOne({ loginMethod: user.id });
    if (passportUser) return returnResponse;


    // Checks if username is available
    registeredUser = await User.findOne({ username: username }).collation({ locale: "en", strength: 2 });

    // If not, Slice username to 13 char + add 3 random numbers
    if (registeredUser) username = username.slice(0, 13) + genNumber(3);

    // Create user
    passportUser = await User.create({ loginMethod: user.id, username });

    return returnResponse;

});


exports.getUser = catchAsync(async (req, res, next) => {
    const { user } = req;

    if (user && user !== undefined) {
        return res.json({ user, status: 'success' });
    }

    return next(new AppError('unauthorized'));
});


exports.protect = catchAsync(async (req, res, next) => {
    let token;
    if (req.cookies.jwt) {
        token = req.cookies.jwt;
    }

    if (!token) return next(new AppError('unauthorized'));

    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('-__v');

    req.user = user;
    next();
});

exports.confirmEmail = catchAsync(async (req, res, next) => {
    const { user } = req.params;
    const { code } = req.params;



    const userDB = await User.findById(user);
    if (!userDB) return next(new AppError());


    const result = await userDB.compareTokens(code, userDB.verificationToken);


    if (result === true && !userDB.confirmedEmail) {
        userDB.confirmedEmail = true;
        await userDB.save();
        return res.json({ status: 'success' });
    }

    next(new AppError('OldOrInvalid'));
});

// exports.resendCode = catchAsync(async (req, res, next) => {
//     const { user } = req;

//     if (user.confirmedEmail === true) return next(new AppError());

//     await sendEmail(user);
//     return res.json({ status: 'success' });
// });

exports.logout = catchAsync(async (req, res, next) => {

    res.clearCookie('jwt');
    return res.json({ status: 'success' });

})


exports.updateUsername = catchAsync(async (req, res, next) => {
    const { user } = req;

    const newUsername = req.body.username;

    // Find user, if user exists change his username if new one matches the regex and hasn't been changed in the past 30 days

    if (!newUsername || !newUsername.match(/^(?!.*[ ]{2,})[a-zA-Z0-9 _-]{2,15}$/gm)) return next(new AppError(1));

    if (user.usernameChangedAt > new Date(Date.now() - 86400 * 1000)) return next(new AppError('days30'));

    const validateName = await User.findOne({ username: newUsername }).collation({ locale: "en", strength: 2 });
    if (validateName) return next(new AppError('username'));


    user.username = newUsername;
    user.usernameChangedAt = Date.now();

    await user.save();

    return res.json({ status: 'success' });


})

exports.updateEmail = catchAsync(async (req, res, next) => {
    const { user } = req;
    const { newEmail } = req.body;


    takenEmail = await User.findOne({ email: newEmail }).collation({ locale: "en", strength: 2 });

    if (newEmail && validateEmail(newEmail) && !takenEmail) {

        user.email = newEmail;
        await user.save();
        return res.json({ status: 'success' });
    }

    return next(new AppError());

    // Update user's email if it matches regex

});

exports.updatePassword = catchAsync(async (req, res, next) => {
    const { user } = req;

    const { password, passwordConfirm, newPassword } = req.body;

    const userDB = await User.findById(user._id).select('+password');

    if (newPassword.match(/^[\!@#$%^&*()\\[\]{}\-_+=~`|:;"'<>,./?a-zA-Z0-9]{4,30}$/gm) && (await userDB.correctPassword(password, userDB.password))) {



        userDB.password = newPassword;

        await userDB.save();

        return res.json({ status: 'success' });
    };


    return next(new AppError('error'));

});

