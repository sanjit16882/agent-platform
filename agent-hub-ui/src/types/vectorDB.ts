/**
 * Shared types for Vector DB components
 */

export interface ConfigField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'password' | 'select' | 'boolean';
  required: boolean;
  defaultValue?: any;
  placeholder?: string;
  helpText?: string;
  options?: { label: string; value: string }[];
  step?: number;  // For wizard steps (1, 2, 3)
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    message?: string;
  };
}

export interface VectorDBProvider {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: 'approved' | 'marketplace';
  category: 'managed' | 'self-hosted' | 'hybrid';
  capabilities: {
    maxDimensions: number;
    supportedMetrics: string[];
    supportsFiltering: boolean;
    supportsMultiModal: boolean;
    maxDocuments: number;
  };
  configTemplate: {
    fields: ConfigField[];
  };
  pricing?: {
    model: 'free' | 'usage-based' | 'subscription';
    estimatedMonthlyCost?: number;
  };
  documentation?: {
    setupGuide?: string;
    apiDocs?: string;
  };
}

export interface AccessRequest {
  id: string;
  providerId: string;
  providerName: string;
  requestedBy: string;
  requestedByEmail: string;
  requestedAt: string;
  businessJustification: string;
  estimatedUsage: {
    documents: number;
    queriesPerMonth: number;
    teamSize: number;
  };
  configuration: Record<string, any>;
  status: 'pending' | 'approved' | 'rejected' | 'deployed';
  approvers: Array<{
    userId: string;
    email: string;
    role: string;
    status: 'pending' | 'approved' | 'rejected';
    approvedAt?: string;
    comments?: string;
  }>;
  rejectionReason?: string;
  updatedAt: string;
}
