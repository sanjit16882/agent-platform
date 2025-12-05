/**
 * Shared Types - Single Source of Truth
 * Used by all server implementations and can be shared with frontend
 */

export interface AgentExecutionRequest {
  taskDescription: string;
  inputs: Record<string, any>;
  context: {
    executionMode: string;
    mcpServers?: string[];
    integrations?: string[];
  };
}

export interface AgentExecutionResponse {
  success: boolean;
  executionId: string;
  status: string;
  results: {
    summary: string;
    mainOutput: string;
    additionalFiles?: Array<{ name: string; content: string }>;
    recommendations?: string[];
    nextSteps?: string[];
    metadata?: any;
  };
  metadata: {
    duration: number;
    model: string;
    tokensUsed?: number;
    platformActions?: Array<{
      platform: string;
      action: string;
      status: string;
      details: any;
    }>;
    mcpCalls?: any[];
  };
  error?: string;
}

export interface AgentInfo {
  id: string;
  agent_id?: string;
  name: string;
  description: string;
  category: string;
  type: string;
  status?: string;
  capabilities?: string[];
  usage_count?: number;
  average_rating?: number;
  created_at?: string;
  tags?: string[];
  inputSchema?: any;
  outputSchema?: any;
  processingLogic?: string;
  mcpIntegration?: any;
  metadata?: any;
}

export interface APIKeyData {
  key: string;
  name: string;
  userId: string;
  permissions: string[];
  created: string;
  lastUsed?: string;
  usageCount: number;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface HybridAgentRequest {
  name: string;
  description: string;
  category: string;
  purpose?: string;
  inputSchema?: any;
  outputSchema?: any;
  processingLogic?: string;
  selectedModel?: string;
  mcpIntegration?: any;
  metadata?: any;
}

export interface ExecutionContext {
  executionMode: string;
  mcpServers?: string[];
  integrations?: string[];
  userId?: string;
  apiKeyData?: APIKeyData;
}
