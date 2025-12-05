/**
 * Evaluator Service
 * 
 * Calculates metrics, scores, and quality assessments for agent test outputs
 * Implements accuracy, quality, performance, and AI-specific metrics
 */

const stringSimilarity = require('string-similarity');

class Evaluator {
  constructor() {
    // Token pricing (example rates per 1K tokens)
    this.tokenPricing = {
      'claude-v2': { input: 0.008, output: 0.024 },
      'gpt-4': { input: 0.03, output: 0.06 },
      'gpt-3.5-turbo': { input: 0.0015, output: 0.002 },
      'default': { input: 0.01, output: 0.03 }
    };
  }

  /**
   * Main evaluation method
   * @param {object} testCase - Test case definition
   * @param {any} actualOutput - Actual agent output
   * @param {object} executionMetadata - Execution metadata (duration, tokens, etc.)
   * @returns {object} - Evaluation result
   */
  evaluate(testCase, actualOutput, executionMetadata = {}) {
    const { expected_output, validation, input } = testCase;

    // Calculate accuracy metrics
    const accuracy = this.calculateAccuracy(expected_output, actualOutput);

    // Calculate quality metrics
    const quality = this.calculateQuality(input, actualOutput, expected_output);

    // Calculate performance metrics
    const performance = this.calculatePerformance(executionMetadata, validation);

    // Calculate AI-specific metrics (optional)
    const aiSpecific = this.calculateAIMetrics(testCase, actualOutput);

    // Compute overall score
    const score = this.computeOverallScore(accuracy, quality, performance);

    // Determine pass/fail
    const tolerance = validation?.tolerance || 0.8;
    const passed = score >= (tolerance * 100);

    // Generate details
    const details = this.generateDetails(accuracy, quality, performance, passed);

    return {
      testId: testCase.id,
      metrics: {
        accuracy,
        quality,
        performance,
        aiSpecific
      },
      score,
      passed,
      details
    };
  }

  // ============================================================================
  // ACCURACY METRICS (Task 6.2)
  // ============================================================================

  /**
   * Calculate accuracy metrics
   * @param {object} expectedOutput - Expected output definition
   * @param {any} actualOutput - Actual output
   * @returns {object} - Accuracy metrics
   */
  calculateAccuracy(expectedOutput, actualOutput) {
    if (!expectedOutput) {
      return {
        exactMatch: null,
        substringMatchScore: 1.0,
        patternMatchScore: 1.0
      };
    }

    const actualStr = this.normalizeOutput(actualOutput);

    return {
      exactMatch: this.exactMatch(expectedOutput, actualStr),
      substringMatchScore: this.substringMatch(expectedOutput, actualStr),
      patternMatchScore: this.patternMatch(expectedOutput, actualStr)
    };
  }

  /**
   * Exact match comparison
   * @param {object} expectedOutput - Expected output
   * @param {string} actualStr - Actual output string
   * @returns {boolean} - True if exact match
   */
  exactMatch(expectedOutput, actualStr) {
    if (!expectedOutput.exact_match) {
      return null;
    }

    const expectedStr = expectedOutput.exact_match.trim().toLowerCase();
    return actualStr.trim().toLowerCase() === expectedStr;
  }

  /**
   * Substring match scoring
   * @param {object} expectedOutput - Expected output
   * @param {string} actualStr - Actual output string
   * @returns {number} - Match score (0-1)
   */
  substringMatch(expectedOutput, actualStr) {
    const checks = [];

    // Check contains
    if (expectedOutput.contains && Array.isArray(expectedOutput.contains)) {
      const containsScore = expectedOutput.contains.filter(str =>
        actualStr.toLowerCase().includes(str.toLowerCase())
      ).length / expectedOutput.contains.length;
      checks.push(containsScore);
    }

    // Check not_contains
    if (expectedOutput.not_contains && Array.isArray(expectedOutput.not_contains)) {
      const notContainsScore = expectedOutput.not_contains.filter(str =>
        !actualStr.toLowerCase().includes(str.toLowerCase())
      ).length / expectedOutput.not_contains.length;
      checks.push(notContainsScore);
    }

    // Check not_empty
    if (expectedOutput.not_empty) {
      const notEmptyScore = actualStr.trim().length > 0 ? 1.0 : 0.0;
      checks.push(notEmptyScore);
    }

    // Average all checks
    return checks.length > 0
      ? checks.reduce((sum, score) => sum + score, 0) / checks.length
      : 1.0;
  }

  /**
   * Pattern match scoring
   * @param {object} expectedOutput - Expected output
   * @param {string} actualStr - Actual output string
   * @returns {number} - Match score (0-1)
   */
  patternMatch(expectedOutput, actualStr) {
    if (!expectedOutput.pattern) {
      return null;
    }

    try {
      const regex = new RegExp(expectedOutput.pattern);
      return regex.test(actualStr) ? 1.0 : 0.0;
    } catch (error) {
      console.error(`Invalid regex pattern: ${expectedOutput.pattern}`, error);
      return 0.0;
    }
  }

  // ============================================================================
  // QUALITY METRICS (Task 6.3)
  // ============================================================================

  /**
   * Calculate quality metrics
   * @param {object} input - Test input
   * @param {any} actualOutput - Actual output
   * @param {object} expectedOutput - Expected output
   * @returns {object} - Quality metrics
   */
  calculateQuality(input, actualOutput, expectedOutput) {
    const actualStr = this.normalizeOutput(actualOutput);
    const inputStr = this.normalizeOutput(input);

    return {
      coherenceScore: this.coherenceScore(actualStr),
      relevanceScore: this.relevanceScore(inputStr, actualStr, expectedOutput),
      completenessScore: this.completenessScore(actualStr, expectedOutput),
      sentimentScore: this.sentimentScore(actualStr)
    };
  }

  /**
   * Coherence score using string similarity
   * @param {string} output - Output text
   * @returns {number} - Coherence score (0-1)
   */
  coherenceScore(output) {
    if (!output || output.length < 10) {
      return 0.5;
    }

    // Split into sentences
    const sentences = output.split(/[.!?]+/).filter(s => s.trim().length > 0);

    if (sentences.length < 2) {
      return 0.8; // Single sentence is considered coherent
    }

    // Calculate similarity between consecutive sentences
    let totalSimilarity = 0;
    for (let i = 0; i < sentences.length - 1; i++) {
      const similarity = stringSimilarity.compareTwoStrings(
        sentences[i].trim(),
        sentences[i + 1].trim()
      );
      totalSimilarity += similarity;
    }

    const avgSimilarity = totalSimilarity / (sentences.length - 1);

    // Normalize to 0-1 range (0.2-0.6 similarity is good coherence)
    // Too high similarity means repetitive, too low means disconnected
    if (avgSimilarity >= 0.2 && avgSimilarity <= 0.6) {
      return 0.8 + (0.2 * (1 - Math.abs(0.4 - avgSimilarity) / 0.4));
    } else if (avgSimilarity < 0.2) {
      return 0.5 + (avgSimilarity / 0.2) * 0.3;
    } else {
      return 0.8 - ((avgSimilarity - 0.6) / 0.4) * 0.3;
    }
  }

  /**
   * Relevance score using keyword matching
   * @param {string} input - Input text
   * @param {string} output - Output text
   * @param {object} expectedOutput - Expected output definition
   * @returns {number} - Relevance score (0-1)
   */
  relevanceScore(input, output, expectedOutput) {
    // Extract keywords from input (simple approach: words > 4 chars)
    const inputKeywords = this.extractKeywords(input);
    const outputLower = output.toLowerCase();

    if (inputKeywords.length === 0) {
      return 0.7; // Default if no keywords
    }

    // Count how many input keywords appear in output
    const matchedKeywords = inputKeywords.filter(keyword =>
      outputLower.includes(keyword.toLowerCase())
    );

    const keywordScore = matchedKeywords.length / inputKeywords.length;

    // Bonus for expected output keywords
    let expectedScore = 0;
    if (expectedOutput && expectedOutput.contains) {
      const expectedKeywords = expectedOutput.contains;
      const matchedExpected = expectedKeywords.filter(keyword =>
        outputLower.includes(keyword.toLowerCase())
      );
      expectedScore = matchedExpected.length / expectedKeywords.length;
    }

    // Weighted average
    return expectedScore > 0
      ? (keywordScore * 0.6 + expectedScore * 0.4)
      : keywordScore;
  }

  /**
   * Completeness score
   * @param {string} output - Output text
   * @param {object} expectedOutput - Expected output definition
   * @returns {number} - Completeness score (0-1)
   */
  completenessScore(output, expectedOutput) {
    if (!expectedOutput) {
      return 1.0;
    }

    const checks = [];

    // Check min/max length
    if (expectedOutput.min_length) {
      const meetsMin = output.length >= expectedOutput.min_length;
      checks.push(meetsMin ? 1.0 : output.length / expectedOutput.min_length);
    }

    if (expectedOutput.max_length) {
      const meetsMax = output.length <= expectedOutput.max_length;
      checks.push(meetsMax ? 1.0 : expectedOutput.max_length / output.length);
    }

    // Check for expected elements
    if (expectedOutput.contains) {
      const containsScore = expectedOutput.contains.filter(str =>
        output.toLowerCase().includes(str.toLowerCase())
      ).length / expectedOutput.contains.length;
      checks.push(containsScore);
    }

    // Check structure (has sentences, paragraphs, etc.)
    const hasSentences = output.split(/[.!?]+/).length > 1;
    checks.push(hasSentences ? 1.0 : 0.7);

    return checks.length > 0
      ? checks.reduce((sum, score) => sum + score, 0) / checks.length
      : 1.0;
  }

  /**
   * Sentiment score (basic implementation)
   * @param {string} output - Output text
   * @returns {number} - Sentiment score (-1 to 1, 0 is neutral)
   */
  sentimentScore(output) {
    // Simple sentiment analysis using positive/negative word lists
    const positiveWords = ['good', 'great', 'excellent', 'success', 'complete', 'correct', 'yes', 'perfect'];
    const negativeWords = ['bad', 'error', 'fail', 'wrong', 'incorrect', 'no', 'issue', 'problem'];

    const outputLower = output.toLowerCase();
    const positiveCount = positiveWords.filter(word => outputLower.includes(word)).length;
    const negativeCount = negativeWords.filter(word => outputLower.includes(word)).length;

    const totalCount = positiveCount + negativeCount;
    if (totalCount === 0) {
      return 0; // Neutral
    }

    return (positiveCount - negativeCount) / totalCount;
  }

  // ============================================================================
  // PERFORMANCE METRICS (Task 6.4)
  // ============================================================================

  /**
   * Calculate performance metrics
   * @param {object} executionMetadata - Execution metadata
   * @param {object} validation - Validation rules
   * @returns {object} - Performance metrics
   */
  calculatePerformance(executionMetadata, validation) {
    const {
      duration = 0,
      inputTokens = 0,
      outputTokens = 0,
      modelId = 'default'
    } = executionMetadata;

    return {
      responseTimeMs: duration,
      inputTokens: inputTokens,
      outputTokens: outputTokens,
      totalTokens: inputTokens + outputTokens,
      estimatedCost: this.estimateCost(inputTokens, outputTokens, modelId),
      meetsPerformanceTarget: this.meetsPerformanceTarget(duration, validation)
    };
  }

  /**
   * Estimate cost based on token usage
   * @param {number} inputTokens - Input token count
   * @param {number} outputTokens - Output token count
   * @param {string} modelId - Model identifier
   * @returns {number} - Estimated cost in USD
   */
  estimateCost(inputTokens, outputTokens, modelId) {
    const pricing = this.tokenPricing[modelId] || this.tokenPricing.default;

    const inputCost = (inputTokens / 1000) * pricing.input;
    const outputCost = (outputTokens / 1000) * pricing.output;

    return inputCost + outputCost;
  }

  /**
   * Check if performance meets target
   * @param {number} duration - Execution duration in ms
   * @param {object} validation - Validation rules
   * @returns {boolean} - True if meets target
   */
  meetsPerformanceTarget(duration, validation) {
    if (!validation || !validation.max_duration) {
      return true;
    }

    return duration <= validation.max_duration;
  }

  // ============================================================================
  // AI-SPECIFIC METRICS (Task 6.5 - Optional)
  // ============================================================================

  /**
   * Calculate AI-specific metrics
   * @param {object} testCase - Test case
   * @param {any} actualOutput - Actual output
   * @returns {object} - AI-specific metrics
   */
  calculateAIMetrics(testCase, actualOutput) {
    const { expected_output, metadata } = testCase;

    if (!expected_output || !metadata) {
      return null;
    }

    const metrics = {};

    // BLEU score for translation/generation tasks
    if (metadata.tags && metadata.tags.includes('translation')) {
      metrics.bleuScore = this.calculateBLEU(expected_output.exact_match, actualOutput);
    }

    // ROUGE score for summarization tasks
    if (metadata.tags && metadata.tags.includes('summarization')) {
      metrics.rougeScore = this.calculateROUGE(expected_output.exact_match, actualOutput);
    }

    // Semantic similarity
    if (expected_output.exact_match) {
      metrics.semanticSimilarity = this.calculateSemanticSimilarity(
        expected_output.exact_match,
        actualOutput
      );
    }

    return Object.keys(metrics).length > 0 ? metrics : null;
  }

  /**
   * Calculate BLEU score (simplified implementation)
   * @param {string} reference - Reference text
   * @param {string} candidate - Candidate text
   * @returns {number} - BLEU score (0-1)
   */
  calculateBLEU(reference, candidate) {
    if (!reference || !candidate) {
      return 0;
    }

    const refTokens = this.tokenize(reference);
    const candTokens = this.tokenize(candidate);

    // Simplified BLEU: unigram precision
    const matches = candTokens.filter(token => refTokens.includes(token)).length;
    const precision = matches / candTokens.length;

    // Brevity penalty
    const brevityPenalty = candTokens.length >= refTokens.length
      ? 1.0
      : Math.exp(1 - refTokens.length / candTokens.length);

    return precision * brevityPenalty;
  }

  /**
   * Calculate ROUGE score (simplified ROUGE-1)
   * @param {string} reference - Reference text
   * @param {string} candidate - Candidate text
   * @returns {number} - ROUGE score (0-1)
   */
  calculateROUGE(reference, candidate) {
    if (!reference || !candidate) {
      return 0;
    }

    const refTokens = this.tokenize(reference);
    const candTokens = this.tokenize(candidate);

    // ROUGE-1: unigram overlap
    const overlap = refTokens.filter(token => candTokens.includes(token)).length;
    const recall = overlap / refTokens.length;
    const precision = overlap / candTokens.length;

    // F1 score
    if (recall + precision === 0) {
      return 0;
    }

    return (2 * recall * precision) / (recall + precision);
  }

  /**
   * Calculate semantic similarity
   * @param {string} text1 - First text
   * @param {string} text2 - Second text
   * @returns {number} - Similarity score (0-1)
   */
  calculateSemanticSimilarity(text1, text2) {
    if (!text1 || !text2) {
      return 0;
    }

    // Use string similarity as a proxy for semantic similarity
    // In production, this would use embeddings
    return stringSimilarity.compareTwoStrings(
      text1.toLowerCase(),
      text2.toLowerCase()
    );
  }

  // ============================================================================
  // OVERALL SCORE COMPUTATION (Task 6.6)
  // ============================================================================

  /**
   * Compute overall score
   * @param {object} accuracy - Accuracy metrics
   * @param {object} quality - Quality metrics
   * @param {object} performance - Performance metrics
   * @returns {number} - Overall score (0-100)
   */
  computeOverallScore(accuracy, quality, performance) {
    // Weights for different metric categories
    const weights = {
      accuracy: 0.5,
      quality: 0.3,
      performance: 0.2
    };

    // Calculate accuracy score
    const accuracyScore = this.calculateAccuracyScore(accuracy);

    // Calculate quality score
    const qualityScore = this.calculateQualityScore(quality);

    // Calculate performance score
    const performanceScore = this.calculatePerformanceScore(performance);

    // Weighted average
    const overallScore =
      (accuracyScore * weights.accuracy) +
      (qualityScore * weights.quality) +
      (performanceScore * weights.performance);

    return Math.round(overallScore * 100) / 100;
  }

  /**
   * Calculate accuracy score from metrics
   * @param {object} accuracy - Accuracy metrics
   * @returns {number} - Score (0-100)
   */
  calculateAccuracyScore(accuracy) {
    const scores = [];

    if (accuracy.exactMatch !== null) {
      scores.push(accuracy.exactMatch ? 100 : 0);
    }

    if (accuracy.substringMatchScore !== null) {
      scores.push(accuracy.substringMatchScore * 100);
    }

    if (accuracy.patternMatchScore !== null) {
      scores.push(accuracy.patternMatchScore * 100);
    }

    return scores.length > 0
      ? scores.reduce((sum, score) => sum + score, 0) / scores.length
      : 100;
  }

  /**
   * Calculate quality score from metrics
   * @param {object} quality - Quality metrics
   * @returns {number} - Score (0-100)
   */
  calculateQualityScore(quality) {
    const scores = [
      quality.coherenceScore * 100,
      quality.relevanceScore * 100,
      quality.completenessScore * 100
    ];

    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  /**
   * Calculate performance score from metrics
   * @param {object} performance - Performance metrics
   * @returns {number} - Score (0-100)
   */
  calculatePerformanceScore(performance) {
    // Performance is binary: meets target or not
    return performance.meetsPerformanceTarget ? 100 : 70;
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Normalize output to string
   * @param {any} output - Output value
   * @returns {string} - Normalized string
   */
  normalizeOutput(output) {
    if (typeof output === 'string') {
      return output;
    }

    if (typeof output === 'object') {
      if (output && output.content) {
        return output.content;
      }
      return JSON.stringify(output);
    }

    return String(output);
  }

  /**
   * Extract keywords from text
   * @param {string} text - Input text
   * @returns {Array} - Array of keywords
   */
  extractKeywords(text) {
    if (!text) {
      return [];
    }

    // Simple keyword extraction: words > 4 characters, excluding common words
    const commonWords = ['that', 'this', 'with', 'from', 'have', 'been', 'were', 'will', 'would', 'could', 'should'];
    
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 4 && !commonWords.includes(word));

    // Return unique keywords
    return [...new Set(words)];
  }

  /**
   * Tokenize text
   * @param {string} text - Input text
   * @returns {Array} - Array of tokens
   */
  tokenize(text) {
    if (!text) {
      return [];
    }

    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 0);
  }

  /**
   * Generate evaluation details
   * @param {object} accuracy - Accuracy metrics
   * @param {object} quality - Quality metrics
   * @param {object} performance - Performance metrics
   * @param {boolean} passed - Pass/fail status
   * @returns {string} - Details string
   */
  generateDetails(accuracy, quality, performance, passed) {
    const details = [];

    if (passed) {
      details.push('✓ Test passed all evaluation criteria');
    } else {
      details.push('✗ Test failed evaluation criteria');
    }

    // Accuracy details
    if (accuracy.exactMatch === false) {
      details.push('- Exact match failed');
    }
    if (accuracy.substringMatchScore < 0.8) {
      details.push(`- Substring match score: ${(accuracy.substringMatchScore * 100).toFixed(1)}%`);
    }
    if (accuracy.patternMatchScore === 0) {
      details.push('- Pattern match failed');
    }

    // Quality details
    if (quality.coherenceScore < 0.7) {
      details.push(`- Low coherence score: ${(quality.coherenceScore * 100).toFixed(1)}%`);
    }
    if (quality.relevanceScore < 0.7) {
      details.push(`- Low relevance score: ${(quality.relevanceScore * 100).toFixed(1)}%`);
    }
    if (quality.completenessScore < 0.8) {
      details.push(`- Incomplete output: ${(quality.completenessScore * 100).toFixed(1)}%`);
    }

    // Performance details
    if (!performance.meetsPerformanceTarget) {
      details.push(`- Performance target not met: ${performance.responseTimeMs}ms`);
    }

    return details.join('\n');
  }
}

module.exports = Evaluator;
