import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Alert, Form, Modal, Table, Spinner } from 'react-bootstrap';
import PermissionGuard from './PermissionGuard';
import { usePermissions } from '../hooks/usePermissions';
import { useAgentContext } from '../context/AgentContext';
import { FaRocket, FaServer, FaShieldAlt, FaExclamationTriangle, FaPlay, FaHistory, FaChartLine } from 'react-icons/fa';

// Type assertions for React Icons
const RocketIcon = FaRocket as any;
const ServerIcon = FaServer as any;
const ShieldIcon = FaShieldAlt as any;
const WarningIcon = FaExclamationTriangle as any;
const PlayIcon = FaPlay as any;
const HistoryIcon = FaHistory as any;
const ChartIcon = FaChartLine as any;

interface Environment {
  id: string;
  name: string;
  type: 'development' | 'staging' | 'production';
  description: string;
  requiredPermissions: string[];
  approvalRequired: boolean;
  status: 'active' | 'maintenance' | 'restricted';
}

interface DeploymentRecord {
  id: string;
  agentName: string;
  environment: string;
  status: 'success' | 'failed' | 'in_progress';
  deployedAt: string;
  deployedBy: string;
  version: string;
  notes?: string;
}

interface DeploymentControlProps {
  agentId?: string;
  agentName?: string;
}

const DeploymentControl: React.FC<DeploymentControlProps> = ({ 
  agentId = 'agent-1', 
  agentName = 'Sample Agent' 
}) => {
  const { hasPermission, user, getAccessLevel } = usePermissions();
  const { deployedAgents } = useAgentContext();
  const [selectedEnvironment, setSelectedEnvironment] = useState<Environment | null>(null);
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [deploymentNotes, setDeploymentNotes] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [deploymentHistory, setDeploymentHistory] = useState<DeploymentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'deploy' | 'history' | 'monitoring'>('deploy');

  // Load deployment history on component mount
  useEffect(() => {
    loadDeploymentHistory();
  }, []);

  const loadDeploymentHistory = () => {
    // Mock deployment history - in real app, this would come from API
    const mockHistory: DeploymentRecord[] = [
      {
        id: '1',
        agentName: 'Code Review Assistant',
        environment: 'Production',
        status: 'success',
        deployedAt: '2024-10-29T10:30:00Z',
        deployedBy: 'John Doe',
        version: 'v1.2.0',
        notes: 'Security patches and performance improvements'
      },
      {
        id: '2',
        agentName: 'QE Test Generator',
        environment: 'Staging',
        status: 'success',
        deployedAt: '2024-10-29T09:15:00Z',
        deployedBy: 'Jane Smith',
        version: 'v2.1.0',
        notes: 'Added support for React testing'
      },
      {
        id: '3',
        agentName: 'Security Scanner',
        environment: 'Development',
        status: 'failed',
        deployedAt: '2024-10-29T08:45:00Z',
        deployedBy: 'Mike Johnson',
        version: 'v1.0.1',
        notes: 'Configuration validation failed'
      }
    ];
    setDeploymentHistory(mockHistory);
  };

  const environments: Environment[] = [
    {
      id: 'dev',
      name: 'Development',
      type: 'development',
      description: 'Development environment for testing and experimentation',
      requiredPermissions: ['agent.deploy'],
      approvalRequired: false,
      status: 'active'
    },
    {
      id: 'staging',
      name: 'Staging',
      type: 'staging',
      description: 'Pre-production environment for final testing',
      requiredPermissions: ['agent.deploy'],
      approvalRequired: true,
      status: 'active'
    },
    {
      id: 'prod',
      name: 'Production',
      type: 'production',
      description: 'Live production environment',
      requiredPermissions: ['agent.deploy', 'system.admin'],
      approvalRequired: true,
      status: 'active'
    }
  ];

  const canDeployToEnvironment = (env: Environment): boolean => {
    // Admin can deploy anywhere
    if (hasPermission('all')) return true;
    
    // Check specific environment permissions
    switch (env.type) {
      case 'development':
        return hasPermission(['agent.deploy', 'agent.manage'], false);
      case 'staging':
        return hasPermission(['agent.deploy']) && (user?.role === 'Developer' || user?.role === 'Admin');
      case 'production':
        return hasPermission(['agent.deploy', 'system.admin'], true) || user?.role === 'Admin';
      default:
        return false;
    }
  };

  const getEnvironmentBadge = (env: Environment) => {
    switch (env.type) {
      case 'development':
        return <Badge bg="info">Development</Badge>;
      case 'staging':
        return <Badge bg="warning">Staging</Badge>;
      case 'production':
        return <Badge bg="danger">Production</Badge>;
      default:
        return <Badge bg="secondary">{env.type}</Badge>;
    }
  };

  const getAccessLevelBadge = () => {
    const level = getAccessLevel();
    switch (level) {
      case 'admin':
        return <Badge bg="danger">Full Access</Badge>;
      case 'power-user':
        return <Badge bg="warning">Limited Production</Badge>;
      case 'standard':
        return <Badge bg="info">Dev/Staging Only</Badge>;
      default:
        return <Badge bg="secondary">View Only</Badge>;
    }
  };

  const handleDeploy = (env: Environment) => {
    if (!selectedAgent) {
      alert('Please select an agent first');
      return;
    }
    setSelectedEnvironment(env);
    setShowDeployModal(true);
  };

  const confirmDeploy = () => {
    if (!selectedAgent || !selectedEnvironment) return;
    
    const selectedAgentData = deployedAgents.find(a => a.id === selectedAgent);
    
    // Here you would implement the actual deployment logic
    console.log(`Deploying ${selectedAgentData?.name} to ${selectedEnvironment.name}`);
    console.log('Deployment notes:', deploymentNotes);
    
    // Add to deployment history
    const newDeployment: DeploymentRecord = {
      id: Date.now().toString(),
      agentName: selectedAgentData?.name || 'Unknown Agent',
      environment: selectedEnvironment.name,
      status: 'success',
      deployedAt: new Date().toISOString(),
      deployedBy: user?.name || 'Unknown User',
      version: 'v1.0.0',
      notes: deploymentNotes
    };
    
    setDeploymentHistory(prev => [newDeployment, ...prev]);
    
    // Close modal and reset state
    setShowDeployModal(false);
    setSelectedEnvironment(null);
    setDeploymentNotes('');
    
    // Show success message
    alert(`Successfully deployed ${selectedAgentData?.name} to ${selectedEnvironment.name}!`);
  };

  // Render functions for different tabs
  const renderDeployTab = () => (
    <div>
      {!selectedAgent && (
        <Alert variant="info">
          <strong>Select an agent</strong> from the dropdown above to begin deployment.
        </Alert>
      )}
      
      {selectedAgent && (
        <Row>
          {environments.map((env) => {
            const canDeploy = canDeployToEnvironment(env);
            const hasRequiredPermissions = env.requiredPermissions.every(perm => hasPermission(perm));
            
            return (
              <Col md={4} key={env.id} className="mb-4">
                <Card className={`h-100 ${canDeploy ? 'border-success' : 'border-secondary'}`}>
                  <Card.Header className="d-flex justify-content-between align-items-center">
                    <div>
                      <ServerIcon className="me-2" />
                      <strong>{env.name}</strong>
                    </div>
                    {getEnvironmentBadge(env)}
                  </Card.Header>
                  <Card.Body>
                    <p className="text-muted small mb-3">
                      {env.description}
                    </p>
                    
                    {/* Permission Requirements */}
                    <div className="mb-3">
                      <small className="text-muted">Required Permissions:</small>
                      <div className="mt-1">
                        {env.requiredPermissions.map((perm, index) => (
                          <Badge 
                            key={index} 
                            bg={hasPermission(perm) ? 'success' : 'secondary'} 
                            className="me-1 mb-1"
                          >
                            {hasPermission(perm) ? '✓' : '✗'} {perm}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Approval Requirements */}
                    {env.approvalRequired && (
                      <div className="mb-3">
                        <Badge bg="warning" className="mb-2">
                          <ShieldIcon className="me-1" />
                          Approval Required
                        </Badge>
                        <br />
                        <small className="text-muted">
                          Deployments require manager approval
                        </small>
                      </div>
                    )}

                    {/* Access Control Messages */}
                    {!canDeploy && (
                      <Alert variant="warning" className="small mb-3">
                        <WarningIcon className="me-1" />
                        <strong>Access Restricted:</strong>
                        <br />
                        {!hasRequiredPermissions && "Missing required permissions"}
                        {env.type === 'production' && user?.role !== 'Admin' && user?.role !== 'Developer' && 
                          " Production access limited to Admins and Senior Developers"}
                      </Alert>
                    )}

                    {/* Deployment Button */}
                    <div className="d-grid">
                      <Button
                        variant={canDeploy ? 'primary' : 'secondary'}
                        disabled={!canDeploy}
                        onClick={() => handleDeploy(env)}
                      >
                        <RocketIcon className="me-1" />
                        {canDeploy ? 'Deploy' : 'Access Denied'}
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}
    </div>
  );

  const renderHistoryTab = () => (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5>Recent Deployments</h5>
        <Button variant="outline-primary" size="sm" onClick={loadDeploymentHistory}>
          <HistoryIcon className="me-1" />
          Refresh
        </Button>
      </div>
      
      {deploymentHistory.length === 0 ? (
        <Alert variant="info">
          No deployment history available.
        </Alert>
      ) : (
        <Table responsive hover>
          <thead>
            <tr>
              <th>Agent</th>
              <th>Environment</th>
              <th>Status</th>
              <th>Version</th>
              <th>Deployed By</th>
              <th>Deployed At</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {deploymentHistory.map((record) => (
              <tr key={record.id}>
                <td><strong>{record.agentName}</strong></td>
                <td>
                  <Badge bg={
                    record.environment === 'Production' ? 'danger' :
                    record.environment === 'Staging' ? 'warning' : 'info'
                  }>
                    {record.environment}
                  </Badge>
                </td>
                <td>
                  <Badge bg={
                    record.status === 'success' ? 'success' :
                    record.status === 'failed' ? 'danger' : 'warning'
                  }>
                    {record.status === 'success' ? '✓ Success' :
                     record.status === 'failed' ? '✗ Failed' : '⏳ In Progress'}
                  </Badge>
                </td>
                <td><code>{record.version}</code></td>
                <td>{record.deployedBy}</td>
                <td>{new Date(record.deployedAt).toLocaleString()}</td>
                <td>
                  <small className="text-muted">
                    {record.notes || 'No notes'}
                  </small>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );

  const renderMonitoringTab = () => (
    <div>
      <Row>
        <Col md={4}>
          <Card className="text-center mb-3">
            <Card.Body>
              <h3 className="text-success">{deployedAgents.filter(a => a.status === 'active').length}</h3>
              <small>ACTIVE DEPLOYMENTS</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center mb-3">
            <Card.Body>
              <h3 className="text-info">{deploymentHistory.filter(d => d.status === 'success').length}</h3>
              <small>SUCCESSFUL DEPLOYMENTS</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center mb-3">
            <Card.Body>
              <h3 className="text-warning">{deploymentHistory.filter(d => d.status === 'failed').length}</h3>
              <small>FAILED DEPLOYMENTS</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card>
        <Card.Header>
          <h6 className="mb-0">Environment Health Status</h6>
        </Card.Header>
        <Card.Body>
          {environments.map((env) => (
            <div key={env.id} className="d-flex justify-content-between align-items-center mb-2">
              <div>
                <strong>{env.name}</strong>
                <br />
                <small className="text-muted">{env.description}</small>
              </div>
              <div>
                <Badge bg={env.status === 'active' ? 'success' : 'warning'}>
                  {env.status === 'active' ? '✓ Healthy' : '⚠ Maintenance'}
                </Badge>
              </div>
            </div>
          ))}
        </Card.Body>
      </Card>
    </div>
  );

  return (
    <PermissionGuard permission="agent.view">
      <div className="container-fluid py-4">
        {/* Modern Header - Consistent with other pages */}
        <Card className="mb-4">
          <Card.Header className="bg-primary text-white">
            <h4 className="mb-1">🚀 Agent Deployment Center</h4>
            <p className="mb-0" style={{ fontSize: '0.95rem', opacity: '0.95' }}>
              Deploy and monitor your agents across different environments
            </p>
          </Card.Header>
          <Card.Body>
            <Row className="align-items-center">
              <Col md={6}>
                <div>
                  <strong>Access Level:</strong> {getAccessLevelBadge()}
                  <br />
                  <small className="text-muted">
                    Logged in as: <strong>{user?.name}</strong> ({user?.role})
                  </small>
                </div>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label><strong>Select Agent to Deploy:</strong></Form.Label>
                  <Form.Select 
                    value={selectedAgent} 
                    onChange={(e) => setSelectedAgent(e.target.value)}
                  >
                    <option value="">Choose an agent...</option>
                    {deployedAgents.map(agent => (
                      <option key={agent.id} value={agent.id}>
                        {agent.name} ({agent.category})
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Tab Navigation */}
        <Card className="mb-4">
          <Card.Header className="p-0">
            <div className="d-flex">
              <Button
                variant={activeTab === 'deploy' ? 'primary' : 'outline-primary'}
                className="rounded-0 border-0"
                onClick={() => setActiveTab('deploy')}
              >
                <RocketIcon className="me-2" />
                Deploy Agents
              </Button>
              <Button
                variant={activeTab === 'history' ? 'primary' : 'outline-primary'}
                className="rounded-0 border-0"
                onClick={() => setActiveTab('history')}
              >
                <HistoryIcon className="me-2" />
                Deployment History
              </Button>
              <Button
                variant={activeTab === 'monitoring' ? 'primary' : 'outline-primary'}
                className="rounded-0 border-0"
                onClick={() => setActiveTab('monitoring')}
              >
                <ChartIcon className="me-2" />
                Environment Monitoring
              </Button>
            </div>
          </Card.Header>
          <Card.Body>
            {activeTab === 'deploy' && renderDeployTab()}
            {activeTab === 'history' && renderHistoryTab()}
            {activeTab === 'monitoring' && renderMonitoringTab()}
          </Card.Body>
        </Card>



        {/* Deployment Confirmation Modal */}
        <Modal show={showDeployModal} onHide={() => setShowDeployModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>
              Deploy to {selectedEnvironment?.name}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedEnvironment && (
              <>
                <Alert variant={selectedEnvironment.type === 'production' ? 'danger' : 'warning'}>
                  <strong>Deployment Confirmation</strong>
                  <br />
                  You are about to deploy <strong>{agentName}</strong> to the{' '}
                  <strong>{selectedEnvironment.name}</strong> environment.
                  {selectedEnvironment.approvalRequired && (
                    <>
                      <br />
                      <WarningIcon className="me-1" />
                      This deployment requires approval.
                    </>
                  )}
                </Alert>

                <Form.Group className="mb-3">
                  <Form.Label>Deployment Notes</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={deploymentNotes}
                    onChange={(e) => setDeploymentNotes(e.target.value)}
                    placeholder="Enter deployment notes, change description, or approval justification..."
                    required={selectedEnvironment.approvalRequired}
                  />
                </Form.Group>
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDeployModal(false)}>
              Cancel
            </Button>
            <Button 
              variant={selectedEnvironment?.type === 'production' ? 'danger' : 'primary'}
              onClick={confirmDeploy}
              disabled={selectedEnvironment?.approvalRequired && !deploymentNotes.trim()}
            >
              <RocketIcon className="me-1" />
              {selectedEnvironment?.approvalRequired ? 'Submit for Approval' : 'Deploy Now'}
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </PermissionGuard>
  );
};

export default DeploymentControl;