const { promisify } = require('util');
const TradeRL = require('../Models/tradesRLModel');

const AdvancedQueryRL = require('../misc/AdvancedQueryRL');
const catchAsync = require('../misc/catchAsync');
const AppError = require('../misc/AppError');
const dateToAgo = require('../misc/dateToAgo');

const items = require('../misc/items.json');


exports.getTrades = catchAsync(async (req, res, next) => {
    const { query } = req;
    const advancedQuery = new AdvancedQueryRL(TradeRL.find(), query)
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
    const { edit } = req.query;
    const {
        have, want, platform, notes,
    } = req.body;
    const userRep = req.rep;
    let steamAccount = null;
    if (user.steam) steamAccount = `https://steamcommunity.com/profiles/${user.steam}`;

    if (have.length > 12 || want.length > 12) return next(new AppError('invalid'));

    // return res.json({ status: 'invalid' });
    const getItemName = (arr) => {
        arr.forEach((item, i) => {
            let itemName;
            items.Slots.forEach((type) => type.Items.forEach((item1) => {
                if (item1.ItemID === item.itemID) {
                    itemName = item1.Name;
                }
            }));
            arr[i].itemName = itemName;
            if (!arr[i].itemName || arr[i].itemName === undefined) return next(new AppError('invalid'));
        });
    };

    getItemName(have);
    getItemName(want);

    const tradeDetails = {
        username: user.username,
        reputation: {
            ups: userRep.ups,
            downs: userRep.downs,
        },
        steamAccount,
        have,
        want,
        platform,
        notes,
        createdAt: Date.now(),
    };


    if (edit) {
        if (edit.length !== 24) return next(new AppError());

        const trade = await TradeRL.findById(edit);

        if (trade.userId != user._id) return next(new AppError());


        await TradeRL.findOneAndUpdate({ _id: trade._id }, tradeDetails, { useFindAndModify: false });

        return res.json({ status: 'success' });
    }

    tradeDetails.userId = user._id;


    const newTrade = await new TradeRL(tradeDetails).save();
    return res.json({ status: 'success' });
});


exports.deleteTrade = catchAsync(async (req, res, next) => {
    const tradeId = req.query.id;
    const { all } = req.query;
    const { user } = req;

    if (all === 'true') {
        await TradeRL.deleteMany({ userId: user._id });
        return res.json({ status: 'success' });
    }

    if (!tradeId || tradeId.length !== 24) return next(new AppError('invalid'));

    const trade = await TradeRL.findById(tradeId);

    if (trade.userId != user._id) return next(new AppError('invalid'));

    await TradeRL.findOneAndDelete({ _id: tradeId });

    return res.json({ status: 'success' });
});
