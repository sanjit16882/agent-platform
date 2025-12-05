import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Table, Alert, Accordion } from 'react-bootstrap';
import { theme } from '../styles/theme';

interface TestExecutionDetailsProps {
  executionId: string;
}

const TestExecutionDetails: React.FC<TestExecutionDetailsProps> = ({ executionId }) => {
  const [execution, setExecution] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExecutionDetails();
  }, [executionId]);

  const loadExecutionDetails = async () => {
    try {
      const response = await fetch(`http://localhost:4003/api/v1/testing/executions/${executionId}/results`);
      const data = await response.json();
      setExecution(data.data.execution);
      setResults(data.data.results);
    } catch (error) {
      console.error('Failed to load execution details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Container><h3>Loading...</h3></Container>;
  }

  if (!execution) {
    return <Container><Alert variant="warning">Execution not found</Alert></Container>;
  }

  const getStatusColor = (status: string) => {
    const colors: any = {
      passed: theme.colors.success,
      failed: theme.colors.danger,
      error: theme.colors.warning
    };
    return colors[status] || theme.colors.secondary;
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      passed: 'success',
      failed: 'danger',
      error: 'warning'
    };
    return <Badge bg={variants[status] || 'secondary'}>{status.toUpperCase()}</Badge>;
  };

  return (
    <Container fluid style={{ padding: theme.spacing['3xl'] }}>
      {/* Header */}
      <div style={{ marginBottom: theme.spacing.xl }}>
        <h2 style={{ color: theme.colors.primary }}>Test Execution Details</h2>
        <p style={{ color: theme.colors.textMuted }}>
          Execution ID: <code>{execution.id}</code>
        </p>
      </div>

      {/* Execution Summary */}
      <Row className="mb-4">
        <Col md={3}>
          <Card>
            <Card.Body style={{ textAlign: 'center' }}>
              <h3 style={{ color: getStatusColor(execution.status) }}>
                {getStatusBadge(execution.status)}
              </h3>
              <small style={{ color: theme.colors.textMuted }}>Overall Status</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card>
            <Card.Body style={{ textAlign: 'center' }}>
              <h3>{execution.summary.total}</h3>
              <small style={{ color: theme.colors.textMuted }}>Total Tests</small>
              <div style={{ marginTop: '8px', fontSize: '12px' }}>
                <span style={{ color: theme.colors.success }}>✓ {execution.summary.passed}</span>
                {' '}
                <span style={{ color: theme.colors.danger }}>✗ {execution.summary.failed}</span>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card>
            <Card.Body style={{ textAlign: 'center' }}>
              <h3>{execution.summary.passRate}%</h3>
              <small style={{ color: theme.colors.textMuted }}>Pass Rate</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card>
            <Card.Body style={{ textAlign: 'center' }}>
              <h3>{(execution.duration / 1000).toFixed(1)}s</h3>
              <small style={{ color: theme.colors.textMuted }}>Duration</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Execution Metadata */}
      <Card className="mb-4">
        <Card.Header>
          <h5>Execution Information</h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <Table borderless size="sm">
                <tbody>
                  <tr>
                    <td><strong>Test Suite:</strong></td>
                    <td>{execution.testName}</td>
                  </tr>
                  <tr>
                    <td><strong>Started At:</strong></td>
                    <td>{new Date(execution.startedAt).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td><strong>Completed At:</strong></td>
                    <td>{new Date(execution.completedAt).toLocaleString()}</td>
                  </tr>
                </tbody>
              </Table>
            </Col>
            <Col md={6}>
              <Table borderless size="sm">
                <tbody>
                  <tr>
                    <td><strong>Triggered By:</strong></td>
                    <td><Badge bg="info">{execution.triggeredBy}</Badge></td>
                  </tr>
                  <tr>
                    <td><strong>Environment:</strong></td>
                    <td><Badge bg="secondary">{execution.environment}</Badge></td>
                  </tr>
                  {execution.metrics && (
                    <>
                      <tr>
                        <td><strong>Avg Latency:</strong></td>
                        <td>{execution.metrics.avgLatency}ms</td>
                      </tr>
                      <tr>
                        <td><strong>Total Cost:</strong></td>
                        <td>${execution.metrics.totalCost}</td>
                      </tr>
                    </>
                  )}
                </tbody>
              </Table>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Test Results */}
      <Card>
        <Card.Header>
          <h5>Test Case Results</h5>
        </Card.Header>
        <Card.Body>
          <Accordion>
            {results.map((result, index) => (
              <Accordion.Item eventKey={String(index)} key={result.id}>
                <Accordion.Header>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', paddingRight: '20px' }}>
                    <span>
                      {getStatusBadge(result.status)} {result.testCaseName}
                    </span>
                    <span style={{ color: theme.colors.textMuted }}>
                      {result.duration}ms
                    </span>
                  </div>
                </Accordion.Header>
                <Accordion.Body>
                  {/* Test Case Details */}
                  <Row>
                    <Col md={6}>
                      <h6>Input</h6>
                      <Card style={{ backgroundColor: '#f8f9fa' }}>
                        <Card.Body>
                          <pre style={{ margin: 0, fontSize: '12px', whiteSpace: 'pre-wrap' }}>
                            {JSON.stringify(result.actual, null, 2)}
                          </pre>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={6}>
                      <h6>Output</h6>
                      <Card style={{ backgroundColor: '#f8f9fa' }}>
                        <Card.Body>
                          <div style={{ fontSize: '14px' }}>
                            {result.actual?.output || 'No output'}
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>

                  {/* Assertions */}
                  <h6 className="mt-4">Assertions</h6>
                  <Table bordered size="sm">
                    <thead>
                      <tr>
                        <th>Status</th>
                        <th>Type</th>
                        <th>Description</th>
                        <th>Expected</th>
                        <th>Actual</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.assertions?.map((assertion: any, idx: number) => (
                        <tr key={idx} style={{ 
                          backgroundColor: assertion.passed ? '#d4edda' : '#f8d7da' 
                        }}>
                          <td>
                            {assertion.passed ? (
                              <span style={{ color: theme.colors.success }}>✓ PASS</span>
                            ) : (
                              <span style={{ color: theme.colors.danger }}>✗ FAIL</span>
                            )}
                          </td>
                          <td><code>{assertion.type}</code></td>
                          <td>{assertion.description}</td>
                          <td>{assertion.value || assertion.expected}</td>
                          <td>{assertion.actual || 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>

                  {/* Metrics */}
                  {result.actual && (
                    <>
                      <h6 className="mt-4">Metrics</h6>
                      <Row>
                        {result.actual.latency && (
                          <Col md={3}>
                            <Card>
                              <Card.Body style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                                  {result.actual.latency}ms
                                </div>
                                <small>Latency</small>
                              </Card.Body>
                            </Card>
                          </Col>
                        )}
                        {result.actual.cost && (
                          <Col md={3}>
                            <Card>
                              <Card.Body style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                                  ${result.actual.cost.toFixed(4)}
                                </div>
                                <small>Cost</small>
                              </Card.Body>
                            </Card>
                          </Col>
                        )}
                        {result.actual.tokenUsage && (
                          <Col md={3}>
                            <Card>
                              <Card.Body style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                                  {result.actual.tokenUsage.input + result.actual.tokenUsage.output}
                                </div>
                                <small>Total Tokens</small>
                              </Card.Body>
                            </Card>
                          </Col>
                        )}
                        {result.actual.empathyScore && (
                          <Col md={3}>
                            <Card>
                              <Card.Body style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                                  {(result.actual.empathyScore * 100).toFixed(0)}%
                                </div>
                                <small>Empathy Score</small>
                              </Card.Body>
                            </Card>
                          </Col>
                        )}
                      </Row>
                    </>
                  )}

                  {/* Failure Reason */}
                  {result.failureReason && (
                    <Alert variant="danger" className="mt-3">
                      <strong>Failure Reason:</strong> {result.failureReason}
                    </Alert>
                  )}

                  {/* Error */}
                  {result.error && (
                    <Alert variant="danger" className="mt-3">
                      <strong>Error:</strong> {result.error}
                    </Alert>
                  )}
                </Accordion.Body>
              </Accordion.Item>
            ))}
          </Accordion>
        </Card.Body>
      </Card>

      {/* Real-World Insights */}
      <Card className="mt-4" style={{ backgroundColor: '#fff3cd', border: '1px solid #ffc107' }}>
        <Card.Body>
          <h6><strong>💡 Enterprise Testing Insights</strong></h6>
          <p style={{ fontSize: theme.typography.fontSize.sm, marginBottom: 0 }}>
            This execution demonstrates how agent testing validates quality, compliance, and performance 
            before production deployment. Failed tests prevent problematic agents from reaching customers, 
            while detailed metrics help optimize costs and latency.
          </p>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default TestExecutionDetails;
