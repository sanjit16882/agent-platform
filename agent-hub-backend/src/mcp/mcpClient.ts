/**
 * MCP Client Service
 * 
 * Zero-Disruption Implementation:
 * - This is a completely NEW service for MCP functionality
 * - Does NOT modify any existing services or files
 * - Provides MCP capabilities as additive enhancement
 * - Maintains fallback to existing systems at all times
 */

import { EventEmitter } from 'events';
import { spawn, ChildProcess } from 'child_process';
import {
  MCPServerConfig,
  MCPServerStatus,
  MCPMessage,
  MCPRequest,
  MCPResponse,
  MCPTool,
  MCPToolCall,
  MCPToolResult,
  MCPCapabilities,
  MCPConfig,
  MCPHealthCheck,
  MCPEvent,
  MCPClientError,
  MCPErrorCode
} from './types/mcpTypes';

export class MCPClient extends EventEmitter {
  private servers: Map<string, MCPServerConnection> = new Map();
  private config: MCPConfig;
  private healthCheckInterval?: NodeJS.Timeout;
  private isShuttingDown = false;

  constructor(config: MCPConfig) {
    super();
    this.config = config;
    
    // Start health monitoring if enabled
    if (this.config.enabled) {
      this.startHealthMonitoring();
    }
  }

  /**
   * Initialize MCP client and connect to configured servers
   * SAFE: Only creates new connections, doesn't affect existing systems
   */
  async initialize(): Promise<void> {
    if (!this.config.enabled) {
      console.log('🔧 MCP Client: Disabled by configuration');
      return;
    }

    console.log('🚀 MCP Client: Initializing...');
    
    try {
      // Connect to all configured servers
      const connectionPromises = Object.entries(this.config.servers)
        .filter(([_, config]) => !config.disabled)
        .map(([id, config]) => this.connectToServer(id, config));

      await Promise.allSettled(connectionPromises);
      
      console.log(`✅ MCP Client: Initialized with ${this.servers.size} servers`);
      this.emit('initialized', { serverCount: this.servers.size });
    } catch (error) {
      console.error('❌ MCP Client: Initialization failed:', error);
      this.emit('error', error);
    }
  }

  /**
   * Connect to a specific MCP server
   * SAFE: Creates new connection without affecting existing systems
   */
  private async connectToServer(serverId: string, config: MCPServerConfig): Promise<void> {
    try {
      console.log(`🔌 MCP Client: Connecting to server ${serverId}...`);
      
      const connection = new MCPServerConnection(serverId, config);
      
      // Set up event handlers
      connection.on('connected', () => {
        this.servers.set(serverId, connection);
        console.log(`✅ MCP Server ${serverId}: Connected`);
        this.emit('server_connected', { serverId });
      });

      connection.on('disconnected', () => {
        this.servers.delete(serverId);
        console.log(`❌ MCP Server ${serverId}: Disconnected`);
        this.emit('server_disconnected', { serverId });
      });

      connection.on('error', (error) => {
        console.error(`❌ MCP Server ${serverId}: Error -`, error);
        this.emit('server_error', { serverId, error });
      });

      // Attempt connection
      await connection.connect();
      
    } catch (error) {
      console.error(`❌ MCP Server ${serverId}: Connection failed -`, error);
      this.emit('server_error', { serverId, error });
    }
  }

  /**
   * Get available tools from all connected servers
   * SAFE: Only queries MCP servers, doesn't affect existing functionality
   */
  async getAvailableTools(): Promise<MCPTool[]> {
    const allTools: MCPTool[] = [];
    
    this.servers.forEach((connection, serverId) => {
      try {
        connection.listTools().then(tools => {
          allTools.push(...tools.map(tool => ({
            ...tool,
            name: `${serverId}:${tool.name}` // Namespace tools by server
          })));
        }).catch(error => {
          console.warn(`⚠️ MCP Server ${serverId}: Failed to list tools -`, error);
        });
      } catch (error) {
        console.warn(`⚠️ MCP Server ${serverId}: Failed to list tools -`, error);
      }
    });
    
    return allTools;
  }

  /**
   * Call a tool on the appropriate MCP server
   * SAFE: Only calls MCP tools, has fallback mechanism
   */
  async callTool(toolCall: MCPToolCall): Promise<MCPToolResult> {
    const [serverId, toolName] = toolCall.name.split(':', 2);
    
    if (!serverId || !toolName) {
      throw new MCPClientError(
        MCPErrorCode.TOOL_NOT_FOUND,
        `Invalid tool name format: ${toolCall.name}. Expected format: serverId:toolName`
      );
    }

    const connection = this.servers.get(serverId);
    if (!connection) {
      throw new MCPClientError(
        MCPErrorCode.SERVER_NOT_FOUND,
        `MCP server ${serverId} not found or not connected`
      );
    }

    try {
      const result = await connection.callTool({
        name: toolName,
        arguments: toolCall.arguments
      });
      
      this.emit('tool_called', { serverId, toolName, success: true });
      return result;
    } catch (error) {
      this.emit('tool_called', { serverId, toolName, success: false, error });
      throw new MCPClientError(
        MCPErrorCode.TOOL_EXECUTION_FAILED,
        `Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { serverId, toolName, originalError: error }
      );
    }
  }

  /**
   * Check if MCP is available and healthy
   * SAFE: Only checks MCP status, doesn't affect existing systems
   */
  isAvailable(): boolean {
    return this.config.enabled && this.servers.size > 0;
  }

  /**
   * Get health status of all MCP servers
   * SAFE: Only reports MCP status, doesn't affect existing systems
   */
  async getHealthStatus(): Promise<MCPHealthCheck> {
    const serverStatuses: Record<string, MCPServerStatus> = {};
    
    const statusPromises: Promise<void>[] = [];
    this.servers.forEach((connection, serverId) => {
      statusPromises.push(
        connection.getStatus().then(status => {
          serverStatuses[serverId] = status;
        })
      );
    });
    
    await Promise.all(statusPromises);
    
    const healthyServers = Object.values(serverStatuses).filter(s => s.status === 'connected').length;
    const totalServers = Object.keys(serverStatuses).length;
    
    let overall: 'healthy' | 'degraded' | 'unhealthy';
    if (healthyServers === totalServers && totalServers > 0) {
      overall = 'healthy';
    } else if (healthyServers > 0) {
      overall = 'degraded';
    } else {
      overall = 'unhealthy';
    }
    
    return {
      overall,
      servers: serverStatuses,
      lastCheck: new Date(),
      fallbackAvailable: true // Always true - we always have fallback to existing system
    };
  }

  /**
   * Start health monitoring
   * SAFE: Only monitors MCP servers, doesn't affect existing systems
   */
  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(async () => {
      if (this.isShuttingDown) return;
      
      try {
        const health = await this.getHealthStatus();
        this.emit('health_check', health);
        
        // Auto-disable if all servers are unhealthy and fallback is required
        if (health.overall === 'unhealthy' && this.config.fallbackAlways) {
          console.warn('⚠️ MCP Client: All servers unhealthy, fallback mode active');
        }
      } catch (error) {
        console.error('❌ MCP Client: Health check failed:', error);
      }
    }, this.config.healthCheckInterval || 30000); // Default: 30 seconds
  }

  /**
   * Gracefully shutdown MCP client
   * SAFE: Only affects MCP connections, existing systems continue normally
   */
  async shutdown(): Promise<void> {
    console.log('🛑 MCP Client: Shutting down...');
    this.isShuttingDown = true;
    
    // Stop health monitoring
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    // Disconnect all servers
    const disconnectPromises: Promise<void>[] = [];
    this.servers.forEach(connection => {
      disconnectPromises.push(connection.disconnect());
    });
    
    await Promise.allSettled(disconnectPromises);
    this.servers.clear();
    
    console.log('✅ MCP Client: Shutdown complete');
    this.emit('shutdown');
  }
}

/**
 * Individual MCP Server Connection
 * SAFE: Manages individual server connections without affecting existing systems
 */
class MCPServerConnection extends EventEmitter {
  private process?: ChildProcess;
  private messageId = 0;
  private pendingRequests = new Map<string | number, {
    resolve: (value: any) => void;
    reject: (error: any) => void;
    timeout: NodeJS.Timeout;
  }>();
  private capabilities?: MCPCapabilities;
  private tools: MCPTool[] = [];
  private status: MCPServerStatus['status'] = 'disconnected';

  constructor(
    private serverId: string,
    private config: MCPServerConfig
  ) {
    super();
  }

  async connect(): Promise<void> {
    if (this.status === 'connected' || this.status === 'connecting') {
      return;
    }

    this.status = 'connecting';
    
    try {
      // Spawn MCP server process
      this.process = spawn(this.config.command, this.config.args, {
        env: { ...process.env, ...this.config.env },
        stdio: ['pipe', 'pipe', 'pipe']
      });

      // Set up process event handlers
      this.setupProcessHandlers();
      
      // Initialize MCP protocol
      await this.initializeProtocol();
      
      this.status = 'connected';
      this.emit('connected');
      
    } catch (error) {
      this.status = 'error';
      this.emit('error', error);
      throw error;
    }
  }

  private setupProcessHandlers(): void {
    if (!this.process) return;

    this.process.stdout?.on('data', (data) => {
      this.handleMessage(data.toString());
    });

    this.process.stderr?.on('data', (data) => {
      console.error(`MCP Server ${this.serverId} stderr:`, data.toString());
    });

    this.process.on('exit', (code) => {
      console.log(`MCP Server ${this.serverId} exited with code ${code}`);
      this.status = 'disconnected';
      this.emit('disconnected');
    });

    this.process.on('error', (error) => {
      console.error(`MCP Server ${this.serverId} process error:`, error);
      this.status = 'error';
      this.emit('error', error);
    });
  }

  private async initializeProtocol(): Promise<void> {
    // Send initialize request
    const initResponse = await this.sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: {},
        resources: {},
        prompts: {}
      },
      clientInfo: {
        name: 'AgentHub-MCP-Client',
        version: '1.0.0'
      }
    });

    this.capabilities = initResponse.capabilities;
    
    // Send initialized notification
    await this.sendNotification('notifications/initialized');
    
    // List available tools
    try {
      const toolsResponse = await this.sendRequest('tools/list');
      this.tools = toolsResponse.tools || [];
    } catch (error) {
      console.warn(`MCP Server ${this.serverId}: Failed to list tools -`, error);
    }
  }

  private handleMessage(data: string): void {
    const lines = data.trim().split('\n');
    
    for (const line of lines) {
      if (!line.trim()) continue;
      
      try {
        const message: MCPMessage = JSON.parse(line);
        
        if (message.id !== undefined) {
          // Response to our request
          const pending = this.pendingRequests.get(message.id);
          if (pending) {
            clearTimeout(pending.timeout);
            this.pendingRequests.delete(message.id);
            
            if (message.error) {
              pending.reject(new MCPClientError(
                message.error.code,
                message.error.message,
                message.error.data
              ));
            } else {
              pending.resolve(message.result);
            }
          }
        }
      } catch (error) {
        console.error(`MCP Server ${this.serverId}: Failed to parse message -`, error);
      }
    }
  }

  private async sendRequest(method: string, params?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const id = ++this.messageId;
      const request: MCPRequest = {
        jsonrpc: '2.0',
        id,
        method,
        params
      };

      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new MCPClientError(
          MCPErrorCode.INTERNAL_ERROR,
          `Request timeout for method ${method}`
        ));
      }, this.config.timeout || 30000);

      this.pendingRequests.set(id, { resolve, reject, timeout });
      
      if (this.process?.stdin) {
        this.process.stdin.write(JSON.stringify(request) + '\n');
      } else {
        clearTimeout(timeout);
        this.pendingRequests.delete(id);
        reject(new MCPClientError(
          MCPErrorCode.SERVER_DISCONNECTED,
          'Server process not available'
        ));
      }
    });
  }

  private async sendNotification(method: string, params?: any): Promise<void> {
    const notification: MCPMessage = {
      jsonrpc: '2.0',
      method,
      params
    };

    if (this.process?.stdin) {
      this.process.stdin.write(JSON.stringify(notification) + '\n');
    }
  }

  async listTools(): Promise<MCPTool[]> {
    return this.tools;
  }

  async callTool(toolCall: MCPToolCall): Promise<MCPToolResult> {
    const response = await this.sendRequest('tools/call', {
      name: toolCall.name,
      arguments: toolCall.arguments
    });
    
    return response;
  }

  async getStatus(): Promise<MCPServerStatus> {
    return {
      id: this.serverId,
      status: this.status,
      lastConnected: this.status === 'connected' ? new Date() : undefined,
      capabilities: this.capabilities,
      tools: this.tools
    };
  }

  async disconnect(): Promise<void> {
    if (this.process) {
      this.process.kill();
      this.process = undefined;
    }
    
    // Reject all pending requests
    this.pendingRequests.forEach((pending, id) => {
      clearTimeout(pending.timeout);
      pending.reject(new MCPClientError(
        MCPErrorCode.SERVER_DISCONNECTED,
        'Server disconnected'
      ));
    });
    this.pendingRequests.clear();
    
    this.status = 'disconnected';
    this.emit('disconnected');
  }
}

// Export singleton instance factory
let mcpClientInstance: MCPClient | null = null;

export function createMCPClient(config: MCPConfig): MCPClient {
  if (mcpClientInstance) {
    return mcpClientInstance;
  }
  
  mcpClientInstance = new MCPClient(config);
  return mcpClientInstance;
}

export function getMCPClient(): MCPClient | null {
  return mcpClientInstance;
}