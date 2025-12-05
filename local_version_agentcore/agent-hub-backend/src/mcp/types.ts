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

export interface MCPCapability {
  id: string;
  name: string;
  description: string;
  category: string;
  tools: string[];
}

export interface MCPExecution {
  id: string;
  agentId: string;
  serverId: string;
  toolId: string;
  input: Record<string, any>;
  output: Record<string, any>;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  error?: string;
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

export interface MCPConnectionStatus {
  serverId: string;
  connected: boolean;
  lastConnected?: Date;
  error?: string;
  capabilities?: string[];
  tools?: string[];
}

export interface MCPServerTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  template: {
    configuration: Record<string, MCPConfigField>;
    tools: MCPTool[];
    capabilities: string[];
  };
  examples: Array<{
    name: string;
    description: string;
    configuration: Record<string, any>;
  }>;
}

export interface MCPIntegrationAnalytics {
  overview: {
    totalMCPAgents: number;
    totalMCPExecutions: number;
    averageSuccessRate: number;
    mostPopularServer: string;
  };
  serverMetrics: MCPUsageMetrics[];
  agentMetrics: Array<{
    agentId: string;
    agentName: string;
    mcpUsage: number;
    successRate: number;
    lastUsed: Date;
  }>;
  timeSeriesData: Array<{
    date: string;
    executions: number;
    successRate: number;
  }>;
  errorAnalysis: Array<{
    serverId: string;
    errorType: string;
    count: number;
    lastOccurrence: Date;
  }>;
}

export interface MCPDocumentation {
  serverId: string;
  title: string;
  description: string;
  installation: {
    requirements: string[];
    steps: string[];
    configuration: Record<string, any>;
  };
  usage: {
    examples: Array<{
      title: string;
      description: string;
      code: string;
      language: string;
    }>;
    bestPractices: string[];
    troubleshooting: Array<{
      issue: string;
      solution: string;
    }>;
  };
  api: {
    tools: MCPTool[];
    capabilities: string[];
    events?: Array<{
      name: string;
      description: string;
      payload: Record<string, any>;
    }>;
  };
}

export interface MCPAgentEnhancement {
  agentId: string;
  originalCapabilities: string[];
  mcpEnhancements: Array<{
    serverId: string;
    addedCapabilities: string[];
    addedTools: string[];
    performanceImpact: 'low' | 'medium' | 'high';
  }>;
  totalEnhancement: {
    newCapabilities: string[];
    performanceBoost: number;
    reliabilityImprovement: number;
  };
}