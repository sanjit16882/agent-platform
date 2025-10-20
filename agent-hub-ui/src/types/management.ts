// Enhanced Agent Management Types

export type AgentStatus = 'deployed' | 'validated' | 'pending_validation' | 'validation_failed' | 'draft' | 'inactive';
export type DeploymentStatus = 'deployed' | 'not_deployed' | 'deploying' | 'failed';
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type BulkOperationType = 'deploy' | 'undeploy' | 'health-check' | 'restart' | 'delete';
export type OperationStatus = 'pending' | 'success' | 'error';
export type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting';

// Enhanced Agent Interface
export interface Agent {
  agent_id: string;
  name: string;
  description: string;
  category: string;
  status: AgentStatus;
  version: string;
  author: string;
  deployment_status: DeploymentStatus;
  created_at: string;
  updated_at: string;
  validation_score?: number;
  grade?: string;
  lambda_arn?: string;
  last_deployment_id?: string;
  health: {
    status: HealthStatus;
    last_check: string;
    response_time_ms: number;
    error_rate: number;
    availability: number;
  };
  metrics: {
    total_executions: number;
    success_rate: number;
    avg_execution_time: number;
    last_execution: string;
  };
  alerts: {
    count: number;
    severity: AlertSeverity;
    latest: string;
  };
}

// Filter State Interface
export interface FilterState {
  categories: string[];
  statuses: AgentStatus[];
  deploymentStatuses: DeploymentStatus[];
  healthStatuses: HealthStatus[];
  searchQuery: string;
}

// Bulk Operation Interface
export interface BulkOperation {
  type: BulkOperationType;
  label: string;
  icon: string;
  variant: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
  requiresConfirmation: boolean;
  applicableStatuses: AgentStatus[];
}

// Sort Configuration
export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

// Management State Interface
export interface ManagementState {
  agents: Agent[];
  filteredAgents: Agent[];
  selectedAgents: string[];
  searchQuery: string;
  filters: {
    category: string[];
    status: string[];
    deploymentStatus: string[];
  };
  bulkOperations: {
    inProgress: boolean;
    operation: string | null;
    progress: Record<string, OperationStatus>;
  };
  realTimeUpdates: {
    enabled: boolean;
    lastUpdate: string;
    connectionStatus: ConnectionStatus;
  };
}

// Component Props Interfaces

export interface ManagementHeaderProps {
  onSearch: (query: string) => void;
  onRefresh: () => void;
  onRegisterAgent: () => void;
  searchQuery: string;
  isRefreshing: boolean;
}

export interface ManagementFiltersProps {
  categories: string[];
  statuses: string[];
  selectedFilters: FilterState;
  selectedAgents: string[];
  onFilterChange: (filters: FilterState) => void;
  onBulkOperation: (operation: BulkOperation) => void;
  bulkOperationsEnabled: boolean;
}

export interface ManagementStatsProps {
  totalAgents: number;
  deployedAgents: number;
  healthyAgents: number;
  alertCount: number;
  platformUptime: number;
  isLoading?: boolean;
}

export interface AgentTableProps {
  agents: Agent[];
  selectedAgents: string[];
  onAgentSelect: (agentId: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  onAgentAction: (agentId: string, action: AgentAction) => void;
  onViewDetails: (agentId: string) => void;
  sortConfig: SortConfig;
  onSort: (field: string) => void;
  isLoading?: boolean;
}

export interface AgentDetailsModalProps {
  agent: Agent | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (agentId: string, updates: Partial<Agent>) => void;
}

export interface AgentDetailsTabsProps {
  activeTab: 'overview' | 'configuration' | 'metrics' | 'logs';
  onTabChange: (tab: string) => void;
  agent: Agent;
}

export interface BulkOperationsToolbarProps {
  selectedCount: number;
  availableOperations: BulkOperation[];
  onOperation: (operation: BulkOperation) => void;
  onClearSelection: () => void;
  operationProgress: Record<string, OperationStatus>;
}

// Agent Actions
export type AgentAction = 
  | 'view-status'
  | 'configure'
  | 'deploy'
  | 'undeploy'
  | 'health-check'
  | 'view-versions'
  | 'view-logs'
  | 'edit'
  | 'delete';

// Error Boundary State
export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

// Real-time Update Interface
export interface RealTimeUpdate {
  type: 'agent_status' | 'deployment' | 'health_check' | 'alert';
  agent_id: string;
  data: any;
  timestamp: string;
}

// Virtual Scroll Configuration
export interface VirtualScrollConfig {
  itemHeight: number;
  containerHeight: number;
  overscan: number;
  threshold: number;
}

// Notification Interface
export interface NotificationMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  action: () => void;
  variant?: 'primary' | 'secondary';
}

// Platform Overview Interface
export interface PlatformOverview {
  total_agents: number;
  healthy_agents: number;
  degraded_agents: number;
  unhealthy_agents: number;
  platform_availability: number;
  platform_health_score: number;
}

// Agent Configuration Interface
export interface AgentConfiguration {
  agent_id: string;
  runtime_config: {
    timeout: number;
    memory_size: number;
    environment_variables: Record<string, string>;
  };
  deployment_config: {
    deployment_type: 'lambda' | 'container';
    auto_scaling: boolean;
    min_instances: number;
    max_instances: number;
  };
  monitoring_config: {
    health_check_interval: number;
    alert_thresholds: {
      error_rate: number;
      response_time: number;
      availability: number;
    };
  };
}

// Deployment History Interface
export interface DeploymentHistory {
  deployment_id: string;
  version: string;
  status: 'success' | 'failed' | 'in_progress' | 'rolled_back';
  timestamp: string;
  duration_ms: number;
  deployed_by: string;
  rollback_reason?: string;
}

// Version Info Interface
export interface VersionInfo {
  version: string;
  status: 'active' | 'deprecated' | 'draft';
  created_at: string;
  deployment_count: number;
  is_current: boolean;
}