import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Form, Alert, Tab, Tabs, Table, ProgressBar, Spinner, ListGroup } from 'react-bootstrap';

interface IntegrationExample {
  id: string;
  name: string;
  type: 'api' | 'sdk' | 'webhook' | 'cicd';
  language: string;
  description: string;
  code: string;
  status: 'active' | 'inactive' | 'pending';
  usage: number;
  lastUsed: string;
}

interface PlatformMetrics {
  totalIntegrations: number;
  activeConnections: number;
  dailyExecutions: number;
  monthlyUsage: number;
}

// GitHub Integration Tab Component
const GitHubIntegrationTab: React.FC = () => {
  const [githubToken, setGithubToken] = useState('');
  const [repoOwner, setRepoOwner] = useState('');
  const [repoName, setRepoName] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<any>(null);
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<any>(null);
  const [availableAgents, setAvailableAgents] = useState<any[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(true);

  // Load available agents from backend
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        console.log('🔍 Fetching agents from API...');
        const response = await fetch('http://localhost:3002/api/v1/agents');
        const data = await response.json();
        
        console.log('📦 Received agents data:', data);
        
        // Filter to only production agents (not templates)
        const productionAgents = data.data
          .filter((agent: any) => agent.type === 'production' && agent.status === 'active')
          .map((agent: any) => ({
            id: agent.id,
            name: agent.name,
            description: agent.description
          }));
        
        console.log('✅ Filtered production agents:', productionAgents);
        setAvailableAgents(productionAgents);
      } catch (error) {
        console.error('❌ Failed to load agents:', error);
        // Fallback to default agents if API fails
        setAvailableAgents([
          { id: 'code-reviewer', name: 'Code Review Agent', description: 'Reviews code quality and best practices' },
          { id: 'security-scanner', name: 'Security Scanner', description: 'Scans for security vulnerabilities' },
          { id: 'api-tester', name: 'API Testing Agent', description: 'Tests API endpoints and responses' }
        ]);
      } finally {
        setLoadingAgents(false);
      }
    };

    fetchAgents();
  }, []);

  // Load saved configuration
  useEffect(() => {
    const saved = localStorage.getItem('github_integration');
    if (saved) {
      const config = JSON.parse(saved);
      setGithubToken(config.token || '');
      setRepoOwner(config.owner || '');
      setRepoName(config.repo || '');
      setIsConnected(config.connected || false);
      setSelectedAgents(config.agents || []);
      if (config.connected) {
        setConnectionStatus({ success: true, repository: { name: `${config.owner}/${config.repo}` } });
      }
    }
  }, []);

  const testConnection = async () => {
    setIsConnecting(true);
    setConnectionStatus(null);

    try {
      const response = await fetch('http://localhost:3002/api/v1/github/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: githubToken, owner: repoOwner, repo: repoName })
      });

      const result = await response.json();
      setConnectionStatus(result);
      
      if (result.success) {
        setIsConnected(true);
        // Save configuration
        localStorage.setItem('github_integration', JSON.stringify({
          token: githubToken,
          owner: repoOwner,
          repo: repoName,
          connected: true
        }));
      }
    } catch (error) {
      setConnectionStatus({ success: false, error: 'Failed to connect' });
    } finally {
      setIsConnecting(false);
    }
  };

  const saveIntegration = async () => {
    setIsSaving(true);
    setSaveStatus(null);

    try {
      const response = await fetch('http://localhost:3002/api/v1/github/save-integration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: githubToken, owner: repoOwner, repo: repoName, agents: selectedAgents })
      });

      const result = await response.json();
      setSaveStatus(result);
      
      if (result.success) {
        // Update localStorage with agents
        localStorage.setItem('github_integration', JSON.stringify({
          token: githubToken,
          owner: repoOwner,
          repo: repoName,
          connected: true,
          agents: selectedAgents
        }));
      }
    } catch (error) {
      setSaveStatus({ success: false, error: 'Failed to save integration' });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleAgent = (agentId: string) => {
    setSelectedAgents(prev => 
      prev.includes(agentId) 
        ? prev.filter(id => id !== agentId)
        : [...prev, agentId]
    );
  };

  const disconnect = () => {
    setIsConnected(false);
    setConnectionStatus(null);
    setSelectedAgents([]);
    setSaveStatus(null);
    localStorage.removeItem('github_integration');
  };

  return (
    <Row>
      <Col md={6}>
        <Card className="mb-3">
          <Card.Header>
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">🐙 GitHub Configuration</h5>
              {isConnected && <Badge bg="success">Connected</Badge>}
            </div>
          </Card.Header>
          <Card.Body>
            {!isConnected ? (
              <>
                <Alert variant="info">
                  <strong>Setup:</strong> Create a GitHub token with <code>repo</code> scope at{' '}
                  <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer">
                    GitHub Settings
                  </a>
                </Alert>

                <Form.Group className="mb-3">
                  <Form.Label>GitHub Token</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="ghp_xxxxxxxxxxxx"
                    value={githubToken}
                    onChange={(e) => setGithubToken(e.target.value)}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Repository Owner</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="your-username"
                    value={repoOwner}
                    onChange={(e) => setRepoOwner(e.target.value)}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Repository Name</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="my-project"
                    value={repoName}
                    onChange={(e) => {
                      // Extract repo name if full URL is pasted
                      let value = e.target.value;
                      if (value.includes('github.com/')) {
                        const parts = value.split('/');
                        value = parts[parts.length - 1];
                      }
                      setRepoName(value);
                    }}
                  />
                  <Form.Text className="text-muted">
                    Just the repo name (e.g., "agent-platform"), not the full URL
                  </Form.Text>
                </Form.Group>

                <Button
                  variant="primary"
                  onClick={testConnection}
                  disabled={!githubToken || !repoOwner || !repoName || isConnecting}
                  className="w-100"
                >
                  {isConnecting ? <><Spinner animation="border" size="sm" className="me-2" />Connecting...</> : 'Connect GitHub'}
                </Button>

                {connectionStatus && !connectionStatus.success && (
                  <Alert variant="danger" className="mt-3 mb-0">
                    <strong>Connection Failed:</strong> {connectionStatus.error}
                  </Alert>
                )}
              </>
            ) : (
              <>
                <Alert variant="success">
                  <strong>✓ Connected to GitHub</strong>
                  <div className="mt-2">
                    <div>Repository: {repoOwner}/{repoName}</div>
                    <div>
                      <a href={`https://github.com/${repoOwner}/${repoName}`} target="_blank" rel="noopener noreferrer">
                        View on GitHub →
                      </a>
                    </div>
                  </div>
                </Alert>

                <Form.Group className="mb-3">
                  <Form.Label>Select Agents for Auto-Issue Creation</Form.Label>
                  {loadingAgents ? (
                    <div className="text-center py-3">
                      <Spinner animation="border" size="sm" className="me-2" />
                      <span className="text-muted">Loading agents...</span>
                    </div>
                  ) : availableAgents.length === 0 ? (
                    <Alert variant="warning">No active agents found. Please create agents first.</Alert>
                  ) : (
                    <>
                      <Form.Select 
                        multiple 
                        htmlSize={5}
                        value={selectedAgents}
                        onChange={(e) => {
                          const options = Array.from(e.target.selectedOptions);
                          setSelectedAgents(options.map(opt => opt.value));
                        }}
                      >
                        {availableAgents.map(agent => (
                          <option key={agent.id} value={agent.id}>
                            {agent.name}
                          </option>
                        ))}
                      </Form.Select>
                      <Form.Text className="text-muted">
                        Hold Ctrl (Cmd on Mac) to select multiple agents. {selectedAgents.length} selected.
                      </Form.Text>
                    </>
                  )}
                </Form.Group>

                {selectedAgents.length > 0 && (
                  <div className="mb-3">
                    <small className="text-muted">Selected agents:</small>
                    <div className="mt-1">
                      {selectedAgents.map(agentId => {
                        const agent = availableAgents.find(a => a.id === agentId);
                        return agent ? (
                          <Badge key={agentId} bg="primary" className="me-1 mb-1">
                            {agent.name}
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}

                <div className="d-grid gap-2 mt-3">
                  <Button 
                    variant="success" 
                    onClick={saveIntegration} 
                    disabled={selectedAgents.length === 0 || isSaving}
                  >
                    {isSaving ? <><Spinner animation="border" size="sm" className="me-2" />Saving...</> : '💾 Save Integration'}
                  </Button>
                  
                  <Button variant="outline-secondary" size="sm" onClick={disconnect}>
                    Disconnect
                  </Button>
                </div>

                {saveStatus && (
                  <Alert variant={saveStatus.success ? 'success' : 'danger'} className="mt-3 mb-0">
                    {saveStatus.success ? (
                      <>
                        <strong>✓ Integration Saved!</strong>
                        <div>{selectedAgents.length} agent(s) configured to create GitHub issues automatically.</div>
                      </>
                    ) : (
                      <><strong>✗ Failed:</strong> {saveStatus.error}</>
                    )}
                  </Alert>
                )}
              </>
            )}
          </Card.Body>
        </Card>

        <Card>
          <Card.Header>
            <h6 className="mb-0">💡 How It Works</h6>
          </Card.Header>
          <Card.Body>
            <ol className="mb-0">
              <li className="mb-2">Connect your GitHub repository</li>
              <li className="mb-2">Select which agents can create issues</li>
              <li className="mb-2">Run agents via UI, CLI, or IDE</li>
              <li>Issues automatically created in GitHub when agents find problems</li>
            </ol>
          </Card.Body>
        </Card>
      </Col>

      <Col md={6}>
        <Card>
          <Card.Header>
            <h5 className="mb-0">📋 Recent GitHub Issues</h5>
          </Card.Header>
          <Card.Body>
            {!isConnected ? (
              <div className="text-center text-muted py-4">
                <div style={{ fontSize: '2rem' }}>🎫</div>
                <p className="mb-0">Connect to GitHub to see issues</p>
              </div>
            ) : (
              <div className="text-center text-muted py-4">
                <div style={{ fontSize: '2rem' }}>✅</div>
                <p className="mb-0">Connected to {repoOwner}/{repoName}</p>
                <small>Run agents to automatically create issues for findings</small>
              </div>
            )}
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

// Slack Integration Tab Component (placeholder)
const SlackIntegrationTab: React.FC = () => {
  return (
    <Row>
      <Col md={12}>
        <Alert variant="info">
          <strong>Slack Integration Coming Soon!</strong> Connect your Slack workspace to receive agent notifications.
        </Alert>
      </Col>
    </Row>
  );
};

// Jira Integration Tab Component (placeholder)
const JiraIntegrationTab: React.FC = () => {
  return (
    <Row>
      <Col md={12}>
        <Alert variant="info">
          <strong>Jira Integration Coming Soon!</strong> Create Jira tickets automatically from agent findings.
        </Alert>
      </Col>
    </Row>
  );
};

// Microsoft Teams Integration Tab Component (placeholder)
const TeamsIntegrationTab: React.FC = () => {
  return (
    <Row>
      <Col md={12}>
        <Alert variant="info">
          <strong>Microsoft Teams Integration Coming Soon!</strong> Get agent updates in your Teams channels.
        </Alert>
      </Col>
    </Row>
  );
};

const PlatformIntegration: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null);

  // Mock data for platform integrations
  const integrationExamples: IntegrationExample[] = [
    {
      id: 'python-sdk',
      name: 'Python Backend Service',
      type: 'sdk',
      language: 'Python',
      description: 'E-commerce API service using Agent Factory for test generation',
      code: `from agent_factory import AgentFactoryClient

async def generate_api_tests():
    client = AgentFactoryClient(
        base_url="https://agent-factory.company.com/api/v1",
        api_key=os.getenv("AGENT_FACTORY_API_KEY")
    )
    
    result = await client.execute_agent('postman-api-tester', {
        'api_spec': './openapi.yaml',
        'test_scenarios': ['happy_path', 'error_handling'],
        'output_format': 'postman_collection'
    })
    
    return result.test_collection`,
      status: 'active',
      usage: 847,
      lastUsed: '2 hours ago'
    },
    {
      id: 'react-frontend',
      name: 'React Admin Dashboard',
      type: 'api',
      language: 'JavaScript',
      description: 'Admin dashboard consuming Agent Factory APIs directly',
      code: `import { AgentFactoryClient } from '@company/agent-factory-sdk';

const client = new AgentFactoryClient({
  baseURL: 'https://agent-factory.company.com',
  apiKey: process.env.REACT_APP_AGENT_FACTORY_API_KEY
});

// Execute DevOps optimization agent
const optimizeInfrastructure = async () => {
  const result = await client.executeAgent('devops-monitor-v1', {
    cloud_provider: 'aws',
    analysis_type: 'cost-optimization',
    account_id: process.env.AWS_ACCOUNT_ID
  });
  
  setOptimizationResults(result.recommendations);
};`,
      status: 'active',
      usage: 234,
      lastUsed: '1 hour ago'
    },
    {
      id: 'github-actions',
      name: 'GitHub Actions CI/CD',
      type: 'cicd',
      language: 'YAML',
      description: 'Automated test generation in CI/CD pipeline',
      code: `name: Generate Tests with Agent Factory
on:
  pull_request:
    paths: ['src/**', 'requirements/**']

jobs:
  generate-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Execute QA Agent
        uses: company/agent-factory-action@v1
        with:
          agent-id: 'qe-test-generator-v2'
          api-key: \${{ secrets.AGENT_FACTORY_API_KEY }}
          input: |
            {
              "requirements": "\${{ github.event.pull_request.body }}",
              "framework": "cypress",
              "output_format": "typescript"
            }
      
      - name: Commit Generated Tests
        run: |
          git add cypress/integration/
          git commit -m "Auto-generated tests from Agent Factory"
          git push`,
      status: 'active',
      usage: 156,
      lastUsed: '30 minutes ago'
    },
    {
      id: 'webhook-handler',
      name: 'Node.js Webhook Handler',
      type: 'webhook',
      language: 'JavaScript',
      description: 'Event-driven integration for real-time notifications',
      code: `const express = require('express');
const app = express();

// Webhook endpoint for Agent Factory events
app.post('/webhook/agent-factory', (req, res) => {
  const { event, data } = req.body;
  
  switch (event) {
    case 'execution.completed':
      // Process completed agent execution
      await processAgentResults(data.executionId, data.results);
      
      // Notify team via Slack
      await sendSlackNotification({
        channel: '#qa-automation',
        message: \`✅ Agent execution completed: \${data.agentId}\`,
        details: {
          duration: data.durationMs,
          cost: data.cost,
          results: data.results.summary
        }
      });
      break;
      
    case 'agent.health.degraded':
      // Handle agent health issues
      await notifyDevOpsTeam(data.agentId, data.healthStatus);
      break;
  }
  
  res.status(200).json({ received: true });
});`,
      status: 'active',
      usage: 89,
      lastUsed: '15 minutes ago'
    }
  ];

  const platformMetrics: PlatformMetrics = {
    totalIntegrations: 47,
    activeConnections: 23,
    dailyExecutions: 1247,
    monthlyUsage: 28934
  };

  const getTypeColor = (type: string) => {
    const colors = {
      'api': 'primary',
      'sdk': 'success',
      'webhook': 'warning',
      'cicd': 'info'
    };
    return colors[type as keyof typeof colors] || 'secondary';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'active': 'success',
      'inactive': 'secondary',
      'pending': 'warning'
    };
    return colors[status as keyof typeof colors] || 'secondary';
  };

  return (
    <Container fluid>
      <Row className="mb-4">
        <Col>
          <h1 className="display-5 fw-bold text-primary">Platform Integration Hub</h1>
          <p className="lead">Central backend service powering automation across your organization</p>
        </Col>
      </Row>

      {/* Platform Overview Metrics */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h3 className="text-primary">{platformMetrics.totalIntegrations}</h3>
              <p className="mb-0">Total Integrations</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h3 className="text-success">{platformMetrics.activeConnections}</h3>
              <p className="mb-0">Active Connections</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h3 className="text-info">{platformMetrics.dailyExecutions.toLocaleString()}</h3>
              <p className="mb-0">Daily Executions</p>
            </Card.Body>
          </Card>
        </Col>

      </Row>

      {/* Integration Tabs */}
      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k || 'overview')}
        className="mb-4"
      >
        <Tab eventKey="overview" title="Integration Overview">
          <Row>
            <Col md={8}>
              <Card>
                <Card.Header>
                  <h5>Active Integrations</h5>
                </Card.Header>
                <Card.Body>
                  <Table responsive>
                    <thead>
                      <tr>
                        <th>Integration</th>
                        <th>Type</th>
                        <th>Language</th>
                        <th>Status</th>
                        <th>Usage</th>
                        <th>Last Used</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {integrationExamples.map((integration) => (
                        <tr key={integration.id}>
                          <td>
                            <strong>{integration.name}</strong>
                            <br />
                            <small className="text-muted">{integration.description}</small>
                          </td>
                          <td>
                            <Badge bg={getTypeColor(integration.type)}>
                              {integration.type.toUpperCase()}
                            </Badge>
                          </td>
                          <td>{integration.language}</td>
                          <td>
                            <Badge bg={getStatusColor(integration.status)}>
                              {integration.status}
                            </Badge>
                          </td>
                          <td>{integration.usage} calls</td>
                          <td>{integration.lastUsed}</td>
                          <td>
                            <Button
                              size="sm"
                              variant="outline-primary"
                              onClick={() => setSelectedIntegration(integration.id)}
                            >
                              View Code
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="mb-3">
                <Card.Header>
                  <h6>Integration Types</h6>
                </Card.Header>
                <Card.Body>
                  <div className="mb-2">
                    <Badge bg="primary" className="me-2">API</Badge>
                    Direct REST/GraphQL API calls
                  </div>
                  <div className="mb-2">
                    <Badge bg="success" className="me-2">SDK</Badge>
                    Python, JavaScript, Java SDKs
                  </div>
                  <div className="mb-2">
                    <Badge bg="warning" className="me-2">Webhook</Badge>
                    Event-driven notifications
                  </div>
                  <div className="mb-2">
                    <Badge bg="info" className="me-2">CI/CD</Badge>
                    Pipeline integrations
                  </div>
                </Card.Body>
              </Card>

              <Card>
                <Card.Header>
                  <h6>Platform Health</h6>
                </Card.Header>
                <Card.Body>
                  <div className="mb-3">
                    <div className="d-flex justify-content-between">
                      <span>API Availability</span>
                      <span>99.9%</span>
                    </div>
                    <ProgressBar now={99.9} variant="success" />
                  </div>
                  <div className="mb-3">
                    <div className="d-flex justify-content-between">
                      <span>Avg Response Time</span>
                      <span>245ms</span>
                    </div>
                    <ProgressBar now={75} variant="info" />
                  </div>
                  <div className="mb-3">
                    <div className="d-flex justify-content-between">
                      <span>Success Rate</span>
                      <span>98.7%</span>
                    </div>
                    <ProgressBar now={98.7} variant="success" />
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>

        <Tab eventKey="slack" title="Slack Integration">
          <Alert variant="info">
            <strong>Looking for API documentation?</strong> Visit the <a href="/api-documentation">API Documentation</a> page for complete API reference.
          </Alert>
          <Row>
            <Col md={6}>
              <Card>
                <Card.Header>
                  <h5>🔔 Slack Notifications</h5>
                </Card.Header>
                <Card.Body>
                  <p>Receive agent execution notifications directly in Slack channels.</p>
                  
                  <h6>Setup Instructions</h6>
                  <ol>
                    <li>Create a Slack App in your workspace</li>
                    <li>Add Incoming Webhook integration</li>
                    <li>Copy the Webhook URL</li>
                    <li>Configure in AgentHub settings</li>
                  </ol>

                  <Form.Group className="mb-3">
                    <Form.Label>Slack Webhook URL</Form.Label>
                    <Form.Control 
                      type="url" 
                      placeholder="https://hooks.slack.com/services/..."
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Default Channel</Form.Label>
                    <Form.Control 
                      type="text" 
                      placeholder="#agent-notifications"
                    />
                  </Form.Group>

                  <Button variant="primary">Connect Slack</Button>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card>
                <Card.Header>
                  <h5>Example Notification</h5>
                </Card.Header>
                <Card.Body>
                  <div className="bg-light p-3 rounded">
                    <div className="mb-2">
                      <Badge bg="success">✓ Completed</Badge>
                      <strong className="ms-2">QE Test Generator</strong>
                    </div>
                    <p className="mb-1 small">
                      Generated 47 test cases for user authentication flow
                    </p>
                    <div className="small text-muted">
                      Duration: 42s | Cost: $0.18
                    </div>
                    <Button variant="link" size="sm" className="p-0 mt-2">
                      View Results →
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>

        <Tab eventKey="jira" title="Jira Integration">
          <Alert variant="info">
            <strong>Looking for SDK examples?</strong> Visit the <a href="/integration-guide">Integration Guide</a> page for complete SDK documentation and code examples.
          </Alert>
          <Row>
            <Col md={6}>
              <Card>
                <Card.Header>
                  <h5>🎫 Jira Issue Tracking</h5>
                </Card.Header>
                <Card.Body>
                  <p>Automatically create Jira tickets from agent execution results.</p>
                  
                  <h6>Configuration</h6>
                  <Form.Group className="mb-3">
                    <Form.Label>Jira URL</Form.Label>
                    <Form.Control 
                      type="url" 
                      placeholder="https://your-company.atlassian.net"
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>API Token</Form.Label>
                    <Form.Control 
                      type="password" 
                      placeholder="Your Jira API token"
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Default Project</Form.Label>
                    <Form.Control 
                      type="text" 
                      placeholder="PROJECT-KEY"
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Auto-create tickets for</Form.Label>
                    <Form.Check type="checkbox" label="Security vulnerabilities" defaultChecked />
                    <Form.Check type="checkbox" label="Failed test executions" />
                    <Form.Check type="checkbox" label="Cost optimization recommendations" defaultChecked />
                  </Form.Group>

                  <Button variant="primary">Connect Jira</Button>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card>
                <Card.Header>
                  <h5>Use Cases</h5>
                </Card.Header>
                <Card.Body>
                  <div className="mb-3">
                    <h6>Security Scanner → Jira</h6>
                    <p className="small">Automatically create tickets for critical vulnerabilities found by security agents.</p>
                  </div>
                  <div className="mb-3">
                    <h6>Test Failures → Jira</h6>
                    <p className="small">Create bug tickets when generated tests fail in CI/CD.</p>
                  </div>
                  <div className="mb-3">
                    <h6>Cost Optimization → Jira</h6>
                    <p className="small">Track infrastructure optimization recommendations as tasks.</p>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>

        <Tab eventKey="github" title="GitHub Integration">
          <GitHubIntegrationTab />
        </Tab>

        <Tab eventKey="teams" title="Microsoft Teams">
          <Row>
            <Col md={6}>
              <Card>
                <Card.Header>
                  <h5>💬 Teams Notifications</h5>
                </Card.Header>
                <Card.Body>
                  <p>Send agent execution updates to Microsoft Teams channels.</p>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Teams Webhook URL</Form.Label>
                    <Form.Control 
                      type="url" 
                      placeholder="https://outlook.office.com/webhook/..."
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Notification Types</Form.Label>
                    <Form.Check type="checkbox" label="Execution completed" defaultChecked />
                    <Form.Check type="checkbox" label="Execution failed" defaultChecked />
                    <Form.Check type="checkbox" label="Daily summary" />
                  </Form.Group>

                  <Button variant="primary">Connect Teams</Button>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card>
                <Card.Header>
                  <h5>Adaptive Card Preview</h5>
                </Card.Header>
                <Card.Body>
                  <div className="border rounded p-3">
                    <div className="mb-2">
                      <strong>AgentHub Notification</strong>
                    </div>
                    <div className="mb-2">
                      <Badge bg="success">Completed</Badge>
                      <span className="ms-2">Security Scanner</span>
                    </div>
                    <p className="small mb-2">
                      Found 3 vulnerabilities (1 critical, 2 medium)
                    </p>
                    <Button variant="primary" size="sm">View Report</Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>
      </Tabs>

      {/* Code Modal */}
      {selectedIntegration && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" 
             style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="bg-white rounded p-4" style={{ width: '80%', maxHeight: '80%', overflow: 'auto' }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5>
                {integrationExamples.find(i => i.id === selectedIntegration)?.name} - Integration Code
              </h5>
              <Button 
                variant="outline-secondary" 
                size="sm"
                onClick={() => setSelectedIntegration(null)}
              >
                ✕
              </Button>
            </div>
            <pre className="bg-light p-3 rounded" style={{ fontSize: '0.9rem' }}>
              <code>
                {integrationExamples.find(i => i.id === selectedIntegration)?.code}
              </code>
            </pre>
            <div className="mt-3">
              <Button variant="primary" size="sm" className="me-2">
                Copy Code
              </Button>
              <Button variant="outline-primary" size="sm">
                View Documentation
              </Button>
            </div>
          </div>
        </div>
      )}
    </Container>
  );
};

export default PlatformIntegration;