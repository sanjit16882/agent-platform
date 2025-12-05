import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Alert, Table, Modal, Form } from 'react-bootstrap';
import { apiKeyService, APIKey, APIKeyStats } from '../services/apiKeyService';
import { theme } from '../styles/theme';

const APIKeyManagement: React.FC = () => {
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [stats, setStats] = useState<APIKeyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyUserId, setNewKeyUserId] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(['agents.read', 'agents.execute']);
  const [createdKey, setCreatedKey] = useState<APIKey | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [keysData, statsData] = await Promise.all([
        apiKeyService.listAPIKeys(),
        apiKeyService.getAPIKeyStats()
      ]);
      setApiKeys(keysData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load API key data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async () => {
    try {
      if (!newKeyName.trim() || !newKeyUserId.trim()) {
        alert('Please provide both name and user ID');
        return;
      }

      const newKey = await apiKeyService.generateAPIKey(
        newKeyName.trim(),
        newKeyUserId.trim(),
        selectedPermissions
      );

      setCreatedKey(newKey);
      setShowCreateModal(false);
      setNewKeyName('');
      setNewKeyUserId('');
      setSelectedPermissions(['agents.read', 'agents.execute']);
      
      // Reload data
      loadData();
    } catch (error) {
      alert(`Failed to create API key: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handlePermissionChange = (permission: string, checked: boolean) => {
    if (checked) {
      setSelectedPermissions([...selectedPermissions, permission]);
    } else {
      setSelectedPermissions(selectedPermissions.filter(p => p !== permission));
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge bg="success">Active</Badge>;
      case 'revoked': return <Badge bg="danger">Revoked</Badge>;
      default: return <Badge bg="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Container fluid style={{ padding: theme.spacing['3xl'] }}>
        <div style={{ textAlign: 'center', padding: theme.spacing['5xl'] }}>
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p style={{ marginTop: theme.spacing.lg, color: theme.colors.textSecondary }}>
            Loading API key management...
          </p>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid style={{ 
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
            API Key Management
          </h1>
          <p style={{ 
            fontSize: theme.typography.fontSize.lg,
            color: theme.colors.textSecondary,
            margin: 0
          }}>
            Generate and manage API keys for AgentHub platform access
          </p>
        </div>
        <div style={{ display: 'flex', gap: theme.spacing.sm, alignItems: 'center' }}>
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            Generate New API Key
          </Button>
          <Button variant="outline-secondary" onClick={loadData}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <Row className="mb-4">
          <Col md={3}>
            <Card style={{ textAlign: 'center', borderColor: theme.colors.primary }}>
              <Card.Body>
                <div style={{ 
                  fontSize: theme.typography.fontSize['2xl'],
                  color: theme.colors.primary,
                  fontWeight: theme.typography.fontWeight.bold,
                  marginBottom: theme.spacing.sm
                }}>
                  {stats.totalKeys}
                </div>
                <div style={{ color: theme.colors.textMuted, fontSize: theme.typography.fontSize.sm }}>
                  Total API Keys
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card style={{ textAlign: 'center', borderColor: theme.colors.success }}>
              <Card.Body>
                <div style={{ 
                  fontSize: theme.typography.fontSize['2xl'],
                  color: theme.colors.success,
                  fontWeight: theme.typography.fontWeight.bold,
                  marginBottom: theme.spacing.sm
                }}>
                  {stats.activeKeys}
                </div>
                <div style={{ color: theme.colors.textMuted, fontSize: theme.typography.fontSize.sm }}>
                  Active Keys
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card style={{ textAlign: 'center', borderColor: theme.colors.info }}>
              <Card.Body>
                <div style={{ 
                  fontSize: theme.typography.fontSize['2xl'],
                  color: theme.colors.info,
                  fontWeight: theme.typography.fontWeight.bold,
                  marginBottom: theme.spacing.sm
                }}>
                  {stats.totalUsage.toLocaleString()}
                </div>
                <div style={{ color: theme.colors.textMuted, fontSize: theme.typography.fontSize.sm }}>
                  Total API Calls
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card style={{ textAlign: 'center', borderColor: theme.colors.warning }}>
              <Card.Body>
                <div style={{ 
                  fontSize: theme.typography.fontSize['2xl'],
                  color: theme.colors.warning,
                  fontWeight: theme.typography.fontWeight.bold,
                  marginBottom: theme.spacing.sm
                }}>
                  {stats.recentUsage.toLocaleString()}
                </div>
                <div style={{ color: theme.colors.textMuted, fontSize: theme.typography.fontSize.sm }}>
                  Recent Usage (24h)
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* API Keys Table */}
      <Row>
        <Col>
          <Card>
            <Card.Header>
              <h5 style={{ margin: 0 }}>🔑 API Keys</h5>
            </Card.Header>
            <Card.Body>
              {apiKeys.length > 0 ? (
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Key ID</th>
                      <th>User ID</th>
                      <th>Permissions</th>
                      <th>Created</th>
                      <th>Last Used</th>
                      <th>Usage Count</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apiKeys.map((key, index) => (
                      <tr key={index}>
                        <td>
                          <strong>{key.name}</strong>
                        </td>
                        <td>
                          <code style={{ fontSize: theme.typography.fontSize.xs }}>
                            {key.keyId}
                          </code>
                        </td>
                        <td>
                          <Badge bg="secondary">{key.userId}</Badge>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: theme.spacing.xs }}>
                            {key.permissions.map((perm, i) => (
                              <Badge key={i} bg="info" style={{ fontSize: theme.typography.fontSize.xs }}>
                                {perm}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td>
                          <small>{formatDate(key.createdAt)}</small>
                        </td>
                        <td>
                          <small>{key.lastUsed ? formatDate(key.lastUsed) : 'Never'}</small>
                        </td>
                        <td>
                          <Badge bg="primary">{key.usageCount}</Badge>
                        </td>
                        <td>
                          {getStatusBadge(key.status)}
                        </td>
                        <td>
                          {key.fullKey && (
                            <Button 
                              variant="outline-secondary" 
                              size="sm"
                              onClick={() => copyToClipboard(key.fullKey!)}
                            >
                              Copy Key
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <Alert variant="info">
                  <strong>No API keys found</strong>
                  <br />
                  Generate your first API key to start using the AgentHub API.
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Create API Key Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Generate New API Key</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Key Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="e.g., Production API Key"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>User ID</Form.Label>
                  <Form.Control
                    type="text"
                    value={newKeyUserId}
                    onChange={(e) => setNewKeyUserId(e.target.value)}
                    placeholder="e.g., user-123"
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Permissions</Form.Label>
              <div>
                {apiKeyService.getAvailablePermissions().map((perm) => (
                  <Form.Check
                    key={perm.value}
                    type="checkbox"
                    id={`perm-${perm.value}`}
                    label={
                      <div>
                        <strong>{perm.label}</strong>
                        <br />
                        <small style={{ color: theme.colors.textMuted }}>{perm.description}</small>
                      </div>
                    }
                    checked={selectedPermissions.includes(perm.value)}
                    onChange={(e) => handlePermissionChange(perm.value, e.target.checked)}
                    className="mb-2"
                  />
                ))}
              </div>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleCreateKey}>
            Generate API Key
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Created Key Modal */}
      <Modal show={!!createdKey} onHide={() => setCreatedKey(null)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>✅ API Key Generated Successfully</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="success">
            <strong>Your new API key has been generated!</strong>
            <br />
            Please copy and store it securely. You won't be able to see the full key again.
          </Alert>
          
          {createdKey && (
            <div>
              <Form.Group className="mb-3">
                <Form.Label>API Key</Form.Label>
                <div style={{ display: 'flex', gap: theme.spacing.sm }}>
                  <Form.Control
                    type="text"
                    value={createdKey.fullKey || createdKey.keyId}
                    readOnly
                    style={{ fontFamily: 'monospace' }}
                  />
                  <Button 
                    variant="outline-primary"
                    onClick={() => copyToClipboard(createdKey.apiKey || createdKey.fullKey || createdKey.keyId || '')}
                  >
                    Copy
                  </Button>
                </div>
              </Form.Group>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: theme.spacing.md, alignItems: 'center' }}>
                <strong>Name:</strong>
                <span>{createdKey.name}</span>
                <strong>User ID:</strong>
                <span>{createdKey.userId}</span>
                <strong>Permissions:</strong>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: theme.spacing.xs }}>
                  {createdKey.permissions.map((perm, i) => (
                    <Badge key={i} bg="info">{perm}</Badge>
                  ))}
                </div>
                <strong>Created:</strong>
                <span>{formatDate(createdKey.createdAt)}</span>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={() => setCreatedKey(null)}>
            Done
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default APIKeyManagement;