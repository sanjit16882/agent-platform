/**
 * VectorDBIntegrationsManager
 * 
 * Component for managing data source integrations (Confluence, SharePoint, etc.)
 */

import React, { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Button, Form, Table, Badge, Modal, Alert, Spinner } from 'react-bootstrap';
import api from '../utils/apiClient';

interface Integration {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  lastSync?: string;
  lastSyncStatus?: 'success' | 'failed' | 'in_progress';
  documentsImported?: number;
}

const VectorDBIntegrationsManager: React.FC = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(false);
  const [showConfluenceModal, setShowConfluenceModal] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [providers, setProviders] = useState<any[]>([]);
  
  // Confluence form state
  const [confluenceConfig, setConfluenceConfig] = useState({
    baseUrl: '',
    username: '',
    apiToken: '',
    spaceKeys: '',
    providerId: ''
  });
  
  useEffect(() => {
    fetchProviders();
    fetchIntegrations();
  }, []);
  
  const fetchProviders = async () => {
    try {
      const response = await api.get('/api/v1/vector-db/providers');
      const data = await response.json();
      
      if (data.success) {
        // Combine approved and marketplace providers
        const allProviders = [
          ...(data.data.approved || []),
          ...(data.data.marketplace || [])
        ];
        setProviders(allProviders);
        
        // Set first provider as default if not set
        if (allProviders.length > 0 && !confluenceConfig.providerId) {
          setConfluenceConfig(prev => ({
            ...prev,
            providerId: allProviders[0].id
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching providers:', error);
    }
  };
  
  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/v1/vector-db/integrations');
      const data = await response.json();
      
      if (data.success) {
        setIntegrations(data.data);
      }
    } catch (error) {
      console.error('Error fetching integrations:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreateConfluence = async () => {
    try {
      const spaceKeysArray = confluenceConfig.spaceKeys
        .split(',')
        .map(s => s.trim())
        .filter(s => s);
      
      if (!confluenceConfig.baseUrl || !confluenceConfig.username || !confluenceConfig.apiToken || spaceKeysArray.length === 0) {
        alert('Please fill in all required fields');
        return;
      }
      
      const response = await fetch('http://localhost:3002/api/v1/vector-db/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: `confluence-${Date.now()}`,
          name: `Confluence (${spaceKeysArray.join(', ')})`,
          type: 'confluence',
          enabled: true,
          config: {
            baseUrl: confluenceConfig.baseUrl,
            username: confluenceConfig.username,
            apiToken: confluenceConfig.apiToken,
            spaceKeys: spaceKeysArray,
            providerId: confluenceConfig.providerId
          }
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Confluence integration created successfully!');
        setShowConfluenceModal(false);
        setConfluenceConfig({
          baseUrl: '',
          username: '',
          apiToken: '',
          spaceKeys: '',
          providerId: 'opensearch'
        });
        fetchIntegrations();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };
  
  const handleSync = async (id: string) => {
    try {
      setSyncing(id);
      
      const response = await fetch(`http://localhost:3002/api/v1/vector-db/integrations/${id}/sync`, {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(`Sync complete! ${data.data.documentsImported} documents imported`);
        fetchIntegrations();
      } else {
        alert(`Sync failed: ${data.error}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setSyncing(null);
    }
  };
  
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this integration?')) return;
    
    try {
      const response = await fetch(`http://localhost:3002/api/v1/vector-db/integrations/${id}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Integration deleted successfully');
        fetchIntegrations();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };
  
  const getStatusBadge = (status?: string) => {
    const variants: Record<string, string> = {
      success: 'success',
      failed: 'danger',
      in_progress: 'warning'
    };
    return <Badge bg={variants[status || 'secondary'] || 'secondary'}>
      {status?.toUpperCase() || 'NOT SYNCED'}
    </Badge>;
  };
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };
  
  return (
    <Container fluid className="py-4">
      <div className="mb-4">
        <h2>🔗 Data Source Integrations</h2>
        <p className="text-muted">Automatically sync documents from external sources</p>
      </div>
      
      {/* Add Integration Cards */}
      <Row className="mb-4">
        <Col md={4}>
          <Card className="h-100">
            <Card.Body>
              <h5>📚 Confluence</h5>
              <p className="text-muted small">Sync wiki pages and documentation</p>
              <Button 
                variant="primary" 
                size="sm"
                onClick={() => setShowConfluenceModal(true)}
              >
                + Add Confluence
              </Button>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4}>
          <Card className="h-100">
            <Card.Body>
              <h5>📁 SharePoint</h5>
              <p className="text-muted small">Sync document libraries</p>
              <Button variant="secondary" size="sm" disabled>
                Coming Soon
              </Button>
              <p className="text-muted small mt-2 mb-0">
                Follow the same pattern as Confluence
              </p>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4}>
          <Card className="h-100">
            <Card.Body>
              <h5>📂 Google Drive</h5>
              <p className="text-muted small">Sync folders and documents</p>
              <Button variant="secondary" size="sm" disabled>
                Coming Soon
              </Button>
              <p className="text-muted small mt-2 mb-0">
                Follow the same pattern as Confluence
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Existing Integrations */}
      <Card>
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <span>Active Integrations ({integrations.length})</span>
            {integrations.length > 0 && (
              <Button 
                size="sm" 
                variant="outline-primary"
                onClick={() => {
                  // Sync all
                  integrations.forEach(i => handleSync(i.id));
                }}
              >
                Sync All
              </Button>
            )}
          </div>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" />
            </div>
          ) : integrations.length === 0 ? (
            <Alert variant="info">
              No integrations configured. Add your first integration above!
            </Alert>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Last Sync</th>
                  <th>Documents</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {integrations.map(integration => (
                  <tr key={integration.id}>
                    <td>
                      <strong>{integration.name}</strong>
                      {!integration.enabled && (
                        <Badge bg="secondary" className="ms-2">Disabled</Badge>
                      )}
                    </td>
                    <td>
                      <Badge bg="info">{integration.type}</Badge>
                    </td>
                    <td>{getStatusBadge(integration.lastSyncStatus)}</td>
                    <td>
                      <small>{formatDate(integration.lastSync)}</small>
                    </td>
                    <td>{integration.documentsImported || 0}</td>
                    <td>
                      <Button 
                        size="sm" 
                        variant="outline-primary"
                        className="me-1"
                        onClick={() => handleSync(integration.id)}
                        disabled={syncing === integration.id}
                      >
                        {syncing === integration.id ? 'Syncing...' : 'Sync Now'}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline-danger"
                        onClick={() => handleDelete(integration.id)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
      
      {/* Confluence Configuration Modal */}
      <Modal show={showConfluenceModal} onHide={() => setShowConfluenceModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>📚 Add Confluence Integration</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Base URL <span className="text-danger">*</span></Form.Label>
              <Form.Control 
                placeholder="https://yourcompany.atlassian.net"
                value={confluenceConfig.baseUrl}
                onChange={(e) => setConfluenceConfig({...confluenceConfig, baseUrl: e.target.value})}
              />
              <Form.Text>Your Confluence instance URL</Form.Text>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Username (Email) <span className="text-danger">*</span></Form.Label>
              <Form.Control 
                type="email"
                placeholder="your-email@company.com"
                value={confluenceConfig.username}
                onChange={(e) => setConfluenceConfig({...confluenceConfig, username: e.target.value})}
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>API Token <span className="text-danger">*</span></Form.Label>
              <Form.Control 
                type="password"
                placeholder="Your Atlassian API token"
                value={confluenceConfig.apiToken}
                onChange={(e) => setConfluenceConfig({...confluenceConfig, apiToken: e.target.value})}
              />
              <Form.Text>
                <a href="https://id.atlassian.com/manage-profile/security/api-tokens" target="_blank" rel="noopener noreferrer">
                  Generate API token
                </a>
              </Form.Text>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Space Keys <span className="text-danger">*</span></Form.Label>
              <Form.Control 
                placeholder="DOCS, KB, SUPPORT"
                value={confluenceConfig.spaceKeys}
                onChange={(e) => setConfluenceConfig({...confluenceConfig, spaceKeys: e.target.value})}
              />
              <Form.Text>Comma-separated list of space keys to sync</Form.Text>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Vector DB Provider</Form.Label>
              <Form.Select 
                value={confluenceConfig.providerId}
                onChange={(e) => setConfluenceConfig({...confluenceConfig, providerId: e.target.value})}
              >
                {providers.length === 0 ? (
                  <option>Loading providers...</option>
                ) : (
                  providers.map(provider => (
                    <option key={provider.id} value={provider.id}>
                      {provider.icon} {provider.name} {provider.status === 'marketplace' ? '(Marketplace)' : ''}
                    </option>
                  ))
                )}
              </Form.Select>
              <Form.Text className="text-muted">
                {providers.find(p => p.id === confluenceConfig.providerId)?.description}
              </Form.Text>
            </Form.Group>
            
            <Alert variant="info">
              <strong>Note:</strong> The initial sync may take several minutes depending on the number of pages.
            </Alert>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfluenceModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleCreateConfluence}>
            Create Integration
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default VectorDBIntegrationsManager;
