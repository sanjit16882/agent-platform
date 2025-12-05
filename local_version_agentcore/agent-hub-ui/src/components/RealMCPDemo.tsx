/**
 * Real MCP Demo Component
 * Demonstrates the correct MCP flow:
 * User Input → AI Model → Tool Request → MCP Client → MCP Server → Execute → Return → Model Response
 */

import React, { useState } from 'react';
import { Card, Button, Form, Alert, Badge, Spinner } from 'react-bootstrap';

interface MCPStep {
  step: number;
  name: string;
  description: string;
  data: any;
}

interface MCPDemoResult {
  title: string;
  description: string;
  input: string;
  steps: MCPStep[];
  summary: string;
}

export const RealMCPDemo: React.FC = () => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoResult, setDemoResult] = useState<MCPDemoResult | null>(null);
  const [mcpStatus, setMcpStatus] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const exampleInputs = [
    'List files in the current directory',
    'Show me the git commit history',
    'Read the README.md file',
    'Search for JavaScript files',
    'Get database schema information'
  ];

  const checkMCPStatus = async () => {
    try {
      const response = await fetch('http://localhost:3002/api/mcp/real/status', {
        headers: {
          'Authorization': 'sk-agenthub-system-internal-frontend-key',
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setMcpStatus(data.data);
      }
    } catch (error) {
      console.error('Failed to check MCP status:', error);
    }
  };

  const initializeMCP = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3002/api/mcp/real/initialize', {
        method: 'POST',
        headers: {
          'Authorization': 'sk-agenthub-system-internal-frontend-key',
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setMcpStatus(data.data);
        setError(null);
      } else {
        setError(data.error || 'Failed to initialize MCP');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to initialize MCP');
    } finally {
      setLoading(false);
    }
  };

  const runMCPDemo = async () => {
    if (!input.trim()) {
      setError('Please enter some input to demonstrate MCP flow');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('http://localhost:3002/api/mcp/real/demo', {
        method: 'POST',
        headers: {
          'Authorization': 'sk-agenthub-system-internal-frontend-key',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ input })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setDemoResult(data.data);
      } else {
        setError(data.error || 'Demo failed');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Demo failed');
    } finally {
      setLoading(false);
    }
  };

  const executeRealMCP = async () => {
    if (!input.trim()) {
      setError('Please enter some input to execute with MCP');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('http://localhost:3002/api/mcp/real/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          input,
          agentId: 'real-mcp-demo-agent'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Show actual execution result
        alert(`MCP Execution Result:\n\n${data.data.response}\n\nTools Used: ${data.data.metadata.mcpToolsUsed}\nProcessing Time: ${data.data.processingTime}ms`);
      } else {
        setError(data.error || 'Execution failed');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Execution failed');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    checkMCPStatus();
  }, []);

  const getStepIcon = (stepName: string) => {
    switch (stepName) {
      case 'User Input': return '👤';
      case 'AI Model Analysis': return '🧠';
      case 'Tool Request Generation': return '⚙️';
      case 'MCP Client Processing': return '🔄';
      case 'MCP Server Execution': return '🖥️';
      case 'Result Return to Client': return '📤';
      case 'Client Sends Results to Model': return '📥';
      case 'Model Uses Context to Respond': return '💬';
      default: return '🔹';
    }
  };

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          <Card>
            <Card.Header className="bg-primary text-white">
              <h4 className="mb-1">🔌 Real MCP (Model Context Protocol) Demo</h4>
              <p className="mb-0">
                Demonstrates the correct MCP flow: User Input → AI Model → Tool Request → MCP Client → MCP Server → Execute → Return → Model Response
              </p>
            </Card.Header>
            <Card.Body>
              {error && <Alert variant="danger">{error}</Alert>}

              {/* MCP Status */}
              <div className="mb-4">
                <h5>MCP System Status</h5>
                {mcpStatus ? (
                  <div className="d-flex align-items-center gap-3">
                    <Badge bg={mcpStatus.initialized ? 'success' : 'warning'}>
                      {mcpStatus.initialized ? 'Initialized' : 'Not Initialized'}
                    </Badge>
                    <span>Servers: {mcpStatus.connectedServers.length}</span>
                    <span>Tools: {mcpStatus.availableTools}</span>
                    {!mcpStatus.initialized && (
                      <Button size="sm" variant="outline-primary" onClick={initializeMCP} disabled={loading}>
                        Initialize MCP
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="d-flex align-items-center">
                    <Spinner animation="border" size="sm" className="me-2" />
                    Checking MCP status...
                  </div>
                )}
              </div>

              {/* Input Section */}
              <div className="mb-4">
                <h5>Try MCP Integration</h5>
                <Form.Group className="mb-3">
                  <Form.Label>Enter your request:</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="e.g., List files in the current directory, Show git history, Read README.md..."
                  />
                </Form.Group>

                <div className="mb-3">
                  <small className="text-muted">Quick examples:</small>
                  <div className="d-flex flex-wrap gap-2 mt-1">
                    {exampleInputs.map((example, index) => (
                      <Button
                        key={index}
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => setInput(example)}
                      >
                        {example}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="d-flex gap-2">
                  <Button
                    variant="primary"
                    onClick={runMCPDemo}
                    disabled={loading || !input.trim()}
                  >
                    {loading ? <Spinner animation="border" size="sm" className="me-2" /> : null}
                    Show MCP Flow Demo
                  </Button>
                  <Button
                    variant="success"
                    onClick={executeRealMCP}
                    disabled={loading || !input.trim() || !mcpStatus?.initialized}
                  >
                    Execute Real MCP
                  </Button>
                </div>
              </div>

              {/* Demo Results */}
              {demoResult && (
                <div className="mt-4">
                  <h5>MCP Flow Demonstration</h5>
                  <Alert variant="info">
                    <strong>{demoResult.title}</strong><br />
                    {demoResult.description}
                  </Alert>

                  <div className="row">
                    {demoResult.steps.map((step, index) => (
                      <div key={step.step} className="col-md-6 col-lg-4 mb-3">
                        <Card className="h-100">
                          <Card.Header className="d-flex align-items-center">
                            <span className="me-2" style={{ fontSize: '1.2em' }}>
                              {getStepIcon(step.name)}
                            </span>
                            <div>
                              <Badge bg="primary" className="me-2">Step {step.step}</Badge>
                              <strong>{step.name}</strong>
                            </div>
                          </Card.Header>
                          <Card.Body>
                            <p className="small text-muted mb-2">{step.description}</p>
                            <div className="bg-light p-2 rounded">
                              <pre className="mb-0" style={{ fontSize: '0.75em', whiteSpace: 'pre-wrap' }}>
                                {JSON.stringify(step.data, null, 2)}
                              </pre>
                            </div>
                          </Card.Body>
                        </Card>
                      </div>
                    ))}
                  </div>

                  <Alert variant="success" className="mt-3">
                    <strong>Summary:</strong> {demoResult.summary}
                  </Alert>
                </div>
              )}

              {/* Architecture Explanation */}
              <div className="mt-5">
                <h5>MCP Architecture Overview</h5>
                <div className="bg-light p-4 rounded">
                  <div className="text-center mb-3">
                    <code style={{ fontSize: '0.9em', padding: '8px', backgroundColor: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '4px' }}>
                      User Input → AI Model → Tool Request → MCP Client → MCP Server → Execute Task → Return Result → Model Response
                    </code>
                  </div>
                  
                  <div className="row">
                    <div className="col-md-6">
                      <h6>Key Components:</h6>
                      <ul className="small">
                        <li><strong>AI Model:</strong> Decides when to use external tools</li>
                        <li><strong>MCP Client:</strong> Manages connections to MCP servers</li>
                        <li><strong>MCP Server:</strong> Provides specific tools (filesystem, git, database)</li>
                        <li><strong>Tools:</strong> Execute actual tasks and return data</li>
                      </ul>
                    </div>
                    <div className="col-md-6">
                      <h6>Available MCP Servers:</h6>
                      <ul className="small">
                        <li><strong>Filesystem:</strong> read_file, list_directory, search_files</li>
                        <li><strong>Git:</strong> get_commit_history, analyze_changes</li>
                        <li><strong>Database:</strong> execute_query, get_schema</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  );
};