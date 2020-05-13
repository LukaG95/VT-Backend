module.exports = (err, req, res, next) => {
    err.status = err.status || 'error';

    res.json({
        status: err.status,
    });
};
