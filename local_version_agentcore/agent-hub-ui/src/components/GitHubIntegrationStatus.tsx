import React, { useState, useEffect } from 'react';
import { Alert, Badge, Button, Spinner, ListGroup, Card, Row, Col } from 'react-bootstrap';

interface GitHubIntegrationStatusProps {
  agentId: string;
  agentName?: string;
  executionResults?: any;
  onIssuesCreated?: (issues: any[]) => void;
}

interface IntegrationConfig {
  type: 'github' | 'jira' | 'slack' | 'teams';
  connected: boolean;
  config: any;
  purpose: string;
  actions: string[];
}

const GitHubIntegrationStatus: React.FC<GitHubIntegrationStatusProps> = ({ 
  agentId,
  agentName,
  executionResults,
  onIssuesCreated 
}) => {
  const [integrations, setIntegrations] = useState<IntegrationConfig[]>([]);
  const [creatingIssues, setCreatingIssues] = useState(false);
  const [createdIssues, setCreatedIssues] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Check all integrations for this agent
  useEffect(() => {
    const checkIntegrations = () => {
      const activeIntegrations: IntegrationConfig[] = [];

      // Check GitHub integration
      const githubSaved = localStorage.getItem('github_integration');
      if (githubSaved) {
        const githubConfig = JSON.parse(githubSaved);
        if (githubConfig.connected && githubConfig.agents && githubConfig.agents.includes(agentId)) {
          activeIntegrations.push({
            type: 'github',
            connected: true,
            config: githubConfig,
            purpose: 'Automatically create GitHub issues for findings',
            actions: [
              'Create issues for vulnerabilities, bugs, and code review findings',
              'Add labels based on severity and type',
              'Link issues to agent execution results',
              `Repository: ${githubConfig.owner}/${githubConfig.repo}`
            ]
          });
        }
      }

      // Check Jira integration (placeholder for future)
      const jiraSaved = localStorage.getItem('jira_integration');
      if (jiraSaved) {
        const jiraConfig = JSON.parse(jiraSaved);
        if (jiraConfig.connected && jiraConfig.agents && jiraConfig.agents.includes(agentId)) {
          activeIntegrations.push({
            type: 'jira',
            connected: true,
            config: jiraConfig,
            purpose: 'Create Jira tickets for tracking and resolution',
            actions: [
              'Create tickets in configured Jira project',
              'Assign priority based on severity',
              'Link to sprint/epic if configured',
              `Project: ${jiraConfig.project}`
            ]
          });
        }
      }

      // Check Slack integration (placeholder for future)
      const slackSaved = localStorage.getItem('slack_integration');
      if (slackSaved) {
        const slackConfig = JSON.parse(slackSaved);
        if (slackConfig.connected && slackConfig.agents && slackConfig.agents.includes(agentId)) {
          activeIntegrations.push({
            type: 'slack',
            connected: true,
            config: slackConfig,
            purpose: 'Send real-time notifications to Slack channels',
            actions: [
              'Post execution summary to configured channel',
              'Alert on critical findings',
              'Share reports with team members',
              `Channel: #${slackConfig.channel}`
            ]
          });
        }
      }

      // Check Teams integration (placeholder for future)
      const teamsSaved = localStorage.getItem('teams_integration');
      if (teamsSaved) {
        const teamsConfig = JSON.parse(teamsSaved);
        if (teamsConfig.connected && teamsConfig.agents && teamsConfig.agents.includes(agentId)) {
          activeIntegrations.push({
            type: 'teams',
            connected: true,
            config: teamsConfig,
            purpose: 'Send notifications to Microsoft Teams',
            actions: [
              'Post execution results to Teams channel',
              'Create adaptive cards for findings',
              'Enable team collaboration on issues',
              `Team: ${teamsConfig.team}`
            ]
          });
        }
      }

      setIntegrations(activeIntegrations);
    };
    
    checkIntegrations();
  }, [agentId]);

  // Auto-create issues when execution completes with findings
  useEffect(() => {
    const githubIntegration = integrations.find(i => i.type === 'github');
    if (githubIntegration && executionResults && !creatingIssues && createdIssues.length === 0) {
      createGitHubIssues(githubIntegration.config);
    }
  }, [executionResults, integrations]);

  const createGitHubIssues = async (githubConfig: any) => {
    if (!githubConfig || !executionResults) return;

    setCreatingIssues(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:4002/api/v1/github/create-issues-from-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId,
          results: executionResults,
          githubConfig
        })
      });

      const result = await response.json();
      
      if (result.success && result.issues) {
        setCreatedIssues(result.issues);
        if (onIssuesCreated) {
          onIssuesCreated(result.issues);
        }
      } else {
        setError(result.error || 'Failed to create issues');
      }
    } catch (err) {
      setError('Failed to connect to backend');
    } finally {
      setCreatingIssues(false);
    }
  };

  const getIntegrationIcon = (type: string) => {
    switch (type) {
      case 'github': return '🐙';
      case 'jira': return '📋';
      case 'slack': return '💬';
      case 'teams': return '👥';
      default: return '🔗';
    }
  };

  const getIntegrationColor = (type: string) => {
    switch (type) {
      case 'github': return 'success';
      case 'jira': return 'primary';
      case 'slack': return 'warning';
      case 'teams': return 'info';
      default: return 'secondary';
    }
  };

  if (integrations.length === 0) {
    return null; // No integrations configured
  }

  return (
    <div className="mb-4">
      <Card>
        <Card.Header className="bg-light">
          <h5 className="mb-0">
            🔗 Active Integrations
            {agentName && <small className="text-muted ms-2">for {agentName}</small>}
          </h5>
        </Card.Header>
        <Card.Body>
          <Row>
            {integrations.map((integration) => (
              <Col md={6} key={integration.type} className="mb-3">
                <Card className={`border-${getIntegrationColor(integration.type)}`}>
                  <Card.Header className={`bg-${getIntegrationColor(integration.type)} text-white`}>
                    <div className="d-flex justify-content-between align-items-center">
                      <span>
                        {getIntegrationIcon(integration.type)} {integration.type.toUpperCase()}
                      </span>
                      <Badge bg="light" text="dark">Active</Badge>
                    </div>
                  </Card.Header>
                  <Card.Body>
                    <p className="mb-2"><strong>Purpose:</strong></p>
                    <p className="text-muted small">{integration.purpose}</p>
                    
                    <p className="mb-2 mt-3"><strong>What will happen:</strong></p>
                    <ul className="small mb-0">
                      {integration.actions.map((action, idx) => (
                        <li key={idx}>{action}</li>
                      ))}
                    </ul>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

          {creatingIssues && (
            <Alert variant="info" className="mt-3">
              <Spinner animation="border" size="sm" className="me-2" />
              Processing integrations and creating issues...
            </Alert>
          )}

          {error && (
            <Alert variant="danger" className="mt-3">
              <strong>Integration Error:</strong> {error}
            </Alert>
          )}

          {createdIssues.length > 0 && (
            <Alert variant="success" className="mt-3">
              <h6>✅ Created {createdIssues.length} GitHub Issue(s)</h6>
              <ListGroup className="mt-2">
                {createdIssues.map((issue) => (
                  <ListGroup.Item key={issue.number} className="d-flex justify-content-between align-items-center">
                    <div>
                      <Badge bg="success" className="me-2">#{issue.number}</Badge>
                      <strong>{issue.title}</strong>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline-primary" 
                      href={issue.url} 
                      target="_blank"
                    >
                      View on GitHub →
                    </Button>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Alert>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default GitHubIntegrationStatus;
