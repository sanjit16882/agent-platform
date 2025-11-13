/**
 * Vector DB Access Request Routes
 * 
 * API endpoints for managing access requests
 */

import express, { Request, Response } from 'express';
import { vectorDBAccessRequestService } from '../services/vectorDBAccessRequestService';

const router = express.Router();

/**
 * POST /api/v1/vector-db/access-requests
 * Submit a new access request
 */
router.post('/access-requests', (req: Request, res: Response) => {
  try {
    const {
      providerId,
      providerName,
      businessJustification,
      estimatedUsage,
      configuration
    } = req.body;
    
    // Validate required fields
    if (!providerId || !providerName || !businessJustification) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }
    
    // TODO: Get user info from authentication
    const userId = 'user-' + Date.now();
    const userEmail = 'user@company.com';
    
    const request = vectorDBAccessRequestService.submitRequest({
      providerId,
      providerName,
      requestedBy: userId,
      requestedByEmail: userEmail,
      businessJustification,
      estimatedUsage: estimatedUsage || {
        documents: 10000,
        queriesPerMonth: 50000,
        teamSize: 5
      },
      configuration: configuration || {}
    });
    
    res.status(201).json({
      success: true,
      data: request,
      message: 'Access request submitted successfully'
    });
  } catch (error: any) {
    console.error('Error submitting access request:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/v1/vector-db/access-requests
 * Get all access requests (Admin only)
 */
router.get('/access-requests', (req: Request, res: Response) => {
  try {
    // TODO: Check admin authorization
    
    const requests = vectorDBAccessRequestService.getAllRequests();
    
    res.json({
      success: true,
      data: requests
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
 * GET /api/v1/vector-db/access-requests/pending
 * Get pending access requests (Admin only)
 */
router.get('/access-requests/pending', (req: Request, res: Response) => {
  try {
    // TODO: Check admin authorization
    
    const requests = vectorDBAccessRequestService.getRequestsByStatus('pending');
    
    res.json({
      success: true,
      data: requests
    });
  } catch (error: any) {
    console.error('Error fetching pending requests:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/v1/vector-db/access-requests/my-requests
 * Get current user's access requests
 */
router.get('/access-requests/my-requests', (req: Request, res: Response) => {
  try {
    // TODO: Get user ID from authentication
    const userId = 'user-' + Date.now();
    
    const requests = vectorDBAccessRequestService.getRequestsByUser(userId);
    
    res.json({
      success: true,
      data: requests
    });
  } catch (error: any) {
    console.error('Error fetching user requests:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/v1/vector-db/access-requests/:id
 * Get specific access request
 */
router.get('/access-requests/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const request = vectorDBAccessRequestService.getRequestById(id);
    
    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Request not found'
      });
    }
    
    res.json({
      success: true,
      data: request
    });
  } catch (error: any) {
    console.error('Error fetching request:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/v1/vector-db/access-requests/:id/approve
 * Approve an access request (Admin only)
 */
router.post('/access-requests/:id/approve', (req: Request, res: Response) => {
  try {
    // TODO: Check admin authorization
    const approverId = 'admin-1'; // TODO: Get from auth
    
    const { id } = req.params;
    const { comments } = req.body;
    
    const request = vectorDBAccessRequestService.approveRequest(id, approverId, comments);
    
    res.json({
      success: true,
      data: request,
      message: 'Request approved successfully'
    });
  } catch (error: any) {
    console.error('Error approving request:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/v1/vector-db/access-requests/:id/reject
 * Reject an access request (Admin only)
 */
router.post('/access-requests/:id/reject', (req: Request, res: Response) => {
  try {
    // TODO: Check admin authorization
    const approverId = 'admin-1'; // TODO: Get from auth
    
    const { id } = req.params;
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({
        success: false,
        error: 'Rejection reason is required'
      });
    }
    
    const request = vectorDBAccessRequestService.rejectRequest(id, approverId, reason);
    
    res.json({
      success: true,
      data: request,
      message: 'Request rejected'
    });
  } catch (error: any) {
    console.error('Error rejecting request:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/v1/vector-db/access-requests/stats
 * Get access request statistics (Admin only)
 */
router.get('/access-requests/stats', (req: Request, res: Response) => {
  try {
    // TODO: Check admin authorization
    
    const stats = vectorDBAccessRequestService.getStatistics();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
