/**
 * Type definitions for Agent Testing Framework
 * Feature: Agent Testing Knowledge Integration
 */

/**
 * Knowledge configuration for Vector DB and MCP integration in testing
 */
export interface KnowledgeConfig {
  vectorDB: {
    enabled: boolean;
    provider: string;              // 'opensearch' | 'pinecone' | 'chroma'
    knowledgeBases: string[];      // Array of KB IDs
    retrievalConfig: {
      topK: number;                // 1-10, default: 5
      minSimilarity: number;       // 0.0-1.0, default: 0.7
    };
  };
  mcp: {
    enabled: boolean;
    selectedServers: string[];     // Array of MCP server IDs
  };
}

/**
 * Knowledge source type indicating where the answer came from
 */
export type KnowledgeSource = 'vector_db' | 'mcp' | 'llm' | 'hybrid';

/**
 * Execution mode for test runs
 */
export type ExecutionMode = 'llm_only' | 'rag' | 'mcp' | 'full_stack';

/**
 * Extended test result with knowledge source tracking
 */
export interface TestResult {
  // Existing fields
  testId: string;
  testName: string;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  score: number;
  explanation: string;
  
  // NEW: Knowledge source tracking
  knowledgeSource: KnowledgeSource;
  retrievedDocuments?: number;
  mcpToolsUsed?: string[];
  ragLatency?: number;
  mcpLatency?: number;
  llmLatency?: number;
  totalLatency: number;
}

/**
 * Workflow state for DDTF with knowledge configuration
 */
export interface WorkflowState {
  // Step 1: Agent Selection
  selectedAgent: any | null;
  
  // Step 2: Model Selection
  selectedModels: string[];
  
  // Step 2.5: Knowledge Configuration (NEW)
  knowledgeConfig: KnowledgeConfig;
  
  // Step 3: Test Selection
  selectedTests: any[];
  samplePrompts: string[];
  
  // Step 4: Custom Tests (Optional)
  customTests: any[];
  
  // Step 5: Input Configuration
  testInputs: Record<string, { content: string; format: string }>;
  
  // Step 6: Review (no additional state)
  
  // Step 7: Execution
  executionStatus: 'idle' | 'running' | 'completed' | 'failed';
  runId: string | null;
  executionMode?: ExecutionMode;
  
  // Step 8: Results
  testResults: any | null;
  
  // Step 9: Insights
  insights: any | null;
}

/**
 * Execution step status for real-time display
 */
export interface ExecutionStep {
  source: 'vector_db' | 'mcp' | 'llm';
  status: 'pending' | 'in_progress' | 'success' | 'skipped' | 'failed';
  message: string;
  latency?: number;
  details?: any;
}

/**
 * Test run metadata with execution mode
 */
export interface TestRunMetadata {
  runId: string;
  agentId: string;
  agentName: string;
  timestamp: Date;
  executionMode: ExecutionMode;
  knowledgeConfig?: KnowledgeConfig;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  averageScore: number;
  totalDuration: number;
}

/**
 * Knowledge source metrics for analytics
 */
export interface KnowledgeSourceMetrics {
  vectorDB: {
    totalQueries: number;
    averageLatency: number;
    averageDocumentsRetrieved: number;
    highConfidenceAnswers: number;
  };
  mcp: {
    totalExecutions: number;
    averageLatency: number;
    successfulExecutions: number;
    toolsUsed: Record<string, number>;
  };
  llm: {
    totalCalls: number;
    averageLatency: number;
    withContext: number;
    withoutContext: number;
  };
}

/**
 * Agent configuration with Vector DB and MCP (extended from existing Agent type)
 */
export interface AgentConfigWithKnowledge {
  id: string;
  name: string;
  agentType: string;
  systemPrompt: string;
  
  // Existing Vector DB config
  vectorDB?: {
    enabled: boolean;
    provider: string;
    knowledgeBases: string[];
    retrievalConfig: {
      topK: number;
      minSimilarity: number;
    };
  };
  
  // Existing MCP config
  mcp?: {
    enabled: boolean;
    servers: string[];
  };
}

/**
 * Utility function to determine execution mode from knowledge config
 */
export function getExecutionMode(config: KnowledgeConfig): ExecutionMode {
  const hasVectorDB = config.vectorDB.enabled && config.vectorDB.knowledgeBases.length > 0;
  const hasMCP = config.mcp.enabled && config.mcp.selectedServers.length > 0;

  if (hasVectorDB && hasMCP) {
    return 'full_stack';
  } else if (hasVectorDB) {
    return 'rag';
  } else if (hasMCP) {
    return 'mcp';
  } else {
    return 'llm_only';
  }
}

/**
 * Get display name for execution mode
 */
export function getExecutionModeLabel(mode: ExecutionMode): string {
  switch (mode) {
    case 'llm_only':
      return 'LLM Only';
    case 'rag':
      return 'RAG';
    case 'mcp':
      return 'MCP';
    case 'full_stack':
      return 'Full-stack';
    default:
      return 'Unknown';
  }
}
