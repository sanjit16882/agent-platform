import React, { useState } from 'react';
import { Container, Row, Col, Card, Nav, Tab, Button, Badge } from 'react-bootstrap';
import { theme } from '../../styles/theme';

const ApiCliDocumentationPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <Container fluid style={{ padding: theme.spacing.xl }}>
      <Row>
        <Col>
          <div style={{ marginBottom: theme.spacing.xl }}>
            <h1 style={{
              fontSize: theme.typography.fontSize['3xl'],
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.textPrimary,
              marginBottom: theme.spacing.sm
            }}>
              API & CLI Documentation
            </h1>
            <p style={{
              fontSize: theme.typography.fontSize.lg,
              color: theme.colors.textSecondary
            }}>
              Programmatic access to Agent Testing - REST API, CLI Tool, and SDK
            </p>
          </div>

          <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'overview')}>
            <Row>
              <Col md={3}>
                <Nav variant="pills" className="flex-column">
                  <Nav.Item>
                    <Nav.Link eventKey="overview">📖 Overview</Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="rest-api">🔌 REST API</Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="cli">💻 CLI Tool</Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="sdk">📦 SDK/Client</Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="cicd">🚀 CI/CD Integration</Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="examples">📝 Examples</Nav.Link>
                  </Nav.Item>
                </Nav>
              </Col>

              <Col md={9}>
                <Tab.Content>

                  {/* Overview Tab */}
                  <Tab.Pane eventKey="overview">
                    <OverviewSection />
                  </Tab.Pane>

                  {/* REST API Tab */}
                  <Tab.Pane eventKey="rest-api">
                    <RestApiSection />
                  </Tab.Pane>

                  {/* CLI Tab */}
                  <Tab.Pane eventKey="cli">
                    <CliSection />
                  </Tab.Pane>

                  {/* SDK Tab */}
                  <Tab.Pane eventKey="sdk">
                    <SdkSection />
                  </Tab.Pane>

                  {/* CI/CD Tab */}
                  <Tab.Pane eventKey="cicd">
                    <CiCdSection />
                  </Tab.Pane>

                  {/* Examples Tab */}
                  <Tab.Pane eventKey="examples">
                    <ExamplesSection />
                  </Tab.Pane>
                </Tab.Content>
              </Col>
            </Row>
          </Tab.Container>
        </Col>
      </Row>
    </Container>
  );
};

// Overview Section Component
const OverviewSection: React.FC = () => (
  <Card>
    <Card.Body>
      <h2 style={{ marginBottom: theme.spacing.lg }}>Overview</h2>
      
      <p>The Agent Testing platform provides three ways to interact programmatically:</p>
      
      <Row style={{ marginTop: theme.spacing.xl }}>
        <Col md={4}>
          <Card style={{ height: '100%', border: `2px solid ${theme.colors.primary}` }}>
            <Card.Body>
              <h4>🔌 REST API</h4>
              <p>HTTP endpoints for all testing operations</p>
              <ul>
                <li>Test management</li>
                <li>Test execution</li>
                <li>Results & analytics</li>
              </ul>
              <Badge bg="primary">Base URL: /api/v1/testing</Badge>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4}>
          <Card style={{ height: '100%', border: `2px solid ${theme.colors.success}` }}>
            <Card.Body>
              <h4>💻 CLI Tool</h4>
              <p>Command-line interface for terminal access</p>
              <ul>
                <li>Run tests from terminal</li>
                <li>CI/CD integration</li>
                <li>Batch operations</li>
              </ul>
              <Badge bg="success">npm install -g @agent-hub/testing-cli</Badge>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4}>
          <Card style={{ height: '100%', border: `2px solid ${theme.colors.info}` }}>
            <Card.Body>
              <h4>📦 SDK/Client</h4>
              <p>JavaScript/TypeScript library</p>
              <ul>
                <li>Programmatic access</li>
                <li>Type-safe operations</li>
                <li>Promise-based API</li>
              </ul>
              <Badge bg="info">npm install @agent-hub/testing-sdk</Badge>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <div style={{ marginTop: theme.spacing.xl, padding: theme.spacing.lg, backgroundColor: theme.colors.infoLight, borderRadius: theme.borderRadius.md }}>
        <h5>📚 Full Documentation</h5>
        <p>Complete API & CLI guide available at:</p>
        <code style={{ padding: theme.spacing.sm, backgroundColor: theme.colors.white, borderRadius: theme.borderRadius.sm }}>
          local_version/docs/API_CLI_TESTING_GUIDE.md
        </code>
      </div>
    </Card.Body>
  </Card>
);

// REST API Section Component
const RestApiSection: React.FC = () => (
  <Card>
    <Card.Body>
      <h2 style={{ marginBottom: theme.spacing.lg }}>REST API</h2>
      
      <div style={{ marginBottom: theme.spacing.xl }}>
        <h4>Base URL</h4>
        <code style={{ padding: theme.spacing.sm, backgroundColor: theme.colors.backgroundSecondary, borderRadius: theme.borderRadius.sm, display: 'block' }}>
          http://localhost:3002/api/v1/testing
        </code>
      </div>

      <div style={{ marginBottom: theme.spacing.xl }}>
        <h4>Authentication</h4>
        <p>All requests require an API key in the header:</p>
        <pre style={{ padding: theme.spacing.md, backgroundColor: theme.colors.backgroundSecondary, borderRadius: theme.borderRadius.md, overflow: 'auto' }}>
{`Authorization: Bearer YOUR_API_KEY`}
        </pre>
      </div>

      <h4>Endpoints</h4>
      
      <Card style={{ marginBottom: theme.spacing.md }}>
        <Card.Header style={{ backgroundColor: theme.colors.successLight }}>
          <Badge bg="success">GET</Badge> <strong>/tests</strong>
        </Card.Header>
        <Card.Body>
          <p><strong>Description:</strong> Get all available tests</p>
          <p><strong>Query Parameters:</strong></p>
          <ul>
            <li><code>category</code> - Filter by category</li>
            <li><code>tags</code> - Filter by tags (comma-separated)</li>
            <li><code>agentType</code> - Filter by agent type</li>
          </ul>
          <p><strong>Example:</strong></p>
          <pre style={{ padding: theme.spacing.sm, backgroundColor: theme.colors.backgroundSecondary, borderRadius: theme.borderRadius.sm }}>
{`curl http://localhost:3002/api/v1/testing/tests?category=functional`}
          </pre>
        </Card.Body>
      </Card>

      <Card style={{ marginBottom: theme.spacing.md }}>
        <Card.Header style={{ backgroundColor: theme.colors.primaryLight }}>
          <Badge bg="primary">POST</Badge> <strong>/tests</strong>
        </Card.Header>
        <Card.Body>
          <p><strong>Description:</strong> Create a custom test</p>
          <p><strong>Request Body:</strong></p>
          <pre style={{ padding: theme.spacing.sm, backgroundColor: theme.colors.backgroundSecondary, borderRadius: theme.borderRadius.sm, overflow: 'auto' }}>
{`{
  "name": "Custom API Test",
  "category": "functional",
  "description": "Tests API integration",
  "input_format": "json",
  "expected_output_type": "json",
  "scoring_criteria": {
    "accuracy": 0.5,
    "format": 0.5
  }
}`}
          </pre>
        </Card.Body>
      </Card>

      <Card style={{ marginBottom: theme.spacing.md }}>
        <Card.Header style={{ backgroundColor: theme.colors.warningLight }}>
          <Badge bg="warning">POST</Badge> <strong>/execute</strong>
        </Card.Header>
        <Card.Body>
          <p><strong>Description:</strong> Execute tests for an agent</p>
          <p><strong>Request Body:</strong></p>
          <pre style={{ padding: theme.spacing.sm, backgroundColor: theme.colors.backgroundSecondary, borderRadius: theme.borderRadius.sm, overflow: 'auto' }}>
{`{
  "agentId": "agent_123",
  "modelIds": ["claude-3-5-sonnet"],
  "testIds": ["test_001", "test_002"],
  "inputs": {
    "test_001": {
      "content": "Test input",
      "format": "plain_text"
    }
  }
}`}
          </pre>
          <p><strong>Response:</strong></p>
          <pre style={{ padding: theme.spacing.sm, backgroundColor: theme.colors.backgroundSecondary, borderRadius: theme.borderRadius.sm }}>
{`{
  "success": true,
  "runId": "run_abc123",
  "status": "queued"
}`}
          </pre>
        </Card.Body>
      </Card>

      <Card style={{ marginBottom: theme.spacing.md }}>
        <Card.Header style={{ backgroundColor: theme.colors.successLight }}>
          <Badge bg="success">GET</Badge> <strong>/execute/:runId</strong>
        </Card.Header>
        <Card.Body>
          <p><strong>Description:</strong> Get execution status and results</p>
          <p><strong>Example:</strong></p>
          <pre style={{ padding: theme.spacing.sm, backgroundColor: theme.colors.backgroundSecondary, borderRadius: theme.borderRadius.sm }}>
{`curl http://localhost:3002/api/v1/testing/execute/run_abc123`}
          </pre>
        </Card.Body>
      </Card>

      <Card style={{ marginBottom: theme.spacing.md }}>
        <Card.Header style={{ backgroundColor: theme.colors.successLight }}>
          <Badge bg="success">GET</Badge> <strong>/analytics</strong>
        </Card.Header>
        <Card.Body>
          <p><strong>Description:</strong> Get analytics data</p>
          <p><strong>Query Parameters:</strong></p>
          <ul>
            <li><code>agentId</code> - Filter by agent</li>
            <li><code>days</code> - Number of days (default: 30)</li>
          </ul>
        </Card.Body>
      </Card>
    </Card.Body>
  </Card>
);

// CLI Section Component
const CliSection: React.FC = () => (
  <Card>
    <Card.Body>
      <h2 style={{ marginBottom: theme.spacing.lg }}>CLI Tool</h2>
      
      <div style={{ marginBottom: theme.spacing.xl }}>
        <h4>Installation</h4>
        <pre style={{ padding: theme.spacing.md, backgroundColor: theme.colors.backgroundSecondary, borderRadius: theme.borderRadius.md }}>
{`# Global installation
npm install -g @agent-hub/testing-cli

# Or use locally
cd local_version/agent-hub-cli
npm install
npm link`}
        </pre>
      </div>

      <div style={{ marginBottom: theme.spacing.xl }}>
        <h4>Configuration</h4>
        <p>Create <code>~/.agent-hub/config.json</code>:</p>
        <pre style={{ padding: theme.spacing.md, backgroundColor: theme.colors.backgroundSecondary, borderRadius: theme.borderRadius.md }}>
{`{
  "apiUrl": "http://localhost:3002",
  "apiKey": "your-api-key-here",
  "defaultAgent": "agent_123"
}`}
        </pre>
        <p style={{ marginTop: theme.spacing.md }}>Or use environment variables:</p>
        <pre style={{ padding: theme.spacing.md, backgroundColor: theme.colors.backgroundSecondary, borderRadius: theme.borderRadius.md }}>
{`export AGENT_HUB_API_URL=http://localhost:3002
export AGENT_HUB_API_KEY=your-api-key-here`}
        </pre>
      </div>

      <h4>Commands</h4>

      <Card style={{ marginBottom: theme.spacing.md, border: `1px solid ${theme.colors.primary}` }}>
        <Card.Header style={{ backgroundColor: theme.colors.primaryLight }}>
          <strong>Test Management</strong>
        </Card.Header>
        <Card.Body>
          <pre style={{ padding: theme.spacing.sm, backgroundColor: theme.colors.backgroundSecondary, borderRadius: theme.borderRadius.sm }}>
{`# List all tests
agent-test list

# Filter by category
agent-test list --category functional

# Create a test
agent-test create --name "My Test" --category functional --file test.json

# Show test details
agent-test show test_001

# Delete a test
agent-test delete test_001`}
          </pre>
        </Card.Body>
      </Card>

      <Card style={{ marginBottom: theme.spacing.md, border: `1px solid ${theme.colors.success}` }}>
        <Card.Header style={{ backgroundColor: theme.colors.successLight }}>
          <strong>Test Execution</strong>
        </Card.Header>
        <Card.Body>
          <pre style={{ padding: theme.spacing.sm, backgroundColor: theme.colors.backgroundSecondary, borderRadius: theme.borderRadius.sm }}>
{`# Run tests
agent-test run \\
  --agent agent_123 \\
  --models claude-3-5-sonnet \\
  --tests test_001,test_002 \\
  --watch

# Run with knowledge sources
agent-test run \\
  --agent agent_123 \\
  --models claude-3-5-sonnet \\
  --tests test_001 \\
  --vector-db \\
  --knowledge-bases kb_001 \\
  --mcp \\
  --mcp-servers server_001

# Run from test suite file
agent-test run --suite test-suite.yaml`}
          </pre>
        </Card.Body>
      </Card>

      <Card style={{ marginBottom: theme.spacing.md, border: `1px solid ${theme.colors.info}` }}>
        <Card.Header style={{ backgroundColor: theme.colors.infoLight }}>
          <strong>Results & Analytics</strong>
        </Card.Header>
        <Card.Body>
          <pre style={{ padding: theme.spacing.sm, backgroundColor: theme.colors.backgroundSecondary, borderRadius: theme.borderRadius.sm }}>
{`# Show results
agent-test results run_abc123 --detailed

# Export results
agent-test results run_abc123 --export json --output results.json

# List runs
agent-test runs --agent agent_123

# Show analytics
agent-test analytics --days 7`}
          </pre>
        </Card.Body>
      </Card>

      <Card style={{ marginBottom: theme.spacing.md, border: `1px solid ${theme.colors.warning}` }}>
        <Card.Header style={{ backgroundColor: theme.colors.warningLight }}>
          <strong>CI/CD Mode</strong>
        </Card.Header>
        <Card.Body>
          <pre style={{ padding: theme.spacing.sm, backgroundColor: theme.colors.backgroundSecondary, borderRadius: theme.borderRadius.sm }}>
{`# Run in CI mode (exits with status code)
agent-test run \\
  --agent agent_123 \\
  --models claude-3-5-sonnet \\
  --tests test_001 \\
  --ci-mode \\
  --fail-threshold 80 \\
  --report junit \\
  --output test-results.xml`}
          </pre>
        </Card.Body>
      </Card>
    </Card.Body>
  </Card>
);

// SDK Section Component
const SdkSection: React.FC = () => (
  <Card>
    <Card.Body>
      <h2 style={{ marginBottom: theme.spacing.lg }}>SDK/Client Library</h2>
      
      <div style={{ marginBottom: theme.spacing.xl }}>
        <h4>Installation</h4>
        <pre style={{ padding: theme.spacing.md, backgroundColor: theme.colors.backgroundSecondary, borderRadius: theme.borderRadius.md }}>
{`npm install @agent-hub/testing-sdk`}
        </pre>
      </div>

      <div style={{ marginBottom: theme.spacing.xl }}>
        <h4>JavaScript Usage</h4>
        <pre style={{ padding: theme.spacing.md, backgroundColor: theme.colors.backgroundSecondary, borderRadius: theme.borderRadius.md, overflow: 'auto' }}>
{`const { AgentTestingClient } = require('@agent-hub/testing-sdk');

// Initialize client
const client = new AgentTestingClient({
  apiUrl: 'http://localhost:3002',
  apiKey: 'your-api-key-here'
});

// List tests
const tests = await client.tests.list({ category: 'functional' });

// Create a custom test
const newTest = await client.tests.create({
  name: 'Custom Test',
  category: 'functional',
  description: 'My custom test',
  input_format: 'plain_text',
  expected_output_type: 'text',
  scoring_criteria: {
    accuracy: 0.5,
    completeness: 0.5
  }
});

// Execute tests
const run = await client.execute({
  agentId: 'agent_123',
  modelIds: ['claude-3-5-sonnet'],
  testIds: ['test_001', 'test_002'],
  inputs: {
    test_001: {
      content: 'Test input',
      format: 'plain_text'
    }
  }
});

// Wait for completion
const results = await client.waitForCompletion(run.runId, {
  timeout: 60000,
  pollInterval: 2000
});

// Get analytics
const analytics = await client.analytics.get({
  agentId: 'agent_123',
  days: 30
});`}
        </pre>
      </div>

      <div style={{ marginBottom: theme.spacing.xl }}>
        <h4>TypeScript Usage</h4>
        <pre style={{ padding: theme.spacing.md, backgroundColor: theme.colors.backgroundSecondary, borderRadius: theme.borderRadius.md, overflow: 'auto' }}>
{`import { AgentTestingClient, TestRun, TestResult } from '@agent-hub/testing-sdk';

const client = new AgentTestingClient({
  apiUrl: 'http://localhost:3002',
  apiKey: process.env.AGENT_HUB_API_KEY!
});

const run: TestRun = await client.execute({
  agentId: 'agent_123',
  modelIds: ['claude-3-5-sonnet'],
  testIds: ['test_001']
});

const results: TestResult[] = await client.getResults(run.runId);`}
        </pre>
      </div>

      <div style={{ padding: theme.spacing.lg, backgroundColor: theme.colors.infoLight, borderRadius: theme.borderRadius.md }}>
        <h5>📦 SDK Features</h5>
        <ul>
          <li>✅ Full TypeScript support with type definitions</li>
          <li>✅ Promise-based async/await API</li>
          <li>✅ Automatic retry and error handling</li>
          <li>✅ Built-in polling for test completion</li>
          <li>✅ Comprehensive test management methods</li>
        </ul>
      </div>
    </Card.Body>
  </Card>
);

// CI/CD Section Component
const CiCdSection: React.FC = () => (
  <Card>
    <Card.Body>
      <h2 style={{ marginBottom: theme.spacing.lg }}>CI/CD Integration</h2>
      
      <Card style={{ marginBottom: theme.spacing.xl }}>
        <Card.Header style={{ backgroundColor: theme.colors.primaryLight }}>
          <strong>GitHub Actions</strong>
        </Card.Header>
        <Card.Body>
          <pre style={{ padding: theme.spacing.md, backgroundColor: theme.colors.backgroundSecondary, borderRadius: theme.borderRadius.md, overflow: 'auto' }}>
{`name: Agent Testing

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
    
    - name: Install Agent Testing CLI
      run: npm install -g @agent-hub/testing-cli
    
    - name: Run Agent Tests
      env:
        AGENT_HUB_API_URL: \${{ secrets.AGENT_HUB_API_URL }}
        AGENT_HUB_API_KEY: \${{ secrets.AGENT_HUB_API_KEY }}
      run: |
        agent-test run \\
          --agent agent_123 \\
          --models claude-3-5-sonnet \\
          --category functional \\
          --ci-mode \\
          --fail-threshold 80 \\
          --report junit \\
          --output ./test-results.xml
    
    - name: Publish Test Results
      uses: EnricoMi/publish-unit-test-result-action@v2
      if: always()
      with:
        files: ./test-results.xml`}
          </pre>
        </Card.Body>
      </Card>

      <Card style={{ marginBottom: theme.spacing.xl }}>
        <Card.Header style={{ backgroundColor: theme.colors.successLight }}>
          <strong>Jenkins Pipeline</strong>
        </Card.Header>
        <Card.Body>
          <pre style={{ padding: theme.spacing.md, backgroundColor: theme.colors.backgroundSecondary, borderRadius: theme.borderRadius.md, overflow: 'auto' }}>
{`pipeline {
    agent any
    
    environment {
        AGENT_HUB_API_URL = credentials('agent-hub-api-url')
        AGENT_HUB_API_KEY = credentials('agent-hub-api-key')
    }
    
    stages {
        stage('Install CLI') {
            steps {
                sh 'npm install -g @agent-hub/testing-cli'
            }
        }
        
        stage('Run Tests') {
            steps {
                sh '''
                    agent-test run \\
                      --agent agent_123 \\
                      --models claude-3-5-sonnet \\
                      --category functional \\
                      --ci-mode \\
                      --fail-threshold 80 \\
                      --report junit \\
                      --output ./test-results.xml
                '''
            }
        }
        
        stage('Publish Results') {
            steps {
                junit 'test-results.xml'
            }
        }
    }
}`}
          </pre>
        </Card.Body>
      </Card>

      <Card style={{ marginBottom: theme.spacing.xl }}>
        <Card.Header style={{ backgroundColor: theme.colors.infoLight }}>
          <strong>GitLab CI</strong>
        </Card.Header>
        <Card.Body>
          <pre style={{ padding: theme.spacing.md, backgroundColor: theme.colors.backgroundSecondary, borderRadius: theme.borderRadius.md, overflow: 'auto' }}>
{`agent-testing:
  stage: test
  image: node:18
  script:
    - npm install -g @agent-hub/testing-cli
    - |
      agent-test run \\
        --agent agent_123 \\
        --models claude-3-5-sonnet \\
        --category functional \\
        --ci-mode \\
        --fail-threshold 80 \\
        --report junit \\
        --output ./test-results.xml
  artifacts:
    reports:
      junit: test-results.xml`}
          </pre>
        </Card.Body>
      </Card>
    </Card.Body>
  </Card>
);

// Examples Section Component
const ExamplesSection: React.FC = () => (
  <Card>
    <Card.Body>
      <h2 style={{ marginBottom: theme.spacing.lg }}>Examples</h2>
      
      <Card style={{ marginBottom: theme.spacing.xl }}>
        <Card.Header style={{ backgroundColor: theme.colors.primaryLight }}>
          <strong>Example 1: Create and Run Custom Test (CLI)</strong>
        </Card.Header>
        <Card.Body>
          <pre style={{ padding: theme.spacing.md, backgroundColor: theme.colors.backgroundSecondary, borderRadius: theme.borderRadius.md, overflow: 'auto' }}>
{`# 1. Create test definition file
cat > custom-test.json << EOF
{
  "name": "API Response Validation",
  "category": "functional",
  "description": "Validates API response format",
  "input_format": "json",
  "expected_output_type": "json",
  "scoring_criteria": {
    "accuracy": 0.4,
    "format": 0.3,
    "completeness": 0.3
  }
}
EOF

# 2. Create the test
agent-test create --file custom-test.json

# 3. Run the test
agent-test run \\
  --agent agent_123 \\
  --models claude-3-5-sonnet \\
  --tests custom_test_001 \\
  --watch

# 4. View results
agent-test results <run_id> --detailed`}
          </pre>
        </Card.Body>
      </Card>

      <Card style={{ marginBottom: theme.spacing.xl }}>
        <Card.Header style={{ backgroundColor: theme.colors.successLight }}>
          <strong>Example 2: Programmatic Test Suite (SDK)</strong>
        </Card.Header>
        <Card.Body>
          <pre style={{ padding: theme.spacing.md, backgroundColor: theme.colors.backgroundSecondary, borderRadius: theme.borderRadius.md, overflow: 'auto' }}>
{`const { AgentTestingClient } = require('@agent-hub/testing-sdk');

async function runTestSuite() {
  const client = new AgentTestingClient({
    apiUrl: 'http://localhost:3002',
    apiKey: process.env.AGENT_HUB_API_KEY
  });

  // Create custom tests
  const tests = await Promise.all([
    client.tests.create({
      name: 'Test 1: Data Validation',
      category: 'functional',
      description: 'Validates data format',
      input_format: 'json',
      expected_output_type: 'json',
      scoring_criteria: { accuracy: 0.5, format: 0.5 }
    }),
    client.tests.create({
      name: 'Test 2: Error Handling',
      category: 'safety',
      description: 'Tests error handling',
      input_format: 'plain_text',
      expected_output_type: 'text',
      scoring_criteria: { accuracy: 0.6, safety: 0.4 }
    })
  ]);

  // Execute tests
  const run = await client.execute({
    agentId: 'agent_123',
    modelIds: ['claude-3-5-sonnet'],
    testIds: tests.map(t => t.id),
    inputs: {
      [tests[0].id]: {
        content: '{"name": "John", "age": 30}',
        format: 'json'
      },
      [tests[1].id]: {
        content: 'Handle this error: Division by zero',
        format: 'plain_text'
      }
    }
  });

  // Wait for completion
  const results = await client.waitForCompletion(run.runId);

  // Analyze results
  console.log(\`Pass Rate: \${results.passRate}%\`);
  console.log(\`Average Score: \${results.averageScore}\`);
  
  results.results.forEach(result => {
    console.log(\`\${result.testName}: \${result.passed ? 'PASS' : 'FAIL'}\`);
  });
}

runTestSuite().catch(console.error);`}
          </pre>
        </Card.Body>
      </Card>

      <Card style={{ marginBottom: theme.spacing.xl }}>
        <Card.Header style={{ backgroundColor: theme.colors.infoLight }}>
          <strong>Example 3: Test Suite File (YAML)</strong>
        </Card.Header>
        <Card.Body>
          <pre style={{ padding: theme.spacing.md, backgroundColor: theme.colors.backgroundSecondary, borderRadius: theme.borderRadius.md, overflow: 'auto' }}>
{`# test-suite.yaml
name: "Integration Test Suite"
agent: agent_123
models:
  - claude-3-5-sonnet
  - gpt-4
tests:
  - id: test_001
    input:
      content: "Transform this data: {name: 'John', age: 30}"
      format: plain_text
  - id: test_002
    input:
      content: "Calculate factorial of 5"
      format: plain_text
knowledgeConfig:
  vectorDB:
    enabled: true
    knowledgeBases:
      - kb_001
    retrievalConfig:
      topK: 5
      minSimilarity: 0.7
  mcp:
    enabled: false
    selectedServers: []

# Run the suite
agent-test run --suite test-suite.yaml --watch`}
          </pre>
        </Card.Body>
      </Card>

      <div style={{ padding: theme.spacing.lg, backgroundColor: theme.colors.warningLight, borderRadius: theme.borderRadius.md }}>
        <h5>💡 More Examples</h5>
        <p>Find more examples and detailed documentation in:</p>
        <ul>
          <li><code>local_version/docs/API_CLI_TESTING_GUIDE.md</code></li>
          <li><code>local_version/agent-hub-cli/README.md</code></li>
          <li><code>local_version/agent-hub-cli/examples/</code></li>
        </ul>
      </div>
    </Card.Body>
  </Card>
);

export default ApiCliDocumentationPage;
