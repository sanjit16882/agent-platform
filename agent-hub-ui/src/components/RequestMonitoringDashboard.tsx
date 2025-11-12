import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Button, Alert, Container, Row, Col } from 'react-bootstrap';
import { theme } from '../styles/theme';

interface RequestStats {
  endpoint: string;
  count: number;
  lastRequest: string;
  averageInterval: number;
}

interface MonitoringData {
  allEndpoints: RequestStats[];
  problematicEndpoints: RequestStats[];
  summary: {
    totalEndpoints: number;
    problematicCount: number;
    timestamp: string;
  };
}

const RequestMonitoringDashboard: React.FC = () => {
  const [monitoringData, setMonitoringData] = useState<MonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMonitoringData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('http://localhost:3002/api/v1/monitoring/request-stats');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      if (result.success) {
        setMonitoringData(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch monitoring data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Failed to load monitoring data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMonitoringData();
    const interval = setInterval(loadMonitoringData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const formatInterval = (milliseconds: number): string => {
    if (milliseconds === 0) return 'N/A';
    const seconds = milliseconds / 1000;
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    const minutes = seconds / 60;
    return `${minutes.toFixed(1)}m`;
  };

  const getIntervalBadge = (interval: number): React.ReactElement => {
    if (interval === 0) return <Badge bg="secondary">N/A</Badge>;
    if (interval < 30000) return <Badge bg="danger">Too Frequent</Badge>;
    if (interval < 60000) return <Badge bg="warning">Frequent</Badge>;
    if (interval < 300000) return <Badge bg="info">Normal</Badge>;
    return <Badge bg="success">Optimal</Badge>;
  };

  if (loading && !monitoringData) {
    return (
      <Container>
        <div className="text-center p-4">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading request monitoring data...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert variant="danger">
          <Alert.Heading>Monitoring Data Error</Alert.Heading>
          <p>{error}</p>
          <Button variant="outline-danger" onClick={loadMonitoringData}>
            Retry
          </Button>
        </Alert>
      </Container>
    );
  }

  if (!monitoringData) {
    return (
      <Container>
        <Alert variant="info">
          <Alert.Heading>No Monitoring Data</Alert.Heading>
          <p>No request monitoring data available yet. Make some dashboard requests to see statistics.</p>
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid style={{ padding: theme.spacing.xl }}>
      <div style={{ marginBottom: theme.spacing.xl }}>
        <h2 style={{ color: theme.colors.primary, marginBottom: theme.spacing.sm }}>
          🔍 Request Monitoring Dashboard
        </h2>
        <p style={{ color: theme.colors.textSecondary }}>
          Monitor dashboard request patterns to identify and prevent excessive backend load
        </p>
      </div>

      {/* Summary Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card>
            <Card.Body className="text-center">
              <h4 style={{ color: theme.colors.primary }}>
                {monitoringData.summary.totalEndpoints}
              </h4>
              <small className="text-muted">Monitored Endpoints</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card>
            <Card.Body className="text-center">
              <h4 style={{ color: monitoringData.summary.problematicCount > 0 ? theme.colors.danger : theme.colors.success }}>
                {monitoringData.summary.problematicCount}
              </h4>
              <small className="text-muted">Problematic Endpoints</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card>
            <Card.Body className="text-center">
              <h4 style={{ color: theme.colors.info }}>
                {monitoringData.allEndpoints.reduce((sum, stat) => sum + stat.count, 0)}
              </h4>
              <small className="text-muted">Total Requests</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card>
            <Card.Body className="text-center">
              <Button variant="outline-primary" size="sm" onClick={loadMonitoringData}>
                Refresh Data
              </Button>
              <br />
              <small className="text-muted mt-1">
                Last updated: {new Date(monitoringData.summary.timestamp).toLocaleTimeString()}
              </small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Problematic Endpoints Alert */}
      {monitoringData.problematicEndpoints.length > 0 && (
        <Alert variant="warning" className="mb-4">
          <Alert.Heading>⚠️ Excessive Request Patterns Detected</Alert.Heading>
          <p>
            The following endpoints are receiving requests too frequently, which may cause backend overload:
          </p>
          <ul>
            {monitoringData.problematicEndpoints.map((stat, index) => (
              <li key={index}>
                <strong>{stat.endpoint}</strong> - Average interval: {formatInterval(stat.averageInterval)} 
                ({stat.count} requests)
              </li>
            ))}
          </ul>
          <p className="mb-0">
            <strong>Recommendation:</strong> Increase refresh intervals in dashboard components or implement request caching.
          </p>
        </Alert>
      )}

      {/* All Endpoints Table */}
      <Card>
        <Card.Header>
          <h5 className="mb-0">📊 Request Statistics by Endpoint</h5>
        </Card.Header>
        <Card.Body>
          {monitoringData.allEndpoints.length > 0 ? (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Endpoint</th>
                  <th>Request Count</th>
                  <th>Last Request</th>
                  <th>Average Interval</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {monitoringData.allEndpoints.map((stat, index) => (
                  <tr key={index}>
                    <td>
                      <code style={{ fontSize: '0.9em' }}>{stat.endpoint}</code>
                    </td>
                    <td>
                      <Badge bg="secondary">{stat.count}</Badge>
                    </td>
                    <td>
                      <small className="text-muted">
                        {new Date(stat.lastRequest).toLocaleString()}
                      </small>
                    </td>
                    <td>
                      {formatInterval(stat.averageInterval)}
                    </td>
                    <td>
                      {getIntervalBadge(stat.averageInterval)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <Alert variant="info">
              <p className="mb-0">No request data available yet. Dashboard requests will appear here once made.</p>
            </Alert>
          )}
        </Card.Body>
      </Card>

      {/* Recommendations */}
      <Card className="mt-4">
        <Card.Header>
          <h5 className="mb-0">💡 Optimization Recommendations</h5>
        </Card.Header>
        <Card.Body>
          <ul className="mb-0">
            <li><strong>Optimal refresh intervals:</strong> 2-5 minutes for most dashboard data</li>
            <li><strong>Use caching:</strong> Implement client-side caching to reduce redundant requests</li>
            <li><strong>Pause on inactive tabs:</strong> Stop refreshing when browser tab is not active</li>
            <li><strong>Batch requests:</strong> Combine multiple data sources into single API calls</li>
            <li><strong>Rate limiting:</strong> Backend should limit requests to prevent overload</li>
          </ul>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default RequestMonitoringDashboard;