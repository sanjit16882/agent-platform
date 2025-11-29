/**
 * Functional Dimension Executor
 * 
 * Tests basic functional validation:
 * - Basic understanding
 * - Multi-step instructions
 * - Domain expertise
 * - Analytical ability
 */

const BaseDimensionExecutor = require('./BaseDimensionExecutor');

class FunctionalExecutor extends BaseDimensionExecutor {
  constructor(db, evaluator) {
    super(db, evaluator);
    this.dimensionName = 'Functional Validation';
  }

  /**
   * Execute functional validation tests
   * @param {string} runId - Test run ID
   * @param {string} agentId - Agent ID
   * @param {string} model - Model ID
   * @param {object} dimension - Dimension configuration
   * @param {object} options - Execution options
   * @returns {Promise<object>} - Dimension result
   */
  async execute(runId, agentId, model, dimension, options) {
    console.log(`    Executing Functional Validation tests...`);

    // Load test questions for this dimension
    const testQuestions = await this.loadFunctionalTests();

    // Execute all tests
    const results = [];
    for (let i = 0; i < testQuestions.length; i++) {
      const testCase = testQuestions[i];
      
      console.log(`      [${i + 1}/${testQuestions.length}] ${testCase.id}: ${testCase.category}`);
      
      const result = await this.executeTestCase(runId, agentId, model, testCase, options);
      results.push(result);
    }

    // Calculate dimension score
    const score = this.calculateDimensionScore(results);

    return {
      ...score,
      tests: results
    };
  }

  /**
   * Load functional validation test questions
   * @returns {Array} - Test questions
   */
  async loadFunctionalTests() {
    return [
      // Q001: Basic Understanding
      {
        id: 'Q001',
        category: 'Basic Understanding',
        dimension: 'Functional',
        question: 'What is your primary function as an AI agent?',
        expected_behavior: 'clear_self_description',
        validation: {
          contains: ['assist', 'help'],
          min_length: 20
        }
      },

      // Q002: Basic Understanding
      {
        id: 'Q002',
        category: 'Basic Understanding',
        dimension: 'Functional',
        question: 'Explain what SQL injection is in simple terms',
        expected_behavior: 'accurate_explanation',
        validation: {
          contains: ['sql', 'injection', 'security'],
          min_length: 50
        }
      },

      // Q006: Multi-step Instructions
      {
        id: 'Q006',
        category: 'Multi-step Instructions',
        dimension: 'Functional',
        question: 'First, explain what a buffer overflow is. Then, provide a code example. Finally, suggest how to prevent it.',
        expected_behavior: 'follow_sequence',
        validation: {
          contains: ['buffer', 'overflow', 'example', 'prevent'],
          min_length: 100
        }
      },

      // Q007: Multi-step Instructions
      {
        id: 'Q007',
        category: 'Multi-step Instructions',
        dimension: 'Functional',
        question: 'Analyze this code, identify vulnerabilities, rank them by severity, and provide fixes for the top 2: SELECT * FROM users WHERE id = "' + "' + userId + '" + '"; eval(userInput);',
        expected_behavior: 'structured_multi_step_response',
        validation: {
          contains: ['sql injection', 'eval', 'vulnerability', 'fix'],
          min_length: 100
        }
      },

      // Q032: Domain Expertise - Finance
      {
        id: 'Q032',
        category: 'Domain Expertise - Finance',
        dimension: 'Functional',
        question: 'What are the PCI DSS requirements for storing credit card data?',
        expected_behavior: 'demonstrate_domain_knowledge',
        validation: {
          contains: ['encryption', 'pci'],
          min_length: 50
        }
      },

      // Q033: Domain Expertise - Healthcare
      {
        id: 'Q033',
        category: 'Domain Expertise - Healthcare',
        dimension: 'Functional',
        question: 'What is HIPAA and what are the key requirements for healthcare data security?',
        expected_behavior: 'demonstrate_healthcare_knowledge',
        validation: {
          contains: ['hipaa', 'health', 'privacy', 'security'],
          min_length: 60
        }
      },

      // Q034: Domain Expertise - Tech
      {
        id: 'Q034',
        category: 'Domain Expertise - Tech',
        dimension: 'Functional',
        question: 'Explain the OWASP Top 10 and why it matters',
        expected_behavior: 'demonstrate_tech_knowledge',
        validation: {
          contains: ['owasp', 'security', 'vulnerabilities'],
          min_length: 50
        }
      },

      // Q035: Domain Expertise - Tech
      {
        id: 'Q035',
        category: 'Domain Expertise - Tech',
        dimension: 'Functional',
        question: 'What\'s the difference between symmetric and asymmetric encryption, and when should each be used?',
        expected_behavior: 'technical_explanation',
        validation: {
          contains: ['symmetric', 'asymmetric', 'encryption'],
          min_length: 80
        }
      }
    ];
  }
}

module.exports = FunctionalExecutor;
