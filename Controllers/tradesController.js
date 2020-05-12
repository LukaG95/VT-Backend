const TradeRL = require('../Models/tradesRLModel');

const AdvancedQueryRL = require('../misc/AdvancedQueryRL');


exports.getTrades = async (req, res) => {
    const advanced = new AdvancedQueryRL(TradeRL.find(), req.query)
        .filter()
        .paginate();
    const trades = await advanced.query;
    return res.json({ trades });
};


exports.createTrade = async (req, res) => {
    try {
        const { user } = req;
        const tradeDetails = {
            userId: user._id,
            username: user.username,
            Have: req.body.Have,
            Want: req.body.Want,
            Platform: req.body.Platform,
        };

        const newTrade = await new TradeRL(tradeDetails).save();
        return res.json({ status: 'success', newTrade });
    } catch (err) {
        console.log(err);
        return res.json({ status: 'error' });
    }
};
