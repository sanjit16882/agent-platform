/**
 * Vector DB Provider Routes
 * 
 * API endpoints for managing Vector DB providers
 */

import express, { Request, Response } from 'express';
import { vectorDBProviderService } from '../services/vectorDBProviderService';
import { vectorDBConfigService } from '../services/vectorDBConfigService';

const router = express.Router();

/**
 * GET /api/v1/vector-db/access-requests
 * Get all access requests for admin review
 */
router.get('/access-requests', (req: Request, res: Response) => {
  try {
    // Return mock access requests for now
    // In production, this would query the database
    res.json({
      success: true,
      data: []
    });
  } catch (error: any) {
    console.error('Error fetching access requests:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/v1/vector-db/access-requests/:id/approve
 * Approve an access request
 */
router.post('/access-requests/:id/approve', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;
    
    // Mock approval - in production, update database
    res.json({
      success: true,
      message: 'Access request approved',
      data: { id, status: 'approved', comments }
    });
  } catch (error: any) {
    console.error('Error approving request:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/v1/vector-db/access-requests/:id/reject
 * Reject an access request
 */
router.post('/access-requests/:id/reject', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    // Mock rejection - in production, update database
    res.json({
      success: true,
      message: 'Access request rejected',
      data: { id, status: 'rejected', reason }
    });
  } catch (error: any) {
    console.error('Error rejecting request:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/v1/vector-db/providers
 * Get all providers (approved + marketplace)
 */
router.get('/providers', (req: Request, res: Response) => {
  try {
    const providers = vectorDBProviderService.getAllProviders();
    
    res.json({
      success: true,
      data: providers
    });
  } catch (error: any) {
    console.error('Error fetching providers:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/v1/vector-db/providers/approved
 * Get only approved providers
 */
router.get('/providers/approved', (req: Request, res: Response) => {
  try {
    const providers = vectorDBProviderService.getApprovedProviders();
    
    res.json({
      success: true,
      data: providers
    });
  } catch (error: any) {
    console.error('Error fetching approved providers:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/v1/vector-db/providers/marketplace
 * Get only marketplace providers
 */
router.get('/providers/marketplace', (req: Request, res: Response) => {
  try {
    const providers = vectorDBProviderService.getMarketplaceProviders();
    
    res.json({
      success: true,
      data: providers
    });
  } catch (error: any) {
    console.error('Error fetching marketplace providers:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/v1/vector-db/providers/:id
 * Get provider by ID
 */
router.get('/providers/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const provider = vectorDBProviderService.getProviderById(id);
    
    if (!provider) {
      return res.status(404).json({
        success: false,
        error: 'Provider not found'
      });
    }
    
    res.json({
      success: true,
      data: provider
    });
  } catch (error: any) {
    console.error('Error fetching provider:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/v1/vector-db/providers/:id/validate
 * Validate provider configuration
 */
router.post('/providers/:id/validate', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const config = req.body;
    
    const validation = vectorDBProviderService.validateConfiguration(id, config);
    
    res.json({
      success: true,
      data: validation
    });
  } catch (error: any) {
    console.error('Error validating configuration:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/v1/vector-db/providers/search
 * Search providers by query
 */
router.get('/providers/search', (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Query parameter "q" is required'
      });
    }
    
    const providers = vectorDBProviderService.searchProviders(q);
    
    res.json({
      success: true,
      data: providers
    });
  } catch (error: any) {
    console.error('Error searching providers:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/v1/vector-db/providers
 * Add new provider (Admin only)
 */
router.post('/providers', (req: Request, res: Response) => {
  try {
    // TODO: Add authentication and authorization check
    // if (!req.user || req.user.role !== 'admin') {
    //   return res.status(403).json({ success: false, error: 'Forbidden' });
    // }
    
    const provider = req.body;
    const newProvider = vectorDBProviderService.addProvider(provider);
    
    res.status(201).json({
      success: true,
      data: newProvider
    });
  } catch (error: any) {
    console.error('Error adding provider:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/v1/vector-db/providers/:id
 * Update provider (Admin only)
 */
router.put('/providers/:id', (req: Request, res: Response) => {
  try {
    // TODO: Add authentication and authorization check
    
    const { id } = req.params;
    const updates = req.body;
    
    const updatedProvider = vectorDBProviderService.updateProvider(id, updates);
    
    res.json({
      success: true,
      data: updatedProvider
    });
  } catch (error: any) {
    console.error('Error updating provider:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/v1/vector-db/providers/:id
 * Delete provider (Admin only)
 */
router.delete('/providers/:id', (req: Request, res: Response) => {
  try {
    // TODO: Add authentication and authorization check
    
    const { id } = req.params;
    const deleted = vectorDBProviderService.deleteProvider(id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Provider not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Provider deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting provider:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/v1/vector-db/configs
 * Save Vector DB configuration
 */
router.post('/configs', async (req: Request, res: Response) => {
  try {
    const { providerId, providerName, config, userId } = req.body;
    
    if (!providerId || !config) {
      return res.status(400).json({
        success: false,
        error: 'providerId and config are required'
      });
    }
    
    const savedConfig = await vectorDBConfigService.saveConfig(
      providerId,
      providerName || providerId,
      config,
      userId
    );
    
    res.json({
      success: true,
      data: savedConfig,
      message: 'Configuration saved successfully'
    });
  } catch (error: any) {
    console.error('Error saving configuration:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/v1/vector-db/configs
 * Get all saved configurations
 */
router.get('/configs', (req: Request, res: Response) => {
  try {
    const configs = vectorDBConfigService.getAllConfigs();
    
    res.json({
      success: true,
      data: configs
    });
  } catch (error: any) {
    console.error('Error fetching configurations:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/v1/vector-db/configs/:providerId
 * Get configuration for a specific provider
 */
router.get('/configs/:providerId', (req: Request, res: Response) => {
  try {
    const { providerId } = req.params;
    const config = vectorDBConfigService.getConfig(providerId);
    
    if (!config) {
      return res.status(404).json({
        success: false,
        error: 'Configuration not found'
      });
    }
    
    res.json({
      success: true,
      data: config
    });
  } catch (error: any) {
    console.error('Error fetching configuration:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/v1/vector-db/configs/:providerId
 * Delete a saved configuration
 */
router.delete('/configs/:providerId', async (req: Request, res: Response) => {
  try {
    const { providerId } = req.params;
    const deleted = await vectorDBConfigService.deleteConfig(providerId);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Configuration not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Configuration deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting configuration:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
