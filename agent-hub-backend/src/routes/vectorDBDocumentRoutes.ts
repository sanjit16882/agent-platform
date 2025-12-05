/**
 * Vector DB Document Management Routes
 * 
 * API endpoints for document ingestion and management
 */

import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { documentIngestionService } from '../services/documentIngestionService';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/documents/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.docx', '.txt', '.md', '.doc'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${ext} not supported. Allowed: ${allowedTypes.join(', ')}`));
    }
  }
});

/**
 * POST /api/v1/vector-db/documents/upload
 * Upload and ingest documents
 */
router.post('/documents/upload', upload.array('files', 10), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    const { category, providerId, metadata } = req.body;
    
    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files uploaded'
      });
    }
    
    if (!providerId) {
      return res.status(400).json({
        success: false,
        error: 'providerId is required'
      });
    }
    
    // Process each file
    const results = [];
    for (const file of files) {
      try {
        const result = await documentIngestionService.ingestDocument({
          filePath: file.path,
          filename: file.originalname,
          category: category || 'general',
          providerId,
          metadata: metadata ? JSON.parse(metadata) : {},
          uploadedBy: 'user-1' // TODO: Get from auth
        });
        
        results.push(result);
      } catch (error: any) {
        results.push({
          filename: file.originalname,
          success: false,
          error: error.message
        });
      }
    }
    
    res.json({
      success: true,
      data: results,
      message: `Processed ${results.length} file(s)`
    });
  } catch (error: any) {
    console.error('Error uploading documents:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/v1/vector-db/documents
 * Get all documents
 */
router.get('/documents', async (req: Request, res: Response) => {
  try {
    const { providerId, category, status } = req.query;
    
    const documents = await documentIngestionService.getDocuments({
      providerId: providerId as string,
      category: category as string,
      status: status as string
    });
    
    res.json({
      success: true,
      data: documents
    });
  } catch (error: any) {
    console.error('Error fetching documents:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/v1/vector-db/documents/:id
 * Get document by ID
 */
router.get('/documents/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const document = await documentIngestionService.getDocumentById(id);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }
    
    res.json({
      success: true,
      data: document
    });
  } catch (error: any) {
    console.error('Error fetching document:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/v1/vector-db/documents/:id
 * Delete document and its chunks
 */
router.delete('/documents/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await documentIngestionService.deleteDocument(id);
    
    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting document:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/v1/vector-db/documents/:id/reindex
 * Re-index a document
 */
router.post('/documents/:id/reindex', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await documentIngestionService.reindexDocument(id);
    
    res.json({
      success: true,
      data: result,
      message: 'Document re-indexed successfully'
    });
  } catch (error: any) {
    console.error('Error re-indexing document:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/v1/vector-db/documents/:id/chunks
 * Get chunks for a document
 */
router.get('/documents/:id/chunks', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const chunks = await documentIngestionService.getDocumentChunks(id);
    
    res.json({
      success: true,
      data: chunks
    });
  } catch (error: any) {
    console.error('Error fetching chunks:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/v1/vector-db/documents/import/url
 * Import documents from URL (web scraping)
 */
router.post('/documents/import/url', async (req: Request, res: Response) => {
  try {
    const { url, providerId, category } = req.body;
    
    if (!url || !providerId) {
      return res.status(400).json({
        success: false,
        error: 'url and providerId are required'
      });
    }
    
    const result = await documentIngestionService.importFromUrl({
      url,
      providerId,
      category: category || 'web-content',
      uploadedBy: 'user-1' // TODO: Get from auth
    });
    
    res.json({
      success: true,
      data: result,
      message: 'URL content imported successfully'
    });
  } catch (error: any) {
    console.error('Error importing from URL:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/v1/vector-db/documents/import/text
 * Import raw text directly
 */
router.post('/documents/import/text', async (req: Request, res: Response) => {
  try {
    const { title, content, providerId, category, metadata } = req.body;
    
    if (!title || !content || !providerId) {
      return res.status(400).json({
        success: false,
        error: 'title, content, and providerId are required'
      });
    }
    
    const result = await documentIngestionService.ingestText({
      title,
      content,
      providerId,
      category: category || 'text',
      metadata: metadata || {},
      uploadedBy: 'user-1' // TODO: Get from auth
    });
    
    res.json({
      success: true,
      data: result,
      message: 'Text imported successfully'
    });
  } catch (error: any) {
    console.error('Error importing text:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/v1/vector-db/documents/stats
 * Get document statistics
 */
router.get('/documents/stats', async (req: Request, res: Response) => {
  try {
    const { providerId } = req.query;
    const stats = await documentIngestionService.getStatistics(providerId as string);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/v1/vector-db/documents/search
 * Search documents
 */
router.post('/documents/search', async (req: Request, res: Response) => {
  try {
    const { query, providerId, topK } = req.body;
    
    if (!query || !providerId) {
      return res.status(400).json({
        success: false,
        error: 'query and providerId are required'
      });
    }
    
    const results = await documentIngestionService.searchDocuments({
      query,
      providerId,
      topK: topK || 5
    });
    
    res.json({
      success: true,
      data: results
    });
  } catch (error: any) {
    console.error('Error searching documents:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
