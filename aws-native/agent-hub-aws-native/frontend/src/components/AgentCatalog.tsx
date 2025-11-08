import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Form, InputGroup, Spinner, Alert, Dropdown, ButtonGroup } from 'react-bootstrap';

interface Agent {
  id: string;
  name: string;
  description: string;
  type: 'mcp' | 'lambda' | 'hybrid';
  status: 'active' | 'inactive' | 'deploying';
  mcpTools?: string[];
  lastExecution?: string;
  executionCount: number;
}

const AgentCatalog: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      
      // Simulate loading delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data for now - API endpoints not implemented yet
      const mockAgents: Agent[] = [
        {
          id: '1',
          name: 'Excel Automation Agent',
          description: 'Automates Excel spreadsheet operations, data analysis, and report generation',
          type: 'mcp',
          status: 'active',
          mcpTools: ['excel-read', 'excel-write', 'excel-format'],
          lastExecution: new Date(Date.now() - 300000).toISOString(),
          executionCount: 45
        },
        {
          id: '2',
          name: 'Teams Notification Agent',
          description: 'Sends automated notifications and messages via Microsoft Teams',
          type: 'mcp',
          status: 'active',
          mcpTools: ['teams-message', 'teams-channel'],
          lastExecution: new Date(Date.now() - 600000).toISOString(),
          executionCount: 23
        },
        {
          id: '3',
          name: 'GitHub PR Manager',
          description: 'Manages GitHub pull requests, reviews, and repository operations',
          type: 'hybrid',
          status: 'active',
          mcpTools: ['github-pr', 'github-issues'],
          lastExecution: new Date(Date.now() - 900000).toISOString(),
          executionCount: 12
        },
        {
          id: '4',
          name: 'Document Generator',
          description: 'Generates Word documents and PDFs from templates and data',
          type: 'lambda',
          status: 'active',
          lastExecution: new Date(Date.now() - 1200000).toISOString(),
          executionCount: 8
        },
        {
          id: '5',
          name: 'Meeting Scheduler',
          description: 'Schedules meetings and manages calendar events across platforms',
          type: 'mcp',
          status: 'inactive',
          mcpTools: ['calendar-create', 'calendar-update'],
          lastExecution: new Date(Date.now() - 86400000).toISOString(),
          executionCount: 3
        },
        {
          id: '6',
          name: 'Code Review Assistant',
          description: 'Analyzes code quality and provides automated review feedback',
          type: 'hybrid',
          status: 'deploying',
          mcpTools: ['code-analysis', 'github-review'],
          executionCount: 0
        }
      ];
      
      setAgents(mockAgents);
      console.log('✅ Agent Catalog loaded successfully! Found', mockAgents.length, 'agents');
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'secondary';
      case 'deploying': return 'warning';
      default: return 'secondary';
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'mcp': return 'primary';
      case 'lambda': return 'info';
      case 'hybrid': return 'warning';
      default: return 'secondary';
    }
  };

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || agent.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <Container fluid>
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="h3 mb-1">🤖 Agent Catalog</h1>
              <p className="text-muted mb-0">Browse and manage your AI agents</p>
            </div>
            <Button variant="primary" href="/builder">
              ➕ Create New Agent
            </Button>
          </div>
        </Col>
      </Row>

      {/* Filters */}
      <Row className="mb-4">
        <Col md={6}>
          <InputGroup>
            <InputGroup.Text>🔍</InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Search agents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </Col>
        <Col md={3}>
          <Form.Select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="mcp">MCP Agents</option>
            <option value="lambda">Lambda Agents</option>
            <option value="hybrid">Hybrid Agents</option>
          </Form.Select>
        </Col>
        <Col md={3}>
          <Button variant="outline-secondary" onClick={fetchAgents} className="w-100">
            🔄 Refresh
          </Button>
        </Col>
      </Row>

      {/* Agent Cards */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <Row>
          {filteredAgents.map((agent) => (
            <Col md={6} lg={4} key={agent.id} className="mb-4">
              <Card className="h-100">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <div>
                    <Badge bg={getTypeBadge(agent.type)} className="me-2">
                      {agent.type.toUpperCase()}
                    </Badge>
                    <Badge bg={getStatusBadge(agent.status)}>
                      {agent.status}
                    </Badge>
                  </div>
                </Card.Header>
                <Card.Body>
                  <h5 className="card-title">{agent.name}</h5>
                  <p className="card-text text-muted">{agent.description}</p>
                  
                  {agent.mcpTools && (
                    <div className="mb-3">
                      <small className="text-muted d-block mb-1">MCP Tools:</small>
                      <div className="d-flex flex-wrap gap-1">
                        {agent.mcpTools.slice(0, 3).map((tool, index) => (
                          <Badge key={index} bg="light" text="dark" className="small">
                            {tool}
                          </Badge>
                        ))}
                        {agent.mcpTools.length > 3 && (
                          <Badge bg="light" text="dark" className="small">
                            +{agent.mcpTools.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="mb-3">
                    <small className="text-muted">
                      Executions: <strong>{agent.executionCount}</strong>
                    </small>
                    {agent.lastExecution && (
                      <small className="text-muted d-block">
                        Last run: {new Date(agent.lastExecution).toLocaleString()}
                      </small>
                    )}
                  </div>
                </Card.Body>
                <Card.Footer className="d-flex gap-2">
                  <Button variant="primary" size="sm" className="flex-fill">
                    ▶️ Execute
                  </Button>
                  <Button variant="outline-secondary" size="sm">
                    ⚙️ Configure
                  </Button>
                  <Button variant="outline-info" size="sm">
                    📊 Logs
                  </Button>
                </Card.Footer>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {filteredAgents.length === 0 && !loading && (
        <div className="text-center py-5">
          <div className="mb-3">
            <span className="display-1">🤖</span>
          </div>
          <h4>No agents found</h4>
          <p className="text-muted">
            {searchTerm || filterType !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Create your first agent to get started'
            }
          </p>
          <Button variant="primary" href="/builder">
            Create New Agent
          </Button>
        </div>
      )}
    </Container>
  );
};

export default AgentCatalog;