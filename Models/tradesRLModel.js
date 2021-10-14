const mongoose = require('mongoose');
const Joi = require('joi');

const infoRL = require('../info/infoRL.json');
const { CategoriesJson } = require('../info/Categories')

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

            category: {
              type: "String",
              enum: ['Rocket League', 'Money', 'Design'],
              required: true
            },

            color: {
              type: String,
              minlength: 1,
              maxlength: 50,
              required: function () { return this.category === "Rocket League" }
            },

            colorID: {
              type: Number,
              minlength: 1,
              maxlength: 50,
              required: function () { return this.category === "Rocket League" }
            },

            cert: {
              type: String,
              minlength: 1,
              maxlength: 50,
              required: function () { return this.category === "Rocket League" }
            },

            amount: {
              type: Number,
              min: 1,
              max: 100000,
              required: function () { return this.category === "Rocket League" || this.category === "Money"}
            },

            blueprint: {
              type: Boolean,
              required: function () { return this.category === "Rocket League" }
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

            category: {
              type: "String",
              enum: ['Rocket League', 'Money', 'Design'],
              required: true
            },

            color: {
              type: String,
              minlength: 1,
              maxlength: 50,
              required: function () { return this.category === "Rocket League" }
            },

            colorID: {
              type: Number,
              minlength: 1,
              maxlength: 50,
              required: function () { return this.category === "Rocket League" }
            },

            cert: {
              type: String,
              minlength: 1,
              maxlength: 50,
              required: function () { return this.category === "Rocket League" }
            },

            amount: {
              type: Number,
              min: 1,
              max: 100000,
              required: function () { return this.category === "Rocket League" || this.category === "Money"}
            },

            blueprint: {
              type: Boolean,
              required: function () { return this.category === "Rocket League" }
            }
        },
    ],

    platform: {
      name: {
        type: String,
        minlength: 1,
        maxlength: 10,
        enum: ['Steam', 'XBOX', 'PSN', 'SWITCH', 'EPIC'],
        required: function () {  
          let isPresent = false
          const haveWant = this.have.concat(this.want)
      
          haveWant.forEach(item => {
            if(item.category === "Rocket League") isPresent = true
          })
      
          return isPresent
        }
      },
      ID: {
        type: String,
        minlength: 1,
        maxlength: 20,
        required: false
      },

      verified: {
        type: Boolean,
        required: function () {  
          let isPresent = false
          const haveWant = this.have.concat(this.want)
      
          haveWant.forEach(item => {
            if(item.category === "Rocket League") isPresent = true
          })
      
          return isPresent
        }
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

    bumped: {
      type: Boolean,
      default: false
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

  const tradeLength = trade.have.length + trade.want.length
  const haveWant = trade.have.concat(trade.want)
  const allItemIDs = []
  const allItemNames = []
  let itemChecker = false; 
  let colorError = false;
  let blueprintError = false
  let idExists = 0

  // fill all possible item names and IDs
  let temp = [...Object.keys(CategoriesJson)]
  temp.forEach(category => CategoriesJson[category].forEach(item => {allItemNames.push(item.Name); allItemIDs.push(item.ItemID)}))

  haveWant.forEach(item => {  
    // include checking if name and itemID are related
    if (!CategoriesJson[item.category]) return { error: { details: [{ message: "item's category or ID is wrong" }] } }; // if incoming category doesn't exist at all
    CategoriesJson[item.category].forEach(_item => {
      if (item.itemID === _item.ItemID){
        idExists++ // check if there's an item with the given ID inside the category (if incoming category is correct)
        if (item.itemName !== _item.Name)
          itemChecker = true
      }
    })

    if (item.category === "Rocket League"){

      // check if colorIDs and color names are related
      infoRL.Colors.forEach(color => {
        for (let i = 0; i < tradeLength; i++){
          if (item.colorID === color.ID){
            if (item.color !== color.Name) 
              colorError = true
          }   
        }
      })

      // check if item is blueprintable
       infoRL.items.forEach(_item => {
          for (let i = 0; i < tradeLength; i++){
            if (item.itemID === _item.ItemID)
              if (item.blueprint)
                if (!_item.Blueprintable)
                  blueprintError = true
          }
        })
    }

  })
  if (colorError)
    return { error: { details: [{ message: "color's name doesn't match the color's ID" }] } }; 
  if (blueprintError) 
    return { error: { details: [{ message: "blueprint attribute error" }] } };
  if (idExists !== tradeLength) 
    return { error: { details: [{ message: "item's category or ID is wrong" }] } };
  if (itemChecker) 
    return { error: { details: [{ message: "item's ID doesn't match with item's name" }] } };

    
  // check if platform is linked to user account (and verified)
  // TEMPORARILY DISABLED
  
  /*
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
  if (trades.length >= tradeLimit) return { error: { details: [{ message: 'Trade amount limit' }] } };
  */

  // check if platform is defined when RL items are in the trade (should be in Joi but don't know how to implement)
  let isPresent = false
  haveWant.forEach(item => {
    if(item.category === "Rocket League") isPresent = true
  })
  if (isPresent && !trade.platform) return { error: { details: [{ message: "no platform included" }] } };


  const hwValidation = Joi.object({
    itemID: Joi.number().valid(...allItemIDs).required(),
    itemName: Joi.string().valid().required(),
    category: Joi.string().valid('Rocket League', 'Money', 'Design').required(),
    color: Joi.when('category', { 
      is: "Rocket League", 
      then: Joi.string().valid('None', 'Crimson', 'Lime', 'Black', 'Sky Blue', 'Cobalt', 'Burnt Sienna', 'Forest Green', 'Purple', 'Pink', 'Orange', 'Grey', 'Titanium White', 'Saffron').required()
    }),
    colorID: Joi.when('category', { 
      is: "Rocket League", 
      then: Joi.number().valid(0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13).strict().required()
    }),
    cert: Joi.when('category', { 
      is: "Rocket League", 
      then: Joi.string().valid('None', 'Playmaker', 'Acrobat', 'Aviator', 'Goalkeeper', 'Guardian', 'Juggler', 'Paragon', 'Scorer', 'Show-Off', 'Sniper', 'Striker', 'Sweeper', 'Tactician', 'Turtle', 'Victor').required()
    }),
    blueprint: Joi.when('category', { 
      is: "Rocket League", 
      then: Joi.boolean().required()
    }),
    amount: Joi.when('category', { 
      is: "Rocket League", 
      then: Joi.when('itemID', {
        is: 4743,
        then: Joi.number().min(1).max(100000).required(), // limit 100000 if credits are the item
        otherwise: Joi.number().min(1).max(100).required() 
      }),
      otherwise: Joi.when('category', {
        is: "Money",
        then: Joi.number().min(0.01).max(100000).required(),
        otherwise: Joi.forbidden()
      })
    }), 
  });

  /*
  
  amount: Joi.when('itemID', { 
      is: 4743, 
      then: Joi.when('category', {
        is: "Rocket League",
        then: Joi.number().min(1).max(100000).required(), // limit 100000 if credits are the item
      }),
      otherwise: Joi.number().min(1).max(100).required() 
    }), 
    
    */

  const schema = Joi.object({
    have: Joi.array().items(hwValidation).min(1).max(itemsLimit)
      .required(),
    want: Joi.array().items(hwValidation).min(1).max(itemsLimit)
      .required(),
    platform: Joi.string().valid('Steam', 'XBOX', 'PSN', 'SWITCH', 'EPIC').optional(),
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