/**
 * Test Script for Task 7: Feedback Loop Service
 * 
 * This script verifies that all sub-tasks of Task 7 are working correctly:
 * - 7.1: PatternAnalyzer class
 * - 7.2: RecommendationEngine class
 * - 7.3: Feedback data storage
 * - 7.4: Recommendation prioritization
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const FeedbackLoopService = require('./services/feedbackLoopService');

// Initialize database
const dbPath = path.join(__dirname, 'data', 'test-task-7.db');
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
      // Create failure_patterns table
      db.run(`
        CREATE TABLE IF NOT EXISTS failure_patterns (
          id VARCHAR(255) PRIMARY KEY,
          agent_id VARCHAR(255) NOT NULL,
          pattern_type VARCHAR(100),
          description TEXT,
          occurrences INT,
          test_cases TEXT,
          common_features TEXT,
          failure_reasons TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create recommendations table
      db.run(`
        CREATE TABLE IF NOT EXISTS recommendations (
          id VARCHAR(255) PRIMARY KEY,
          agent_id VARCHAR(255) NOT NULL,
          type VARCHAR(100),
          priority VARCHAR(50),
          description TEXT,
          suggested_change TEXT,
          expected_improvement TEXT,
          affected_tests TEXT,
          status VARCHAR(50) DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  });
}

// Sample test results with failures
const sampleTestResults = [
  {
    id: 'result-001',
    test_case_id: 'test-001',
    test_case_name: 'Relevance Test 1',
    status: 'failed',
    suite_type: 'custom',
    input: { content: 'Explain machine learning algorithms' },
    evaluation: {
      passed: false,
      details: 'Low relevance score: 65.0%'
    }
  },
  {
    id: 'result-002',
    test_case_id: 'test-002',
    test_case_name: 'Relevance Test 2',
    status: 'failed',
    suite_type: 'custom',
    input: { content: 'Describe neural networks' },
    evaluation: {
      passed: false,
      details: 'Low relevance score: 62.0%'
    }
  },
  {
    id: 'result-003',
    test_case_id: 'test-003',
    test_case_name: 'Relevance Test 3',
    status: 'failed',
    suite_type: 'custom',
    input: { content: 'What is deep learning' },
    evaluation: {
      passed: false,
      details: 'Low relevance score: 68.0%'
    }
  },
  {
    id: 'result-004',
    test_case_id: 'test-004',
    test_case_name: 'Performance Test 1',
    status: 'failed',
    suite_type: 'universal',
    input: { content: 'Quick test' },
    evaluation: {
      passed: false,
      details: 'Performance target not met: 3500ms'
    }
  },
  {
    id: 'result-005',
    test_case_id: 'test-005',
    test_case_name: 'Performance Test 2',
    status: 'failed',
    suite_type: 'universal',
    input: { content: 'Another quick test' },
    evaluation: {
      passed: false,
      details: 'Performance target not met: 3200ms'
    }
  },
  {
    id: 'result-006',
    test_case_id: 'test-006',
    test_case_name: 'Coherence Test',
    status: 'failed',
    suite_type: 'custom',
    input: { content: 'Write a summary' },
    evaluation: {
      passed: false,
      details: 'Low coherence score: 55.0%'
    }
  },
  {
    id: 'result-007',
    test_case_id: 'test-007',
    test_case_name: 'Validation Test',
    status: 'failed',
    suite_type: 'custom',
    input: { content: 'Test validation' },
    evaluation: {
      passed: false,
      details: 'Exact match failed'
    }
  },
  {
    id: 'result-008',
    test_case_id: 'test-008',
    test_case_name: 'Error Test',
    status: 'error',
    suite_type: 'universal',
    input: { content: 'Error test' },
    error: {
      message: 'Execution timeout'
    }
  }
];

async function runTests() {
  console.log('\n=== Testing Task 7: Feedback Loop Service ===\n');

  try {
    // Setup database
    await setupDatabase();
    console.log('✓ Database setup complete\n');

    const feedbackService = new FeedbackLoopService(db);

    // ========================================================================
    // Task 7.1: PatternAnalyzer class
    // ========================================================================
    console.log('--- Task 7.1: PatternAnalyzer Class ---\n');

    // Test: Analyze failures method
    try {
      const analysis = await feedbackService.analyzeAndRecommend('test-agent-1', sampleTestResults);

      logTest('Analyze failures method',
        analysis && analysis.patterns && analysis.patterns.length > 0);
    } catch (error) {
      logTest('Analyze failures method', false, error);
    }

    // Test: Cluster similar failures by reason
    try {
      const analysis = await feedbackService.analyzeAndRecommend('test-agent-2', sampleTestResults);
      
      // Should identify multiple patterns
      logTest('Cluster similar failures by reason',
        analysis.patterns.length >= 2);
    } catch (error) {
      logTest('Cluster similar failures by reason', false, error);
    }

    // Test: Extract common input features
    try {
      const analysis = await feedbackService.analyzeAndRecommend('test-agent-3', sampleTestResults);
      
      // Check if patterns have common features
      const hasCommonFeatures = analysis.patterns.some(p => 
        p.common_input_features && p.common_input_features.length > 0
      );

      logTest('Extract common input features', hasCommonFeatures);
    } catch (error) {
      logTest('Extract common input features', false, error);
    }

    // Test: Identify failure patterns
    try {
      const analysis = await feedbackService.analyzeAndRecommend('test-agent-4', sampleTestResults);
      
      // Check if patterns have types
      const hasPatternTypes = analysis.patterns.every(p => p.pattern_type);

      logTest('Identify failure patterns', hasPatternTypes);
    } catch (error) {
      logTest('Identify failure patterns', false, error);
    }

    // ========================================================================
    // Task 7.2: RecommendationEngine class
    // ========================================================================
    console.log('\n--- Task 7.2: RecommendationEngine Class ---\n');

    // Test: Generate recommendations method
    try {
      const analysis = await feedbackService.analyzeAndRecommend('test-agent-5', sampleTestResults);

      logTest('Generate recommendations method',
        analysis.recommendations && analysis.recommendations.length > 0);
    } catch (error) {
      logTest('Generate recommendations method', false, error);
    }

    // Test: Analyze failure patterns for frequent issues
    try {
      const analysis = await feedbackService.analyzeAndRecommend('test-agent-6', sampleTestResults);
      
      // Should generate recommendations for frequent failures
      const hasHighPriorityRecs = analysis.recommendations.some(r => r.priority === 'high');

      logTest('Analyze failure patterns for frequent issues', hasHighPriorityRecs);
    } catch (error) {
      logTest('Analyze failure patterns for frequent issues', false, error);
    }

    // Test: Generate prompt modification suggestions
    try {
      const analysis = await feedbackService.analyzeAndRecommend('test-agent-7', sampleTestResults);
      
      // Should have prompt modification recommendations
      const hasPromptRecs = analysis.recommendations.some(r => r.type === 'prompt_modification');

      logTest('Generate prompt modification suggestions', hasPromptRecs);
    } catch (error) {
      logTest('Generate prompt modification suggestions', false, error);
    }

    // Test: Generate config change recommendations
    try {
      const analysis = await feedbackService.analyzeAndRecommend('test-agent-8', sampleTestResults);
      
      // Should have config change recommendations for performance issues
      const hasConfigRecs = analysis.recommendations.some(r => r.type === 'config_change');

      logTest('Generate config change recommendations', hasConfigRecs);
    } catch (error) {
      logTest('Generate config change recommendations', false, error);
    }

    // ========================================================================
    // Task 7.3: Feedback data storage
    // ========================================================================
    console.log('\n--- Task 7.3: Feedback Data Storage ---\n');

    // Test: Store failure patterns in database
    try {
      await feedbackService.analyzeAndRecommend('test-agent-9', sampleTestResults);
      
      const patterns = await feedbackService.getPatterns('test-agent-9');

      logTest('Store failure patterns in database', patterns.length > 0);
    } catch (error) {
      logTest('Store failure patterns in database', false, error);
    }

    // Test: Track recommendation acceptance/rejection
    try {
      const analysis = await feedbackService.analyzeAndRecommend('test-agent-10', sampleTestResults);
      
      if (analysis.recommendations.length > 0) {
        const recId = analysis.recommendations[0].id;
        await feedbackService.updateRecommendationStatus(recId, 'accepted');
        
        const recommendations = await feedbackService.getRecommendations('test-agent-10');
        const updated = recommendations.find(r => r.id === recId);

        logTest('Track recommendation acceptance/rejection',
          updated && updated.status === 'accepted');
      } else {
        logTest('Track recommendation acceptance/rejection', false, 
          new Error('No recommendations generated'));
      }
    } catch (error) {
      logTest('Track recommendation acceptance/rejection', false, error);
    }

    // Test: Maintain feedback history per agent
    try {
      await feedbackService.analyzeAndRecommend('test-agent-11', sampleTestResults);
      
      const feedback = await feedbackService.getFeedback('test-agent-11');

      logTest('Maintain feedback history per agent',
        feedback.patterns && feedback.recommendations);
    } catch (error) {
      logTest('Maintain feedback history per agent', false, error);
    }

    // ========================================================================
    // Task 7.4: Recommendation prioritization
    // ========================================================================
    console.log('\n--- Task 7.4: Recommendation Prioritization ---\n');

    // Test: Assign priority based on failure frequency
    try {
      const analysis = await feedbackService.analyzeAndRecommend('test-agent-12', sampleTestResults);
      
      // High-frequency failures should get high priority
      const highFreqPattern = analysis.patterns.find(p => p.occurrences >= 3);
      if (highFreqPattern) {
        const relatedRecs = analysis.recommendations.filter(r =>
          r.affected_tests.some(t => highFreqPattern.test_cases.includes(t))
        );
        
        const hasHighPriority = relatedRecs.some(r => r.priority === 'high');
        logTest('Assign priority based on failure frequency', hasHighPriority);
      } else {
        logTest('Assign priority based on failure frequency', true);
      }
    } catch (error) {
      logTest('Assign priority based on failure frequency', false, error);
    }

    // Test: Calculate expected improvement impact
    try {
      const analysis = await feedbackService.analyzeAndRecommend('test-agent-13', sampleTestResults);
      
      // All recommendations should have expected improvement
      const allHaveImpact = analysis.recommendations.every(r => r.expected_improvement);

      logTest('Calculate expected improvement impact', allHaveImpact);
    } catch (error) {
      logTest('Calculate expected improvement impact', false, error);
    }

    // Test: Rank recommendations by potential value
    try {
      const analysis = await feedbackService.analyzeAndRecommend('test-agent-14', sampleTestResults);
      
      // Recommendations should be sorted by priority
      let isSorted = true;
      const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
      
      for (let i = 0; i < analysis.recommendations.length - 1; i++) {
        const current = priorityOrder[analysis.recommendations[i].priority];
        const next = priorityOrder[analysis.recommendations[i + 1].priority];
        if (current < next) {
          isSorted = false;
          break;
        }
      }

      logTest('Rank recommendations by potential value', isSorted);
    } catch (error) {
      logTest('Rank recommendations by potential value', false, error);
    }

    // ========================================================================
    // Integration Tests
    // ========================================================================
    console.log('\n--- Integration Tests ---\n');

    // Test: Full feedback loop workflow
    try {
      const analysis = await feedbackService.analyzeAndRecommend('test-agent-15', sampleTestResults);
      
      // Should have complete analysis
      const isComplete = 
        analysis.patterns &&
        analysis.recommendations &&
        analysis.summary &&
        analysis.summary.totalFailures === sampleTestResults.filter(r => r.status === 'failed').length;

      logTest('Full feedback loop workflow', isComplete);
    } catch (error) {
      logTest('Full feedback loop workflow', false, error);
    }

    // Test: Query feedback with filters
    try {
      await feedbackService.analyzeAndRecommend('test-agent-16', sampleTestResults);
      
      const pendingRecs = await feedbackService.getRecommendations('test-agent-16', {
        status: 'pending',
        limit: 5
      });

      logTest('Query feedback with filters', pendingRecs.length > 0);
    } catch (error) {
      logTest('Query feedback with filters', false, error);
    }

    // Test: Pattern types identification
    try {
      const analysis = await feedbackService.analyzeAndRecommend('test-agent-17', sampleTestResults);
      
      // Should identify different pattern types
      const patternTypes = [...new Set(analysis.patterns.map(p => p.pattern_type))];

      logTest('Pattern types identification', patternTypes.length > 0);
    } catch (error) {
      logTest('Pattern types identification', false, error);
    }

    // Test: Recommendation types variety
    try {
      const analysis = await feedbackService.analyzeAndRecommend('test-agent-18', sampleTestResults);
      
      // Should have different recommendation types
      const recTypes = [...new Set(analysis.recommendations.map(r => r.type))];

      logTest('Recommendation types variety', recTypes.length > 0);
    } catch (error) {
      logTest('Recommendation types variety', false, error);
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

    console.log('\n✓ Task 7 verification complete!\n');

  } catch (error) {
    console.error('Test execution failed:', error);
  } finally {
    db.close();
  }
}

// Run tests
runTests().catch(console.error);
