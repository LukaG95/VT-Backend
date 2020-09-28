const mongoose = require('mongoose')

mongoose.connect('mongodb://localhost/vt_tests', {
  useNewUrlParser: true,
  useCreateIndex: true
  // useUnifiedTopology: true
})
.then(() => console.log(`Connected to mongoDB.`))

const repSchema = new mongoose.Schema({
  good: {
    type: Number,
    default: 0
  },

  bad: {
    type: Number,
    default: 0
  },

  feedback: {
    type: String,
    required: true
  },

  createdAt: {
    type: Date,
    default: Date.now()
  },

  sinceCreation: {
    type: String
  }
  
})

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    minlength: 2,
    maxlength: 15,
    required: true
  },

  email: {
    type: String,
    maxlength: 255,
    required: true
  },

  reputation: repSchema

})

userSchema.index({ username: 1, email: 1 }, { collation: { locale: 'en', strength: 2 } })

const User = mongoose.model('User', userSchema)
const Reputation = mongoose.model('Reputation', repSchema)


let users = []
for (let i = 0; i<10000; i++)
  users.push({
    username: "Ryu",
    email: "test@gmail.com",
    reputation: {
      ups: (Math.random() * 50000).toFixed(0),
      downs: 0,
      feedback: Math.random().toString(36).substring(7)
    }
  })
 
User.insertMany(users, function(err, docs) {
    if (err){ 
      return console.error(err);
    } else {
      console.log("Multiple documents inserted to Collection");
    } 
})


/*
User.find({"reputation.ups": { $gte: 45500 }}, function (err, result) {
  if (err) {
    console.log(err);
  } else {
    console.log(result);
  }
})


User.aggregate([
  {$match: {"reputation.ups": { $gte: 49900 }}}
], function (err, result) {
  if (err) {
    console.log(err);
  } else {
    console.log(result);
  }
})
*/