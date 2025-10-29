import { Request, Response } from 'express';
import { AgentExecutionService } from '../services/agentExecutionService';
import { ExecutionRepository } from '../repositories/ExecutionRepository';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export class ExecutionController {
  private executionService: AgentExecutionService;
  private executionRepo: ExecutionRepository;

  constructor() {
    this.executionService = AgentExecutionService.getInstance();
    this.executionRepo = new ExecutionRepository();
  }

  /**
   * Get execution status
   */
  getExecutionStatus = asyncHandler(async (req: Request, res: Response) => {
    const { executionId } = req.params;

    try {
      const execution = this.executionService.getExecution(executionId);
      
      if (!execution) {
        throw new AppError('Execution not found', 404, 'EXECUTION_NOT_FOUND');
      }

      res.json({
        success: true,
        data: execution,
        links: {
          self: `/api/v1/executions/${executionId}`,
          results: `/api/v1/executions/${executionId}/results`,
          cancel: execution.status === 'running' ? `/api/v1/executions/${executionId}/cancel` : null
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Failed to get execution status:', error);
      throw new AppError('Failed to retrieve execution status', 500, 'RETRIEVAL_FAILED');
    }
  });

  /**
   * Get execution results
   */
  getExecutionResults = asyncHandler(async (req: Request, res: Response) => {
    const { executionId } = req.params;

    if (!req.user) {
      throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
    }

    try {
      const execution = await this.executionService.getExecution(executionId, req.user.id);
      
      if (!execution) {
        throw new AppError('Execution not found', 404, 'EXECUTION_NOT_FOUND');
      }

      if (!execution.isFinished()) {
        throw new AppError(
          'Execution not completed yet',
          409,
          'EXECUTION_NOT_COMPLETED',
          { 
            status: execution.status,
            progress: execution.progress,
            statusUrl: `/api/v1/executions/${executionId}`
          }
        );
      }

      if (!execution.isSuccessful()) {
        res.json({
          executionId: execution.id,
          status: execution.status,
          error: execution.error,
          duration: execution.getDurationSeconds(),
          completedAt: execution.completedAt
        });
        return;
      }

      res.json({
        executionId: execution.id,
        status: execution.status,
        results: execution.results,
        duration: execution.getDurationSeconds(),
        completedAt: execution.completedAt,
        metadata: {
          agentId: execution.agentId,
          startedAt: execution.startedAt,
          sync: execution.sync
        }
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Failed to get execution results:', error);
      throw new AppError('Failed to retrieve execution results', 500, 'RETRIEVAL_FAILED');
    }
  });

  /**
   * Get execution logs (placeholder for future implementation)
   */
  getExecutionLogs = asyncHandler(async (req: Request, res: Response) => {
    const { executionId } = req.params;

    if (!req.user) {
      throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
    }

    try {
      const execution = await this.executionService.getExecution(executionId, req.user.id);
      
      if (!execution) {
        throw new AppError('Execution not found', 404, 'EXECUTION_NOT_FOUND');
      }

      // Placeholder for execution logs
      const logs = [
        {
          timestamp: execution.createdAt,
          level: 'info',
          message: 'Execution queued',
          details: { executionId: execution.id, agentId: execution.agentId }
        }
      ];

      if (execution.startedAt) {
        logs.push({
          timestamp: execution.startedAt,
          level: 'info',
          message: 'Execution started',
          details: { progress: 0 }
        });
      }

      if (execution.completedAt) {
        logs.push({
          timestamp: execution.completedAt,
          level: execution.isSuccessful() ? 'info' : 'error',
          message: execution.isSuccessful() ? 'Execution completed successfully' : 'Execution failed',
          details: { 
            status: execution.status,
            duration: execution.getDurationSeconds(),
            error: execution.error
          }
        });
      }

      res.json({
        executionId: execution.id,
        logs,
        total: logs.length
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Failed to get execution logs:', error);
      throw new AppError('Failed to retrieve execution logs', 500, 'RETRIEVAL_FAILED');
    }
  });

  /**
   * Cancel a running execution
   */
  cancelExecution = asyncHandler(async (req: Request, res: Response) => {
    const { executionId } = req.params;

    if (!req.user) {
      throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
    }

    try {
      const success = await this.executionService.cancelExecution(executionId, req.user.id);
      
      if (!success) {
        throw new AppError(
          'Cannot cancel execution - not found or already completed',
          409,
          'CANCELLATION_FAILED'
        );
      }

      logger.info('Execution cancelled', { executionId, userId: req.user.id });

      res.json({
        message: 'Execution cancelled successfully',
        executionId,
        status: 'cancelled'
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Failed to cancel execution:', error);
      throw new AppError('Failed to cancel execution', 500, 'CANCELLATION_FAILED');
    }
  });

  /**
   * List user's executions
   */
  listExecutions = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = (page - 1) * limit;
    const status = req.query.status as string;
    const agentId = req.query.agentId as string;

    try {
      let executions;

      if (agentId) {
        // Get executions for specific agent (need to add filtering by user)
        executions = await this.executionRepo.findByAgentId(agentId, limit, offset);
        // Filter by user (since findByAgentId doesn't filter by user)
        executions = executions.filter(exec => exec.userId === req.user!.id);
      } else {
        executions = await this.executionRepo.findByUserId(req.user.id, limit, offset);
      }

      // Filter by status if provided
      if (status) {
        executions = executions.filter(exec => exec.status === status);
      }

      // Get execution statistics
      const stats = await this.executionService.getExecutionStats(req.user.id);

      res.json({
        executions: executions.map(exec => exec.toResponse()),
        pagination: {
          page,
          limit,
          total: executions.length,
          hasMore: executions.length === limit
        },
        filters: {
          status: status || null,
          agentId: agentId || null
        },
        stats
      });
    } catch (error) {
      logger.error('Failed to list executions:', error);
      throw new AppError('Failed to retrieve executions', 500, 'RETRIEVAL_FAILED');
    }
  });

  /**
   * Get execution statistics
   */
  getExecutionStats = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
    }

    try {
      const stats = await this.executionService.getExecutionStats(req.user.id);
      
      // Calculate success rate
      const totalFinished = stats.completed + stats.failed + stats.timeout + stats.cancelled;
      const successRate = totalFinished > 0 ? (stats.completed / totalFinished) * 100 : 0;

      res.json({
        stats: {
          ...stats,
          successRate: Math.round(successRate * 100) / 100,
          totalFinished,
          active: stats.queued + stats.running
        },
        summary: {
          total: stats.total,
          active: stats.queued + stats.running,
          completed: stats.completed,
          failed: stats.failed + stats.timeout + stats.cancelled
        }
      });
    } catch (error) {
      logger.error('Failed to get execution stats:', error);
      throw new AppError('Failed to retrieve execution statistics', 500, 'RETRIEVAL_FAILED');
    }
  });

  /**
   * Admin only: Get all executions
   */
  getAllExecutions = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.isAdmin()) {
      throw new AppError('Admin access required', 403, 'ADMIN_REQUIRED');
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = (page - 1) * limit;

    try {
      // This would need to be implemented in the repository
      const executions = await this.executionRepo.findByUserId('', limit, offset); // Empty string to get all
      const totalStats = await this.executionService.getExecutionStats();

      res.json({
        executions: executions.map(exec => exec.toResponse()),
        pagination: {
          page,
          limit,
          total: executions.length,
          hasMore: executions.length === limit
        },
        stats: totalStats
      });
    } catch (error) {
      logger.error('Failed to get all executions:', error);
      throw new AppError('Failed to retrieve executions', 500, 'RETRIEVAL_FAILED');
    }
  });
}