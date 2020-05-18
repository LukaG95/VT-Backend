const { promisify } = require('util');
const TradeRL = require('../Models/tradesRLModel');

const AdvancedQueryRL = require('../misc/AdvancedQueryRL');
const catchAsync = require('../misc/catchAsync');
const AppError = require('../misc/AppError');
const dateToAgo = require('../misc/dateToAgo');


exports.getTrades = catchAsync(async (req, res, next) => {
    const advancedQuery = new AdvancedQueryRL(TradeRL.find(), req.query)
        .filter()
        .paginate()
        .sortByLatest();


    const trades = await advancedQuery.query;
    const pages = Math.ceil((await TradeRL.countDocuments(advancedQuery.resetQuery().query)) / advancedQuery.limit);

    const editedTrades = trades.map((trade) => {
        const editedTrade = trade.toObject();
        editedTrade.createdAt = dateToAgo(editedTrade.createdAt);
        return editedTrade;
    });


    return res.json({ trades: editedTrades, pages });
});


exports.createTrade = catchAsync(async (req, res, next) => {
    const { user } = req;
    const { have, want, platform } = req.body;
    let steamAccount = null;
    if (user.steam) steamAccount = `https://steamcommunity.com/profiles/${user.steam}`;

    if (have.length > 12 || want.length > 12) return next(new AppError('invalid'));

    // return res.json({ status: 'invalid' });

    const tradeDetails = {
        userId: user._id,
        username: user.username,
        steamAccount,
        have,
        want,
        platform,
    };

    const newTrade = await new TradeRL(tradeDetails).save();
    return res.json({ status: 'success', newTrade });
});
