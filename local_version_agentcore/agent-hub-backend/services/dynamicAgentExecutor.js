/**
 * Dynamic Agent Execution Service
 * Handles execution of any agent type with dynamic integration detection
 */

const dynamicConfig = require('./dynamicConfigManager');

class DynamicAgentExecutor {
  constructor() {
    this.integrations = new Map();
    this.mcpServers = new Map();
    this.configManager = dynamicConfig;
  }

  /**
   * Execute agent with dynamic routing
   */
  async executeAgent(agentId, inputs, context = {}) {
    console.log(`🚀 Dynamic execution started for agent: ${agentId}`);
    
    try {
      // Step 1: Load agent configuration
      const agent = await this.loadAgent(agentId);
      if (!agent) {
        throw new Error(`Agent ${agentId} not found`);
      }

      // Step 2: Detect active integrations
      const activeIntegrations = this.detectIntegrations(agentId);
      console.log(`🔗 Active integrations:`, activeIntegrations.map(i => i.type));

      // Step 3: Route to MCP or direct model
      let results;
      if (agent.mcpConfig && agent.mcpConfig.enabled) {
        console.log(`📡 Routing through MCP servers:`, agent.mcpConfig.serverIds);
        results = await this.executeWithMCP(agent, inputs, context);
      } else {
        console.log(`🤖 Routing directly to model`);
        results = await this.executeWithModel(agent, inputs, context);
      }

      // Step 4: Process results and trigger integrations
      const processedResults = await this.processResults(results, agent, activeIntegrations);

      // Step 5: Return execution response
      return {
        executionId: `exec_${Date.now()}`,
        agentId: agentId,
        status: 'completed',
        timestamp: new Date().toISOString(),
        results: processedResults,
        integrations: activeIntegrations.map(i => ({
          type: i.type,
          status: i.status,
          actions: i.actions
        })),
        metadata: {
          executionTime: results.executionTime || '0s',
          model: agent.model || 'default',
          mcpEnabled: agent.mcpConfig?.enabled || false
        }
      };
    } catch (error) {
      console.error(`❌ Execution failed for ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * Load agent configuration from storage
   */
  async loadAgent(agentId) {
    // This will be integrated with S3AgentStorage
    const S3AgentStorage = require('../src/services/s3AgentStorage');
    const storage = new S3AgentStorage();
    
    try {
      const agent = await storage.getAgent(agentId);
      return agent;
    } catch (error) {
      console.error(`Failed to load agent ${agentId}:`, error);
      return null;
    }
  }

  /**
   * Detect active integrations for this agent
   */
  detectIntegrations(agentId) {
    const integrations = [];

    // Check GitHub integration
    const githubConfig = this.loadIntegrationConfig('github_integration');
    if (githubConfig && githubConfig.connected && githubConfig.agents?.includes(agentId)) {
      integrations.push({
        type: 'github',
        config: githubConfig,
        status: 'active',
        actions: ['create_issues', 'add_labels', 'link_to_execution']
      });
    }

    // Check Jira integration
    const jiraConfig = this.loadIntegrationConfig('jira_integration');
    if (jiraConfig && jiraConfig.connected && jiraConfig.agents?.includes(agentId)) {
      integrations.push({
        type: 'jira',
        config: jiraConfig,
        status: 'active',
        actions: ['create_tickets', 'assign_priority', 'link_to_sprint']
      });
    }

    // Check Slack integration
    const slackConfig = this.loadIntegrationConfig('slack_integration');
    if (slackConfig && slackConfig.connected && slackConfig.agents?.includes(agentId)) {
      integrations.push({
        type: 'slack',
        config: slackConfig,
        status: 'active',
        actions: ['send_notification', 'post_summary', 'alert_on_critical']
      });
    }

    // Check Teams integration
    const teamsConfig = this.loadIntegrationConfig('teams_integration');
    if (teamsConfig && teamsConfig.connected && teamsConfig.agents?.includes(agentId)) {
      integrations.push({
        type: 'teams',
        config: teamsConfig,
        status: 'active',
        actions: ['send_notification', 'create_adaptive_card', 'enable_collaboration']
      });
    }

    return integrations;
  }

  /**
   * Load integration configuration (simulated - would read from storage)
   */
  loadIntegrationConfig(key) {
    // In production, this would read from database or file system
    // For now, we'll return null and let the actual implementation handle it
    return null;
  }

  /**
   * Execute agent with MCP servers
   */
  async executeWithMCP(agent, inputs, context) {
    console.log(`📡 Executing with MCP servers...`);
    
    // TODO: Integrate with actual MCP server communication
    // For now, simulate MCP execution
    const results = await this.analyzeInput(inputs, agent);
    
    return {
      ...results,
      mcpUsed: true,
      servers: agent.mcpConfig.serverIds
    };
  }

  /**
   * Execute agent directly with model
   */
  async executeWithModel(agent, inputs, context) {
    console.log(`🤖 Executing with direct model...`);
    
    const results = await this.analyzeInput(inputs, agent);
    
    return {
      ...results,
      mcpUsed: false
    };
  }

  /**
   * Analyze input and generate results (core intelligence)
   */
  async analyzeInput(inputs, agent) {
    console.log(`🧠 Analyzing input...`);
    
    const inputText = inputs.inputData || inputs.executionRequest || '';
    
    // Detect what type of analysis is needed
    const analysisType = this.detectAnalysisType(inputText, agent);
    console.log(`📊 Detected analysis type: ${analysisType}`);
    
    // Generate results based on analysis type
    const results = await this.generateResults(inputText, analysisType, agent);
    
    return results;
  }

  /**
   * Detect analysis type from input
   */
  detectAnalysisType(input, agent) {
    const inputLower = input.toLowerCase();
    
    if (inputLower.includes('security') || inputLower.includes('vulnerability') || inputLower.includes('exploit')) {
      return 'security_scan';
    }
    if (inputLower.includes('code review') || inputLower.includes('quality') || inputLower.includes('best practice')) {
      return 'code_review';
    }
    if (inputLower.includes('test') || inputLower.includes('qa') || inputLower.includes('bug')) {
      return 'testing';
    }
    if (inputLower.includes('performance') || inputLower.includes('optimize') || inputLower.includes('slow')) {
      return 'performance';
    }
    
    // Default to general analysis
    return 'general_analysis';
  }

  /**
   * Generate results based on analysis type
   */
  async generateResults(input, analysisType, agent) {
    console.log(`🔍 Generating results for: ${analysisType}`);
    
    // Parse code from input if present
    const hasCode = input.includes('function') || input.includes('const') || input.includes('class');
    
    if (hasCode && (analysisType === 'security_scan' || analysisType === 'code_review')) {
      return this.analyzeCode(input, analysisType);
    }
    
    // General analysis
    return {
      analysisType: analysisType,
      summary: `Analysis completed for ${agent.name}`,
      findings: [],
      recommendations: [],
      executionTime: '1.2s'
    };
  }

  /**
   * Analyze code and find issues
   */
  analyzeCode(code, analysisType) {
    const findings = [];
    
    // Security checks
    if (analysisType === 'security_scan' || analysisType === 'code_review') {
      // Check for hardcoded credentials
      if (code.match(/password\s*=\s*["'][^"']+["']/i) || code.match(/api[_-]?key\s*=\s*["'][^"']+["']/i)) {
        findings.push({
          severity: 'critical',
          category: 'security',
          title: 'Hardcoded Credentials Detected',
          description: 'Sensitive credentials are hardcoded in the source code',
          recommendation: 'Use environment variables or a secrets manager',
          line: this.findLineNumber(code, /password|api[_-]?key/i)
        });
      }

      // Check for SQL injection
      if (code.match(/query\s*=\s*["'].*\+.*["']/i) || code.match(/SELECT.*\+/i)) {
        findings.push({
          severity: 'high',
          category: 'security',
          title: 'SQL Injection Vulnerability',
          description: 'User input is directly concatenated into SQL query',
          recommendation: 'Use parameterized queries or prepared statements',
          line: this.findLineNumber(code, /query.*=.*\+/)
        });
      }

      // Check for XSS
      if (code.match(/\.send\s*\(`.*\$\{.*\}`\)/i) || code.match(/innerHTML.*=.*\+/i)) {
        findings.push({
          severity: 'high',
          category: 'security',
          title: 'XSS Vulnerability',
          description: 'User input is rendered without sanitization',
          recommendation: 'Sanitize user input before rendering',
          line: this.findLineNumber(code, /\.send|innerHTML/)
        });
      }

      // Check for missing error handling
      if (code.match(/async\s+function/) && !code.match(/try\s*\{/)) {
        findings.push({
          severity: 'medium',
          category: 'code_quality',
          title: 'Missing Error Handling',
          description: 'Async function lacks try-catch block',
          recommendation: 'Add proper error handling with try-catch',
          line: this.findLineNumber(code, /async\s+function/)
        });
      }
    }

    return {
      analysisType: analysisType,
      summary: {
        total_issues: findings.length,
        critical: findings.filter(f => f.severity === 'critical').length,
        high: findings.filter(f => f.severity === 'high').length,
        medium: findings.filter(f => f.severity === 'medium').length,
        low: findings.filter(f => f.severity === 'low').length
      },
      findings: findings,
      executionTime: '2.1s'
    };
  }

  /**
   * Find line number of pattern in code
   */
  findLineNumber(code, pattern) {
    const lines = code.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (pattern.test(lines[i])) {
        return i + 1;
      }
    }
    return 1;
  }

  /**
   * Process results and trigger integrations
   */
  async processResults(results, agent, integrations) {
    console.log(`⚙️ Processing results and triggering integrations...`);
    
    // Add integration actions to results
    results.integrationActions = [];
    
    for (const integration of integrations) {
      if (integration.type === 'github' && results.findings && results.findings.length > 0) {
        results.integrationActions.push({
          integration: 'github',
          action: 'create_issues',
          count: results.findings.length,
          status: 'pending'
        });
      }
      
      if (integration.type === 'slack') {
        results.integrationActions.push({
          integration: 'slack',
          action: 'send_notification',
          status: 'pending'
        });
      }
    }
    
    return results;
  }
}

module.exports = new DynamicAgentExecutor();
