import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Alert, Table, ProgressBar } from 'react-bootstrap';

interface MetricData {
  name: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  change: number;
  status: 'healthy' | 'warning' | 'critical';
}

interface AlarmData {
  id: string;
  name: string;
  metric: string;
  threshold: number;
  currentValue: number;
  state: 'OK' | 'ALARM' | 'INSUFFICIENT_DATA';
  description: string;
}

const CloudWatchMetrics: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const metrics: MetricData[] = [
    {
      name: 'Agent Executions/Hour',
      value: 247,
      unit: 'count',
      trend: 'up',
      change: 12.5,
      status: 'healthy'
    },
    {
      name: 'Average Execution Time',
      value: 2.34,
      unit: 'seconds',
      trend: 'down',
      change: -8.2,
      status: 'healthy'
    },
    {
      name: 'Error Rate',
      value: 0.8,
      unit: 'percent',
      trend: 'stable',
      change: 0.1,
      status: 'healthy'
    },
    {
      name: 'Lambda Invocations',
      value: 1847,
      unit: 'count',
      trend: 'up',
      change: 23.1,
      status: 'healthy'
    },
    {
      name: 'API Gateway Requests',
      value: 3421,
      unit: 'count',
      trend: 'up',
      change: 15.7,
      status: 'healthy'
    },
    {
      name: 'DynamoDB Read/Write',
      value: 892,
      unit: 'count',
      trend: 'up',
      change: 9.3,
      status: 'healthy'
    },
    {
      name: 'S3 Operations',
      value: 156,
      unit: 'count',
      trend: 'down',
      change: -3.2,
      status: 'healthy'
    },
    {
      name: 'Bedrock API Calls',
      value: 89,
      unit: 'count',
      trend: 'up',
      change: 45.6,
      status: 'warning'
    }
  ];

  const alarms: AlarmData[] = [
    {
      id: 'alarm-1',
      name: 'High Error Rate',
      metric: 'ErrorRate',
      threshold: 5.0,
      currentValue: 0.8,
      state: 'OK',
      description: 'Agent execution error rate threshold'
    },
    {
      id: 'alarm-2',
      name: 'Lambda Duration',
      metric: 'Duration',
      threshold: 30000,
      currentValue: 2340,
      state: 'OK',
      description: 'Lambda function execution duration'
    },
    {
      id: 'alarm-3',
      name: 'API Gateway 5XX Errors',
      metric: '5XXError',
      threshold: 10,
      currentValue: 2,
      state: 'OK',
      description: 'API Gateway server errors'
    },
    {
      id: 'alarm-4',
      name: 'Bedrock Throttling',
      metric: 'ThrottledRequests',
      threshold: 5,
      currentValue: 8,
      state: 'ALARM',
      description: 'Bedrock API throttling threshold'
    }
  ];

  useEffect(() => {
    // Simulate loading metrics
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const refreshMetrics = async () => {
    setRefreshing(true);
    // Simulate refresh
    await new Promise(resolve => setTimeout(resolve, 2000));
    setRefreshing(false);
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      case 'stable': return '➡️';
      default: return '📊';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'success';
      case 'warning': return 'warning';
      case 'critical': return 'danger';
      default: return 'secondary';
    }
  };

  const getAlarmStateColor = (state: string) => {
    switch (state) {
      case 'OK': return 'success';
      case 'ALARM': return 'danger';
      case 'INSUFFICIENT_DATA': return 'warning';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <Container fluid className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }} />
          <h4 className="text-primary mb-2">📊 CloudWatch Metrics</h4>
          <p className="text-muted">Loading real-time metrics...</p>
        </div>
      </Container>
    );
  }

  return (
    <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <Container fluid className="p-4">
        {/* Header */}
        <div className="mb-4">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="text-primary mb-1" style={{ fontSize: '1.75rem', fontWeight: '600' }}>
                📊 CloudWatch Metrics
              </h2>
              <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>
                Real-time monitoring and alerting for AgentHub Platform
              </p>
            </div>
            <div className="d-flex gap-2">
              <Button 
                variant="outline-primary" 
                onClick={refreshMetrics}
                disabled={refreshing}
              >
                {refreshing ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Refreshing...
                  </>
                ) : (
                  <>
                    🔄 Refresh
                  </>
                )}
              </Button>
              <Button variant="primary">
                ⚙️ Configure Alarms
              </Button>
            </div>
          </div>
        </div>

        {/* Active Alarms Alert */}
        {alarms.some(alarm => alarm.state === 'ALARM') && (
          <Alert variant="danger" className="mb-4">
            <div className="d-flex align-items-center">
              <span className="me-2">🚨</span>
              <div>
                <strong>Active Alarms Detected!</strong> 
                {alarms.filter(alarm => alarm.state === 'ALARM').length} alarm(s) require attention.
              </div>
            </div>
          </Alert>
        )}

        {/* Metrics Overview Cards */}
        <Row className="mb-4">
          {metrics.slice(0, 4).map((metric, index) => (
            <Col md={3} key={index}>
              <Card className="text-center border-0 shadow-sm h-100">
                <Card.Body className="py-4">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <Badge bg={getStatusColor(metric.status)}>
                      {metric.status}
                    </Badge>
                    <span className="fs-4">{getTrendIcon(metric.trend)}</span>
                  </div>
                  
                  <h2 className="display-6 text-primary mb-1" style={{ fontSize: '2rem', fontWeight: '700' }}>
                    {metric.value.toLocaleString()}
                  </h2>
                  <p className="text-muted mb-2" style={{ fontSize: '0.9rem' }}>
                    {metric.name}
                  </p>
                  <small className={`text-${metric.trend === 'up' ? 'success' : metric.trend === 'down' ? 'danger' : 'muted'}`}>
                    {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}% vs last hour
                  </small>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Detailed Metrics Table */}
        <Row className="mb-4">
          <Col md={8}>
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-white">
                <h5 className="mb-0">📈 All Metrics</h5>
              </Card.Header>
              <Card.Body>
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Metric</th>
                      <th>Current Value</th>
                      <th>Unit</th>
                      <th>Trend</th>
                      <th>Change</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.map((metric, index) => (
                      <tr key={index}>
                        <td><strong>{metric.name}</strong></td>
                        <td>{metric.value.toLocaleString()}</td>
                        <td>{metric.unit}</td>
                        <td>
                          <Badge bg="outline-secondary">
                            {getTrendIcon(metric.trend)} {metric.trend}
                          </Badge>
                        </td>
                        <td>
                          <span className={`text-${metric.change > 0 ? 'success' : metric.change < 0 ? 'danger' : 'muted'}`}>
                            {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}%
                          </span>
                        </td>
                        <td>
                          <Badge bg={getStatusColor(metric.status)}>
                            {metric.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Header className="bg-white">
                <h5 className="mb-0">🚨 CloudWatch Alarms</h5>
              </Card.Header>
              <Card.Body>
                {alarms.map((alarm, index) => (
                  <div key={index} className="mb-3 p-3 border rounded">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h6 className="mb-0">{alarm.name}</h6>
                      <Badge bg={getAlarmStateColor(alarm.state)}>
                        {alarm.state}
                      </Badge>
                    </div>
                    
                    <p className="text-muted small mb-2">{alarm.description}</p>
                    
                    <div className="mb-2">
                      <div className="d-flex justify-content-between mb-1">
                        <small>Current: {alarm.currentValue}</small>
                        <small>Threshold: {alarm.threshold}</small>
                      </div>
                      <ProgressBar 
                        now={(alarm.currentValue / alarm.threshold) * 100} 
                        variant={alarm.state === 'ALARM' ? 'danger' : 'success'}
                        size="sm"
                      />
                    </div>
                  </div>
                ))}
                
                <div className="d-grid gap-2 mt-3">
                  <Button variant="outline-primary" size="sm">
                    📊 View All Alarms
                  </Button>
                  <Button variant="outline-secondary" size="sm">
                    ➕ Create New Alarm
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Service Health Dashboard */}
        <Row>
          <Col>
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-white">
                <h5 className="mb-0">🏥 Service Health Dashboard</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={3}>
                    <div className="text-center p-3">
                      <div className="mb-2">
                        <Badge bg="success" className="fs-6">●</Badge>
                      </div>
                      <h6>Lambda Functions</h6>
                      <p className="text-muted mb-0">All functions operational</p>
                      <small className="text-success">99.9% uptime</small>
                    </div>
                  </Col>
                  
                  <Col md={3}>
                    <div className="text-center p-3">
                      <div className="mb-2">
                        <Badge bg="success" className="fs-6">●</Badge>
                      </div>
                      <h6>API Gateway</h6>
                      <p className="text-muted mb-0">All endpoints healthy</p>
                      <small className="text-success">99.8% uptime</small>
                    </div>
                  </Col>
                  
                  <Col md={3}>
                    <div className="text-center p-3">
                      <div className="mb-2">
                        <Badge bg="warning" className="fs-6">●</Badge>
                      </div>
                      <h6>Bedrock AI</h6>
                      <p className="text-muted mb-0">Experiencing throttling</p>
                      <small className="text-warning">Rate limits active</small>
                    </div>
                  </Col>
                  
                  <Col md={3}>
                    <div className="text-center p-3">
                      <div className="mb-2">
                        <Badge bg="success" className="fs-6">●</Badge>
                      </div>
                      <h6>DynamoDB</h6>
                      <p className="text-muted mb-0">Database operational</p>
                      <small className="text-success">100% uptime</small>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Quick Actions */}
        <Row className="mt-4">
          <Col>
            <Card className="border-0 shadow-sm">
              <Card.Body className="text-center p-4">
                <h5 className="mb-3">📊 Advanced Monitoring</h5>
                <div className="d-flex justify-content-center gap-3 flex-wrap">
                  <Button variant="primary" size="lg">
                    📈 Custom Dashboards
                  </Button>
                  <Button variant="info" size="lg">
                    🔔 Configure Notifications
                  </Button>
                  <Button variant="success" size="lg">
                    📊 Export Metrics
                  </Button>
                  <Button variant="outline-secondary" size="lg">
                    ⚙️ Metric Settings
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

export default CloudWatchMetrics;