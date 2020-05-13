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
    const Email = new EmailingSystem({ email: user.email })
        .sendSignup(emailToken);
    await Email;
};


exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;


    const user = await User.findOne({ email }).select('+password');


    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError('logorpass'));
    }

    return createSendToken(user, res);
});


exports.signup = catchAsync(async (req, res, next) => {
    const {
        username, email, password, passwordConfirm,
    } = req.body;


    const newUser = await User.create({
        username, email, password, passwordConfirm,
    });

    await sendEmail(newUser);
    createSendToken(newUser, res);
});

exports.passportLoginOrCreate = catchAsync(async (req, res, next) => {
    const { user } = req;
    let passportUser;

    if (user.method === 'steam') {
        const steam = user.id;
        const username = user.displayName;
        passportUser = await User.findOne({ steam })
            .then((data) => data || User.create({ steam, username }));
    } else if (user.method === 'discord') {
        const discord = user.id;
        const { username } = user;
        passportUser = await User.findOne({ discord })
            .then((data) => data || User.create({ discord, username }));
    }

    createSendToken(passportUser, res, 'redirect');
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
    const { user } = req;
    const { code } = req.params;

    const result = await user.compareTokens(code, user.verificationToken);


    if (result === true) {
        user.confirmedEmail = true;
        await user.save();
        return res.json({ status: 'success' });
    }

    next(new AppError('OldOrInvalid'));
});

exports.resendCode = catchAsync(async (req, res, next) => {
    const { user } = req;

    if (user.confirmedEmail === true) return next(new AppError());

    await sendEmail(user);
    return res.json({ status: 'success' });
});
