import { Request, Response, NextFunction } from 'express';
import { RedisRateLimiter } from '../config/redis';
import { AppError } from './errorHandler';
import { logger } from '../utils/logger';

// In-memory fallback for when Redis is not available
class InMemoryRateLimiter {
  private store: Map<string, { count: number; resetTime: number }> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, data] of this.store.entries()) {
      if (data.resetTime <= now) {
        this.store.delete(key);
      }
    }
  }

  checkRateLimit(
    key: string, 
    windowMs: number, 
    maxRequests: number
  ): {
    allowed: boolean;
    count: number;
    remaining: number;
    resetTime: number;
  } {
    const now = Date.now();
    const windowStart = Math.floor(now / windowMs) * windowMs;
    const windowKey = `${key}:${windowStart}`;
    
    const existing = this.store.get(windowKey);
    
    if (!existing) {
      // First request in this window
      const resetTime = windowStart + windowMs;
      this.store.set(windowKey, { count: 1, resetTime });
      
      return {
        allowed: true,
        count: 1,
        remaining: maxRequests - 1,
        resetTime
      };
    }

    // Increment existing count
    existing.count++;
    const allowed = existing.count <= maxRequests;
    const remaining = Math.max(0, maxRequests - existing.count);

    return {
      allowed,
      count: existing.count,
      remaining,
      resetTime: existing.resetTime
    };
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.store.clear();
  }
}

// Global rate limiter instances
const redisLimiter = new RedisRateLimiter();
const memoryLimiter = new InMemoryRateLimiter();

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: Request) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  onLimitReached?: (req: Request, res: Response) => void;
}

/**
 * Rate limiting middleware factory
 */
export function createRateLimit(config: RateLimitConfig) {
  const {
    windowMs,
    maxRequests,
    keyGenerator = (req) => req.ip,
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    onLimitReached
  } = config;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const key = keyGenerator(req);
      
      // Try Redis first, fallback to in-memory
      let rateLimitResult;
      
      try {
        rateLimitResult = await redisLimiter.checkRateLimit(key, windowMs, maxRequests);
      } catch (error) {
        logger.warn('Redis rate limiting failed, using in-memory fallback:', error);
        rateLimitResult = memoryLimiter.checkRateLimit(key, windowMs, maxRequests);
      }

      // Set rate limit headers
      res.set({
        'X-RateLimit-Limit': maxRequests.toString(),
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
        'X-RateLimit-Window': `${windowMs}ms`
      });

      if (!rateLimitResult.allowed) {
        // Rate limit exceeded
        const retryAfter = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);
        
        res.set({
          'Retry-After': retryAfter.toString()
        });

        // Call custom handler if provided
        if (onLimitReached) {
          onLimitReached(req, res);
        }

        logger.warn('Rate limit exceeded', {
          key,
          count: rateLimitResult.count,
          limit: maxRequests,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          url: req.url
        });

        throw new AppError(
          'Rate limit exceeded',
          429,
          'RATE_LIMIT_EXCEEDED',
          {
            limit: maxRequests,
            windowMs,
            retryAfter,
            resetTime: rateLimitResult.resetTime
          }
        );
      }

      // Store rate limit info for potential cleanup on response
      res.locals.rateLimitKey = key;
      res.locals.rateLimitConfig = config;

      // Handle skip options
      if (skipSuccessfulRequests || skipFailedRequests) {
        const originalEnd = res.end;
        res.end = function(chunk?: any, encoding?: any) {
          const shouldSkip = 
            (skipSuccessfulRequests && res.statusCode < 400) ||
            (skipFailedRequests && res.statusCode >= 400);

          if (shouldSkip) {
            // TODO: Implement decrement logic for Redis/memory store
            logger.debug('Skipping rate limit count for response', {
              statusCode: res.statusCode,
              skipSuccessful: skipSuccessfulRequests,
              skipFailed: skipFailedRequests
            });
          }

          originalEnd.call(this, chunk, encoding);
        };
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * API key-based rate limiting middleware
 */
export function createApiKeyRateLimit(config?: Partial<RateLimitConfig>) {
  const defaultConfig: RateLimitConfig = {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'), // 1 minute
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // 100 requests
    keyGenerator: (req) => {
      // Use API key ID if available, fallback to IP
      return req.apiKey?.id || `ip:${req.ip}`;
    },
    skipSuccessfulRequests: false,
    skipFailedRequests: true, // Don't count failed auth attempts
    ...config
  };

  return createRateLimit(defaultConfig);
}

/**
 * IP-based rate limiting middleware (for unauthenticated endpoints)
 */
export function createIpRateLimit(config?: Partial<RateLimitConfig>) {
  const defaultConfig: RateLimitConfig = {
    windowMs: 60000, // 1 minute
    maxRequests: 20, // Lower limit for unauthenticated requests
    keyGenerator: (req) => `ip:${req.ip}`,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    ...config
  };

  return createRateLimit(defaultConfig);
}

/**
 * Execution-specific rate limiting (higher limits for actual work)
 */
export function createExecutionRateLimit(config?: Partial<RateLimitConfig>) {
  const defaultConfig: RateLimitConfig = {
    windowMs: 300000, // 5 minutes
    maxRequests: 10, // 10 executions per 5 minutes
    keyGenerator: (req) => {
      return req.apiKey?.id || `ip:${req.ip}`;
    },
    skipSuccessfulRequests: false,
    skipFailedRequests: true,
    onLimitReached: (req, res) => {
      logger.warn('Execution rate limit exceeded', {
        apiKeyId: req.apiKey?.id,
        userId: req.user?.id,
        ip: req.ip,
        agentId: req.params.agentId
      });
    },
    ...config
  };

  return createRateLimit(defaultConfig);
}

/**
 * Get rate limit status for a key
 */
export async function getRateLimitStatus(
  key: string, 
  windowMs: number, 
  maxRequests: number
): Promise<{
  count: number;
  remaining: number;
  resetTime: number;
}> {
  try {
    return await redisLimiter.getRateLimitStatus(key, windowMs, maxRequests);
  } catch (error) {
    logger.warn('Failed to get rate limit status from Redis, using fallback');
    // Fallback to in-memory (limited functionality)
    return {
      count: 0,
      remaining: maxRequests,
      resetTime: Date.now() + windowMs
    };
  }
}

/**
 * Reset rate limit for a key (admin function)
 */
export async function resetRateLimit(key: string, windowMs: number): Promise<void> {
  try {
    await redisLimiter.resetRateLimit(key, windowMs);
  } catch (error) {
    logger.error('Failed to reset rate limit:', error);
    throw new Error('Failed to reset rate limit');
  }
}

// Cleanup function for graceful shutdown
export function cleanup(): void {
  memoryLimiter.destroy();
}