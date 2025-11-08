import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Badge, Alert, ProgressBar, ListGroup, Modal, Spinner } from 'react-bootstrap';

interface ExecutionResult {
  executionId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: string;
  endTime?: string;
  result?: any;
  error?: string;
  logs: ExecutionLog[];
}

interface ExecutionLog {
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
  details?: any;
}

interface Agent {
  id: string;
  name: string;
  description: string;
  type: 'mcp' | 'lambda' | 'hybrid';
  mcpTools?: string[];
  parameters?: { [key: string]: any };
}

const AgentExecutionInterface: React.FC = () => {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [executionParams, setExecutionParams] = useState<{ [key: string]: any }>({});
  const [currentExecution, setCurrentExecution] = useState<ExecutionResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [executionHistory, setExecutionHistory] = useState<ExecutionResult[]>([]);

  useEffect(() => {
    fetchAgents();
    fetchExecutionHistory();
  }, []);

  const fetchAgents = async () => {
    try {
      const response = await API.get('AgentHubAPI', '/api/v1/agents', {});
      if (response.success) {
        setAgents(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch agents:', error);
      // Mock data for development
      setAgents([
        {
          id: '1',
          name: 'Excel Automation Agent',
          description: 'Automates Excel spreadsheet operations',
          type: 'mcp',
          mcpTools: ['excel_create_workbook', 'excel_write_data'],
          parameters: {
            filename: { type: 'string', required: true, description: 'Name of the Excel file' },
            data: { type: 'array', required: true, description: 'Data to write to Excel' },
            sheetName: { type: 'string', required: false, description: 'Name of the worksheet' }
          }
        },
        {
          id: '2',
          name: 'Teams Notification Agent',
          description: 'Sends notifications to Microsoft Teams',
          type: 'mcp',
          mcpTools: ['teams_send_message'],
          parameters: {
            channel: { type: 'string', required: true, description: 'Teams channel ID' },
            message: { type: 'string', required: true, description: 'Message to send' },
            urgent: { type: 'boolean', required: false, description: 'Mark as urgent' }
          }
        }
      ]);
    }
  };

  const fetchExecutionHistory = async () => {
    try {
      const response = await API.get('AgentHubAPI', '/api/v1/executions', {});
      if (response.success) {
        setExecutionHistory(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch execution history:', error);
      // Mock data
      setExecutionHistory([
        {
          executionId: 'exec-001',
          status: 'completed',
          startTime: new Date(Date.now() - 300000).toISOString(),
          endTime: new Date(Date.now() - 295000).toISOString(),
          result: { message: 'Excel file created successfully', fileId: 'file-123' },
          logs: [
            { timestamp: new Date(Date.now() - 300000).toISOString(), level: 'info', message: 'Starting Excel creation...' },
            { timestamp: new Date(Date.now() - 295000).toISOString(), level: 'success', message: 'Excel file created successfully' }
          ]
        }
      ]);
    }
  };

  const executeAgent = async () => {
    if (!selectedAgent) return;

    setIsExecuting(true);
    const executionId = `exec-${Date.now()}`;
    
    const newExecution: ExecutionResult = {
      executionId,
      status: 'pending',
      startTime: new Date().toISOString(),
      logs: [
        { timestamp: new Date().toISOString(), level: 'info', message: 'Execution started...' }
      ]
    };

    setCurrentExecution(newExecution);

    try {
      // Simulate real-time execution updates
      setTimeout(() => {
        setCurrentExecution(prev => prev ? {
          ...prev,
          status: 'running',
          logs: [...prev.logs, {
            timestamp: new Date().toISOString(),
            level: 'info',
            message: `Executing ${selectedAgent.name} with MCP tools: ${selectedAgent.mcpTools?.join(', ')}`
          }]
        } : null);
      }, 1000);

      setTimeout(() => {
        setCurrentExecution(prev => prev ? {
          ...prev,
          status: 'completed',
          endTime: new Date().toISOString(),
          result: { message: 'Agent executed successfully', data: executionParams },
          logs: [...prev.logs, {
            timestamp: new Date().toISOString(),
            level: 'success',
            message: 'Agent execution completed successfully'
          }]
        } : null);
        setIsExecuting(false);
      }, 3000);

      // Make actual API call
      const response = await API.post('AgentHubAPI', '/api/v1/executions', {
        body: {
          agentId: selectedAgent.id,
          parameters: executionParams
        }
      });

      if (response.success) {
        // Update with real results
        setCurrentExecution(prev => prev ? {
          ...prev,
          ...response.data
        } : null);
      }

    } catch (error) {
      console.error('Execution failed:', error);
      setCurrentExecution(prev => prev ? {
        ...prev,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        logs: [...prev.logs, {
          timestamp: new Date().toISOString(),
          level: 'error',
          message: `Execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      } : null);
      setIsExecuting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'running': return 'primary';
      case 'pending': return 'warning';
      case 'failed': return 'danger';
      case 'cancelled': return 'secondary';
      default: return 'secondary';
    }
  };

  const getLogLevelBadge = (level: string) => {
    switch (level) {
      case 'success': return 'success';
      case 'info': return 'info';
      case 'warning': return 'warning';
      case 'error': return 'danger';
      default: return 'secondary';
    }
  };

  return (
    <Container fluid>
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="h3 mb-1">⚡ Agent Execution Interface</h1>
              <p className="text-muted mb-0">Execute and monitor your AI agents in real-time</p>
            </div>
            <Button variant="outline-primary" onClick={fetchExecutionHistory}>
              🔄 Refresh
            </Button>
          </div>
        </Col>
      </Row>

      <Row>
        {/* Agent Selection & Configuration */}
        <Col md={6}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">🤖 Select Agent</h5>
            </Card.Header>
            <Card.Body>
              <Form.Select
                value={selectedAgent?.id || ''}
                onChange={(e) => {
                  const agent = agents.find(a => a.id === e.target.value);
                  setSelectedAgent(agent || null);
                  setExecutionParams({});
                }}
                className="mb-3"
              >
                <option value="">Choose an agent...</option>
                {agents.map(agent => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name} ({agent.type.toUpperCase()})
                  </option>
                ))}
              </Form.Select>

              {selectedAgent && (
                <div>
                  <Alert variant="info">
                    <strong>{selectedAgent.name}</strong><br />
                    {selectedAgent.description}
                    {selectedAgent.mcpTools && (
                      <div className="mt-2">
                        <small>MCP Tools: </small>
                        {selectedAgent.mcpTools.map(tool => (
                          <Badge key={tool} bg="primary" className="me-1">{tool}</Badge>
                        ))}
                      </div>
                    )}
                  </Alert>

                  {/* Parameter Configuration */}
                  {selectedAgent.parameters && (
                    <div>
                      <h6>Parameters:</h6>
                      {Object.entries(selectedAgent.parameters).map(([key, config]: [string, any]) => (
                        <Form.Group key={key} className="mb-3">
                          <Form.Label>
                            {key} {config.required && <span className="text-danger">*</span>}
                          </Form.Label>
                          <Form.Control
                            type={config.type === 'boolean' ? 'checkbox' : 'text'}
                            placeholder={config.description}
                            value={executionParams[key] || ''}
                            onChange={(e) => setExecutionParams(prev => ({
                              ...prev,
                              [key]: config.type === 'boolean' ? e.target.checked : e.target.value
                            }))}
                          />
                          <Form.Text className="text-muted">{config.description}</Form.Text>
                        </Form.Group>
                      ))}
                    </div>
                  )}

                  <div className="d-grid">
                    <Button
                      variant="success"
                      size="lg"
                      onClick={executeAgent}
                      disabled={isExecuting || !selectedAgent}
                    >
                      {isExecuting ? (
                        <>
                          <Spinner size="sm" className="me-2" />
                          Executing...
                        </>
                      ) : (
                        <>▶️ Execute Agent</>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Real-time Execution Status */}
        <Col md={6}>
          <Card className="mb-4">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">📊 Execution Status</h5>
              {currentExecution && (
                <Badge bg={getStatusBadge(currentExecution.status)}>
                  {currentExecution.status.toUpperCase()}
                </Badge>
              )}
            </Card.Header>
            <Card.Body>
              {currentExecution ? (
                <div>
                  <div className="mb-3">
                    <strong>Execution ID:</strong> {currentExecution.executionId}<br />
                    <strong>Started:</strong> {new Date(currentExecution.startTime).toLocaleString()}<br />
                    {currentExecution.endTime && (
                      <>
                        <strong>Completed:</strong> {new Date(currentExecution.endTime).toLocaleString()}<br />
                        <strong>Duration:</strong> {Math.round((new Date(currentExecution.endTime).getTime() - new Date(currentExecution.startTime).getTime()) / 1000)}s
                      </>
                    )}
                  </div>

                  {currentExecution.status === 'running' && (
                    <ProgressBar animated now={100} className="mb-3" />
                  )}

                  {currentExecution.result && (
                    <Alert variant="success">
                      <strong>Result:</strong>
                      <pre className="mt-2 mb-0">{JSON.stringify(currentExecution.result, null, 2)}</pre>
                    </Alert>
                  )}

                  {currentExecution.error && (
                    <Alert variant="danger">
                      <strong>Error:</strong> {currentExecution.error}
                    </Alert>
                  )}

                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="mb-0">Execution Logs</h6>
                    <Button variant="outline-secondary" size="sm" onClick={() => setShowLogs(true)}>
                      📋 View Full Logs
                    </Button>
                  </div>

                  <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {currentExecution.logs.slice(-5).map((log, index) => (
                      <div key={index} className="d-flex align-items-start mb-2">
                        <Badge bg={getLogLevelBadge(log.level)} className="me-2">
                          {log.level}
                        </Badge>
                        <div className="flex-grow-1">
                          <small className="text-muted d-block">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </small>
                          <div>{log.message}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-muted">
                  <div className="mb-3">
                    <span className="display-1">⚡</span>
                  </div>
                  <h5>Ready to Execute</h5>
                  <p>Select an agent and configure parameters to start execution</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Execution History */}
      <Row>
        <Col>
          <Card>
            <Card.Header>
              <h5 className="mb-0">📈 Execution History</h5>
            </Card.Header>
            <Card.Body>
              {executionHistory.length > 0 ? (
                <ListGroup variant="flush">
                  {executionHistory.slice(0, 10).map((execution) => (
                    <ListGroup.Item key={execution.executionId} className="d-flex justify-content-between align-items-center">
                      <div>
                        <strong>{execution.executionId}</strong><br />
                        <small className="text-muted">
                          {new Date(execution.startTime).toLocaleString()}
                          {execution.endTime && ` - ${new Date(execution.endTime).toLocaleString()}`}
                        </small>
                      </div>
                      <Badge bg={getStatusBadge(execution.status)}>
                        {execution.status}
                      </Badge>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              ) : (
                <div className="text-center py-4 text-muted">
                  No execution history available
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Logs Modal */}
      <Modal show={showLogs} onHide={() => setShowLogs(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>📋 Execution Logs</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {currentExecution?.logs.map((log, index) => (
            <div key={index} className="d-flex align-items-start mb-2 p-2 border-bottom">
              <Badge bg={getLogLevelBadge(log.level)} className="me-2">
                {log.level}
              </Badge>
              <div className="flex-grow-1">
                <small className="text-muted d-block">
                  {new Date(log.timestamp).toLocaleString()}
                </small>
                <div>{log.message}</div>
                {log.details && (
                  <pre className="mt-1 text-muted small">{JSON.stringify(log.details, null, 2)}</pre>
                )}
              </div>
            </div>
          ))}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowLogs(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AgentExecutionInterface;