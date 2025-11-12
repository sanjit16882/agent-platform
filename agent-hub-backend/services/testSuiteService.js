/**
 * Test Suite Service
 * 
 * Manages test suites (universal and custom) for the Agent Testing Framework
 */

const { v4: uuidv4 } = require('uuid');

class TestSuiteService {
  constructor(db) {
    this.db = db;
  }

  /**
   * Get all test suites
   * @param {object} filters - Optional filters
   * @returns {Promise<Array>} - Array of test suites
   */
  async getAllSuites(filters = {}) {
    return new Promise((resolve, reject) => {
      let query = 'SELECT * FROM test_suites WHERE 1=1';
      const params = [];

      // Apply filters
      if (filters.suite_type) {
        query += ' AND suite_type = ?';
        params.push(filters.suite_type);
      }

      if (filters.agent_id) {
        query += ' AND agent_id = ?';
        params.push(filters.agent_id);
      }

      if (filters.enabled !== undefined) {
        query += ' AND enabled = ?';
        params.push(filters.enabled ? 1 : 0);
      }

      query += ' ORDER BY created_at DESC';

      this.db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          // Parse JSON fields
          const suites = rows.map(row => this.parseTestSuite(row));
          resolve(suites);
        }
      });
    });
  }

  /**
   * Get test suite by ID
   * @param {string} suiteId - Suite ID
   * @returns {Promise<object|null>} - Test suite or null
   */
  async getSuiteById(suiteId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM test_suites WHERE id = ?',
        [suiteId],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row ? this.parseTestSuite(row) : null);
          }
        }
      );
    });
  }

  /**
   * Create new test suite
   * @param {object} suiteData - Suite data
   * @returns {Promise<object>} - Created suite
   */
  async createSuite(suiteData) {
    // Validate suite data
    this.validateSuiteData(suiteData);

    // Ensure universal suites don't have agent_id
    if (suiteData.suite_type === 'universal' && suiteData.agent_id) {
      throw new Error('Universal test suites cannot be associated with a specific agent');
    }

    // Ensure custom suites have agent_id
    if (suiteData.suite_type === 'custom' && !suiteData.agent_id) {
      throw new Error('Custom test suites must be associated with an agent');
    }

    const suite = {
      id: uuidv4(),
      suite_type: suiteData.suite_type,
      name: suiteData.name,
      description: suiteData.description || '',
      agent_id: suiteData.agent_id || null,
      enabled: suiteData.enabled !== undefined ? suiteData.enabled : true,
      test_definitions: JSON.stringify(suiteData.tests || []),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: suiteData.created_by || 'system'
    };

    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO test_suites (
          id, suite_type, name, description, agent_id, enabled,
          test_definitions, created_at, updated_at, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        suite.id,
        suite.suite_type,
        suite.name,
        suite.description,
        suite.agent_id,
        suite.enabled ? 1 : 0,
        suite.test_definitions,
        suite.created_at,
        suite.updated_at,
        suite.created_by
      ];

      this.db.run(query, params, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log(`✓ Created test suite: ${suite.name} (${suite.id})`);
          resolve(this.parseTestSuite(suite));
        }
      });
    });
  }

  /**
   * Update test suite
   * @param {string} suiteId - Suite ID
   * @param {object} updates - Fields to update
   * @returns {Promise<object>} - Updated suite
   */
  async updateSuite(suiteId, updates) {
    // Get existing suite
    const existing = await this.getSuiteById(suiteId);
    if (!existing) {
      throw new Error(`Test suite not found: ${suiteId}`);
    }

    // Prevent updating universal suites' core properties
    if (existing.suite_type === 'universal') {
      if (updates.suite_type || updates.agent_id) {
        throw new Error('Cannot change suite_type or agent_id of universal suites');
      }
    }

    // Build update query
    const allowedFields = ['name', 'description', 'enabled', 'test_definitions'];
    const updateFields = [];
    const params = [];

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        
        if (field === 'test_definitions') {
          params.push(JSON.stringify(updates[field]));
        } else if (field === 'enabled') {
          params.push(updates[field] ? 1 : 0);
        } else {
          params.push(updates[field]);
        }
      }
    }

    if (updateFields.length === 0) {
      return existing;
    }

    // Add updated_at
    updateFields.push('updated_at = ?');
    params.push(new Date().toISOString());

    // Add suite ID
    params.push(suiteId);

    return new Promise((resolve, reject) => {
      const query = `
        UPDATE test_suites
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `;

      this.db.run(query, params, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log(`✓ Updated test suite: ${suiteId}`);
          this.getSuiteById(suiteId).then(resolve).catch(reject);
        }
      });
    });
  }

  /**
   * Delete test suite
   * @param {string} suiteId - Suite ID
   * @returns {Promise<boolean>} - Success status
   */
  async deleteSuite(suiteId) {
    // Get existing suite
    const existing = await this.getSuiteById(suiteId);
    if (!existing) {
      throw new Error(`Test suite not found: ${suiteId}`);
    }

    // Prevent deleting universal suites
    if (existing.suite_type === 'universal') {
      throw new Error('Cannot delete universal test suites. Use disable instead.');
    }

    return new Promise((resolve, reject) => {
      this.db.run(
        'DELETE FROM test_suites WHERE id = ?',
        [suiteId],
        (err) => {
          if (err) {
            reject(err);
          } else {
            console.log(`✓ Deleted test suite: ${suiteId}`);
            resolve(true);
          }
        }
      );
    });
  }

  /**
   * Enable or disable a test suite
   * @param {string} suiteId - Suite ID
   * @param {boolean} enabled - Enable status
   * @returns {Promise<object>} - Updated suite
   */
  async setSuiteEnabled(suiteId, enabled) {
    return this.updateSuite(suiteId, { enabled });
  }

  /**
   * Get test suites for a specific agent
   * @param {string} agentId - Agent ID
   * @returns {Promise<Array>} - Array of test suites
   */
  async getSuitesForAgent(agentId) {
    // Get universal suites (apply to all agents)
    const universalSuites = await this.getAllSuites({
      suite_type: 'universal',
      enabled: true
    });

    // Get custom suites for this agent
    const customSuites = await this.getAllSuites({
      suite_type: 'custom',
      agent_id: agentId,
      enabled: true
    });

    return [...universalSuites, ...customSuites];
  }

  /**
   * Get suite statistics
   * @param {string} suiteId - Suite ID
   * @returns {Promise<object>} - Suite statistics
   */
  async getSuiteStats(suiteId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          COUNT(DISTINCT tr.id) as total_runs,
          MAX(tr.end_time) as last_run,
          AVG(CASE WHEN tres.status = 'passed' THEN 1.0 ELSE 0.0 END) * 100 as avg_pass_rate,
          COUNT(tres.id) as total_tests_executed
        FROM test_suites ts
        LEFT JOIN test_runs tr ON ts.id = tr.suite_id AND tr.status = 'completed'
        LEFT JOIN test_results tres ON tr.id = tres.run_id
        WHERE ts.id = ?
        GROUP BY ts.id
      `;

      this.db.get(query, [suiteId], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row || {
            total_runs: 0,
            last_run: null,
            avg_pass_rate: 0,
            total_tests_executed: 0
          });
        }
      });
    });
  }

  /**
   * Validate suite data
   * @param {object} suiteData - Suite data to validate
   * @throws {Error} - Validation error
   */
  validateSuiteData(suiteData) {
    if (!suiteData.suite_type) {
      throw new Error('suite_type is required');
    }

    if (!['universal', 'custom'].includes(suiteData.suite_type)) {
      throw new Error('suite_type must be "universal" or "custom"');
    }

    if (!suiteData.name) {
      throw new Error('name is required');
    }

    if (suiteData.tests && !Array.isArray(suiteData.tests)) {
      throw new Error('tests must be an array');
    }
  }

  /**
   * Parse test suite from database row
   * @param {object} row - Database row
   * @returns {object} - Parsed test suite
   */
  parseTestSuite(row) {
    return {
      id: row.id,
      suite_type: row.suite_type,
      name: row.name,
      description: row.description,
      agent_id: row.agent_id,
      enabled: Boolean(row.enabled),
      tests: JSON.parse(row.test_definitions || '[]'),
      created_at: row.created_at,
      updated_at: row.updated_at,
      created_by: row.created_by
    };
  }

  // ============================================================================
  // CUSTOM SUITE SPECIFIC OPERATIONS (Task 4.4)
  // ============================================================================

  /**
   * Create a custom test suite with agent association
   * @param {string} agentId - Agent ID
   * @param {object} suiteData - Suite data
   * @returns {Promise<object>} - Created custom suite
   */
  async createCustomSuite(agentId, suiteData) {
    if (!agentId) {
      throw new Error('Agent ID is required for custom test suites');
    }

    // Validate custom suite specific requirements
    this.validateCustomSuiteData(suiteData);

    const customSuiteData = {
      ...suiteData,
      suite_type: 'custom',
      agent_id: agentId
    };

    return this.createSuite(customSuiteData);
  }

  /**
   * Update custom suite tests
   * @param {string} suiteId - Suite ID
   * @param {Array} tests - Array of test definitions
   * @returns {Promise<object>} - Updated suite
   */
  async updateCustomSuiteTests(suiteId, tests) {
    // Verify it's a custom suite
    const suite = await this.getSuiteById(suiteId);
    if (!suite) {
      throw new Error(`Test suite not found: ${suiteId}`);
    }

    if (suite.suite_type !== 'custom') {
      throw new Error('Can only update tests for custom suites');
    }

    // Validate test definitions
    if (!Array.isArray(tests)) {
      throw new Error('Tests must be an array');
    }

    return this.updateSuite(suiteId, { test_definitions: tests });
  }

  /**
   * Delete custom suite (agent-specific only)
   * @param {string} suiteId - Suite ID
   * @param {string} agentId - Agent ID (for verification)
   * @returns {Promise<boolean>} - Success status
   */
  async deleteCustomSuite(suiteId, agentId) {
    const suite = await this.getSuiteById(suiteId);
    if (!suite) {
      throw new Error(`Test suite not found: ${suiteId}`);
    }

    if (suite.suite_type !== 'custom') {
      throw new Error('Can only delete custom test suites');
    }

    if (agentId && suite.agent_id !== agentId) {
      throw new Error('Suite does not belong to the specified agent');
    }

    return this.deleteSuite(suiteId);
  }

  /**
   * List custom suites by agent
   * @param {string} agentId - Agent ID
   * @param {object} options - Additional options
   * @returns {Promise<Array>} - Array of custom test suites
   */
  async listCustomSuitesByAgent(agentId, options = {}) {
    const filters = {
      suite_type: 'custom',
      agent_id: agentId,
      ...options
    };

    return this.getAllSuites(filters);
  }

  /**
   * List custom suites by category/tag
   * @param {string} category - Category or tag to filter by
   * @returns {Promise<Array>} - Array of custom test suites
   */
  async listCustomSuitesByCategory(category) {
    const allCustomSuites = await this.getAllSuites({ suite_type: 'custom' });
    
    // Filter by category in description or test tags
    return allCustomSuites.filter(suite => {
      // Check description
      if (suite.description && suite.description.toLowerCase().includes(category.toLowerCase())) {
        return true;
      }

      // Check test tags
      if (suite.tests && Array.isArray(suite.tests)) {
        return suite.tests.some(test => {
          if (test.metadata && test.metadata.tags) {
            return test.metadata.tags.some(tag => 
              tag.toLowerCase().includes(category.toLowerCase())
            );
          }
          return false;
        });
      }

      return false;
    });
  }

  /**
   * Clone/duplicate a test suite
   * @param {string} suiteId - Suite ID to clone
   * @param {object} overrides - Fields to override in the clone
   * @returns {Promise<object>} - Cloned suite
   */
  async cloneSuite(suiteId, overrides = {}) {
    const originalSuite = await this.getSuiteById(suiteId);
    if (!originalSuite) {
      throw new Error(`Test suite not found: ${suiteId}`);
    }

    // Cannot clone universal suites as custom
    if (originalSuite.suite_type === 'universal' && !overrides.suite_type) {
      throw new Error('Cannot clone universal suites. Create a custom suite instead.');
    }

    const clonedData = {
      suite_type: overrides.suite_type || originalSuite.suite_type,
      name: overrides.name || `${originalSuite.name} (Copy)`,
      description: overrides.description || originalSuite.description,
      agent_id: overrides.agent_id || originalSuite.agent_id,
      enabled: overrides.enabled !== undefined ? overrides.enabled : originalSuite.enabled,
      tests: overrides.tests || originalSuite.tests,
      created_by: overrides.created_by || 'system'
    };

    return this.createSuite(clonedData);
  }

  /**
   * Get custom suite count for an agent
   * @param {string} agentId - Agent ID
   * @returns {Promise<number>} - Count of custom suites
   */
  async getCustomSuiteCount(agentId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT COUNT(*) as count FROM test_suites WHERE suite_type = ? AND agent_id = ?',
        ['custom', agentId],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row.count);
          }
        }
      );
    });
  }

  /**
   * Validate custom suite specific data
   * @param {object} suiteData - Suite data to validate
   * @throws {Error} - Validation error
   */
  validateCustomSuiteData(suiteData) {
    if (!suiteData.name) {
      throw new Error('Custom suite name is required');
    }

    if (suiteData.name.length < 3) {
      throw new Error('Custom suite name must be at least 3 characters');
    }

    if (suiteData.name.length > 100) {
      throw new Error('Custom suite name must be less than 100 characters');
    }

    if (suiteData.tests) {
      if (!Array.isArray(suiteData.tests)) {
        throw new Error('Tests must be an array');
      }

      if (suiteData.tests.length === 0) {
        throw new Error('Custom suite must have at least one test');
      }

      // Validate each test has required fields
      suiteData.tests.forEach((test, index) => {
        if (!test.name) {
          throw new Error(`Test at index ${index} is missing a name`);
        }
        if (!test.id) {
          throw new Error(`Test at index ${index} is missing an id`);
        }
        if (!test.input) {
          throw new Error(`Test at index ${index} is missing input`);
        }
      });
    }
  }

  /**
   * Bulk enable/disable custom suites for an agent
   * @param {string} agentId - Agent ID
   * @param {boolean} enabled - Enable status
   * @returns {Promise<number>} - Number of suites updated
   */
  async bulkSetCustomSuitesEnabled(agentId, enabled) {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE test_suites
        SET enabled = ?, updated_at = ?
        WHERE suite_type = 'custom' AND agent_id = ?
      `;

      this.db.run(
        query,
        [enabled ? 1 : 0, new Date().toISOString(), agentId],
        function(err) {
          if (err) {
            reject(err);
          } else {
            console.log(`✓ Bulk ${enabled ? 'enabled' : 'disabled'} ${this.changes} custom suites for agent ${agentId}`);
            resolve(this.changes);
          }
        }
      );
    });
  }
}

module.exports = TestSuiteService;
