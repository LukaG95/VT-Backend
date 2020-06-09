const mongoose = require('mongoose');


const tradesRLSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
    },
    username: {
        type: String,
        required: true,
    },
    steamAccount: {
        type: String,
    },
    reputation: {
        ups: {
            type: Number,
            default: 0,
        },
        downs: {
            type: Number,
            default: 0,
        },
    },
    have: [
        {
            _id: {
                select: false,
            },

            itemID: {
                type: Number,
                required: true,
            },
            itemName: {
                type: String,
                required: true,
            },
            paint: {
                type: String,
                required: true,

            },
            cert: {
                type: String,
                required: true,

            },
            itemType: {
                type: String,
                required: true,

            },
            amount: {
                type: Number,
                required: true,
            },
            url: {
                type: String,
                required: true,
            },
        },
    ],
    want: [
        {
            _id: {
                select: false,
            },
            itemID: {
                type: Number,
                required: true,
            },
            itemName: {
                type: String,
                required: true,
            },
            paint: {
                type: String,
                required: true,

            },
            cert: {
                type: String,
                required: true,

            },
            itemType: {
                type: String,
                required: true,

            },
            amount: {
                type: Number,
                required: true,
            },
            url: {
                type: String,
                required: true,
            },
        },
    ],

    platform: {
        type: String,
        required: true,
        enum: ['PC', 'XBOX', 'PS4', 'SWITCH'],
    },

    createdAt: {
        type: Date,
        default: Date.now(),
    },
    notes: {
        type: 'String',
        default: 'Test',
    },
    premium: {
        type: Boolean,
        default: false,
    },
    old: { have: {}, want: {} },
    __v: { type: Number, select: false },
});


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


const TradeRL = mongoose.model('Trades', tradesRLSchema);

// function Repeat(x) {
//     for (let a = 0; a < x; a++) {
//         setTimeout(() => {
//             const newTrade = new Trade(trade);
//             newTrade.save().then(() => console.log('Saved'));
//         }, 4000);
//     }
// }

// Repeat(5);


module.exports = TradeRL;
