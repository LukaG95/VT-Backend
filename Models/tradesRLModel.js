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
            /*
            itemType: {
                type: String,
                enum: ['Special', 'Engine Audio', 'Antenna', 'Body', 'Rocket Boost', 'Topper', 'Paint Finish', 'Decal', 'Wheels', 'Crate', 'Goal Explosion', 'Trail', 'Player Banner', 'Avatar Border'],
                minlength: 1,
                maxlength: 20,
                required: true,
            },
            */
            blueprint: {
                type: Boolean,
                required: true
            },

            amount: {
                type: Number,
                min: 0.01,
                max: 100000,
                required: true,
            }
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
            /*
            itemType: {
                type: String,
                enum: ['Special', 'Engine Audio', 'Antenna', 'Body', 'Rocket Boost', 'Topper', 'Paint Finish', 'Decal', 'Wheels', 'Crate', 'Goal Explosion', 'Trail', 'Player Banner', 'Avatar Border'],
                minlength: 1,
                maxlength: 20,
                required: true,
            },
            */
            blueprint: {
              type: Boolean,
              required: true
            },

            amount: {
                type: Number,
                min: 0.01,
                max: 100000,
                required: true,
            }
        },
    ],

    platform: {
      name: {
        type: String,
        minlength: 1,
        maxlength: 10,
        enum: ['Steam', 'XBOX', 'PSN', 'SWITCH', 'EPIC'],
        required: true
      },
      ID: {
        type: String,
        minlength: 1,
        maxlength: 20,
        required: true
      }
        
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
        maxlength: 1000,
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
  const tradeLimit = 20 // user.isPremium ? 20 : 15;
  const itemsLimit = 12 // user.isPremium ? 12 : 10;

  if (trade.notes.match(/\b(?:http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+(?:[\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(?::[0-9]{1,5})?(?:\/.*)?\b/gm)) { 
    return { error: { details: [{ message: 'No links allowed' }] } }; 
  }

  // check if platform is linked to user account (and verified)
  const platform = trade.platform.toLowerCase();

  if (platform === "steam" || platform === "xbox" || platform === "switch"){
    if (!user[platform])
      return { error: { details: [{ message: 'Platform is not verified or confirmed' }] }}; 
  }
  else 
    if (user[platform])
      if (!user[platform].verified)
        return { error: { details: [{ message: 'Platform is not verified or confirmed' }] } };

  const trades = await TradeRL.find({ user: req.user.id });
  if (trades.length >= tradeLimit) return { error: { details: [{ message: 'Trade amount limit' }] } }; // because that's how Joi returns the error

  // check if itemIDs and itemNames are related
  const allItemIDs = []; const allItemNames = []; 
  let itemChecker = 0; let colorChecker = 0;

  infoRL.items.map(item => {
    if (item.Tradable) {
      allItemIDs.push(item.ItemID);
      allItemNames.push(item.Name);

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
  });
  if (itemChecker !== trade.want.length + trade.have.length) return { error: { details: [{ message: "itemID doesn't match with itemName" }] } };

  // check if colorIDs and color names are related
  const tradeLength = trade.have.length + trade.want.length
  const haveWant = trade.have.concat(trade.want)

  infoRL.Colors.map(color => {

    for (let i = 0; i < tradeLength; i++){
      if (haveWant[i].colorID === color.ID)
        if (haveWant[i].color === color.Name)
          colorChecker++
    }

  })
  if (colorChecker !== tradeLength) return { error: { details: [{ message: "colors name doesn't match the colors ID" }] } };

  // check if item is blueprintable
  let blueprintError = false
  infoRL.items.map(item=> {

    for (let i = 0; i < tradeLength; i++){
      if (haveWant[i].itemID === item.ItemID)
        if (haveWant[i].blueprint)
          if (!item.Blueprintable)
            blueprintError = true
        
    }
    
  })
  if (blueprintError) return { error: { details: [{ message: "item blueprintable error" }] } };


  //check if item can be painted
  let colorError = false
  infoRL.items.map(item=> {

    for (let i = 0; i < tradeLength; i++){
      if (haveWant[i].itemID === item.ItemID)
        if (haveWant[i].colorID !== 0)
          if (!item.Paintable)
            colorError = true
      
    }
    
  })
  if (colorError) return { error: { details: [{ message: "item paintable error" }] } };
  
  const hwValidation = Joi.object({
    itemID: Joi.number().valid(...allItemIDs).required(),
    itemName: Joi.string().valid(...allItemNames).required(),
    color: Joi.string().valid('None', 'Crimson', 'Lime', 'Black', 'Sky Blue', 'Cobalt', 'Burnt Sienna', 'Forest Green', 'Purple', 'Pink', 'Orange', 'Grey', 'Titanium White', 'Saffron').required(),
    colorID: Joi.number().valid(0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13).strict().required(),
    cert: Joi.string().valid('None', 'Playmaker', 'Acrobat', 'Aviator', 'Goalkeeper', 'Guardian', 'Juggler', 'Paragon', 'Scorer', 'Show-Off', 'Sniper', 'Striker', 'Sweeper', 'Tactician', 'Turtle', 'Victor').required(),
    // itemType: Joi.string().valid('Special', 'Engine Audio', 'Antenna', 'Body', 'Rocket Boost', 'Topper', 'Paint Finish', 'Decal', 'Wheels', 'Crate', 'Goal Explosion', 'Trail', 'Player Banner', 'Avatar Border').required(),
    blueprint: Joi.boolean().required(),
    amount: Joi.number().when('itemID', [
    { is: 9985, then: Joi.number().min(0.01).max(100000).required() },
    { is: 4743, then: Joi.number().integer().min(1).max(100000).required(),
      otherwise: Joi.number().integer().min(1).max(100).required() }]) });
     


  const schema = Joi.object({
    have: Joi.array().items(hwValidation).min(1).max(itemsLimit)
      .required(),
    want: Joi.array().items(hwValidation).min(1).max(itemsLimit)
      .required(),
    platform: Joi.string().valid('Steam', 'XBOX', 'PSN', 'SWITCH', 'EPIC').required(),
    /*platform: Joi.object({
      name: Joi.string().valid('Steam', 'XBOX', 'PSN', 'SWITCH', 'EPIC').required(),
      ID: Joi.string().required()
    }),*/
    notes: Joi.string().max(1000).allow('').required(),
  });

  return schema.validate(trade);
};

exports.validateTradeQuery = (query) => {
    const allItemIDs = ['Any']; 
    const allItemNames = ['Any'];

    infoRL.items.map(item => {
        if (item.Tradable) {
            allItemIDs.push(item.ItemID);
            allItemNames.push(item.Name);
        }
    });

    const schema = Joi.object({
        search: Joi.string().valid('Any', 'I want to buy', 'I want to sell').required(),
        itemID: Joi.number().valid(...allItemIDs).required(),
        blueprint: Joi.string().valid('Any', 'true', 'false').required(),
        cert: Joi.string().valid('Any', 'None', 'Playmaker', 'Acrobat', 'Aviator', 'Goalkeeper', 'Guardian', 'Juggler', 'Paragon', 'Scorer', 'Show-Off', 'Sniper', 'Striker', 'Sweeper', 'Tactician', 'Turtle', 'Victor').required(),
        color: Joi.string().valid('Any', 'None', 'Crimson', 'Lime', 'Black', 'Sky Blue', 'Cobalt', 'Burnt Sienna', 'Forest Green', 'Purple', 'Pink', 'Orange', 'Grey', 'Titanium White', 'Saffron').required(),
        platform: Joi.string().valid("Any", "Steam", "PS4", "XBOX", "SWITCH", "EPIC").required(),
        page: Joi.number().min(1).required(),
        limit: Joi.number().valid(10, 15, 20).required(),
    });

    return schema.validate(query);
};
