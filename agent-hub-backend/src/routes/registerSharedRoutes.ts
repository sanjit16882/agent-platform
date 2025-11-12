/**
 * Route Registration Helper
 * Registers all shared routes with validation middleware
 */

import { Express } from 'express';
import { SharedAgentHandlers } from './sharedAgentRoutes';
import { RequestValidator } from '../shared/validation';

export interface RouteRegistrationOptions {
  executionService?: any;
  createdAgents: Map<string, any>;
  s3Storage?: any;
  callBedrock?: any;
  apiKeyValidation?: boolean;
}

/**
 * Register all shared agent routes on an Express app
 * This ensures consistency across all server implementations
 */
export function registerSharedAgentRoutes(
  app: Express, 
  options: RouteRegistrationOptions
): void {
  
  const handlers = new SharedAgentHandlers({
    executionService: options.executionService,
    createdAgents: options.createdAgents,
    s3Storage: options.s3Storage,
    callBedrock: options.callBedrock
  });

  console.log('📋 Registering shared agent routes...');

  // Agent listing and info routes
  app.get(
    '/api/v1/agents',
    handlers.listAgents
  );

  app.get(
    '/api/v1/agents/:agentId',
    RequestValidator.validateAgentId,
    handlers.getAgent
  );

  // Agent execution route with validation
  app.post(
    '/api/v1/agents/:agentId/execute',
    RequestValidator.validateAgentId,
    RequestValidator.validateAgentExecution,
    handlers.executeAgent
  );

  // Hybrid agent creation route
  app.post(
    '/api/v1/agents/hybrid/create',
    RequestValidator.validateHybridAgentCreation,
    handlers.createHybridAgent
  );

  // Hybrid agent info route
  app.get(
    '/api/v1/agents/hybrid/:agentId',
    RequestValidator.validateAgentId,
    handlers.getAgent
  );

  // Hybrid agent execution route
  app.post(
    '/api/v1/agents/hybrid/:agentId/execute',
    RequestValidator.validateAgentId,
    RequestValidator.validateAgentExecution,
    handlers.executeAgent
  );

  console.log('✅ Shared agent routes registered successfully');
}

/**
 * Health check route - can be used by all servers
 */
export function registerHealthCheck(app: Express, serverInfo: any = {}): void {
  app.get('/health', (_req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: serverInfo.version || '1.0.0',
      environment: serverInfo.environment || process.env.NODE_ENV || 'development',
      ...serverInfo
    });
  });
  
  console.log('✅ Health check route registered');
}
