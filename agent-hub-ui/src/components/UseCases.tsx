import React from 'react';
import { Container, Row, Col, Card, Badge, Button, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { Icon } from './Icon';

const UseCases: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <h1 className="display-5 fw-bold text-primary">
            <Icon name="target" size="large" className="me-3" />
            Use Cases & Success Stories
          </h1>
          <p className="lead">
            Real-world examples of how AgentHub transforms development workflows across industries
          </p>
        </Col>
      </Row>

      <Alert variant="warning" className="mb-4">
        <h6>
          <Icon name="view" size="small" className="me-2" />
          Demo Content Notice
        </h6>
        <p className="mb-0">
          The following use cases are illustrative examples created for demonstration purposes. 
          They represent typical automation scenarios and potential outcomes based on industry benchmarks.
        </p>
      </Alert>

      {/* Industry Use Cases */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">
                <Icon name="agent" size="small" className="me-2" />
                Industry Use Cases
              </h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <Card className="mb-3 border-success">
                    <Card.Header className="bg-success text-white">
                      <strong className="d-flex align-items-center">
                        <Icon name="agent" size="small" className="me-2" />
                        FinTech - Test Automation
                      </strong>
                    </Card.Header>
                    <Card.Body>
                      <h6>Banking API Test Suite Generation</h6>
                      <p className="small mb-2">
                        <strong>Challenge:</strong> Manual testing of financial transactions took 40+ hours per sprint
                      </p>
                      <p className="small mb-2">
                        <strong>Solution:</strong> Generated comprehensive automation:
                      </p>
                      <ul className="small">
                        <li>✅ 32 API tests for transaction processing</li>
                        <li>✅ 18 security tests for fraud detection</li>
                        <li>✅ 12 compliance tests for regulatory requirements</li>
                        <li>✅ 8 performance tests for high-volume scenarios</li>
                      </ul>
                      <div className="bg-light p-2 rounded mt-2">
                        <strong className="text-success">Projected Impact:</strong>
                        <ul className="small mb-0 mt-1">
                          <li>⏱️ <strong>90% time reduction:</strong> 40 hours → 4 hours</li>
                          <li>🎯 <strong>Comprehensive coverage:</strong> Edge case automation</li>
                          <li>🔄 <strong>Consistent quality:</strong> Standardized test patterns</li>
                          <li>📈 <strong>Faster releases:</strong> 2-week → 1-week sprint cycles</li>
                        </ul>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                
                <Col md={6}>
                  <Card className="mb-3 border-info">
                    <Card.Header className="bg-info text-white">
                      <strong className="d-flex align-items-center">
                        <Icon name="database" size="small" className="me-2" />
                        Healthcare - Cloud Optimization
                      </strong>
                    </Card.Header>
                    <Card.Body>
                      <h6>Multi-Region Infrastructure Analysis</h6>
                      <p className="small mb-2">
                        <strong>Challenge:</strong> $95K monthly cloud costs with compliance requirements
                      </p>
                      <p className="small mb-2">
                        <strong>Solution:</strong> AI-powered optimization analysis:
                      </p>
                      <ul className="small">
                        <li>💰 Right-sizing for HIPAA-compliant instances</li>
                        <li>📊 Reserved capacity planning for predictable workloads</li>
                        <li>🗄️ Automated backup optimization</li>
                        <li>⚡ Performance tuning for patient data access</li>
                      </ul>
                      <div className="bg-light p-2 rounded mt-2">
                        <strong className="text-info">Projected Results:</strong>
                        <ul className="small mb-0 mt-1">
                          <li>📉 <strong>15-25% cost reduction:</strong> $14K-24K monthly savings</li>
                          <li>🔍 <strong>100% compliance:</strong> Maintained security standards</li>
                          <li>🚀 <strong>20-40% performance gain:</strong> Optimized queries</li>
                          <li>📋 <strong>Automated reporting:</strong> Real-time cost visibility</li>
                        </ul>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Card className="mb-3 border-warning">
                    <Card.Header className="bg-warning text-dark">
                      <strong className="d-flex align-items-center">
                        <Icon name="shield" size="small" className="me-2" />
                        E-commerce - Security Scanning
                      </strong>
                    </Card.Header>
                    <Card.Body>
                      <h6>Automated Security Assessment</h6>
                      <p className="small mb-2">
                        <strong>Challenge:</strong> Manual security audits took weeks and missed critical issues
                      </p>
                      <p className="small mb-2">
                        <strong>Solution:</strong> Comprehensive security automation:
                      </p>
                      <ul className="small">
                        <li>🔍 OWASP Top 10 vulnerability scanning</li>
                        <li>🛡️ PCI DSS compliance verification</li>
                        <li>🔐 Authentication and authorization testing</li>
                        <li>📊 Security posture reporting</li>
                      </ul>
                      <div className="bg-light p-2 rounded mt-2">
                        <strong className="text-warning">Projected Benefits:</strong>
                        <ul className="small mb-0 mt-1">
                          <li>⚡ <strong>95% faster scans:</strong> Weeks → Hours</li>
                          <li>🎯 <strong>Comprehensive coverage:</strong> Automated edge cases</li>
                          <li>📈 <strong>Continuous monitoring:</strong> Real-time alerts</li>
                          <li>💰 <strong>Cost savings:</strong> Reduced consultant fees</li>
                        </ul>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>

                <Col md={6}>
                  <Card className="mb-3 border-primary">
                    <Card.Header className="bg-primary text-white">
                      <strong className="d-flex align-items-center">
                        <Icon name="analytics" size="small" className="me-2" />
                        SaaS - Business Intelligence
                      </strong>
                    </Card.Header>
                    <Card.Body>
                      <h6>Automated Analytics & Reporting</h6>
                      <p className="small mb-2">
                        <strong>Challenge:</strong> Manual data analysis consumed 20+ hours weekly
                      </p>
                      <p className="small mb-2">
                        <strong>Solution:</strong> Intelligent analytics automation:
                      </p>
                      <ul className="small">
                        <li>📊 Customer behavior pattern analysis</li>
                        <li>💹 Revenue forecasting and trend analysis</li>
                        <li>🎯 Churn prediction and prevention</li>
                        <li>📈 Performance dashboard generation</li>
                      </ul>
                      <div className="bg-light p-2 rounded mt-2">
                        <strong className="text-primary">Projected Impact:</strong>
                        <ul className="small mb-0 mt-1">
                          <li>⏱️ <strong>85% time savings:</strong> 20 hours → 3 hours weekly</li>
                          <li>🎯 <strong>Better insights:</strong> AI-powered analysis</li>
                          <li>📈 <strong>Faster decisions:</strong> Real-time dashboards</li>
                          <li>💰 <strong>Revenue impact:</strong> Data-driven optimization</li>
                        </ul>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Agent Categories */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header className="bg-secondary text-white">
              <h5 className="mb-0">
                <Icon name="grid" size="small" className="me-2" />
                Available Agent Categories
              </h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={3}>
                  <div className="text-center p-3 border rounded mb-3">
                    <Icon name="agent" size="xlarge" color="success" />
                    <h6 className="mt-2">QE & Testing</h6>
                    <Badge bg="success" className="mb-2">15+ Agents</Badge>
                    <p className="small text-muted">
                      Test generation, automation frameworks, API testing, performance testing
                    </p>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="text-center p-3 border rounded mb-3">
                    <Icon name="database" size="xlarge" color="warning" />
                    <h6 className="mt-2">DevOps</h6>
                    <Badge bg="warning" className="mb-2">12+ Agents</Badge>
                    <p className="small text-muted">
                      Infrastructure optimization, monitoring, CI/CD automation, cost analysis
                    </p>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="text-center p-3 border rounded mb-3">
                    <Icon name="shield" size="xlarge" color="danger" />
                    <h6 className="mt-2">Security</h6>
                    <Badge bg="danger" className="mb-2">8+ Agents</Badge>
                    <p className="small text-muted">
                      Vulnerability scanning, compliance auditing, security best practices
                    </p>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="text-center p-3 border rounded mb-3">
                    <Icon name="analytics" size="xlarge" color="info" />
                    <h6 className="mt-2">Business Intelligence</h6>
                    <Badge bg="info" className="mb-2">10+ Agents</Badge>
                    <p className="small text-muted">
                      Data analysis, reporting, forecasting, customer insights
                    </p>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Call to Action */}
      <Row className="mb-4">
        <Col>
          <Card className="border-primary">
            <Card.Body className="text-center">
              <h5>Ready to Transform Your Workflow?</h5>
              <p className="text-muted mb-4">
                Explore our agent catalog or try the interactive ROI calculator to see potential impact for your team.
              </p>
              <div className="d-flex justify-content-center gap-3">
                <Button 
                  variant="primary" 
                  size="lg"
                  onClick={() => navigate('/agents')}
                >
                  <Icon name="grid" size="small" className="me-2" />
                  Browse Agent Catalog
                </Button>
                <Button 
                  variant="outline-success" 
                  size="lg"
                  onClick={() => navigate('/')}
                >
                  <Icon name="chart" size="small" className="me-2" />
                  Calculate ROI
                </Button>
                <Button 
                  variant="outline-info" 
                  size="lg"
                  onClick={() => navigate('/integration-guide')}
                >
                  <Icon name="view" size="small" className="me-2" />
                  Integration Guide
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default UseCases;