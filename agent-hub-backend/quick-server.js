const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json());

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
        "Monitor GitHub repository for new pull requests and notify team in Slack"
      ]
    }
  });
});

app.post('/api/v1/nlp/process', (req, res) => {
  const { description } = req.body;
  res.json({
    success: true,
    data: {
      intent: { action: 'sync', confidence: 0.85 },
      config: { name: 'Generated Agent', description },
      processingTime: 150,
      validation: { isValid: true, errors: [], warnings: [] },
      suggestions: []
    }
  });
});

app.get('/api/v1/nlp/templates', (req, res) => {
  res.json({
    success: true,
    data: {
      templates: [
        {
          id: 'sync-agent',
          name: 'Data Synchronization Agent',
          description: 'Synchronizes data between two or more sources',
          category: 'data-sync'
        },
        {
          id: 'monitor-agent',
          name: 'Monitoring Agent',
          description: 'Monitors resources and sends alerts',
          category: 'monitoring'
        },
        {
          id: 'notify-agent',
          name: 'Notification Agent',
          description: 'Sends notifications and alerts',
          category: 'notification'
        }
      ]
    }
  });
});

app.post('/api/v1/nlp/generate-from-template', (req, res) => {
  const { templateId, customizations = {} } = req.body;
  res.json({
    success: true,
    data: {
      config: {
        name: customizations.name || `${templateId} Instance`,
        description: customizations.description || `Generated from ${templateId} template`,
        version: '1.0.0',
        triggers: [{ id: 'trigger-1', type: 'schedule', name: 'Schedule Trigger' }],
        actions: [{ id: 'action-1', type: 'sync', name: 'Sync Action' }],
        connectors: [],
        parameters: []
      },
      validation: { isValid: true, errors: [], warnings: [] }
    }
  });
});

app.post('/api/v1/nlp/edit-config', (req, res) => {
  const { config, editRequest } = req.body;
  const updatedConfig = { ...config };
  
  // Simple edit simulation
  if (editRequest.operation === 'update') {
    updatedConfig[editRequest.field] = editRequest.value;
  }
  
  res.json({
    success: true,
    data: {
      config: updatedConfig,
      validation: { isValid: true, errors: [], warnings: [] }
    }
  });
});

app.post('/api/v1/nlp/validate-detailed', (req, res) => {
  const { config } = req.body;
  const errors = [];
  const warnings = [];
  
  if (!config.name) errors.push({ field: 'name', message: 'Name is required', severity: 'error' });
  if (!config.description) errors.push({ field: 'description', message: 'Description is required', severity: 'error' });
  if (!config.triggers || config.triggers.length === 0) {
    errors.push({ field: 'triggers', message: 'At least one trigger is required', severity: 'error' });
  }
  
  res.json({
    success: true,
    data: {
      validation: {
        isValid: errors.length === 0,
        errors,
        warnings
      }
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Enhanced NLP Server running on http://localhost:${PORT}`);
  console.log(`🧪 Test: http://localhost:${PORT}/api/v1/nlp/test`);
  console.log(`📖 Examples: http://localhost:${PORT}/api/v1/nlp/examples`);
  console.log(`📋 Templates: http://localhost:${PORT}/api/v1/nlp/templates`);
  console.log(`🔄 Process: POST http://localhost:${PORT}/api/v1/nlp/process`);
  console.log(`✏️ Edit Config: POST http://localhost:${PORT}/api/v1/nlp/edit-config`);
  console.log(`🎯 Generate from Template: POST http://localhost:${PORT}/api/v1/nlp/generate-from-template`);
});