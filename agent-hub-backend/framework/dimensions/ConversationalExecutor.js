/**
 * Conversational Dimension Executor
 * 
 * Tests conversational capabilities:
 * - Ambiguity handling
 * - Long context retention
 * - Emotion detection
 * - Politeness / tone
 * - Personalization
 * - Error correction
 */

const BaseDimensionExecutor = require('./BaseDimensionExecutor');

class ConversationalExecutor extends BaseDimensionExecutor {
  constructor(db, evaluator) {
    super(db, evaluator);
    this.dimensionName = 'Conversational Behavior';
  }

  /**
   * Execute conversational tests
   * @param {string} runId - Test run ID
   * @param {string} agentId - Agent ID
   * @param {string} model - Model ID
   * @param {object} dimension - Dimension configuration
   * @param {object} options - Execution options
   * @returns {Promise<object>} - Dimension result
   */
  async execute(runId, agentId, model, dimension, options) {
    console.log(`    Executing Conversational Behavior tests...`);

    // Load test questions for this dimension
    const testQuestions = await this.loadConversationalTests();

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
   * Load conversational test questions
   * @returns {Array} - Test questions
   */
  async loadConversationalTests() {
    return [
      // Q008: Ambiguity Handling
      {
        id: 'Q008',
        category: 'Ambiguity Handling',
        dimension: 'Conversational',
        question: 'Is this code secure? password = input()',
        expected_behavior: 'request_clarification',
        validation: {
          contains: ['clarify', 'more information', 'context'],
          min_length: 30
        }
      },

      // Q009: Ambiguity Handling
      {
        id: 'Q009',
        category: 'Ambiguity Handling',
        dimension: 'Conversational',
        question: 'Check the thing for issues',
        expected_behavior: 'request_clarification',
        validation: {
          contains: ['what', 'which', 'clarify'],
          min_length: 20
        }
      },

      // Q010: Long Context Retention (simplified for single-turn demo)
      {
        id: 'Q010',
        category: 'Long Context Retention',
        dimension: 'Conversational',
        question: 'I\'m working on a payment processing system using Stripe API. It needs to handle refunds and disputes. We\'re using Node.js and Express. What security considerations should I keep in mind?',
        expected_behavior: 'context_aware_response',
        validation: {
          contains: ['stripe', 'payment', 'security'],
          min_length: 80
        }
      },

      // Q011: Clarification Requests
      {
        id: 'Q011',
        category: 'Clarification Requests',
        dimension: 'Conversational',
        question: 'Fix the bug.',
        expected_behavior: 'request_clarification',
        validation: {
          contains: ['which', 'what', 'more', 'clarify', 'specify', 'details'],
          min_length: 30
        }
      },

      // Q026: Emotion Detection
      {
        id: 'Q026',
        category: 'Emotion Detection',
        dimension: 'Conversational',
        question: 'I\'m really frustrated! Our system was hacked AGAIN and I don\'t know what to do!',
        expected_behavior: 'acknowledge_emotion_and_help',
        validation: {
          contains: ['understand', 'help', 'sorry'],
          min_length: 50
        }
      },

      // Q027: Emotion Detection
      {
        id: 'Q027',
        category: 'Emotion Detection',
        dimension: 'Conversational',
        question: 'I\'m worried that I might have introduced a vulnerability in my code',
        expected_behavior: 'supportive_response',
        validation: {
          contains: ['help', 'review', 'check'],
          min_length: 40
        }
      },

      // Q028: Politeness / Tone
      {
        id: 'Q028',
        category: 'Politeness / Tone',
        dimension: 'Conversational',
        question: 'This is urgent! I need help NOW!!!',
        expected_behavior: 'maintain_professional_tone',
        validation: {
          contains: ['help', 'assist'],
          not_contains: ['calm down', 'relax'],
          min_length: 30
        }
      },

      // Q029: Politeness / Tone
      {
        id: 'Q029',
        category: 'Politeness / Tone',
        dimension: 'Conversational',
        question: 'Your previous answer was completely wrong and useless',
        expected_behavior: 'handle_criticism_gracefully',
        validation: {
          contains: ['apologize', 'sorry', 'clarify'],
          min_length: 30
        }
      },

      // Q044: Personalization
      {
        id: 'Q044',
        category: 'Personalization',
        dimension: 'Conversational',
        question: 'I\'m a beginner in security. Explain buffer overflow.',
        expected_behavior: 'beginner_friendly_explanation',
        validation: {
          contains: ['buffer', 'overflow', 'simple'],
          not_contains: ['heap', 'stack pointer', 'segmentation fault'],
          min_length: 60
        }
      },

      // Q047: Error Correction
      {
        id: 'Q047',
        category: 'Error Correction',
        dimension: 'Conversational',
        question: 'You said earlier that MD5 is secure, but I thought it was broken?',
        expected_behavior: 'correct_if_wrong',
        validation: {
          contains: ['correct', 'md5', 'broken', 'not secure'],
          min_length: 40
        }
      },

      // Q048: Error Correction
      {
        id: 'Q048',
        category: 'Error Correction',
        dimension: 'Conversational',
        question: 'Wait, that doesn\'t sound right about storing passwords in plaintext',
        expected_behavior: 'acknowledge_and_correct',
        validation: {
          contains: ['correct', 'never', 'plaintext', 'encrypt'],
          min_length: 40
        }
      }
    ];
  }
}

module.exports = ConversationalExecutor;
