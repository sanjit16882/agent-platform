import { Router } from 'express';
import { ExecutionController } from '../controllers/ExecutionController';
import { authenticate, authorize, requireAdmin } from '../middleware/authentication';
import { createApiKeyRateLimit } from '../middleware/rateLimiting';
import { validateRequest, commonSchemas } from '../middleware/validation';

const router = Router();
const executionController = new ExecutionController();

/**
 * @swagger
 * /api/v1/executions:
 *   get:
 *     summary: List user's executions
 *     tags: [Executions]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by execution status
 *       - in: query
 *         name: agentId
 *         schema:
 *           type: string
 *         description: Filter by agent ID
 *     responses:
 *       200:
 *         description: List of executions
 */
router.get('/', 
  authenticate, 
  authorize('execution:read'), 
  validateRequest({ query: commonSchemas.executionQuery }),
  executionController.listExecutions
);

/**
 * @swagger
 * /api/v1/executions/stats:
 *   get:
 *     summary: Get execution statistics
 *     tags: [Executions]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Execution statistics
 */
router.get('/stats', authenticate, authorize('execution:read'), executionController.getExecutionStats);

/**
 * @swagger
 * /api/v1/executions/{executionId}:
 *   get:
 *     summary: Get execution status
 *     tags: [Executions]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: executionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Execution ID
 *     responses:
 *       200:
 *         description: Execution status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 execution:
 *                   $ref: '#/components/schemas/Execution'
 *                 links:
 *                   type: object
 *       404:
 *         description: Execution not found
 */
router.get('/:executionId', 
  authenticate, 
  authorize('execution:read'), 
  validateRequest({ params: commonSchemas.executionId }),
  executionController.getExecutionStatus
);

/**
 * @swagger
 * /api/v1/executions/{executionId}/results:
 *   get:
 *     summary: Get execution results
 *     tags: [Executions]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: executionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Execution ID
 *     responses:
 *       200:
 *         description: Execution results
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
 *                 completedAt:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: Execution not found
 *       409:
 *         description: Execution not completed yet
 */
router.get('/:executionId/results', 
  authenticate, 
  authorize('execution:read'), 
  validateRequest({ params: commonSchemas.executionId }),
  executionController.getExecutionResults
);

/**
 * @swagger
 * /api/v1/executions/{executionId}/logs:
 *   get:
 *     summary: Get execution logs
 *     tags: [Executions]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: executionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Execution logs
 *       404:
 *         description: Execution not found
 */
router.get('/:executionId/logs', 
  authenticate, 
  authorize('execution:read'), 
  validateRequest({ params: commonSchemas.executionId }),
  executionController.getExecutionLogs
);

/**
 * @swagger
 * /api/v1/executions/{executionId}/cancel:
 *   post:
 *     summary: Cancel a running execution
 *     tags: [Executions]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: executionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Execution cancelled
 *       404:
 *         description: Execution not found
 *       409:
 *         description: Cannot cancel execution
 */
router.post('/:executionId/cancel', 
  authenticate, 
  authorize('execution:cancel'), 
  validateRequest({ params: commonSchemas.executionId }),
  executionController.cancelExecution
);

/**
 * @swagger
 * /api/v1/executions/admin/all:
 *   get:
 *     summary: Get all executions (admin only)
 *     tags: [Executions]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: All executions
 *       403:
 *         description: Admin access required
 */
router.get('/admin/all', 
  authenticate, 
  requireAdmin, 
  validateRequest({ query: commonSchemas.pagination }),
  executionController.getAllExecutions
);

export { router as executionRoutes };