import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { AGENT_TEMPLATES } from './agent-templates';

const app = express();

// Lambda-optimized middleware
app.use(helmet({
  contentSecurityPolicy: false, // Simplified for Lambda
  crossOriginEmbedderPolicy: false
}));

// CORS for your existing AWS infrastructure
app.use(cors({
  origin: [
    'http://agenthub-frontend.s3-website-us-east-1.amazonaws.com',
    'https://gnqhk06mvd.execute-api.us-east-1.amazonaws.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-user-id', 'X-User-Id']
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: 'production',
    platform: 'aws-lambda',
    bedrock: 'enabled'
  });
});

// Bedrock integration
let callBedrock: any;
try {
  const bedrockConfig = require('./bedrock-integration/bedrock-config');
  callBedrock = bedrockConfig.callBedrock;
} catch (error) {
  console.error('Bedrock integration not available:', error);
}

// Agent execution with real Bedrock
app.post('/api/v1/agents/:agentId/execute', async (req, res) => {
  try {
    const { agentId } = req.params;
    const { inputs } = req.body;

    console.log(`🚀 [AWS LAMBDA] Executing agent: ${agentId} with Bedrock`);

    if (!inputs || typeof inputs !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Inputs object is required'
      });
    }

    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    if (!callBedrock) {
      return res.status(500).json({
        success: false,
        error: 'Bedrock integration not available',
        executionId,
        environment: 'aws-lambda'
      });
    }

    try {
      console.log(`🤖 Calling AWS Bedrock for agent: ${agentId}`);
      
      const bedrockResponse = await callBedrock(agentId, inputs.input || inputs.text || inputs.content || '', {
        framework: inputs.framework || 'javascript',
        testType: inputs.testType || 'unit',
        context: inputs.context || {}
      });

      const processingTime = Date.now() - startTime;

      if (bedrockResponse.success) {
        console.log(`✅ Bedrock response received for ${agentId}`);
        
        res.json({
          success: true,
          executionId,
          status: 'completed',
          results: {
            summary: {
              status: 'completed',
              processing_time: `${processingTime}ms`,
              agent_purpose: `AI-powered ${agentId.replace('-', ' ')}`,
              ai_provider: 'aws-bedrock',
              model_used: bedrockResponse.model,
              tokens_used: bedrockResponse.usage,
              platform: 'aws-lambda'
            },
            ai_response: bedrockResponse.content,
            metadata: {
              environment: 'production',
              platform: 'aws-lambda',
              ai_provider: 'aws-bedrock',
              model: bedrockResponse.model,
              processing_time: processingTime,
              cost_optimization: true
            }
          },
          duration: `${processingTime}ms`,
          sync: true,
          environment: 'production'
        });
      } else {
        console.error(`❌ Bedrock error for ${agentId}:`, bedrockResponse.error);
        
        res.json({
          success: false,
          executionId,
          status: 'error',
          results: {
            summary: {
              status: 'error',
              processing_time: `${processingTime}ms`,
              ai_provider: 'aws-bedrock',
              platform: 'aws-lambda'
            },
            error: `AI processing failed: ${bedrockResponse.error}`,
            fallback_used: false
          },
          duration: `${processingTime}ms`,
          sync: true,
          environment: 'production'
        });
      }
    } catch (error) {
      console.error(`❌ Bedrock integration error:`, error);
      
      res.status(500).json({
        success: false,
        executionId,
        status: 'error',
        results: {
          summary: {
            status: 'error',
            processing_time: `${Date.now() - startTime}ms`,
            ai_provider: 'aws-bedrock',
            platform: 'aws-lambda'
          },
          error: 'AI service temporarily unavailable',
          technical_error: error instanceof Error ? error.message : 'Unknown error'
        },
        duration: `${Date.now() - startTime}ms`,
        sync: true,
        environment: 'production'
      });
    }

  } catch (error) {
    console.error('❌ Lambda execution error:', error);
    res.status(500).json({
      success: false,
      error: 'Agent execution failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      environment: 'production',
      platform: 'aws-lambda'
    });
  }
});

// NLP Templates
app.get('/api/v1/nlp/templates', (_req, res) => {
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
        bedrock_optimized: true,
        platform: 'aws-lambda'
      })),
      meta: {
        total: AGENT_TEMPLATES.length,
        ai_provider: 'aws-bedrock',
        environment: 'production',
        platform: 'aws-lambda'
      }
    }
  });
});

// Agents list
app.get('/api/v1/agents', (_req, res) => {
  const agents = [
    {
      id: 'security-scanner',
      name: 'Security Vulnerability Scanner',
      category: 'Security',
      description: 'AI-powered security analysis using AWS Bedrock Claude models',
      status: 'active',
      agent_type: 'builtin',
      usage_count: 1247,
      average_rating: 5,
      tags: ['security', 'scanning', 'bedrock', 'claude'],
      platform: 'aws-lambda'
    },
    {
      id: 'qa-assistant',
      name: 'QA Test Generator',
      category: 'QA',
      description: 'Intelligent test case generation powered by AWS Bedrock',
      status: 'active',
      agent_type: 'builtin',
      usage_count: 2156,
      average_rating: 5,
      tags: ['qa', 'testing', 'bedrock', 'ai'],
      platform: 'aws-lambda'
    },
    {
      id: 'finops-analyzer',
      name: 'FinOps Cost Analyzer',
      category: 'FinOps',
      description: 'Advanced cost analysis using AWS Bedrock AI models',
      status: 'active',
      agent_type: 'builtin',
      usage_count: 934,
      average_rating: 4,
      tags: ['finops', 'cost-optimization', 'bedrock'],
      platform: 'aws-lambda'
    }
  ];

  res.json({
    success: true,
    data: agents,
    meta: {
      total: agents.length,
      environment: 'production',
      platform: 'aws-lambda',
      aiProvider: 'aws-bedrock'
    }
  });
});

// Security policies
app.get('/api/v1/security/policies', (_req, res) => {
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
        maxDuration: 3600,
        idleTimeout: 1800,
        maxConcurrentSessions: 3,
        requireMFA: true
      },
      accessPolicy: {
        maxFailedAttempts: 3,
        lockoutDuration: 900,
        requireApproval: true,
        auditLogging: true
      },
      environment: 'production',
      platform: 'aws-lambda',
      lastUpdated: new Date().toISOString()
    }
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    environment: 'production',
    platform: 'aws-lambda'
  });
});

export default app;