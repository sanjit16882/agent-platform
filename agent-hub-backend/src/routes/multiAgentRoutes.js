/**
 * Multi-Agent Collaboration Routes
 */

const express = require('express');
const router = express.Router();

module.exports = (multiAgentCoordinator) => {
  /**
   * POST /api/v1/multi-agent/execute
   * Execute a multi-agent workflow
   */
  router.post('/execute', async (req, res) => {
    try {
      const { type, input, agentSequence, metadata } = req.body;

      if (!type || !input || !agentSequence || agentSequence.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: type, input, agentSequence'
        });
      }

      console.log('🚀 Executing multi-agent workflow');
      console.log(`Type: ${type}`);
      console.log(`Agents: ${agentSequence.join(' → ')}`);
      console.log(`Input length: ${input.length} characters`);

      const result = await multiAgentCoordinator.executeWorkflow({
        type,
        input,
        agentSequence,
        metadata
      });

      console.log(`✅ Workflow completed: ${result.workflowId}`);
      res.json(result);
    } catch (error) {
      console.error('❌ Error executing multi-agent workflow:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });

  /**
   * GET /api/v1/multi-agent/workflows
   * List all workflows
   */
  router.get('/workflows', (req, res) => {
    try {
      const workflows = multiAgentCoordinator.listWorkflows();
      res.json({
        success: true,
        workflows,
        count: workflows.length
      });
    } catch (error) {
      console.error('Error listing workflows:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /api/v1/multi-agent/workflows/:workflowId
   * Get workflow status
   */
  router.get('/workflows/:workflowId', (req, res) => {
    try {
      const { workflowId } = req.params;
      const workflow = multiAgentCoordinator.getWorkflowStatus(workflowId);

      if (!workflow) {
        return res.status(404).json({
          success: false,
          error: 'Workflow not found'
        });
      }

      res.json({
        success: true,
        workflow
      });
    } catch (error) {
      console.error('Error getting workflow status:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  return router;
};
