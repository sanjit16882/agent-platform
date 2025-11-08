import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Table } from 'react-bootstrap';

interface AnalyticsData {
  totalExecutions: number;
  successRate: number;
  avgExecutionTime: number;
  mcpServerStats: {
    office365: { executions: number; avgTime: number; errorRate: number };
    teams: { executions: number; avgTime: number; errorRate: number };
    github: { executions: number; avgTime: number; errorRate: number };
  };
  cacheStats: {
    hitRatio: number;
    totalHits: number;
    totalMisses: number;
    compressionSaved: number;
  };
  recentExecutions: Array<{
    id: string;
    agentName: string;
    tool: string;
    status: 'success' | 'error';
    executionTime: number;
    timestamp: string;
  }>;
}

const Analytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await API.get('AgentHubAPI', '/api/v1/analytics', {});
      if (response.success) {
        setAnalytics(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      
      // Mock data for development
      setAnalytics({
        totalExecutions: 1247,
        successRate: 94.2,
        avgExecutionTime: 2340,
        mcpServerStats: {
          office365: { executions: 456, avgTime: 2100, errorRate: 3.2 },
          teams: { executions: 389, avgTime: 1800, errorRate: 2.1 },
          github: { executions: 402, avgTime: 2900, errorRate: 8.7 }
        },
        cacheStats: {
          hitRatio: 78.5,
          totalHits: 892,
          totalMisses: 244,
          compressionSaved: 15728640 // bytes
        },
        recentExecutions: [
          {
            id: '1',
            agentName: 'Excel Automation Agent',
            tool: 'excel_create_workbook',
            status: 'success',
            executionTime: 1850,
            timestamp: new Date(Date.now() - 300000).toISOString()
          },
          {
            id: '2',
            agentName: 'Teams Notification Agent',
            tool: 'teams_send_message',
            status: 'success',
            executionTime: 1200,
            timestamp: new Date(Date.now() - 600000).toISOString()
          },
          {
            id: '3',
            agentName: 'GitHub PR Manager',
            tool: 'github_create_pr',
            status: 'error',
            executionTime: 5000,
            timestamp: new Date(Date.now() - 900000).toISOString()
          }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getServerBadge = (server: string) => {
    switch (server) {
      case 'office365': return 'primary';
      case 'teams': return 'success';
      case 'github': return 'dark';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <Container fluid>
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid>
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="h3 mb-1">📊 Analytics Dashboard</h1>
              <p className="text-muted mb-0">Performance metrics and insights</p>
            </div>
          </div>
        </Col>
      </Row>

      {/* Key Metrics */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <div className="display-6 text-primary mb-2">🚀</div>
              <h3 className="mb-1">{analytics?.totalExecutions.toLocaleString()}</h3>
              <p className="text-muted mb-0">Total Executions</p>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <div className="display-6 text-success mb-2">✅</div>
              <h3 className="mb-1">{analytics?.successRate}%</h3>
              <p className="text-muted mb-0">Success Rate</p>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <div className="display-6 text-info mb-2">⏱️</div>
              <h3 className="mb-1">{analytics?.avgExecutionTime}ms</h3>
              <p className="text-muted mb-0">Avg Execution Time</p>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <div className="display-6 text-warning mb-2">💾</div>
              <h3 className="mb-1">{analytics?.cacheStats.hitRatio}%</h3>
              <p className="text-muted mb-0">Cache Hit Ratio</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        {/* MCP Server Performance */}
        <Col md={6}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">🔗 MCP Server Performance</h5>
            </Card.Header>
            <Card.Body>
              {analytics?.mcpServerStats && Object.entries(analytics.mcpServerStats).map(([server, stats]) => (
                <div key={server} className="mb-3 p-3 border rounded">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <Badge bg={getServerBadge(server)}>
                        {server.charAt(0).toUpperCase() + server.slice(1)}
                      </Badge>
                    </div>
                    <small className="text-muted">{stats.executions} executions</small>
                  </div>
                  
                  <Row className="text-center">
                    <Col>
                      <div className="small text-muted">Avg Time</div>
                      <div className="fw-bold">{stats.avgTime}ms</div>
                    </Col>
                    <Col>
                      <div className="small text-muted">Error Rate</div>
                      <div className={`fw-bold ${stats.errorRate > 5 ? 'text-danger' : 'text-success'}`}>
                        {stats.errorRate}%
                      </div>
                    </Col>
                  </Row>
                </div>
              ))}
            </Card.Body>
          </Card>
        </Col>

        {/* Cache Performance */}
        <Col md={6}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">💾 Cache Performance</h5>
            </Card.Header>
            <Card.Body>
              <Row className="text-center mb-3">
                <Col>
                  <div className="display-4 text-success mb-2">
                    {analytics?.cacheStats.hitRatio}%
                  </div>
                  <p className="text-muted mb-0">Hit Ratio</p>
                </Col>
              </Row>
              
              <Row className="text-center mb-3">
                <Col>
                  <div className="h4 text-primary">{analytics?.cacheStats.totalHits}</div>
                  <small className="text-muted">Cache Hits</small>
                </Col>
                <Col>
                  <div className="h4 text-warning">{analytics?.cacheStats.totalMisses}</div>
                  <small className="text-muted">Cache Misses</small>
                </Col>
              </Row>

              <div className="text-center p-3 bg-light rounded">
                <div className="h5 text-success mb-1">
                  {formatBytes(analytics?.cacheStats.compressionSaved || 0)}
                </div>
                <small className="text-muted">Saved by Compression</small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Recent Executions */}
      <Row>
        <Col>
          <Card>
            <Card.Header>
              <h5 className="mb-0">📋 Recent Executions</h5>
            </Card.Header>
            <Card.Body>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Agent</th>
                    <th>Tool</th>
                    <th>Status</th>
                    <th>Execution Time</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics?.recentExecutions.map((execution) => (
                    <tr key={execution.id}>
                      <td>{execution.agentName}</td>
                      <td>
                        <code className="small">{execution.tool}</code>
                      </td>
                      <td>
                        <Badge bg={execution.status === 'success' ? 'success' : 'danger'}>
                          {execution.status}
                        </Badge>
                      </td>
                      <td>{execution.executionTime}ms</td>
                      <td>{new Date(execution.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Analytics;