/**
 * Test Execution Service with Knowledge Source Integration
 * Feature: Agent Testing Knowledge Integration
 * 
 * Handles test execution with Vector DB and MCP integration
 */

import { KnowledgeConfig, TestResult, KnowledgeSource, ExecutionStep } from '../types/testing';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002';

// ============================================
// Interfaces
// ============================================

interface VectorDBSearchResult {
  documents: Array<{
    id: string;
    content: string;
    similarity: number;
    metadata: any;
  }>;
  searchLatency: number;
}

interface MCPExecutionResult {
  success: boolean;
  output?: string;
  toolsUsed: string[];
  data?: any;
  latency: number;
}

interface LLMResponse {
  content: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
  latency: number;
}

// ============================================
// Test Execution Service
// ============================================

class TestExecutionService {
  private static instance: TestExecutionService;

  static getInstance(): TestExecutionService {
    if (!TestExecutionService.instance) {
      TestExecutionService.instance = new TestExecutionService();
    }
    return TestExecutionService.instance;
  }

  /**
   * Execute test with knowledge sources (Vector DB + MCP + LLM)
   * 
   * Execution flow:
   * 1. Try Vector DB (if enabled)
   * 2. Try MCP (if enabled)
   * 3. Fallback to LLM with context
   */
  async executeTestWithKnowledge(
    test: any,
    input: string,
    agentConfig: any,
    knowledgeConfig: KnowledgeConfig
  ): Promise<TestResult> {
    const result: TestResult = {
      testId: test.id || test.testId,
      testName: test.name || test.testName,
      input,
      expectedOutput: test.expectedOutput || '',
      actualOutput: '',
      passed: false,
      score: 0,
      explanation: '',
      knowledgeSource: 'llm',
      retrievedDocuments: 0,
      mcpToolsUsed: [],
      ragLatency: 0,
      mcpLatency: 0,
      llmLatency: 0,
      totalLatency: 0
    };

    const startTime = Date.now();
    let retrievedDocs: any[] = [];
    let mcpData: any = null;

    try {
      // Step 1: Try Vector DB (if enabled)
      if (knowledgeConfig.vectorDB.enabled) {
        const ragStart = Date.now();
        try {
          const vectorDBResult = await this.searchVectorDB({
            indexes: knowledgeConfig.vectorDB.knowledgeBases,
            query: input,
            topK: knowledgeConfig.vectorDB.retrievalConfig.topK,
            minSimilarity: knowledgeConfig.vectorDB.retrievalConfig.minSimilarity
          });

          result.ragLatency = Date.now() - ragStart;
          result.retrievedDocuments = vectorDBResult.documents.length;
          retrievedDocs = vectorDBResult.documents;

          // High confidence answer from Vector DB (similarity > 0.9)
          if (retrievedDocs.length > 0 && retrievedDocs[0].similarity > 0.9) {
            result.actualOutput = retrievedDocs[0].content;
            result.knowledgeSource = 'vector_db';
            result.totalLatency = Date.now() - startTime;
            
            // Evaluate result
            this.evaluateTestResult(result, test);
            return result;
          }
        } catch (error) {
          console.error('Vector DB search failed:', error);
          // Continue to next step
        }
      }

      // Step 2: Try MCP (if enabled)
      if (knowledgeConfig.mcp.enabled) {
        const mcpStart = Date.now();
        try {
          const mcpResult = await this.executeMCPTools({
            servers: knowledgeConfig.mcp.selectedServers,
            input,
            agentConfig
          });

          result.mcpLatency = Date.now() - mcpStart;
          result.mcpToolsUsed = mcpResult.toolsUsed;

          if (mcpResult.success && mcpResult.output) {
            result.actualOutput = mcpResult.output;
            result.knowledgeSource = 'mcp';
            result.totalLatency = Date.now() - startTime;
            
            // Evaluate result
            this.evaluateTestResult(result, test);
            return result;
          }

          mcpData = mcpResult.data;
        } catch (error) {
          console.error('MCP execution failed:', error);
          // Continue to LLM
        }
      }

      // Step 3: Fallback to LLM with context
      const llmStart = Date.now();
      const llmContext = {
        retrievedDocs: retrievedDocs,
        mcpData: mcpData
      };

      const llmResponse = await this.callLLM({
        agentType: agentConfig.agentType || agentConfig.agent_type,
        input,
        context: llmContext
      });

      result.llmLatency = Date.now() - llmStart;
      result.actualOutput = llmResponse.content;
      result.knowledgeSource = 
        (retrievedDocs.length > 0 || (result.mcpToolsUsed && result.mcpToolsUsed.length > 0))
          ? 'hybrid'
          : 'llm';

      result.totalLatency = Date.now() - startTime;

      // Evaluate result
      this.evaluateTestResult(result, test);

      return result;

    } catch (error: any) {
      console.error('Test execution failed:', error);
      result.actualOutput = `Error: ${error.message}`;
      result.passed = false;
      result.score = 0;
      result.explanation = `Test execution failed: ${error.message}`;
      result.totalLatency = Date.now() - startTime;
      return result;
    }
  }

  /**
   * Search Vector DB for relevant documents
   */
  private async searchVectorDB(params: {
    indexes: string[];
    query: string;
    topK: number;
    minSimilarity: number;
  }): Promise<VectorDBSearchResult> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/vector-db/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        throw new Error('Vector DB search failed');
      }

      const data = await response.json();
      return data.data || { documents: [], searchLatency: 0 };
    } catch (error) {
      console.error('Vector DB API call failed:', error);
      throw error;
    }
  }

  /**
   * Execute MCP tools
   */
  private async executeMCPTools(params: {
    servers: string[];
    input: string;
    agentConfig: any;
  }): Promise<MCPExecutionResult> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/mcp/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        throw new Error('MCP execution failed');
      }

      const data = await response.json();
      return data.data || { 
        success: false, 
        toolsUsed: [], 
        latency: 0 
      };
    } catch (error) {
      console.error('MCP API call failed:', error);
      throw error;
    }
  }

  /**
   * Call LLM with optional context
   */
  private async callLLM(params: {
    agentType: string;
    input: string;
    context?: any;
  }): Promise<LLMResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/bedrock/invoke`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        throw new Error('LLM call failed');
      }

      const data = await response.json();
      return data.data || { 
        content: '', 
        usage: { input_tokens: 0, output_tokens: 0 }, 
        latency: 0 
      };
    } catch (error) {
      console.error('LLM API call failed:', error);
      throw error;
    }
  }

  /**
   * Evaluate test result and calculate score
   */
  private evaluateTestResult(result: TestResult, test: any): void {
    // Simple evaluation logic - can be enhanced
    const expectedOutput = test.expectedOutput || '';
    const actualOutput = result.actualOutput;

    if (!expectedOutput) {
      // If no expected output, consider it passed if we got a response
      result.passed = actualOutput.length > 0;
      result.score = result.passed ? 100 : 0;
      result.explanation = result.passed 
        ? 'Test passed - response generated successfully'
        : 'Test failed - no response generated';
      return;
    }

    // Check if actual output contains expected output (case-insensitive)
    const actualLower = actualOutput.toLowerCase();
    const expectedLower = expectedOutput.toLowerCase();
    
    if (actualLower.includes(expectedLower)) {
      result.passed = true;
      result.score = 100;
      result.explanation = 'Test passed - output matches expected result';
    } else {
      // Calculate similarity score (simple word overlap)
      const actualWords = new Set(actualLower.split(/\s+/));
      const expectedWords = new Set(expectedLower.split(/\s+/));
      const intersection = new Set(Array.from(actualWords).filter(x => expectedWords.has(x)));
      const similarity = (intersection.size / expectedWords.size) * 100;
      
      result.passed = similarity >= 70; // 70% threshold
      result.score = Math.round(similarity);
      result.explanation = result.passed
        ? `Test passed - ${result.score}% similarity to expected output`
        : `Test failed - only ${result.score}% similarity to expected output`;
    }
  }

  /**
   * Calculate score based on test result
   */
  private calculateScore(test: any, response: string): number {
    // Simple scoring logic - can be enhanced
    if (!test.expectedOutput) {
      return response.length > 0 ? 100 : 0;
    }

    const expected = test.expectedOutput.toLowerCase();
    const actual = response.toLowerCase();

    if (actual.includes(expected)) {
      return 100;
    }

    // Calculate word overlap
    const expectedWords = new Set(expected.split(/\s+/));
    const actualWords = new Set(actual.split(/\s+/));
    const intersection = new Set(Array.from(actualWords).filter(x => expectedWords.has(x)));
    
    return Math.round((intersection.size / expectedWords.size) * 100);
  }

  /**
   * Execute test without knowledge sources (LLM only)
   */
  async executeTestLLMOnly(
    test: any,
    input: string,
    agentConfig: any
  ): Promise<TestResult> {
    const emptyKnowledgeConfig: KnowledgeConfig = {
      vectorDB: {
        enabled: false,
        provider: '',
        knowledgeBases: [],
        retrievalConfig: { topK: 5, minSimilarity: 0.7 }
      },
      mcp: {
        enabled: false,
        selectedServers: []
      }
    };

    return this.executeTestWithKnowledge(test, input, agentConfig, emptyKnowledgeConfig);
  }

  /**
   * Get execution steps for UI display
   */
  getExecutionSteps(knowledgeConfig: KnowledgeConfig): ExecutionStep[] {
    const steps: ExecutionStep[] = [];

    if (knowledgeConfig.vectorDB.enabled) {
      steps.push({
        source: 'vector_db',
        status: 'pending',
        message: `Searching ${knowledgeConfig.vectorDB.knowledgeBases.length} knowledge base(s)...`
      });
    }

    if (knowledgeConfig.mcp.enabled) {
      steps.push({
        source: 'mcp',
        status: 'pending',
        message: `Executing MCP tools from ${knowledgeConfig.mcp.selectedServers.length} server(s)...`
      });
    }

    steps.push({
      source: 'llm',
      status: 'pending',
      message: 'Generating LLM response...'
    });

    return steps;
  }
}

export const testExecutionService = TestExecutionService.getInstance();
export default testExecutionService;
