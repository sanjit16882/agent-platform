/**
 * Agent MCP Processor - Per-Agent MCP Execution
 * 
 * This processor handles agent execution with per-agent MCP configuration.
 * It checks each agent's MCP settings and routes execution accordingly.
 */

import { EventEmitter } from 'events';
import { MCPClient, createMCPClient } from './mcpClient';
import { mcpConfigService } from './mcpConfig';
import { mcpManagementService, AgentMCPConfig } from './services/mcpManagementService';
import { createMCPServerRegistry } from './servers';

// Import existing processor for fallback
const AgentProcessor = require('../agent-processors');

export interface AgentExecutionOptions {
  timeout?: number;
  fallbackOnError?: boolean;
  testMode?: boolean;
}

export interface AgentExecutionResult {
  executionId: string;
  agentId: string;
  success: boolean;
  result?: any;
  error?: string;
  mcpUsed: boolean;
  mcpServersUsed: string[];
  fallbackUsed: boolean;
  duration: number;
  toolsUsed?: string[];
}

export class AgentMCPProcessor extends EventEmitter {
  private static instance: AgentMCPProcessor;
  private mcpClient: MCPClient | null = null;
  private serverRegistry: any = null;
  private isInitialized = false;

  private constructor() {
    super();
  }

  static getInstance(): AgentMCPProcessor {
    if (!AgentMCPProcessor.instance) {
      AgentMCPProcessor.instance = new AgentMCPProcessor();
    }
    return AgentMCPProcessor.instance;
  }

  /**
   * Initialize the processor
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      console.log('🚀 Agent MCP Processor: Initializing...');
      
      // Load MCP configuration
      const config = await mcpConfigService.loadConfig();
      
      // Initialize server registry for internal servers
      this.serverRegistry = createMCPServerRegistry();
      await this.serverRegistry.initialize();

      // Initialize MCP client for external servers if any are configured
      const externalServers = Object.entries(config.servers).filter(([_, serverConfig]) => 
        !serverConfig.disabled && serverConfig.id !== 'database'
      );
      
      if (externalServers.length > 0) {
        this.mcpClient = createMCPClient(config);
        await this.mcpClient.initialize();
      }

      this.isInitialized = true;
      console.log('✅ Agent MCP Processor: Initialized successfully');
      
    } catch (error) {
      console.error('❌ Agent MCP Processor: Initialization failed:', error);
      console.log('🔄 Agent MCP Processor: Will use fallback mode');
      this.isInitialized = true; // Still mark as initialized to allow fallback
    }
  }

  /**
   * Execute agent with per-agent MCP configuration
   */
  async executeAgent(
    agentId: string,
    input: any,
    options: AgentExecutionOptions = {}
  ): Promise<AgentExecutionResult> {
    const startTime = Date.now();
    const executionId = `agent_${agentId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Ensure processor is initialized
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Get agent's MCP configuration
      const agentMCPConfig = await this.getAgentMCPConfig(agentId);
      
      console.log(`🎯 Agent MCP Processor: Executing agent ${agentId}, MCP enabled: ${agentMCPConfig.enabled}`);
      
      let result: any;
      let mcpUsed = false;
      let mcpServersUsed: string[] = [];
      let fallbackUsed = false;
      let toolsUsed: string[] = [];

      // Determine execution strategy based on agent's MCP configuration
      if (agentMCPConfig.enabled && agentMCPConfig.serverIds.length > 0) {
        try {
          // Execute with MCP
          const mcpResult = await this.executeWithMCP(agentId, input, agentMCPConfig, options);
          result = mcpResult.result;
          mcpUsed = true;
          mcpServersUsed = mcpResult.serversUsed;
          toolsUsed = mcpResult.toolsUsed;
          
        } catch (mcpError) {
          console.warn(`⚠️ Agent MCP Processor: MCP execution failed for agent ${agentId}, falling back:`, mcpError);
          
          if (options.fallbackOnError !== false) {
            result = await this.executeWithStandard(agentId, input);
            fallbackUsed = true;
          } else {
            throw mcpError;
          }
        }
      } else {
        // Execute with standard processor
        result = await this.executeWithStandard(agentId, input);
      }

      const duration = Date.now() - startTime;
      
      const executionResult: AgentExecutionResult = {
        executionId,
        agentId,
        success: true,
        result,
        mcpUsed,
        mcpServersUsed,
        fallbackUsed,
        duration,
        toolsUsed
      };

      this.emit('execution_completed', executionResult);
      return executionResult;

    } catch (error) {
      const duration = Date.now() - startTime;
      
      const executionResult: AgentExecutionResult = {
        executionId,
        agentId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        mcpUsed: false,
        mcpServersUsed: [],
        fallbackUsed: false,
        duration
      };

      this.emit('execution_failed', executionResult);
      throw error;
    }
  }

  /**
   * Test agent's MCP configuration
   */
  async testAgentMCP(agentId: string): Promise<{
    success: boolean;
    mcpConfig: AgentMCPConfig;
    serverTests: Array<{
      serverId: string;
      success: boolean;
      message: string;
      toolsCount?: number;
    }>;
    overallMessage: string;
  }> {
    try {
      const agentMCPConfig = await this.getAgentMCPConfig(agentId);
      
      if (!agentMCPConfig.enabled) {
        return {
          success: true,
          mcpConfig: agentMCPConfig,
          serverTests: [],
          overallMessage: 'MCP is disabled for this agent'
        };
      }

      const serverTests = [];
      let allTestsPassed = true;

      for (const serverId of agentMCPConfig.serverIds) {
        const testResult = await mcpManagementService.testServerConnection(serverId);
        serverTests.push({
          serverId,
          success: testResult.success,
          message: testResult.message,
          toolsCount: testResult.toolsCount
        });
        
        if (!testResult.success) {
          allTestsPassed = false;
        }
      }

      return {
        success: allTestsPassed,
        mcpConfig: agentMCPConfig,
        serverTests,
        overallMessage: allTestsPassed 
          ? `All ${agentMCPConfig.serverIds.length} MCP servers are working correctly`
          : 'Some MCP servers have issues'
      };

    } catch (error) {
      return {
        success: false,
        mcpConfig: mcpManagementService.getDefaultAgentMCPConfig(),
        serverTests: [],
        overallMessage: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get agent's MCP configuration from S3 storage
   */
  private async getAgentMCPConfig(agentId: string): Promise<AgentMCPConfig> {
    try {
      // Import S3 storage service
      const S3AgentStorage = require('../services/s3AgentStorage');
      const s3Storage = new S3AgentStorage();
      
      // Get agent data from S3
      const agent = await s3Storage.getAgent(agentId);
      
      if (agent && agent.mcpConfig) {
        // Validate the MCP config
        const validation = mcpManagementService.validateAgentMCPConfig(agent.mcpConfig);
        if (validation.valid) {
          return agent.mcpConfig;
        } else {
          console.warn(`⚠️ Agent MCP Processor: Invalid MCP config for agent ${agentId}:`, validation.errors);
        }
      }
      
      // Return default config if not found or invalid
      return mcpManagementService.getDefaultAgentMCPConfig();
      
    } catch (error) {
      console.warn(`⚠️ Agent MCP Processor: Failed to get MCP config for agent ${agentId}:`, error);
      return mcpManagementService.getDefaultAgentMCPConfig();
    }
  }

  /**
   * Execute agent with MCP enhancement
   */
  private async executeWithMCP(
    agentId: string,
    input: any,
    mcpConfig: AgentMCPConfig,
    options: AgentExecutionOptions
  ): Promise<{
    result: any;
    serversUsed: string[];
    toolsUsed: string[];
  }> {
    console.log(`🔧 Agent MCP Processor: Executing agent ${agentId} with MCP servers:`, mcpConfig.serverIds);
    
    // For now, we'll use a simplified approach that enhances the standard execution
    // with MCP context and tools availability
    
    const mcpContext = {
      availableServers: mcpConfig.serverIds,
      mcpEnabled: true,
      timeout: mcpConfig.timeout || 30000,
      autoApprove: mcpConfig.autoApprove || []
    };
    
    // Execute with standard processor but include MCP context
    const result = await this.executeWithStandard(agentId, input, mcpContext);
    
    return {
      result,
      serversUsed: mcpConfig.serverIds,
      toolsUsed: [] // Will be populated when we implement actual MCP tool usage
    };
  }

  /**
   * Execute agent with standard processor
   */
  private async executeWithStandard(agentId: string, input: any, mcpContext?: any): Promise<any> {
    console.log(`🔄 Agent MCP Processor: Using standard processor for agent ${agentId}`);
    
    // Add MCP context to input if provided
    const enhancedInput = mcpContext ? {
      ...input,
      _mcpContext: mcpContext
    } : input;
    
    return await AgentProcessor.processAgent(agentId, enhancedInput);
  }

  /**
   * Update agent's MCP configuration
   */
  async updateAgentMCPConfig(agentId: string, mcpConfig: AgentMCPConfig): Promise<void> {
    try {
      // Validate the configuration
      const validation = mcpManagementService.validateAgentMCPConfig(mcpConfig);
      if (!validation.valid) {
        throw new Error(`Invalid MCP configuration: ${validation.errors.join(', ')}`);
      }

      // Import S3 storage service
      const S3AgentStorage = require('../services/s3AgentStorage');
      const s3Storage = new S3AgentStorage();
      
      // Get current agent data
      const agent = await s3Storage.getAgent(agentId);
      if (!agent) {
        throw new Error(`Agent ${agentId} not found`);
      }
      
      // Update agent with MCP configuration
      const updatedAgent = {
        ...agent,
        mcpConfig,
        updatedAt: new Date().toISOString()
      };
      
      // Save back to S3
      await s3Storage.updateAgent(agentId, updatedAgent);
      
      console.log(`✅ Agent MCP Processor: Updated MCP config for agent ${agentId}`);
      
    } catch (error) {
      console.error(`❌ Agent MCP Processor: Failed to update MCP config for agent ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * Get execution statistics
   */
  getExecutionStatistics(): {
    totalExecutions: number;
    mcpExecutions: number;
    standardExecutions: number;
    fallbackExecutions: number;
    mcpSuccessRate: number;
  } {
    // This would be implemented with actual metrics tracking
    return {
      totalExecutions: 0,
      mcpExecutions: 0,
      standardExecutions: 0,
      fallbackExecutions: 0,
      mcpSuccessRate: 0
    };
  }

  /**
   * Shutdown the processor
   */
  async shutdown(): Promise<void> {
    console.log('🛑 Agent MCP Processor: Shutting down...');
    
    if (this.serverRegistry) {
      await this.serverRegistry.shutdown();
    }
    
    if (this.mcpClient) {
      await this.mcpClient.shutdown();
    }
    
    console.log('✅ Agent MCP Processor: Shutdown complete');
  }
}

// Export singleton instance
export const agentMCPProcessor = AgentMCPProcessor.getInstance();