const { promisify } = require('util');
const TradeRL = require('../Models/tradesRLModel');

const AdvancedQueryRL = require('../misc/AdvancedQueryRL');
const catchAsync = require('../misc/catchAsync');
const AppError = require('../misc/AppError');
const dateToAgo = require('../misc/dateToAgo');
const { User } = require('../Models/userModel')

const items = require('../misc/items.json');

const paintIds = {
    None: 0,
    Crimson: 1,
    Lime: 2,
    Black: 3,
    'Sky Blue': 4,
    Cobalt: 5,
    'Burnt Sienna': 6,
    'Forest Green': 7,
    Purple: 8,
    Pink: 9,
    Orange: 10,
    Grey: 11,
    'Titanium White': 12,
    Saffron: 13,
};

const certIds = {
    None: 0,
    Playmaker: 1,
    Acrobat: 2,
    Aviator: 3,
    Goalkeeper: 4,
    Guardian: 5,
    Juggler: 6,
    Paragon: 7,
    Scorer: 8,
    'Show-Off': 9,
    Sniper: 10,
    Striker: 11,
    Sweeper: 12,
    Tactician: 13,
    Turtle: 14,
    Victor: 15
}


exports.getTrades = catchAsync(async (req, res, next) => {
  const { query } = req

  const advancedQuery = new AdvancedQueryRL(TradeRL.find(), query)
    .filter()
    .paginate()
    .sortByLatest()

  const trades = await advancedQuery.query.populate('user')
  const pages = Math.ceil((await TradeRL.countDocuments(advancedQuery.resetQuery().query)) / advancedQuery.limit)

  const editedTrades = trades.map((trade) => {
    const editedTrade = trade.toObject()
    editedTrade.createdAt = dateToAgo(editedTrade.createdAt)
    return editedTrade
  })

  return res.json({ trades: editedTrades, pages })
})

exports.getTrade = catchAsync(async (req, res, next) => {
  const { id } = req.params

  const trade = await TradeRL.findById(id, { platform: 1, old: 1, notes: 1 })

  return res.json({ status: 'success', trade })
});


exports.createTrade = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('-__v')
  
  const { have, want, platform, notes } = req.body
  const { edit } = req.query
  const userRep = req.rep

  // const totalTrades = await TradeRL.find({ userId: user._id }).length

  if (have.length > 12 || want.length > 12) return res.status(400).json({info: ">items", message: "Too many items added"})
  if (have.length <= 0 || want.length <= 0) return res.status(400).json({info: "<items", message: "Not enough items added"})

  const tradeDetails = {
    username: user.username,
    reputation: {
      ups: userRep.ups,
      downs: userRep.downs
    },
    have: have,
    want: want,
    platform: platform,
    notes: notes
  }

  if (edit) {
    if (edit.length !== 24) return res.status(400).json({info: "tradeID", message: "Invalid tradeID"})

    const trade = await TradeRL.findById(edit)
    if (!trade) return res.status(400).json({info: "no trade", message: "trade with given id doesn't exist"})

    if (trade.userId != user._id) return res.status(404).json({info: "forbidden", message: "can't edit others trades"})

    await TradeRL.findOneAndUpdate({ _id: trade._id }, tradeDetails, { useFindAndModify: false })
    return res.status(200).json({info: "success", message: "trade was edited"})
  }

  tradeDetails.user = user._id
  tradeDetails.createdAt = Date.now()

  await new TradeRL(tradeDetails).save()
  return res.status(200).json({info: "success", message: "trade was created"})
})

exports.bumpTrade = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('-__v')
  const { id } = req.params;

  const trade = await TradeRL.findById(id);
  if (trade.userId != user._id) return next(new AppError());


  trade.createdAt = Date.now();
  await trade.save();

  return res.json({ status: 'success' });

})


exports.deleteTrade = catchAsync(async (req, res, next) => {
  const tradeId = req.query.id;
  const { all } = req.query;
  const user = await User.findById(req.user.id).select('-__v')

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
