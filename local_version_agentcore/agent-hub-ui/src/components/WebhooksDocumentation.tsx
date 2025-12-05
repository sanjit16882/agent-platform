import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Badge, Alert, Table, Form } from 'react-bootstrap';
import { theme } from '../styles/theme';

const WebhooksDocumentation: React.FC = () => {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>(['execution.completed']);

  const events = [
    { id: 'execution.started', name: 'Execution Started', description: 'Triggered when an agent execution begins' },
    { id: 'execution.completed', name: 'Execution Completed', description: 'Triggered when an agent execution finishes successfully' },
    { id: 'execution.failed', name: 'Execution Failed', description: 'Triggered when an agent execution fails' },
    { id: 'agent.created', name: 'Agent Created', description: 'Triggered when a new agent is created' },
    { id: 'agent.updated', name: 'Agent Updated', description: 'Triggered when an agent is modified' },
    { id: 'agent.deleted', name: 'Agent Deleted', description: 'Triggered when an agent is removed' }
  ];

  const toggleEvent = (eventId: string) => {
    setSelectedEvents(prev => 
      prev.includes(eventId) 
        ? prev.filter(e => e !== eventId)
        : [...prev, eventId]
    );
  };

  return (
    <Container fluid style={{ 
      padding: theme.spacing['3xl'], 
      backgroundColor: theme.colors.backgroundSecondary,
      minHeight: '100vh'
    }}>
      <div style={{ marginBottom: theme.spacing['3xl'] }}>
        <h1 style={{ 
          fontSize: theme.typography.fontSize['3xl'],
          fontWeight: theme.typography.fontWeight.bold,
          color: theme.colors.primary,
          marginBottom: theme.spacing.sm
        }}>
          🔗 Webhooks & Events
        </h1>
        <p style={{ 
          fontSize: theme.typography.fontSize.lg,
          color: theme.colors.textSecondary
        }}>
          Receive real-time notifications about agent executions and platform events
        </p>
      </div>

      <Alert variant="info" className="mb-4">
        <strong>Event-Driven Integration:</strong> Webhooks allow your application to receive real-time 
        notifications when events occur in AgentHub, enabling reactive workflows and automation.
      </Alert>

      <Row className="mb-4">
        <Col md={8}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">📋 Available Events</h5>
            </Card.Header>
            <Card.Body>
              <Table hover>
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Description</th>
                    <th>Payload</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map(event => (
                    <tr key={event.id}>
                      <td>
                        <code>{event.id}</code>
                      </td>
                      <td>{event.description}</td>
                      <td>
                        <Badge bg="secondary">JSON</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>

          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">🔧 Setup Webhook</h5>
            </Card.Header>
            <Card.Body>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Webhook URL</Form.Label>
                  <Form.Control
                    type="url"
                    placeholder="https://your-app.com/webhooks/agenthub"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                  />
                  <Form.Text className="text-muted">
                    Your endpoint must accept POST requests and return 200 OK
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Subscribe to Events</Form.Label>
                  {events.map(event => (
                    <Form.Check
                      key={event.id}
                      type="checkbox"
                      id={event.id}
                      label={event.name}
                      checked={selectedEvents.includes(event.id)}
                      onChange={() => toggleEvent(event.id)}
                    />
                  ))}
                </Form.Group>

                <Button variant="primary">Create Webhook</Button>
              </Form>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <h5 className="mb-0">💻 Webhook Handler Example</h5>
            </Card.Header>
            <Card.Body>
              <pre className="bg-dark text-light p-3 rounded">
                <code>{`// Express.js Webhook Handler
app.post('/webhooks/agenthub', (req, res) => {
  const { event, data, timestamp } = req.body;
  
  console.log('Received webhook:', event);
  
  switch (event) {
    case 'execution.completed':
      handleExecutionCompleted(data);
      break;
    case 'execution.failed':
      handleExecutionFailed(data);
      break;
    case 'agent.created':
      handleAgentCreated(data);
      break;
    default:
      console.log('Unknown event:', event);
  }
  
  res.status(200).json({ received: true });
});

function handleExecutionCompleted(data) {
  console.log('Agent execution completed:', data.executionId);
  console.log('Results:', data.results);
  
  // Send notification to Slack
  sendSlackNotification({
    channel: '#agent-notifications',
    text: \`✅ Agent execution completed: \${data.agentId}\`,
    attachments: [{
      text: data.results.summary,
      color: 'good'
    }]
  });
}`}</code>
              </pre>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="mb-4">
            <Card.Header>
              <h6 className="mb-0">📊 Webhook Stats</h6>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <div className="d-flex justify-content-between">
                  <span>Active Webhooks:</span>
                  <Badge bg="success">3</Badge>
                </div>
              </div>
              <div className="mb-3">
                <div className="d-flex justify-content-between">
                  <span>Events Delivered:</span>
                  <Badge bg="info">1,247</Badge>
                </div>
              </div>
              <div className="mb-3">
                <div className="d-flex justify-content-between">
                  <span>Success Rate:</span>
                  <Badge bg="success">99.8%</Badge>
                </div>
              </div>
            </Card.Body>
          </Card>

          <Card className="mb-4">
            <Card.Header>
              <h6 className="mb-0">🔒 Security</h6>
            </Card.Header>
            <Card.Body>
              <ul className="small">
                <li>HTTPS required for webhook URLs</li>
                <li>Signature verification with HMAC</li>
                <li>IP whitelist support</li>
                <li>Automatic retry on failures</li>
                <li>Rate limiting protection</li>
              </ul>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <h6 className="mb-0">📖 Resources</h6>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                <Button variant="outline-primary" size="sm">
                  Webhook Guide
                </Button>
                <Button variant="outline-info" size="sm">
                  Event Reference
                </Button>
                <Button variant="outline-success" size="sm">
                  Best Practices
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default WebhooksDocumentation;
