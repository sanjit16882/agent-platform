/**
 * KnowledgeBaseService
 * 
 * Manages knowledge bases (vector indexes) and document operations:
 * - Create/delete knowledge bases
 * - Upload and index documents
 * - Manage document lifecycle
 * - Track statistics and metadata
 * 
 * CRITICAL: This is a NEW service that does not modify existing services
 */

import { VectorDBService } from './vectorDBService';
import { VectorDBClient } from './vectorDBClient';
import * as fs from 'fs';
import * as path from 'path';

// ============================================
// Types and Interfaces
// ============================================

export interface KnowledgeBase {
  id: string;
  name: string;
  description: string;
  provider: string;
  indexName: string;
  documentCount: number;
  sizeBytes: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  metadata?: any;
}

export interface CreateKnowledgeBaseParams {
  name: string;
  description: string;
  provider?: string;
  createdBy?: string;
  metadata?: any;
}

export interface KnowledgeBaseStats {
  name: string;
  documentCount: number;
  sizeBytes: number;
  averageDocumentLength: number;
  createdAt: string;
  lastUpdated?: string;
}

export interface Document {
  id: string;
  knowledgeBaseId: string;
  title: string;
  content: string;
  source?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface UploadDocumentParams {
  knowledgeBaseId: string;
  title: string;
  content: string;
  source?: string;
  metadata?: any;
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  content: string;
  chunkIndex: number;
  metadata: any;
}

// ============================================
// KnowledgeBaseService Class
// ============================================

export class KnowledgeBaseService {
  
  private vectorDBService: VectorDBService;
  private vectorDBClient: VectorDBClient;
  private knowledgeBases: Map<string, KnowledgeBase>;
  private documents: Map<string, Document>;
  
  // Chunking configuration
  private readonly MAX_CHUNK_SIZE = 1000;  // characters
  private readonly CHUNK_OVERLAP = 200;     // characters
  
  constructor(vectorDBService: VectorDBService, vectorDBClient: VectorDBClient) {
    this.vectorDBService = vectorDBService;
    this.vectorDBClient = vectorDBClient;
    this.knowledgeBases = new Map();
    this.documents = new Map();
    
    console.log('✅ KnowledgeBaseService initialized');
  }
  
  // ============================================
  // Knowledge Base Management
  // ============================================
  
  /**
   * Create a new knowledge base
   */
  async createKnowledgeBase(params: CreateKnowledgeBaseParams): Promise<KnowledgeBase> {
    
    try {
      console.log(`🏗️ Creating knowledge base: ${params.name}`);
      
      // Generate unique ID
      const id = this.generateId('kb');
      const indexName = this.sanitizeIndexName(params.name);
      
      // Create vector index
      await this.vectorDBClient.createIndex({
        name: indexName,
        dimension: 1536,  // Titan embeddings dimension
        metric: 'cosine',
        metadata: {
          description: params.description,
          createdAt: new Date().toISOString()
        }
      });
      
      // Create knowledge base record
      const knowledgeBase: KnowledgeBase = {
        id,
        name: params.name,
        description: params.description,
        provider: params.provider || process.env.VECTOR_DB_PROVIDER || 'mock',
        indexName,
        documentCount: 0,
        sizeBytes: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: params.createdBy,
        metadata: params.metadata
      };
      
      // Store in memory (in production, this would be in database)
      this.knowledgeBases.set(id, knowledgeBase);
      
      console.log(`✅ Knowledge base created: ${id} (${indexName})`);
      
      return knowledgeBase;
      
    } catch (error: any) {
      console.error('✗ Knowledge base creation failed:', error);
      throw new Error(`Failed to create knowledge base: ${error.message}`);
    }
  }
  
  /**
   * Get knowledge base by ID
   */
  async getKnowledgeBase(id: string): Promise<KnowledgeBase | null> {
    return this.knowledgeBases.get(id) || null;
  }
  
  /**
   * List all knowledge bases
   */
  async listKnowledgeBases(): Promise<KnowledgeBase[]> {
    return Array.from(this.knowledgeBases.values());
  }
  
  /**
   * Delete a knowledge base
   */
  async deleteKnowledgeBase(id: string): Promise<void> {
    
    try {
      const kb = this.knowledgeBases.get(id);
      if (!kb) {
        throw new Error(`Knowledge base not found: ${id}`);
      }
      
      console.log(`🗑️ Deleting knowledge base: ${kb.name} (${kb.indexName})`);
      
      // Delete vector index
      await this.vectorDBClient.deleteIndex(kb.indexName);
      
      // Delete all documents
      const docs = Array.from(this.documents.values()).filter(
        doc => doc.knowledgeBaseId === id
      );
      
      for (const doc of docs) {
        this.documents.delete(doc.id);
      }
      
      // Delete knowledge base record
      this.knowledgeBases.delete(id);
      
      console.log(`✅ Knowledge base deleted: ${id}`);
      
    } catch (error: any) {
      console.error('✗ Knowledge base deletion failed:', error);
      throw new Error(`Failed to delete knowledge base: ${error.message}`);
    }
  }
  
  /**
   * Get knowledge base statistics
   */
  async getKnowledgeBaseStats(id: string): Promise<KnowledgeBaseStats> {
    
    try {
      const kb = this.knowledgeBases.get(id);
      if (!kb) {
        throw new Error(`Knowledge base not found: ${id}`);
      }
      
      // Get stats from vector database
      const stats = await this.vectorDBClient.getIndexStats(kb.indexName);
      
      // Update knowledge base record
      kb.documentCount = stats.documentCount;
      kb.sizeBytes = stats.sizeBytes;
      kb.updatedAt = new Date().toISOString();
      
      // Calculate average document length
      const docs = Array.from(this.documents.values()).filter(
        doc => doc.knowledgeBaseId === id
      );
      const averageDocumentLength = docs.length > 0
        ? Math.round(docs.reduce((sum, doc) => sum + doc.content.length, 0) / docs.length)
        : 0;
      
      return {
        name: kb.name,
        documentCount: kb.documentCount,
        sizeBytes: kb.sizeBytes,
        averageDocumentLength,
        createdAt: kb.createdAt,
        lastUpdated: kb.updatedAt
      };
      
    } catch (error: any) {
      console.error('✗ Failed to get knowledge base stats:', error);
      throw new Error(`Failed to get stats: ${error.message}`);
    }
  }
  
  // ============================================
  // Document Management
  // ============================================
  
  /**
   * Upload and index a document
   */
  async uploadDocument(params: UploadDocumentParams): Promise<Document> {
    
    try {
      const kb = this.knowledgeBases.get(params.knowledgeBaseId);
      if (!kb) {
        throw new Error(`Knowledge base not found: ${params.knowledgeBaseId}`);
      }
      
      console.log(`📄 Uploading document: ${params.title} to ${kb.name}`);
      
      // Generate document ID
      const documentId = this.generateId('doc');
      
      // Create document record
      const document: Document = {
        id: documentId,
        knowledgeBaseId: params.knowledgeBaseId,
        title: params.title,
        content: params.content,
        source: params.source,
        metadata: params.metadata,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Chunk the document
      const chunks = this.chunkDocument(document);
      
      console.log(`📚 Document chunked into ${chunks.length} pieces`);
      
      // Index each chunk
      for (const chunk of chunks) {
        await this.vectorDBService.indexDocument({
          index: kb.indexName,
          id: chunk.id,
          content: chunk.content,
          title: params.title,
          source: params.source,
          metadata: {
            documentId: documentId,
            chunkIndex: chunk.chunkIndex,
            totalChunks: chunks.length,
            ...chunk.metadata,
            ...params.metadata
          }
        });
      }
      
      // Store document record
      this.documents.set(documentId, document);
      
      // Update knowledge base stats
      kb.documentCount++;
      kb.sizeBytes += params.content.length;
      kb.updatedAt = new Date().toISOString();
      
      console.log(`✅ Document uploaded and indexed: ${documentId}`);
      
      return document;
      
    } catch (error: any) {
      console.error('✗ Document upload failed:', error);
      throw new Error(`Failed to upload document: ${error.message}`);
    }
  }
  
  /**
   * Upload multiple documents in batch
   */
  async uploadDocumentsBatch(
    knowledgeBaseId: string,
    documents: Omit<UploadDocumentParams, 'knowledgeBaseId'>[]
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    
    console.log(`📚 Uploading ${documents.length} documents in batch...`);
    
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    };
    
    for (const doc of documents) {
      try {
        await this.uploadDocument({
          knowledgeBaseId,
          ...doc
        });
        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(`${doc.title}: ${error.message}`);
        console.error(`✗ Failed to upload ${doc.title}:`, error.message);
      }
    }
    
    console.log(`✅ Batch upload complete: ${results.success} success, ${results.failed} failed`);
    
    return results;
  }
  
  /**
   * Get document by ID
   */
  async getDocument(documentId: string): Promise<Document | null> {
    return this.documents.get(documentId) || null;
  }
  
  /**
   * List documents in knowledge base
   */
  async listDocuments(
    knowledgeBaseId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<{ documents: Document[]; total: number }> {
    
    const allDocs = Array.from(this.documents.values()).filter(
      doc => doc.knowledgeBaseId === knowledgeBaseId
    );
    
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;
    
    const paginatedDocs = allDocs.slice(offset, offset + limit);
    
    return {
      documents: paginatedDocs,
      total: allDocs.length
    };
  }
  
  /**
   * Delete a document
   */
  async deleteDocument(documentId: string): Promise<void> {
    
    try {
      const document = this.documents.get(documentId);
      if (!document) {
        throw new Error(`Document not found: ${documentId}`);
      }
      
      const kb = this.knowledgeBases.get(document.knowledgeBaseId);
      if (!kb) {
        throw new Error(`Knowledge base not found: ${document.knowledgeBaseId}`);
      }
      
      console.log(`🗑️ Deleting document: ${document.title}`);
      
      // Delete all chunks from vector database
      // In production, we'd query for all chunks with documentId
      // For now, we'll just delete the document record
      
      // Update knowledge base stats
      kb.documentCount--;
      kb.sizeBytes -= document.content.length;
      kb.updatedAt = new Date().toISOString();
      
      // Delete document record
      this.documents.delete(documentId);
      
      console.log(`✅ Document deleted: ${documentId}`);
      
    } catch (error: any) {
      console.error('✗ Document deletion failed:', error);
      throw new Error(`Failed to delete document: ${error.message}`);
    }
  }
  
  // ============================================
  // Document Processing
  // ============================================
  
  /**
   * Chunk a document into smaller pieces for indexing
   */
  private chunkDocument(document: Document): DocumentChunk[] {
    
    const chunks: DocumentChunk[] = [];
    const content = document.content;
    
    // Simple chunking strategy: split by character count with overlap
    let startIndex = 0;
    let chunkIndex = 0;
    
    while (startIndex < content.length) {
      const endIndex = Math.min(startIndex + this.MAX_CHUNK_SIZE, content.length);
      const chunkContent = content.substring(startIndex, endIndex);
      
      chunks.push({
        id: `${document.id}-chunk-${chunkIndex}`,
        documentId: document.id,
        content: chunkContent,
        chunkIndex,
        metadata: {
          title: document.title,
          source: document.source,
          startIndex,
          endIndex
        }
      });
      
      // Move to next chunk with overlap
      startIndex += this.MAX_CHUNK_SIZE - this.CHUNK_OVERLAP;
      chunkIndex++;
    }
    
    return chunks;
  }
  
  /**
   * Extract text from file based on file type
   */
  async extractTextFromFile(filePath: string, fileType: string): Promise<string> {
    
    try {
      console.log(`📄 Extracting text from ${fileType} file: ${filePath}`);
      
      switch (fileType.toLowerCase()) {
        case 'txt':
        case 'md':
        case 'markdown':
          // Plain text files
          return fs.readFileSync(filePath, 'utf-8');
        
        case 'json':
          // JSON files
          const jsonContent = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          return JSON.stringify(jsonContent, null, 2);
        
        case 'pdf':
          // PDF files (would require pdf-parse library)
          // For now, return placeholder
          console.warn('⚠ PDF parsing not implemented, returning placeholder');
          return 'PDF content extraction not implemented';
        
        case 'docx':
          // DOCX files (would require mammoth library)
          // For now, return placeholder
          console.warn('⚠ DOCX parsing not implemented, returning placeholder');
          return 'DOCX content extraction not implemented';
        
        default:
          throw new Error(`Unsupported file type: ${fileType}`);
      }
      
    } catch (error: any) {
      console.error('✗ Text extraction failed:', error);
      throw new Error(`Failed to extract text: ${error.message}`);
    }
  }
  
  // ============================================
  // Helper Methods
  // ============================================
  
  /**
   * Generate unique ID
   */
  private generateId(prefix: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    return `${prefix}-${timestamp}-${random}`;
  }
  
  /**
   * Sanitize index name for vector database
   */
  private sanitizeIndexName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
  
  /**
   * Get total storage used across all knowledge bases
   */
  getTotalStorageUsed(): number {
    let total = 0;
    for (const kb of this.knowledgeBases.values()) {
      total += kb.sizeBytes;
    }
    return total;
  }
  
  /**
   * Get total document count across all knowledge bases
   */
  getTotalDocumentCount(): number {
    let total = 0;
    for (const kb of this.knowledgeBases.values()) {
      total += kb.documentCount;
    }
    return total;
  }
}

// ============================================
// Export
// ============================================

export default KnowledgeBaseService;
