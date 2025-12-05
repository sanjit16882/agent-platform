/**
 * Document Ingestion Service
 * 
 * Handles document processing, chunking, embedding generation, and vector storage
 */

import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { databaseService } from './databaseService';

interface Document {
  id: string;
  filename: string;
  title: string;
  category: string;
  providerId: string;
  status: 'pending' | 'processing' | 'indexed' | 'failed';
  chunkCount: number;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: string;
  indexedAt?: string;
  metadata: any;
  error?: string;
}

interface DocumentChunk {
  id: string;
  documentId: string;
  chunkIndex: number;
  content: string;
  embedding?: number[];
  metadata: any;
  createdAt: string;
}

class DocumentIngestionService {
  private documents: Map<string, Document> = new Map();
  private chunks: Map<string, DocumentChunk[]> = new Map();
  
  /**
   * Ingest a document from file
   */
  async ingestDocument(params: {
    filePath: string;
    filename: string;
    category: string;
    providerId: string;
    metadata: any;
    uploadedBy: string;
  }): Promise<Document> {
    const documentId = uuidv4();
    
    // Create document record
    const document: Document = {
      id: documentId,
      filename: params.filename,
      title: params.filename.replace(/\.[^/.]+$/, ''), // Remove extension
      category: params.category,
      providerId: params.providerId,
      status: 'processing',
      chunkCount: 0,
      fileSize: fs.statSync(params.filePath).size,
      uploadedBy: params.uploadedBy,
      uploadedAt: new Date().toISOString(),
      metadata: params.metadata
    };
    
    this.documents.set(documentId, document);
    
    try {
      // Extract text from file
      const text = await this.extractText(params.filePath, params.filename);
      
      // Chunk the text
      const chunks = this.chunkText(text, 300, 60);
      
      // Create chunk records
      const documentChunks: DocumentChunk[] = chunks.map((chunk, index) => ({
        id: uuidv4(),
        documentId,
        chunkIndex: index,
        content: chunk,
        metadata: {
          source: params.filename,
          category: params.category,
          ...params.metadata
        },
        createdAt: new Date().toISOString()
      }));
      
      this.chunks.set(documentId, documentChunks);
      
      // Generate embeddings (mock for now - in production, call embedding API)
      for (const chunk of documentChunks) {
        chunk.embedding = await this.generateEmbedding(chunk.content);
      }
      
      // Store in vector DB (mock for now)
      await this.storeInVectorDB(params.providerId, documentChunks);
      
      // Update document status
      document.status = 'indexed';
      document.chunkCount = documentChunks.length;
      document.indexedAt = new Date().toISOString();
      
      // Save to database
      await this.saveToDatabase(document, documentChunks);
      
      return document;
    } catch (error: any) {
      document.status = 'failed';
      document.error = error.message;
      throw error;
    }
  }
  
  /**
   * Ingest text directly
   */
  async ingestText(params: {
    title: string;
    content: string;
    providerId: string;
    category: string;
    metadata: any;
    uploadedBy: string;
  }): Promise<Document> {
    const documentId = uuidv4();
    
    const document: Document = {
      id: documentId,
      filename: `${params.title}.txt`,
      title: params.title,
      category: params.category,
      providerId: params.providerId,
      status: 'processing',
      chunkCount: 0,
      fileSize: Buffer.byteLength(params.content, 'utf8'),
      uploadedBy: params.uploadedBy,
      uploadedAt: new Date().toISOString(),
      metadata: params.metadata
    };
    
    this.documents.set(documentId, document);
    
    try {
      // Chunk the text
      const chunks = this.chunkText(params.content, 300, 60);
      
      // Create chunk records
      const documentChunks: DocumentChunk[] = chunks.map((chunk, index) => ({
        id: uuidv4(),
        documentId,
        chunkIndex: index,
        content: chunk,
        metadata: {
          source: params.title,
          category: params.category,
          ...params.metadata
        },
        createdAt: new Date().toISOString()
      }));
      
      this.chunks.set(documentId, documentChunks);
      
      // Generate embeddings
      for (const chunk of documentChunks) {
        chunk.embedding = await this.generateEmbedding(chunk.content);
      }
      
      // Store in vector DB
      await this.storeInVectorDB(params.providerId, documentChunks);
      
      // Update document status
      document.status = 'indexed';
      document.chunkCount = documentChunks.length;
      document.indexedAt = new Date().toISOString();
      
      // Save to database
      await this.saveToDatabase(document, documentChunks);
      
      return document;
    } catch (error: any) {
      document.status = 'failed';
      document.error = error.message;
      throw error;
    }
  }
  
  /**
   * Import from URL (web scraping)
   */
  async importFromUrl(params: {
    url: string;
    providerId: string;
    category: string;
    uploadedBy: string;
  }): Promise<Document> {
    // TODO: Implement web scraping
    // For now, return mock
    throw new Error('URL import not yet implemented');
  }
  
  /**
   * Get all documents
   */
  async getDocuments(filters?: {
    providerId?: string;
    category?: string;
    status?: string;
  }): Promise<Document[]> {
    let documents = Array.from(this.documents.values());
    
    if (filters?.providerId) {
      documents = documents.filter(d => d.providerId === filters.providerId);
    }
    
    if (filters?.category) {
      documents = documents.filter(d => d.category === filters.category);
    }
    
    if (filters?.status) {
      documents = documents.filter(d => d.status === filters.status);
    }
    
    return documents;
  }
  
  /**
   * Get document by ID
   */
  async getDocumentById(id: string): Promise<Document | null> {
    return this.documents.get(id) || null;
  }
  
  /**
   * Get document chunks
   */
  async getDocumentChunks(documentId: string): Promise<DocumentChunk[]> {
    return this.chunks.get(documentId) || [];
  }
  
  /**
   * Delete document
   */
  async deleteDocument(id: string): Promise<void> {
    const document = this.documents.get(id);
    if (!document) {
      throw new Error('Document not found');
    }
    
    // Delete from vector DB
    await this.deleteFromVectorDB(document.providerId, id);
    
    // Delete chunks
    this.chunks.delete(id);
    
    // Delete document
    this.documents.delete(id);
    
    // Delete from database
    await this.deleteFromDatabase(id);
  }
  
  /**
   * Re-index document
   */
  async reindexDocument(id: string): Promise<Document> {
    const document = this.documents.get(id);
    if (!document) {
      throw new Error('Document not found');
    }
    
    // Get existing chunks
    const chunks = this.chunks.get(id);
    if (!chunks) {
      throw new Error('Document chunks not found');
    }
    
    document.status = 'processing';
    
    try {
      // Regenerate embeddings
      for (const chunk of chunks) {
        chunk.embedding = await this.generateEmbedding(chunk.content);
      }
      
      // Re-store in vector DB
      await this.storeInVectorDB(document.providerId, chunks);
      
      document.status = 'indexed';
      document.indexedAt = new Date().toISOString();
      
      return document;
    } catch (error: any) {
      document.status = 'failed';
      document.error = error.message;
      throw error;
    }
  }
  
  /**
   * Search documents
   */
  async searchDocuments(params: {
    query: string;
    providerId: string;
    topK: number;
  }): Promise<any[]> {
    // Generate query embedding
    const queryEmbedding = await this.generateEmbedding(params.query);
    
    // Search vector DB (mock for now)
    // In production, this would query Pinecone, pgvector, etc.
    const results = [];
    
    for (const [documentId, chunks] of this.chunks.entries()) {
      const document = this.documents.get(documentId);
      if (document?.providerId !== params.providerId) continue;
      
      for (const chunk of chunks) {
        if (chunk.embedding) {
          const similarity = this.cosineSimilarity(queryEmbedding, chunk.embedding);
          results.push({
            documentId,
            chunkId: chunk.id,
            content: chunk.content,
            similarity,
            metadata: chunk.metadata
          });
        }
      }
    }
    
    // Sort by similarity and return top K
    results.sort((a, b) => b.similarity - a.similarity);
    return results.slice(0, params.topK);
  }
  
  /**
   * Get statistics
   */
  async getStatistics(providerId?: string): Promise<any> {
    let documents = Array.from(this.documents.values());
    
    if (providerId) {
      documents = documents.filter(d => d.providerId === providerId);
    }
    
    const totalChunks = documents.reduce((sum, d) => sum + d.chunkCount, 0);
    const totalSize = documents.reduce((sum, d) => sum + d.fileSize, 0);
    
    return {
      totalDocuments: documents.length,
      totalChunks,
      totalSize,
      byStatus: {
        pending: documents.filter(d => d.status === 'pending').length,
        processing: documents.filter(d => d.status === 'processing').length,
        indexed: documents.filter(d => d.status === 'indexed').length,
        failed: documents.filter(d => d.status === 'failed').length
      },
      byCategory: this.groupBy(documents, 'category')
    };
  }
  
  // ===== Private Helper Methods =====
  
  /**
   * Extract text from file
   */
  private async extractText(filePath: string, filename: string): Promise<string> {
    const ext = path.extname(filename).toLowerCase();
    
    if (ext === '.txt' || ext === '.md') {
      return fs.readFileSync(filePath, 'utf-8');
    }
    
    if (ext === '.pdf') {
      // TODO: Implement PDF extraction (use pdf-parse library)
      throw new Error('PDF extraction not yet implemented');
    }
    
    if (ext === '.docx' || ext === '.doc') {
      // TODO: Implement DOCX extraction (use mammoth library)
      throw new Error('DOCX extraction not yet implemented');
    }
    
    throw new Error(`Unsupported file type: ${ext}`);
  }
  
  /**
   * Chunk text into smaller pieces
   */
  private chunkText(text: string, chunkSize: number, overlap: number): string[] {
    const words = text.split(/\s+/);
    const chunks: string[] = [];
    
    for (let i = 0; i < words.length; i += (chunkSize - overlap)) {
      const chunk = words.slice(i, i + chunkSize).join(' ');
      if (chunk.trim()) {
        chunks.push(chunk);
      }
    }
    
    return chunks;
  }
  
  /**
   * Generate embedding for text
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    // Mock embedding generation
    // In production, call OpenAI, AWS Bedrock, or other embedding API
    const dimension = 1536;
    const embedding = Array.from({ length: dimension }, () => Math.random() * 2 - 1);
    
    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / magnitude);
  }
  
  /**
   * Store chunks in vector DB
   */
  private async storeInVectorDB(providerId: string, chunks: DocumentChunk[]): Promise<void> {
    // Mock storage
    // In production, store in Pinecone, pgvector, etc.
    console.log(`Storing ${chunks.length} chunks in vector DB for provider ${providerId}`);
  }
  
  /**
   * Delete from vector DB
   */
  private async deleteFromVectorDB(providerId: string, documentId: string): Promise<void> {
    // Mock deletion
    console.log(`Deleting document ${documentId} from vector DB for provider ${providerId}`);
  }
  
  /**
   * Save to database
   */
  private async saveToDatabase(document: Document, chunks: DocumentChunk[]): Promise<void> {
    // TODO: Save to SQLite database
    console.log(`Saving document ${document.id} with ${chunks.length} chunks to database`);
  }
  
  /**
   * Delete from database
   */
  private async deleteFromDatabase(documentId: string): Promise<void> {
    // TODO: Delete from SQLite database
    console.log(`Deleting document ${documentId} from database`);
  }
  
  /**
   * Calculate cosine similarity
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      magnitudeA += a[i] * a[i];
      magnitudeB += b[i] * b[i];
    }
    
    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);
    
    if (magnitudeA === 0 || magnitudeB === 0) return 0;
    
    return dotProduct / (magnitudeA * magnitudeB);
  }
  
  /**
   * Group by property
   */
  private groupBy(array: any[], property: string): Record<string, number> {
    return array.reduce((acc, item) => {
      const key = item[property];
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }
}

export const documentIngestionService = new DocumentIngestionService();
