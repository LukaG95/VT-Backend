const jwt = require('jsonwebtoken');
const { promisify } = require('util');


const EmailingSystem = require('../misc/EmailingSystem');


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


exports.login = async (req, res) => {
    const { email, password } = req.body;


    try {
        const user = await User.findOne({ email }).select('+password');


        if (!user || !(await user.correctPassword(password, user.password))) {
            return res.json({ status: 'logorpass' });
        }

        return createSendToken(user, res);
    } catch (err) {
        return res.json({ status: 'error' });
    }
};


exports.signup = async (req, res) => {
    try {
        const {
            username, email, password, passwordConfirm,
        } = req.body;


        const newUser = await User.create({
            username, email, password, passwordConfirm,
        });

        await sendEmail(newUser);
        createSendToken(newUser, res);
    } catch (err) {
        return res.json({ status: 'error' });
    }
};

exports.passportLoginOrCreate = async (req, res) => {
    const { user } = req;
    let passportUser;
    try {
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
    } catch (err) {
        console.log(err);
    }
};


exports.getUser = async (req, res) => {
    const { user } = req;

    if (user && user !== undefined) {
        return res.json({ user, status: 'success' });
    }

    return res.json({ status: 'unauthorized' });
};


exports.protect = async (req, res, next) => {
    let token;
    if (req.cookies.jwt) {
        token = req.cookies.jwt;
    }

    if (!token) return res.json({ status: 'unauthorized' });

    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('-__v');

    req.user = user;
    next();
};

exports.confirmEmail = async (req, res) => {
    try {
        const { user } = req;
        const { code } = req.params;

        const result = await user.compareTokens(code, user.verificationToken);


        if (result === true) {
            user.confirmedEmail = true;
            await user.save();
            return res.json({ status: 'success' });
        }
        res.json({ status: 'OldOrInvalid' });
    } catch (err) {
        res.json({ status: 'error' });
    }
};

exports.resendCode = async (req, res) => {
    try {
        const { user } = req;

        if (user.confirmedEmail === true) return res.json({ status: 'error' });

        await sendEmail(user);
        res.json({ status: 'success' });
    } catch (err) {
        res.json({ status: 'error' });
    }
};
