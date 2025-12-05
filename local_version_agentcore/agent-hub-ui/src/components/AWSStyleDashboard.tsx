import React from 'react';
import { Container, Row, Col, Card, Button, Badge, Breadcrumb, Table } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAgentContext } from '../context/AgentContext';
import '../styles/aws-inspired-theme.css';

const AWSStyleDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { getActiveAgentsCount } = useAgentContext();

  const baseAgentCount = 38;
  const deployedAgentCount = getActiveAgentsCount();
  const stats = {
    totalAgents: baseAgentCount + deployedAgentCount,
    categories: 6,
    frameworks: 12,
    avgResponseTime: 1.1,
    uptime: 99.98
  };

  const recentActivity = [
    { 
      id: 1,
      action: 'Agent Execution',
      resource: 'Security Scanner v2.1',
      status: 'Completed',
      timestamp: '2 minutes ago',
      user: 'john.developer@company.com'
    },
    { 
      id: 2,
      action: 'Template Published',
      resource: 'Data Validator Pro',
      status: 'Published',
      timestamp: '15 minutes ago',
      user: 'jane.business@company.com'
    },
    { 
      id: 3,
      action: 'Integration Added',
      resource: 'Snowflake Analytics',
      status: 'Configured',
      timestamp: '1 hour ago',
      user: 'admin@company.com'
    },
    { 
      id: 4,
      action: 'Cost Alert',
      resource: 'Multi-Cloud Deployment',
      status: 'Warning',
      timestamp: '2 hours ago',
      user: 'finops@company.com'
    }
  ];

  const quickActions = [
    {
      title: 'Natural Language Agent',
      description: 'Describe your needs in plain English - AI will build the agent',
      action: () => navigate('/nl-agent-generator'),
      icon: '🧠',
      primary: true
    },
    {
      title: 'Hybrid Agent Builder',
      description: 'Build complex multi-component agents visually',
      action: () => navigate('/hybrid-builder'),
      icon: '🔧',
      primary: true
    },
    {
      title: 'Create Agent',
      description: 'Build a new agent from scratch or template',
      action: () => navigate('/agent-builder'),
      icon: '🤖',
      primary: false
    },
    {
      title: 'Browse Templates',
      description: 'Explore pre-built agent templates',
      action: () => navigate('/templates'),
      icon: '📋',
      primary: false
    },
    {
      title: 'View Analytics',
      description: 'Monitor performance and costs',
      action: () => navigate('/analytics'),
      icon: '📊',
      primary: false
    },
    {
      title: 'Manage Integrations',
      description: 'Configure system connections',
      action: () => navigate('/integration'),
      icon: '🔌',
      primary: false
    }
  ];

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, string> = {
      'Completed': 'aws-status-success',
      'Published': 'aws-status-success',
      'Configured': 'aws-status-info',
      'Warning': 'aws-status-warning',
      'Error': 'aws-status-danger'
    };
    return statusMap[status] || 'aws-status-info';
  };

  return (
    <div className="aws-layout">
      <Container fluid className="aws-main-content">
        {/* AWS-Style Breadcrumb */}
        <Breadcrumb className="aws-breadcrumb">
          <Breadcrumb.Item active>Agent Factory</Breadcrumb.Item>
          <Breadcrumb.Item active>Dashboard</Breadcrumb.Item>
        </Breadcrumb>

        {/* Page Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 className="h3 mb-1" style={{ color: 'var(--aws-gray-800)', fontWeight: 600 }}>
              Agent Factory Dashboard
            </h1>
            <p className="aws-text-muted mb-0">
              Monitor and manage your intelligent agent ecosystem
            </p>
          </div>
          <Button 
            className="aws-btn aws-btn-primary"
            onClick={() => navigate('/nl-agent-generator')}
          >
            Generate Agent with AI
          </Button>
        </div>

        {/* AWS-Style Metrics Cards */}
        <Row className="mb-4">
          <Col lg={3} md={6} className="mb-3">
            <div className="aws-metric-card">
              <div className="aws-metric-value">{stats.totalAgents}</div>
              <div className="aws-metric-label">Total Agents</div>
            </div>
          </Col>
          <Col lg={3} md={6} className="mb-3">
            <div className="aws-metric-card">
              <div className="aws-metric-value">{deployedAgentCount}</div>
              <div className="aws-metric-label">Active Deployments</div>
            </div>
          </Col>
          <Col lg={3} md={6} className="mb-3">
            <div className="aws-metric-card">
              <div className="aws-metric-value">{stats.avgResponseTime}s</div>
              <div className="aws-metric-label">Avg Response Time</div>
            </div>
          </Col>
          <Col lg={3} md={6} className="mb-3">
            <div className="aws-metric-card">
              <div className="aws-metric-value">{stats.uptime}%</div>
              <div className="aws-metric-label">System Uptime</div>
            </div>
          </Col>
        </Row>

        <Row>
          {/* Quick Actions */}
          <Col lg={8} className="mb-4">
            <div className="aws-card">
              <div className="aws-card-header">
                Quick Actions
              </div>
              <div className="aws-card-body">
                <Row>
                  {quickActions.map((action, index) => (
                    <Col md={6} key={index} className="mb-3">
                      <Card 
                        className="h-100 border-0 aws-shadow"
                        style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                        onClick={action.action}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = 'var(--aws-shadow-md)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'var(--aws-shadow-sm)';
                        }}
                      >
                        <Card.Body className="d-flex align-items-start">
                          <div className="me-3" style={{ fontSize: '1.5rem' }}>
                            {action.icon}
                          </div>
                          <div className="flex-grow-1">
                            <h6 className="mb-1" style={{ color: 'var(--aws-blue)' }}>
                              {action.title}
                            </h6>
                            <p className="aws-text-muted small mb-0">
                              {action.description}
                            </p>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </div>
            </div>
          </Col>

          {/* System Status */}
          <Col lg={4} className="mb-4">
            <div className="aws-card">
              <div className="aws-card-header">
                System Status
              </div>
              <div className="aws-card-body">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="small">Agent Execution Service</span>
                  <span className="aws-status-badge aws-status-success">Operational</span>
                </div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="small">Integration Hub</span>
                  <span className="aws-status-badge aws-status-success">Operational</span>
                </div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="small">Multi-Cloud Platform</span>
                  <span className="aws-status-badge aws-status-success">Operational</span>
                </div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="small">Analytics Engine</span>
                  <span className="aws-status-badge aws-status-warning">Degraded</span>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="small">Secret Management</span>
                  <span className="aws-status-badge aws-status-success">Operational</span>
                </div>
              </div>
            </div>
          </Col>
        </Row>

        {/* Recent Activity */}
        <div className="aws-card">
          <div className="aws-card-header">
            Recent Activity
          </div>
          <div className="aws-table">
            <Table responsive className="mb-0">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Resource</th>
                  <th>Status</th>
                  <th>User</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.map((activity) => (
                  <tr key={activity.id}>
                    <td>
                      <strong>{activity.action}</strong>
                    </td>
                    <td>
                      <span className="aws-text-muted">{activity.resource}</span>
                    </td>
                    <td>
                      <span className={`aws-status-badge ${getStatusBadge(activity.status)}`}>
                        {activity.status}
                      </span>
                    </td>
                    <td>
                      <span className="small aws-text-muted">{activity.user}</span>
                    </td>
                    <td>
                      <span className="small aws-text-muted">{activity.timestamp}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </div>

        {/* AWS-Style Alert */}
        <div className="aws-alert aws-alert-info mt-4">
          <div className="d-flex align-items-start">
            <div className="me-2">ℹ️</div>
            <div>
              <strong>New Feature Available:</strong> Snowflake integration is now available in the Integration Hub. 
              Connect your data warehouse for advanced analytics capabilities.
              <Button 
                variant="link" 
                className="p-0 ms-2" 
                style={{ color: 'var(--aws-info)', textDecoration: 'underline' }}
                onClick={() => navigate('/integration')}
              >
                Learn more
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default AWSStyleDashboard;