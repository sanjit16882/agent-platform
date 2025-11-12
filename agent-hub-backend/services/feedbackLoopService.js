/**
 * Feedback Loop Service
 * 
 * Analyzes test failures, identifies patterns, and generates improvement recommendations
 * Implements pattern analysis and recommendation generation for continuous improvement
 */

const { v4: uuidv4 } = require('uuid');
const stringSimilarity = require('string-similarity');

class FeedbackLoopService {
  constructor(db) {
    this.db = db;
    this.patternAnalyzer = new PatternAnalyzer();
    this.recommendationEngine = new RecommendationEngine();
  }

  /**
   * Analyze test results and generate recommendations
   * @param {string} agentId - Agent ID
   * @param {Array} testResults - Test results to analyze
   * @returns {Promise<object>} - Analysis and recommendations
   */
  async analyzeAndRecommend(agentId, testResults) {
    // Analyze failure patterns
    const patterns = this.patternAnalyzer.analyzeFailures(testResults);

    // Generate recommendations
    const recommendations = this.recommendationEngine.generateRecommendations(patterns, agentId);

    // Store patterns and recommendations
    await this.storePatterns(agentId, patterns);
    await this.storeRecommendations(agentId, recommendations);

    return {
      patterns,
      recommendations,
      summary: {
        totalFailures: testResults.filter(r => r.status === 'failed').length,
        patternsIdentified: patterns.length,
        recommendationsGenerated: recommendations.length
      }
    };
  }

  /**
   * Get feedback for an agent
   * @param {string} agentId - Agent ID
   * @param {object} options - Query options
   * @returns {Promise<object>} - Feedback data
   */
  async getFeedback(agentId, options = {}) {
    const patterns = await this.getPatterns(agentId, options);
    const recommendations = await this.getRecommendations(agentId, options);

    return {
      patterns,
      recommendations
    };
  }

  /**
   * Update recommendation status
   * @param {string} recommendationId - Recommendation ID
   * @param {string} status - New status (accepted, rejected, applied)
   * @returns {Promise<void>}
   */
  async updateRecommendationStatus(recommendationId, status) {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE recommendations
        SET status = ?, updated_at = ?
        WHERE id = ?
      `;

      this.db.run(
        query,
        [status, new Date().toISOString(), recommendationId],
        (err) => {
          if (err) {
            reject(err);
          } else {
            console.log(`✓ Updated recommendation ${recommendationId} status to ${status}`);
            resolve();
          }
        }
      );
    });
  }

  // ============================================================================
  // DATABASE OPERATIONS
  // ============================================================================

  /**
   * Store failure patterns
   * @param {string} agentId - Agent ID
   * @param {Array} patterns - Failure patterns
   * @returns {Promise<void>}
   */
  async storePatterns(agentId, patterns) {
    const promises = patterns.map(pattern => {
      return new Promise((resolve, reject) => {
        const query = `
          INSERT INTO failure_patterns (
            id, agent_id, pattern_type, description, occurrences,
            test_cases, common_features, failure_reasons, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        this.db.run(
          query,
          [
            pattern.pattern_id,
            agentId,
            pattern.pattern_type,
            pattern.description,
            pattern.occurrences,
            JSON.stringify(pattern.test_cases),
            JSON.stringify(pattern.common_input_features),
            JSON.stringify(pattern.common_failure_reasons),
            new Date().toISOString()
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
    });

    await Promise.all(promises);
    console.log(`✓ Stored ${patterns.length} failure patterns for agent ${agentId}`);
  }

  /**
   * Store recommendations
   * @param {string} agentId - Agent ID
   * @param {Array} recommendations - Recommendations
   * @returns {Promise<void>}
   */
  async storeRecommendations(agentId, recommendations) {
    const promises = recommendations.map(rec => {
      return new Promise((resolve, reject) => {
        const query = `
          INSERT INTO recommendations (
            id, agent_id, type, priority, description, suggested_change,
            expected_improvement, affected_tests, status, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        this.db.run(
          query,
          [
            rec.id,
            agentId,
            rec.type,
            rec.priority,
            rec.description,
            rec.suggested_change,
            rec.expected_improvement,
            JSON.stringify(rec.affected_tests),
            'pending',
            new Date().toISOString()
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
    });

    await Promise.all(promises);
    console.log(`✓ Stored ${recommendations.length} recommendations for agent ${agentId}`);
  }

  /**
   * Get failure patterns for an agent
   * @param {string} agentId - Agent ID
   * @param {object} options - Query options
   * @returns {Promise<Array>} - Failure patterns
   */
  async getPatterns(agentId, options = {}) {
    return new Promise((resolve, reject) => {
      let query = 'SELECT * FROM failure_patterns WHERE agent_id = ?';
      const params = [agentId];

      if (options.limit) {
        query += ' ORDER BY occurrences DESC LIMIT ?';
        params.push(options.limit);
      } else {
        query += ' ORDER BY created_at DESC';
      }

      this.db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const patterns = rows.map(row => ({
            pattern_id: row.id,
            pattern_type: row.pattern_type,
            description: row.description,
            occurrences: row.occurrences,
            test_cases: JSON.parse(row.test_cases || '[]'),
            common_input_features: JSON.parse(row.common_features || '[]'),
            common_failure_reasons: JSON.parse(row.failure_reasons || '[]'),
            created_at: row.created_at
          }));
          resolve(patterns);
        }
      });
    });
  }

  /**
   * Get recommendations for an agent
   * @param {string} agentId - Agent ID
   * @param {object} options - Query options
   * @returns {Promise<Array>} - Recommendations
   */
  async getRecommendations(agentId, options = {}) {
    return new Promise((resolve, reject) => {
      let query = 'SELECT * FROM recommendations WHERE agent_id = ?';
      const params = [agentId];

      if (options.status) {
        query += ' AND status = ?';
        params.push(options.status);
      }

      query += ' ORDER BY priority DESC, created_at DESC';

      if (options.limit) {
        query += ' LIMIT ?';
        params.push(options.limit);
      }

      this.db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const recommendations = rows.map(row => ({
            id: row.id,
            type: row.type,
            priority: row.priority,
            description: row.description,
            suggested_change: row.suggested_change,
            expected_improvement: row.expected_improvement,
            affected_tests: JSON.parse(row.affected_tests || '[]'),
            status: row.status,
            created_at: row.created_at,
            updated_at: row.updated_at
          }));
          resolve(recommendations);
        }
      });
    });
  }
}

// ============================================================================
// PATTERN ANALYZER CLASS (Task 7.1)
// ============================================================================

class PatternAnalyzer {
  /**
   * Analyze failures and identify patterns
   * @param {Array} testResults - Test results
   * @returns {Array} - Failure patterns
   */
  analyzeFailures(testResults) {
    const failures = testResults.filter(r => r.status === 'failed' || r.status === 'error');

    if (failures.length === 0) {
      return [];
    }

    // Cluster failures by similarity
    const clusters = this.clusterFailures(failures);

    // Convert clusters to patterns
    const patterns = clusters.map((cluster, index) => {
      const pattern = {
        pattern_id: uuidv4(),
        pattern_type: this.identifyPatternType(cluster),
        description: this.generatePatternDescription(cluster),
        occurrences: cluster.length,
        test_cases: cluster.map(f => f.test_case_id),
        common_input_features: this.extractCommonFeatures(cluster),
        common_failure_reasons: this.extractCommonFailureReasons(cluster)
      };

      return pattern;
    });

    // Sort by occurrences (most frequent first)
    patterns.sort((a, b) => b.occurrences - a.occurrences);

    return patterns;
  }

  /**
   * Cluster similar failures
   * @param {Array} failures - Failed test results
   * @returns {Array} - Clusters of similar failures
   */
  clusterFailures(failures) {
    if (failures.length === 0) {
      return [];
    }

    const clusters = [];
    const processed = new Set();

    failures.forEach((failure, index) => {
      if (processed.has(index)) {
        return;
      }

      const cluster = [failure];
      processed.add(index);

      // Find similar failures
      for (let i = index + 1; i < failures.length; i++) {
        if (processed.has(i)) {
          continue;
        }

        if (this.areSimilarFailures(failure, failures[i])) {
          cluster.push(failures[i]);
          processed.add(i);
        }
      }

      // Only create cluster if it has multiple failures or is significant
      if (cluster.length >= 2 || this.isSignificantFailure(failure)) {
        clusters.push(cluster);
      }
    });

    return clusters;
  }

  /**
   * Check if two failures are similar
   * @param {object} failure1 - First failure
   * @param {object} failure2 - Second failure
   * @returns {boolean} - True if similar
   */
  areSimilarFailures(failure1, failure2) {
    // Compare evaluation details
    const details1 = failure1.evaluation?.details || '';
    const details2 = failure2.evaluation?.details || '';

    if (details1 && details2) {
      const similarity = stringSimilarity.compareTwoStrings(details1, details2);
      if (similarity > 0.7) {
        return true;
      }
    }

    // Compare error messages
    if (failure1.error && failure2.error) {
      const errorSimilarity = stringSimilarity.compareTwoStrings(
        failure1.error.message,
        failure2.error.message
      );
      if (errorSimilarity > 0.8) {
        return true;
      }
    }

    // Compare test suite types
    if (failure1.suite_type === failure2.suite_type) {
      return true;
    }

    return false;
  }

  /**
   * Check if a failure is significant
   * @param {object} failure - Failure result
   * @returns {boolean} - True if significant
   */
  isSignificantFailure(failure) {
    // Failures from universal tests are always significant
    if (failure.suite_type === 'universal') {
      return true;
    }

    // Errors are always significant
    if (failure.status === 'error') {
      return true;
    }

    return false;
  }

  /**
   * Identify pattern type
   * @param {Array} cluster - Cluster of failures
   * @returns {string} - Pattern type
   */
  identifyPatternType(cluster) {
    // Check if all failures are from same suite type
    const suiteTypes = [...new Set(cluster.map(f => f.suite_type))];
    if (suiteTypes.length === 1) {
      return suiteTypes[0] === 'universal' ? 'universal_failure' : 'custom_failure';
    }

    // Check if all are errors
    const allErrors = cluster.every(f => f.status === 'error');
    if (allErrors) {
      return 'execution_error';
    }

    // Check for validation failures
    const hasValidationFailures = cluster.some(f =>
      f.evaluation?.details?.includes('match') ||
      f.evaluation?.details?.includes('contains')
    );
    if (hasValidationFailures) {
      return 'validation_failure';
    }

    return 'general_failure';
  }

  /**
   * Generate pattern description
   * @param {Array} cluster - Cluster of failures
   * @returns {string} - Pattern description
   */
  generatePatternDescription(cluster) {
    const patternType = this.identifyPatternType(cluster);

    switch (patternType) {
      case 'universal_failure':
        return `Universal test failures affecting ${cluster.length} test(s)`;
      case 'custom_failure':
        return `Custom test failures in ${cluster.length} test(s)`;
      case 'execution_error':
        return `Execution errors in ${cluster.length} test(s)`;
      case 'validation_failure':
        return `Output validation failures in ${cluster.length} test(s)`;
      default:
        return `General failures in ${cluster.length} test(s)`;
    }
  }

  /**
   * Extract common input features
   * @param {Array} cluster - Cluster of failures
   * @returns {Array} - Common features
   */
  extractCommonFeatures(cluster) {
    const features = [];

    // Extract common keywords from inputs
    const allInputs = cluster.map(f => {
      const input = f.input;
      if (typeof input === 'string') {
        return input;
      } else if (input && input.content) {
        return input.content;
      }
      return JSON.stringify(input);
    });

    // Find common words (simple approach)
    const wordCounts = {};
    allInputs.forEach(input => {
      const words = input.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 4);

      words.forEach(word => {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      });
    });

    // Get words that appear in most inputs
    const threshold = Math.ceil(cluster.length * 0.6);
    Object.entries(wordCounts).forEach(([word, count]) => {
      if (count >= threshold) {
        features.push(word);
      }
    });

    return features.slice(0, 10); // Limit to top 10
  }

  /**
   * Extract common failure reasons
   * @param {Array} cluster - Cluster of failures
   * @returns {Array} - Common failure reasons
   */
  extractCommonFailureReasons(cluster) {
    const reasons = [];

    // Extract from evaluation details
    cluster.forEach(failure => {
      if (failure.evaluation && failure.evaluation.details) {
        const details = failure.evaluation.details;

        if (details.includes('Exact match failed')) {
          reasons.push('exact_match_failed');
        }
        if (details.includes('Substring match')) {
          reasons.push('substring_match_failed');
        }
        if (details.includes('Pattern match failed')) {
          reasons.push('pattern_match_failed');
        }
        if (details.includes('Low coherence')) {
          reasons.push('low_coherence');
        }
        if (details.includes('Low relevance')) {
          reasons.push('low_relevance');
        }
        if (details.includes('Incomplete output')) {
          reasons.push('incomplete_output');
        }
        if (details.includes('Performance target not met')) {
          reasons.push('performance_issue');
        }
      }

      if (failure.error) {
        reasons.push('execution_error');
      }
    });

    // Return unique reasons
    return [...new Set(reasons)];
  }
}

// ============================================================================
// RECOMMENDATION ENGINE CLASS (Task 7.2)
// ============================================================================

class RecommendationEngine {
  /**
   * Generate recommendations from patterns
   * @param {Array} patterns - Failure patterns
   * @param {string} agentId - Agent ID
   * @returns {Array} - Recommendations
   */
  generateRecommendations(patterns, agentId) {
    const recommendations = [];

    patterns.forEach(pattern => {
      // Generate recommendations based on pattern type and frequency
      const patternRecs = this.generateRecommendationsForPattern(pattern, agentId);
      recommendations.push(...patternRecs);
    });

    // Prioritize recommendations
    return this.prioritizeRecommendations(recommendations);
  }

  /**
   * Generate recommendations for a specific pattern
   * @param {object} pattern - Failure pattern
   * @param {string} agentId - Agent ID
   * @returns {Array} - Recommendations
   */
  generateRecommendationsForPattern(pattern, agentId) {
    const recommendations = [];

    // High-frequency failures (>= 5 occurrences)
    if (pattern.occurrences >= 5) {
      // Prompt modification recommendation
      if (pattern.common_failure_reasons.includes('substring_match_failed') ||
          pattern.common_failure_reasons.includes('low_relevance')) {
        recommendations.push({
          id: uuidv4(),
          type: 'prompt_modification',
          priority: 'high',
          description: `Frequent output relevance issues detected (${pattern.occurrences} tests)`,
          suggested_change: this.generatePromptSuggestion(pattern),
          expected_improvement: `May improve output relevance and resolve ${pattern.occurrences} failing tests`,
          affected_tests: pattern.test_cases
        });
      }

      // Config change recommendation
      if (pattern.common_failure_reasons.includes('performance_issue')) {
        recommendations.push({
          id: uuidv4(),
          type: 'config_change',
          priority: 'high',
          description: `Performance issues detected (${pattern.occurrences} tests)`,
          suggested_change: 'Increase timeout threshold or optimize agent processing',
          expected_improvement: `May resolve ${pattern.occurrences} timeout failures`,
          affected_tests: pattern.test_cases
        });
      }

      // Model switch recommendation
      if (pattern.common_failure_reasons.includes('low_coherence') ||
          pattern.common_failure_reasons.includes('incomplete_output')) {
        recommendations.push({
          id: uuidv4(),
          type: 'model_switch',
          priority: 'medium',
          description: `Output quality issues detected (${pattern.occurrences} tests)`,
          suggested_change: 'Consider switching to a more capable model (e.g., GPT-4, Claude-2)',
          expected_improvement: `May improve output quality and coherence`,
          affected_tests: pattern.test_cases
        });
      }
    }

    // Medium-frequency failures (3-4 occurrences)
    if (pattern.occurrences >= 3 && pattern.occurrences < 5) {
      // Validation rule adjustment
      if (pattern.common_failure_reasons.includes('exact_match_failed') ||
          pattern.common_failure_reasons.includes('pattern_match_failed')) {
        recommendations.push({
          id: uuidv4(),
          type: 'validation_rule',
          priority: 'medium',
          description: `Validation rule issues detected (${pattern.occurrences} tests)`,
          suggested_change: 'Review and adjust validation rules for more flexibility',
          expected_improvement: `May resolve ${pattern.occurrences} validation failures`,
          affected_tests: pattern.test_cases
        });
      }
    }

    // Universal test failures (always high priority)
    if (pattern.pattern_type === 'universal_failure') {
      recommendations.push({
        id: uuidv4(),
        type: 'prompt_modification',
        priority: 'high',
        description: `Universal test failures detected - core functionality issue`,
        suggested_change: 'Review agent core functionality and system prompt',
        expected_improvement: `Critical: May restore basic agent functionality`,
        affected_tests: pattern.test_cases
      });
    }

    return recommendations;
  }

  /**
   * Generate prompt modification suggestion
   * @param {object} pattern - Failure pattern
   * @returns {string} - Prompt suggestion
   */
  generatePromptSuggestion(pattern) {
    const suggestions = [];

    if (pattern.common_input_features.length > 0) {
      suggestions.push(`Add explicit instructions to handle: ${pattern.common_input_features.slice(0, 3).join(', ')}`);
    }

    if (pattern.common_failure_reasons.includes('low_relevance')) {
      suggestions.push('Emphasize staying on topic and addressing the input directly');
    }

    if (pattern.common_failure_reasons.includes('incomplete_output')) {
      suggestions.push('Add instruction to provide complete and comprehensive responses');
    }

    if (pattern.common_failure_reasons.includes('low_coherence')) {
      suggestions.push('Add instruction to maintain logical flow and coherence');
    }

    return suggestions.length > 0
      ? suggestions.join('. ')
      : 'Review and refine system prompt based on failure patterns';
  }

  /**
   * Prioritize recommendations (Task 7.4)
   * @param {Array} recommendations - Recommendations
   * @returns {Array} - Prioritized recommendations
   */
  prioritizeRecommendations(recommendations) {
    // Calculate priority score for each recommendation
    recommendations.forEach(rec => {
      let score = 0;

      // Priority weight
      if (rec.priority === 'high') score += 100;
      else if (rec.priority === 'medium') score += 50;
      else score += 25;

      // Affected tests weight
      score += rec.affected_tests.length * 5;

      // Type weight (some types are more impactful)
      if (rec.type === 'prompt_modification') score += 20;
      else if (rec.type === 'model_switch') score += 15;
      else if (rec.type === 'config_change') score += 10;

      rec.priorityScore = score;
    });

    // Sort by priority score (highest first)
    recommendations.sort((a, b) => b.priorityScore - a.priorityScore);

    // Remove priority score from output
    recommendations.forEach(rec => delete rec.priorityScore);

    return recommendations;
  }
}

module.exports = FeedbackLoopService;
