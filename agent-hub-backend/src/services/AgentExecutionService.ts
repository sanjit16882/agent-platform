import { Execution, CreateExecutionRequest } from '../models/Execution';
import { Agent } from '../models/Agent';
import { ExecutionRepository } from '../repositories/ExecutionRepository';
import { logger } from '../utils/logger';

export interface ExecutionResult {
  success: boolean;
  results?: Record<string, any>;
  error?: string;
  duration: number;
}

export class AgentExecutionService {
  private executionRepo: ExecutionRepository;
  private runningExecutions: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.executionRepo = new ExecutionRepository();
    
    // Start cleanup timer for timed out executions
    this.startTimeoutCleanup();
  }

  /**
   * Create and optionally execute an agent
   */
  async createExecution(
    userId: string, 
    apiKeyId: string | undefined, 
    request: CreateExecutionRequest
  ): Promise<Execution> {
    try {
      const execution = await this.executionRepo.create(userId, apiKeyId, request);
      
      logger.info('Execution created', {
        executionId: execution.id,
        agentId: execution.agentId,
        userId,
        sync: execution.sync
      });

      return execution;
    } catch (error) {
      logger.error('Failed to create execution:', error);
      throw error;
    }
  }

  /**
   * Execute an agent synchronously (wait for completion)
   */
  async executeSync(execution: Execution, timeoutMs?: number): Promise<ExecutionResult> {
    const startTime = Date.now();
    const timeout = timeoutMs || (execution.timeout * 1000);

    try {
      // Start the execution
      execution.start();
      await this.executionRepo.update(execution);

      logger.info('Starting synchronous execution', {
        executionId: execution.id,
        agentId: execution.agentId,
        timeout: execution.timeout
      });

      // Simulate agent execution (replace with actual agent execution logic)
      const result = await this.simulateAgentExecution(execution, timeout);

      // Update execution with results
      if (result.success) {
        execution.complete(result.results || {});
      } else {
        execution.fail(result.error || 'Unknown error');
      }

      await this.executionRepo.update(execution);

      const duration = Date.now() - startTime;
      logger.info('Synchronous execution completed', {
        executionId: execution.id,
        status: execution.status,
        duration: `${duration}ms`
      });

      return {
        success: result.success,
        results: result.results,
        error: result.error,
        duration
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      execution.fail(errorMessage);
      await this.executionRepo.update(execution);

      logger.error('Synchronous execution failed', {
        executionId: execution.id,
        error: errorMessage,
        duration: `${duration}ms`
      });

      return {
        success: false,
        error: errorMessage,
        duration
      };
    }
  }

  /**
   * Execute an agent asynchronously (return immediately)
   */
  async executeAsync(execution: Execution): Promise<void> {
    try {
      logger.info('Starting asynchronous execution', {
        executionId: execution.id,
        agentId: execution.agentId,
        timeout: execution.timeout
      });

      // Set up timeout handler
      const timeoutHandle = setTimeout(() => {
        this.handleExecutionTimeout(execution.id);
      }, execution.timeout * 1000);

      this.runningExecutions.set(execution.id, timeoutHandle);

      // Start execution in background
      this.executeInBackground(execution).catch(error => {
        logger.error('Background execution failed', {
          executionId: execution.id,
          error: error.message
        });
      });

    } catch (error) {
      logger.error('Failed to start async execution:', error);
      throw error;
    }
  }

  /**
   * Get execution status
   */
  async getExecution(executionId: string, userId: string): Promise<Execution | null> {
    try {
      const execution = await this.executionRepo.findById(executionId);
      
      if (!execution) {
        return null;
      }

      // Check ownership (users can only see their own executions)
      if (execution.userId !== userId) {
        return null;
      }

      return execution;
    } catch (error) {
      logger.error('Failed to get execution:', error);
      throw error;
    }
  }

  /**
   * Cancel a running execution
   */
  async cancelExecution(executionId: string, userId: string): Promise<boolean> {
    try {
      const execution = await this.executionRepo.findById(executionId);
      
      if (!execution || execution.userId !== userId) {
        return false;
      }

      if (!execution.isRunning()) {
        return false; // Already finished
      }

      // Cancel the execution
      execution.cancel();
      await this.executionRepo.update(execution);

      // Clear timeout if exists
      const timeoutHandle = this.runningExecutions.get(executionId);
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
        this.runningExecutions.delete(executionId);
      }

      logger.info('Execution cancelled', { executionId, userId });
      return true;
    } catch (error) {
      logger.error('Failed to cancel execution:', error);
      throw error;
    }
  }

  /**
   * Execute agent in background (async)
   */
  private async executeInBackground(execution: Execution): Promise<void> {
    try {
      // Start the execution
      execution.start();
      await this.executionRepo.update(execution);

      // Simulate agent execution
      const result = await this.simulateAgentExecution(execution, execution.timeout * 1000);

      // Update execution with results
      if (result.success) {
        execution.complete(result.results || {});
      } else {
        execution.fail(result.error || 'Unknown error');
      }

      await this.executionRepo.update(execution);

      // Clear timeout handler
      const timeoutHandle = this.runningExecutions.get(execution.id);
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
        this.runningExecutions.delete(execution.id);
      }

      logger.info('Background execution completed', {
        executionId: execution.id,
        status: execution.status
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      execution.fail(errorMessage);
      await this.executionRepo.update(execution);

      // Clear timeout handler
      const timeoutHandle = this.runningExecutions.get(execution.id);
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
        this.runningExecutions.delete(execution.id);
      }

      logger.error('Background execution failed', {
        executionId: execution.id,
        error: errorMessage
      });
    }
  }

  /**
   * Simulate agent execution (replace with actual agent execution logic)
   */
  private async simulateAgentExecution(execution: Execution, timeoutMs: number): Promise<ExecutionResult> {
    return new Promise((resolve) => {
      // Simulate processing time (1-5 seconds)
      const processingTime = Math.random() * 4000 + 1000;
      
      // Update progress periodically
      const progressInterval = setInterval(() => {
        if (execution.isRunning()) {
          const elapsed = Date.now() - (execution.startedAt?.getTime() || Date.now());
          const progress = Math.min(95, (elapsed / processingTime) * 100);
          execution.updateProgress(progress);
          
          // Update in database (async, don't wait)
          this.executionRepo.update(execution).catch(err => {
            logger.warn('Failed to update execution progress:', err);
          });
        }
      }, 500);

      setTimeout(() => {
        clearInterval(progressInterval);
        
        // Simulate success/failure (90% success rate)
        const success = Math.random() > 0.1;
        
        if (success) {
          resolve({
            success: true,
            results: {
              message: 'Agent execution completed successfully',
              data: {
                processedInputs: execution.inputs,
                timestamp: new Date().toISOString(),
                executionId: execution.id,
                agentId: execution.agentId
              },
              metrics: {
                processingTime: processingTime,
                memoryUsed: Math.round(Math.random() * 100) + 50, // MB
                cpuTime: Math.round(processingTime * 0.8) // ms
              }
            },
            duration: processingTime
          });
        } else {
          resolve({
            success: false,
            error: 'Simulated agent execution failure',
            duration: processingTime
          });
        }
      }, processingTime);
    });
  }

  /**
   * Handle execution timeout
   */
  private async handleExecutionTimeout(executionId: string): Promise<void> {
    try {
      const execution = await this.executionRepo.findById(executionId);
      
      if (execution && execution.isRunning()) {
        execution.markAsTimedOut();
        await this.executionRepo.update(execution);
        
        logger.warn('Execution timed out', {
          executionId,
          timeout: execution.timeout
        });
      }

      this.runningExecutions.delete(executionId);
    } catch (error) {
      logger.error('Failed to handle execution timeout:', error);
    }
  }

  /**
   * Start periodic cleanup of timed out executions
   */
  private startTimeoutCleanup(): void {
    setInterval(async () => {
      try {
        const timedOutExecutions = await this.executionRepo.findTimedOut();
        
        for (const execution of timedOutExecutions) {
          execution.markAsTimedOut();
          await this.executionRepo.update(execution);
          
          // Clear from running executions
          const timeoutHandle = this.runningExecutions.get(execution.id);
          if (timeoutHandle) {
            clearTimeout(timeoutHandle);
            this.runningExecutions.delete(execution.id);
          }
        }

        if (timedOutExecutions.length > 0) {
          logger.info('Cleaned up timed out executions', { count: timedOutExecutions.length });
        }
      } catch (error) {
        logger.error('Failed to cleanup timed out executions:', error);
      }
    }, 60000); // Check every minute
  }

  /**
   * Get execution statistics
   */
  async getExecutionStats(userId?: string): Promise<{
    total: number;
    queued: number;
    running: number;
    completed: number;
    failed: number;
    timeout: number;
    cancelled: number;
  }> {
    return this.executionRepo.getStats(userId);
  }
}