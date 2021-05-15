const mongoose = require('mongoose');
const crypto = require('crypto');
const { promisify } = require('util');
const redis = require('../misc/redisCaching');


const { Referral } = require('../Models/referralsModel');
const { ReferralEvents } = require('../Models/referralEventsModel');


exports.createReferral = async (req, res, next) => {

    const { name } = req.body;
    if (!name) return res.status(200).json({ info: "error", message: "invalid name format" });

    const trackingLink = (await promisify(crypto.randomBytes)(16)).toString('hex');

    const referral = await Referral.create({ partner: name, tracking: trackingLink });

    return res.status(200).json({ info: "success", message: "successfully created new partner" });
}


exports.deleteReferral = async (req, res, next) => {

    const { name } = req.body;
    if (!name) return res.status(200).json({ info: "error", message: "invalid name format" });

    const removed = await Referral.deleteOne({ partner: name });
    if (removed.deletedCount < 1) return res.status(200).json({ info: "error", message: `partner ${name} not found` });


    return res.status(200).json({ info: 'success', message: `partner ${name} was deleted` });

}


exports.countClick = async (req, res, next) => {

    const ref = req.params.name;
    if (!ref) return res.status(200).json({ info: "error", message: "invalid ref format" });

    
    const exists = await Referral.findOne({ partner: ref });
    // Fake success
    if (!exists) return res.status(200).json({ info: 'success' });
    
    
    const isCached = await redis.isCached(`ref${req.ip}`);
    // Fake success
    if (isCached) return res.status(200).json({ info: 'success' });

    const newEvent = new ReferralEvents({ partner: exists._id, event: 'click' });
    await newEvent.save();

    await redis.cache(`ref${req.ip}`, exists._id);

    return res.status(200).json({ info: 'success' });
}

// exports.countSingup = async (req, res, next) => {

// }


exports.getReferrals = async (req, res, next) => {

    const referrals = await Referral.find({});

    return res.status(200).json({ info: 'success', partners: referrals });
}

exports.getStats = async (req, res, next) => {

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(200).json({ info: "error", message: "invalid id format" });

    const partner = await Referral.findById(id);
    if (!partner) return res.status(200).json({ info: "error", message: "partner does not exist" });

    const stats = await ReferralEvents.aggregate([

        {$match:  {partner: mongoose.Types.ObjectId(id)}},

        {$lookup: {
            from: 'referrals', localField: 'partner', foreignField: '_id', as: 'partnerDB',
        }},

        {$group: {
            _id: { 
                $arrayElemAt: ['$partnerDB.partner', 0] 
            },
        
            clicks:  { $sum: { $cond: { if: { $eq: ['$event', 'click'] }, then: 1, else: 0 } } },
            signups: { $sum: { $cond: { if: { $eq: ['$event', 'signup'] }, then: 1, else: 0 } } }
        }},

        { $project: {
            _id: 0,
            partner: '$_id',
            clicks: 1,
            signups: 1
        }},
    ])


    const statsByDate = await ReferralEvents.aggregate([
        {$match:  {partner: mongoose.Types.ObjectId(id)}},
        
        {$group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }},
        
            clicks:  { $sum: { $cond: { if: { $eq: ['$event', 'click'] }, then: 1, else: 0 } } },
            signups: { $sum: { $cond: { if: { $eq: ['$event', 'signup'] }, then: 1, else: 0 } } }
        }},

        {$sort: {clicks: -1, signups: -1}},

        { $project: {
            _id: 0,
            date: '$_id',
            clicks: 1,
            signups: 1
        }},

        {$limit: 10}
    ]);


    return res.status(200).json({ info: 'success', total: stats, statsByDate });

}


exports.getStatsForPartners = async(req, res, next) => {

    const { tracking } = req.params;
    if (tracking.length !== 32) return res.status(200).json({ info: "error", message: "invalid link format" });

    const partner = await Referral.findOne({ tracking });
    if (!partner) return res.status(200).json({ info: "error", message: "partner does not exist" });

    const stats = await ReferralEvents.aggregate([

        {$match:  {partner: partner._id}},

        // {$lookup: {
        //     from: 'referrals', localField: 'partner', foreignField: '_id', as: 'partnerDB',
        // }},

        {$group: {
            _id: null,
        
            clicks:  { $sum: { $cond: { if: { $eq: ['$event', 'click'] }, then: 1, else: 0 } } },
        }},

        { $project: {
            _id: 0,
            clicks: 1,
        }},
    ])


    return res.status(200).json({ info: 'success', name: partner.partner, clicks: stats });
}






