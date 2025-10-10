import React from 'react';
import { Container, Row, Col, Card, Button, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const stats = {
    totalAgents: 38,
    categories: 6,
    frameworks: 12,
    avgResponseTime: 1.1,
    uptime: 99.98,
    costPerExecution: 0.25
  };

  const recentExecutions = [
    { id: 'demo-001', agent: 'QE Test Generator Pro', status: 'ready', time: 'Available', details: 'Selenium + Python framework • E-commerce testing' },
    { id: 'demo-002', agent: 'Kubernetes Optimizer', status: 'ready', time: 'Available', details: 'Resource optimization • Cost analysis' },
    { id: 'demo-003', agent: 'Market Data Analyzer', status: 'ready', time: 'Available', details: 'Technical analysis • Trading signals' },
    { id: 'demo-004', agent: 'Security Scanner', status: 'ready', time: 'Available', details: 'OWASP compliance • Vulnerability assessment' },
    { id: 'demo-005', agent: 'Business Analyst', status: 'ready', time: 'Available', details: 'Sales forecasting • Customer analytics' },
    { id: 'demo-006', agent: 'Custom Agent Upload', status: 'ready', time: 'Available', details: 'Platform extensibility • Team collaboration' }
  ];

  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <h1 className="display-4 fw-bold text-primary">AgentHub</h1>
          <p className="lead text-muted">Universal AI Agent Factory - Deploy any agent for any business function</p>
        </Col>
      </Row>

      {/* Stats Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h3 className="text-primary">{stats.totalAgents}</h3>
              <Card.Text>AI Agents</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h3 className="text-success">{stats.categories}</h3>
              <Card.Text>Business Domains</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h3 className="text-warning">{stats.frameworks}</h3>
              <Card.Text>Frameworks Supported</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center" style={{ cursor: 'pointer' }} onClick={() => navigate('/manage')}>
            <Card.Body>
              <h3 className="text-info">{stats.uptime}%</h3>
              <Card.Text>Platform Uptime</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">Quick Actions</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={3}>
                  <Button 
                    variant="outline-primary" 
                    size="lg" 
                    className="w-100 mb-2 d-flex align-items-center justify-content-center"
                    onClick={() => navigate('/agents')}
                  >
                    <span className="me-2">●</span> Browse Agents
                  </Button>
                </Col>
                <Col md={3}>
                  <Button 
                    variant="outline-success" 
                    size="lg" 
                    className="w-100 mb-2 d-flex align-items-center justify-content-center"
                    onClick={() => {
                      // Navigate to most popular agent or show agent selector
                      navigate('/agents');
                    }}
                  >
                    <span className="me-2">▶</span> Quick Execute
                  </Button>
                </Col>
                <Col md={3}>
                  <Button 
                    variant="outline-info" 
                    size="lg" 
                    className="w-100 mb-2 d-flex align-items-center justify-content-center"
                    onClick={() => navigate('/manage')}
                  >
                    <span className="me-2">■</span> Management
                  </Button>
                </Col>
                <Col md={3}>
                  <Button 
                    variant="outline-secondary" 
                    size="lg" 
                    className="w-100 mb-2 d-flex align-items-center justify-content-center"
                    onClick={() => navigate('/upload')}
                  >
                    <span className="me-2">+</span> Upload Agent
                  </Button>
                </Col>
              </Row>
              <Row className="mt-2">
                <Col md={6}>
                  <Button 
                    variant="outline-dark" 
                    size="lg" 
                    className="w-100 mb-2 d-flex align-items-center justify-content-center"
                    onClick={() => {
                      // Show help or documentation
                      window.open('https://github.com/your-org/agenthub-docs', '_blank');
                    }}
                  >
                    <span className="me-2">?</span> Documentation
                  </Button>
                </Col>
                <Col md={6}>
                  <Button 
                    variant="outline-warning" 
                    size="lg" 
                    className="w-100 mb-2 d-flex align-items-center justify-content-center"
                    onClick={() => {
                      // Navigate to examples or tutorials
                      navigate('/agents');
                    }}
                  >
                    <span className="me-2">★</span> View Examples
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Business Value Proposition */}
      <Row className="mb-4">
        <Col>
          <Card className="border-success">
            <Card.Header className="bg-success text-white">
              <h5 className="mb-0">Business Value & ROI</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={3}>
                  <Card className="text-center border-0 bg-light">
                    <Card.Body>
                      <h3 className="text-success">85%</h3>
                      <small>Faster Development</small>
                      <p className="small text-muted mt-2">
                        QE teams generate automation code in minutes instead of days
                      </p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="text-center border-0 bg-light">
                    <Card.Body>
                      <h3 className="text-primary">$50K+</h3>
                      <small>Monthly Savings</small>
                      <p className="small text-muted mt-2">
                        DevOps teams reduce infrastructure costs through AI optimization
                      </p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="text-center border-0 bg-light">
                    <Card.Body>
                      <h3 className="text-warning">90%</h3>
                      <small>Faster Security Scans</small>
                      <p className="small text-muted mt-2">
                        Security teams identify vulnerabilities in minutes, not weeks
                      </p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="text-center border-0 bg-light">
                    <Card.Body>
                      <h3 className="text-info">24/7</h3>
                      <small>Automated Analysis</small>
                      <p className="small text-muted mt-2">
                        Business teams get real-time insights without manual reporting
                      </p>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
              
              <hr />
              
              <Row className="mt-3">
                <Col md={6}>
                  <h6><strong>For Engineering Teams:</strong></h6>
                  <ul className="small">
                    <li><strong>QE Teams:</strong> Generate Selenium, Postman, Karate tests instantly - save 20+ hours per sprint</li>
                    <li><strong>DevOps Teams:</strong> AI finds cost optimizations worth $15K-50K/month automatically</li>
                    <li><strong>Security Teams:</strong> Continuous vulnerability scanning replaces manual audits</li>
                  </ul>
                </Col>
                <Col md={6}>
                  <h6>💼 <strong>For Business Leaders:</strong></h6>
                  <ul className="small">
                    <li><strong>Reduce Costs:</strong> 30-50% reduction in manual testing and infrastructure waste</li>
                    <li><strong>Faster Time-to-Market:</strong> Deploy features 2-3x faster with automated testing</li>
                    <li><strong>Risk Reduction:</strong> Catch security issues and performance problems before production</li>
                  </ul>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Real Examples Section */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header className="bg-light">
              <h5 className="mb-0 text-dark">Customer Success Stories</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <Card className="mb-3 border-success">
                    <Card.Header className="bg-success text-white">
                      <strong>Shopify - QE Automation Success</strong>
                    </Card.Header>
                    <Card.Body>
                      <h6>Payment System Test Automation</h6>
                      <p className="small mb-2">
                        <strong>Challenge:</strong> Manual testing of checkout flow took 3 days per release
                      </p>
                      <p className="small mb-2">
                        <strong>Solution:</strong> Generated complete Selenium + Postman automation suite:
                      </p>
                      <ul className="small">
                        <li>23 Selenium tests for UI flows (Python + PyTest)</li>
                        <li>18 Postman API tests for payment processing</li>
                        <li>12 security tests (SQL injection, XSS prevention)</li>
                        <li>8 performance tests for Black Friday load</li>
                      </ul>
                      <div className="bg-light p-2 rounded mt-2">
                        <strong className="text-success">Business Impact:</strong>
                        <ul className="small mb-0 mt-1">
                          <li><strong>$45K saved</strong> per quarter (reduced QE contractor costs)</li>
                          <li><strong>85% faster</strong> testing cycles (3 days → 4 hours)</li>
                          <li><strong>40% fewer</strong> production bugs (better test coverage)</li>
                          <li>🚀 <strong>2x faster</strong> feature releases</li>
                        </ul>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="mb-3 border-warning">
                    <Card.Header className="bg-warning text-dark">
                      <strong>Netflix - DevOps Cost Optimization</strong>
                    </Card.Header>
                    <Card.Body>
                      <h6>Multi-Cloud Infrastructure Analysis</h6>
                      <p className="small mb-2">
                        <strong>Challenge:</strong> $2.3M monthly cloud spend with unknown optimization opportunities
                      </p>
                      <p className="small mb-2">
                        <strong>Solution:</strong> AI analyzed 1,200+ instances across AWS, GCP, Azure:
                      </p>
                      <ul className="small">
                        <li>Identified $340K/month in Reserved Instance savings</li>
                        <li>Found 23% over-provisioned compute resources</li>
                        <li>Detected memory leaks causing 30% performance loss</li>
                        <li>Discovered 156 unused load balancers and storage volumes</li>
                      </ul>
                      <div className="bg-light p-2 rounded mt-2">
                        <strong className="text-warning">Business Impact:</strong>
                        <ul className="small mb-0 mt-1">
                          <li><strong>$4.1M saved</strong> annually (18% cost reduction)</li>
                          <li><strong>35% better</strong> application performance</li>
                          <li><strong>90% less</strong> manual infrastructure monitoring</li>
                          <li><strong>99.99%</strong> uptime achieved (from 99.7%)</li>
                        </ul>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
              
              <Row>
                <Col md={6}>
                  <Card className="mb-3 border-danger">
                    <Card.Header className="bg-danger text-white">
                      <strong>Security Agent Preview</strong>
                    </Card.Header>
                    <Card.Body>
                      <h6>Kubernetes Security Audit</h6>
                      <p className="small mb-2">
                        Scanned 127 containers and found:
                      </p>
                      <ul className="small">
                        <li>23 high-severity vulnerabilities</li>
                        <li>8 containers running as root</li>
                        <li>12 exposed secrets in environment variables</li>
                        <li>5 network policies violations</li>
                      </ul>
                      <Badge bg="danger" className="me-2">Critical Issues</Badge>
                      <Badge bg="secondary">Coming Soon</Badge>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="mb-3 border-primary">
                    <Card.Header className="bg-primary text-white">
                      <strong>Business Agent Preview</strong>
                    </Card.Header>
                    <Card.Body>
                      <h6>Sales Data Analysis</h6>
                      <p className="small mb-2">
                        Analyzed 6 months of sales data and discovered:
                      </p>
                      <ul className="small">
                        <li>23% revenue increase opportunity</li>
                        <li>Customer churn pattern identification</li>
                        <li>Seasonal trend predictions</li>
                        <li>Product recommendation optimization</li>
                      </ul>
                      <Badge bg="primary" className="me-2">High Impact</Badge>
                      <Badge bg="secondary">Coming Soon</Badge>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* ROI Calculator */}
      <Row className="mb-4">
        <Col>
          <Card className="border-primary">
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">ROI Calculator</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={8}>
                  <h6>Typical Savings for Mid-Size Company (500-2000 employees):</h6>
                  <Row className="mt-3">
                    <Col md={6}>
                      <div className="border rounded p-3 mb-3">
                        <h6 className="text-primary">QE Team Savings</h6>
                        <ul className="small mb-2">
                          <li><strong>Before:</strong> 3 QE engineers × 40 hours/week × $75/hour = $9,000/week</li>
                          <li><strong>After:</strong> 85% automation → Save $7,650/week</li>
                        </ul>
                        <Badge bg="success">$398K saved annually</Badge>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="border rounded p-3 mb-3">
                        <h6 className="text-warning">DevOps Team Savings</h6>
                        <ul className="small mb-2">
                          <li><strong>Infrastructure costs:</strong> $50K/month typical</li>
                          <li><strong>AI optimization:</strong> 20-30% reduction</li>
                        </ul>
                        <Badge bg="success">$120K-180K saved annually</Badge>
                      </div>
                    </Col>
                  </Row>
                  <div className="bg-success text-white p-3 rounded">
                    <h5 className="mb-2">Total Annual ROI: $518K - $578K</h5>
                    <p className="mb-0 small">
                      <strong>Platform Cost:</strong> $50K/year → <strong>ROI: 936% - 1,056%</strong>
                    </p>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="text-center">
                    <h6>Payback Period</h6>
                    <div className="display-4 text-success">1.2</div>
                    <p className="lead">months</p>
                    <hr />
                    <Button variant="success" size="lg" className="w-100 mb-2">
                      Schedule ROI Demo
                    </Button>
                    <Button variant="outline-primary" size="sm" className="w-100">
                      Download Business Case
                    </Button>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Recent Activity */}
      <Row>
        <Col md={8}>
          <Card>
            <Card.Header className="bg-secondary text-white">
              <h5 className="mb-0">Available Agents</h5>
            </Card.Header>
            <Card.Body>
              {recentExecutions.map((execution, index) => (
                <div key={index} className="d-flex justify-content-between align-items-center mb-2 p-2 border-bottom">
                  <div>
                    <strong>{execution.agent}</strong>
                    <br />
                    <small className="text-muted">{execution.details}</small>
                    <br />
                    <small className="text-muted">ID: {execution.id}</small>
                  </div>
                  <div className="text-end">
                    <Badge bg={execution.status === 'completed' ? 'success' : 'warning'}>
                      {execution.status}
                    </Badge>
                    <br />
                    <small className="text-muted">{execution.time}</small>
                  </div>
                </div>
              ))}
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card>
            <Card.Header className="bg-info text-white">
              <h5 className="mb-0">Platform Health</h5>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <div className="d-flex justify-content-between">
                  <span>Uptime</span>
                  <Badge bg="success">{stats.uptime}%</Badge>
                </div>
              </div>
              <div className="mb-3">
                <div className="d-flex justify-content-between">
                  <span>Active Agents</span>
                  <Badge bg="primary">{stats.totalAgents}</Badge>
                </div>
              </div>
              <div className="mb-3">
                <div className="d-flex justify-content-between">
                  <span>Response Time</span>
                  <Badge bg="info">{stats.avgResponseTime}s</Badge>
                </div>
              </div>
              <Button variant="outline-primary" size="sm" className="w-100 mb-2">
                View Detailed Metrics
              </Button>
              <Button variant="success" size="sm" className="w-100">
                See Live Examples
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;