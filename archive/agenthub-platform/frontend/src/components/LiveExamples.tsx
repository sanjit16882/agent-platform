import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Badge, Tabs, Tab } from 'react-bootstrap';

const LiveExamples: React.FC = () => {
  const [activeTab, setActiveTab] = useState('qe-results');

  const qeResults = {
    summary: {
      total_test_cases: 47,
      coverage_score: '94%',
      execution_time: '2.3 minutes',
      cost: '$0.28'
    },
    highlights: [
      'Generated 12 security tests including SQL injection, XSS, and authentication bypass',
      'Created 8 performance tests for Black Friday traffic (10K concurrent users)',
      'Identified 6 HIPAA compliance test scenarios for healthcare document handling',
      'Automated 23 edge cases including network failures and payment timeouts'
    ]
  };

  const devopsResults = {
    summary: {
      health_score: '73%',
      cost_savings: '$4,890/month',
      critical_issues: 5,
      execution_time: '1.8 minutes'
    },
    highlights: [
      'Identified $2,340/month savings through Reserved Instance optimization',
      'Detected memory bottleneck causing 15% performance loss during peak traffic',
      'Found critical database backup gap (18 hours) violating RTO requirements',
      'Discovered 23 unattached EBS volumes wasting $460/month'
    ]
  };

  return (
    <Container className="mt-4">
      <Row className="mb-4">
        <Col>
          <h2>🌟 Live Agent Results</h2>
          <p className="lead">See real outputs from our AI agents in action</p>
        </Col>
      </Row>

      <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'qe-results')} className="mb-4">
        <Tab eventKey="qe-results" title="🧪 QE Agent Results">
          <Row>
            <Col md={4}>
              <Card className="mb-3">
                <Card.Header className="bg-primary text-white">
                  <h6 className="mb-0">Execution Summary</h6>
                </Card.Header>
                <Card.Body>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Test Cases:</span>
                    <Badge bg="primary">{qeResults.summary.total_test_cases}</Badge>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Coverage:</span>
                    <Badge bg="success">{qeResults.summary.coverage_score}</Badge>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Time:</span>
                    <Badge bg="info">{qeResults.summary.execution_time}</Badge>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span>Cost:</span>
                    <Badge bg="warning">{qeResults.summary.cost}</Badge>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={8}>
              <Card>
                <Card.Header>
                  <h6 className="mb-0">Key Achievements</h6>
                </Card.Header>
                <Card.Body>
                  {qeResults.highlights.map((highlight, index) => (
                    <div key={index} className="mb-2">
                      <Badge bg="success" className="me-2">✓</Badge>
                      {highlight}
                    </div>
                  ))}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row className="mt-4">
            <Col>
              <Card>
                <Card.Header>
                  <h6 className="mb-0">Sample Generated Test Case</h6>
                </Card.Header>
                <Card.Body>
                  <h6>TC023: Payment Processing - 3D Secure Authentication</h6>
                  <p className="small text-muted mb-2">
                    <Badge bg="danger" className="me-2">Critical</Badge>
                    <Badge bg="primary">Functional</Badge>
                  </p>
                  <p><strong>Description:</strong> Test credit card payment with 3D Secure challenge during high-value checkout</p>
                  <p><strong>Steps:</strong></p>
                  <ol className="small">
                    <li>Add items to cart (total &gt;$500 to trigger 3DS)</li>
                    <li>Proceed to checkout with test card 4000000000003220</li>
                    <li>Complete 3D Secure challenge in popup window</li>
                    <li>Verify payment success and order confirmation</li>
                  </ol>
                  <p><strong>Expected Result:</strong> Payment processed successfully after 3DS authentication within 30 seconds</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>

        <Tab eventKey="devops-results" title="📊 DevOps Agent Results">
          <Row>
            <Col md={4}>
              <Card className="mb-3">
                <Card.Header className="bg-warning text-dark">
                  <h6 className="mb-0">Analysis Summary</h6>
                </Card.Header>
                <Card.Body>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Health Score:</span>
                    <Badge bg="warning">{devopsResults.summary.health_score}</Badge>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Savings:</span>
                    <Badge bg="success">{devopsResults.summary.cost_savings}</Badge>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Critical Issues:</span>
                    <Badge bg="danger">{devopsResults.summary.critical_issues}</Badge>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span>Analysis Time:</span>
                    <Badge bg="info">{devopsResults.summary.execution_time}</Badge>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={8}>
              <Card>
                <Card.Header>
                  <h6 className="mb-0">Key Findings</h6>
                </Card.Header>
                <Card.Body>
                  {devopsResults.highlights.map((highlight, index) => (
                    <div key={index} className="mb-2">
                      <Badge bg="warning" className="me-2">⚠</Badge>
                      {highlight}
                    </div>
                  ))}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row className="mt-4">
            <Col>
              <Card>
                <Card.Header>
                  <h6 className="mb-0">Sample Optimization Recommendation</h6>
                </Card.Header>
                <Card.Body>
                  <h6>REC002: Reserved Instance Cost Optimization</h6>
                  <p className="small text-muted mb-2">
                    <Badge bg="danger" className="me-2">Critical</Badge>
                    <Badge bg="secondary">Cost Optimization</Badge>
                  </p>
                  <p><strong>Issue:</strong> 67% of EC2 instances running on-demand pricing instead of reserved instances</p>
                  <p><strong>Impact:</strong> Paying 3x more than necessary for predictable workloads ($2,340/month overspend)</p>
                  <p><strong>Solution:</strong> Purchase 1-year reserved instances for baseline capacity, use spot instances for batch processing</p>
                  <p><strong>Implementation:</strong> 
                    <Badge bg="success" className="ms-2">Low Effort</Badge>
                    <Badge bg="info" className="ms-2">1-2 weeks</Badge>
                  </p>
                  <p><strong>Expected Savings:</strong> <span className="text-success fw-bold">$2,340/month</span></p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>
      </Tabs>

      <Row className="mt-4">
        <Col>
          <Card className="bg-light">
            <Card.Body className="text-center">
              <h5>Ready to see these results for your own systems?</h5>
              <p className="mb-3">Try our agents with your real data and get actionable insights in minutes</p>
              <Button variant="primary" size="lg" className="me-3">
                🧪 Try QE Agent
              </Button>
              <Button variant="warning" size="lg">
                📊 Try DevOps Agent
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default LiveExamples;