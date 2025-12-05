/**
 * Agent Analytics Component
 * 
 * Displays comprehensive analytics for an agent including:
 * - Execution history
 * - Performance metrics
 * - Cost breakdown
 * - Success rates
 * - Optimization recommendations
 */

import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Badge, Spinner, Alert, Table, ProgressBar, Button, Tabs, Tab } from 'react-bootstrap';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AgentAnalyticsProps {
  agentId: string;
  agentName?: string;
}

interface ExecutionHistory {
  id: string;
  execution_mode: string;
  status: string;
  started_at: string;
  duration_ms: number;
  total_cost: number;
  documents_retrieved: number;
  tools_invoked: number;
}

interface Analytics {
  overall: {
    total_executions: number;
    successful_executions: number;
    avg_duration_ms: number;
    total_cost: number;
    avg_cost_per_execution: number;
    avg_documents_retrieved: number;
    avg_tools_invoked: number;
  };
  execution_mode_distribution: Array<{
    execution_mode: string;
    count: number;
    avg_duration_ms: number;
    avg_cost: number;
  }>;
  cost_breakdown: Array<{
    execution_mode: string;
    total_llm_cost: number;
    total_vector_db_cost: number;
    total_mcp_cost: number;
    total_cost: number;
    execution_count: number;
  }>;
  success_rates: Array<{
    execution_mode: string;
    total_executions: number;
    successful_executions: number;
    failed_executions: number;
    success_rate: number;
  }>;
  daily_trend: Array<{
    date: string;
    executions: number;
    successful: number;
    avg_duration: number;
    total_cost: number;
  }>;
}

interface Recommendation {
  type: string;
  priority: string;
  agent_id: string;
  reason: string;
  current_cost?: number;
  estimated_savings?: number;
  impact: string;
  suggested_action?: string;
}

const AgentAnalytics: React.FC<AgentAnalyticsProps> = ({ agentId, agentName }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [executions, setExecutions] = useState<ExecutionHistory[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [days, setDays] = useState(30);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAnalytics();
  }, [agentId, days]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch execution history
      const execResponse = await fetch(`http://localhost:3002/api/v1/agents/${agentId}/executions?limit=10`);
      const execData = await execResponse.json();
      
      if (execData.success) {
        setExecutions(execData.data.executions || []);
      }

      // Fetch analytics
      const analyticsResponse = await fetch(`http://localhost:3002/api/v1/agents/${agentId}/analytics?days=${days}`);
      const analyticsData = await analyticsResponse.json();
      
      if (analyticsData.success) {
        setAnalytics(analyticsData.data);
      }

      // Fetch recommendations
      const recResponse = await fetch(`http://localhost:3002/api/v1/analytics/cost-optimization?days=${days}`);
      const recData = await recResponse.json();
      
      if (recData.success) {
        // Filter recommendations for this agent
        const agentRecs = recData.data.recommendations.filter((r: Recommendation) => r.agent_id === agentId);
        setRecommendations(agentRecs);
      }

    } catch (err: any) {
      console.error('Error fetching analytics:', err);
      
      // Handle 404 - endpoints not available yet
      if (err.response?.status === 404) {
        setError('Analytics endpoints not available. Please restart the backend server to enable analytics.');
      } else {
        setError('Failed to load analytics data. The agent may not have any execution history yet.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getExecutionModeColor = (mode: string) => {
    const colors: Record<string, string> = {
      'bedrock-only': '#0d6efd',
      'rag': '#198754',
      'mcp': '#ffc107',
      'full-stack': '#6f42c1'
    };
    return colors[mode] || '#6c757d';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      'high': 'danger',
      'medium': 'warning',
      'low': 'info'
    };
    return colors[priority] || 'secondary';
  };

  const formatCost = (cost: number) => {
    return `$${cost.toFixed(6)}`;
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  if (loading) {
    return (
      <Card>
        <Card.Body className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Loading analytics...</p>
        </Card.Body>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="danger">
        <Alert.Heading>Error Loading Analytics</Alert.Heading>
        <p>{error}</p>
        <Button variant="outline-danger" onClick={fetchAnalytics}>Retry</Button>
      </Alert>
    );
  }

  if (!analytics) {
    return (
      <Alert variant="info">
        <Alert.Heading>No Analytics Data</Alert.Heading>
        <p>No execution data available for this agent yet. Execute the agent to see analytics.</p>
      </Alert>
    );
  }

  const successRate = analytics.overall.total_executions > 0
    ? (analytics.overall.successful_executions / analytics.overall.total_executions * 100).toFixed(1)
    : '0';

  return (
    <div>
      {/* Header with Period Selector */}
      <Row className="mb-3">
        <Col>
          <h4>{agentName || agentId} - Analytics</h4>
        </Col>
        <Col xs="auto">
          <div className="btn-group" role="group">
            <Button
              variant={days === 7 ? 'primary' : 'outline-primary'}
              size="sm"
              onClick={() => setDays(7)}
            >
              7 Days
            </Button>
            <Button
              variant={days === 30 ? 'primary' : 'outline-primary'}
              size="sm"
              onClick={() => setDays(30)}
            >
              30 Days
            </Button>
            <Button
              variant={days === 90 ? 'primary' : 'outline-primary'}
              size="sm"
              onClick={() => setDays(90)}
            >
              90 Days
            </Button>
          </div>
        </Col>
      </Row>

      {/* Summary Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h6 className="text-muted">Total Executions</h6>
              <h2>{analytics.overall.total_executions}</h2>
              <Badge bg="success">{successRate}% Success</Badge>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h6 className="text-muted">Avg Duration</h6>
              <h2>{formatDuration(analytics.overall.avg_duration_ms)}</h2>
              <small className="text-muted">per execution</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h6 className="text-muted">Total Cost</h6>
              <h2>{formatCost(analytics.overall.total_cost)}</h2>
              <small className="text-muted">{formatCost(analytics.overall.avg_cost_per_execution)} avg</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h6 className="text-muted">Avg Documents</h6>
              <h2>{analytics.overall.avg_documents_retrieved?.toFixed(1) || '0'}</h2>
              <small className="text-muted">retrieved per execution</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Tabs for Different Views */}
      <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'overview')} className="mb-3">
        
        {/* Overview Tab */}
        <Tab eventKey="overview" title="Overview">
          <Row>
            {/* Execution Mode Distribution */}
            <Col md={6} className="mb-4">
              <Card>
                <Card.Header>
                  <strong>Execution Mode Distribution</strong>
                </Card.Header>
                <Card.Body>
                  {analytics.execution_mode_distribution.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={analytics.execution_mode_distribution}
                          dataKey="count"
                          nameKey="execution_mode"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={(entry: any) => `${entry.execution_mode} (${entry.count})`}
                        >
                          {analytics.execution_mode_distribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={getExecutionModeColor(entry.execution_mode)} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-muted text-center">No execution data</p>
                  )}
                </Card.Body>
              </Card>
            </Col>

            {/* Success Rates */}
            <Col md={6} className="mb-4">
              <Card>
                <Card.Header>
                  <strong>Success Rates by Mode</strong>
                </Card.Header>
                <Card.Body>
                  {analytics.success_rates.map((rate, idx) => (
                    <div key={idx} className="mb-3">
                      <div className="d-flex justify-content-between mb-1">
                        <span>
                          <Badge bg="secondary" className="me-2">{rate.execution_mode}</Badge>
                          {rate.success_rate.toFixed(1)}%
                        </span>
                        <small className="text-muted">
                          {rate.successful_executions}/{rate.total_executions}
                        </small>
                      </div>
                      <ProgressBar 
                        now={rate.success_rate} 
                        variant={rate.success_rate >= 90 ? 'success' : rate.success_rate >= 70 ? 'warning' : 'danger'}
                      />
                    </div>
                  ))}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Daily Trend */}
          <Card className="mb-4">
            <Card.Header>
              <strong>Daily Execution Trend</strong>
            </Card.Header>
            <Card.Body>
              {analytics.daily_trend.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.daily_trend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="executions" stroke="#0d6efd" name="Executions" />
                    <Line yAxisId="left" type="monotone" dataKey="successful" stroke="#198754" name="Successful" />
                    <Line yAxisId="right" type="monotone" dataKey="total_cost" stroke="#dc3545" name="Cost ($)" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted text-center">No trend data available</p>
              )}
            </Card.Body>
          </Card>
        </Tab>

        {/* Cost Analysis Tab */}
        <Tab eventKey="cost" title="Cost Analysis">
          <Card className="mb-4">
            <Card.Header>
              <strong>Cost Breakdown by Execution Mode</strong>
            </Card.Header>
            <Card.Body>
              {analytics.cost_breakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.cost_breakdown}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="execution_mode" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="total_llm_cost" stackId="a" fill="#0d6efd" name="LLM Cost" />
                    <Bar dataKey="total_vector_db_cost" stackId="a" fill="#198754" name="Vector DB Cost" />
                    <Bar dataKey="total_mcp_cost" stackId="a" fill="#ffc107" name="MCP Cost" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted text-center">No cost data available</p>
              )}
              
              <Table striped bordered hover className="mt-3">
                <thead>
                  <tr>
                    <th>Mode</th>
                    <th>Executions</th>
                    <th>LLM Cost</th>
                    <th>Vector DB Cost</th>
                    <th>MCP Cost</th>
                    <th>Total Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.cost_breakdown.map((cost, idx) => (
                    <tr key={idx}>
                      <td><Badge bg="secondary">{cost.execution_mode}</Badge></td>
                      <td>{cost.execution_count}</td>
                      <td>{formatCost(cost.total_llm_cost)}</td>
                      <td>{formatCost(cost.total_vector_db_cost)}</td>
                      <td>{formatCost(cost.total_mcp_cost)}</td>
                      <td><strong>{formatCost(cost.total_cost)}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Tab>

        {/* Execution History Tab */}
        <Tab eventKey="history" title="Recent Executions">
          <Card>
            <Card.Header>
              <strong>Recent Execution History</strong>
            </Card.Header>
            <Card.Body>
              {executions.length > 0 ? (
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Mode</th>
                      <th>Status</th>
                      <th>Duration</th>
                      <th>Cost</th>
                      <th>Docs</th>
                      <th>Tools</th>
                    </tr>
                  </thead>
                  <tbody>
                    {executions.map((exec) => (
                      <tr key={exec.id}>
                        <td><small>{formatDate(exec.started_at)}</small></td>
                        <td><Badge bg="secondary">{exec.execution_mode}</Badge></td>
                        <td>
                          <Badge bg={exec.status === 'success' ? 'success' : 'danger'}>
                            {exec.status}
                          </Badge>
                        </td>
                        <td>{formatDuration(exec.duration_ms)}</td>
                        <td>{formatCost(exec.total_cost)}</td>
                        <td>{exec.documents_retrieved || 0}</td>
                        <td>{exec.tools_invoked || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <p className="text-muted text-center">No execution history available</p>
              )}
            </Card.Body>
          </Card>
        </Tab>

        {/* Recommendations Tab */}
        <Tab eventKey="recommendations" title={`Recommendations ${recommendations.length > 0 ? `(${recommendations.length})` : ''}`}>
          <Card>
            <Card.Header>
              <strong>Cost Optimization Recommendations</strong>
            </Card.Header>
            <Card.Body>
              {recommendations.length > 0 ? (
                recommendations.map((rec, idx) => (
                  <Alert key={idx} variant={getPriorityColor(rec.priority)}>
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <Alert.Heading as="h6">
                          <Badge bg={getPriorityColor(rec.priority)} className="me-2">
                            {rec.priority.toUpperCase()}
                          </Badge>
                          {rec.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Alert.Heading>
                        <p className="mb-2">{rec.reason}</p>
                        {rec.suggested_action && (
                          <p className="mb-2"><strong>Suggested Action:</strong> {rec.suggested_action}</p>
                        )}
                        {rec.estimated_savings && (
                          <p className="mb-0">
                            <strong>Potential Savings:</strong> {formatCost(rec.estimated_savings)}
                            {rec.current_cost && ` (${((rec.estimated_savings / rec.current_cost) * 100).toFixed(0)}% reduction)`}
                          </p>
                        )}
                      </div>
                      <Badge bg="info">{rec.impact} impact</Badge>
                    </div>
                  </Alert>
                ))
              ) : (
                <Alert variant="success">
                  <Alert.Heading>✅ No Recommendations</Alert.Heading>
                  <p>This agent is already optimized! No cost-saving opportunities detected.</p>
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>
    </div>
  );
};

export default AgentAnalytics;
