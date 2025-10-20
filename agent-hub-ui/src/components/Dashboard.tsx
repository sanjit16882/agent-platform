import React from 'react';
import { Container, Row, Col, Card, Button, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { Icon } from './Icon';
// Removed roiCalculator import - was demo/marketing content
import { useAgentContext } from '../context/AgentContext';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { getActiveAgentsCount } = useAgentContext();
  // Removed ROI calculator state - was demo/marketing content

  const baseAgentCount = 38;
  const deployedAgentCount = getActiveAgentsCount();
  console.log('Dashboard - deployed agent count:', deployedAgentCount);
  const stats = {
    totalAgents: baseAgentCount + deployedAgentCount,
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
                <Col md={3}>
                  <Button 
                    variant="outline-dark" 
                    size="lg" 
                    className="w-100 mb-2 d-flex align-items-center justify-content-center"
                    onClick={() => navigate('/integration')}
                  >
                    <Icon name="view" size="small" className="me-2" />
                    Documentation
                  </Button>
                </Col>
                <Col md={3}>
                  <Button 
                    variant="outline-success" 
                    size="lg" 
                    className="w-100 mb-2 d-flex align-items-center justify-content-center"
                    onClick={() => navigate('/api-docs')}
                  >
                    <Icon name="enterprise" size="small" className="me-2" />
                    API Docs
                  </Button>
                </Col>
                <Col md={3}>
                  <Button 
                    variant="outline-warning" 
                    size="lg" 
                    className="w-100 mb-2 d-flex align-items-center justify-content-center"
                    onClick={() => navigate('/analytics')}
                  >
                    <Icon name="chart" size="small" className="me-2" />
                    Analytics
                  </Button>
                </Col>
                <Col md={3}>
                  <Button 
                    variant="primary" 
                    size="lg" 
                    className="w-100 mb-2 d-flex align-items-center justify-content-center"
                    onClick={() => navigate('/metrics')}
                  >
                    <Icon name="activity" size="small" className="me-2" />
                    CloudWatch Metrics
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
                    <h5 className="text-primary">Enterprise Ready</h5>
                    <p className="small text-muted">
                      Production-grade API integration with comprehensive documentation and support
                    </p>
                    <Button 
                      variant="primary" 
                      size="lg" 
                      className="w-100 mb-2"
                      onClick={() => navigate('/integration-guide')}
                    >
                      View Integration Guide
                    </Button>
                    <Button 
                      variant="outline-primary" 
                      size="sm" 
                      className="w-100"
                      onClick={() => navigate('/enterprise')}
                    >
                      Enterprise API
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

      </Row>


    </Container>
  );
};

export default Dashboard;