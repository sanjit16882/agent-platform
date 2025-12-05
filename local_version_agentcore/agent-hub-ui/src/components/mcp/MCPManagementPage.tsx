import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Form, Badge, Tabs, Tab, Modal, ListGroup, Spinner } from 'react-bootstrap';
import { realMCPService } from '../../services/realMCPService';
import { RealMCPServerStatus } from './RealMCPServerStatus';
import { mcpConfigService } from '../../services/mcpConfigService';

interface MCPServerConfig {
  id: string;
  name: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
  disabled?: boolean;
  autoApprove?: string[];
  timeout?: number;
  retryAttempts?: number;
}

interface AgentMCPConfig {
  execution_engine: string;
  logging: {
    console: boolean;
    level: string;
  };
  mcp: {
    servers: Record<string, MCPServerConfig>;
  };
  model_providers: Record<string, any>;
}

interface MCPSecrets {
  [provider: string]: {
    api_key?: string;
    [key: string]: any;
  };
}

export const MCPManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddServerModal, setShowAddServerModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [servers, setServers] = useState<Array<any>>([]);
  const [loading, setLoading] = useState(true);
  
  // New server form state
  const [newServer, setNewServer] = useState<Partial<MCPServerConfig>>({
    id: '',
    name: '',
    command: 'uvx',
    args: [],
    disabled: false,
    autoApprove: [],
    timeout: 30000,
    retryAttempts: 3
  });

  // AWS Bedrock models state
  const [bedrockModels, setBedrockModels] = useState<Array<any>>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [loadingModels, setLoadingModels] = useState(false);

  // Agent configuration state
  const [agentConfig, setAgentConfig] = useState<AgentMCPConfig>({
    execution_engine: 'asyncio',
    logging: {
      console: true,
      level: 'INFO'
    },
    mcp: {
      servers: {}
    },
    model_providers: {
      openai: {
        default_model: 'gpt-4'
      }
    }
  });

  // Secrets state
  const [secrets, setSecrets] = useState<MCPSecrets>({
    openai: {
      api_key: ''
    }
  });

  useEffect(() => {
    loadServers();
    loadBedrockModels();
  }, []);

  const loadBedrockModels = async () => {
    try {
      setLoadingModels(true);
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:4002'}/api/v1/bedrock/models`);
      const data = await response.json();
      
      if (data.success && data.models) {
        setBedrockModels(data.models);
      }
    } catch (error) {
      console.error('Failed to load Bedrock models:', error);
    } finally {
      setLoadingModels(false);
    }
  };

  const loadServers = async () => {
    try {
      setLoading(true);
      const serverList = await realMCPService.getRealDockerServers();
      setServers(serverList);
    } catch (error) {
      console.error('Failed to load servers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddServer = () => {
    if (!newServer.id || !newServer.name || !newServer.command) {
      alert('Please fill in all required fields');
      return;
    }

    if (!selectedModel) {
      alert('Please select an AWS Bedrock model');
      return;
    }

    // Find the selected model details
    const modelDetails = bedrockModels.find(m => m.modelId === selectedModel);
    if (!modelDetails) {
      alert('Invalid model selection');
      return;
    }

    // Add server to agent config (for YAML export)
    const serverConfig: MCPServerConfig = {
      id: newServer.id,
      name: newServer.name,
      command: newServer.command,
      args: newServer.args || [],
      env: newServer.env,
      disabled: newServer.disabled,
      autoApprove: newServer.autoApprove,
      timeout: newServer.timeout,
      retryAttempts: newServer.retryAttempts
    };

    setAgentConfig(prev => ({
      ...prev,
      mcp: {
        servers: {
          ...prev.mcp.servers,
          [serverConfig.id]: serverConfig
        }
      }
    }));

    // Save to mcpConfigService with model association
    const fullServerConfig: any = {
      id: serverConfig.id,
      name: serverConfig.name,
      description: `MCP Server: ${serverConfig.name}`,
      command: serverConfig.command,
      args: serverConfig.args || [],
      env: serverConfig.env,
      modelProvider: 'aws-bedrock' as const,
      modelId: selectedModel,
      modelName: modelDetails.modelName,
      executionEngine: agentConfig.execution_engine as 'asyncio' | 'threading' | 'multiprocessing',
      logging: {
        console: agentConfig.logging.console,
        level: agentConfig.logging.level as 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR'
      },
      timeout: serverConfig.timeout || 30000,
      retryAttempts: serverConfig.retryAttempts || 3,
      disabled: serverConfig.disabled || false,
      autoApprove: serverConfig.autoApprove || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    console.log('💾 Saving MCP Server Config:', fullServerConfig);
    mcpConfigService.saveServerConfig(fullServerConfig);
    
    // Verify it was saved
    const savedServers = mcpConfigService.getConfiguredServers();
    console.log('✅ Saved! Total servers now:', savedServers.length);
    console.log('✅ Servers:', savedServers);

    // Reset form and close modal
    setNewServer({
      id: '',
      name: '',
      command: 'uvx',
      args: [],
      disabled: false,
      autoApprove: [],
      timeout: 30000,
      retryAttempts: 3
    });
    setSelectedModel('');
    setShowAddServerModal(false);
    
    // Show success message
    alert(`MCP Server "${serverConfig.name}" configured successfully with ${modelDetails.modelName}!`);
  };

  const exportConfig = () => {
    const configYaml = `# mcp_agent.config.yaml
execution_engine: ${agentConfig.execution_engine}

logging:
  console: ${agentConfig.logging.console}
  level: ${agentConfig.logging.level}

mcp:
  servers:
${Object.entries(agentConfig.mcp.servers).map(([id, server]) => `    ${id}:
      command: "${server.command}"
      args: ${JSON.stringify(server.args)}
      ${server.env ? `env: ${JSON.stringify(server.env)}` : ''}
      ${server.disabled ? `disabled: ${server.disabled}` : ''}
      ${server.autoApprove ? `autoApprove: ${JSON.stringify(server.autoApprove)}` : ''}`).join('\n')}

model_providers:
${Object.entries(agentConfig.model_providers).map(([provider, config]) => `  ${provider}:
    default_model: ${config.default_model}`).join('\n')}
`;

    const secretsYaml = `# mcp_agent.secrets.yaml
# ⚠️ DO NOT COMMIT THIS FILE TO VERSION CONTROL
${Object.entries(secrets).map(([provider, creds]) => `${provider}:
  api_key: "${creds.api_key || 'YOUR_API_KEY_HERE'}"`).join('\n')}
`;

    // Download files
    downloadFile('mcp_agent.config.yaml', configYaml);
    downloadFile('mcp_agent.secrets.yaml', secretsYaml);
  };

  const downloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getServerTemplates = (): Array<{
    id: string;
    name: string;
    command: string;
    args: string[];
    description: string;
    env?: Record<string, string>;
  }> => [
    {
      id: 'fetch',
      name: 'Fetch Server',
      command: 'uvx',
      args: ['mcp-server-fetch'],
      description: 'HTTP fetch and web scraping capabilities'
    },
    {
      id: 'filesystem',
      name: 'Filesystem Server',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem', '.'],
      description: 'File system operations (read, write, list)'
    },
    {
      id: 'github',
      name: 'GitHub Server',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-github'],
      description: 'GitHub API integration',
      env: { GITHUB_PERSONAL_ACCESS_TOKEN: '' }
    },
    {
      id: 'postgres',
      name: 'PostgreSQL Server',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-postgres'],
      description: 'PostgreSQL database operations',
      env: { POSTGRES_CONNECTION_STRING: '' }
    },
    {
      id: 'slack',
      name: 'Slack Server',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-slack'],
      description: 'Slack messaging integration',
      env: { SLACK_BOT_TOKEN: '' }
    }
  ];

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <h2>🔌 MCP Server Management</h2>
          <p className="text-muted">
            Configure and manage Model Context Protocol servers for the AgentHub platform
          </p>
        </Col>
        <Col xs="auto">
          <Button variant="primary" onClick={() => setShowAddServerModal(true)} className="me-2">
            ➕ Add MCP Server
          </Button>
          <Button variant="success" onClick={exportConfig}>
            📥 Export Configuration
          </Button>
        </Col>
      </Row>

      <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'overview')} className="mb-4">
        <Tab eventKey="overview" title="📊 Overview">
          <Row>
            <Col md={12} className="mb-4">
              <RealMCPServerStatus />
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">🎯 Quick Start</h5>
                </Card.Header>
                <Card.Body>
                  <h6>Configure MCP Server with Agent</h6>
                  <p className="text-muted small">
                    To integrate an MCP server with your agent, you need two configuration files:
                  </p>
                  
                  <ListGroup variant="flush">
                    <ListGroup.Item>
                      <strong>1. mcp_agent.config.yaml</strong>
                      <p className="small text-muted mb-0">
                        Main configuration: execution engine, logging, server definitions, model providers
                      </p>
                    </ListGroup.Item>
                    <ListGroup.Item>
                      <strong>2. mcp_agent.secrets.yaml</strong>
                      <p className="small text-muted mb-0">
                        Sensitive credentials: API keys, tokens (should be gitignored)
                      </p>
                    </ListGroup.Item>
                  </ListGroup>

                  <Alert variant="info" className="mt-3 mb-0">
                    <small>
                      <strong>💡 Tip:</strong> Use the "Add MCP Server" button to configure servers, 
                      then export the configuration files for your agent.
                    </small>
                  </Alert>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6}>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">📋 Configured Servers</h5>
                </Card.Header>
                <Card.Body>
                  {(() => {
                    const configuredServers = mcpConfigService.getConfiguredServers();
                    return configuredServers.length === 0 ? (
                      <p className="text-muted text-center py-4">
                        No servers configured yet. Click "Add MCP Server" to get started.
                      </p>
                    ) : (
                      <ListGroup variant="flush">
                        {configuredServers.map((server) => (
                          <ListGroup.Item key={server.id} className="d-flex justify-content-between align-items-start">
                            <div className="flex-grow-1">
                              <div className="d-flex justify-content-between align-items-center mb-1">
                                <strong>{server.name}</strong>
                                <Badge bg={server.disabled ? 'secondary' : 'success'}>
                                  {server.disabled ? 'Disabled' : 'Active'}
                                </Badge>
                              </div>
                              <small className="text-muted d-block">
                                {server.command} {server.args.join(' ')}
                              </small>
                              <small className="text-primary d-block mt-1">
                                <strong>Model:</strong> {server.modelName}
                              </small>
                            </div>
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    );
                  })()}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>

        <Tab eventKey="servers" title="🖥️ MCP Servers">
          <Row>
            <Col>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">Available MCP Servers</h5>
                </Card.Header>
                <Card.Body>
                  {loading ? (
                    <div className="text-center py-4">
                      <Spinner animation="border" />
                      <p className="mt-2">Loading servers...</p>
                    </div>
                  ) : (
                    <Row>
                      {servers.map(server => (
                        <Col md={6} lg={4} key={server.id} className="mb-3">
                          <Card className="h-100">
                            <Card.Body>
                              <div className="d-flex justify-content-between align-items-start mb-2">
                                <h6>{server.name}</h6>
                                <Badge bg={server.status === 'active' ? 'success' : 'secondary'}>
                                  {server.status}
                                </Badge>
                              </div>
                              <p className="small text-muted">{server.description}</p>
                              <div className="mb-2">
                                <strong className="small">Tools:</strong>
                                <div className="d-flex flex-wrap gap-1 mt-1">
                                  {server.tools.slice(0, 3).map((tool: string) => (
                                    <Badge key={tool} bg="light" text="dark" className="small">
                                      {tool}
                                    </Badge>
                                  ))}
                                  {server.tools.length > 3 && (
                                    <Badge bg="light" text="dark" className="small">
                                      +{server.tools.length - 3}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </Card.Body>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>

        <Tab eventKey="configuration" title="⚙️ Configuration">
          <Row>
            <Col md={6}>
              <Card className="mb-4">
                <Card.Header>
                  <h5 className="mb-0">🔧 Agent Configuration</h5>
                </Card.Header>
                <Card.Body>
                  <Form>
                    <Form.Group className="mb-3">
                      <Form.Label>Execution Engine</Form.Label>
                      <Form.Select
                        value={agentConfig.execution_engine}
                        onChange={(e) => setAgentConfig(prev => ({
                          ...prev,
                          execution_engine: e.target.value
                        }))}
                      >
                        <option value="asyncio">asyncio</option>
                        <option value="threading">threading</option>
                        <option value="multiprocessing">multiprocessing</option>
                      </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Log Level</Form.Label>
                      <Form.Select
                        value={agentConfig.logging.level}
                        onChange={(e) => setAgentConfig(prev => ({
                          ...prev,
                          logging: { ...prev.logging, level: e.target.value }
                        }))}
                      >
                        <option value="DEBUG">DEBUG</option>
                        <option value="INFO">INFO</option>
                        <option value="WARNING">WARNING</option>
                        <option value="ERROR">ERROR</option>
                      </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Check
                        type="checkbox"
                        label="Console Logging"
                        checked={agentConfig.logging.console}
                        onChange={(e) => setAgentConfig(prev => ({
                          ...prev,
                          logging: { ...prev.logging, console: e.target.checked }
                        }))}
                      />
                    </Form.Group>
                  </Form>
                </Card.Body>
              </Card>

              <Card>
                <Card.Header>
                  <h5 className="mb-0">🤖 Model Providers</h5>
                </Card.Header>
                <Card.Body>
                  <Form>
                    <Form.Group className="mb-3">
                      <Form.Label>OpenAI Default Model</Form.Label>
                      <Form.Select
                        value={agentConfig.model_providers.openai?.default_model || 'gpt-4'}
                        onChange={(e) => setAgentConfig(prev => ({
                          ...prev,
                          model_providers: {
                            ...prev.model_providers,
                            openai: { default_model: e.target.value }
                          }
                        }))}
                      >
                        <option value="gpt-4">GPT-4</option>
                        <option value="gpt-4-turbo">GPT-4 Turbo</option>
                        <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                      </Form.Select>
                    </Form.Group>

                    <Button variant="outline-primary" size="sm" className="w-100">
                      ➕ Add Provider (Anthropic, Azure, etc.)
                    </Button>
                  </Form>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6}>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">🔐 Secrets Management</h5>
                </Card.Header>
                <Card.Body>
                  <Alert variant="warning">
                    <strong>⚠️ Security Notice:</strong> These credentials should be stored securely 
                    and never committed to version control.
                  </Alert>

                  <Form>
                    <Form.Group className="mb-3">
                      <Form.Label>OpenAI API Key</Form.Label>
                      <Form.Control
                        type="password"
                        placeholder="sk-..."
                        value={secrets.openai?.api_key || ''}
                        onChange={(e) => setSecrets(prev => ({
                          ...prev,
                          openai: { ...prev.openai, api_key: e.target.value }
                        }))}
                      />
                      <Form.Text className="text-muted">
                        Required for OpenAI model access
                      </Form.Text>
                    </Form.Group>

                    <Button variant="outline-primary" size="sm" className="w-100">
                      ➕ Add Secret (GitHub Token, DB Password, etc.)
                    </Button>
                  </Form>

                  <Alert variant="info" className="mt-3 mb-0">
                    <small>
                      <strong>💡 Best Practice:</strong> Use environment variables or a secrets 
                      manager (AWS Secrets Manager, Azure Key Vault) in production.
                    </small>
                  </Alert>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>

        <Tab eventKey="templates" title="📦 Server Templates">
          <Row>
            <Col>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">Pre-configured MCP Server Templates</h5>
                </Card.Header>
                <Card.Body>
                  <p className="text-muted">
                    Quick-start templates for popular MCP servers. Click to add to your configuration.
                  </p>
                  <Row>
                    {getServerTemplates().map(template => (
                      <Col md={6} lg={4} key={template.id} className="mb-3">
                        <Card className="h-100 border-primary">
                          <Card.Body>
                            <h6>{template.name}</h6>
                            <p className="small text-muted">{template.description}</p>
                            <div className="mb-2">
                              <code className="small">
                                {template.command} {template.args.join(' ')}
                              </code>
                            </div>
                            <Button
                              variant="primary"
                              size="sm"
                              className="w-100"
                              onClick={() => {
                                setNewServer({
                                  id: template.id,
                                  name: template.name,
                                  command: template.command,
                                  args: template.args,
                                  env: template.env,
                                  disabled: false,
                                  autoApprove: [],
                                  timeout: 30000,
                                  retryAttempts: 3
                                });
                                setShowAddServerModal(true);
                              }}
                            >
                              Use Template
                            </Button>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>

        <Tab eventKey="documentation" title="📚 Documentation">
          <Row>
            <Col md={8}>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">MCP Server Setup Guide</h5>
                </Card.Header>
                <Card.Body>
                  <h6>🛠️ 1. Configuration Files</h6>
                  <p>Two key files are required:</p>
                  
                  <h6 className="mt-3">a. mcp_agent.config.yaml</h6>
                  <pre className="bg-light p-3 rounded">
{`execution_engine: asyncio

logging:
  console: true
  level: INFO

mcp:
  servers:
    fetch:
      command: "uvx"
      args: ["mcp-server-fetch"]
    filesystem:
      command: "npx"
      args: ["-y", "@modelcontextprotocol/server-filesystem", "."]

model_providers:
  openai:
    default_model: gpt-4`}
                  </pre>

                  <h6 className="mt-3">b. mcp_agent.secrets.yaml</h6>
                  <pre className="bg-light p-3 rounded">
{`# ⚠️ DO NOT COMMIT TO VERSION CONTROL
openai:
  api_key: "your-openai-key"`}
                  </pre>

                  <h6 className="mt-4">🧠 2. MCP Server Setup</h6>
                  <p>MCP servers are modular services that agents call to perform tasks:</p>
                  <ul>
                    <li>Run as independent processes (local or remote)</li>
                    <li>Expose tools via the Model Context Protocol</li>
                    <li>Can be built using Node.js, Python, or other runtimes</li>
                  </ul>

                  <h6 className="mt-4">🔌 3. Agent Integration</h6>
                  <p>Once the server is running:</p>
                  <ul>
                    <li>The agent invokes tools via the MCP protocol</li>
                    <li>Test with the MCP Inspector or CLI tools</li>
                    <li>Deploy locally or in cloud environments</li>
                  </ul>

                  <h6 className="mt-4">✅ 4. Optional Enhancements</h6>
                  <ul>
                    <li>Use Claude, GPT-4, Gemini, or Llama 3 as reasoning engines</li>
                    <li>Add custom tools for domain-specific tasks</li>
                    <li>Deploy servers with Docker or serverless platforms</li>
                  </ul>
                </Card.Body>
              </Card>
            </Col>

            <Col md={4}>
              <Card className="mb-3">
                <Card.Header>
                  <h6 className="mb-0">🔗 Useful Links</h6>
                </Card.Header>
                <Card.Body>
                  <ListGroup variant="flush">
                    <ListGroup.Item action href="https://modelcontextprotocol.io" target="_blank">
                      MCP Official Documentation
                    </ListGroup.Item>
                    <ListGroup.Item action href="https://github.com/modelcontextprotocol" target="_blank">
                      MCP GitHub Repository
                    </ListGroup.Item>
                    <ListGroup.Item action href="/real-mcp-dashboard">
                      Test MCP Servers
                    </ListGroup.Item>
                  </ListGroup>
                </Card.Body>
              </Card>

              <Card>
                <Card.Header>
                  <h6 className="mb-0">💡 Quick Tips</h6>
                </Card.Header>
                <Card.Body>
                  <ul className="small mb-0">
                    <li>Start with pre-configured templates</li>
                    <li>Test servers before production use</li>
                    <li>Use environment variables for secrets</li>
                    <li>Monitor server health regularly</li>
                    <li>Keep servers updated</li>
                  </ul>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>
      </Tabs>

      {/* Add Server Modal */}
      <Modal show={showAddServerModal} onHide={() => setShowAddServerModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>➕ Add MCP Server</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Server ID *</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g., fetch, filesystem"
                    value={newServer.id}
                    onChange={(e) => setNewServer(prev => ({ ...prev, id: e.target.value }))}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Server Name *</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g., Fetch Server"
                    value={newServer.name}
                    onChange={(e) => setNewServer(prev => ({ ...prev, name: e.target.value }))}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Command *</Form.Label>
                  <Form.Select
                    value={newServer.command}
                    onChange={(e) => setNewServer(prev => ({ ...prev, command: e.target.value }))}
                  >
                    <option value="uvx">uvx (Python)</option>
                    <option value="npx">npx (Node.js)</option>
                    <option value="docker">docker</option>
                    <option value="python">python</option>
                    <option value="node">node</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Arguments</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g., mcp-server-fetch"
                    value={newServer.args?.join(' ') || ''}
                    onChange={(e) => setNewServer(prev => ({ 
                      ...prev, 
                      args: e.target.value.split(' ').filter(a => a) 
                    }))}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>AWS Bedrock Model *</Form.Label>
                  {loadingModels ? (
                    <div className="text-center py-2">
                      <Spinner animation="border" size="sm" /> Loading models...
                    </div>
                  ) : (
                    <>
                      <Form.Select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        required
                      >
                        <option value="">Select a model...</option>
                        {bedrockModels.map((model) => (
                          <option key={model.modelId} value={model.modelId}>
                            {model.modelName} - {model.provider} ({model.description})
                          </option>
                        ))}
                      </Form.Select>
                      <Form.Text className="text-muted">
                        This model will be used when agents select this MCP server
                      </Form.Text>
                    </>
                  )}
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Timeout (ms)</Form.Label>
                  <Form.Control
                    type="number"
                    value={newServer.timeout}
                    onChange={(e) => setNewServer(prev => ({ 
                      ...prev, 
                      timeout: parseInt(e.target.value) 
                    }))}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Retry Attempts</Form.Label>
                  <Form.Control
                    type="number"
                    value={newServer.retryAttempts}
                    onChange={(e) => setNewServer(prev => ({ 
                      ...prev, 
                      retryAttempts: parseInt(e.target.value) 
                    }))}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Disabled (server won't start automatically)"
                checked={newServer.disabled}
                onChange={(e) => setNewServer(prev => ({ ...prev, disabled: e.target.checked }))}
              />
            </Form.Group>

            <Alert variant="info">
              <small>
                <strong>💡 Tip:</strong> After adding the server, export the configuration 
                files and place them in your agent's directory.
              </small>
            </Alert>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddServerModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAddServer}>
            Add Server
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};
