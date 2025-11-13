/**
 * VectorDBProvider Model
 * 
 * Represents a Vector Database provider (approved or marketplace)
 */

export interface VectorDBProvider {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: 'approved' | 'marketplace' | 'pending' | 'rejected';
  category: 'managed' | 'self-hosted' | 'hybrid';
  
  // Capabilities
  capabilities: {
    maxDimensions: number;
    supportedMetrics: ('cosine' | 'euclidean' | 'dot_product')[];
    supportsFiltering: boolean;
    supportsMultiModal: boolean;
    maxDocuments: number;
  };
  
  // Deployment
  deployment: {
    type: 'docker' | 'cloud' | 'kubernetes' | 'manual';
    dockerImage?: string;
    defaultPort: number;
    requiredEnvVars: string[];
    healthCheckEndpoint?: string;
  };
  
  // Configuration template
  configTemplate: {
    fields: ConfigField[];
  };
  
  // Approval settings
  approval: {
    required: boolean;
    approvers: string[];  // Role IDs: 'admin', 'security'
    autoApprove: boolean;
  };
  
  // Pricing (optional)
  pricing?: {
    model: 'free' | 'usage-based' | 'subscription';
    estimatedMonthlyCost?: number;
  };
  
  // Documentation
  documentation?: {
    setupGuide?: string;
    apiDocs?: string;
    examples?: string;
  };
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface ConfigField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'password' | 'select' | 'boolean';
  required: boolean;
  defaultValue?: any;
  placeholder?: string;
  helpText?: string;
  options?: { label: string; value: string }[];
  step?: number;  // For multi-step wizard UI (1, 2, 3, etc.)
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    message?: string;
  };
}

export default VectorDBProvider;
