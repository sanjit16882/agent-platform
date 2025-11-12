import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Badge, ProgressBar } from 'react-bootstrap';
import { mcpService } from '../../services/mcpService';

interface MCPAnalyticsDashboardProps {
  className?: string;
}

export const MCPAnalyticsDashboard: React.FC<MCPAnalyticsDashboardProps> = ({ className = '' }) => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const data = await mcpService.getMCPUsageAnalytics();
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load MCP analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <Card.Header>
          <h5 className="mb-0">🔌 MCP Integration Analytics</h5>
        </Card.Header>
        <Card.Body>
          <div className="text-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-muted mt-2">Loading MCP analytics...</p>
          </div>
        </Card.Body>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card className={className}>
        <Card.Header>
          <h5 className="mb-0">🔌 MCP Integration Analytics</h5>
        </Card.Header>
        <Card.Body>
          <div className="text-center py-4">
            <i className="fas fa-exclamation-triangle text-warning fa-2x mb-3"></i>
            <p className="text-muted">Unable to load MCP analytics</p>
          </div>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <Card.Header className="d-flex justify-between align-items-center">
        <h5 className="mb-0">🔌 MCP Integration Analytics</h5>
        <Badge bg="primary">{analytics.totalMCPAgents} MCP Agents</Badge>
      </Card.Header>
      <Card.Body>
        {/* Overview Metrics */}
        <Row className="mb-4">
          <Col md={3}>
            <div className="text-center">
              <div className="h4 text-primary mb-1">{analytics.totalMCPAgents}</div>
              <div className="text-muted small">MCP-Enabled Agents</div>
            </div>
          </Col>
          <Col md={3}>
            <div className="text-center">
              <div className="h4 text-success mb-1">{analytics.mcpExecutions.total}</div>
              <div className="text-muted small">Total Executions</div>
            </div>
          </Col>
          <Col md={3}>
            <div className="text-center">
              <div className="h4 text-info mb-1">{analytics.mcpExecutions.successRate}%</div>
              <div className="text-muted small">Success Rate</div>
            </div>
          </Col>
          <Col md={3}>
            <div className="text-center">
              <div className="h4 text-warning mb-1">{analytics.mcpExecutions.failed}</div>
              <div className="text-muted small">Failed Executions</div>
            </div>
          </Col>
        </Row>

        {/* Most Used Servers */}
        <div className="mb-4">
          <h6 className="mb-3">Most Used MCP Servers</h6>
          {analytics.mostUsedServers.slice(0, 4).map((server: any, index: number) => (
            <div key={server.id} className="d-flex justify-content-between align-items-center mb-2">
              <div className="d-flex align-items-center">
                <Badge bg="outline-secondary" className="me-2">{index + 1}</Badge>
                <span className="fw-medium">{server.name}</span>
              </div>
              <div className="d-flex align-items-center">
                <div className="me-2" style={{ width: '60px' }}>
                  <ProgressBar 
                    now={(server.usage / analytics.mostUsedServers[0].usage) * 100} 
                    variant="primary"
                    style={{ height: '8px' }}
                  />
                </div>
                <span className="text-muted small">{server.usage}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Top Use Cases */}
        <div>
          <h6 className="mb-3">Popular Use Cases</h6>
          <div className="d-flex flex-wrap gap-2">
            {analytics.topUseCases.map((useCase: string, index: number) => (
              <Badge key={index} bg="outline-primary" className="px-2 py-1">
                {useCase}
              </Badge>
            ))}
          </div>
        </div>

        {/* Intelligence Insights */}
        <div className="mt-4 p-3 bg-light rounded">
          <div className="d-flex align-items-center mb-2">
            <i className="fas fa-brain text-primary me-2"></i>
            <span className="fw-medium">Intelligence Insights</span>
          </div>
          <div className="small text-muted">
            <div className="mb-1">
              • MCP integrations improve agent success rate by {Math.round((analytics.mcpExecutions.successRate - 85) * 10) / 10}%
            </div>
            <div className="mb-1">
              • {analytics.mostUsedServers[0]?.name} is the most popular integration
            </div>
            <div>
              • {analytics.topUseCases[0]} is the leading use case for MCP agents
            </div>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};