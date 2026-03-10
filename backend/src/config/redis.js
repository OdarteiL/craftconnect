const Redis = require('ioredis');

const redis = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

redis.on('error', (err) => {
  console.error('Redis error:', err.message);
});

async function testRedis() {
  try {
    await redis.ping();
    console.log('✅ Redis connected');
  } catch (err) {
    console.warn('⚠️  Redis connection failed:', err.message);
    console.warn('Continuing without Redis...');
  }
}

module.exports = { redis, testRedis };
