import { Router } from 'express';
import { nlpController } from '../controllers/nlpController';
import { authenticate } from '../middleware/authentication';
import { validateRequest } from '../middleware/validation';
import { rateLimit } from 'express-rate-limit';
import Joi from 'joi';

const router = Router();

// Rate limiting for NLP endpoints (more restrictive due to processing cost)
const nlpRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many NLP requests, please try again later',
      timestamp: new Date().toISOString()
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation schemas for request bodies using Joi
const processDescriptionSchema = {
  body: Joi.object({
    description: Joi.string().min(1).max(1000).required(),
    options: Joi.object({
      includeValidation: Joi.boolean().optional(),
      includeSuggestions: Joi.boolean().optional(),
      customTemplates: Joi.object().optional()
    }).optional()
  })
};

const parseIntentSchema = {
  body: Joi.object({
    description: Joi.string().min(1).max(1000).required()
  })
};

const generateConfigSchema = {
  body: Joi.object({
    intent: Joi.object({
      action: Joi.string().required(),
      sources: Joi.array().required(),
      targets: Joi.array().required(),
      schedule: Joi.object().optional(),
      conditions: Joi.array().optional(),
      parameters: Joi.object().required(),
      confidence: Joi.number().required()
    }).required()
  })
};

const validateConfigSchema = {
  body: Joi.object({
    config: Joi.object({
      name: Joi.string().required(),
      description: Joi.string().required(),
      version: Joi.string().required(),
      triggers: Joi.array().required(),
      actions: Joi.array().required(),
      connectors: Joi.array().optional(),
      parameters: Joi.array().optional()
    }).required()
  })
};

const refineConfigSchema = {
  body: Joi.object({
    config: Joi.object({
      name: Joi.string().required(),
      description: Joi.string().required(),
      version: Joi.string().required(),
      triggers: Joi.array().required(),
      actions: Joi.array().required(),
      connectors: Joi.array().optional(),
      parameters: Joi.array().optional()
    }).required(),
    refinementDescription: Joi.string().min(1).max(500).required()
  })
};

/**
 * @swagger
 * /api/nlp/process:
 *   post:
 *     summary: Process natural language description into agent configuration
 *     tags: [Natural Language Processing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - description
 *             properties:
 *               description:
 *                 type: string
 *                 description: Natural language description of the desired agent
 *                 example: "Build me an agent that syncs Jira and Slack daily at 5 PM"
 *               options:
 *                 type: object
 *                 properties:
 *                   includeValidation:
 *                     type: boolean
 *                     default: true
 *                   includeSuggestions:
 *                     type: boolean
 *                     default: true
 *     responses:
 *       200:
 *         description: Successfully processed description
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     intent:
 *                       type: object
 *                     config:
 *                       type: object
 *                     validation:
 *                       type: object
 *                     suggestions:
 *                       type: array
 *                     processingTime:
 *                       type: number
 */
router.post('/process', 
  nlpRateLimit,
  authenticate,
  validateRequest(processDescriptionSchema),
  nlpController.processDescription.bind(nlpController)
);

/**
 * @swagger
 * /api/nlp/parse-intent:
 *   post:
 *     summary: Parse natural language intent only
 *     tags: [Natural Language Processing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - description
 *             properties:
 *               description:
 *                 type: string
 *                 example: "Monitor GitHub repository for new pull requests"
 *     responses:
 *       200:
 *         description: Successfully parsed intent
 */
router.post('/parse-intent',
  nlpRateLimit,
  authenticate,
  validateRequest(parseIntentSchema),
  nlpController.parseIntent.bind(nlpController)
);

/**
 * @swagger
 * /api/nlp/generate-config:
 *   post:
 *     summary: Generate agent configuration from parsed intent
 *     tags: [Natural Language Processing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - intent
 *             properties:
 *               intent:
 *                 type: object
 *     responses:
 *       200:
 *         description: Successfully generated configuration
 */
router.post('/generate-config',
  nlpRateLimit,
  authenticate,
  validateRequest(generateConfigSchema),
  nlpController.generateConfig.bind(nlpController)
);

/**
 * @swagger
 * /api/nlp/validate-config:
 *   post:
 *     summary: Validate agent configuration
 *     tags: [Natural Language Processing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - config
 *             properties:
 *               config:
 *                 type: object
 *     responses:
 *       200:
 *         description: Configuration validation results
 */
router.post('/validate-config',
  authenticate,
  validateRequest(validateConfigSchema),
  nlpController.validateConfig.bind(nlpController)
);

/**
 * @swagger
 * /api/nlp/suggestions:
 *   post:
 *     summary: Get improvement suggestions for configuration
 *     tags: [Natural Language Processing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - config
 *             properties:
 *               config:
 *                 type: object
 *     responses:
 *       200:
 *         description: Configuration improvement suggestions
 */
router.post('/suggestions',
  authenticate,
  validateRequest(validateConfigSchema),
  nlpController.getSuggestions.bind(nlpController)
);

/**
 * @swagger
 * /api/nlp/refine-config:
 *   post:
 *     summary: Refine existing configuration with additional natural language input
 *     tags: [Natural Language Processing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - config
 *               - refinementDescription
 *             properties:
 *               config:
 *                 type: object
 *               refinementDescription:
 *                 type: string
 *                 example: "Change the schedule to run every 2 hours instead"
 *     responses:
 *       200:
 *         description: Refined configuration
 */
router.post('/refine-config',
  nlpRateLimit,
  authenticate,
  validateRequest(refineConfigSchema),
  nlpController.refineConfig.bind(nlpController)
);

/**
 * @swagger
 * /api/nlp/examples:
 *   get:
 *     summary: Get examples of natural language descriptions
 *     tags: [Natural Language Processing]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of example descriptions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     examples:
 *                       type: array
 *                       items:
 *                         type: string
 */
router.get('/examples',
  authenticate,
  nlpController.getExamples.bind(nlpController)
);

/**
 * @swagger
 * /api/nlp/capabilities:
 *   get:
 *     summary: Get supported actions and connectors
 *     tags: [Natural Language Processing]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Supported capabilities
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     actions:
 *                       type: object
 *                     connectors:
 *                       type: object
 */
router.get('/capabilities',
  authenticate,
  nlpController.getCapabilities.bind(nlpController)
);

/**
 * @swagger
 * /api/nlp/edit-config:
 *   post:
 *     summary: Edit agent configuration
 *     tags: [Natural Language Processing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - config
 *               - editRequest
 *             properties:
 *               config:
 *                 type: object
 *               editRequest:
 *                 type: object
 *                 properties:
 *                   field:
 *                     type: string
 *                   value:
 *                     type: any
 *                   operation:
 *                     type: string
 *                     enum: [update, add, remove]
 *     responses:
 *       200:
 *         description: Configuration edited successfully
 */
router.post('/edit-config',
  authenticate,
  nlpController.editConfig.bind(nlpController)
);

/**
 * @swagger
 * /api/nlp/refine-config-advanced:
 *   post:
 *     summary: Advanced configuration refinement with natural language
 *     tags: [Natural Language Processing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - originalConfig
 *               - refinementDescription
 *             properties:
 *               originalConfig:
 *                 type: object
 *               refinementDescription:
 *                 type: string
 *               preserveExisting:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       200:
 *         description: Configuration refined successfully
 */
router.post('/refine-config-advanced',
  authenticate,
  nlpController.refineConfigAdvanced.bind(nlpController)
);

/**
 * @swagger
 * /api/nlp/templates:
 *   get:
 *     summary: Get configuration templates
 *     tags: [Natural Language Processing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter templates by category
 *     responses:
 *       200:
 *         description: Templates retrieved successfully
 */
router.get('/templates',
  authenticate,
  nlpController.getTemplates.bind(nlpController)
);

/**
 * @swagger
 * /api/nlp/generate-from-template:
 *   post:
 *     summary: Generate configuration from template
 *     tags: [Natural Language Processing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - templateId
 *             properties:
 *               templateId:
 *                 type: string
 *               customizations:
 *                 type: object
 *     responses:
 *       200:
 *         description: Configuration generated from template
 */
router.post('/generate-from-template',
  authenticate,
  nlpController.generateFromTemplate.bind(nlpController)
);

/**
 * @swagger
 * /api/nlp/validate-detailed:
 *   post:
 *     summary: Detailed configuration validation
 *     tags: [Natural Language Processing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - config
 *             properties:
 *               config:
 *                 type: object
 *     responses:
 *       200:
 *         description: Detailed validation results
 */
router.post('/validate-detailed',
  authenticate,
  nlpController.validateConfigDetailed.bind(nlpController)
);

/**
 * Simple test endpoint without authentication
 */
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'NLP service is working!',
    timestamp: new Date().toISOString(),
    endpoints: [
      'POST /api/v1/nlp/process',
      'POST /api/v1/nlp/parse-intent',
      'POST /api/v1/nlp/generate-config',
      'POST /api/v1/nlp/validate-config',
      'POST /api/v1/nlp/suggestions',
      'POST /api/v1/nlp/refine-config',
      'POST /api/v1/nlp/edit-config',
      'POST /api/v1/nlp/refine-config-advanced',
      'POST /api/v1/nlp/generate-from-template',
      'POST /api/v1/nlp/validate-detailed',
      'GET /api/v1/nlp/examples',
      'GET /api/v1/nlp/capabilities',
      'GET /api/v1/nlp/templates'
    ]
  });
});

export default router;