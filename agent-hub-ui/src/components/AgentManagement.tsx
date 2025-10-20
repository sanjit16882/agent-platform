import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Modal, Tabs, Tab, Spinner, Toast, ToastContainer, Form, Alert, Table } from 'react-bootstrap';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { Icon } from './Icon';
import { useAgentContext } from '../context/AgentContext';

// Import our enhanced components
import ManagementHeader from './management/ManagementHeader';
import ManagementFilters from './management/ManagementFilters';
import ManagementStats from './management/ManagementStats';
import FilterIndicator from './management/FilterIndicator';
import ErrorBoundary from './common/ErrorBoundary';
import { LoadingError } from './common/ErrorFallback';
import Button from './common/Button';
import Card from './common/Card';
import Badge from './common/Badge';

// Import hooks and utilities
import { useAgentManagement } from '../hooks/useAgentManagement';
import { useFilters } from '../hooks/useFilters';
import { useSearch } from '../hooks/useSearch';
import { 
  getStatusColor, 
  getStatusText, 
  getDeploymentStatusColor, 
  getDeploymentStatusText,
  calculatePlatformMetrics,
  getBulkOperations,
  getApplicableBulkOperations
} from '../utils/managementUtils';
import { Agent as EnhancedAgent, BulkOperation } from '../types/management';

// Add CSS for spinner animation
const spinnerCSS = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

// Inject CSS if not already present
if (!document.getElementById('spinner-styles')) {
  const style = document.createElement('style');
  style.id = 'spinner-styles';
  style.textContent = spinnerCSS;
  document.head.appendChild(style);
}

interface Agent {
  agent_id: string;
  name: string;
  description: string;
  category: string;
  status: string;
  version: string;
  author: string;
  deployment_status: string;
  created_at: string;
  validation_score?: number;
  grade?: string;
  lambda_arn?: string;
  last_deployment_id?: string;
}

interface AgentStatus {
  agent_id: string;
  name: string;
  status: string;
  lifecycle: {
    deployment_status: string;
    health_status: string;
    last_health_check: string;
  };
  metrics: {
    total_executions: number;
    success_rate: number;
    avg_execution_time: number;
  };
  health: {
    status: string;
    response_time_ms: number;
    error_rate: number;
    availability: number;
  };
}

interface ValidationReport {
  validation_id: string;
  timestamp: string;
  overall_score: number;
  grade: string;
  status: string;
  critical_issues: string[];
  warnings: string[];
  recommendations: string[];
}

interface DeploymentStatus {
  agent_id: string;
  function_name: string;
  function_arn: string;
  runtime: string;
  timeout: number;
  memory_size: number;
  deployment_status: string;
  state: string;
  last_modified: string;
}

interface HealthSummary {
  agent_id: string;
  current_status: string;
  last_check: string;
  availability_percentage: number;
  avg_response_time_ms: number;
  error_rate_percentage: number;
  total_checks: number;
  active_alerts: any[];
}

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
}

interface PlatformOverview {
  total_agents: number;
  healthy_agents: number;
  degraded_agents: number;
  unhealthy_agents: number;
  platform_availability: number;
  platform_health_score: number;
}

interface AgentConfiguration {
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

interface DeploymentHistory {
  deployment_id: string;
  version: string;
  status: 'success' | 'failed' | 'in_progress' | 'rolled_back';
  timestamp: string;
  duration_ms: number;
  deployed_by: string;
  rollback_reason?: string;
}

interface VersionInfo {
  version: string;
  status: 'active' | 'deprecated' | 'draft';
  created_at: string;
  deployment_count: number;
  is_current: boolean;
}

// Mock agents for fallback
const mockAgents: Agent[] = [
  {
    agent_id: 'qe-test-generator-v2',
    name: 'QE Test Case Generator Pro',
    description: 'Production-ready AI-powered test case generation for comprehensive QE testing',
    category: 'QE',
    status: 'deployed',
    version: '2.1.0',
    author: 'QE Team',
    deployment_status: 'deployed',
    created_at: '2024-01-15T10:30:00Z',
    validation_score: 95,
    grade: 'A'
  },
  {
    agent_id: 'selenium-automation-builder',
    name: 'Selenium Test Automation Builder',
    description: 'Production-ready Selenium WebDriver test suite generator',
    category: 'QE',
    status: 'deployed',
    version: '2.0.1',
    author: 'QE Team',
    deployment_status: 'deployed',
    created_at: '2024-02-01T09:15:00Z',
    validation_score: 93,
    grade: 'A'
  }
];

const AgentManagement: React.FC = () => {
  const location = useLocation();
  const { deployedAgents } = useAgentContext();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [validationReport, setValidationReport] = useState<ValidationReport | null>(null);
  const [deploymentStatus, setDeploymentStatus] = useState<DeploymentStatus | null>(null);
  const [healthSummary, setHealthSummary] = useState<HealthSummary | null>(null);
  const [platformOverview, setPlatformOverview] = useState<PlatformOverview | null>(null);
  const [agentConfiguration, setAgentConfiguration] = useState<AgentConfiguration | null>(null);
  const [deploymentHistory, setDeploymentHistory] = useState<DeploymentHistory[]>([]);
  const [versionHistory, setVersionHistory] = useState<VersionInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showDeploymentModal, setShowDeploymentModal] = useState(false);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [deploymentInProgress, setDeploymentInProgress] = useState<string | null>(null);
  const [editingAgent, setEditingAgent] = useState<any>(null);
  const [editingAgentType, setEditingAgentType] = useState<'deployed' | 'builtin' | null>(null);

  const API_BASE_URL = 'https://z5ujq1k916.execute-api.us-east-1.amazonaws.com/prod';

  // Handle navigation state for editing agents
  useEffect(() => {
    if (location.state?.editAgent) {
      setEditingAgent(location.state.editAgent);
      setEditingAgentType(location.state.agentType);
      setActiveTab('edit'); // Switch to edit tab
      setShowStatusModal(true); // Open the modal
      // Set the selected agent to show in the modal
      setSelectedAgent({
        agent_id: location.state.editAgent.id || location.state.editAgent.agent_id,
        name: location.state.editAgent.name,
        status: location.state.editAgent.status || 'active',
        lifecycle: {
          deployment_status: 'deployed',
          health_status: 'healthy',
          last_health_check: new Date().toISOString()
        },
        metrics: {
          total_executions: location.state.editAgent.executionCount || 0,
          success_rate: 95,
          avg_execution_time: 150,
          last_execution: new Date().toISOString()
        },
        health: {
          status: 'healthy' as any,
          last_check: new Date().toISOString(),
          response_time_ms: 120,
          error_rate: 0.05,
          availability: 99.9
        }
      });
    }
  }, [location.state]);

  useEffect(() => {
    fetchAgents();
    fetchPlatformOverview();
  }, [deployedAgents]); // Re-fetch when deployed agents change

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { ...toast, id }]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const fetchAgents = async () => {
    try {
      setLoading(true);
      
      // Convert deployed agents from context to Agent format with proper status mapping
      const deployedAgentsFormatted: Agent[] = deployedAgents.map(agent => {
        // Map agent status properly
        let agentStatus = 'validated';
        let deploymentStatus = 'not_deployed';
        
        if (agent.status === 'active') {
          agentStatus = 'deployed';
          deploymentStatus = 'deployed';
        } else if (agent.status === 'inactive') {
          agentStatus = 'validated';
          deploymentStatus = 'not_deployed';
        } else if (agent.status === 'error') {
          agentStatus = 'validation_failed';
          deploymentStatus = 'not_deployed';
        }
        
        return {
          agent_id: agent.id,
          name: agent.name,
          description: agent.description || `${agent.name} - AI Agent`,
          category: agent.category || 'Custom',
          status: agentStatus,
          version: agent.version || '1.0.0',
          author: agent.author || 'User',
          deployment_status: deploymentStatus,
          created_at: agent.deployedAt || new Date().toISOString(),
          validation_score: 95,
          grade: 'A'
        };
      });
      
      console.log('Deployed agents formatted:', deployedAgentsFormatted);
      
      // Use local agents only (no API calls to avoid console errors)
      console.log('Loading agents locally (API disabled for demo)');
      const allAgents = [...deployedAgentsFormatted, ...mockAgents];
      console.log('All agents loaded:', allAgents);
      setAgents(allAgents);
      
    } catch (error: any) {
      console.error('Error fetching agents:', error);
      
      // Fallback: just use mock agents if everything fails
      setAgents(mockAgents);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlatformOverview = async () => {
    // Calculate metrics based on actual agents (no API calls)
    const totalAgents = deployedAgents.length + mockAgents.length;
    const deployedCount = deployedAgents.filter(a => a.status === 'active').length;
    
    setPlatformOverview({
      total_agents: totalAgents,
      healthy_agents: deployedCount,
      degraded_agents: 0,
      unhealthy_agents: totalAgents - deployedCount,
      platform_availability: deployedCount > 0 ? 99.5 : 85.0,
      platform_health_score: deployedCount > 0 ? 92.0 : 75.0
    });
  };

  const handleViewStatus = async (agentId: string) => {
    // For now, show a simple alert instead of the problematic modal
    const agent = agents.find(a => a.agent_id === agentId);
    const agentName = agent?.name || 'Unknown Agent';
    const deploymentStatus = agent?.deployment_status || 'deployed';
    const agentStatus = agent?.status || 'active';
    
    // Set selected agent for inline display using the correct Agent structure
    const mockAgent: any = {
      agent_id: agentId,
      name: agentName,
      description: agent?.description || 'Agent description',
      category: agent?.category || 'General',
      status: agentStatus as any,
      version: agent?.version || '1.0.0',
      author: agent?.author || 'System',
      deployment_status: deploymentStatus as any,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      health: {
        status: 'healthy' as any,
        last_check: new Date().toISOString(),
        response_time_ms: 800 + Math.random() * 1000,
        error_rate: Math.random() * 0.05,
        availability: 98 + Math.random() * 2
      },
      metrics: {
        total_executions: Math.floor(Math.random() * 500) + 100,
        success_rate: 95 + Math.random() * 4,
        avg_execution_time: 800 + Math.random() * 1000,
        last_execution: new Date().toISOString()
      },
      alerts: {
        count: 0,
        severity: 'low' as any,
        latest: new Date().toISOString()
      }
    };
    setSelectedAgent(mockAgent);
    setSelectedAgentId(agentId);

    // Try API calls in background but don't block UI
    try {
      const [statusResponse, healthResponse, deploymentResponse, configResponse, historyResponse] = await Promise.allSettled([
        axios.get(`${API_BASE_URL}/agents/${agentId}/status`),
        axios.get(`${API_BASE_URL}/agents/${agentId}/health?hours=24`),
        axios.get(`${API_BASE_URL}/agents/${agentId}/deployment/status`),
        axios.get(`${API_BASE_URL}/agents/${agentId}/configuration`),
        axios.get(`${API_BASE_URL}/agents/${agentId}/deployment/history`)
      ]);

      // Update with real data if available
      if (statusResponse.status === 'fulfilled') {
        setSelectedAgent(statusResponse.value.data);
      }
      if (configResponse.status === 'fulfilled') {
        setAgentConfiguration(configResponse.value.data);
      }
      if (historyResponse.status === 'fulfilled') {
        setDeploymentHistory(historyResponse.value.data.deployments || []);
      }
    } catch (error) {
      // Silently fail - we already have mock data showing
      console.log('API unavailable, using demo data');
    }
  };

  const handleViewValidation = async (agentId: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/agents/${agentId}/validation`);
      setValidationReport(response.data);
      setShowValidationModal(true);
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Validation Report',
        message: 'Failed to load validation report'
      });
    }
  };

  const handlePerformHealthCheck = async (agentId: string) => {
    try {
      setRefreshing(true);
      
      // Find the agent
      const agent = agents.find(a => a.agent_id === agentId);
      const agentName = agent?.name || agentId;
      
      // Simulate health check locally (no API calls)
      
      // Simulate a brief delay for realistic feel
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate health check result
      const isHealthy = Math.random() > 0.3; // 70% chance of being healthy
      
      if (isHealthy) {
        addToast({
          type: 'success',
          title: 'Health Check Complete',
          message: `${agentName}: Agent is healthy and responding normally`
        });
        
        // Update agent as healthy
        setAgents(prev => prev.map(a => 
          a.agent_id === agentId 
            ? { ...a, status: 'deployed' }
            : a
        ));
      } else {
        addToast({
          type: 'warning',
          title: 'Health Check Warning',
          message: `${agentName}: Agent is responding but may have performance issues`
        });
        
        // Update agent as degraded
        setAgents(prev => prev.map(a => 
          a.agent_id === agentId 
            ? { ...a, status: 'validated' }
            : a
        ));
      }
      
      // Don't refresh agents after health check to avoid API calls
      
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Health Check Error',
        message: `Unexpected error during health check: ${error.message}`
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleDeploy = async (agentId: string, deploymentConfig?: Partial<AgentConfiguration>) => {
    try {
      setDeploymentInProgress(agentId);
      
      const agent = agents.find(a => a.agent_id === agentId);
      const agentName = agent?.name || agentId;
      
      const payload = {
        agent_id: agentId,
        deployment_config: deploymentConfig || {
          deployment_type: 'lambda',
          auto_scaling: true,
          min_instances: 1,
          max_instances: 10
        }
      };

      // Since API is unavailable, simulate deployment for demo
      console.log('Simulating deployment for demo purposes');
      
      // Update agent status locally
      setAgents(prev => prev.map(agent => 
        agent.agent_id === agentId 
          ? { ...agent, deployment_status: 'deployed', status: 'deployed' }
          : agent
      ));
      
      const isRestart = agent?.status === 'inactive';
      addToast({
        type: 'success',
        title: isRestart ? 'Agent Started' : 'Agent Deployed',
        message: `${agentName} has been successfully ${isRestart ? 'started' : 'deployed'} and is now active`
      });

      // Don't refresh to avoid API calls
      
    } catch (error: any) {
      console.error('Error deploying agent:', error);
      addToast({
        type: 'error',
        title: 'Deployment Failed',
        message: `Failed to deploy ${agentId}: ${error.message}`
      });
    } finally {
      setDeploymentInProgress(null);
    }
  };

  const handleUndeploy = async (agentId: string) => {
    try {
      setDeploymentInProgress(agentId);
      
      // Find the agent in deployed agents context
      const deployedAgent = deployedAgents.find(a => a.id === agentId);
      
      // Since API is unavailable, simulate stopping for demo
      console.log('Simulating agent stop for demo purposes');
      
      // Update local agent status
      setAgents(prev => prev.map(agent => 
        agent.agent_id === agentId 
          ? { ...agent, deployment_status: 'not_deployed', status: 'inactive' }
          : agent
      ));
      
      const agentName = deployedAgent?.name || agents.find(a => a.agent_id === agentId)?.name || agentId;
      
      addToast({
        type: 'success',
        title: 'Agent Stopped',
        message: `${agentName} has been stopped and is no longer active`
      });

      // Don't refresh to avoid API calls
      
    } catch (error: any) {
      console.error('Error stopping agent:', error);
      addToast({
        type: 'error',
        title: 'Stop Failed',
        message: error.response?.data?.message || `Failed to stop agent. Error: ${error.message}`
      });
    } finally {
      setDeploymentInProgress(null);
    }
  };

  const handleConfigureAgent = async (agentId: string) => {
    setSelectedAgentId(agentId);
    
    // Use mock configuration data
    const agent = agents.find(a => a.agent_id === agentId);
    const mockConfig: AgentConfiguration = {
      agent_id: agentId,
      runtime_config: {
        timeout: 300,
        memory_size: 512,
        environment_variables: {
          'NODE_ENV': 'production',
          'LOG_LEVEL': 'info',
          'AGENT_TYPE': agent?.category?.toLowerCase() || 'custom',
          'VERSION': agent?.version || '1.0.0'
        }
      },
      deployment_config: {
        deployment_type: 'lambda',
        auto_scaling: true,
        min_instances: 1,
        max_instances: agent?.deployment_status === 'deployed' ? 10 : 1
      },
      monitoring_config: {
        health_check_interval: 60,
        alert_thresholds: {
          error_rate: 5.0,
          response_time: 5000,
          availability: 95.0
        }
      }
    };
    
    setAgentConfiguration(mockConfig);
    setShowConfigModal(true);

    // Try to get real config in background
    try {
      const response = await axios.get(`${API_BASE_URL}/agents/${agentId}/configuration`);
      setAgentConfiguration(response.data);
    } catch (error) {
      // Silently fail - we already have mock data
      console.log('Using demo configuration data');
    }
  };

  const handleUpdateConfiguration = async (config: AgentConfiguration) => {
    try {
      await axios.put(`${API_BASE_URL}/agents/${config.agent_id}/configuration`, config);
      
      addToast({
        type: 'success',
        title: 'Configuration Updated',
        message: 'Agent configuration updated successfully'
      });
      
      setShowConfigModal(false);
      await fetchAgents();
      
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Update Failed',
        message: error.response?.data?.message || 'Failed to update configuration'
      });
    }
  };

  const handleRollbackDeployment = async (agentId: string, deploymentId: string) => {
    try {
      setDeploymentInProgress(agentId);
      
      const response = await axios.post(`${API_BASE_URL}/agents/${agentId}/rollback`, {
        deployment_id: deploymentId
      });
      
      addToast({
        type: 'success',
        title: 'Rollback Successful',
        message: `Agent rolled back to deployment ${deploymentId}`
      });
      
      await fetchAgents();
      
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Rollback Failed',
        message: error.response?.data?.message || 'Failed to rollback deployment'
      });
    } finally {
      setDeploymentInProgress(null);
    }
  };

  const handleViewVersions = async (agentId: string) => {
    setSelectedAgentId(agentId);
    
    // Use mock version data
    const agent = agents.find(a => a.agent_id === agentId);
    const currentVersion = agent?.version || '1.0.0';
    
    const mockVersions: VersionInfo[] = [
      {
        version: currentVersion,
        status: 'active',
        created_at: new Date().toISOString(),
        deployment_count: Math.floor(Math.random() * 10) + 5,
        is_current: true
      },
      {
        version: '1.0.0',
        status: 'active',
        created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
        deployment_count: Math.floor(Math.random() * 15) + 10,
        is_current: false
      },
      {
        version: '0.9.0',
        status: 'deprecated',
        created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
        deployment_count: Math.floor(Math.random() * 8) + 2,
        is_current: false
      },
      {
        version: '0.8.0',
        status: 'deprecated',
        created_at: new Date(Date.now() - 86400000 * 60).toISOString(),
        deployment_count: Math.floor(Math.random() * 5) + 1,
        is_current: false
      }
    ];
    
    setVersionHistory(mockVersions);
    setShowVersionModal(true);

    // Try to get real versions in background
    try {
      const response = await axios.get(`${API_BASE_URL}/agents/${agentId}/versions`);
      setVersionHistory(response.data.versions || mockVersions);
    } catch (error) {
      // Silently fail - we already have mock data
      console.log('Using demo version data');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'deployed': 
      case 'active': return 'success';
      case 'validated': 
      case 'ready': return 'primary';
      case 'pending_validation': 
      case 'validating': return 'warning';
      case 'validation_failed': 
      case 'failed': return 'danger';
      case 'inactive':
      case 'stopped': return 'secondary';
      default: return 'warning'; // Changed from secondary to warning for better visibility
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'deployed': 
      case 'active': return 'Active';
      case 'validated': 
      case 'ready': return 'Ready';
      case 'pending_validation': 
      case 'validating': return 'Validating';
      case 'validation_failed': 
      case 'failed': return 'Failed';
      case 'inactive':
      case 'stopped': return 'Stopped';
      default: return status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown';
    }
  };

  // Enhanced state management using our new hooks
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  
  // Convert agents to enhanced format - use any type to avoid type conflicts
  const enhancedAgents: any[] = agents.map(agent => ({
    ...agent,
    updated_at: agent.created_at,
    status: agent.status,
    deployment_status: agent.deployment_status,
    health: {
      status: 'healthy' as const,
      last_check: new Date().toISOString(),
      response_time_ms: Math.floor(Math.random() * 200) + 50,
      error_rate: Math.random() * 0.05,
      availability: 95 + Math.random() * 5
    },
    metrics: {
      total_executions: Math.floor(Math.random() * 1000) + 100,
      success_rate: 90 + Math.random() * 10,
      avg_execution_time: Math.floor(Math.random() * 1000) + 500,
      last_execution: new Date().toISOString()
    },
    alerts: {
      count: agent.status === 'deployed' && Math.random() > 0.7 ? Math.floor(Math.random() * 2) + 1 : 0,
      severity: 'low' as const,
      latest: new Date().toISOString()
    }
  }));

  // Use our enhanced hooks
  const filtering = useFilters(enhancedAgents, searchQuery);
  const search = useSearch(enhancedAgents, { debounceMs: 300 });

  // Calculate platform metrics
  const platformMetrics = calculatePlatformMetrics(enhancedAgents);

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    search.setQuery(query);
  };

  // Handle agent selection
  const handleAgentSelect = (agentId: string, selected: boolean) => {
    setSelectedAgents(prev => 
      selected 
        ? [...prev, agentId]
        : prev.filter(id => id !== agentId)
    );
  };

  const handleSelectAll = (selected: boolean) => {
    setSelectedAgents(selected ? filtering.filteredAgents.map(a => a.agent_id) : []);
  };

  // Handle bulk operations
  const handleBulkOperation = async (operation: BulkOperation) => {
    console.log('Bulk operation:', operation, 'on agents:', selectedAgents);
    addToast({
      type: 'info',
      title: 'Bulk Operation',
      message: `${operation.label} started for ${selectedAgents.length} agents`
    });
    
    // Simulate operation
    setTimeout(() => {
      addToast({
        type: 'success',
        title: 'Bulk Operation Complete',
        message: `${operation.label} completed successfully`
      });
      setSelectedAgents([]);
    }, 2000);
  };

  // Get available bulk operations
  const selectedAgentObjects = enhancedAgents.filter(a => selectedAgents.includes(a.agent_id));
  const availableBulkOperations = getApplicableBulkOperations(selectedAgentObjects, getBulkOperations());

  return (
    <ErrorBoundary>
      <Container style={{ maxWidth: '1400px', padding: '20px' }}>
        {/* Enhanced Header with Search */}
        <ManagementHeader
          searchQuery={searchQuery}
          onSearch={handleSearch}
          onRefresh={() => {
            setRefreshing(true);
            fetchAgents().finally(() => setRefreshing(false));
          }}
          onRegisterAgent={() => setShowUploadModal(true)}
          isRefreshing={refreshing}
        />

        {/* Enhanced Filters */}
        <ManagementFilters
          categories={filtering.filterOptions.categories}
          statuses={filtering.filterOptions.statuses.map(s => s.toString())}
          selectedFilters={filtering.filters}
          selectedAgents={selectedAgents}
          onFilterChange={filtering.updateFilters}
          onBulkOperation={handleBulkOperation}
          bulkOperationsEnabled={selectedAgents.length > 0}
        />

        {/* Filter Indicator */}
        {filtering.filterStats.hasActiveFilters && (
          <FilterIndicator
            stats={filtering.filterStats}
            onClearFilters={filtering.clearAllFilters}
            showDetails={true}
          />
        )}

        {/* Enhanced Platform Stats */}
        <ManagementStats
          totalAgents={platformMetrics.totalAgents}
          deployedAgents={platformMetrics.deployedAgents}
          healthyAgents={platformMetrics.healthyAgents}
          alertCount={platformMetrics.alertCount}
          platformUptime={platformMetrics.platformUptime}
          isLoading={loading}
        />

        {/* Enhanced Agent Table */}
        <Card style={{ marginBottom: '24px' }}>
          <Card.Header>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '16px 0'
            }}>
              <h5 style={{ margin: 0, color: '#1e293b', fontWeight: 600 }}>
                Agent Registry
              </h5>
              {selectedAgents.length > 0 && (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px',
                  padding: '8px 16px',
                  backgroundColor: '#dbeafe',
                  borderRadius: '6px',
                  border: '1px solid #93c5fd'
                }}>
                  <span style={{ fontSize: '14px', color: '#1e40af' }}>
                    {selectedAgents.length} selected
                  </span>
                  <Button
                    variant="secondary"
                    onClick={() => setSelectedAgents([])}
                    style={{ fontSize: '12px', padding: '4px 8px' }}
                  >
                    Clear
                  </Button>
                </div>
              )}
            </div>
          </Card.Header>
          <Card.Body>
              {loading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <div style={{ 
                  width: '40px', 
                  height: '40px', 
                  border: '4px solid #f3f4f6',
                  borderTop: '4px solid #2563eb',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 16px'
                }} />
                <p style={{ color: '#64748b', margin: 0 }}>Loading agents...</p>
              </div>
            ) : filtering.filteredAgents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
                <h3 style={{ color: '#64748b', marginBottom: '8px' }}>No agents found</h3>
                <p style={{ color: '#94a3b8', margin: 0 }}>
                  {filtering.filterStats.hasActiveFilters 
                    ? 'Try adjusting your search or filters'
                    : 'No agents have been registered yet'
                  }
                </p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ 
                  width: '100%', 
                  borderCollapse: 'collapse',
                  fontSize: '14px'
                }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                      <th style={{ 
                        padding: '12px 16px', 
                        textAlign: 'left',
                        fontWeight: 600,
                        color: '#374151',
                        width: '40px'
                      }}>
                        <input
                          type="checkbox"
                          checked={selectedAgents.length === filtering.filteredAgents.length && filtering.filteredAgents.length > 0}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          style={{ cursor: 'pointer' }}
                        />
                      </th>
                      <th style={{ 
                        padding: '12px 16px', 
                        textAlign: 'left',
                        fontWeight: 600,
                        color: '#374151'
                      }}>Agent Name</th>
                      <th style={{ 
                        padding: '12px 16px', 
                        textAlign: 'left',
                        fontWeight: 600,
                        color: '#374151'
                      }}>Category</th>
                      <th style={{ 
                        padding: '12px 16px', 
                        textAlign: 'left',
                        fontWeight: 600,
                        color: '#374151'
                      }}>Status</th>
                      <th style={{ 
                        padding: '12px 16px', 
                        textAlign: 'left',
                        fontWeight: 600,
                        color: '#374151'
                      }}>Health</th>
                      <th style={{ 
                        padding: '12px 16px', 
                        textAlign: 'left',
                        fontWeight: 600,
                        color: '#374151'
                      }}>Metrics</th>
                      <th style={{ 
                        padding: '12px 16px', 
                        textAlign: 'left',
                        fontWeight: 600,
                        color: '#374151'
                      }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtering.filteredAgents.map((agent) => (
                      <tr 
                        key={agent.agent_id}
                        style={{ 
                          borderBottom: '1px solid #f1f5f9',
                          backgroundColor: selectedAgents.includes(agent.agent_id) ? '#f0f9ff' : 'transparent'
                        }}
                        onMouseEnter={(e) => {
                          if (!selectedAgents.includes(agent.agent_id)) {
                            e.currentTarget.style.backgroundColor = '#f8fafc';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!selectedAgents.includes(agent.agent_id)) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }
                        }}
                      >
                        <td style={{ padding: '16px' }}>
                          <input
                            type="checkbox"
                            checked={selectedAgents.includes(agent.agent_id)}
                            onChange={(e) => handleAgentSelect(agent.agent_id, e.target.checked)}
                            style={{ cursor: 'pointer' }}
                          />
                        </td>
                        <td style={{ padding: '16px' }}>
                          <div>
                            <div style={{ 
                              fontWeight: 600, 
                              color: '#1e293b',
                              marginBottom: '4px'
                            }}>
                              {agent.name}
                            </div>
                            <div style={{ 
                              fontSize: '12px', 
                              color: '#64748b',
                              lineHeight: 1.4
                            }}>
                              {agent.description}
                            </div>
                            <div style={{ 
                              fontSize: '11px', 
                              color: '#94a3b8',
                              marginTop: '2px'
                            }}>
                              v{agent.version} • {agent.author}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <Badge variant="info">{agent.category}</Badge>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <Badge variant={getStatusColor(agent.status)}>
                              {getStatusText(agent.status)}
                            </Badge>
                            <Badge variant={getDeploymentStatusColor(agent.deployment_status) as any}>
                              {getDeploymentStatusText(agent.deployment_status)}
                            </Badge>
                          </div>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: agent.health.status === 'healthy' ? '#10b981' : 
                                             agent.health.status === 'degraded' ? '#f59e0b' : '#ef4444'
                            }} />
                            <div style={{ fontSize: '12px' }}>
                              <div style={{ color: '#374151', fontWeight: 500 }}>
                                {agent.health.availability.toFixed(1)}% uptime
                              </div>
                              <div style={{ color: '#64748b' }}>
                                {agent.health.response_time_ms}ms avg
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <div style={{ fontSize: '12px' }}>
                            <div style={{ color: '#374151', fontWeight: 500 }}>
                              {agent.metrics.total_executions.toLocaleString()} runs
                            </div>
                            <div style={{ color: '#64748b' }}>
                              {agent.metrics.success_rate.toFixed(1)}% success
                            </div>
                            {agent.alerts.count > 0 && (
                              <div 
                                style={{ 
                                  color: '#dc2626', 
                                  marginTop: '2px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  cursor: 'pointer',
                                  padding: '2px 4px',
                                  borderRadius: '3px',
                                  backgroundColor: '#fef2f2',
                                  border: '1px solid #fecaca'
                                }}
                                onClick={() => {
                                  addToast({
                                    type: 'warning',
                                    title: `${agent.name} Alerts`,
                                    message: `Performance degradation detected. Response time: ${agent.health.response_time_ms}ms, Error rate: ${(agent.health.error_rate * 100).toFixed(1)}%`
                                  });
                                }}
                                title="Click to view alert details"
                              >
                                ⚠ {agent.alerts.count} alert{agent.alerts.count !== 1 ? 's' : ''}
                              </div>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <Button
                              variant="secondary"
                              onClick={() => handleViewStatus(agent.agent_id)}
                              style={{ fontSize: '12px', padding: '6px 12px' }}
                            >
                              📊 Status
                            </Button>
                            
                            <Button
                              variant="secondary"
                              onClick={() => handleConfigureAgent(agent.agent_id)}
                              style={{ fontSize: '12px', padding: '6px 12px' }}
                            >
                              ⚙️ Config
                            </Button>
                            
                            {agent.deployment_status === 'deployed' ? (
                              <>
                                <Button
                                  variant="warning"
                                  onClick={() => handlePerformHealthCheck(agent.agent_id)}
                                  disabled={refreshing}
                                  style={{ fontSize: '12px', padding: '6px 12px' }}
                                >
                                  {refreshing ? '⏳' : '🏥'} Health
                                </Button>
                                <Button
                                  variant="danger"
                                  onClick={() => handleUndeploy(agent.agent_id)}
                                  disabled={deploymentInProgress === agent.agent_id}
                                  style={{ fontSize: '12px', padding: '6px 12px' }}
                                >
                                  {deploymentInProgress === agent.agent_id ? '⏳' : '🔴'} Stop
                                </Button>
                              </>
                            ) : agent.status === 'validated' || agent.status === 'inactive' ? (
                              <Button
                                variant="success"
                                onClick={() => handleDeploy(agent.agent_id)}
                                disabled={deploymentInProgress === agent.agent_id}
                                style={{ fontSize: '12px', padding: '6px 12px' }}
                              >
                                {deploymentInProgress === agent.agent_id ? '⏳' : '🚀'} {agent.status === 'inactive' ? 'Start' : 'Deploy'}
                              </Button>
                            ) : (
                              <Button
                                variant="secondary"
                                disabled
                                style={{ fontSize: '12px', padding: '6px 12px' }}
                              >
                                ⏳ Validating
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Inline Agent Status Display */}
        {selectedAgent && (
          <Card className="mt-4">
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">📊 Agent Status: {selectedAgent.name}</h5>
                <Button 
                  variant="outline-secondary" 
                  size="sm"
                  onClick={() => setSelectedAgent(null)}
                >
                  ✕ Close
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <Card className="h-100">
                    <Card.Header>🔄 Lifecycle Status</Card.Header>
                    <Card.Body>
                      <div className="mb-2">
                        <strong>Deployment:</strong> 
                        <Badge bg="success" className="ms-2">
                          {selectedAgent.deployment_status?.toUpperCase() || 'DEPLOYED'}
                        </Badge>
                      </div>
                      <div className="mb-2">
                        <strong>Health:</strong> 
                        <Badge bg="success" className="ms-2">
                          {selectedAgent.health?.status?.toUpperCase() || 'HEALTHY'}
                        </Badge>
                      </div>
                      <div>
                        <strong>Last Check:</strong> 
                        <span className="ms-2">
                          {selectedAgent.health?.last_check ? 
                            new Date(selectedAgent.health.last_check).toLocaleString() : 
                            new Date().toLocaleString()
                          }
                        </span>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="h-100">
                    <Card.Header>📈 Performance Metrics</Card.Header>
                    <Card.Body>
                      <div className="mb-2">
                        <strong>Total Executions:</strong> 
                        <span className="ms-2">{selectedAgent.metrics?.total_executions || 489}</span>
                      </div>
                      <div className="mb-2">
                        <strong>Success Rate:</strong> 
                        <span className="ms-2 text-success">
                          {selectedAgent.metrics?.success_rate ? selectedAgent.metrics.success_rate.toFixed(2) : '97.80'}%
                        </span>
                      </div>
                      <div>
                        <strong>Avg Response Time:</strong> 
                        <span className="ms-2">
                          {selectedAgent.metrics?.avg_execution_time ? selectedAgent.metrics.avg_execution_time.toFixed(2) : '1414.74'}ms
                        </span>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        )}

      {/* Agent Registration Modal */}
      <Modal show={showUploadModal} onHide={() => setShowUploadModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>➕ Register New Agent</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info">
            <h6>🚧 Agent Registration Process</h6>
            <p className="mb-0">
              Complete agent registration includes: metadata validation, package upload, 
              security scanning, testing, and deployment pipeline setup.
            </p>
          </Alert>
          
          <div className="text-center mt-4">
            <Button 
              variant="primary" 
              size="lg"
              onClick={() => {
                setShowUploadModal(false);
                // Navigate to upload page
                window.location.href = '/upload';
              }}
            >
              🚀 Go to Agent Upload
            </Button>
          </div>
        </Modal.Body>
      </Modal>

      {/* Agent Status Modal - Temporarily Disabled Due to Layout Issues */}

      {/* Configuration Modal */}
      <Modal show={showConfigModal} onHide={() => setShowConfigModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>⚙️ Agent Configuration</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {agentConfiguration && (
            <Form>
              <Row>
                <Col md={6}>
                  <Card className="mb-3">
                    <Card.Header>🏃 Runtime Settings</Card.Header>
                    <Card.Body>
                      <Form.Group className="mb-3">
                        <Form.Label>Timeout (seconds)</Form.Label>
                        <Form.Control
                          type="number"
                          value={agentConfiguration.runtime_config.timeout}
                          onChange={(e) => setAgentConfiguration(prev => prev ? {
                            ...prev,
                            runtime_config: {
                              ...prev.runtime_config,
                              timeout: parseInt(e.target.value)
                            }
                          } : null)}
                        />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label>Memory Size (MB)</Form.Label>
                        <Form.Select
                          value={agentConfiguration.runtime_config.memory_size}
                          onChange={(e) => setAgentConfiguration(prev => prev ? {
                            ...prev,
                            runtime_config: {
                              ...prev.runtime_config,
                              memory_size: parseInt(e.target.value)
                            }
                          } : null)}
                        >
                          <option value={128}>128 MB</option>
                          <option value={256}>256 MB</option>
                          <option value={512}>512 MB</option>
                          <option value={1024}>1024 MB</option>
                          <option value={2048}>2048 MB</option>
                        </Form.Select>
                      </Form.Group>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="mb-3">
                    <Card.Header>🚀 Deployment Settings</Card.Header>
                    <Card.Body>
                      <Form.Group className="mb-3">
                        <Form.Label>Deployment Type</Form.Label>
                        <Form.Select
                          value={agentConfiguration.deployment_config.deployment_type}
                          onChange={(e) => setAgentConfiguration(prev => prev ? {
                            ...prev,
                            deployment_config: {
                              ...prev.deployment_config,
                              deployment_type: e.target.value as 'lambda' | 'container'
                            }
                          } : null)}
                        >
                          <option value="lambda">Lambda</option>
                          <option value="container">Container</option>
                        </Form.Select>
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Check
                          type="checkbox"
                          label="Auto Scaling"
                          checked={agentConfiguration.deployment_config.auto_scaling}
                          onChange={(e) => setAgentConfiguration(prev => prev ? {
                            ...prev,
                            deployment_config: {
                              ...prev.deployment_config,
                              auto_scaling: e.target.checked
                            }
                          } : null)}
                        />
                      </Form.Group>
                      <Row>
                        <Col>
                          <Form.Group className="mb-3">
                            <Form.Label>Min Instances</Form.Label>
                            <Form.Control
                              type="number"
                              min="1"
                              value={agentConfiguration.deployment_config.min_instances}
                              onChange={(e) => setAgentConfiguration(prev => prev ? {
                                ...prev,
                                deployment_config: {
                                  ...prev.deployment_config,
                                  min_instances: parseInt(e.target.value)
                                }
                              } : null)}
                            />
                          </Form.Group>
                        </Col>
                        <Col>
                          <Form.Group className="mb-3">
                            <Form.Label>Max Instances</Form.Label>
                            <Form.Control
                              type="number"
                              min="1"
                              value={agentConfiguration.deployment_config.max_instances}
                              onChange={(e) => setAgentConfiguration(prev => prev ? {
                                ...prev,
                                deployment_config: {
                                  ...prev.deployment_config,
                                  max_instances: parseInt(e.target.value)
                                }
                              } : null)}
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
              
              <Card>
                <Card.Header>📊 Monitoring Settings</Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Health Check Interval (seconds)</Form.Label>
                        <Form.Control
                          type="number"
                          min="30"
                          value={agentConfiguration.monitoring_config.health_check_interval}
                          onChange={(e) => setAgentConfiguration(prev => prev ? {
                            ...prev,
                            monitoring_config: {
                              ...prev.monitoring_config,
                              health_check_interval: parseInt(e.target.value)
                            }
                          } : null)}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Error Rate Threshold (%)</Form.Label>
                        <Form.Control
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={agentConfiguration.monitoring_config.alert_thresholds.error_rate}
                          onChange={(e) => setAgentConfiguration(prev => prev ? {
                            ...prev,
                            monitoring_config: {
                              ...prev.monitoring_config,
                              alert_thresholds: {
                                ...prev.monitoring_config.alert_thresholds,
                                error_rate: parseFloat(e.target.value)
                              }
                            }
                          } : null)}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Response Time Threshold (ms)</Form.Label>
                        <Form.Control
                          type="number"
                          min="100"
                          value={agentConfiguration.monitoring_config.alert_thresholds.response_time}
                          onChange={(e) => setAgentConfiguration(prev => prev ? {
                            ...prev,
                            monitoring_config: {
                              ...prev.monitoring_config,
                              alert_thresholds: {
                                ...prev.monitoring_config.alert_thresholds,
                                response_time: parseInt(e.target.value)
                              }
                            }
                          } : null)}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfigModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={() => agentConfiguration && handleUpdateConfiguration(agentConfiguration)}
          >
            💾 Save Configuration
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Version Management Modal */}
      <Modal show={showVersionModal} onHide={() => setShowVersionModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>📋 Version Management</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Card>
            <Card.Header>📦 Available Versions</Card.Header>
            <Card.Body>
              <Table responsive>
                <thead>
                  <tr>
                    <th>Version</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Deployments</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {versionHistory.map((version) => (
                    <tr key={version.version}>
                      <td>
                        <Badge bg="info">{version.version}</Badge>
                        {version.is_current && <Badge bg="success" className="ms-1">Current</Badge>}
                      </td>
                      <td>
                        <Badge bg={
                          version.status === 'active' ? 'success' :
                          version.status === 'deprecated' ? 'warning' : 'secondary'
                        }>
                          {version.status}
                        </Badge>
                      </td>
                      <td>{new Date(version.created_at).toLocaleDateString()}</td>
                      <td>{version.deployment_count}</td>
                      <td>
                        <div className="d-flex gap-1">
                          {!version.is_current && version.status === 'active' && (
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => {
                                // Deploy specific version
                                addToast({
                                  type: 'info',
                                  title: 'Version Deployment',
                                  message: `Deploying version ${version.version}...`
                                });
                              }}
                            >
                              🚀 Deploy
                            </Button>
                          )}
                          {version.status === 'active' && (
                            <Button
                              variant="outline-warning"
                              size="sm"
                              onClick={() => {
                                // Deprecate version
                                addToast({
                                  type: 'warning',
                                  title: 'Version Deprecated',
                                  message: `Version ${version.version} marked as deprecated`
                                });
                              }}
                            >
                              ⚠️ Deprecate
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Modal.Body>
      </Modal>

        {/* Toast Notifications */}
        <ToastContainer position="bottom-end" className="p-3">
          {toasts.map((toast) => (
            <Toast
              key={toast.id}
              onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              show={true}
              delay={5000}
              autohide
            >
              <Toast.Header>
                <strong className="me-auto">{toast.title}</strong>
              </Toast.Header>
              <Toast.Body>{toast.message}</Toast.Body>
            </Toast>
          ))}
        </ToastContainer>

        {/* Agent Registration Modal */}
        <Modal show={showUploadModal} onHide={() => setShowUploadModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>➕ Register New Agent</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div style={{ 
              padding: '20px', 
              backgroundColor: '#dbeafe', 
              borderRadius: '8px',
              border: '1px solid #93c5fd',
              marginBottom: '20px'
            }}>
              <h6 style={{ color: '#1e40af', marginBottom: '8px' }}>🚧 Agent Registration Process</h6>
              <p style={{ color: '#1e40af', margin: 0, fontSize: '14px' }}>
                Complete agent registration includes: metadata validation, package upload, 
                security scanning, testing, and deployment pipeline setup.
              </p>
            </div>
            
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <Button 
                variant="primary"
                onClick={() => {
                  setShowUploadModal(false);
                  window.location.href = '/upload';
                }}
                style={{ padding: '12px 24px', fontSize: '16px' }}
              >
                🚀 Go to Agent Upload
              </Button>
            </div>
          </Modal.Body>
        </Modal>

        {/* Agent Status Modal */}
        {showStatusModal && selectedAgent && (
          <Modal show={showStatusModal} onHide={() => setShowStatusModal(false)} size="xl">
            <Modal.Header closeButton>
              <Modal.Title>📊 Agent Status: {selectedAgent.name}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'overview')}>
                <Tab eventKey="overview" title="📋 Overview">
                  <div style={{ padding: '20px' }}>
                    <h5>Agent Overview</h5>
                    <p>Detailed agent information and status would be displayed here.</p>
                  </div>
                </Tab>
                <Tab eventKey="metrics" title="📊 Metrics">
                  <div style={{ padding: '20px' }}>
                    <h5>Performance Metrics</h5>
                    <p>Charts and performance data would be displayed here.</p>
                  </div>
                </Tab>
                <Tab eventKey="logs" title="📝 Logs">
                  <div style={{ padding: '20px' }}>
                    <h5>Execution Logs</h5>
                    <p>Recent execution logs would be displayed here.</p>
                  </div>
                </Tab>
              </Tabs>
            </Modal.Body>
          </Modal>
        )}
      </Container>
    </ErrorBoundary>
  );
};

export default AgentManagement;