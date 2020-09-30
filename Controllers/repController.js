const Redis = require('../misc/redisCaching')

const Reputation = require('../Models/repModel')
const { User } = require('../Models/userModel')

exports.getReputation = async (req, res, next) => {
  const userId = req.params.user // Joi

  const user = await User.findById(userId)
  if (!user) return res.status(404).json({info: "no user", message: "user doesn't exist"})

  const rep = await Reputation.aggregate([
    { $match: { user: user._id  } },              // search for the users rep
    { $unwind: '$reps' },                         // unwind all reps
    { $sort: { 'reps.createdAt': -1 } },          // sort all reps by date created
    {
      $addFields: {                               // date to string
          reps: {
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
              userId: user._id,
              username: user.username,
              grade: '$grade',
              title: '$title',
          },

          reps: {
              $push: '$reps',
          },

          ups: { $sum: { $cond: { if: { $eq: ['$reps.good', true] }, then: 1, else: 0 } } },
          downs: { $sum: { $cond: { if: { $eq: ['$reps.good', false] }, then: 1, else: 0 } } },

          csgoCount: { $sum: { $cond: { if: { $eq: ['$reps.category', 'csgo'] }, then: 1, else: 0 } } },
          rlCount: { $sum: { $cond: { if: { $eq: ['$reps.category', 'rl'] }, then: 1, else: 0 } } },
          otherCount: { $sum: { $cond: { if: { $eq: ['$reps.category', 'other'] }, then: 1, else: 0 } } },

          csgoReps: { $push: { $cond: { if: { $eq: ['$reps.category', 'csgo'] }, then: '$reps', else: null } } },
          rlReps: { $push: { $cond: { if: { $eq: ['$reps.category', 'rl'] }, then: '$reps', else: null } } },
          otherReps: { $push: { $cond: { if: { $eq: ['$reps.category', 'other'] }, then: '$reps', else: null } } },
      },
    },

    {
        $addFields: {                                         // add these fields just as count, later not adding them in $project
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
                other: '$otherCount'
            },
            repsByGame: {
                all: '$reps',
                rl: '$rlReps',
                csgo: '$csgoReps',
                other: '$otherReps'
            }
        }
    }
  ])

  if (rep.length < 1) {
    rep[0] = {
      ups: 0,
      downs: 0,
      grade: "1.0",
      title: "Novice",
      amount: { all: 0, rl: 0, csgo: 0, other: 0 },
      repsByGame: { all: [], rl: [], csgo: [], other: [] },
      userId: user._id,
      username: user.username,
    }
  }

  return res.status(200).json({ info: 'success', message: 'got user reputation', rep: rep[0] })

  /*
  const reputation = await Reputation.find({user: userId})

  let user_rep = {
    ups: 0,
    downs: 0,
    grade: "1.0",
    title: "Novice",
    amount: { all: 0, rl: 0, csgo: 0, other: 0 },
    repsByGame: { all: [], rl: [], csgo: [], other: [] },
    userId: user._id,
    username: user.username
  }

  if (reputation.length > 0){

    reputation[0].reps.map(repu => {
      const rep = repu.toObject()

      rep.good ? user_rep.ups++ : user_rep.downs++
      user_rep.amount.all++
      user_rep.amount[rep.category]++

      rep.createdAt = rep.createdAt.toLocaleString()
      user_rep.repsByGame.all.push(rep)
      user_rep.repsByGame[rep.category].push(rep)
    })


    // sort reps by date created for each category
    // format date to string

  }
    
  return res.status(200).json({ info: 'success', message: 'got user reputation', rep: user_rep })
*/
}

exports.addReputation = async (req, res, next) => {
  const user = await User.findById(req.user.id).select('-__v')

  const rep = req.body // Joi
  rep.createdBy = user._id

  // Check if user has already given a rep within 24 hours
  /*
  const repCheck = await Redis.isCached(`${user._id}${userId}`)
  if (repCheck) return next(new AppError('hours24'))*/

  const receiving_user = await User.findById(req.params.user).select('-__v')
  if (!receiving_user) return res.status(404).json({info: 'no user', message: 'user with the given id does not exist'})

  // if user exists but has no rep yet (doesn't exist in Reputation collection), create a new one
  const user_repDB = await Reputation.findOne({ user: req.params.user })
  if (!user_repDB) {
    const newRep = new Reputation({ 
      user: receiving_user._id, 
      reps: [rep]
    })

    await newRep.save()
    // await Redis.cache(`${user._id}${userId}`, 1)

    return res.status(200).json({ info: 'success', message: 'successfully added reputation' })
  }

  user_repDB.reps.push(rep) // or unshift for adding at the start
  await user_repDB.save()

  // await Redis.cache(`${user._id}${userId}`, 1)
  return res.status(200).json({ info: 'success', message: 'successfully added reputation' })
}

exports.getTop10 = async (req, res, next) => {
  const oneDayInMs = (1 * 24 * 3600 * 1000)
  const weekDate = new Date(Date.now() - 7 * oneDayInMs)
  const monthDate = new Date(Date.now() - 30 * oneDayInMs)

  const aggregation = function (Date) {
    let match = {}

    if (Date)
      match = { 'reps.createdAt': { $gte: Date } }

    return Reputation.aggregate([
      { $unwind: '$reps' }, // ungroup by reps
      { $match: match },    // sort by date
      { 
        $lookup: {from: 'users', localField: 'user', foreignField: '_id', as: 'owner'} 
      },
      {
        $group: {           // regroup 
          _id: {
            userId: '$user',
            username: { $arrayElemAt: [ '$owner.username', 0 ]}
          },
          ups: { $sum: { $cond: { if: { $eq: ['$reps.good', true] }, then: 1, else: 0 } } },
          downs: { $sum: { $cond: { if: { $eq: ['$reps.good', false] }, then: 1, else: 0 } } }
        }
      },
      {
        $addFields: {
          repRating: { $subtract: ['$ups', '$downs'] }
        }
      },
      { $sort: { repRating: -1 } },
      { $limit: 10 },
      {
        $project: {
          _id: 0,
          userId: '$_id.userId',
          username: '$_id.username',
          repRating: '$repRating',
        }
      }
    ])
  }

  const All = await aggregation()
  const Month = await aggregation(monthDate)
  const Week = await aggregation(weekDate)

  return res.json({ status: 'success', top10: { All, Month, Week } })
}

exports.getReputation_compact = async (req, res, next) => {
  const userId = req.params.user
  let ups = 0, downs = 0

  const reputation = await Reputation.find({user: userId})
  if (reputation.length < 1) {
    rep_compact = {
      ups: 0,
      downs: 0,
      grade: "1.0",
      title: "novice"
    }
  }
  else {
    reputation[0].reps.map(rep => rep.good ? ups++ : downs++)
    rep_compact = {
      ups,
      downs,
      grade: reputation[0].grade,
      title: reputation[0].title
    }
  }

  return res.status(200).json({info: "success", message: "returned user reputation", rep: rep_compact})
  
}
