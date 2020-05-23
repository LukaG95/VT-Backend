const Reputation = require('../Models/repModel');
const User = require('../Models/userModel');
const catchAsync = require('../misc/catchAsync');

const AppError = require('../misc/AppError');


exports.getReputation = catchAsync(async (req, res, next) => {
    const userId = req.params.user;

    if (userId.length !== 24) return next(new AppError('invalid'));

    const rep = await Reputation.aggregate([
        { $match: { userId } },
        { $unwind: '$reps' },
        { $sort: { 'reps.createdAt': -1 } },
        {
            $group: {
                _id: {
                    id: '$_id',
                    username: '$username',
                    grade: '$grade',
                    title: '$title',
                },

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
                other: {
                    $sum: {
                        $map: {
                            input: '$reps',
                            as: 'repobj',
                            in: { $cond: { if: { $eq: ['$$repobj.game', 'other'] }, then: 1, else: 0 } },
                        },
                    },
                },
            },
        },
        {
            $project: {
                _id: 0,
                id: '$_id.id',
                userId: 1,
                username: '$_id.username',
                title: '$_id.title',
                grade: '$_id.grade',
                ups: '$ups',
                downs: '$downs',
                amount: {
                    all: { $sum: ['$ups', '$downs'] }, rl: '$rl', csgo: '$csgo', other: '$other',
                },


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
