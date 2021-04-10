const logger = require("../startup/logging");

module.exports = function (err, req, res, next) {
    logger.error(err.message, { metadata: err });

    // error
    // warn
    // info
    // verbose
    // debug
    // silly

    res.status(400).json({
        message: "Something failed!",
        status: err.status,
        error: 'unknown error'
    });
};
/*
module.exports = (err, req, res, next) => {
  err.status = err.status || 'error';
  console.log(err.message);
  return res.json({
      status: err.status,
  });
};
*/
