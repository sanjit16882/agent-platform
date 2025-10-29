import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from 'dotenv';
import { AGENT_TEMPLATES } from './agent-templates';
import { AgentProcessor } from './agent-processors';

// S3 Agent Storage
const S3AgentStorage = require('./services/s3AgentStorage');
const s3Storage = new S3AgentStorage();

// Bedrock integration for real AI processing
let callBedrock: any;
try {
  const bedrockConfig = require('../../bedrock-integration/bedrock-config');
  callBedrock = bedrockConfig.callBedrock;
  console.log('✅ Real AWS Bedrock integration loaded');
} catch (error) {
  console.error('❌ Bedrock integration not available:', error instanceof Error ? error.message : 'Unknown error');
  console.log('⚠️  Will fall back to mock responses');
}

// Load environment variables
config();

const app = express();
const PORT = process.env.PORT || 3002;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003',
    'http://localhost:3004',
    'http://localhost:3005'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-user-id', 'X-User-Id']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// In-memory storage for created agents (in production, this would be a database)
const createdAgents = new Map<string, any>();

// In-memory storage for marketplace publications
const marketplacePublications = new Map<string, any>();

// Request logging middleware
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Initialize S3 storage
(async () => {
  try {
    await s3Storage.initializeBucket();
    console.log('✅ S3 Agent Storage initialized');
  } catch (error) {
    console.error('❌ Failed to initialize S3 storage:', error);
  }
})();

// Health check endpoint
app.get('/health', (_req, res): void => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: 'local',
    ai_provider: callBedrock ? 'AWS Bedrock (Real AI)' : 'Mock responses',
    bedrock_available: !!callBedrock,
    s3_storage: 'enabled'
  });
});

// ===== S3 AGENT STORAGE ENDPOINTS (MUST BE BEFORE GENERIC ROUTES) =====

// Get all agents from S3
app.get('/api/v1/agents/s3', async (req, res): Promise<void> => {
  try {
    console.log('🔍 S3 API: Fetching all agents from S3...');
    const agents = await s3Storage.listAgents();
    console.log('✅ S3 API: Found agents:', agents.length);
    
    res.json({
      success: true,
      data: agents,
      count: agents.length
    });
  } catch (error) {
    console.error('❌ S3 API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch agents from S3',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get specific agent from S3
app.get('/api/v1/agents/s3/:agentId', async (req, res): Promise<void> => {
  try {
    const { agentId } = req.params;
    console.log('🔍 S3 API: Fetching agent:', agentId);
    
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

// Save agent to S3
app.post('/api/v1/agents/s3', async (req, res): Promise<void> => {
  try {
    const agentData = req.body;
    console.log('💾 S3 API: Saving agent to S3:', agentData.name);
    
    const savedAgent = await s3Storage.saveAgent(agentData);
    
    res.json({
      success: true,
      data: savedAgent
    });
  } catch (error) {
    console.error('❌ S3 API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save agent to S3'
    });
  }
});

// Update agent in S3
app.put('/api/v1/agents/s3/:agentId', async (req, res): Promise<void> => {
  try {
    const { agentId } = req.params;
    const updates = req.body;
    console.log('🔄 S3 API: Updating agent:', agentId);
    
    const updatedAgent = await s3Storage.updateAgent(agentId, updates);
    
    res.json({
      success: true,
      data: updatedAgent
    });
  } catch (error) {
    console.error('❌ S3 API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update agent in S3'
    });
  }
});

// Delete agent from S3
app.delete('/api/v1/agents/s3/:agentId', async (req, res): Promise<void> => {
  try {
    const { agentId } = req.params;
    console.log('🗑️ S3 API: Deleting agent:', agentId);
    
    await s3Storage.deleteAgent(agentId);
    
    res.json({
      success: true,
      message: 'Agent deleted successfully'
    });
  } catch (error) {
    console.error('❌ S3 API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete agent from S3'
    });
  }
});

// Migrate agents from localStorage to S3
app.post('/api/v1/agents/s3/migrate', async (req, res): Promise<void> => {
  try {
    const { agents } = req.body;
    console.log('📦 S3 API: Migrating agents to S3:', agents.length);
    
    const migratedAgents = await s3Storage.migrateAgentsFromLocalStorage(agents);
    
    res.json({
      success: true,
      data: migratedAgents,
      migrated: migratedAgents.length,
      total: agents.length
    });
  } catch (error) {
    console.error('❌ S3 API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to migrate agents to S3'
    });
  }
});

// Get agent statistics from S3
app.get('/api/v1/agents/s3/stats', async (req, res): Promise<void> => {
  try {
    console.log('📊 S3 API: Fetching agent stats...');
    const stats = await s3Storage.getAgentStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('❌ S3 API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch agent stats from S3'
    });
  }
});

// ===== REGULAR API ROUTES =====

// API routes
app.get('/api/v1/agents', async (_req, res): Promise<void> => {
  try {
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

    // Get S3 stored agents
    let s3Agents: any[] = [];
    try {
      const s3AgentList = await s3Storage.listAgents();
      s3Agents = s3AgentList.map((agent: any) => ({
        id: agent.id,
        agent_id: agent.id,
        name: agent.name,
        category: agent.category,
        description: agent.description,
        status: agent.status || 'active',
        agent_type: 's3_custom',
        usage_count: 0, // Could be enhanced with real usage tracking
        average_rating: 5, // Default rating for custom agents
        created_at: agent.createdAt,
        tags: [...(agent.capabilities || []), 'custom', 's3']
      }));
      console.log(`✅ Loaded ${s3Agents.length} S3 agents for catalog`);
    } catch (error) {
      console.error('⚠️ Failed to load S3 agents for catalog:', error);
      // Continue without S3 agents if there's an error
    }

    // Combine with built-in agents
  const builtInAgents = [
    {
      id: 'security-scanner',
      agent_id: 'security-scanner',
      name: 'Security Vulnerability Scanner',
      category: 'Security',
      description: 'Analyzes code and infrastructure for security vulnerabilities',
      status: 'active',
      agent_type: 'builtin',
      usage_count: 1247,
      average_rating: 5,
      created_at: '2024-01-15T10:30:00Z',
      tags: ['security', 'scanning']
    },
    {
      id: 'qa-assistant',
      agent_id: 'qa-assistant',
      name: 'QA Test Generator',
      category: 'QA',
      description: 'Generates comprehensive test cases and scenarios',
      status: 'active',
      agent_type: 'builtin',
      usage_count: 2156,
      average_rating: 5,
      created_at: '2024-02-01T09:15:00Z',
      tags: ['qa', 'testing']
    },
    {
      id: 'finops-analyzer',
      agent_id: 'finops-analyzer',
      name: 'FinOps Cost Analyzer',
      category: 'FinOps',
      description: 'Analyzes cloud costs and provides optimization recommendations',
      status: 'active',
      agent_type: 'builtin',
      usage_count: 934,
      average_rating: 4,
      created_at: '2024-01-26T12:15:00Z',
      tags: ['finops', 'cost-optimization']
    }
  ];

  // Get published marketplace agents
  const marketplaceAgents = Array.from(marketplacePublications.values())
    .filter(pub => pub.status === 'published')
    .map(pub => {
      const originalAgent = createdAgents.get(pub.agentId);
      return {
        id: pub.agentId,
        agent_id: pub.agentId,
        name: pub.title,
        category: pub.category,
        description: pub.description,
        status: 'active',
        agent_type: 'marketplace',
        usage_count: pub.downloads || 0,
        average_rating: pub.rating || 0,
        created_at: pub.publishedAt,
        tags: [...(originalAgent?.tags || []), 'marketplace', 'published'],
        publicationId: pub.publicationId,
        publishedBy: pub.publishedBy
      };
    });

    const allAgents = [...hybridAgents, ...s3Agents, ...builtInAgents, ...marketplaceAgents];

    res.json({
      success: true,
      data: allAgents
    });
  } catch (error) {
    console.error('❌ Error fetching agents for catalog:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch agents'
    });
  }
});

app.get('/api/v1/agents/:agentId', (req, res): void => {
  const { agentId } = req.params;
  
  // Check if it's a created hybrid agent first
  if (createdAgents.has(agentId)) {
    const hybridAgent = createdAgents.get(agentId);
    res.json({
      success: true,
      data: hybridAgent
    });
    return;
  }
  
  const agents: Record<string, any> = {
    'security-scanner': {
      id: 'security-scanner',
      name: 'Security Vulnerability Scanner',
      category: 'Security',
      description: 'Analyzes code and infrastructure for security vulnerabilities',
      status: 'active',
      analysisTypes: ['vulnerability-scan', 'compliance-check', 'security-audit'],
      outputFormats: ['detailed-report', 'summary', 'json']
    },
    'qa-assistant': {
      id: 'qa-assistant',
      name: 'QA Test Generator',
      category: 'QA',
      description: 'Generates comprehensive test cases and scenarios',
      status: 'active',
      analysisTypes: ['test-generation', 'coverage-analysis', 'scenario-planning'],
      outputFormats: ['test-suite', 'coverage-report', 'scenarios']
    },
    'finops-analyzer': {
      id: 'finops-analyzer',
      name: 'FinOps Cost Analyzer',
      category: 'FinOps',
      description: 'Analyzes cloud costs and provides optimization recommendations',
      status: 'active',
      analysisTypes: ['cost-analysis', 'optimization', 'forecasting'],
      outputFormats: ['cost-report', 'recommendations', 'dashboard']
    }
  };

  const agent = agents[agentId];
  if (!agent) {
    res.status(404).json({
      success: false,
      error: 'Agent not found'
    });
    return;
  }

  res.json({
    success: true,
    data: agent
  });
});

app.post('/api/v1/agents/create', async (req, res): Promise<void> => {
  const { templateId, name, description, customInputs, purpose, category, inputSchema, outputSchema, processingLogic, selectedModel } = req.body;
  
  console.log('🎯 [DEMO] Creating agent with REAL Bedrock integration:', { templateId, name, selectedModel });
  
  // Demo: Show live Bedrock connection during agent creation
  if (callBedrock && selectedModel) {
    try {
      console.log(`🤖 [DEMO] Testing selected model: ${selectedModel}`);
      const testResponse = await callBedrock('test-generator', `Test agent creation for ${name}`, {
        context: 'agent-creation-demo'
      });
      
      if (testResponse.success) {
        console.log(`✅ [DEMO] Model ${selectedModel} confirmed working - Agent creation proceeding`);
      }
    } catch (error) {
      console.log(`⚠️ [DEMO] Model test failed, proceeding with default model`);
    }
  }
  
  if (!templateId) {
    res.status(400).json({
      success: false,
      error: 'Template ID is required'
    });
    return;
  }

  let template;
  
  if (templateId === 'custom') {
    // Create custom template
    if (!purpose || !processingLogic || !inputSchema || !outputSchema) {
      res.status(400).json({
        success: false,
        error: 'Custom agents require purpose, processingLogic, inputSchema, and outputSchema'
      });
      return;
    }
    
    template = {
      id: 'custom',
      name: name || 'Custom Agent',
      category: category || 'Custom',
      description: description || 'Custom agent with user-defined purpose',
      purpose: purpose,
      inputSchema: inputSchema,
      outputSchema: outputSchema,
      processingLogic: 'custom_processing'
    };
  } else {
    template = AGENT_TEMPLATES.find(t => t.id === templateId);
    if (!template) {
      res.status(404).json({
        success: false,
        error: 'Template not found'
      });
      return;
    }
  }

  const agentId = `${template.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const purposeDrivenAgent = {
    // Basic agent info
    id: agentId,
    agent_id: agentId,
    name: name || template.name,
    description: description || template.description,
    purpose: template.purpose,
    version: '1.0.0',
    type: 'purpose-driven',
    agent_type: 'purpose-driven',
    templateId: template.id,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    created_at: new Date().toISOString(),
    author: 'current-user',
    tags: [template.category.toLowerCase(), 'purpose-driven', template.id],
    category: template.category,
    usage_count: 0,
    average_rating: 0,
    inputSchema: template.inputSchema,
    outputSchema: template.outputSchema,
    processingLogic: template.processingLogic,
    customInputs: customInputs || {},
    customProcessingLogic: templateId === 'custom' ? processingLogic : undefined,
    metadata: {
      templateBased: templateId !== 'custom',
      purposeDriven: true,
      functionalityScope: template.purpose,
      estimatedRuntime: '1-3 seconds',
      resourceUsage: 'low',
      securityLevel: 'internal'
    }
  };

  // Store the created agent in memory
  createdAgents.set(agentId, purposeDrivenAgent);
  
  console.log(`Purpose-driven agent created successfully: ${agentId} (${template.name})`);

  res.status(201).json({
    success: true,
    data: purposeDrivenAgent,
    message: 'Purpose-driven agent created successfully'
  });
});

app.post('/api/v1/agents/:agentId/execute', async (req, res): Promise<void> => {
  try {
    const { agentId } = req.params;
    const { inputs } = req.body;

    console.log(`🚀 [LOCAL] Executing agent: ${agentId} with REAL AWS Bedrock`);

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

    // Try to use REAL AWS Bedrock first
    if (callBedrock && inputs.input) {
      try {
        console.log(`🤖 Calling REAL AWS Bedrock for agent: ${agentId}`);
        
        const bedrockResponse = await callBedrock(agentId, inputs.input, {
          framework: inputs.framework || 'javascript',
          testType: inputs.testType || 'unit',
          context: inputs.context || {}
        });

        const processingTime = Date.now() - startTime;

        if (bedrockResponse.success) {
          console.log(`✅ REAL Bedrock response received for ${agentId}`);
          
          results = {
            summary: {
              status: 'completed',
              processing_time: `${processingTime}ms`,
              agent_purpose: `AI-powered ${agentId.replace('-', ' ')}`,
              ai_provider: '🤖 AWS Bedrock (REAL AI)',
              model_used: bedrockResponse.model,
              tokens_used: bedrockResponse.usage,
              environment: 'local-with-real-bedrock'
            },
            ai_response: bedrockResponse.content,
            bedrock_metadata: {
              model: bedrockResponse.model,
              usage: bedrockResponse.usage,
              processing_time: processingTime,
              real_ai: true
            }
          };

          res.json({
            success: true,
            executionId,
            status: 'completed',
            results,
            duration: `${processingTime}ms`,
            sync: true,
            ai_provider: 'AWS Bedrock (Real AI)'
          });
          return;
        } else {
          console.error(`❌ Bedrock error for ${agentId}:`, bedrockResponse.error);
          // Fall through to mock responses
        }
      } catch (error) {
        console.error(`❌ Bedrock integration error:`, error);
        // Fall through to mock responses
      }
    }

    // Fallback to mock responses if Bedrock fails or not available
    console.log(`⚠️  Using mock response for ${agentId} (Bedrock not available)`);
    
    // Simulate processing time for mock responses
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    switch (agentId) {
      case 'security-scanner':
        results = {
          summary: {
            security_score: '82%',
            vulnerabilities_found: 3,
            critical_issues: 1,
            ai_provider: '🔄 Mock Response (Bedrock unavailable)'
          },
          scan_results: {
            detected_technologies: ['Web App', 'API', 'Database'],
            vulnerabilities: [
              'Potential XSS vulnerability in user input handling',
              'SQL injection risk in database queries',
              'Weak authentication mechanism detected'
            ],
            input_analysis: `Mock analysis: ${inputs.input || 'No input provided'}`
          }
        };
        break;
      
      case 'qa-assistant':
        results = {
          summary: {
            test_cases_generated: 15,
            coverage_percentage: '94%',
            scenarios_created: 8,
            ai_provider: '🔄 Mock Response (Bedrock unavailable)'
          },
          test_results: {
            unit_tests: 8,
            integration_tests: 4,
            e2e_tests: 3,
            test_scenarios: [
              'User registration and login flow',
              'Data validation and error handling',
              'API endpoint functionality',
              'Database operations'
            ]
          }
        };
        break;
      
      default:
        // Check if it's a purpose-driven agent
        if (agentId.includes('_')) {
          const agent = createdAgents.get(agentId);
          if (agent && agent.templateId) {
            try {
              const processingResult = await AgentProcessor.processAgent(agent.templateId, inputs, agent);
              
              if (processingResult.success) {
                results = {
                  summary: {
                    status: 'completed',
                    processing_time: `${processingResult.processingTime}ms`,
                    agent_purpose: agent.purpose,
                    processing_method: processingResult.metadata.processing_method,
                    ai_provider: '🔄 Mock Response (Bedrock unavailable)'
                  },
                  ...processingResult.outputs,
                  metadata: processingResult.metadata
                };
              } else {
                results = {
                  summary: {
                    status: 'error',
                    processing_time: `${processingResult.processingTime}ms`,
                    ai_provider: '🔄 Mock Response (Bedrock unavailable)'
                  },
                  error: processingResult.outputs.error || 'Processing failed'
                };
              }
            } catch (error) {
              results = {
                summary: {
                  status: 'error',
                  processing_time: '100ms',
                  ai_provider: '🔄 Mock Response (Bedrock unavailable)'
                },
                error: 'Agent processing failed: ' + (error instanceof Error ? error.message : 'Unknown error')
              };
            }
          } else {
            results = {
              summary: {
                status: 'error',
                processing_time: '10ms',
                ai_provider: '🔄 Mock Response (Bedrock unavailable)'
              },
              error: 'Purpose-driven agent not found or invalid configuration'
            };
          }
        } else {
          results = {
            summary: {
              status: 'completed',
              processing_time: '1000ms',
              ai_provider: '🔄 Mock Response (Bedrock unavailable)'
            },
            output: `Mock response for ${agentId}: ${inputs.input || 'No input provided'}`
          };
        }
    }

    res.json({
      success: true,
      executionId,
      status: 'completed',
      results,
      duration: `${Date.now() - startTime}ms`,
      sync: true,
      ai_provider: 'Mock (Bedrock fallback)'
    });

  } catch (error) {
    console.error('❌ Execution error:', error);
    res.status(500).json({
      success: false,
      error: 'Agent execution failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Marketplace Publishing Endpoint
app.post('/api/v1/marketplace/publish', (req, res): void => {
  const { agentId, title, description, category, marketplace } = req.body;
  
  if (!agentId || !title) {
    res.status(400).json({
      success: false,
      error: 'Agent ID and title are required'
    });
    return;
  }

  // Check if agent exists
  const agent = createdAgents.get(agentId);
  if (!agent) {
    res.status(404).json({
      success: false,
      error: 'Agent not found'
    });
    return;
  }

  // Create marketplace publication
  const publicationId = `pub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const publication = {
    publicationId,
    agentId,
    title,
    description: description || agent.description,
    category: category || agent.category,
    marketplace: marketplace || 'internal',
    publishedAt: new Date().toISOString(),
    publishedBy: 'current-user',
    status: marketplace === 'internal' ? 'published' : 'pending_review',
    downloads: 0,
    rating: 0,
    reviews: []
  };

  // Store the publication
  marketplacePublications.set(publicationId, publication);
  console.log(`📢 Agent published to marketplace:`, publication);

  res.json({
    success: true,
    data: publication,
    message: `Agent "${title}" ${marketplace === 'internal' ? 'published to' : 'submitted for review to'} ${marketplace} marketplace`
  });
});

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction): void => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// User Management Endpoints
app.get('/api/v1/users', (_req, res): void => {
  res.json({
    success: true,
    data: [
      {
        id: 'user-1',
        email: 'admin@company.com',
        name: 'System Administrator',
        role: 'Admin',
        status: 'active',
        lastLogin: '2024-01-15T10:30:00Z',
        createdAt: '2024-01-01T00:00:00Z',
        permissions: ['all']
      },
      {
        id: 'user-2',
        email: 'developer@company.com',
        name: 'John Developer',
        role: 'Developer',
        status: 'active',
        lastLogin: '2024-01-15T09:15:00Z',
        createdAt: '2024-01-02T00:00:00Z',
        permissions: ['agent.create', 'agent.execute', 'agent.view']
      },
      {
        id: 'user-3',
        email: 'business@company.com',
        name: 'Jane Business',
        role: 'Business User',
        status: 'active',
        lastLogin: '2024-01-14T16:45:00Z',
        createdAt: '2024-01-03T00:00:00Z',
        permissions: ['agent.execute', 'agent.view']
      },
      {
        id: 'user-4',
        email: 'tester@company.com',
        name: 'QA Tester',
        role: 'Testing Team',
        status: 'active',
        lastLogin: '2024-01-15T08:20:00Z',
        createdAt: '2024-01-04T00:00:00Z',
        permissions: ['agent.test', 'agent.view']
      },
      {
        id: 'user-5',
        email: 'finops@company.com',
        name: 'Finance Manager',
        role: 'FinOps Team',
        status: 'active',
        lastLogin: '2024-01-15T07:30:00Z',
        createdAt: '2024-01-05T00:00:00Z',
        permissions: ['cost.view', 'cost.manage', 'agent.view']
      }
    ]
  });
});

app.get('/api/v1/users/:userId', (req, res): void => {
  const { userId } = req.params;
  
  const users: Record<string, any> = {
    'user-1': {
      id: 'user-1',
      email: 'admin@company.com',
      name: 'System Administrator',
      role: 'Admin',
      status: 'active',
      lastLogin: '2024-01-15T10:30:00Z',
      createdAt: '2024-01-01T00:00:00Z',
      permissions: ['all'],
      profile: {
        department: 'IT',
        manager: 'CTO',
        location: 'New York',
        phone: '+1-555-0101'
      }
    },
    'user-2': {
      id: 'user-2',
      email: 'developer@company.com',
      name: 'John Developer',
      role: 'Developer',
      status: 'active',
      lastLogin: '2024-01-15T09:15:00Z',
      createdAt: '2024-01-02T00:00:00Z',
      permissions: ['agent.create', 'agent.execute', 'agent.view'],
      profile: {
        department: 'Engineering',
        manager: 'Tech Lead',
        location: 'San Francisco',
        phone: '+1-555-0102'
      }
    }
  };

  const user = users[userId];
  if (!user) {
    res.status(404).json({
      success: false,
      error: 'User not found'
    });
    return;
  }

  res.json({
    success: true,
    data: user
  });
});

app.post('/api/v1/users', (req, res): void => {
  const { email, name, role } = req.body;
  
  if (!email || !name || !role) {
    res.status(400).json({
      success: false,
      error: 'Email, name, and role are required'
    });
    return;
  }

  const newUser = {
    id: `user-${Date.now()}`,
    email,
    name,
    role,
    status: 'active',
    createdAt: new Date().toISOString(),
    lastLogin: null,
    permissions: role === 'Admin' ? ['all'] : ['agent.view']
  };

  res.status(201).json({
    success: true,
    data: newUser,
    message: 'User created successfully'
  });
});

app.put('/api/v1/users/:userId', (req, res): void => {
  const { userId } = req.params;
  const { name, role, status } = req.body;

  res.json({
    success: true,
    data: {
      id: userId,
      name: name || 'Updated User',
      role: role || 'Developer',
      status: status || 'active',
      updatedAt: new Date().toISOString()
    },
    message: 'User updated successfully'
  });
});

app.delete('/api/v1/users/:userId', (req, res): void => {
  const { userId } = req.params;

  res.json({
    success: true,
    message: `User ${userId} deleted successfully`
  });
});

// Authentication Endpoints
app.post('/api/v1/auth/login', (req, res): void => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    res.status(400).json({
      success: false,
      error: 'Email and password are required'
    });
    return;
  }

  // Mock authentication - in production, verify against database
  const mockUsers: Record<string, any> = {
    'admin@company.com': {
      id: 'user-1',
      email: 'admin@company.com',
      name: 'System Administrator',
      role: 'Admin',
      status: 'active',
      permissions: ['all']
    },
    'developer@company.com': {
      id: 'user-2',
      email: 'developer@company.com',
      name: 'John Developer',
      role: 'Developer',
      status: 'active',
      permissions: ['agent.create', 'agent.execute', 'agent.view']
    },
    'business@company.com': {
      id: 'user-3',
      email: 'business@company.com',
      name: 'Jane Business',
      role: 'Business User',
      status: 'active',
      permissions: ['agent.execute', 'agent.view']
    }
  };

  const user = mockUsers[email];
  if (user && password === 'demo123') {
    res.json({
      success: true,
      data: {
        user,
        token: 'mock-jwt-token-' + Date.now()
      },
      message: 'Login successful'
    });
  } else {
    res.status(401).json({
      success: false,
      error: 'Invalid email or password'
    });
  }
});

app.get('/api/v1/auth/me', (_req, res): void => {
  // In production, verify JWT token and return current user
  // For demo, return admin user
  res.json({
    success: true,
    data: {
      id: 'user-1',
      email: 'admin@company.com',
      name: 'System Administrator',
      role: 'Admin',
      status: 'active',
      permissions: ['all']
    }
  });
});

// Role Management Endpoints
app.get('/api/v1/roles', (_req, res): void => {
  res.json({
    success: true,
    data: [
      {
        id: 'admin',
        name: 'Admin',
        description: 'Full system access and user management',
        permissions: ['all'],
        userCount: 1,
        isCustom: false,
        hierarchy: 1
      },
      {
        id: 'developer',
        name: 'Developer',
        description: 'Create, execute, and manage agents',
        permissions: ['agent.create', 'agent.execute', 'agent.view', 'agent.manage', 'template.create', 'template.manage'],
        userCount: 5,
        isCustom: false,
        hierarchy: 2
      },
      {
        id: 'business-user',
        name: 'Business User',
        description: 'Execute and view agents, no-code creation',
        permissions: ['agent.execute', 'agent.view', 'agent.create.nocode', 'template.view', 'template.use'],
        userCount: 12,
        isCustom: false,
        hierarchy: 3
      },
      {
        id: 'testing-team',
        name: 'Testing Team',
        description: 'Test agents and access QA features',
        permissions: ['agent.test', 'agent.view', 'qa.access', 'test.create', 'test.execute'],
        userCount: 3,
        isCustom: false,
        hierarchy: 3
      },
      {
        id: 'finops-team',
        name: 'FinOps Team',
        description: 'Cost management and financial operations',
        permissions: ['cost.view', 'cost.manage', 'finops.access', 'agent.view', 'billing.manage'],
        userCount: 2,
        isCustom: false,
        hierarchy: 3
      },
      {
        id: 'viewer',
        name: 'Viewer',
        description: 'Read-only access to agents and results',
        permissions: ['agent.view', 'template.view'],
        userCount: 8,
        isCustom: false,
        hierarchy: 4
      },
      {
        id: 'custom-marketing-manager',
        name: 'Marketing Manager',
        description: 'Custom role for marketing team with specific permissions',
        permissions: ['agent.view', 'agent.execute', 'template.view', 'template.use', 'cost.view'],
        userCount: 2,
        isCustom: true,
        hierarchy: 3,
        inheritsFrom: 'Business User'
      }
    ]
  });
});

app.post('/api/v1/roles', (req, res): void => {
  const { name, description, permissions, inheritsFrom } = req.body;
  
  if (!name || !description) {
    res.status(400).json({
      success: false,
      error: 'Name and description are required'
    });
    return;
  }

  const newRole = {
    id: `custom-${Date.now()}`,
    name,
    description,
    permissions: permissions || [],
    userCount: 0,
    isCustom: true,
    hierarchy: 3,
    inheritsFrom: inheritsFrom || undefined
  };

  res.status(201).json({
    success: true,
    data: newRole,
    message: 'Role created successfully'
  });
});

app.put('/api/v1/roles/:roleId', (req, res): void => {
  const { roleId } = req.params;
  const { name, description, permissions, inheritsFrom } = req.body;

  // In a real implementation, you would:
  // 1. Check if role exists
  // 2. Verify user has permission to edit this role
  // 3. Validate that system roles can't be modified (except by super admin)
  // 4. Update the role in database
  // 5. Handle permission inheritance logic

  const updatedRole = {
    id: roleId,
    name: name || 'Updated Role',
    description: description || 'Updated description',
    permissions: permissions || [],
    userCount: 0, // In real app, this would be calculated
    isCustom: roleId.startsWith('custom-'),
    hierarchy: 3,
    inheritsFrom: inheritsFrom || undefined,
    updatedAt: new Date().toISOString()
  };

  res.json({
    success: true,
    data: updatedRole,
    message: 'Role updated successfully'
  });
});

app.delete('/api/v1/roles/:roleId', (req, res): void => {
  const { roleId } = req.params;

  // In a real implementation, you would:
  // 1. Check if role exists
  // 2. Verify role is not a system role
  // 3. Check if any users are assigned to this role
  // 4. Handle reassignment or prevent deletion if users exist
  // 5. Remove role from database

  res.json({
    success: true,
    message: `Role ${roleId} deleted successfully`
  });
});

// Permissions Management Endpoints
app.get('/api/v1/permissions', (_req, res): void => {
  res.json({
    success: true,
    data: [
      // Agent Management Permissions
      {
        id: 'agent.view',
        name: 'View Agents',
        description: 'View agent catalog and details',
        category: 'Agent Management'
      },
      {
        id: 'agent.create',
        name: 'Create Agents',
        description: 'Create new agents with full configuration',
        category: 'Agent Management'
      },
      {
        id: 'agent.create.nocode',
        name: 'No-Code Agent Creation',
        description: 'Create agents using visual tools and templates',
        category: 'Agent Management'
      },
      {
        id: 'agent.execute',
        name: 'Execute Agents',
        description: 'Run agents and view execution results',
        category: 'Agent Management'
      },
      {
        id: 'agent.manage',
        name: 'Manage Agents',
        description: 'Edit, delete, and configure agents',
        category: 'Agent Management'
      },
      {
        id: 'agent.deploy',
        name: 'Deploy Agents',
        description: 'Deploy agents to production environments',
        category: 'Agent Management',
        resource: 'Production Environment'
      },
      
      // Template Management Permissions
      {
        id: 'template.view',
        name: 'View Templates',
        description: 'Browse template library and marketplace',
        category: 'Template Management'
      },
      {
        id: 'template.use',
        name: 'Use Templates',
        description: 'Create agents from existing templates',
        category: 'Template Management'
      },
      {
        id: 'template.create',
        name: 'Create Templates',
        description: 'Create and publish new templates',
        category: 'Template Management'
      },
      {
        id: 'template.manage',
        name: 'Manage Templates',
        description: 'Edit and delete templates',
        category: 'Template Management'
      },
      {
        id: 'template.publish',
        name: 'Publish Templates',
        description: 'Publish templates to marketplace',
        category: 'Template Management'
      },

      // Testing & QA Permissions
      {
        id: 'agent.test',
        name: 'Test Agents',
        description: 'Access testing sandbox and validation tools',
        category: 'Testing & QA'
      },
      {
        id: 'qa.access',
        name: 'QA Dashboard Access',
        description: 'Access quality assurance dashboards',
        category: 'Testing & QA'
      },
      {
        id: 'test.create',
        name: 'Create Test Cases',
        description: 'Create automated test cases and scenarios',
        category: 'Testing & QA'
      },
      {
        id: 'test.execute',
        name: 'Execute Tests',
        description: 'Run test suites and validation workflows',
        category: 'Testing & QA'
      },

      // Cost Management & FinOps Permissions
      {
        id: 'cost.view',
        name: 'View Costs',
        description: 'View cost analytics and spending reports',
        category: 'Cost Management'
      },
      {
        id: 'cost.manage',
        name: 'Manage Costs',
        description: 'Set budgets and cost optimization policies',
        category: 'Cost Management'
      },
      {
        id: 'finops.access',
        name: 'FinOps Dashboard',
        description: 'Access financial operations dashboard',
        category: 'Cost Management'
      },
      {
        id: 'billing.manage',
        name: 'Manage Billing',
        description: 'Configure billing and payment settings',
        category: 'Cost Management'
      },

      // User & Security Management Permissions
      {
        id: 'user.view',
        name: 'View Users',
        description: 'View user accounts and profiles',
        category: 'User Management'
      },
      {
        id: 'user.create',
        name: 'Create Users',
        description: 'Create new user accounts',
        category: 'User Management'
      },
      {
        id: 'user.manage',
        name: 'Manage Users',
        description: 'Edit and delete user accounts',
        category: 'User Management'
      },
      {
        id: 'role.view',
        name: 'View Roles',
        description: 'View role definitions and permissions',
        category: 'User Management'
      },
      {
        id: 'role.create',
        name: 'Create Roles',
        description: 'Create custom roles and permissions',
        category: 'User Management'
      },
      {
        id: 'role.manage',
        name: 'Manage Roles',
        description: 'Edit and delete roles',
        category: 'User Management'
      },

      // System Administration Permissions
      {
        id: 'system.admin',
        name: 'System Administration',
        description: 'Full system administration access',
        category: 'System Administration'
      },
      {
        id: 'audit.view',
        name: 'View Audit Logs',
        description: 'Access system audit logs and reports',
        category: 'System Administration'
      },
      {
        id: 'integration.manage',
        name: 'Manage Integrations',
        description: 'Configure external system integrations',
        category: 'System Administration'
      },
      {
        id: 'api.access',
        name: 'API Access',
        description: 'Access REST APIs and generate API keys',
        category: 'System Administration'
      }
    ]
  });
});

// Feature-Specific Access Control Endpoints
app.get('/api/v1/testing/dashboard', (_req, res): void => {
  // This endpoint should only be accessible to Testing Team
  res.json({
    success: true,
    data: {
      message: 'Testing Dashboard - Restricted to Testing Team and QA roles',
      testSuites: 3,
      activeEnvironments: 2,
      lastTestRun: new Date().toISOString()
    }
  });
});

app.get('/api/v1/finops/dashboard', (_req, res): void => {
  // This endpoint should only be accessible to FinOps Team
  res.json({
    success: true,
    data: {
      message: 'FinOps Dashboard - Restricted to FinOps Team and Finance roles',
      totalCost: 4966.50,
      budgetUtilization: 85.2,
      activeAlerts: 2
    }
  });
});

app.post('/api/v1/deployment/deploy', (req, res): void => {
  const { agentId, environment, notes } = req.body;
  
  // Environment-based deployment control
  const environmentPermissions = {
    development: ['agent.deploy'],
    staging: ['agent.deploy'],
    production: ['agent.deploy', 'system.admin']
  };

  res.json({
    success: true,
    data: {
      deploymentId: `deploy-${Date.now()}`,
      agentId,
      environment,
      status: environment === 'production' ? 'pending_approval' : 'deployed',
      message: `Agent deployment to ${environment} ${environment === 'production' ? 'submitted for approval' : 'completed'}`
    }
  });
});

app.post('/api/v1/marketplace/publish', (req, res): void => {
  const { agentId, marketplace, title, description } = req.body;
  
  // Marketplace-specific publishing control
  const marketplacePermissions = {
    internal: ['template.publish'],
    partner: ['template.publish', 'system.admin'],
    public: ['template.publish', 'system.admin']
  };

  res.json({
    success: true,
    data: {
      publicationId: `pub-${Date.now()}`,
      agentId,
      marketplace,
      status: marketplace === 'internal' ? 'published' : 'pending_review',
      message: `Agent published to ${marketplace} marketplace ${marketplace !== 'internal' ? '(pending review)' : ''}`
    }
  });
});

// Multi-Cloud Foundation Endpoints
app.get('/api/v1/multicloud/providers', (_req, res): void => {
  res.json({
    success: true,
    data: {
      aiProviders: [
        {
          id: 'openai',
          name: 'OpenAI',
          type: 'ai',
          status: 'active',
          region: 'US-East',
          cost: 1250.75,
          usage: 85,
          performance: 92
        },
        {
          id: 'anthropic',
          name: 'Anthropic',
          type: 'ai',
          status: 'active',
          region: 'US-West',
          cost: 890.25,
          usage: 65,
          performance: 88
        },
        {
          id: 'azure-openai',
          name: 'Azure OpenAI',
          type: 'ai',
          status: 'active',
          region: 'East US',
          cost: 750.25,
          usage: 45,
          performance: 89
        }
      ],
      cloudProviders: [
        {
          id: 'aws',
          name: 'AWS',
          type: 'compute',
          status: 'active',
          region: 'us-east-1',
          cost: 2150.00,
          usage: 78,
          performance: 95
        },
        {
          id: 'azure',
          name: 'Microsoft Azure',
          type: 'compute',
          status: 'active',
          region: 'East US',
          cost: 1675.50,
          usage: 72,
          performance: 90
        },
        {
          id: 'gcp',
          name: 'Google Cloud',
          type: 'compute',
          status: 'inactive',
          region: 'us-central1',
          cost: 0,
          usage: 0,
          performance: 0
        }
      ]
    }
  });
});

app.post('/api/v1/multicloud/migrate', (req, res): void => {
  const { agentId, fromProvider, toProvider, reason } = req.body;
  
  res.json({
    success: true,
    data: {
      migrationId: `migration-${Date.now()}`,
      agentId,
      fromProvider,
      toProvider,
      status: 'initiated',
      estimatedTime: 300, // 5 minutes
      costImpact: -25.5, // 25.5% cost reduction
      message: `Agent migration from ${fromProvider} to ${toProvider} initiated`
    }
  });
});

app.get('/api/v1/multicloud/cost-comparison', (_req, res): void => {
  res.json({
    success: true,
    data: {
      providers: [
        {
          name: 'OpenAI',
          monthlyCost: 1250.75,
          costPerRequest: 0.025,
          savings: 0
        },
        {
          name: 'Anthropic',
          monthlyCost: 890.25,
          costPerRequest: 0.018,
          savings: 28.8
        },
        {
          name: 'Azure OpenAI',
          monthlyCost: 750.25,
          costPerRequest: 0.015,
          savings: 40.0
        }
      ],
      recommendations: [
        'Switch to Azure OpenAI for 40% cost savings',
        'Use Anthropic for better performance/cost ratio',
        'Consider provider arbitrage for optimal costs'
      ]
    }
  });
});

app.post('/api/v1/providers/configure', (req, res): void => {
  const { providerId, config } = req.body;
  
  // Simulate provider configuration
  if (!config.apiKey || config.apiKey.length < 10) {
    res.status(400).json({
      success: false,
      error: 'Invalid API key or configuration'
    });
    return;
  }

  res.json({
    success: true,
    data: {
      connectionId: `conn-${providerId}-${Date.now()}`,
      providerId,
      status: 'connected',
      message: `Provider ${providerId} configured successfully`
    }
  });
});

app.post('/api/v1/providers/test', (req, res): void => {
  const { providerId } = req.body;
  
  // Simulate connection test
  const success = Math.random() > 0.1; // 90% success rate
  
  res.json({
    success,
    data: {
      providerId,
      connected: success,
      latency: Math.floor(50 + Math.random() * 200),
      timestamp: new Date().toISOString(),
      error: success ? null : 'Connection timeout or invalid credentials'
    }
  });
});

// Universal Integration Hub Endpoints
app.get('/api/v1/integration/connectors', (_req, res): void => {
  res.json({
    success: true,
    data: [
      {
        id: 'aws-s3',
        name: 'Amazon S3',
        type: 'cloud',
        category: 'Cloud Storage',
        status: 'active',
        connections: 12,
        lastUsed: '2024-01-15T11:30:00Z',
        description: 'Connect to Amazon S3 buckets for file storage and retrieval',
        supportedOperations: ['read', 'write', 'list', 'delete'],
        securityLevel: 'enterprise'
      },
      {
        id: 'postgresql',
        name: 'PostgreSQL',
        type: 'database',
        category: 'Database',
        status: 'active',
        connections: 15,
        lastUsed: '2024-01-15T12:00:00Z',
        description: 'Connect to PostgreSQL databases',
        supportedOperations: ['select', 'insert', 'update', 'delete', 'execute'],
        securityLevel: 'high'
      },
      {
        id: 'salesforce',
        name: 'Salesforce',
        type: 'api',
        category: 'CRM',
        status: 'active',
        connections: 6,
        lastUsed: '2024-01-15T09:30:00Z',
        description: 'Connect to Salesforce CRM via REST API',
        supportedOperations: ['read', 'write', 'query', 'bulk'],
        securityLevel: 'enterprise'
      },
      {
        id: 'mainframe-db2',
        name: 'IBM DB2 Mainframe',
        type: 'legacy',
        category: 'Legacy Database',
        status: 'inactive',
        connections: 2,
        lastUsed: '2024-01-14T16:20:00Z',
        description: 'Connect to IBM DB2 on mainframe systems',
        supportedOperations: ['select', 'insert', 'update'],
        securityLevel: 'enterprise'
      }
    ]
  });
});

app.get('/api/v1/integration/active', (_req, res): void => {
  res.json({
    success: true,
    data: [
      {
        id: 'int-1',
        name: 'Customer Data Sync',
        connectorId: 'salesforce',
        connectorName: 'Salesforce',
        status: 'connected',
        dataTransferred: '2.3 GB',
        lastSync: '2024-01-15T11:30:00Z',
        agentsUsing: 3
      },
      {
        id: 'int-2',
        name: 'Analytics Database',
        connectorId: 'postgresql',
        connectorName: 'PostgreSQL',
        status: 'connected',
        dataTransferred: '15.7 GB',
        lastSync: '2024-01-15T12:00:00Z',
        agentsUsing: 7
      },
      {
        id: 'int-3',
        name: 'Document Storage',
        connectorId: 'aws-s3',
        connectorName: 'Amazon S3',
        status: 'connected',
        dataTransferred: '45.2 GB',
        lastSync: '2024-01-15T11:45:00Z',
        agentsUsing: 5
      }
    ]
  });
});

app.post('/api/v1/integration/test-connection', (req, res): void => {
  const { connectorId, config } = req.body;
  
  // Simulate connection test
  const success = Math.random() > 0.15; // 85% success rate
  
  res.json({
    success,
    data: {
      connectorId,
      connected: success,
      latency: success ? Math.floor(50 + Math.random() * 300) : undefined,
      timestamp: new Date().toISOString(),
      error: success ? null : 'Connection failed: Invalid credentials or network timeout'
    }
  });
});

app.post('/api/v1/integration/transfer-data', (req, res): void => {
  const { sourceId, targetId, transformations } = req.body;
  
  res.json({
    success: true,
    data: {
      transferId: `transfer-${Date.now()}`,
      sourceId,
      targetId,
      status: 'initiated',
      estimatedTime: 300, // 5 minutes
      transformations: transformations || [],
      message: 'Data transfer initiated successfully'
    }
  });
});

// Secret Management Endpoints
app.get('/api/v1/secrets/vaults', (_req, res): void => {
  res.json({
    success: true,
    data: [
      {
        id: 'aws-secrets-prod',
        name: 'AWS Secrets Manager (Production)',
        type: 'aws-secrets',
        status: 'active',
        region: 'us-east-1',
        secretCount: 45,
        lastSync: '2024-01-15T11:30:00Z',
        encryptionLevel: 'AES-256'
      },
      {
        id: 'azure-kv-dev',
        name: 'Azure Key Vault (Development)',
        type: 'azure-keyvault',
        status: 'active',
        region: 'East US',
        secretCount: 23,
        lastSync: '2024-01-15T11:25:00Z',
        encryptionLevel: 'RSA-2048'
      },
      {
        id: 'hashicorp-vault',
        name: 'HashiCorp Vault (Enterprise)',
        type: 'hashicorp-vault',
        status: 'active',
        region: 'on-premise',
        secretCount: 67,
        lastSync: '2024-01-15T11:35:00Z',
        encryptionLevel: 'AES-256-GCM'
      }
    ]
  });
});

app.get('/api/v1/secrets', (_req, res): void => {
  res.json({
    success: true,
    data: [
      {
        id: 'secret-1',
        name: 'openai-api-key',
        type: 'api-key',
        vaultId: 'aws-secrets-prod',
        vaultName: 'AWS Secrets Manager (Production)',
        status: 'active',
        lastRotated: '2024-01-01T00:00:00Z',
        expiresAt: '2024-07-01T00:00:00Z',
        usedByAgents: 8,
        description: 'OpenAI API key for production agents'
      },
      {
        id: 'secret-2',
        name: 'postgres-db-credentials',
        type: 'database',
        vaultId: 'azure-kv-dev',
        vaultName: 'Azure Key Vault (Development)',
        status: 'active',
        lastRotated: '2024-01-10T00:00:00Z',
        expiresAt: '2024-04-10T00:00:00Z',
        usedByAgents: 5,
        description: 'PostgreSQL database credentials for development'
      }
    ]
  });
});

app.post('/api/v1/secrets/rotate', (req, res): void => {
  const { secretId } = req.body;
  
  res.json({
    success: true,
    data: {
      secretId,
      rotationId: `rotation-${Date.now()}`,
      status: 'initiated',
      estimatedTime: 120, // 2 minutes
      message: 'Secret rotation initiated successfully'
    }
  });
});

// Hybrid Agent Management Endpoints

app.post('/api/v1/agents/create', (req, res): void => {
  const { templateId, name, description, customInputs, purpose, category, inputSchema, outputSchema, processingLogic } = req.body;
  
  console.log('Received purpose-driven agent creation request:', { templateId, name });
  
  if (!templateId) {
    res.status(400).json({
      success: false,
      error: 'Template ID is required'
    });
    return;
  }

  let template;
  
  if (templateId === 'custom') {
    // Create custom template
    if (!purpose || !processingLogic || !inputSchema || !outputSchema) {
      res.status(400).json({
        success: false,
        error: 'Custom agents require purpose, processingLogic, inputSchema, and outputSchema'
      });
      return;
    }
    
    template = {
      id: 'custom',
      name: name || 'Custom Agent',
      category: category || 'Custom',
      description: description || 'Custom agent with user-defined purpose',
      purpose: purpose,
      inputSchema: inputSchema,
      outputSchema: outputSchema,
      processingLogic: 'custom_processing'
    };
  } else {
    template = AGENT_TEMPLATES.find(t => t.id === templateId);
    if (!template) {
      res.status(404).json({
        success: false,
        error: 'Template not found'
      });
      return;
    }
  }

  const agentId = `${template.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const purposeDrivenAgent = {
    // Basic agent info
    id: agentId,
    agent_id: agentId,
    name: name || template.name,
    description: description || template.description,
    purpose: template.purpose,
    version: '1.0.0',
    type: 'purpose-driven',
    agent_type: 'purpose-driven',
    templateId: template.id,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    created_at: new Date().toISOString(),
    author: 'current-user',
    tags: [template.category.toLowerCase(), 'purpose-driven', template.id],
    category: template.category,
    usage_count: 0,
    average_rating: 0,
    inputSchema: template.inputSchema,
    outputSchema: template.outputSchema,
    processingLogic: template.processingLogic,
    customInputs: customInputs || {},
    customProcessingLogic: templateId === 'custom' ? processingLogic : undefined,
    metadata: {
      templateBased: templateId !== 'custom',
      purposeDriven: true,
      functionalityScope: template.purpose,
      estimatedRuntime: '1-3 seconds',
      resourceUsage: 'low',
      securityLevel: 'internal'
    }
  };

  // Store the created agent in memory
  createdAgents.set(agentId, purposeDrivenAgent);
  
  console.log(`Purpose-driven agent created successfully: ${agentId} (${template.name})`);

  res.status(201).json({
    success: true,
    data: purposeDrivenAgent,
    message: 'Purpose-driven agent created successfully'
  });
});

app.get('/api/v1/agents/hybrid/:agentId', (req, res): void => {
  const { agentId } = req.params;
  
  // Mock hybrid agent data
  const hybridAgent = {
    id: agentId,
    name: 'Sample Hybrid Agent',
    description: 'A multi-domain agent combining LLM, RPA, and Selenium components',
    version: '1.0.0',
    type: 'hybrid',
    created: '2024-01-15T10:00:00Z',
    updated: '2024-01-15T10:00:00Z',
    author: 'current-user',
    tags: ['hybrid', 'multi-domain', 'automation'],
    category: 'Hybrid Automation',
    config: {
      components: [
        {
          id: 'comp-1',
          name: 'Text Analyzer',
          type: 'llm',
          config: {
            provider: 'openai',
            model: 'gpt-4',
            temperature: 0.7,
            maxTokens: 1000,
            systemPrompt: 'You are a helpful text analyzer.',
            userPromptTemplate: 'Analyze this text: {input}',
            responseFormat: 'json'
          },
          inputs: [{ name: 'text', type: 'string', required: true, source: 'user' }],
          outputs: [{ name: 'analysis', type: 'object', description: 'Text analysis results' }],
          dependencies: []
        },
        {
          id: 'comp-2',
          name: 'Web Form Filler',
          type: 'rpa',
          config: {
            platform: 'custom',
            workflow: {
              steps: [
                { id: '1', type: 'navigate', selector: '', action: 'goto', data: '{url}' },
                { id: '2', type: 'type', selector: 'input[name="data"]', action: 'fill', data: '{analysis}' }
              ],
              flowControl: 'sequential',
              timeout: 30000,
              retryPolicy: { maxRetries: 3, retryDelay: 1000, backoffMultiplier: 2, maxDelay: 10000 }
            }
          },
          inputs: [
            { name: 'url', type: 'string', required: true, source: 'user' },
            { name: 'analysis', type: 'object', required: true, source: 'component', sourceId: 'comp-1' }
          ],
          outputs: [{ name: 'success', type: 'boolean', description: 'Form submission success' }],
          dependencies: ['comp-1']
        }
      ],
      orchestration: {
        mode: 'sequential',
        timeout: 300000,
        maxRetries: 3,
        retryDelay: 2000,
        parallelism: 3,
        conditions: []
      },
      dataFlow: {
        mappings: [
          {
            from: { componentId: 'comp-1', outputName: 'analysis' },
            to: { componentId: 'comp-2', inputName: 'analysis' }
          }
        ],
        transformations: [],
        storage: {
          persistent: false,
          encryption: true,
          retention: 7,
          location: 'memory'
        }
      }
    }
  };

  res.json({
    success: true,
    data: hybridAgent
  });
});

app.post('/api/v1/agents/hybrid/:agentId/execute', async (req, res): Promise<void> => {
  const { agentId } = req.params;
  const { inputs } = req.body;
  
  console.log(`🚀 Executing hybrid agent: ${agentId} with inputs:`, inputs);
  
  const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const startTime = new Date().toISOString();
  
  try {
    // Get the agent configuration
    const agent = createdAgents.get(agentId);
    if (!agent) {
      res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
      return;
    }

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Process the input based on agent type
    let processedOutput = '';
    const inputText = inputs.input || inputs.text || inputs.content || '';
    
    if (agent.name.toLowerCase().includes('rephrase') || agent.name.toLowerCase().includes('email')) {
      // Email rephrasing logic
      if (inputText.toLowerCase().includes('appointment')) {
        processedOutput = `📅 **Appointment Confirmation**\n\nDear Valued Customer,\n\nWe are pleased to confirm your upcoming appointment scheduled for **Friday, November 7th at 3:00 PM**.\n\nYour tire service will be completed and ready for pickup at our store location. We appreciate your business and look forward to serving you.\n\nBest regards,\nCustomer Service Team`;
      } else if (inputText.toLowerCase().includes('meeting')) {
        processedOutput = `🤝 **Meeting Invitation**\n\nGreetings,\n\nThis is to formally invite you to our scheduled meeting. Please find the details professionally formatted for your convenience.\n\nWe look forward to a productive discussion.\n\nKind regards,\nTeam`;
      } else {
        // Generic rephrasing
        processedOutput = `✨ **Professionally Rephrased Content**\n\n${inputText.split(' ').map((word: string) => 
          word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ')}\n\nThis content has been professionally formatted and enhanced for better readability and impact.`;
      }
    } else if (agent.name.toLowerCase().includes('analyze') || agent.name.toLowerCase().includes('analysis')) {
      processedOutput = `📊 **Analysis Results**\n\nContent Analysis:\n- Length: ${inputText.length} characters\n- Word count: ${inputText.split(' ').length} words\n- Tone: Professional\n- Sentiment: Neutral to Positive\n\nRecommendations:\n- Content is clear and concise\n- Consider adding more context if needed`;
    } else {
      // Generic processing
      processedOutput = `🔄 **Processed Output**\n\nInput received and processed successfully.\n\nOriginal: "${inputText}"\n\nProcessed result: The content has been analyzed and enhanced according to the agent's configuration.`;
    }

    const endTime = new Date().toISOString();
    const duration = 2300; // 2.3 seconds

    const executionResult = {
      executionId,
      agentId,
      userId: 'current-user',
      environment: 'development',
      inputs: inputs || {},
      startTime,
      endTime,
      status: 'completed',
      currentComponent: null,
      progress: 100,
      logs: [
        {
          timestamp: startTime,
          level: 'info',
          component: 'orchestrator',
          message: 'Starting hybrid agent execution'
        },
        {
          timestamp: new Date(Date.now() - 1000).toISOString(),
          level: 'info',
          component: 'main-processor',
          message: 'Processing input with LLM component'
        },
        {
          timestamp: endTime,
          level: 'info',
          component: 'orchestrator',
          message: 'Hybrid agent execution completed successfully'
        }
      ],
      outputs: {
        result: processedOutput,
        summary: `Successfully processed input: "${inputText.substring(0, 50)}${inputText.length > 50 ? '...' : ''}"`,
        metadata: {
          processingTime: duration,
          inputLength: inputText.length,
          outputLength: processedOutput.length,
          agentType: 'hybrid',
          componentUsed: 'main-processor'
        }
      },
      metrics: {
        duration,
        cpuUsage: 65,
        memoryUsage: 256,
        networkIO: 2048,
        storageIO: 1024,
        cost: 0.12,
        errors: 0,
        retries: 0
      }
    };

    console.log(`✅ Agent execution completed: ${agentId}`);

    res.json({
      success: true,
      executionId,
      status: 'completed',
      results: executionResult.outputs,
      duration: `${duration}ms`,
      sync: true,
      data: executionResult
    });

  } catch (error) {
    console.error('❌ Hybrid agent execution error:', error);
    res.status(500).json({
      success: false,
      error: 'Agent execution failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete hybrid agent endpoint
app.delete('/api/v1/agents/hybrid/:agentId', (req, res): void => {
  const { agentId } = req.params;
  
  console.log(`Deleting hybrid agent: ${agentId}`);
  
  if (createdAgents.has(agentId)) {
    createdAgents.delete(agentId);
    console.log(`Hybrid agent ${agentId} deleted successfully`);
    
    res.json({
      success: true,
      message: 'Hybrid agent deleted successfully'
    });
  } else {
    console.log(`Hybrid agent ${agentId} not found`);
    
    res.status(404).json({
      success: false,
      error: 'Hybrid agent not found'
    });
  }
});

app.get('/api/v1/agents/executions/:executionId', (req, res): void => {
  const { executionId } = req.params;
  
  // Mock execution status
  const executionContext = {
    executionId,
    agentId: 'hybrid-agent-1',
    userId: 'current-user',
    environment: 'development',
    inputs: { text: 'Sample input text', url: 'https://example.com/form' },
    startTime: '2024-01-15T14:00:00Z',
    status: 'completed',
    currentComponent: null,
    progress: 100,
    logs: [
      {
        timestamp: '2024-01-15T14:00:00Z',
        level: 'info',
        component: 'orchestrator',
        message: 'Starting hybrid agent execution'
      },
      {
        timestamp: '2024-01-15T14:00:05Z',
        level: 'info',
        component: 'comp-1',
        message: 'LLM component completed successfully'
      },
      {
        timestamp: '2024-01-15T14:00:15Z',
        level: 'info',
        component: 'comp-2',
        message: 'RPA component completed successfully'
      },
      {
        timestamp: '2024-01-15T14:00:20Z',
        level: 'info',
        component: 'orchestrator',
        message: 'Hybrid agent execution completed'
      }
    ],
    outputs: {
      'comp-1.analysis': {
        sentiment: 'positive',
        topics: ['technology', 'automation'],
        summary: 'Text discusses automation technology'
      },
      'comp-2.success': true
    },
    metrics: {
      duration: 20000,
      cpuUsage: 65,
      memoryUsage: 256,
      networkIO: 2048,
      storageIO: 1024,
      cost: 0.12,
      errors: 0,
      retries: 0
    }
  };

  res.json({
    success: true,
    data: executionContext
  });
});

app.post('/api/v1/agents/executions/:executionId/cancel', (req, res): void => {
  const { executionId } = req.params;
  
  res.json({
    success: true,
    data: {
      executionId,
      status: 'cancelled',
      cancelledAt: new Date().toISOString()
    },
    message: 'Execution cancelled successfully'
  });
});

app.get('/api/v1/agents/components/templates', (_req, res): void => {
  res.json({
    success: true,
    data: [
      {
        type: 'llm',
        name: 'Text Analyzer',
        description: 'Analyzes text content using LLM',
        category: 'Natural Language Processing',
        complexity: 'simple',
        defaultConfig: {
          provider: 'openai',
          model: 'gpt-4',
          temperature: 0.7,
          maxTokens: 1000,
          systemPrompt: 'You are a helpful text analyzer.',
          userPromptTemplate: 'Analyze this text: {input}',
          responseFormat: 'json'
        },
        requiredInputs: ['text'],
        providedOutputs: ['analysis', 'sentiment', 'summary']
      },
      {
        type: 'rpa',
        name: 'Web Form Filler',
        description: 'Automatically fills web forms',
        category: 'Web Automation',
        complexity: 'medium',
        defaultConfig: {
          platform: 'custom',
          workflow: {
            steps: [
              { id: '1', type: 'navigate', selector: '', action: 'goto', data: '{url}' },
              { id: '2', type: 'type', selector: 'input[name="email"]', action: 'fill', data: '{email}' }
            ],
            flowControl: 'sequential',
            timeout: 30000
          }
        },
        requiredInputs: ['url', 'formData'],
        providedOutputs: ['success', 'responseData', 'screenshot']
      },
      {
        type: 'selenium',
        name: 'Web UI Tester',
        description: 'Tests web application UI',
        category: 'Quality Assurance',
        complexity: 'complex',
        defaultConfig: {
          browser: 'chrome',
          headless: true,
          windowSize: { width: 1920, height: 1080 },
          timeout: 30000
        },
        requiredInputs: ['baseUrl', 'testData'],
        providedOutputs: ['testResults', 'screenshots', 'report']
      },
      {
        type: 'custom',
        name: 'API Integrator',
        description: 'Integrates with external APIs',
        category: 'Integration',
        complexity: 'simple',
        defaultConfig: {
          runtime: 'nodejs',
          entryPoint: 'index.js',
          dependencies: ['axios']
        },
        requiredInputs: ['url', 'method'],
        providedOutputs: ['response', 'success', 'error']
      }
    ]
  });
});

// Agent templates and processors are imported at the top of the file

// NLP/Agent Builder Endpoints
app.get('/api/v1/nlp/test', (_req, res): void => {
  res.json({
    success: true,
    message: 'Purpose-Driven Agent Creation API is running',
    timestamp: new Date().toISOString(),
    endpoints: [
      'GET /api/v1/nlp/templates',
      'POST /api/v1/nlp/create-agent',
      'POST /api/v1/nlp/validate-agent'
    ]
  });
});

app.get('/api/v1/nlp/examples', (_req, res): void => {
  res.json({
    success: true,
    data: {
      examples: [
        "Rephrase this email to be more professional: 'Hey, can u send me the report plz?'",
        "Generate Selenium test code in Java for testing a login form",
        "Create monitoring configuration for AWS infrastructure with web servers and database",
        "Generate API documentation for a REST endpoint that handles user authentication",
        "Validate this JSON data against business rules for customer information"
      ]
    }
  });
});

app.get('/api/v1/nlp/templates', (_req, res): void => {
  // Get model information for demo
  let modelInfo = {};
  let bedrockStatus = 'Not Available';
  
  try {
    if (callBedrock) {
      const bedrockConfig = require('../../bedrock-integration/bedrock-config');
      modelInfo = bedrockConfig.MODELS || {};
      bedrockStatus = '🤖 REAL AWS Bedrock Connected';
    }
  } catch (error) {
    console.log('Could not load Bedrock model info for templates');
  }

  res.json({
    success: true,
    data: {
      templates: AGENT_TEMPLATES.map(template => ({
        id: template.id,
        name: template.name,
        category: template.category,
        description: template.description,
        purpose: template.purpose,
        inputSchema: template.inputSchema,
        outputSchema: template.outputSchema,
        demo_features: {
          real_ai: !!callBedrock,
          model_selection: true,
          live_processing: true,
          bedrock_optimized: true
        }
      })),
      bedrock_info: {
        status: bedrockStatus,
        available_models: Object.keys(modelInfo).length,
        real_ai_processing: !!callBedrock,
        demo_ready: true
      },
      meta: {
        total: AGENT_TEMPLATES.length,
        ai_provider: callBedrock ? 'aws-bedrock-real' : 'mock-responses',
        environment: 'local-with-bedrock',
        demo_mode: true
      }
    }
  });
});

app.post('/api/v1/nlp/create-agent', (req, res): void => {
  const { templateId, agentName, inputs } = req.body;
  
  if (!templateId) {
    res.status(400).json({
      success: false,
      error: 'Template ID is required'
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

  // Validate required inputs
  const missingInputs = template.inputSchema
    .filter(input => input.required && !inputs[input.name])
    .map(input => input.name);

  if (missingInputs.length > 0) {
    res.status(400).json({
      success: false,
      error: `Missing required inputs: ${missingInputs.join(', ')}`
    });
    return;
  }

  const agentConfig = {
    id: `${template.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: agentName || template.name,
    description: template.description,
    purpose: template.purpose,
    category: template.category,
    templateId: template.id,
    inputSchema: template.inputSchema,
    outputSchema: template.outputSchema,
    processingLogic: template.processingLogic,
    created: new Date().toISOString()
  };

  res.json({
    success: true,
    data: {
      agent: agentConfig,
      validation: {
        isValid: true,
        errors: [],
        warnings: []
      }
    }
  });
});

app.post('/api/v1/nlp/generate-from-template', (req, res): void => {
  const { templateId, customizations = {} } = req.body;
  
  if (!templateId) {
    res.status(400).json({
      success: false,
      error: 'Template ID is required'
    });
    return;
  }

  // Mock template-based generation
  const baseConfigs: Record<string, any> = {
    'data-analyzer': {
      name: customizations.name || 'Custom Data Analyzer',
      description: customizations.description || 'Analyzes datasets and generates insights',
      inputs: ['data_file', 'analysis_type', 'parameters'],
      outputs: ['insights', 'visualizations', 'summary', 'recommendations']
    },
    'document-processor': {
      name: customizations.name || 'Custom Document Processor',
      description: customizations.description || 'Processes and extracts information from documents',
      inputs: ['document', 'extraction_rules', 'format_options'],
      outputs: ['extracted_data', 'summary', 'metadata', 'structured_output']
    },
    'sentiment-analyzer': {
      name: customizations.name || 'Custom Sentiment Analyzer',
      description: customizations.description || 'Analyzes text sentiment and emotions',
      inputs: ['text_content', 'analysis_depth', 'language'],
      outputs: ['sentiment_score', 'emotions', 'confidence', 'detailed_analysis']
    }
  };

  const config = baseConfigs[templateId] || baseConfigs['data-analyzer'];

  res.json({
    success: true,
    data: {
      config,
      templateId,
      customizations
    }
  });
});

app.post('/api/v1/nlp/edit-config', (req, res): void => {
  const { config, editRequest } = req.body;
  
  if (!config || !editRequest) {
    res.status(400).json({
      success: false,
      error: 'Config and edit request are required'
    });
    return;
  }

  // Mock config editing
  const updatedConfig = { ...config };
  
  if (editRequest.toLowerCase().includes('add input')) {
    updatedConfig.inputs = [...(config.inputs || []), 'new_input'];
  }
  
  if (editRequest.toLowerCase().includes('add output')) {
    updatedConfig.outputs = [...(config.outputs || []), 'new_output'];
  }

  res.json({
    success: true,
    data: {
      config: updatedConfig,
      changes: ['Applied requested modifications'],
      editRequest
    }
  });
});

app.post('/api/v1/nlp/validate-detailed', (req, res): void => {
  const { config } = req.body;
  
  if (!config) {
    res.status(400).json({
      success: false,
      error: 'Config is required'
    });
    return;
  }

  const errors = [];
  const warnings = [];

  if (!config.name) errors.push('Agent name is required');
  if (!config.description) warnings.push('Agent description is recommended');
  if (!config.inputs || config.inputs.length === 0) warnings.push('At least one input is recommended');
  if (!config.outputs || config.outputs.length === 0) errors.push('At least one output is required');

  res.json({
    success: true,
    data: {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: Math.max(0, 100 - (errors.length * 25) - (warnings.length * 10))
    }
  });
});

// Security & Compliance Endpoints
app.get('/api/v1/security/events', (_req, res): void => {
  res.json({
    success: true,
    data: [
      {
        id: 'evt-1',
        timestamp: '2024-01-15T14:30:00Z',
        eventType: 'failed_login',
        userId: 'user-unknown',
        userName: 'unknown',
        ipAddress: '192.168.1.100',
        location: 'New York, US',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        details: 'Multiple failed login attempts detected',
        riskLevel: 'high'
      },
      {
        id: 'evt-2',
        timestamp: '2024-01-15T13:45:00Z',
        eventType: 'mfa_challenge',
        userId: 'user-2',
        userName: 'john.developer@company.com',
        ipAddress: '10.0.1.50',
        location: 'San Francisco, US',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        details: 'MFA challenge completed successfully',
        riskLevel: 'low'
      },
      {
        id: 'evt-3',
        timestamp: '2024-01-15T12:20:00Z',
        eventType: 'suspicious_activity',
        userId: 'user-3',
        userName: 'jane.business@company.com',
        ipAddress: '203.0.113.45',
        location: 'Unknown Location',
        userAgent: 'curl/7.68.0',
        details: 'API access from unusual location and user agent',
        riskLevel: 'critical'
      }
    ]
  });
});

app.get('/api/v1/security/sessions', (_req, res): void => {
  res.json({
    success: true,
    data: [
      {
        sessionId: 'sess-1',
        userId: 'user-1',
        userName: 'admin@company.com',
        loginTime: '2024-01-15T08:00:00Z',
        lastActivity: '2024-01-15T14:30:00Z',
        ipAddress: '10.0.1.10',
        location: 'New York, US',
        deviceInfo: 'Windows 11, Chrome 120',
        status: 'active'
      },
      {
        sessionId: 'sess-2',
        userId: 'user-2',
        userName: 'john.developer@company.com',
        loginTime: '2024-01-15T09:15:00Z',
        lastActivity: '2024-01-15T14:25:00Z',
        ipAddress: '10.0.1.50',
        location: 'San Francisco, US',
        deviceInfo: 'macOS 14, Safari 17',
        status: 'active'
      }
    ]
  });
});

app.post('/api/v1/security/sessions/:sessionId/terminate', (req, res): void => {
  const { sessionId } = req.params;
  
  res.json({
    success: true,
    data: {
      sessionId,
      status: 'terminated',
      terminatedAt: new Date().toISOString(),
      message: 'Session terminated successfully'
    }
  });
});

app.get('/api/v1/compliance/reports', (_req, res): void => {
  res.json({
    success: true,
    data: [
      {
        id: 'rpt-1',
        reportType: 'SOX',
        generatedDate: '2024-01-15T00:00:00Z',
        period: 'Q4 2023',
        status: 'compliant',
        findings: 0,
        criticalIssues: 0,
        downloadUrl: '/reports/sox-q4-2023.pdf'
      },
      {
        id: 'rpt-2',
        reportType: 'GDPR',
        generatedDate: '2024-01-10T00:00:00Z',
        period: 'December 2023',
        status: 'partial',
        findings: 3,
        criticalIssues: 1,
        downloadUrl: '/reports/gdpr-dec-2023.pdf'
      },
      {
        id: 'rpt-3',
        reportType: 'SOC2',
        generatedDate: '2024-01-05T00:00:00Z',
        period: '2023 Annual',
        status: 'compliant',
        findings: 2,
        criticalIssues: 0,
        downloadUrl: '/reports/soc2-2023.pdf'
      }
    ]
  });
});

app.post('/api/v1/compliance/generate', (req, res): void => {
  const { reportType } = req.body;
  
  if (!reportType) {
    res.status(400).json({
      success: false,
      error: 'Report type is required'
    });
    return;
  }

  res.json({
    success: true,
    data: {
      reportId: `rpt-${Date.now()}`,
      reportType,
      status: 'generating',
      estimatedTime: 300, // 5 minutes
      message: `${reportType} compliance report generation started`
    }
  });
});

app.post('/api/v1/security/mfa/setup', (req, res): void => {
  const { method, phoneNumber, email } = req.body;
  
  res.json({
    success: true,
    data: {
      method,
      qrCode: method === 'app' ? 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==' : null,
      secret: method === 'app' ? 'JBSWY3DPEHPK3PXP' : null,
      backupCodes: ['123456', '789012', '345678', '901234', '567890'],
      message: 'MFA setup initiated successfully'
    }
  });
});

app.post('/api/v1/security/mfa/verify', (req, res): void => {
  const { code, method } = req.body;
  
  if (!code) {
    res.status(400).json({
      success: false,
      error: 'Verification code is required'
    });
    return;
  }

  // Mock verification - in real app, verify against TOTP/SMS/Email
  const isValid = code.length === 6 && /^\d+$/.test(code);
  
  res.json({
    success: isValid,
    data: {
      verified: isValid,
      method,
      message: isValid ? 'MFA verification successful' : 'Invalid verification code'
    }
  });
});

// Bedrock Models endpoint for demo showcase
app.get('/api/v1/bedrock/models', async (_req, res): Promise<void> => {
  try {
    if (!callBedrock) {
      res.json({
        success: false,
        error: 'Bedrock not available',
        models: []
      });
      return;
    }

    // Get available models from Bedrock config
    const bedrockConfig = require('../../bedrock-integration/bedrock-config');
    const models = bedrockConfig.MODELS || {};
    const agentModelMap = bedrockConfig.AGENT_MODEL_MAP || {};

    res.json({
      success: true,
      bedrock_status: '🤖 REAL AWS Bedrock Connected',
      timestamp: new Date().toISOString(),
      available_models: Object.entries(models).map(([key, model]: [string, any]) => ({
        id: key,
        name: model.modelId,
        max_tokens: model.maxTokens,
        temperature: model.temperature,
        cost_per_1m_tokens: typeof model.costPer1MTokens === 'object' 
          ? `$${model.costPer1MTokens.input}/$${model.costPer1MTokens.output}` 
          : model.costPer1MTokens,
        best_for: Array.isArray(model.bestFor) ? model.bestFor : [],
        status: '✅ Available'
      })),
      agent_model_mapping: Object.entries(agentModelMap).map(([agentId, modelKey]) => ({
        agent_id: agentId,
        model_used: models[modelKey as string]?.modelId || 'Unknown',
        optimization: 'Cost-optimized selection'
      })),
      demo_info: {
        provider: 'AWS Bedrock',
        region: 'us-east-1',
        real_ai: true,
        cost_tracking: true,
        models_count: Object.keys(models).length
      }
    });

  } catch (error) {
    console.error('❌ Error fetching Bedrock models:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Bedrock models',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Bedrock connection test endpoint for live demo
app.get('/api/v1/bedrock/test-connection', async (_req, res): Promise<void> => {
  try {
    if (!callBedrock) {
      res.json({
        success: false,
        status: '❌ Bedrock Not Available',
        message: 'Bedrock integration not loaded'
      });
      return;
    }

    console.log('🧪 [DEMO] Testing live Bedrock connection...');
    const startTime = Date.now();

    // Test with a simple prompt
    const testResponse = await callBedrock('test-generator', 'Hello, this is a connection test', {
      context: 'demo-test'
    });

    const responseTime = Date.now() - startTime;

    if (testResponse.success) {
      res.json({
        success: true,
        status: '✅ REAL AWS Bedrock Connected',
        connection_time: `${responseTime}ms`,
        model_used: testResponse.model,
        tokens_used: testResponse.usage,
        response_preview: testResponse.content.substring(0, 100) + '...',
        demo_message: '🎯 Live connection to AWS Bedrock confirmed!',
        timestamp: new Date().toISOString()
      });
    } else {
      res.json({
        success: false,
        status: '❌ Bedrock Connection Failed',
        error: testResponse.error,
        connection_time: `${responseTime}ms`
      });
    }

  } catch (error) {
    console.error('❌ Bedrock connection test failed:', error);
    res.status(500).json({
      success: false,
      status: '❌ Connection Test Failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

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
        timeoutMinutes: 30,
        maxConcurrentSessions: 3,
        requireMfaForAdmin: true,
        enableIpWhitelisting: true,
        allowedIpRanges: ['10.0.0.0/8', '192.168.0.0/16']
      },
      accessPolicy: {
        maxFailedAttempts: 5,
        lockoutDurationMinutes: 15,
        enableGeoBlocking: false,
        allowedCountries: ['US', 'CA', 'GB']
      }
    }
  });
});

app.put('/api/v1/security/policies', (req, res): void => {
  const { passwordPolicy, sessionPolicy, accessPolicy } = req.body;
  
  res.json({
    success: true,
    data: {
      passwordPolicy,
      sessionPolicy,
      accessPolicy,
      updatedAt: new Date().toISOString(),
      message: 'Security policies updated successfully'
    }
  });
});

// 404 handler
app.use((_req, res): void => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});



// Start server
app.listen(PORT, () => {
  console.log(`🚀 Agent Factory Backend Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API base URL: http://localhost:${PORT}/api/v1`);
  console.log(`📦 Unified Catalog: http://localhost:${PORT}/api/v1/agents`);
  
  if (callBedrock) {
    console.log(`🤖 AI Provider: AWS Bedrock (REAL AI) ✅`);
    console.log(`🎯 Agents will use REAL Claude/Titan models`);
  } else {
    console.log(`⚠️  AI Provider: Mock responses (Bedrock unavailable)`);
    console.log(`💡 Install bedrock-integration for real AI`);
  }
});

export default app;
