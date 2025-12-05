/**
 * Integration Dimension Executor
 * 
 * Tests integration capabilities:
 * - Vector DB integration (RAG)
 * - MCP server integration (tool usage)
 * - Combined integration
 * - Context switching
 */

const BaseDimensionExecutor = require('./BaseDimensionExecutor');

class IntegrationExecutor extends BaseDimensionExecutor {
  constructor(db, evaluator, vectorDBAdapter, mcpAdapter) {
    super(db, evaluator);
    this.dimensionName = 'Integration Testing';
    this.vectorDBAdapter = vectorDBAdapter;
    this.mcpAdapter = mcpAdapter;
  }

  /**
   * Execute integration tests
   * @param {string} runId - Test run ID
   * @param {string} agentId - Agent ID
   * @param {string} model - Model ID
   * @param {object} dimension - Dimension configuration
   * @param {object} options - Execution options
   * @returns {Promise<object>} - Dimension result
   */
  async execute(runId, agentId, model, dimension, options) {
    console.log(`    Executing Integration Testing tests...`);

    // Load test questions for this dimension
    const testQuestions = await this.loadIntegrationTests();

    // Execute all tests
    const results = [];
    for (let i = 0; i < testQuestions.length; i++) {
      const testCase = testQuestions[i];
      
      console.log(`      [${i + 1}/${testQuestions.length}] ${testCase.id}: ${testCase.category}`);
      
      // Check if test requires specific integrations
      if (testCase.requires) {
        const available = await this.checkIntegrationAvailability(testCase.requires);
        if (!available) {
          console.log(`        ⏭️  Skipped (integration not available)`);
          results.push({
            ...testCase,
            status: 'skipped',
            reason: 'Integration not available'
          });
          continue;
        }
      }
      
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
   * Check if required integrations are available
   * @param {Array} requires - Required integrations
   * @returns {Promise<boolean>} - Availability status
   */
  async checkIntegrationAvailability(requires) {
    for (const requirement of requires) {
      if (requirement === 'vector_db' && !this.vectorDBAdapter) {
        return false;
      }
      if (requirement.startsWith('mcp_') && !this.mcpAdapter) {
        return false;
      }
    }
    return true;
  }

  /**
   * Execute agent with integration support
   * @param {string} agentId - Agent ID
   * @param {string} model - Model ID
   * @param {string} input - Test input
   * @param {object} options - Execution options
   * @returns {Promise<string>} - Agent output
   */
  async executeAgent(agentId, model, input, options) {
    const { timeout, mode } = options;

    // In demo mode, return mock response with integration simulation
    if (mode === 'demo') {
      return this.getMockIntegrationResponse(agentId, model, input);
    }

    // TODO: Implement real agent execution with integrations
    throw new Error('Real agent execution with integrations not yet implemented');
  }

  /**
   * Get mock integration response
   * @param {string} agentId - Agent ID
   * @param {string} model - Model ID
   * @param {string} input - Test input
   * @returns {string} - Mock response
   */
  getMockIntegrationResponse(agentId, model, input) {
    const inputLower = input.toLowerCase();

    // Vector DB queries
    if (inputLower.includes('policy') || inputLower.includes('knowledge base')) {
      return "Based on our company knowledge base, I found the following information: [Retrieved from Vector DB] Our API key policy requires all keys to be stored encrypted, rotated every 90 days, and never committed to version control.";
    }

    // MCP tool usage
    if (inputLower.includes('create') && inputLower.includes('github')) {
      return "I'll create a GitHub issue for you. [Using MCP Tool: github_create_issue] Issue created successfully: #123 'Fix authentication vulnerability'";
    }

    if (inputLower.includes('create') && inputLower.includes('jira')) {
      return "I'll create a Jira ticket. [Using MCP Tool: jira_create_ticket] Ticket created: PROJ-456 'Security vulnerability fix'";
    }

    // Combined integration
    if (inputLower.includes('find') && inputLower.includes('create')) {
      return "First, I'll search our documentation. [Vector DB Query] Found deployment documentation. Now creating a GitHub issue with the key steps. [MCP Tool: github_create_issue] Issue created successfully with deployment steps.";
    }

    // Context switching
    if (inputLower.includes('instead') || inputLower.includes('actually')) {
      return "Understood, switching context. Let me analyze the new information you've provided.";
    }

    return super.getMockAgentResponse(agentId, model, input);
  }

  /**
   * Load integration test questions
   * @returns {Array} - Test questions
   */
  async loadIntegrationTests() {
    return [
      // Q021: Tool Usage - GitHub
      {
        id: 'Q021',
        category: 'Tool Usage',
        dimension: 'Integration',
        question: 'Create a GitHub issue titled \'Fix authentication vulnerability\'',
        requires: ['mcp_github'],
        expected_behavior: 'use_github_tool',
        validation: {
          contains: ['github', 'issue', 'created'],
          min_length: 30
        }
      },

      // Q022: Tool Usage - Vector DB
      {
        id: 'Q022',
        category: 'Tool Usage',
        dimension: 'Integration',
        question: 'Search our knowledge base for API security best practices',
        requires: ['vector_db'],
        expected_behavior: 'use_vector_db',
        validation: {
          contains: ['knowledge base', 'api', 'security'],
          min_length: 50
        }
      },

      // Q023: Tool Usage - Combined
      {
        id: 'Q023',
        category: 'Tool Usage',
        dimension: 'Integration',
        question: 'Find our deployment docs and create a Jira ticket with the steps',
        requires: ['vector_db', 'mcp_jira'],
        expected_behavior: 'use_multiple_tools',
        validation: {
          contains: ['deployment', 'jira', 'ticket'],
          min_length: 50
        }
      },

      // Q040: Context Switching
      {
        id: 'Q040',
        category: 'Context Switching',
        dimension: 'Integration',
        question: 'Explain SQL injection. Now tell me about XSS instead.',
        expected_behavior: 'switch_context',
        validation: {
          contains: ['xss', 'cross-site'],
          not_contains: ['sql injection'],
          min_length: 40
        }
      },

      // Q041: Context Switching
      {
        id: 'Q041',
        category: 'Context Switching',
        dimension: 'Integration',
        question: 'Review this Python code for security issues. Actually, can you review this JavaScript code instead?',
        expected_behavior: 'switch_language',
        validation: {
          contains: ['javascript'],
          min_length: 30
        }
      }
    ];
  }
}

module.exports = IntegrationExecutor;
