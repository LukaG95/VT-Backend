const jwt = require('jsonwebtoken');
const { promisify } = require('util');


const User = require('../Models/userModel');

const createToken = (id, expiresIn) => jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn,
});

const createSendToken = (user, res, option) => {
    let expiresIn = process.env.JWT_EXPIRES_IN;
    const token = createToken(user._id, expiresIn);
    expiresIn = expiresIn.slice(0, -1);


    const cookieSettings = {
        expires: new Date(
            Date.now() + expiresIn * 86400 * 1000,
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
            username, email, password,
        } = req.body;


        const newUser = await User.create({
            username, email, password,
        });


        createSendToken(newUser, res);
    } catch (err) {
        return res.json({ status: 'error' });
    }
};

exports.passportLoginOrCreate = async (req, res) => {
    const { user } = req;

    try {
        if (user.method === 'steam') {
            const steam = req.user.id;
            const username = req.user.displayName;
            const passportUser = await User.findOne({ steam }).then((data) => data || User.create({ steam, username }));
            createSendToken(passportUser, res, 'redirect');
        } if (user.method === 'discord') {
            const discord = req.user.id;
            const { username } = req.user;
            const passportUser = await User.findOne({ discord }).then((data) => data || User.create({ discord, username }));

            createSendToken(passportUser, res, 'redirect');
        }
    } catch (err) {
        console.log(err);
    }
};


exports.getUser = async (req, res) => {
    let token;
    if (req.cookies.jwt) {
        token = req.cookies.jwt;
    }

    if (!token) return res.json({ status: 'unauthorized' });

    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    const currentUser = await User.findById(decoded.id).select('-__v -_id');

    return res.json({ user: currentUser });
};
