import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Badge, Alert, Breadcrumb, Tabs, Tab, Modal, Form } from 'react-bootstrap';
import PermissionGuard from './PermissionGuard';
import { usePermissions } from '../hooks/usePermissions';
import { theme } from '../styles/theme';

interface Connector {
  id: string;
  name: string;
  type: 'database' | 'cloud' | 'api' | 'file' | 'legacy';
  category: string;
  status: 'active' | 'inactive' | 'error' | 'configuring';
  connections: number;
  lastUsed: string;
  description: string;
  supportedOperations: string[];
  securityLevel: 'low' | 'medium' | 'high' | 'enterprise';
}

interface Integration {
  id: string;
  name: string;
  connectorId: string;
  connectorName: string;
  status: 'connected' | 'disconnected' | 'error';
  dataTransferred: string;
  lastSync: string;
  agentsUsing: number;
}

const IntegrationHub: React.FC = () => {
  const { hasPermission, user } = usePermissions();
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [showConnectorModal, setShowConnectorModal] = useState(false);
  const [selectedConnector, setSelectedConnector] = useState<Connector | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConnectors();
    loadIntegrations();
  }, []);

  const loadConnectors = () => {
    // Simulate loading connectors
    setTimeout(() => {
      setConnectors([
        {
          id: 'aws-s3',
          name: 'Amazon S3',
          type: 'cloud',
          category: 'Cloud Storage',
          status: 'active',
          connections: 12,
          lastUsed: '2024-01-15T11:30:00Z',
          description: 'Connect to Amazon S3 buckets for file storage and retrieval',
          supportedOperations: ['read', 'write', 'list', 'delete'],
          securityLevel: 'enterprise'
        },
        {
          id: 'azure-sql',
          name: 'Azure SQL Database',
          type: 'database',
          category: 'Cloud Database',
          status: 'active',
          connections: 8,
          lastUsed: '2024-01-15T10:45:00Z',
          description: 'Connect to Azure SQL databases for data operations',
          supportedOperations: ['select', 'insert', 'update', 'delete'],
          securityLevel: 'high'
        },
        {
          id: 'postgresql',
          name: 'PostgreSQL',
          type: 'database',
          category: 'Database',
          status: 'active',
          connections: 15,
          lastUsed: '2024-01-15T12:00:00Z',
          description: 'Connect to PostgreSQL databases',
          supportedOperations: ['select', 'insert', 'update', 'delete', 'execute'],
          securityLevel: 'high'
        },
        {
          id: 'salesforce',
          name: 'Salesforce',
          type: 'api',
          category: 'CRM',
          status: 'active',
          connections: 6,
          lastUsed: '2024-01-15T09:30:00Z',
          description: 'Connect to Salesforce CRM via REST API',
          supportedOperations: ['read', 'write', 'query', 'bulk'],
          securityLevel: 'enterprise'
        },
        {
          id: 'mainframe-db2',
          name: 'IBM DB2 Mainframe',
          type: 'legacy',
          category: 'Legacy Database',
          status: 'inactive',
          connections: 2,
          lastUsed: '2024-01-14T16:20:00Z',
          description: 'Connect to IBM DB2 on mainframe systems',
          supportedOperations: ['select', 'insert', 'update'],
          securityLevel: 'enterprise'
        },
        {
          id: 'rest-api',
          name: 'Generic REST API',
          type: 'api',
          category: 'Web API',
          status: 'active',
          connections: 25,
          lastUsed: '2024-01-15T11:45:00Z',
          description: 'Universal REST API connector for any HTTP-based service',
          supportedOperations: ['get', 'post', 'put', 'delete'],
          securityLevel: 'medium'
        },
        {
          id: 'file-system',
          name: 'File System',
          type: 'file',
          category: 'Local Storage',
          status: 'active',
          connections: 18,
          lastUsed: '2024-01-15T11:15:00Z',
          description: 'Connect to local and network file systems',
          supportedOperations: ['read', 'write', 'list', 'move', 'delete'],
          securityLevel: 'medium'
        },
        {
          id: 'mongodb',
          name: 'MongoDB',
          type: 'database',
          category: 'NoSQL Database',
          status: 'configuring',
          connections: 0,
          lastUsed: 'Never',
          description: 'Connect to MongoDB document databases',
          supportedOperations: ['find', 'insert', 'update', 'delete', 'aggregate'],
          securityLevel: 'high'
        },
        {
          id: 'snowflake',
          name: 'Snowflake',
          type: 'database',
          category: 'Cloud Data Warehouse',
          status: 'inactive',
          connections: 0,
          lastUsed: 'Never',
          description: 'Connect to Snowflake cloud data warehouse for analytics and BI',
          supportedOperations: ['select', 'insert', 'update', 'delete', 'analytics', 'warehouse'],
          securityLevel: 'enterprise'
        }
      ]);
      setLoading(false);
    }, 1000);
  };

  const loadIntegrations = () => {
    setTimeout(() => {
      setIntegrations([
        {
          id: 'int-1',
          name: 'Customer Data Sync',
          connectorId: 'salesforce',
          connectorName: 'Salesforce',
          status: 'connected',
          dataTransferred: '2.3 GB',
          lastSync: '2024-01-15T11:30:00Z',
          agentsUsing: 3
        },
        {
          id: 'int-2',
          name: 'Analytics Database',
          connectorId: 'postgresql',
          connectorName: 'PostgreSQL',
          status: 'connected',
          dataTransferred: '15.7 GB',
          lastSync: '2024-01-15T12:00:00Z',
          agentsUsing: 7
        },
        {
          id: 'int-3',
          name: 'Document Storage',
          connectorId: 'aws-s3',
          connectorName: 'Amazon S3',
          status: 'connected',
          dataTransferred: '45.2 GB',
          lastSync: '2024-01-15T11:45:00Z',
          agentsUsing: 5
        },
        {
          id: 'int-4',
          name: 'Legacy System Bridge',
          connectorId: 'mainframe-db2',
          connectorName: 'IBM DB2 Mainframe',
          status: 'error',
          dataTransferred: '0.8 GB',
          lastSync: '2024-01-14T16:20:00Z',
          agentsUsing: 1
        },
        {
          id: 'int-5',
          name: 'Analytics Data Warehouse',
          connectorId: 'snowflake',
          connectorName: 'Snowflake',
          status: 'disconnected',
          dataTransferred: '0 GB',
          lastSync: 'Never',
          agentsUsing: 0
        }
      ]);
    }, 1200);
  };

  const getConnectorTypeBadge = (type: string) => {
    const badges = {
      database: { bg: 'primary', label: 'Database' },
      cloud: { bg: 'info', label: 'Cloud' },
      api: { bg: 'success', label: 'API' },
      file: { bg: 'warning', label: 'File' },
      legacy: { bg: 'secondary', label: 'Legacy' }
    };
    const badge = badges[type as keyof typeof badges] || badges.api;
    
    return (
      <Badge bg={badge.bg}>
        {badge.label}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge bg="success">Active</Badge>;
      case 'inactive': return <Badge bg="secondary">Inactive</Badge>;
      case 'error': return <Badge bg="danger">Error</Badge>;
      case 'configuring': return <Badge bg="warning">Configuring</Badge>;
      case 'connected': return <Badge bg="success">Connected</Badge>;
      case 'disconnected': return <Badge bg="secondary">Disconnected</Badge>;
      default: return <Badge bg="secondary">{status}</Badge>;
    }
  };

  const getSecurityBadge = (level: string) => {
    const colors = {
      low: 'secondary',
      medium: 'warning',
      high: 'info',
      enterprise: 'danger'
    };
    return <Badge bg={colors[level as keyof typeof colors]}>{level.toUpperCase()}</Badge>;
  };

  const formatDate = (dateString: string) => {
    if (dateString === 'Never') return 'Never';
    return new Date(dateString).toLocaleString();
  };

  const configureConnector = (connector: Connector) => {
    setSelectedConnector(connector);
    setShowConnectorModal(true);
  };

  if (loading) {
    return (
      <div style={{ 
        padding: theme.spacing['3xl'], 
        backgroundColor: theme.colors.backgroundSecondary,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p style={{ 
            marginTop: theme.spacing.lg,
            color: theme.colors.textSecondary
          }}>
            Loading integration hub...
          </p>
        </div>
      </div>
    );
  }

  return (
    <PermissionGuard permission={['integration.manage', 'system.admin']} requireAll={false}>
      <div style={{ 
        padding: theme.spacing['3xl'], 
        backgroundColor: theme.colors.backgroundSecondary,
        minHeight: '100vh'
      }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          marginBottom: theme.spacing['3xl'],
          flexWrap: 'wrap',
          gap: theme.spacing.xl
        }}>
          <div>
            <h1 style={{ 
              fontSize: theme.typography.fontSize['3xl'],
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.primary,
              marginBottom: theme.spacing.sm
            }}>
              Universal Integration Hub
            </h1>
            <p style={{ 
              fontSize: theme.typography.fontSize.lg,
              color: theme.colors.textSecondary,
              margin: 0
            }}>
              Connect agents to any system - databases, APIs, cloud services, and legacy systems
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
            <div style={{ display: 'flex', gap: theme.spacing.sm, alignItems: 'center' }}>
              <Badge bg="info">
                Role: {user?.role}
              </Badge>
              <Button variant="primary">
                Add Connector
              </Button>
            </div>
          </div>
        </div>

        {/* Integration Hub Notice */}
        <Alert variant="success" style={{ marginBottom: theme.spacing['3xl'] }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div>
              <strong>Universal Integration:</strong> Connect agents to any system with our universal connector framework.
              <br />
              <small>Supports databases, cloud services, APIs, file systems, and legacy mainframe systems.</small>
            </div>
          </div>
        </Alert>

        {/* Statistics Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: theme.spacing.xl,
          marginBottom: theme.spacing['3xl']
        }}>
          <Card style={{ textAlign: 'center', padding: theme.spacing.xl }}>
            <Card.Body>
              <h4 style={{ color: theme.colors.primary, fontSize: theme.typography.fontSize['2xl'], fontWeight: theme.typography.fontWeight.bold }}>
                {connectors.length}
              </h4>
              <small style={{ color: theme.colors.textMuted }}>Available Connectors</small>
            </Card.Body>
          </Card>
          <Card style={{ textAlign: 'center', padding: theme.spacing.xl }}>
            <Card.Body>
              <h4 style={{ color: theme.colors.success, fontSize: theme.typography.fontSize['2xl'], fontWeight: theme.typography.fontWeight.bold }}>
                {connectors.filter(c => c.status === 'active').length}
              </h4>
              <small style={{ color: theme.colors.textMuted }}>Active Connectors</small>
            </Card.Body>
          </Card>
          <Card style={{ textAlign: 'center', padding: theme.spacing.xl }}>
            <Card.Body>
              <h4 style={{ color: theme.colors.info, fontSize: theme.typography.fontSize['2xl'], fontWeight: theme.typography.fontWeight.bold }}>
                {integrations.length}
              </h4>
              <small style={{ color: theme.colors.textMuted }}>Active Integrations</small>
            </Card.Body>
          </Card>
          <Card style={{ textAlign: 'center', padding: theme.spacing.xl }}>
            <Card.Body>
              <h4 style={{ color: theme.colors.warning, fontSize: theme.typography.fontSize['2xl'], fontWeight: theme.typography.fontWeight.bold }}>
                {connectors.reduce((sum, c) => sum + c.connections, 0)}
              </h4>
              <small style={{ color: theme.colors.textMuted }}>Total Connections</small>
            </Card.Body>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultActiveKey="connectors" style={{ marginBottom: theme.spacing.xl }}>
          <Tab eventKey="connectors" title="Connectors">
            <Card>
              <Card.Header style={{ 
                backgroundColor: theme.colors.backgroundSecondary,
                padding: theme.spacing.xl
              }}>
                <h5 style={{ 
                  margin: 0, 
                  fontWeight: theme.typography.fontWeight.semibold,
                  color: theme.colors.textPrimary
                }}>
                  Universal Connectors
                </h5>
              </Card.Header>
              <Card.Body className="p-0">
                <Table responsive hover className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Connector</th>
                      <th>Type</th>
                      <th>Category</th>
                      <th>Status</th>
                      <th>Connections</th>
                      <th>Security</th>
                      <th>Last Used</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {connectors.map((connector) => (
                      <tr key={connector.id}>
                        <td>
                          <div>
                            <strong>{connector.name}</strong>
                            <br />
                            <small className="text-muted">{connector.description}</small>
                          </div>
                        </td>
                        <td>{getConnectorTypeBadge(connector.type)}</td>
                        <td>
                          <Badge bg="light" text="dark">{connector.category}</Badge>
                        </td>
                        <td>{getStatusBadge(connector.status)}</td>
                        <td>
                          <span className="fw-bold">{connector.connections}</span>
                        </td>
                        <td>{getSecurityBadge(connector.securityLevel)}</td>
                        <td>
                          <small className="text-muted">
                            {formatDate(connector.lastUsed)}
                          </small>
                        </td>
                        <td>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            style={{ marginRight: theme.spacing.sm }}
                            onClick={() => configureConnector(connector)}
                          >
                            Configure
                          </Button>
                          {connector.status === 'inactive' && (
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

          <Tab eventKey="integrations" title="Active Integrations">
            <Card>
              <Card.Header style={{ 
                backgroundColor: theme.colors.backgroundSecondary,
                padding: theme.spacing.xl
              }}>
                <h5 style={{ 
                  margin: 0, 
                  fontWeight: theme.typography.fontWeight.semibold,
                  color: theme.colors.textPrimary
                }}>
                  Active Integrations
                </h5>
              </Card.Header>
              <Card.Body className="p-0">
                <Table responsive hover className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Integration</th>
                      <th>Connector</th>
                      <th>Status</th>
                      <th>Data Transferred</th>
                      <th>Last Sync</th>
                      <th>Agents Using</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {integrations.map((integration) => (
                      <tr key={integration.id}>
                        <td><strong>{integration.name}</strong></td>
                        <td>
                          <Badge bg="primary">
                            {integration.connectorName}
                          </Badge>
                        </td>
                        <td>{getStatusBadge(integration.status)}</td>
                        <td>{integration.dataTransferred}</td>
                        <td>
                          <small className="text-muted">
                            {formatDate(integration.lastSync)}
                          </small>
                        </td>
                        <td>
                          <Badge bg="info">{integration.agentsUsing} agents</Badge>
                        </td>
                        <td>
                          <Button variant="outline-primary" size="sm" style={{ marginRight: theme.spacing.sm }}>
                            Manage
                          </Button>
                          <Button variant="outline-secondary" size="sm">
                            Test
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Tab>

          <Tab eventKey="multicloud" title="Multi-Cloud">
            <Card>
              <Card.Header style={{ 
                backgroundColor: theme.colors.backgroundSecondary,
                padding: theme.spacing.xl
              }}>
                <h5 style={{ 
                  margin: 0, 
                  fontWeight: theme.typography.fontWeight.semibold,
                  color: theme.colors.textPrimary
                }}>
                  Multi-Cloud Management
                </h5>
              </Card.Header>
              <Card.Body style={{ padding: theme.spacing.xl }}>
                <Alert variant="info" style={{ marginBottom: theme.spacing.xl }}>
                  <strong>Multi-Cloud Foundation:</strong> Deploy and manage agents across AWS, Azure, GCP with cost optimization.
                  <br />
                  <small>Vendor-neutral abstraction layer with unified AI model integration and cost tracking.</small>
                </Alert>

                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: theme.spacing.xl,
                  marginBottom: theme.spacing.xl
                }}>
                  <Card style={{ textAlign: 'center', height: '100%' }}>
                    <Card.Body style={{ padding: theme.spacing.xl }}>
                      <h6 style={{ color: theme.colors.warning, marginBottom: theme.spacing.sm }}>AWS</h6>
                      <Badge bg="success" style={{ marginBottom: theme.spacing.sm }}>Connected</Badge>
                      <p style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.textMuted }}>12 deployments</p>
                      <Button variant="outline-warning" size="sm">Manage</Button>
                    </Card.Body>
                  </Card>
                  <Card style={{ textAlign: 'center', height: '100%' }}>
                    <Card.Body style={{ padding: theme.spacing.xl }}>
                      <h6 style={{ color: theme.colors.info, marginBottom: theme.spacing.sm }}>Azure</h6>
                      <Badge bg="success" style={{ marginBottom: theme.spacing.sm }}>Connected</Badge>
                      <p style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.textMuted }}>8 deployments</p>
                      <Button variant="outline-info" size="sm">Manage</Button>
                    </Card.Body>
                  </Card>
                  <Card style={{ textAlign: 'center', height: '100%' }}>
                    <Card.Body style={{ padding: theme.spacing.xl }}>
                      <h6 style={{ color: theme.colors.danger, marginBottom: theme.spacing.sm }}>Google Cloud</h6>
                      <Badge bg="warning" style={{ marginBottom: theme.spacing.sm }}>Configuring</Badge>
                      <p style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.textMuted }}>0 deployments</p>
                      <Button variant="outline-danger" size="sm">Setup</Button>
                    </Card.Body>
                  </Card>
                </div>

                <Card className="mb-3">
                  <Card.Header>
                    <h6 className="mb-0">Cost Optimization</h6>
                  </Card.Header>
                  <Card.Body>
                    <Row>
                      <Col md={6}>
                        <p className="mb-1"><strong>Monthly Spend:</strong> $2,847</p>
                        <p className="mb-1"><strong>Projected Savings:</strong> $423 (15%)</p>
                      </Col>
                      <Col md={6}>
                        <p className="mb-1"><strong>Most Expensive:</strong> AWS ($1,650)</p>
                        <p className="mb-1"><strong>Most Efficient:</strong> Azure ($897)</p>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Card.Body>
            </Card>
          </Tab>

          <Tab eventKey="secrets" title="Secrets">
            <Card>
              <Card.Header style={{ 
                backgroundColor: theme.colors.backgroundSecondary,
                padding: theme.spacing.xl
              }}>
                <h5 style={{ 
                  margin: 0, 
                  fontWeight: theme.typography.fontWeight.semibold,
                  color: theme.colors.textPrimary
                }}>
                  Secret Management
                </h5>
              </Card.Header>
              <Card.Body style={{ padding: theme.spacing.xl }}>
                <Alert variant="warning" style={{ marginBottom: theme.spacing.xl }}>
                  <strong>Multi-Vault Secret Management:</strong> Centralized credential management across multiple secret stores.
                  <br />
                  <small>Supports AWS Secrets Manager, Azure Key Vault, HashiCorp Vault, and custom stores.</small>
                </Alert>

                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: theme.spacing.xl,
                  marginBottom: theme.spacing.xl
                }}>
                  <Card style={{ textAlign: 'center', height: '100%' }}>
                    <Card.Body style={{ padding: theme.spacing.xl }}>
                      <h6 style={{ color: theme.colors.warning, marginBottom: theme.spacing.sm }}>AWS Secrets</h6>
                      <Badge bg="success" style={{ marginBottom: theme.spacing.sm }}>Active</Badge>
                      <p style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.textMuted }}>24 secrets</p>
                      <Button variant="outline-warning" size="sm">Manage</Button>
                    </Card.Body>
                  </Card>
                  <Card style={{ textAlign: 'center', height: '100%' }}>
                    <Card.Body style={{ padding: theme.spacing.xl }}>
                      <h6 style={{ color: theme.colors.info, marginBottom: theme.spacing.sm }}>Azure Key Vault</h6>
                      <Badge bg="success" style={{ marginBottom: theme.spacing.sm }}>Active</Badge>
                      <p style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.textMuted }}>18 secrets</p>
                      <Button variant="outline-info" size="sm">Manage</Button>
                    </Card.Body>
                  </Card>
                  <Card style={{ textAlign: 'center', height: '100%' }}>
                    <Card.Body style={{ padding: theme.spacing.xl }}>
                      <h6 style={{ color: theme.colors.success, marginBottom: theme.spacing.sm }}>HashiCorp Vault</h6>
                      <Badge bg="secondary" style={{ marginBottom: theme.spacing.sm }}>Inactive</Badge>
                      <p style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.textMuted }}>0 secrets</p>
                      <Button variant="outline-success" size="sm">Setup</Button>
                    </Card.Body>
                  </Card>
                </div>

                <Card>
                  <Card.Header>
                    <h6 className="mb-0">Recent Secret Activity</h6>
                  </Card.Header>
                  <Card.Body>
                    <Table size="sm" className="mb-0">
                      <thead>
                        <tr>
                          <th>Secret</th>
                          <th>Vault</th>
                          <th>Last Accessed</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>database-prod-password</td>
                          <td><Badge bg="warning">AWS</Badge></td>
                          <td>2 hours ago</td>
                          <td><Badge bg="success">Active</Badge></td>
                        </tr>
                        <tr>
                          <td>api-key-salesforce</td>
                          <td><Badge bg="info">Azure</Badge></td>
                          <td>5 hours ago</td>
                          <td><Badge bg="success">Active</Badge></td>
                        </tr>
                        <tr>
                          <td>oauth-token-google</td>
                          <td><Badge bg="warning">AWS</Badge></td>
                          <td>1 day ago</td>
                          <td><Badge bg="warning">Expiring</Badge></td>
                        </tr>
                      </tbody>
                    </Table>
                  </Card.Body>
                </Card>
              </Card.Body>
            </Card>
          </Tab>

          <Tab eventKey="data-movement" title="Data Movement">
            <Card>
              <Card.Header style={{ 
                backgroundColor: theme.colors.backgroundSecondary,
                padding: theme.spacing.xl
              }}>
                <h5 style={{ 
                  margin: 0, 
                  fontWeight: theme.typography.fontWeight.semibold,
                  color: theme.colors.textPrimary
                }}>
                  Secure Data Movement
                </h5>
              </Card.Header>
              <Card.Body style={{ padding: theme.spacing.xl }}>
                <Alert variant="info" style={{ marginBottom: theme.spacing.xl }}>
                  <strong>Secure Data Movement:</strong> Transfer data between systems with enterprise-grade security.
                  <br />
                  <small>Supports encryption in transit, data transformation, and cross-security domain transfers.</small>
                </Alert>

                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: theme.spacing.xl
                }}>
                  <Card style={{ height: '100%' }}>
                    <Card.Body style={{ padding: theme.spacing.xl }}>
                      <h6 style={{ 
                        marginBottom: theme.spacing.sm,
                        fontWeight: theme.typography.fontWeight.semibold,
                        color: theme.colors.textPrimary
                      }}>
                        Cross-Cloud Transfer
                      </h6>
                      <p style={{ 
                        color: theme.colors.textMuted,
                        fontSize: theme.typography.fontSize.sm,
                        marginBottom: theme.spacing.lg
                      }}>
                        Move data between AWS, Azure, GCP securely
                      </p>
                      <Button variant="primary" size="sm">
                        Start Transfer
                      </Button>
                    </Card.Body>
                  </Card>
                  <Card style={{ height: '100%' }}>
                    <Card.Body style={{ padding: theme.spacing.xl }}>
                      <h6 style={{ 
                        marginBottom: theme.spacing.sm,
                        fontWeight: theme.typography.fontWeight.semibold,
                        color: theme.colors.textPrimary
                      }}>
                        Legacy System Bridge
                      </h6>
                      <p style={{ 
                        color: theme.colors.textMuted,
                        fontSize: theme.typography.fontSize.sm,
                        marginBottom: theme.spacing.lg
                      }}>
                        Connect modern agents to legacy mainframes
                      </p>
                      <Button variant="warning" size="sm">
                        Configure Bridge
                      </Button>
                    </Card.Body>
                  </Card>
                </div>
              </Card.Body>
            </Card>
          </Tab>
        </Tabs>

        {/* Connector Categories */}
        <Card style={{ marginTop: theme.spacing.xl }}>
          <Card.Header style={{ 
            backgroundColor: theme.colors.backgroundSecondary,
            padding: theme.spacing.xl
          }}>
            <h6 style={{ 
              margin: 0, 
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.colors.textPrimary
            }}>
              Supported Integration Categories
            </h6>
          </Card.Header>
          <Card.Body style={{ padding: theme.spacing.xl }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: theme.spacing.xl
            }}>
              <div>
                <h6 style={{ 
                  marginBottom: theme.spacing.sm,
                  fontWeight: theme.typography.fontWeight.semibold,
                  color: theme.colors.textPrimary
                }}>
                  Databases
                </h6>
                <ul style={{ fontSize: theme.typography.fontSize.sm }}>
                  <li>PostgreSQL, MySQL, SQL Server</li>
                  <li>Oracle, MongoDB, Cassandra</li>
                  <li>Snowflake, BigQuery, Redshift</li>
                  <li>Redis, Elasticsearch</li>
                  <li>IBM DB2, Mainframe systems</li>
                </ul>
              </div>
              <div>
                <h6 style={{ 
                  marginBottom: theme.spacing.sm,
                  fontWeight: theme.typography.fontWeight.semibold,
                  color: theme.colors.textPrimary
                }}>
                  Cloud Services
                </h6>
                <ul style={{ fontSize: theme.typography.fontSize.sm }}>
                  <li>AWS S3, RDS, Lambda</li>
                  <li>Azure Storage, SQL, Functions</li>
                  <li>GCP Storage, BigQuery, Cloud Functions</li>
                  <li>Multi-cloud data movement</li>
                </ul>
              </div>
              <div>
                <h6 style={{ 
                  marginBottom: theme.spacing.sm,
                  fontWeight: theme.typography.fontWeight.semibold,
                  color: theme.colors.textPrimary
                }}>
                  APIs & Services
                </h6>
                <ul style={{ fontSize: theme.typography.fontSize.sm }}>
                  <li>REST, GraphQL, SOAP APIs</li>
                  <li>Salesforce, ServiceNow</li>
                  <li>Microsoft 365, Google Workspace</li>
                  <li>Custom enterprise APIs</li>
                </ul>
              </div>
              <div>
                <h6 style={{ 
                  marginBottom: theme.spacing.sm,
                  fontWeight: theme.typography.fontWeight.semibold,
                  color: theme.colors.textPrimary
                }}>
                  Legacy Systems
                </h6>
                <ul style={{ fontSize: theme.typography.fontSize.sm }}>
                  <li>IBM Mainframes (z/OS)</li>
                  <li>AS/400, iSeries systems</li>
                  <li>COBOL, RPG applications</li>
                  <li>Custom protocols</li>
                </ul>
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* Connector Configuration Modal */}
        <Modal show={showConnectorModal} onHide={() => setShowConnectorModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>
              Configure {selectedConnector?.name}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedConnector && (
              <>
                <Alert variant="info">
                  <strong>Connector Configuration:</strong> Set up connection parameters for {selectedConnector.name}.
                  <br />
                  <small>Security Level: {selectedConnector.securityLevel.toUpperCase()}</small>
                </Alert>

                <Form>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Connection Name</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Enter connection name"
                          defaultValue={`${selectedConnector.name} Connection`}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Environment</Form.Label>
                        <Form.Select>
                          <option value="development">Development</option>
                          <option value="staging">Staging</option>
                          <option value="production">Production</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>

                  {selectedConnector.type === 'database' && (
                    <>
                      <Form.Group className="mb-3">
                        <Form.Label>Connection String</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Server=localhost;Database=mydb;..."
                        />
                      </Form.Group>
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Username</Form.Label>
                            <Form.Control type="text" placeholder="Database username" />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Password</Form.Label>
                            <Form.Control type="password" placeholder="Database password" />
                          </Form.Group>
                        </Col>
                      </Row>
                    </>
                  )}

                  {selectedConnector.type === 'api' && (
                    <>
                      <Form.Group className="mb-3">
                        <Form.Label>API Endpoint</Form.Label>
                        <Form.Control
                          type="url"
                          placeholder="https://api.example.com/v1"
                        />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label>Authentication</Form.Label>
                        <Form.Select>
                          <option value="api-key">API Key</option>
                          <option value="oauth">OAuth 2.0</option>
                          <option value="basic">Basic Auth</option>
                          <option value="bearer">Bearer Token</option>
                        </Form.Select>
                      </Form.Group>
                    </>
                  )}

                  <Form.Group className="mb-3">
                    <Form.Label>Supported Operations</Form.Label>
                    <div>
                      {selectedConnector.supportedOperations.map((op, index) => (
                        <Badge key={index} bg="light" text="dark" className="me-1 mb-1">
                          {op}
                        </Badge>
                      ))}
                    </div>
                  </Form.Group>
                </Form>
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowConnectorModal(false)}>
              Cancel
            </Button>
            <Button variant="primary">
              Save Configuration
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </PermissionGuard>
  );
};

export default IntegrationHub;