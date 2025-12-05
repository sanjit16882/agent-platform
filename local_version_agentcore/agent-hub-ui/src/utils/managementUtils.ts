import { Agent, AgentStatus, DeploymentStatus, HealthStatus, BulkOperation } from '../types/management';

// Status utility functions
export const getStatusColor = (status: AgentStatus): string => {
  switch (status) {
    case 'deployed': return 'success';
    case 'validated': return 'primary';
    case 'pending_validation': return 'warning';
    case 'validation_failed': return 'danger';
    case 'draft': return 'secondary';
    case 'inactive': return 'secondary';
    default: return 'secondary';
  }
};

export const getStatusText = (status: AgentStatus): string => {
  switch (status) {
    case 'deployed': return 'Deployed';
    case 'validated': return 'Validated';
    case 'pending_validation': return 'Pending Validation';
    case 'validation_failed': return 'Validation Failed';
    case 'draft': return 'Draft';
    case 'inactive': return 'Stopped';
    default: return 'Unknown';
  }
};

export const getDeploymentStatusColor = (status: DeploymentStatus): string => {
  switch (status) {
    case 'deployed': return 'success';
    case 'deploying': return 'warning';
    case 'failed': return 'danger';
    case 'not_deployed': return 'secondary';
    default: return 'secondary';
  }
};

export const getDeploymentStatusText = (status: DeploymentStatus): string => {
  switch (status) {
    case 'deployed': return 'Live';
    case 'deploying': return 'Deploying';
    case 'failed': return 'Failed';
    case 'not_deployed': return 'Offline';
    default: return 'Unknown';
  }
};

export const getHealthStatusColor = (status: HealthStatus): string => {
  switch (status) {
    case 'healthy': return 'success';
    case 'degraded': return 'warning';
    case 'unhealthy': return 'danger';
    case 'unknown': return 'secondary';
    default: return 'secondary';
  }
};

export const getHealthStatusText = (status: HealthStatus): string => {
  switch (status) {
    case 'healthy': return 'Healthy';
    case 'degraded': return 'Degraded';
    case 'unhealthy': return 'Unhealthy';
    case 'unknown': return 'Unknown';
    default: return 'Unknown';
  }
};

// Agent utility functions
export const getAgentCategories = (agents: Agent[]): string[] => {
  const categories = new Set(agents.map(agent => agent.category));
  return Array.from(categories).sort();
};

export const getAgentStatuses = (agents: Agent[]): AgentStatus[] => {
  const statuses = new Set(agents.map(agent => agent.status));
  return Array.from(statuses).sort();
};

export const getDeploymentStatuses = (agents: Agent[]): DeploymentStatus[] => {
  const statuses = new Set(agents.map(agent => agent.deployment_status));
  return Array.from(statuses).sort();
};

export const getHealthStatuses = (agents: Agent[]): HealthStatus[] => {
  const statuses = new Set(agents.map(agent => agent.health.status));
  return Array.from(statuses).sort();
};

// Bulk operations configuration
export const getBulkOperations = (): BulkOperation[] => [
  {
    type: 'deploy',
    label: 'Deploy Selected',
    icon: '🚀',
    variant: 'success',
    requiresConfirmation: true,
    applicableStatuses: ['validated']
  },
  {
    type: 'undeploy',
    label: 'Undeploy Selected',
    icon: '🔴',
    variant: 'warning',
    requiresConfirmation: true,
    applicableStatuses: ['deployed']
  },
  {
    type: 'health-check',
    label: 'Health Check',
    icon: '🏥',
    variant: 'info',
    requiresConfirmation: false,
    applicableStatuses: ['deployed']
  },
  {
    type: 'restart',
    label: 'Restart Selected',
    icon: '↻',
    variant: 'warning',
    requiresConfirmation: true,
    applicableStatuses: ['deployed']
  },
  {
    type: 'delete',
    label: 'Delete Selected',
    icon: '🗑️',
    variant: 'danger',
    requiresConfirmation: true,
    applicableStatuses: ['draft', 'validation_failed']
  }
];

// Filter applicable bulk operations based on selected agents
export const getApplicableBulkOperations = (
  selectedAgents: Agent[], 
  allOperations: BulkOperation[]
): BulkOperation[] => {
  if (selectedAgents.length === 0) return [];

  return allOperations.filter(operation => {
    // Check if all selected agents have applicable statuses for this operation
    return selectedAgents.every(agent => 
      operation.applicableStatuses.includes(agent.status)
    );
  });
};

// Performance and metrics utilities
export const calculatePlatformMetrics = (agents: Agent[]) => {
  const totalAgents = agents.length;
  const deployedAgents = agents.filter(a => a.deployment_status === 'deployed').length;
  const healthyAgents = agents.filter(a => a.health.status === 'healthy').length;
  const alertCount = agents.reduce((sum, agent) => sum + agent.alerts.count, 0);
  
  // Calculate platform uptime based on agent availability
  const deployedAgentsWithHealth = agents.filter(a => a.deployment_status === 'deployed');
  const averageAvailability = deployedAgentsWithHealth.length > 0
    ? deployedAgentsWithHealth.reduce((sum, agent) => sum + agent.health.availability, 0) / deployedAgentsWithHealth.length
    : 100;

  return {
    totalAgents,
    deployedAgents,
    healthyAgents,
    alertCount,
    platformUptime: averageAvailability
  };
};

// Format utilities
export const formatDuration = (milliseconds: number): string => {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
};

export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

export const formatNumber = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  } else {
    return value.toString();
  }
};

export const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) {
    return 'Just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString();
  }
};

// Validation utilities
export const validateAgentConfiguration = (config: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!config.runtime_config?.timeout || config.runtime_config.timeout < 1) {
    errors.push('Timeout must be at least 1 second');
  }

  if (!config.runtime_config?.memory_size || config.runtime_config.memory_size < 128) {
    errors.push('Memory size must be at least 128 MB');
  }

  if (!config.deployment_config?.min_instances || config.deployment_config.min_instances < 1) {
    errors.push('Minimum instances must be at least 1');
  }

  if (config.deployment_config?.max_instances < config.deployment_config?.min_instances) {
    errors.push('Maximum instances must be greater than or equal to minimum instances');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Search utilities
export const highlightSearchTerm = (text: string, searchTerm: string): string => {
  if (!searchTerm) return text;
  
  const regex = new RegExp(`(${searchTerm})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
};

// Export utilities for agent actions
export const getAvailableActions = (agent: Agent): string[] => {
  const actions = ['view-status', 'configure', 'view-versions'];

  if (agent.deployment_status === 'deployed') {
    actions.push('health-check', 'view-logs', 'undeploy');
  } else if (agent.status === 'validated') {
    actions.push('deploy');
  }

  if (agent.status !== 'deployed') {
    actions.push('edit', 'delete');
  }

  return actions;
};

// Mock data generators for development
export const generateMockAgent = (id: string, overrides: Partial<Agent> = {}): Agent => {
  const categories = ['QE', 'Development', 'Analytics', 'Security', 'DevOps'];
  const statuses: AgentStatus[] = ['deployed', 'validated', 'pending_validation', 'inactive'];
  const healthStatuses: HealthStatus[] = ['healthy', 'degraded', 'unhealthy'];

  return {
    agent_id: id,
    name: `Agent ${id}`,
    description: `Description for agent ${id}`,
    category: categories[Math.floor(Math.random() * categories.length)],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    version: '1.0.0',
    author: 'developer@example.com',
    deployment_status: Math.random() > 0.5 ? 'deployed' : 'not_deployed',
    created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    validation_score: Math.floor(Math.random() * 40) + 60,
    grade: 'A',
    health: {
      status: healthStatuses[Math.floor(Math.random() * healthStatuses.length)],
      last_check: new Date().toISOString(),
      response_time_ms: Math.floor(Math.random() * 500) + 50,
      error_rate: Math.random() * 0.1,
      availability: Math.random() * 10 + 90
    },
    metrics: {
      total_executions: Math.floor(Math.random() * 1000) + 100,
      success_rate: Math.random() * 10 + 90,
      avg_execution_time: Math.floor(Math.random() * 2000) + 500,
      last_execution: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString()
    },
    alerts: {
      count: Math.floor(Math.random() * 5),
      severity: 'low',
      latest: new Date().toISOString()
    },
    ...overrides
  };
};