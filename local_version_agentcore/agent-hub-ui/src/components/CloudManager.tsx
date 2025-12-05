import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Badge, Alert, Modal, Form, Tabs, Tab, ProgressBar } from 'react-bootstrap';
import PermissionGuard from './PermissionGuard';
import { usePermissions } from '../hooks/usePermissions';
import { FaCloud, FaAws, FaMicrosoft, FaGoogle, FaServer, FaCog, FaDollarSign, FaExchangeAlt } from 'react-icons/fa';

// Type assertions for React Icons
const CloudIcon = FaCloud as any;
const AwsIcon = FaAws as any;
const AzureIcon = FaMicrosoft as any;
const GcpIcon = FaGoogle as any;
const ServerIcon = FaServer as any;
const CogIcon = FaCog as any;
const DollarIcon = FaDollarSign as any;
const ExchangeIcon = FaExchangeAlt as any;

interface CloudProvider {
  id: string;
  name: string;
  type: 'aws' | 'azure' | 'gcp' | 'openai' | 'anthropic' | 'onpremise';
  status: 'connected' | 'disconnected' | 'error';
  region: string;
  costPerHour: number;
  activeAgents: number;
  capabilities: string[];
  lastSync: string;
}

interface AIModel {
  id: string;
  name: string;
  provider: string;
  type: 'llm' | 'embedding' | 'vision' | 'audio';
  costPer1kTokens: number;
  maxTokens: number;
  status: 'available' | 'unavailable';
}

interface DeploymentTarget {
  id: string;
  name: string;
  provider: string;
  environment: 'development' | 'staging' | 'production';
  region: string;
  cost: number;
  performance: number;
  availability: number;
}

const CloudManager: React.FC = () => {
  const { hasPermission, user } = usePermissions();
  const [cloudProviders, setCloudProviders] = useState<CloudProvider[]>([]);
  const [aiModels, setAiModels] = useState<AIModel[]>([]);
  const [deploymentTargets, setDeploymentTargets] = useState<DeploymentTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddProviderModal, setShowAddProviderModal] = useState(false);
  const [showMigrationModal, setShowMigrationModal] = useState(false);

  useEffect(() => {
    // Simulate fetching cloud data
    setTimeout(() => {
      setCloudProviders([
        {
          id: 'aws-us-east-1',
          name: 'AWS US East',
          type: 'aws',
          status: 'connected',
          region: 'us-east-1',
          costPerHour: 0.45,
          activeAgents: 12,
          capabilities: ['compute', 'storage', 'ai', 'database'],
          lastSync: '2024-01-15T11:30:00Z'
        },
        {
          id: 'azure-east-us',
          name: 'Azure East US',
          type: 'azure',
          status: 'connected',
          region: 'eastus',
          costPerHour: 0.52,
          activeAgents: 8,
          capabilities: ['compute', 'storage', 'ai', 'cognitive'],
          lastSync: '2024-01-15T11:25:00Z'
        },
        {
          id: 'gcp-us-central1',
          name: 'GCP US Central',
          type: 'gcp',
          status: 'connected',
          region: 'us-central1',
          costPerHour: 0.48,
          activeAgents: 5,
          capabilities: ['compute', 'storage', 'ai', 'ml'],
          lastSync: '2024-01-15T11:20:00Z'
        },
        {
          id: 'openai-api',
          name: 'OpenAI API',
          type: 'openai',
          status: 'connected',
          region: 'global',
          costPerHour: 0.15,
          activeAgents: 15,
          capabilities: ['gpt-4', 'gpt-3.5', 'embeddings', 'dall-e'],
          lastSync: '2024-01-15T11:35:00Z'
        },
        {
          id: 'anthropic-api',
          name: 'Anthropic Claude',
          type: 'anthropic',
          status: 'connected',
          region: 'global',
          costPerHour: 0.12,
          activeAgents: 7,
          capabilities: ['claude-3', 'claude-2', 'analysis'],
          lastSync: '2024-01-15T11:28:00Z'
        }
      ]);

      setAiModels([
        {
          id: 'gpt-4',
          name: 'GPT-4',
          provider: 'OpenAI',
          type: 'llm',
          costPer1kTokens: 0.03,
          maxTokens: 8192,
          status: 'available'
        },
        {
          id: 'claude-3-opus',
          name: 'Claude 3 Opus',
          provider: 'Anthropic',
          type: 'llm',
          costPer1kTokens: 0.015,
          maxTokens: 200000,
          status: 'available'
        },
        {
          id: 'azure-gpt-4',
          name: 'Azure OpenAI GPT-4',
          provider: 'Azure',
          type: 'llm',
          costPer1kTokens: 0.025,
          maxTokens: 8192,
          status: 'available'
        },
        {
          id: 'vertex-palm',
          name: 'Vertex AI PaLM',
          provider: 'GCP',
          type: 'llm',
          costPer1kTokens: 0.02,
          maxTokens: 8192,
          status: 'available'
        }
      ]);

      setDeploymentTargets([
        {
          id: 'aws-dev',
          name: 'AWS Development',
          provider: 'AWS',
          environment: 'development',
          region: 'us-east-1',
          cost: 85,
          performance: 92,
          availability: 99.5
        },
        {
          id: 'azure-staging',
          name: 'Azure Staging',
          provider: 'Azure',
          environment: 'staging',
          region: 'eastus',
          cost: 78,
          performance: 88,
          availability: 99.8
        },
        {
          id: 'gcp-prod',
          name: 'GCP Production',
          provider: 'GCP',
          environment: 'production',
          region: 'us-central1',
          cost: 92,
          performance: 95,
          availability: 99.9
        }
      ]);

      setLoading(false);
    }, 1000);
  }, []);

  const getProviderIcon = (type: string) => {
    switch (type) {
      case 'aws': return <AwsIcon className="text-warning" />;
      case 'azure': return <AzureIcon className="text-primary" />;
      case 'gcp': return <GcpIcon className="text-success" />;
      case 'openai': return <span className="text-info">🤖</span>;
      case 'anthropic': return <span className="text-purple">🧠</span>;
      default: return <ServerIcon />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected': return <Badge bg="success">Connected</Badge>;
      case 'disconnected': return <Badge bg="secondary">Disconnected</Badge>;
      case 'error': return <Badge bg="danger">Error</Badge>;
      default: return <Badge bg="secondary">{status}</Badge>;
    }
  };

  const getModelTypeBadge = (type: string) => {
    switch (type) {
      case 'llm': return <Badge bg="primary">LLM</Badge>;
      case 'embedding': return <Badge bg="info">Embedding</Badge>;
      case 'vision': return <Badge bg="success">Vision</Badge>;
      case 'audio': return <Badge bg="warning">Audio</Badge>;
      default: return <Badge bg="secondary">{type}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const totalCostPerHour = cloudProviders.reduce((sum, provider) => sum + provider.costPerHour, 0);
  const totalActiveAgents = cloudProviders.reduce((sum, provider) => sum + provider.activeAgents, 0);

  if (loading) {
    return (
      <Container className="mt-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <PermissionGuard permission={['system.admin', 'integration.manage']} requireAll={false}>
      <Container fluid className="mt-4">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="mb-1">
              <CloudIcon className="me-2" />
              Multi-Cloud Foundation
            </h2>
            <p className="text-muted mb-0">
              Vendor-neutral cloud management and AI model integration
            </p>
          </div>
          <div>
            <Badge bg="info" className="me-2">
              Role: {user?.role}
            </Badge>
            <Button variant="primary" className="me-2" onClick={() => setShowAddProviderModal(true)}>
              <CloudIcon className="me-2" />
              Add Provider
            </Button>
            <Button variant="success" onClick={() => setShowMigrationModal(true)}>
              <ExchangeIcon className="me-2" />
              Migrate Agents
            </Button>
          </div>
        </div>

        {/* Vendor Neutrality Notice */}
        <Alert variant="info" className="mb-4">
          <strong>🌐 Vendor-Neutral Platform:</strong> Deploy agents across any cloud provider without vendor lock-in. 
          Switch providers, optimize costs, and avoid dependency on single vendors.
        </Alert>

        {/* Statistics Cards */}
        <Row className="mb-4">
          <Col md={3}>
            <Card className="text-center">
              <Card.Body>
                <h4 className="text-primary">{cloudProviders.length}</h4>
                <small className="text-muted">Connected Providers</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center">
              <Card.Body>
                <h4 className="text-success">{totalActiveAgents}</h4>
                <small className="text-muted">Active Agents</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center">
              <Card.Body>
                <h4 className="text-warning">{formatCurrency(totalCostPerHour)}</h4>
                <small className="text-muted">Cost per Hour</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center">
              <Card.Body>
                <h4 className="text-info">{aiModels.length}</h4>
                <small className="text-muted">AI Models</small>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Main Content Tabs */}
        <Tabs defaultActiveKey="providers" className="mb-4">
          <Tab eventKey="providers" title="Cloud Providers">
            <Card>
              <Card.Header>
                <h5 className="mb-0">
                  <CloudIcon className="me-2" />
                  Connected Cloud Providers
                </h5>
              </Card.Header>
              <Card.Body className="p-0">
                <Table responsive hover className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Provider</th>
                      <th>Status</th>
                      <th>Region</th>
                      <th>Active Agents</th>
                      <th>Cost/Hour</th>
                      <th>Capabilities</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cloudProviders.map((provider) => (
                      <tr key={provider.id}>
                        <td>
                          <div className="d-flex align-items-center">
                            {getProviderIcon(provider.type)}
                            <div className="ms-2">
                              <strong>{provider.name}</strong>
                              <br />
                              <small className="text-muted">{provider.type.toUpperCase()}</small>
                            </div>
                          </div>
                        </td>
                        <td>{getStatusBadge(provider.status)}</td>
                        <td>
                          <Badge bg="light" text="dark">{provider.region}</Badge>
                        </td>
                        <td>
                          <span className="fw-bold">{provider.activeAgents}</span>
                        </td>
                        <td>{formatCurrency(provider.costPerHour)}</td>
                        <td>
                          {provider.capabilities.slice(0, 2).map((cap, index) => (
                            <Badge key={index} bg="secondary" className="me-1 mb-1">
                              {cap}
                            </Badge>
                          ))}
                          {provider.capabilities.length > 2 && (
                            <Badge bg="light" text="dark">
                              +{provider.capabilities.length - 2}
                            </Badge>
                          )}
                        </td>
                        <td>
                          <Button variant="outline-primary" size="sm" className="me-2">
                            <CogIcon className="me-1" />
                            Configure
                          </Button>
                          <Button variant="outline-secondary" size="sm">
                            Monitor
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Tab>

          <Tab eventKey="ai-models" title="AI Models">
            <Card>
              <Card.Header>
                <h5 className="mb-0">Available AI Models</h5>
              </Card.Header>
              <Card.Body className="p-0">
                <Table responsive hover className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Model</th>
                      <th>Provider</th>
                      <th>Type</th>
                      <th>Cost per 1K Tokens</th>
                      <th>Max Tokens</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aiModels.map((model) => (
                      <tr key={model.id}>
                        <td><strong>{model.name}</strong></td>
                        <td>
                          <Badge bg="light" text="dark">{model.provider}</Badge>
                        </td>
                        <td>{getModelTypeBadge(model.type)}</td>
                        <td>{formatCurrency(model.costPer1kTokens)}</td>
                        <td>{model.maxTokens.toLocaleString()}</td>
                        <td>
                          <Badge bg={model.status === 'available' ? 'success' : 'secondary'}>
                            {model.status}
                          </Badge>
                        </td>
                        <td>
                          <Button variant="outline-primary" size="sm">
                            Test Model
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Tab>

          <Tab eventKey="deployment" title="Deployment Targets">
            <Card>
              <Card.Header>
                <h5 className="mb-0">Optimal Deployment Targets</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  {deploymentTargets.map((target) => (
                    <Col md={4} key={target.id} className="mb-3">
                      <Card className="h-100">
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <h6 className="mb-0">{target.name}</h6>
                            <Badge bg={target.environment === 'production' ? 'danger' : target.environment === 'staging' ? 'warning' : 'info'}>
                              {target.environment}
                            </Badge>
                          </div>
                          <p className="text-muted small mb-3">
                            {target.provider} • {target.region}
                          </p>
                          
                          <div className="mb-2">
                            <small className="text-muted">Cost Efficiency</small>
                            <ProgressBar now={target.cost} variant="success" className="mb-1" />
                            <small>{target.cost}%</small>
                          </div>
                          
                          <div className="mb-2">
                            <small className="text-muted">Performance</small>
                            <ProgressBar now={target.performance} variant="primary" className="mb-1" />
                            <small>{target.performance}%</small>
                          </div>
                          
                          <div className="mb-3">
                            <small className="text-muted">Availability</small>
                            <ProgressBar now={target.availability} variant="info" className="mb-1" />
                            <small>{target.availability}%</small>
                          </div>
                          
                          <Button variant="outline-primary" size="sm" className="w-100">
                            Deploy Here
                          </Button>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Card.Body>
            </Card>
          </Tab>

          <Tab eventKey="cost-optimization" title="Cost Optimization">
            <Card>
              <Card.Header>
                <h5 className="mb-0">
                  <DollarIcon className="me-2" />
                  Cost Optimization Recommendations
                </h5>
              </Card.Header>
              <Card.Body>
                <Alert variant="success" className="mb-3">
                  <strong>💰 Potential Savings:</strong> Switch 5 agents from Azure to GCP for 15% cost reduction (~$180/month)
                </Alert>
                
                <Alert variant="info" className="mb-3">
                  <strong>🔄 Provider Arbitrage:</strong> OpenAI API costs 20% less than Azure OpenAI for your current usage pattern
                </Alert>
                
                <Alert variant="warning" className="mb-3">
                  <strong>⚡ Performance Optimization:</strong> Move compute-intensive agents to AWS for 12% performance improvement
                </Alert>

                <div className="text-center">
                  <Button variant="success" className="me-2">
                    <ExchangeIcon className="me-1" />
                    Apply Recommendations
                  </Button>
                  <Button variant="outline-primary">
                    View Detailed Analysis
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Tab>
        </Tabs>

        {/* Add Provider Modal */}
        <Modal show={showAddProviderModal} onHide={() => setShowAddProviderModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Add Cloud Provider</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Provider Type</Form.Label>
                <Form.Select>
                  <option value="">Select provider</option>
                  <option value="aws">Amazon Web Services (AWS)</option>
                  <option value="azure">Microsoft Azure</option>
                  <option value="gcp">Google Cloud Platform (GCP)</option>
                  <option value="openai">OpenAI API</option>
                  <option value="anthropic">Anthropic Claude</option>
                  <option value="onpremise">On-Premise</option>
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Region</Form.Label>
                <Form.Control type="text" placeholder="e.g., us-east-1, eastus, us-central1" />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>API Key / Credentials</Form.Label>
                <Form.Control type="password" placeholder="Enter API key or credential reference" />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAddProviderModal(false)}>
              Cancel
            </Button>
            <Button variant="primary">
              Connect Provider
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Migration Modal */}
        <Modal show={showMigrationModal} onHide={() => setShowMigrationModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Agent Migration</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Alert variant="info">
              <strong>🔄 Zero-Downtime Migration:</strong> Move agents between providers without code changes
            </Alert>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Source Provider</Form.Label>
                <Form.Select>
                  <option value="">Select source</option>
                  <option value="aws">AWS US East</option>
                  <option value="azure">Azure East US</option>
                  <option value="gcp">GCP US Central</option>
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Target Provider</Form.Label>
                <Form.Select>
                  <option value="">Select target</option>
                  <option value="aws">AWS US East</option>
                  <option value="azure">Azure East US</option>
                  <option value="gcp">GCP US Central</option>
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Agents to Migrate</Form.Label>
                <Form.Control as="textarea" rows={3} placeholder="Select agents or enter agent IDs..." />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowMigrationModal(false)}>
              Cancel
            </Button>
            <Button variant="success">
              Start Migration
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </PermissionGuard>
  );
};

export default CloudManager;