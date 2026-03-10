const { redis } = require('../config/redis');

const DEFAULT_TTL = 300; // 5 minutes

async function getCache(key) {
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error('Cache get error:', err.message);
    return null;
  }
}

async function setCache(key, data, ttl = DEFAULT_TTL) {
  try {
    await redis.setex(key, ttl, JSON.stringify(data));
  } catch (err) {
    console.error('Cache set error:', err.message);
  }
}

async function invalidateCache(pattern) {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (err) {
    console.error('Cache invalidate error:', err.message);
  }
}

module.exports = { getCache, setCache, invalidateCache };
