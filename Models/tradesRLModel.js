const mongoose = require('mongoose')

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
    minlength: 0,
    maxlength: 255,
    default: ""
  },

  __v: { type: Number, select: false }
})


// const trade = {
//     userId: '155930243234791424',
//     userName: 'NikForce',
//     userUps: 15,
//     userDowns: 1,
//     Have: [{
//         itemID: 1580, Name: 'Zomba', Paint: 'Titanium White', Cert: 'None', itemType: 'Wheels',
//     },
//     {
//         itemID: 1435, Name: 'Heatwave', Paint: 'None', Cert: 'None', itemType: 'Decal',
//     },
//     {
//         itemID: 363, Name: 'Dieci', Paint: 'Black', Cert: 'Striker', itemType: 'Wheels',
//     },
//     {
//         itemID: 2854, Name: 'Dissolver', Paint: 'None', Cert: 'None', itemType: 'Decal',
//     },
//     {
//         itemID: 23, Name: 'Octane', Paint: 'Saffron', Cert: 'None', itemType: 'Body',
//     },
//     {
//         itemID: 23, Name: 'Octane', Paint: 'Grey', Cert: 'Playmaker', itemType: 'Body',
//     }],
//     Want: [{
//         itemID: 4743, Name: 'Credits', Paint: 'None', Cert: 'None', itemType: 'Special', Quantity: 10000,
//     }, {
//         itemID: 4743, Name: 'Credits', Paint: 'None', Cert: 'None', itemType: 'Special', Quantity: 10000,
//     },
//     {
//         itemID: 4743, Name: 'Credits', Paint: 'None', Cert: 'None', itemType: 'Special', Quantity: 10000,
//     },
//     {
//         itemID: 4743, Name: 'Credits', Paint: 'None', Cert: 'None', itemType: 'Special', Quantity: 10000,
//     },
//     {
//         itemID: 4743, Name: 'Credits', Paint: 'None', Cert: 'None', itemType: 'Special', Quantity: 10000,
//     },
//     {
//         itemID: 4743, Name: 'Credits', Paint: 'None', Cert: 'None', itemType: 'Special', Quantity: 10000,
//     }],
//     Platform: 'PC',
// };


const TradeRL = mongoose.model('Trades', tradesRLSchema)

// function Repeat(x) {
//     for (let a = 0; a < x; a++) {
//         setTimeout(() => {
//             const newTrade = new Trade(trade);
//             newTrade.save().then(() => console.log('Saved'));
//         }, 4000);
//     }
// }

// Repeat(5);


module.exports = TradeRL
