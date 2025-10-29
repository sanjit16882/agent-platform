import { createClient, RedisClientType } from 'redis';
import { logger } from '../utils/logger';

let redisClient: RedisClientType | null = null;
let isRedisAvailable = false;

/**
 * Initialize Redis connection
 */
export async function initializeRedis(): Promise<RedisClientType | null> {
  if (redisClient) {
    return redisClient;
  }

  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    redisClient = createClient({
      url: redisUrl,
      password: process.env.REDIS_PASSWORD || undefined,
      socket: {
        connectTimeout: 5000,
        lazyConnect: true
      }
    });

    // Handle Redis events
    redisClient.on('error', (error) => {
      logger.warn('Redis connection error:', error);
      isRedisAvailable = false;
    });

    redisClient.on('connect', () => {
      logger.info('Redis connected successfully');
      isRedisAvailable = true;
    });

    redisClient.on('disconnect', () => {
      logger.warn('Redis disconnected');
      isRedisAvailable = false;
    });

    // Attempt to connect
    await redisClient.connect();
    
    // Test the connection
    await redisClient.ping();
    
    logger.info('Redis initialized successfully', { url: redisUrl });
    isRedisAvailable = true;
    
    return redisClient;
  } catch (error) {
    logger.warn('Redis initialization failed, falling back to in-memory rate limiting:', error);
    isRedisAvailable = false;
    redisClient = null;
    return null;
  }
}

/**
 * Get Redis client (returns null if not available)
 */
export function getRedisClient(): RedisClientType | null {
  return redisClient;
}

/**
 * Check if Redis is available
 */
export function isRedisConnected(): boolean {
  return isRedisAvailable && redisClient?.isOpen === true;
}

/**
 * Close Redis connection
 */
export async function closeRedis(): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.quit();
      logger.info('Redis connection closed');
    } catch (error) {
      logger.warn('Error closing Redis connection:', error);
    } finally {
      redisClient = null;
      isRedisAvailable = false;
    }
  }
}

/**
 * Redis-based rate limiting operations
 */
export class RedisRateLimiter {
  private client: RedisClientType | null;

  constructor() {
    this.client = getRedisClient();
  }

  /**
   * Check and increment rate limit counter
   */
  async checkRateLimit(
    key: string, 
    windowMs: number, 
    maxRequests: number
  ): Promise<{
    allowed: boolean;
    count: number;
    remaining: number;
    resetTime: number;
  }> {
    if (!this.client || !isRedisConnected()) {
      // Fallback to allowing request if Redis is not available
      return {
        allowed: true,
        count: 1,
        remaining: maxRequests - 1,
        resetTime: Date.now() + windowMs
      };
    }

    try {
      const now = Date.now();
      const windowStart = Math.floor(now / windowMs) * windowMs;
      const windowKey = `rate_limit:${key}:${windowStart}`;

      // Use Redis pipeline for atomic operations
      const pipeline = this.client.multi();
      
      // Increment counter
      pipeline.incr(windowKey);
      
      // Set expiration if this is the first request in the window
      pipeline.expire(windowKey, Math.ceil(windowMs / 1000));
      
      // Execute pipeline
      const results = await pipeline.exec();
      
      if (!results || results.length < 2) {
        throw new Error('Redis pipeline execution failed');
      }

      const count = results[0] as number;
      const allowed = count <= maxRequests;
      const remaining = Math.max(0, maxRequests - count);
      const resetTime = windowStart + windowMs;

      return {
        allowed,
        count,
        remaining,
        resetTime
      };
    } catch (error) {
      logger.error('Redis rate limit check failed:', error);
      
      // Fallback to allowing request on Redis error
      return {
        allowed: true,
        count: 1,
        remaining: maxRequests - 1,
        resetTime: Date.now() + windowMs
      };
    }
  }

  /**
   * Get current rate limit status without incrementing
   */
  async getRateLimitStatus(
    key: string, 
    windowMs: number, 
    maxRequests: number
  ): Promise<{
    count: number;
    remaining: number;
    resetTime: number;
  }> {
    if (!this.client || !isRedisConnected()) {
      return {
        count: 0,
        remaining: maxRequests,
        resetTime: Date.now() + windowMs
      };
    }

    try {
      const now = Date.now();
      const windowStart = Math.floor(now / windowMs) * windowMs;
      const windowKey = `rate_limit:${key}:${windowStart}`;

      const count = await this.client.get(windowKey);
      const currentCount = count ? parseInt(count, 10) : 0;
      const remaining = Math.max(0, maxRequests - currentCount);
      const resetTime = windowStart + windowMs;

      return {
        count: currentCount,
        remaining,
        resetTime
      };
    } catch (error) {
      logger.error('Redis rate limit status check failed:', error);
      
      return {
        count: 0,
        remaining: maxRequests,
        resetTime: Date.now() + windowMs
      };
    }
  }

  /**
   * Reset rate limit for a specific key
   */
  async resetRateLimit(key: string, windowMs: number): Promise<void> {
    if (!this.client || !isRedisConnected()) {
      return;
    }

    try {
      const now = Date.now();
      const windowStart = Math.floor(now / windowMs) * windowMs;
      const windowKey = `rate_limit:${key}:${windowStart}`;

      await this.client.del(windowKey);
      logger.info('Rate limit reset', { key });
    } catch (error) {
      logger.error('Failed to reset rate limit:', error);
    }
  }
}