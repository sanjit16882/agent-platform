import express from 'express';
import { mcpIntegrationService } from './mcpIntegrationService';
import { MCPIntegrationConfig } from './mcpIntegrationService';

const router = express.Router();

// Get available MCP servers
router.get('/servers', async (req, res) => {
  try {
    const servers = mcpIntegrationService.getAvailableServers();
    res.json({
      success: true,
      data: servers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get MCP servers'
    });
  }
});

// Get featured MCP servers for agent creation
router.get('/servers/featured', async (req, res) => {
  try {
    const servers = mcpIntegrationService.getFeaturedServers();
    res.json({
      success: true,
      data: servers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get featured MCP servers'
    });
  }
});

// Get suggested MCP servers based on agent context
router.post('/servers/suggestions', async (req, res) => {
  try {
    const { agentType, agentDescription } = req.body;
    
    if (!agentType || !agentDescription) {
      return res.status(400).json({
        success: false,
        error: 'Agent type and description are required'
      });
    }

    const suggestions = mcpIntegrationService.getSuggestedServers(agentType, agentDescription);
    res.json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get MCP suggestions'
    });
  }
});

// Configure MCP for an agent
router.post('/agents/:agentId/configure', async (req, res) => {
  try {
    const { agentId } = req.params;
    const config: MCPIntegrationConfig = req.body;

    if (!config.selectedServers || !Array.isArray(config.selectedServers)) {
      return res.status(400).json({
        success: false,
        error: 'Selected servers array is required'
      });
    }

    const agentMCPConfig = await mcpIntegrationService.configureAgentMCP(agentId, config);
    res.json({
      success: true,
      data: agentMCPConfig
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to configure MCP for agent'
    });
  }
});

// Get MCP configuration for an agent
router.get('/agents/:agentId/config', async (req, res) => {
  try {
    const { agentId } = req.params;
    const config = await mcpIntegrationService.getAgentMCPConfig(agentId);
    
    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get agent MCP configuration'
    });
  }
});

// Update MCP configuration for an agent
router.put('/agents/:agentId/config', async (req, res) => {
  try {
    const { agentId } = req.params;
    const updates = req.body;

    const updatedConfig = await mcpIntegrationService.updateAgentMCPConfig(agentId, updates);
    res.json({
      success: true,
      data: updatedConfig
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update agent MCP configuration'
    });
  }
});

// Remove MCP configuration from an agent
router.delete('/agents/:agentId/config', async (req, res) => {
  try {
    const { agentId } = req.params;
    await mcpIntegrationService.removeAgentMCPConfig(agentId);
    
    res.json({
      success: true,
      message: 'MCP configuration removed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove agent MCP configuration'
    });
  }
});

// Check if agent has MCP configuration
router.get('/agents/:agentId/has-mcp', async (req, res) => {
  try {
    const { agentId } = req.params;
    const hasMCP = await mcpIntegrationService.hasAgentMCPConfig(agentId);
    
    res.json({
      success: true,
      data: { hasMCP }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check agent MCP status'
    });
  }
});

// Validate MCP server configuration
router.post('/servers/:serverId/validate', async (req, res) => {
  try {
    const { serverId } = req.params;
    const config = req.body;

    const validation = await mcpIntegrationService.validateServerConfig(serverId, config);
    res.json({
      success: true,
      data: validation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to validate server configuration'
    });
  }
});

// Test MCP server connection
router.post('/servers/:serverId/test', async (req, res) => {
  try {
    const { serverId } = req.params;
    const config = req.body;

    const connectionTest = await mcpIntegrationService.testServerConnection(serverId, config);
    res.json({
      success: true,
      data: connectionTest
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to test server connection'
    });
  }
});

// Get MCP usage analytics
router.get('/analytics', async (req, res) => {
  try {
    const analytics = await mcpIntegrationService.getMCPUsageAnalytics();
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get MCP analytics'
    });
  }
});

// Get MCP server health status
router.get('/servers/health', async (req, res) => {
  try {
    const healthStatus = await mcpIntegrationService.getServerHealthStatus();
    res.json({
      success: true,
      data: healthStatus
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get server health status'
    });
  }
});

export default router;