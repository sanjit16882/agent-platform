import { Router } from 'express';
import { AgentController } from '../controllers/AgentController';
import { authenticate, authorize, optionalAuthenticate } from '../middleware/authentication';
import { createApiKeyRateLimit, createExecutionRateLimit } from '../middleware/rateLimiting';
import { validateRequest, commonSchemas } from '../middleware/validation';

const router = Router();
const agentController = new AgentController();

/**
 * @swagger
 * /api/v1/agents:
 *   get:
 *     summary: List all available agents
 *     tags: [Agents]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by agent category
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search agents by name or description
 *     responses:
 *       200:
 *         description: List of agents
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 agents:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Agent'
 *                 categories:
 *                   type: array
 *                   items:
 *                     type: string
 *                 total:
 *                   type: number
 *                 filters:
 *                   type: object
 */
router.get('/', 
  optionalAuthenticate, 
  validateRequest({ query: commonSchemas.search }),
  agentController.getAllAgents
);

/**
 * @swagger
 * /api/v1/agents/categories:
 *   get:
 *     summary: Get agent categories
 *     tags: [Agents]
 *     responses:
 *       200:
 *         description: List of agent categories with counts
 */
router.get('/categories', agentController.getCategories);

/**
 * @swagger
 * /api/v1/agents/{agentId}:
 *   get:
 *     summary: Get agent details
 *     tags: [Agents]
 *     parameters:
 *       - in: path
 *         name: agentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Agent ID
 *     responses:
 *       200:
 *         description: Agent details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 agent:
 *                   $ref: '#/components/schemas/Agent'
 *                 canExecute:
 *                   type: boolean
 *                 executionInfo:
 *                   type: object
 *       404:
 *         description: Agent not found
 */
router.get('/:agentId', 
  optionalAuthenticate, 
  validateRequest({ params: commonSchemas.agentId }),
  agentController.getAgent
);

/**
 * @swagger
 * /api/v1/agents/{agentId}/stats:
 *   get:
 *     summary: Get agent execution statistics
 *     tags: [Agents]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: agentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Agent statistics
 */
router.get('/:agentId/stats', 
  authenticate, 
  authorize('agent:read'), 
  validateRequest({ params: commonSchemas.agentId }),
  agentController.getAgentStats
);

/**
 * @swagger
 * /api/v1/agents/{agentId}/execute:
 *   post:
 *     summary: Execute an agent
 *     tags: [Agents]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: agentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Agent ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - inputs
 *             properties:
 *               inputs:
 *                 type: object
 *                 description: Agent input parameters
 *                 example: {"requirements": "Test login functionality", "framework": "cypress"}
 *               sync:
 *                 type: boolean
 *                 default: false
 *                 description: Whether to execute synchronously
 *               timeout:
 *                 type: number
 *                 default: 300
 *                 description: Timeout in seconds
 *               metadata:
 *                 type: object
 *                 description: Additional metadata
 *     responses:
 *       200:
 *         description: Synchronous execution result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 executionId:
 *                   type: string
 *                 status:
 *                   type: string
 *                 results:
 *                   type: object
 *                 duration:
 *                   type: number
 *                 sync:
 *                   type: boolean
 *       202:
 *         description: Asynchronous execution started
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 executionId:
 *                   type: string
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *                 statusUrl:
 *                   type: string
 *                 resultsUrl:
 *                   type: string
 *       400:
 *         description: Invalid request or inputs
 *       403:
 *         description: Execution forbidden
 *       404:
 *         description: Agent not found
 */
router.post('/:agentId/execute', 
  authenticate, 
  authorize('agent:execute'), 
  validateRequest({ params: commonSchemas.agentId }),
  createExecutionRateLimit(), // Special rate limiting for executions
  agentController.executeAgent
);

export { router as agentRoutes };