import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Badge, Alert, Tabs, Tab } from 'react-bootstrap';
// Using emoji icons instead of react-icons for better compatibility

const CLIGuide: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);

  const copyToClipboard = (text: string, commandId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCommand(commandId);
    setTimeout(() => setCopiedCommand(null), 2000);
  };

  const CommandBlock: React.FC<{ command: string; description: string; id: string }> = ({ command, description, id }) => (
    <div className="mb-3 p-3 bg-dark text-light rounded">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <code className="text-success">{command}</code>
        <Button
          variant="outline-light"
          size="sm"
          onClick={() => copyToClipboard(command, id)}
        >
          {copiedCommand === id ? '✓ Copied' : '📋'}
        </Button>
      </div>
      <small className="text-muted">{description}</small>
    </div>
  );

  return (
    <Container className="py-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <div className="text-center mb-4">
            <h1 className="display-4 fw-bold text-primary">
              ⌨️ CLI & VS Code Extension
            </h1>
            <p className="lead text-muted">
              Powerful command-line tools and VS Code extension for seamless agent development
            </p>
          </div>
        </Col>
      </Row>

      {/* Feature Highlights */}
      <Row className="mb-5">
        <Col md={4}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="text-primary mb-3" style={{fontSize: '48px'}}>⌨️</div>
              <h5>AgentHub CLI</h5>
              <p className="text-muted">
                Full-featured command-line interface for agent management, deployment, and testing
              </p>
              <Badge bg="success">Available Now</Badge>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="text-primary mb-3" style={{fontSize: '48px'}}>💻</div>
              <h5>VS Code Extension</h5>
              <p className="text-muted">
                Native VS Code integration with syntax highlighting, debugging, and agent development tools
              </p>
              <Badge bg="success">Available Now</Badge>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="text-primary mb-3" style={{fontSize: '48px'}}>🚀</div>
              <h5>DevOps Ready</h5>
              <p className="text-muted">
                Git integration, CI/CD pipelines, and automated deployment workflows
              </p>
              <Badge bg="primary">Enhanced</Badge>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Installation & Quick Start */}
      <Row className="mb-5">
        <Col>
          <Card>
            <Card.Header className="bg-primary text-white">
              <h4 className="mb-0">
                📥 Quick Start Installation
              </h4>
            </Card.Header>
            <Card.Body>
              <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'overview')}>
                <Tab eventKey="overview" title="Overview">
                  <div className="mt-3">
                    <Alert variant="info">
                      <strong>🎉 Get Started!</strong> Install the AgentHub VS Code extension and CLI tools to unlock powerful development features.
                    </Alert>
                    
                    <h6>What's Available:</h6>
                    <ul>
                      <li><strong>Integrated Terminal:</strong> Full shell access with agent-specific commands</li>
                      <li><strong>File Operations:</strong> Create, edit, and manage agent files directly</li>
                      <li><strong>Process Management:</strong> Run and monitor agent processes</li>
                      <li><strong>Git Integration:</strong> Version control for your agent projects</li>
                      <li><strong>Real-time Collaboration:</strong> Work with your team seamlessly</li>
                    </ul>
                  </div>
                </Tab>

                <Tab eventKey="cli" title="CLI Commands">
                  <div className="mt-3">
                    <h6>Agent Management Commands:</h6>
                    <CommandBlock
                      id="list-agents"
                      command="agenthub agent list"
                      description="List all available agents in your workspace"
                    />
                    <CommandBlock
                      id="deploy-agent"
                      command="agenthub agent deploy ./my-agent --name 'My Custom Agent'"
                      description="Deploy a new agent from local files"
                    />
                    <CommandBlock
                      id="test-agent"
                      command="agenthub agent test agent-id --input 'test data' --mock"
                      description="Test an agent with mock data before deployment"
                    />
                    <CommandBlock
                      id="agent-logs"
                      command="agenthub agent logs agent-id --tail 100"
                      description="View real-time logs from agent execution"
                    />

                    <h6 className="mt-4">Development Commands:</h6>
                    <CommandBlock
                      id="create-project"
                      command="agenthub create agent-project --template python-ml"
                      description="Create a new agent project from template"
                    />
                    <CommandBlock
                      id="validate-agent"
                      command="agenthub validate ./agent-config.json"
                      description="Validate agent configuration and dependencies"
                    />
                    <CommandBlock
                      id="benchmark"
                      command="agenthub benchmark agent-id --scenarios ./test-cases/"
                      description="Run performance benchmarks on your agent"
                    />
                  </div>
                </Tab>

                <Tab eventKey="ide" title="IDE Features">
                  <div className="mt-3">
                    <Row>
                      <Col md={6}>
                        <h6>Code Intelligence:</h6>
                        <ul>
                          <li>Syntax highlighting for agent configs</li>
                          <li>Auto-completion for API calls</li>
                          <li>Real-time error detection</li>
                          <li>Integrated debugging tools</li>
                        </ul>

                        <h6>Project Management:</h6>
                        <ul>
                          <li>Agent project templates</li>
                          <li>Dependency management</li>
                          <li>Environment configuration</li>
                          <li>Testing framework integration</li>
                        </ul>
                      </Col>
                      <Col md={6}>
                        <h6>Collaboration Features:</h6>
                        <ul>
                          <li>Real-time code sharing</li>
                          <li>Integrated chat and comments</li>
                          <li>Version control integration</li>
                          <li>Team workspace management</li>
                        </ul>

                        <h6>Deployment Integration:</h6>
                        <ul>
                          <li>One-click deployment</li>
                          <li>Environment promotion</li>
                          <li>Rollback capabilities</li>
                          <li>Performance monitoring</li>
                        </ul>
                      </Col>
                    </Row>
                  </div>
                </Tab>

                <Tab eventKey="examples" title="Examples">
                  <div className="mt-3">
                    <h6>Complete Workflow Example:</h6>
                    <div className="bg-light p-3 rounded mb-3">
                      <pre className="mb-0">
{`# 1. Create a new agent project
agenthub create agent-project --name "sentiment-analyzer" --template python-ml

# 2. Navigate to project directory
cd sentiment-analyzer

# 3. Edit agent configuration
agenthub edit agent-config.json

# 4. Test locally with mock data
agenthub agent test . --input "This is a great product!" --mock

# 5. Validate configuration
agenthub validate .

# 6. Deploy to staging
agenthub agent deploy . --environment staging

# 7. Run integration tests
agenthub agent test deployed-agent-id --scenarios ./test-scenarios/

# 8. Promote to production
agenthub agent promote agent-id --from staging --to production`}
                      </pre>
                    </div>

                    <h6>CI/CD Pipeline Integration:</h6>
                    <div className="bg-dark text-light p-3 rounded">
                      <pre className="mb-0 text-light">
{`# .github/workflows/agent-deploy.yml
name: Deploy Agent
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy Agent
        run: |
          agenthub auth login --token \${{ secrets.AGENTHUB_TOKEN }}
          agenthub agent deploy . --auto-promote`}
                      </pre>
                    </div>
                  </div>
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Advanced Features */}
      <Row className="mb-5">
        <Col md={6}>
          <Card className="h-100">
            <Card.Header>
              <h5 className="mb-0">🔧 Advanced CLI Features</h5>
            </Card.Header>
            <Card.Body>
              <ul>
                <li><strong>Plugin System:</strong> Extend CLI with custom commands</li>
                <li><strong>Configuration Profiles:</strong> Manage multiple environments</li>
                <li><strong>Batch Operations:</strong> Deploy multiple agents at once</li>
                <li><strong>Monitoring Integration:</strong> Real-time performance metrics</li>
                <li><strong>Backup & Restore:</strong> Agent configuration management</li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="h-100">
            <Card.Header>
              <h5 className="mb-0">🚀 IDE Pro Features</h5>
            </Card.Header>
            <Card.Body>
              <ul>
                <li><strong>Visual Debugger:</strong> Step-through agent execution</li>
                <li><strong>Performance Profiler:</strong> Optimize agent performance</li>
                <li><strong>Team Workspaces:</strong> Collaborative development</li>
                <li><strong>Code Generation:</strong> AI-assisted agent creation</li>
                <li><strong>Integration Testing:</strong> End-to-end test automation</li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Call to Action */}
      <Row>
        <Col>
          <Card className="bg-primary text-white">
            <Card.Body className="text-center">
              <h4>Ready to Get Started?</h4>
              <p className="mb-4">
                You're already using Kiro IDE! Start exploring the CLI commands and IDE features right now.
              </p>
              <div className="d-flex justify-content-center gap-3">
                <Button variant="light" size="lg" onClick={() => setActiveTab('cli')}>
                  ▶️ Try CLI Commands
                </Button>
                <Button variant="outline-light" size="lg" href="/api-docs">
                  📚 View API Docs
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default CLIGuide;