/**
 * MCP Management Service - Per-Agent MCP Configuration
 * 
 * This service manages MCP servers and per-agent MCP configurations.
 * It provides CRUD operations for MCP servers and handles agent-specific MCP settings.
 */

import { mcpConfigService } from '../mcpConfig';
import { MCPServerConfig } from '../types/mcpTypes';

export interface MCPServerInfo extends MCPServerConfig {
  status: 'connected' | 'disconnected' | 'error' | 'unknown';
  lastConnected?: Date;
  errorMessage?: string;
  toolsCount?: number;
  capabilities?: string[];
}

export interface AgentMCPConfig {
  enabled: boolean;
  serverIds: string[];
  timeout?: number;
  autoApprove?: string[];
}

export class MCPManagementService {
  private static instance: MCPManagementService;

  private constructor() {}

  static getInstance(): MCPManagementService {
    if (!MCPManagementService.instance) {
      MCPManagementService.instance = new MCPManagementService();
    }
    return MCPManagementService.instance;
  }

  /**
   * Get all configured MCP servers with their status
   */
  async getAllServers(): Promise<MCPServerInfo[]> {
    try {
      const config = await mcpConfigService.loadConfig();
      const servers: MCPServerInfo[] = [];

      for (const [serverId, serverConfig] of Object.entries(config.servers)) {
        const serverInfo: MCPServerInfo = {
          ...serverConfig,
          status: serverConfig.disabled ? 'disconnected' : 'unknown'
        };

        // Test connection status (simplified for now)
        if (!serverConfig.disabled) {
          try {
            serverInfo.status = 'connected';
            serverInfo.lastConnected = new Date();
            serverInfo.toolsCount = this.getEstimatedToolsCount(serverId);
            serverInfo.capabilities = this.getServerCapabilities(serverId);
          } catch (error) {
            serverInfo.status = 'error';
            serverInfo.errorMessage = error instanceof Error ? error.message : 'Unknown error';
          }
        }

        servers.push(serverInfo);
      }

      return servers;
    } catch (error) {
      console.error('❌ MCP Management: Failed to get servers:', error);
      return [];
    }
  }

  /**
   * Add a new MCP server
   */
  async addServer(serverConfig: MCPServerConfig): Promise<void> {
    try {
      await mcpConfigService.addServer(serverConfig.id, serverConfig);
      console.log(`✅ MCP Management: Added server ${serverConfig.id}`);
    } catch (error) {
      console.error(`❌ MCP Management: Failed to add server ${serverConfig.id}:`, error);
      throw error;
    }
  }

  /**
   * Update an existing MCP server
   */
  async updateServer(serverId: string, updates: Partial<MCPServerConfig>): Promise<void> {
    try {
      const config = await mcpConfigService.loadConfig();
      const existingServer = config.servers[serverId];
      
      if (!existingServer) {
        throw new Error(`Server ${serverId} not found`);
      }

      const updatedServer = { ...existingServer, ...updates };
      await mcpConfigService.addServer(serverId, updatedServer);
      
      console.log(`✅ MCP Management: Updated server ${serverId}`);
    } catch (error) {
      console.error(`❌ MCP Management: Failed to update server ${serverId}:`, error);
      throw error;
    }
  }

  /**
   * Remove an MCP server
   */
  async removeServer(serverId: string): Promise<void> {
    try {
      await mcpConfigService.removeServer(serverId);
      console.log(`✅ MCP Management: Removed server ${serverId}`);
    } catch (error) {
      console.error(`❌ MCP Management: Failed to remove server ${serverId}:`, error);
      throw error;
    }
  }

  /**
   * Test connection to an MCP server
   */
  async testServerConnection(serverId: string): Promise<{
    success: boolean;
    status: string;
    message: string;
    toolsCount?: number;
    capabilities?: string[];
  }> {
    try {
      const config = await mcpConfigService.loadConfig();
      const serverConfig = config.servers[serverId];
      
      if (!serverConfig) {
        return {
          success: false,
          status: 'error',
          message: `Server ${serverId} not found`
        };
      }

      if (serverConfig.disabled) {
        return {
          success: false,
          status: 'disabled',
          message: 'Server is disabled'
        };
      }

      // For now, return a mock successful connection
      // In a real implementation, this would actually test the MCP server connection
      return {
        success: true,
        status: 'connected',
        message: 'Connection successful',
        toolsCount: this.getEstimatedToolsCount(serverId),
        capabilities: this.getServerCapabilities(serverId)
      };
    } catch (error) {
      return {
        success: false,
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get available MCP servers for agent configuration
   */
  async getAvailableServers(): Promise<MCPServerInfo[]> {
    const allServers = await this.getAllServers();
    return allServers.filter(server => !server.disabled);
  }

  /**
   * Validate agent MCP configuration
   */
  validateAgentMCPConfig(config: AgentMCPConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (typeof config.enabled !== 'boolean') {
      errors.push('enabled must be a boolean');
    }

    if (!Array.isArray(config.serverIds)) {
      errors.push('serverIds must be an array');
    }

    if (config.timeout && (typeof config.timeout !== 'number' || config.timeout < 1000)) {
      errors.push('timeout must be a number >= 1000');
    }

    if (config.autoApprove && !Array.isArray(config.autoApprove)) {
      errors.push('autoApprove must be an array');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get default MCP configuration for new agents
   */
  getDefaultAgentMCPConfig(): AgentMCPConfig {
    return {
      enabled: false,
      serverIds: [],
      timeout: 30000,
      autoApprove: []
    };
  }

  /**
   * Create sample MCP servers for testing
   */
  async createSampleServers(): Promise<void> {
    const sampleServers: MCPServerConfig[] = [
      {
        id: 'filesystem',
        name: 'File System Server',
        command: 'uvx',
        args: ['mcp-server-filesystem'],
        env: {
          FILESYSTEM_ROOT: process.cwd()
        },
        disabled: true,
        autoApprove: ['read_file', 'list_directory'],
        timeout: 30000,
        retryAttempts: 3
      },
      {
        id: 'database',
        name: 'Database Server',
        command: 'node',
        args: [],
        env: {},
        disabled: false,
        autoApprove: ['execute_query', 'get_schema', 'get_table_info'],
        timeout: 30000,
        retryAttempts: 3
      },
      {
        id: 'git',
        name: 'Git Server',
        command: 'uvx',
        args: ['mcp-server-git'],
        env: {
          GIT_REPOSITORY: process.cwd()
        },
        disabled: true,
        autoApprove: ['log', 'status', 'diff'],
        timeout: 30000,
        retryAttempts: 3
      }
    ];

    for (const server of sampleServers) {
      try {
        await this.addServer(server);
      } catch (error) {
        console.warn(`⚠️ MCP Management: Failed to create sample server ${server.id}:`, error);
      }
    }

    console.log('✅ MCP Management: Sample servers created');
  }

  /**
   * Get estimated tools count for a server (mock implementation)
   */
  private getEstimatedToolsCount(serverId: string): number {
    const toolCounts: Record<string, number> = {
      filesystem: 12,
      database: 8,
      git: 15,
      default: 5
    };
    return toolCounts[serverId] || toolCounts.default;
  }

  /**
   * Get server capabilities (mock implementation)
   */
  private getServerCapabilities(serverId: string): string[] {
    const capabilities: Record<string, string[]> = {
      filesystem: ['read', 'write', 'list', 'search', 'watch', 'create', 'delete'],
      database: ['query', 'insert', 'update', 'delete', 'schema', 'analyze'],
      git: ['status', 'commit', 'push', 'pull', 'branch', 'log', 'diff', 'merge'],
      default: ['basic']
    };
    return capabilities[serverId] || capabilities.default;
  }
}

// Export singleton instance
export const mcpManagementService = MCPManagementService.getInstance();