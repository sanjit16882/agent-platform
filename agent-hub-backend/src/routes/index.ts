import { Router } from 'express';
import { authRoutes } from './auth';
import { agentRoutes } from './agents';
import { executionRoutes } from './executions';
import { webhookRoutes } from './webhooks';
import nlpRoutes from './nlp';

const router = Router();

// API version prefix
const API_VERSION = process.env.API_VERSION || 'v1';

// Mount route modules
router.use(`/${API_VERSION}/auth`, authRoutes);
router.use(`/${API_VERSION}/agents`, agentRoutes);
router.use(`/${API_VERSION}/executions`, executionRoutes);
router.use(`/${API_VERSION}/webhooks`, webhookRoutes);
router.use(`/${API_VERSION}/nlp`, nlpRoutes);

// API root endpoint
router.get('/', (req, res) => {
  res.json({
    name: 'AgentHub API Gateway',
    version: API_VERSION,
    status: 'operational',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: `/${API_VERSION}/auth`,
      agents: `/${API_VERSION}/agents`,
      executions: `/${API_VERSION}/executions`,
      webhooks: `/${API_VERSION}/webhooks`,
      nlp: `/${API_VERSION}/nlp`,
      docs: '/api/docs'
    }
  });
});

export { router as apiRoutes };