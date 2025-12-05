export interface MCPServer {
  id: string;
  name: string;
  description: string;
  category: 'development' | 'project-management' | 'data' | 'system' | 'communication' | 'security';
  icon: string;
  capabilities: string[];
  tools: string[];
  useCases: string[];
  configuration: Record<string, MCPConfigField>;
  status?: 'active' | 'inactive' | 'error';
  version?: string;
  author?: string;
  documentation?: string;
}

export interface MCPConfigField {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required?: boolean;
  default?: any;
  sensitive?: boolean;
  description?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    options?: string[];
  };
}

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

export interface MCPTool {
  id: string;
  name: string;
  description: string;
  serverId: string;
  inputSchema: Record<string, any>;
  outputSchema: Record<string, any>;
  examples?: MCPToolExample[];
}

export interface MCPToolExample {
  name: string;
  description: string;
  input: Record<string, any>;
  expectedOutput: Record<string, any>;
}

export interface MCPUsageMetrics {
  serverId: string;
  serverName: string;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageDuration: number;
  lastUsed: Date;
  popularTools: Array<{
    toolId: string;
    toolName: string;
    usage: number;
  }>;
}

export interface MCPAgentLabel {
  agentId: string;
  mcpEnabled: boolean;
  mcpServers: Array<{
    id: string;
    name: string;
    category: string;
  }>;
  mcpCapabilities: string[];
  displayLabel: string;
}

export interface MCPMarketplaceInfo {
  agentId: string;
  hasMCP: boolean;
  mcpServers: Array<{
    id: string;
    name: string;
    category: string;
    required: boolean;
  }>;
  mcpRequirements: string[];
  mcpBenefits: string[];
}