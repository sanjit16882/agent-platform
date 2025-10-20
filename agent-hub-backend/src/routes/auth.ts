import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authenticate, authorize, requireAdmin } from '../middleware/authentication';
import { createApiKeyRateLimit } from '../middleware/rateLimiting';
import { validateRequest, commonSchemas } from '../middleware/validation';

const router = Router();
const authController = new AuthController();

/**
 * @swagger
 * /api/v1/auth/keys:
 *   post:
 *     summary: Generate a new API key
 *     tags: [Authentication]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: API key name for identification
 *                 example: "Production API Key"
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of permissions for the API key
 *                 example: ["agent:read", "agent:execute", "execution:read"]
 *               rateLimit:
 *                 type: number
 *                 description: Rate limit per hour
 *                 example: 1000
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *                 description: Expiration date
 *               metadata:
 *                 type: object
 *                 description: Additional metadata
 *     responses:
 *       201:
 *         description: API key created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 apiKey:
 *                   $ref: '#/components/schemas/ApiKey'
 *                 warning:
 *                   type: string
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/keys', 
  authenticate, 
  authorize('apikey:create'), 
  createApiKeyRateLimit({ maxRequests: 5, windowMs: 300000 }), // 5 keys per 5 minutes
  authController.generateApiKey
);

/**
 * @swagger
 * /api/v1/auth/keys:
 *   get:
 *     summary: List user's API keys
 *     tags: [Authentication]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: List of API keys
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 apiKeys:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ApiKey'
 *                 usage:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                     active:
 *                       type: number
 *                     expired:
 *                       type: number
 *                     revoked:
 *                       type: number
 *                 total:
 *                   type: number
 */
router.get('/keys', authenticate, authorize('apikey:read'), authController.listApiKeys);

/**
 * @swagger
 * /api/v1/auth/keys/{keyId}:
 *   get:
 *     summary: Get API key details
 *     tags: [Authentication]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: keyId
 *         required: true
 *         schema:
 *           type: string
 *         description: API key ID
 *     responses:
 *       200:
 *         description: API key details
 *       404:
 *         description: API key not found
 */
router.get('/keys/:keyId', 
  authenticate, 
  authorize('apikey:read'), 
  validateRequest({ params: commonSchemas.keyId }),
  authController.getApiKey
);

/**
 * @swagger
 * /api/v1/auth/keys/{keyId}:
 *   delete:
 *     summary: Revoke an API key
 *     tags: [Authentication]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: keyId
 *         required: true
 *         schema:
 *           type: string
 *         description: API key ID
 *     responses:
 *       200:
 *         description: API key revoked successfully
 *       404:
 *         description: API key not found
 */
router.delete('/keys/:keyId', 
  authenticate, 
  authorize('apikey:revoke'), 
  validateRequest({ params: commonSchemas.keyId }),
  authController.revokeApiKey
);

/**
 * @swagger
 * /api/v1/auth/permissions:
 *   get:
 *     summary: Get available permissions
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Available permissions and descriptions
 */
router.get('/permissions', authController.getPermissions);

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     summary: Get current user information
 *     tags: [Authentication]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Current user and API key information
 */
router.get('/me', authenticate, authController.getCurrentUser);

/**
 * @swagger
 * /api/v1/auth/admin/keys:
 *   get:
 *     summary: Get all API keys (admin only)
 *     tags: [Authentication]
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
 *     responses:
 *       200:
 *         description: All API keys with pagination
 *       403:
 *         description: Admin access required
 */
router.get('/admin/keys', 
  authenticate, 
  requireAdmin, 
  validateRequest({ query: commonSchemas.pagination }),
  authController.getAllApiKeys
);

export { router as authRoutes };