/**
 * Integration Tests for Agent Routes
 * Tests the complete flow from request to response
 */

import request from 'supertest';
import express from 'express';
import { registerSharedAgentRoutes, registerHealthCheck } from '../../routes/registerSharedRoutes';

describe('Agent Routes Integration Tests', () => {
  let app: express.Express;
  let createdAgents: Map<string, any>;

  beforeEach(() => {
    // Setup test app
    app = express();
    app.use(express.json());
    
    // Setup test data
    createdAgents = new Map();
    createdAgents.set('test-agent-1', {
      id: 'test-agent-1',
      name: 'Test Agent',
      description: 'A test agent',
      category: 'Testing',
      type: 'hybrid',
      created: new Date().toISOString(),
      usage_count: 0,
      average_rating: 0
    });

    // Register routes
    registerSharedAgentRoutes(app, {
      createdAgents,
      executionService: null,
      s3Storage: null,
      callBedrock: null
    });

    registerHealthCheck(app, { environment: 'test' });
  });

  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const response = await request(app).get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
      expect(response.body.environment).toBe('test');
    });
  });

  describe('GET /api/v1/agents', () => {
    it('should list all agents', async () => {
      const response = await request(app).get('/api/v1/agents');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.count).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /api/v1/agents/:agentId', () => {
    it('should return agent info for existing agent', async () => {
      const response = await request(app).get('/api/v1/agents/test-agent-1');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('test-agent-1');
      expect(response.body.data.name).toBe('Test Agent');
    });

    it('should return default info for non-existent agent', async () => {
      const response = await request(app).get('/api/v1/agents/unknown-agent');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('unknown-agent');
      expect(response.body.data.name).toBeDefined();
    });

    it('should reject invalid agentId', async () => {
      const response = await request(app).get('/api/v1/agents/');
      
      expect(response.status).toBe(404); // Express default for missing param
    });
  });

  describe('POST /api/v1/agents/:agentId/execute', () => {
    it('should execute agent with valid request', async () => {
      const response = await request(app)
        .post('/api/v1/agents/test-agent-1/execute')
        .send({
          taskDescription: 'Test task',
          inputs: {
            param1: 'value1'
          },
          context: {
            executionMode: 'test'
          }
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.executionId).toBeDefined();
      expect(response.body.status).toBe('completed');
      expect(response.body.results).toBeDefined();
      expect(response.body.metadata).toBeDefined();
    });

    it('should reject request without taskDescription', async () => {
      const response = await request(app)
        .post('/api/v1/agents/test-agent-1/execute')
        .send({
          inputs: {},
          context: { executionMode: 'test' }
        });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should reject request without inputs', async () => {
      const response = await request(app)
        .post('/api/v1/agents/test-agent-1/execute')
        .send({
          taskDescription: 'Test',
          context: { executionMode: 'test' }
        });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject request without context', async () => {
      const response = await request(app)
        .post('/api/v1/agents/test-agent-1/execute')
        .send({
          taskDescription: 'Test',
          inputs: {}
        });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject empty taskDescription', async () => {
      const response = await request(app)
        .post('/api/v1/agents/test-agent-1/execute')
        .send({
          taskDescription: '   ',
          inputs: {},
          context: { executionMode: 'test' }
        });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/agents/hybrid/create', () => {
    it('should create hybrid agent with valid data', async () => {
      const response = await request(app)
        .post('/api/v1/agents/hybrid/create')
        .send({
          name: 'New Test Agent',
          description: 'A new test agent',
          category: 'Testing'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.name).toBe('New Test Agent');
      expect(response.body.data.type).toBe('hybrid');
    });

    it('should reject creation without name', async () => {
      const response = await request(app)
        .post('/api/v1/agents/hybrid/create')
        .send({
          description: 'A test agent',
          category: 'Testing'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject creation without description', async () => {
      const response = await request(app)
        .post('/api/v1/agents/hybrid/create')
        .send({
          name: 'Test Agent',
          category: 'Testing'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject creation without category', async () => {
      const response = await request(app)
        .post('/api/v1/agents/hybrid/create')
        .send({
          name: 'Test Agent',
          description: 'A test agent'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Response Format Consistency', () => {
    it('should have consistent success response format', async () => {
      const response = await request(app).get('/api/v1/agents/test-agent-1');
      
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('data');
      expect(typeof response.body.success).toBe('boolean');
    });

    it('should have consistent error response format', async () => {
      const response = await request(app)
        .post('/api/v1/agents/test-agent-1/execute')
        .send({});
      
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('error');
      expect(response.body.success).toBe(false);
    });
  });

  describe('Cross-Route Consistency', () => {
    it('should return same agent data from different endpoints', async () => {
      // Get from list
      const listResponse = await request(app).get('/api/v1/agents');
      const agentFromList = listResponse.body.data.find((a: any) => a.id === 'test-agent-1');
      
      // Get from specific endpoint
      const getResponse = await request(app).get('/api/v1/agents/test-agent-1');
      const agentFromGet = getResponse.body.data;
      
      expect(agentFromList.id).toBe(agentFromGet.id);
      expect(agentFromList.name).toBe(agentFromGet.name);
      expect(agentFromList.description).toBe(agentFromGet.description);
    });

    it('should execute newly created agent', async () => {
      // Create agent
      const createResponse = await request(app)
        .post('/api/v1/agents/hybrid/create')
        .send({
          name: 'Executable Agent',
          description: 'Can be executed',
          category: 'Testing'
        });
      
      const agentId = createResponse.body.data.id;
      
      // Execute agent
      const executeResponse = await request(app)
        .post(`/api/v1/agents/${agentId}/execute`)
        .send({
          taskDescription: 'Test execution',
          inputs: {},
          context: { executionMode: 'test' }
        });
      
      expect(executeResponse.status).toBe(200);
      expect(executeResponse.body.success).toBe(true);
    });
  });
});
