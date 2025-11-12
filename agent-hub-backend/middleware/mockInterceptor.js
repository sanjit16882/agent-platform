/**
 * Mock Interceptor Middleware
 * 
 * Intercepts API calls during test execution and returns mocked responses
 */

const { config } = require('../config/testing');

class MockInterceptor {
  constructor(mockRegistry) {
    this.mockRegistry = mockRegistry;
    this.enabled = config.mock.enabled;
    this.interceptedRequests = [];
  }

  /**
   * Enable mock interception
   */
  enable() {
    this.enabled = true;
    console.log('✓ Mock interception enabled');
  }

  /**
   * Disable mock interception
   */
  disable() {
    this.enabled = false;
    console.log('✓ Mock interception disabled');
  }

  /**
   * Express middleware for intercepting requests
   * @returns {function} - Express middleware function
   */
  middleware() {
    return async (req, res, next) => {
      // Only intercept if mock mode is enabled
      if (!this.enabled) {
        return next();
      }

      // Only intercept specific paths (e.g., external API calls)
      if (!this.shouldIntercept(req)) {
        return next();
      }

      try {
        // Extract request details
        const request = {
          service: this.extractService(req),
          endpoint: req.path,
          method: req.method,
          body: req.body,
          headers: req.headers,
          query: req.query
        };

        // Try to find matching mock
        const mock = this.mockRegistry.findMatch(request);

        if (mock) {
          // Log intercepted request
          this.logInterception(request, mock);

          // Simulate latency if specified
          await this.simulateLatency(mock.response.latency_ms);

          // Return mocked response
          return this.sendMockResponse(res, mock.response);
        }

        // No mock found, log and continue to real service
        console.log(`⚠ No mock found, passing through: ${request.service} ${request.method} ${request.endpoint}`);
        return next();

      } catch (error) {
        console.error(`Mock interception error: ${error.message}`);
        return next();
      }
    };
  }

  /**
   * Determine if request should be intercepted
   * @param {object} req - Express request object
   * @returns {boolean} - Whether to intercept
   */
  shouldIntercept(req) {
    // Intercept paths that match external service patterns
    const interceptPaths = [
      '/api/bedrock/',
      '/api/mcp/',
      '/api/external/',
      '/invoke-model',
      '/tools/list'
    ];

    return interceptPaths.some(path => req.path.includes(path));
  }

  /**
   * Extract service name from request
   * @param {object} req - Express request object
   * @returns {string} - Service name
   */
  extractService(req) {
    // Extract service from path or headers
    if (req.path.includes('/bedrock/')) {
      return 'bedrock';
    }
    if (req.path.includes('/mcp/')) {
      return 'mcp';
    }
    if (req.headers['x-service-name']) {
      return req.headers['x-service-name'];
    }
    return 'unknown';
  }

  /**
   * Simulate network latency
   * @param {number} latencyMs - Latency in milliseconds
   * @returns {Promise<void>}
   */
  async simulateLatency(latencyMs) {
    if (!latencyMs) {
      // Use random latency within configured range
      const min = config.mock.minLatency;
      const max = config.mock.maxLatency;
      latencyMs = Math.floor(Math.random() * (max - min + 1)) + min;
    }

    return new Promise(resolve => setTimeout(resolve, latencyMs));
  }

  /**
   * Send mocked response
   * @param {object} res - Express response object
   * @param {object} mockResponse - Mock response definition
   */
  sendMockResponse(res, mockResponse) {
    // Set status code
    res.status(mockResponse.status);

    // Set headers if specified
    if (mockResponse.headers) {
      for (const [key, value] of Object.entries(mockResponse.headers)) {
        res.setHeader(key, value);
      }
    }

    // Add mock indicator header
    res.setHeader('X-Mock-Response', 'true');

    // Send body
    return res.json(mockResponse.body);
  }

  /**
   * Log intercepted request
   * @param {object} request - Request details
   * @param {object} mock - Matched mock definition
   */
  logInterception(request, mock) {
    const log = {
      timestamp: new Date().toISOString(),
      service: request.service,
      method: request.method,
      endpoint: request.endpoint,
      mockId: mock.id,
      mockStatus: mock.response.status
    };

    this.interceptedRequests.push(log);

    // Keep only last 100 requests
    if (this.interceptedRequests.length > 100) {
      this.interceptedRequests.shift();
    }

    console.log(`✓ Intercepted: ${request.service} ${request.method} ${request.endpoint} → Mock: ${mock.id}`);
  }

  /**
   * Get interception statistics
   * @returns {object} - Statistics object
   */
  getStats() {
    return {
      enabled: this.enabled,
      totalIntercepted: this.interceptedRequests.length,
      recentRequests: this.interceptedRequests.slice(-10),
      mockRegistryStats: this.mockRegistry.getStats()
    };
  }

  /**
   * Clear interception history
   */
  clearHistory() {
    this.interceptedRequests = [];
    console.log('✓ Cleared interception history');
  }
}

/**
 * Create mock interceptor instance
 * @param {object} mockRegistry - MockRegistry instance
 * @returns {object} - MockInterceptor instance
 */
function createMockInterceptor(mockRegistry) {
  return new MockInterceptor(mockRegistry);
}

module.exports = {
  MockInterceptor,
  createMockInterceptor
};
