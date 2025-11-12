/**
 * Metrics Dashboard Component
 * Advanced analytics and metrics visualization with real-time cost tracking
 */

import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Badge, ProgressBar, Spinner, Alert, Form, ButtonGroup, Button } from 'react-bootstrap';
import { testingApi } from '../../services/testingApi';
import { theme } from '../../styles/theme';

const MetricsDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<number>(7);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    loadMetrics();
    // Real-time refresh every 10 seconds
    const interval = setInterval(() => {
      loadMetrics();
      setLastUpdate(new Date());
    }, 10000);
    return () => clearInterval(interval);
  }, [timeRange]);

  const loadMetrics = async () => {
    try {
      const data = await testingApi.getMetrics(undefined, timeRange);
      setMetrics(data);
      setError(null);
    } catch (err) {
      setError('Failed to load metrics from backend.');
      console.error('Error loading metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !metrics) {
    return (
      <Card className="shadow-sm">
        <Card.Body className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Loading metrics...</p>
        </Card.Body>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Alert variant="danger">
        No metrics data available. Run some tests to see metrics.
      </Alert>
    );
  }

  const summary = metrics.summary || {};
  const performanceData = metrics.performance || [];
  const costData = metrics.costs || [];
  const agentPerformance = metrics.agentPerformance || [];
  const maxResponseTime = performanceData.length > 0 ? Math.max(...performanceData.map((d: any) => d.responseTime)) : 1;
  const maxCost = costData.length > 0 ? Math.max(...costData.map((d: any) => d.cost)) : 1;

  return (
    <div>
      {/* Header with Time Range Filter */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h4 style={{ margin: 0, color: theme.colors.primary }}>📊 Real-Time Metrics Dashboard</h4>
          <small style={{ color: theme.colors.textSecondary }}>
            Last updated: {lastUpdate.toLocaleTimeString()} • Auto-refresh every 10s
          </small>
        </div>
        <ButtonGroup>
          <Button 
            variant={timeRange === 7 ? 'primary' : 'outline-primary'} 
            size="sm"
            onClick={() => setTimeRange(7)}
          >
            Last 7 Days
          </Button>
          <Button 
            variant={timeRange === 30 ? 'primary' : 'outline-primary'} 
            size="sm"
            onClick={() => setTimeRange(30)}
          >
            Last 30 Days
          </Button>
          <Button 
            variant={timeRange === 90 ? 'primary' : 'outline-primary'} 
            size="sm"
            onClick={() => setTimeRange(90)}
          >
            Last 90 Days
          </Button>
        </ButtonGroup>
      </div>

      {error && (
        <Alert variant="warning" dismissible onClose={() => setError(null)} className="mb-3">
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="shadow-sm" style={{ borderLeft: `4px solid ${theme.colors.primary}` }}>
            <Card.Body>
              <div style={{ fontSize: '0.85em', color: theme.colors.textSecondary, marginBottom: '8px' }}>
                💰 Total Cost
              </div>
              <h2 style={{ margin: 0, color: theme.colors.primary }}>
                ${summary.totalCost?.toFixed(4) || '0.00'}
              </h2>
              <small style={{ color: theme.colors.textSecondary }}>
                {summary.totalTests || 0} tests • ${summary.avgCostPerTest?.toFixed(6) || '0.00'}/test
              </small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="shadow-sm" style={{ borderLeft: `4px solid ${theme.colors.success}` }}>
            <Card.Body>
              <div style={{ fontSize: '0.85em', color: theme.colors.textSecondary, marginBottom: '8px' }}>
                ✅ Pass Rate
              </div>
              <h2 style={{ margin: 0, color: theme.colors.success }}>
                {summary.passRate || 0}%
              </h2>
              <small style={{ color: theme.colors.textSecondary }}>
                {summary.passedTests || 0} / {summary.totalTests || 0} tests passed
              </small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="shadow-sm" style={{ borderLeft: `4px solid ${theme.colors.info}` }}>
            <Card.Body>
              <div style={{ fontSize: '0.85em', color: theme.colors.textSecondary, marginBottom: '8px' }}>
                🔢 Total Tokens
              </div>
              <h2 style={{ margin: 0, color: theme.colors.info }}>
                {(summary.totalTokens || 0).toLocaleString()}
              </h2>
              <small style={{ color: theme.colors.textSecondary }}>
                Avg: {Math.round((summary.totalTokens || 0) / (summary.totalTests || 1))} tokens/test
              </small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="shadow-sm" style={{ borderLeft: `4px solid ${theme.colors.warning}` }}>
            <Card.Body>
              <div style={{ fontSize: '0.85em', color: theme.colors.textSecondary, marginBottom: '8px' }}>
                ⚡ Avg Response Time
              </div>
              <h2 style={{ margin: 0, color: theme.colors.warning }}>
                {Math.round(summary.avgExecutionTime || 0)}s
              </h2>
              <small style={{ color: theme.colors.textSecondary }}>
                {summary.completedRuns || 0} completed runs
              </small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Performance Trends */}
      <Row className="mb-4">
        <Col md={12}>
          <Card className="shadow-sm">
            <Card.Header style={{ backgroundColor: theme.colors.backgroundSecondary, fontWeight: theme.typography.fontWeight.semibold }}>
              📈 Performance Trends (Last {timeRange} Days)
            </Card.Header>
            <Card.Body>
              {performanceData.length === 0 ? (
                <Alert variant="info">No performance data available for this time range.</Alert>
              ) : (
                <Table hover responsive>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Response Time</th>
                      <th>Token Usage</th>
                      <th>Pass Rate</th>
                      <th>Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {performanceData.map((data: any, idx: number) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 500 }}>{data.date}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <ProgressBar 
                              now={(data.responseTime / maxResponseTime) * 100}
                              style={{ flex: 1, height: '20px' }}
                              variant="info"
                            />
                            <span style={{ minWidth: '70px', textAlign: 'right' }}>{data.responseTime}ms</span>
                          </div>
                        </td>
                        <td>
                          <Badge bg="secondary">{data.tokenUsage} tokens</Badge>
                        </td>
                        <td>
                          <Badge bg={data.passRate >= 80 ? 'success' : data.passRate >= 60 ? 'warning' : 'danger'}>
                            {data.passRate}%
                          </Badge>
                        </td>
                        <td style={{ color: '#ffc107', fontWeight: 'bold' }}>
                          ${data.cost?.toFixed(4) || '0.00'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Cost Analysis and Agent Performance */}
      <Row className="mb-4">
        <Col md={6}>
          <Card className="shadow-sm">
            <Card.Header style={{ backgroundColor: theme.colors.backgroundSecondary, fontWeight: theme.typography.fontWeight.semibold }}>
              💰 Cost Analysis by Agent
            </Card.Header>
            <Card.Body>
              {costData.length === 0 ? (
                <Alert variant="info">No cost data available yet.</Alert>
              ) : (
                <div style={{ padding: '10px' }}>
                  {costData.map((data: any, idx: number) => (
                    <div key={idx} style={{ marginBottom: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div>
                          <span style={{ fontWeight: 500 }}>{data.agent}</span>
                          <small style={{ color: theme.colors.textSecondary, marginLeft: '10px' }}>
                            {data.tests} tests • {data.tokens.toLocaleString()} tokens
                          </small>
                        </div>
                        <span style={{ color: '#ffc107', fontWeight: 'bold' }}>
                          ${data.cost.toFixed(4)}
                        </span>
                      </div>
                      <ProgressBar 
                        now={(data.cost / maxCost) * 100}
                        style={{ height: '25px', backgroundColor: '#e9ecef' }}
                      >
                        <ProgressBar 
                          now={(data.cost / maxCost) * 100}
                          style={{ backgroundColor: '#ffc107' }}
                          label={`${((data.cost / maxCost) * 100).toFixed(0)}%`}
                        />
                      </ProgressBar>
                    </div>
                  ))}
                  <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '8px', border: '1px solid #ffc107' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '1.1em' }}>Total Cost ({timeRange} days)</div>
                        <small style={{ color: theme.colors.textSecondary }}>
                          Projected monthly: ${((summary.totalCost || 0) * 30 / timeRange).toFixed(2)}
                        </small>
                      </div>
                      <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ffc107' }}>
                        ${summary.totalCost?.toFixed(4) || '0.00'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="shadow-sm">
            <Card.Header style={{ backgroundColor: theme.colors.backgroundSecondary, fontWeight: theme.typography.fontWeight.semibold }}>
              🏆 Agent Performance Leaderboard
            </Card.Header>
            <Card.Body>
              {agentPerformance.length === 0 ? (
                <Alert variant="info">No agent performance data available yet.</Alert>
              ) : (
                <Table hover responsive size="sm">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Agent</th>
                      <th>Tests</th>
                      <th>Cost</th>
                      <th>Efficiency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agentPerformance.map((agent: any, idx: number) => (
                      <tr key={idx}>
                        <td>
                          {idx === 0 && '🥇'}
                          {idx === 1 && '🥈'}
                          {idx === 2 && '🥉'}
                          {idx > 2 && `#${idx + 1}`}
                        </td>
                        <td style={{ fontWeight: 500 }}>{agent.agent}</td>
                        <td>{agent.tests}</td>
                        <td style={{ color: '#ffc107' }}>${agent.cost.toFixed(4)}</td>
                        <td>
                          <Badge bg={agent.efficiency > 100 ? 'success' : agent.efficiency > 50 ? 'warning' : 'secondary'}>
                            {agent.efficiency.toFixed(1)} tests/$
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default MetricsDashboard;
