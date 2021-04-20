const mongoose = require('mongoose');
const redis = require('../misc/redisCaching');

const { TradeRL, validateTrade, validateTradeQuery } = require('../Models/tradesRLModel');
const AdvancedQueryRL = require('../misc/AdvancedQueryRL');
const { User } = require('../Models/userModel');
const { readableActiveAt } = require('../misc/time');

exports.getTrades = async (req, res, next) => {
    const { query } = req;
    if (!query) return res.status(400).json({ info: 'query', message: 'No query given' });

    const { error } = validateTradeQuery(query);
    if (error) return res.status(400).json({ info: 'invalid credentials', message: error.details[0].message });

    const advancedQuery = new AdvancedQueryRL(TradeRL.find(), query)
        .filter()
        .paginate()
        .sortByLatest();

    const trades = readableActiveAt(await advancedQuery.query.populate('user', 'username isPremium tags psn epic switch steam.username steam.id xbox.username'));
    const pages = Math.ceil((await TradeRL.countDocuments(advancedQuery.resetQuery().query)) / advancedQuery.limit);


    if (trades.length < 1) return res.status(200).json({ info: 'success', message: 'successfully got trades', trades, pages});
    
    const userIds = trades.map(trade => mongoose.Types.ObjectId(trade.user._id));

    req.trades = trades;
    req.userIds = userIds;
    req.pages = pages;
    
    return next();
};



exports.getUserTrades = async (req, res, next) => {
    const user = await User.findById(req.user.id).select('-__v');

    const searchId = await User.findById(req.query.searchId).select('-__v');
    if (!searchId) return res.status(404).json({ info: 'no user', message: 'user with the given id does not exist' });

    const trades = readableActiveAt(await TradeRL.find({ user: req.query.searchId }).populate('user', 'username isPremium tags psn epic switch steam.username steam.id xbox.username').sort('-bumpedAt'));
    if (trades.length < 1) return res.status(200).json({ info: 'no trades', message: 'user has no trades created', trades: [], username: searchId.username });

    const userIds = [mongoose.Types.ObjectId(searchId._id)];
    const idMatch = user._id.toHexString() === trades[0].user._id.toHexString();

    req.idMatch = idMatch;
    req.userIds = userIds;
    req.trades = trades;
    req.username = searchId.username;

    next();
};

exports.getTrade = async (req, res, next) => {
    const user = await User.findById(req.user.id).select('-__v');

    const { tradeId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(tradeId)) return res.status(400).json({ info: 'tradeId', message: 'Invalid tradeId' });

    const trade = await TradeRL.findById(tradeId);
    if (!trade) return res.status(404).json({ info: 'no trade', message: "trade with given id doesn't exist" });

    const idMatch = user._id.toHexString() === trade.user._id.toHexString();

    return res.json({ info: 'success', idMatch, trade });
};

exports.createTrade = async (req, res, next) => {
    const user = await User.findById(req.user.id).select('-__v');
    const {
        have, want, platform, notes,
    } = req.body;

    const { error } = await validateTrade(req.body, user, req);
    if (error) return res.status(400).json({ info: 'invalid credentials', message: error.details[0].message});

    let formatPlatform = {
      name: platform,
      ID: platformID(platform, user)
    }

    const tradeDetails = {
        user: user._id,
        have,
        want,
        platform: formatPlatform,
        notes,
        createdAt: Date.now(),
        bumpedAt: Date.now(),
    };

    const trade = await new TradeRL(tradeDetails).save();

    // Cache trade id for 10 minutes
    await redis.cache(`${trade._id}`, 1, 600);
    
    return res.status(200).json({ info: 'success', message: 'trade was created' });
};

exports.editTrade = async (req, res, next) => {
    const user = await User.findById(req.user.id).select('-__v');
    const {
        have, want, platform, notes,
    } = req.body;

    const { error } = await validateTrade(req.body, user, req);
    if (error) return res.status(400).json({ info: 'invalid credentials', message: error.details[0].message });

    const { tradeId } = req.query;
    if (!mongoose.Types.ObjectId.isValid(tradeId)) return res.status(400).json({ info: 'tradeId', message: 'Invalid tradeId' });

    const trade = await TradeRL.findById(tradeId);
    if (!trade) return res.status(404).json({ info: 'no trade', message: "trade with given id doesn't exist" });

    let formatPlatform = {
      name: platform,
      ID: platformID(platform, user)
    }

    const tradeDetails = {
        have,
        want,
        platform: formatPlatform,
        notes,
        editedAt: Date.now(),
    };

    if (trade.user.toHexString() !== user._id.toHexString()) return res.status(401).json({ info: 'forbidden', message: "can't edit others trades" });

    await TradeRL.findOneAndUpdate({ _id: trade._id }, tradeDetails, { useFindAndModify: false });

    return res.status(200).json({ info: 'success', message: 'trade was edited' });
};

exports.bumpTrade = async (req, res, next) => {
    const user = await User.findById(req.user.id).select('-__v');

    const { tradeId } = req.query;
    if (!mongoose.Types.ObjectId.isValid(tradeId)) return res.status(400).json({ info: 'tradeId', message: 'Invalid tradeId' });

    const trade = await TradeRL.findById(tradeId);
    if (!trade) return res.status(404).json({ info: 'no trade', message: "trade with given id doesn't exist" });
    if (trade.user.toHexString() !== user._id.toHexString()) return res.status(401).json({ info: 'unauthorized', message: "can't bump others trades" });

    // Check if trade id is cached
    const bumpCheck = await redis.isCached(tradeId)
        if (bumpCheck) return res.status(404).json({ info: 'already bumped', message: "you can bump only once in 10 minutes" });

    trade.bumpedAt = Date.now();
    await trade.save();

    // Cache trade id for 10 minutes
    await redis.cache(`${trade._id}`, 1, 600);

    return res.status(200).json({ info: 'success', message: 'trade was bumped' });
};

exports.deleteTrade = async (req, res, next) => {
    const user = await User.findById(req.user.id).select('-__v');

    const { tradeId } = req.query;
    if (!mongoose.Types.ObjectId.isValid(tradeId)) return res.status(400).json({ info: 'tradeId', message: 'Invalid tradeId' });

    const trade = await TradeRL.findById(tradeId);
    if (!trade) return res.status(404).json({ info: 'no trade', message: "trade with given id doesn't exist" });
    if (trade.user.toHexString() !== user._id.toHexString()) return res.status(401).json({ info: 'unauthorized', message: "can't delete others trades" });

    await trade.deleteOne();
    return res.status(200).json({ info: 'success', message: 'trade was deleted' });
};

exports.deleteTrades = async (req, res, next) => {
    const user = await User.findById(req.user.id).select('-__v');

    await TradeRL.deleteMany({ user: user._id });
    return res.status(200).json({ info: 'success', message: 'deleted all trades' });
};


function platformID(platform, user){
  platform = platform.toLowerCase()

  if (platform === "xbox" || platform === "steam")
    return user[platform].id
  else
    return user[platform].username
}