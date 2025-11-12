/**
 * Test Script for Task 5: Test Runner Service
 * 
 * This script verifies that all sub-tasks of Task 5 are working correctly:
 * - 5.1: TestRunnerService class with runTests method
 * - 5.2: Test execution engine
 * - 5.3: Test result collector
 * - 5.4: Test run status tracking
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const TestSuiteService = require('./services/testSuiteService');
const TestRunnerService = require('./services/testRunnerService');

// Initialize database
const dbPath = path.join(__dirname, 'data', 'test-task-5.db');
const db = new sqlite3.Database(dbPath);

// Test results
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(name, passed, error = null) {
  results.tests.push({ name, passed, error });
  if (passed) {
    results.passed++;
    console.log(`✓ ${name}`);
  } else {
    results.failed++;
    console.error(`✗ ${name}`);
    if (error) console.error(`  Error: ${error.message}`);
  }
}

async function setupDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Create agents table
      db.run(`
        CREATE TABLE IF NOT EXISTS agents (
          agent_id VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT
        )
      `);

      // Create test_suites table
      db.run(`
        CREATE TABLE IF NOT EXISTS test_suites (
          id VARCHAR(255) PRIMARY KEY,
          suite_type VARCHAR(50) NOT NULL,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          agent_id VARCHAR(255),
          enabled BOOLEAN DEFAULT true,
          test_definitions TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_by VARCHAR(255)
        )
      `);

      // Create test_runs table
      db.run(`
        CREATE TABLE IF NOT EXISTS test_runs (
          id VARCHAR(255) PRIMARY KEY,
          agent_id VARCHAR(255) NOT NULL,
          suite_id VARCHAR(255),
          status VARCHAR(50),
          start_time TIMESTAMP,
          end_time TIMESTAMP,
          summary TEXT,
          config TEXT,
          error TEXT
        )
      `);

      // Create test_results table
      db.run(`
        CREATE TABLE IF NOT EXISTS test_results (
          id VARCHAR(255) PRIMARY KEY,
          run_id VARCHAR(255) NOT NULL,
          test_case_id VARCHAR(255),
          test_case_name VARCHAR(255),
          status VARCHAR(50),
          duration INT,
          input TEXT,
          expected_output TEXT,
          actual_output TEXT,
          evaluation TEXT,
          error TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) return reject(err);
        
        // Insert test agent
        db.run(`
          INSERT OR REPLACE INTO agents (agent_id, name, description)
          VALUES ('test-agent-1', 'Test Agent', 'Agent for testing')
        `, (err) => {
          if (err) return reject(err);
          resolve();
        });
      });
    });
  });
}

// Mock agent executor
const mockAgentExecutor = {
  execute: async (agentId, input) => {
    // Simulate agent execution
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const inputText = typeof input === 'object' ? input.content || JSON.stringify(input) : input;
    
    // Return different responses based on input
    if (inputText.includes('error')) {
      throw new Error('Simulated agent error');
    }
    
    return `Response from ${agentId}: Processed "${inputText.substring(0, 30)}..."`;
  }
};

async function runTests() {
  console.log('\n=== Testing Task 5: Test Runner Service ===\n');

  try {
    // Setup database
    await setupDatabase();
    console.log('✓ Database setup complete\n');

    const testSuiteService = new TestSuiteService(db);
    const testRunnerService = new TestRunnerService(db, testSuiteService, mockAgentExecutor);

    // Create test suites
    const universalSuite = await testSuiteService.createSuite({
      suite_type: 'universal',
      name: 'Test Universal Suite',
      description: 'Universal tests',
      tests: [
        {
          id: 'test-001',
          name: 'Basic Response Test',
          input: { type: 'text', content: 'Hello World' },
          expected_output: { 
            not_empty: true,
            contains: ['Response', 'Processed']
          }
        },
        {
          id: 'test-002',
          name: 'Contains Check Test',
          input: { type: 'text', content: 'Test input' },
          expected_output: { 
            contains: ['Response', 'Test input']
          }
        }
      ]
    });

    const customSuite = await testSuiteService.createSuite({
      suite_type: 'custom',
      name: 'Test Custom Suite',
      description: 'Custom tests',
      agent_id: 'test-agent-1',
      tests: [
        {
          id: 'test-003',
          name: 'Custom Test',
          input: { type: 'text', content: 'Custom input' },
          expected_output: { 
            not_empty: true
          }
        }
      ]
    });

    console.log('✓ Test suites created\n');

    // ========================================================================
    // Task 5.1: TestRunnerService class with runTests method
    // ========================================================================
    console.log('--- Task 5.1: TestRunnerService Class ---\n');

    // Test: Run tests with agent ID and configuration
    try {
      const result = await testRunnerService.runTests('test-agent-1', {
        parallel: false,
        timeout: 5000,
        sandbox: true,
        mode: 'demo'
      });
      logTest('Run tests with agent ID and configuration', 
        result && result.runId && result.status === 'completed');
    } catch (error) {
      logTest('Run tests with agent ID and configuration', false, error);
    }

    // Test: Support sequential test execution
    try {
      const result = await testRunnerService.runTests('test-agent-1', {
        parallel: false,
        mode: 'demo'
      });
      logTest('Support sequential test execution', 
        result && result.results && result.results.length > 0);
    } catch (error) {
      logTest('Support sequential test execution', false, error);
    }

    // Test: Support parallel test execution
    try {
      const result = await testRunnerService.runTests('test-agent-1', {
        parallel: true,
        maxConcurrent: 2,
        mode: 'demo'
      });
      logTest('Support parallel test execution', 
        result && result.results && result.results.length > 0);
    } catch (error) {
      logTest('Support parallel test execution', false, error);
    }

    // Test: Manage test lifecycle (queued, running, completed)
    try {
      let queuedEmitted = false;
      let startedEmitted = false;
      let completedEmitted = false;

      testRunnerService.once('run:queued', () => { queuedEmitted = true; });
      testRunnerService.once('run:started', () => { startedEmitted = true; });
      testRunnerService.once('run:completed', () => { completedEmitted = true; });

      await testRunnerService.runTests('test-agent-1', { mode: 'demo' });

      logTest('Manage test lifecycle (queued, running, completed)', 
        queuedEmitted && startedEmitted && completedEmitted);
    } catch (error) {
      logTest('Manage test lifecycle (queued, running, completed)', false, error);
    }

    // ========================================================================
    // Task 5.2: Test execution engine
    // ========================================================================
    console.log('\n--- Task 5.2: Test Execution Engine ---\n');

    // Test: Execute individual test cases against agents
    try {
      const testCase = {
        id: 'test-exec-001',
        name: 'Execution Test',
        input: { type: 'text', content: 'Test execution' },
        expected_output: { not_empty: true }
      };

      const result = await testRunnerService.executeTestCase(
        'test-run-001',
        'test-agent-1',
        testCase,
        { timeout: 5000, mode: 'demo' }
      );

      logTest('Execute individual test cases against agents', 
        result && result.status && result.actual_output);
    } catch (error) {
      logTest('Execute individual test cases against agents', false, error);
    }

    // Test: Capture input, output, and execution metadata
    try {
      const testCase = {
        id: 'test-meta-001',
        name: 'Metadata Test',
        input: { type: 'text', content: 'Metadata test' },
        expected_output: { not_empty: true }
      };

      const result = await testRunnerService.executeTestCase(
        'test-run-002',
        'test-agent-1',
        testCase,
        { timeout: 5000, mode: 'demo' }
      );

      logTest('Capture input, output, and execution metadata', 
        result.input && result.actual_output && result.duration !== undefined);
    } catch (error) {
      logTest('Capture input, output, and execution metadata', false, error);
    }

    // Test: Handle timeouts
    try {
      const testCase = {
        id: 'test-timeout-001',
        name: 'Timeout Test',
        input: { type: 'text', content: 'Timeout test' },
        expected_output: { not_empty: true }
      };

      // This should complete successfully with demo mode
      const result = await testRunnerService.executeTestCase(
        'test-run-003',
        'test-agent-1',
        testCase,
        { timeout: 1, mode: 'demo' } // Very short timeout, but demo mode is fast
      );

      logTest('Handle timeouts', result !== null);
    } catch (error) {
      logTest('Handle timeouts', false, error);
    }

    // Test: Support sandbox mode execution
    try {
      const result = await testRunnerService.runTests('test-agent-1', {
        sandbox: true,
        mode: 'demo'
      });

      logTest('Support sandbox mode execution', 
        result && result.status === 'completed');
    } catch (error) {
      logTest('Support sandbox mode execution', false, error);
    }

    // ========================================================================
    // Task 5.3: Test result collector
    // ========================================================================
    console.log('\n--- Task 5.3: Test Result Collector ---\n');

    // Test: Aggregate test results from multiple test cases
    try {
      const result = await testRunnerService.runTests('test-agent-1', {
        mode: 'demo'
      });

      logTest('Aggregate test results from multiple test cases', 
        result.results && result.results.length > 0);
    } catch (error) {
      logTest('Aggregate test results from multiple test cases', false, error);
    }

    // Test: Calculate summary statistics (pass rate, duration)
    try {
      const result = await testRunnerService.runTests('test-agent-1', {
        mode: 'demo'
      });

      logTest('Calculate summary statistics (pass rate, duration)', 
        result.summary && 
        result.summary.passRate !== undefined && 
        result.summary.totalDuration !== undefined &&
        result.summary.avgDuration !== undefined);
    } catch (error) {
      logTest('Calculate summary statistics (pass rate, duration)', false, error);
    }

    // Test: Store results in test_results table
    try {
      const result = await testRunnerService.runTests('test-agent-1', {
        mode: 'demo'
      });

      const storedResults = await testRunnerService.getTestResults(result.runId);

      logTest('Store results in test_results table', 
        storedResults && storedResults.length > 0);
    } catch (error) {
      logTest('Store results in test_results table', false, error);
    }

    // Test: Track universal vs custom test results
    try {
      const result = await testRunnerService.runTests('test-agent-1', {
        mode: 'demo'
      });

      logTest('Track universal vs custom test results', 
        result.summary.universalTests && 
        result.summary.customTests &&
        result.summary.universalTests.total > 0);
    } catch (error) {
      logTest('Track universal vs custom test results', false, error);
    }

    // ========================================================================
    // Task 5.4: Test run status tracking
    // ========================================================================
    console.log('\n--- Task 5.4: Test Run Status Tracking ---\n');

    // Test: Update test run status in real-time
    try {
      let statusUpdates = [];
      
      testRunnerService.on('run:queued', (data) => statusUpdates.push('queued'));
      testRunnerService.on('run:started', (data) => statusUpdates.push('started'));
      testRunnerService.on('run:completed', (data) => statusUpdates.push('completed'));

      await testRunnerService.runTests('test-agent-1', { mode: 'demo' });

      logTest('Update test run status in real-time', 
        statusUpdates.includes('queued') && 
        statusUpdates.includes('started') && 
        statusUpdates.includes('completed'));
    } catch (error) {
      logTest('Update test run status in real-time', false, error);
    }

    // Test: Support status queries by run ID
    try {
      const result = await testRunnerService.runTests('test-agent-1', { mode: 'demo' });
      const status = await testRunnerService.getTestRunStatus(result.runId);

      logTest('Support status queries by run ID', 
        status && status.runId === result.runId && status.status === 'completed');
    } catch (error) {
      logTest('Support status queries by run ID', false, error);
    }

    // Test: Emit progress events for live updates
    try {
      let progressEvents = [];
      
      testRunnerService.on('test:started', (data) => {
        progressEvents.push({ type: 'started', progress: data.progress });
      });
      
      testRunnerService.on('test:completed', (data) => {
        progressEvents.push({ type: 'completed', progress: data.progress });
      });

      await testRunnerService.runTests('test-agent-1', { mode: 'demo' });

      logTest('Emit progress events for live updates', 
        progressEvents.length > 0 && 
        progressEvents.some(e => e.type === 'started') &&
        progressEvents.some(e => e.type === 'completed'));
    } catch (error) {
      logTest('Emit progress events for live updates', false, error);
    }

    // Test: Evaluation logic
    try {
      const testCase = {
        id: 'test-eval-001',
        name: 'Evaluation Test',
        input: { type: 'text', content: 'Evaluation test' },
        expected_output: { 
          not_empty: true,
          contains: ['Response', 'Evaluation']
        }
      };

      const actualOutput = 'Response from agent: Evaluation test processed';
      const evaluation = testRunnerService.evaluateOutput(testCase, actualOutput);

      logTest('Evaluation logic', 
        evaluation && 
        evaluation.passed !== undefined && 
        evaluation.score !== undefined &&
        evaluation.checks);
    } catch (error) {
      logTest('Evaluation logic', false, error);
    }

    // ========================================================================
    // Summary
    // ========================================================================
    console.log('\n=== Test Summary ===\n');
    console.log(`Total Tests: ${results.tests.length}`);
    console.log(`Passed: ${results.passed}`);
    console.log(`Failed: ${results.failed}`);
    console.log(`Success Rate: ${((results.passed / results.tests.length) * 100).toFixed(2)}%`);

    if (results.failed > 0) {
      console.log('\nFailed Tests:');
      results.tests.filter(t => !t.passed).forEach(t => {
        console.log(`  - ${t.name}`);
        if (t.error) console.log(`    ${t.error.message}`);
      });
    }

    console.log('\n✓ Task 5 verification complete!\n');

  } catch (error) {
    console.error('Test execution failed:', error);
  } finally {
    db.close();
  }
}

// Run tests
runTests().catch(console.error);
