import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Badge, Alert, Breadcrumb, Tabs, Tab, ProgressBar } from 'react-bootstrap';
import PermissionGuard from './PermissionGuard';
import { usePermissions } from '../hooks/usePermissions';
import { FaCloud, FaExchangeAlt, FaDollarSign, FaCog, FaChartLine } from 'react-icons/fa';

// Type assertions for React Icons
const CloudIcon = FaCloud as any;
const ExchangeIcon = FaExchangeAlt as any;
const DollarIcon = FaDollarSign as any;
const CogIcon = FaCog as any;
const ChartIcon = FaChartLine as any;

interface CloudProvider {
  id: string;
  name: string;
  type: 'ai' | 'compute' | 'storage';
  status: 'active' | 'inactive' | 'error';
  region: string;
  cost: number;
  usage: number;
  performance: number;
  lastSync: string;
}

interface AgentDeployment {
  id: string;
  agentName: string;
  provider: string;
  environment: string;
  status: 'running' | 'stopped' | 'migrating';
  cost: number;
  performance: number;
}

const MultiCloudDashboard: React.FC = () => {
  const { hasPermission, user } = usePermissions();
  const [providers, setProviders] = useState<CloudProvider[]>([]);
  const [deployments, setDeployments] = useState<AgentDeployment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching multi-cloud data
    setTimeout(() => {
      setProviders([
        {
          id: 'openai',
          name: 'OpenAI',
          type: 'ai',
          status: 'active',
          region: 'US-East',
          cost: 1250.75,
          usage: 85,
          performance: 92,
          lastSync: '2024-01-15T11:30:00Z'
        },
        {
          id: 'anthropic',
          name: 'Anthropic',
          type: 'ai',
          status: 'active',
          region: 'US-West',
          cost: 890.25,
          usage: 65,
          performance: 88,
          lastSync: '2024-01-15T11:25:00Z'
        },
        {
          id: 'aws',
          name: 'AWS',
          type: 'compute',
          status: 'active',
          region: 'us-east-1',
          cost: 2150.00,
          usage: 78,
          performance: 95,
          lastSync: '2024-01-15T11:35:00Z'
        },
        {
          id: 'azure',
          name: 'Microsoft Azure',
          type: 'compute',
          status: 'active',
          region: 'East US',
          cost: 1675.50,
          usage: 72,
          performance: 90,
          lastSync: '2024-01-15T11:28:00Z'
        },
        {
          id: 'gcp',
          name: 'Google Cloud',
          type: 'compute',
          status: 'inactive',
          region: 'us-central1',
          cost: 0,
          usage: 0,
          performance: 0,
          lastSync: '2024-01-14T15:20:00Z'
        },
        {
          id: 'azure-openai',
          name: 'Azure OpenAI',
          type: 'ai',
          status: 'active',
          region: 'East US',
          cost: 750.25,
          usage: 45,
          performance: 89,
          lastSync: '2024-01-15T11:20:00Z'
        }
      ]);

      setDeployments([
        {
          id: 'deploy-1',
          agentName: 'Security Scanner',
          provider: 'AWS',
          environment: 'production',
          status: 'running',
          cost: 125.50,
          performance: 94
        },
        {
          id: 'deploy-2',
          agentName: 'QA Assistant',
          provider: 'Azure',
          environment: 'staging',
          status: 'running',
          cost: 89.25,
          performance: 87
        },
        {
          id: 'deploy-3',
          agentName: 'FinOps Analyzer',
          provider: 'OpenAI',
          environment: 'production',
          status: 'migrating',
          cost: 245.75,
          performance: 91
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const getProviderBadge = (provider: CloudProvider) => {
    const colors = {
      ai: 'primary',
      compute: 'success',
      storage: 'info'
    };
    return <Badge bg={colors[provider.type]}>{provider.type.toUpperCase()}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge bg="success">Active</Badge>;
      case 'inactive': return <Badge bg="secondary">Inactive</Badge>;
      case 'error': return <Badge bg="danger">Error</Badge>;
      case 'running': return <Badge bg="success">Running</Badge>;
      case 'stopped': return <Badge bg="secondary">Stopped</Badge>;
      case 'migrating': return <Badge bg="warning">Migrating</Badge>;
      default: return <Badge bg="secondary">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const totalCost = providers.reduce((sum, provider) => sum + provider.cost, 0);
  const activeProviders = providers.filter(p => p.status === 'active').length;
  const avgPerformance = providers.reduce((sum, provider) => sum + provider.performance, 0) / providers.length;

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
    <PermissionGuard permission="agent.view">
      <Container fluid className="mt-4">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-3">
          <Breadcrumb.Item href="/">Dashboard</Breadcrumb.Item>
          <Breadcrumb.Item active>Multi-Cloud Management</Breadcrumb.Item>
        </Breadcrumb>

        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="mb-1">
              <CloudIcon className="me-2" />
              Multi-Cloud Foundation
            </h2>
            <p className="text-muted mb-0">
              Vendor-neutral platform supporting multiple AI providers and cloud platforms
            </p>
          </div>
          <div>
            <Badge bg="info" className="me-2">
              Role: {user?.role}
            </Badge>
            <Button variant="primary">
              <ExchangeIcon className="me-2" />
              Optimize Costs
            </Button>
          </div>
        </div>

        {/* Vendor Neutrality Notice */}
        <Alert variant="success" className="mb-4">
          <div className="d-flex align-items-center">
            <CloudIcon className="me-2" />
            <div>
              <strong>🌐 Vendor-Neutral Platform:</strong> Deploy agents across any cloud provider without vendor lock-in.
              <br />
              <small>Switch between OpenAI, Anthropic, AWS, Azure, GCP seamlessly with cost optimization.</small>
            </div>
          </div>
        </Alert>

        {/* Statistics Cards */}
        <Row className="mb-4">
          <Col md={3}>
            <Card className="text-center">
              <Card.Body>
                <h4 className="text-primary">{providers.length}</h4>
                <small className="text-muted">Connected Providers</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center">
              <Card.Body>
                <h4 className="text-success">{activeProviders}</h4>
                <small className="text-muted">Active Providers</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center">
              <Card.Body>
                <h4 className="text-info">{formatCurrency(totalCost)}</h4>
                <small className="text-muted">Total Monthly Cost</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center">
              <Card.Body>
                <h4 className="text-warning">{avgPerformance.toFixed(1)}%</h4>
                <small className="text-muted">Avg Performance</small>
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
                  Multi-Cloud Provider Status
                </h5>
              </Card.Header>
              <Card.Body className="p-0">
                <Table responsive hover className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Provider</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Region</th>
                      <th>Usage</th>
                      <th>Performance</th>
                      <th>Monthly Cost</th>
                      <th>Last Sync</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {providers.map((provider) => (
                      <tr key={provider.id}>
                        <td>
                          <div className="d-flex align-items-center">
                            <CloudIcon className="me-2 text-primary" />
                            <strong>{provider.name}</strong>
                          </div>
                        </td>
                        <td>{getProviderBadge(provider)}</td>
                        <td>{getStatusBadge(provider.status)}</td>
                        <td>
                          <Badge bg="light" text="dark">{provider.region}</Badge>
                        </td>
                        <td>
                          <div style={{ width: '80px' }}>
                            <ProgressBar 
                              now={provider.usage} 
                              variant={provider.usage > 80 ? 'danger' : provider.usage > 60 ? 'warning' : 'success'}
                              className="mb-1"
                            />
                            <small>{provider.usage}%</small>
                          </div>
                        </td>
                        <td>
                          <Badge bg={provider.performance > 90 ? 'success' : provider.performance > 80 ? 'warning' : 'danger'}>
                            {provider.performance}%
                          </Badge>
                        </td>
                        <td>{formatCurrency(provider.cost)}</td>
                        <td>
                          <small className="text-muted">
                            {formatDate(provider.lastSync)}
                          </small>
                        </td>
                        <td>
                          <Button variant="outline-primary" size="sm" className="me-2">
                            <CogIcon className="me-1" />
                            Configure
                          </Button>
                          {provider.status === 'inactive' && (
                            <Button variant="outline-success" size="sm">
                              Activate
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Tab>

          <Tab eventKey="deployments" title="Agent Deployments">
            <Card>
              <Card.Header>
                <h5 className="mb-0">Cross-Cloud Agent Deployments</h5>
              </Card.Header>
              <Card.Body className="p-0">
                <Table responsive hover className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Agent</th>
                      <th>Provider</th>
                      <th>Environment</th>
                      <th>Status</th>
                      <th>Performance</th>
                      <th>Cost</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deployments.map((deployment) => (
                      <tr key={deployment.id}>
                        <td><strong>{deployment.agentName}</strong></td>
                        <td>
                          <Badge bg="primary">
                            <CloudIcon className="me-1" />
                            {deployment.provider}
                          </Badge>
                        </td>
                        <td>
                          <Badge bg={deployment.environment === 'production' ? 'danger' : 'warning'}>
                            {deployment.environment}
                          </Badge>
                        </td>
                        <td>{getStatusBadge(deployment.status)}</td>
                        <td>
                          <Badge bg={deployment.performance > 90 ? 'success' : 'warning'}>
                            {deployment.performance}%
                          </Badge>
                        </td>
                        <td>{formatCurrency(deployment.cost)}</td>
                        <td>
                          <Button variant="outline-warning" size="sm" className="me-2">
                            <ExchangeIcon className="me-1" />
                            Migrate
                          </Button>
                          <Button variant="outline-secondary" size="sm">
                            Details
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Tab>

          <Tab eventKey="optimization" title="Cost Optimization">
            <Card>
              <Card.Header>
                <h5 className="mb-0">
                  <DollarIcon className="me-2" />
                  Provider Cost Optimization
                </h5>
              </Card.Header>
              <Card.Body>
                <Alert variant="info" className="mb-4">
                  <strong>💡 Cost Optimization Recommendations:</strong>
                  <ul className="mb-0 mt-2">
                    <li>Switch QA Assistant from Azure to GCP for 25% cost savings</li>
                    <li>Migrate FinOps Analyzer from OpenAI to Anthropic for better performance/cost ratio</li>
                    <li>Consider reserved instances on AWS for 30% discount on long-running agents</li>
                  </ul>
                </Alert>

                <Row>
                  <Col md={6} className="mb-3">
                    <Card className="h-100">
                      <Card.Body>
                        <h6>Provider Arbitrage</h6>
                        <p className="text-muted small">
                          Automatically switch between providers for optimal cost/performance
                        </p>
                        <Button variant="success" size="sm">
                          <ChartIcon className="me-1" />
                          Enable Auto-Optimization
                        </Button>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6} className="mb-3">
                    <Card className="h-100">
                      <Card.Body>
                        <h6>Migration Tools</h6>
                        <p className="text-muted small">
                          Move agents between clouds without code changes
                        </p>
                        <Button variant="primary" size="sm">
                          <ExchangeIcon className="me-1" />
                          Start Migration
                        </Button>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Tab>
        </Tabs>

        {/* Provider Comparison */}
        <Card className="mt-4">
          <Card.Header>
            <h6 className="mb-0">
              <ExchangeIcon className="me-2" />
              Vendor-Neutral Benefits
            </h6>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={4}>
                <h6>🔄 No Vendor Lock-in</h6>
                <ul className="small">
                  <li>Switch providers without code changes</li>
                  <li>Avoid dependency on single vendor</li>
                  <li>Negotiate better pricing with competition</li>
                </ul>
              </Col>
              <Col md={4}>
                <h6>💰 Cost Optimization</h6>
                <ul className="small">
                  <li>Real-time cost comparison across providers</li>
                  <li>Automatic provider arbitrage</li>
                  <li>Reserved instance optimization</li>
                </ul>
              </Col>
              <Col md={4}>
                <h6>🚀 Best-of-Breed</h6>
                <ul className="small">
                  <li>Use best AI models from each provider</li>
                  <li>Optimal performance for each use case</li>
                  <li>Future-proof architecture</li>
                </ul>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </Container>
    </PermissionGuard>
  );
};

export default MultiCloudDashboard;