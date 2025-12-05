/**
 * EXAMPLE: Updated Server Implementation Using Shared Routes
 * 
 * This shows how to refactor server.ts to use the shared route handlers.
 * This eliminates code duplication and ensures consistency across all servers.
 * 
 * BENEFITS:
 * 1. Fix a bug once, it's fixed everywhere
 * 2. Consistent validation across all endpoints
 * 3. Easier to test and maintain
 * 4. Type-safe with shared interfaces
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { registerSharedAgentRoutes, registerHealthCheck } from './routes/registerSharedRoutes';

const S3AgentStorage = require('./services/s3AgentStorage');
const APIKeyService = require('./services/apiKeyService');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env['PORT'] || 4002;

// Basic middleware
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    if (origin.startsWith('http://localhost:') || 
        origin.startsWith('https://localhost:') ||
        origin.startsWith('vscode-webview://') ||
        origin.startsWith('vscode-file://')) {
      return callback(null, true);
    }
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:4001',
      'http://localhost:4002'
    ];
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

app.use(express.json());

// Initialize services
const s3Storage = new S3AgentStorage();
const apiKeyService = new APIKeyService();
const createdAgents = new Map<string, any>();

// Initialize S3 bucket on startup
s3Storage.initializeBucket().catch(console.error);

// API Key validation middleware
const validateAPIKey = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.path === '/health' || req.path.startsWith('/api/v1/auth/')) {
    return next();
  }

  const authHeader = req.headers.authorization;
  const apiKey = authHeader || req.headers['x-api-key'] as string;

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'API key is required',
      message: 'Include API key in Authorization header or x-api-key header'
    });
  }

  const validation = apiKeyService.validateAPIKey(apiKey);
  
  if (!validation.valid) {
    return res.status(401).json({
      success: false,
      error: validation.error
    });
  }

  (req as any).apiKeyData = validation.keyData;
  next();
};

// Apply API key validation to all API routes
app.use('/api', validateAPIKey);

// Import other routes
import devopsRoutes from './routes/devops';
import testingRoutes from './routes/testing';
import realMCPRoutes from './routes/realMCPRoutes';
import dockerMCPRoutes from './routes/dockerMCPRoutes';
import finopsRoutes from './routes/finops';

// Register specialized routes
app.use('/api/devops', devopsRoutes);
app.use('/api/testing', testingRoutes);
app.use('/api/mcp', realMCPRoutes);
app.use('/api/docker-mcp', dockerMCPRoutes);
app.use('/api/finops', finopsRoutes);

// ===== REGISTER SHARED AGENT ROUTES =====
// This replaces all the duplicate agent route definitions
// Now when you fix a bug in sharedAgentRoutes.ts, it's fixed for all servers!

let executionService: any = null;
let callBedrock: any = null;

// Try to load execution service
try {
  const { AgentExecutionService } = require('./services/AgentExecutionService');
  executionService = AgentExecutionService.getInstance();
  console.log('✅ Execution service loaded');
} catch (error) {
  console.log('ℹ️  Execution service not available');
}

// Try to load Bedrock
try {
  const bedrockConfig = require('../../bedrock-integration/bedrock-config');
  callBedrock = bedrockConfig.callBedrock;
  console.log('✅ Bedrock integration loaded');
} catch (error) {
  console.log('ℹ️  Bedrock not available');
}

// Register health check
registerHealthCheck(app, {
  version: '1.0.0',
  environment: process.env.NODE_ENV || 'development',
  services: {
    apiKeys: 'healthy',
    s3: 'healthy',
    agents: 'healthy'
  }
});

// Register all shared agent routes with validation
registerSharedAgentRoutes(app, {
  executionService,
  createdAgents,
  s3Storage,
  callBedrock
});

// ===== API KEY MANAGEMENT ENDPOINTS =====
// These are specific to this server, so they stay here

import { RequestValidator } from './shared/validation';

app.post('/api/v1/auth/keys', RequestValidator.validateAPIKeyRequest, (req, res): void => {
  try {
    const { name, permissions, userId } = req.body;
    const keyData = apiKeyService.createAPIKey(userId, name, permissions);
    
    res.status(201).json({
      success: true,
      data: keyData,
      message: 'API key created successfully'
    });
  } catch (error) {
    console.error('❌ API Key creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create API key'
    });
  }
});

app.get('/api/v1/auth/keys', (req, res): void => {
  try {
    const keys = apiKeyService.getAllKeys();
    res.json({
      success: true,
      data: keys,
      count: keys.length
    });
  } catch (error) {
    console.error('❌ API Key listing error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list API keys'
    });
  }
});

app.get('/api/v1/auth/stats', (req, res): void => {
  try {
    const stats = apiKeyService.getUsageStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('❌ API Key stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get API key statistics'
    });
  }
});

app.post('/api/v1/auth/validate', (req, res): void => {
  try {
    const { apiKey } = req.body;
    
    if (!apiKey) {
      res.status(400).json({
        success: false,
        error: 'API key is required'
      });
      return;
    }

    const validation = apiKeyService.validateAPIKey(apiKey);
    res.json({
      success: true,
      valid: validation.valid,
      error: validation.error,
      keyData: validation.valid ? validation.keyData : undefined
    });
  } catch (error) {
    console.error('❌ API Key validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate API key'
    });
  }
});

// ===== S3 STORAGE ENDPOINTS =====
// These are also specific to this server

app.get('/api/v1/agents/s3', async (req, res): Promise<void> => {
  try {
    console.log('🔍 S3 API: Fetching all agents from S3...');
    const agents = await s3Storage.listAgents();
    
    res.json({
      success: true,
      data: agents,
      count: agents.length
    });
  } catch (error) {
    console.error('❌ S3 API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch agents from S3'
    });
  }
});

app.get('/api/v1/agents/s3/:agentId', async (req, res): Promise<void> => {
  try {
    const { agentId } = req.params;
    console.log(`🔍 S3 API: Fetching agent ${agentId} from S3...`);
    
    const agent = await s3Storage.getAgent(agentId);
    
    if (!agent) {
      res.status(404).json({
        success: false,
        error: 'Agent not found in S3'
      });
      return;
    }
    
    res.json({
      success: true,
      data: agent
    });
  } catch (error) {
    console.error('❌ S3 API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch agent from S3'
    });
  }
});

app.post('/api/v1/agents/s3', async (req, res): Promise<void> => {
  try {
    const agentData = req.body;
    
    if (!agentData.id || !agentData.name) {
      res.status(400).json({
        success: false,
        error: 'Agent ID and name are required'
      });
      return;
    }
    
    await s3Storage.saveAgent(agentData);
    
    res.json({
      success: true,
      message: 'Agent saved to S3 successfully',
      data: agentData
    });
  } catch (error) {
    console.error('❌ S3 API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save agent to S3'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║  🚀 Agent Hub Backend Server (REFACTORED)                  ║
║  📡 Port: ${PORT}                                          ║
║  🌍 Environment: ${process.env.NODE_ENV || 'development'}  ║
║  ✅ Using Shared Routes - No More Duplication!            ║
╚════════════════════════════════════════════════════════════╝

📋 Available Endpoints:
   GET  /health
   GET  /api/v1/agents
   GET  /api/v1/agents/:agentId
   POST /api/v1/agents/:agentId/execute
   POST /api/v1/agents/hybrid/create
   GET  /api/v1/agents/hybrid/:agentId
   POST /api/v1/agents/hybrid/:agentId/execute
   
   [API Keys]
   POST /api/v1/auth/keys
   GET  /api/v1/auth/keys
   GET  /api/v1/auth/stats
   POST /api/v1/auth/validate
   
   [S3 Storage]
   GET  /api/v1/agents/s3
   GET  /api/v1/agents/s3/:agentId
   POST /api/v1/agents/s3

🎯 Benefits of Refactoring:
   ✅ Single source of truth for agent routes
   ✅ Consistent validation across all endpoints
   ✅ Fix once, fixed everywhere
   ✅ Type-safe with shared interfaces
   ✅ Easier to test and maintain
  `);
});

export default app;
