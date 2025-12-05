/**
 * VectorDBService
 * 
 * Handles all Vector Database operations including:
 * - Embedding generation via AWS Bedrock Titan Embeddings
 * - Vector search in OpenSearch/Pinecone/Pgvector
 * - Document indexing and management
 * 
 * CRITICAL: This is a completely NEW service that does not modify
 * any existing services, especially MCP-related services.
 */

import AWS from 'aws-sdk';

// ============================================
// Types and Interfaces
// ============================================

export interface VectorSearchParams {
  indexes: string[];
  vector: number[];
  topK: number;
  minSimilarity: number;
}

export interface VectorSearchResult {
  documents: RetrievedDocument[];
  searchLatency: number;
  totalResults: number;
}

export interface RetrievedDocument {
  id: string;
  content: string;
  similarity: number;
  metadata: any;
}

export interface IndexDocumentParams {
  index: string;
  id: string;
  content: string;
  title?: string;
  source?: string;
  metadata?: any;
}

export interface VectorDBClient {
  search(params: any): Promise<any[]>;
  insert(params: any): Promise<void>;
  delete(params: any): Promise<void>;
  createIndex(params: any): Promise<void>;
  deleteIndex(name: string): Promise<void>;
  getIndexStats(name: string): Promise<any>;
}

// ============================================
// VectorDBService Class
// ============================================

export class VectorDBService {
  
  private bedrockRuntime: AWS.BedrockRuntime;
  private vectorDBClient: VectorDBClient;
  private embeddingCache: Map<string, number[]>;
  private readonly EMBEDDING_MODEL = 'amazon.titan-embed-text-v1';
  private readonly EMBEDDING_DIMENSION = 1536;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY_MS = 1000;
  
  constructor(vectorDBClient: VectorDBClient) {
    // Initialize AWS Bedrock Runtime for embeddings
    this.bedrockRuntime = new AWS.BedrockRuntime({
      region: process.env.AWS_REGION || 'us-east-1',
      maxRetries: this.MAX_RETRIES
    });
    
    this.vectorDBClient = vectorDBClient;
    this.embeddingCache = new Map();
    
    console.log('✅ VectorDBService initialized');
  }
  
  // ============================================
  // Embedding Generation
  // ============================================
  
  /**
   * Generate embedding for text using AWS Bedrock Titan Embeddings
   * 
   * @param text - Text to generate embedding for
   * @returns 1536-dimensional vector
   */
  async generateEmbedding(text: string): Promise<number[]> {
    
    // Check cache first
    const cacheKey = this.getCacheKey(text);
    if (this.embeddingCache.has(cacheKey)) {
      console.log('✓ Embedding retrieved from cache');
      return this.embeddingCache.get(cacheKey)!;
    }
    
    try {
      const startTime = Date.now();
      
      // Call AWS Bedrock Titan Embeddings
      const response = await this.bedrockRuntime.invokeModel({
        modelId: this.EMBEDDING_MODEL,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
          inputText: text
        })
      }).promise();
      
      const responseBody = JSON.parse(response.body.toString());
      const embedding: number[] = responseBody.embedding;
      
      // Validate embedding dimension
      if (embedding.length !== this.EMBEDDING_DIMENSION) {
        throw new Error(
          `Invalid embedding dimension: expected ${this.EMBEDDING_DIMENSION}, got ${embedding.length}`
        );
      }
      
      // Cache the embedding
      this.embeddingCache.set(cacheKey, embedding);
      
      // Limit cache size to prevent memory issues
      if (this.embeddingCache.size > 1000) {
        const firstKey = this.embeddingCache.keys().next().value;
        this.embeddingCache.delete(firstKey);
      }
      
      const latency = Date.now() - startTime;
      console.log(`✓ Embedding generated in ${latency}ms`);
      
      return embedding;
      
    } catch (error: any) {
      console.error('✗ Embedding generation failed:', error);
      
      // Handle rate limiting
      if (error.code === 'ThrottlingException') {
        console.log('⚠ Rate limited, retrying with exponential backoff...');
        await this.sleep(this.RETRY_DELAY_MS);
        return this.generateEmbedding(text);  // Retry
      }
      
      throw new Error(`Failed to generate embedding: ${error.message}`);
    }
  }
  
  /**
   * Generate embeddings for multiple texts in batch
   * 
   * @param texts - Array of texts to generate embeddings for
   * @returns Array of embeddings
   */
  async generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];
    
    for (const text of texts) {
      const embedding = await this.generateEmbedding(text);
      embeddings.push(embedding);
      
      // Add small delay to avoid rate limiting
      await this.sleep(100);
    }
    
    return embeddings;
  }
  
  // ============================================
  // Vector Search
  // ============================================
  
  /**
   * Search vector database for similar documents
   * 
   * @param params - Search parameters
   * @returns Search results with documents and metadata
   */
  async search(params: VectorSearchParams): Promise<VectorSearchResult> {
    
    const startTime = Date.now();
    
    try {
      console.log(`🔍 Searching ${params.indexes.length} index(es) for top ${params.topK} results...`);
      
      // Search vector database
      const results = await this.vectorDBClient.search({
        indexes: params.indexes,
        vector: params.vector,
        k: params.topK,
        filter: {
          similarity: { $gte: params.minSimilarity }
        }
      });
      
      // Transform results to standard format
      const documents: RetrievedDocument[] = results.map((r: any) => ({
        id: r.id,
        content: r.metadata.content,
        similarity: r.score,
        metadata: r.metadata
      }));
      
      // Filter by minimum similarity
      const filteredDocuments = documents.filter(
        doc => doc.similarity >= params.minSimilarity
      );
      
      const searchLatency = Date.now() - startTime;
      
      console.log(`✓ Found ${filteredDocuments.length} documents in ${searchLatency}ms`);
      
      return {
        documents: filteredDocuments,
        searchLatency,
        totalResults: filteredDocuments.length
      };
      
    } catch (error: any) {
      console.error('✗ Vector search failed:', error);
      throw new Error(`Vector search failed: ${error.message}`);
    }
  }
  
  // ============================================
  // Document Management
  // ============================================
  
  /**
   * Index a document in vector database
   * 
   * @param params - Document parameters
   */
  async indexDocument(params: IndexDocumentParams): Promise<void> {
    
    try {
      console.log(`📄 Indexing document: ${params.id} in ${params.index}`);
      
      // Generate embedding for document content
      const embedding = await this.generateEmbedding(params.content);
      
      // Store in vector database
      await this.vectorDBClient.insert({
        index: params.index,
        id: params.id,
        vector: embedding,
        metadata: {
          content: params.content,
          title: params.title || '',
          source: params.source || '',
          timestamp: new Date().toISOString(),
          contentLength: params.content.length,
          ...params.metadata
        }
      });
      
      console.log(`✅ Document indexed: ${params.id} in ${params.index}`);
      
    } catch (error: any) {
      console.error('✗ Document indexing failed:', error);
      throw new Error(`Failed to index document: ${error.message}`);
    }
  }
  
  /**
   * Index multiple documents in batch
   * 
   * @param documents - Array of documents to index
   */
  async indexDocumentsBatch(documents: IndexDocumentParams[]): Promise<void> {
    console.log(`📚 Indexing ${documents.length} documents in batch...`);
    
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    };
    
    for (const doc of documents) {
      try {
        await this.indexDocument(doc);
        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(`${doc.id}: ${error.message}`);
        console.error(`✗ Failed to index ${doc.id}:`, error.message);
      }
      
      // Add small delay to avoid rate limiting
      await this.sleep(100);
    }
    
    console.log(`✅ Batch indexing complete: ${results.success} success, ${results.failed} failed`);
    
    if (results.failed > 0) {
      console.error('Errors:', results.errors);
    }
  }
  
  /**
   * Delete a document from vector database
   * 
   * @param index - Index name
   * @param documentId - Document ID to delete
   */
  async deleteDocument(index: string, documentId: string): Promise<void> {
    
    try {
      console.log(`🗑️ Deleting document: ${documentId} from ${index}`);
      
      await this.vectorDBClient.delete({
        index,
        id: documentId
      });
      
      console.log(`✅ Document deleted: ${documentId} from ${index}`);
      
    } catch (error: any) {
      console.error('✗ Document deletion failed:', error);
      throw new Error(`Failed to delete document: ${error.message}`);
    }
  }
  
  // ============================================
  // Helper Methods
  // ============================================
  
  /**
   * Generate cache key for embedding
   */
  private getCacheKey(text: string): string {
    // Use first 100 characters as cache key to avoid memory issues
    return text.substring(0, 100);
  }
  
  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Clear embedding cache
   */
  clearCache(): void {
    this.embeddingCache.clear();
    console.log('✓ Embedding cache cleared');
  }
  
  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; maxSize: number } {
    return {
      size: this.embeddingCache.size,
      maxSize: 1000
    };
  }
}

// ============================================
// Export singleton instance (will be initialized with client)
// ============================================

export default VectorDBService;
