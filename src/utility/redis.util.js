const redis = require("../config/redis");

const clearCacheByPattern = async (pattern) => {
  const keys = await redis.keys(pattern);

  if (keys.length > 0) {
    await redis.del(keys);
  }
};

module.exports = clearCacheByPattern;