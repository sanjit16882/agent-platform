/**
 * Simple in-memory cache middleware
 * Caches GET requests to reduce load
 */

const cache = new Map();
const CACHE_DURATION = 30 * 1000; // 30 seconds

function cacheMiddleware(duration = CACHE_DURATION) {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const key = req.originalUrl || req.url;
    const cachedResponse = cache.get(key);

    if (cachedResponse) {
      const { data, timestamp } = cachedResponse;
      const age = Date.now() - timestamp;

      // Check if cache is still valid
      if (age < duration) {
        console.log(`✅ Cache HIT: ${key} (age: ${Math.round(age/1000)}s)`);
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('X-Cache-Age', Math.round(age/1000));
        return res.json(data);
      } else {
        // Cache expired, remove it
        cache.delete(key);
      }
    }

    // Cache miss - intercept res.json to cache the response
    const originalJson = res.json.bind(res);
    res.json = function(data) {
      // Only cache successful responses
      if (res.statusCode === 200) {
        cache.set(key, {
          data,
          timestamp: Date.now()
        });
        console.log(`💾 Cache MISS: ${key} - cached for ${duration/1000}s`);
        res.setHeader('X-Cache', 'MISS');
      }
      return originalJson(data);
    };

    next();
  };
}

// Clear cache periodically
setInterval(() => {
  const now = Date.now();
  let cleared = 0;
  
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      cache.delete(key);
      cleared++;
    }
  }
  
  if (cleared > 0) {
    console.log(`🧹 Cleared ${cleared} expired cache entries`);
  }
}, 60 * 1000); // Clean up every minute

module.exports = cacheMiddleware;
