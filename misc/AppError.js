class AppError extends Error {
    constructor(message) {
        super(message)
        this.status = message

        Error.captureStackTrace(this, this.constructor)
    }
}

module.exports = AppError
