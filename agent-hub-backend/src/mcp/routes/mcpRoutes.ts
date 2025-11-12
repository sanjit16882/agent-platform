/**
 * MCP API Routes - Per-Agent MCP Management
 */

import { Router, Request, Response } from 'express';
import { mcpManagementService, AgentMCPConfig } from '../services/mcpManagementService';
import { agentMCPProcessor } from '../agentMCPProcessor';
import { mcpConfigService } from '../mcpConfig';
import { MCPServerConfig } from '../types/mcpTypes';

const router = Router();

// MCP Server Management Routes
router.get('/servers', async (req: Request, res: Response) => {
  try {
    const servers = await mcpManagementService.getAllServers();
    res.json({
      success: true,
      servers,
      count: servers.length
    });
  } catch (error) {
    console.error('❌ MCP Routes: Failed to get servers:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get servers'
    });
  }
});

router.get('/servers/available', async (req: Request, res: Response) => {
  try {
    const servers = await mcpManagementService.getAvailableServers();
    res.json({
      success: true,
      servers,
      count: servers.length
    });
  } catch (error) {
    console.error('❌ MCP Routes: Failed to get available servers:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get available servers'
    });
  }
});

router.post('/servers', async (req: Request, res: Response) => {
  try {
    const serverConfig: MCPServerConfig = req.body;
    
    if (!serverConfig.id || !serverConfig.name || !serverConfig.command) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: id, name, command'
      });
    }

    await mcpManagementService.addServer(serverConfig);
    
    res.status(201).json({
      success: true,
      message: `MCP server ${serverConfig.id} added successfully`
    });
  } catch (error) {
    console.error('❌ MCP Routes: Failed to add server:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add server'
    });
  }
});

router.put('/servers/:serverId', async (req: Request, res: Response) => {
  try {
    const { serverId } = req.params;
    const updates = req.body;
    
    await mcpManagementService.updateServer(serverId, updates);
    
    res.json({
      success: true,
      message: `MCP server ${serverId} updated successfully`
    });
  } catch (error) {
    console.error('❌ MCP Routes: Failed to update server:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update server'
    });
  }
});

router.delete('/servers/:serverId', async (req: Request, res: Response) => {
  try {
    const { serverId } = req.params;
    
    await mcpManagementService.removeServer(serverId);
    
    res.json({
      success: true,
      message: `MCP server ${serverId} removed successfully`
    });
  } catch (error) {
    console.error('❌ MCP Routes: Failed to remove server:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove server'
    });
  }
});

// Per-Agent MCP Configuration Routes
router.get('/agents/:agentId/config', async (req: Request, res: Response) => {
  try {
    const { agentId } = req.params;
    
    const S3AgentStorage = require('../../services/s3AgentStorage');
    const s3Storage = new S3AgentStorage();
    
    const agent = await s3Storage.getAgent(agentId);
    
    if (!agent) {
      return res.status(404).json({
        success: false,
        error: `Agent ${agentId} not found`
      });
    }
    
    const mcpConfig = agent.mcpConfig || mcpManagementService.getDefaultAgentMCPConfig();
    
    res.json({
      success: true,
      agentId,
      mcpConfig
    });
  } catch (error) {
    console.error('❌ MCP Routes: Failed to get agent MCP config:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get agent MCP config'
    });
  }
});

router.put('/agents/:agentId/config', async (req: Request, res: Response) => {
  try {
    const { agentId } = req.params;
    const mcpConfig: AgentMCPConfig = req.body;
    
    const validation = mcpManagementService.validateAgentMCPConfig(mcpConfig);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid MCP configuration',
        details: validation.errors
      });
    }
    
    await agentMCPProcessor.updateAgentMCPConfig(agentId, mcpConfig);
    
    res.json({
      success: true,
      message: `MCP configuration updated for agent ${agentId}`
    });
  } catch (error) {
    console.error('❌ MCP Routes: Failed to update agent MCP config:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update agent MCP config'
    });
  }
});

router.post('/agents/:agentId/execute', async (req: Request, res: Response) => {
  try {
    const { agentId } = req.params;
    const { input, options = {} } = req.body;
    
    if (!input) {
      return res.status(400).json({
        success: false,
        error: 'Input is required for agent execution'
      });
    }
    
    const result = await agentMCPProcessor.executeAgent(agentId, input, options);
    
    res.json({
      ...result
    });
  } catch (error) {
    console.error('❌ MCP Routes: Failed to execute agent:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to execute agent'
    });
  }
});

router.get('/status', async (req: Request, res: Response) => {
  try {
    const config = await mcpConfigService.loadConfig();
    const servers = await mcpManagementService.getAllServers();
    const stats = agentMCPProcessor.getExecutionStatistics();
    
    const connectedServers = servers.filter(s => s.status === 'connected').length;
    const totalServers = servers.length;
    
    res.json({
      success: true,
      status: {
        mcpEnabled: config.enabled,
        serversConnected: connectedServers,
        serversTotal: totalServers,
        fallbackAvailable: config.fallbackAlways,
        executionStats: stats
      },
      servers: servers.map(s => ({
        id: s.id,
        name: s.name,
        status: s.status,
        toolsCount: s.toolsCount
      }))
    });
  } catch (error) {
    console.error('❌ MCP Routes: Failed to get status:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get MCP status'
    });
  }
});

export default router;