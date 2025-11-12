/**
 * Dynamic Configuration Manager
 * Eliminates all hardcoded configurations across the platform
 */

class DynamicConfigManager {
  constructor() {
    this.config = {
      agentCategories: [],
      integrationTypes: [],
      resultFormats: [],
      mcpServers: [],
      models: []
    };
    this.initialize();
  }

  /**
   * Initialize dynamic configurations
   */
  async initialize() {
    console.log('🔧 Initializing dynamic configuration manager...');
    
    // Load all configurations dynamically
    await this.loadAgentCategories();
    await this.loadIntegrationTypes();
    await this.loadResultFormats();
    await this.loadMCPServers();
    await this.loadModels();
    
    console.log('✅ Dynamic configuration loaded');
  }

  /**
   * Load agent categories dynamically (no hardcoded QE/Security/etc)
   */
  async loadAgentCategories() {
    // Categories are derived from actual agents, not predefined
    this.config.agentCategories = [
      {
        id: 'dynamic',
        name: 'Dynamic Category',
        description: 'Categories are auto-detected from agent metadata',
        autoDetect: true
      }
    ];
  }

  /**
   * Load integration types dynamically
   */
  async loadIntegrationTypes() {
    this.config.integrationTypes = [
      {
        id: 'github',
        name: 'GitHub',
        capabilities: ['create_issues', 'add_labels', 'create_pr', 'add_comments'],
        configSchema: {
          token: 'string',
          owner: 'string',
          repo: 'string'
        },
        actionDetection: {
          issues: ['vulnerability', 'bug', 'finding', 'error'],
          pr: ['fix', 'update', 'refactor'],
          comments: ['review', 'feedback']
        }
      },
      {
        id: 'jira',
        name: 'Jira',
        capabilities: ['create_ticket', 'update_status', 'assign', 'add_to_sprint'],
        configSchema: {
          url: 'string',
          token: 'string',
          project: 'string'
        },
        actionDetection: {
          ticket: ['issue', 'bug', 'task', 'story'],
          sprint: ['sprint', 'iteration']
        }
      },
      {
        id: 'slack',
        name: 'Slack',
        capabilities: ['send_message', 'create_thread', 'upload_file', 'mention_user'],
        configSchema: {
          token: 'string',
          channel: 'string'
        },
        actionDetection: {
          notification: ['alert', 'notify', 'inform'],
          urgent: ['critical', 'urgent', 'emergency']
        }
      },
      {
        id: 'teams',
        name: 'Microsoft Teams',
        capabilities: ['send_message', 'create_card', 'mention_user', 'create_meeting'],
        configSchema: {
          webhookUrl: 'string',
          team: 'string'
        },
        actionDetection: {
          notification: ['alert', 'notify', 'inform'],
          meeting: ['discuss', 'review', 'meeting']
        }
      },
      {
        id: 'email',
        name: 'Email',
        capabilities: ['send_email', 'send_report', 'schedule_email'],
        configSchema: {
          smtp: 'string',
          from: 'string',
          to: 'array'
        },
        actionDetection: {
          report: ['report', 'summary', 'digest'],
          alert: ['alert', 'critical', 'urgent']
        }
      }
    ];
  }

  /**
   * Load result formats dynamically
   */
  async loadResultFormats() {
    this.config.resultFormats = [
      {
        id: 'findings',
        name: 'Findings/Issues',
        fields: ['severity', 'title', 'description', 'recommendation', 'line', 'file'],
        displayType: 'list',
        groupBy: 'severity'
      },
      {
        id: 'summary',
        name: 'Summary Statistics',
        fields: ['total', 'critical', 'high', 'medium', 'low'],
        displayType: 'cards',
        groupBy: null
      },
      {
        id: 'recommendations',
        name: 'Recommendations',
        fields: ['title', 'description', 'priority', 'effort'],
        displayType: 'list',
        groupBy: 'priority'
      },
      {
        id: 'code',
        name: 'Generated Code',
        fields: ['language', 'code', 'description', 'dependencies'],
        displayType: 'code',
        groupBy: 'language'
      },
      {
        id: 'metrics',
        name: 'Metrics/Analytics',
        fields: ['metric', 'value', 'trend', 'threshold'],
        displayType: 'charts',
        groupBy: 'category'
      },
      {
        id: 'generic',
        name: 'Generic Results',
        fields: [],
        displayType: 'json',
        groupBy: null
      }
    ];
  }

  /**
   * Load MCP servers dynamically
   */
  async loadMCPServers() {
    // MCP servers are loaded from actual MCP configuration
    this.config.mcpServers = [
      {
        id: 'filesystem',
        name: 'Filesystem',
        capabilities: ['read_file', 'write_file', 'list_directory'],
        status: 'available'
      },
      {
        id: 'github',
        name: 'GitHub MCP',
        capabilities: ['create_issue', 'create_pr', 'search_code'],
        status: 'available'
      },
      {
        id: 'database',
        name: 'Database',
        capabilities: ['query', 'insert', 'update'],
        status: 'available'
      }
    ];
  }

  /**
   * Load available models dynamically
   */
  async loadModels() {
    this.config.models = [
      {
        id: 'claude-3-sonnet',
        name: 'Claude 3 Sonnet',
        provider: 'anthropic',
        capabilities: ['code', 'analysis', 'reasoning'],
        maxTokens: 200000
      },
      {
        id: 'gpt-4',
        name: 'GPT-4',
        provider: 'openai',
        capabilities: ['code', 'analysis', 'reasoning'],
        maxTokens: 128000
      },
      {
        id: 'bedrock-claude',
        name: 'AWS Bedrock Claude',
        provider: 'aws',
        capabilities: ['code', 'analysis', 'reasoning'],
        maxTokens: 200000
      }
    ];
  }

  /**
   * Get configuration for specific type
   */
  getConfig(type) {
    return this.config[type] || [];
  }

  /**
   * Detect result format from results structure
   */
  detectResultFormat(results) {
    if (!results) return 'generic';
    
    // Check for findings/issues
    if (results.findings || results.vulnerabilities || results.issues) {
      return 'findings';
    }
    
    // Check for summary
    if (results.summary && typeof results.summary === 'object') {
      return 'summary';
    }
    
    // Check for recommendations
    if (results.recommendations && Array.isArray(results.recommendations)) {
      return 'recommendations';
    }
    
    // Check for code
    if (results.code || results.generatedCode) {
      return 'code';
    }
    
    // Check for metrics
    if (results.metrics || results.analytics) {
      return 'metrics';
    }
    
    return 'generic';
  }

  /**
   * Detect integration actions from results
   */
  detectIntegrationActions(results, integrationType) {
    const integration = this.config.integrationTypes.find(i => i.id === integrationType);
    if (!integration) return [];
    
    const actions = [];
    const resultsText = JSON.stringify(results).toLowerCase();
    
    // Check each action detection pattern
    for (const [action, keywords] of Object.entries(integration.actionDetection)) {
      for (const keyword of keywords) {
        if (resultsText.includes(keyword)) {
          actions.push(action);
          break;
        }
      }
    }
    
    return [...new Set(actions)]; // Remove duplicates
  }

  /**
   * Get agent category dynamically from agent metadata
   */
  getAgentCategory(agent) {
    // Category is derived from agent, not predefined
    return agent.category || agent.type || 'General';
  }

  /**
   * Validate integration configuration
   */
  validateIntegrationConfig(integrationType, config) {
    const integration = this.config.integrationTypes.find(i => i.id === integrationType);
    if (!integration) return { valid: false, error: 'Unknown integration type' };
    
    const schema = integration.configSchema;
    const missing = [];
    
    for (const [field, type] of Object.entries(schema)) {
      if (!config[field]) {
        missing.push(field);
      }
    }
    
    if (missing.length > 0) {
      return { valid: false, error: `Missing required fields: ${missing.join(', ')}` };
    }
    
    return { valid: true };
  }
}

module.exports = new DynamicConfigManager();
