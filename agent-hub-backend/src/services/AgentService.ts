import { Agent, AgentData } from '../models/Agent';
import { logger } from '../utils/logger';

export class AgentService {
  private agents: Map<string, Agent> = new Map();

  constructor() {
    this.initializeMockAgents();
  }

  /**
   * Get all available agents
   */
  async getAllAgents(): Promise<Agent[]> {
    return Array.from(this.agents.values()).filter(agent => agent.isAvailable());
  }

  /**
   * Get agent by ID
   */
  async getAgent(agentId: string): Promise<Agent | null> {
    const agent = this.agents.get(agentId);
    return agent && agent.isAvailable() ? agent : null;
  }

  /**
   * Get agents by category
   */
  async getAgentsByCategory(category: string): Promise<Agent[]> {
    return Array.from(this.agents.values())
      .filter(agent => agent.isAvailable() && agent.category === category);
  }

  /**
   * Search agents by name or description
   */
  async searchAgents(query: string): Promise<Agent[]> {
    const searchTerm = query.toLowerCase();
    return Array.from(this.agents.values())
      .filter(agent => 
        agent.isAvailable() && 
        (agent.name.toLowerCase().includes(searchTerm) || 
         agent.description.toLowerCase().includes(searchTerm))
      );
  }

  /**
   * Check if user can execute agent
   */
  async canUserExecuteAgent(agentId: string, userRole: string): Promise<boolean> {
    const agent = await this.getAgent(agentId);
    return agent ? agent.canExecute(userRole) : false;
  }

  /**
   * Validate agent input
   */
  async validateAgentInput(agentId: string, input: Record<string, any>): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const agent = await this.getAgent(agentId);
    if (!agent) {
      return { valid: false, errors: ['Agent not found'] };
    }

    return agent.validateInput(input);
  }

  /**
   * Initialize mock agents (replace with database integration)
   */
  private initializeMockAgents(): void {
    const mockAgents: AgentData[] = [
      {
        id: 'qe-test-generator-v2',
        name: 'QE Test Generator Pro',
        description: 'Generate comprehensive test suites from requirements using advanced AI',
        category: 'QE & Testing',
        version: '2.1.0',
        status: 'active',
        inputSchema: {
          type: 'object',
          required: ['requirements', 'framework'],
          properties: {
            requirements: {
              type: 'string',
              description: 'Test requirements or user stories'
            },
            framework: {
              type: 'string',
              enum: ['cypress', 'selenium', 'playwright', 'jest'],
              description: 'Testing framework to use'
            },
            language: {
              type: 'string',
              enum: ['typescript', 'javascript', 'python'],
              default: 'typescript',
              description: 'Programming language for tests'
            },
            coverage: {
              type: 'string',
              enum: ['basic', 'comprehensive', 'full'],
              default: 'comprehensive',
              description: 'Test coverage level'
            }
          }
        },
        outputSchema: {
          type: 'object',
          properties: {
            testFiles: {
              type: 'array',
              items: { type: 'object' },
              description: 'Generated test files'
            },
            coverageReport: {
              type: 'object',
              description: 'Test coverage analysis'
            },
            executionTime: {
              type: 'number',
              description: 'Estimated execution time in seconds'
            }
          }
        },
        executionConfig: {
          defaultTimeout: 120,
          maxTimeout: 300,
          requiresAuth: true,
          allowedRoles: ['admin', 'user']
        },
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15')
      },
      {
        id: 'devops-monitor-v1',
        name: 'DevOps Infrastructure Monitor',
        description: 'Analyze and optimize cloud infrastructure costs and performance',
        category: 'DevOps',
        version: '1.3.0',
        status: 'active',
        inputSchema: {
          type: 'object',
          required: ['cloudProvider', 'analysisType'],
          properties: {
            cloudProvider: {
              type: 'string',
              enum: ['aws', 'azure', 'gcp'],
              description: 'Cloud provider to analyze'
            },
            analysisType: {
              type: 'string',
              enum: ['cost', 'performance', 'security', 'all'],
              description: 'Type of analysis to perform'
            },
            accountId: {
              type: 'string',
              description: 'Cloud account ID (optional)'
            },
            timeRange: {
              type: 'string',
              enum: ['1d', '7d', '30d', '90d'],
              default: '30d',
              description: 'Analysis time range'
            }
          }
        },
        outputSchema: {
          type: 'object',
          properties: {
            monthlySavings: {
              type: 'number',
              description: 'Potential monthly savings in USD'
            },
            recommendations: {
              type: 'array',
              items: { type: 'object' },
              description: 'Optimization recommendations'
            },
            riskAssessment: {
              type: 'object',
              description: 'Risk analysis of current setup'
            }
          }
        },
        executionConfig: {
          defaultTimeout: 180,
          maxTimeout: 600,
          requiresAuth: true,
          allowedRoles: ['admin', 'user']
        },
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-10')
      },
      {
        id: 'security-scanner-v1',
        name: 'Security Vulnerability Scanner',
        description: 'Comprehensive security vulnerability assessment and compliance checking',
        category: 'Security',
        version: '1.0.0',
        status: 'active',
        inputSchema: {
          type: 'object',
          required: ['targetType'],
          properties: {
            targetType: {
              type: 'string',
              enum: ['kubernetes', 'docker', 'code', 'infrastructure'],
              description: 'Type of target to scan'
            },
            scanDepth: {
              type: 'string',
              enum: ['basic', 'comprehensive', 'deep'],
              default: 'comprehensive',
              description: 'Depth of security scan'
            },
            complianceFramework: {
              type: 'string',
              enum: ['SOC2', 'HIPAA', 'PCI', 'GDPR'],
              description: 'Compliance framework to check against'
            },
            excludePatterns: {
              type: 'array',
              items: { type: 'string' },
              description: 'Patterns to exclude from scan'
            }
          }
        },
        outputSchema: {
          type: 'object',
          properties: {
            vulnerabilities: {
              type: 'array',
              items: { type: 'object' },
              description: 'Found vulnerabilities'
            },
            complianceStatus: {
              type: 'object',
              description: 'Compliance check results'
            },
            remediationSteps: {
              type: 'array',
              items: { type: 'object' },
              description: 'Recommended remediation steps'
            }
          }
        },
        executionConfig: {
          defaultTimeout: 300,
          maxTimeout: 900,
          requiresAuth: true,
          allowedRoles: ['admin', 'user']
        },
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-05')
      },
      {
        id: 'business-analyst-v1',
        name: 'Business Intelligence Analyzer',
        description: 'Automated business intelligence and data analysis with insights generation',
        category: 'Business Intelligence',
        version: '1.2.0',
        status: 'active',
        inputSchema: {
          type: 'object',
          required: ['dataSource', 'analysisType'],
          properties: {
            dataSource: {
              type: 'string',
              enum: ['csv', 'database', 'api', 'excel'],
              description: 'Source of data to analyze'
            },
            analysisType: {
              type: 'string',
              enum: ['sales', 'customer', 'financial', 'operational'],
              description: 'Type of business analysis'
            },
            timeframe: {
              type: 'string',
              enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
              default: 'monthly',
              description: 'Analysis timeframe'
            },
            metrics: {
              type: 'array',
              items: { type: 'string' },
              description: 'Specific metrics to analyze'
            }
          }
        },
        outputSchema: {
          type: 'object',
          properties: {
            insights: {
              type: 'array',
              items: { type: 'object' },
              description: 'Business insights and findings'
            },
            recommendations: {
              type: 'array',
              items: { type: 'object' },
              description: 'Business recommendations'
            },
            visualizations: {
              type: 'array',
              items: { type: 'object' },
              description: 'Data visualizations'
            }
          }
        },
        executionConfig: {
          defaultTimeout: 240,
          maxTimeout: 600,
          requiresAuth: true,
          allowedRoles: ['admin', 'user']
        },
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-12')
      }
    ];

    // Initialize agents
    for (const agentData of mockAgents) {
      const agent = new Agent(agentData);
      this.agents.set(agent.id, agent);
    }

    logger.info('Initialized mock agents', { count: this.agents.size });
  }
}