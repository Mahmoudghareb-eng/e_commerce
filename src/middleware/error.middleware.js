const logger = require("../config/logger");
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);

        this.statusCode = statusCode;
    }
};


const errorHandler = (err, req, res, next) => {
    void next;

    logger.error(err);

    return res.status(err.statusCode || 500).json({
        msg: err.message || "Server error"
    });
};

module.exports = {
  AppError,
  errorHandler
};