import { MCPServer, MCPTool, MCPCapability } from './types';

export interface MCPIntegrationConfig {
  enabled: boolean;
  selectedServers: string[];
  autoConnect: boolean;
  fallbackToStandard: boolean;
}

export interface AgentMCPConfig {
  agentId: string;
  mcpServers: string[];
  requiredTools: string[];
  optionalTools: string[];
  configuration: Record<string, any>;
}

export class MCPIntegrationService {
  private availableServers: Map<string, MCPServer> = new Map();
  private connectedServers: Map<string, any> = new Map();

  constructor() {
    this.initializeDefaultServers();
  }

  private initializeDefaultServers() {
    // Featured MCP servers for agent creation
    const defaultServers: MCPServer[] = [
      {
        id: 'git-mcp',
        name: 'Git Repository Analysis',
        description: 'Analyze code repositories, commits, and changes',
        category: 'development',
        icon: 'git-branch',
        capabilities: ['code-analysis', 'repository-scanning', 'diff-analysis'],
        tools: ['analyze-repository', 'get-commit-history', 'analyze-changes'],
        useCases: ['Code Review', 'Repository Analysis', 'Change Impact Assessment'],
        configuration: {
          repositoryUrl: { type: 'string', required: true },
          branch: { type: 'string', default: 'main' },
          accessToken: { type: 'string', required: false, sensitive: true }
        }
      },
      {
        id: 'jira-mcp',
        name: 'JIRA Integration',
        description: 'Connect to JIRA for issue tracking and project management',
        category: 'project-management',
        icon: 'ticket',
        capabilities: ['issue-management', 'project-tracking', 'workflow-automation'],
        tools: ['create-issue', 'update-issue', 'search-issues', 'get-project-info'],
        useCases: ['Issue Creation', 'Project Management', 'Workflow Automation'],
        configuration: {
          jiraUrl: { type: 'string', required: true },
          username: { type: 'string', required: true },
          apiToken: { type: 'string', required: true, sensitive: true },
          projectKey: { type: 'string', required: false }
        }
      },
      {
        id: 'database-mcp',
        name: 'Database Operations',
        description: 'Query and analyze database content',
        category: 'data',
        icon: 'database',
        capabilities: ['data-querying', 'schema-analysis', 'data-validation'],
        tools: ['execute-query', 'get-schema', 'validate-data', 'analyze-performance'],
        useCases: ['Data Analysis', 'Report Generation', 'Data Validation'],
        configuration: {
          connectionString: { type: 'string', required: true, sensitive: true },
          database: { type: 'string', required: true },
          readOnly: { type: 'boolean', default: true }
        }
      },
      {
        id: 'filesystem-mcp',
        name: 'File System Access',
        description: 'Read and analyze files and directories',
        category: 'system',
        icon: 'folder',
        capabilities: ['file-reading', 'directory-scanning', 'content-analysis'],
        tools: ['read-file', 'list-directory', 'search-files', 'analyze-structure'],
        useCases: ['Code Analysis', 'Documentation Generation', 'File Processing'],
        configuration: {
          basePath: { type: 'string', required: true },
          allowedExtensions: { type: 'array', default: ['.js', '.ts', '.py', '.java'] },
          maxFileSize: { type: 'number', default: 1048576 }
        }
      }
    ];

    defaultServers.forEach(server => {
      this.availableServers.set(server.id, server);
    });
  }

  // Get available MCP servers for agent creation
  getAvailableServers(): MCPServer[] {
    return Array.from(this.availableServers.values());
  }

  // Get featured MCP servers for display
  getFeaturedServers(): MCPServer[] {
    return this.getAvailableServers().slice(0, 4);
  }

  // Get context-aware MCP suggestions based on agent type
  getSuggestedServers(agentType: string, agentDescription: string): MCPServer[] {
    const suggestions: MCPServer[] = [];
    const description = agentDescription.toLowerCase();
    const type = agentType.toLowerCase();

    // Context-aware suggestions
    if (type.includes('code') || description.includes('code') || description.includes('review')) {
      const gitServer = this.availableServers.get('git-mcp');
      const fsServer = this.availableServers.get('filesystem-mcp');
      if (gitServer) suggestions.push(gitServer);
      if (fsServer) suggestions.push(fsServer);
    }

    if (type.includes('project') || description.includes('issue') || description.includes('ticket')) {
      const jiraServer = this.availableServers.get('jira-mcp');
      if (jiraServer) suggestions.push(jiraServer);
    }

    if (type.includes('data') || description.includes('database') || description.includes('query')) {
      const dbServer = this.availableServers.get('database-mcp');
      if (dbServer) suggestions.push(dbServer);
    }

    return suggestions;
  }

  // Configure MCP for an agent
  async configureAgentMCP(agentId: string, config: MCPIntegrationConfig): Promise<AgentMCPConfig> {
    const agentMCPConfig: AgentMCPConfig = {
      agentId,
      mcpServers: config.selectedServers,
      requiredTools: [],
      optionalTools: [],
      configuration: {}
    };

    // Collect tools from selected servers
    for (const serverId of config.selectedServers) {
      const server = this.availableServers.get(serverId);
      if (server) {
        agentMCPConfig.requiredTools.push(...server.tools);
      }
    }

    // Store configuration (in production, this would go to database)
    await this.storeAgentMCPConfig(agentMCPConfig);

    return agentMCPConfig;
  }

  // Get MCP configuration for an agent
  async getAgentMCPConfig(agentId: string): Promise<AgentMCPConfig | null> {
    // In production, this would query the database
    // For now, return mock data or null
    return null;
  }

  // Update MCP configuration for existing agent
  async updateAgentMCPConfig(agentId: string, updates: Partial<MCPIntegrationConfig>): Promise<AgentMCPConfig> {
    const existingConfig = await this.getAgentMCPConfig(agentId);
    
    if (!existingConfig) {
      throw new Error(`No MCP configuration found for agent ${agentId}`);
    }

    // Update configuration
    if (updates.selectedServers) {
      existingConfig.mcpServers = updates.selectedServers;
      existingConfig.requiredTools = [];
      
      // Recalculate tools
      for (const serverId of updates.selectedServers) {
        const server = this.availableServers.get(serverId);
        if (server) {
          existingConfig.requiredTools.push(...server.tools);
        }
      }
    }

    await this.storeAgentMCPConfig(existingConfig);
    return existingConfig;
  }

  // Remove MCP configuration from agent
  async removeAgentMCPConfig(agentId: string): Promise<void> {
    // In production, this would delete from database
    console.log(`Removing MCP configuration for agent ${agentId}`);
  }

  // Check if agent has MCP configuration
  async hasAgentMCPConfig(agentId: string): Promise<boolean> {
    const config = await this.getAgentMCPConfig(agentId);
    return config !== null && config.mcpServers.length > 0;
  }

  // Get MCP usage analytics
  async getMCPUsageAnalytics(): Promise<any> {
    return {
      totalMCPAgents: 15,
      mostUsedServers: [
        { id: 'git-mcp', name: 'Git Repository Analysis', usage: 45 },
        { id: 'jira-mcp', name: 'JIRA Integration', usage: 32 },
        { id: 'database-mcp', name: 'Database Operations', usage: 28 },
        { id: 'filesystem-mcp', name: 'File System Access', usage: 21 }
      ],
      mcpExecutions: {
        total: 1247,
        successful: 1189,
        failed: 58,
        successRate: 95.3
      },
      topUseCases: [
        'Code Review Automation',
        'Issue Tracking Integration',
        'Data Analysis',
        'File Processing'
      ]
    };
  }

  // Validate MCP server configuration
  async validateServerConfig(serverId: string, config: Record<string, any>): Promise<{ valid: boolean; errors: string[] }> {
    const server = this.availableServers.get(serverId);
    if (!server) {
      return { valid: false, errors: [`Server ${serverId} not found`] };
    }

    const errors: string[] = [];

    // Validate required configuration fields
    for (const [field, fieldConfig] of Object.entries(server.configuration)) {
      if (fieldConfig.required && !config[field]) {
        errors.push(`Required field '${field}' is missing`);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  // Test MCP server connection
  async testServerConnection(serverId: string, config: Record<string, any>): Promise<{ connected: boolean; error?: string }> {
    try {
      // In production, this would actually test the connection
      // For now, simulate connection test
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const validation = await this.validateServerConfig(serverId, config);
      if (!validation.valid) {
        return { connected: false, error: validation.errors.join(', ') };
      }

      return { connected: true };
    } catch (error) {
      return { connected: false, error: error instanceof Error ? error.message : 'Connection failed' };
    }
  }

  private async storeAgentMCPConfig(config: AgentMCPConfig): Promise<void> {
    // In production, this would store to database
    console.log('Storing MCP configuration:', config);
  }

  // Get MCP server health status
  async getServerHealthStatus(): Promise<Record<string, { status: 'healthy' | 'unhealthy' | 'unknown'; lastCheck: Date }>> {
    const status: Record<string, { status: 'healthy' | 'unhealthy' | 'unknown'; lastCheck: Date }> = {};
    
    for (const serverId of this.availableServers.keys()) {
      status[serverId] = {
        status: Math.random() > 0.1 ? 'healthy' : 'unhealthy', // 90% healthy simulation
        lastCheck: new Date()
      };
    }

    return status;
  }
}

export const mcpIntegrationService = new MCPIntegrationService();