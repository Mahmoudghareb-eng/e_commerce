const logger = require("../config/logger");
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);

        this.statusCode = statusCode;
    }
};


const errorHandler = (err,req,res,next)=>{
    logger.error(err);
    return res.status(err.status || 500).json({
        msg: err.message || "Server error"
    });
};

module.exports = {
  AppError,
  errorHandler
};