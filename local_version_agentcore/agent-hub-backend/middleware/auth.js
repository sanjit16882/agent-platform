// Simple authentication middleware for development
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'agenthub2024';

const authMiddleware = (req, res, next) => {
  // Skip auth for health checks
  if (req.path === '/health') {
    return next();
  }

  // Check for demo password in header or query
  const password = req.headers['x-demo-password'] || req.query.password;
  
  if (password !== DEMO_PASSWORD) {
    return res.status(401).json({
      error: 'Demo access required',
      message: 'Please provide demo password'
    });
  }
  
  next();
};

module.exports = authMiddleware;