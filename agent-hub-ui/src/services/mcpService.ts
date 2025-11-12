import { MCPServer, MCPIntegrationConfig, AgentMCPConfig } from '../types/mcp';

class MCPService {
  private baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3002';

  async getFeaturedServers(): Promise<MCPServer[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/mcp/servers/featured`, {
        headers: {
          'Authorization': 'sk-agenthub-system-internal-frontend-key',
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch featured MCP servers');
      }
      
      return data.data;
    } catch (error) {
      console.error('Error fetching featured MCP servers:', error);
      // Return fallback data if API is not available
      return this.getFallbackServers();
    }
  }

  async getAvailableServers(): Promise<MCPServer[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/mcp/servers`, {
        headers: {
          'Authorization': 'sk-agenthub-system-internal-frontend-key',
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch MCP servers');
      }
      
      return data.data;
    } catch (error) {
      console.error('Error fetching MCP servers:', error);
      // Return fallback data if API is not available
      return this.getFallbackServers();
    }
  }

  async getSuggestedServers(agentType: string, agentDescription: string): Promise<MCPServer[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/mcp/servers/suggestions`, {
        method: 'POST',
        headers: {
          'Authorization': 'sk-agenthub-system-internal-frontend-key',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentType,
          agentDescription
        })
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get MCP suggestions');
      }
      
      return data.data;
    } catch (error) {
      console.error('Error getting MCP suggestions:', error);
      // Return fallback suggestions based on agent type/description
      return this.getFallbackSuggestions(agentType, agentDescription);
    }
  }

  async configureAgentMCP(agentId: string, config: MCPIntegrationConfig): Promise<AgentMCPConfig> {
    try {
      const response = await fetch(`${this.baseUrl}/api/mcp/agents/${agentId}/configure`, {
        method: 'POST',
        headers: {
          'Authorization': 'sk-agenthub-system-internal-frontend-key',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config)
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to configure MCP for agent');
      }
      
      return data.data;
    } catch (error) {
      console.error('Error configuring agent MCP:', error);
      throw error;
    }
  }

  async getAgentMCPConfig(agentId: string): Promise<AgentMCPConfig | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/mcp/agents/${agentId}/config`, {
        headers: {
          'Authorization': 'sk-agenthub-system-internal-frontend-key',
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get agent MCP configuration');
      }
      
      return data.data;
    } catch (error) {
      console.error('Error getting agent MCP config:', error);
      throw error;
    }
  }

  async updateAgentMCPConfig(agentId: string, updates: Partial<MCPIntegrationConfig>): Promise<AgentMCPConfig> {
    try {
      const response = await fetch(`${this.baseUrl}/api/mcp/agents/${agentId}/config`, {
        method: 'PUT',
        headers: {
          'Authorization': 'sk-agenthub-system-internal-frontend-key',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates)
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to update agent MCP configuration');
      }
      
      return data.data;
    } catch (error) {
      console.error('Error updating agent MCP config:', error);
      throw error;
    }
  }

  async removeAgentMCPConfig(agentId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/mcp/agents/${agentId}/config`, {
        method: 'DELETE',
        headers: {
          'Authorization': 'sk-agenthub-system-internal-frontend-key',
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to remove agent MCP configuration');
      }
    } catch (error) {
      console.error('Error removing agent MCP config:', error);
      throw error;
    }
  }

  async hasAgentMCPConfig(agentId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/mcp/agents/${agentId}/has-mcp`, {
        headers: {
          'Authorization': 'sk-agenthub-system-internal-frontend-key',
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to check agent MCP status');
      }
      
      return data.data.hasMCP;
    } catch (error) {
      console.error('Error checking agent MCP status:', error);
      return false;
    }
  }

  async validateServerConfig(serverId: string, config: Record<string, any>): Promise<{ valid: boolean; errors: string[] }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/mcp/servers/${serverId}/validate`, {
        method: 'POST',
        headers: {
          'Authorization': 'sk-agenthub-system-internal-frontend-key',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config)
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to validate server configuration');
      }
      
      return data.data;
    } catch (error) {
      console.error('Error validating server config:', error);
      throw error;
    }
  }

  async testServerConnection(serverId: string, config: Record<string, any>): Promise<{ connected: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/mcp/servers/${serverId}/test`, {
        method: 'POST',
        headers: {
          'Authorization': 'sk-agenthub-system-internal-frontend-key',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config)
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to test server connection');
      }
      
      return data.data;
    } catch (error) {
      console.error('Error testing server connection:', error);
      throw error;
    }
  }

  async getMCPUsageAnalytics(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/mcp/analytics`, {
        headers: {
          'Authorization': 'sk-agenthub-system-internal-frontend-key',
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get MCP analytics');
      }
      
      return data.data;
    } catch (error) {
      console.error('Error getting MCP analytics:', error);
      throw error;
    }
  }

  async getServerHealthStatus(): Promise<Record<string, { status: 'healthy' | 'unhealthy' | 'unknown'; lastCheck: Date }>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/mcp/servers/health`, {
        headers: {
          'Authorization': 'sk-agenthub-system-internal-frontend-key',
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get server health status');
      }
      
      return data.data;
    } catch (error) {
      console.error('Error getting server health status:', error);
      throw error;
    }
  }

  // Helper method to generate MCP labels for agents
  generateMCPLabel(mcpServers: MCPServer[]): string {
    if (mcpServers.length === 0) return '';
    
    if (mcpServers.length === 1) {
      return `MCP: ${mcpServers[0].name}`;
    }
    
    return `MCP: ${mcpServers.length} integrations`;
  }

  // Helper method to check if agent should show MCP badge
  shouldShowMCPBadge(agentId: string): Promise<boolean> {
    return this.hasAgentMCPConfig(agentId);
  }

  // Helper method to get MCP capabilities for marketplace display
  async getMCPCapabilitiesForAgent(agentId: string): Promise<string[]> {
    try {
      const config = await this.getAgentMCPConfig(agentId);
      if (!config) return [];
      
      const servers = await this.getAvailableServers();
      const capabilities: string[] = [];
      
      for (const serverId of config.mcpServers) {
        const server = servers.find(s => s.id === serverId);
        if (server) {
          capabilities.push(...server.capabilities);
        }
      }
      
      return Array.from(new Set(capabilities)); // Remove duplicates
    } catch (error) {
      console.error('Error getting MCP capabilities for agent:', error);
      return [];
    }
  }

  // Fallback suggestions based on agent type and description
  private getFallbackSuggestions(agentType: string, agentDescription: string): MCPServer[] {
    const servers = this.getFallbackServers();
    const suggestions: MCPServer[] = [];
    const description = agentDescription.toLowerCase();
    const type = agentType.toLowerCase();

    // Context-aware suggestions
    if (type.includes('code') || description.includes('code') || description.includes('review')) {
      const gitServer = servers.find(s => s.id === 'git-mcp');
      const fsServer = servers.find(s => s.id === 'filesystem-mcp');
      if (gitServer) suggestions.push(gitServer);
      if (fsServer) suggestions.push(fsServer);
    }

    if (type.includes('project') || description.includes('issue') || description.includes('ticket')) {
      const jiraServer = servers.find(s => s.id === 'jira-mcp');
      if (jiraServer) suggestions.push(jiraServer);
    }

    if (type.includes('data') || description.includes('database') || description.includes('query')) {
      const dbServer = servers.find(s => s.id === 'database-mcp');
      if (dbServer) suggestions.push(dbServer);
    }

    return suggestions;
  }

  // Fallback MCP servers when API is not available
  private getFallbackServers(): MCPServer[] {
    return [
      {
        id: 'git-mcp',
        name: 'Git Repository Analysis',
        description: 'Analyze code repositories, commits, and changes',
        category: 'development',
        icon: 'code-branch',
        capabilities: ['code-analysis', 'repository-scanning', 'diff-analysis'],
        tools: ['analyze-repository', 'get-commit-history', 'analyze-changes'],
        useCases: ['Code Review', 'Repository Analysis', 'Change Impact Assessment'],
        configuration: {
          repositoryUrl: { type: 'string', required: true, description: 'Git repository URL' },
          branch: { type: 'string', default: 'main', description: 'Branch to analyze' },
          accessToken: { type: 'string', required: false, sensitive: true, description: 'Git access token (optional)' }
        }
      },
      {
        id: 'jira-mcp',
        name: 'JIRA Integration',
        description: 'Connect to JIRA for issue tracking and project management',
        category: 'project-management',
        icon: 'tasks',
        capabilities: ['issue-management', 'project-tracking', 'workflow-automation'],
        tools: ['create-issue', 'update-issue', 'search-issues', 'get-project-info'],
        useCases: ['Issue Creation', 'Project Management', 'Workflow Automation'],
        configuration: {
          jiraUrl: { type: 'string', required: true, description: 'JIRA instance URL' },
          username: { type: 'string', required: true, description: 'JIRA username' },
          apiToken: { type: 'string', required: true, sensitive: true, description: 'JIRA API token' },
          projectKey: { type: 'string', required: false, description: 'Default project key' }
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
          connectionString: { type: 'string', required: true, sensitive: true, description: 'Database connection string' },
          database: { type: 'string', required: true, description: 'Database name' },
          readOnly: { type: 'boolean', default: true, description: 'Read-only access' }
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
          basePath: { type: 'string', required: true, description: 'Base directory path' },
          allowedExtensions: { type: 'array', default: ['.js', '.ts', '.py', '.java'], description: 'Allowed file extensions' },
          maxFileSize: { type: 'number', default: 1048576, description: 'Maximum file size in bytes' }
        }
      }
    ];
  }
}

export const mcpService = new MCPService();