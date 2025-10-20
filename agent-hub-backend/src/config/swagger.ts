import { Application } from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AgentHub API Gateway',
      version: '1.0.0',
      description: 'REST API for AgentHub - Execute and manage AI agents programmatically',
      contact: {
        name: 'AgentHub Team',
        email: 'support@agenthub.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://api.agenthub.com' 
          : `http://localhost:${process.env.PORT || 3001}`,
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'API key for authentication'
        },
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token for authentication'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message'
            },
            code: {
              type: 'string',
              description: 'Error code'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Error timestamp'
            },
            requestId: {
              type: 'string',
              description: 'Request ID for tracking'
            }
          }
        },
        Agent: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique agent identifier'
            },
            name: {
              type: 'string',
              description: 'Agent name'
            },
            description: {
              type: 'string',
              description: 'Agent description'
            },
            category: {
              type: 'string',
              description: 'Agent category'
            },
            version: {
              type: 'string',
              description: 'Agent version'
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive', 'deprecated'],
              description: 'Agent status'
            }
          }
        },
        Execution: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique execution identifier'
            },
            agentId: {
              type: 'string',
              description: 'Agent identifier'
            },
            status: {
              type: 'string',
              enum: ['queued', 'running', 'completed', 'failed', 'timeout'],
              description: 'Execution status'
            },
            progress: {
              type: 'number',
              minimum: 0,
              maximum: 100,
              description: 'Execution progress percentage'
            },
            startedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Execution start time'
            },
            completedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Execution completion time'
            },
            duration: {
              type: 'number',
              description: 'Execution duration in milliseconds'
            }
          }
        },
        ApiKey: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'API key identifier'
            },
            name: {
              type: 'string',
              description: 'API key name'
            },
            permissions: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'API key permissions'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            expiresAt: {
              type: 'string',
              format: 'date-time',
              description: 'Expiration timestamp'
            },
            lastUsedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last usage timestamp'
            }
          }
        }
      }
    },
    security: [
      {
        ApiKeyAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'], // paths to files containing OpenAPI definitions
};

const specs = swaggerJsdoc(options);

export const swaggerSetup = (app: Application) => {
  // Swagger UI
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'AgentHub API Documentation'
  }));

  // OpenAPI JSON
  app.get('/api/openapi.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });
};