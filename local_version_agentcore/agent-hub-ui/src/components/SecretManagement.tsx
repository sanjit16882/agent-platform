import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Badge, Alert, Breadcrumb, Tabs, Tab, Modal, Form } from 'react-bootstrap';
import PermissionGuard from './PermissionGuard';
import { usePermissions } from '../hooks/usePermissions';
import { FaKey, FaShieldAlt, FaEye, FaEyeSlash, FaCog, FaSync, FaExclamationTriangle } from 'react-icons/fa';

// Type assertions for React Icons
const KeyIcon = FaKey as any;
const ShieldIcon = FaShieldAlt as any;
const EyeIcon = FaEye as any;
const EyeSlashIcon = FaEyeSlash as any;
const CogIcon = FaCog as any;
const SyncIcon = FaSync as any;
const WarningIcon = FaExclamationTriangle as any;

interface SecretVault {
  id: string;
  name: string;
  type: 'aws-secrets' | 'azure-keyvault' | 'hashicorp-vault' | 'kubernetes';
  status: 'active' | 'inactive' | 'error';
  region: string;
  secretCount: number;
  lastSync: string;
  encryptionLevel: string;
}

interface Secret {
  id: string;
  name: string;
  type: 'api-key' | 'database' | 'certificate' | 'oauth' | 'custom';
  vaultId: string;
  vaultName: string;
  status: 'active' | 'expired' | 'rotating';
  lastRotated: string;
  expiresAt: string;
  usedByAgents: number;
  description: string;
}

interface AuditLog {
  id: string;
  action: string;
  secretName: string;
  user: string;
  timestamp: string;
  result: 'success' | 'failure';
  details: string;
}

const SecretManagement: React.FC = () => {
  const { hasPermission, user } = usePermissions();
  const [vaults, setVaults] = useState<SecretVault[]>([]);
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [showSecretModal, setShowSecretModal] = useState(false);
  const [showVaultModal, setShowVaultModal] = useState(false);
  const [selectedSecret, setSelectedSecret] = useState<Secret | null>(null);
  const [showSecretValue, setShowSecretValue] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVaults();
    loadSecrets();
    loadAuditLogs();
  }, []);

  const loadVaults = () => {
    setTimeout(() => {
      setVaults([
        {
          id: 'aws-secrets-prod',
          name: 'AWS Secrets Manager (Production)',
          type: 'aws-secrets',
          status: 'active',
          region: 'us-east-1',
          secretCount: 45,
          lastSync: '2024-01-15T11:30:00Z',
          encryptionLevel: 'AES-256'
        },
        {
          id: 'azure-kv-dev',
          name: 'Azure Key Vault (Development)',
          type: 'azure-keyvault',
          status: 'active',
          region: 'East US',
          secretCount: 23,
          lastSync: '2024-01-15T11:25:00Z',
          encryptionLevel: 'RSA-2048'
        },
        {
          id: 'hashicorp-vault',
          name: 'HashiCorp Vault (Enterprise)',
          type: 'hashicorp-vault',
          status: 'active',
          region: 'on-premise',
          secretCount: 67,
          lastSync: '2024-01-15T11:35:00Z',
          encryptionLevel: 'AES-256-GCM'
        },
        {
          id: 'k8s-secrets',
          name: 'Kubernetes Secrets',
          type: 'kubernetes',
          status: 'inactive',
          region: 'cluster-1',
          secretCount: 12,
          lastSync: '2024-01-14T16:20:00Z',
          encryptionLevel: 'Base64'
        }
      ]);
      setLoading(false);
    }, 1000);
  };

  const loadSecrets = () => {
    setTimeout(() => {
      setSecrets([
        {
          id: 'secret-1',
          name: 'openai-api-key',
          type: 'api-key',
          vaultId: 'aws-secrets-prod',
          vaultName: 'AWS Secrets Manager (Production)',
          status: 'active',
          lastRotated: '2024-01-01T00:00:00Z',
          expiresAt: '2024-07-01T00:00:00Z',
          usedByAgents: 8,
          description: 'OpenAI API key for production agents'
        },
        {
          id: 'secret-2',
          name: 'postgres-db-credentials',
          type: 'database',
          vaultId: 'azure-kv-dev',
          vaultName: 'Azure Key Vault (Development)',
          status: 'active',
          lastRotated: '2024-01-10T00:00:00Z',
          expiresAt: '2024-04-10T00:00:00Z',
          usedByAgents: 5,
          description: 'PostgreSQL database credentials for development'
        },
        {
          id: 'secret-3',
          name: 'salesforce-oauth-token',
          type: 'oauth',
          vaultId: 'hashicorp-vault',
          vaultName: 'HashiCorp Vault (Enterprise)',
          status: 'rotating',
          lastRotated: '2024-01-15T10:00:00Z',
          expiresAt: '2024-01-16T10:00:00Z',
          usedByAgents: 3,
          description: 'Salesforce OAuth token for CRM integration'
        },
        {
          id: 'secret-4',
          name: 'ssl-certificate',
          type: 'certificate',
          vaultId: 'aws-secrets-prod',
          vaultName: 'AWS Secrets Manager (Production)',
          status: 'expired',
          lastRotated: '2023-12-15T00:00:00Z',
          expiresAt: '2024-01-14T00:00:00Z',
          usedByAgents: 2,
          description: 'SSL certificate for secure communications'
        }
      ]);
    }, 1200);
  };

  const loadAuditLogs = () => {
    setTimeout(() => {
      setAuditLogs([
        {
          id: 'audit-1',
          action: 'SECRET_ACCESSED',
          secretName: 'openai-api-key',
          user: 'system-agent',
          timestamp: '2024-01-15T11:30:00Z',
          result: 'success',
          details: 'Secret accessed by Security Scanner agent'
        },
        {
          id: 'audit-2',
          action: 'SECRET_ROTATED',
          secretName: 'salesforce-oauth-token',
          user: 'admin@company.com',
          timestamp: '2024-01-15T10:00:00Z',
          result: 'success',
          details: 'Automatic rotation triggered by expiration policy'
        },
        {
          id: 'audit-3',
          action: 'SECRET_CREATED',
          secretName: 'postgres-db-credentials',
          user: 'developer@company.com',
          timestamp: '2024-01-10T00:00:00Z',
          result: 'success',
          details: 'New database credentials created for development environment'
        },
        {
          id: 'audit-4',
          action: 'SECRET_ACCESS_DENIED',
          secretName: 'ssl-certificate',
          user: 'unauthorized-user',
          timestamp: '2024-01-14T15:30:00Z',
          result: 'failure',
          details: 'Access denied due to insufficient permissions'
        }
      ]);
    }, 1500);
  };

  const getVaultTypeBadge = (type: string) => {
    const badges = {
      'aws-secrets': { bg: 'warning', label: 'AWS Secrets' },
      'azure-keyvault': { bg: 'info', label: 'Azure Key Vault' },
      'hashicorp-vault': { bg: 'primary', label: 'HashiCorp Vault' },
      'kubernetes': { bg: 'success', label: 'Kubernetes' }
    };
    const badge = badges[type as keyof typeof badges] || { bg: 'secondary', label: type };
    return <Badge bg={badge.bg}>{badge.label}</Badge>;
  };

  const getSecretTypeBadge = (type: string) => {
    const badges = {
      'api-key': { bg: 'primary', label: 'API Key' },
      'database': { bg: 'info', label: 'Database' },
      'certificate': { bg: 'warning', label: 'Certificate' },
      'oauth': { bg: 'success', label: 'OAuth' },
      'custom': { bg: 'secondary', label: 'Custom' }
    };
    const badge = badges[type as keyof typeof badges] || { bg: 'secondary', label: type };
    return <Badge bg={badge.bg}>{badge.label}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge bg="success">Active</Badge>;
      case 'inactive': return <Badge bg="secondary">Inactive</Badge>;
      case 'error': return <Badge bg="danger">Error</Badge>;
      case 'expired': return <Badge bg="danger">Expired</Badge>;
      case 'rotating': return <Badge bg="warning">Rotating</Badge>;
      default: return <Badge bg="secondary">{status}</Badge>;
    }
  };

  const getAuditResultBadge = (result: string) => {
    return result === 'success' ? 
      <Badge bg="success">Success</Badge> : 
      <Badge bg="danger">Failure</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const toggleSecretVisibility = (secretId: string) => {
    setShowSecretValue(prev => ({
      ...prev,
      [secretId]: !prev[secretId]
    }));
  };

  const rotateSecret = (secret: Secret) => {
    // Simulate secret rotation
    alert(`Rotating secret: ${secret.name}`);
  };

  const configureSecret = (secret: Secret) => {
    setSelectedSecret(secret);
    setShowSecretModal(true);
  };

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
    <PermissionGuard permission={['system.admin']} requireAll={true}>
      <Container fluid className="mt-4">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-3">
          <Breadcrumb.Item href="/">Dashboard</Breadcrumb.Item>
          <Breadcrumb.Item href="/integration">Integration Hub</Breadcrumb.Item>
          <Breadcrumb.Item active>Secret Management</Breadcrumb.Item>
        </Breadcrumb>

        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="mb-1">
              <KeyIcon className="me-2" />
              Secret Management
            </h2>
            <p className="text-muted mb-0">
              Manage credentials and secrets across multiple vault systems
            </p>
          </div>
          <div>
            <Badge bg="danger" className="me-2">
              Admin Only
            </Badge>
            <Button variant="primary">
              <KeyIcon className="me-2" />
              Add Secret
            </Button>
          </div>
        </div>

        {/* Security Notice */}
        <Alert variant="warning" className="mb-4">
          <div className="d-flex align-items-center">
            <ShieldIcon className="me-2" />
            <div>
              <strong>🔒 High Security Zone:</strong> This area contains sensitive credentials and secrets.
              <br />
              <small>All actions are logged and audited. Only system administrators have access.</small>
            </div>
          </div>
        </Alert>

        {/* Statistics Cards */}
        <Row className="mb-4">
          <Col md={3}>
            <Card className="text-center">
              <Card.Body>
                <h4 className="text-primary">{vaults.length}</h4>
                <small className="text-muted">Connected Vaults</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center">
              <Card.Body>
                <h4 className="text-success">{secrets.filter(s => s.status === 'active').length}</h4>
                <small className="text-muted">Active Secrets</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center">
              <Card.Body>
                <h4 className="text-warning">{secrets.filter(s => s.status === 'expired').length}</h4>
                <small className="text-muted">Expired Secrets</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center">
              <Card.Body>
                <h4 className="text-info">{vaults.reduce((sum, v) => sum + v.secretCount, 0)}</h4>
                <small className="text-muted">Total Secrets</small>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Main Content Tabs */}
        <Tabs defaultActiveKey="secrets" className="mb-4">
          <Tab eventKey="secrets" title="Secrets">
            <Card>
              <Card.Header>
                <h5 className="mb-0">
                  <KeyIcon className="me-2" />
                  Managed Secrets
                </h5>
              </Card.Header>
              <Card.Body className="p-0">
                <Table responsive hover className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Secret Name</th>
                      <th>Type</th>
                      <th>Vault</th>
                      <th>Status</th>
                      <th>Used By</th>
                      <th>Expires</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {secrets.map((secret) => (
                      <tr key={secret.id}>
                        <td>
                          <div>
                            <strong>{secret.name}</strong>
                            <br />
                            <small className="text-muted">{secret.description}</small>
                          </div>
                        </td>
                        <td>{getSecretTypeBadge(secret.type)}</td>
                        <td>
                          <Badge bg="light" text="dark">{secret.vaultName}</Badge>
                        </td>
                        <td>{getStatusBadge(secret.status)}</td>
                        <td>
                          <Badge bg="info">{secret.usedByAgents} agents</Badge>
                        </td>
                        <td>
                          <small className={secret.status === 'expired' ? 'text-danger' : 'text-muted'}>
                            {formatDate(secret.expiresAt)}
                          </small>
                        </td>
                        <td>
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            className="me-2"
                            onClick={() => toggleSecretVisibility(secret.id)}
                          >
                            {showSecretValue[secret.id] ? <EyeSlashIcon /> : <EyeIcon />}
                          </Button>
                          <Button
                            variant="outline-warning"
                            size="sm"
                            className="me-2"
                            onClick={() => rotateSecret(secret)}
                            disabled={secret.status === 'rotating'}
                          >
                            <SyncIcon className="me-1" />
                            Rotate
                          </Button>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => configureSecret(secret)}
                          >
                            <CogIcon className="me-1" />
                            Configure
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Tab>

          <Tab eventKey="vaults" title="Vault Systems">
            <Card>
              <Card.Header>
                <h5 className="mb-0">
                  <ShieldIcon className="me-2" />
                  Connected Vault Systems
                </h5>
              </Card.Header>
              <Card.Body className="p-0">
                <Table responsive hover className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Vault System</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Region</th>
                      <th>Secrets</th>
                      <th>Encryption</th>
                      <th>Last Sync</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vaults.map((vault) => (
                      <tr key={vault.id}>
                        <td><strong>{vault.name}</strong></td>
                        <td>{getVaultTypeBadge(vault.type)}</td>
                        <td>{getStatusBadge(vault.status)}</td>
                        <td>
                          <Badge bg="light" text="dark">{vault.region}</Badge>
                        </td>
                        <td>
                          <span className="fw-bold">{vault.secretCount}</span>
                        </td>
                        <td>
                          <Badge bg="success">{vault.encryptionLevel}</Badge>
                        </td>
                        <td>
                          <small className="text-muted">
                            {formatDate(vault.lastSync)}
                          </small>
                        </td>
                        <td>
                          <Button variant="outline-primary" size="sm" className="me-2">
                            <CogIcon className="me-1" />
                            Configure
                          </Button>
                          <Button variant="outline-secondary" size="sm">
                            <SyncIcon className="me-1" />
                            Sync
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Tab>

          <Tab eventKey="audit" title="Audit Logs">
            <Card>
              <Card.Header>
                <h5 className="mb-0">
                  <ShieldIcon className="me-2" />
                  Security Audit Trail
                </h5>
              </Card.Header>
              <Card.Body className="p-0">
                <Table responsive hover className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Action</th>
                      <th>Secret</th>
                      <th>User</th>
                      <th>Result</th>
                      <th>Timestamp</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log) => (
                      <tr key={log.id}>
                        <td>
                          <Badge bg="light" text="dark">{log.action}</Badge>
                        </td>
                        <td><strong>{log.secretName}</strong></td>
                        <td>{log.user}</td>
                        <td>{getAuditResultBadge(log.result)}</td>
                        <td>
                          <small className="text-muted">
                            {formatDate(log.timestamp)}
                          </small>
                        </td>
                        <td>
                          <small className="text-muted">{log.details}</small>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Tab>
        </Tabs>

        {/* Vault Integration Info */}
        <Card className="mt-4">
          <Card.Header>
            <h6 className="mb-0">
              <ShieldIcon className="me-2" />
              Supported Vault Systems
            </h6>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={3}>
                <h6>AWS Secrets Manager</h6>
                <ul className="small">
                  <li>Native AWS integration</li>
                  <li>Automatic rotation</li>
                  <li>Cross-region replication</li>
                  <li>IAM-based access control</li>
                </ul>
              </Col>
              <Col md={3}>
                <h6>Azure Key Vault</h6>
                <ul className="small">
                  <li>Azure AD integration</li>
                  <li>Hardware security modules</li>
                  <li>Certificate management</li>
                  <li>RBAC permissions</li>
                </ul>
              </Col>
              <Col md={3}>
                <h6>HashiCorp Vault</h6>
                <ul className="small">
                  <li>Dynamic secrets</li>
                  <li>Policy-based access</li>
                  <li>Multi-cloud support</li>
                  <li>Encryption as a service</li>
                </ul>
              </Col>
              <Col md={3}>
                <h6>Kubernetes Secrets</h6>
                <ul className="small">
                  <li>Native K8s integration</li>
                  <li>Namespace isolation</li>
                  <li>ConfigMap support</li>
                  <li>Service account tokens</li>
                </ul>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Secret Configuration Modal */}
        <Modal show={showSecretModal} onHide={() => setShowSecretModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>
              Configure Secret: {selectedSecret?.name}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedSecret && (
              <>
                <Alert variant="warning">
                  <WarningIcon className="me-2" />
                  <strong>Security Warning:</strong> You are modifying a secret used by {selectedSecret.usedByAgents} agents.
                  <br />
                  <small>Changes will be audited and may affect agent operations.</small>
                </Alert>

                <Form>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Secret Name</Form.Label>
                        <Form.Control
                          type="text"
                          defaultValue={selectedSecret.name}
                          disabled
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Type</Form.Label>
                        <Form.Select defaultValue={selectedSecret.type}>
                          <option value="api-key">API Key</option>
                          <option value="database">Database</option>
                          <option value="certificate">Certificate</option>
                          <option value="oauth">OAuth</option>
                          <option value="custom">Custom</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label>Description</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      defaultValue={selectedSecret.description}
                    />
                  </Form.Group>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Rotation Policy</Form.Label>
                        <Form.Select>
                          <option value="manual">Manual</option>
                          <option value="30days">Every 30 days</option>
                          <option value="90days">Every 90 days</option>
                          <option value="365days">Annually</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Expiration Date</Form.Label>
                        <Form.Control
                          type="datetime-local"
                          defaultValue={selectedSecret.expiresAt.slice(0, 16)}
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      label="Enable automatic rotation"
                      defaultChecked={selectedSecret.status === 'rotating'}
                    />
                  </Form.Group>
                </Form>
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowSecretModal(false)}>
              Cancel
            </Button>
            <Button variant="primary">
              <CogIcon className="me-1" />
              Update Secret
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </PermissionGuard>
  );
};

export default SecretManagement;