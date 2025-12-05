/**
 * MCP (Model Context Protocol) Type Definitions
 * 
 * Zero-Disruption Implementation:
 * - These are NEW type definitions for MCP functionality
 * - No existing types are modified or affected
 * - Maintains complete separation from existing codebase
 */

// MCP Protocol Types
export interface MCPMessage {
  jsonrpc: '2.0';
  id?: string | number;
  method?: string;
  params?: any;
  result?: any;
  error?: MCPError;
}

export interface MCPError {
  code: number;
  message: string;
  data?: any;
}

export interface MCPRequest extends MCPMessage {
  method: string;
  params?: any;
}

export interface MCPResponse extends MCPMessage {
  result?: any;
  error?: MCPError;
}

// MCP Server Configuration
export interface MCPServerConfig {
  id: string;
  name: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
  disabled?: boolean;
  autoApprove?: string[];
  timeout?: number;
  retryAttempts?: number;
}

export interface MCPServerStatus {
  id: string;
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  lastConnected?: Date;
  lastError?: string;
  capabilities?: MCPCapabilities;
  tools?: MCPTool[];
}

// MCP Capabilities
export interface MCPCapabilities {
  tools?: {
    listChanged?: boolean;
  };
  resources?: {
    subscribe?: boolean;
    listChanged?: boolean;
  };
  prompts?: {
    listChanged?: boolean;
  };
  logging?: {};
}

// MCP Tools
export interface MCPTool {
  name: string;
  description?: string;
  inputSchema: {
    type: 'object';
    properties?: Record<string, any>;
    required?: string[];
  };
}

export interface MCPToolCall {
  name: string;
  arguments: Record<string, any>;
}

export interface MCPToolResult {
  content: Array<{
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  isError?: boolean;
}

// MCP Resources
export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface MCPResourceContent {
  uri: string;
  mimeType: string;
  text?: string;
  blob?: string;
}

// MCP Prompts
export interface MCPPrompt {
  name: string;
  description?: string;
  arguments?: Array<{
    name: string;
    description?: string;
    required?: boolean;
  }>;
}

export interface MCPPromptMessage {
  role: 'user' | 'assistant';
  content: {
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: string;
    mimeType?: string;
  };
}

// Agent Execution Types (MCP-Enhanced)
export interface MCPAgentExecution {
  executionId: string;
  agentId: string;
  input: any;
  mcpEnabled: boolean;
  mcpServers: string[];
  toolsUsed: MCPToolCall[];
  fallbackUsed: boolean;
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'completed' | 'failed' | 'fallback';
  result?: any;
  error?: string;
}

// Configuration Types
export interface MCPConfig {
  enabled: boolean;
  servers: Record<string, MCPServerConfig>;
  fallbackAlways: boolean;
  healthCheckInterval: number;
  defaultTimeout: number;
  maxRetries: number;
}

// Health Check Types
export interface MCPHealthCheck {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  servers: Record<string, MCPServerStatus>;
  lastCheck: Date;
  fallbackAvailable: boolean;
}

// Event Types
export interface MCPEvent {
  type: 'server_connected' | 'server_disconnected' | 'tool_called' | 'execution_started' | 'execution_completed' | 'fallback_triggered';
  serverId?: string;
  executionId?: string;
  timestamp: Date;
  data?: any;
}

// Error Types
export enum MCPErrorCode {
  PARSE_ERROR = -32700,
  INVALID_REQUEST = -32600,
  METHOD_NOT_FOUND = -32601,
  INVALID_PARAMS = -32602,
  INTERNAL_ERROR = -32603,
  SERVER_ERROR_START = -32099,
  SERVER_ERROR_END = -32000,
  
  // Custom MCP errors
  SERVER_NOT_FOUND = -32001,
  SERVER_DISCONNECTED = -32002,
  TOOL_NOT_FOUND = -32003,
  TOOL_EXECUTION_FAILED = -32004,
  FALLBACK_REQUIRED = -32005
}

export class MCPClientError extends Error {
  constructor(
    public code: MCPErrorCode,
    message: string,
    public data?: any
  ) {
    super(message);
    this.name = 'MCPClientError';
  }
}

// Utility Types
export type MCPEventHandler = (event: MCPEvent) => void;
export type MCPToolHandler = (call: MCPToolCall) => Promise<MCPToolResult>;
export type MCPServerFactory = (config: MCPServerConfig) => Promise<MCPServerStatus>;