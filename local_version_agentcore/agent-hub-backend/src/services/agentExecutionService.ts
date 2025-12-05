import { AgentTemplate, AGENT_TEMPLATES } from '../agent-templates';

export class AgentExecutionService {
  private static instance: AgentExecutionService;
  private executions: Map<string, any> = new Map();

  static getInstance(): AgentExecutionService {
    if (!AgentExecutionService.instance) {
      AgentExecutionService.instance = new AgentExecutionService();
    }
    return AgentExecutionService.instance;
  }

  getAgentConfig(agentId: string): AgentTemplate | null {
    // First check the built-in templates
    const template = AGENT_TEMPLATES.find(t => t.id === agentId);
    if (template) {
      return template;
    }

    // If not found in templates, create a basic config for known agent types
    const knownAgents: Record<string, Partial<AgentTemplate>> = {
      'test-generator': {
        id: 'test-generator',
        name: 'Test Generator',
        category: 'Testing',
        description: 'Generates test cases for code',
        purpose: 'Create comprehensive test suites'
      },
      'security-scanner': {
        id: 'security-scanner',
        name: 'Security Scanner',
        category: 'Security',
        description: 'Scans code for security vulnerabilities',
        purpose: 'Identify and report security issues'
      },
      'documentation-generator': {
        id: 'documentation-generator',
        name: 'Documentation Generator',
        category: 'Documentation',
        description: 'Generates documentation from code',
        purpose: 'Create comprehensive code documentation'
      }
    };

    const knownAgent = knownAgents[agentId];
    if (knownAgent) {
      return {
        ...knownAgent,
        inputSchema: [
          {
            name: 'source_code',
            type: 'string',
            required: true,
            description: 'Source code to process'
          }
        ],
        outputSchema: [
          {
            name: 'result',
            type: 'string',
            description: 'Processing result'
          }
        ],
        processingLogic: 'Process the input according to agent purpose'
      } as AgentTemplate;
    }

    return null;
  }

  getAllAgentConfigs(): AgentTemplate[] {
    // Return empty array to prevent hardcoded templates from appearing
    // Only S3 agents will be shown in the UI
    return [];
  }

  async executeAgent(agentId: string, input: any): Promise<any> {
    const config = this.getAgentConfig(agentId);
    if (!config) {
      throw new Error(`Agent ${agentId} not found`);
    }

    // Create execution record
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const execution: any = {
      id: executionId,
      agentId,
      input,
      status: 'running',
      startTime: new Date(),
      config
    };

    this.executions.set(executionId, execution);

    try {
      // Simulate processing (in real implementation, this would call the actual agent)
      const result = await this.processAgent(config, input);
      
      execution.status = 'completed';
      execution.result = result;
      execution.endTime = new Date();

      return {
        executionId,
        success: true,
        result
      };

    } catch (error: any) {
      execution.status = 'failed';
      execution.error = error.message;
      execution.endTime = new Date();

      throw error;
    }
  }

  private async processAgent(config: AgentTemplate, input: any): Promise<any> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Basic processing based on agent category
    switch (config.category.toLowerCase()) {
      case 'testing':
        return {
          test_cases: `// Generated tests for ${config.name}\ndescribe('${input.file_path || 'code'}', () => {\n  it('should work correctly', () => {\n    expect(true).toBe(true);\n  });\n});`,
          coverage_analysis: { lines: 85, branches: 78, functions: 92 }
        };

      case 'security':
        return {
          security_issues: [
            {
              severity: 'medium',
              title: 'Potential XSS vulnerability',
              description: 'User input should be sanitized',
              line: 42
            }
          ],
          suggestions: ['Use input validation', 'Implement proper escaping']
        };

      case 'communication':
        return {
          rephrased_content: `Professional version: ${input.email_content || input.input || 'No content provided'}`,
          improvements_made: ['Enhanced clarity', 'Professional tone', 'Better structure']
        };

      default:
        return {
          result: `Processed by ${config.name}`,
          input_received: input,
          processing_time: new Date().toISOString()
        };
    }
  }

  getExecution(executionId: string): any {
    return this.executions.get(executionId);
  }

  getAllExecutions(): any[] {
    return Array.from(this.executions.values());
  }
}