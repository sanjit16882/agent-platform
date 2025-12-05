import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Badge, Alert, Tabs, Tab, Table } from 'react-bootstrap';
import { Icon } from './Icon';

const APIDocumentation: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedEndpoint, setSelectedEndpoint] = useState('list-agents');

  const apiEndpoints = {
    'list-agents': {
      method: 'GET',
      path: '/api/v1/agents',
      description: 'Retrieve all available agents with their metadata',
      parameters: [
        { name: 'category', type: 'string', required: false, description: 'Filter by agent category (qa, devops, security, etc.)' },
        { name: 'framework', type: 'string', required: false, description: 'Filter by framework (openai, crew, langgraph, etc.)' },
        { name: 'limit', type: 'number', required: false, description: 'Maximum number of agents to return (default: 50)' }
      ],
      response: `{
  "agents": [
    {
      "id": "qe-test-generator-v2",
      "name": "QE Test Generator Pro",
      "description": "Advanced test case generation with comprehensive coverage analysis",
      "category": "qa",
      "framework": "crew",
      "version": "2.1.0",
      "status": "active",
      "pricing": {
        "costPerExecution": 0.18,
        "estimatedRuntime": "45s"
      },
      "capabilities": [
        "unit_test_generation",
        "integration_test_creation",
        "edge_case_analysis"
      ],
      "inputSchema": {
        "codebase": "string",
        "testFramework": "string",
        "coverageTarget": "number"
      }
    }
  ],
  "total": 38,
  "page": 1,
  "hasMore": false
}`
    },
    'execute-agent': {
      method: 'POST',
      path: '/api/v1/agents/{agentId}/execute',
      description: 'Execute a specific agent with provided inputs',
      parameters: [
        { name: 'agentId', type: 'string', required: true, description: 'Unique identifier of the agent to execute' }
      ],
      requestBody: `{
  "inputs": {
    "codebase": "https://github.com/company/project.git",
    "testFramework": "jest",
    "coverageTarget": 85
  },
  "options": {
    "async": true,
    "webhook": "https://your-app.com/webhooks/agent-complete",
    "timeout": 300
  }
}`,
      response: `{
  "executionId": "exec_abc123def456",
  "status": "running",
  "agentId": "qe-test-generator-v2",
  "startedAt": "2025-01-15T10:30:00Z",
  "estimatedCompletion": "2025-01-15T10:30:45Z",
  "statusUrl": "/api/v1/executions/exec_abc123def456"
}`
    },
    'get-execution': {
      method: 'GET',
      path: '/api/v1/executions/{executionId}',
      description: 'Get the status and results of an agent execution',
      parameters: [
        { name: 'executionId', type: 'string', required: true, description: 'Unique identifier of the execution' }
      ],
      response: `{
  "executionId": "exec_abc123def456",
  "status": "completed",
  "agentId": "qe-test-generator-v2",
  "startedAt": "2025-01-15T10:30:00Z",
  "completedAt": "2025-01-15T10:30:42Z",
  "duration": 42,
  "cost": 0.18,
  "results": {
    "testsGenerated": 47,
    "coverageAchieved": 87.3,
    "files": [
      {
        "name": "user.test.js",
        "url": "https://storage.agenthub.com/results/exec_abc123def456/user.test.js",
        "type": "unit_test"
      }
    ]
  },
  "metrics": {
    "executionTime": 42,
    "memoryUsed": "256MB",
    "apiCalls": 12
  }
}`
    },
    'upload-agent': {
      method: 'POST',
      path: '/api/v1/agents/upload',
      description: 'Upload and deploy a custom agent',
      requestBody: `{
  "name": "Custom Security Scanner",
  "description": "Scans code for security vulnerabilities",
  "category": "security",
  "framework": "openai",
  "code": "base64_encoded_zip_file",
  "inputSchema": {
    "repository": "string",
    "scanDepth": "number"
  },
  "metadata": {
    "author": "security-team@company.com",
    "version": "1.0.0"
  }
}`,
      response: `{
  "agentId": "custom-security-scanner-v1",
  "status": "validating",
  "validationId": "val_xyz789abc123",
  "estimatedDeployment": "2025-01-15T10:35:00Z"
}`
    }
  };

  const codeExamples = {
    javascript: {
      'list-agents': `// List all QA agents
const response = await fetch('https://api.agenthub.com/v1/agents?category=qa', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});
const agents = await response.json();
console.log(\`Found \${agents.total} QA agents\`);`,
      'execute-agent': `// Execute QE Test Generator
const execution = await fetch('https://api.agenthub.com/v1/agents/qe-test-generator-v2/execute', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    inputs: {
      codebase: 'https://github.com/company/project.git',
      testFramework: 'jest',
      coverageTarget: 85
    },
    options: {
      async: true,
      webhook: 'https://your-app.com/webhooks/agent-complete'
    }
  })
});
const result = await execution.json();
console.log(\`Execution started: \${result.executionId}\`);`,
      'get-execution': `// Check execution status
const response = await fetch('https://api.agenthub.com/v1/executions/exec_abc123def456', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});
const execution = await response.json();
console.log(\`Status: \${execution.status}\`);
if (execution.status === 'completed') {
  console.log('Results:', execution.results);
}`,
      'upload-agent': `// Upload custom agent
const formData = new FormData();
formData.append('name', 'Custom Security Scanner');
formData.append('description', 'Scans code for security vulnerabilities');
formData.append('category', 'security');
formData.append('framework', 'openai');
formData.append('code', agentZipFile); // File object

const response = await fetch('https://api.agenthub.com/v1/agents/upload', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: formData
});
const result = await response.json();
console.log(\`Agent uploaded: \${result.agentId}\`);`
    },
    python: {
      'list-agents': `import requests

# List all DevOps agents
response = requests.get(
    'https://api.agenthub.com/v1/agents?category=devops',
    headers={
        'Authorization': 'Bearer YOUR_API_KEY',
        'Content-Type': 'application/json'
    }
)
agents = response.json()
print(f"Found {agents['total']} DevOps agents")`,
      'execute-agent': `import requests

# Execute Infrastructure Monitor agent
response = requests.post(
    'https://api.agenthub.com/v1/agents/devops-monitor-v1/execute',
    headers={
        'Authorization': 'Bearer YOUR_API_KEY',
        'Content-Type': 'application/json'
    },
    json={
        'inputs': {
            'infrastructure': 'aws',
            'services': ['ec2', 'rds', 'lambda'],
            'alertThreshold': 80
        },
        'options': {
            'async': True,
            'webhook': 'https://your-app.com/webhooks/monitor-alert'
        }
    }
)
result = response.json()
print(f"Monitoring started: {result['executionId']}")`,
      'get-execution': `import requests

# Check execution status
response = requests.get(
    'https://api.agenthub.com/v1/executions/exec_abc123def456',
    headers={
        'Authorization': 'Bearer YOUR_API_KEY',
        'Content-Type': 'application/json'
    }
)
execution = response.json()
print(f"Status: {execution['status']}")
if execution['status'] == 'completed':
    print(f"Results: {execution['results']}")`,
      'upload-agent': `import requests

# Upload custom agent
files = {
    'code': open('my-agent.zip', 'rb')
}
data = {
    'name': 'Custom Security Scanner',
    'description': 'Scans code for security vulnerabilities',
    'category': 'security',
    'framework': 'openai'
}

response = requests.post(
    'https://api.agenthub.com/v1/agents/upload',
    headers={'Authorization': 'Bearer YOUR_API_KEY'},
    files=files,
    data=data
)
result = response.json()
print(f"Agent uploaded: {result['agentId']}")`
    },
    curl: {
      'list-agents': `# List all available agents
curl -X GET "https://api.agenthub.com/v1/agents" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`,
      'execute-agent': `# Execute an agent
curl -X POST "https://api.agenthub.com/v1/agents/qe-test-generator-v2/execute" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "inputs": {
      "codebase": "https://github.com/company/project.git",
      "testFramework": "jest",
      "coverageTarget": 85
    },
    "options": {
      "async": true,
      "webhook": "https://your-app.com/webhooks/agent-complete"
    }
  }'`,
      'get-execution': `# Check execution status
curl -X GET "https://api.agenthub.com/v1/executions/exec_abc123def456" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`,
      'upload-agent': `# Upload custom agent
curl -X POST "https://api.agenthub.com/v1/agents/upload" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "name=Custom Security Scanner" \\
  -F "description=Scans code for security vulnerabilities" \\
  -F "category=security" \\
  -F "framework=openai" \\
  -F "code=@my-agent.zip"`
    }
  };

  const currentEndpoint = apiEndpoints[selectedEndpoint as keyof typeof apiEndpoints];
  const hasParameters = 'parameters' in currentEndpoint;
  const hasRequestBody = 'requestBody' in currentEndpoint;

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex align-items-center mb-3">
            <Icon name="enterprise" size="large" className="me-3 text-primary" />
            <div>
              <h1 className="mb-1">AgentHub API Documentation</h1>
              <p className="text-muted mb-0">Complete guide for integrating AgentHub into your development workflow</p>
            </div>
          </div>
        </Col>
      </Row>

      <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'overview')} className="mb-4">
        <Tab eventKey="overview" title="Overview">
          <Row>
            <Col md={8}>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">
                    <Icon name="target" size="small" className="me-2" />
                    API Reference
                  </h5>
                </Card.Header>
                <Card.Body>
                  <Alert variant="info">
                    <strong>Base URL:</strong> <code>https://api.agenthub.com</code><br />
                    <strong>API Version:</strong> v1<br />
                    <strong>Authentication:</strong> Bearer Token (API Key)
                  </Alert>
                  
                  <Alert variant="warning">
                    <strong>Looking for integration examples?</strong> Check out the <a href="/integration-guide">Integration Guide</a> for complete code examples, CI/CD setup, and best practices.
                  </Alert>

                  <h6>API Capabilities</h6>
                  <ul>
                    <li><strong>Agent Discovery:</strong> Browse and search available agents</li>
                    <li><strong>Agent Execution:</strong> Execute agents with custom inputs</li>
                    <li><strong>Status Monitoring:</strong> Track execution progress in real-time</li>
                    <li><strong>Result Retrieval:</strong> Download generated artifacts and reports</li>
                  </ul>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card>
                <Card.Header>
                  <h6 className="mb-0">
                    <Icon name="security" size="small" className="me-2" />
                    Authentication
                  </h6>
                </Card.Header>
                <Card.Body>
                  <p className="small">Include your API key in the Authorization header:</p>
                  <pre className="bg-light p-2 small">
{`Authorization: Bearer YOUR_API_KEY`}
                  </pre>
                  <Button variant="outline-primary" size="sm" className="w-100 mt-2">
                    <Icon name="security" size="small" className="me-1" />
                    Generate API Key
                  </Button>
                </Card.Body>
              </Card>

              <Card className="mt-3">
                <Card.Header>
                  <h6 className="mb-0">
                    <Icon name="chart" size="small" className="me-2" />
                    Rate Limits
                  </h6>
                </Card.Header>
                <Card.Body>
                  <Table size="sm" className="mb-0">
                    <tbody>
                      <tr>
                        <td>Free Tier</td>
                        <td><Badge bg="secondary">100/hour</Badge></td>
                      </tr>
                      <tr>
                        <td>Pro</td>
                        <td><Badge bg="primary">1,000/hour</Badge></td>
                      </tr>
                      <tr>
                        <td>Enterprise</td>
                        <td><Badge bg="success">Unlimited</Badge></td>
                      </tr>
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>

        <Tab eventKey="endpoints" title="API Endpoints">
          <Row>
            <Col md={3}>
              <Card>
                <Card.Header>
                  <h6 className="mb-0">Endpoints</h6>
                </Card.Header>
                <Card.Body className="p-0">
                  {Object.entries(apiEndpoints).map(([key, endpoint]) => (
                    <Button
                      key={key}
                      variant={selectedEndpoint === key ? "primary" : "outline-light"}
                      className="w-100 text-start border-0 rounded-0"
                      onClick={() => setSelectedEndpoint(key)}
                    >
                      <Badge bg={endpoint.method === 'GET' ? 'success' : endpoint.method === 'POST' ? 'primary' : 'warning'} className="me-2">
                        {endpoint.method}
                      </Badge>
                      <small>{endpoint.path.split('/').pop()}</small>
                    </Button>
                  ))}
                </Card.Body>
              </Card>
            </Col>
            <Col md={9}>
              <Card>
                <Card.Header>
                  <div className="d-flex align-items-center">
                    <Badge bg={currentEndpoint.method === 'GET' ? 'success' : currentEndpoint.method === 'POST' ? 'primary' : 'warning'} className="me-2">
                      {currentEndpoint.method}
                    </Badge>
                    <code>{currentEndpoint.path}</code>
                  </div>
                </Card.Header>
                <Card.Body>
                  <p>{currentEndpoint.description}</p>
                  
                  {hasParameters && 'parameters' in currentEndpoint && (
                    <>
                      <h6>Parameters</h6>
                      <Table size="sm" className="mb-3">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Type</th>
                            <th>Required</th>
                            <th>Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentEndpoint.parameters.map((param, idx) => (
                            <tr key={idx}>
                              <td><code>{param.name}</code></td>
                              <td><Badge bg="light" text="dark">{param.type}</Badge></td>
                              <td>{param.required ? <Badge bg="danger">Yes</Badge> : <Badge bg="secondary">No</Badge>}</td>
                              <td className="small">{param.description}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </>
                  )}

                  {hasRequestBody && 'requestBody' in currentEndpoint && (
                    <>
                      <h6>Request Body</h6>
                      <pre className="bg-light p-3 small">
                        <code>{currentEndpoint.requestBody}</code>
                      </pre>
                    </>
                  )}

                  <h6>Response</h6>
                  <pre className="bg-light p-3 small">
                    <code>{currentEndpoint.response}</code>
                  </pre>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>

        <Tab eventKey="examples" title="Code Examples">
          <Row>
            <Col md={3}>
              <Card>
                <Card.Header>
                  <h6 className="mb-0">Languages</h6>
                </Card.Header>
                <Card.Body className="p-0">
                  {Object.keys(codeExamples).map((lang) => (
                    <Button
                      key={lang}
                      variant="outline-light"
                      className="w-100 text-start border-0 rounded-0 text-capitalize"
                    >
                      {lang}
                    </Button>
                  ))}
                </Card.Body>
              </Card>
            </Col>
            <Col md={9}>
              <Tabs defaultActiveKey="javascript">
                {Object.entries(codeExamples).map(([lang, examples]) => (
                  <Tab key={lang} eventKey={lang} title={lang.charAt(0).toUpperCase() + lang.slice(1)}>
                    <Card>
                      <Card.Header>
                        <h6 className="mb-0">
                          <Icon name="play" size="small" className="me-2" />
                          {lang.charAt(0).toUpperCase() + lang.slice(1)} Examples
                        </h6>
                      </Card.Header>
                      <Card.Body>
                        {Object.entries(examples).map(([operation, code]) => (
                          <div key={operation} className="mb-4">
                            <h6 className="text-capitalize">{operation.replace('-', ' ')}</h6>
                            <pre className="bg-dark text-light p-3">
                              <code>{code}</code>
                            </pre>
                          </div>
                        ))}
                      </Card.Body>
                    </Card>
                  </Tab>
                ))}
              </Tabs>
            </Col>
          </Row>
        </Tab>

        <Tab eventKey="sdks" title="SDKs & Tools">
          <Alert variant="info">
            <strong>Looking for SDK installation and usage examples?</strong><br />
            Visit the <a href="/integration-guide">Integration Guide</a> for complete SDK documentation, code examples, and CI/CD integration.
          </Alert>

          <Row>
            <Col md={6}>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">
                    <Icon name="download" size="small" className="me-2" />
                    Official SDKs
                  </h5>
                </Card.Header>
                <Card.Body>
                  <div className="mb-3">
                    <h6>JavaScript/TypeScript</h6>
                    <pre className="bg-light p-2 small">npm install @agenthub/sdk</pre>
                    <p className="small text-muted">Full TypeScript support with auto-completion</p>
                  </div>
                  
                  <div className="mb-3">
                    <h6>Python</h6>
                    <pre className="bg-light p-2 small">pip install agenthub-python</pre>
                    <p className="small text-muted">Async/await support with Pydantic models</p>
                  </div>

                  <div className="mb-3">
                    <h6>Java</h6>
                    <pre className="bg-light p-2 small">implementation 'com.agenthub:sdk:1.0.0'</pre>
                    <p className="small text-muted">Spring Boot integration available</p>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">
                    <Icon name="settings" size="small" className="me-2" />
                    CLI Tools
                  </h5>
                </Card.Header>
                <Card.Body>
                  <div className="mb-3">
                    <h6>AgentHub CLI</h6>
                    <pre className="bg-light p-2 small">npm install -g @agenthub/cli</pre>
                    <p className="small text-muted">Command-line interface for agent management</p>
                  </div>

                  <div className="mb-3">
                    <h6>Quick Commands</h6>
                    <pre className="bg-dark text-light p-2 small">
{`# List agents
agenthub agents list --category qa

# Execute agent
agenthub execute qe-test-generator-v2 \\
  --input codebase=github.com/repo \\
  --wait

# Upload custom agent
agenthub upload ./my-agent.zip`}
                    </pre>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>
      </Tabs>
    </Container>
  );
};

export default APIDocumentation;