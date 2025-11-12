// Rate limiting for public demo
const rateLimit = require('express-rate-limit');

const createRateLimiter = (windowMs = 15 * 60 * 1000, max = 100) => {
  return rateLimit({
    windowMs, // 15 minutes
    max, // limit each IP to 100 requests per windowMs
    message: {
      error: 'Too many requests',
      message: 'Please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

module.exports = {
  general: createRateLimiter(15 * 60 * 1000, 100), // 100 requests per 15 min
  strict: createRateLimiter(5 * 60 * 1000, 20),    // 20 requests per 5 min
  api: createRateLimiter(1 * 60 * 1000, 30)        // 30 API calls per minute
};