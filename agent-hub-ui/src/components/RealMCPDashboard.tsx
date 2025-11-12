import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Button, Alert, Form, Badge, Spinner } from 'react-bootstrap';
import { realMCPService } from '../services/realMCPService';
import { RealMCPServerStatus } from './mcp/RealMCPServerStatus';

interface MCPToolCall {
  id: string;
  serverId: string;
  toolName: string;
  args: any;
  result?: any;
  error?: string;
  timestamp: Date;
}

export const RealMCPDashboard: React.FC = () => {
  const [selectedServer, setSelectedServer] = useState('filesystem');
  const [selectedTool, setSelectedTool] = useState('read_file');
  const [toolArgs, setToolArgs] = useState('{"path": "package.json"}');
  const [toolCalls, setToolCalls] = useState<MCPToolCall[]>([]);
  const [loading, setLoading] = useState(false);
  const [availableTools, setAvailableTools] = useState<string[]>([]);

  const loadAvailableTools = useCallback(async () => {
    try {
      const tools = await realMCPService.getAvailableTools(selectedServer);
      setAvailableTools(tools);
      if (tools.length > 0 && !tools.includes(selectedTool)) {
        setSelectedTool(tools[0]);
      }
    } catch (error) {
      console.error('Failed to load tools:', error);
      setAvailableTools([]);
    }
  }, [selectedServer, selectedTool]);

  useEffect(() => {
    loadAvailableTools();
  }, [loadAvailableTools]);

  const executeMCPTool = async () => {
    setLoading(true);
    
    const toolCall: MCPToolCall = {
      id: Date.now().toString(),
      serverId: selectedServer,
      toolName: selectedTool,
      args: {},
      timestamp: new Date()
    };

    try {
      // Parse tool arguments
      toolCall.args = JSON.parse(toolArgs);
      
      // Call the real MCP server
      const result = await realMCPService.callMCPTool(selectedServer, selectedTool, toolCall.args);
      toolCall.result = result;
      
      setToolCalls(prev => [toolCall, ...prev.slice(0, 9)]); // Keep last 10 calls
    } catch (error) {
      toolCall.error = error instanceof Error ? error.message : 'Unknown error';
      setToolCalls(prev => [toolCall, ...prev.slice(0, 9)]);
    } finally {
      setLoading(false);
    }
  };

  const getExampleArgs = (serverId: string, toolName: string): string => {
    const examples: Record<string, Record<string, string>> = {
      filesystem: {
        read_file: '{"path": "package.json"}',
        write_file: '{"path": "test.txt", "content": "Hello MCP!"}',
        list_directory: '{"path": "."}',
        search_files: '{"pattern": "*.ts", "path": "src"}'
      },
      database: {
        execute_query: '{"query": "SELECT * FROM agents LIMIT 5"}',
        get_schema: '{}',
        get_table_info: '{"table_name": "agents"}',
        create_table: '{"name": "test_table", "columns": [{"name": "id", "type": "INTEGER PRIMARY KEY"}]}'
      },
      git: {
        log: '{"maxCount": 5}',
        status: '{}',
        diff: '{"commit": "HEAD~1"}',
        branch: '{}',
        show: '{"commit": "HEAD"}'
      },
      office365: {
        get_emails: '{"folder": "inbox", "limit": 5}',
        send_email: '{"to": "test@example.com", "subject": "Test", "body": "Hello!"}',
        get_calendar: '{"days": 7}',
        get_documents: '{"folder": "Documents"}'
      }
    };

    return examples[serverId]?.[toolName] || '{}';
  };

  const updateExampleArgs = () => {
    const example = getExampleArgs(selectedServer, selectedTool);
    setToolArgs(example);
  };

  return (
    <Container fluid className="py-4">
      <Row>
        <Col>
          <h2>🐳 Real MCP Dashboard</h2>
          <p className="text-muted">
            Test and interact with real Docker-based MCP servers. This replaces the fake MCP implementation with actual functionality.
          </p>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col>
          <RealMCPServerStatus />
        </Col>
      </Row>

      <Row>
        <Col md={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">🔧 MCP Tool Executor</h5>
            </Card.Header>
            <Card.Body>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>MCP Server</Form.Label>
                  <Form.Select 
                    value={selectedServer} 
                    onChange={(e) => setSelectedServer(e.target.value)}
                  >
                    <option value="filesystem">🗂️ Filesystem Server</option>
                    <option value="database">🗄️ Database Server</option>
                    <option value="git">🌿 Git Server</option>
                    <option value="office365">📧 Office365 Server</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Tool</Form.Label>
                  <div className="d-flex">
                    <Form.Select 
                      value={selectedTool} 
                      onChange={(e) => setSelectedTool(e.target.value)}
                      className="me-2"
                    >
                      {availableTools.map(tool => (
                        <option key={tool} value={tool}>{tool}</option>
                      ))}
                    </Form.Select>
                    <Button 
                      variant="outline-secondary" 
                      size="sm"
                      onClick={updateExampleArgs}
                    >
                      Example
                    </Button>
                  </div>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Arguments (JSON)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={toolArgs}
                    onChange={(e) => setToolArgs(e.target.value)}
                    placeholder='{"key": "value"}'
                  />
                </Form.Group>

                <Button 
                  variant="primary" 
                  onClick={executeMCPTool}
                  disabled={loading}
                  className="w-100"
                >
                  {loading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Executing...
                    </>
                  ) : (
                    '▶️ Execute MCP Tool'
                  )}
                </Button>
              </Form>

              <Alert variant="info" className="mt-3">
                <strong>Real MCP Execution:</strong> This calls actual Docker-based MCP servers, 
                not fake mock data. Results show real file operations, database queries, and git analysis.
              </Alert>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">📋 Execution History</h5>
            </Card.Header>
            <Card.Body style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {toolCalls.length === 0 ? (
                <p className="text-muted text-center">No tool calls yet. Execute a tool to see results.</p>
              ) : (
                toolCalls.map(call => (
                  <Card key={call.id} className="mb-3">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <Badge bg="primary" className="me-2">{call.serverId}</Badge>
                          <code>{call.toolName}</code>
                        </div>
                        <small className="text-muted">
                          {call.timestamp.toLocaleTimeString()}
                        </small>
                      </div>
                      
                      <div className="mb-2">
                        <strong>Args:</strong>
                        <pre className="bg-light p-2 rounded small">
                          {JSON.stringify(call.args, null, 2)}
                        </pre>
                      </div>

                      {call.result && (
                        <div>
                          <strong className="text-success">✅ Result:</strong>
                          <pre className="bg-success bg-opacity-10 p-2 rounded small">
                            {JSON.stringify(call.result, null, 2)}
                          </pre>
                        </div>
                      )}

                      {call.error && (
                        <div>
                          <strong className="text-danger">❌ Error:</strong>
                          <pre className="bg-danger bg-opacity-10 p-2 rounded small">
                            {call.error}
                          </pre>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                ))
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mt-4">
        <Col>
          <Alert variant="success">
            <h6>🎉 Real MCP Implementation Benefits:</h6>
            <ul className="mb-0">
              <li><strong>Actual Functionality:</strong> Real file operations, database queries, git analysis</li>
              <li><strong>Docker Isolation:</strong> Each server runs independently with proper resource management</li>
              <li><strong>MCP Protocol:</strong> Proper JSON-RPC 2.0 implementation, not fake TypeScript classes</li>
              <li><strong>Scalability:</strong> Easy to add new servers and scale horizontally</li>
              <li><strong>Debugging:</strong> Each server has separate logs and can be restarted independently</li>
            </ul>
          </Alert>
        </Col>
      </Row>
    </Container>
  );
};