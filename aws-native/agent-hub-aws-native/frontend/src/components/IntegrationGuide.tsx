import React, { useState } from 'react';
import { Container, Row, Col, Card, Badge, Button, Alert, Tabs, Tab, Accordion } from 'react-bootstrap';

const IntegrationGuide: React.FC = () => {
  const [activeTab, setActiveTab] = useState('cli');

  const integrationSteps = {
    cli: [
      {
        title: 'Install AgentHub CLI',
        command: 'npm install -g @agenthub/cli',
        description: 'Install the global CLI tool for agent management'
      },
      {
        title: 'Configure AWS Credentials',
        command: 'agenthub configure --aws-profile default',
        description: 'Set up your AWS credentials for deployment'
      },
      {
        title: 'Initialize Project',
        command: 'agenthub init my-agent-project',
        description: 'Create a new agent project structure'
      },
      {
        title: 'Deploy Agent',
        command: 'agenthub deploy --environment production',
        description: 'Deploy your agent to AWS infrastructure'
      }
    ],
    vscode: [
      {
        title: 'Install VS Code Extension',
        command: 'ext install agenthub.agenthub-vscode',
        description: 'Install from VS Code Marketplace or command palette'
      },
      {
        title: 'Open Command Palette',
        command: 'Ctrl+Shift+P (Windows/Linux) or Cmd+Shift+P (Mac)',
        description: 'Access AgentHub commands directly in VS Code'
      },
      {
        title: 'Create New Agent',
        command: 'AgentHub: Create New Agent',
        description: 'Use the integrated wizard to build agents'
      },
      {
        title: 'Deploy from Editor',
        command: 'AgentHub: Deploy Current Agent',
        description: 'Deploy directly from your code editor'
      }
    ],
    api: [
      {
        title: 'Get API Key',
        command: 'curl -X POST https://api.agenthub.com/auth/token',
        description: 'Obtain your API authentication token'
      },
      {
        title: 'List Agents',
        command: 'curl -H "Authorization: Bearer $TOKEN" https://api.agenthub.com/v1/agents',
        description: 'Retrieve all available agents'
      },
      {
        title: 'Execute Agent',
        command: 'curl -X POST -H "Authorization: Bearer $TOKEN" -d \'{"input": "data"}\' https://api.agenthub.com/v1/agents/{id}/execute',
        description: 'Execute an agent with input parameters'
      },
      {
        title: 'Monitor Execution',
        command: 'curl -H "Authorization: Bearer $TOKEN" https://api.agenthub.com/v1/executions/{id}',
        description: 'Check execution status and results'
      }
    ]
  };

  const mcpServers = [
    {
      name: 'Office 365 MCP',
      description: 'Excel, Word, PowerPoint, SharePoint integration',
      status: 'active',
      tools: ['excel_read', 'excel_write', 'word_generate', 'sharepoint_upload'],
      endpoint: 'mcp://office365.agenthub.com'
    },
    {
      name: 'Microsoft Teams MCP',
      description: 'Teams messaging, channels, and meeting automation',
      status: 'active',
      tools: ['teams_send_message', 'teams_create_channel', 'teams_schedule_meeting'],
      endpoint: 'mcp://teams.agenthub.com'
    },
    {
      name: 'GitHub MCP',
      description: 'Repository management, PR automation, issue tracking',
      status: 'active',
      tools: ['github_create_pr', 'github_merge_pr', 'github_create_issue'],
      endpoint: 'mcp://github.agenthub.com'
    },
    {
      name: 'AWS Services MCP',
      description: 'S3, Lambda, DynamoDB, and other AWS service integration',
      status: 'beta',
      tools: ['s3_upload', 's3_download', 'lambda_invoke', 'dynamodb_query'],
      endpoint: 'mcp://aws.agenthub.com'
    }
  ];

  return (
    <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <Container fluid className="p-4">
        {/* Header */}
        <div className="mb-4">
          <h2 className="text-primary mb-1" style={{ fontSize: '1.75rem', fontWeight: '600' }}>
            📚 Integration Guide
          </h2>
          <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>
            Complete guide for CLI, VS Code Extension, API, and MCP integrations
          </p>
        </div>

        {/* Quick Start Banner */}
        <Alert variant="info" className="mb-4">
          <div className="d-flex align-items-center">
            <span className="me-2">🚀</span>
            <div>
              <strong>Quick Start:</strong> Install the CLI with <code>npm install -g @agenthub/cli</code> and VS Code extension for the fastest setup experience.
            </div>
          </div>
        </Alert>

        <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'cli')} className="mb-4">
          {/* CLI Integration */}
          <Tab eventKey="cli" title="🖥️ CLI Integration">
            <Card className="border-0 shadow-sm">
              <Card.Body className="p-4">
                <h5 className="mb-3">AgentHub Command Line Interface</h5>
                
                <Alert variant="success" className="mb-4">
                  <strong>Benefits:</strong> Automate deployments, manage agents at scale, integrate with CI/CD pipelines
                </Alert>

                {integrationSteps.cli.map((step, index) => (
                  <Card key={index} className="mb-3 border-light">
                    <Card.Body>
                      <div className="d-flex align-items-start">
                        <Badge bg="primary" className="me-3 mt-1">
                          {index + 1}
                        </Badge>
                        <div className="flex-grow-1">
                          <h6 className="mb-2">{step.title}</h6>
                          <div className="bg-dark text-light p-3 rounded mb-2" style={{ fontFamily: 'monospace' }}>
                            <code>{step.command}</code>
                          </div>
                          <p className="text-muted mb-0">{step.description}</p>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                ))}

                <div className="mt-4">
                  <h6>Additional CLI Commands</h6>
                  <Row>
                    <Col md={6}>
                      <ul className="list-unstyled">
                        <li><code>agenthub list</code> - List all agents</li>
                        <li><code>agenthub status</code> - Check deployment status</li>
                        <li><code>agenthub logs</code> - View execution logs</li>
                      </ul>
                    </Col>
                    <Col md={6}>
                      <ul className="list-unstyled">
                        <li><code>agenthub test</code> - Run agent tests</li>
                        <li><code>agenthub rollback</code> - Rollback deployment</li>
                        <li><code>agenthub help</code> - Show help documentation</li>
                      </ul>
                    </Col>
                  </Row>
                </div>
              </Card.Body>
            </Card>
          </Tab>

          {/* VS Code Extension */}
          <Tab eventKey="vscode" title="🔧 VS Code Extension">
            <Card className="border-0 shadow-sm">
              <Card.Body className="p-4">
                <h5 className="mb-3">AgentHub VS Code Extension</h5>
                
                <Alert variant="info" className="mb-4">
                  <strong>Features:</strong> IntelliSense, debugging, one-click deployment, integrated testing, MCP tool discovery
                </Alert>

                {integrationSteps.vscode.map((step, index) => (
                  <Card key={index} className="mb-3 border-light">
                    <Card.Body>
                      <div className="d-flex align-items-start">
                        <Badge bg="info" className="me-3 mt-1">
                          {index + 1}
                        </Badge>
                        <div className="flex-grow-1">
                          <h6 className="mb-2">{step.title}</h6>
                          <div className="bg-dark text-light p-3 rounded mb-2" style={{ fontFamily: 'monospace' }}>
                            <code>{step.command}</code>
                          </div>
                          <p className="text-muted mb-0">{step.description}</p>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                ))}

                <div className="mt-4">
                  <h6>Extension Features</h6>
                  <Row>
                    <Col md={6}>
                      <ul>
                        <li>Syntax highlighting for agent configs</li>
                        <li>Auto-completion for MCP tools</li>
                        <li>Integrated debugging</li>
                        <li>Real-time error checking</li>
                      </ul>
                    </Col>
                    <Col md={6}>
                      <ul>
                        <li>One-click deployment</li>
                        <li>Execution monitoring</li>
                        <li>Cost estimation</li>
                        <li>Template gallery</li>
                      </ul>
                    </Col>
                  </Row>
                </div>
              </Card.Body>
            </Card>
          </Tab>

          {/* API Integration */}
          <Tab eventKey="api" title="🔌 API Integration">
            <Card className="border-0 shadow-sm">
              <Card.Body className="p-4">
                <h5 className="mb-3">REST API Integration</h5>
                
                <Alert variant="warning" className="mb-4">
                  <strong>Authentication:</strong> All API requests require a valid Bearer token. Rate limits apply.
                </Alert>

                {integrationSteps.api.map((step, index) => (
                  <Card key={index} className="mb-3 border-light">
                    <Card.Body>
                      <div className="d-flex align-items-start">
                        <Badge bg="success" className="me-3 mt-1">
                          {index + 1}
                        </Badge>
                        <div className="flex-grow-1">
                          <h6 className="mb-2">{step.title}</h6>
                          <div className="bg-dark text-light p-3 rounded mb-2" style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                            <code>{step.command}</code>
                          </div>
                          <p className="text-muted mb-0">{step.description}</p>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                ))}

                <div className="mt-4">
                  <h6>API Endpoints</h6>
                  <Table responsive>
                    <thead>
                      <tr>
                        <th>Method</th>
                        <th>Endpoint</th>
                        <th>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><Badge bg="primary">GET</Badge></td>
                        <td>/v1/agents</td>
                        <td>List all agents</td>
                      </tr>
                      <tr>
                        <td><Badge bg="success">POST</Badge></td>
                        <td>/v1/agents</td>
                        <td>Create new agent</td>
                      </tr>
                      <tr>
                        <td><Badge bg="warning">PUT</Badge></td>
                        <td>/v1/agents/{id}</td>
                        <td>Update agent</td>
                      </tr>
                      <tr>
                        <td><Badge bg="danger">DELETE</Badge></td>
                        <td>/v1/agents/{id}</td>
                        <td>Delete agent</td>
                      </tr>
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          </Tab>

          {/* MCP Integration */}
          <Tab eventKey="mcp" title="🔗 MCP Servers">
            <Card className="border-0 shadow-sm">
              <Card.Body className="p-4">
                <h5 className="mb-3">Model Context Protocol (MCP) Servers</h5>
                
                <Alert variant="success" className="mb-4">
                  <strong>MCP Integration:</strong> Connect to external services and tools through standardized MCP servers
                </Alert>

                <Row>
                  {mcpServers.map((server, index) => (
                    <Col md={6} key={index} className="mb-4">
                      <Card className="h-100 border-light">
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <h6 className="mb-0">{server.name}</h6>
                            <Badge bg={server.status === 'active' ? 'success' : 'warning'}>
                              {server.status}
                            </Badge>
                          </div>
                          
                          <p className="text-muted small mb-3">{server.description}</p>
                          
                          <div className="mb-3">
                            <small className="text-muted d-block mb-1">Available Tools:</small>
                            <div className="d-flex flex-wrap gap-1">
                              {server.tools.map((tool, toolIndex) => (
                                <Badge key={toolIndex} bg="outline-primary" className="small">
                                  {tool}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          
                          <div className="bg-light p-2 rounded" style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                            {server.endpoint}
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>

                <div className="mt-4">
                  <h6>MCP Configuration Example</h6>
                  <div className="bg-dark text-light p-3 rounded" style={{ fontFamily: 'monospace' }}>
                    <pre>{`{
  "mcpServers": {
    "office365": {
      "command": "npx",
      "args": ["@agenthub/mcp-office365"],
      "env": {
        "OFFICE365_CLIENT_ID": "your-client-id",
        "OFFICE365_CLIENT_SECRET": "your-client-secret"
      }
    }
  }
}`}</pre>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Tab>
        </Tabs>

        {/* Quick Actions */}
        <Row className="mt-4">
          <Col>
            <Card className="border-0 shadow-sm">
              <Card.Body className="text-center p-4">
                <h5 className="mb-3">🚀 Get Started Now</h5>
                <div className="d-flex justify-content-center gap-3 flex-wrap">
                  <Button variant="primary" size="lg">
                    📥 Download CLI
                  </Button>
                  <Button variant="info" size="lg">
                    🔧 Install VS Code Extension
                  </Button>
                  <Button variant="success" size="lg">
                    📖 View API Docs
                  </Button>
                  <Button variant="outline-secondary" size="lg">
                    💬 Join Community
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

export default IntegrationGuide;