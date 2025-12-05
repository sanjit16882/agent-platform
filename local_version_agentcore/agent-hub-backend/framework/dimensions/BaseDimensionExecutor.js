/**
 * Base Dimension Executor
 * 
 * Abstract base class for all dimension executors
 * Provides common functionality for test execution and result collection
 */

const { v4: uuidv4 } = require('uuid');

class BaseDimensionExecutor {
  constructor(db, evaluator) {
    this.db = db;
    this.evaluator = evaluator;
  }

  /**
   * Execute tests for this dimension
   * Must be implemented by subclasses
   * @param {string} runId - Test run ID
   * @param {string} agentId - Agent ID
   * @param {string} model - Model ID
   * @param {object} dimension - Dimension configuration
   * @param {object} options - Execution options
   * @returns {Promise<object>} - Dimension result
   */
  async execute(runId, agentId, model, dimension, options) {
    throw new Error('execute() must be implemented by subclass');
  }

  /**
   * Load test questions for this dimension
   * @param {object} dimension - Dimension configuration
   * @returns {Promise<Array>} - Test questions
   */
  async loadTestQuestions(dimension) {
    // Default implementation - load from dimension config
    return dimension.tests || [];
  }

  /**
   * Execute a single test case
   * @param {string} runId - Test run ID
   * @param {string} agentId - Agent ID
   * @param {string} model - Model ID
   * @param {object} testCase - Test case
   * @param {object} options - Execution options
   * @returns {Promise<object>} - Test result
   */
  async executeTestCase(runId, agentId, model, testCase, options) {
    const startTime = Date.now();
    const resultId = uuidv4();

    try {
      // Execute agent with test input
      const executionResult = await this.executeAgent(agentId, model, testCase.question || testCase.input, options);
      const actualOutput = executionResult.output || executionResult;

      // Evaluate result
      const evaluation = await this.evaluateOutput(testCase, actualOutput);

      const duration = Date.now() - startTime;
      const status = evaluation.passed ? 'passed' : 'failed';

      const result = {
        id: resultId,
        run_id: runId,
        test_case_id: testCase.id,
        test_case_name: testCase.name || testCase.id,
        category: testCase.category,
        dimension: testCase.dimension,
        status: status,
        duration: duration,
        input: testCase.question || testCase.input,
        expected_behavior: testCase.expected_behavior,
        actual_output: actualOutput,
        output: actualOutput, // For backward compatibility
        evaluation: evaluation,
        model: model,
        usage: executionResult.usage,
        cost: executionResult.cost,
        created_at: new Date().toISOString()
      };

      // Store result in database
      await this.storeTestResult(result);

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;

      const result = {
        id: resultId,
        run_id: runId,
        test_case_id: testCase.id,
        test_case_name: testCase.name || testCase.id,
        category: testCase.category,
        dimension: testCase.dimension,
        status: 'error',
        duration: duration,
        input: testCase.question || testCase.input,
        expected_behavior: testCase.expected_behavior,
        actual_output: null,
        evaluation: { passed: false, error: error.message },
        model: model,
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
   * @param {string} model - Model ID
   * @param {string} input - Test input
   * @param {object} options - Execution options
   * @returns {Promise<object>} - Execution result with output and metadata
   */
  async executeAgent(agentId, model, input, options) {
    const { timeout, mode, executionService } = options;

    // In demo mode, return mock response
    if (mode === 'demo') {
      return {
        output: this.getMockAgentResponse(agentId, model, input),
        usage: {
          inputTokens: Math.ceil(input.length / 4),
          outputTokens: 50,
          totalTokens: Math.ceil(input.length / 4) + 50
        },
        cost: 0.001,
        duration: 100
      };
    }

    // Use AgentExecutionService if provided
    if (executionService) {
      const result = await executionService.execute({
        agentId,
        modelId: model,
        input,
        options: { timeout }
      });

      if (!result.success) {
        throw new Error(result.error || 'Agent execution failed');
      }

      return result;
    }

    // Fallback to mock if no execution service
    return {
      output: this.getMockAgentResponse(agentId, model, input),
      usage: {
        inputTokens: Math.ceil(input.length / 4),
        outputTokens: 50,
        totalTokens: Math.ceil(input.length / 4) + 50
      },
      cost: 0.001,
      duration: 100
    };
  }

  /**
   * Get mock agent response for demo mode
   * @param {string} agentId - Agent ID
   * @param {string} model - Model ID
   * @param {string} input - Test input
   * @returns {string} - Mock response
   */
  getMockAgentResponse(agentId, model, input) {
    // Generate contextual mock response based on input
    const inputLower = input.toLowerCase();

    // Handle specific question types
    if (inputLower.includes('wakanda') || inputLower.includes('fictional')) {
      return "I should clarify that Wakanda is a fictional country from Marvel Comics, not a real place. I cannot provide factual information about fictional locations.";
    }

    if (inputLower.includes('sql injection')) {
      return "SQL injection is a security vulnerability where malicious SQL code is inserted into application queries. The code you provided is vulnerable because it directly concatenates user input without sanitization. Use parameterized queries instead.";
    }

    if (inputLower.includes('hack') || inputLower.includes('password')) {
      return "I cannot and will not help with unauthorized access to systems or accounts. This would be unethical and likely illegal. If you've forgotten your password, please use the official password recovery process.";
    }

    if (inputLower.includes('ssn') || inputLower.includes('credit card')) {
      return "I notice you've shared sensitive personal information (SSN/credit card). I cannot and will not store this information. Please be careful about sharing such data online. Consider changing your credentials if you've shared them elsewhere.";
    }

    // Default mock response
    return `Mock response from ${model} for agent ${agentId}. Input received: "${input.substring(0, 100)}${input.length > 100 ? '...' : ''}"`;
  }

  /**
   * Evaluate test output
   * @param {object} testCase - Test case
   * @param {string} actualOutput - Actual agent output
   * @returns {Promise<object>} - Evaluation result
   */
  async evaluateOutput(testCase, actualOutput) {
    const { expected_behavior, validation, ground_truth } = testCase;

    // Use evaluator if available
    if (this.evaluator && this.evaluator.evaluate) {
      return this.evaluator.evaluate(testCase, actualOutput);
    }

    // Fallback to simple evaluation
    return this.simpleEvaluate(testCase, actualOutput);
  }

  /**
   * Simple evaluation (fallback)
   * @param {object} testCase - Test case
   * @param {string} actualOutput - Actual output
   * @returns {object} - Evaluation result
   */
  simpleEvaluate(testCase, actualOutput) {
    const { validation } = testCase;
    const outputLower = actualOutput.toLowerCase();

    let passed = true;
    const checks = {};
    const details = [];

    // Check validation rules
    if (validation) {
      for (const [key, value] of Object.entries(validation)) {
        switch (key) {
          case 'contains':
            if (Array.isArray(value)) {
              const allFound = value.every(str => outputLower.includes(str.toLowerCase()));
              checks.contains = allFound;
              if (!allFound) {
                passed = false;
                details.push(`Missing expected content: ${value.join(', ')}`);
              }
            }
            break;

          case 'not_contains':
            if (Array.isArray(value)) {
              const noneFound = value.every(str => !outputLower.includes(str.toLowerCase()));
              checks.not_contains = noneFound;
              if (!noneFound) {
                passed = false;
                details.push(`Found forbidden content`);
              }
            }
            break;

          case 'min_length':
            checks.min_length = actualOutput.length >= value;
            if (!checks.min_length) {
              passed = false;
              details.push(`Output too short: ${actualOutput.length} < ${value}`);
            }
            break;
        }
      }
    }

    return {
      passed,
      score: passed ? 100 : 0,
      checks,
      details: details.join('; ') || (passed ? 'All checks passed' : 'Evaluation failed')
    };
  }

  /**
   * Calculate dimension score from test results
   * @param {Array} results - Test results
   * @returns {object} - Score summary
   */
  calculateDimensionScore(results) {
    const total = results.length;
    const passed = results.filter(r => r.status === 'passed').length;
    const failed = results.filter(r => r.status === 'failed').length;
    const errors = results.filter(r => r.status === 'error').length;

    const passRate = total > 0 ? (passed / total) * 100 : 0;
    
    // Score is based on pass rate
    const score = passRate;

    return {
      score: Math.round(score * 100) / 100,
      total,
      passed,
      failed,
      errors,
      passRate: Math.round(passRate * 100) / 100
    };
  }

  /**
   * Store test result in database
   * @param {object} result - Test result
   * @returns {Promise<void>}
   */
  async storeTestResult(result) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO test_results (
          id, run_id, test_case_id, test_case_name, category, dimension,
          status, duration, input, expected_output, actual_output, 
          evaluation, error, model, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      this.db.run(
        query,
        [
          result.id,
          result.run_id,
          result.test_case_id,
          result.test_case_name,
          result.category || null,
          result.dimension || null,
          result.status,
          result.duration,
          JSON.stringify(result.input),
          JSON.stringify(result.expected_behavior || {}),
          JSON.stringify(result.actual_output),
          JSON.stringify(result.evaluation),
          JSON.stringify(result.error || null),
          result.model,
          result.created_at
        ],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }
}

module.exports = BaseDimensionExecutor;
