import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from 'dotenv';
import { AGENT_TEMPLATES } from './agent-templates';
import { AgentProcessor } from './agent-processors';

// Load production environment variables
config({ path: '.env.production' });

const app = express();
const PORT = process.env.PORT || 8080;

// Enhanced security middleware for production
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Production CORS configuration with real AWS endpoints
app.use(cors({
  origin: [
    'http://agenthub-frontend.s3-website-us-east-1.amazonaws.com',
    'https://gnqhk06mvd.execute-api.us-east-1.amazonaws.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-user-id', 'X-User-Id']
}));

// Strict rate limiting for production
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Body parsing middleware with limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Production logging middleware
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

// Health check endpoint
app.get('/health', (_req, res): void => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: 'production',
    bedrock: 'enabled'
  });
});

// Bedrock integration
const { callBedrock } = require('../../bedrock-integration/bedrock-config');

// In-memory storage for created agents (in production, this would be DynamoDB)
const createdAgents = new Map<string, any>();

// Production API routes with Bedrock integration
app.get('/api/v1/agents', (_req, res): void => {
  // Get created hybrid agents
  const hybridAgents = Array.from(createdAgents.values()).map(agent => ({
    id: agent.id,
    agent_id: agent.id,
    name: agent.name,
    category: agent.category,
    description: agent.description,
    status: 'active',
    agent_type: 'hybrid',
    usage_count: agent.usage_count || 0,
    average_rating: agent.average_rating || 0,
    created_at: agent.created,
    tags: agent.tags || []
  }));

  // Built-in agents with production capabilities
  const builtInAgents = [
    {
      id: 'security-scanner',
      agent_id: 'security-scanner',
      name: 'Security Vulnerability Scanner',
      category: 'Security',
      description: 'AI-powered security analysis using AWS Bedrock Claude models',
      status: 'active',
      agent_type: 'builtin',
      usage_count: 1247,
      average_rating: 5,
      created_at: '2024-01-15T10:30:00Z',
      tags: ['security', 'scanning', 'bedrock', 'claude']
    },
    {
      id: 'qa-assistant',
      agent_id: 'qa-assistant',
      name: 'QA Test Generator',
      category: 'QA',
      description: 'Intelligent test case generation powered by AWS Bedrock',
      status: 'active',
      agent_type: 'builtin',
      usage_count: 2156,
      average_rating: 5,
      created_at: '2024-02-01T09:15:00Z',
      tags: ['qa', 'testing', 'bedrock', 'ai']
    },
    {
      id: 'finops-analyzer',
      agent_id: 'finops-analyzer',
      name: 'FinOps Cost Analyzer',
      category: 'FinOps',
      description: 'Advanced cost analysis using AWS Bedrock AI models',
      status: 'active',
      agent_type: 'builtin',
      usage_count: 934,
      average_rating: 4,
      created_at: '2024-01-26T12:15:00Z',
      tags: ['finops', 'cost-optimization', 'bedrock']
    }
  ];

  const allAgents = [...hybridAgents, ...builtInAgents];

  res.json({
    success: true,
    data: allAgents,
    meta: {
      total: allAgents.length,
      environment: 'production',
      aiProvider: 'aws-bedrock'
    }
  });
});

app.post('/api/v1/agents/:agentId/execute', async (req, res): Promise<void> => {
  try {
    const { agentId } = req.params;
    const { inputs } = req.body;

    console.log(`🚀 [PRODUCTION] Executing agent: ${agentId} with Bedrock AI`);

    // Validate inputs
    if (!inputs || typeof inputs !== 'object') {
      res.status(400).json({
        success: false,
        error: 'Inputs object is required'
      });
      return;
    }

    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    let results;
    
    try {
      // Use real Bedrock AI for processing
      console.log(`🤖 Calling AWS Bedrock for agent: ${agentId}`);
      
      const bedrockResponse = await callBedrock(agentId, inputs.input || inputs.text || inputs.content || '', {
        framework: inputs.framework || 'javascript',
        testType: inputs.testType || 'unit',
        context: inputs.context || {}
      });

      if (bedrockResponse.success) {
        console.log(`✅ Bedrock response received for ${agentId}`);
        
        results = {
          summary: {
            status: 'completed',
            processing_time: `${Date.now() - startTime}ms`,
            agent_purpose: `AI-powered ${agentId.replace('-', ' ')}`,
            ai_provider: 'aws-bedrock',
            model_used: bedrockResponse.model,
            tokens_used: bedrockResponse.usage
          },
          ai_response: bedrockResponse.content,
          metadata: {
            environment: 'production',
            ai_provider: 'aws-bedrock',
            model: bedrockResponse.model,
            processing_time: Date.now() - startTime,
            cost_optimization: true
          }
        };
      } else {
        console.error(`❌ Bedrock error for ${agentId}:`, bedrockResponse.error);
        
        results = {
          summary: {
            status: 'error',
            processing_time: `${Date.now() - startTime}ms`,
            ai_provider: 'aws-bedrock'
          },
          error: `AI processing failed: ${bedrockResponse.error}`,
          fallback_used: false
        };
      }
    } catch (error) {
      console.error(`❌ Bedrock integration error:`, error);
      
      results = {
        summary: {
          status: 'error',
          processing_time: `${Date.now() - startTime}ms`,
          ai_provider: 'aws-bedrock'
        },
        error: 'AI service temporarily unavailable',
        technical_error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    res.json({
      success: results.summary.status === 'completed',
      executionId,
      status: results.summary.status,
      results,
      duration: `${Date.now() - startTime}ms`,
      sync: true,
      environment: 'production'
    });

  } catch (error) {
    console.error('❌ Production execution error:', error);
    res.status(500).json({
      success: false,
      error: 'Agent execution failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      environment: 'production'
    });
  }
});

// NLP/Agent Builder Endpoints with Bedrock
app.get('/api/v1/nlp/templates', (_req, res): void => {
  res.json({
    success: true,
    data: {
      templates: AGENT_TEMPLATES.map(template => ({
        id: template.id,
        name: template.name,
        category: template.category,
        description: template.description,
        purpose: template.purpose,
        ai_enhanced: true,
        bedrock_optimized: true
      })),
      meta: {
        total: AGENT_TEMPLATES.length,
        ai_provider: 'aws-bedrock',
        environment: 'production'
      }
    }
  });
});

app.post('/api/v1/nlp/create-agent', async (req, res): Promise<void> => {
  const { templateId, agentName, inputs } = req.body;
  
  if (!templateId || !agentName) {
    res.status(400).json({
      success: false,
      error: 'Template ID and agent name are required'
    });
    return;
  }

  const template = AGENT_TEMPLATES.find(t => t.id === templateId);
  if (!template) {
    res.status(404).json({
      success: false,
      error: 'Template not found'
    });
    return;
  }

  try {
    // Use Bedrock to enhance agent creation
    const enhancementPrompt = `Enhance this agent configuration for production use: ${JSON.stringify({
      template: template.name,
      purpose: template.purpose,
      inputs: inputs
    })}`;

    const bedrockResponse = await callBedrock('documentation-generator', enhancementPrompt, {
      context: 'agent-creation',
      environment: 'production'
    });

    const agentId = `${templateId}_prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const enhancedAgent = {
      id: agentId,
      name: agentName,
      description: template.description,
      template_id: templateId,
      created: new Date().toISOString(),
      environment: 'production',
      ai_enhanced: true,
      bedrock_optimization: bedrockResponse.success ? bedrockResponse.content : null,
      inputs: inputs || {}
    };

    createdAgents.set(agentId, enhancedAgent);

    res.status(201).json({
      success: true,
      data: enhancedAgent,
      message: 'Production agent created with AI enhancement',
      ai_provider: 'aws-bedrock'
    });

  } catch (error) {
    console.error('❌ Agent creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create enhanced agent',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Security policies endpoint
app.get('/api/v1/security/policies', (_req, res): void => {
  res.json({
    success: true,
    data: {
      passwordPolicy: {
        minLength: 12,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        expiryDays: 90,
        historyCount: 5
      },
      sessionPolicy: {
        maxDuration: 3600, // 1 hour
        idleTimeout: 1800, // 30 minutes
        maxConcurrentSessions: 3,
        requireMFA: true
      },
      accessPolicy: {
        maxFailedAttempts: 3,
        lockoutDuration: 900, // 15 minutes
        requireApproval: true,
        auditLogging: true
      },
      environment: 'production',
      lastUpdated: new Date().toISOString()
    }
  });
});

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction): void => {
  console.error('Production server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    environment: 'production',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((_req, res): void => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    environment: 'production'
  });
});

// Start production server
app.listen(PORT, () => {
  console.log(`🚀 Agent Hub PRODUCTION Server running on port ${PORT}`);
  console.log(`🤖 AI Provider: AWS Bedrock (Real AI)`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API base URL: http://localhost:${PORT}/api/v1`);
  console.log(`🔒 Environment: PRODUCTION`);
});

export default app;