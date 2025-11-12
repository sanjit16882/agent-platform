import express from 'express';
import { TestingSandbox } from '../services/testingSandbox';
import { AgentVersioningService } from '../services/agentVersioning';
import { integrationHub } from '../services/integrationHub';
import { AgentExecutionService } from '../services/agentExecutionService';

const router = express.Router();
const testingSandbox = new TestingSandbox();
const versioningService = new AgentVersioningService();
const executionService = AgentExecutionService.getInstance();

// ===== TESTING SANDBOX ENDPOINTS =====

/**
 * @swagger
 * /api/devops/agents/{agentId}/test:
 *   post:
 *     summary: Run test scenarios for an agent
 *     parameters:
 *       - name: agentId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               scenarios:
 *                 type: array
 *                 items:
 *                   type: string
 *               customScenarios:
 *                 type: array
 *     responses:
 *       200:
 *         description: Test results
 */
router.post('/agents/:agentId/test', async (req, res) => {
  try {
    const { agentId } = req.params;
    const { scenarios, customScenarios } = req.body;

    // Get agent template
    const agentConfig = executionService.getAgentConfig(agentId);
    if (!agentConfig) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    // Add custom scenarios if provided
    if (customScenarios) {
      customScenarios.forEach((scenario: any) => {
        testingSandbox.addCustomScenario(scenario);
      });
    }

    // Run tests
    let results;
    if (scenarios && scenarios.length > 0) {
      // Run specific scenarios
      results = [];
      for (const scenarioId of scenarios) {
        const result = await testingSandbox.runTestScenario(agentId, scenarioId, agentConfig);
        results.push(result);
      }
    } else {
      // Run all scenarios
      results = await testingSandbox.runAllScenarios(agentId, agentConfig);
    }

    // Get coverage report
    const coverage = testingSandbox.getTestCoverage(results);

    res.json({
      success: true,
      agentId,
      results,
      coverage,
      summary: {
        totalTests: results.length,
        passed: results.filter(r => r.passed).length,
        failed: results.filter(r => !r.passed).length,
        averageExecutionTime: coverage.averageExecutionTime
      }
    });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/devops/agents/{agentId}/test/scenarios:
 *   post:
 *     summary: Add custom test scenario
 */
router.post('/agents/:agentId/test/scenarios', async (req, res) => {
  try {
    const { agentId } = req.params;
    const scenario = req.body;

    // Validate scenario
    if (!scenario.id || !scenario.name || !scenario.type) {
      return res.status(400).json({ error: 'Invalid scenario format' });
    }

    testingSandbox.addCustomScenario(scenario);

    res.json({
      success: true,
      message: 'Test scenario added successfully',
      scenarioId: scenario.id
    });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ===== VERSIONING ENDPOINTS =====

/**
 * @swagger
 * /api/devops/agents/{agentId}/versions:
 *   get:
 *     summary: Get version history for an agent
 */
router.get('/agents/:agentId/versions', async (req, res) => {
  try {
    const { agentId } = req.params;
    const versions = versioningService.getVersionHistory(agentId);

    res.json({
      success: true,
      agentId,
      versions: versions.map(v => ({
        id: v.id,
        version: v.version,
        timestamp: v.timestamp,
        author: v.author,
        message: v.message,
        status: v.status,
        commitHash: v.commitHash,
        changesCount: v.changes.length
      }))
    });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/devops/agents/{agentId}/versions:
 *   post:
 *     summary: Create new version of an agent
 */
router.post('/agents/:agentId/versions', async (req, res) => {
  try {
    const { agentId } = req.params;
    const { message, author } = req.body;

    // Get current agent template
    const currentTemplate = executionService.getAgentConfig(agentId);
    if (!currentTemplate) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    // Get previous version for change detection
    const versions = versioningService.getVersionHistory(agentId);
    const previousVersion = versions.length > 0 ? versions[0] : undefined;

    // Create new version
    const newVersion = await versioningService.createVersion(
      agentId,
      currentTemplate,
      author || 'system',
      message || 'Version created via API',
      previousVersion
    );

    res.json({
      success: true,
      version: {
        id: newVersion.id,
        version: newVersion.version,
        timestamp: newVersion.timestamp,
        author: newVersion.author,
        message: newVersion.message,
        changes: newVersion.changes,
        commitHash: newVersion.commitHash
      }
    });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/devops/agents/{agentId}/versions/{version}:
 *   get:
 *     summary: Get specific version details
 */
router.get('/agents/:agentId/versions/:version', async (req, res) => {
  try {
    const { agentId, version } = req.params;
    const versions = versioningService.getVersionHistory(agentId);
    const versionData = versions.find(v => v.version === version);

    if (!versionData) {
      return res.status(404).json({ error: 'Version not found' });
    }

    res.json({
      success: true,
      version: versionData
    });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/devops/agents/{agentId}/rollback:
 *   post:
 *     summary: Rollback agent to specific version
 */
router.post('/agents/:agentId/rollback', async (req, res) => {
  try {
    const { agentId } = req.params;
    const { targetVersion } = req.body;

    if (!targetVersion) {
      return res.status(400).json({ error: 'Target version is required' });
    }

    const rollbackVersion = await versioningService.rollbackToVersion(agentId, targetVersion);

    res.json({
      success: true,
      message: `Successfully rolled back to version ${targetVersion}`,
      newVersion: {
        id: rollbackVersion.id,
        version: rollbackVersion.version,
        timestamp: rollbackVersion.timestamp
      }
    });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/devops/agents/{agentId}/deploy:
 *   post:
 *     summary: Deploy specific version to environment
 */
router.post('/agents/:agentId/deploy', async (req, res) => {
  try {
    const { agentId } = req.params;
    const { version, environment, config } = req.body;

    if (!version || !environment) {
      return res.status(400).json({ error: 'Version and environment are required' });
    }

    const deploymentConfig = {
      environment,
      autoRollback: config?.autoRollback || false,
      testingRequired: config?.testingRequired || false,
      approvalRequired: config?.approvalRequired || false,
      rollbackTriggers: config?.rollbackTriggers || []
    };

    const result = await versioningService.deployVersion(agentId, version, environment, deploymentConfig);

    res.json({
      success: result.success,
      message: result.message,
      deployment: {
        agentId,
        version,
        environment,
        timestamp: new Date()
      }
    });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/devops/agents/{agentId}/changelog:
 *   get:
 *     summary: Generate changelog for agent
 */
router.get('/agents/:agentId/changelog', async (req, res) => {
  try {
    const { agentId } = req.params;
    const { fromVersion, toVersion } = req.query;

    const changelog = versioningService.generateChangelog(
      agentId,
      fromVersion as string,
      toVersion as string
    );

    res.json({
      success: true,
      agentId,
      changelog
    });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ===== INTEGRATION HUB ENDPOINTS =====

/**
 * @swagger
 * /api/devops/plugins:
 *   get:
 *     summary: List registered plugins
 */
router.get('/plugins', async (req, res) => {
  try {
    const { type } = req.query;
    const plugins = integrationHub.listPlugins(type as string);

    res.json({
      success: true,
      plugins: plugins.map(p => ({
        id: p.manifest.id,
        name: p.manifest.name,
        version: p.manifest.version,
        type: p.manifest.type,
        status: p.status,
        registeredAt: p.registeredAt,
        lastUsed: p.lastUsed,
        capabilities: p.manifest.capabilities
      }))
    });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/devops/connectors:
 *   post:
 *     summary: Register API connector
 */
router.post('/connectors', async (req, res) => {
  try {
    const connector = req.body;

    // Validate connector
    if (!connector.id || !connector.name || !connector.baseUrl) {
      return res.status(400).json({ error: 'Invalid connector format' });
    }

    integrationHub.registerConnector(connector);

    res.json({
      success: true,
      message: 'Connector registered successfully',
      connectorId: connector.id
    });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/devops/connectors/{connectorId}/execute:
 *   post:
 *     summary: Execute connector endpoint
 */
router.post('/connectors/:connectorId/execute', async (req, res) => {
  try {
    const { connectorId } = req.params;
    const { endpoint, params } = req.body;

    const result = await integrationHub.executeConnector(connectorId, endpoint, params);

    res.json({
      success: true,
      result
    });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/devops/webhooks:
 *   post:
 *     summary: Register webhook
 */
router.post('/webhooks', async (req, res) => {
  try {
    const webhook = req.body;

    // Validate webhook
    if (!webhook.id || !webhook.url || !webhook.events) {
      return res.status(400).json({ error: 'Invalid webhook format' });
    }

    integrationHub.registerWebhook(webhook);

    res.json({
      success: true,
      message: 'Webhook registered successfully',
      webhookId: webhook.id
    });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/devops/sdk/config:
 *   get:
 *     summary: Get SDK configuration
 */
router.get('/sdk/config', async (req, res) => {
  try {
    const config = integrationHub.generateSDKConfig();

    res.json({
      success: true,
      config
    });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/devops/health:
 *   get:
 *     summary: Health check for all integrations
 */
router.get('/health', async (req, res) => {
  try {
    const health = await integrationHub.healthCheck();

    res.json({
      success: true,
      timestamp: new Date(),
      health
    });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;