const mongoose = require('mongoose')
const Joi = require('joi')

const infoRL = require('../info/infoRL.json')

const tradesRLSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  have: [
    {
      _id: { select: false },

      itemID: {
        type: Number,
        min: 0,
        max: 10000,
        required: true
      },

      itemName: {
        type: String,
        minlength: 1,
        maxlength: 50,
        required: true
      },

      color: {
        type: String,
        minlength: 1,
        maxlength: 50,
        required: true
      },

      colorID: {
        type: String,
        minlength: 1,
        maxlength: 50,
        required: true
      },

      cert: {
        type: String,
        minlength: 1,
        maxlength: 50,
        required: true
      },

      itemType: {
        type: String,
        minlength: 1,
        maxlength: 50,
        required: true
      },

      amount: {
        type: Number,
        min: 1,
        max: 100,
        required: true
      }
    }
  ],

  want: [
    {
      _id: { select: false },

      itemID: {
        type: Number,
        min: 0,
        max: 10000,
        required: true
      },

      itemName: {
        type: String,
        minlength: 1,
        maxlength: 50,
        required: true
      },

      color: {
        type: String,
        minlength: 1,
        maxlength: 50,
        required: true
      },

      colorID: {
        type: String,
        minlength: 1,
        maxlength: 50,
        required: true
      },

      cert: {
        type: String,
        minlength: 1,
        maxlength: 50,
        required: true
      },

      itemType: {
        type: String,
        minlength: 1,
        maxlength: 50,
        required: true
      },

      amount: {
        type: Number,
        min: 1,
        max: 100,
        required: true
      }
    }
  ],

  platform: {
    type: String,
    minlength: 1,
    maxlength: 10,
    enum: ['Steam', 'XBOX', 'PS4', 'SWITCH'],
    required: true
  },

  createdAt: {
    type: Date,
    default: Date.now
  },

  editedAt: {
    type: Date
  },

  bumpedAt: {
    type: Date
  },

  notes: {
    type: 'String',
    maxlength: 300,
    default: ""
  },

  __v: { type: Number, select: false }
})

const TradeRL = mongoose.model('Trades', tradesRLSchema)

exports.TradeRL = TradeRL

exports.validateTrade = async (trade, user, req) => {
  const tradeLimit = user.isPremium ? 20 : 15
  const itemsLimit = user.isPremium ? 12 : 10

  if (trade.notes.match(/\b(?:http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+(?:[\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(?::[0-9]{1,5})?(?:\/.*)?\b/gm))
    return {error: {details: [{message: 'No links allowed'}]}}

  const trades = await TradeRL.find({ user: req.user.id })
    if (trades.length >= tradeLimit) return {error: {details: [{message: 'Trade amount limit'}]}} // because that's how Joi returns the error

  let allItemIDs = [], allItemNames = [], checker = 0

  infoRL.Slots.map(Slot => Slot.Items.map(item => {
    if (item.Tradable){
      allItemIDs.push(item.ItemID)
      allItemNames.push(item.Name)

      for (let i = 0; i < trade.have.length; i++) // this checks if itemID and itemName are related
        if (trade.have[i].itemID === item.ItemID)
          if (trade.have[i].itemName === item.Name)
           checker++

      for (let i = 0; i < trade.want.length; i++)
        if (trade.want[i].itemID === item.ItemID)
          if (trade.want[i].itemName === item.Name)
            checker++
    }
  }))
  if (checker !==  trade.want.length + trade.have.length) return {error: {details: [{message: "itemID doesn't match with itemName"}]}} 

  const hwValidation = Joi.object({
    itemID: Joi.number().valid(...allItemIDs).required(), 
    itemName: Joi.string().valid(...allItemNames).required(),
    color: Joi.string().valid('None', 'Crimson', 'Lime', 'Black', 'Sky Blue', 'Cobalt', 'Burnt Sienna', 'Forest Green', 'Purple', 'Pink', 'Orange', 'Grey', 'Titanium White', 'Saffron').required(),
    colorID: Joi.string().valid('0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13').required(),
    cert: Joi.string().valid('None', 'Playmaker', 'Acrobat', 'Aviator', 'Goalkeeper', 'Guardian', 'Juggler', 'Paragon', 'Scorer', 'Show-Off', 'Sniper', 'Striker', 'Sweeper', 'Tactician', 'Turtle', 'Victor').required(),
    itemType: Joi.string().valid('item', 'blueprint').required(),
    amount: Joi.number().min(1).max(100)
  })

  const schema = Joi.object({
    have: Joi.array().items(hwValidation).min(1).max(itemsLimit).required(),
    want: Joi.array().items(hwValidation).min(1).max(itemsLimit).required(),
    platform: Joi.string().min(1).max(10).valid('Steam', 'XBOX', 'PS4', 'SWITCH').required(),
    notes: Joi.string().max(300).allow('').required()
  })

  return schema.validate(trade)
}