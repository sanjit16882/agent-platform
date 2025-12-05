/**
 * MCP Configuration Service
 * 
 * Zero-Disruption Implementation:
 * - This is a NEW configuration service for MCP functionality
 * - Does NOT modify existing configuration systems
 * - Provides MCP configuration management as separate service
 * - Maintains complete isolation from existing config
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import { MCPConfig, MCPServerConfig } from './types/mcpTypes';

export class MCPConfigService {
  private static instance: MCPConfigService;
  private config: MCPConfig | null = null;
  private configPath: string;
  private workspaceConfigPath: string;
  private userConfigPath: string;

  private constructor() {
    // Configuration file paths
    this.workspaceConfigPath = path.join(process.cwd(), '.kiro', 'settings', 'mcp.json');
    this.userConfigPath = path.join(require('os').homedir(), '.kiro', 'settings', 'mcp.json');
    this.configPath = this.workspaceConfigPath; // Default to workspace config
  }

  static getInstance(): MCPConfigService {
    if (!MCPConfigService.instance) {
      MCPConfigService.instance = new MCPConfigService();
    }
    return MCPConfigService.instance;
  }

  /**
   * Load MCP configuration from files
   * SAFE: Only loads MCP config, doesn't affect existing configuration
   */
  async loadConfig(): Promise<MCPConfig> {
    if (this.config) {
      return this.config;
    }

    try {
      // Try to load workspace config first
      let workspaceConfig: Partial<MCPConfig> = {};
      let userConfig: Partial<MCPConfig> = {};

      try {
        const workspaceData = await fs.readFile(this.workspaceConfigPath, 'utf-8');
        workspaceConfig = JSON.parse(workspaceData);
        console.log('📁 MCP Config: Loaded workspace configuration');
      } catch (error) {
        // Workspace config doesn't exist, that's okay
      }

      try {
        const userData = await fs.readFile(this.userConfigPath, 'utf-8');
        userConfig = JSON.parse(userData);
        console.log('👤 MCP Config: Loaded user configuration');
      } catch (error) {
        // User config doesn't exist, that's okay
      }

      // Merge configurations (workspace takes precedence)
      this.config = this.mergeConfigs(userConfig, workspaceConfig);
      
      // Apply environment variable overrides
      this.applyEnvironmentOverrides();
      
      console.log('✅ MCP Config: Configuration loaded successfully');
      return this.config;
      
    } catch (error) {
      console.warn('⚠️ MCP Config: Failed to load configuration, using defaults:', error);
      this.config = this.getDefaultConfig();
      return this.config;
    }
  }

  /**
   * Get current MCP configuration
   * SAFE: Only returns MCP config, doesn't affect existing systems
   */
  getConfig(): MCPConfig {
    if (!this.config) {
      throw new Error('MCP configuration not loaded. Call loadConfig() first.');
    }
    return this.config;
  }

  /**
   * Save MCP configuration to workspace file
   * SAFE: Only saves MCP config, doesn't affect existing configuration files
   */
  async saveConfig(config: MCPConfig): Promise<void> {
    try {
      // Ensure directory exists
      await fs.mkdir(path.dirname(this.workspaceConfigPath), { recursive: true });
      
      // Convert to Kiro IDE format for saving
      const kiroFormat = {
        mcpServers: config.servers
      };
      
      // Save configuration in Kiro IDE format
      await fs.writeFile(
        this.workspaceConfigPath,
        JSON.stringify(kiroFormat, null, 2),
        'utf-8'
      );
      
      this.config = config;
      console.log('💾 MCP Config: Configuration saved successfully');
      
    } catch (error) {
      console.error('❌ MCP Config: Failed to save configuration:', error);
      throw error;
    }
  }

  /**
   * Add or update MCP server configuration
   * SAFE: Only modifies MCP config, doesn't affect existing systems
   */
  async addServer(serverId: string, serverConfig: MCPServerConfig): Promise<void> {
    const config = await this.loadConfig();
    config.servers[serverId] = serverConfig;
    await this.saveConfig(config);
    console.log(`➕ MCP Config: Added server ${serverId}`);
  }

  /**
   * Remove MCP server configuration
   * SAFE: Only modifies MCP config, doesn't affect existing systems
   */
  async removeServer(serverId: string): Promise<void> {
    const config = await this.loadConfig();
    delete config.servers[serverId];
    await this.saveConfig(config);
    console.log(`➖ MCP Config: Removed server ${serverId}`);
  }

  /**
   * Enable or disable MCP functionality
   * SAFE: Only affects MCP features, existing systems continue normally
   */
  async setEnabled(enabled: boolean): Promise<void> {
    const config = await this.loadConfig();
    config.enabled = enabled;
    await this.saveConfig(config);
    console.log(`🔧 MCP Config: MCP ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Get default MCP configuration
   * SAFE: Returns safe defaults that don't affect existing systems
   */
  private getDefaultConfig(): MCPConfig {
    return {
      enabled: process.env.MCP_ENABLED === 'true' || true, // Enable by default for internal servers
      servers: {},
      fallbackAlways: true, // Always maintain fallback to existing systems
      healthCheckInterval: 30000, // 30 seconds
      defaultTimeout: 30000, // 30 seconds
      maxRetries: 3
    };
  }

  /**
   * Merge user and workspace configurations
   * SAFE: Only merges MCP configs, doesn't affect existing configuration merging
   */
  private mergeConfigs(userConfig: Partial<MCPConfig>, workspaceConfig: Partial<MCPConfig>): MCPConfig {
    const defaultConfig = this.getDefaultConfig();
    
    // Handle both 'servers' and 'mcpServers' formats for Kiro IDE compatibility
    const userServers = (userConfig as any).mcpServers || userConfig.servers || {};
    const workspaceServers = (workspaceConfig as any).mcpServers || workspaceConfig.servers || {};
    
    // Merge servers (workspace servers override user servers with same ID)
    const mergedServers = {
      ...userServers,
      ...workspaceServers
    };
    
    return {
      ...defaultConfig,
      ...userConfig,
      ...workspaceConfig,
      servers: mergedServers
    };
  }

  /**
   * Apply environment variable overrides
   * SAFE: Only affects MCP config, doesn't modify existing environment handling
   */
  private applyEnvironmentOverrides(): void {
    if (!this.config) return;

    // Override enabled status
    if (process.env.MCP_ENABLED !== undefined) {
      this.config.enabled = process.env.MCP_ENABLED === 'true';
    }

    // Override fallback setting
    if (process.env.MCP_FALLBACK_ALWAYS !== undefined) {
      this.config.fallbackAlways = process.env.MCP_FALLBACK_ALWAYS === 'true';
    }

    // Override health check interval
    if (process.env.MCP_HEALTH_CHECK_INTERVAL) {
      const interval = parseInt(process.env.MCP_HEALTH_CHECK_INTERVAL, 10);
      if (!isNaN(interval)) {
        this.config.healthCheckInterval = interval;
      }
    }

    // Override default timeout
    if (process.env.MCP_DEFAULT_TIMEOUT) {
      const timeout = parseInt(process.env.MCP_DEFAULT_TIMEOUT, 10);
      if (!isNaN(timeout)) {
        this.config.defaultTimeout = timeout;
      }
    }
  }

  /**
   * Create sample MCP configuration
   * SAFE: Creates example config without affecting existing systems
   */
  async createSampleConfig(): Promise<void> {
    // Create sample configuration in Kiro IDE format
    const sampleKiroConfig = {
      mcpServers: {
        'file-system': {
          id: 'file-system',
          name: 'File System Server',
          command: 'uvx',
          args: ['mcp-server-filesystem'],
          env: {
            'FILESYSTEM_ROOT': process.cwd()
          },
          disabled: true, // Disabled by default
          autoApprove: ['read_file', 'list_directory'],
          timeout: 30000,
          retryAttempts: 3
        },
        'database': {
          id: 'database',
          name: 'Database Server',
          command: 'uvx',
          args: ['mcp-server-database'],
          env: {
            'DATABASE_URL': 'postgresql://localhost:5432/agenthub'
          },
          disabled: true, // Disabled by default
          autoApprove: ['query'],
          timeout: 30000,
          retryAttempts: 3
        },
        'git': {
          id: 'git',
          name: 'Git Server',
          command: 'uvx',
          args: ['mcp-server-git'],
          env: {
            'GIT_REPOSITORY': process.cwd()
          },
          disabled: true, // Disabled by default
          autoApprove: ['log', 'status'],
          timeout: 30000,
          retryAttempts: 3
        }
      }
    };

    // Ensure directory exists
    await fs.mkdir(path.dirname(this.workspaceConfigPath), { recursive: true });
    
    // Save in Kiro IDE format
    await fs.writeFile(
      this.workspaceConfigPath,
      JSON.stringify(sampleKiroConfig, null, 2),
      'utf-8'
    );
    
    console.log('📝 MCP Config: Sample configuration created in Kiro IDE format');
  }

  /**
   * Validate MCP configuration
   * SAFE: Only validates MCP config, doesn't affect existing validation
   */
  validateConfig(config: MCPConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate basic structure
    if (typeof config.enabled !== 'boolean') {
      errors.push('enabled must be a boolean');
    }

    if (typeof config.fallbackAlways !== 'boolean') {
      errors.push('fallbackAlways must be a boolean');
    }

    if (typeof config.healthCheckInterval !== 'number' || config.healthCheckInterval < 1000) {
      errors.push('healthCheckInterval must be a number >= 1000');
    }

    if (typeof config.defaultTimeout !== 'number' || config.defaultTimeout < 1000) {
      errors.push('defaultTimeout must be a number >= 1000');
    }

    if (typeof config.maxRetries !== 'number' || config.maxRetries < 0) {
      errors.push('maxRetries must be a number >= 0');
    }

    // Validate servers
    if (typeof config.servers !== 'object') {
      errors.push('servers must be an object');
    } else {
      for (const [serverId, serverConfig] of Object.entries(config.servers)) {
        const serverErrors = this.validateServerConfig(serverId, serverConfig);
        errors.push(...serverErrors);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate individual server configuration
   * SAFE: Only validates MCP server config, doesn't affect existing validation
   */
  private validateServerConfig(serverId: string, config: MCPServerConfig): string[] {
    const errors: string[] = [];
    const prefix = `Server ${serverId}:`;

    if (!config.id || config.id !== serverId) {
      errors.push(`${prefix} id must match server key`);
    }

    if (!config.name || typeof config.name !== 'string') {
      errors.push(`${prefix} name is required and must be a string`);
    }

    if (!config.command || typeof config.command !== 'string') {
      errors.push(`${prefix} command is required and must be a string`);
    }

    if (!Array.isArray(config.args)) {
      errors.push(`${prefix} args must be an array`);
    }

    if (config.env && typeof config.env !== 'object') {
      errors.push(`${prefix} env must be an object`);
    }

    if (config.timeout && (typeof config.timeout !== 'number' || config.timeout < 1000)) {
      errors.push(`${prefix} timeout must be a number >= 1000`);
    }

    if (config.retryAttempts && (typeof config.retryAttempts !== 'number' || config.retryAttempts < 0)) {
      errors.push(`${prefix} retryAttempts must be a number >= 0`);
    }

    return errors;
  }
}

// Export singleton instance
export const mcpConfigService = MCPConfigService.getInstance();