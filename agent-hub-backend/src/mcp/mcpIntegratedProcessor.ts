/**
 * MCP-Integrated Agent Processor
 * Implements the correct MCP flow:
 * User Input → AI Model → Tool Request → MCP Client → MCP Server → Execute → Return → Model Response
 */

import { realMCPClient, MCPToolCall, MCPToolResult } from './realMCPClient';

export interface AgentRequest {
  input: string;
  agentId: string;
  userId?: string;
  context?: Record<string, any>;
}

export interface AgentResponse {
  success: boolean;
  response: string;
  toolCalls?: MCPToolCall[];
  toolResults?: MCPToolResult[];
  processingTime: number;
  metadata: {
    mcpToolsUsed: number;
    mcpServersConnected: string[];
    processingSteps: string[];
  };
}

export class MCPIntegratedProcessor {
  private isInitialized = false;

  /**
   * Initialize MCP connections
   * This happens when the processor starts, not during agent creation
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('🚀 Initializing MCP-Integrated Agent Processor...');
    
    try {
      // Connect to available MCP servers
      await realMCPClient.connectToServers();
      
      const connectionStatus = realMCPClient.getConnectionStatus();
      const connectedServers = Object.entries(connectionStatus)
        .filter(([_, connected]) => connected)
        .map(([server, _]) => server);

      console.log(`✅ MCP Processor initialized with ${connectedServers.length} servers:`, connectedServers);
      this.isInitialized = true;
    } catch (error) {
      console.error('❌ Failed to initialize MCP processor:', error);
      throw error;
    }
  }

  /**
   * Process agent request with MCP integration
   * Follows the correct MCP flow
   */
  async processRequest(request: AgentRequest): Promise<AgentResponse> {
    const startTime = Date.now();
    const processingSteps: string[] = [];
    
    try {
      // Ensure MCP is initialized
      if (!this.isInitialized) {
        await this.initialize();
      }

      processingSteps.push('MCP processor initialized');

      // Step 1: Analyze user input and determine if MCP tools are needed
      const analysisResult = await this.analyzeInputForMCPNeeds(request.input);
      processingSteps.push(`Input analyzed: ${analysisResult.needsMCP ? 'MCP tools required' : 'No MCP tools needed'}`);

      if (!analysisResult.needsMCP) {
        // Process without MCP tools
        const response = await this.processWithoutMCP(request.input);
        return {
          success: true,
          response,
          processingTime: Date.now() - startTime,
          metadata: {
            mcpToolsUsed: 0,
            mcpServersConnected: Object.keys(realMCPClient.getConnectionStatus()),
            processingSteps
          }
        };
      }

      // Step 2: Get available MCP tools
      const availableTools = realMCPClient.getAvailableTools();
      processingSteps.push(`Available MCP tools: ${availableTools.length}`);

      // Step 3: Generate AI model response with tool calls
      const modelResponse = await this.generateModelResponseWithTools(request.input, availableTools);
      processingSteps.push(`Model generated ${modelResponse.toolCalls.length} tool calls`);

      // Step 4: Execute MCP tool calls
      const toolResults: MCPToolResult[] = [];
      for (const toolCall of modelResponse.toolCalls) {
        processingSteps.push(`Executing MCP tool: ${toolCall.name}`);
        const result = await realMCPClient.executeToolCall(toolCall);
        toolResults.push(result);
      }

      // Step 5: Generate final response using tool results
      const finalResponse = await this.generateFinalResponse(request.input, modelResponse.toolCalls, toolResults);
      processingSteps.push('Final response generated with MCP tool results');

      return {
        success: true,
        response: finalResponse,
        toolCalls: modelResponse.toolCalls,
        toolResults,
        processingTime: Date.now() - startTime,
        metadata: {
          mcpToolsUsed: toolResults.length,
          mcpServersConnected: Object.keys(realMCPClient.getConnectionStatus()).filter(server => 
            realMCPClient.getConnectionStatus()[server]
          ),
          processingSteps
        }
      };

    } catch (error) {
      console.error('❌ MCP processing failed:', error);
      
      // Fallback to non-MCP processing
      const fallbackResponse = await this.processWithoutMCP(request.input);
      processingSteps.push('Fallback to non-MCP processing due to error');

      return {
        success: true,
        response: `${fallbackResponse}\n\n(Note: MCP tools were unavailable, processed with standard capabilities)`,
        processingTime: Date.now() - startTime,
        metadata: {
          mcpToolsUsed: 0,
          mcpServersConnected: [],
          processingSteps
        }
      };
    }
  }

  /**
   * Analyze user input to determine if MCP tools are needed
   */
  private async analyzeInputForMCPNeeds(input: string): Promise<{ needsMCP: boolean; suggestedTools: string[] }> {
    const lowerInput = input.toLowerCase();
    const suggestedTools: string[] = [];

    // File system operations
    if (lowerInput.includes('file') || lowerInput.includes('directory') || lowerInput.includes('folder') || 
        lowerInput.includes('read') || lowerInput.includes('list') || lowerInput.includes('search')) {
      suggestedTools.push('filesystem.read_file', 'filesystem.list_directory', 'filesystem.search_files');
    }

    // Database operations
    if (lowerInput.includes('database') || lowerInput.includes('query') || lowerInput.includes('sql') ||
        lowerInput.includes('table') || lowerInput.includes('schema')) {
      suggestedTools.push('database.execute_query', 'database.get_schema');
    }

    // Git operations
    if (lowerInput.includes('git') || lowerInput.includes('commit') || lowerInput.includes('repository') ||
        lowerInput.includes('changes') || lowerInput.includes('history')) {
      suggestedTools.push('git.get_commit_history', 'git.analyze_changes');
    }

    // Code analysis
    if (lowerInput.includes('analyze') || lowerInput.includes('review') || lowerInput.includes('code')) {
      suggestedTools.push('filesystem.read_file', 'git.get_commit_history');
    }

    return {
      needsMCP: suggestedTools.length > 0,
      suggestedTools
    };
  }

  /**
   * Generate AI model response with tool calls
   * This simulates how an LLM would decide to use MCP tools
   */
  private async generateModelResponseWithTools(input: string, availableTools: any[]): Promise<{ 
    response: string; 
    toolCalls: MCPToolCall[] 
  }> {
    const toolCalls: MCPToolCall[] = [];
    const lowerInput = input.toLowerCase();

    // Simulate AI model deciding which tools to use based on input
    if (lowerInput.includes('list files') || lowerInput.includes('show directory')) {
      toolCalls.push({
        name: 'filesystem.list_directory',
        arguments: { path: '.' }
      });
    }

    if (lowerInput.includes('read file') || lowerInput.includes('show file content')) {
      // Extract file path from input (simplified)
      const fileMatch = input.match(/(?:read|show|file)\s+([^\s]+\.\w+)/i);
      const filePath = fileMatch ? fileMatch[1] : 'README.md';
      
      toolCalls.push({
        name: 'filesystem.read_file',
        arguments: { path: filePath }
      });
    }

    if (lowerInput.includes('git history') || lowerInput.includes('recent commits')) {
      toolCalls.push({
        name: 'git.get_commit_history',
        arguments: { limit: 10 }
      });
    }

    if (lowerInput.includes('database') || lowerInput.includes('query')) {
      toolCalls.push({
        name: 'database.get_schema',
        arguments: {}
      });
    }

    if (lowerInput.includes('search') && lowerInput.includes('files')) {
      const searchMatch = input.match(/search.*?(?:for\s+)?([^\s]+)/i);
      const searchTerm = searchMatch ? searchMatch[1] : 'js';
      
      toolCalls.push({
        name: 'filesystem.search_files',
        arguments: { pattern: searchTerm, path: '.' }
      });
    }

    return {
      response: `I'll help you with that. Let me use the appropriate tools to gather the information you need.`,
      toolCalls
    };
  }

  /**
   * Generate final response using tool results
   * This simulates how an LLM would use MCP tool results to create a response
   */
  private async generateFinalResponse(
    originalInput: string, 
    toolCalls: MCPToolCall[], 
    toolResults: MCPToolResult[]
  ): Promise<string> {
    let response = `Based on your request: "${originalInput}"\n\n`;

    for (let i = 0; i < toolCalls.length; i++) {
      const toolCall = toolCalls[i];
      const result = toolResults[i];

      if (result.isError) {
        response += `❌ Error executing ${toolCall.name}: ${result.content[0]?.text || 'Unknown error'}\n\n`;
        continue;
      }

      response += `✅ **${toolCall.name}** results:\n`;
      
      for (const content of result.content) {
        if (content.type === 'text' && content.text) {
          response += `${content.text}\n\n`;
        }
      }
    }

    // Add AI-generated analysis/summary
    response += `**Analysis:**\n`;
    response += `I've executed ${toolCalls.length} MCP tool(s) to gather this information. `;
    
    if (toolCalls.some(tc => tc.name.includes('filesystem'))) {
      response += `The file system analysis shows the current project structure and contents. `;
    }
    
    if (toolCalls.some(tc => tc.name.includes('git'))) {
      response += `The git history provides context about recent changes and development activity. `;
    }
    
    if (toolCalls.some(tc => tc.name.includes('database'))) {
      response += `The database information shows the available data structure and schema. `;
    }

    response += `This information should help you understand the current state and make informed decisions.`;

    return response;
  }

  /**
   * Process request without MCP tools (fallback)
   */
  private async processWithoutMCP(input: string): Promise<string> {
    // Simulate standard AI processing without external tools
    return `I understand you're asking about: "${input}"\n\nI can help with general information and analysis, but I don't have access to external tools or real-time data for this request. If you need me to access files, databases, or other external resources, please ensure MCP servers are properly configured and connected.`;
  }

  /**
   * Get MCP status information
   */
  getMCPStatus(): {
    initialized: boolean;
    connectedServers: string[];
    availableTools: number;
  } {
    const connectionStatus = realMCPClient.getConnectionStatus();
    
    return {
      initialized: this.isInitialized,
      connectedServers: Object.entries(connectionStatus)
        .filter(([_, connected]) => connected)
        .map(([server, _]) => server),
      availableTools: realMCPClient.getAvailableTools().length
    };
  }

  /**
   * Shutdown MCP connections
   */
  async shutdown(): Promise<void> {
    if (this.isInitialized) {
      await realMCPClient.disconnect();
      this.isInitialized = false;
      console.log('🔌 MCP processor shutdown complete');
    }
  }
}

export const mcpIntegratedProcessor = new MCPIntegratedProcessor();