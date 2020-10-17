const mongoose = require('mongoose')

const { TradeRL, validateTrade, validateTradeQuery } = require('../Models/tradesRLModel')
const AdvancedQueryRL = require('../misc/AdvancedQueryRL')
const { User } = require('../Models/userModel')
const {readableActiveAt} = require('../misc/time')

exports.getTrades = async (req, res, next) => {
  const { query } = req
  if (!query) return res.status(400).json({info: "query", message: "No query given"})

  const { error } = validateTradeQuery(query)
  if (error) return res.status(400).json({info: "invalid credentials", message: error.details[0].message})

  const advancedQuery = new AdvancedQueryRL(TradeRL.find(), query)
    .filter()
    .paginate()
    .sortByLatest()

  const trades = await advancedQuery.query.populate('user')
  const pages = Math.ceil((await TradeRL.countDocuments(advancedQuery.resetQuery().query)) / advancedQuery.limit)

  return res.status(200).json({ info: 'success', message: 'successfully got trades', trades: readableActiveAt(trades), pages })
}

exports.getUserTrades = async (req, res, next) => {
  const user = await User.findById(req.user.id).select('-__v')
 
  const { searchId } = req.query
  if (!mongoose.Types.ObjectId.isValid(searchId)) return res.status(400).json({info: "searchId", message: "Invalid searchId"})

  const search_user = await User.findById(searchId).select('-__v')
  if (!search_user) return res.status(404).json({info: "no user", message: "that user doesn't exist"})

  const trades = await TradeRL.find({ user: searchId }).populate('user').sort('-bumpedAt')
  if (trades.length < 1) return res.status(200).json({info: "no trades", message: "user has no trades created", trades: [], username: search_user.username})

  const idMatch = user._id.toHexString() === trades[0].user._id.toHexString()

  return res.status(200).json({ info: 'success', idMatch: idMatch, trades: readableActiveAt(trades), username: search_user.username})
}

exports.getTrade = async (req, res, next) => {
  const user = await User.findById(req.user.id).select('-__v')

  const { tradeId } = req.params
  if (!mongoose.Types.ObjectId.isValid(tradeId)) return res.status(400).json({info: "tradeId", message: "Invalid tradeId"})

  const trade = await TradeRL.findById(tradeId)
  if (!trade) return res.status(404).json({info: "no trade", message: "trade with given id doesn't exist"})

  const idMatch = user._id.toHexString() === trade.user._id.toHexString()

  return res.json({ info: 'success', idMatch: idMatch, trade })
}

exports.createTrade = async (req, res, next) => {
  const user = await User.findById(req.user.id).select('-__v')
  const { have, want, platform, notes } = req.body

  const { error } = await validateTrade(req.body, user, req)
  if (error) return res.status(400).json({info: "invalid credentials", message: error.details[0].message})

  const tradeDetails = {
    user: user._id,
    have: have,
    want: want,
    platform: platform,
    notes: notes,
    createdAt: Date.now(),
	bumpedAt: Date.now()
  }

  await new TradeRL(tradeDetails).save()
  return res.status(200).json({info: "success", message: "trade was created"})
}

exports.editTrade = async (req, res, next) => {
  const user = await User.findById(req.user.id).select('-__v')
  const { have, want, platform, notes } = req.body

  const { error } = await validateTrade(req.body, user, req)
  if (error) return res.status(400).json({info: "invalid credentials", message: error.details[0].message})

  const { tradeId } = req.query
  if (!mongoose.Types.ObjectId.isValid(tradeId)) return res.status(400).json({info: "tradeId", message: "Invalid tradeId"})

  const trade = await TradeRL.findById(tradeId)
  if (!trade) return res.status(404).json({info: "no trade", message: "trade with given id doesn't exist"})

  const tradeDetails = {
    have: have,
    want: want,
    platform: platform,
    notes: notes,
    editedAt: Date.now()
  }

  if (trade.user.toHexString() !== user._id.toHexString()) return res.status(401).json({info: "forbidden", message: "can't edit others trades"})

  await TradeRL.findOneAndUpdate({ _id: trade._id }, tradeDetails, { useFindAndModify: false })
  return res.status(200).json({info: "success", message: "trade was edited"})
}

exports.bumpTrade = async (req, res, next) => {
  const user = await User.findById(req.user.id).select('-__v')

  const { tradeId } = req.query
  if (!mongoose.Types.ObjectId.isValid(tradeId)) return res.status(400).json({info: "tradeId", message: "Invalid tradeId"})

  const trade = await TradeRL.findById(tradeId)
  if (!trade) return res.status(404).json({info: "no trade", message: "trade with given id doesn't exist"})
  if (trade.user.toHexString() !== user._id.toHexString()) return res.status(401).json({info: "unauthorized", message: "can't bump others trades"})

  trade.bumpedAt = Date.now()
  await trade.save()

  return res.status(200).json({ info: 'success', message: 'trade was bumped' })
}

exports.deleteTrade = async (req, res, next) => {
  const user = await User.findById(req.user.id).select('-__v')

  const { tradeId } = req.query
  if (!mongoose.Types.ObjectId.isValid(tradeId)) return res.status(400).json({info: "tradeId", message: "Invalid tradeId"})

  const trade = await TradeRL.findById(tradeId)
  if (!trade) return res.status(404).json({info: "no trade", message: "trade with given id doesn't exist"})
  if (trade.user.toHexString() !== user._id.toHexString()) return res.status(401).json({info: "unauthorized", message: "can't delete others trades"})

  await trade.deleteOne()
  return res.status(200).json({ info: 'success', message: 'trade was deleted' })
}

exports.deleteTrades = async (req, res, next) => {
  const user = await User.findById(req.user.id).select('-__v')

  await TradeRL.deleteMany({ user: user._id })
  return res.status(200).json({ info: 'success', message: 'deleted all trades' })
}
