import React, { useState, useCallback, useEffect } from 'react';
import { Card, Row, Col, Button, Form, Alert, Badge, Modal, ListGroup, Tab, Nav } from 'react-bootstrap';
import { ApiKeyManager } from './ApiKeyManager';
import { ServiceCatalog } from './ServiceCatalog';
import { ConnectionTester } from './ConnectionTester';
import { UsageAnalytics } from './UsageAnalytics';

interface Integration {
  id: string;
  name: string;
  description: string;
  category: string;
  status: 'connected' | 'disconnected' | 'error';
  lastUsed?: Date;
  apiKeyId?: string;
  configuration: Record<string, any>;
  endpoints: IntegrationEndpoint[];
}

interface IntegrationEndpoint {
  id: string;
  name: string;
  method: string;
  path: string;
  description: string;
  parameters: EndpointParameter[];
  rateLimit?: {
    requests: number;
    period: string;
  };
}

interface EndpointParameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
  default?: any;
}

interface ApiUsage {
  integrationId: string;
  endpoint: string;
  requestCount: number;
  lastRequest: Date;
  errorCount: number;
  avgResponseTime: number;
}

export const IntegrationHub: React.FC = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [usageData, setUsageData] = useState<ApiUsage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadIntegrations();
    loadUsageData();
  }, []);

  const loadIntegrations = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Simulate loading integrations from API
      const mockIntegrations: Integration[] = [
        {
          id: 'openai',
          name: 'OpenAI',
          description: 'GPT models and AI services',
          category: 'AI/ML',
          status: 'connected',
          lastUsed: new Date(Date.now() - 3600000), // 1 hour ago
          apiKeyId: 'key_openai_1',
          configuration: {
            model: 'gpt-4',
            maxTokens: 4000,
            temperature: 0.7
          },
          endpoints: [
            {
              id: 'chat_completions',
              name: 'Chat Completions',
              method: 'POST',
              path: '/v1/chat/completions',
              description: 'Generate chat completions',
              parameters: [
                { name: 'model', type: 'string', required: true, description: 'Model to use' },
                { name: 'messages', type: 'array', required: true, description: 'Chat messages' },
                { name: 'temperature', type: 'number', required: false, description: 'Sampling temperature', default: 0.7 }
              ],
              rateLimit: { requests: 3500, period: 'minute' }
            }
          ]
        },
        {
          id: 'github',
          name: 'GitHub',
          description: 'Repository and code management',
          category: 'Development',
          status: 'connected',
          lastUsed: new Date(Date.now() - 7200000), // 2 hours ago
          apiKeyId: 'key_github_1',
          configuration: {
            baseUrl: 'https://api.github.com',
            version: 'v3'
          },
          endpoints: [
            {
              id: 'get_repo',
              name: 'Get Repository',
              method: 'GET',
              path: '/repos/{owner}/{repo}',
              description: 'Get repository information',
              parameters: [
                { name: 'owner', type: 'string', required: true, description: 'Repository owner' },
                { name: 'repo', type: 'string', required: true, description: 'Repository name' }
              ],
              rateLimit: { requests: 5000, period: 'hour' }
            }
          ]
        },
        {
          id: 'slack',
          name: 'Slack',
          description: 'Team communication and notifications',
          category: 'Communication',
          status: 'disconnected',
          configuration: {},
          endpoints: [
            {
              id: 'post_message',
              name: 'Post Message',
              method: 'POST',
              path: '/api/chat.postMessage',
              description: 'Send a message to a channel',
              parameters: [
                { name: 'channel', type: 'string', required: true, description: 'Channel ID' },
                { name: 'text', type: 'string', required: true, description: 'Message text' }
              ],
              rateLimit: { requests: 1, period: 'second' }
            }
          ]
        }
      ];

      setIntegrations(mockIntegrations);
    } catch (error) {
      console.error('Failed to load integrations:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadUsageData = useCallback(async () => {
    try {
      // Simulate loading usage data
      const mockUsage: ApiUsage[] = [
        {
          integrationId: 'openai',
          endpoint: '/v1/chat/completions',
          requestCount: 1247,
          lastRequest: new Date(Date.now() - 300000), // 5 minutes ago
          errorCount: 12,
          avgResponseTime: 1850
        },
        {
          integrationId: 'github',
          endpoint: '/repos/{owner}/{repo}',
          requestCount: 89,
          lastRequest: new Date(Date.now() - 7200000), // 2 hours ago
          errorCount: 2,
          avgResponseTime: 420
        }
      ];

      setUsageData(mockUsage);
    } catch (error) {
      console.error('Failed to load usage data:', error);
    }
  }, []);

  const handleIntegrationConnect = useCallback(async (integrationId: string, apiKey: string, config: Record<string, any>) => {
    try {
      // Simulate API call to connect integration
      await new Promise(resolve => setTimeout(resolve, 1000));

      setIntegrations(prev => prev.map(integration => 
        integration.id === integrationId 
          ? { 
              ...integration, 
              status: 'connected' as const,
              configuration: { ...integration.configuration, ...config },
              apiKeyId: `key_${integrationId}_${Date.now()}`
            }
          : integration
      ));

      alert('Integration connected successfully!');
    } catch (error) {
      alert('Failed to connect integration');
    }
  }, []);

  const handleIntegrationDisconnect = useCallback(async (integrationId: string) => {
    try {
      // Simulate API call to disconnect integration
      await new Promise(resolve => setTimeout(resolve, 500));

      setIntegrations(prev => prev.map(integration => 
        integration.id === integrationId 
          ? { 
              ...integration, 
              status: 'disconnected' as const,
              apiKeyId: undefined
            }
          : integration
      ));

      alert('Integration disconnected successfully!');
    } catch (error) {
      alert('Failed to disconnect integration');
    }
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge bg="success">Connected</Badge>;
      case 'disconnected':
        return <Badge bg="secondary">Disconnected</Badge>;
      case 'error':
        return <Badge bg="danger">Error</Badge>;
      default:
        return <Badge bg="secondary">Unknown</Badge>;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'AI/ML':
        return 'fas fa-brain';
      case 'Development':
        return 'fas fa-code';
      case 'Communication':
        return 'fas fa-comments';
      case 'Storage':
        return 'fas fa-database';
      case 'Analytics':
        return 'fas fa-chart-line';
      default:
        return 'fas fa-plug';
    }
  };

  if (isLoading) {
    return (
      <div className="text-center p-4">
        <i className="fas fa-spinner fa-spin fa-2x"></i>
        <p className="mt-2">Loading integrations...</p>
      </div>
    );
  }

  return (
    <div className="integration-hub">
      <Card className="mb-4">
        <Card.Header>
          <Row className="align-items-center">
            <Col>
              <h4 className="mb-0">Integration Hub</h4>
              <small className="text-muted">
                Manage API connections and service integrations
              </small>
            </Col>
            <Col xs="auto">
              <Button
                variant="primary"
                onClick={() => setShowAddModal(true)}
              >
                <i className="fas fa-plus me-2"></i>
                Add Integration
              </Button>
            </Col>
          </Row>
        </Card.Header>
      </Card>

      <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'overview')}>
        <Nav variant="tabs" className="mb-4">
          <Nav.Item>
            <Nav.Link eventKey="overview">
              <i className="fas fa-th-large me-2"></i>
              Overview
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="api-keys">
              <i className="fas fa-key me-2"></i>
              API Keys
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="catalog">
              <i className="fas fa-store me-2"></i>
              Service Catalog
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="analytics">
              <i className="fas fa-chart-bar me-2"></i>
              Usage Analytics
            </Nav.Link>
          </Nav.Item>
        </Nav>

        <Tab.Content>
          <Tab.Pane eventKey="overview">
            <Row>
              {integrations.map(integration => (
                <Col md={6} lg={4} key={integration.id} className="mb-4">
                  <Card className="h-100">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <div className="d-flex align-items-center">
                          <i className={`${getCategoryIcon(integration.category)} fa-2x text-primary me-3`}></i>
                          <div>
                            <h6 className="mb-1">{integration.name}</h6>
                            <small className="text-muted">{integration.category}</small>
                          </div>
                        </div>
                        {getStatusBadge(integration.status)}
                      </div>
                      
                      <p className="text-muted small mb-3">{integration.description}</p>
                      
                      {integration.lastUsed && (
                        <div className="small text-muted mb-3">
                          Last used: {integration.lastUsed.toLocaleString()}
                        </div>
                      )}

                      <div className="d-flex gap-2">
                        {integration.status === 'connected' ? (
                          <>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => setSelectedIntegration(integration)}
                            >
                              <i className="fas fa-cog me-1"></i>
                              Configure
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleIntegrationDisconnect(integration.id)}
                            >
                              <i className="fas fa-unlink me-1"></i>
                              Disconnect
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => setSelectedIntegration(integration)}
                          >
                            <i className="fas fa-link me-1"></i>
                            Connect
                          </Button>
                        )}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </Tab.Pane>

          <Tab.Pane eventKey="api-keys">
            <ApiKeyManager 
              integrations={integrations}
              onKeyUpdate={loadIntegrations}
            />
          </Tab.Pane>

          <Tab.Pane eventKey="catalog">
            <ServiceCatalog 
              onIntegrationAdd={(integration) => {
                setIntegrations(prev => [...prev, integration]);
                setShowAddModal(false);
              }}
            />
          </Tab.Pane>

          <Tab.Pane eventKey="analytics">
            <UsageAnalytics 
              integrations={integrations}
              usageData={usageData}
            />
          </Tab.Pane>
        </Tab.Content>
      </Tab.Container>

      {/* Integration Configuration Modal */}
      <Modal 
        show={selectedIntegration !== null} 
        onHide={() => setSelectedIntegration(null)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedIntegration?.status === 'connected' ? 'Configure' : 'Connect'} {selectedIntegration?.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedIntegration && (
            <ConnectionTester
              integration={selectedIntegration}
              onConnect={handleIntegrationConnect}
              onDisconnect={handleIntegrationDisconnect}
            />
          )}
        </Modal.Body>
      </Modal>

      {/* Add Integration Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Add New Integration</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <ServiceCatalog 
            onIntegrationAdd={(integration) => {
              setIntegrations(prev => [...prev, integration]);
              setShowAddModal(false);
            }}
          />
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default IntegrationHub;