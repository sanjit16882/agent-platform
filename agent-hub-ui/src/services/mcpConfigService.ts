/**
 * MCP Configuration Service
 * Manages MCP server configurations with model associations
 */

export interface MCPServerConfiguration {
  id: string;
  name: string;
  description: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
  
  // Model configuration
  modelProvider: 'aws-bedrock' | 'openai' | 'anthropic' | 'azure';
  modelId: string;
  modelName: string;
  
  // Execution settings
  executionEngine: 'asyncio' | 'threading' | 'multiprocessing';
  logging: {
    console: boolean;
    level: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR';
  };
  
  // Server settings
  timeout: number;
  retryAttempts: number;
  disabled: boolean;
  autoApprove: string[];
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

export interface AWSBedrockModel {
  modelId: string;
  modelName: string;
  provider: string;
  description: string;
  costPer1MTokens: {
    input: number;
    output: number;
  };
}

class MCPConfigService {
  private storageKey = 'mcp_server_configurations';
  private modelsKey = 'aws_bedrock_models';

  /**
   * Get all configured MCP servers
   */
  getConfiguredServers(): MCPServerConfiguration[] {
    const stored = localStorage.getItem(this.storageKey);
    return stored ? JSON.parse(stored) : [];
  }

  /**
   * Get a specific MCP server configuration
   */
  getServerConfig(serverId: string): MCPServerConfiguration | null {
    const servers = this.getConfiguredServers();
    return servers.find(s => s.id === serverId) || null;
  }

  /**
   * Save MCP server configuration
   */
  saveServerConfig(config: MCPServerConfiguration): void {
    const servers = this.getConfiguredServers();
    const index = servers.findIndex(s => s.id === config.id);
    
    config.updatedAt = new Date().toISOString();
    
    if (index >= 0) {
      servers[index] = config;
    } else {
      config.createdAt = new Date().toISOString();
      servers.push(config);
    }
    
    localStorage.setItem(this.storageKey, JSON.stringify(servers));
  }

  /**
   * Delete MCP server configuration
   */
  deleteServerConfig(serverId: string): void {
    const servers = this.getConfiguredServers();
    const filtered = servers.filter(s => s.id !== serverId);
    localStorage.setItem(this.storageKey, JSON.stringify(filtered));
  }

  /**
   * Get AWS Bedrock models
   */
  async getAWSBedrockModels(): Promise<AWSBedrockModel[]> {
    // Try to get from cache first
    const cached = localStorage.getItem(this.modelsKey);
    if (cached) {
      const { models, timestamp } = JSON.parse(cached);
      // Cache for 1 hour
      if (Date.now() - timestamp < 3600000) {
        return models;
      }
    }

    // Fetch from backend
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3002'}/api/v1/bedrock/models`);
      const data = await response.json();
      
      if (data.success && data.models) {
        // Cache the models
        localStorage.setItem(this.modelsKey, JSON.stringify({
          models: data.models,
          timestamp: Date.now()
        }));
        return data.models;
      }
    } catch (error) {
      console.error('Failed to fetch AWS Bedrock models:', error);
    }

    // Return default models if fetch fails
    return this.getDefaultAWSModels();
  }

  /**
   * Get default AWS Bedrock models (fallback)
   */
  private getDefaultAWSModels(): AWSBedrockModel[] {
    return [
      {
        modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
        modelName: 'Claude 3 Haiku',
        provider: 'Anthropic',
        description: 'Cost-effective for most tasks',
        costPer1MTokens: { input: 0.25, output: 1.25 }
      },
      {
        modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
        modelName: 'Claude 3.5 Sonnet',
        provider: 'Anthropic',
        description: 'Balanced for complex tasks',
        costPer1MTokens: { input: 3.00, output: 15.00 }
      },
      {
        modelId: 'anthropic.claude-3-opus-20240229-v1:0',
        modelName: 'Claude 3 Opus',
        provider: 'Anthropic',
        description: 'Most capable for complex reasoning',
        costPer1MTokens: { input: 15.00, output: 75.00 }
      },
      {
        modelId: 'amazon.titan-text-express-v1',
        modelName: 'Titan Text Express',
        provider: 'Amazon',
        description: 'Budget-friendly option',
        costPer1MTokens: { input: 0.80, output: 0.80 }
      },
      {
        modelId: 'amazon.titan-text-lite-v1',
        modelName: 'Titan Text Lite',
        provider: 'Amazon',
        description: 'Lightweight and fast',
        costPer1MTokens: { input: 0.30, output: 0.40 }
      }
    ];
  }

  /**
   * Check if an agent has an associated MCP server
   */
  getAgentMCPServer(agentId: string): string | null {
    const key = `agent_mcp_${agentId}`;
    return localStorage.getItem(key);
  }

  /**
   * Associate an agent with an MCP server
   */
  setAgentMCPServer(agentId: string, serverId: string): void {
    const key = `agent_mcp_${agentId}`;
    localStorage.setItem(key, serverId);
  }

  /**
   * Remove agent-MCP association
   */
  removeAgentMCPServer(agentId: string): void {
    const key = `agent_mcp_${agentId}`;
    localStorage.removeItem(key);
  }

  /**
   * Export configuration as YAML
   */
  exportAsYAML(config: MCPServerConfiguration): { configYAML: string; secretsYAML: string } {
    const configYAML = `# mcp_agent.config.yaml
execution_engine: ${config.executionEngine}

logging:
  console: ${config.logging.console}
  level: ${config.logging.level}

mcp:
  servers:
    ${config.id}:
      command: "${config.command}"
      args: ${JSON.stringify(config.args)}
      ${config.env ? `env: ${JSON.stringify(config.env)}` : ''}
      disabled: ${config.disabled}
      autoApprove: ${JSON.stringify(config.autoApprove)}
      timeout: ${config.timeout}
      retryAttempts: ${config.retryAttempts}

model_providers:
  ${config.modelProvider}:
    default_model: ${config.modelId}
`;

    const secretsYAML = `# mcp_agent.secrets.yaml
# ⚠️ DO NOT COMMIT TO VERSION CONTROL
${config.modelProvider}:
  api_key: "YOUR_API_KEY_HERE"
${config.env ? Object.entries(config.env).map(([key, value]) => `  ${key}: "${value}"`).join('\n') : ''}
`;

    return { configYAML, secretsYAML };
  }
}

export const mcpConfigService = new MCPConfigService();
