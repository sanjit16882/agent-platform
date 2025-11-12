/**
 * Feature Flag Middleware
 * 
 * Middleware to check feature access before processing requests
 */

const { isFeatureEnabled, logFeatureAccess } = require('../config/features');

/**
 * Middleware to check if Testing Framework feature is enabled
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next function
 */
function checkTestingFeature(req, res, next) {
  const userId = req.user?.id || req.headers['x-user-id'] || null;
  const environment = process.env.NODE_ENV || 'production';
  
  const enabled = isFeatureEnabled('TESTING_FRAMEWORK', userId, environment);
  
  // Log access attempt
  logFeatureAccess('TESTING_FRAMEWORK', userId, enabled);
  
  if (!enabled) {
    return res.status(404).json({
      error: 'Feature not available',
      message: 'The testing framework feature is not currently available',
      code: 'FEATURE_DISABLED'
    });
  }
  
  // Feature is enabled, proceed
  next();
}

/**
 * Generic feature flag middleware factory
 * @param {string} featureName - Name of the feature to check
 * @returns {function} - Express middleware function
 */
function requireFeature(featureName) {
  return (req, res, next) => {
    const userId = req.user?.id || req.headers['x-user-id'] || null;
    const environment = process.env.NODE_ENV || 'production';
    
    const enabled = isFeatureEnabled(featureName, userId, environment);
    
    logFeatureAccess(featureName, userId, enabled);
    
    if (!enabled) {
      return res.status(404).json({
        error: 'Feature not available',
        message: `The ${featureName} feature is not currently available`,
        code: 'FEATURE_DISABLED'
      });
    }
    
    next();
  };
}

/**
 * Middleware to add feature flags to request object
 * Useful for conditional logic within route handlers
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next function
 */
function attachFeatureFlags(req, res, next) {
  const userId = req.user?.id || req.headers['x-user-id'] || null;
  const environment = process.env.NODE_ENV || 'production';
  
  req.features = {
    testingFramework: isFeatureEnabled('TESTING_FRAMEWORK', userId, environment)
  };
  
  next();
}

module.exports = {
  checkTestingFeature,
  requireFeature,
  attachFeatureFlags
};
