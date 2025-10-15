import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Badge, Modal, Form, Table, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { Icon } from './Icon';
import { calculateConservativeROI, formatCurrency, type ROIInputs } from '../utils/roiCalculator';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [showROICalculator, setShowROICalculator] = useState(false);
  const [showMethodology, setShowMethodology] = useState(false);
  const [roiInputs, setROIInputs] = useState<ROIInputs>({
    teamSize: 5,
    avgSalary: 80000,
    infraCost: 50000,
    companySize: 'midsize'
  });

  const stats = {
    totalAgents: 38,
    categories: 6,
    frameworks: 12,
    avgResponseTime: 1.1,
    uptime: 99.98,
    costPerExecution: 0.25
  };

  const availableAgents = [
    { 
      id: 'qe-test-generator-v2', 
      agent: 'QE Test Generator Pro', 
      status: 'ready', 
      category: 'QE & Testing',
      details: 'Selenium + Python framework • E-commerce testing',
      executionTime: '~2 min'
    },
    { 
      id: 'devops-monitor-v1', 
      agent: 'Kubernetes Optimizer', 
      status: 'ready', 
      category: 'DevOps',
      details: 'Resource optimization • Cost analysis',
      executionTime: '~5 min'
    },
    { 
      id: 'market-analyzer-v1', 
      agent: 'Market Data Analyzer', 
      status: 'ready', 
      category: 'Business Intelligence',
      details: 'Technical analysis • Trading signals',
      executionTime: '~3 min'
    },
    { 
      id: 'security-scanner-v1', 
      agent: 'Security Scanner', 
      status: 'ready', 
      category: 'Security',
      details: 'OWASP compliance • Vulnerability assessment',
      executionTime: '~4 min'
    },
    { 
      id: 'business-analyst-v1', 
      agent: 'Business Analyst', 
      status: 'ready', 
      category: 'Business Intelligence',
      details: 'Sales forecasting • Customer analytics',
      executionTime: '~6 min'
    },
    { 
      id: 'custom-upload', 
      agent: 'Custom Agent Upload', 
      status: 'ready', 
      category: 'Platform',
      details: 'Platform extensibility • Team collaboration',
      executionTime: 'Variable'
    }
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
                    <Icon name="grid" size="small" className="me-2" />
                    Browse Agents
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
                    <Icon name="play" size="small" className="me-2" />
                    Quick Execute
                  </Button>
                </Col>
                <Col md={3}>
                  <Button 
                    variant="outline-info" 
                    size="lg" 
                    className="w-100 mb-2 d-flex align-items-center justify-content-center"
                    onClick={() => navigate('/manage')}
                  >
                    <Icon name="settings" size="small" className="me-2" />
                    Management
                  </Button>
                </Col>
                <Col md={3}>
                  <Button 
                    variant="outline-secondary" 
                    size="lg" 
                    className="w-100 mb-2 d-flex align-items-center justify-content-center"
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
                    variant="outline-dark" 
                    size="lg" 
                    className="w-100 mb-2 d-flex align-items-center justify-content-center"
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
                    variant="outline-warning" 
                    size="lg" 
                    className="w-100 mb-2 d-flex align-items-center justify-content-center"
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
                    className="w-100 mb-2 d-flex align-items-center justify-content-center"
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

      {/* Platform Benefits */}
      <Row className="mb-4">
        <Col>
          <Card className="border-info">
            <Card.Header className="bg-info text-white">
              <h5 className="mb-0 d-flex align-items-center">
                <Icon name="agentHub" size="small" className="me-2" />
                Platform Benefits
              </h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={3}>
                  <Card className="text-center border-0 bg-light">
                    <Card.Body>
                      <Icon name="time" size="xlarge" color="success" />
                      <h6>Faster Development</h6>
                      <p className="small text-muted">
                        Generate automation code in minutes instead of hours
                      </p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="text-center border-0 bg-light">
                    <Card.Body>
                      <Icon name="target" size="xlarge" color="primary" />
                      <h6>Smart Optimization</h6>
                      <p className="small text-muted">
                        AI-powered insights for infrastructure and cost optimization
                      </p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="text-center border-0 bg-light">
                    <Card.Body>
                      <Icon name="view" size="xlarge" color="warning" />
                      <h6>Automated Analysis</h6>
                      <p className="small text-muted">
                        Continuous monitoring and vulnerability detection
                      </p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="text-center border-0 bg-light">
                    <Card.Body>
                      <Icon name="activity" size="xlarge" color="info" />
                      <h6>Seamless Integration</h6>
                      <p className="small text-muted">
                        Easy integration with existing tools and workflows
                      </p>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
              
              <hr />
              
              <Row className="mt-3">
                <Col md={6}>
                  <h6 className="d-flex align-items-center">
                    <Icon name="settings" size="small" className="me-2" />
                    <strong>For Development Teams:</strong>
                  </h6>
                  <ul className="small">
                    <li><strong>QE Teams:</strong> Generate test suites for Cypress, Selenium, and Playwright</li>
                    <li><strong>DevOps Teams:</strong> Automated infrastructure analysis and recommendations</li>
                    <li><strong>Security Teams:</strong> Continuous vulnerability scanning and compliance checks</li>
                  </ul>
                </Col>
                <Col md={6}>
                  <h6 className="d-flex align-items-center">
                    <Icon name="analytics" size="small" className="me-2" />
                    <strong>For Organizations:</strong>
                  </h6>
                  <ul className="small">
                    <li><strong>Efficiency:</strong> Reduce manual work and repetitive tasks</li>
                    <li><strong>Quality:</strong> Consistent and comprehensive automation</li>
                    <li><strong>Scalability:</strong> Support growing teams and complex projects</li>
                  </ul>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Enterprise Integration Highlight */}
      <Row className="mb-4">
        <Col>
          <Card className="border-primary">
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0 d-flex align-items-center">
                <Icon name="enterprise" size="small" className="me-2" />
                Enterprise API Integration
              </h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={8}>
                  <h6>Integrate Any Agent Into Your Existing Workflows</h6>
                  <p className="mb-3">
                    Use our agents directly in your applications, CI/CD pipelines, or custom tools. 
                    No need to use our UI - integrate programmatically with REST APIs, SDKs, or CLI tools.
                  </p>
                  
                  <Row>
                    <Col md={6}>
                      <h6 className="text-primary d-flex align-items-center">
                        <Icon name="upload" size="small" className="me-2" />
                        Quick Integration
                      </h6>
                      <ul className="small">
                        <li><strong>5-minute setup</strong> with API keys</li>
                        <li><strong>SDKs available</strong> for Python, JavaScript, Java</li>
                        <li><strong>CI/CD ready</strong> with GitHub Actions, Jenkins</li>
                        <li><strong>Real-time webhooks</strong> for notifications</li>
                      </ul>
                    </Col>
                    <Col md={6}>
                      <h6 className="text-success d-flex align-items-center">
                        <Icon name="target" size="small" className="me-2" />
                        Use Cases
                      </h6>
                      <ul className="small">
                        <li><strong>QA Teams:</strong> Auto-generate tests in CI/CD</li>
                        <li><strong>DevOps:</strong> Daily cost optimization reports</li>
                        <li><strong>Security:</strong> Automated compliance scanning</li>
                        <li><strong>Business:</strong> Scheduled analytics reports</li>
                      </ul>
                    </Col>
                  </Row>
                </Col>
                <Col md={4} className="text-center">
                  <div className="bg-light p-3 rounded">
                    <h4 className="text-primary">753%</h4>
                    <small>Year 1 ROI</small>
                    <hr />
                    <h4 className="text-success">1.4mo</h4>
                    <small>Payback Period</small>
                    <hr />
                    <Button 
                      variant="primary" 
                      size="lg" 
                      className="w-100"
                      onClick={() => navigate('/integration-guide')}
                    >
                      View Integration Guide
                    </Button>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Platform Capabilities */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header className="bg-light">
              <h5 className="mb-0 text-dark d-flex align-items-center">
                <Icon name="target" size="small" className="me-2" />
                Platform Capabilities
              </h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={3}>
                  <Card className="text-center border-0 bg-light mb-3">
                    <Card.Body>
                      <Icon name="agent" size="xlarge" color="success" />
                      <h6 className="mt-2">QE & Testing</h6>
                      <p className="small text-muted">
                        Automated test generation for Selenium, Cypress, Playwright, and API testing frameworks
                      </p>
                      <Badge bg="success">15+ Agents</Badge>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="text-center border-0 bg-light mb-3">
                    <Card.Body>
                      <Icon name="database" size="xlarge" color="warning" />
                      <h6 className="mt-2">DevOps & Infrastructure</h6>
                      <p className="small text-muted">
                        Cloud cost optimization, performance monitoring, and infrastructure analysis
                      </p>
                      <Badge bg="warning">12+ Agents</Badge>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="text-center border-0 bg-light mb-3">
                    <Card.Body>
                      <Icon name="shield" size="xlarge" color="danger" />
                      <h6 className="mt-2">Security & Compliance</h6>
                      <p className="small text-muted">
                        Vulnerability scanning, compliance auditing, and security best practices
                      </p>
                      <Badge bg="danger">8+ Agents</Badge>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="text-center border-0 bg-light mb-3">
                    <Card.Body>
                      <Icon name="analytics" size="xlarge" color="info" />
                      <h6 className="mt-2">Business Intelligence</h6>
                      <p className="small text-muted">
                        Data analysis, reporting automation, and business insights generation
                      </p>
                      <Badge bg="info">10+ Agents</Badge>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
              
              <div className="text-center mt-4">
                <Button 
                  variant="primary" 
                  size="lg"
                  onClick={() => navigate('/agents')}
                  className="me-3"
                >
                  <Icon name="grid" size="small" className="me-2" />
                  Explore Agent Catalog
                </Button>
                <Button 
                  variant="outline-success" 
                  size="lg"
                  onClick={() => navigate('/integration-guide')}
                >
                  <Icon name="view" size="small" className="me-2" />
                  View Integration Examples
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* ROI Calculator */}
      <Row className="mb-4">
        <Col>
          <Card className="border-primary">
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">Realistic ROI Projections</h5>
              <small className="text-light">Conservative estimates based on industry benchmarks</small>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={8}>
                  <h6>Conservative Savings for Mid-Size Company (100-1000 employees):</h6>
                  <Row className="mt-3">
                    <Col md={6}>
                      <div className="border rounded p-3 mb-3">
                        <h6 className="text-primary">QE Team Efficiency</h6>
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
                        <h6 className="text-warning">Infrastructure Optimization</h6>
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
                    <h6 className="mb-2">Conservative Annual Impact</h6>
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
                    <h6>Conservative Payback</h6>
                    <div className="display-4 text-success">4.7</div>
                    <p className="lead">months</p>
                    <small className="text-muted">Includes implementation time & risk buffer</small>
                    <hr />
                    <Button 
                      variant="success" 
                      size="lg" 
                      className="w-100 mb-2"
                      onClick={() => setShowROICalculator(true)}
                    >
                      <Icon name="chart" size="small" className="me-2" />
                      Calculate Your ROI
                    </Button>
                    <Button 
                      variant="outline-primary" 
                      size="sm" 
                      className="w-100"
                      onClick={() => setShowMethodology(true)}
                    >
                      <Icon name="view" size="small" className="me-2" />
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
            <Card.Header className="bg-secondary text-white">
              <h5 className="mb-0">Available Agents</h5>
            </Card.Header>
            <Card.Body>
              {availableAgents.map((agent, index) => (
                <div key={index} className="mb-3 p-3 border rounded hover-shadow" style={{ cursor: 'pointer' }}>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="flex-grow-1">
                      <div className="mb-1">
                        <strong>{agent.agent}</strong>
                      </div>
                      <small className="text-muted d-block mb-1">{agent.details}</small>
                      <div className="d-flex align-items-center">
                        <Badge bg="light" text="dark" className="me-2 small">
                          <Icon name="time" size="small" className="me-1" />
                          {agent.executionTime}
                        </Badge>
                        <Badge bg="info" className="small">
                          {agent.category}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-end ms-3">
                      <Badge bg="success" className="mb-2 d-block">
                        <Icon name="success" size="small" className="me-1" />
                        Ready
                      </Badge>
                      <Button 
                        variant="primary" 
                        size="sm"
                        onClick={() => navigate(`/agents/${agent.id}/execute`)}
                        className="d-flex align-items-center"
                      >
                        <Icon name="play" size="small" className="me-1" />
                        Launch
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="text-center mt-3 pt-3 border-top">
                <Button 
                  variant="outline-primary" 
                  onClick={() => navigate('/agents')}
                  className="d-flex align-items-center justify-content-center w-100"
                >
                  <Icon name="grid" size="small" className="me-2" />
                  View All Agents in Catalog
                </Button>
              </div>
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
              <Button 
                variant="outline-primary" 
                size="sm" 
                className="w-100 mb-2"
                onClick={() => navigate('/metrics')}
              >
                <Icon name="activity" size="small" className="me-1" />
                View CloudWatch Metrics
              </Button>
              <Button 
                variant="success" 
                size="sm" 
                className="w-100"
                onClick={() => navigate('/agents')}
              >
                <Icon name="grid" size="small" className="me-1" />
                See Live Examples
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* ROI Calculator Modal */}
      <Modal show={showROICalculator} onHide={() => setShowROICalculator(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <Icon name="chart" size="small" className="me-2" />
            AgentHub ROI Calculator
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info">
            <strong>Industry-Standard ROI Analysis</strong><br />
            Calculate your return on investment using conservative estimates based on real automation studies and industry benchmarks.
          </Alert>

          <Row>
            <Col md={6}>
              <h6>Input Parameters</h6>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Company Size</Form.Label>
                  <Form.Select 
                    value={roiInputs.companySize} 
                    onChange={(e) => setROIInputs({...roiInputs, companySize: e.target.value as any})}
                  >
                    <option value="startup">Startup (10-100 employees)</option>
                    <option value="midsize">Mid-size (100-1000 employees)</option>
                    <option value="enterprise">Enterprise (1000+ employees)</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Engineering Team Size: {roiInputs.teamSize}</Form.Label>
                  <Form.Range
                    min={1}
                    max={50}
                    value={roiInputs.teamSize}
                    onChange={(e) => setROIInputs({...roiInputs, teamSize: parseInt(e.target.value)})}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Average Engineer Salary: ${roiInputs.avgSalary.toLocaleString()}</Form.Label>
                  <Form.Range
                    min={60000}
                    max={200000}
                    step={5000}
                    value={roiInputs.avgSalary}
                    onChange={(e) => setROIInputs({...roiInputs, avgSalary: parseInt(e.target.value)})}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Monthly Infrastructure Cost: ${roiInputs.infraCost.toLocaleString()}</Form.Label>
                  <Form.Range
                    min={5000}
                    max={200000}
                    step={2500}
                    value={roiInputs.infraCost}
                    onChange={(e) => setROIInputs({...roiInputs, infraCost: parseInt(e.target.value)})}
                  />
                </Form.Group>
              </Form>
            </Col>

            <Col md={6}>
              {(() => {
                const results = calculateConservativeROI(roiInputs);
                return (
                  <>
                    <h6>ROI Analysis Results</h6>
                    <Table striped bordered size="sm">
                      <tbody>
                        <tr>
                          <td><strong>QE Time Savings</strong></td>
                          <td>{formatCurrency(results.monthlyQESavings)}/month</td>
                        </tr>
                        <tr>
                          <td><strong>Infrastructure Optimization</strong></td>
                          <td>{formatCurrency(results.monthlyInfraSavings)}/month</td>
                        </tr>
                        <tr className="table-primary">
                          <td><strong>Total Monthly Savings</strong></td>
                          <td><strong>{formatCurrency(results.monthlyTotalSavings)}/month</strong></td>
                        </tr>
                        <tr>
                          <td><strong>Annual Savings (Year 1)</strong></td>
                          <td>{formatCurrency(results.annualSavings)}/year</td>
                        </tr>
                        <tr>
                          <td><strong>Platform Investment</strong></td>
                          <td>{formatCurrency(results.platformCost)}/year</td>
                        </tr>
                        <tr className="table-success">
                          <td><strong>Net ROI</strong></td>
                          <td><strong>{results.roi > 0 ? '+' : ''}{results.roi.toFixed(0)}%</strong></td>
                        </tr>
                        <tr className="table-warning">
                          <td><strong>Payback Period</strong></td>
                          <td><strong>{results.paybackMonths.toFixed(1)} months</strong></td>
                        </tr>
                      </tbody>
                    </Table>

                    <Alert variant="light" className="small">
                      <strong>Conservative Assumptions Applied:</strong>
                      <ul className="mb-0 mt-1">
                        <li>QE efficiency gain: {(results.assumptions.qeTimeSavingsPercent * 100).toFixed(0)}%</li>
                        <li>Infrastructure optimization: {(results.assumptions.infraOptimizationPercent * 100).toFixed(0)}%</li>
                        <li>Team adoption rate: {(results.assumptions.adoptionRatePercent * 100).toFixed(0)}%</li>
                        <li>Risk adjustment: {((1 - results.assumptions.riskAdjustmentFactor) * 100).toFixed(0)}% buffer</li>
                        <li>Implementation time: {results.assumptions.implementationTimeWeeks} weeks</li>
                      </ul>
                    </Alert>
                  </>
                );
              })()}
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowROICalculator(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={() => navigate('/business-case')}>
            View Detailed Business Case
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Methodology Modal */}
      <Modal show={showMethodology} onHide={() => setShowMethodology(false)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>
            <Icon name="view" size="small" className="me-2" />
            ROI Calculation Methodology
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>
            <Col md={8}>
              <h5>Industry-Standard ROI Methodology</h5>
              <p>
                Our ROI calculations are based on established industry research, conservative estimates, 
                and real-world automation deployment data from enterprise customers.
              </p>

              <h6 className="mt-4">1. QE Time Savings Calculation</h6>
              <div className="bg-light p-3 rounded mb-3">
                <strong>Formula:</strong> Monthly QE Savings = (Team Size × Average Salary ÷ 12) × Time Savings % × Adoption Rate × Risk Adjustment
                <br /><br />
                <strong>Industry Benchmarks:</strong>
                <ul className="mb-0">
                  <li><strong>Startup:</strong> 20% time savings (smaller teams, simpler processes)</li>
                  <li><strong>Mid-size:</strong> 25% time savings (established processes, good adoption)</li>
                  <li><strong>Enterprise:</strong> 30% time savings (mature processes, dedicated resources)</li>
                </ul>
              </div>

              <h6>2. Infrastructure Optimization Calculation</h6>
              <div className="bg-light p-3 rounded mb-3">
                <strong>Formula:</strong> Monthly Infrastructure Savings = Monthly Infrastructure Cost × Optimization % × Risk Adjustment
                <br /><br />
                <strong>Optimization Rates:</strong>
                <ul className="mb-0">
                  <li><strong>Right-sizing:</strong> 8-15% typical savings (AWS Well-Architected Framework)</li>
                  <li><strong>Reserved Instances:</strong> 20-40% on committed usage</li>
                  <li><strong>Unused Resources:</strong> 5-12% waste elimination</li>
                  <li><strong>Performance Tuning:</strong> 10-25% efficiency gains</li>
                </ul>
              </div>

              <h6>3. Risk Adjustment Factors</h6>
              <div className="bg-light p-3 rounded mb-3">
                <strong>Conservative Buffers Applied:</strong>
                <ul className="mb-0">
                  <li><strong>Startup:</strong> 15% risk buffer (higher uncertainty)</li>
                  <li><strong>Mid-size:</strong> 20% risk buffer (organizational complexity)</li>
                  <li><strong>Enterprise:</strong> 25% risk buffer (change management challenges)</li>
                </ul>
              </div>

              <h6>4. Implementation Timeline</h6>
              <div className="bg-light p-3 rounded mb-3">
                <strong>Realistic Implementation Periods:</strong>
                <ul className="mb-0">
                  <li><strong>Startup:</strong> 6 weeks (faster decision-making, smaller scope)</li>
                  <li><strong>Mid-size:</strong> 8 weeks (moderate complexity, established processes)</li>
                  <li><strong>Enterprise:</strong> 12 weeks (compliance, security reviews, change management)</li>
                </ul>
              </div>

              <h6>5. Data Sources & Validation</h6>
              <Alert variant="info">
                <strong>Research Sources:</strong>
                <ul className="mb-0">
                  <li>Forrester Total Economic Impact studies on test automation</li>
                  <li>Gartner Magic Quadrant for Application Testing Services</li>
                  <li>AWS Well-Architected Framework cost optimization guidelines</li>
                  <li>DevOps Research and Assessment (DORA) State of DevOps reports</li>
                  <li>Internal customer case studies and deployment data</li>
                </ul>
              </Alert>
            </Col>

            <Col md={4}>
              <h6>ROI Formula Breakdown</h6>
              <Card className="mb-3">
                <Card.Header className="bg-primary text-white">
                  <strong>Total ROI Calculation</strong>
                </Card.Header>
                <Card.Body className="small">
                  <strong>ROI = (Annual Savings - Platform Cost) ÷ Platform Cost × 100</strong>
                  <hr />
                  <strong>Where:</strong>
                  <ul className="mb-0">
                    <li><strong>Annual Savings</strong> = (QE Savings + Infrastructure Savings) × 12 × (12 - Implementation Months) ÷ 12</li>
                    <li><strong>Platform Cost</strong> = Annual subscription fee</li>
                  </ul>
                </Card.Body>
              </Card>

              <h6>Payback Period</h6>
              <Card className="mb-3">
                <Card.Header className="bg-success text-white">
                  <strong>Time to Break Even</strong>
                </Card.Header>
                <Card.Body className="small">
                  <strong>Payback = Platform Cost ÷ Monthly Savings + Implementation Time</strong>
                  <hr />
                  Includes implementation delay and ramp-up period for realistic timeline.
                </Card.Body>
              </Card>

              <h6>Industry Comparisons</h6>
              <Table striped size="sm">
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th>Industry Avg</th>
                    <th>AgentHub</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Test Automation ROI</td>
                    <td>200-400%</td>
                    <td>150-300%</td>
                  </tr>
                  <tr>
                    <td>Payback Period</td>
                    <td>6-18 months</td>
                    <td>4-8 months</td>
                  </tr>
                  <tr>
                    <td>Time Savings</td>
                    <td>40-70%</td>
                    <td>20-30%</td>
                  </tr>
                </tbody>
              </Table>

              <Alert variant="warning" className="small">
                <strong>Note:</strong> Our projections are intentionally conservative compared to industry averages to ensure realistic expectations and successful implementations.
              </Alert>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowMethodology(false)}>
            Close
          </Button>
          <Button variant="success" onClick={() => {
            setShowMethodology(false);
            setShowROICalculator(true);
          }}>
            Try ROI Calculator
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Dashboard;