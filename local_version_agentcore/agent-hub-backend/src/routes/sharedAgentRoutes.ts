/**
 * Shared Agent Routes - Single Source of Truth
 * All server implementations use these handlers to ensure consistency
 */

import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { 
  AgentExecutionRequest, 
  AgentExecutionResponse, 
  AgentInfo,
  HybridAgentRequest,
  APIResponse 
} from '../shared/types';
import { AgentDefaultsService } from '../shared/agentDefaults';

/**
 * Shared Agent Route Handlers
 * These handlers contain the core business logic
 */
export class SharedAgentHandlers {
  private executionService: any;
  private createdAgents: Map<string, any>;
  private s3Storage: any;
  private callBedrock: any;

  constructor(dependencies: {
    executionService?: any;
    createdAgents: Map<string, any>;
    s3Storage?: any;
    callBedrock?: any;
  }) {
    this.executionService = dependencies.executionService;
    this.createdAgents = dependencies.createdAgents;
    this.s3Storage = dependencies.s3Storage;
    this.callBedrock = dependencies.callBedrock;
  }

  /**
   * GET /api/v1/agents/:agentId
   * Get specific agent information
   */
  getAgent = async (req: Request, res: Response): Promise<void> => {
    try {
      const { agentId } = req.params;
      console.log(`🔍 Fetching agent: ${agentId}`);

      // 1. Check built-in agents (if executionService available)
      if (this.executionService) {
        try {
          const builtInAgent = this.executionService.getAgentConfig(agentId);
          if (builtInAgent) {
            console.log(`✅ Found built-in agent: ${agentId}`);
            res.json({
              success: true,
              data: {
                id: agentId,
                agent_id: agentId,
                name: builtInAgent.name,
                description: builtInAgent.description,
                category: builtInAgent.category,
                type: 'built-in',
                status: 'active',
                capabilities: builtInAgent.capabilities || [],
                inputSchema: builtInAgent.inputSchema,
                outputSchema: builtInAgent.outputSchema
              }
            });
            return;
          }
        } catch (err) {
          console.log(`ℹ️  Agent ${agentId} not found in built-in agents`);
        }
      }

      // 2. Check hybrid/created agents
      if (this.createdAgents.has(agentId)) {
        const agent = this.createdAgents.get(agentId);
        console.log(`✅ Found hybrid agent: ${agentId}`);
        res.json({
          success: true,
          data: {
            id: agent.id,
            agent_id: agent.id,
            name: agent.name,
            description: agent.description,
            category: agent.category,
            type: agent.type || 'hybrid',
            status: 'active',
            capabilities: agent.capabilities || [],
            usage_count: agent.usage_count || 0,
            average_rating: agent.average_rating || 0,
            created_at: agent.created,
            inputSchema: agent.inputSchema,
            outputSchema: agent.outputSchema,
            processingLogic: agent.processingLogic,
            mcpIntegration: agent.mcpIntegration
          }
        });
        return;
      }

      // 3. Check S3 storage (if available)
      if (this.s3Storage) {
        try {
          const s3Agent = await this.s3Storage.getAgent(agentId);
          if (s3Agent) {
            console.log(`✅ Found agent in S3: ${agentId}`);
            res.json({
              success: true,
              data: s3Agent
            });
            return;
          }
        } catch (err) {
          console.log(`ℹ️  Agent ${agentId} not found in S3`);
        }
      }

      // 4. Return default agent info (always succeed, never 404)
      console.log(`ℹ️  Using default info for agent: ${agentId}`);
      const defaultInfo = AgentDefaultsService.getDefaultAgentInfo(agentId);
      
      res.json({
        success: true,
        data: defaultInfo
      });

    } catch (error) {
      console.error('❌ Error fetching agent:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch agent information',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * GET /api/v1/agents
   * List all available agents
   */
  listAgents = async (req: Request, res: Response): Promise<void> => {
    try {
      const agents: AgentInfo[] = [];

      // 1. Get built-in agents
      if (this.executionService) {
        try {
          const builtInAgents = this.executionService.getAllAgentConfigs();
          agents.push(...builtInAgents.map((agent: any) => ({
            id: agent.id,
            agent_id: agent.id,
            name: agent.name,
            description: agent.description,
            category: agent.category,
            type: 'built-in',
            status: 'active',
            capabilities: agent.capabilities || [],
            usage_count: 0,
            average_rating: 0
          })));
        } catch (err) {
          console.log('ℹ️  No built-in agents available');
        }
      }

      // 2. Get hybrid/created agents
      const hybridAgents = Array.from(this.createdAgents.values()).map(agent => ({
        id: agent.id,
        agent_id: agent.id,
        name: agent.name,
        description: agent.description,
        category: agent.category,
        type: agent.type || 'hybrid',
        status: 'active',
        capabilities: agent.capabilities || [],
        usage_count: agent.usage_count || 0,
        average_rating: agent.average_rating || 0,
        created_at: agent.created,
        tags: agent.tags || []
      }));
      agents.push(...hybridAgents);

      // 3. Get S3 agents (if available)
      if (this.s3Storage) {
        try {
          const s3Agents = await this.s3Storage.listAgents();
          if (s3Agents && s3Agents.length > 0) {
            agents.push(...s3Agents);
          }
        } catch (err) {
          console.log('ℹ️  No S3 agents available');
        }
      }

      res.json({
        success: true,
        data: agents,
        count: agents.length
      });

    } catch (error) {
      console.error('❌ Error listing agents:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to list agents',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * POST /api/v1/agents/:agentId/execute
   * Execute an agent with dynamic AI processing
   */
  executeAgent = async (req: Request, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      const { agentId } = req.params;
      const { taskDescription, inputs, context } = req.body as AgentExecutionRequest;

      console.log(`🚀 Executing agent: ${agentId}`);
      console.log(`📝 Task: ${taskDescription.substring(0, 100)}...`);

      const executionId = uuidv4();

      // Try to execute with real Bedrock if available
      if (this.callBedrock) {
        try {
          const prompt = this.buildExecutionPrompt(agentId, taskDescription, inputs);
          const bedrockResponse = await this.callBedrock(prompt);
          
          const duration = Date.now() - startTime;
          const response: AgentExecutionResponse = {
            success: true,
            executionId,
            status: 'completed',
            results: {
              summary: `Successfully executed ${agentId} using AI`,
              mainOutput: bedrockResponse.output || bedrockResponse,
              recommendations: this.extractRecommendations(bedrockResponse),
              nextSteps: this.extractNextSteps(bedrockResponse)
            },
            metadata: {
              duration,
              model: 'amazon.titan-text-express-v1',
              tokensUsed: bedrockResponse.tokensUsed,
              platformActions: []
            }
          };

          res.json(response);
          return;
        } catch (bedrockError) {
          console.warn('⚠️  Bedrock execution failed, using fallback:', bedrockError);
        }
      }

      // Fallback: Use execution service or mock response
      if (this.executionService) {
        try {
          const result = await this.executionService.executeAgent(agentId, inputs, context);
          const duration = Date.now() - startTime;
          
          const response: AgentExecutionResponse = {
            success: true,
            executionId,
            status: 'completed',
            results: result.results || {
              summary: result.summary || 'Execution completed',
              mainOutput: result.output || result.mainOutput || 'Task completed successfully'
            },
            metadata: {
              duration,
              model: result.model || 'execution-service',
              platformActions: result.platformActions || []
            }
          };

          res.json(response);
          return;
        } catch (serviceError) {
          console.warn('⚠️  Execution service failed, using mock:', serviceError);
        }
      }

      // Final fallback: Mock response
      const duration = Date.now() - startTime;
      const mockResponse: AgentExecutionResponse = {
        success: true,
        executionId,
        status: 'completed',
        results: {
          summary: `Mock execution of ${agentId} completed successfully`,
          mainOutput: this.generateMockOutput(agentId, taskDescription),
          recommendations: [
            'Review the generated output',
            'Test in a staging environment',
            'Monitor performance metrics'
          ],
          nextSteps: [
            'Validate the results',
            'Deploy to production',
            'Set up monitoring'
          ]
        },
        metadata: {
          duration,
          model: 'mock-execution',
          platformActions: []
        }
      };

      res.json(mockResponse);

    } catch (error) {
      console.error('❌ Execution error:', error);
      const duration = Date.now() - startTime;
      
      res.status(500).json({
        success: false,
        executionId: uuidv4(),
        status: 'failed',
        results: {
          summary: 'Execution failed',
          mainOutput: ''
        },
        metadata: {
          duration,
          model: 'error'
        },
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * POST /api/v1/agents/hybrid/create
   * Create a new hybrid agent
   */
  createHybridAgent = async (req: Request, res: Response): Promise<void> => {
    try {
      const agentRequest: HybridAgentRequest = req.body;
      
      const agentId = `hybrid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const agent = {
        id: agentId,
        name: agentRequest.name,
        description: agentRequest.description,
        category: agentRequest.category,
        type: 'hybrid',
        purpose: agentRequest.purpose,
        inputSchema: agentRequest.inputSchema,
        outputSchema: agentRequest.outputSchema,
        processingLogic: agentRequest.processingLogic,
        selectedModel: agentRequest.selectedModel || 'amazon.titan-text-express-v1',
        mcpIntegration: agentRequest.mcpIntegration,
        metadata: agentRequest.metadata,
        created: new Date().toISOString(),
        usage_count: 0,
        average_rating: 0,
        status: 'active'
      };

      // Store in memory
      this.createdAgents.set(agentId, agent);

      // Store in S3 if available
      if (this.s3Storage) {
        try {
          await this.s3Storage.saveAgent(agent);
          console.log(`✅ Agent saved to S3: ${agentId}`);
        } catch (s3Error) {
          console.warn('⚠️  Failed to save to S3:', s3Error);
        }
      }

      console.log(`✅ Created hybrid agent: ${agentId}`);

      res.json({
        success: true,
        data: agent,
        message: 'Hybrid agent created successfully'
      });

    } catch (error) {
      console.error('❌ Error creating hybrid agent:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create hybrid agent',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // Helper methods
  private buildExecutionPrompt(agentId: string, taskDescription: string, inputs: any): string {
    return `You are an AI agent (${agentId}) executing a task.

Task Description: ${taskDescription}

Additional Inputs: ${JSON.stringify(inputs, null, 2)}

Please provide:
1. A summary of what you're doing
2. The main output/result
3. Recommendations for improvement
4. Next steps to take

Format your response clearly and professionally.`;
  }

  private extractRecommendations(response: any): string[] {
    // Try to extract recommendations from AI response
    if (typeof response === 'string') {
      const lines = response.split('\n');
      const recommendations = lines
        .filter(line => line.toLowerCase().includes('recommend'))
        .slice(0, 3);
      return recommendations.length > 0 ? recommendations : [
        'Review the output carefully',
        'Test in a controlled environment',
        'Monitor for any issues'
      ];
    }
    return ['Review the generated output'];
  }

  private extractNextSteps(response: any): string[] {
    // Try to extract next steps from AI response
    if (typeof response === 'string') {
      const lines = response.split('\n');
      const steps = lines
        .filter(line => line.match(/^\d+\.|^-|^•/))
        .slice(0, 3);
      return steps.length > 0 ? steps : [
        'Validate the results',
        'Deploy changes',
        'Monitor performance'
      ];
    }
    return ['Proceed with implementation'];
  }

  private generateMockOutput(agentId: string, taskDescription: string): string {
    return `Mock Execution Result for ${agentId}

Task: ${taskDescription}

This is a simulated response. In production, this would be:
- Real AI-generated content from AWS Bedrock
- Actual execution results from the agent
- Platform-specific actions and integrations

Status: Completed Successfully
Timestamp: ${new Date().toISOString()}`;
  }
}
