const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3002;

// Middleware
app.use(cors({ origin: 'http://localhost:3001' }));
app.use(express.json());

// Simple NLP processor (mock implementation)
const processNLP = (description) => {
  const intent = {
    action: description.includes('sync') ? 'sync' : 
            description.includes('monitor') ? 'monitor' : 
            description.includes('analyze') ? 'analyze' : 'process',
    sources: description.includes('github') ? [{ type: 'github', name: 'repository' }] : 
             description.includes('slack') ? [{ type: 'slack', name: 'channel' }] : 
             description.includes('jira') ? [{ type: 'jira', name: 'project' }] : [],
    targets: description.includes('slack') ? [{ type: 'slack', name: 'notifications' }] : 
             description.includes('email') ? [{ type: 'email', name: 'alerts' }] : [],
    confidence: 0.85,
    parameters: {}
  };

  const config = {
    name: `${intent.action} Agent`,
    description: `Automatically ${intent.action}s based on: ${description}`,
    version: '1.0.0',
    triggers: [{ id: 'trigger-1', type: 'manual', name: 'Manual Trigger' }],
    actions: [{ id: 'action-1', type: intent.action, name: `${intent.action} Action` }],
    connectors: intent.sources.concat(intent.targets).map((item, i) => ({
      id: `connector-${i}`,
      type: item.type,
      name: `${item.type} Connector`
    }))
  };

  return { intent, config };
};

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/api/v1/nlp/test', (req, res) => {
  res.json({
    success: true,
    message: 'NLP service is working!',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/v1/nlp/examples', (req, res) => {
  res.json({
    success: true,
    data: {
      examples: [
        "Build me an agent that syncs Jira and Slack daily at 5 PM",
        "Monitor GitHub repository for new pull requests and notify team in Slack",
        "Analyze S3 bucket files every hour and generate summary reports"
      ]
    }
  });
});

app.post('/api/v1/nlp/process', (req, res) => {
  const { description } = req.body;
  
  if (!description) {
    return res.status(400).json({
      error: { code: 'INVALID_INPUT', message: 'Description is required' }
    });
  }

  try {
    const result = processNLP(description);
    res.json({
      success: true,
      data: {
        ...result,
        processingTime: 150,
        validation: { isValid: true, errors: [], warnings: [] },
        suggestions: []
      }
    });
  } catch (error) {
    res.status(500).json({
      error: { code: 'NLP_ERROR', message: 'Processing failed' }
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 NLP API Server running on http://localhost:${PORT}`);
  console.log(`🧪 Test: http://localhost:${PORT}/api/v1/nlp/test`);
  console.log(`📖 Examples: http://localhost:${PORT}/api/v1/nlp/examples`);
  console.log(`🔄 Process: POST http://localhost:${PORT}/api/v1/nlp/process`);
});