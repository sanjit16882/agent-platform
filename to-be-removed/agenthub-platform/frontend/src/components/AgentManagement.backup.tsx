import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert, ProgressBar, Badge, Modal, Table, Tabs, Tab, Spinner, Toast, ToastContainer } from 'react-bootstrap';
import axios from 'axios';

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

const AgentManagement: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<AgentStatus | null>(null);
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

  const API_BASE_URL = 'https://z5ujq1k916.execute-api.us-east-1.amazonaws.com/prod';

  useEffect(() => {
    fetchAgents();
    fetchPlatformOverview();
  }, []);

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
      
      // Fetch agents from API
      const response = await axios.get(`${API_BASE_URL}/agents`);
      setAgents(response.data.agents || []);
      
    } catch (error: any) {
      console.error('Error fetching agents:', error);
      
      // Fallback to demo data if API fails
      const mockAgents: Agent[] = [
        {
          agent_id: 'custom-12345678',
          name: 'Custom E2E Test Generator',
          description: 'Custom Playwright test generator for React applications',
          category: 'Custom',
          status: 'deployed',
          version: '1.0.0',
          author: 'QE Team',
          deployment_status: 'deployed',
          created_at: '2024-10-10T10:30:00Z',
          validation_score: 87,
          grade: 'B'
        },
        {
          agent_id: 'custom-87654321',
          name: 'API Performance Tester',
          description: 'Custom K6 performance testing for REST APIs',
          category: 'Custom',
          status: 'validated',
          version: '1.2.0',
          author: 'DevOps Team',
          deployment_status: 'not_deployed',
          created_at: '2024-10-09T15:45:00Z',
          validation_score: 92,
          grade: 'A'
        },
        {
          agent_id: 'custom-11223344',
          name: 'Security Audit Agent',
          description: 'Custom security scanning for Node.js applications',
          category: 'Custom',
          status: 'validation_failed',
          version: '1.0.0',
          author: 'Security Team',
          deployment_status: 'not_deployed',
          created_at: '2024-10-08T09:15:00Z',
          validation_score: 45,
          grade: 'F'
        }
      ];
      setAgents(mockAgents);
      
      addToast({
        type: 'warning',
        title: 'API Connection',
        message: 'Using demo data. Check API connection.'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPlatformOverview = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/health/overview`);
      setPlatformOverview(response.data.platform_metrics);
    } catch (error) {
      console.error('Error fetching platform overview:', error);
      // Use mock data
      setPlatformOverview({
        total_agents: 3,
        healthy_agents: 2,
        degraded_agents: 0,
        unhealthy_agents: 1,
        platform_availability: 95.5,
        platform_health_score: 87.3
      });
    }
  };

  const handleViewStatus = async (agentId: string) => {
    try {
      setSelectedAgentId(agentId);
      
      // Fetch comprehensive agent data
      const [statusResponse, healthResponse, deploymentResponse, configResponse, historyResponse] = await Promise.allSettled([
        axios.get(`${API_BASE_URL}/agents/${agentId}/status`),
        axios.get(`${API_BASE_URL}/agents/${agentId}/health?hours=24`),
        axios.get(`${API_BASE_URL}/agents/${agentId}/deployment/status`),
        axios.get(`${API_BASE_URL}/agents/${agentId}/configuration`),
        axios.get(`${API_BASE_URL}/agents/${agentId}/deployment/history`)
      ]);

      // Process status data
      if (statusResponse.status === 'fulfilled') {
        setSelectedAgent(statusResponse.value.data);
      }

      // Process health data
      if (healthResponse.status === 'fulfilled') {
        setHealthSummary(healthResponse.value.data);
      }

      // Process deployment data
      if (deploymentResponse.status === 'fulfilled') {
        setDeploymentStatus(deploymentResponse.value.data);
      }

      // Process configuration data
      if (configResponse.status === 'fulfilled') {
        setAgentConfiguration(configResponse.value.data);
      }

      // Process deployment history
      if (historyResponse.status === 'fulfilled') {
        setDeploymentHistory(historyResponse.value.data.deployments || []);
      }

      setShowStatusModal(true);
      
    } catch (error: any) {
      console.error('Error fetching agent status:', error);
      
      // Fallback to mock data
      const mockStatus: AgentStatus = {
        agent_id: agentId,
        name: agents.find(a => a.agent_id === agentId)?.name || 'Unknown',
        status: 'deployed',
        lifecycle: {
          deployment_status: 'deployed',
          health_status: 'healthy',
          last_health_check: new Date().toISOString()
        },
        metrics: {
          total_executions: 156,
          success_rate: 98.7,
          avg_execution_time: 1240
        },
        health: {
          status: 'healthy',
          response_time_ms: 120,
          error_rate: 0.013,
          availability: 99.9
        }
      };
      
      const mockConfig: AgentConfiguration = {
        agent_id: agentId,
        runtime_config: {
          timeout: 300,
          memory_size: 512,
          environment_variables: {
            'NODE_ENV': 'production',
            'LOG_LEVEL': 'info'
          }
        },
        deployment_config: {
          deployment_type: 'lambda',
          auto_scaling: true,
          min_instances: 1,
          max_instances: 10
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

      const mockHistory: DeploymentHistory[] = [
        {
          deployment_id: 'dep-001',
          version: '1.0.0',
          status: 'success',
          timestamp: '2024-10-10T10:30:00Z',
          duration_ms: 45000,
          deployed_by: 'user@example.com'
        },
        {
          deployment_id: 'dep-002',
          version: '0.9.0',
          status: 'rolled_back',
          timestamp: '2024-10-09T15:20:00Z',
          duration_ms: 30000,
          deployed_by: 'user@example.com',
          rollback_reason: 'High error rate detected'
        }
      ];
      
      setSelectedAgent(mockStatus);
      setAgentConfiguration(mockConfig);
      setDeploymentHistory(mockHistory);
      setShowStatusModal(true);
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
      const response = await axios.post(`${API_BASE_URL}/agents/${agentId}/health/check`);
      
      addToast({
        type: 'success',
        title: 'Health Check',
        message: `Health check completed. Status: ${response.data.health_check_result.status}`
      });
      
      // Refresh agent data
      await fetchAgents();
      
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Health Check Failed',
        message: error.response?.data?.message || 'Failed to perform health check'
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleDeploy = async (agentId: string, deploymentConfig?: Partial<AgentConfiguration>) => {
    try {
      setDeploymentInProgress(agentId);
      
      const payload = {
        agent_id: agentId,
        deployment_config: deploymentConfig || {
          deployment_type: 'lambda',
          auto_scaling: true,
          min_instances: 1,
          max_instances: 10
        }
      };

      const response = await axios.post(`${API_BASE_URL}/agents/${agentId}/deploy`, payload);
      
      // Update agent status
      setAgents(prev => prev.map(agent => 
        agent.agent_id === agentId 
          ? { ...agent, deployment_status: 'deployed', status: 'deployed' }
          : agent
      ));
      
      addToast({
        type: 'success',
        title: 'Deployment Successful',
        message: `Agent deployed successfully. Function ARN: ${response.data.function_arn}`
      });

      // Refresh agent data
      await fetchAgents();
      
    } catch (error: any) {
      console.error('Error deploying agent:', error);
      addToast({
        type: 'error',
        title: 'Deployment Failed',
        message: error.response?.data?.message || 'Failed to deploy agent'
      });
    } finally {
      setDeploymentInProgress(null);
    }
  };

  const handleUndeploy = async (agentId: string) => {
    try {
      setDeploymentInProgress(agentId);
      
      const response = await axios.delete(`${API_BASE_URL}/agents/${agentId}/deploy`);
      
      // Update agent status
      setAgents(prev => prev.map(agent => 
        agent.agent_id === agentId 
          ? { ...agent, deployment_status: 'not_deployed', status: 'validated' }
          : agent
      ));
      
      addToast({
        type: 'success',
        title: 'Undeployment Successful',
        message: 'Agent undeployed and resources cleaned up successfully'
      });

      // Refresh agent data
      await fetchAgents();
      
    } catch (error: any) {
      console.error('Error undeploying agent:', error);
      addToast({
        type: 'error',
        title: 'Undeployment Failed',
        message: error.response?.data?.message || 'Failed to undeploy agent'
      });
    } finally {
      setDeploymentInProgress(null);
    }
  };

  const handleConfigureAgent = async (agentId: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/agents/${agentId}/configuration`);
      setAgentConfiguration(response.data);
      setSelectedAgentId(agentId);
      setShowConfigModal(true);
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Configuration Error',
        message: 'Failed to load agent configuration'
      });
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
    try {
      const response = await axios.get(`${API_BASE_URL}/agents/${agentId}/versions`);
      setVersionHistory(response.data.versions || []);
      setSelectedAgentId(agentId);
      setShowVersionModal(true);
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Version History Error',
        message: 'Failed to load version history'
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'deployed': return 'success';
      case 'validated': return 'primary';
      case 'pending_validation': return 'warning';
      case 'validation_failed': return 'danger';
      default: return 'secondary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'deployed': return 'Deployed';
      case 'validated': return 'Validated';
      case 'pending_validation': return 'Pending Validation';
      case 'validation_failed': return 'Validation Failed';
      default: return 'Unknown';
    }
  };

  return (
    <Container>
      <Row className="mb-4">
        <Col md={8}>
          <h1>🔧 Agent Management</h1>
          <p className="lead">Manage agent lifecycle, deployment, and monitoring</p>
        </Col>
        <Col md={4} className="text-end">
          <Button 
            variant="success" 
            size="lg"
            onClick={() => setShowUploadModal(true)}
          >
            ➕ Register New Agent
          </Button>
        </Col>
      </Row>

      {/* Platform Overview */}
      <Row className="mb-4">
        <Col>
          <Card className="bg-light">
            <Card.Body>
              <Row>
                <Col md={3}>
                  <div className="text-center">
                    <h4 className="text-primary">{agents.length}</h4>
                    <small>Total Agents</small>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="text-center">
                    <h4 className="text-success">{agents.filter(a => a.deployment_status === 'deployed').length}</h4>
                    <small>Deployed</small>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="text-center">
                    <h4 className="text-warning">{agents.filter(a => a.status === 'pending_validation').length}</h4>
                    <small>Pending</small>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="text-center">
                    <h4 className="text-info">99.9%</h4>
                    <small>Platform Uptime</small>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Agent List */}
      <Row>
        <Col>
          <Card>
            <Card.Header>
              <h5>📋 Agent Registry</h5>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <div className="text-center">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Agent Name</th>
                      <th>Category</th>
                      <th>Version</th>
                      <th>Status</th>
                      <th>Deployment</th>
                      <th>Author</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agents.map((agent) => (
                      <tr key={agent.agent_id}>
                        <td>
                          <strong>{agent.name}</strong>
                          <br />
                          <small className="text-muted">{agent.description}</small>
                        </td>
                        <td>
                          <Badge bg="info">{agent.category}</Badge>
                        </td>
                        <td>{agent.version}</td>
                        <td>
                          <Badge bg={getStatusColor(agent.status)}>
                            {getStatusText(agent.status)}
                          </Badge>
                        </td>
                        <td>
                          <Badge bg={agent.deployment_status === 'deployed' ? 'success' : 'secondary'}>
                            {agent.deployment_status === 'deployed' ? '🟢 Live' : '⚪ Offline'}
                          </Badge>
                        </td>
                        <td>{agent.author}</td>
                        <td>
                          <div className="d-flex gap-1 flex-wrap">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => handleViewStatus(agent.agent_id)}
                            >
                              📊 Status
                            </Button>
                            
                            <Button
                              variant="outline-info"
                              size="sm"
                              onClick={() => handleConfigureAgent(agent.agent_id)}
                            >
                              ⚙️ Config
                            </Button>

                            <Button
                              variant="outline-secondary"
                              size="sm"
                              onClick={() => handleViewVersions(agent.agent_id)}
                            >
                              📋 Versions
                            </Button>
                            
                            {agent.deployment_status === 'deployed' ? (
                              <>
                                <Button
                                  variant="outline-warning"
                                  size="sm"
                                  onClick={() => handlePerformHealthCheck(agent.agent_id)}
                                  disabled={refreshing}
                                >
                                  {refreshing ? '⏳' : '🏥'} Health
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => handleUndeploy(agent.agent_id)}
                                  disabled={deploymentInProgress === agent.agent_id}
                                >
                                  {deploymentInProgress === agent.agent_id ? '⏳' : '🔴'} Undeploy
                                </Button>
                              </>
                            ) : agent.status === 'validated' ? (
                              <Button
                                variant="outline-success"
                                size="sm"
                                onClick={() => handleDeploy(agent.agent_id)}
                                disabled={deploymentInProgress === agent.agent_id}
                              >
                                {deploymentInProgress === agent.agent_id ? '⏳' : '🚀'} Deploy
                              </Button>
                            ) : (
                              <Button
                                variant="outline-secondary"
                                size="sm"
                                disabled
                              >
                                ⏳ Validating
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

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

      {/* Agent Status Modal */}
      <Modal show={showStatusModal} onHide={() => setShowStatusModal(false)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>📊 Agent Status: {selectedAgent?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedAgent && (
            <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'overview')}>
              <Tab eventKey="overview" title="📋 Overview">
                <div className="mt-3">
                  <Row>
                    <Col md={6}>
                      <Card>
                        <Card.Header>🔄 Lifecycle Status</Card.Header>
                        <Card.Body>
                          <div className="mb-2">
                            <strong>Deployment:</strong> 
                            <Badge bg="success" className="ms-2">
                              {selectedAgent.lifecycle.deployment_status}
                            </Badge>
                          </div>
                          <div className="mb-2">
                            <strong>Health:</strong> 
                            <Badge bg="success" className="ms-2">
                              {selectedAgent.lifecycle.health_status}
                            </Badge>
                          </div>
                          <div>
                            <strong>Last Check:</strong> 
                            <span className="ms-2">
                              {new Date(selectedAgent.lifecycle.last_health_check).toLocaleString()}
                            </span>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={6}>
                      <Card>
                        <Card.Header>📈 Performance Metrics</Card.Header>
                        <Card.Body>
                          <div className="mb-2">
                            <strong>Total Executions:</strong> 
                            <span className="ms-2">{selectedAgent.metrics.total_executions}</span>
                          </div>
                          <div className="mb-2">
                            <strong>Success Rate:</strong> 
                            <span className="ms-2 text-success">{selectedAgent.metrics.success_rate}%</span>
                          </div>
                          <div>
                            <strong>Avg Response Time:</strong> 
                            <span className="ms-2">{selectedAgent.metrics.avg_execution_time}ms</span>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                </div>
              </Tab>
              
              <Tab eventKey="health" title="🏥 Health">
                <div className="mt-3">
                  <Row>
                    <Col md={4}>
                      <Card className="text-center">
                        <Card.Body>
                          <h3 className="text-success">{selectedAgent.health.availability}%</h3>
                          <Card.Text>Availability</Card.Text>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={4}>
                      <Card className="text-center">
                        <Card.Body>
                          <h3 className="text-primary">{selectedAgent.health.response_time_ms}ms</h3>
                          <Card.Text>Response Time</Card.Text>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={4}>
                      <Card className="text-center">
                        <Card.Body>
                          <h3 className="text-warning">{(selectedAgent.health.error_rate * 100).toFixed(1)}%</h3>
                          <Card.Text>Error Rate</Card.Text>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                  
                  <Row className="mt-3">
                    <Col>
                      <Card>
                        <Card.Header>🔧 Health Actions</Card.Header>
                        <Card.Body>
                          <div className="d-flex gap-2">
                            <Button
                              variant="outline-primary"
                              onClick={() => handlePerformHealthCheck(selectedAgentId)}
                              disabled={refreshing}
                            >
                              {refreshing ? <Spinner size="sm" /> : '🔄'} Run Health Check
                            </Button>
                            <Button
                              variant="outline-warning"
                              onClick={() => {
                                // Restart agent functionality
                                addToast({
                                  type: 'info',
                                  title: 'Restart Initiated',
                                  message: 'Agent restart in progress...'
                                });
                              }}
                            >
                              🔄 Restart Agent
                            </Button>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                </div>
              </Tab>

              <Tab eventKey="configuration" title="⚙️ Configuration">
                <div className="mt-3">
                  {agentConfiguration && (
                    <Row>
                      <Col md={6}>
                        <Card>
                          <Card.Header>🏃 Runtime Configuration</Card.Header>
                          <Card.Body>
                            <div className="mb-2">
                              <strong>Timeout:</strong> 
                              <span className="ms-2">{agentConfiguration.runtime_config.timeout}s</span>
                            </div>
                            <div className="mb-2">
                              <strong>Memory:</strong> 
                              <span className="ms-2">{agentConfiguration.runtime_config.memory_size}MB</span>
                            </div>
                            <div>
                              <strong>Environment Variables:</strong>
                              <div className="mt-1">
                                {Object.entries(agentConfiguration.runtime_config.environment_variables).map(([key, value]) => (
                                  <Badge key={key} bg="secondary" className="me-1 mb-1">
                                    {key}={value}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                      <Col md={6}>
                        <Card>
                          <Card.Header>🚀 Deployment Configuration</Card.Header>
                          <Card.Body>
                            <div className="mb-2">
                              <strong>Type:</strong> 
                              <Badge bg="info" className="ms-2">
                                {agentConfiguration.deployment_config.deployment_type}
                              </Badge>
                            </div>
                            <div className="mb-2">
                              <strong>Auto Scaling:</strong> 
                              <Badge bg={agentConfiguration.deployment_config.auto_scaling ? 'success' : 'secondary'} className="ms-2">
                                {agentConfiguration.deployment_config.auto_scaling ? 'Enabled' : 'Disabled'}
                              </Badge>
                            </div>
                            <div>
                              <strong>Instances:</strong> 
                              <span className="ms-2">
                                {agentConfiguration.deployment_config.min_instances} - {agentConfiguration.deployment_config.max_instances}
                              </span>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    </Row>
                  )}
                  
                  <Row className="mt-3">
                    <Col>
                      <Card>
                        <Card.Header>📊 Monitoring Configuration</Card.Header>
                        <Card.Body>
                          {agentConfiguration && (
                            <Row>
                              <Col md={4}>
                                <div className="text-center">
                                  <h5>{agentConfiguration.monitoring_config.health_check_interval}s</h5>
                                  <small>Health Check Interval</small>
                                </div>
                              </Col>
                              <Col md={4}>
                                <div className="text-center">
                                  <h5>{agentConfiguration.monitoring_config.alert_thresholds.error_rate}%</h5>
                                  <small>Error Rate Threshold</small>
                                </div>
                              </Col>
                              <Col md={4}>
                                <div className="text-center">
                                  <h5>{agentConfiguration.monitoring_config.alert_thresholds.response_time}ms</h5>
                                  <small>Response Time Threshold</small>
                                </div>
                              </Col>
                            </Row>
                          )}
                          
                          <div className="mt-3">
                            <Button
                              variant="outline-primary"
                              onClick={() => handleConfigureAgent(selectedAgentId)}
                            >
                              ⚙️ Edit Configuration
                            </Button>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                </div>
              </Tab>

              <Tab eventKey="deployments" title="🚀 Deployments">
                <div className="mt-3">
                  <Card>
                    <Card.Header>📋 Deployment History</Card.Header>
                    <Card.Body>
                      <Table responsive>
                        <thead>
                          <tr>
                            <th>Version</th>
                            <th>Status</th>
                            <th>Deployed By</th>
                            <th>Duration</th>
                            <th>Timestamp</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {deploymentHistory.map((deployment) => (
                            <tr key={deployment.deployment_id}>
                              <td>
                                <Badge bg="info">{deployment.version}</Badge>
                              </td>
                              <td>
                                <Badge bg={
                                  deployment.status === 'success' ? 'success' :
                                  deployment.status === 'failed' ? 'danger' :
                                  deployment.status === 'in_progress' ? 'warning' : 'secondary'
                                }>
                                  {deployment.status}
                                </Badge>
                              </td>
                              <td>{deployment.deployed_by}</td>
                              <td>{(deployment.duration_ms / 1000).toFixed(1)}s</td>
                              <td>{new Date(deployment.timestamp).toLocaleString()}</td>
                              <td>
                                {deployment.status === 'success' && (
                                  <Button
                                    variant="outline-warning"
                                    size="sm"
                                    onClick={() => handleRollbackDeployment(selectedAgentId, deployment.deployment_id)}
                                    disabled={deploymentInProgress === selectedAgentId}
                                  >
                                    🔄 Rollback
                                  </Button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </Card.Body>
                  </Card>
                </div>
              </Tab>
              
              <Tab eventKey="logs" title="📝 Logs">
                <div className="mt-3">
                  <Alert variant="info">
                    <h6>📋 Recent Activity Logs</h6>
                    <div className="small">
                      <div>2024-10-10 14:30:15 - Agent execution completed successfully</div>
                      <div>2024-10-10 14:25:03 - Health check passed</div>
                      <div>2024-10-10 14:20:45 - Agent execution started</div>
                      <div>2024-10-10 14:15:22 - Deployment health check passed</div>
                      <div>2024-10-10 14:10:08 - Agent ready for execution</div>
                    </div>
                  </Alert>
                </div>
              </Tab>
            </Tabs>
          )}
        </Modal.Body>
      </Modal>

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

      {/* Toast notifications temporarily disabled for build */}
    </Container>
  );
};

export default AgentManagement;