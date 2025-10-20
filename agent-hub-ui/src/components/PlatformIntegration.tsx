import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Form, Alert, Tab, Tabs, Table, ProgressBar } from 'react-bootstrap';

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

        <Tab eventKey="api-docs" title="API Documentation">
          <Row>
            <Col md={6}>
              <Card>
                <Card.Header>
                  <h5>REST API Endpoints</h5>
                </Card.Header>
                <Card.Body>
                  <div className="mb-3">
                    <h6>Agent Operations</h6>
                    <div className="font-monospace small">
                      <div className="mb-1"><Badge bg="success">GET</Badge> /api/v1/agents</div>
                      <div className="mb-1"><Badge bg="primary">POST</Badge> /api/v1/agents</div>
                      <div className="mb-1"><Badge bg="success">GET</Badge> /api/v1/agents/{'{id}'}</div>
                      <div className="mb-1"><Badge bg="warning">PUT</Badge> /api/v1/agents/{'{id}'}</div>
                      <div className="mb-1"><Badge bg="danger">DELETE</Badge> /api/v1/agents/{'{id}'}</div>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <h6>Execution Operations</h6>
                    <div className="font-monospace small">
                      <div className="mb-1"><Badge bg="primary">POST</Badge> /api/v1/agents/{'{id}'}/execute</div>
                      <div className="mb-1"><Badge bg="success">GET</Badge> /api/v1/executions/{'{id}'}</div>
                      <div className="mb-1"><Badge bg="success">GET</Badge> /api/v1/executions/{'{id}'}/results</div>
                      <div className="mb-1"><Badge bg="danger">DELETE</Badge> /api/v1/executions/{'{id}'}</div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <h6>Monitoring Operations</h6>
                    <div className="font-monospace small">
                      <div className="mb-1"><Badge bg="success">GET</Badge> /api/v1/agents/{'{id}'}/health</div>
                      <div className="mb-1"><Badge bg="success">GET</Badge> /api/v1/platform/status</div>
                      <div className="mb-1"><Badge bg="success">GET</Badge> /api/v1/platform/metrics</div>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card>
                <Card.Header>
                  <h5>Authentication</h5>
                </Card.Header>
                <Card.Body>
                  <Alert variant="info">
                    <h6>API Key Authentication</h6>
                    <p className="mb-2">Include your API key in the Authorization header:</p>
                    <code>Authorization: Bearer your-api-key</code>
                  </Alert>

                  <Alert variant="success">
                    <h6>JWT Token Authentication</h6>
                    <p className="mb-2">For user sessions, use JWT tokens:</p>
                    <code>Authorization: Bearer jwt-token</code>
                  </Alert>

                  <Alert variant="warning">
                    <h6>Rate Limits</h6>
                    <ul className="mb-0">
                      <li>1000 requests/hour (standard tier)</li>
                      <li>10000 requests/hour (premium tier)</li>
                      <li>50 concurrent executions max</li>
                    </ul>
                  </Alert>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>

        <Tab eventKey="sdk-examples" title="SDK Examples">
          <Row>
            <Col md={6}>
              <Card>
                <Card.Header>
                  <h5>Python SDK</h5>
                </Card.Header>
                <Card.Body>
                  <pre className="bg-light p-3 rounded">
                    <code>{`# Installation
pip install agent-factory-sdk

# Usage
from agent_factory import AgentFactoryClient

async def main():
    client = AgentFactoryClient(
        base_url="https://agent-factory.company.com/api/v1",
        api_key="your-api-key"
    )
    
    # List available agents
    agents = await client.list_agents(category='QE')
    
    # Execute agent
    result = await client.execute_agent('qe-test-generator-v2', {
        'requirements': 'Test login with MFA',
        'framework': 'cypress'
    })
    
    print(f"Generated {len(result.test_cases)} tests")

asyncio.run(main())`}</code>
                  </pre>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card>
                <Card.Header>
                  <h5>JavaScript SDK</h5>
                </Card.Header>
                <Card.Body>
                  <pre className="bg-light p-3 rounded">
                    <code>{`// Installation
npm install @company/agent-factory-sdk

// Usage
import { AgentFactoryClient } from '@company/agent-factory-sdk';

const client = new AgentFactoryClient({
  baseURL: 'https://agent-factory.company.com',
  apiKey: process.env.AGENT_FACTORY_API_KEY
});

// Execute DevOps agent
const result = await client.executeAgent('devops-monitor-v1', {
  cloud_provider: 'aws',
  analysis_type: 'cost-optimization'
});

console.log(\`Analysis completed: \${result.recommendations?.length || 0} recommendations\`);

// Real-time monitoring
const eventSource = client.watchExecution(result.executionId);
eventSource.onmessage = (event) => {
  const update = JSON.parse(event.data);
  console.log(\`Status: \${update.status}\`);
};`}</code>
                  </pre>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>

        <Tab eventKey="webhooks" title="Webhook Integration">
          <Row>
            <Col md={8}>
              <Card>
                <Card.Header>
                  <h5>Webhook Events</h5>
                </Card.Header>
                <Card.Body>
                  <Table responsive>
                    <thead>
                      <tr>
                        <th>Event Type</th>
                        <th>Description</th>
                        <th>Payload</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><code>execution.started</code></td>
                        <td>Agent execution has started</td>
                        <td>executionId, agentId, startTime</td>
                      </tr>
                      <tr>
                        <td><code>execution.completed</code></td>
                        <td>Agent execution completed successfully</td>
                        <td>executionId, results, duration, cost</td>
                      </tr>
                      <tr>
                        <td><code>execution.failed</code></td>
                        <td>Agent execution failed</td>
                        <td>executionId, error, duration</td>
                      </tr>
                      <tr>
                        <td><code>agent.health.degraded</code></td>
                        <td>Agent health status degraded</td>
                        <td>agentId, healthStatus, metrics</td>
                      </tr>
                      <tr>
                        <td><code>platform.maintenance</code></td>
                        <td>Platform maintenance scheduled</td>
                        <td>maintenanceWindow, affectedServices</td>
                      </tr>
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card>
                <Card.Header>
                  <h6>Webhook Configuration</h6>
                </Card.Header>
                <Card.Body>
                  <Form>
                    <Form.Group className="mb-3">
                      <Form.Label>Webhook URL</Form.Label>
                      <Form.Control 
                        type="url" 
                        placeholder="https://your-app.com/webhook"
                        defaultValue="https://api.company.com/webhook/agent-factory"
                      />
                    </Form.Group>
                    
                    <Form.Group className="mb-3">
                      <Form.Label>Events</Form.Label>
                      <div>
                        <Form.Check type="checkbox" label="Execution Events" defaultChecked />
                        <Form.Check type="checkbox" label="Health Events" defaultChecked />
                        <Form.Check type="checkbox" label="Platform Events" />
                      </div>
                    </Form.Group>
                    
                    <Form.Group className="mb-3">
                      <Form.Label>Secret Key</Form.Label>
                      <Form.Control 
                        type="password" 
                        placeholder="webhook-secret-key"
                        defaultValue="••••••••••••••••"
                      />
                      <Form.Text className="text-muted">
                        Used for webhook signature verification
                      </Form.Text>
                    </Form.Group>
                    
                    <Button variant="primary" size="sm">
                      Update Webhook
                    </Button>
                  </Form>
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