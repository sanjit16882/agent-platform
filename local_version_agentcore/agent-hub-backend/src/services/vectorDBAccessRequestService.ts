/**
 * VectorDBAccessRequestService
 * 
 * Manages access requests for marketplace Vector DB providers
 */

import { VectorDBAccessRequest } from '../models/vectorDBAccessRequest';

export class VectorDBAccessRequestService {
  
  private requests: Map<string, VectorDBAccessRequest>;
  private requestCounter: number;
  
  constructor() {
    this.requests = new Map();
    this.requestCounter = 1;
    
    console.log('✅ VectorDBAccessRequestService initialized');
  }
  
  /**
   * Submit a new access request
   */
  submitRequest(request: Omit<VectorDBAccessRequest, 'id' | 'requestedAt' | 'updatedAt' | 'status' | 'approvers'>): VectorDBAccessRequest {
    const requestId = `req-${Date.now()}-${this.requestCounter++}`;
    
    const newRequest: VectorDBAccessRequest = {
      ...request,
      id: requestId,
      requestedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'pending',
      approvers: [
        {
          userId: 'admin-1',
          email: 'admin@company.com',
          role: 'admin',
          status: 'pending'
        },
        {
          userId: 'security-1',
          email: 'security@company.com',
          role: 'security',
          status: 'pending'
        }
      ]
    };
    
    this.requests.set(requestId, newRequest);
    
    console.log(`✅ Access request submitted: ${requestId} for ${request.providerName}`);
    
    return newRequest;
  }
  
  /**
   * Get all requests
   */
  getAllRequests(): VectorDBAccessRequest[] {
    return Array.from(this.requests.values())
      .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
  }
  
  /**
   * Get requests by status
   */
  getRequestsByStatus(status: VectorDBAccessRequest['status']): VectorDBAccessRequest[] {
    return Array.from(this.requests.values())
      .filter(r => r.status === status)
      .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
  }
  
  /**
   * Get requests by user
   */
  getRequestsByUser(userId: string): VectorDBAccessRequest[] {
    return Array.from(this.requests.values())
      .filter(r => r.requestedBy === userId)
      .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
  }
  
  /**
   * Get request by ID
   */
  getRequestById(id: string): VectorDBAccessRequest | null {
    return this.requests.get(id) || null;
  }
  
  /**
   * Approve request
   */
  approveRequest(requestId: string, approverId: string, comments?: string): VectorDBAccessRequest {
    const request = this.requests.get(requestId);
    
    if (!request) {
      throw new Error(`Request not found: ${requestId}`);
    }
    
    if (request.status !== 'pending') {
      throw new Error(`Request is not pending: ${request.status}`);
    }
    
    // Update approver status
    const approver = request.approvers.find(a => a.userId === approverId);
    if (approver) {
      approver.status = 'approved';
      approver.approvedAt = new Date().toISOString();
      approver.comments = comments;
    }
    
    // Check if all approvers have approved
    const allApproved = request.approvers.every(a => a.status === 'approved');
    
    if (allApproved) {
      request.status = 'approved';
      console.log(`✅ Request fully approved: ${requestId}`);
      
      // TODO: Trigger auto-deployment
      this.triggerDeployment(request);
    }
    
    request.updatedAt = new Date().toISOString();
    this.requests.set(requestId, request);
    
    return request;
  }
  
  /**
   * Reject request
   */
  rejectRequest(requestId: string, approverId: string, reason: string): VectorDBAccessRequest {
    const request = this.requests.get(requestId);
    
    if (!request) {
      throw new Error(`Request not found: ${requestId}`);
    }
    
    if (request.status !== 'pending') {
      throw new Error(`Request is not pending: ${request.status}`);
    }
    
    // Update approver status
    const approver = request.approvers.find(a => a.userId === approverId);
    if (approver) {
      approver.status = 'rejected';
      approver.approvedAt = new Date().toISOString();
      approver.comments = reason;
    }
    
    request.status = 'rejected';
    request.rejectionReason = reason;
    request.updatedAt = new Date().toISOString();
    
    this.requests.set(requestId, request);
    
    console.log(`❌ Request rejected: ${requestId} - ${reason}`);
    
    return request;
  }
  
  /**
   * Trigger deployment (placeholder for Phase 4)
   */
  private triggerDeployment(request: VectorDBAccessRequest): void {
    console.log(`🚀 Triggering deployment for ${request.providerName}...`);
    
    // Initialize deployment status
    request.deployment = {
      status: 'pending',
      startedAt: new Date().toISOString(),
      logs: ['Deployment queued...']
    };
    
    // TODO: Implement actual deployment in Phase 4
    // For now, just log
    console.log(`   Provider: ${request.providerName}`);
    console.log(`   Configuration:`, request.configuration);
  }
  
  /**
   * Get statistics
   */
  getStatistics(): {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    deployed: number;
  } {
    const requests = Array.from(this.requests.values());
    
    return {
      total: requests.length,
      pending: requests.filter(r => r.status === 'pending').length,
      approved: requests.filter(r => r.status === 'approved').length,
      rejected: requests.filter(r => r.status === 'rejected').length,
      deployed: requests.filter(r => r.status === 'deployed').length
    };
  }
}

// Export singleton instance
export const vectorDBAccessRequestService = new VectorDBAccessRequestService();

export default vectorDBAccessRequestService;
