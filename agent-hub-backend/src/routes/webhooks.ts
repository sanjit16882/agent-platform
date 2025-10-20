import { Router } from 'express';

const router = Router();

/**
 * @swagger
 * /api/v1/webhooks:
 *   post:
 *     summary: Create a webhook
 *     tags: [Webhooks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *                 format: uri
 *                 description: Webhook URL
 *               events:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Events to subscribe to
 *     responses:
 *       201:
 *         description: Webhook created
 */
router.post('/', (req, res) => {
  res.status(501).json({
    error: 'Not implemented',
    message: 'Webhook creation will be implemented in task 5'
  });
});

/**
 * @swagger
 * /api/v1/webhooks:
 *   get:
 *     summary: List webhooks
 *     tags: [Webhooks]
 *     responses:
 *       200:
 *         description: List of webhooks
 */
router.get('/', (req, res) => {
  res.status(501).json({
    error: 'Not implemented',
    message: 'Webhook listing will be implemented in task 5'
  });
});

export { router as webhookRoutes };