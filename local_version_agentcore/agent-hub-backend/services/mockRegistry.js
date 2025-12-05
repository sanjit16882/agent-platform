/**
 * Mock Registry
 * 
 * Manages mock definitions for simulating external dependencies during testing
 */

class MockRegistry {
  constructor() {
    this.mocks = new Map();
    this.stats = {
      totalMocks: 0,
      totalMatches: 0,
      totalMisses: 0
    };
  }

  /**
   * Register a mock definition
   * @param {object} mockDefinition - Mock definition object
   * @returns {boolean} - Success status
   */
  register(mockDefinition) {
    try {
      // Validate mock definition
      if (!this.validateMockDefinition(mockDefinition)) {
        throw new Error('Invalid mock definition');
      }

      // Create unique key for the mock
      const key = this.createMockKey(mockDefinition);

      // Store mock definition
      this.mocks.set(key, {
        ...mockDefinition,
        registeredAt: new Date().toISOString(),
        matchCount: 0
      });

      this.stats.totalMocks = this.mocks.size;

      console.log(`✓ Registered mock: ${mockDefinition.id} (${key})`);
      return true;

    } catch (error) {
      console.error(`✗ Failed to register mock: ${error.message}`);
      return false;
    }
  }

  /**
   * Unregister a mock definition
   * @param {string} mockId - Mock ID to unregister
   * @returns {boolean} - Success status
   */
  unregister(mockId) {
    let removed = false;

    for (const [key, mock] of this.mocks.entries()) {
      if (mock.id === mockId) {
        this.mocks.delete(key);
        removed = true;
        console.log(`✓ Unregistered mock: ${mockId}`);
      }
    }

    this.stats.totalMocks = this.mocks.size;
    return removed;
  }

  /**
   * Find matching mock for a request
   * @param {object} request - Request object to match
   * @returns {object|null} - Matching mock definition or null
   */
  findMatch(request) {
    const { service, endpoint, method, body } = request;

    // Try to find exact match first
    const exactKey = this.createMockKey({ service, endpoint, method });
    let mock = this.mocks.get(exactKey);

    if (mock) {
      // Check request matcher if defined
      if (mock.request_matcher) {
        if (!this.matchesRequestMatcher(body, mock.request_matcher)) {
          mock = null;
        }
      }
    }

    // If no exact match, try pattern matching
    if (!mock) {
      mock = this.findPatternMatch(request);
    }

    if (mock) {
      // Update statistics
      mock.matchCount++;
      this.stats.totalMatches++;
      console.log(`✓ Mock matched: ${mock.id} (matches: ${mock.matchCount})`);
      return mock;
    }

    this.stats.totalMisses++;
    console.log(`✗ No mock found for: ${service} ${method} ${endpoint}`);
    return null;
  }

  /**
   * Clear all mocks
   */
  clear() {
    const count = this.mocks.size;
    this.mocks.clear();
    this.stats.totalMocks = 0;
    console.log(`✓ Cleared ${count} mock(s)`);
  }

  /**
   * Get all registered mocks
   * @returns {Array} - Array of mock definitions
   */
  getAllMocks() {
    return Array.from(this.mocks.values());
  }

  /**
   * Get mock statistics
   * @returns {object} - Statistics object
   */
  getStats() {
    return {
      ...this.stats,
      mocks: this.getAllMocks().map(m => ({
        id: m.id,
        service: m.service,
        endpoint: m.endpoint,
        matchCount: m.matchCount
      }))
    };
  }

  /**
   * Validate mock definition
   * @param {object} mockDef - Mock definition to validate
   * @returns {boolean} - Validation result
   */
  validateMockDefinition(mockDef) {
    if (!mockDef.id) {
      console.error('Mock definition missing required field: id');
      return false;
    }

    if (!mockDef.service) {
      console.error('Mock definition missing required field: service');
      return false;
    }

    if (!mockDef.endpoint) {
      console.error('Mock definition missing required field: endpoint');
      return false;
    }

    if (!mockDef.method) {
      console.error('Mock definition missing required field: method');
      return false;
    }

    if (!mockDef.response) {
      console.error('Mock definition missing required field: response');
      return false;
    }

    if (typeof mockDef.response.status !== 'number') {
      console.error('Mock response missing required field: status');
      return false;
    }

    return true;
  }

  /**
   * Create unique key for mock
   * @param {object} mock - Mock definition
   * @returns {string} - Unique key
   */
  createMockKey(mock) {
    return `${mock.service}:${mock.method}:${mock.endpoint}`;
  }

  /**
   * Check if request body matches request matcher
   * @param {object} body - Request body
   * @param {object} matcher - Request matcher
   * @returns {boolean} - Match result
   */
  matchesRequestMatcher(body, matcher) {
    if (!body || !matcher) {
      return true;
    }

    // Check if all matcher fields are present in body
    for (const [key, value] of Object.entries(matcher)) {
      if (body[key] !== value) {
        return false;
      }
    }

    return true;
  }

  /**
   * Find mock using pattern matching
   * @param {object} request - Request object
   * @returns {object|null} - Matching mock or null
   */
  findPatternMatch(request) {
    const { service, endpoint, method } = request;

    for (const mock of this.mocks.values()) {
      // Match service
      if (mock.service !== service) {
        continue;
      }

      // Match method
      if (mock.method !== method) {
        continue;
      }

      // Try pattern matching on endpoint
      if (this.matchesEndpointPattern(endpoint, mock.endpoint)) {
        return mock;
      }
    }

    return null;
  }

  /**
   * Check if endpoint matches pattern
   * @param {string} endpoint - Actual endpoint
   * @param {string} pattern - Pattern to match
   * @returns {boolean} - Match result
   */
  matchesEndpointPattern(endpoint, pattern) {
    // Convert pattern to regex (simple implementation)
    // Supports wildcards like /api/*/resource
    const regexPattern = pattern
      .replace(/\*/g, '[^/]+')
      .replace(/\//g, '\\/');

    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(endpoint);
  }
}

module.exports = MockRegistry;
