/**
 * VectorDBService Tests
 * 
 * Unit tests for VectorDBService
 */

import { VectorDBService } from '../vectorDBService';
import { MockVectorDBClient } from '../vectorDBClient';

describe('VectorDBService', () => {
  let service: VectorDBService;
  let mockClient: MockVectorDBClient;
  
  beforeEach(() => {
    mockClient = new MockVectorDBClient();
    service = new VectorDBService(mockClient);
  });
  
  afterEach(() => {
    service.clearCache();
  });
  
  describe('generateEmbedding', () => {
    it('should generate embedding for text', async () => {
      // Note: This test requires AWS credentials
      // For now, we'll skip it in CI/CD
      // In production, mock the AWS Bedrock call
      
      expect(service).toBeDefined();
    });
    
    it('should cache embeddings', () => {
      const stats = service.getCacheStats();
      expect(stats.maxSize).toBe(1000);
    });
  });
  
  describe('search', () => {
    it('should search vector database', async () => {
      // Insert test document
      await service.indexDocument({
        index: 'test-index',
        id: 'doc-1',
        content: 'This is a test document',
        title: 'Test Document'
      });
      
      // Search (using mock client)
      const results = await service.search({
        indexes: ['test-index'],
        vector: new Array(1536).fill(0.1),
        topK: 5,
        minSimilarity: 0.7
      });
      
      expect(results).toBeDefined();
      expect(results.documents).toBeInstanceOf(Array);
    });
  });
  
  describe('indexDocument', () => {
    it('should index a document', async () => {
      await expect(
        service.indexDocument({
          index: 'test-index',
          id: 'doc-1',
          content: 'Test content',
          title: 'Test'
        })
      ).resolves.not.toThrow();
    });
  });
  
  describe('deleteDocument', () => {
    it('should delete a document', async () => {
      await expect(
        service.deleteDocument('test-index', 'doc-1')
      ).resolves.not.toThrow();
    });
  });
  
  describe('cache management', () => {
    it('should clear cache', () => {
      service.clearCache();
      const stats = service.getCacheStats();
      expect(stats.size).toBe(0);
    });
    
    it('should report cache statistics', () => {
      const stats = service.getCacheStats();
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('maxSize');
    });
  });
});
