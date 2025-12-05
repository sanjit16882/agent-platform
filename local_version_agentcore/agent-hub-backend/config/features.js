/**
 * Feature Flags Configuration
 * 
 * Controls feature availability and rollout for the Agent Testing Framework
 */

const FEATURE_FLAGS = {
  TESTING_FRAMEWORK: {
    // Main feature toggle
    enabled: process.env.TESTING_FEATURE_ENABLED === 'true',
    
    // Gradual rollout percentage (0-100)
    rolloutPercentage: parseInt(process.env.TESTING_ROLLOUT_PERCENTAGE || '100', 10),
    
    // Allowed users for beta testing (comma-separated list)
    allowedUsers: process.env.TESTING_ALLOWED_USERS 
      ? process.env.TESTING_ALLOWED_USERS.split(',').map(u => u.trim())
      : [],
    
    // Allowed environments
    allowedEnvironments: process.env.TESTING_ALLOWED_ENVIRONMENTS
      ? process.env.TESTING_ALLOWED_ENVIRONMENTS.split(',').map(e => e.trim())
      : ['development', 'staging', 'production'],
    
    // Feature-specific settings
    settings: {
      maxConcurrentTests: parseInt(process.env.TESTING_MAX_CONCURRENT || '10', 10),
      defaultTimeout: parseInt(process.env.TESTING_DEFAULT_TIMEOUT || '30000', 10),
      enableMockMode: process.env.TESTING_ENABLE_MOCK_MODE !== 'false',
      enableAnalytics: process.env.TESTING_ENABLE_ANALYTICS !== 'false',
      enableInsights: process.env.TESTING_ENABLE_INSIGHTS !== 'false',
    }
  }
};

/**
 * Check if a feature is enabled for a specific user
 * @param {string} featureName - Name of the feature
 * @param {string} userId - User ID to check
 * @param {string} environment - Current environment
 * @returns {boolean} - Whether feature is enabled
 */
function isFeatureEnabled(featureName, userId = null, environment = 'production') {
  const feature = FEATURE_FLAGS[featureName];
  
  if (!feature) {
    console.warn(`Feature flag not found: ${featureName}`);
    return false;
  }
  
  // Check if feature is globally disabled
  if (!feature.enabled) {
    return false;
  }
  
  // Check environment
  if (!feature.allowedEnvironments.includes(environment)) {
    return false;
  }
  
  // Check if user is in allowed list (if list exists)
  if (feature.allowedUsers.length > 0) {
    if (!userId || !feature.allowedUsers.includes(userId)) {
      return false;
    }
  }
  
  // Check rollout percentage
  if (feature.rolloutPercentage < 100) {
    // Simple hash-based rollout
    if (userId) {
      const hash = hashString(userId);
      const userPercentage = hash % 100;
      return userPercentage < feature.rolloutPercentage;
    }
    // If no userId, use random rollout
    return Math.random() * 100 < feature.rolloutPercentage;
  }
  
  return true;
}

/**
 * Get feature settings
 * @param {string} featureName - Name of the feature
 * @returns {object} - Feature settings
 */
function getFeatureSettings(featureName) {
  const feature = FEATURE_FLAGS[featureName];
  return feature ? feature.settings : {};
}

/**
 * Simple string hash function for consistent user rollout
 * @param {string} str - String to hash
 * @returns {number} - Hash value
 */
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Log feature access attempt
 * @param {string} featureName - Name of the feature
 * @param {string} userId - User ID
 * @param {boolean} granted - Whether access was granted
 */
function logFeatureAccess(featureName, userId, granted) {
  const timestamp = new Date().toISOString();
  console.log(`[Feature Access] ${timestamp} - Feature: ${featureName}, User: ${userId || 'anonymous'}, Granted: ${granted}`);
}

module.exports = {
  FEATURE_FLAGS,
  isFeatureEnabled,
  getFeatureSettings,
  logFeatureAccess
};
