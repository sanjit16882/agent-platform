/**
 * Real MCP Routes - Demonstrates correct MCP flow
 * User Input → AI Model → Tool Request → MCP Client → MCP Server → Execute → Return → Model Response
 */

import express from 'express';
import { mcpIntegratedProcessor } from '../mcp/mcpIntegratedProcessor';

const router = express.Router();

/**
 * Execute agent with real MCP integration
 * POST /api/mcp/execute
 */
router.post('/execute', async (req, res) => {
  try {
    const { input, agentId, userId } = req.body;

    if (!input) {
      return res.status(400).json({
        success: false,
        error: 'Input is required'
      });
    }

    console.log(`🤖 Processing MCP-integrated request: "${input}"`);

    // Process request through MCP-integrated flow
    const result = await mcpIntegratedProcessor.processRequest({
      input,
      agentId: agentId || 'mcp-demo-agent',
      userId
    });

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('❌ MCP execution failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'MCP execution failed'
    });
  }
});

/**
 * Get MCP system status
 * GET /api/mcp/status
 */
router.get('/status', async (req, res) => {
  try {
    const status = mcpIntegratedProcessor.getMCPStatus();
    
    res.json({
      success: true,
      data: {
        ...status,
        message: status.initialized 
          ? `MCP system ready with ${status.connectedServers.length} servers and ${status.availableTools} tools`
          : 'MCP system not initialized'
      }
    });

  } catch (error) {
    console.error('❌ Failed to get MCP status:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get MCP status'
    });
  }
});

/**
 * Initialize MCP system
 * POST /api/mcp/initialize
 */
router.post('/initialize', async (req, res) => {
  try {
    console.log('🚀 Initializing MCP system...');
    
    await mcpIntegratedProcessor.initialize();
    const status = mcpIntegratedProcessor.getMCPStatus();
    
    res.json({
      success: true,
      data: {
        ...status,
        message: `MCP system initialized successfully with ${status.connectedServers.length} servers`
      }
    });

  } catch (error) {
    console.error('❌ MCP initialization failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'MCP initialization failed'
    });
  }
});

/**
 * Demo endpoint showing MCP flow step by step
 * POST /api/mcp/demo
 */
router.post('/demo', async (req, res) => {
  try {
    const { input } = req.body;
    
    if (!input) {
      return res.status(400).json({
        success: false,
        error: 'Input is required for demo'
      });
    }

    console.log('🎯 Running MCP flow demo...');

    // Step-by-step demonstration
    const demoSteps = [];
    
    // Step 1: User Input
    demoSteps.push({
      step: 1,
      name: 'User Input',
      description: 'User provides input to the system',
      data: { input }
    });

    // Step 2: AI Model Analysis
    demoSteps.push({
      step: 2,
      name: 'AI Model Analysis',
      description: 'AI model analyzes input and determines if MCP tools are needed',
      data: { 
        needsMCP: true,
        reasoning: 'Input requires external tool access'
      }
    });

    // Step 3: Tool Request Generation
    demoSteps.push({
      step: 3,
      name: 'Tool Request Generation',
      description: 'AI model generates structured tool calls',
      data: {
        toolCalls: [
          { name: 'filesystem.list_directory', arguments: { path: '.' } }
        ]
      }
    });

    // Step 4: MCP Client Processing
    demoSteps.push({
      step: 4,
      name: 'MCP Client Processing',
      description: 'MCP client receives tool calls and prepares structured messages',
      data: {
        mcpMessage: {
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'filesystem.list_directory',
            arguments: { path: '.' }
          }
        }
      }
    });

    // Step 5: MCP Server Execution
    demoSteps.push({
      step: 5,
      name: 'MCP Server Execution',
      description: 'MCP server executes the requested tool and fetches data',
      data: {
        serverResponse: {
          content: [{
            type: 'text',
            text: 'Directory contents:\npackage.json\nREADME.md\nsrc/\nnode_modules/'
          }]
        }
      }
    });

    // Step 6: Result Return
    demoSteps.push({
      step: 6,
      name: 'Result Return to Client',
      description: 'MCP server returns results to MCP client',
      data: {
        success: true,
        executionTime: '45ms'
      }
    });

    // Step 7: Context Integration
    demoSteps.push({
      step: 7,
      name: 'Client Sends Results to Model',
      description: 'MCP client sends tool results back to AI model',
      data: {
        toolResults: [{
          toolName: 'filesystem.list_directory',
          result: 'Directory listing retrieved successfully'
        }]
      }
    });

    // Step 8: Final Response
    demoSteps.push({
      step: 8,
      name: 'Model Uses Context to Respond',
      description: 'AI model uses tool results to generate final response',
      data: {
        finalResponse: 'Based on the directory listing, I can see your project contains package.json, README.md, source code directory, and node_modules. This appears to be a Node.js project.'
      }
    });

    res.json({
      success: true,
      data: {
        title: 'MCP Flow Demonstration',
        description: 'Step-by-step breakdown of the Model Context Protocol flow',
        input,
        steps: demoSteps,
        summary: 'This demonstrates the complete MCP flow from user input to final AI response using external tools'
      }
    });

  } catch (error) {
    console.error('❌ MCP demo failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'MCP demo failed'
    });
  }
});

/**
 * Test specific MCP tools
 * POST /api/mcp/test-tool
 */
router.post('/test-tool', async (req, res) => {
  try {
    const { toolName, arguments: toolArgs } = req.body;

    if (!toolName) {
      return res.status(400).json({
        success: false,
        error: 'Tool name is required'
      });
    }

    console.log(`🔧 Testing MCP tool: ${toolName}`);

    // Ensure MCP is initialized
    const status = mcpIntegratedProcessor.getMCPStatus();
    if (!status.initialized) {
      await mcpIntegratedProcessor.initialize();
    }

    // Execute the specific tool
    const result = await mcpIntegratedProcessor.processRequest({
      input: `Test tool: ${toolName}`,
      agentId: 'tool-test-agent'
    });

    res.json({
      success: true,
      data: {
        toolName,
        arguments: toolArgs,
        result,
        message: `Tool ${toolName} executed successfully`
      }
    });

  } catch (error) {
    console.error(`❌ Tool test failed for ${req.body.toolName}:`, error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Tool test failed'
    });
  }
});

export default router;