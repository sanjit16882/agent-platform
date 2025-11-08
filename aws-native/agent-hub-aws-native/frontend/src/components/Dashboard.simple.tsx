import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Alert } from 'react-bootstrap';

const SimpleDashboard: React.FC = () => {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiStatus, setApiStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      setApiStatus('loading');
      
      const response = await fetch('https://6gwwzzxu4d.execute-api.us-east-1.amazonaws.com/prod/api/v1/agents');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setAgents(data.data || []);
        setApiStatus('success');
      } else {
        throw new Error('API returned success: false');
      }
    } catch (error) {
      console.error('Failed to fetch agents:', error);
      setApiStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container fluid>
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="h3 mb-1">🤖 Agent Hub Dashboard</h1>
              <p className="text-muted mb-0">Enterprise AI Management Platform</p>
            </div>
            <Button variant="outline-primary" onClick={fetchAgents}>
              🔄 Refresh
            </Button>
          </div>
        </Col>
      </Row>

      {/* API Status */}
      <Row className="mb-4">
        <Col>
          {apiStatus === 'loading' && (
            <Alert variant="info">
              <div className="d-flex align-items-center">
                <div className="spinner-border spinner-border-sm me-2" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                Loading dashboard data...
              </div>
            </Alert>
          )}
          
          {apiStatus === 'success' && (
            <Alert variant="success">
              ✅ Dashboard loaded successfully! Found {agents.length} agents.
            </Alert>
          )}
          
          {apiStatus === 'error' && (
            <Alert variant="danger">
              ❌ Failed to load dashboard data. Please check API connectivity.
            </Alert>
          )}
        </Col>
      </Row>

      {/* System Overview */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <div className="display-6 text-primary mb-2">🤖</div>
              <h3 className="mb-1">{agents.length}</h3>
              <p className="text-muted mb-0">Total Agents</p>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <div className="display-6 text-success mb-2">⚡</div>
              <h3 className="mb-1">{agents.filter(a => a.status === 'active').length}</h3>
              <p className="text-muted mb-0">Active Agents</p>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <div className="display-6 text-info mb-2">🔗</div>
              <h3 className="mb-1">3/4</h3>
              <p className="text-muted mb-0">MCP Servers</p>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <div className="display-6 text-warning mb-2">📊</div>
              <h3 className="mb-1">
                {new Date().toLocaleTimeString()}
              </h3>
              <p className="text-muted mb-0">Last Update</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Agent List */}
      <Row>
        <Col>
          <Card>
            <Card.Header>
              <h5 className="mb-0">🤖 Recent Agents</h5>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : agents.length > 0 ? (
                <Row>
                  {agents.slice(0, 6).map((agent) => (
                    <Col md={6} lg={4} key={agent.id} className="mb-3">
                      <Card className="h-100">
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <h6 className="card-title mb-0">{agent.name}</h6>
                            <Badge bg={agent.status === 'active' ? 'success' : 'secondary'}>
                              {agent.status}
                            </Badge>
                          </div>
                          <p className="card-text small text-muted">
                            {agent.description?.substring(0, 80)}...
                          </p>
                          <div className="d-flex justify-content-between align-items-center">
                            <Badge bg="primary">{agent.type?.toUpperCase()}</Badge>
                            <small className="text-muted">
                              {agent.executionCount || 0} runs
                            </small>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              ) : (
                <div className="text-center py-4 text-muted">
                  No agents found
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      <Row className="mt-4">
        <Col>
          <Card>
            <Card.Header>
              <h5 className="mb-0">🚀 Quick Actions</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2 d-md-flex">
                <Button variant="primary" size="lg">
                  🤖 Create New Agent
                </Button>
                <Button variant="success" size="lg">
                  📚 Browse All Agents
                </Button>
                <Button variant="info" size="lg">
                  ⚡ Execute Agent
                </Button>
                <Button variant="warning" size="lg">
                  📊 View Analytics
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default SimpleDashboard;