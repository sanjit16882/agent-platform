/**
 * Dynamic Agent Executor - Real AI-Powered Execution with Better UI
 */

import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert, Spinner, Badge, Accordion } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import CodeHighlighter from './CodeHighlighter';

interface ExecutionResult {
  executionId: string;
  status: string;
  results: {
    summary: string;
    mainOutput: string;
    additionalFiles?: Array<{ name: string; content: string }>;
    recommendations?: string[];
    nextSteps?: string[];
    metadata?: any;
  };
  metadata: {
    duration: number;
    model: string;
    tokensUsed?: number;
    platformActions?: Array<{
      platform: string;
      action: string;
      status: string;
      details: any;
    }>;
    mcpCalls?: any[];
  };
}

const DynamicAgentExecutor: React.FC = () => {
  const { agentId } = useParams<{ agentId: string }>();
  const navigate = useNavigate();

  const [agentInfo, setAgentInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [taskDescription, setTaskDescription] = useState('');
  const [additionalInputs, setAdditionalInputs] = useState('');
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002';

  // Fetch agent information
  useEffect(() => {
    const fetchAgentInfo = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/v1/agents/${agentId}`);
        if (response.data.success) {
          setAgentInfo(response.data.data);
        }
      } catch (err) {
        // If agent info not found, use default info based on agentId
        console.log('Using default agent info for:', agentId);
        setAgentInfo({
          name: getAgentName(agentId || ''),
          description: 'AI-powered agent for intelligent task execution',
          category: getAgentCategory(agentId || ''),
          type: 'dynamic',
          capabilities: [
            'Natural language task understanding',
            'Dynamic execution strategy',
            'Platform integration detection',
            'Real-time result generation',
            'Context-aware processing'
          ]
        });
      } finally {
        setLoading(false);
      }
    };

    if (agentId) {
      fetchAgentInfo();
    }
  }, [agentId, API_BASE_URL]);

  // Helper functions to get agent info from ID
  const getAgentName = (id: string): string => {
    const names: Record<string, string> = {
      'qe-test-generator-v2': 'QE Test Generator Pro',
      'devops-monitor-v1': 'DevOps Infrastructure Monitor',
      'security-scanner-v1': 'Security Vulnerability Scanner',
      'business-analyst-v1': 'Business Data Analyst',
      'github-mcp': 'GitHub MCP Agent',
      'slack-mcp': 'Slack Integration Agent'
    };
    return names[id] || id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const getAgentCategory = (id: string): string => {
    if (id.includes('qe') || id.includes('test')) return 'QE';
    if (id.includes('devops') || id.includes('monitor')) return 'DevOps';
    if (id.includes('security') || id.includes('scanner')) return 'Security';
    if (id.includes('business') || id.includes('analyst')) return 'Business';
    if (id.includes('mcp')) return 'Integration';
    return 'General';
  };

  const handleExecute = async () => {
    if (!taskDescription.trim()) {
      setError('Please describe what you want the agent to do');
      return;
    }

    setExecuting(true);
    setError(null);
    setResult(null);

    try {
      console.log('🚀 Executing agent dynamically:', agentId);

      let parsedInputs: any = {};
      if (additionalInputs.trim()) {
        try {
          parsedInputs = JSON.parse(additionalInputs);
        } catch {
          parsedInputs = { additionalContext: additionalInputs };
        }
      }

      const response = await axios.post(
        `${API_BASE_URL}/api/v1/agents/${agentId}/execute`,
        {
          taskDescription,
          inputs: {
            taskDescription,
            ...parsedInputs
          },
          context: {
            executionMode: 'ui',
            mcpServers: [],
            integrations: []
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setResult(response.data);
      } else {
        setError(response.data.error || 'Execution failed');
      }
    } catch (err: any) {
      console.error('❌ Execution error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to execute agent');
    } finally {
      setExecuting(false);
    }
  };

  if (loading) {
    return (
      <Container className="py-4">
        <div className="text-center">
          <Spinner animation="border" />
          <p className="mt-2">Loading agent...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4" style={{ backgroundColor: '#f8f9fa' }}>
      {/* Version indicator - if you see this, the new version loaded! */}
      <Alert variant="success" className="mb-3 text-center">
        <strong>✅ NEW LAYOUT LOADED!</strong> Two-column design with agent info sidebar
      </Alert>
      
      <Row className="mb-3">
        <Col>
          <Button variant="outline-secondary" size="sm" onClick={() => navigate('/catalog')}>
            ← Back to Catalog
          </Button>
        </Col>
      </Row>

      <Row>
        {/* Left Column - Agent Info */}
        <Col md={4}>
          <Card className="mb-3">
            <Card.Header>
              <h6 className="mb-0">📋 Agent Info</h6>
            </Card.Header>
            <Card.Body>
              <h5>{agentInfo?.name || 'Agent'}</h5>
              <p className="text-muted small">{agentInfo?.description || `Agent ID: ${agentId}`}</p>
              
              {agentInfo?.category && (
                <p className="mb-2">
                  <Badge bg="primary">{agentInfo.category}</Badge>
                  {agentInfo.type && <Badge bg="secondary" className="ms-2">{agentInfo.type}</Badge>}
                </p>
              )}

              {agentInfo?.capabilities && agentInfo.capabilities.length > 0 && (
                <>
                  <p className="small mb-1"><strong>Capabilities:</strong></p>
                  <ul className="small mb-0">
                    {agentInfo.capabilities.slice(0, 5).map((cap: string, idx: number) => (
                      <li key={idx}>{cap}</li>
                    ))}
                  </ul>
                </>
              )}
            </Card.Body>
          </Card>

          {/* Execution Tips */}
          <Card className="mb-3 border-info">
            <Card.Header className="bg-info text-white">
              <h6 className="mb-0">💡 Tips</h6>
            </Card.Header>
            <Card.Body>
              <ul className="small mb-0">
                <li>Describe your task in natural language</li>
                <li>Be specific about requirements</li>
                <li>Mention platforms (GitHub, Slack) for integrations</li>
                <li>Add context in the optional field</li>
              </ul>
            </Card.Body>
          </Card>
        </Col>

        {/* Right Column - Execution */}
        <Col md={8}>
          <Card className="mb-3">
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">🚀 Execute Agent</h5>
            </Card.Header>
            <Card.Body>
              {error && (
                <Alert variant="danger" dismissible onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}

              <Form>
                <Form.Group className="mb-3">
                  <Form.Label><strong>Task Description</strong></Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={6}
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    placeholder="Describe what you want this agent to do. For example:

• Generate Selenium tests for a login page at https://example.com/login
• Analyze my AWS infrastructure and suggest cost optimizations  
• Create a security audit report for my Kubernetes cluster
• Build API tests for my REST endpoints
• Generate a sales forecast based on historical data

The agent will understand your requirements and produce appropriate results."
                    disabled={executing}
                  />
                </Form.Group>

                <Accordion className="mb-3">
                  <Accordion.Item eventKey="0">
                    <Accordion.Header>Additional Context (Optional)</Accordion.Header>
                    <Accordion.Body>
                      <Form.Control
                        as="textarea"
                        rows={4}
                        value={additionalInputs}
                        onChange={(e) => setAdditionalInputs(e.target.value)}
                        placeholder='Provide additional context as JSON or plain text

Example JSON:
{
  "url": "https://example.com",
  "credentials": "test@example.com / password123",
  "environment": "staging"
}'
                        disabled={executing}
                      />
                    </Accordion.Body>
                  </Accordion.Item>
                </Accordion>

                <div className="d-grid">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleExecute}
                    disabled={executing || !taskDescription.trim()}
                  >
                    {executing ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Executing Agent...
                      </>
                    ) : (
                      '▶️ Execute Agent'
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>

          {/* Results Section */}
          {result && (
            <Card className="mb-3">
              <Card.Header className="d-flex justify-content-between align-items-center bg-success text-white">
                <h5 className="mb-0">✅ Execution Complete</h5>
                <Badge bg="light" text="dark">ID: {result.executionId}</Badge>
              </Card.Header>
              <Card.Body>
                {/* Summary */}
                <div className="mb-4">
                  <h6 className="text-primary">📝 Summary</h6>
                  <p>{result.results.summary}</p>
                </div>

                {/* Main Output */}
                <div className="mb-4">
                  <h6 className="text-primary">📄 Main Output</h6>
                  <Card className="bg-light">
                    <Card.Body>
                      <CodeHighlighter 
                        code={result.results.mainOutput} 
                        language="text"
                      />
                    </Card.Body>
                  </Card>
                </div>

                {/* Additional Files */}
                {result.results.additionalFiles && result.results.additionalFiles.length > 0 && (
                  <div className="mb-4">
                    <h6 className="text-primary">📁 Generated Files</h6>
                    <Row>
                      {result.results.additionalFiles.map((file, index) => (
                        <Col md={12} key={index} className="mb-3">
                          <Card>
                            <Card.Header className="d-flex justify-content-between align-items-center">
                              <strong>{file.name}</strong>
                              <Badge bg="secondary">File</Badge>
                            </Card.Header>
                            <Card.Body>
                              <CodeHighlighter 
                                code={file.content} 
                                language={file.name.endsWith('.json') ? 'json' : 
                                         file.name.endsWith('.py') ? 'python' :
                                         file.name.endsWith('.js') ? 'javascript' : 'text'}
                              />
                            </Card.Body>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  </div>
                )}

                {/* Recommendations */}
                {result.results.recommendations && result.results.recommendations.length > 0 && (
                  <div className="mb-4">
                    <h6 className="text-primary">💡 Recommendations</h6>
                    <Card className="border-warning">
                      <Card.Body>
                        <ul className="mb-0">
                          {result.results.recommendations.map((rec, index) => (
                            <li key={index}>{rec}</li>
                          ))}
                        </ul>
                      </Card.Body>
                    </Card>
                  </div>
                )}

                {/* Next Steps */}
                {result.results.nextSteps && result.results.nextSteps.length > 0 && (
                  <div className="mb-4">
                    <h6 className="text-primary">📋 Next Steps</h6>
                    <Card className="border-info">
                      <Card.Body>
                        <ol className="mb-0">
                          {result.results.nextSteps.map((step, index) => (
                            <li key={index}>{step}</li>
                          ))}
                        </ol>
                      </Card.Body>
                    </Card>
                  </div>
                )}

                {/* Platform Actions */}
                {result.metadata.platformActions && result.metadata.platformActions.length > 0 && (
                  <div className="mb-4">
                    <h6 className="text-primary">🔗 Platform Integrations</h6>
                    <Row>
                      {result.metadata.platformActions.map((action, index) => (
                        <Col md={6} key={index} className="mb-3">
                          <Card className="border-primary">
                            <Card.Header className="d-flex justify-content-between align-items-center">
                              <strong className="text-uppercase">{action.platform}</strong>
                              <Badge bg={action.status === 'success' ? 'success' : 'warning'}>
                                {action.status}
                              </Badge>
                            </Card.Header>
                            <Card.Body>
                              <p className="mb-2"><strong>Action:</strong> {action.action.replace(/_/g, ' ')}</p>
                              {action.details && (
                                <pre className="small mb-0" style={{ 
                                  background: '#f8f9fa', 
                                  padding: '0.5rem',
                                  borderRadius: '4px',
                                  maxHeight: '150px',
                                  overflow: 'auto'
                                }}>
                                  {JSON.stringify(action.details, null, 2)}
                                </pre>
                              )}
                            </Card.Body>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  </div>
                )}

                {/* Execution Metadata */}
                <Card className="bg-light border-0">
                  <Card.Body className="py-2">
                    <Row className="small text-muted">
                      <Col md={3}>
                        <strong>Duration:</strong> {result.metadata.duration}ms
                      </Col>
                      <Col md={3}>
                        <strong>Model:</strong> {result.metadata.model}
                      </Col>
                      {result.metadata.tokensUsed && (
                        <Col md={3}>
                          <strong>Tokens:</strong> {result.metadata.tokensUsed}
                        </Col>
                      )}
                      <Col md={3}>
                        <strong>Platform Actions:</strong> {result.metadata.platformActions?.length || 0}
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default DynamicAgentExecutor;
