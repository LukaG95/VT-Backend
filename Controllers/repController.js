const Reputation = require('../Models/repModel');
const User = require('../Models/userModel');
const catchAsync = require('../misc/catchAsync');

const AppError = require('../misc/AppError');


exports.getReputation = catchAsync(async (req, res, next) => {
    const userId = req.params.user;

    if (userId.length < 15) return next(new AppError('invalid'));

    const rep = await Reputation.aggregate([
        { $match: { userId } },
        { $unwind: '$reps' },
        { $sort: { 'reps.createdAt': -1 } },
        {
            $group: {
                _id: '$_id',
                reps: {
                    $push:
            '$reps',
                },
            },
        },
        {
            $addFields: {
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
                rl: {
                    $sum: {
                        $map: {
                            input: '$reps',
                            as: 'repobj',
                            in: { $cond: { if: { $eq: ['$$repobj.game', 'rl'] }, then: 1, else: 0 } },
                        },
                    },
                },
                csgo: {
                    $sum: {
                        $map: {
                            input: '$reps',
                            as: 'repobj',
                            in: { $cond: { if: { $eq: ['$$repobj.game', 'csgo'] }, then: 1, else: 0 } },
                        },
                    },
                },
            },
        },
        {
            $project: {
                userId: 1,
                ups: '$ups',
                downs: '$downs',
                amount: { all: { $sum: ['$ups', '$downs'] }, rl: '$rl', csgo: '$csgo' },
                title: '$title',
                grade: '$grade',
                reps: {
                    $map: {
                        input: '$reps',

                        in: {
                            dateTime: {
                                $dateToString: {
                                    date: '$$this.createdAt',
                                    format: '%Y-%m-%d %H:%M',
                                },
                            },

                            good: '$$this.good',
                            feedback: '$$this.feedback',
                            createdBy: '$$this.createdBy',
                            game: '$$this.game',
                        },

                    },
                },
            },
        },


    ]);

    if (rep.length < 1) return next(new AppError('invalid'));

    return res.json({ status: 'success', rep: rep[0] });
});


exports.addReputation = catchAsync(async (req, res, next) => {
    const { user } = req;
    const userId = req.params.user;
    const { rep } = req.body;

    if (!userId || userId.length < 15 || !rep || userId === user._id) return next(new AppError('invalid'));


    rep.createdBy = user._id;

    // const rep = {
    //     good: false,
    //     createdBy: '44444',
    //     feedback: 'Bad trade!',
    //     game: 'csgo',
    // };

    const repDB = await Reputation.findOne({ userId });


    if (!repDB) {
        const dbUser = await User.findById(userId);

        if (!dbUser) return next(new AppError('error1'));

        await new Reputation({ userId, reps: [rep] }).save();
        return res.json({ status: 'success' });
    }

    repDB.reps.unshift(rep);
    await repDB.save();
    return res.json({ status: 'success' });
});
