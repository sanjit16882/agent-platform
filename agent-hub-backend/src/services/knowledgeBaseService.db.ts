/**
 * KnowledgeBaseService (Database Version)
 * 
 * Manages knowledge bases using SQLite database instead of in-memory Maps
 * 
 * UPDATED: Now uses persistent database storage
 */

import { VectorDBService } from './vectorDBService';
import { VectorDBClient } from './vectorDBClient';
import { queryAll, queryOne, execute, transaction } from './database';
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
  index_name: string;
  document_count: number;
  size_bytes: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
  metadata?: string;  // JSON string
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
  knowledge_base_id: string;
  title: string;
  content: string;
  source?: string;
  file_type?: string;
  file_size?: number;
  chunk_count: number;
  created_at: string;
  updated_at: string;
  metadata?: string;  // JSON string
}

export interface UploadDocumentParams {
  knowledgeBaseId: string;
  title: string;
  content: string;
  source?: string;
  fileType?: string;
  fileSize?: number;
  metadata?: any;
}

export interface DocumentChunk {
  id: string;
  document_id: string;
  knowledge_base_id: string;
  chunk_index: number;
  content: string;
  start_index: number;
  end_index: number;
  embedding_generated: number;
  vector_db_id?: string;
  metadata?: string;
}

// ============================================
// KnowledgeBaseService Class
// ============================================

export class KnowledgeBaseService {
  
  private vectorDBService: VectorDBService;
  private vectorDBClient: VectorDBClient;
  
  // Chunking configuration
  private readonly MAX_CHUNK_SIZE = 1000;  // characters
  private readonly CHUNK_OVERLAP = 200;     // characters
  
  constructor(vectorDBService: VectorDBService, vectorDBClient: VectorDBClient) {
    this.vectorDBService = vectorDBService;
    this.vectorDBClient = vectorDBClient;
    
    console.log('✅ KnowledgeBaseService initialized (Database Mode)');
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
      
      // Insert into database
      const sql = `
        INSERT INTO knowledge_bases (
          id, name, description, provider, index_name,
          document_count, size_bytes, created_by, metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const provider = params.provider || process.env.VECTOR_DB_PROVIDER || 'mock';
      const metadata = params.metadata ? JSON.stringify(params.metadata) : null;
      
      await execute(sql, [
        id,
        params.name,
        params.description,
        provider,
        indexName,
        0,  // document_count
        0,  // size_bytes
        params.createdBy || null,
        metadata
      ]);
      
      console.log(`✅ Knowledge base created: ${id} (${indexName})`);
      
      // Fetch and return the created KB
      return await this.getKnowledgeBase(id) as KnowledgeBase;
      
    } catch (error: any) {
      console.error('✗ Knowledge base creation failed:', error);
      throw new Error(`Failed to create knowledge base: ${error.message}`);
    }
  }
  
  /**
   * Get knowledge base by ID
   */
  async getKnowledgeBase(id: string): Promise<KnowledgeBase | null> {
    const sql = 'SELECT * FROM knowledge_bases WHERE id = ?';
    return await queryOne<KnowledgeBase>(sql, [id]);
  }
  
  /**
   * List all knowledge bases
   */
  async listKnowledgeBases(): Promise<KnowledgeBase[]> {
    const sql = 'SELECT * FROM knowledge_bases ORDER BY created_at DESC';
    return await queryAll<KnowledgeBase>(sql);
  }
  
  /**
   * Delete a knowledge base
   */
  async deleteKnowledgeBase(id: string): Promise<void> {
    
    try {
      const kb = await this.getKnowledgeBase(id);
      if (!kb) {
        throw new Error(`Knowledge base not found: ${id}`);
      }
      
      console.log(`🗑️ Deleting knowledge base: ${kb.name} (${kb.index_name})`);
      
      // Delete vector index
      await this.vectorDBClient.deleteIndex(kb.index_name);
      
      // Delete from database (CASCADE will delete documents and chunks)
      const sql = 'DELETE FROM knowledge_bases WHERE id = ?';
      await execute(sql, [id]);
      
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
      const kb = await this.getKnowledgeBase(id);
      if (!kb) {
        throw new Error(`Knowledge base not found: ${id}`);
      }
      
      // Get document stats
      const docStatsSql = `
        SELECT 
          COUNT(*) as doc_count,
          SUM(file_size) as total_size,
          AVG(LENGTH(content)) as avg_length
        FROM documents
        WHERE knowledge_base_id = ?
      `;
      
      const stats = await queryOne<any>(docStatsSql, [id]);
      
      // Update KB stats in database
      const updateSql = `
        UPDATE knowledge_bases 
        SET document_count = ?, size_bytes = ?, updated_at = datetime('now')
        WHERE id = ?
      `;
      
      await execute(updateSql, [
        stats?.doc_count || 0,
        stats?.total_size || 0,
        id
      ]);
      
      return {
        name: kb.name,
        documentCount: stats?.doc_count || 0,
        sizeBytes: stats?.total_size || 0,
        averageDocumentLength: Math.round(stats?.avg_length || 0),
        createdAt: kb.created_at,
        lastUpdated: kb.updated_at
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
      const kb = await this.getKnowledgeBase(params.knowledgeBaseId);
      if (!kb) {
        throw new Error(`Knowledge base not found: ${params.knowledgeBaseId}`);
      }
      
      console.log(`📄 Uploading document: ${params.title} to ${kb.name}`);
      
      // Generate document ID
      const documentId = this.generateId('doc');
      
      // Chunk the document
      const chunks = this.chunkDocument(params.content, documentId, params.knowledgeBaseId);
      
      console.log(`📚 Document chunked into ${chunks.length} pieces`);
      
      // Insert document into database
      const docSql = `
        INSERT INTO documents (
          id, knowledge_base_id, title, content, source,
          file_type, file_size, chunk_count, metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const metadata = params.metadata ? JSON.stringify(params.metadata) : null;
      
      await execute(docSql, [
        documentId,
        params.knowledgeBaseId,
        params.title,
        params.content,
        params.source || null,
        params.fileType || null,
        params.fileSize || params.content.length,
        chunks.length,
        metadata
      ]);
      
      // Insert chunks into database and index them
      for (const chunk of chunks) {
        // Insert chunk into database
        const chunkSql = `
          INSERT INTO document_chunks (
            id, document_id, knowledge_base_id, chunk_index,
            content, start_index, end_index, metadata
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        await execute(chunkSql, [
          chunk.id,
          chunk.document_id,
          chunk.knowledge_base_id,
          chunk.chunk_index,
          chunk.content,
          chunk.start_index,
          chunk.end_index,
          JSON.stringify(chunk.metadata)
        ]);
        
        // Index chunk in vector database
        const chunkMetadata = chunk.metadata ? JSON.parse(chunk.metadata) : {};
        const docMetadata = params.metadata || {};
        
        await this.vectorDBService.indexDocument({
          index: kb.index_name,
          id: chunk.id,
          content: chunk.content,
          title: params.title,
          source: params.source,
          metadata: {
            documentId: documentId,
            chunkIndex: chunk.chunk_index,
            totalChunks: chunks.length,
            ...chunkMetadata,
            ...docMetadata
          }
        });
        
        // Mark embedding as generated
        await execute(
          'UPDATE document_chunks SET embedding_generated = 1, vector_db_id = ? WHERE id = ?',
          [chunk.id, chunk.id]
        );
      }
      
      console.log(`✅ Document uploaded and indexed: ${documentId}`);
      
      // Return the created document
      return await this.getDocument(documentId) as Document;
      
    } catch (error: any) {
      console.error('✗ Document upload failed:', error);
      throw new Error(`Failed to upload document: ${error.message}`);
    }
  }
  
  /**
   * Get document by ID
   */
  async getDocument(documentId: string): Promise<Document | null> {
    const sql = 'SELECT * FROM documents WHERE id = ?';
    return await queryOne<Document>(sql, [documentId]);
  }
  
  /**
   * List documents in knowledge base
   */
  async listDocuments(
    knowledgeBaseId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<{ documents: Document[]; total: number }> {
    
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;
    
    // Get total count
    const countSql = 'SELECT COUNT(*) as total FROM documents WHERE knowledge_base_id = ?';
    const countResult = await queryOne<{ total: number }>(countSql, [knowledgeBaseId]);
    
    // Get paginated documents
    const docsSql = `
      SELECT * FROM documents 
      WHERE knowledge_base_id = ? 
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const documents = await queryAll<Document>(docsSql, [knowledgeBaseId, limit, offset]);
    
    return {
      documents,
      total: countResult?.total || 0
    };
  }
  
  /**
   * Delete a document
   */
  async deleteDocument(documentId: string): Promise<void> {
    
    try {
      const document = await this.getDocument(documentId);
      if (!document) {
        throw new Error(`Document not found: ${documentId}`);
      }
      
      console.log(`🗑️ Deleting document: ${document.title}`);
      
      // Delete from database (CASCADE will delete chunks)
      const sql = 'DELETE FROM documents WHERE id = ?';
      await execute(sql, [documentId]);
      
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
  private chunkDocument(
    content: string,
    documentId: string,
    knowledgeBaseId: string
  ): DocumentChunk[] {
    
    const chunks: DocumentChunk[] = [];
    let startIndex = 0;
    let chunkIndex = 0;
    
    while (startIndex < content.length) {
      const endIndex = Math.min(startIndex + this.MAX_CHUNK_SIZE, content.length);
      const chunkContent = content.substring(startIndex, endIndex);
      
      chunks.push({
        id: `${documentId}-chunk-${chunkIndex}`,
        document_id: documentId,
        knowledge_base_id: knowledgeBaseId,
        chunk_index: chunkIndex,
        content: chunkContent,
        start_index: startIndex,
        end_index: endIndex,
        embedding_generated: 0,
        metadata: JSON.stringify({
          startIndex,
          endIndex
        })
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
          return fs.readFileSync(filePath, 'utf-8');
        
        case 'json':
          const jsonContent = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          return JSON.stringify(jsonContent, null, 2);
        
        case 'pdf':
          console.warn('⚠ PDF parsing not implemented, returning placeholder');
          return 'PDF content extraction not implemented';
        
        case 'docx':
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
  async getTotalStorageUsed(): Promise<number> {
    const sql = 'SELECT SUM(size_bytes) as total FROM knowledge_bases';
    const result = await queryOne<{ total: number }>(sql);
    return result?.total || 0;
  }
  
  /**
   * Get total document count across all knowledge bases
   */
  async getTotalDocumentCount(): Promise<number> {
    const sql = 'SELECT SUM(document_count) as total FROM knowledge_bases';
    const result = await queryOne<{ total: number }>(sql);
    return result?.total || 0;
  }
}

// ============================================
// Export
// ============================================

export default KnowledgeBaseService;
