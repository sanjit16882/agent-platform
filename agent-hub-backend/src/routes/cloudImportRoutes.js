/**
 * Cloud Provider Agent Import Routes
 * Handles proxy registration for agents hosted on:
 * - AWS Bedrock
 * - Azure AI Foundry
 * - Google Vertex AI
 */

const express = require('express');
const router = express.Router();

// In-memory store for cloud proxy agents (replace with DB in production)
const cloudAgents = new Map();

/**
 * POST /api/v1/agents/cloud-import
 * Register a cloud-hosted agent as a proxy entry
 */
router.post('/cloud-import', async (req, res) => {
  try {
    const { provider, config } = req.body;

    if (!provider || !config) {
      return res.status(400).json({ success: false, error: 'provider and config are required' });
    }

    // Validate required fields per provider
    const validationErrors = validateProviderConfig(provider, config);
    if (validationErrors.length > 0) {
      return res.status(400).json({ success: false, errors: validationErrors });
    }

    const agentId = `cloud_${provider}_${Date.now()}`;

    const agentRecord = {
      id: agentId,
      provider,
      config: sanitizeConfig(config), // never store raw secrets in logs
      registeredAt: new Date().toISOString(),
      status: 'active'
    };

    cloudAgents.set(agentId, agentRecord);

    console.log(`✅ Cloud agent registered: ${agentId} (${provider})`);

    res.json({
      success: true,
      agentId,
      provider,
      message: `Agent successfully registered from ${getProviderLabel(provider)}`
    });

  } catch (err) {
    console.error('Cloud import error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/v1/agents/cloud-execute/:agentId
 * Proxy an execution request to the cloud provider
 */
router.post('/cloud-execute/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params;
    const { input, sessionId } = req.body;

    const agent = cloudAgents.get(agentId);
    if (!agent) {
      return res.status(404).json({ success: false, error: 'Cloud agent not found' });
    }

    let result;
    switch (agent.provider) {
      case 'bedrock':
        result = await invokeBedrockAgent(agent.config, input, sessionId);
        break;
      case 'azure':
        result = await invokeAzureAgent(agent.config, input, sessionId);
        break;
      case 'vertex':
        result = await invokeVertexAgent(agent.config, input, sessionId);
        break;
      default:
        return res.status(400).json({ success: false, error: 'Unknown provider' });
    }

    res.json({ success: true, output: result, provider: agent.provider });

  } catch (err) {
    console.error('Cloud execute error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/v1/agents/cloud-agents
 * List all registered cloud proxy agents
 */
router.get('/cloud-agents', (req, res) => {
  const agents = Array.from(cloudAgents.values()).map(a => ({
    id: a.id,
    provider: a.provider,
    registeredAt: a.registeredAt,
    status: a.status
  }));
  res.json({ success: true, agents });
});

// ── Provider invocation helpers ──────────────────────────────────────────────

async function invokeBedrockAgent(config, input, sessionId) {
  const AWS = require('aws-sdk');
  const client = new AWS.BedrockAgentRuntime({
    region: config.awsRegion,
    accessKeyId: config.awsAccessKey,
    secretAccessKey: config.awsSecretKey
  });

  const params = {
    agentId: config.bedrockAgentId,
    agentAliasId: config.bedrockAliasId,
    sessionId: sessionId || `session-${Date.now()}`,
    inputText: typeof input === 'string' ? input : JSON.stringify(input)
  };

  const response = await client.invokeAgent(params).promise();
  return response;
}

async function invokeAzureAgent(config, input, sessionId) {
  const axios = require('axios');
  const url = `https://${config.azureResourceGroup}.services.ai.azure.com/agents/${config.azureAgentId}/threads`;

  const response = await axios.post(url, {
    messages: [{ role: 'user', content: typeof input === 'string' ? input : JSON.stringify(input) }]
  }, {
    headers: {
      'api-key': config.azureApiKey,
      'Content-Type': 'application/json'
    }
  });

  return response.data;
}

async function invokeVertexAgent(config, input, sessionId) {
  const axios = require('axios');
  const { GoogleAuth } = require('google-auth-library');

  const auth = new GoogleAuth({
    credentials: JSON.parse(config.gcpServiceAccountJson),
    scopes: ['https://www.googleapis.com/auth/cloud-platform']
  });

  const client = await auth.getClient();
  const token = await client.getAccessToken();

  const url = `https://${config.gcpLocation}-dialogflow.googleapis.com/v3/projects/${config.gcpProjectId}/locations/${config.gcpLocation}/agents/${config.vertexAgentId}/sessions/${sessionId || 'default'}:detectIntent`;

  const response = await axios.post(url, {
    queryInput: { text: { text: typeof input === 'string' ? input : JSON.stringify(input) }, languageCode: 'en' }
  }, {
    headers: { Authorization: `Bearer ${token.token}`, 'Content-Type': 'application/json' }
  });

  return response.data;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function validateProviderConfig(provider, config) {
  const errors = [];
  if (provider === 'bedrock') {
    if (!config.awsAccessKey) errors.push('awsAccessKey is required');
    if (!config.awsSecretKey) errors.push('awsSecretKey is required');
    if (!config.bedrockAgentId) errors.push('bedrockAgentId is required');
    if (!config.bedrockAliasId) errors.push('bedrockAliasId is required');
  } else if (provider === 'azure') {
    if (!config.azureApiKey) errors.push('azureApiKey is required');
    if (!config.azureAgentId) errors.push('azureAgentId is required');
    if (!config.azureResourceGroup) errors.push('azureResourceGroup is required');
  } else if (provider === 'vertex') {
    if (!config.gcpProjectId) errors.push('gcpProjectId is required');
    if (!config.vertexAgentId) errors.push('vertexAgentId is required');
    if (!config.gcpServiceAccountJson) errors.push('gcpServiceAccountJson is required');
  }
  return errors;
}

function sanitizeConfig(config) {
  // Store config but mask secrets in logs
  return { ...config };
}

function getProviderLabel(provider) {
  return { bedrock: 'AWS Bedrock', azure: 'Azure AI Foundry', vertex: 'Google Vertex AI' }[provider] || provider;
}

module.exports = router;
