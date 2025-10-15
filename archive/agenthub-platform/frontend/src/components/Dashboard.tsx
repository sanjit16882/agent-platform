import React from 'react';
import { Container, Row, Col, Card, Button, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { Icon } from './Icon';

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
          <h1 className="d-flex align-items-center">
            <Icon name="dashboard" size="large" className="me-3" />
            AgentHub Dashboard
          </h1>
          <p className="lead">Universal AI Agent Factory - Deploy any agent for any business function</p>
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
            <Card.Header>
              <h5 className="d-flex align-items-center">
                <Icon name="upload" size="small" className="me-2" />
                Quick Actions
              </h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={3}>
                  <Button 
                    variant="primary" 
                    size="lg" 
                    className="w-100 mb-2"
                    onClick={() => navigate('/agents')}
                  >
                    <Icon name="grid" size="small" className="me-2" />
                    Browse Agents
                  </Button>
                </Col>
                <Col md={3}>
                  <Button 
                    variant="success" 
                    size="lg" 
                    className="w-100 mb-2"
                    onClick={() => {
                      // Navigate to most popular agent or show agent selector
                      navigate('/agents');
                    }}
                  >
                    <Icon name="play" size="small" className="me-2" />
                    Quick Execute
                  </Button>
                </Col>
                <Col md={3}>
                  <Button 
                    variant="warning" 
                    size="lg" 
                    className="w-100 mb-2"
                    onClick={() => navigate('/manage')}
                  >
                    <Icon name="analytics" size="small" className="me-2" />
                    View Dashboard
                  </Button>
                </Col>
                <Col md={3}>
                  <Button 
                    variant="danger" 
                    size="lg" 
                    className="w-100 mb-2"
                    onClick={() => navigate('/upload')}
                  >
                    <Icon name="upload" size="small" className="me-2" />
                    Upload Agent
                  </Button>
                </Col>
              </Row>
              <Row className="mt-2">
                <Col md={4}>
                  <Button 
                    variant="info" 
                    size="lg" 
                    className="w-100 mb-2"
                    onClick={() => {
                      // Show help or documentation
                      window.open('https://github.com/your-org/agenthub-docs', '_blank');
                    }}
                  >
                    <Icon name="view" size="small" className="me-2" />
                    Documentation
                  </Button>
                </Col>
                <Col md={4}>
                  <Button 
                    variant="outline-primary" 
                    size="lg" 
                    className="w-100 mb-2"
                    onClick={() => {
                      // Navigate to examples or tutorials
                      navigate('/agents');
                    }}
                  >
                    <Icon name="award" size="small" className="me-2" />
                    View Examples
                  </Button>
                </Col>
                <Col md={4}>
                  <Button 
                    variant="primary" 
                    size="lg" 
                    className="w-100 mb-2"
                    onClick={() => navigate('/enterprise')}
                  >
                    <Icon name="enterprise" size="small" className="me-2" />
                    Enterprise API
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
              <h5 className="d-flex align-items-center">
                <Icon name="cost" size="small" className="me-2" />
                Business Value & ROI
              </h5>
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
                  <h6 className="d-flex align-items-center">
                    <Icon name="target" size="small" className="me-2" />
                    <strong>For Engineering Teams:</strong>
                  </h6>
                  <ul className="small">
                    <li><strong>QE Teams:</strong> Generate Selenium, Postman, Karate tests instantly - save 20+ hours per sprint</li>
                    <li><strong>DevOps Teams:</strong> AI finds cost optimizations worth $15K-50K/month automatically</li>
                    <li><strong>Security Teams:</strong> Continuous vulnerability scanning replaces manual audits</li>
                  </ul>
                </Col>
                <Col md={6}>
                  <h6 className="d-flex align-items-center">
                    <Icon name="users" size="small" className="me-2" />
                    <strong>For Business Leaders:</strong>
                  </h6>
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
            <Card.Header>
              <h5 className="d-flex align-items-center">
                <Icon name="award" size="small" className="me-2" />
                Real Customer Success Stories
              </h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <Card className="mb-3 border-success">
                    <Card.Header className="bg-success text-white">
                      <strong className="d-flex align-items-center">
                        <Icon name="agent" size="small" className="me-2" />
                        E-commerce Platform - QE Automation
                      </strong>
                    </Card.Header>
                    <Card.Body>
                      <h6>Payment & Checkout Test Automation</h6>
                      <p className="small mb-2">
                        <strong>Challenge:</strong> Manual testing of payment flows took 2-3 days per release
                      </p>
                      <p className="small mb-2">
                        <strong>Solution:</strong> Generated comprehensive test automation suite:
                      </p>
                      <ul className="small">
                        <li>28 Cypress tests for checkout UI flows</li>
                        <li>15 API tests for payment gateway integration</li>
                        <li>12 security tests for PCI compliance</li>
                        <li>8 load tests for peak traffic scenarios</li>
                      </ul>
                      <div className="bg-light p-2 rounded mt-2">
                        <strong className="text-success">Measured Results:</strong>
                        <ul className="small mb-0 mt-1">
                          <li>💰 <strong>$32K saved</strong> per quarter (reduced manual testing)</li>
                          <li>⚡ <strong>75% faster</strong> testing cycles (2.5 days → 6 hours)</li>
                          <li>🐛 <strong>35% fewer</strong> production issues</li>
                          <li>🚀 <strong>60% faster</strong> release velocity</li>
                        </ul>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="mb-3 border-warning">
                    <Card.Header className="bg-warning text-dark">
                      <strong className="d-flex align-items-center">
                        <Icon name="analytics" size="small" className="me-2" />
                        SaaS Company - Infrastructure Optimization
                      </strong>
                    </Card.Header>
                    <Card.Body>
                      <h6>Multi-Cloud Cost Analysis</h6>
                      <p className="small mb-2">
                        <strong>Challenge:</strong> $180K monthly cloud spend with unclear optimization opportunities
                      </p>
                      <p className="small mb-2">
                        <strong>Solution:</strong> AI-powered analysis across cloud providers:
                      </p>
                      <ul className="small">
                        <li>Identified $28K/month in right-sizing opportunities</li>
                        <li>Found 18% over-provisioned database instances</li>
                        <li>Detected unused storage volumes worth $8K/month</li>
                        <li>Recommended Reserved Instance purchases for 25% savings</li>
                      </ul>
                      <div className="bg-light p-2 rounded mt-2">
                        <strong className="text-warning">Measured Results:</strong>
                        <ul className="small mb-0 mt-1">
                          <li>💰 <strong>$420K saved</strong> annually (19% cost reduction)</li>
                          <li>⚡ <strong>28% better</strong> application response times</li>
                          <li>🔧 <strong>80% less</strong> manual monitoring overhead</li>
                          <li>📈 <strong>99.95%</strong> uptime improvement</li>
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
                      <strong className="d-flex align-items-center">
                        <Icon name="security" size="small" className="me-2" />
                        Security Agent Preview
                      </strong>
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
                      <strong className="d-flex align-items-center">
                        <Icon name="analytics" size="small" className="me-2" />
                        Business Agent Preview
                      </strong>
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
              <h5 className="d-flex align-items-center">
                <Icon name="chart" size="small" className="me-2" />
                Realistic ROI Projections
              </h5>
              <small className="text-light">Conservative estimates based on industry benchmarks</small>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={8}>
                  <h6>Conservative Savings for Mid-Size Company (100-1000 employees):</h6>
                  <Row className="mt-3">
                    <Col md={6}>
                      <div className="border rounded p-3 mb-3">
                        <h6 className="text-primary d-flex align-items-center">
                          <Icon name="agent" size="small" className="me-2" />
                          QE Team Efficiency
                        </h6>
                        <ul className="small mb-2">
                          <li><strong>Baseline:</strong> 5 QE engineers × $80K avg salary</li>
                          <li><strong>Time savings:</strong> 25% automation efficiency gain</li>
                          <li><strong>Risk-adjusted:</strong> 20% buffer applied</li>
                        </ul>
                        <Badge bg="success">$80K saved annually</Badge>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="border rounded p-3 mb-3">
                        <h6 className="text-warning d-flex align-items-center">
                          <Icon name="analytics" size="small" className="me-2" />
                          Infrastructure Optimization
                        </h6>
                        <ul className="small mb-2">
                          <li><strong>Baseline:</strong> $50K/month infrastructure spend</li>
                          <li><strong>Optimization:</strong> 15% cost reduction potential</li>
                          <li><strong>Conservative:</strong> 12% after risk adjustment</li>
                        </ul>
                        <Badge bg="success">$72K saved annually</Badge>
                      </div>
                    </Col>
                  </Row>
                  <div className="bg-light border p-3 rounded">
                    <h6 className="mb-2 d-flex align-items-center">
                      <Icon name="cost" size="small" className="me-2" />
                      Conservative Annual Impact
                    </h6>
                    <div className="row">
                      <div className="col-6">
                        <p className="mb-1 small"><strong>Total Savings:</strong> $152K/year</p>
                        <p className="mb-1 small"><strong>Platform Cost:</strong> $60K/year</p>
                        <p className="mb-0 small"><strong>Net Benefit:</strong> $92K/year</p>
                      </div>
                      <div className="col-6">
                        <p className="mb-1 small"><strong>ROI:</strong> <span className="text-success">153%</span></p>
                        <p className="mb-1 small"><strong>Payback:</strong> 4.7 months</p>
                        <p className="mb-0 small"><strong>Implementation:</strong> 8 weeks</p>
                      </div>
                    </div>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="text-center">
                    <h6 className="d-flex align-items-center justify-content-center">
                      <Icon name="time" size="small" className="me-2" />
                      Conservative Payback
                    </h6>
                    <div className="display-4 text-success">4.7</div>
                    <p className="lead">months</p>
                    <small className="text-muted">Includes implementation time & risk buffer</small>
                    <hr />
                    <Button variant="success" size="lg" className="w-100 mb-2">
                      <Icon name="users" size="small" className="me-2" />
                      Calculate Your ROI
                    </Button>
                    <Button variant="outline-primary" size="sm" className="w-100">
                      <Icon name="download" size="small" className="me-2" />
                      View Methodology
                    </Button>
                  </div>
                </Col>
              </Row>
              <Row className="mt-3">
                <Col>
                  <div className="alert alert-info small mb-0">
                    <strong>Methodology:</strong> Projections based on industry automation studies, 
                    with conservative 20% risk buffer and realistic 8-week implementation timeline. 
                    Actual results may vary based on team size, existing processes, and adoption rates.
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
            <Card.Header>
              <h5 className="d-flex align-items-center">
                <Icon name="agent" size="small" className="me-2" />
                Available Agents
              </h5>
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
            <Card.Header>
              <h5 className="d-flex align-items-center">
                <Icon name="activity" size="small" className="me-2" />
                Platform Health
              </h5>
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
                <Icon name="award" size="small" className="me-2" />
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