import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { nlpController } from './controllers/nlpController';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// Basic middleware
app.use(cors({
  origin: 'http://localhost:3001',
  credentials: true
}));

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API root endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'AgentHub API Gateway',
    version: 'v1',
    status: 'operational',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      nlp: '/api/v1/nlp',
      nlpTest: '/api/v1/nlp/test'
    }
  });
});

// Simple NLP test endpoint (no authentication)
app.get('/api/v1/nlp/test', (req, res) => {
  res.json({
    success: true,
    message: 'NLP service is working!',
    timestamp: new Date().toISOString(),
    endpoints: [
      'POST /api/v1/nlp/process',
      'POST /api/v1/nlp/parse-intent',
      'POST /api/v1/nlp/generate-config',
      'POST /api/v1/nlp/validate-config',
      'POST /api/v1/nlp/suggestions',
      'POST /api/v1/nlp/refine-config',
      'GET /api/v1/nlp/examples',
      'GET /api/v1/nlp/capabilities'
    ]
  });
});

// NLP examples endpoint (no authentication)
app.get('/api/v1/nlp/examples', (req, res) => {
  try {
    nlpController.getExamples(req, res);
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'NLP_ERROR',
        message: 'Failed to get examples',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// NLP capabilities endpoint (no authentication)
app.get('/api/v1/nlp/capabilities', (req, res) => {
  try {
    nlpController.getCapabilities(req, res);
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'NLP_ERROR',
        message: 'Failed to get capabilities',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// NLP process endpoint (no authentication for testing)
app.post('/api/v1/nlp/process', (req, res) => {
  try {
    nlpController.processDescription(req, res);
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'NLP_ERROR',
        message: 'Failed to process description',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
      timestamp: new Date().toISOString()
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Simple AgentHub API started on port ${PORT}`);
  console.log(`📚 Health Check: http://localhost:${PORT}/health`);
  console.log(`🧪 NLP Test: http://localhost:${PORT}/api/v1/nlp/test`);
  console.log(`📖 Examples: http://localhost:${PORT}/api/v1/nlp/examples`);
  console.log(`⚙️  Capabilities: http://localhost:${PORT}/api/v1/nlp/capabilities`);
  console.log(`🔄 Process NLP: POST http://localhost:${PORT}/api/v1/nlp/process`);
});

export { app };