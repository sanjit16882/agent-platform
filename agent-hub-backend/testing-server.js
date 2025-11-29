/**
 * Testing Framework Server
 * Standalone server for testing services
 */

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const cacheMiddleware = require('./middleware/cacheMiddleware');
const testingRoutes = require('./routes/testingRoutes');

const app = express();
const PORT = process.env.PORT || 3002;

// Rate limiting configuration
const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 200, // Increased limit for testing server
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health'
});

// Stricter rate limit for test execution
const testExecutionLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 test executions per minute
  message: { error: 'Too many test execution requests, please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(generalLimiter);

// Cache GET requests for 30 seconds
app.use(cacheMiddleware(30000));

console.log('✅ Rate limiting enabled: 200 requests/minute per IP');
console.log('✅ Test execution limit: 30 executions/minute per IP');
console.log('✅ Response caching enabled: 30 seconds');

// Routes with specific rate limiting for test execution
app.use('/api/testing/run', testExecutionLimiter);
app.use('/api/testing/execute', testExecutionLimiter);
app.use('/api', testingRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'testing-framework' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🧪 Testing Framework Server running on port ${PORT}`);
  console.log(`📊 API available at http://localhost:${PORT}/api`);
  console.log(`❤️  Health check at http://localhost:${PORT}/health`);
});

module.exports = app;
