import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button } from 'react-bootstrap';

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <Container fluid className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }} role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <h4 className="text-primary mb-2">🤖 AgentHub</h4>
          <p className="text-muted">Loading dashboard...</p>
        </div>
      </Container>
    );
  }

  return (
    <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <Container fluid className="p-4">
        {/* Header */}
        <div className="mb-4">
          <h2 className="text-primary mb-1" style={{ fontSize: '1.75rem', fontWeight: '600' }}>
            AgentHub Dashboard
          </h2>
          <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>
            Universal AI Agent Factory - Deploy any agent for any business function
          </p>
        </div>

        {/* CLI Integration Banner */}
        <div 
          className="mb-4 p-4 rounded" 
          style={{ 
            backgroundColor: '#1e3a8a', 
            color: 'white',
            background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)'
          }}
        >
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <div className="d-flex align-items-center mb-2">
                <Badge bg="success" className="me-2" style={{ fontSize: '0.7rem' }}>
                  NEW
                </Badge>
                <h5 className="mb-0" style={{ fontSize: '1.1rem', fontWeight: '600' }}>
                  CLI & IDE Integration Available
                </h5>
              </div>
              <p className="mb-3" style={{ fontSize: '0.9rem', opacity: '0.9' }}>
                Install the <strong>AgentHub VS Code Extension</strong> to access powerful command-line tools, integrated development features, and seamless agent deployment workflows.
              </p>
              <div className="d-flex flex-wrap gap-2">
                <Button variant="outline-light" size="sm" className="d-flex align-items-center">
                  <span className="me-1">⌨️</span> CLI Commands
                </Button>
                <Button variant="outline-light" size="sm" className="d-flex align-items-center">
                  <span className="me-1">🔧</span> IDE Integration
                </Button>
                <Button variant="outline-light" size="sm" className="d-flex align-items-center">
                  <span className="me-1">📊</span> One-Click Deploy
                </Button>
                <Button variant="outline-light" size="sm" className="d-flex align-items-center">
                  <span className="me-1">⏱️</span> Real-time Monitoring
                </Button>
              </div>
            </div>
            <div className="d-flex flex-column gap-2">
              <Button variant="light" size="sm" className="d-flex align-items-center">
                <span className="me-1">📖</span> View CLI Guide
              </Button>
              <Button variant="outline-light" size="sm" className="d-flex align-items-center">
                <span className="me-1">📚</span> API Docs
              </Button>
            </div>
          </div>
        </div>

        {/* Metrics Cards */}
        <Row className="mb-4">
          <Col md={3}>
            <Card className="text-center border-0 shadow-sm h-100">
              <Card.Body className="py-4">
                <h2 className="display-4 text-primary mb-1" style={{ fontSize: '2.5rem', fontWeight: '700' }}>
                  17
                </h2>
                <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>
                  AI Agents
                </p>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={3}>
            <Card className="text-center border-0 shadow-sm h-100">
              <Card.Body className="py-4">
                <h2 className="display-4 text-primary mb-1" style={{ fontSize: '2.5rem', fontWeight: '700' }}>
                  4
                </h2>
                <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>
                  Business Domains
                </p>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={3}>
            <Card className="text-center border-0 shadow-sm h-100">
              <Card.Body className="py-4">
                <h2 className="display-4 text-primary mb-1" style={{ fontSize: '2.5rem', fontWeight: '700' }}>
                  8
                </h2>
                <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>
                  Frameworks Supported
                </p>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={3}>
            <Card className="text-center border-0 shadow-sm h-100">
              <Card.Body className="py-4">
                <h2 className="display-4 text-success mb-1" style={{ fontSize: '2.5rem', fontWeight: '700' }}>
                  99.98%
                </h2>
                <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>
                  Platform Uptime
                </p>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Quick Actions */}
        <div className="mb-4">
          <h5 className="mb-3" style={{ fontSize: '1.1rem', fontWeight: '600', color: '#374151' }}>
            Quick Actions
          </h5>
          
          <Row className="g-3">
            <Col md={6} lg={3}>
              <Button 
                variant="outline-primary" 
                className="w-100 py-3 border-2"
                style={{ fontSize: '0.9rem', fontWeight: '500' }}
                onClick={() => window.location.href = '/agents'}
              >
                Browse Agents
              </Button>
            </Col>
            
            <Col md={6} lg={3}>
              <Button 
                variant="primary" 
                className="w-100 py-3"
                style={{ 
                  fontSize: '0.9rem', 
                  fontWeight: '500',
                  backgroundColor: '#1e3a8a',
                  borderColor: '#1e3a8a'
                }}
                onClick={() => window.location.href = '/execute'}
              >
                Quick Execute
              </Button>
            </Col>
            
            <Col md={6} lg={3}>
              <Button 
                variant="outline-primary" 
                className="w-100 py-3 border-2"
                style={{ fontSize: '0.9rem', fontWeight: '500' }}
                onClick={() => window.location.href = '/analytics'}
              >
                Management
              </Button>
            </Col>
            
            <Col md={6} lg={3}>
              <Button 
                variant="outline-primary" 
                className="w-100 py-3 border-2"
                style={{ fontSize: '0.9rem', fontWeight: '500' }}
                onClick={() => window.location.href = '/builder'}
              >
                Upload Agent
              </Button>
            </Col>
          </Row>
          
          <Row className="g-3 mt-2">
            <Col md={6} lg={3}>
              <Button 
                variant="outline-secondary" 
                className="w-100 py-3"
                style={{ fontSize: '0.9rem', fontWeight: '500' }}
              >
                Documentation
              </Button>
            </Col>
            
            <Col md={6} lg={3}>
              <Button 
                variant="outline-secondary" 
                className="w-100 py-3"
                style={{ fontSize: '0.9rem', fontWeight: '500' }}
              >
                API Docs
              </Button>
            </Col>
            
            <Col md={6} lg={3}>
              <Button 
                variant="outline-secondary" 
                className="w-100 py-3"
                style={{ fontSize: '0.9rem', fontWeight: '500' }}
                onClick={() => window.location.href = '/analytics'}
              >
                Analytics
              </Button>
            </Col>
            
            <Col md={6} lg={3}>
              <Button 
                variant="primary" 
                className="w-100 py-3"
                style={{ 
                  fontSize: '0.9rem', 
                  fontWeight: '500',
                  backgroundColor: '#1e3a8a',
                  borderColor: '#1e3a8a'
                }}
                onClick={() => window.location.href = '/cloudwatch'}
              >
                CloudWatch Metrics
              </Button>
            </Col>
          </Row>
        </div>
      </Container>
    </div>
  );
};

export default Dashboard;