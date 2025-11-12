import React from 'react';
import { Container, Row, Col, Card, Button, Badge, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { theme } from '../styles/theme';

const AnalyticsComparison: React.FC = () => {
  return (
    <Container fluid style={{ padding: theme.spacing['3xl'], backgroundColor: theme.colors.backgroundSecondary, minHeight: '100vh' }}>
      <div style={{ textAlign: 'center', marginBottom: theme.spacing['3xl'] }}>
        <h1 style={{ 
          fontSize: theme.typography.fontSize['3xl'],
          fontWeight: theme.typography.fontWeight.bold,
          color: theme.colors.primary,
          marginBottom: theme.spacing.sm
        }}>
          Analytics Platform Comparison
        </h1>
        <p style={{ 
          fontSize: theme.typography.fontSize.lg,
          color: theme.colors.textSecondary,
          margin: 0
        }}>
          Compare real-time analytics with advanced business intelligence
        </p>
      </div>

      <Row>
        <Col md={6}>
          <Card style={{ height: '100%', borderColor: theme.colors.primary }}>
            <Card.Header style={{ backgroundColor: theme.colors.primaryLight }}>
              <h4 style={{ margin: 0, color: theme.colors.primary }}>📊 Real Analytics</h4>
              <Badge bg="primary">Live Data Version</Badge>
            </Card.Header>
            <Card.Body>
              <h5>Features:</h5>
              <ul>
                <li><strong>Real execution metrics</strong></li>
                <li><strong>Live success rate tracking</strong></li>
                <li><strong>Actual system performance</strong></li>
                <li><strong>Real agent performance data</strong></li>
                <li><strong>AWS services usage</strong></li>
                <li><strong>Live cost savings tracking</strong></li>
              </ul>
              
              <h5>Data Sources:</h5>
              <ul>
                <li><strong>Backend API integration</strong></li>
                <li><strong>S3 agent storage</strong></li>
                <li><strong>Real execution history</strong></li>
              </ul>
              
              <h5>Business Value:</h5>
              <ul>
                <li><strong>Actual operational insights</strong></li>
                <li><strong>Real performance monitoring</strong></li>
                <li><strong>Genuine cost tracking</strong></li>
              </ul>
              
              <div style={{ marginTop: theme.spacing.xl }}>
                <Link to="/analytics" style={{ textDecoration: 'none' }}>
                  <Button variant="primary" size="lg" className="w-100">
                    View Real Analytics
                  </Button>
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card style={{ height: '100%', borderColor: theme.colors.success }}>
            <Card.Header style={{ backgroundColor: theme.colors.successLight }}>
              <h4 style={{ margin: 0, color: theme.colors.success }}>💡 Business Intelligence</h4>
              <Badge bg="success">Advanced Version</Badge>
            </Card.Header>
            <Card.Body>
              <h5>Features:</h5>
              <ul>
                <li><strong>Real-time business metrics</strong></li>
                <li><strong>Predictive analytics & forecasting</strong></li>
                <li><strong>Market intelligence & benchmarking</strong></li>
                <li><strong>Strategic recommendations</strong></li>
                <li><strong>Advanced agent insights</strong></li>
                <li><strong>Executive dashboards</strong></li>
              </ul>
              
              <h5>Data Sources:</h5>
              <ul>
                <li><strong>Real backend API integration</strong></li>
                <li><strong>Actual S3 & Bedrock usage</strong></li>
                <li><strong>Live system monitoring</strong></li>
                <li><strong>Business context tracking</strong></li>
              </ul>
              
              <h5>Business Value:</h5>
              <ul>
                <li><strong>ROI calculation & cost optimization</strong></li>
                <li><strong>Strategic decision support</strong></li>
                <li><strong>Competitive positioning</strong></li>
                <li><strong>Performance optimization</strong></li>
              </ul>
              
              <div style={{ marginTop: theme.spacing.xl }}>
                <Link to="/business-intelligence" style={{ textDecoration: 'none' }}>
                  <Button variant="success" size="lg" className="w-100">
                    Experience Business Intelligence
                  </Button>
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row className="mt-4">
        <Col>
          <Alert variant="info">
            <Alert.Heading>🚀 Key Improvements</Alert.Heading>
            <Row>
              <Col md={4}>
                <h6>📈 Advanced Analytics</h6>
                <ul>
                  <li>Revenue impact tracking</li>
                  <li>Customer satisfaction scoring</li>
                  <li>Automation rate analysis</li>
                  <li>Time-to-market optimization</li>
                </ul>
              </Col>
              <Col md={4}>
                <h6>🤖 AI-Powered Insights</h6>
                <ul>
                  <li>Predictive growth modeling</li>
                  <li>Risk assessment scoring</li>
                  <li>Optimization recommendations</li>
                  <li>Usage pattern analysis</li>
                </ul>
              </Col>
              <Col md={4}>
                <h6>🏆 Business Intelligence</h6>
                <ul>
                  <li>Industry benchmarking</li>
                  <li>Competitive positioning</li>
                  <li>Market trend analysis</li>
                  <li>Strategic planning support</li>
                </ul>
              </Col>
            </Row>
          </Alert>
        </Col>
      </Row>
      
      <Row className="mt-4">
        <Col>
          <Card>
            <Card.Header>
              <h5 style={{ margin: 0 }}>🎯 Try It Yourself</h5>
            </Card.Header>
            <Card.Body>
              <p>To see the full transformation in action:</p>
              <ol>
                <li><strong>Execute some agents</strong> - Go to <Link to="/agents">Agents</Link> and run a few to generate real data</li>
                <li><strong>Compare dashboards</strong> - Switch between Standard Analytics and Business Intelligence</li>
                <li><strong>Explore insights</strong> - Check out the different tabs in Business Intelligence</li>
                <li><strong>Generate test data</strong> - Use the "Generate Test Data" button in development mode</li>
                <li><strong>View CloudWatch metrics</strong> - Check real AWS service monitoring at <Link to="/metrics">CloudWatch Metrics</Link></li>
                <li><strong>Monitor financial data</strong> - Track real AWS costs and ROI at <Link to="/finops">FinOps Dashboard</Link></li>
              </ol>
              
              <div style={{ display: 'flex', gap: theme.spacing.md, marginTop: theme.spacing.xl }}>
                <Link to="/agents" style={{ textDecoration: 'none' }}>
                  <Button variant="primary">Execute Agents</Button>
                </Link>
                <Link to="/analytics" style={{ textDecoration: 'none' }}>
                  <Button variant="outline-primary">Real Analytics</Button>
                </Link>
                <Link to="/business-intelligence" style={{ textDecoration: 'none' }}>
                  <Button variant="outline-success">Business Intelligence</Button>
                </Link>
                <Link to="/metrics" style={{ textDecoration: 'none' }}>
                  <Button variant="outline-info">CloudWatch Metrics</Button>
                </Link>
                <Link to="/finops" style={{ textDecoration: 'none' }}>
                  <Button variant="outline-warning">FinOps Dashboard</Button>
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AnalyticsComparison;