module.exports = (err, req, res, next) => {
    err.status = err.status || 'error';
    console.log(err.message);
    res.json({
        status: err.status,
    });
};
