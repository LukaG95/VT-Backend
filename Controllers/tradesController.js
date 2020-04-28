const TradeRL = require('../Models/tradesRLModel');

const AdvancedQueryRL = require('../misc/AdvancedQueryRL');


exports.getTrades = async (req, res) => {
    const advanced = new AdvancedQueryRL(TradeRL.find(), req.query)
        .filter()
        .paginate();
    const trades = await advanced.query;
    return res.json({ trades });
};
