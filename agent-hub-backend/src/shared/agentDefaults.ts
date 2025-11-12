/**
 * Agent Defaults Configuration
 * Single source of truth for agent metadata, names, and categories
 */

export const AGENT_NAMES: Record<string, string> = {
  'qe-test-generator-v2': 'QE Test Generator Pro',
  'devops-monitor-v1': 'DevOps Infrastructure Monitor',
  'security-scanner-v1': 'Security Vulnerability Scanner',
  'business-analyst-v1': 'Business Data Analyst',
  'github-mcp': 'GitHub MCP Agent',
  'slack-mcp': 'Slack Integration Agent',
  'aws-cost-optimizer': 'AWS Cost Optimizer',
  'code-reviewer': 'Code Review Assistant',
  'data-pipeline': 'Data Pipeline Builder'
};

export const AGENT_CATEGORIES: Record<string, string> = {
  'qe': 'QE',
  'test': 'QE',
  'devops': 'DevOps',
  'monitor': 'DevOps',
  'security': 'Security',
  'scanner': 'Security',
  'business': 'Business',
  'analyst': 'Business',
  'mcp': 'Integration',
  'github': 'Integration',
  'slack': 'Integration',
  'aws': 'Cloud',
  'cost': 'FinOps',
  'code': 'Development',
  'data': 'Data Engineering'
};

export const DEFAULT_CAPABILITIES = [
  'Natural language task understanding',
  'Dynamic execution strategy',
  'Platform integration detection',
  'Real-time result generation',
  'Context-aware processing'
];

export class AgentDefaultsService {
  /**
   * Get agent name from ID with fallback
   */
  static getAgentName(agentId: string): string {
    if (AGENT_NAMES[agentId]) {
      return AGENT_NAMES[agentId];
    }
    
    // Generate name from ID
    return agentId
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Get agent category from ID with fallback
   */
  static getAgentCategory(agentId: string): string {
    const lowerCaseId = agentId.toLowerCase();
    
    // Check each category keyword
    for (const [keyword, category] of Object.entries(AGENT_CATEGORIES)) {
      if (lowerCaseId.includes(keyword)) {
        return category;
      }
    }
    
    return 'General';
  }

  /**
   * Generate default agent info when agent is not found
   */
  static getDefaultAgentInfo(agentId: string) {
    return {
      id: agentId,
      agent_id: agentId,
      name: this.getAgentName(agentId),
      description: 'AI-powered agent for intelligent task execution',
      category: this.getAgentCategory(agentId),
      type: 'dynamic',
      status: 'active',
      capabilities: DEFAULT_CAPABILITIES,
      usage_count: 0,
      average_rating: 0,
      created_at: new Date().toISOString(),
      tags: [this.getAgentCategory(agentId).toLowerCase()]
    };
  }
}
