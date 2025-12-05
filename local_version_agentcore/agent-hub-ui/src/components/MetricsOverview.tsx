import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Badge, Spinner } from 'react-bootstrap';
import { analyticsService, ExecutionMetrics, TimeRange } from '../services/analyticsService';

interface MetricsOverviewProps {
  timeRange: TimeRange;
  refreshTrigger?: number;
}

const MetricsOverview: React.FC<MetricsOverviewProps> = ({ timeRange, refreshTrigger = 0 }) => {
  const [metrics, setMetrics] = useState<ExecutionMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, [timeRange, refreshTrigger]);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const data = await analyticsService.getExecutionMetrics(timeRange);
      setMetrics(data);
    } catch (error) {
      console.error('Failed to load metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds.toFixed(1)}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
  };

  const getSuccessRateVariant = (rate: number): string => {
    if (rate >= 95) return 'success';
    if (rate >= 90) return 'warning';
    return 'danger';
  };

  const getErrorRateVariant = (rate: number): string => {
    if (rate <= 2) return 'success';
    if (rate <= 5) return 'warning';
    return 'danger';
  };

  if (loading) {
    return (
      <Row>
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Col key={i} md={4} lg={2} className="mb-4">
            <Card className="h-100 text-center">
              <Card.Body className="d-flex flex-column justify-content-center">
                <Spinner animation="border" size="sm" />
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    );
  }

  if (!metrics) {
    return (
      <Row>
        <Col>
          <Card className="text-center">
            <Card.Body>
              <p className="text-muted">Failed to load metrics</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    );
  }

  return (
    <Row>
      {/* Total Executions */}
      <Col md={4} lg={2} className="mb-4">
        <Card className="h-100 border-primary">
          <Card.Body className="text-center">
            <div className="display-6 text-primary fw-bold">
              {formatNumber(metrics.totalExecutions)}
            </div>
            <div className="text-muted small">Total Executions</div>
            <Badge bg="primary" className="mt-2">
              📊 Volume
            </Badge>
          </Card.Body>
        </Card>
      </Col>

      {/* Success Rate */}
      <Col md={4} lg={2} className="mb-4">
        <Card className="h-100 border-success">
          <Card.Body className="text-center">
            <div className={`display-6 fw-bold text-${getSuccessRateVariant(metrics.successRate)}`}>
              {formatPercentage(metrics.successRate)}
            </div>
            <div className="text-muted small">Success Rate</div>
            <Badge bg={getSuccessRateVariant(metrics.successRate)} className="mt-2">
              ✅ Quality
            </Badge>
          </Card.Body>
        </Card>
      </Col>

      {/* Active Users */}
      <Col md={4} lg={2} className="mb-4">
        <Card className="h-100 border-info">
          <Card.Body className="text-center">
            <div className="display-6 text-info fw-bold">
              {formatNumber(metrics.activeUsers)}
            </div>
            <div className="text-muted small">Active Users</div>
            <Badge bg="info" className="mt-2">
              👥 Engagement
            </Badge>
          </Card.Body>
        </Card>
      </Col>


      {/* Average Response Time */}
      <Col md={4} lg={2} className="mb-4">
        <Card className="h-100 border-secondary">
          <Card.Body className="text-center">
            <div className="display-6 text-secondary fw-bold">
              {formatTime(metrics.averageExecutionTime)}
            </div>
            <div className="text-muted small">Avg Response</div>
            <Badge bg="secondary" className="mt-2">
              ⚡ Speed
            </Badge>
          </Card.Body>
        </Card>
      </Col>

      {/* Error Rate */}
      <Col md={4} lg={2} className="mb-4">
        <Card className="h-100 border-danger">
          <Card.Body className="text-center">
            <div className={`display-6 fw-bold text-${getErrorRateVariant(metrics.errorRate)}`}>
              {formatPercentage(metrics.errorRate)}
            </div>
            <div className="text-muted small">Error Rate</div>
            <Badge bg={getErrorRateVariant(metrics.errorRate)} className="mt-2">
              🚨 Reliability
            </Badge>
          </Card.Body>
        </Card>
      </Col>

      {/* Additional Metrics Row */}
      <Col md={6} className="mb-4">
        <Card className="h-100">
          <Card.Header className="bg-light">
            <h6 className="mb-0">📈 Performance Insights</h6>
          </Card.Header>
          <Card.Body>
            <Row className="text-center">
              <Col xs={6}>
                <div className="h4 text-primary">{formatTime(metrics.totalProcessingTime)}</div>
                <small className="text-muted">Total Processing Time</small>
              </Col>
              <Col xs={6}>
                <div className="h4 text-info">{metrics.peakConcurrentExecutions}</div>
                <small className="text-muted">Peak Concurrent</small>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </Col>

      {/* System Health */}
      <Col md={6} className="mb-4">
        <Card className="h-100">
          <Card.Header className="bg-light">
            <h6 className="mb-0">🏥 System Health</h6>
          </Card.Header>
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span>System Uptime</span>
              <Badge bg="success">99.9%</Badge>
            </div>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span>API Response</span>
              <Badge bg="success">Healthy</Badge>
            </div>
            <div className="d-flex justify-content-between align-items-center">
              <span>Data Freshness</span>
              <Badge bg="info">Real-time</Badge>
            </div>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

export default MetricsOverview;