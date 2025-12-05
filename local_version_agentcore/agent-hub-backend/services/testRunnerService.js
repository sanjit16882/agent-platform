/**
 * Test Runner Service
 * 
 * Core test execution orchestration for the Agent Testing Framework
 * Manages test lifecycle, execution, and result collection
 */

const { v4: uuidv4 } = require('uuid');
const EventEmitter = require('events');

class TestRunnerService extends EventEmitter {
  constructor(db, testSuiteService, agentExecutor) {
    super();
    this.db = db;
    this.testSuiteService = testSuiteService;
    this.agentExecutor = agentExecutor;
    this.activeRuns = new Map(); // Track active test runs
  }

  /**
   * Run tests for an agent
   * @param {string} agentId - Agent ID
   * @param {object} config - Test configuration
   * @returns {Promise<object>} - Test run result
   */
  async runTests(agentId, config = {}) {
    const {
      suiteIds = null,
      testCaseIds = null,
      parallel = false,
      timeout = 30000,
      retries = 0,
      sandbox = true,
      mode = 'demo'
    } = config;

    // Create test run record
    const runId = uuidv4();
    const startTime = new Date().toISOString();

    try {
      // Initialize test run
      await this.createTestRun(runId, agentId, {
        status: 'queued',
        start_time: startTime,
        config: config
      });

      this.activeRuns.set(runId, { status: 'queued', agentId });
      this.emit('run:queued', { runId, agentId });

      // Update status to running
      await this.updateTestRunStatus(runId, 'running');
      this.activeRuns.get(runId).status = 'running';
      this.emit('run:started', { runId, agentId });

      // Load test suites
      const testSuites = await this.loadTestSuites(agentId, suiteIds);
      
      if (testSuites.length === 0) {
        throw new Error(`No test suites found for agent: ${agentId}`);
      }

      // Collect all test cases
      const testCases = this.collectTestCases(testSuites, testCaseIds);
      
      console.log(`✓ Running ${testCases.length} tests for agent ${agentId}`);

      // Execute tests
      const results = parallel
        ? await this.executeTestsParallel(runId, agentId, testCases, { timeout, retries, sandbox, mode })
        : await this.executeTestsSequential(runId, agentId, testCases, { timeout, retries, sandbox, mode });

      // Calculate summary
      const summary = this.calculateSummary(results, testSuites);

      // Update test run with results
      const endTime = new Date().toISOString();
      await this.updateTestRun(runId, {
        status: 'completed',
        end_time: endTime,
        summary: summary
      });

      this.activeRuns.delete(runId);
      this.emit('run:completed', { runId, agentId, summary });

      console.log(`✓ Test run completed: ${runId} (${summary.passRate.toFixed(1)}% pass rate)`);

      return {
        runId,
        agentId,
        status: 'completed',
        startTime,
        endTime,
        summary,
        results
      };

    } catch (error) {
      console.error(`✗ Test run failed: ${runId}`, error);
      
      await this.updateTestRun(runId, {
        status: 'failed',
        end_time: new Date().toISOString(),
        error: error.message
      });

      this.activeRuns.delete(runId);
      this.emit('run:failed', { runId, agentId, error: error.message });

      throw error;
    }
  }

  /**
   * Execute tests sequentially
   * @param {string} runId - Test run ID
   * @param {string} agentId - Agent ID
   * @param {Array} testCases - Test cases to execute
   * @param {object} options - Execution options
   * @returns {Promise<Array>} - Test results
   */
  async executeTestsSequential(runId, agentId, testCases, options) {
    const results = [];

    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      
      this.emit('test:started', { 
        runId, 
        testCaseId: testCase.id, 
        progress: { current: i + 1, total: testCases.length }
      });

      const result = await this.executeTestCase(runId, agentId, testCase, options);
      results.push(result);

      this.emit('test:completed', { 
        runId, 
        testCaseId: testCase.id, 
        result,
        progress: { current: i + 1, total: testCases.length }
      });
    }

    return results;
  }

  /**
   * Execute tests in parallel
   * @param {string} runId - Test run ID
   * @param {string} agentId - Agent ID
   * @param {Array} testCases - Test cases to execute
   * @param {object} options - Execution options
   * @returns {Promise<Array>} - Test results
   */
  async executeTestsParallel(runId, agentId, testCases, options) {
    const maxConcurrent = options.maxConcurrent || 5;
    const results = [];
    const executing = [];

    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      
      const promise = this.executeTestCase(runId, agentId, testCase, options)
        .then(result => {
          results.push(result);
          this.emit('test:completed', { 
            runId, 
            testCaseId: testCase.id, 
            result,
            progress: { current: results.length, total: testCases.length }
          });
          return result;
        });

      executing.push(promise);

      // Limit concurrent executions
      if (executing.length >= maxConcurrent) {
        await Promise.race(executing);
        executing.splice(executing.findIndex(p => p === promise), 1);
      }
    }

    // Wait for remaining tests
    await Promise.all(executing);

    return results;
  }

  /**
   * Execute a single test case
   * @param {string} runId - Test run ID
   * @param {string} agentId - Agent ID
   * @param {object} testCase - Test case definition
   * @param {object} options - Execution options
   * @returns {Promise<object>} - Test result
   */
  async executeTestCase(runId, agentId, testCase, options) {
    const startTime = Date.now();
    const resultId = uuidv4();

    try {
      // Execute agent with test input
      const actualOutput = await this.executeAgent(agentId, testCase.input, options);

      // Evaluate result
      const evaluation = this.evaluateOutput(testCase, actualOutput);

      const duration = Date.now() - startTime;
      const status = evaluation.passed ? 'passed' : 'failed';

      // Store result in database
      const result = {
        id: resultId,
        run_id: runId,
        test_case_id: testCase.id,
        test_case_name: testCase.name,
        status: status,
        duration: duration,
        input: testCase.input,
        expected_output: testCase.expected_output,
        actual_output: actualOutput,
        evaluation: evaluation,
        suite_type: testCase.suite_type, // Preserve suite type for tracking
        suite_id: testCase.suite_id,
        suite_name: testCase.suite_name,
        created_at: new Date().toISOString()
      };

      await this.storeTestResult(result);

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;

      const result = {
        id: resultId,
        run_id: runId,
        test_case_id: testCase.id,
        test_case_name: testCase.name,
        status: 'error',
        duration: duration,
        input: testCase.input,
        expected_output: testCase.expected_output,
        actual_output: null,
        evaluation: { passed: false, error: error.message },
        suite_type: testCase.suite_type, // Preserve suite type for tracking
        suite_id: testCase.suite_id,
        suite_name: testCase.suite_name,
        error: {
          message: error.message,
          stack: error.stack
        },
        created_at: new Date().toISOString()
      };

      await this.storeTestResult(result);

      return result;
    }
  }

  /**
   * Execute agent with input
   * @param {string} agentId - Agent ID
   * @param {object} input - Test input
   * @param {object} options - Execution options
   * @returns {Promise<any>} - Agent output
   */
  async executeAgent(agentId, input, options) {
    const { timeout, sandbox, mode } = options;

    // In demo mode, return mock response
    if (mode === 'demo') {
      return this.getMockAgentResponse(agentId, input);
    }

    // In sandbox mode, use mock endpoints
    if (sandbox) {
      // TODO: Configure mock interceptor
    }

    // Execute agent with timeout
    return Promise.race([
      this.agentExecutor.execute(agentId, input),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Test execution timeout')), timeout)
      )
    ]);
  }

  /**
   * Get mock agent response for demo mode
   * @param {string} agentId - Agent ID
   * @param {object} input - Test input
   * @returns {string} - Mock response
   */
  getMockAgentResponse(agentId, input) {
    // Simple mock response for demo purposes
    const inputText = typeof input === 'object' ? input.content || JSON.stringify(input) : input;
    
    return `Mock response for agent ${agentId}. Input received: "${inputText.substring(0, 50)}..."`;
  }

  /**
   * Evaluate test output
   * @param {object} testCase - Test case definition
   * @param {any} actualOutput - Actual agent output
   * @returns {object} - Evaluation result
   */
  evaluateOutput(testCase, actualOutput) {
    const { expected_output, validation } = testCase;
    
    if (!expected_output) {
      return { passed: true, score: 100, details: 'No expected output defined' };
    }

    const evaluation = {
      passed: false,
      score: 0,
      details: '',
      checks: {}
    };

    // Check: not_empty
    if (expected_output.not_empty) {
      const notEmpty = actualOutput && actualOutput.toString().trim().length > 0;
      evaluation.checks.not_empty = notEmpty;
      if (!notEmpty) {
        evaluation.details += 'Output is empty. ';
      }
    }

    // Check: contains
    if (expected_output.contains && Array.isArray(expected_output.contains)) {
      const outputStr = actualOutput.toString().toLowerCase();
      const allContained = expected_output.contains.every(str => 
        outputStr.includes(str.toLowerCase())
      );
      evaluation.checks.contains = allContained;
      if (!allContained) {
        const missing = expected_output.contains.filter(str => 
          !outputStr.includes(str.toLowerCase())
        );
        evaluation.details += `Missing expected strings: ${missing.join(', ')}. `;
      }
    }

    // Check: not_contains
    if (expected_output.not_contains && Array.isArray(expected_output.not_contains)) {
      const outputStr = actualOutput.toString().toLowerCase();
      const noneContained = expected_output.not_contains.every(str => 
        !outputStr.includes(str.toLowerCase())
      );
      evaluation.checks.not_contains = noneContained;
      if (!noneContained) {
        const found = expected_output.not_contains.filter(str => 
          outputStr.includes(str.toLowerCase())
        );
        evaluation.details += `Found forbidden strings: ${found.join(', ')}. `;
      }
    }

    // Check: exact_match
    if (expected_output.exact_match) {
      const matches = actualOutput.toString().trim() === expected_output.exact_match.trim();
      evaluation.checks.exact_match = matches;
      if (!matches) {
        evaluation.details += 'Output does not match expected exactly. ';
      }
    }

    // Check: pattern (regex)
    if (expected_output.pattern) {
      try {
        const regex = new RegExp(expected_output.pattern);
        const matches = regex.test(actualOutput.toString());
        evaluation.checks.pattern = matches;
        if (!matches) {
          evaluation.details += `Output does not match pattern: ${expected_output.pattern}. `;
        }
      } catch (error) {
        evaluation.checks.pattern = false;
        evaluation.details += `Invalid regex pattern: ${error.message}. `;
      }
    }

    // Check: error_expected
    if (expected_output.error_expected) {
      // In this simple implementation, we check if output contains error indicators
      const hasError = actualOutput.toString().toLowerCase().includes('error');
      evaluation.checks.error_expected = hasError;
      if (!hasError) {
        evaluation.details += 'Expected error but none found. ';
      }
    }

    // Calculate pass/fail
    const checkValues = Object.values(evaluation.checks);
    const passedChecks = checkValues.filter(v => v === true).length;
    const totalChecks = checkValues.length;

    if (totalChecks > 0) {
      evaluation.score = (passedChecks / totalChecks) * 100;
      const tolerance = validation?.tolerance || 0.8;
      evaluation.passed = evaluation.score >= (tolerance * 100);
    } else {
      // No checks defined, consider passed
      evaluation.passed = true;
      evaluation.score = 100;
      evaluation.details = 'No validation checks defined';
    }

    if (evaluation.passed) {
      evaluation.details = `All checks passed (${passedChecks}/${totalChecks})`;
    }

    return evaluation;
  }

  /**
   * Load test suites for an agent
   * @param {string} agentId - Agent ID
   * @param {Array} suiteIds - Optional specific suite IDs
   * @returns {Promise<Array>} - Test suites
   */
  async loadTestSuites(agentId, suiteIds = null) {
    if (suiteIds && suiteIds.length > 0) {
      // Load specific suites
      const suites = [];
      for (const suiteId of suiteIds) {
        const suite = await this.testSuiteService.getSuiteById(suiteId);
        if (suite) {
          suites.push(suite);
        }
      }
      return suites;
    } else {
      // Load all suites for agent (universal + custom)
      return this.testSuiteService.getSuitesForAgent(agentId);
    }
  }

  /**
   * Collect test cases from suites
   * @param {Array} testSuites - Test suites
   * @param {Array} testCaseIds - Optional specific test case IDs
   * @returns {Array} - Test cases
   */
  collectTestCases(testSuites, testCaseIds = null) {
    const allTestCases = [];

    for (const suite of testSuites) {
      if (suite.tests && Array.isArray(suite.tests)) {
        for (const test of suite.tests) {
          // Add suite context to test
          const testWithContext = {
            ...test,
            suite_id: suite.id,
            suite_name: suite.name,
            suite_type: suite.suite_type
          };
          allTestCases.push(testWithContext);
        }
      }
    }

    // Filter by specific test case IDs if provided
    if (testCaseIds && testCaseIds.length > 0) {
      return allTestCases.filter(tc => testCaseIds.includes(tc.id));
    }

    return allTestCases;
  }

  /**
   * Calculate test summary
   * @param {Array} results - Test results
   * @param {Array} testSuites - Test suites
   * @returns {object} - Summary statistics
   */
  calculateSummary(results, testSuites) {
    const summary = {
      totalTests: results.length,
      passed: 0,
      failed: 0,
      errors: 0,
      skipped: 0,
      passRate: 0,
      totalDuration: 0,
      avgDuration: 0,
      universalTests: { total: 0, passed: 0, failed: 0, passRate: 0 },
      customTests: { total: 0, passed: 0, failed: 0, passRate: 0 }
    };

    results.forEach(result => {
      summary.totalDuration += result.duration || 0;

      if (result.status === 'passed') {
        summary.passed++;
      } else if (result.status === 'failed') {
        summary.failed++;
      } else if (result.status === 'error') {
        summary.errors++;
      } else if (result.status === 'skipped') {
        summary.skipped++;
      }

      // Track by suite type
      if (result.suite_type === 'universal') {
        summary.universalTests.total++;
        if (result.status === 'passed') {
          summary.universalTests.passed++;
        } else if (result.status === 'failed') {
          summary.universalTests.failed++;
        }
      } else if (result.suite_type === 'custom') {
        summary.customTests.total++;
        if (result.status === 'passed') {
          summary.customTests.passed++;
        } else if (result.status === 'failed') {
          summary.customTests.failed++;
        }
      }
    });

    summary.passRate = summary.totalTests > 0 
      ? (summary.passed / summary.totalTests) * 100 
      : 0;

    summary.avgDuration = summary.totalTests > 0 
      ? summary.totalDuration / summary.totalTests 
      : 0;

    summary.universalTests.passRate = summary.universalTests.total > 0
      ? (summary.universalTests.passed / summary.universalTests.total) * 100
      : 0;

    summary.customTests.passRate = summary.customTests.total > 0
      ? (summary.customTests.passed / summary.customTests.total) * 100
      : 0;

    return summary;
  }

  // ============================================================================
  // DATABASE OPERATIONS
  // ============================================================================

  /**
   * Create test run record
   * @param {string} runId - Run ID
   * @param {string} agentId - Agent ID
   * @param {object} data - Run data
   * @returns {Promise<void>}
   */
  async createTestRun(runId, agentId, data) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO test_runs (
          id, agent_id, suite_id, status, start_time, end_time, summary, config
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      this.db.run(
        query,
        [
          runId,
          agentId,
          data.suite_id || null,
          data.status,
          data.start_time,
          data.end_time || null,
          JSON.stringify(data.summary || {}),
          JSON.stringify(data.config || {})
        ],
        (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }

  /**
   * Update test run
   * @param {string} runId - Run ID
   * @param {object} updates - Fields to update
   * @returns {Promise<void>}
   */
  async updateTestRun(runId, updates) {
    const fields = [];
    const params = [];

    if (updates.status) {
      fields.push('status = ?');
      params.push(updates.status);
    }

    if (updates.end_time) {
      fields.push('end_time = ?');
      params.push(updates.end_time);
    }

    if (updates.summary) {
      fields.push('summary = ?');
      params.push(JSON.stringify(updates.summary));
    }

    if (updates.error) {
      fields.push('error = ?');
      params.push(updates.error);
    }

    if (fields.length === 0) {
      return;
    }

    params.push(runId);

    return new Promise((resolve, reject) => {
      const query = `UPDATE test_runs SET ${fields.join(', ')} WHERE id = ?`;
      
      this.db.run(query, params, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Update test run status
   * @param {string} runId - Run ID
   * @param {string} status - New status
   * @returns {Promise<void>}
   */
  async updateTestRunStatus(runId, status) {
    return this.updateTestRun(runId, { status });
  }

  /**
   * Store test result
   * @param {object} result - Test result
   * @returns {Promise<void>}
   */
  async storeTestResult(result) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO test_results (
          id, run_id, test_case_id, test_case_name, status, duration, 
          input, expected_output, actual_output, evaluation, error, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      this.db.run(
        query,
        [
          result.id,
          result.run_id,
          result.test_case_id,
          result.test_case_name,
          result.status,
          result.duration,
          JSON.stringify(result.input),
          JSON.stringify(result.expected_output),
          JSON.stringify(result.actual_output),
          JSON.stringify(result.evaluation),
          JSON.stringify(result.error || null),
          result.created_at
        ],
        (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }

  /**
   * Get test run by ID
   * @param {string} runId - Run ID
   * @returns {Promise<object|null>} - Test run
   */
  async getTestRun(runId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM test_runs WHERE id = ?',
        [runId],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            if (row) {
              row.summary = JSON.parse(row.summary || '{}');
              row.config = JSON.parse(row.config || '{}');
            }
            resolve(row);
          }
        }
      );
    });
  }

  /**
   * Get test results for a run
   * @param {string} runId - Run ID
   * @returns {Promise<Array>} - Test results
   */
  async getTestResults(runId) {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM test_results WHERE run_id = ? ORDER BY created_at',
        [runId],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            const results = rows.map(row => ({
              ...row,
              input: JSON.parse(row.input || '{}'),
              expected_output: JSON.parse(row.expected_output || '{}'),
              actual_output: JSON.parse(row.actual_output || 'null'),
              evaluation: JSON.parse(row.evaluation || '{}'),
              error: JSON.parse(row.error || 'null')
            }));
            resolve(results);
          }
        }
      );
    });
  }

  /**
   * Get test run status
   * @param {string} runId - Run ID
   * @returns {Promise<object>} - Status information
   */
  async getTestRunStatus(runId) {
    const run = await this.getTestRun(runId);
    
    if (!run) {
      return null;
    }

    const activeRun = this.activeRuns.get(runId);

    return {
      runId: run.id,
      agentId: run.agent_id,
      status: run.status,
      startTime: run.start_time,
      endTime: run.end_time,
      summary: run.summary,
      isActive: activeRun !== undefined
    };
  }
}

module.exports = TestRunnerService;
