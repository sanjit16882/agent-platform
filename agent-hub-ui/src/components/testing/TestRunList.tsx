/**
 * Test Run List Component
 * Displays test execution history with filtering
 */

import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Button, Spinner, Alert, Form, Row, Col, Modal } from 'react-bootstrap';
import { testingApi, TestRun } from '../../services/testingApi';
import { theme } from '../../styles/theme';

const TestRunList: React.FC = () => {
  const [runs, setRuns] = useState<TestRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [selectedRun, setSelectedRun] = useState<TestRun | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [selectedTestResult, setSelectedTestResult] = useState<any>(null);
  const [showTestDetailModal, setShowTestDetailModal] = useState(false);

  useEffect(() => {
    loadTestRuns();
    // Poll for updates every 5 seconds
    const interval = setInterval(loadTestRuns, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadTestRuns = async () => {
    try {
      const data = await testingApi.getTestRuns();
      setRuns(data);
      setError(null);
    } catch (err) {
      setError('Failed to load test runs. Make sure backend is running.');
      console.error('Error loading test runs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (run: TestRun) => {
    setSelectedRun(run);
    setShowDetailsModal(true);
    setDetailsLoading(true);
    
    try {
      const details = await testingApi.getTestRun(run.id);
      setTestResults(details.results || []);
    } catch (err) {
      console.error('Failed to load test details:', err);
      setTestResults([]);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowDetailsModal(false);
    setSelectedRun(null);
    setTestResults([]);
  };

  const calculatePassRate = (run: TestRun) => {
    // Use backend's passedTests/totalTests if available
    if (run.totalTests && run.totalTests > 0) {
      return Math.round(((run.passedTests || 0) / run.totalTests) * 100);
    }
    // Fallback to results array
    if (!run.results || run.results.length === 0) return 0;
    const passed = run.results.filter(r => r.passed).length;
    return Math.round((passed / run.results.length) * 100);
  };

  const filteredRuns = runs.filter(run => {
    if (filter === 'all') return true;
    return run.status === filter;
  });

  if (loading) {
    return (
      <Card className="shadow-sm">
        <Card.Body className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Loading test runs...</p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <>
      <Card className="shadow-sm">
        <Card.Header style={{ backgroundColor: theme.colors.backgroundSecondary, fontWeight: theme.typography.fontWeight.semibold }}>
        <Row className="align-items-center">
          <Col>📝 Test Execution History</Col>
          <Col xs="auto">
            <Form.Select size="sm" value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All Runs</option>
              <option value="completed">Completed</option>
              <option value="running">Running</option>
              <option value="failed">Failed</option>
            </Form.Select>
          </Col>
        </Row>
      </Card.Header>
      <Card.Body>
        {error && (
          <Alert variant="warning" dismissible onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
        {filteredRuns.length === 0 ? (
          <Alert variant="info">
            No test runs found. Run some tests to see results here.
          </Alert>
        ) : (
          <Table hover responsive>
            <thead>
              <tr>
                <th>Run ID</th>
                <th>Suite</th>
                <th>Status</th>
                <th>Tests</th>
                <th>Pass Rate</th>
                <th>Duration</th>
                <th>Started</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRuns.map((run) => {
                const passRate = calculatePassRate(run);
                const duration = run.endTime 
                  ? ((new Date(run.endTime).getTime() - new Date(run.startTime).getTime()) / 1000).toFixed(1)
                  : 'Running...';
                
                return (
                  <tr key={run.id}>
                    <td style={{ fontWeight: theme.typography.fontWeight.medium, fontFamily: 'monospace' }}>
                      {run.id?.substring(0, 8) || 'N/A'}
                    </td>
                    <td>{run.categoryName || run.suiteId?.substring(0, 8) || 'N/A'}</td>
                    <td>
                      <Badge bg={
                        run.status === 'completed' ? 'success' : 
                        run.status === 'running' ? 'primary' : 
                        'danger'
                      }>
                        {run.status}
                      </Badge>
                    </td>
                    <td>
                      {run.totalTests || run.results?.length || 0} tests
                      {(run.passedTests !== undefined) 
                        ? ` (${run.passedTests} passed)` 
                        : run.results 
                          ? ` (${run.results.filter(r => r.passed).length} passed)` 
                          : ''}
                    </td>
                    <td>
                      {run.status === 'completed' && (
                        <Badge bg={passRate >= 90 ? 'success' : passRate >= 70 ? 'warning' : 'danger'}>
                          {passRate}%
                        </Badge>
                      )}
                    </td>
                    <td>{duration}s</td>
                    <td style={{ color: theme.colors.textSecondary }}>
                      {new Date(run.startTime).toLocaleString()}
                    </td>
                    <td>
                      <Button 
                        variant="link" 
                        size="sm"
                        onClick={() => handleViewDetails(run)}
                      >
                        View Details
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card.Body>
      </Card>

      {/* Test Run Details Modal */}
      <Modal show={showDetailsModal} onHide={handleCloseModal} size="xl">
        <Modal.Header closeButton style={{ backgroundColor: theme.colors.primary, color: 'white' }}>
          <Modal.Title>Test Run Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRun && (
            <>
              {/* Summary */}
              <Card className="mb-4" style={{ border: `1px solid ${theme.colors.border}` }}>
                <Card.Body>
                  <h5 className="mb-3" style={{ color: theme.colors.primary }}>Run Summary</h5>
                  <Row className="g-3">
                    <Col md={6}>
                      <div style={{ padding: '12px', backgroundColor: theme.colors.backgroundSecondary, borderRadius: '6px' }}>
                        <div style={{ fontSize: '0.85em', color: theme.colors.textSecondary, marginBottom: '4px' }}>Run ID</div>
                        <div style={{ fontFamily: 'monospace', fontSize: '0.9em', fontWeight: 500 }}>
                          {selectedRun.id.substring(0, 20)}...
                        </div>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div style={{ padding: '12px', backgroundColor: theme.colors.backgroundSecondary, borderRadius: '6px' }}>
                        <div style={{ fontSize: '0.85em', color: theme.colors.textSecondary, marginBottom: '4px' }}>Category</div>
                        <div style={{ fontWeight: 500 }}>{selectedRun.categoryName || 'N/A'}</div>
                      </div>
                    </Col>
                    <Col md={3}>
                      <div style={{ padding: '12px', backgroundColor: theme.colors.backgroundSecondary, borderRadius: '6px' }}>
                        <div style={{ fontSize: '0.85em', color: theme.colors.textSecondary, marginBottom: '4px' }}>Status</div>
                        <Badge bg={
                          selectedRun.status === 'completed' ? 'success' :
                          selectedRun.status === 'running' ? 'primary' :
                          'danger'
                        }>
                          {selectedRun.status}
                        </Badge>
                      </div>
                    </Col>
                    <Col md={3}>
                      <div style={{ padding: '12px', backgroundColor: theme.colors.backgroundSecondary, borderRadius: '6px' }}>
                        <div style={{ fontSize: '0.85em', color: theme.colors.textSecondary, marginBottom: '4px' }}>Pass Rate</div>
                        <Badge bg={calculatePassRate(selectedRun) >= 80 ? 'success' : 
                                   calculatePassRate(selectedRun) >= 60 ? 'warning' : 'danger'}
                               style={{ fontSize: '1em' }}>
                          {calculatePassRate(selectedRun)}%
                        </Badge>
                      </div>
                    </Col>
                    <Col md={2}>
                      <div style={{ padding: '12px', backgroundColor: theme.colors.backgroundSecondary, borderRadius: '6px' }}>
                        <div style={{ fontSize: '0.85em', color: theme.colors.textSecondary, marginBottom: '4px' }}>Total</div>
                        <div style={{ fontWeight: 600, fontSize: '1.1em' }}>{selectedRun.totalTests || 0}</div>
                      </div>
                    </Col>
                    <Col md={2}>
                      <div style={{ padding: '12px', backgroundColor: theme.colors.backgroundSecondary, borderRadius: '6px' }}>
                        <div style={{ fontSize: '0.85em', color: theme.colors.textSecondary, marginBottom: '4px' }}>Passed</div>
                        <div style={{ fontWeight: 600, fontSize: '1.1em', color: theme.colors.success }}>
                          {selectedRun.passedTests || 0}
                        </div>
                      </div>
                    </Col>
                    <Col md={2}>
                      <div style={{ padding: '12px', backgroundColor: theme.colors.backgroundSecondary, borderRadius: '6px' }}>
                        <div style={{ fontSize: '0.85em', color: theme.colors.textSecondary, marginBottom: '4px' }}>Failed</div>
                        <div style={{ fontWeight: 600, fontSize: '1.1em', color: theme.colors.danger }}>
                          {selectedRun.failedTests || 0}
                        </div>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* Test Results */}
              <div style={{ padding: '0 20px' }}>
                <h5 style={{ marginBottom: '16px' }}>Test Results ({testResults.length})</h5>
                {detailsLoading ? (
                  <div className="text-center py-4">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-2">Loading test results...</p>
                  </div>
                ) : testResults.length === 0 ? (
                  <Alert variant="info">
                    No detailed test results available yet. Tests may still be running.
                  </Alert>
                ) : (
                    <Table striped bordered hover responsive size="sm">
                      <thead>
                        <tr>
                          <th style={{ width: '25%' }}>Test Case</th>
                          <th style={{ width: '15%' }}>Agent</th>
                          <th style={{ width: '12%', textAlign: 'center' }}>Status</th>
                          <th style={{ width: '10%' }}>Duration</th>
                          <th style={{ width: '18%' }}>Accuracy Score</th>
                          <th style={{ width: '10%', textAlign: 'center' }}>Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {testResults.map((result, index) => {
                          const accuracy = result.evaluation?.accuracy || 0;
                          const details = result.evaluation?.details || {};
                          
                          return (
                            <tr key={result.id || index}>
                              <td>{result.testCaseName || result.testCaseId}</td>
                              <td style={{ fontFamily: 'monospace', fontSize: '0.85em' }}>
                                {result.agentId?.substring(0, 10)}...
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <Badge bg={result.status === 'passed' ? 'success' : 'danger'}>
                                  {result.status}
                                </Badge>
                              </td>
                              <td>{result.duration}ms</td>
                              <td>
                                <div>
                                  <strong>{(accuracy * 100).toFixed(1)}%</strong>
                                  <div style={{ fontSize: '0.75em', color: '#666' }}>
                                    {result.evaluation?.coherence && (
                                      <span>C: {(result.evaluation.coherence * 100).toFixed(0)}% </span>
                                    )}
                                    {result.evaluation?.relevance && (
                                      <span>R: {(result.evaluation.relevance * 100).toFixed(0)}% </span>
                                    )}
                                    {result.evaluation?.completeness && (
                                      <span>Cm: {(result.evaluation.completeness * 100).toFixed(0)}%</span>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <Button 
                                  variant="link" 
                                  size="sm"
                                  onClick={() => {
                                    setSelectedTestResult(result);
                                    setShowTestDetailModal(true);
                                  }}
                                >
                                  📊 View
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                )}
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Test Detail Modal - Simple and Clear */}
      <Modal show={showTestDetailModal} onHide={() => setShowTestDetailModal(false)} size="lg">
        <Modal.Header closeButton style={{ backgroundColor: selectedTestResult?.status === 'passed' ? '#d4edda' : '#f8d7da' }}>
          <Modal.Title>
            {selectedTestResult?.testCaseName}
            {' '}
            <Badge bg={selectedTestResult?.status === 'passed' ? 'success' : 'danger'} style={{ fontSize: '0.9em' }}>
              {selectedTestResult?.status === 'passed' ? '✓ PASSED' : '✗ FAILED'}
            </Badge>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedTestResult && (
            <>
              {/* Main Failure Reason - Big and Clear */}
              {selectedTestResult.status === 'failed' && (
                <Alert variant="danger" style={{ fontSize: '1.1em', padding: '20px' }}>
                  <Alert.Heading style={{ fontSize: '1.3em' }}>❌ Why This Test Failed</Alert.Heading>
                  <p style={{ fontSize: '1.05em', marginBottom: '10px', lineHeight: '1.6' }}>
                    {selectedTestResult.failureReason || 'Test did not meet the required quality threshold.'}
                  </p>
                  <hr />
                  <div style={{ fontSize: '0.95em' }}>
                    <strong>What this means:</strong>
                    <ul style={{ marginTop: '10px', marginBottom: 0 }}>
                      {selectedTestResult.evaluation?.relevance < 0.5 && (
                        <li>The agent's response was not relevant to the test question</li>
                      )}
                      {selectedTestResult.evaluation?.coherence < 0.7 && (
                        <li>The response lacked clarity or logical structure</li>
                      )}
                      {selectedTestResult.evaluation?.completeness < 0.7 && (
                        <li>The response was incomplete or missing key information</li>
                      )}
                      {selectedTestResult.evaluation?.details?.validationScore?.failed?.length > 0 && (
                        <li>Failed validation rules: {selectedTestResult.evaluation.details.validationScore.failed.map((f: any) => f.rule).join(', ')}</li>
                      )}
                    </ul>
                  </div>
                </Alert>
              )}

              {/* Success Message */}
              {selectedTestResult.status === 'passed' && (
                <Alert variant="success" style={{ fontSize: '1.1em', padding: '20px' }}>
                  <Alert.Heading style={{ fontSize: '1.3em' }}>✓ Test Passed Successfully</Alert.Heading>
                  <p style={{ marginBottom: 0 }}>
                    The agent's response met all quality requirements with an accuracy of{' '}
                    <strong>{((selectedTestResult.evaluation?.accuracy || 0) * 100).toFixed(1)}%</strong>
                  </p>
                </Alert>
              )}

              {/* Simple Metrics */}
              <Card>
                <Card.Body>
                  <Row>
                    <Col md={3} className="text-center">
                      <div style={{ fontSize: '0.85em', color: '#6c757d', marginBottom: '5px' }}>Overall Score</div>
                      <div style={{ 
                        fontSize: '2em', 
                        fontWeight: 'bold',
                        color: (selectedTestResult.evaluation?.accuracy || 0) >= 0.7 ? '#28a745' : '#dc3545'
                      }}>
                        {((selectedTestResult.evaluation?.accuracy || 0) * 100).toFixed(0)}%
                      </div>
                    </Col>
                    <Col md={3} className="text-center">
                      <div style={{ fontSize: '0.85em', color: '#6c757d', marginBottom: '5px' }}>Relevance</div>
                      <div style={{ fontSize: '1.5em', fontWeight: 'bold' }}>
                        {((selectedTestResult.evaluation?.relevance || 0) * 100).toFixed(0)}%
                      </div>
                    </Col>
                    <Col md={3} className="text-center">
                      <div style={{ fontSize: '0.85em', color: '#6c757d', marginBottom: '5px' }}>Coherence</div>
                      <div style={{ fontSize: '1.5em', fontWeight: 'bold' }}>
                        {((selectedTestResult.evaluation?.coherence || 0) * 100).toFixed(0)}%
                      </div>
                    </Col>
                    <Col md={3} className="text-center">
                      <div style={{ fontSize: '0.85em', color: '#6c757d', marginBottom: '5px' }}>Completeness</div>
                      <div style={{ fontSize: '1.5em', fontWeight: 'bold' }}>
                        {((selectedTestResult.evaluation?.completeness || 0) * 100).toFixed(0)}%
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* Additional Info - Collapsible */}
              {selectedTestResult.evaluation?.details && (
                <div style={{ marginTop: '20px' }}>
                  <details>
                    <summary style={{ cursor: 'pointer', fontWeight: 600, padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                      📊 View Technical Details
                    </summary>
                    <div style={{ padding: '15px', border: '1px solid #dee2e6', borderTop: 'none', borderRadius: '0 0 4px 4px' }}>
                      {selectedTestResult.evaluation.details.comparisonScore && (
                        <div className="mb-2">
                          <small className="text-muted">String Similarity:</small> {(selectedTestResult.evaluation.details.comparisonScore.similarity * 100).toFixed(1)}%
                          {' | '}
                          <small className="text-muted">Keywords:</small> {selectedTestResult.evaluation.details.comparisonScore.matchedKeywords}/{selectedTestResult.evaluation.details.comparisonScore.totalKeywords}
                        </div>
                      )}
                      <div className="mb-2">
                        <small className="text-muted">Duration:</small> {selectedTestResult.duration}ms
                      </div>
                      <div className="mb-2">
                        <small className="text-muted">Agent:</small> {selectedTestResult.agentName || selectedTestResult.agentId}
                      </div>
                    </div>
                  </details>
                </div>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowTestDetailModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default TestRunList;
