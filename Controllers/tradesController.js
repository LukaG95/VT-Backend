const { promisify } = require('util')
const TradeRL = require('../Models/tradesRLModel')

const AdvancedQueryRL = require('../misc/AdvancedQueryRL')
const catchAsync = require('../misc/catchAsync')
const AppError = require('../misc/AppError')
const {readableCreatedAt} = require('../misc/time')
const { User } = require('../Models/userModel')

const items = require('../misc/items.json')

exports.getTrades = async (req, res, next) => {
  const { query } = req

  const advancedQuery = new AdvancedQueryRL(TradeRL.find(), query)
    .filter()
    .paginate()
    .sortByLatest()

  const trades = await advancedQuery.query.populate('user')
  const pages = Math.ceil((await TradeRL.countDocuments(advancedQuery.resetQuery().query)) / advancedQuery.limit)

  return res.json({ trades: readableCreatedAt(trades), pages })
}

exports.getUserTrades = async (req, res, next) => {
  const user = await User.findById(req.user.id).select('-__v')

  const { searchId } = req.query
  if (!searchId || searchId.length !== 24) return res.status(400).json({info: "searchId", message: "Invalid searchId"})

  const trades = await TradeRL.find({ user: searchId }).populate('user')
  if (!trades) return res.status(404).json({info: "no trades", message: "trades with given id don't exist"})

  const idMatch = user._id.toHexString() === trades[0].user._id.toHexString()

  return res.status(200).json({ info: 'success', idMatch: idMatch, trades: readableCreatedAt(trades)})
}

exports.getTrade = async (req, res, next) => {
  const user = await User.findById(req.user.id).select('-__v')

  const { tradeId } = req.params
  if (!tradeId || tradeId.length !== 24) return res.status(400).json({info: "tradeId", message: "Invalid tradeId"})

  const trade = await TradeRL.findById(tradeId)
  if (!trade) return res.status(404).json({info: "no trade", message: "trade with given id doesn't exist"})

  const idMatch = user._id.toHexString() === trade.user._id.toHexString()

  return res.json({ info: 'success', idMatch: idMatch, trade })
}


exports.createTrade = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('-__v')
  const { have, want, platform, notes } = req.body

  if (have.length > 12 || want.length > 12) return res.status(400).json({info: ">items", message: "Too many items added"})
  if (have.length <= 0 || want.length <= 0) return res.status(400).json({info: "<items", message: "Not enough items added"})

  const tradeDetails = {
    user: user._id,
    have: have,
    want: want,
    platform: platform,
    notes: notes,
    createdAt: Date.now()
  }

  await new TradeRL(tradeDetails).save()
  return res.status(200).json({info: "success", message: "trade was created"})
})

exports.editTrade = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('-__v')
  
  const { have, want, platform, notes } = req.body
  const { tradeId } = req.query

  const tradeDetails = {
    have: have,
    want: want,
    platform: platform,
    notes: notes,
    editedAt: Date.now()
  }

  if (have.length > 12 || want.length > 12) return res.status(400).json({info: ">items", message: "Too many items added"})
  if (have.length <= 0 || want.length <= 0) return res.status(400).json({info: "<items", message: "Not enough items added"})

  if (!tradeId || tradeId.length !== 24) return res.status(400).json({info: "tradeID", message: "Invalid tradeID"})

  const trade = await TradeRL.findById(tradeId)
  if (!trade) return res.status(404).json({info: "no trade", message: "trade with given id doesn't exist"})

  if (trade.user.toHexString() !== user._id.toHexString()) return res.status(401).json({info: "forbidden", message: "can't edit others trades"})

  await TradeRL.findOneAndUpdate({ _id: trade._id }, tradeDetails, { useFindAndModify: false })
  return res.status(200).json({info: "success", message: "trade was edited"})
})

exports.bumpTrade = async (req, res, next) => {
  const user = await User.findById(req.user.id).select('-__v')

  const { tradeId } = req.query
  if (!tradeId || tradeId.length !== 24) return res.status(400).json('Invalid tradeId')

  const trade = await TradeRL.findById(tradeId)
  if (trade.user.toHexString() !== user._id.toHexString()) return res.status(401).json({info: "unauthorized", message: "can't bump others trades"})

  trade.createdAt = Date.now()
  await trade.save()

  return res.status(200).json({ info: 'success', message: 'trade was bumped' })
}

exports.deleteTrade = async (req, res, next) => {
  const user = await User.findById(req.user.id).select('-__v')

  const { tradeId } = req.query
  if (!tradeId || tradeId.length !== 24) return res.status(400).json('Invalid tradeId')

  const trade = await TradeRL.findById(tradeId)
  if (trade.user.toHexString() !== user._id.toHexString()) return res.status(401).json({info: "unauthorized", message: "can't delete others trades"})

  await trade.deleteOne()
  return res.status(200).json({ info: 'success', message: 'trade was deleted' })
}

exports.deleteTrades = async (req, res, next) => {
  const user = await User.findById(req.user.id).select('-__v')

  await TradeRL.deleteMany({ user: user._id })
  return res.status(200).json({ info: 'success', message: 'deleted all trades' })
}
