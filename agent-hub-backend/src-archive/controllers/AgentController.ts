import { Request, Response } from 'express';
import { AgentExecutionService } from '../services/agentExecutionService';
import { logger } from '../utils/logger';

export class AgentController {
  private executionService: AgentExecutionService;

  constructor() {
    this.executionService = AgentExecutionService.getInstance();
  }

  getAllAgents = async (req: Request, res: Response) => {
    try {
      const { category, search } = req.query;
      let agents = this.executionService.getAllAgentConfigs();

      // Filter by category if provided
      if (category && typeof category === 'string') {
        agents = agents.filter(agent => 
          agent.category.toLowerCase() === category.toLowerCase()
        );
      }

      // Search by name or description if provided
      if (search && typeof search === 'string') {
        const searchTerm = search.toLowerCase();
        agents = agents.filter(agent => 
          agent.name.toLowerCase().includes(searchTerm) ||
          agent.capabilities.some(cap => cap.toLowerCase().includes(searchTerm))
        );
      }

      // Get categories for filtering
      const allAgents = this.executionService.getAllAgentConfigs();
      const categories = [...new Set(allAgents.map(agent => agent.category))];

      res.json({
        success: true,
        agents: agents.map(agent => ({
          id: agent.id,
          name: agent.name,
          category: agent.category,
          type: agent.type,
          capabilities: agent.capabilities,
          description: `${agent.name} - ${agent.capabilities.join(', ')}`
        })),
        categories,
        total: agents.length,
        filters: {
          category: category || null,
          search: search || null
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Failed to get agents:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve agents',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  };

  getCategories = async (req: Request, res: Response) => {
    try {
      const agents = this.executionService.getAllAgentConfigs();
      const categoryStats = agents.reduce((acc, agent) => {
        if (!acc[agent.category]) {
          acc[agent.category] = {
            name: agent.category,
            count: 0,
            agents: []
          };
        }
        acc[agent.category].count++;
        acc[agent.category].agents.push({
          id: agent.id,
          name: agent.name,
          type: agent.type
        });
        return acc;
      }, {} as any);

      res.json({
        success: true,
        categories: Object.values(categoryStats),
        total: Object.keys(categoryStats).length,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Failed to get categories:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve categories',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  };

  getAgent = async (req: Request, res: Response) => {
    try {
      const { agentId } = req.params;
      const agent = this.executionService.getAgentConfig(agentId);

      if (!agent) {
        return res.status(404).json({
          success: false,
          error: 'Agent not found',
          agentId,
          timestamp: new Date().toISOString()
        });
      }

      // Get recent executions for this agent
      const recentExecutions = this.executionService.getExecutionsByAgent(agentId)
        .slice(-5) // Last 5 executions
        .map(exec => ({
          executionId: exec.executionId,
          status: exec.status,
          startTime: exec.startTime,
          duration: exec.duration,
          success: exec.status === 'completed'
        }));

      res.json({
        success: true,
        agent: {
          id: agent.id,
          name: agent.name,
          category: agent.category,
          type: agent.type,
          capabilities: agent.capabilities,
          inputSchema: agent.inputSchema,
          outputSchema: agent.outputSchema,
          description: `${agent.name} - ${agent.capabilities.join(', ')}`
        },
        canExecute: true,
        executionInfo: {
          recentExecutions,
          totalExecutions: this.executionService.getExecutionsByAgent(agentId).length,
          averageExecutionTime: this.calculateAverageExecutionTime(agentId)
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Failed to get agent:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve agent',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  };

  getAgentStats = async (req: Request, res: Response) => {
    try {
      const { agentId } = req.params;
      const agent = this.executionService.getAgentConfig(agentId);

      if (!agent) {
        return res.status(404).json({
          success: false,
          error: 'Agent not found',
          agentId,
          timestamp: new Date().toISOString()
        });
      }

      const executions = this.executionService.getExecutionsByAgent(agentId);
      const completedExecutions = executions.filter(exec => exec.status === 'completed');
      const failedExecutions = executions.filter(exec => exec.status === 'failed');

      const stats = {
        agentId,
        agentName: agent.name,
        totalExecutions: executions.length,
        successfulExecutions: completedExecutions.length,
        failedExecutions: failedExecutions.length,
        successRate: executions.length > 0 ? (completedExecutions.length / executions.length) * 100 : 0,
        averageExecutionTime: this.calculateAverageExecutionTime(agentId),
        lastExecution: executions.length > 0 ? executions[executions.length - 1].startTime : null,
        executionTrend: this.calculateExecutionTrend(executions)
      };

      res.json({
        success: true,
        stats,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Failed to get agent stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve agent statistics',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  };

  executeAgent = async (req: Request, res: Response) => {
    try {
      const { agentId } = req.params;
      const { inputs, sync = false, timeout = 300, metadata = {} } = req.body;

      // Get user info from auth middleware (if available)
      const userId = (req as any).user?.id || 'anonymous';

      logger.info(`Executing agent ${agentId}`, {
        agentId,
        userId,
        sync,
        timeout,
        inputKeys: Object.keys(inputs || {})
      });

      // Check if agent exists
      const agent = this.executionService.getAgentConfig(agentId);
      if (!agent) {
        return res.status(404).json({
          success: false,
          error: 'Agent not found',
          agentId,
          timestamp: new Date().toISOString()
        });
      }

      // Validate inputs against agent schema (basic validation)
      if (!inputs || typeof inputs !== 'object') {
        return res.status(400).json({
          success: false,
          error: 'Invalid inputs',
          message: 'Inputs must be a valid object',
          timestamp: new Date().toISOString()
        });
      }

      // Extract common input fields
      const input = inputs.requirements || inputs.input || inputs.data || JSON.stringify(inputs);
      const analysisType = inputs.analysisType || inputs.analysis_type || metadata.analysisType;
      const outputFormat = inputs.outputFormat || inputs.output_format || metadata.outputFormat;

      // Execute the agent
      const execution = await this.executionService.executeAgent({
        agentId,
        input,
        analysisType,
        outputFormat,
        userId
      });

      if (sync) {
        // For synchronous execution, wait for completion
        // In a real implementation, you might want to poll or use WebSockets
        // For now, we'll return the execution result directly since our service is already synchronous
        res.json({
          success: true,
          executionId: execution.executionId,
          status: execution.status,
          results: execution.output,
          duration: execution.duration,
          sync: true,
          timestamp: new Date().toISOString()
        });
      } else {
        // For asynchronous execution, return execution ID and status URL
        res.status(202).json({
          success: true,
          executionId: execution.executionId,
          status: execution.status,
          message: 'Agent execution started',
          statusUrl: `/api/v1/executions/${execution.executionId}`,
          resultsUrl: `/api/v1/executions/${execution.executionId}/results`,
          timestamp: new Date().toISOString()
        });
      }

    } catch (error) {
      logger.error('Failed to execute agent:', error);
      res.status(500).json({
        success: false,
        error: 'Agent execution failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  };

  private calculateAverageExecutionTime(agentId: string): number {
    const executions = this.executionService.getExecutionsByAgent(agentId);
    const completedExecutions = executions.filter(exec => exec.duration !== undefined);
    
    if (completedExecutions.length === 0) return 0;
    
    const totalTime = completedExecutions.reduce((sum, exec) => sum + (exec.duration || 0), 0);
    return Math.round(totalTime / completedExecutions.length);
  }

  private calculateExecutionTrend(executions: any[]): string {
    if (executions.length < 2) return 'stable';
    
    // Simple trend calculation based on recent vs older executions
    const recent = executions.slice(-5);
    const older = executions.slice(-10, -5);
    
    if (older.length === 0) return 'stable';
    
    const recentSuccessRate = recent.filter(e => e.status === 'completed').length / recent.length;
    const olderSuccessRate = older.filter(e => e.status === 'completed').length / older.length;
    
    if (recentSuccessRate > olderSuccessRate + 0.1) return 'improving';
    if (recentSuccessRate < olderSuccessRate - 0.1) return 'declining';
    return 'stable';
  }
}