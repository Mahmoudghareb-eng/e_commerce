const User = require("../model/user.model");
const { AppError } = require("../middleware/error.middleware");
const logger = require("../config/logger");
const redis = require("../config/redis");
const clearCacheByPattern = require("../utility/redis.util");

// GET ME
const getMe = async (req, res, next) => {
  try {
    const id = req.user.id;

    const cacheKey = `user:${id}`;
    const cache = await redis.get(cacheKey);
    if (cache) {
    return res.status(200).json(JSON.parse(cache));
    }

    const user = await User.getUserById(id);

    if (!user) {
      logger.warn(`Get profile failed: User ID ${id} not found`);
      throw new AppError("User not found",404);
    }

    await redis.setEx(cacheKey,60,JSON.stringify({ user }));
    res.status(200).json({ user });

  } catch (err) {
    next(err);
  }
};

//GET ALL USERS 
const getUsers = async (req, res, next) =>{
  try{
    const page = parseInt(req.query.page)||1;
    const limit = parseInt(req.query.limit)||10;
    const offset = (page-1)*limit;
    const cacheKey = `users:${page}:${limit}`;
    const cache = await redis.get(cacheKey);
    if (cache) {
    return res.status(200).json(JSON.parse(cache));
    }
    const users = await User.getUsers(limit,offset);
    await redis.setEx(cacheKey,60,JSON.stringify({ users }));
    return res.status(200).json({users});
  } catch (err) {
    next(err);
  }
};

// UPDATE PROFILE
const updateProfile = async (req, res, next) => {
  try {
    const id = req.user.id;

    const { name, email } = req.body;

    const user = await User.getUserById(id);

    if (!user) {
      logger.warn(`Update profile failed: User ID ${id} not found`);
      throw new AppError("User not found",404);
    }

    const updatedUser = await User.updateUser(
      id,
      name || user.name,
      email || user.email
    );
    logger.info(`Profile updated for user ID ${id}`);
    await redis.del(`user:${id}`);
    await clearCacheByPattern("users:*");
    res.status(200).json({
      message: "User updated successfully",
      user: updatedUser
    });

  } catch (err) {
    next(err);
  }
};


// DELETE USER
const deleteUser = async (req, res, next) => {
  try {
    const id = req.user.id;

    const deletedUser = await User.deleteUser(id);

    if (!deletedUser) {
      logger.warn(`Delete failed: User ID ${id} not found`);
      throw new AppError("User not found",404);
    }

    logger.info(`User deleted (ID: ${id}, Email: ${deletedUser.email})`);
    await redis.del(`user:${id}`);
    await clearCacheByPattern("users:*");
    res.status(200).json({
      message: "User deleted successfully"
    });

  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMe,
  getUsers,
  updateProfile,
  deleteUser
};