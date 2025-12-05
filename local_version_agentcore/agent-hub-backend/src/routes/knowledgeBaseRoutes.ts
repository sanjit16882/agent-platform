/**
 * Knowledge Base Management API Routes
 * 
 * Provides REST API endpoints for:
 * - Creating and managing knowledge bases
 * - Uploading and managing documents
 * - Searching and testing
 * 
 * CRITICAL: These are NEW routes that do not modify existing routes
 */

import express, { Request, Response } from 'express';
import { KnowledgeBaseService } from '../services/knowledgeBaseService';
import { VectorDBService } from '../services/vectorDBService';
import { createVectorDBClient } from '../services/vectorDBClient';
import multer from 'multer';
import * as fs from 'fs';
import * as path from 'path';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024  // 10MB limit
  }
});

// Initialize services
const vectorDBClient = createVectorDBClient();
const vectorDBService = new VectorDBService(vectorDBClient);
const knowledgeBaseService = new KnowledgeBaseService(vectorDBService, vectorDBClient);

// ============================================
// Knowledge Base Management Endpoints
// ============================================

/**
 * GET /api/v1/knowledge-bases
 * List all knowledge bases
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    console.log('📋 Listing all knowledge bases');
    
    const knowledgeBases = await knowledgeBaseService.listKnowledgeBases();
    
    res.json({
      success: true,
      knowledgeBases,
      total: knowledgeBases.length
    });
    
  } catch (error: any) {
    console.error('✗ Failed to list knowledge bases:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/v1/knowledge-bases/:id
 * Get knowledge base details
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    console.log(`📖 Getting knowledge base: ${id}`);
    
    const knowledgeBase = await knowledgeBaseService.getKnowledgeBase(id);
    
    if (!knowledgeBase) {
      return res.status(404).json({
        success: false,
        error: 'Knowledge base not found'
      });
    }
    
    // Get statistics
    const stats = await knowledgeBaseService.getKnowledgeBaseStats(id);
    
    res.json({
      success: true,
      knowledgeBase,
      stats
    });
    
  } catch (error: any) {
    console.error('✗ Failed to get knowledge base:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/v1/knowledge-bases
 * Create new knowledge base
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, description, provider, metadata } = req.body;
    
    // Validation
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Name is required'
      });
    }
    
    console.log(`🏗️ Creating knowledge base: ${name}`);
    
    const knowledgeBase = await knowledgeBaseService.createKnowledgeBase({
      name,
      description: description || '',
      provider,
      createdBy: req.body.userId || 'system',
      metadata
    });
    
    res.status(201).json({
      success: true,
      knowledgeBase
    });
    
  } catch (error: any) {
    console.error('✗ Failed to create knowledge base:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/v1/knowledge-bases/:id
 * Delete knowledge base
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    console.log(`🗑️ Deleting knowledge base: ${id}`);
    
    await knowledgeBaseService.deleteKnowledgeBase(id);
    
    res.json({
      success: true,
      message: 'Knowledge base deleted successfully'
    });
    
  } catch (error: any) {
    console.error('✗ Failed to delete knowledge base:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/v1/knowledge-bases/:id/stats
 * Get knowledge base statistics
 */
router.get('/:id/stats', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    console.log(`📊 Getting stats for knowledge base: ${id}`);
    
    const stats = await knowledgeBaseService.getKnowledgeBaseStats(id);
    
    res.json({
      success: true,
      stats
    });
    
  } catch (error: any) {
    console.error('✗ Failed to get knowledge base stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// Document Management Endpoints
// ============================================

/**
 * POST /api/v1/knowledge-bases/:id/documents
 * Upload documents to knowledge base
 */
router.post('/:id/documents', upload.array('files', 10), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files uploaded'
      });
    }
    
    console.log(`📚 Uploading ${files.length} documents to knowledge base: ${id}`);
    
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    };
    
    // Process each file
    for (const file of files) {
      try {
        // Extract text from file
        const fileType = path.extname(file.originalname).substring(1);
        const content = await knowledgeBaseService.extractTextFromFile(file.path, fileType);
        
        // Upload document
        await knowledgeBaseService.uploadDocument({
          knowledgeBaseId: id,
          title: file.originalname,
          content,
          source: file.originalname,
          metadata: {
            fileType,
            fileSize: file.size,
            uploadedAt: new Date().toISOString()
          }
        });
        
        results.success++;
        
        // Clean up uploaded file
        fs.unlinkSync(file.path);
        
      } catch (error: any) {
        results.failed++;
        results.errors.push(`${file.originalname}: ${error.message}`);
        console.error(`✗ Failed to process ${file.originalname}:`, error);
        
        // Clean up uploaded file
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      }
    }
    
    res.json({
      success: true,
      documentsIndexed: results.success,
      documentsFailed: results.failed,
      errors: results.errors
    });
    
  } catch (error: any) {
    console.error('✗ Failed to upload documents:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/v1/knowledge-bases/:id/documents
 * List documents in knowledge base
 */
router.get('/:id/documents', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    
    console.log(`📋 Listing documents in knowledge base: ${id}`);
    
    const result = await knowledgeBaseService.listDocuments(id, { limit, offset });
    
    res.json({
      success: true,
      documents: result.documents,
      total: result.total,
      limit,
      offset
    });
    
  } catch (error: any) {
    console.error('✗ Failed to list documents:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/v1/knowledge-bases/:id/documents/:documentId
 * Get document details
 */
router.get('/:id/documents/:documentId', async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;
    
    console.log(`📖 Getting document: ${documentId}`);
    
    const document = await knowledgeBaseService.getDocument(documentId);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }
    
    res.json({
      success: true,
      document
    });
    
  } catch (error: any) {
    console.error('✗ Failed to get document:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/v1/knowledge-bases/:id/documents/:documentId
 * Delete document from knowledge base
 */
router.delete('/:id/documents/:documentId', async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;
    
    console.log(`🗑️ Deleting document: ${documentId}`);
    
    await knowledgeBaseService.deleteDocument(documentId);
    
    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
    
  } catch (error: any) {
    console.error('✗ Failed to delete document:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// Search & Testing Endpoints
// ============================================

/**
 * POST /api/v1/knowledge-bases/:id/search
 * Test search in knowledge base
 */
router.post('/:id/search', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { query, topK, minSimilarity } = req.body;
    
    // Validation
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query is required'
      });
    }
    
    console.log(`🔍 Testing search in knowledge base: ${id}`);
    console.log(`   Query: "${query}"`);
    
    const kb = await knowledgeBaseService.getKnowledgeBase(id);
    if (!kb) {
      return res.status(404).json({
        success: false,
        error: 'Knowledge base not found'
      });
    }
    
    // Generate embedding for query
    const embedding = await vectorDBService.generateEmbedding(query);
    
    // Search vector database
    const results = await vectorDBService.search({
      indexes: [kb.indexName],
      vector: embedding,
      topK: topK || 5,
      minSimilarity: minSimilarity || 0.7
    });
    
    res.json({
      success: true,
      query,
      documents: results.documents,
      totalResults: results.totalResults,
      searchLatency: results.searchLatency
    });
    
  } catch (error: any) {
    console.error('✗ Search failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// Statistics Endpoints
// ============================================

/**
 * GET /api/v1/knowledge-bases/stats/summary
 * Get summary statistics for all knowledge bases
 */
router.get('/stats/summary', async (req: Request, res: Response) => {
  try {
    console.log('📊 Getting summary statistics');
    
    const totalStorage = knowledgeBaseService.getTotalStorageUsed();
    const totalDocuments = knowledgeBaseService.getTotalDocumentCount();
    const knowledgeBases = await knowledgeBaseService.listKnowledgeBases();
    
    res.json({
      success: true,
      summary: {
        totalKnowledgeBases: knowledgeBases.length,
        totalDocuments,
        totalStorageBytes: totalStorage,
        totalStorageMB: (totalStorage / (1024 * 1024)).toFixed(2)
      }
    });
    
  } catch (error: any) {
    console.error('✗ Failed to get summary statistics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// Export Router
// ============================================

export default router;
