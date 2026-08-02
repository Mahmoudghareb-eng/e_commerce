const { AppError } = require("../middleware/error.middleware");
const logger = require("../config/logger");

const isAdmin = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      logger.warn(
        `Unauthorized admin access attempt by user ${req.user.id}`
      );
      throw new AppError("Admin access required", 403);
    }

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = isAdmin;