const mongoose = require('mongoose');


const tradesSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
    },
    userName: {
        type: String,
        required: true,
    },
    userUps: {
        type: String,
        default: 0,
    },
    userDowns: {
        type: String,
        default: 0,
    },

    Have: [
        {
            itemID: {
                type: Number,
            },
            Name: {
                type: String,
                required: true,
            },
            Paint: {
                type: String,
                required: true,
            },
            Cert: {
                type: String,

            },
            itemType: {
                type: String,

            },
            Quantity: {
                type: Number,
            },
        },
    ],
    Want: [
        {
            _id: {
                select: false,
            },
            itemID: {
                type: Number,
            },
            Name: {
                type: String,
                required: true,
            },
            Paint: {
                type: String,
                required: true,
            },
            Cert: {
                type: String,

            },
            itemType: {
                type: String,

            },
            Quantity: {
                type: Number,
            },
        },
    ],

    Platform: {
        type: String,
    },
});


const trade = {
    userId: '155930243234791424',
    userName: 'NikForce',
    userUps: 15,
    userDowns: 1,
    Have: [{
        itemID: 1580, Name: 'Zomba', Paint: 'Titanium White', Cert: 'None', itemType: 'Wheels',
    },
    {
        itemID: 1435, Name: 'Heatwave', Paint: 'None', Cert: 'None', itemType: 'Decal',
    },
    {
        itemID: 363, Name: 'Dieci', Paint: 'Black', Cert: 'Striker', itemType: 'Wheels',
    },
    {
        itemID: 2854, Name: 'Dissolver', Paint: 'None', Cert: 'None', itemType: 'Decal',
    },
    {
        itemID: 23, Name: 'Octane', Paint: 'Saffron', Cert: 'None', itemType: 'Body',
    },
    {
        itemID: 23, Name: 'Octane', Paint: 'Grey', Cert: 'Playmaker', itemType: 'Body',
    }],
    Want: [{
        itemID: 4743, Name: 'Credits', Paint: 'None', Cert: 'None', itemType: 'Special', Quantity: 10000,
    }, {
        itemID: 4743, Name: 'Credits', Paint: 'None', Cert: 'None', itemType: 'Special', Quantity: 10000,
    },
    {
        itemID: 4743, Name: 'Credits', Paint: 'None', Cert: 'None', itemType: 'Special', Quantity: 10000,
    },
    {
        itemID: 4743, Name: 'Credits', Paint: 'None', Cert: 'None', itemType: 'Special', Quantity: 10000,
    },
    {
        itemID: 4743, Name: 'Credits', Paint: 'None', Cert: 'None', itemType: 'Special', Quantity: 10000,
    },
    {
        itemID: 4743, Name: 'Credits', Paint: 'None', Cert: 'None', itemType: 'Special', Quantity: 10000,
    }],
    Platform: 'PC',
};


const Trade = mongoose.model('Trades', tradesSchema);

// function Repeat(x) {
//     for (let a = 0; a < x; a++) {
//         setTimeout(() => {
//             const newTrade = new Trade(trade);
//             newTrade.save().then(() => console.log('Saved'));
//         }, 4000);
//     }
// }

// Repeat(5);
// const newTrade = new Trade(trade);
// newTrade.save().then(() => console.log('Saved'));


module.exports = Trade;
