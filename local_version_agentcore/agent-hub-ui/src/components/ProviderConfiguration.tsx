import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Alert, Form, Modal, Tabs, Tab } from 'react-bootstrap';
import PermissionGuard from './PermissionGuard';
import { usePermissions } from '../hooks/usePermissions';
import { cloudProviderService, CloudProvider, AIModelProvider } from '../services/cloudProviderService';
import { FaPlug, FaCheck, FaTimes, FaCog, FaKey, FaCloud } from 'react-icons/fa';

// Type assertions for React Icons
const PlugIcon = FaPlug as any;
const CheckIcon = FaCheck as any;
const TimesIcon = FaTimes as any;
const CogIcon = FaCog as any;
const KeyIcon = FaKey as any;
const CloudIcon = FaCloud as any;

interface ConnectionStatus {
  providerId: string;
  connected: boolean;
  lastTest?: Date;
  latency?: number;
  error?: string;
}

const ProviderConfiguration: React.FC = () => {
  const { hasPermission, user } = usePermissions();
  const [aiProviders, setAIProviders] = useState<AIModelProvider[]>([]);
  const [cloudProviders, setCloudProviders] = useState<CloudProvider[]>([]);
  const [connectionStatuses, setConnectionStatuses] = useState<Map<string, ConnectionStatus>>(new Map());
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<CloudProvider | AIModelProvider | null>(null);
  const [loading, setLoading] = useState(true);
  const [configForm, setConfigForm] = useState({
    apiKey: '',
    endpoint: '',
    region: '',
    projectId: '',
    subscriptionId: ''
  });

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      const aiProvs = cloudProviderService.getAIProviders();
      const cloudProvs = cloudProviderService.getCloudProviders();
      
      setAIProviders(aiProvs);
      setCloudProviders(cloudProvs);
      
      // Initialize connection statuses
      const statuses = new Map<string, ConnectionStatus>();
      [...aiProvs, ...cloudProvs].forEach(provider => {
        statuses.set(provider.id, {
          providerId: provider.id,
          connected: Math.random() > 0.3, // Simulate some connected, some not
          lastTest: new Date(),
          latency: Math.floor(50 + Math.random() * 200)
        });
      });
      setConnectionStatuses(statuses);
      
    } catch (error) {
      console.error('Error loading providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async (providerId: string) => {
    try {
      const result = await cloudProviderService.testConnection(providerId);
      
      setConnectionStatuses(prev => {
        const newStatuses = new Map(prev);
        newStatuses.set(providerId, {
          providerId,
          connected: result.success,
          lastTest: new Date(),
          latency: result.latency,
          error: result.error
        });
        return newStatuses;
      });
    } catch (error) {
      console.error('Connection test failed:', error);
    }
  };

  const configureProvider = (provider: CloudProvider | AIModelProvider) => {
    setSelectedProvider(provider);
    setConfigForm({
      apiKey: '',
      endpoint: '',
      region: '',
      projectId: '',
      subscriptionId: ''
    });
    setShowConfigModal(true);
  };

  const saveConfiguration = async () => {
    if (!selectedProvider) return;

    try {
      const result = await cloudProviderService.connectProvider(selectedProvider.id, configForm);
      
      if (result.success) {
        setConnectionStatuses(prev => {
          const newStatuses = new Map(prev);
          newStatuses.set(selectedProvider.id, {
            providerId: selectedProvider.id,
            connected: true,
            lastTest: new Date()
          });
          return newStatuses;
        });
        setShowConfigModal(false);
        alert('Provider configured successfully!');
      } else {
        alert(`Configuration failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Configuration error:', error);
      alert('Configuration failed');
    }
  };

  const getConnectionBadge = (providerId: string) => {
    const status = connectionStatuses.get(providerId);
    if (!status) return <Badge bg="secondary">Unknown</Badge>;
    
    return status.connected ? 
      <Badge bg="success"><CheckIcon className="me-1" />Connected</Badge> :
      <Badge bg="danger"><TimesIcon className="me-1" />Disconnected</Badge>;
  };

  const getProviderTypeBadge = (provider: any) => {
    if ('models' in provider) {
      return <Badge bg="primary">AI Provider</Badge>;
    } else {
      return <Badge bg="success">Cloud Provider</Badge>;
    }
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
    <PermissionGuard permission={['system.admin', 'integration.manage']} requireAll={false}>
      <Container fluid className="mt-4">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="mb-1">
              <PlugIcon className="me-2" />
              Provider Configuration
            </h2>
            <p className="text-muted mb-0">
              Configure and manage connections to AI providers and cloud platforms
            </p>
          </div>
          <div>
            <Badge bg="info" className="me-2">
              Role: {user?.role}
            </Badge>
            <Button variant="primary" onClick={loadProviders}>
              <PlugIcon className="me-2" />
              Refresh Connections
            </Button>
          </div>
        </div>

        {/* Access Control Notice */}
        <Alert variant="warning" className="mb-4">
          <strong>🔒 Admin Access Required:</strong> Provider configuration requires system administrator privileges.
          <br />
          <small>Only users with 'system.admin' or 'integration.manage' permissions can modify provider settings.</small>
        </Alert>

        {/* Main Content Tabs */}
        <Tabs defaultActiveKey="ai-providers" className="mb-4">
          <Tab eventKey="ai-providers" title="AI Providers">
            <Row>
              {aiProviders.map((provider) => {
                const status = connectionStatuses.get(provider.id);
                return (
                  <Col md={6} lg={4} key={provider.id} className="mb-4">
                    <Card className={`h-100 ${status?.connected ? 'border-success' : 'border-warning'}`}>
                      <Card.Header className="d-flex justify-content-between align-items-center">
                        <div>
                          <CloudIcon className="me-2" />
                          <strong>{provider.name}</strong>
                        </div>
                        {getProviderTypeBadge(provider)}
                      </Card.Header>
                      <Card.Body>
                        {/* Connection Status */}
                        <div className="mb-3">
                          {getConnectionBadge(provider.id)}
                          {status?.latency && (
                            <Badge bg="light" text="dark" className="ms-2">
                              {status.latency}ms
                            </Badge>
                          )}
                        </div>

                        {/* Provider Info */}
                        <div className="mb-3">
                          <small className="text-muted">Models Available:</small>
                          <div className="mt-1">
                            {provider.models.slice(0, 2).map((model, index) => (
                              <Badge key={index} bg="light" text="dark" className="me-1 mb-1">
                                {model.name}
                              </Badge>
                            ))}
                            {provider.models.length > 2 && (
                              <Badge bg="light" text="dark">
                                +{provider.models.length - 2} more
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Pricing */}
                        <div className="mb-3">
                          <small className="text-muted">Pricing:</small>
                          <br />
                          <small>
                            ${provider.pricing.inputCostPer1K}/1K input tokens
                            <br />
                            ${provider.pricing.outputCostPer1K}/1K output tokens
                          </small>
                        </div>

                        {/* Capabilities */}
                        <div className="mb-3">
                          <small className="text-muted">Capabilities:</small>
                          <div className="mt-1">
                            {provider.capabilities.slice(0, 2).map((cap, index) => (
                              <Badge key={index} bg="info" className="me-1 mb-1 small">
                                {cap}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="d-grid gap-2">
                          <Button
                            variant={status?.connected ? 'outline-primary' : 'primary'}
                            size="sm"
                            onClick={() => configureProvider(provider)}
                          >
                            <CogIcon className="me-1" />
                            {status?.connected ? 'Reconfigure' : 'Configure'}
                          </Button>
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => testConnection(provider.id)}
                          >
                            <PlugIcon className="me-1" />
                            Test Connection
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          </Tab>

          <Tab eventKey="cloud-providers" title="Cloud Providers">
            <Row>
              {cloudProviders.map((provider) => {
                const status = connectionStatuses.get(provider.id);
                return (
                  <Col md={6} lg={4} key={provider.id} className="mb-4">
                    <Card className={`h-100 ${status?.connected ? 'border-success' : 'border-warning'}`}>
                      <Card.Header className="d-flex justify-content-between align-items-center">
                        <div>
                          <CloudIcon className="me-2" />
                          <strong>{provider.name}</strong>
                        </div>
                        {getProviderTypeBadge(provider)}
                      </Card.Header>
                      <Card.Body>
                        {/* Connection Status */}
                        <div className="mb-3">
                          {getConnectionBadge(provider.id)}
                          {status?.latency && (
                            <Badge bg="light" text="dark" className="ms-2">
                              {status.latency}ms
                            </Badge>
                          )}
                        </div>

                        {/* Provider Info */}
                        <div className="mb-3">
                          <small className="text-muted">Type:</small>
                          <br />
                          <Badge bg="success">{provider.type.toUpperCase()}</Badge>
                        </div>

                        <div className="mb-3">
                          <small className="text-muted">Region:</small>
                          <br />
                          <Badge bg="light" text="dark">{provider.region}</Badge>
                        </div>

                        {/* Configuration */}
                        <div className="mb-3">
                          <small className="text-muted">Endpoint:</small>
                          <br />
                          <small className="text-break">
                            {provider.config.endpoint || 'Not configured'}
                          </small>
                        </div>

                        {/* Actions */}
                        <div className="d-grid gap-2">
                          <Button
                            variant={status?.connected ? 'outline-primary' : 'primary'}
                            size="sm"
                            onClick={() => configureProvider(provider)}
                          >
                            <CogIcon className="me-1" />
                            {status?.connected ? 'Reconfigure' : 'Configure'}
                          </Button>
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => testConnection(provider.id)}
                          >
                            <PlugIcon className="me-1" />
                            Test Connection
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          </Tab>

          <Tab eventKey="universal-connector" title="Universal Connector">
            <Card>
              <Card.Header>
                <h5 className="mb-0">Universal Connector Framework</h5>
              </Card.Header>
              <Card.Body>
                <Alert variant="info" className="mb-4">
                  <strong>🔌 Universal Connector:</strong> Our framework provides a unified interface to connect with any cloud provider or AI service.
                  <br />
                  <small>Add new providers without changing your agent code.</small>
                </Alert>

                <Row>
                  <Col md={6} className="mb-3">
                    <Card className="h-100">
                      <Card.Body>
                        <h6>Supported Integrations</h6>
                        <ul className="small">
                          <li>OpenAI, Anthropic, Azure OpenAI</li>
                          <li>AWS Bedrock, GCP Vertex AI</li>
                          <li>Custom API endpoints</li>
                          <li>On-premise deployments</li>
                        </ul>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6} className="mb-3">
                    <Card className="h-100">
                      <Card.Body>
                        <h6>Benefits</h6>
                        <ul className="small">
                          <li>No vendor lock-in</li>
                          <li>Seamless provider switching</li>
                          <li>Cost optimization</li>
                          <li>Future-proof architecture</li>
                        </ul>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Tab>
        </Tabs>

        {/* Configuration Modal */}
        <Modal show={showConfigModal} onHide={() => setShowConfigModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>
              Configure {selectedProvider?.name}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedProvider && (
              <>
                <Alert variant="info">
                  <strong>Provider Configuration:</strong> Enter the credentials and settings for {selectedProvider.name}.
                  <br />
                  <small>All credentials are encrypted and stored securely.</small>
                </Alert>

                <Form>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>
                          <KeyIcon className="me-1" />
                          API Key
                        </Form.Label>
                        <Form.Control
                          type="password"
                          value={configForm.apiKey}
                          onChange={(e) => setConfigForm({...configForm, apiKey: e.target.value})}
                          placeholder="Enter API key"
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Region</Form.Label>
                        <Form.Control
                          type="text"
                          value={configForm.region}
                          onChange={(e) => setConfigForm({...configForm, region: e.target.value})}
                          placeholder="e.g., us-east-1"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label>Endpoint URL</Form.Label>
                    <Form.Control
                      type="url"
                      value={configForm.endpoint}
                      onChange={(e) => setConfigForm({...configForm, endpoint: e.target.value})}
                      placeholder="https://api.provider.com/v1"
                    />
                  </Form.Group>

                  {selectedProvider.id.includes('azure') && (
                    <Form.Group className="mb-3">
                      <Form.Label>Subscription ID</Form.Label>
                      <Form.Control
                        type="text"
                        value={configForm.subscriptionId}
                        onChange={(e) => setConfigForm({...configForm, subscriptionId: e.target.value})}
                        placeholder="Azure subscription ID"
                      />
                    </Form.Group>
                  )}

                  {selectedProvider.id.includes('gcp') && (
                    <Form.Group className="mb-3">
                      <Form.Label>Project ID</Form.Label>
                      <Form.Control
                        type="text"
                        value={configForm.projectId}
                        onChange={(e) => setConfigForm({...configForm, projectId: e.target.value})}
                        placeholder="GCP project ID"
                      />
                    </Form.Group>
                  )}
                </Form>
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowConfigModal(false)}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={saveConfiguration}
              disabled={!configForm.apiKey}
            >
              <CogIcon className="me-1" />
              Save Configuration
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </PermissionGuard>
  );
};

export default ProviderConfiguration;