/**
 * VectorDBAccessRequest Model
 * 
 * Represents a user's request to access a marketplace Vector DB provider
 */

export interface VectorDBAccessRequest {
  id: string;
  providerId: string;
  providerName: string;
  
  // Requester info
  requestedBy: string;  // User ID
  requestedByEmail: string;
  requestedAt: string;
  
  // Justification
  businessJustification: string;
  estimatedUsage: {
    documents: number;
    queriesPerMonth: number;
    teamSize: number;
  };
  
  // Configuration
  configuration: {
    deploymentType: string;
    host: string;
    port: number;
    apiKey?: string;
    collectionName: string;
    additionalConfig: Record<string, any>;
  };
  
  // Approval workflow
  status: 'pending' | 'approved' | 'rejected' | 'deployed';
  approvers: {
    userId: string;
    email: string;
    role: string;
    status: 'pending' | 'approved' | 'rejected';
    approvedAt?: string;
    comments?: string;
  }[];
  
  // Deployment
  deployment?: {
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    startedAt?: string;
    completedAt?: string;
    containerId?: string;
    endpoint?: string;
    error?: string;
    logs?: string[];
  };
  
  // Metadata
  updatedAt: string;
  rejectionReason?: string;
}

export default VectorDBAccessRequest;
