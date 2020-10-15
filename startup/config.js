<<<<<<< HEAD
module.exports = function(){
  require('dotenv').config()
    if (!process.env.JWT_SECRET){
=======
module.exports = function () {
  require('dotenv').config()
  if (!process.env.JWT_SECRET) {
>>>>>>> efa3ece8a8f1979145e4cec11cdf937611aac9a1
    throw new Error('FATAL ERROR: JWT_SECRET is not defined')
  }
}
