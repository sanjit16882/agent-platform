import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Alert, Button, Navbar, Nav } from 'react-bootstrap';

// Simple test component without complex dependencies
const SimpleApp: React.FC = () => {
  const [apiStatus, setApiStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [apiData, setApiData] = useState<any>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    testAPI();
  }, []);

  const testAPI = async () => {
    setApiStatus('loading');
    try {
      console.log('Testing API...');
      
      const response = await fetch('https://6gwwzzxu4d.execute-api.us-east-1.amazonaws.com/prod/api/v1/agents', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('API Response:', data);
      
      setApiData(data);
      setApiStatus('success');
    } catch (err) {
      console.error('API Error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setApiStatus('error');
    }
  };

  return (
    <div className="App">
      <Navbar bg="dark" variant="dark" expand="lg">
        <Container>
          <Navbar.Brand>
            🤖 Agent Hub Platform - Simple Test
          </Navbar.Brand>
          <Nav className="ms-auto">
            <Nav.Link onClick={testAPI}>🔄 Test API</Nav.Link>
          </Nav>
        </Container>
      </Navbar>

      <Container className="mt-4">
        <Row>
          <Col md={8} className="mx-auto">
            <Card>
              <Card.Header>
                <h3>🧪 API Connectivity Test</h3>
              </Card.Header>
              <Card.Body>
                {apiStatus === 'loading' && (
                  <Alert variant="info">
                    <div className="d-flex align-items-center">
                      <div className="spinner-border spinner-border-sm me-2" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      Testing API connection...
                    </div>
                  </Alert>
                )}

                {apiStatus === 'success' && (
                  <Alert variant="success">
                    ✅ API Connection Successful!<br />
                    <small>Found {apiData?.count || 0} agents</small>
                  </Alert>
                )}

                {apiStatus === 'error' && (
                  <Alert variant="danger">
                    ❌ API Connection Failed<br />
                    <small>Error: {error}</small>
                  </Alert>
                )}

                {apiData && (
                  <div className="mt-3">
                    <h5>API Response:</h5>
                    <pre className="bg-light p-3 rounded">
                      {JSON.stringify(apiData, null, 2)}
                    </pre>
                  </div>
                )}

                <div className="mt-3">
                  <Button variant="primary" onClick={testAPI}>
                    🔄 Test Again
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default SimpleApp;