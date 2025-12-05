/**
 * Testing Service Configuration
 * 
 * Configuration settings for the Agent Testing Framework
 */

const config = {
  // Test Execution Settings
  execution: {
    // Default timeout for test execution (milliseconds)
    defaultTimeout: parseInt(process.env.TESTING_DEFAULT_TIMEOUT || '30000', 10),
    
    // Maximum timeout allowed (milliseconds)
    maxTimeout: parseInt(process.env.TESTING_MAX_TIMEOUT || '300000', 10),
    
    // Number of retry attempts for failed tests
    defaultRetries: parseInt(process.env.TESTING_DEFAULT_RETRIES || '0', 10),
    
    // Maximum retries allowed
    maxRetries: parseInt(process.env.TESTING_MAX_RETRIES || '3', 10),
    
    // Maximum concurrent test executions
    maxConcurrent: parseInt(process.env.TESTING_MAX_CONCURRENT || '10', 10),
    
    // Enable parallel test execution
    enableParallel: process.env.TESTING_ENABLE_PARALLEL !== 'false',
    
    // Test execution mode: 'demo', 'sandbox', 'production'
    defaultMode: process.env.TESTING_DEFAULT_MODE || 'demo',
  },
  
  // Mock Layer Settings
  mock: {
    // Enable mock mode by default
    enabled: process.env.TESTING_MOCK_ENABLED !== 'false',
    
    // Directory containing mock definitions
    mocksDirectory: process.env.TESTING_MOCKS_DIR || './mocks',
    
    // Simulated latency range (milliseconds)
    minLatency: parseInt(process.env.TESTING_MOCK_MIN_LATENCY || '100', 10),
    maxLatency: parseInt(process.env.TESTING_MOCK_MAX_LATENCY || '500', 10),
    
    // Enable hot-reloading of mock files
    hotReload: process.env.TESTING_MOCK_HOT_RELOAD === 'true',
  },
  
  // Evaluation Settings
  evaluation: {
    // Default tolerance for fuzzy matching (0-1)
    defaultTolerance: parseFloat(process.env.TESTING_DEFAULT_TOLERANCE || '0.8'),
    
    // Enable AI-specific metrics (BLEU, ROUGE, etc.)
    enableAIMetrics: process.env.TESTING_ENABLE_AI_METRICS === 'true',
    
    // Token counting method: 'simple', 'tiktoken'
    tokenCountingMethod: process.env.TESTING_TOKEN_METHOD || 'simple',
    
    // Cost calculation settings
    costPerInputToken: parseFloat(process.env.TESTING_COST_INPUT_TOKEN || '0.00001'),
    costPerOutputToken: parseFloat(process.env.TESTING_COST_OUTPUT_TOKEN || '0.00003'),
  },
  
  // Storage Settings
  storage: {
    // Database path
    databasePath: process.env.DB_PATH || './data/agenthub.db',
    
    // Test results retention (days)
    resultsRetentionDays: parseInt(process.env.TESTING_RETENTION_DAYS || '90', 10),
    
    // Aggregated metrics retention (days)
    metricsRetentionDays: parseInt(process.env.TESTING_METRICS_RETENTION_DAYS || '730', 10),
    
    // Enable result caching
    enableCaching: process.env.TESTING_ENABLE_CACHING !== 'false',
    
    // Cache TTL (seconds)
    cacheTTL: parseInt(process.env.TESTING_CACHE_TTL || '300', 10),
  },
  
  // Analytics Settings
  analytics: {
    // Enable analytics collection
    enabled: process.env.TESTING_ANALYTICS_ENABLED !== 'false',
    
    // Aggregation interval (minutes)
    aggregationInterval: parseInt(process.env.TESTING_AGGREGATION_INTERVAL || '60', 10),
    
    // Enable real-time metrics
    enableRealTime: process.env.TESTING_ENABLE_REALTIME === 'true',
  },
  
  // Insights & Recommendations
  insights: {
    // Enable insights generation
    enabled: process.env.TESTING_INSIGHTS_ENABLED !== 'false',
    
    // Minimum failure count to trigger pattern analysis
    minFailureCount: parseInt(process.env.TESTING_MIN_FAILURE_COUNT || '5', 10),
    
    // Minimum occurrences for pattern detection
    minPatternOccurrences: parseInt(process.env.TESTING_MIN_PATTERN_OCCURRENCES || '3', 10),
    
    // Enable auto-healing recommendations
    enableAutoHealing: process.env.TESTING_ENABLE_AUTO_HEALING === 'true',
  },
  
  // Sandbox Settings
  sandbox: {
    // Enable sandbox mode
    enabled: process.env.TESTING_SANDBOX_ENABLED !== 'false',
    
    // Prevent production data access in sandbox
    isolateProduction: process.env.TESTING_SANDBOX_ISOLATE !== 'false',
    
    // Sandbox-specific configuration file
    configFile: process.env.TESTING_SANDBOX_CONFIG || './config/sandbox.config.json',
  },
  
  // Logging Settings
  logging: {
    // Log level: 'debug', 'info', 'warn', 'error'
    level: process.env.TESTING_LOG_LEVEL || 'info',
    
    // Enable detailed test execution logs
    enableDetailedLogs: process.env.TESTING_DETAILED_LOGS === 'true',
    
    // Log test results to file
    logToFile: process.env.TESTING_LOG_TO_FILE === 'true',
    
    // Log file path
    logFilePath: process.env.TESTING_LOG_FILE || './logs/testing.log',
  },
  
  // Health Check Settings
  health: {
    // Health check interval (seconds)
    checkInterval: parseInt(process.env.TESTING_HEALTH_INTERVAL || '30', 10),
    
    // Database connection timeout (milliseconds)
    dbTimeout: parseInt(process.env.TESTING_DB_TIMEOUT || '5000', 10),
  },
};

/**
 * Validate configuration
 * @returns {object} - Validation result
 */
function validateConfig() {
  const errors = [];
  
  // Validate timeout settings
  if (config.execution.defaultTimeout > config.execution.maxTimeout) {
    errors.push('defaultTimeout cannot exceed maxTimeout');
  }
  
  // Validate retry settings
  if (config.execution.defaultRetries > config.execution.maxRetries) {
    errors.push('defaultRetries cannot exceed maxRetries');
  }
  
  // Validate tolerance
  if (config.evaluation.defaultTolerance < 0 || config.evaluation.defaultTolerance > 1) {
    errors.push('defaultTolerance must be between 0 and 1');
  }
  
  // Validate retention days
  if (config.storage.resultsRetentionDays < 1) {
    errors.push('resultsRetentionDays must be at least 1');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Get configuration for specific component
 * @param {string} component - Component name
 * @returns {object} - Component configuration
 */
function getComponentConfig(component) {
  return config[component] || {};
}

module.exports = {
  config,
  validateConfig,
  getComponentConfig
};
