const mongoose = require('mongoose');
const Joi = require('joi');

const infoRL = require('../info/infoRL.json');

const tradesRLSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },

    have: [
        {
            _id: { select: false },

            itemID: {
                type: Number,
                min: 0,
                max: 10000,
                required: true,
            },

            itemName: {
                type: String,
                minlength: 1,
                maxlength: 50,
                required: true,
            },

            color: {
                type: String,
                minlength: 1,
                maxlength: 50,
                required: true,
            },

            colorID: {
                type: Number,
                minlength: 1,
                maxlength: 50,
                required: true,
            },

            cert: {
                type: String,
                minlength: 1,
                maxlength: 50,
                required: true,
            },

            itemType: {
                type: String,
                minlength: 1,
                maxlength: 50,
                required: true,
            },

            amount: {
                type: Number,
                min: 1,
                max: 100000,
                required: true,
            },
        },
    ],

    want: [
        {
            _id: { select: false },

            itemID: {
                type: Number,
                min: 0,
                max: 10000,
                required: true,
            },

            itemName: {
                type: String,
                minlength: 1,
                maxlength: 50,
                required: true,
            },

            color: {
                type: String,
                minlength: 1,
                maxlength: 50,
                required: true,
            },

            colorID: {
                type: Number,
                minlength: 1,
                maxlength: 50,
                required: true,
            },

            cert: {
                type: String,
                minlength: 1,
                maxlength: 50,
                required: true,
            },

            itemType: {
                type: String,
                minlength: 1,
                maxlength: 50,
                required: true,
            },

            amount: {
                type: Number,
                min: 1,
                max: 100000,
                required: true,
            },
        },
    ],

    platform: {
        type: String,
        minlength: 1,
        maxlength: 10,
        enum: ['Steam', 'XBOX', 'PSN', 'SWITCH', 'EPIC'],
        required: true,
    },

    createdAt: {
        type: Date,
        default: Date.now,
    },

    editedAt: {
        type: Date,
    },

    bumpedAt: {
        type: Date,
        default: Date.now,
    },

    notes: {
        type: 'String',
        maxlength: 300,
        default: '',
    },

    __v: { type: Number, select: false },
});

const TradeRL = mongoose.model('Trades', tradesRLSchema);

TradeRL.collection.dropIndex({ bumpedAt: 1 }, (err, result) => {
    TradeRL.collection.createIndex({ bumpedAt: 1 }, { expireAfterSeconds: 864000 });
});

exports.TradeRL = TradeRL;

exports.validateTrade = async (trade, user, req) => {
    const tradeLimit = user.isPremium ? 20 : 15;
    const itemsLimit = user.isPremium ? 12 : 10;

    if (trade.notes.match(/\b(?:http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+(?:[\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(?::[0-9]{1,5})?(?:\/.*)?\b/gm)) { return { error: { details: [{ message: 'No links allowed' }] } }; }

    const trades = await TradeRL.find({ user: req.user.id });
    if (trades.length >= tradeLimit) return { error: { details: [{ message: 'Trade amount limit' }] } }; // because that's how Joi returns the error

    const allItemIDs = []; const allItemNames = []; 
    let itemChecker = 0; let colorChecker = 0; let countPaintedItems = 0;

    infoRL.Slots.map((Slot) => Slot.Items.map((item) => {
      if (item.Tradable) {
        allItemIDs.push(item.ItemID);
        allItemNames.push(item.Name);

        // this checks if itemIDs and itemNames are related
        for (let i = 0; i < trade.have.length; i++) { 
          if (trade.have[i].itemID === item.ItemID) 
            if (trade.have[i].itemName === item.Name) 
              itemChecker++; 
        }

        for (let i = 0; i < trade.want.length; i++) { 
          if (trade.want[i].itemID === item.ItemID) 
            if (trade.want[i].itemName === item.Name) 
              itemChecker++; 
        }
      }
    }));
    if (itemChecker !== trade.want.length + trade.have.length) return { error: { details: [{ message: "itemID doesn't match with itemName" }] } };

    // this checks if colorIDs and color names are related
    infoRL.Colors.map(color => {
      for (let i = 0; i < trade.have.length; i++) { 
        if (trade.have[i].colorID === color.ID)
          if (trade.have[i].color === color.Name)
            colorChecker++
        if (trade.have[i].colorID !== 0)
          countPaintedItems++
      }

      for (let i = 0; i < trade.want.length; i++) { 
        if (trade.want[i].colorID === color.ID)
          if (trade.want[i].color === color.Name)
            colorChecker++
        if (trade.want[i].colorID !== 0)
          countPaintedItems++
      }
    })
    if (colorChecker !== countPaintedItems) return { error: { details: [{ message: "colorID doesn't match with color name" }] } };

    const hwValidation = Joi.object({
        itemID: Joi.number().valid(...allItemIDs).required(),
        itemName: Joi.string().valid(...allItemNames).required(),
        color: Joi.string().valid('None', 'Crimson', 'Lime', 'Black', 'Sky Blue', 'Cobalt', 'Burnt Sienna', 'Forest Green', 'Purple', 'Pink', 'Orange', 'Grey', 'Titanium White', 'Saffron').required(),
        colorID: Joi.number().valid(0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13).required(),
        cert: Joi.string().valid('None', 'Playmaker', 'Acrobat', 'Aviator', 'Goalkeeper', 'Guardian', 'Juggler', 'Paragon', 'Scorer', 'Show-Off', 'Sniper', 'Striker', 'Sweeper', 'Tactician', 'Turtle', 'Victor').required(),
        itemType: Joi.string().valid('item', 'blueprint').required(),
        amount: Joi.when('itemID', { is: 4743, then: Joi.number().min(1).max(100000).required(), otherwise: Joi.number().min(1).max(100).required() }), // limit 100000 if credits are the item
    });

    const schema = Joi.object({
        have: Joi.array().items(hwValidation).min(1).max(itemsLimit)
            .required(),
        want: Joi.array().items(hwValidation).min(1).max(itemsLimit)
            .required(),
        platform: Joi.string().valid('Steam', 'XBOX', 'PSN', 'SWITCH', 'EPIC').required(),
        notes: Joi.string().max(300).allow('').required(),
    });

    return schema.validate(trade);
};

exports.validateTradeQuery = (query) => {
    const allItemIDs = ['Any']; 
    const allItemNames = ['Any'];

    infoRL.Slots.map((Slot) => Slot.Items.map((item) => {
        if (item.Tradable) {
            allItemIDs.push(item.ItemID);
            allItemNames.push(item.Name);
        }
    }));

    const schema = Joi.object({
        search: Joi.string().valid('Any', 'I want to buy', 'I want to sell').required(),
        itemID: Joi.number().valid(...allItemIDs).required(),
        itemType: Joi.string().valid('Any', 'items', 'blueprints').required(),
        cert: Joi.string().valid('Any', 'None', 'Playmaker', 'Acrobat', 'Aviator', 'Goalkeeper', 'Guardian', 'Juggler', 'Paragon', 'Scorer', 'Show-Off', 'Sniper', 'Striker', 'Sweeper', 'Tactician', 'Turtle', 'Victor').required(),
        color: Joi.string().valid('Any', 'None', 'Crimson', 'Lime', 'Black', 'Sky Blue', 'Cobalt', 'Burnt Sienna', 'Forest Green', 'Purple', 'Pink', 'Orange', 'Grey', 'Titanium White', 'Saffron').required(),
        platform: Joi.string().valid("Any", "Steam", "PS4", "XBOX", "SWITCH", "EPIC").required(),
        page: Joi.number().min(1).required(),
        limit: Joi.number().valid(10, 15, 20).required(),
    });

    return schema.validate(query);
};
