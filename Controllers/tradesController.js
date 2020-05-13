const TradeRL = require('../Models/tradesRLModel');

const AdvancedQueryRL = require('../misc/AdvancedQueryRL');
const catchAsync = require('../misc/catchAsync');
const AppError = require('../misc/AppError');


exports.getTrades = catchAsync(async (req, res, next) => {
    const advanced = new AdvancedQueryRL(TradeRL.find(), req.query)
        .filter()
        .paginate();
    const trades = await advanced.query;
    return res.json({ trades });
});


exports.createTrade = catchAsync(async (req, res, next) => {
    const { user } = req;
    const { have, want, platform } = req.body;

    if (have.length > 12 || want.length > 12) return next(new AppError('invalid'));

    // return res.json({ status: 'invalid' });

    const tradeDetails = {
        userId: user._id,
        username: user.username,
        have,
        want,
        platform,
    };

    const newTrade = await new TradeRL(tradeDetails).save();
    return res.json({ status: 'success', newTrade });
});
