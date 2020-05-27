const Reputation = require('../Models/repModel');
const User = require('../Models/userModel');
const catchAsync = require('../misc/catchAsync');

const AppError = require('../misc/AppError');


exports.getReputation = catchAsync(async (req, res, next) => {
    const userId = req.params.user;

    if (userId.length !== 24) return next(new AppError('invalid'));

    const user = await User.findById(userId);

    if (!user) return next(new AppError('invalid'));

    const rep = await Reputation.aggregate([
        { $match: { userId } },
        { $unwind: '$reps' },
        { $sort: { 'reps.createdAt': -1 } },
        {
            $addFields: {
                reps: {
                    good: '$reps.good',
                    createdBy: '$reps.createdBy',
                    feedback: '$reps.feedback',
                    createdAt: {
                        $dateToString: {
                            date: '$reps.createdAt',
                            format: '%Y-%m-%d %H:%M',
                        },
                    },
                },
            },
        },
        {
            $group: {
                _id: {
                    id: '$_id',
                    userId: '$userId',
                    username: '$username',
                    grade: '$grade',
                    title: '$title',
                },

                reps: {
                    $push: '$reps',

                },

                ups: { $sum: { $cond: { if: { $eq: ['$reps.good', true] }, then: 1, else: 0 } } },
                downs: { $sum: { $cond: { if: { $eq: ['$reps.good', false] }, then: 1, else: 0 } } },


                csgoCount: { $sum: { $cond: { if: { $eq: ['$reps.game', 'csgo'] }, then: 1, else: 0 } } },
                rlCount: { $sum: { $cond: { if: { $eq: ['$reps.game', 'rl'] }, then: 1, else: 0 } } },
                otherCount: { $sum: { $cond: { if: { $eq: ['$reps.game', 'other'] }, then: 1, else: 0 } } },

                csgoReps: { $push: { $cond: { if: { $eq: ['$reps.game', 'csgo'] }, then: '$reps', else: null } } },
                rlReps: { $push: { $cond: { if: { $eq: ['$reps.game', 'rl'] }, then: '$reps', else: null } } },
                otherReps: { $push: { $cond: { if: { $eq: ['$reps.game', 'other'] }, then: '$reps', else: null } } },
            },


        },


        {
            $addFields: {
                csgoReps: {
                    $filter: {
                        input: '$csgoReps',
                        as: 'rep',
                        cond: {
                            $ne: ['$$rep', null],
                        },
                    },
                },
                rlReps: {
                    $filter: {
                        input: '$rlReps',
                        as: 'rep',
                        cond: {
                            $ne: ['$$rep', null],
                        },
                    },
                },
                otherReps: {
                    $filter: {
                        input: '$otherReps',
                        as: 'rep',
                        cond: {
                            $ne: ['$$rep', null],
                        },
                    },
                },
            },
        },
        {
            $project: {
                _id: 0,
                userId: '$_id.userId',
                username: '$_id.username',
                title: '$_id.title',
                grade: '$_id.grade',
                ups: '$ups',
                downs: '$downs',
                amount: {
                    all: { $sum: ['$ups', '$downs'] },
                    rl: '$rlCount',
                    csgo: '$csgoCount',
                    other: '$otherCount',
                },
                repsByGame: {
                    all: '$reps',
                    rl: '$rlReps',
                    csgo: '$csgoReps',
                    other: '$otherReps',
                },


            },
        },


    ]);

    if (rep.length < 1) {
        const rep = {
            userId: user._id,
            username: user.username,
        };
        return res.json({ status: 'default', rep });
    }

    return res.json({ status: 'success', rep: rep[0] });
});


exports.addReputation = catchAsync(async (req, res, next) => {
    const { user } = req;
    const userId = req.params.user;
    const { rep } = req.body;

    if (!userId || userId.length !== 24 || !rep || userId == user._id) return next(new AppError('invalid'));


    rep.createdBy = user._id;

    // const rep = {
    //     good: false,
    //     createdBy: '44444',
    //     feedback: 'Bad trade!',
    //     game: 'csgo',
    // };
    const dbUser = await User.findById(userId);
    if (!dbUser) return next(new AppError('error'));

    const repDB = await Reputation.findOne({ userId });


    if (!repDB) {
        const newRep = new Reputation({ userId, username: dbUser.username, reps: [rep] });
        await newRep.save();
        return res.json({ status: 'success' });
    }

    repDB.reps.unshift(rep);
    await repDB.save();
    return res.json({ status: 'success' });
});

exports.getTop10 = catchAsync(async (req, res, next) => {
    const top10 = await Reputation.aggregate([
        { $unwind: '$reps' },
        {
            $group: {
                _id: {
                    userId: '$userId',
                    username: '$username',
                },

                ups: { $sum: { $cond: { if: { $eq: ['$reps.good', true] }, then: 1, else: 0 } } },
                downs: { $sum: { $cond: { if: { $eq: ['$reps.good', false] }, then: 1, else: 0 } } },


            },
        },
        {
            $addFields: {
                repRating: { $subtract: ['$ups', '$downs'] },
            },
        },
        { $sort: { repRating: -1 } },
        { $limit: 10 },
        {
            $project: {
                _id: 0,
                userId: '$_id.userId',
                username: '$_id.username',
                repRating: '$repRating',
            },
        },


    ]);

    return res.json({ status: 'success', top10 });
});


exports.getRepMiddleware = catchAsync(async (req, res, next) => {
    const { user } = req;

    const rep = await Reputation.aggregate([
        { $match: { userId: `${user._id}` } },
        {
            $project: {
                _id: 0,
                username: 1,
                title: 1,
                grade: 1,
                ups: {
                    $sum: {
                        $map: {
                            input: '$reps',
                            as: 'repobj',
                            in: { $cond: { if: { $eq: ['$$repobj.good', true] }, then: 1, else: 0 } },
                        },
                    },
                },
                downs: {
                    $sum: {
                        $map: {
                            input: '$reps',
                            as: 'repobj',
                            in: { $cond: { if: { $eq: ['$$repobj.good', false] }, then: 1, else: 0 } },
                        },
                    },
                },
            },
        },
    ]);


    req.rep = rep[0] || { ups: 0, downs: 0 };
    next();
});
