const Redis = require('ioredis');
const logger = require('../utils/logger');

let redis = null;

try {
  redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: 1,
    retryStrategy(times) {
      if (times > 3) return null; // Stop retrying after 3 attempts
      return Math.min(times * 200, 2000);
    },
    lazyConnect: true,
  });

  redis.on('connect', () => logger.info('Redis connected'));
  redis.on('error', (err) => {
    logger.warn('Redis unavailable – caching disabled:', err.message);
    redis = null;
  });

  redis.connect().catch(() => {
    logger.warn('Redis connection failed – running without cache');
    redis = null;
  });
} catch (err) {
  logger.warn('Redis init failed – running without cache');
}

const DEFAULT_TTL = 300; // 5 minutes

/**
 * Cache middleware – caches GET responses in Redis.
 * Falls back gracefully when Redis is unavailable.
 */
const cache = (ttl = DEFAULT_TTL) => async (req, res, next) => {
  if (!redis || req.method !== 'GET') return next();

  const key = `cache:${req.user?._id || 'anon'}:${req.originalUrl}`;

  try {
    const cached = await redis.get(key);
    if (cached) {
      const data = JSON.parse(cached);
      return res.status(200).json(data);
    }
  } catch {
    return next();
  }

  // Intercept response to cache it
  const origJson = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode >= 200 && res.statusCode < 300 && redis) {
      redis.setex(key, ttl, JSON.stringify(body)).catch(() => {});
    }
    return origJson(body);
  };

  next();
};

/**
 * Invalidate cache keys by pattern
 */
const invalidateCache = async (pattern) => {
  if (!redis) return;
  try {
    const keys = await redis.keys(`cache:*${pattern}*`);
    if (keys.length > 0) await redis.del(...keys);
  } catch {}
};

/**
 * Get the Redis client (or null if unavailable)
 */
const getRedis = () => redis;

module.exports = { cache, invalidateCache, getRedis };
