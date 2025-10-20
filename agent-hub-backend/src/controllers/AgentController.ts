import { Request, Response } from 'express';
import Joi from 'joi';
import { AgentService } from '../services/AgentService';
import { AgentExecutionService } from '../services/AgentExecutionService';
import { CreateExecutionRequest } from '../models/Execution';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export class AgentController {
  private agentService: AgentService;
  private executionService: AgentExecutionService;

  constructor() {
    this.agentService = new AgentService();
    this.executionService = new AgentExecutionService();
  }

  /**
   * Validation schema for agent execution
   */
  private executeAgentSchema = Joi.object({
    inputs: Joi.object().required()
      .description('Input parameters for the agent'),
    sync: Joi.boolean().optional().default(false)
      .description('Whether to execute synchronously'),
    timeout: Joi.number().integer().min(1).max(3600).optional()
      .description('Execution timeout in seconds'),
    metadata: Joi.object().optional()
      .description('Additional metadata for the execution')
  });

  /**
   * Get all available agents
   */
  getAllAgents = asyncHandler(async (req: Request, res: Response) => {
    const category = req.query.category as string;
    const search = req.query.search as string;

    try {
      let agents;

      if (search) {
        agents = await this.agentService.searchAgents(search);
      } else if (category) {
        agents = await this.agentService.getAgentsByCategory(category);
      } else {
        agents = await this.agentService.getAllAgents();
      }

      // Get unique categories for filtering
      const allAgents = await this.agentService.getAllAgents();
      const categories = [...new Set(allAgents.map(agent => agent.category))];

      res.json({
        agents: agents.map(agent => agent.toResponse()),
        categories,
        total: agents.length,
        filters: {
          category: category || null,
          search: search || null
        }
      });
    } catch (error) {
      logger.error('Failed to get agents:', error);
      throw new AppError('Failed to retrieve agents', 500, 'RETRIEVAL_FAILED');
    }
  });

  /**
   * Get specific agent details
   */
  getAgent = asyncHandler(async (req: Request, res: Response) => {
    const { agentId } = req.params;

    try {
      const agent = await this.agentService.getAgent(agentId);
      
      if (!agent) {
        throw new AppError('Agent not found', 404, 'AGENT_NOT_FOUND');
      }

      // Check if user can execute this agent
      const canExecute = req.user ? 
        await this.agentService.canUserExecuteAgent(agentId, req.user.role) : 
        false;

      res.json({
        agent: agent.toResponse(),
        canExecute,
        executionInfo: {
          defaultTimeout: agent.getDefaultTimeout(),
          maxTimeout: agent.getMaxTimeout(),
          requiresAuth: agent.executionConfig.requiresAuth,
          allowedRoles: agent.executionConfig.allowedRoles
        }
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Failed to get agent:', error);
      throw new AppError('Failed to retrieve agent', 500, 'RETRIEVAL_FAILED');
    }
  });

  /**
   * Execute an agent
   */
  executeAgent = asyncHandler(async (req: Request, res: Response) => {
    const { agentId } = req.params;

    // Validate request body
    const { error, value } = this.executeAgentSchema.validate(req.body);
    if (error) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR', {
        details: error.details.map(d => d.message)
      });
    }

    if (!req.user || !req.apiKey) {
      throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
    }

    try {
      // Get and validate agent
      const agent = await this.agentService.getAgent(agentId);
      if (!agent) {
        throw new AppError('Agent not found', 404, 'AGENT_NOT_FOUND');
      }

      // Check if user can execute this agent
      const canExecute = await this.agentService.canUserExecuteAgent(agentId, req.user.role);
      if (!canExecute) {
        throw new AppError(
          `User role '${req.user.role}' cannot execute this agent`,
          403,
          'EXECUTION_FORBIDDEN',
          { userRole: req.user.role, allowedRoles: agent.executionConfig.allowedRoles }
        );
      }

      // Validate agent inputs
      const inputValidation = await this.agentService.validateAgentInput(agentId, value.inputs);
      if (!inputValidation.valid) {
        throw new AppError('Invalid agent inputs', 400, 'INVALID_INPUTS', {
          errors: inputValidation.errors
        });
      }

      // Validate timeout
      const requestedTimeout = value.timeout || agent.getDefaultTimeout();
      if (requestedTimeout > agent.getMaxTimeout()) {
        throw new AppError(
          `Timeout exceeds maximum allowed (${agent.getMaxTimeout()}s)`,
          400,
          'TIMEOUT_EXCEEDED',
          { requested: requestedTimeout, maximum: agent.getMaxTimeout() }
        );
      }

      const executionRequest: CreateExecutionRequest = {
        agentId,
        inputs: value.inputs,
        sync: value.sync,
        timeout: requestedTimeout,
        metadata: value.metadata
      };

      // Create execution
      const execution = await this.executionService.createExecution(
        req.user.id,
        req.apiKey.id,
        executionRequest
      );

      logger.info('Agent execution requested', {
        executionId: execution.id,
        agentId,
        userId: req.user.id,
        sync: execution.sync
      });

      if (execution.sync) {
        // Synchronous execution - wait for completion
        const result = await this.executionService.executeSync(execution);
        
        res.json({
          executionId: execution.id,
          status: execution.status,
          results: result.results,
          error: result.error,
          duration: result.duration,
          sync: true
        });
      } else {
        // Asynchronous execution - return immediately
        await this.executionService.executeAsync(execution);
        
        res.status(202).json({
          executionId: execution.id,
          status: 'queued',
          message: 'Execution started',
          statusUrl: `/api/v1/executions/${execution.id}`,
          resultsUrl: `/api/v1/executions/${execution.id}/results`,
          sync: false
        });
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Failed to execute agent:', error);
      throw new AppError('Agent execution failed', 500, 'EXECUTION_FAILED');
    }
  });

  /**
   * Get agent categories
   */
  getCategories = asyncHandler(async (req: Request, res: Response) => {
    try {
      const agents = await this.agentService.getAllAgents();
      const categories = [...new Set(agents.map(agent => agent.category))];
      
      // Count agents per category
      const categoryCounts = categories.map(category => ({
        name: category,
        count: agents.filter(agent => agent.category === category).length
      }));

      res.json({
        categories: categoryCounts,
        total: categories.length
      });
    } catch (error) {
      logger.error('Failed to get categories:', error);
      throw new AppError('Failed to retrieve categories', 500, 'RETRIEVAL_FAILED');
    }
  });

  /**
   * Get agent execution statistics
   */
  getAgentStats = asyncHandler(async (req: Request, res: Response) => {
    const { agentId } = req.params;

    try {
      const agent = await this.agentService.getAgent(agentId);
      if (!agent) {
        throw new AppError('Agent not found', 404, 'AGENT_NOT_FOUND');
      }

      // Get execution statistics for this agent
      // This would need to be implemented in the execution service
      const stats = {
        totalExecutions: 0,
        successRate: 0,
        averageDuration: 0,
        lastExecution: null
      };

      res.json({
        agentId,
        stats
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Failed to get agent stats:', error);
      throw new AppError('Failed to retrieve agent statistics', 500, 'RETRIEVAL_FAILED');
    }
  });
}