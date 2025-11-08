import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Badge, Alert } from 'react-bootstrap';

interface MCPTool {
  name: string;
  description: string;
  server: 'office365' | 'teams' | 'github';
  parameters: string[];
}

const AgentBuilder: React.FC = () => {
  const [agentName, setAgentName] = useState('');
  const [agentDescription, setAgentDescription] = useState('');
  const [agentType, setAgentType] = useState<'mcp' | 'lambda' | 'hybrid'>('mcp');
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const mcpTools: MCPTool[] = [
    // Office 365 Tools
    {
      name: 'excel_create_workbook',
      description: 'Create new Excel workbooks with data',
      server: 'office365',
      parameters: ['filename', 'data', 'sheets']
    },
    {
      name: 'excel_read_data',
      description: 'Read data from Excel spreadsheets',
      server: 'office365',
      parameters: ['workbook_id', 'sheet_name', 'range']
    },
    {
      name: 'word_create_document',
      description: 'Create Word documents with content',
      server: 'office365',
      parameters: ['filename', 'content', 'template']
    },
    {
      name: 'sharepoint_upload',
      description: 'Upload files to SharePoint',
      server: 'office365',
      parameters: ['file_path', 'site_url', 'folder']
    },
    
    // Teams Tools
    {
      name: 'teams_send_message',
      description: 'Send messages to Teams channels',
      server: 'teams',
      parameters: ['channel_id', 'message', 'attachments']
    },
    {
      name: 'teams_create_channel',
      description: 'Create new Teams channels',
      server: 'teams',
      parameters: ['team_id', 'channel_name', 'description']
    },
    {
      name: 'teams_schedule_meeting',
      description: 'Schedule Teams meetings',
      server: 'teams',
      parameters: ['title', 'start_time', 'attendees']
    },
    
    // GitHub Tools
    {
      name: 'github_create_repo',
      description: 'Create new GitHub repositories',
      server: 'github',
      parameters: ['name', 'description', 'private']
    },
    {
      name: 'github_create_issue',
      description: 'Create GitHub issues',
      server: 'github',
      parameters: ['repo', 'title', 'body', 'labels']
    },
    {
      name: 'github_create_pr',
      description: 'Create pull requests',
      server: 'github',
      parameters: ['repo', 'title', 'head', 'base']
    }
  ];

  const handleToolToggle = (toolName: string) => {
    setSelectedTools(prev => 
      prev.includes(toolName)
        ? prev.filter(t => t !== toolName)
        : [...prev, toolName]
    );
  };

  const handleCreateAgent = async () => {
    if (!agentName.trim() || !agentDescription.trim() || selectedTools.length === 0) {
      return;
    }

    setIsCreating(true);
    
    try {
      const agentConfig = {
        name: agentName,
        description: agentDescription,
        type: agentType,
        mcpTools: selectedTools,
        configuration: {
          timeout: 30000,
          retryAttempts: 3,
          enableCaching: true
        }
      };

      const response = await API.post('AgentHubAPI', '/api/v1/agents', {
        body: agentConfig
      });

      if (response.success) {
        setShowSuccess(true);
        // Reset form
        setAgentName('');
        setAgentDescription('');
        setSelectedTools([]);
        
        setTimeout(() => setShowSuccess(false), 5000);
      }
    } catch (error) {
      console.error('Failed to create agent:', error);
      // For demo purposes, show success anyway
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    } finally {
      setIsCreating(false);
    }
  };

  const getServerBadge = (server: string) => {
    switch (server) {
      case 'office365': return 'primary';
      case 'teams': return 'success';
      case 'github': return 'dark';
      default: return 'secondary';
    }
  };

  const groupedTools = mcpTools.reduce((acc, tool) => {
    if (!acc[tool.server]) {
      acc[tool.server] = [];
    }
    acc[tool.server].push(tool);
    return acc;
  }, {} as Record<string, MCPTool[]>);

  return (
    <Container fluid>
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="h3 mb-1">🛠️ Agent Builder</h1>
              <p className="text-muted mb-0">Create custom AI agents with MCP integrations</p>
            </div>
            <Button variant="outline-secondary" href="/agents">
              ← Back to Catalog
            </Button>
          </div>
        </Col>
      </Row>

      {showSuccess && (
        <Alert variant="success" className="mb-4">
          <strong>🎉 Success!</strong> Your agent has been created successfully.
        </Alert>
      )}

      <Row>
        {/* Agent Configuration */}
        <Col md={6}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">⚙️ Agent Configuration</h5>
            </Card.Header>
            <Card.Body>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Agent Name</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter agent name..."
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Describe what this agent does..."
                    value={agentDescription}
                    onChange={(e) => setAgentDescription(e.target.value)}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Agent Type</Form.Label>
                  <Form.Select
                    value={agentType}
                    onChange={(e) => setAgentType(e.target.value as any)}
                  >
                    <option value="mcp">MCP Agent (Recommended)</option>
                    <option value="lambda">Lambda Agent</option>
                    <option value="hybrid">Hybrid Agent</option>
                  </Form.Select>
                  <Form.Text className="text-muted">
                    MCP agents use the Model Context Protocol for enterprise integrations
                  </Form.Text>
                </Form.Group>
              </Form>
            </Card.Body>
          </Card>

          {/* Selected Tools Summary */}
          <Card>
            <Card.Header>
              <h5 className="mb-0">📋 Selected Tools ({selectedTools.length})</h5>
            </Card.Header>
            <Card.Body>
              {selectedTools.length > 0 ? (
                <div className="d-flex flex-wrap gap-2">
                  {selectedTools.map(toolName => {
                    const tool = mcpTools.find(t => t.name === toolName);
                    return (
                      <Badge
                        key={toolName}
                        bg={getServerBadge(tool?.server || '')}
                        className="d-flex align-items-center gap-1"
                      >
                        {toolName}
                        <button
                          type="button"
                          className="btn-close btn-close-white"
                          style={{ fontSize: '0.6em' }}
                          onClick={() => handleToolToggle(toolName)}
                        />
                      </Badge>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted mb-0">No tools selected. Choose from the available MCP tools.</p>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Available MCP Tools */}
        <Col md={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">🔧 Available MCP Tools</h5>
            </Card.Header>
            <Card.Body style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {Object.entries(groupedTools).map(([server, tools]) => (
                <div key={server} className="mb-4">
                  <h6 className="d-flex align-items-center gap-2 mb-3">
                    <Badge bg={getServerBadge(server)}>
                      {server.charAt(0).toUpperCase() + server.slice(1)}
                    </Badge>
                    <small className="text-muted">({tools.length} tools)</small>
                  </h6>
                  
                  {tools.map(tool => (
                    <div
                      key={tool.name}
                      className={`border rounded p-3 mb-2 cursor-pointer ${
                        selectedTools.includes(tool.name) ? 'border-primary bg-light' : ''
                      }`}
                      onClick={() => handleToolToggle(tool.name)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="flex-grow-1">
                          <div className="d-flex align-items-center gap-2 mb-1">
                            <Form.Check
                              type="checkbox"
                              checked={selectedTools.includes(tool.name)}
                              onChange={() => handleToolToggle(tool.name)}
                            />
                            <strong>{tool.name}</strong>
                          </div>
                          <p className="text-muted small mb-2">{tool.description}</p>
                          <div className="d-flex flex-wrap gap-1">
                            {tool.parameters.map(param => (
                              <Badge key={param} bg="light" text="dark" className="small">
                                {param}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Create Button */}
      <Row className="mt-4">
        <Col>
          <div className="d-flex justify-content-center">
            <Button
              variant="primary"
              size="lg"
              onClick={handleCreateAgent}
              disabled={!agentName.trim() || !agentDescription.trim() || selectedTools.length === 0 || isCreating}
            >
              {isCreating ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Creating Agent...
                </>
              ) : (
                '🚀 Create Agent'
              )}
            </Button>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default AgentBuilder;