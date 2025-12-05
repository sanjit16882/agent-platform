/**
 * Vector DB Configuration
 * 
 * Configuration for Vector Database service including:
 * - Provider selection (OpenSearch/Pinecone/Pgvector/Mock)
 * - Connection settings
 * - Performance tuning
 * - Cost tracking
 */

export interface VectorDBConfig {
  // Provider
  provider: 'opensearch' | 'pinecone' | 'pgvector' | 'mock';
  
  // Connection
  endpoint?: string;
  region?: string;
  apiKey?: string;
  
  // Performance
  timeout: number;
  maxRetries: number;
  retryDelayMs: number;
  
  // Caching
  enableCache: boolean;
  maxCacheSize: number;
  
  // Cost tracking
  embeddingCostPer1M: number;  // Cost per 1M tokens
  searchCostPer1K: number;      // Cost per 1K searches
  
  // Limits
  maxDocumentsPerSearch: number;
  maxBatchSize: number;
}

/**
 * Get Vector DB configuration from environment variables
 */
export function getVectorDBConfig(): VectorDBConfig {
  return {
    // Provider
    provider: (process.env.VECTOR_DB_PROVIDER as any) || 'mock',
    
    // Connection
    endpoint: process.env.OPENSEARCH_ENDPOINT || process.env.PINECONE_ENDPOINT,
    region: process.env.AWS_REGION || 'us-east-1',
    apiKey: process.env.PINECONE_API_KEY,
    
    // Performance
    timeout: parseInt(process.env.VECTOR_DB_TIMEOUT || '30000'),
    maxRetries: parseInt(process.env.VECTOR_DB_MAX_RETRIES || '3'),
    retryDelayMs: parseInt(process.env.VECTOR_DB_RETRY_DELAY || '1000'),
    
    // Caching
    enableCache: process.env.VECTOR_DB_ENABLE_CACHE !== 'false',
    maxCacheSize: parseInt(process.env.VECTOR_DB_MAX_CACHE_SIZE || '1000'),
    
    // Cost tracking
    embeddingCostPer1M: parseFloat(process.env.EMBEDDING_COST_PER_1M || '0.0001'),
    searchCostPer1K: parseFloat(process.env.SEARCH_COST_PER_1K || '0.0001'),
    
    // Limits
    maxDocumentsPerSearch: parseInt(process.env.MAX_DOCUMENTS_PER_SEARCH || '20'),
    maxBatchSize: parseInt(process.env.MAX_BATCH_SIZE || '100')
  };
}

/**
 * Validate Vector DB configuration
 */
export function validateVectorDBConfig(config: VectorDBConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Validate provider
  const validProviders = ['opensearch', 'pinecone', 'pgvector', 'mock'];
  if (!validProviders.includes(config.provider)) {
    errors.push(`Invalid provider: ${config.provider}. Must be one of: ${validProviders.join(', ')}`);
  }
  
  // Validate OpenSearch configuration
  if (config.provider === 'opensearch' && !config.endpoint) {
    errors.push('OpenSearch endpoint is required when provider is "opensearch"');
  }
  
  // Validate Pinecone configuration
  if (config.provider === 'pinecone') {
    if (!config.endpoint) {
      errors.push('Pinecone endpoint is required when provider is "pinecone"');
    }
    if (!config.apiKey) {
      errors.push('Pinecone API key is required when provider is "pinecone"');
    }
  }
  
  // Validate numeric values
  if (config.timeout <= 0) {
    errors.push('Timeout must be greater than 0');
  }
  
  if (config.maxRetries < 0) {
    errors.push('Max retries must be >= 0');
  }
  
  if (config.maxCacheSize <= 0) {
    errors.push('Max cache size must be greater than 0');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Get default Vector DB configuration for development
 */
export function getDefaultVectorDBConfig(): VectorDBConfig {
  return {
    provider: 'mock',
    region: 'us-east-1',
    timeout: 30000,
    maxRetries: 3,
    retryDelayMs: 1000,
    enableCache: true,
    maxCacheSize: 1000,
    embeddingCostPer1M: 0.0001,
    searchCostPer1K: 0.0001,
    maxDocumentsPerSearch: 20,
    maxBatchSize: 100
  };
}

export default {
  getVectorDBConfig,
  validateVectorDBConfig,
  getDefaultVectorDBConfig
};
