/**
 * Redis Cache Service
 * Provides caching layer for expensive database queries
 * 
 * Setup:
 * 1. Install Redis: npm install ioredis
 * 2. Set REDIS_URL in .env (or use default localhost)
 * 3. For GCP: Use Cloud Memorystore
 */

const Redis = require('ioredis');
const logger = require('../utils/logger');

class CacheService {
  constructor() {
    // Initialize Redis connection
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    this.redis = new Redis(redisUrl, {
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
    });

    this.defaultTTL = 300; // 5 minutes default
    this.enabled = true;

    // Handle connection events
    this.redis.on('connect', () => {
      logger.info('✅ Redis connected');
      this.enabled = true;
    });

    this.redis.on('error', (err) => {
      logger.error('❌ Redis error:', err);
      this.enabled = false;
    });

    this.redis.on('close', () => {
      logger.warn('⚠️ Redis connection closed');
      this.enabled = false;
    });

    // Connect to Redis
    this.redis.connect().catch((err) => {
      logger.error('Failed to connect to Redis:', err);
      this.enabled = false;
    });
  }

  /**
   * Get value from cache
   * @param {string} key - Cache key
   * @returns {Promise<any|null>} Cached value or null
   */
  async get(key) {
    if (!this.enabled) return null;

    try {
      const data = await this.redis.get(key);
      if (!data) return null;

      const parsed = JSON.parse(data);
      logger.info(`Cache HIT: ${key}`);
      return parsed;
    } catch (error) {
      logger.error(`Cache GET error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set value in cache
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in seconds (default: 300)
   */
  async set(key, value, ttl = this.defaultTTL) {
    if (!this.enabled) return;

    try {
      const serialized = JSON.stringify(value);
      await this.redis.setex(key, ttl, serialized);
      logger.info(`Cache SET: ${key} (TTL: ${ttl}s)`);
    } catch (error) {
      logger.error(`Cache SET error for key ${key}:`, error);
    }
  }

  /**
   * Delete specific key from cache
   * @param {string} key - Cache key to delete
   */
  async del(key) {
    if (!this.enabled) return;

    try {
      await this.redis.del(key);
      logger.info(`Cache DEL: ${key}`);
    } catch (error) {
      logger.error(`Cache DEL error for key ${key}:`, error);
    }
  }

  /**
   * Delete all keys matching a pattern
   * @param {string} pattern - Pattern to match (e.g., "comercio:123:*")
   */
  async invalidatePattern(pattern) {
    if (!this.enabled) return;

    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        logger.info(`Cache INVALIDATE: ${pattern} (${keys.length} keys)`);
      }
    } catch (error) {
      logger.error(`Cache INVALIDATE error for pattern ${pattern}:`, error);
    }
  }

  /**
   * Get or set pattern - fetch from cache or compute and cache
   * @param {string} key - Cache key
   * @param {Function} fetchFn - Function to fetch data if not cached
   * @param {number} ttl - Time to live in seconds
   * @returns {Promise<any>}
   */
  async getOrSet(key, fetchFn, ttl = this.defaultTTL) {
    // Try to get from cache first
    const cached = await this.get(key);
    if (cached !== null) {
      return cached;
    }

    // Not in cache, fetch data
    try {
      const data = await fetchFn();
      await this.set(key, data, ttl);
      return data;
    } catch (error) {
      logger.error(`Cache getOrSet error for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Clear all cache (use with caution!)
   */
  async flushAll() {
    if (!this.enabled) return;

    try {
      await this.redis.flushall();
      logger.warn('⚠️ Cache FLUSH ALL');
    } catch (error) {
      logger.error('Cache FLUSH ALL error:', error);
    }
  }

  /**
   * Get cache statistics
   * @returns {Promise<object>}
   */
  async getStats() {
    if (!this.enabled) {
      return { enabled: false };
    }

    try {
      const info = await this.redis.info('stats');
      const dbSize = await this.redis.dbsize();
      
      return {
        enabled: true,
        connected: this.redis.status === 'ready',
        dbSize,
        info: info.split('\r\n').reduce((acc, line) => {
          const [key, value] = line.split(':');
          if (key && value) acc[key] = value;
          return acc;
        }, {})
      };
    } catch (error) {
      logger.error('Cache STATS error:', error);
      return { enabled: false, error: error.message };
    }
  }

  /**
   * Close Redis connection
   */
  async close() {
    if (this.redis) {
      await this.redis.quit();
      logger.info('Redis connection closed');
    }
  }
}

// Export singleton instance
module.exports = new CacheService();

/**
 * Usage Examples:
 * 
 * // Simple get/set
 * await cacheService.set('user:123', userData, 600);
 * const user = await cacheService.get('user:123');
 * 
 * // Get or compute
 * const stats = await cacheService.getOrSet(
 *   'comercio:123:stats',
 *   async () => {
 *     // Expensive database query
 *     return await computeStats();
 *   },
 *   300
 * );
 * 
 * // Invalidate pattern
 * await cacheService.invalidatePattern('comercio:123:*');
 */
