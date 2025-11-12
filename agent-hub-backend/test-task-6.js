/**
 * Test Script for Task 6: Evaluation Engine
 * 
 * This script verifies that all sub-tasks of Task 6 are working correctly:
 * - 6.1: Evaluator class with evaluate method
 * - 6.2: Accuracy metric calculators
 * - 6.3: Quality metric calculators
 * - 6.4: Performance metric calculators
 * - 6.5: AI-specific metric calculators (optional)
 * - 6.6: Overall score computation
 */

const Evaluator = require('./services/evaluator');

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

async function runTests() {
  console.log('\n=== Testing Task 6: Evaluation Engine ===\n');

  try {
    const evaluator = new Evaluator();

    // ========================================================================
    // Task 6.1: Evaluator class with evaluate method
    // ========================================================================
    console.log('--- Task 6.1: Evaluator Class ---\n');

    // Test: Evaluate method accepts test case and actual output
    try {
      const testCase = {
        id: 'test-001',
        name: 'Basic Test',
        input: { type: 'text', content: 'Hello World' },
        expected_output: {
          not_empty: true,
          contains: ['Hello', 'response']
        },
        validation: {
          tolerance: 0.8
        }
      };

      const actualOutput = 'Hello! This is a response to your message.';
      const result = evaluator.evaluate(testCase, actualOutput, { duration: 1000 });

      logTest('Evaluate method accepts test case and actual output',
        result && result.testId === 'test-001' && result.score !== undefined);
    } catch (error) {
      logTest('Evaluate method accepts test case and actual output', false, error);
    }

    // Test: Calculate accuracy metrics
    try {
      const testCase = {
        id: 'test-002',
        name: 'Accuracy Test',
        input: { type: 'text', content: 'Test' },
        expected_output: {
          contains: ['response'],
          not_contains: ['error']
        }
      };

      const result = evaluator.evaluate(testCase, 'This is a response', {});

      logTest('Calculate accuracy metrics',
        result.metrics.accuracy &&
        result.metrics.accuracy.substringMatchScore !== undefined);
    } catch (error) {
      logTest('Calculate accuracy metrics', false, error);
    }

    // Test: Calculate quality metrics
    try {
      const testCase = {
        id: 'test-003',
        name: 'Quality Test',
        input: { type: 'text', content: 'Test input' },
        expected_output: { not_empty: true }
      };

      const result = evaluator.evaluate(testCase, 'Quality output response', {});

      logTest('Calculate quality metrics',
        result.metrics.quality &&
        result.metrics.quality.coherenceScore !== undefined &&
        result.metrics.quality.relevanceScore !== undefined);
    } catch (error) {
      logTest('Calculate quality metrics', false, error);
    }

    // ========================================================================
    // Task 6.2: Accuracy metric calculators
    // ========================================================================
    console.log('\n--- Task 6.2: Accuracy Metric Calculators ---\n');

    // Test: exactMatch - Compare expected vs actual output
    try {
      const expectedOutput = { exact_match: 'Hello World' };
      const actualOutput = 'Hello World';

      const match = evaluator.exactMatch(expectedOutput, actualOutput);

      logTest('exactMatch: Compare expected vs actual output', match === true);
    } catch (error) {
      logTest('exactMatch: Compare expected vs actual output', false, error);
    }

    // Test: substringMatch - Check if expected strings are present
    try {
      const expectedOutput = {
        contains: ['Hello', 'World'],
        not_contains: ['Error']
      };
      const actualOutput = 'Hello World! This is a test.';

      const score = evaluator.substringMatch(expectedOutput, actualOutput);

      logTest('substringMatch: Check if expected strings are present',
        score > 0.9);
    } catch (error) {
      logTest('substringMatch: Check if expected strings are present', false, error);
    }

    // Test: patternMatch - Validate against regex patterns
    try {
      const expectedOutput = { pattern: '\\d{3}-\\d{3}-\\d{4}' };
      const actualOutput = 'Phone: 123-456-7890';

      const score = evaluator.patternMatch(expectedOutput, actualOutput);

      logTest('patternMatch: Validate against regex patterns', score === 1.0);
    } catch (error) {
      logTest('patternMatch: Validate against regex patterns', false, error);
    }

    // ========================================================================
    // Task 6.3: Quality metric calculators
    // ========================================================================
    console.log('\n--- Task 6.3: Quality Metric Calculators ---\n');

    // Test: coherenceScore - Use string similarity algorithms
    try {
      const output = 'This is a coherent sentence. It flows naturally. The ideas connect well.';
      const score = evaluator.coherenceScore(output);

      logTest('coherenceScore: Use string similarity algorithms',
        score >= 0 && score <= 1);
    } catch (error) {
      logTest('coherenceScore: Use string similarity algorithms', false, error);
    }

    // Test: relevanceScore - Keyword matching and scoring
    try {
      const input = 'Tell me about machine learning algorithms';
      const output = 'Machine learning algorithms are computational methods that learn from data.';
      const expectedOutput = { contains: ['machine', 'learning'] };

      const score = evaluator.relevanceScore(input, output, expectedOutput);

      logTest('relevanceScore: Keyword matching and scoring',
        score > 0.5);
    } catch (error) {
      logTest('relevanceScore: Keyword matching and scoring', false, error);
    }

    // Test: completenessScore - Check for expected elements
    try {
      const output = 'This is a complete response with all required elements.';
      const expectedOutput = {
        contains: ['complete', 'response'],
        min_length: 20
      };

      const score = evaluator.completenessScore(output, expectedOutput);

      logTest('completenessScore: Check for expected elements',
        score > 0.8);
    } catch (error) {
      logTest('completenessScore: Check for expected elements', false, error);
    }

    // ========================================================================
    // Task 6.4: Performance metric calculators
    // ========================================================================
    console.log('\n--- Task 6.4: Performance Metric Calculators ---\n');

    // Test: responseTime - Measure execution duration
    try {
      const metadata = { duration: 1500 };
      const validation = { max_duration: 2000 };

      const performance = evaluator.calculatePerformance(metadata, validation);

      logTest('responseTime: Measure execution duration',
        performance.responseTimeMs === 1500);
    } catch (error) {
      logTest('responseTime: Measure execution duration', false, error);
    }

    // Test: tokenUsage - Count input and output tokens
    try {
      const metadata = {
        inputTokens: 100,
        outputTokens: 150
      };

      const performance = evaluator.calculatePerformance(metadata, {});

      logTest('tokenUsage: Count input and output tokens',
        performance.inputTokens === 100 &&
        performance.outputTokens === 150 &&
        performance.totalTokens === 250);
    } catch (error) {
      logTest('tokenUsage: Count input and output tokens', false, error);
    }

    // Test: costEstimation - Calculate based on token usage and model pricing
    try {
      const cost = evaluator.estimateCost(1000, 2000, 'gpt-3.5-turbo');

      logTest('costEstimation: Calculate based on token usage and model pricing',
        cost > 0 && cost < 1);
    } catch (error) {
      logTest('costEstimation: Calculate based on token usage and model pricing', false, error);
    }

    // ========================================================================
    // Task 6.5: AI-specific metric calculators (optional)
    // ========================================================================
    console.log('\n--- Task 6.5: AI-Specific Metric Calculators (Optional) ---\n');

    // Test: BLEU score for translation tasks
    try {
      const reference = 'The cat is on the mat';
      const candidate = 'The cat is on the mat';

      const bleuScore = evaluator.calculateBLEU(reference, candidate);

      logTest('BLEU score for translation tasks',
        bleuScore >= 0 && bleuScore <= 1);
    } catch (error) {
      logTest('BLEU score for translation tasks', false, error);
    }

    // Test: ROUGE score for summarization tasks
    try {
      const reference = 'The quick brown fox jumps over the lazy dog';
      const candidate = 'The brown fox jumps over the dog';

      const rougeScore = evaluator.calculateROUGE(reference, candidate);

      logTest('ROUGE score for summarization tasks',
        rougeScore >= 0 && rougeScore <= 1);
    } catch (error) {
      logTest('ROUGE score for summarization tasks', false, error);
    }

    // Test: Semantic similarity using embeddings (string similarity proxy)
    try {
      const text1 = 'Machine learning is a subset of artificial intelligence';
      const text2 = 'AI includes machine learning as a component';

      const similarity = evaluator.calculateSemanticSimilarity(text1, text2);

      logTest('Semantic similarity using embeddings',
        similarity >= 0 && similarity <= 1);
    } catch (error) {
      logTest('Semantic similarity using embeddings', false, error);
    }

    // ========================================================================
    // Task 6.6: Overall score computation
    // ========================================================================
    console.log('\n--- Task 6.6: Overall Score Computation ---\n');

    // Test: Combine accuracy, quality, and performance metrics
    try {
      const accuracy = {
        exactMatch: true,
        substringMatchScore: 1.0,
        patternMatchScore: 1.0
      };
      const quality = {
        coherenceScore: 0.9,
        relevanceScore: 0.85,
        completenessScore: 0.95
      };
      const performance = {
        meetsPerformanceTarget: true
      };

      const score = evaluator.computeOverallScore(accuracy, quality, performance);

      logTest('Combine accuracy, quality, and performance metrics',
        score >= 0 && score <= 100);
    } catch (error) {
      logTest('Combine accuracy, quality, and performance metrics', false, error);
    }

    // Test: Apply tolerance thresholds
    try {
      const testCase = {
        id: 'test-tolerance',
        name: 'Tolerance Test',
        input: { type: 'text', content: 'Test' },
        expected_output: { contains: ['response'] },
        validation: { tolerance: 0.9 }
      };

      const result = evaluator.evaluate(testCase, 'This is a response', {});

      logTest('Apply tolerance thresholds',
        result.passed !== undefined);
    } catch (error) {
      logTest('Apply tolerance thresholds', false, error);
    }

    // Test: Determine pass/fail status
    try {
      const testCase = {
        id: 'test-pass-fail',
        name: 'Pass/Fail Test',
        input: { type: 'text', content: 'Test' },
        expected_output: {
          contains: ['response'],
          not_contains: ['error']
        },
        validation: { tolerance: 0.8 }
      };

      const passingOutput = 'This is a good response';
      const failingOutput = 'This has an error';

      const passResult = evaluator.evaluate(testCase, passingOutput, {});
      const failResult = evaluator.evaluate(testCase, failingOutput, {});

      logTest('Determine pass/fail status',
        passResult.passed === true && failResult.passed === false);
    } catch (error) {
      logTest('Determine pass/fail status', false, error);
    }

    // ========================================================================
    // Integration Tests
    // ========================================================================
    console.log('\n--- Integration Tests ---\n');

    // Test: Full evaluation with all metrics
    try {
      const testCase = {
        id: 'test-full',
        name: 'Full Evaluation Test',
        input: { type: 'text', content: 'Summarize machine learning' },
        expected_output: {
          contains: ['machine', 'learning'],
          not_contains: ['error'],
          min_length: 50
        },
        validation: {
          tolerance: 0.75,
          max_duration: 3000
        },
        metadata: {
          tags: ['summarization']
        }
      };

      const actualOutput = 'Machine learning is a field of artificial intelligence that uses algorithms to learn from data and make predictions.';
      const metadata = {
        duration: 1500,
        inputTokens: 50,
        outputTokens: 100,
        modelId: 'gpt-3.5-turbo'
      };

      const result = evaluator.evaluate(testCase, actualOutput, metadata);

      logTest('Full evaluation with all metrics',
        result.testId === 'test-full' &&
        result.metrics.accuracy &&
        result.metrics.quality &&
        result.metrics.performance &&
        result.score !== undefined &&
        result.passed !== undefined &&
        result.details);
    } catch (error) {
      logTest('Full evaluation with all metrics', false, error);
    }

    // Test: Helper methods
    try {
      const keywords = evaluator.extractKeywords('This is a test with several important keywords');
      const tokens = evaluator.tokenize('Hello world, this is a test!');
      const normalized = evaluator.normalizeOutput({ content: 'Test content' });

      logTest('Helper methods (extractKeywords, tokenize, normalizeOutput)',
        keywords.length > 0 &&
        tokens.length > 0 &&
        normalized === 'Test content');
    } catch (error) {
      logTest('Helper methods (extractKeywords, tokenize, normalizeOutput)', false, error);
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

    console.log('\n✓ Task 6 verification complete!\n');

  } catch (error) {
    console.error('Test execution failed:', error);
  }
}

// Run tests
runTests().catch(console.error);
