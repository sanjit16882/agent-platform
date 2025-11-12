/**
 * Testing Overview Component
 * 
 * Landing page with summary metrics and quick actions
 * Implements Task 11: Testing Overview Dashboard
 */

import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Table, Badge, Spinner, Alert, ProgressBar, Modal, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { testingApi } from '../../services/testingApi';
import { theme } from '../../styles/theme';
import s3AgentService from '../../services/s3AgentService';

interface OverviewMetrics {
  totalAgents: number;
  testCoverage: number;
  overallPassRate: number;
  testsToday: number;
  qualityDistribution: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
  };
  recentRuns: any[];
  trends: any[];
}

const TestingOverview: React.FC = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRunModal, setShowRunModal] = useState(false);
  const [selectedSuite, setSelectedSuite] = useState<string>('');
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [testSuites, setTestSuites] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);

  useEffect(() => {
    loadOverviewMetrics();
    loadTestSuites();
    loadAgents();
  }, []);

  const loadTestSuites = async () => {
    try {
      const suites = await testingApi.getTestSuites();
      setTestSuites(suites);
    } catch (err) {
      console.error('Failed to load test suites:', err);
    }
  };

  const loadAgents = async () => {
    try {
      const agentList = await s3AgentService.getAllAgents();
      setAgents(agentList);
    } catch (err) {
      console.error('Failed to load agents:', err);
    }
  };

  const handleRunTests = async () => {
    if (!selectedSuite) {
      alert('Please select a test suite');
      return;
    }

    if (selectedAgents.length === 0) {
      alert('Please select at least one agent to test');
      return;
    }

    setRunning(true);
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3002';
      const response = await axios.post(`${apiUrl}/api/testing/run/category`, {
        agentIds: selectedAgents,
        categoryId: selectedSuite
      });
      
      alert(`Test run started! Testing ${selectedAgents.length} agent(s) with ${testSuites.find(s => s.id === selectedSuite)?.testCases?.length || 0} tests.`);
      setShowRunModal(false);
      setSelectedSuite('');
      setSelectedAgents([]);
      // Refresh metrics after starting test
      setTimeout(loadOverviewMetrics, 2000);
    } catch (err) {
      alert('Failed to start test run. Make sure backend is running.');
      console.error('Error running tests:', err);
    } finally {
      setRunning(false);
    }
  };

  const loadOverviewMetrics = async () => {
    try {
      setLoading(true);
      
      // Try to get real agent data first
      const agents = await s3AgentService.getAllAgents();
      const totalAgents = agents.length;
      
      // Try to get test analytics from backend
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3002';
      try {
        const response = await axios.get(`${apiUrl}/api/testing/analytics/overview`);
        setMetrics({
          ...response.data,
          totalAgents // Override with real agent count
        });
        setError(null);
      } catch (backendErr) {
        // Backend not available, use real agent count with demo test data
        console.log('Backend analytics not available, using real agent count with demo test data');
        setMetrics(getDemoMetrics(totalAgents));
        setError('Using demo test data. Backend analytics not available.');
      }
    } catch (err: any) {
      console.error('Failed to load overview metrics:', err);
      setError(err.message || 'Failed to load metrics');
      // Fallback to demo data
      setMetrics(getDemoMetrics());
    } finally {
      setLoading(false);
    }
  };

  const getDemoMetrics = (realAgentCount?: number): OverviewMetrics => {
    const totalAgents = realAgentCount || 24;
    // Calculate quality distribution based on real agent count
    const excellent = Math.floor(totalAgents * 0.5);
    const good = Math.floor(totalAgents * 0.33);
    const fair = Math.floor(totalAgents * 0.125);
    const poor = totalAgents - excellent - good - fair;
    
    return {
      totalAgents,
      testCoverage: 87,
      overallPassRate: 92.5,
      testsToday: 156,
      qualityDistribution: {
        excellent,
        good,
        fair,
        poor
      },
      recentRuns: [
        { id: '1', agentName: 'Email Summarizer', passRate: 95, timestamp: new Date().toISOString(), status: 'completed' },
        { id: '2', agentName: 'Code Generator', passRate: 88, timestamp: new Date().toISOString(), status: 'completed' },
        { id: '3', agentName: 'Data Analyzer', passRate: 100, timestamp: new Date().toISOString(), status: 'completed' },
        { id: '4', agentName: 'Content Writer', passRate: 92, timestamp: new Date().toISOString(), status: 'completed' },
        { id: '5', agentName: 'Translation Agent', passRate: 78, timestamp: new Date().toISOString(), status: 'failed' }
      ],
      trends: [
        { date: 'Mon', passRate: 89 },
        { date: 'Tue', passRate: 91 },
        { date: 'Wed', passRate: 88 },
        { date: 'Thu', passRate: 93 },
        { date: 'Fri', passRate: 92 },
        { date: 'Sat', passRate: 94 },
        { date: 'Sun', passRate: 92 }
      ]
    };
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading overview metrics...</p>
      </div>
    );
  }

  if (!metrics) {
    return (
      <Alert variant="danger">
        Failed to load overview metrics. Please try again later.
      </Alert>
    );
  }

  const qualityData = [
    { name: 'Excellent', value: metrics.qualityDistribution.excellent, color: '#28a745' },
    { name: 'Good', value: metrics.qualityDistribution.good, color: '#17a2b8' },
    { name: 'Fair', value: metrics.qualityDistribution.fair, color: '#ffc107' },
    { name: 'Poor', value: metrics.qualityDistribution.poor, color: '#dc3545' }
  ];

  return (
    <div>
      {error && (
        <Alert variant="warning" dismissible onClose={() => setError(null)}>
          <strong>Note:</strong> Using demo data. {error}
        </Alert>
      )}

      {/* Quick Actions */}
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <Row className="align-items-center">
            <Col>
              <h5 className="mb-0">🚀 Quick Actions</h5>
              <p className="text-muted mb-0 small">Run tests and manage your testing workflow</p>
            </Col>
            <Col xs="auto">
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <Button 
                  variant="success"
                  onClick={() => {
                    // Pre-select all agents and open modal
                    setSelectedAgents(agents.map(a => a.id));
                    setShowRunModal(true);
                  }}
                >
                  🚀 Run All Agents
                </Button>
                <Button 
                  variant="outline-primary" 
                  onClick={() => navigate('/agent-testing/suites')}
                >
                  ➕ Create Suite
                </Button>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Summary Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="h-100 shadow-sm">
            <Card.Body>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <Card.Title style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.textSecondary, marginBottom: theme.spacing.sm }}>
                    Total Agents
                  </Card.Title>
                  <h2 style={{ fontSize: theme.typography.fontSize['3xl'], fontWeight: theme.typography.fontWeight.bold, color: theme.colors.primary }}>
                    {metrics.totalAgents}
                  </h2>
                </div>
                <div style={{ fontSize: '2rem' }}>🤖</div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="h-100 shadow-sm">
            <Card.Body>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <Card.Title style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.textSecondary, marginBottom: theme.spacing.sm }}>
                    Test Coverage
                  </Card.Title>
                  <h2 style={{ fontSize: theme.typography.fontSize['3xl'], fontWeight: theme.typography.fontWeight.bold, color: theme.colors.success }}>
                    {metrics.testCoverage}%
                  </h2>
                </div>
                <div style={{ fontSize: '2rem' }}>📊</div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="h-100 shadow-sm">
            <Card.Body>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <Card.Title style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.textSecondary, marginBottom: theme.spacing.sm }}>
                    Overall Pass Rate
                  </Card.Title>
                  <h2 style={{ fontSize: theme.typography.fontSize['3xl'], fontWeight: theme.typography.fontWeight.bold, color: theme.colors.success }}>
                    {metrics.overallPassRate}%
                  </h2>
                </div>
                <div style={{ fontSize: '2rem' }}>✅</div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="h-100 shadow-sm">
            <Card.Body>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <Card.Title style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.textSecondary, marginBottom: theme.spacing.sm }}>
                    Tests Today
                  </Card.Title>
                  <h2 style={{ fontSize: theme.typography.fontSize['3xl'], fontWeight: theme.typography.fontWeight.bold, color: theme.colors.info }}>
                    {metrics.testsToday}
                  </h2>
                </div>
                <div style={{ fontSize: '2rem' }}>🧪</div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Charts Row */}
      <Row className="mb-4">
        <Col md={6}>
          <Card className="shadow-sm">
            <Card.Header style={{ backgroundColor: theme.colors.backgroundSecondary, fontWeight: theme.typography.fontWeight.semibold }}>
              Quality Distribution
            </Card.Header>
            <Card.Body>
              <div style={{ padding: '20px' }}>
                {qualityData.map((item) => (
                  <div key={item.name} style={{ marginBottom: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span style={{ fontWeight: 500 }}>{item.name}</span>
                      <span style={{ color: item.color, fontWeight: 'bold' }}>{item.value} agents</span>
                    </div>
                    <ProgressBar 
                      now={(item.value / metrics.totalAgents) * 100} 
                      style={{ height: '20px', backgroundColor: '#e9ecef' }}
                    >
                      <ProgressBar 
                        now={(item.value / metrics.totalAgents) * 100}
                        style={{ backgroundColor: item.color }}
                        label={`${((item.value / metrics.totalAgents) * 100).toFixed(0)}%`}
                      />
                    </ProgressBar>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="shadow-sm">
            <Card.Header style={{ backgroundColor: theme.colors.backgroundSecondary, fontWeight: theme.typography.fontWeight.semibold }}>
              Pass Rate Trend (Last 7 Days)
            </Card.Header>
            <Card.Body>
              <div style={{ padding: '20px' }}>
                {metrics.trends.map((day, index) => (
                  <div key={day.date} style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span style={{ fontWeight: 500 }}>{day.date}</span>
                      <span style={{ color: day.passRate >= 90 ? '#28a745' : '#ffc107', fontWeight: 'bold' }}>
                        {day.passRate}%
                      </span>
                    </div>
                    <ProgressBar 
                      now={day.passRate} 
                      variant={day.passRate >= 90 ? 'success' : 'warning'}
                      style={{ height: '15px' }}
                    />
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>



      {/* Recent Test Runs */}
      <Row>
        <Col>
          <Card className="shadow-sm">
            <Card.Header style={{ backgroundColor: theme.colors.backgroundSecondary, fontWeight: theme.typography.fontWeight.semibold }}>
              Recent Test Runs
            </Card.Header>
            <Card.Body>
              <Table hover responsive>
                <thead>
                  <tr>
                    <th>Agent</th>
                    <th>Pass Rate</th>
                    <th>Status</th>
                    <th>Time</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.recentRuns.map((run) => (
                    <tr key={run.id}>
                      <td style={{ fontWeight: theme.typography.fontWeight.medium }}>{run.agentName}</td>
                      <td>
                        <Badge bg={run.passRate >= 90 ? 'success' : run.passRate >= 70 ? 'warning' : 'danger'}>
                          {run.passRate}%
                        </Badge>
                      </td>
                      <td>
                        <Badge bg={run.status === 'completed' ? 'success' : 'danger'}>
                          {run.status}
                        </Badge>
                      </td>
                      <td style={{ color: theme.colors.textSecondary }}>
                        {new Date(run.timestamp).toLocaleTimeString()}
                      </td>
                      <td>
                        <Button variant="link" size="sm">View Details</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Run Tests Modal */}
      <Modal show={showRunModal} onHide={() => setShowRunModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Run Tests</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label><strong>Step 1: Select Test Suite</strong></Form.Label>
              <Form.Select 
                value={selectedSuite} 
                onChange={(e) => setSelectedSuite(e.target.value)}
              >
                <option value="">Choose a test suite...</option>
                {testSuites.map((suite: any) => (
                  <option key={suite.id} value={suite.id}>
                    {suite.name} ({suite.testCases?.length || 0} tests)
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <Form.Label className="mb-0"><strong>Step 2: Select Agents to Test</strong></Form.Label>
                <div>
                  <Badge bg="primary" className="me-2">{selectedAgents.length} selected</Badge>
                  <Button 
                    variant="outline-primary" 
                    size="sm"
                    onClick={() => setSelectedAgents(selectedAgents.length === agents.length ? [] : agents.map(a => a.id))}
                  >
                    {selectedAgents.length === agents.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>
              </div>
              <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #dee2e6', borderRadius: '4px', padding: '10px' }}>
                {agents.length === 0 ? (
                  <Alert variant="info" className="mb-0">No agents available</Alert>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {agents.map((agent: any) => (
                      <Form.Check
                        key={agent.id}
                        type="checkbox"
                        id={`agent-${agent.id}`}
                        label={
                          <div>
                            <div style={{ fontWeight: 500 }}>{agent.name}</div>
                            <small className="text-muted">{agent.category}</small>
                          </div>
                        }
                        checked={selectedAgents.includes(agent.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedAgents([...selectedAgents, agent.id]);
                          } else {
                            setSelectedAgents(selectedAgents.filter(id => id !== agent.id));
                          }
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRunModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleRunTests}
            disabled={running || !selectedSuite || selectedAgents.length === 0}
          >
            {running ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Starting...
              </>
            ) : (
              `▶️ Run Tests (${selectedAgents.length} agent${selectedAgents.length !== 1 ? 's' : ''})`
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default TestingOverview;
