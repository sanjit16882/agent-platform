/**
 * Performance Dimension Executor
 * 
 * Tests performance and reliability:
 * - Response time
 * - Token efficiency
 * - Failure mode handling
 * - Consistency
 */

const BaseDimensionExecutor = require('./BaseDimensionExecutor');

class PerformanceExecutor extends BaseDimensionExecutor {
  constructor(db, evaluator) {
    super(db, evaluator);
    this.dimensionName = 'Performance & Reliability';
  }

  /**
   * Execute performance tests
   * @param {string} runId - Test run ID
   * @param {string} agentId - Agent ID
   * @param {string} model - Model ID
   * @param {object} dimension - Dimension configuration
   * @param {object} options - Execution options
   * @returns {Promise<object>} - Dimension result
   */
  async execute(runId, agentId, model, dimension, options) {
    console.log(`    Executing Performance & Reliability tests...`);

    // Load test questions for this dimension
    const testQuestions = await this.loadPerformanceTests();

    // Execute all tests
    const results = [];
    const latencies = [];
    
    for (let i = 0; i < testQuestions.length; i++) {
      const testCase = testQuestions[i];
      
      console.log(`      [${i + 1}/${testQuestions.length}] ${testCase.id}: ${testCase.category}`);
      
      const result = await this.executeTestCase(runId, agentId, model, testCase, options);
      
      // Track latency
      if (result.duration) {
        latencies.push(result.duration);
      }
      
      // Evaluate performance-specific criteria
      result.evaluation = await this.evaluatePerformance(testCase, result);
      result.status = result.evaluation.passed ? 'passed' : 'failed';
      
      results.push(result);
    }

    // Calculate dimension score
    const score = this.calculateDimensionScore(results);

    // Calculate performance metrics
    const avgLatency = latencies.length > 0
      ? latencies.reduce((sum, l) => sum + l, 0) / latencies.length
      : 0;
    
    const maxLatency = latencies.length > 0
      ? Math.max(...latencies)
      : 0;

    return {
      ...score,
      avgLatency: Math.round(avgLatency),
      maxLatency: Math.round(maxLatency),
      tests: results
    };
  }

  /**
   * Evaluate performance test
   * @param {object} testCase - Test case
   * @param {object} result - Test result
   * @returns {Promise<object>} - Evaluation
   */
  async evaluatePerformance(testCase, result) {
    const { validation } = testCase;
    const checks = {};
    let passed = true;
    const details = [];

    // Check latency
    if (validation && validation.max_latency_ms) {
      checks.latency = result.duration <= validation.max_latency_ms;
      if (!checks.latency) {
        passed = false;
        details.push(`Latency exceeded: ${result.duration}ms > ${validation.max_latency_ms}ms`);
      }
    }

    // Check output length (token efficiency)
    if (validation && validation.max_output_tokens) {
      const estimatedTokens = Math.ceil(result.actual_output.length / 4);
      checks.token_efficiency = estimatedTokens <= validation.max_output_tokens;
      if (!checks.token_efficiency) {
        passed = false;
        details.push(`Output too long: ~${estimatedTokens} tokens > ${validation.max_output_tokens} tokens`);
      }
    }

    // Check for empty input handling
    if (testCase.category === 'Failure Mode Testing' && testCase.id === 'Q045') {
      checks.handles_empty = result.actual_output && result.actual_output.length > 0;
      if (!checks.handles_empty) {
        passed = false;
        details.push('Failed to handle empty input');
      }
    }

    // Check for long input handling
    if (testCase.category === 'Failure Mode Testing' && testCase.id === 'Q046') {
      checks.handles_long_input = result.status !== 'error';
      if (!checks.handles_long_input) {
        passed = false;
        details.push('Failed to handle long input');
      }
    }

    // Use base evaluation for content checks
    if (validation && (validation.contains || validation.not_contains)) {
      const baseEval = await this.simpleEvaluate(testCase, result.actual_output);
      Object.assign(checks, baseEval.checks);
      if (!baseEval.passed) {
        passed = false;
        details.push(baseEval.details);
      }
    }

    return {
      passed,
      score: passed ? 100 : 0,
      checks,
      details: details.join('; ') || (passed ? 'Performance test passed' : 'Performance test failed')
    };
  }

  /**
   * Load performance test questions
   * @returns {Array} - Test questions
   */
  async loadPerformanceTests() {
    return [
      // Q045: Failure Mode Testing - Empty input
      {
        id: 'Q045',
        category: 'Failure Mode Testing',
        dimension: 'Performance',
        question: '',
        expected_behavior: 'handle_empty_input',
        validation: {
          min_length: 10
        }
      },

      // Q046: Failure Mode Testing - Long input
      {
        id: 'Q046',
        category: 'Failure Mode Testing',
        dimension: 'Performance',
        question: 'A'.repeat(10000),
        expected_behavior: 'handle_long_input',
        validation: {
          max_latency_ms: 5000
        }
      }
    ];
  }
}

module.exports = PerformanceExecutor;
