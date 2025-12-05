import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert, Badge, Spinner, ListGroup } from 'react-bootstrap';
import { theme } from '../styles/theme';

interface GitHubIssue {
  number: number;
  title: string;
  url: string;
  state: string;
  created_at: string;
}

const GitHubIntegrationDemo: React.FC = () => {
  const [githubToken, setGithubToken] = useState('');
  const [repoOwner, setRepoOwner] = useState('');
  const [repoName, setRepoName] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<any>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<any>(null);

  const availableAgents = [
    { id: 'code-reviewer', name: 'Code Review Agent', description: 'Reviews code quality and best practices' },
    { id: 'security-scanner', name: 'Security Scanner', description: 'Scans for security vulnerabilities' },
    { id: 'api-tester', name: 'API Testing Agent', description: 'Tests API endpoints and responses' },
    { id: 'performance-monitor', name: 'Performance Monitor', description: 'Monitors performance issues' }
  ];

  const testConnection = async () => {
    setIsConnecting(true);
    setConnectionStatus(null);

    try {
      const response = await fetch('http://localhost:3002/api/v1/github/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: githubToken,
          owner: repoOwner,
          repo: repoName
        })
      });

      const result = await response.json();
      setConnectionStatus(result);
    } catch (error) {
      setConnectionStatus({
        success: false,
        error: 'Failed to connect to backend'
      });
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
        body: JSON.stringify({
          token: githubToken,
          owner: repoOwner,
          repo: repoName,
          agents: selectedAgents
        })
      });

      const result = await response.json();
      setSaveStatus(result);
    } catch (error) {
      setSaveStatus({
        success: false,
        error: 'Failed to save integration'
      });
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

  return (
    <Container fluid style={{ padding: theme.spacing['3xl'], backgroundColor: theme.colors.backgroundSecondary, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: theme.spacing['3xl'] }}>
        <h1 style={{ fontSize: theme.typography.fontSize['3xl'], fontWeight: theme.typography.fontWeight.bold, color: theme.colors.primary }}>
          🐙 GitHub Integration
        </h1>
        <p style={{ fontSize: theme.typography.fontSize.lg, color: theme.colors.textSecondary }}>
          Connect your GitHub repository and configure which agents can create issues automatically
        </p>
      </div>

      <Row>
        <Col md={6}>
          {/* Configuration Card */}
          <Card className="mb-4">
            <Card.Header>
              <h5 style={{ margin: 0 }}>⚙️ Step 1: Connect GitHub Repository</h5>
            </Card.Header>
            <Card.Body>
              <Alert variant="info">
                <strong>Setup Instructions:</strong>
                <ol className="mb-0 mt-2">
                  <li>Go to <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer">GitHub Settings → Personal Access Tokens</a></li>
                  <li>Create a fine-grained token with <code>Issues</code> and <code>Contents</code> permissions</li>
                  <li>Grant access to your repository</li>
                  <li>Paste token below</li>
                </ol>
              </Alert>

              <Form.Group className="mb-3">
                <Form.Label>GitHub Personal Access Token</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                />
                <Form.Text className="text-muted">
                  Token needs 'repo' permissions to create issues
                </Form.Text>
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
                  placeholder="agent-platform"
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value)}
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
                {isConnecting ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Connecting...
                  </>
                ) : (
                  'Connect GitHub'
                )}
              </Button>

              {connectionStatus && (
                <Alert variant={connectionStatus.success ? 'success' : 'danger'} className="mt-3 mb-0">
                  {connectionStatus.success ? (
                    <>
                      <strong>✓ Connected Successfully!</strong>
                      <div className="mt-2">
                        <div>Repository: {connectionStatus.repository?.name}</div>
                        <div>Issues Enabled: {connectionStatus.repository?.hasIssues ? 'Yes' : 'No'}</div>
                        <div>
                          <a href={connectionStatus.repository?.url} target="_blank" rel="noopener noreferrer">
                            View on GitHub →
                          </a>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <strong>✗ Connection Failed</strong>
                      <div className="mt-1">{connectionStatus.error}</div>
                    </>
                  )}
                </Alert>
              )}
            </Card.Body>
          </Card>

          {/* Agent Selection Card */}
          <Card>
            <Card.Header>
              <h5 style={{ margin: 0 }}>🤖 Step 2: Select Agents for GitHub Integration</h5>
            </Card.Header>
            <Card.Body>
              <Alert variant="info">
                <strong>How it works:</strong>
                <div className="mt-2">
                  When you run these agents (via UI, CLI, or IDE), they will automatically create GitHub issues for any problems they find.
                </div>
              </Alert>

              <div className="mb-3">
                <strong>Select agents to integrate:</strong>
              </div>

              {availableAgents.map(agent => (
                <Form.Check
                  key={agent.id}
                  type="checkbox"
                  id={`agent-${agent.id}`}
                  className="mb-3"
                  checked={selectedAgents.includes(agent.id)}
                  onChange={() => toggleAgent(agent.id)}
                  disabled={!connectionStatus?.success}
                  label={
                    <div>
                      <div className="fw-bold">{agent.name}</div>
                      <div className="text-muted small">{agent.description}</div>
                    </div>
                  }
                />
              ))}

              <Button
                variant="success"
                size="lg"
                onClick={saveIntegration}
                disabled={!connectionStatus?.success || selectedAgents.length === 0 || isSaving}
                className="w-100 mt-3"
              >
                {isSaving ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Saving Integration...
                  </>
                ) : (
                  '💾 Save Integration'
                )}
              </Button>

              {saveStatus && (
                <Alert variant={saveStatus.success ? 'success' : 'danger'} className="mt-3 mb-0">
                  {saveStatus.success ? (
                    <>
                      <strong>✓ Integration Saved!</strong>
                      <div className="mt-2">
                        {selectedAgents.length} agent(s) configured to create GitHub issues automatically.
                      </div>
                    </>
                  ) : (
                    <>
                      <strong>✗ Save Failed</strong>
                      <div className="mt-1">{saveStatus.error}</div>
                    </>
                  )}
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          {/* Recent Issues Card */}
          <Card className="mb-4">
            <Card.Header>
              <h5 style={{ margin: 0 }}>📋 Recent GitHub Issues</h5>
            </Card.Header>
            <Card.Body>
              {!connectionStatus?.success ? (
                <div className="text-center text-muted py-5">
                  <div style={{ fontSize: '3rem' }}>🎫</div>
                  <p>Connect to GitHub to see recent issues</p>
                </div>
              ) : (
                <div className="text-center text-muted py-5">
                  <div style={{ fontSize: '3rem' }}>✅</div>
                  <p>Connected to {connectionStatus.repository?.name}</p>
                  <p className="small">Run agents to automatically create issues for findings</p>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* How It Works */}
          <Card>
            <Card.Header>
              <h5 style={{ margin: 0 }}>💡 How It Works</h5>
            </Card.Header>
            <Card.Body>
              <ol>
                <li className="mb-3">
                  <strong>Connect GitHub:</strong> Establish connection to your repository
                </li>
                <li className="mb-3">
                  <strong>Select Agents:</strong> Choose which agents can create issues automatically
                </li>
                <li className="mb-3">
                  <strong>Run Agents:</strong> Execute agents via:
                  <ul className="mt-1">
                    <li>AgentHub UI (Agents page)</li>
                    <li>CLI: <code>agenthub run code-reviewer</code></li>
                    <li>IDE integration</li>
                  </ul>
                </li>
                <li>
                  <strong>Auto-Create Issues:</strong> When agents find problems, they automatically create detailed GitHub issues with:
                  <ul className="mt-1">
                    <li>Problem description</li>
                    <li>Code location</li>
                    <li>Fix recommendations</li>
                    <li>Severity labels</li>
                  </ul>
                </li>
              </ol>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default GitHubIntegrationDemo;
