import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { NLPController } from './controllers/nlpController';
import { AgentExecutionService } from './services/agentExecutionService';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env['PORT'] || 3002;

// Initialize services
const executionService = AgentExecutionService.getInstance();
const nlpController = new NLPController();

// Basic middleware
app.use(cors({
  origin: 'http://localhost:3001',
  credentials: true
}));

app.use(express.json());

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env['NODE_ENV'] || 'development'
  });
});

// API root endpoint
app.get('/api', (_req, res) => {
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
app.get('/api/v1/nlp/test', (_req, res) => {
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

// Agent endpoints
app.get('/api/v1/agents', async (req, res) => {
  try {
    const agents = executionService.getAllAgentConfigs();
    res.json({
      success: true,
      data: agents,
      count: agents.length
    });
  } catch (error) {
    console.error('Error getting agents:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve agents'
    });
  }
});

app.get('/api/v1/agents/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params;
    const agent = executionService.getAgentConfig(agentId);
    
    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }

    res.json({
      success: true,
      agent: agent,
      canExecute: true,
      executionInfo: {
        estimatedDuration: '2-5 minutes',
        resourceRequirements: 'Low'
      }
    });
  } catch (error) {
    console.error('Error getting agent:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve agent'
    });
  }
});

app.post('/api/v1/agents/:agentId/execute', async (req, res) => {
  try {
    const { agentId } = req.params;
    const { inputs, sync = true } = req.body;

    console.log('Executing agent:', agentId, 'with inputs:', inputs);

    // Validate inputs
    if (!inputs || typeof inputs !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Inputs object is required'
      });
    }

    // Check if agent exists
    const agentConfig = executionService.getAgentConfig(agentId);
    if (!agentConfig) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }

    // Extract input based on agent category
    let input = inputs.input || inputs.requirements || inputs.infrastructureData || 
                inputs.codeOrConfig || inputs.businessData || '';
    
    if (!input || input.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Input data is required'
      });
    }

    // Create execution request
    const executionRequest = {
      agentId,
      input: input.trim(),
      analysisType: inputs.analysisType || inputs.framework,
      outputFormat: inputs.outputFormat || inputs.framework,
      userId: (req.headers['x-user-id'] as string) || 'anonymous'
    };

    console.log('Execution request:', executionRequest);

    // Execute the agent
    const result = await executionService.executeAgent(executionRequest);

    console.log('Execution result:', result);

    if (sync) {
      // Return synchronous result
      res.json({
        executionId: result.executionId,
        status: result.status,
        results: result.output,
        duration: result.duration,
        sync: true
      });
    } else {
      // Return asynchronous response
      res.status(202).json({
        executionId: result.executionId,
        status: result.status,
        message: 'Agent execution started'
      });
    }

  } catch (error) {
    console.error('Error executing agent:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to execute agent'
    });
  }
});

app.get('/api/v1/executions/:executionId', async (req, res) => {
  try {
    const { executionId } = req.params;
    const execution = executionService.getExecution(executionId);

    if (!execution) {
      return res.status(404).json({
        success: false,
        error: 'Execution not found'
      });
    }

    res.json({
      success: true,
      data: {
        executionId: execution.executionId,
        agentId: execution.agentId,
        status: execution.status,
        startTime: execution.startTime,
        endTime: execution.endTime,
        duration: execution.duration,
        results: execution.output,
        error: execution.error
      }
    });

  } catch (error) {
    console.error('Error getting execution:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve execution'
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