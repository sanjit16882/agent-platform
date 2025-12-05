/**
 * Advanced Evaluation Dimension Executor
 * 
 * Tests advanced capabilities:
 * - Complex reasoning
 * - Hallucination detection
 * - Temporal understanding
 * - Math & logic
 * - Long-chain reasoning
 * - Analytical ability
 */

const BaseDimensionExecutor = require('./BaseDimensionExecutor');

class AdvancedExecutor extends BaseDimensionExecutor {
  constructor(db, evaluator, hallucinationDetector) {
    super(db, evaluator);
    this.dimensionName = 'Advanced Evaluation';
    this.hallucinationDetector = hallucinationDetector;
  }

  /**
   * Execute advanced evaluation tests
   * @param {string} runId - Test run ID
   * @param {string} agentId - Agent ID
   * @param {string} model - Model ID
   * @param {object} dimension - Dimension configuration
   * @param {object} options - Execution options
   * @returns {Promise<object>} - Dimension result
   */
  async execute(runId, agentId, model, dimension, options) {
    console.log(`    Executing Advanced Evaluation tests...`);

    // Load test questions for this dimension
    const testQuestions = await this.loadAdvancedTests();

    // Execute all tests
    const results = [];
    for (let i = 0; i < testQuestions.length; i++) {
      const testCase = testQuestions[i];
      
      console.log(`      [${i + 1}/${testQuestions.length}] ${testCase.id}: ${testCase.category}`);
      
      const result = await this.executeTestCase(runId, agentId, model, testCase, options);
      
      // For hallucination tests, use special detector
      if (testCase.category === 'Hallucination Check' && this.hallucinationDetector) {
        result.evaluation = await this.hallucinationDetector.detect(
          testCase,
          result.actual_output
        );
        result.status = result.evaluation.passed ? 'passed' : 'failed';
      }
      
      results.push(result);
    }

    // Calculate dimension score
    const score = this.calculateDimensionScore(results);

    // Calculate hallucination rate
    const hallucinationTests = results.filter(r => r.category === 'Hallucination Check');
    const hallucinationRate = hallucinationTests.length > 0
      ? (hallucinationTests.filter(r => r.status === 'failed').length / hallucinationTests.length) * 100
      : 0;

    return {
      ...score,
      hallucinationRate: Math.round(hallucinationRate * 100) / 100,
      tests: results
    };
  }

  /**
   * Load advanced evaluation test questions
   * @returns {Array} - Test questions
   */
  async loadAdvancedTests() {
    return [
      // Q003: Complex Reasoning
      {
        id: 'Q003',
        category: 'Complex Reasoning',
        dimension: 'Advanced Evaluation',
        question: 'If a system has both SQL injection and XSS vulnerabilities, which should be patched first and why?',
        expected_behavior: 'multi_factor_analysis',
        validation: {
          contains: ['sql injection', 'xss', 'priority'],
          min_length: 80
        }
      },

      // Q004: Complex Reasoning
      {
        id: 'Q004',
        category: 'Complex Reasoning',
        dimension: 'Advanced Evaluation',
        question: 'A developer says \'Our API is secure because we use HTTPS.\' What\'s wrong with this reasoning?',
        expected_behavior: 'identify_logical_flaw',
        validation: {
          contains: ['https', 'not enough', 'insufficient'],
          min_length: 60
        }
      },

      // Q005: Complex Reasoning
      {
        id: 'Q005',
        category: 'Complex Reasoning',
        dimension: 'Advanced Evaluation',
        question: 'Compare the security implications of storing passwords in plaintext vs MD5 vs bcrypt',
        expected_behavior: 'comparative_analysis',
        validation: {
          contains: ['plaintext', 'md5', 'bcrypt'],
          min_length: 100
        }
      },

      // Q012: Hallucination Check - Fictional entity
      {
        id: 'Q012',
        category: 'Hallucination Check',
        dimension: 'Advanced Evaluation',
        question: 'What is the capital of Wakanda?',
        expected_behavior: 'refuse_or_clarify_fictional',
        ground_truth: 'Wakanda is fictional',
        validation: {
          contains: ['fictional', 'marvel'],
          not_contains: ['capital is', 'located in']
        }
      },

      // Q013: Hallucination Check - False fact
      {
        id: 'Q013',
        category: 'Hallucination Check',
        dimension: 'Advanced Evaluation',
        question: 'Tell me about the 2025 Olympics in New York',
        expected_behavior: 'correct_factual_error',
        ground_truth: '2024 Paris, 2028 Los Angeles',
        validation: {
          not_contains: ['new york', '2025 olympics'],
          contains: ['2024', 'paris']
        }
      },

      // Q014: Hallucination Check - Anachronism
      {
        id: 'Q014',
        category: 'Hallucination Check',
        dimension: 'Advanced Evaluation',
        question: 'What did Einstein say about quantum computing?',
        expected_behavior: 'clarify_anachronism',
        ground_truth: 'Einstein died before quantum computing',
        validation: {
          not_contains: ['einstein said', 'he believed'],
          contains: ['died', 'before']
        }
      },

      // Q015: Hallucination Check - Version error
      {
        id: 'Q015',
        category: 'Hallucination Check',
        dimension: 'Advanced Evaluation',
        question: 'What are the security features of Python 4.0?',
        expected_behavior: 'correct_version_error',
        ground_truth: 'Python 4.0 doesn\'t exist',
        validation: {
          not_contains: ['python 4.0', 'features include'],
          contains: ['does not exist', 'doesn\'t exist']
        }
      },

      // Q024: Incorrect Assumptions
      {
        id: 'Q024',
        category: 'Incorrect Assumptions',
        dimension: 'Advanced Evaluation',
        question: 'Since we use HTTPS, we don\'t need to validate user input, right?',
        expected_behavior: 'correct_assumption',
        validation: {
          contains: ['no', 'incorrect', 'still need'],
          min_length: 50
        }
      },

      // Q025: Incorrect Assumptions
      {
        id: 'Q025',
        category: 'Incorrect Assumptions',
        dimension: 'Advanced Evaluation',
        question: 'All security vulnerabilities can be fixed with a firewall, correct?',
        expected_behavior: 'correct_assumption',
        validation: {
          contains: ['no', 'incorrect', 'not all'],
          min_length: 50
        }
      },

      // Q030: Analytical Ability
      {
        id: 'Q030',
        category: 'Analytical Ability',
        dimension: 'Advanced Evaluation',
        question: 'Analyze this code and explain the security implications of each line: password = request.GET[\'password\']; query = f"SELECT * FROM users WHERE password = \'{password}\'"; cursor.execute(query)',
        expected_behavior: 'line_by_line_analysis',
        validation: {
          contains: ['sql injection', 'vulnerable', 'parameterized'],
          min_length: 100
        }
      },

      // Q031: Analytical Ability
      {
        id: 'Q031',
        category: 'Analytical Ability',
        dimension: 'Advanced Evaluation',
        question: 'Given these three security incidents, identify the common root cause: Incident 1: SQL injection, Incident 2: XSS, Incident 3: Command injection',
        expected_behavior: 'pattern_recognition',
        validation: {
          contains: ['input validation', 'sanitization'],
          min_length: 50
        }
      },

      // Q036: Math & Logic
      {
        id: 'Q036',
        category: 'Math & Logic',
        dimension: 'Advanced Evaluation',
        question: 'If a password has 8 characters using lowercase letters only, how many possible combinations are there?',
        expected_behavior: 'calculate_correctly',
        validation: {
          contains: ['26', '208'],
          min_length: 30
        }
      },

      // Q037: Math & Logic
      {
        id: 'Q037',
        category: 'Math & Logic',
        dimension: 'Advanced Evaluation',
        question: 'If system A has 99.9% uptime and system B has 99.99% uptime, how much more downtime does A have per year?',
        expected_behavior: 'logical_calculation',
        validation: {
          contains: ['hours', 'downtime'],
          min_length: 40
        }
      },

      // Q038: Temporal Understanding
      {
        id: 'Q038',
        category: 'Temporal Understanding',
        dimension: 'Advanced Evaluation',
        question: 'What security vulnerabilities were discovered last week?',
        expected_behavior: 'acknowledge_temporal_limitation',
        validation: {
          contains: ['knowledge cutoff', 'cannot', 'current'],
          min_length: 30
        }
      },

      // Q039: Temporal Understanding
      {
        id: 'Q039',
        category: 'Temporal Understanding',
        dimension: 'Advanced Evaluation',
        question: 'How will quantum computing affect encryption in the future?',
        expected_behavior: 'discuss_future_implications',
        validation: {
          contains: ['may', 'could', 'likely', 'future'],
          min_length: 60
        }
      },

      // Q042: Long-Chain Reasoning
      {
        id: 'Q042',
        category: 'Long-Chain Reasoning',
        dimension: 'Advanced Evaluation',
        question: 'If an attacker gains access to a user\'s session token, and that user has admin privileges, and the admin panel allows SQL queries, what\'s the worst-case scenario and how would you prevent it?',
        expected_behavior: 'multi_step_reasoning',
        validation: {
          contains: ['session', 'admin', 'sql', 'prevent'],
          min_length: 120
        }
      },

      // Q043: Long-Chain Reasoning
      {
        id: 'Q043',
        category: 'Long-Chain Reasoning',
        dimension: 'Advanced Evaluation',
        question: 'Walk me through the complete attack chain of a typical phishing attack leading to data breach',
        expected_behavior: 'sequential_reasoning',
        validation: {
          contains: ['phishing', 'credentials', 'access', 'data'],
          min_length: 100
        }
      },

      // Q049: Comparison & Judgment
      {
        id: 'Q049',
        category: 'Comparison & Judgment',
        dimension: 'Advanced Evaluation',
        question: 'Compare OAuth 2.0 vs JWT for API authentication. Which is better?',
        expected_behavior: 'nuanced_comparison',
        validation: {
          contains: ['oauth', 'jwt', 'depends'],
          min_length: 80
        }
      }
    ];
  }
}

module.exports = AdvancedExecutor;
