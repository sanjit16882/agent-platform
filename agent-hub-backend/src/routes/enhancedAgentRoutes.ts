/**
 * Enhanced Agent Configuration Routes
 * 
 * Adds Vector DB configuration support to agent management
 * 
 * CRITICAL: These routes EXTEND existing agent functionality
 * without modifying existing routes or breaking backward compatibility
 */

import express, { Request, Response } from 'express';
import { AgentExecutionRouter, AgentConfiguration } from '../services/agentExecutionRouter';
import { VectorDBService } from '../services/vectorDBService';
import { createVectorDBClient } from '../services/vectorDBClient';

const router = express.Router();

// Initialize services
const vectorDBClient = createVectorDBClient();
const vectorDBService = new VectorDBService(vectorDBClient);

// Note: BedrockService and MCP services would be injected in production
// For now, we'll create placeholders
const bedrockService = null;  // Would be injected
const mcpClient = null;  // Would be injected
const mcpConfigService = null;  // Would be injected

const agentExecutionRouter = new AgentExecutionRouter(
  bedrockService as any,
  vectorDBService,
  mcpClient,
  mcpConfigService
);

// ============================================
// Agent Configuration Endpoints (Enhanced)
// ============================================

/**
 * POST /api/v1/agents/enhanced
 * Create agent with Vector DB configuration
 * 
 * This is a NEW endpoint that doesn't modify existing POST /api/v1/agents
 */
router.post('/enhanced', async (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      category,
      llmConfig,
      vectorDB,
      mcpConfig
    } = req.body;
    
    // Validation
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Name is required'
      });
    }
    
    if (!llmConfig || !llmConfig.model) {
      return res.status(400).json({
        success: false,
        error: 'LLM configuration with model is required'
      });
    }
    
    console.log(`🏗️ Creating enhanced agent: ${name}`);
    
    // Generate agent ID
    const agentId = `agent-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    // Create agent configuration
    const agentConfig: AgentConfiguration = {
      agentId,
      name,
      description,
      llmConfig: {
        provider: llmConfig.provider || 'bedrock',
        model: llmConfig.model,
        temperature: llmConfig.temperature || 0.7,
        maxTokens: llmConfig.maxTokens || 2000
      },
      vectorDB: vectorDB ? {
        enabled: vectorDB.enabled || false,
        provider: vectorDB.provider || process.env.VECTOR_DB_PROVIDER || 'mock',
        knowledgeBases: vectorDB.knowledgeBases || [],
        retrievalConfig: {
          topK: vectorDB.retrievalConfig?.topK || 5,
          minSimilarity: vectorDB.retrievalConfig?.minSimilarity || 0.7,
          maxTokens: vectorDB.retrievalConfig?.maxTokens
        }
      } : undefined,
      mcpConfig: mcpConfig ? {
        enabled: mcpConfig.enabled || false,
        serverId: mcpConfig.serverId,
        autoInvoke: mcpConfig.autoInvoke !== false
      } : undefined
    };
    
    // Calculate execution mode and estimates
    const executionMode = determineExecutionMode(agentConfig);
    const estimates = calculateEstimates(agentConfig);
    
    // Store agent configuration (in production, this would be in database)
    // For now, we'll just return the configuration
    
    res.status(201).json({
      success: true,
      agent: {
        ...agentConfig,
        executionMode,
        estimatedCost: estimates.cost,
        estimatedLatency: estimates.latency,
        createdAt: new Date().toISOString()
      }
    });
    
  } catch (error: any) {
    console.error('✗ Failed to create enhanced agent:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/v1/agents/:id/vector-config
 * Update agent Vector DB configuration
 * 
 * This is a NEW endpoint that adds Vector DB config without modifying existing agent
 */
router.put('/:id/vector-config', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { vectorDB } = req.body;
    
    console.log(`🔧 Updating Vector DB config for agent: ${id}`);
    
    // Validation
    if (!vectorDB) {
      return res.status(400).json({
        success: false,
        error: 'Vector DB configuration is required'
      });
    }
    
    // In production, this would update the agent in database
    // For now, we'll just return the updated configuration
    
    const updatedConfig = {
      enabled: vectorDB.enabled || false,
      provider: vectorDB.provider || process.env.VECTOR_DB_PROVIDER || 'mock',
      knowledgeBases: vectorDB.knowledgeBases || [],
      retrievalConfig: {
        topK: vectorDB.retrievalConfig?.topK || 5,
        minSimilarity: vectorDB.retrievalConfig?.minSimilarity || 0.7,
        maxTokens: vectorDB.retrievalConfig?.maxTokens
      }
    };
    
    res.json({
      success: true,
      vectorDB: updatedConfig,
      message: 'Vector DB configuration updated successfully'
    });
    
  } catch (error: any) {
    console.error('✗ Failed to update Vector DB config:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/v1/agents/:id/execution-mode
 * Get agent execution mode and capabilities
 */
router.get('/:id/execution-mode', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    console.log(`📊 Getting execution mode for agent: ${id}`);
    
    // In production, this would load agent from database
    // For now, we'll return a sample response
    
    // Sample agent configuration
    const agentConfig: AgentConfiguration = {
      agentId: id,
      name: 'Sample Agent',
      llmConfig: {
        provider: 'bedrock',
        model: 'claude-3-sonnet'
      },
      vectorDB: {
        enabled: true,
        provider: 'opensearch',
        knowledgeBases: ['kb-1'],
        retrievalConfig: {
          topK: 5,
          minSimilarity: 0.7
        }
      },
      mcpConfig: {
        enabled: true,
        serverId: 'mcp-server-1'
      }
    };
    
    const executionMode = determineExecutionMode(agentConfig);
    const estimates = calculateEstimates(agentConfig);
    
    res.json({
      success: true,
      mode: executionMode,
      capabilities: {
        vectorDB: agentConfig.vectorDB?.enabled || false,
        mcp: agentConfig.mcpConfig?.enabled || false
      },
      estimatedCost: estimates.cost,
      estimatedLatency: estimates.latency
    });
    
  } catch (error: any) {
    console.error('✗ Failed to get execution mode:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/v1/agents/:id/execute-enhanced
 * Execute agent with enhanced routing (Vector DB + MCP support)
 * 
 * This is a NEW endpoint that uses AgentExecutionRouter
 */
router.post('/:id/execute-enhanced', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { query, context } = req.body;
    
    // Validation
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query is required'
      });
    }
    
    console.log(`🚀 Executing enhanced agent: ${id}`);
    console.log(`   Query: "${query.substring(0, 50)}..."`);
    
    // In production, this would load agent configuration from database
    // For now, we'll create a sample configuration
    const agentConfig: AgentConfiguration = {
      agentId: id,
      name: 'Sample Agent',
      llmConfig: {
        provider: 'bedrock',
        model: 'claude-3-sonnet'
      },
      vectorDB: {
        enabled: false,  // Would be loaded from database
        provider: 'mock',
        knowledgeBases: [],
        retrievalConfig: {
          topK: 5,
          minSimilarity: 0.7
        }
      }
    };
    
    // Execute using AgentExecutionRouter
    const result = await agentExecutionRouter.executeAgent(query, agentConfig, context);
    
    res.json({
      success: result.success,
      content: result.content,
      mode: result.mode,
      usage: result.usage,
      cost: result.cost,
      latency: result.latency,
      metadata: result.metadata,
      error: result.error
    });
    
  } catch (error: any) {
    console.error('✗ Enhanced execution failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/v1/agents/:id/config
 * Get complete agent configuration including Vector DB and MCP
 */
router.get('/:id/config', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    console.log(`📖 Getting complete config for agent: ${id}`);
    
    // In production, this would load from database
    // For now, return sample configuration
    
    const agentConfig: AgentConfiguration = {
      agentId: id,
      name: 'Sample Agent',
      description: 'Sample agent with Vector DB and MCP',
      llmConfig: {
        provider: 'bedrock',
        model: 'claude-3-sonnet',
        temperature: 0.7,
        maxTokens: 2000
      },
      vectorDB: {
        enabled: false,
        provider: 'mock',
        knowledgeBases: [],
        retrievalConfig: {
          topK: 5,
          minSimilarity: 0.7
        }
      },
      mcpConfig: {
        enabled: false,
        serverId: ''
      }
    };
    
    const executionMode = determineExecutionMode(agentConfig);
    const estimates = calculateEstimates(agentConfig);
    
    res.json({
      success: true,
      config: {
        ...agentConfig,
        executionMode,
        estimatedCost: estimates.cost,
        estimatedLatency: estimates.latency
      }
    });
    
  } catch (error: any) {
    console.error('✗ Failed to get agent config:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// Helper Functions
// ============================================

/**
 * Determine execution mode based on configuration
 */
function determineExecutionMode(config: AgentConfiguration): string {
  const hasVectorDB = config.vectorDB?.enabled === true;
  const hasMCP = config.mcpConfig?.enabled === true || !!config.mcpServer;
  
  if (!hasVectorDB && !hasMCP) return 'bedrock-only';
  if (hasVectorDB && !hasMCP) return 'rag';
  if (!hasVectorDB && hasMCP) return 'mcp';
  if (hasVectorDB && hasMCP) return 'full-stack';
  
  return 'bedrock-only';
}

/**
 * Calculate cost and latency estimates
 */
function calculateEstimates(config: AgentConfiguration): {
  cost: { perQuery: number; breakdown: any };
  latency: { average: number; breakdown: any };
} {
  let costPerQuery = 0.50;  // Base Bedrock cost
  let avgLatency = 500;     // Base Bedrock latency
  
  const breakdown = {
    llm: 0.50,
    vectorDB: 0,
    mcp: 0
  };
  
  const latencyBreakdown = {
    llm: 500,
    vectorDB: 0,
    mcp: 0
  };
  
  // Add Vector DB cost and latency
  if (config.vectorDB?.enabled) {
    breakdown.vectorDB = 0.25;
    costPerQuery += 0.25;
    
    latencyBreakdown.vectorDB = 200;
    avgLatency += 200;
  }
  
  // Add MCP cost and latency
  if (config.mcpConfig?.enabled || config.mcpServer) {
    breakdown.mcp = 0.10;
    costPerQuery += 0.10;
    
    latencyBreakdown.mcp = 500;
    avgLatency += 500;
  }
  
  return {
    cost: {
      perQuery: costPerQuery,
      breakdown
    },
    latency: {
      average: avgLatency,
      breakdown: latencyBreakdown
    }
  };
}

// ============================================
// Export Router
// ============================================

export default router;
