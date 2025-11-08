/**
 * Enhanced MCP Test Page
 * Located under Developer Tools for testing MCP server integrations
 * Features:
 * - Real MCP server selection
 * - Interactive testing interface
 * - Flow visualization
 * - Server status monitoring
 */

import React, { useState, useEffect } from 'react';
import { Card, Button, Form, Alert, Badge, Spinner, Row, Col, Table, Tabs, Tab } from 'react-bootstrap';
import { API_CONFIG } from '../config/api';

interface MCPServer {
  id: string;
  name: string;
  type: string;
  status: 'running' | 'stopped' | 'error';
  tools: string[];
  description: string;
}

interface MCPStep {
  step: number;
  name: string;
  description: string;
  data: any;
}

interface MCPDemoResult {
  title: string;
  description: string;
  input: string;
  steps: MCPStep[];
  summary: string;
}

interface MCPExecutionResult {
  success: boolean;
  response: string;
  toolsUsed: string[];
  processingTime: number;
  serverUsed: string;
}

const MCPTestPage: React.FC = () => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedServer, setSelectedServer] = useState<string>('');
  const [availableServers, setAvailableServers] = useState<MCPServer[]>([]);
  const [mcpStatus, setMcpStatus] = useState<any>(null);
  const [demoResult, setDemoResult] = useState<MCPDemoResult | null>(null);
  const [executionResult, setExecutionResult] = useState<MCPExecutionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('test');

  const exampleInputs = [
    { text: 'List files in the current directory', server: 'filesystem' },
    { text: 'Show me the git commit history', server: 'git' },
    { text: 'Read the README.md file', server: 'filesystem' },
    { text: 'Search for JavaScript files', server: 'filesystem' },
    { text: 'Get database schema information', server: 'database' },
    { text: 'Show git status', server: 'git' },
    { text: 'List all database tables', server: 'database' }
  ];

  useEffect(() => {
    loadMCPServers();
    checkMCPStatus();
  }, []);

  const loadMCPServers = async () => {
    try {
      const baseUrl = API_CONFIG.BACKEND_URL;
      const response = await fetch(`${baseUrl}/api/mcp/real/servers`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAvailableServers(data.servers || getMockServers());
        } else {
          setAvailableServers(getMockServers());
        }
      } else {
        setAvailableServers(getMockServers());
      }
    } catch (error) {
      console.error('Failed to load MCP servers:', error);
      setAvailableServers(getMockServers());
    }
  };

  const getMockServers = (): MCPServer[] => [
    {
      id: 'filesystem',
      name: 'Filesystem Server',
      type: 'filesystem',
      status: 'running',
      tools: ['read_file', 'write_file', 'list_directory', 'search_files', 'get_file_info'],
      description: 'Access and manipulate files and directories'
    },
    {
      id: 'git',
      name: 'Git Server',
      type: 'git',
      status: 'running',
      tools: ['git_status', 'git_log', 'git_diff', 'git_branches', 'get_repositories'],
      description: 'Git repository operations and version control'
    },
    {
      id: 'database',
      name: 'Database Server',
      type: 'database',
      status: 'running',
      tools: ['execute_query', 'get_schema', 'list_tables', 'get_table_info'],
      description: 'Database queries and schema inspection'
    },
    {
      id: 'jira',
      name: 'Jira Server',
      type: 'jira',
      status: 'running',
      tools: ['create_issue', 'get_issues', 'update_issue', 'get_projects', 'assign_issue'],
      description: 'Jira project management and issue tracking'
    }
  ];

  const checkMCPStatus = async () => {
    try {
      const baseUrl = API_CONFIG.BACKEND_URL;
      const response = await fetch(`${baseUrl}/api/mcp/real/status`);
      const data = await response.json();
      
      if (data.success) {
        setMcpStatus(data.data || data);
      }
    } catch (error) {
      console.error('Failed to check MCP status:', error);
    }
  };

  const runMCPDemo = async () => {
    if (!input.trim()) {
      setError('Please enter some input to demonstrate MCP flow');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setDemoResult(null);
      setExecutionResult(null);
      
      const baseUrl = API_CONFIG.BACKEND_URL;
      const response = await fetch(`${baseUrl}/api/mcp/real/demo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          input,
          server: selectedServer || undefined
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setDemoResult(data.data);
        setActiveTab('flow');
      } else {
        setError(data.error || 'Demo failed');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Demo failed');
    } finally {
      setLoading(false);
    }
  };

  const executeRealMCP = async () => {
    if (!input.trim()) {
      setError('Please enter some input to execute with MCP');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setDemoResult(null);
      setExecutionResult(null);
      
      const baseUrl = API_CONFIG.BACKEND_URL;
      const response = await fetch(`${baseUrl}/api/mcp/real/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          input,
          server: selectedServer || undefined,
          agentId: 'mcp-test-agent'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setExecutionResult({
          success: true,
          response: data.data.response || data.response,
          toolsUsed: data.data.metadata?.mcpToolsUsed || [],
          processingTime: data.data.processingTime || 0,
          serverUsed: selectedServer || 'auto'
        });
        setActiveTab('results');
      } else {
        setError(data.error || 'Execution failed');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Execution failed');
    } finally {
      setLoading(false);
    }
  };

  const getStepIcon = (stepName: string) => {
    switch (stepName) {
      case 'User Input': return '👤';
      case 'AI Model Analysis': return '🧠';
      case 'Tool Request Generation': return '⚙️';
      case 'MCP Client Processing': return '🔄';
      case 'MCP Server Execution': return '🖥️';
      case 'Result Return to Client': return '📤';
      case 'Client Sends Results to Model': return '📥';
      case 'Model Uses Context to Respond': return '💬';
      default: return '🔹';
    }
  };

  const getServerBadgeColor = (status: string) => {
    switch (status) {
      case 'running': return 'success';
      case 'stopped': return 'secondary';
      case 'error': return 'danger';
      default: return 'warning';
    }
  };

  return (
    <div className="container-fluid py-4">
      <div className="row mb-4">
        <div className="col-12">
          <h2>🔌 MCP Test & Integration</h2>
          <p className="text-muted">
            Test Model Context Protocol (MCP) server integrations and explore available tools
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Row>
        {/* Left Column - Server Selection & Input */}
        <Col lg={4}>
          <Card className="mb-4">
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">🖥️ MCP Servers</h5>
            </Card.Header>
            <Card.Body>
              {/* MCP Status */}
              <div className="mb-3">
                <small className="text-muted d-block mb-2">System Status:</small>
                {mcpStatus ? (
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <Badge bg={mcpStatus.initialized ? 'success' : 'warning'}>
                      {mcpStatus.initialized ? 'Initialized' : 'Not Initialized'}
                    </Badge>
                    <Badge bg="info">
                      {mcpStatus.connectedServers?.length || availableServers.length} Servers
                    </Badge>
                    <Badge bg="secondary">
                      {mcpStatus.availableTools || 0} Tools
                    </Badge>
                  </div>
                ) : (
                  <Spinner animation="border" size="sm" />
                )}
              </div>

              {/* Server Selection */}
              <Form.Group className="mb-3">
                <Form.Label>Select MCP Server (Optional)</Form.Label>
                <Form.Select
                  value={selectedServer}
                  onChange={(e) => setSelectedServer(e.target.value)}
                >
                  <option value="">Auto-detect (Recommended)</option>
                  {availableServers.map((server) => (
                    <option key={server.id} value={server.id}>
                      {server.name} ({server.tools.length} tools)
                    </option>
                  ))}
                </Form.Select>
                <Form.Text className="text-muted">
                  Leave as "Auto-detect" to let AI choose the best server
                </Form.Text>
              </Form.Group>

              {/* Server Details */}
              {selectedServer && (
                <div className="bg-light p-3 rounded">
                  {availableServers
                    .filter((s) => s.id === selectedServer)
                    .map((server) => (
                      <div key={server.id}>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <strong>{server.name}</strong>
                          <Badge bg={getServerBadgeColor(server.status)}>
                            {server.status}
                          </Badge>
                        </div>
                        <p className="small text-muted mb-2">{server.description}</p>
                        <small className="text-muted">
                          <strong>Available Tools:</strong>
                          <div className="mt-1">
                            {server.tools.map((tool) => (
                              <Badge key={tool} bg="secondary" className="me-1 mb-1">
                                {tool}
                              </Badge>
                            ))}
                          </div>
                        </small>
                      </div>
                    ))}
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Available Servers List */}
          <Card>
            <Card.Header>
              <h6 className="mb-0">Available Servers</h6>
            </Card.Header>
            <Card.Body className="p-0">
              <Table size="sm" className="mb-0">
                <tbody>
                  {availableServers.map((server) => (
                    <tr key={server.id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <Badge bg={getServerBadgeColor(server.status)} className="me-2">
                            ●
                          </Badge>
                          <div>
                            <div className="fw-bold">{server.name}</div>
                            <small className="text-muted">{server.tools.length} tools</small>
                          </div>
                        </div>
                      </td>
                      <td className="text-end">
                        <Button
                          size="sm"
                          variant="outline-primary"
                          onClick={() => setSelectedServer(server.id)}
                        >
                          Select
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        {/* Right Column - Testing Interface */}
        <Col lg={8}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">🧪 Test Interface</h5>
            </Card.Header>
            <Card.Body>
              <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'test')} className="mb-3">
                <Tab eventKey="test" title="Test">
                  {/* Input Section */}
                  <Form.Group className="mb-3">
                    <Form.Label>Enter your request:</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={4}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="e.g., List files in the current directory, Show git history, Read README.md..."
                    />
                  </Form.Group>

                  {/* Quick Examples */}
                  <div className="mb-4">
                    <small className="text-muted d-block mb-2">Quick examples:</small>
                    <div className="d-flex flex-wrap gap-2">
                      {exampleInputs.map((example, index) => (
                        <Button
                          key={index}
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => {
                            setInput(example.text);
                            setSelectedServer(example.server);
                          }}
                        >
                          {example.text}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="d-flex gap-2">
                    <Button
                      variant="primary"
                      onClick={runMCPDemo}
                      disabled={loading || !input.trim()}
                    >
                      {loading ? <Spinner animation="border" size="sm" className="me-2" /> : null}
                      Show MCP Flow
                    </Button>
                    <Button
                      variant="success"
                      onClick={executeRealMCP}
                      disabled={loading || !input.trim()}
                    >
                      Execute Real MCP
                    </Button>
                    <Button
                      variant="outline-secondary"
                      onClick={() => {
                        setInput('');
                        setDemoResult(null);
                        setExecutionResult(null);
                        setError(null);
                      }}
                    >
                      Clear
                    </Button>
                  </div>
                </Tab>

                <Tab eventKey="flow" title="MCP Flow">
                  {demoResult ? (
                    <div>
                      <Alert variant="info">
                        <strong>{demoResult.title}</strong><br />
                        {demoResult.description}
                      </Alert>

                      <Row>
                        {demoResult.steps.map((step) => (
                          <Col key={step.step} md={6} lg={4} className="mb-3">
                            <Card className="h-100">
                              <Card.Header className="d-flex align-items-center">
                                <span className="me-2" style={{ fontSize: '1.2em' }}>
                                  {getStepIcon(step.name)}
                                </span>
                                <div>
                                  <Badge bg="primary" className="me-2">Step {step.step}</Badge>
                                  <strong className="small">{step.name}</strong>
                                </div>
                              </Card.Header>
                              <Card.Body>
                                <p className="small text-muted mb-2">{step.description}</p>
                                <div className="bg-light p-2 rounded">
                                  <pre className="mb-0" style={{ fontSize: '0.7em', whiteSpace: 'pre-wrap' }}>
                                    {JSON.stringify(step.data, null, 2)}
                                  </pre>
                                </div>
                              </Card.Body>
                            </Card>
                          </Col>
                        ))}
                      </Row>

                      <Alert variant="success" className="mt-3">
                        <strong>Summary:</strong> {demoResult.summary}
                      </Alert>
                    </div>
                  ) : (
                    <Alert variant="info">
                      Click "Show MCP Flow" to visualize the MCP execution flow
                    </Alert>
                  )}
                </Tab>

                <Tab eventKey="results" title="Execution Results">
                  {executionResult ? (
                    <div>
                      <Alert variant="success">
                        <h5>✅ Execution Successful</h5>
                        <div className="mt-3">
                          <strong>Response:</strong>
                          <div className="bg-white p-3 rounded mt-2">
                            {executionResult.response}
                          </div>
                        </div>
                      </Alert>

                      <Row>
                        <Col md={6}>
                          <Card>
                            <Card.Header>
                              <strong>Execution Details</strong>
                            </Card.Header>
                            <Card.Body>
                              <Table size="sm" className="mb-0">
                                <tbody>
                                  <tr>
                                    <td><strong>Server Used:</strong></td>
                                    <td>{executionResult.serverUsed}</td>
                                  </tr>
                                  <tr>
                                    <td><strong>Processing Time:</strong></td>
                                    <td>{executionResult.processingTime}ms</td>
                                  </tr>
                                  <tr>
                                    <td><strong>Tools Used:</strong></td>
                                    <td>{executionResult.toolsUsed.length || 'N/A'}</td>
                                  </tr>
                                </tbody>
                              </Table>
                            </Card.Body>
                          </Card>
                        </Col>
                        <Col md={6}>
                          <Card>
                            <Card.Header>
                              <strong>Tools Invoked</strong>
                            </Card.Header>
                            <Card.Body>
                              {executionResult.toolsUsed.length > 0 ? (
                                executionResult.toolsUsed.map((tool, index) => (
                                  <Badge key={index} bg="primary" className="me-1 mb-1">
                                    {tool}
                                  </Badge>
                                ))
                              ) : (
                                <small className="text-muted">No tools were invoked</small>
                              )}
                            </Card.Body>
                          </Card>
                        </Col>
                      </Row>
                    </div>
                  ) : (
                    <Alert variant="info">
                      Click "Execute Real MCP" to see execution results
                    </Alert>
                  )}
                </Tab>

                <Tab eventKey="docs" title="Documentation">
                  <div>
                    <h5>MCP Architecture Overview</h5>
                    <div className="bg-light p-4 rounded mb-4">
                      <div className="text-center mb-3">
                        <code style={{ fontSize: '0.9em', padding: '8px', backgroundColor: '#fff', border: '1px solid #dee2e6', borderRadius: '4px', display: 'inline-block' }}>
                          User Input → AI Model → Tool Request → MCP Client → MCP Server → Execute → Return → Model Response
                        </code>
                      </div>
                    </div>

                    <Row>
                      <Col md={6}>
                        <h6>Key Components:</h6>
                        <ul className="small">
                          <li><strong>AI Model:</strong> Analyzes input and decides when to use external tools</li>
                          <li><strong>MCP Client:</strong> Manages connections to MCP servers and routes requests</li>
                          <li><strong>MCP Server:</strong> Provides specific tools (filesystem, git, database, etc.)</li>
                          <li><strong>Tools:</strong> Execute actual tasks and return structured data</li>
                        </ul>
                      </Col>
                      <Col md={6}>
                        <h6>How It Works:</h6>
                        <ol className="small">
                          <li>User provides natural language input</li>
                          <li>AI model analyzes and determines required tools</li>
                          <li>MCP client routes request to appropriate server</li>
                          <li>Server executes tool and returns results</li>
                          <li>AI model uses results to generate response</li>
                        </ol>
                      </Col>
                    </Row>
                  </div>
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default MCPTestPage;
