import React, { useState } from 'react';
import { Container, Row, Col, Card, Badge, Button, Alert, Tabs, Tab, Table } from 'react-bootstrap';

interface APIEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  parameters?: { name: string; type: string; required: boolean; description: string }[];
  response: string;
  example: string;
}

const APIDocumentation: React.FC = () => {
  const [activeTab, setActiveTab] = useState('agents');

  const endpoints: { [key: string]: APIEndpoint[] } = {
    agents: [
      {
        method: 'GET',
        path: '/api/v1/agents',
        description: 'Retrieve all agents',
        response: 'Array of agent objects',
        example: `curl -H "Authorization: Bearer $TOKEN" \\
  https://api.agenthub.com/v1/agents`
      },
      {
        method: 'POST',
        path: '/api/v1/agents',
        description: 'Create a new agent',
        parameters: [
          { name: 'name', type: 'string', required: true, description: 'Agent name' },
          { name: 'description', type: 'string', required: true, description: 'Agent description' },
          { name: 'type', type: 'string', required: true, description: 'Agent type (mcp, lambda, hybrid)' },
          { name: 'config', type: 'object', required: true, description: 'Agent configuration' }
        ],
        response: 'Created agent object',
        example: `curl -X POST -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "My Agent",
    "description": "Custom automation agent",
    "type": "mcp",
    "config": {...}
  }' \\
  https://api.agenthub.com/v1/agents`
      },
      {
        method: 'GET',
        path: '/api/v1/agents/{id}',
        description: 'Get specific agent details',
        parameters: [
          { name: 'id', type: 'string', required: true, description: 'Agent ID' }
        ],
        response: 'Agent object',
        example: `curl -H "Authorization: Bearer $TOKEN" \\
  https://api.agenthub.com/v1/agents/agent-123`
      },
      {
        method: 'PUT',
        path: '/api/v1/agents/{id}',
        description: 'Update an existing agent',
        parameters: [
          { name: 'id', type: 'string', required: true, description: 'Agent ID' },
          { name: 'name', type: 'string', required: false, description: 'Updated agent name' },
          { name: 'description', type: 'string', required: false, description: 'Updated description' },
          { name: 'config', type: 'object', required: false, description: 'Updated configuration' }
        ],
        response: 'Updated agent object',
        example: `curl -X PUT -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "Updated Agent Name"}' \\
  https://api.agenthub.com/v1/agents/agent-123`
      },
      {
        method: 'DELETE',
        path: '/api/v1/agents/{id}',
        description: 'Delete an agent',
        parameters: [
          { name: 'id', type: 'string', required: true, description: 'Agent ID' }
        ],
        response: 'Success confirmation',
        example: `curl -X DELETE -H "Authorization: Bearer $TOKEN" \\
  https://api.agenthub.com/v1/agents/agent-123`
      }
    ],
    executions: [
      {
        method: 'POST',
        path: '/api/v1/agents/{id}/execute',
        description: 'Execute an agent',
        parameters: [
          { name: 'id', type: 'string', required: true, description: 'Agent ID' },
          { name: 'input', type: 'object', required: true, description: 'Execution input data' },
          { name: 'async', type: 'boolean', required: false, description: 'Asynchronous execution' }
        ],
        response: 'Execution result or execution ID',
        example: `curl -X POST -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "input": {
      "file_path": "/path/to/file.xlsx",
      "operation": "generate_report"
    },
    "async": true
  }' \\
  https://api.agenthub.com/v1/agents/agent-123/execute`
      },
      {
        method: 'GET',
        path: '/api/v1/executions/{id}',
        description: 'Get execution status and results',
        parameters: [
          { name: 'id', type: 'string', required: true, description: 'Execution ID' }
        ],
        response: 'Execution object with status and results',
        example: `curl -H "Authorization: Bearer $TOKEN" \\
  https://api.agenthub.com/v1/executions/exec-456`
      },
      {
        method: 'GET',
        path: '/api/v1/executions',
        description: 'List all executions',
        parameters: [
          { name: 'agent_id', type: 'string', required: false, description: 'Filter by agent ID' },
          { name: 'status', type: 'string', required: false, description: 'Filter by status' },
          { name: 'limit', type: 'number', required: false, description: 'Limit results' }
        ],
        response: 'Array of execution objects',
        example: `curl -H "Authorization: Bearer $TOKEN" \\
  "https://api.agenthub.com/v1/executions?limit=10&status=completed"`
      }
    ],
    mcp: [
      {
        method: 'GET',
        path: '/api/v1/mcp/servers',
        description: 'List available MCP servers',
        response: 'Array of MCP server objects',
        example: `curl -H "Authorization: Bearer $TOKEN" \\
  https://api.agenthub.com/v1/mcp/servers`
      },
      {
        method: 'GET',
        path: '/api/v1/mcp/servers/{server}/tools',
        description: 'Get tools available on an MCP server',
        parameters: [
          { name: 'server', type: 'string', required: true, description: 'MCP server name' }
        ],
        response: 'Array of tool objects',
        example: `curl -H "Authorization: Bearer $TOKEN" \\
  https://api.agenthub.com/v1/mcp/servers/office365/tools`
      },
      {
        method: 'POST',
        path: '/api/v1/mcp/servers/{server}/tools/{tool}/call',
        description: 'Call an MCP tool directly',
        parameters: [
          { name: 'server', type: 'string', required: true, description: 'MCP server name' },
          { name: 'tool', type: 'string', required: true, description: 'Tool name' },
          { name: 'arguments', type: 'object', required: true, description: 'Tool arguments' }
        ],
        response: 'Tool execution result',
        example: `curl -X POST -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "arguments": {
      "file_path": "/path/to/file.xlsx",
      "sheet_name": "Sheet1"
    }
  }' \\
  https://api.agenthub.com/v1/mcp/servers/office365/tools/excel_read/call`
      }
    ]
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'primary';
      case 'POST': return 'success';
      case 'PUT': return 'warning';
      case 'DELETE': return 'danger';
      default: return 'secondary';
    }
  };

  return (
    <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <Container fluid className="p-4">
        {/* Header */}
        <div className="mb-4">
          <h2 className="text-primary mb-1" style={{ fontSize: '1.75rem', fontWeight: '600' }}>
            📚 API Documentation
          </h2>
          <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>
            Complete REST API reference for AgentHub Platform
          </p>
        </div>

        {/* Authentication Info */}
        <Alert variant="info" className="mb-4">
          <div className="d-flex align-items-start">
            <span className="me-2">🔐</span>
            <div>
              <strong>Authentication:</strong> All API requests require a Bearer token in the Authorization header.
              <br />
              <strong>Base URL:</strong> <code>https://api.agenthub.com</code>
              <br />
              <strong>Rate Limits:</strong> 1000 requests per hour per API key
            </div>
          </div>
        </Alert>

        <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'agents')} className="mb-4">
          {/* Agents API */}
          <Tab eventKey="agents" title="🤖 Agents API">
            <Card className="border-0 shadow-sm">
              <Card.Body className="p-4">
                <h5 className="mb-3">Agent Management Endpoints</h5>
                
                {endpoints.agents.map((endpoint, index) => (
                  <Card key={index} className="mb-4 border-light">
                    <Card.Body>
                      <div className="d-flex align-items-center mb-3">
                        <Badge bg={getMethodColor(endpoint.method)} className="me-3">
                          {endpoint.method}
                        </Badge>
                        <code className="bg-light p-2 rounded flex-grow-1">{endpoint.path}</code>
                      </div>
                      
                      <p className="mb-3">{endpoint.description}</p>

                      {endpoint.parameters && (
                        <div className="mb-3">
                          <h6>Parameters:</h6>
                          <Table size="sm" responsive>
                            <thead>
                              <tr>
                                <th>Name</th>
                                <th>Type</th>
                                <th>Required</th>
                                <th>Description</th>
                              </tr>
                            </thead>
                            <tbody>
                              {endpoint.parameters.map((param, paramIndex) => (
                                <tr key={paramIndex}>
                                  <td><code>{param.name}</code></td>
                                  <td><Badge bg="outline-secondary">{param.type}</Badge></td>
                                  <td>
                                    <Badge bg={param.required ? 'danger' : 'secondary'}>
                                      {param.required ? 'Required' : 'Optional'}
                                    </Badge>
                                  </td>
                                  <td>{param.description}</td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </div>
                      )}

                      <div className="mb-3">
                        <h6>Response:</h6>
                        <p className="text-muted">{endpoint.response}</p>
                      </div>

                      <div>
                        <h6>Example:</h6>
                        <div className="bg-dark text-light p-3 rounded" style={{ fontFamily: 'monospace' }}>
                          <pre className="mb-0">{endpoint.example}</pre>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                ))}
              </Card.Body>
            </Card>
          </Tab>

          {/* Executions API */}
          <Tab eventKey="executions" title="⚡ Executions API">
            <Card className="border-0 shadow-sm">
              <Card.Body className="p-4">
                <h5 className="mb-3">Agent Execution Endpoints</h5>
                
                {endpoints.executions.map((endpoint, index) => (
                  <Card key={index} className="mb-4 border-light">
                    <Card.Body>
                      <div className="d-flex align-items-center mb-3">
                        <Badge bg={getMethodColor(endpoint.method)} className="me-3">
                          {endpoint.method}
                        </Badge>
                        <code className="bg-light p-2 rounded flex-grow-1">{endpoint.path}</code>
                      </div>
                      
                      <p className="mb-3">{endpoint.description}</p>

                      {endpoint.parameters && (
                        <div className="mb-3">
                          <h6>Parameters:</h6>
                          <Table size="sm" responsive>
                            <thead>
                              <tr>
                                <th>Name</th>
                                <th>Type</th>
                                <th>Required</th>
                                <th>Description</th>
                              </tr>
                            </thead>
                            <tbody>
                              {endpoint.parameters.map((param, paramIndex) => (
                                <tr key={paramIndex}>
                                  <td><code>{param.name}</code></td>
                                  <td><Badge bg="outline-secondary">{param.type}</Badge></td>
                                  <td>
                                    <Badge bg={param.required ? 'danger' : 'secondary'}>
                                      {param.required ? 'Required' : 'Optional'}
                                    </Badge>
                                  </td>
                                  <td>{param.description}</td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </div>
                      )}

                      <div className="mb-3">
                        <h6>Response:</h6>
                        <p className="text-muted">{endpoint.response}</p>
                      </div>

                      <div>
                        <h6>Example:</h6>
                        <div className="bg-dark text-light p-3 rounded" style={{ fontFamily: 'monospace' }}>
                          <pre className="mb-0">{endpoint.example}</pre>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                ))}
              </Card.Body>
            </Card>
          </Tab>

          {/* MCP API */}
          <Tab eventKey="mcp" title="🔗 MCP API">
            <Card className="border-0 shadow-sm">
              <Card.Body className="p-4">
                <h5 className="mb-3">Model Context Protocol Endpoints</h5>
                
                {endpoints.mcp.map((endpoint, index) => (
                  <Card key={index} className="mb-4 border-light">
                    <Card.Body>
                      <div className="d-flex align-items-center mb-3">
                        <Badge bg={getMethodColor(endpoint.method)} className="me-3">
                          {endpoint.method}
                        </Badge>
                        <code className="bg-light p-2 rounded flex-grow-1">{endpoint.path}</code>
                      </div>
                      
                      <p className="mb-3">{endpoint.description}</p>

                      {endpoint.parameters && (
                        <div className="mb-3">
                          <h6>Parameters:</h6>
                          <Table size="sm" responsive>
                            <thead>
                              <tr>
                                <th>Name</th>
                                <th>Type</th>
                                <th>Required</th>
                                <th>Description</th>
                              </tr>
                            </thead>
                            <tbody>
                              {endpoint.parameters.map((param, paramIndex) => (
                                <tr key={paramIndex}>
                                  <td><code>{param.name}</code></td>
                                  <td><Badge bg="outline-secondary">{param.type}</Badge></td>
                                  <td>
                                    <Badge bg={param.required ? 'danger' : 'secondary'}>
                                      {param.required ? 'Required' : 'Optional'}
                                    </Badge>
                                  </td>
                                  <td>{param.description}</td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </div>
                      )}

                      <div className="mb-3">
                        <h6>Response:</h6>
                        <p className="text-muted">{endpoint.response}</p>
                      </div>

                      <div>
                        <h6>Example:</h6>
                        <div className="bg-dark text-light p-3 rounded" style={{ fontFamily: 'monospace' }}>
                          <pre className="mb-0">{endpoint.example}</pre>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                ))}
              </Card.Body>
            </Card>
          </Tab>

          {/* SDKs & Libraries */}
          <Tab eventKey="sdks" title="📦 SDKs & Libraries">
            <Card className="border-0 shadow-sm">
              <Card.Body className="p-4">
                <h5 className="mb-3">Official SDKs and Libraries</h5>
                
                <Row>
                  <Col md={6} className="mb-4">
                    <Card className="border-light h-100">
                      <Card.Body>
                        <h6>JavaScript/TypeScript SDK</h6>
                        <p className="text-muted">Official SDK for Node.js and browser environments</p>
                        <div className="bg-dark text-light p-3 rounded mb-3" style={{ fontFamily: 'monospace' }}>
                          <code>npm install @agenthub/sdk</code>
                        </div>
                        <Button variant="outline-primary" size="sm">
                          📖 View Documentation
                        </Button>
                      </Card.Body>
                    </Card>
                  </Col>
                  
                  <Col md={6} className="mb-4">
                    <Card className="border-light h-100">
                      <Card.Body>
                        <h6>Python SDK</h6>
                        <p className="text-muted">Python library for agent management and execution</p>
                        <div className="bg-dark text-light p-3 rounded mb-3" style={{ fontFamily: 'monospace' }}>
                          <code>pip install agenthub-python</code>
                        </div>
                        <Button variant="outline-primary" size="sm">
                          📖 View Documentation
                        </Button>
                      </Card.Body>
                    </Card>
                  </Col>
                  
                  <Col md={6} className="mb-4">
                    <Card className="border-light h-100">
                      <Card.Body>
                        <h6>Go SDK</h6>
                        <p className="text-muted">Go library for high-performance integrations</p>
                        <div className="bg-dark text-light p-3 rounded mb-3" style={{ fontFamily: 'monospace' }}>
                          <code>go get github.com/agenthub/go-sdk</code>
                        </div>
                        <Button variant="outline-primary" size="sm">
                          📖 View Documentation
                        </Button>
                      </Card.Body>
                    </Card>
                  </Col>
                  
                  <Col md={6} className="mb-4">
                    <Card className="border-light h-100">
                      <Card.Body>
                        <h6>CLI Tool</h6>
                        <p className="text-muted">Command-line interface for agent management</p>
                        <div className="bg-dark text-light p-3 rounded mb-3" style={{ fontFamily: 'monospace' }}>
                          <code>npm install -g @agenthub/cli</code>
                        </div>
                        <Button variant="outline-primary" size="sm">
                          📖 View Documentation
                        </Button>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Tab>
        </Tabs>

        {/* Quick Actions */}
        <Row className="mt-4">
          <Col>
            <Card className="border-0 shadow-sm">
              <Card.Body className="text-center p-4">
                <h5 className="mb-3">🚀 Get Started with the API</h5>
                <div className="d-flex justify-content-center gap-3 flex-wrap">
                  <Button variant="primary" size="lg">
                    🔑 Get API Key
                  </Button>
                  <Button variant="info" size="lg">
                    📖 Interactive API Explorer
                  </Button>
                  <Button variant="success" size="lg">
                    💻 Download Postman Collection
                  </Button>
                  <Button variant="outline-secondary" size="lg">
                    💬 API Support
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default APIDocumentation;