import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Form, Badge, Spinner, Modal, Tabs, Tab, ListGroup } from 'react-bootstrap';
import { realMCPService } from '../../services/realMCPService';
import { RealMCPServerStatus } from './RealMCPServerStatus';

interface MCPServer {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  url?: string;
  status?: 'active' | 'inactive' | 'error';
  capabilities: string[];
  tools: string[];
  useCases: string[];
  configuration: Record<string, any>;
}

interface NewServerConfig {
  id: string;
  name: string;
  description: string;
  category: string;
  endpoint: string;
  tools: string[];
  capabilities: string[];
}

export const MCPManagementDashboard: React.FC = () => {
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedServer, setSelectedServer] = useState<MCPServer | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // New server form state
  const [newServer, setNewServer] = useState<NewServerConfig>({
    id: '',
    name: '',
    description: '',
    category: 'custom',
    endpoint: '',
    tools: [],
    capabilities: []
  });

  useEffect(() => {
    loadServers();
  }, []);

  const loadServers = async () => {
    try {
      setLoading(true);
      const serverList = await realMCPService.getRealDockerServers();
      setServers(serverList);
    } catch (error) {
      console.error('Failed to load MCP servers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOnboardServer = () => {
    setShowOnboardModal(true);
  };

  const handleCreateAgentHubServer = () => {
    setShowCreateModal(true);
    setNewServer({
      id: 'agenthub-custom',
      name: 'AgentHub Custom Server',
      description: 'Custom MCP server for AgentHub platform',
      category: 'custom',
      endpoint: 'http://localhost:4002/mcp/custom',
      tools: [],
      capabilities: []
    });
  };

  const handleServerAction = async (serverId: string, action: 'start' | 'stop' | 'restart' | 'remove') => {
    try {
      console.log(`${action} server: ${serverId}`);
      // Implement server actions
      await loadServers();
    } catch (error) {
      console.error(`Failed to ${action} server:`, error);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'secondary';
      case 'error': return 'danger';
      default: return 'secondary';
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      'system': '🗂️',
      'data': '🗄️',
      'development': '🌿',
      'communication': '📧',
      'project-management': '📋',
      'custom': '⚙️'
    };
    return icons[category] || '🔧';
  };

  return (
    <Container fluid className="py-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2>🔌 MCP Server Management</h2>
              <p className="text-muted mb-0">
                Manage, configure, and monitor all Model Context Protocol servers
              </p>
            </div>
            <div>
              <Button 
                variant="outline-primary" 
                className="me-2"
                onClick={handleOnboardServer}
              >
                <i className="fas fa-plus me-2"></i>
                Onboard New Server
              </Button>
              <Button 
                variant="primary"
                onClick={handleCreateAgentHubServer}
              >
                <i className="fas fa-rocket me-2"></i>
                Create AgentHub Server
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      {/* Server Status Overview */}
      <Row className="mb-4">
        <Col>
          <RealMCPServerStatus />
        </Col>
      </Row>

      {/* Main Content Tabs */}
      <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'overview')} className="mb-4">
        {/* Overview Tab */}
        <Tab eventKey="overview" title="Server Overview">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" />
              <p className="mt-2">Loading MCP servers...</p>
            </div>
          ) : (
            <Row>
              {servers.map(server => (
                <Col md={6} lg={4} key={server.id} className="mb-4">
                  <Card className="h-100">
                    <Card.Header className="d-flex justify-content-between align-items-center">
                      <div>
                        <span className="me-2">{getCategoryIcon(server.category)}</span>
                        <strong>{server.name}</strong>
                      </div>
                      <Badge bg={getStatusColor(server.status)}>
                        {server.status}
                      </Badge>
                    </Card.Header>
                    <Card.Body>
                      <p className="text-muted small">{server.description}</p>
                      
                      <div className="mb-3">
                        <strong className="small">Category:</strong>
                        <Badge bg="light" text="dark" className="ms-2">
                          {server.category}
                        </Badge>
                      </div>

                      <div className="mb-3">
                        <strong className="small d-block mb-1">Tools ({server.tools.length}):</strong>
                        <div className="d-flex flex-wrap gap-1">
                          {server.tools.slice(0, 3).map(tool => (
                            <Badge key={tool} bg="info" className="small">
                              {tool}
                            </Badge>
                          ))}
                          {server.tools.length > 3 && (
                            <Badge bg="secondary" className="small">
                              +{server.tools.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="mb-3">
                        <strong className="small d-block mb-1">Capabilities:</strong>
                        <div className="d-flex flex-wrap gap-1">
                          {server.capabilities.slice(0, 2).map(cap => (
                            <Badge key={cap} bg="success" className="small">
                              {cap}
                            </Badge>
                          ))}
                          {server.capabilities.length > 2 && (
                            <Badge bg="secondary" className="small">
                              +{server.capabilities.length - 2}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {server.url && (
                        <div className="mb-3">
                          <strong className="small">Endpoint:</strong>
                          <div className="small text-muted text-truncate">
                            {server.url}
                          </div>
                        </div>
                      )}
                    </Card.Body>
                    <Card.Footer>
                      <div className="d-flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline-primary"
                          onClick={() => setSelectedServer(server)}
                        >
                          Configure
                        </Button>
                        {server.status === 'active' ? (
                          <Button 
                            size="sm" 
                            variant="outline-warning"
                            onClick={() => handleServerAction(server.id, 'stop')}
                          >
                            Stop
                          </Button>
                        ) : (
                          <Button 
                            size="sm" 
                            variant="outline-success"
                            onClick={() => handleServerAction(server.id, 'start')}
                          >
                            Start
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline-secondary"
                          onClick={() => handleServerAction(server.id, 'restart')}
                        >
                          Restart
                        </Button>
                      </div>
                    </Card.Footer>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Tab>

        {/* Configuration Tab */}
        <Tab eventKey="configuration" title="Configuration">
          <Card>
            <Card.Header>
              <h5 className="mb-0">Global MCP Configuration</h5>
            </Card.Header>
            <Card.Body>
              <Form>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Health Check Interval (seconds)</Form.Label>
                      <Form.Control type="number" defaultValue={30} />
                      <Form.Text className="text-muted">
                        How often to check server health
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Default Timeout (seconds)</Form.Label>
                      <Form.Control type="number" defaultValue={30} />
                      <Form.Text className="text-muted">
                        Default timeout for MCP requests
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Max Retries</Form.Label>
                      <Form.Control type="number" defaultValue={3} />
                      <Form.Text className="text-muted">
                        Maximum retry attempts for failed requests
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Check 
                        type="switch"
                        id="fallback-switch"
                        label="Enable Fallback Mode"
                        defaultChecked
                      />
                      <Form.Text className="text-muted">
                        Fall back to standard processing if MCP fails
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>

                <Button variant="primary">
                  Save Configuration
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Tab>

        {/* Monitoring Tab */}
        <Tab eventKey="monitoring" title="Monitoring">
          <Row>
            <Col md={6}>
              <Card className="mb-4">
                <Card.Header>
                  <h5 className="mb-0">Server Health</h5>
                </Card.Header>
                <Card.Body>
                  <ListGroup variant="flush">
                    {servers.map(server => (
                      <ListGroup.Item key={server.id} className="d-flex justify-content-between align-items-center">
                        <div>
                          <span className="me-2">{getCategoryIcon(server.category)}</span>
                          {server.name}
                        </div>
                        <Badge bg={getStatusColor(server.status)}>
                          {server.status}
                        </Badge>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6}>
              <Card className="mb-4">
                <Card.Header>
                  <h5 className="mb-0">Quick Stats</h5>
                </Card.Header>
                <Card.Body>
                  <Row className="text-center">
                    <Col>
                      <h3 className="text-success">{servers.filter(s => s.status === 'active').length}</h3>
                      <p className="text-muted small mb-0">Active</p>
                    </Col>
                    <Col>
                      <h3 className="text-secondary">{servers.filter(s => s.status === 'inactive').length}</h3>
                      <p className="text-muted small mb-0">Inactive</p>
                    </Col>
                    <Col>
                      <h3 className="text-danger">{servers.filter(s => s.status === 'error').length}</h3>
                      <p className="text-muted small mb-0">Error</p>
                    </Col>
                    <Col>
                      <h3 className="text-primary">{servers.length}</h3>
                      <p className="text-muted small mb-0">Total</p>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              <Card>
                <Card.Header>
                  <h5 className="mb-0">Available Tools</h5>
                </Card.Header>
                <Card.Body>
                  <div className="text-center">
                    <h3 className="text-info">
                      {servers.reduce((sum, server) => sum + server.tools.length, 0)}
                    </h3>
                    <p className="text-muted small mb-0">Total Tools Across All Servers</p>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>

        {/* Documentation Tab */}
        <Tab eventKey="documentation" title="Documentation">
          <Card>
            <Card.Header>
              <h5 className="mb-0">MCP Server Documentation</h5>
            </Card.Header>
            <Card.Body>
              <Alert variant="info">
                <h6>📚 Model Context Protocol (MCP)</h6>
                <p className="mb-2">
                  MCP is a protocol that enables AI models to interact with external tools and data sources
                  in a standardized way. Each MCP server provides specific capabilities and tools.
                </p>
              </Alert>

              <h6 className="mt-4">Server Categories:</h6>
              <ListGroup className="mb-4">
                <ListGroup.Item>
                  <strong>🗂️ System:</strong> File operations, directory management
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>🗄️ Data:</strong> Database queries, data storage
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>🌿 Development:</strong> Git operations, code analysis
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>📧 Communication:</strong> Email, calendar, messaging
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>📋 Project Management:</strong> Issue tracking, project planning
                </ListGroup.Item>
              </ListGroup>

              <h6>Getting Started:</h6>
              <ol>
                <li>Review available servers in the Overview tab</li>
                <li>Configure servers with required credentials</li>
                <li>Test server connectivity</li>
                <li>Enable servers for your agents</li>
              </ol>
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>

      {/* Onboard New Server Modal */}
      <Modal show={showOnboardModal} onHide={() => setShowOnboardModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Onboard New MCP Server</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Server Type</Form.Label>
              <Form.Select>
                <option>Select server type...</option>
                <option value="filesystem">File System Server</option>
                <option value="database">Database Server</option>
                <option value="git">Git Server</option>
                <option value="github">GitHub Server</option>
                <option value="slack">Slack Server</option>
                <option value="custom">Custom Server</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Server Name</Form.Label>
              <Form.Control type="text" placeholder="My Custom Server" />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Endpoint URL</Form.Label>
              <Form.Control type="text" placeholder="http://localhost:3000/mcp" />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control as="textarea" rows={3} placeholder="Describe what this server does..." />
            </Form.Group>

            <Alert variant="info">
              <strong>Note:</strong> After onboarding, you'll need to configure authentication
              and test the connection before the server becomes available.
            </Alert>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowOnboardModal(false)}>
            Cancel
          </Button>
          <Button variant="primary">
            Onboard Server
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Create AgentHub Server Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Create AgentHub MCP Server</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="success">
            <strong>🚀 AgentHub Platform Server</strong>
            <p className="mb-0">
              Create a custom MCP server specifically designed for the AgentHub platform.
              This server will have access to AgentHub-specific tools and capabilities.
            </p>
          </Alert>

          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Server Name</Form.Label>
              <Form.Control 
                type="text" 
                value={newServer.name}
                onChange={(e) => setNewServer({...newServer, name: e.target.value})}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={2}
                value={newServer.description}
                onChange={(e) => setNewServer({...newServer, description: e.target.value})}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Capabilities</Form.Label>
              <Form.Check 
                type="checkbox" 
                label="Agent Management - Create, update, delete agents"
              />
              <Form.Check 
                type="checkbox" 
                label="Execution Control - Start, stop, monitor agent executions"
              />
              <Form.Check 
                type="checkbox" 
                label="Analytics Access - Query execution metrics and analytics"
              />
              <Form.Check 
                type="checkbox" 
                label="Marketplace Integration - Publish and manage marketplace listings"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Endpoint</Form.Label>
              <Form.Control 
                type="text" 
                value={newServer.endpoint}
                onChange={(e) => setNewServer({...newServer, endpoint: e.target.value})}
              />
              <Form.Text className="text-muted">
                The endpoint where this server will be accessible
              </Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
            Cancel
          </Button>
          <Button variant="primary">
            Create Server
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Server Configuration Modal */}
      {selectedServer && (
        <Modal show={!!selectedServer} onHide={() => setSelectedServer(null)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>
              {getCategoryIcon(selectedServer.category)} {selectedServer.name} Configuration
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Tabs defaultActiveKey="general">
              <Tab eventKey="general" title="General">
                <div className="pt-3">
                  <Form>
                    <Form.Group className="mb-3">
                      <Form.Label>Server Name</Form.Label>
                      <Form.Control type="text" defaultValue={selectedServer.name} />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Description</Form.Label>
                      <Form.Control as="textarea" rows={2} defaultValue={selectedServer.description} />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Status</Form.Label>
                      <div>
                        <Badge bg={getStatusColor(selectedServer.status)}>
                          {selectedServer.status}
                        </Badge>
                      </div>
                    </Form.Group>
                  </Form>
                </div>
              </Tab>

              <Tab eventKey="authentication" title="Authentication">
                <div className="pt-3">
                  <Alert variant="warning">
                    <strong>⚠️ Sensitive Information</strong>
                    <p className="mb-0">
                      Authentication credentials are encrypted and stored securely.
                    </p>
                  </Alert>
                  <Form>
                    {Object.entries(selectedServer.configuration).map(([key, config]: [string, any]) => (
                      <Form.Group key={key} className="mb-3">
                        <Form.Label>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</Form.Label>
                        <Form.Control 
                          type={config.sensitive ? 'password' : 'text'}
                          placeholder={config.description || `Enter ${key}`}
                          defaultValue={config.default}
                        />
                        {config.description && (
                          <Form.Text className="text-muted">{config.description}</Form.Text>
                        )}
                      </Form.Group>
                    ))}
                  </Form>
                </div>
              </Tab>

              <Tab eventKey="tools" title="Tools">
                <div className="pt-3">
                  <h6>Available Tools ({selectedServer.tools.length})</h6>
                  <ListGroup>
                    {selectedServer.tools.map(tool => (
                      <ListGroup.Item key={tool}>
                        <code>{tool}</code>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                </div>
              </Tab>
            </Tabs>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setSelectedServer(null)}>
              Close
            </Button>
            <Button variant="primary">
              Save Changes
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </Container>
  );
};
