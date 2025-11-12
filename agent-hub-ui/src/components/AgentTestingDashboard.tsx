import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Badge, ProgressBar, Tabs, Tab } from 'react-bootstrap';
import { theme } from '../styles/theme';

const AgentTestingDashboard: React.FC = () => {
  const [testSuites, setTestSuites] = useState<any[]>([]);
  const [executions, setExecutions] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [trends, setTrends] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [suitesRes, executionsRes, analyticsRes, trendsRes] = await Promise.all([
        fetch('http://localhost:3003/api/v1/testing/suites').then(r => r.json()),
        fetch('http://localhost:3003/api/v1/testing/executions').then(r => r.json()),
        fetch('http://localhost:3003/api/v1/testing/analytics/summary').then(r => r.json()),
        fetch('http://localhost:3003/api/v1/testing/analytics/trends').then(r => r.json())
      ]);

      setTestSuites(suitesRes.data);
      setExecutions(executionsRes.data);
      setAnalytics(analyticsRes.data);
      setTrends(trendsRes.data);
    } catch (error) {
      console.error('Failed to load testing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const runTest = async (suiteId: string) => {
    try {
      const response = await fetch(`http://localhost:3003/api/v1/testing/suites/${suiteId}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ triggeredBy: 'manual', environment: 'dev' })
      });
      const data = await response.json();
      alert(`Test execution started! Execution ID: ${data.data.executionId}`);
      setTimeout(loadData, 2000);
    } catch (error) {
      console.error('Failed to run test:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      passed: 'success',
      failed: 'danger',
      running: 'info',
      warning: 'warning'
    };
    return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const getTestTypeBadge = (type: string) => {
    const colors: any = {
      agent: 'primary',
      api: 'info',
      ui: 'success',
      security: 'danger'
    };
    return <Badge bg={colors[type] || 'secondary'}>{type}</Badge>;
  };

  if (loading) {
    return <Container><h3>Loading...</h3></Container>;
  }

  return (
    <Container fluid style={{ 
      padding: theme.spacing['3xl'],
      backgroundColor: theme.colors.backgroundSecondary,
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{ marginBottom: theme.spacing['3xl'] }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.lg }}>
          <div>
            <h1 style={{ 
              fontSize: theme.typography.fontSize['3xl'],
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.primary,
              marginBottom: theme.spacing.sm
            }}>
              🧪 Agent Testing Framework
            </h1>
            <p style={{ 
              fontSize: theme.typography.fontSize.lg,
              color: theme.colors.textSecondary,
              margin: 0
            }}>
              Enterprise-grade testing for AI agents - Integrate with your existing testing infrastructure
            </p>
          </div>
          <div style={{ display: 'flex', gap: theme.spacing.sm }}>
            <Button variant="outline-primary" onClick={loadData}>
              🔄 Refresh
            </Button>
            <Button variant="primary" onClick={() => window.location.href = '/testing/create'}>
              + Create Test Suite
            </Button>
          </div>
        </div>

        {/* Key Use Cases Banner */}
        <Card style={{ backgroundColor: '#e7f3ff', border: '1px solid #0066cc' }}>
          <Card.Body>
            <h6 style={{ marginBottom: theme.spacing.md }}>
              <strong>🎯 Enterprise Agent Testing Use Cases</strong>
            </h6>
            <Row>
              <Col md={3}>
                <div style={{ fontSize: theme.typography.fontSize.sm }}>
                  ✅ <strong>Quality Assurance</strong><br/>
                  <span style={{ color: theme.colors.textMuted }}>Validate response quality</span>
                </div>
              </Col>
              <Col md={3}>
                <div style={{ fontSize: theme.typography.fontSize.sm }}>
                  ✅ <strong>Compliance Testing</strong><br/>
                  <span style={{ color: theme.colors.textMuted }}>Regulatory requirements</span>
                </div>
              </Col>
              <Col md={3}>
                <div style={{ fontSize: theme.typography.fontSize.sm }}>
                  ✅ <strong>Security Testing</strong><br/>
                  <span style={{ color: theme.colors.textMuted }}>Prompt injection protection</span>
                </div>
              </Col>
              <Col md={3}>
                <div style={{ fontSize: theme.typography.fontSize.sm }}>
                  ✅ <strong>Performance Testing</strong><br/>
                  <span style={{ color: theme.colors.textMuted }}>Cost & latency monitoring</span>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </div>

      {/* Summary Cards */}
      {analytics && (
        <Row className="mb-4">
          <Col md={3}>
            <Card style={{ height: '100%' }}>
              <Card.Body style={{ textAlign: 'center' }}>
                <div style={{ fontSize: theme.typography.fontSize['2xl'], fontWeight: 'bold', color: theme.colors.primary }}>
                  {analytics.totalTests}
                </div>
                <div style={{ color: theme.colors.textMuted }}>Total Test Suites</div>
                <small style={{ color: theme.colors.textSecondary }}>Across all test types</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card style={{ height: '100%' }}>
              <Card.Body style={{ textAlign: 'center' }}>
                <div style={{ fontSize: theme.typography.fontSize['2xl'], fontWeight: 'bold', color: theme.colors.info }}>
                  {analytics.totalExecutions}
                </div>
                <div style={{ color: theme.colors.textMuted }}>Total Executions</div>
                <small style={{ color: theme.colors.textSecondary }}>Last 30 days</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card style={{ height: '100%' }}>
              <Card.Body style={{ textAlign: 'center' }}>
                <div style={{ fontSize: theme.typography.fontSize['2xl'], fontWeight: 'bold', color: theme.colors.success }}>
                  {analytics.passRate}%
                </div>
                <div style={{ color: theme.colors.textMuted }}>Pass Rate</div>
                <ProgressBar now={analytics.passRate} variant="success" style={{ marginTop: theme.spacing.sm }} />
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card style={{ height: '100%' }}>
              <Card.Body style={{ textAlign: 'center' }}>
                <div style={{ fontSize: theme.typography.fontSize['2xl'], fontWeight: 'bold', color: theme.colors.warning }}>
                  ${analytics.totalCost}
                </div>
                <div style={{ color: theme.colors.textMuted }}>Total Cost</div>
                <small style={{ color: theme.colors.textSecondary }}>Last 30 days</small>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Tabs for different views */}
      <Tabs defaultActiveKey="suites" className="mb-3">
        {/* Test Suites Tab */}
        <Tab eventKey="suites" title="Test Suites">
          <Card>
            <Card.Header>
              <h5 style={{ margin: 0 }}>Test Suites by Use Case</h5>
            </Card.Header>
            <Card.Body>
              <Table hover responsive>
                <thead>
                  <tr>
                    <th>Test Suite</th>
                    <th>Type</th>
                    <th>Use Case</th>
                    <th>Test Cases</th>
                    <th>Last Run</th>
                    <th>Pass Rate</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {testSuites.map(suite => (
                    <tr key={suite.id}>
                      <td>
                        <strong>{suite.name}</strong>
                        <br/>
                        <small style={{ color: theme.colors.textMuted }}>{suite.description}</small>
                      </td>
                      <td>{getTestTypeBadge(suite.type)}</td>
                      <td>
                        {suite.tags?.map((tag: string) => (
                          <Badge key={tag} bg="secondary" style={{ marginRight: '4px', fontSize: '10px' }}>
                            {tag}
                          </Badge>
                        ))}
                      </td>
                      <td>{suite.testCaseCount}</td>
                      <td>
                        {suite.lastRun ? new Date(suite.lastRun).toLocaleString() : 'Never'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{suite.passRate}%</span>
                          <ProgressBar 
                            now={suite.passRate} 
                            variant={suite.passRate > 90 ? 'success' : suite.passRate > 70 ? 'warning' : 'danger'}
                            style={{ width: '60px', height: '8px' }}
                          />
                        </div>
                      </td>
                      <td>{getStatusBadge(suite.lastStatus || 'not-run')}</td>
                      <td>
                        <Button size="sm" variant="primary" onClick={() => runTest(suite.id)}>
                          ▶ Run
                        </Button>
                        {' '}
                        <Button size="sm" variant="outline-secondary" 
                          onClick={() => window.location.href = `/testing/suites/${suite.id}`}>
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Tab>

        {/* Recent Executions Tab */}
        <Tab eventKey="executions" title="Recent Executions">
          <Card>
            <Card.Header>
              <h5 style={{ margin: 0 }}>Recent Test Executions</h5>
            </Card.Header>
            <Card.Body>
              <Table hover responsive>
                <thead>
                  <tr>
                    <th>Execution ID</th>
                    <th>Test Suite</th>
                    <th>Status</th>
                    <th>Started</th>
                    <th>Duration</th>
                    <th>Triggered By</th>
                    <th>Results</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {executions.map(exec => (
                    <tr key={exec.id}>
                      <td><code>{exec.id}</code></td>
                      <td>{exec.testName}</td>
                      <td>{getStatusBadge(exec.status)}</td>
                      <td>{new Date(exec.startedAt).toLocaleString()}</td>
                      <td>{(exec.duration / 1000).toFixed(1)}s</td>
                      <td>
                        <Badge bg="info">{exec.triggeredBy}</Badge>
                      </td>
                      <td>
                        {exec.summary && (
                          <span>
                            <span style={{ color: theme.colors.success }}>✓ {exec.summary.passed}</span>
                            {' / '}
                            <span style={{ color: theme.colors.danger }}>✗ {exec.summary.failed}</span>
                            {' / '}
                            <span style={{ color: theme.colors.textMuted }}>{exec.summary.total} total</span>
                          </span>
                        )}
                      </td>
                      <td>
                        <Button size="sm" variant="outline-primary"
                          onClick={() => window.location.href = `/testing/executions/${exec.id}`}>
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Tab>

        {/* Analytics Tab */}
        <Tab eventKey="analytics" title="Analytics & Trends">
          <Row>
            <Col md={12} className="mb-4">
              <Card>
                <Card.Header>
                  <h6>Pass Rate Trend (Last 7 Days)</h6>
                </Card.Header>
                <Card.Body>
                  <Table bordered size="sm">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Pass Rate</th>
                        <th>Trend</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trends?.passRateHistory?.map((d: any, idx: number) => (
                        <tr key={idx}>
                          <td>{d.date}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span>{d.passRate}%</span>
                              <ProgressBar 
                                now={d.passRate} 
                                variant="success" 
                                style={{ width: '200px', height: '20px' }}
                              />
                            </div>
                          </td>
                          <td>
                            {idx > 0 && trends.passRateHistory[idx - 1] && (
                              d.passRate > trends.passRateHistory[idx - 1].passRate ? (
                                <span style={{ color: theme.colors.success }}>↑ Improving</span>
                              ) : d.passRate < trends.passRateHistory[idx - 1].passRate ? (
                                <span style={{ color: theme.colors.danger }}>↓ Declining</span>
                              ) : (
                                <span style={{ color: theme.colors.textMuted }}>→ Stable</span>
                              )
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6} className="mb-4">
              <Card>
                <Card.Header>
                  <h6>Cost Trend (Last 7 Days)</h6>
                </Card.Header>
                <Card.Body>
                  <Table bordered size="sm">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Daily Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trends?.costTrend?.map((d: any, idx: number) => (
                        <tr key={idx}>
                          <td>{d.date}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span>${d.cost.toFixed(2)}</span>
                              <ProgressBar 
                                now={(d.cost / 10) * 100} 
                                variant="warning" 
                                style={{ width: '150px', height: '15px' }}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6} className="mb-4">
              <Card>
                <Card.Header>
                  <h6>Latency Trend (Last 7 Days)</h6>
                </Card.Header>
                <Card.Body>
                  <Table bordered size="sm">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Avg Latency</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trends?.latencyTrend?.map((d: any, idx: number) => (
                        <tr key={idx}>
                          <td>{d.date}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span>{d.avgLatency}ms</span>
                              <ProgressBar 
                                now={(d.avgLatency / 5000) * 100} 
                                variant="info" 
                                style={{ width: '150px', height: '15px' }}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>

        {/* Integration Guide Tab */}
        <Tab eventKey="integration" title="Enterprise Integration">
          <Card>
            <Card.Header>
              <h5>How to Integrate Agent Testing into Your Enterprise Testing Framework</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <h6>🔧 Existing Testing Tools Integration</h6>
                  <Table bordered size="sm">
                    <thead>
                      <tr>
                        <th>Tool Type</th>
                        <th>Tools Supported</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>UI Testing</td>
                        <td>Selenium, Playwright, Cypress</td>
                        <td><Badge bg="success">Integrated</Badge></td>
                      </tr>
                      <tr>
                        <td>API Testing</td>
                        <td>Postman, REST-assured, Karate</td>
                        <td><Badge bg="success">Integrated</Badge></td>
                      </tr>
                      <tr>
                        <td>Unit Testing</td>
                        <td>Jest, pytest, JUnit</td>
                        <td><Badge bg="success">Integrated</Badge></td>
                      </tr>
                      <tr>
                        <td>Performance</td>
                        <td>K6, JMeter</td>
                        <td><Badge bg="warning">Coming Soon</Badge></td>
                      </tr>
                    </tbody>
                  </Table>

                  <h6 className="mt-4">📋 Testing Process Integration</h6>
                  <ol style={{ fontSize: theme.typography.fontSize.sm }}>
                    <li><strong>Development Phase:</strong> Unit tests for agent logic</li>
                    <li><strong>Pre-Commit:</strong> Automated regression tests</li>
                    <li><strong>CI/CD Pipeline:</strong> Integration & API tests</li>
                    <li><strong>Staging:</strong> Full E2E and compliance tests</li>
                    <li><strong>Pre-Production:</strong> Security & performance tests</li>
                    <li><strong>Production:</strong> Continuous monitoring tests</li>
                  </ol>
                </Col>

                <Col md={6}>
                  <h6>🎯 Key Testing Scenarios</h6>
                  
                  <Card className="mb-3" style={{ backgroundColor: '#f8f9fa' }}>
                    <Card.Body>
                      <strong>1. Quality Assurance Testing</strong>
                      <ul style={{ fontSize: theme.typography.fontSize.sm, marginTop: '8px' }}>
                        <li>Response accuracy validation</li>
                        <li>Tone and sentiment analysis</li>
                        <li>Output format verification</li>
                      </ul>
                    </Card.Body>
                  </Card>

                  <Card className="mb-3" style={{ backgroundColor: '#f8f9fa' }}>
                    <Card.Body>
                      <strong>2. Compliance & Regulatory Testing</strong>
                      <ul style={{ fontSize: theme.typography.fontSize.sm, marginTop: '8px' }}>
                        <li>Required disclaimers present</li>
                        <li>Industry-specific regulations (SEC, HIPAA, GDPR)</li>
                        <li>Audit trail verification</li>
                      </ul>
                    </Card.Body>
                  </Card>

                  <Card className="mb-3" style={{ backgroundColor: '#f8f9fa' }}>
                    <Card.Body>
                      <strong>3. Security Testing</strong>
                      <ul style={{ fontSize: theme.typography.fontSize.sm, marginTop: '8px' }}>
                        <li>Prompt injection resistance</li>
                        <li>PII data leakage prevention</li>
                        <li>Jailbreak attempt detection</li>
                      </ul>
                    </Card.Body>
                  </Card>

                  <Card className="mb-3" style={{ backgroundColor: '#f8f9fa' }}>
                    <Card.Body>
                      <strong>4. Performance & Cost Testing</strong>
                      <ul style={{ fontSize: theme.typography.fontSize.sm, marginTop: '8px' }}>
                        <li>Response latency monitoring</li>
                        <li>Token usage optimization</li>
                        <li>Cost per interaction tracking</li>
                      </ul>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <hr />

              <h6>🚀 Quick Start: Add Agent Testing to Your Pipeline</h6>
              <pre style={{ backgroundColor: '#f5f5f5', padding: '16px', borderRadius: '4px', fontSize: '12px' }}>
{`# Example: Jenkins Pipeline Integration
pipeline {
  stages {
    stage('Agent Tests') {
      steps {
        sh 'npm run test:agents'
        sh 'curl -X POST http://testing-api/suites/compliance/run'
      }
    }
  }
}

# Example: GitHub Actions
- name: Run Agent Tests
  run: |
    npm run test:agents
    curl -X POST http://testing-api/suites/security/run`}
              </pre>
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>

      {/* Footer Info */}
      <Card style={{ marginTop: theme.spacing.xl, backgroundColor: '#e7f3ff', border: '1px solid #0066cc' }}>
        <Card.Body>
          <Row>
            <Col md={8}>
              <h6><strong>💡 Why Agent Testing Matters for Enterprises</strong></h6>
              <p style={{ fontSize: theme.typography.fontSize.sm, marginBottom: 0 }}>
                Traditional testing frameworks don't account for the non-deterministic nature of AI agents. 
                This framework bridges that gap by providing specialized testing for agent quality, compliance, 
                security, and performance - all while integrating seamlessly with your existing testing tools 
                and CI/CD pipelines.
              </p>
            </Col>
            <Col md={4} style={{ textAlign: 'right' }}>
              <Button variant="primary" size="lg">
                📖 View Documentation
              </Button>
              <br/>
              <Button variant="outline-primary" size="sm" style={{ marginTop: '8px' }}>
                🎓 Training Resources
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AgentTestingDashboard;
