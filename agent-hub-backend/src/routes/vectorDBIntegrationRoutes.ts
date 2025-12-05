/**
 * Vector DB Integration Routes
 * 
 * API endpoints for managing data source integrations
 */

import express, { Request, Response } from 'express';
import { integrationManager } from '../services/integrations/integrationManager';
import { IntegrationConfig } from '../services/integrations/baseIntegration';

const router = express.Router();

/**
 * POST /api/v1/vector-db/integrations
 * Create/register a new integration
 */
router.post('/integrations', async (req: Request, res: Response) => {
  try {
    const config: IntegrationConfig = req.body;
    
    // Validate required fields
    if (!config.id || !config.name || !config.type) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: id, name, type'
      });
    }
    
    // Register integration
    const integration = integrationManager.registerIntegration(config);
    
    res.json({
      success: true,
      data: integration.getMetadata(),
      message: 'Integration registered successfully'
    });
  } catch (error: any) {
    console.error('Error registering integration:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/v1/vector-db/integrations
 * Get all integrations
 */
router.get('/integrations', (req: Request, res: Response) => {
  try {
    const integrations = integrationManager.getAllIntegrations();
    const metadata = integrations.map(i => i.getMetadata());
    
    res.json({
      success: true,
      data: metadata,
      count: metadata.length
    });
  } catch (error: any) {
    console.error('Error fetching integrations:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/v1/vector-db/integrations/:id
 * Get specific integration
 */
router.get('/integrations/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const integration = integrationManager.getIntegration(id);
    
    if (!integration) {
      return res.status(404).json({
        success: false,
        error: 'Integration not found'
      });
    }
    
    const config = integrationManager.getConfig(id);
    
    res.json({
      success: true,
      data: {
        ...integration.getMetadata(),
        config: config?.config
      }
    });
  } catch (error: any) {
    console.error('Error fetching integration:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/v1/vector-db/integrations/:id
 * Update integration config
 */
router.put('/integrations/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const integration = integrationManager.getIntegration(id);
    if (!integration) {
      return res.status(404).json({
        success: false,
        error: 'Integration not found'
      });
    }
    
    integrationManager.updateConfig(id, updates);
    
    res.json({
      success: true,
      data: integration.getMetadata(),
      message: 'Integration updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating integration:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/v1/vector-db/integrations/:id
 * Delete integration
 */
router.delete('/integrations/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = integrationManager.removeIntegration(id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Integration not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Integration deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting integration:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/v1/vector-db/integrations/:id/test
 * Test integration connection
 */
router.post('/integrations/:id/test', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await integrationManager.testConnection(id);
    
    res.json({
      success: result.success,
      message: result.message
    });
  } catch (error: any) {
    console.error('Error testing integration:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/v1/vector-db/integrations/:id/sync
 * Trigger sync for specific integration
 */
router.post('/integrations/:id/sync', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    console.log(`🔄 Starting sync for integration: ${id}`);
    const result = await integrationManager.syncIntegration(id);
    
    res.json({
      success: result.success,
      data: result,
      message: result.success 
        ? `Sync complete: ${result.documentsImported} documents imported`
        : 'Sync failed'
    });
  } catch (error: any) {
    console.error('Error syncing integration:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/v1/vector-db/integrations/sync-all
 * Sync all enabled integrations
 */
router.post('/integrations/sync-all', async (req: Request, res: Response) => {
  try {
    console.log('🔄 Starting sync for all enabled integrations...');
    const results = await integrationManager.syncAll();
    
    res.json({
      success: true,
      data: results,
      message: `Synced ${results.length} integrations`
    });
  } catch (error: any) {
    console.error('Error syncing all integrations:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/v1/vector-db/integrations/stats
 * Get integration statistics
 */
router.get('/integrations/stats', (req: Request, res: Response) => {
  try {
    const stats = integrationManager.getStatistics();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    console.error('Error fetching integration stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
