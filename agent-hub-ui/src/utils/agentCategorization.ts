import { Agent } from '../types/agent';

export interface AgentCategory {
  type: 'production' | 'demo';
  title: string;
  description: string;
  icon: string;
  variant: 'active' | 'available';
}

export interface AgentCategoryStats {
  total: number;
  production: number;
  demo: number;
  hybrid: number;
  builtin: number;
  active: number;
  available: number;
}

export interface CategorizedAgents {
  activeAgents: Agent[];
  availableAgents: Agent[];
  templateAgents: Agent[];
  stats: AgentCategoryStats;
}

/**
 * Categorizes agents into active (production), available (demo), and template groups
 */
export const categorizeAgents = (agents: Agent[]): CategorizedAgents => {
  // Include ALL agent types from S3 storage as active agents
  // This includes: production, hybrid, builtin, s3_custom, custom, and any other types
  const activeAgents = agents.filter(agent => 
    agent.agent_type === 'production' || 
    agent.agent_type === 'hybrid' || 
    agent.agent_type === 'builtin' ||
    agent.agent_type === 's3_custom' ||
    agent.agent_type === 'custom' // ← ADDED: Include custom agents from S3
  );
  const availableAgents = agents.filter(agent => agent.agent_type === 'demo');
  const templateAgents = agents.filter(agent => agent.agent_type === 'template');

  const stats: AgentCategoryStats = {
    total: agents.length,
    production: agents.filter(agent => agent.agent_type === 'production').length,
    demo: availableAgents.length,
    hybrid: agents.filter(agent => agent.agent_type === 'hybrid').length,
    builtin: agents.filter(agent => agent.agent_type === 'builtin').length,
    active: activeAgents.length,
    available: availableAgents.length
  };

  return {
    activeAgents,
    availableAgents,
    templateAgents,
    stats
  };
};

/**
 * Gets category configuration for display
 */
export const getAgentCategories = (): Record<string, AgentCategory> => {
  return {
    active: {
      type: 'production',
      title: 'Active Agents',
      description: 'Production-ready agents that are fully functional and tested',
      icon: 'success',
      variant: 'active'
    },
    available: {
      type: 'demo',
      title: 'Available Agents',
      description: 'Demo agents for testing and evaluation purposes',
      icon: 'grid',
      variant: 'available'
    }
  };
};

/**
 * Determines if an agent is production-ready (active)
 */
export const isActiveAgent = (agent: Agent): boolean => {
  return agent.agent_type === 'production' || 
         agent.agent_type === 'hybrid' || 
         agent.agent_type === 'builtin';
};

/**
 * Gets visual indicator for agent status
 */
export const getAgentStatusIndicator = (agent: Agent) => {
  switch (agent.agent_type) {
    case 'production':
      return {
        variant: 'success' as const,
        text: 'Production Ready',
        icon: 'success'
      };
    case 'hybrid':
      return {
        variant: 'warning' as const,
        text: 'Hybrid Agent',
        icon: 'hybrid'
      };
    case 'builtin':
      return {
        variant: 'primary' as const,
        text: 'Built-in',
        icon: 'builtin'
      };
    case 'template':
      return {
        variant: 'warning' as const,
        text: 'Template Only',
        icon: 'template'
      };
    default:
      return {
        variant: 'info' as const,
        text: 'Demo',
        icon: 'info'
      };
  }
};

/**
 * Gets configuration status for an agent
 */
export const getConfigurationStatus = (agent: Agent) => {
  // For now, assume production agents are fully configured
  // This can be enhanced later with actual configuration tracking
  switch (agent.agent_type) {
    case 'production':
      return {
        status: 'complete' as const,
        percentage: 100,
        variant: 'success' as const,
        text: 'Fully Configured'
      };
    case 'hybrid':
      return {
        status: 'complete' as const,
        percentage: 90,
        variant: 'warning' as const,
        text: 'Hybrid Configuration'
      };
    case 'builtin':
      return {
        status: 'complete' as const,
        percentage: 100,
        variant: 'primary' as const,
        text: 'Built-in Configuration'
      };
    default:
      return {
        status: 'partial' as const,
        percentage: 60,
        variant: 'warning' as const,
        text: 'Demo Configuration'
      };
  }
};

/**
 * Filters agents by search term and category
 */
export const filterAgents = (
  agents: Agent[], 
  searchTerm: string, 
  selectedCategory: string,
  agentType?: 'production' | 'demo' | 'hybrid' | 'builtin' | 'all'
): Agent[] => {
  return agents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || agent.category === selectedCategory;
    const matchesAgentType = !agentType || agentType === 'all' || agent.agent_type === agentType;
    
    return matchesSearch && matchesCategory && matchesAgentType;
  });
};

/**
 * Sorts agents by priority (production first, then hybrid, builtin, then demo, then by usage count)
 */
export const sortAgentsByPriority = (agents: Agent[]): Agent[] => {
  const typePriority = {
    'production': 1,
    'hybrid': 2,
    's3_custom': 3,
    'custom': 3, // Same priority as s3_custom
    'builtin': 4,
    'demo': 5,
    'template': 6
  };

  return [...agents].sort((a, b) => {
    // Sort by agent type priority first
    const priorityDiff = typePriority[a.agent_type] - typePriority[b.agent_type];
    if (priorityDiff !== 0) return priorityDiff;
    
    // Then by usage count (descending)
    return b.usage_count - a.usage_count;
  });
};