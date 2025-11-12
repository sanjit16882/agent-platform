/**
 * Test Script for Task 4: Test Suite Service
 * 
 * This script verifies that all sub-tasks of Task 4 are working correctly:
 * - 4.1: TestSuiteService class with CRUD operations
 * - 4.2: Test case parser (YAML/JSON)
 * - 4.3: Universal test suite loader
 * - 4.4: Custom test suite CRUD operations
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const TestSuiteService = require('./services/testSuiteService');
const TestCaseParser = require('./services/testCaseParser');
const UniversalTestLoader = require('./services/universalTestLoader');

// Initialize database
const dbPath = path.join(__dirname, 'data', 'test-task-4.db');
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
      // Create agents table (required for foreign key)
      db.run(`
        CREATE TABLE IF NOT EXISTS agents (
          agent_id VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT
        )
      `, (err) => {
        if (err) return reject(err);
      });

      // Create test_suites table
      db.run(`
        CREATE TABLE IF NOT EXISTS test_suites (
          id VARCHAR(255) PRIMARY KEY,
          suite_type VARCHAR(50) NOT NULL CHECK (suite_type IN ('universal', 'custom')),
          name VARCHAR(255) NOT NULL,
          description TEXT,
          agent_id VARCHAR(255),
          enabled BOOLEAN DEFAULT true,
          test_definitions TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_by VARCHAR(255),
          FOREIGN KEY (agent_id) REFERENCES agents(agent_id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) return reject(err);
      });

      // Create test_runs table (for stats)
      db.run(`
        CREATE TABLE IF NOT EXISTS test_runs (
          id VARCHAR(255) PRIMARY KEY,
          agent_id VARCHAR(255) NOT NULL,
          suite_id VARCHAR(255),
          status VARCHAR(50),
          start_time TIMESTAMP,
          end_time TIMESTAMP,
          summary TEXT,
          FOREIGN KEY (agent_id) REFERENCES agents(agent_id) ON DELETE CASCADE,
          FOREIGN KEY (suite_id) REFERENCES test_suites(id) ON DELETE SET NULL
        )
      `, (err) => {
        if (err) return reject(err);
      });

      // Create test_results table (for stats)
      db.run(`
        CREATE TABLE IF NOT EXISTS test_results (
          id VARCHAR(255) PRIMARY KEY,
          run_id VARCHAR(255) NOT NULL,
          test_case_id VARCHAR(255),
          test_case_name VARCHAR(255),
          status VARCHAR(50),
          duration INT,
          evaluation TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (run_id) REFERENCES test_runs(id) ON DELETE CASCADE
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

async function runTests() {
  console.log('\n=== Testing Task 4: Test Suite Service ===\n');

  try {
    // Setup database
    await setupDatabase();
    console.log('✓ Database setup complete\n');

    const testSuiteService = new TestSuiteService(db);
    const testCaseParser = new TestCaseParser();
    const universalTestLoader = new UniversalTestLoader(testSuiteService);

    // ========================================================================
    // Task 4.1: TestSuiteService class
    // ========================================================================
    console.log('--- Task 4.1: TestSuiteService CRUD Operations ---\n');

    // Test: Create universal suite
    try {
      const universalSuite = await testSuiteService.createSuite({
        suite_type: 'universal',
        name: 'Test Universal Suite',
        description: 'A test universal suite',
        tests: [
          {
            id: 'test-001',
            name: 'Test Case 1',
            input: { type: 'text', content: 'Hello' },
            expected_output: { not_empty: true }
          }
        ]
      });
      logTest('Create universal suite', universalSuite && universalSuite.id);
    } catch (error) {
      logTest('Create universal suite', false, error);
    }

    // Test: Create custom suite
    try {
      const customSuite = await testSuiteService.createSuite({
        suite_type: 'custom',
        name: 'Test Custom Suite',
        description: 'A test custom suite',
        agent_id: 'test-agent-1',
        tests: [
          {
            id: 'test-002',
            name: 'Test Case 2',
            input: { type: 'text', content: 'World' },
            expected_output: { not_empty: true }
          }
        ]
      });
      logTest('Create custom suite', customSuite && customSuite.id);
    } catch (error) {
      logTest('Create custom suite', false, error);
    }

    // Test: Get all suites
    try {
      const allSuites = await testSuiteService.getAllSuites();
      logTest('Get all suites', allSuites.length >= 2);
    } catch (error) {
      logTest('Get all suites', false, error);
    }

    // Test: Get suite by ID
    try {
      const suites = await testSuiteService.getAllSuites();
      const suite = await testSuiteService.getSuiteById(suites[0].id);
      logTest('Get suite by ID', suite && suite.id === suites[0].id);
    } catch (error) {
      logTest('Get suite by ID', false, error);
    }

    // Test: Update suite
    try {
      const suites = await testSuiteService.getAllSuites();
      const updated = await testSuiteService.updateSuite(suites[0].id, {
        description: 'Updated description'
      });
      logTest('Update suite', updated.description === 'Updated description');
    } catch (error) {
      logTest('Update suite', false, error);
    }

    // Test: Prevent deleting universal suite
    try {
      const universalSuites = await testSuiteService.getAllSuites({ suite_type: 'universal' });
      await testSuiteService.deleteSuite(universalSuites[0].id);
      logTest('Prevent deleting universal suite', false);
    } catch (error) {
      logTest('Prevent deleting universal suite', error.message.includes('Cannot delete universal'));
    }

    // Test: Delete custom suite
    try {
      const customSuites = await testSuiteService.getAllSuites({ suite_type: 'custom' });
      const deleted = await testSuiteService.deleteSuite(customSuites[0].id);
      logTest('Delete custom suite', deleted === true);
    } catch (error) {
      logTest('Delete custom suite', false, error);
    }

    // Test: Validation - suite_type required
    try {
      await testSuiteService.createSuite({
        name: 'Invalid Suite'
      });
      logTest('Validation: suite_type required', false);
    } catch (error) {
      logTest('Validation: suite_type required', error.message.includes('suite_type is required'));
    }

    // Test: Validation - universal suite cannot have agent_id
    try {
      await testSuiteService.createSuite({
        suite_type: 'universal',
        name: 'Invalid Universal Suite',
        agent_id: 'test-agent-1'
      });
      logTest('Validation: universal suite cannot have agent_id', false);
    } catch (error) {
      logTest('Validation: universal suite cannot have agent_id', 
        error.message.includes('Universal test suites cannot be associated'));
    }

    // Test: Validation - custom suite must have agent_id
    try {
      await testSuiteService.createSuite({
        suite_type: 'custom',
        name: 'Invalid Custom Suite'
      });
      logTest('Validation: custom suite must have agent_id', false);
    } catch (error) {
      logTest('Validation: custom suite must have agent_id', 
        error.message.includes('Custom test suites must be associated'));
    }

    // ========================================================================
    // Task 4.2: Test Case Parser
    // ========================================================================
    console.log('\n--- Task 4.2: Test Case Parser ---\n');

    // Test: Parse YAML content
    try {
      const yamlContent = `
version: "1.0"
description: "Test Suite"
tests:
  - name: "Test 1"
    id: "test-001"
    input:
      type: "text"
      content: "Hello"
    expected_output:
      not_empty: true
`;
      const parsed = testCaseParser.parseYAML(yamlContent);
      logTest('Parse YAML content', parsed.tests.length === 1);
    } catch (error) {
      logTest('Parse YAML content', false, error);
    }

    // Test: Parse JSON content
    try {
      const jsonContent = JSON.stringify({
        version: '1.0',
        description: 'Test Suite',
        tests: [
          {
            name: 'Test 1',
            id: 'test-001',
            input: { type: 'text', content: 'Hello' },
            expected_output: { not_empty: true }
          }
        ]
      });
      const parsed = testCaseParser.parseJSON(jsonContent);
      logTest('Parse JSON content', parsed.tests.length === 1);
    } catch (error) {
      logTest('Parse JSON content', false, error);
    }

    // Test: Validate test case schema
    try {
      const suite = {
        version: '1.0',
        tests: [
          {
            name: 'Test 1',
            id: 'test-001',
            input: { type: 'text', content: 'Hello' }
          }
        ]
      };
      const validation = testCaseParser.validateSchema(suite);
      logTest('Validate test case schema', validation.valid === true);
    } catch (error) {
      logTest('Validate test case schema', false, error);
    }

    // Test: Return structured TestCase objects
    try {
      const testCase = testCaseParser.validateTestCase({
        name: 'Test Case',
        id: 'test-001',
        input: 'Simple input',
        expected_output: { not_empty: true }
      }, 0);
      logTest('Return structured TestCase objects', 
        testCase.input.type === 'text' && testCase.input.content === 'Simple input');
    } catch (error) {
      logTest('Return structured TestCase objects', false, error);
    }

    // ========================================================================
    // Task 4.3: Universal Test Suite Loader
    // ========================================================================
    console.log('\n--- Task 4.3: Universal Test Suite Loader ---\n');

    // Test: Load universal test suites
    try {
      const loaded = await universalTestLoader.loadAll();
      logTest('Load universal test suites', loaded >= 0);
    } catch (error) {
      logTest('Load universal test suites', false, error);
    }

    // Test: Auto-register universal suites
    try {
      const universalSuites = await testSuiteService.getAllSuites({ suite_type: 'universal' });
      logTest('Auto-register universal suites', universalSuites.length > 0);
    } catch (error) {
      logTest('Auto-register universal suites', false, error);
    }

    // Test: Support suite enable/disable
    try {
      const universalSuites = await testSuiteService.getAllSuites({ suite_type: 'universal' });
      if (universalSuites.length > 0) {
        await testSuiteService.setSuiteEnabled(universalSuites[0].id, false);
        const disabled = await testSuiteService.getSuiteById(universalSuites[0].id);
        logTest('Support suite enable/disable', disabled.enabled === false);
      } else {
        logTest('Support suite enable/disable', false, new Error('No universal suites found'));
      }
    } catch (error) {
      logTest('Support suite enable/disable', false, error);
    }

    // ========================================================================
    // Task 4.4: Custom Test Suite CRUD Operations
    // ========================================================================
    console.log('\n--- Task 4.4: Custom Test Suite CRUD Operations ---\n');

    // Test: Create custom suite with agent association
    try {
      const customSuite = await testSuiteService.createCustomSuite('test-agent-1', {
        name: 'Agent-Specific Suite',
        description: 'Custom suite for test agent',
        tests: [
          {
            id: 'custom-001',
            name: 'Custom Test',
            input: { type: 'text', content: 'Test' },
            expected_output: { not_empty: true }
          }
        ]
      });
      logTest('Create custom suite with agent association', 
        customSuite.agent_id === 'test-agent-1');
    } catch (error) {
      logTest('Create custom suite with agent association', false, error);
    }

    // Test: Update custom suite tests
    try {
      const customSuites = await testSuiteService.getAllSuites({ 
        suite_type: 'custom',
        agent_id: 'test-agent-1'
      });
      if (customSuites.length > 0) {
        const updated = await testSuiteService.updateCustomSuiteTests(
          customSuites[0].id,
          [
            {
              id: 'updated-001',
              name: 'Updated Test',
              input: { type: 'text', content: 'Updated' },
              expected_output: { not_empty: true }
            }
          ]
        );
        logTest('Update custom suite tests', updated.tests[0].id === 'updated-001');
      } else {
        logTest('Update custom suite tests', false, new Error('No custom suites found'));
      }
    } catch (error) {
      logTest('Update custom suite tests', false, error);
    }

    // Test: List custom suites by agent
    try {
      const customSuites = await testSuiteService.listCustomSuitesByAgent('test-agent-1');
      logTest('List custom suites by agent', customSuites.length > 0);
    } catch (error) {
      logTest('List custom suites by agent', false, error);
    }

    // Test: Delete custom suite (agent-specific only)
    try {
      const customSuites = await testSuiteService.listCustomSuitesByAgent('test-agent-1');
      if (customSuites.length > 0) {
        const deleted = await testSuiteService.deleteCustomSuite(
          customSuites[0].id,
          'test-agent-1'
        );
        logTest('Delete custom suite (agent-specific only)', deleted === true);
      } else {
        logTest('Delete custom suite (agent-specific only)', false, new Error('No custom suites found'));
      }
    } catch (error) {
      logTest('Delete custom suite (agent-specific only)', false, error);
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

    console.log('\n✓ Task 4 verification complete!\n');

  } catch (error) {
    console.error('Test execution failed:', error);
  } finally {
    db.close();
  }
}

// Run tests
runTests().catch(console.error);
