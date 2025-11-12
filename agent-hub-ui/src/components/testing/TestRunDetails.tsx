/**
 * Test Run Details Component
 * Shows detailed results for a specific test run
 */

import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Badge, Button, Spinner, Alert } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { testingApi, TestRun } from '../../services/testingApi';
import { theme } from '../../styles/theme';

const TestRunDetails: React.FC = () => {
  const { runId } = useParams<{ runId: string }>();
  const navigate = useNavigate();
  const [testRun, setTestRun] = useState<TestRun | null>(null);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (runId) {
      loadTestRunDetails();
    }
  }, [runId]);

  const loadTestRunDetails = async () => {
    try {
      setLoading(true);
      const data = await testingApi.getTestRun(runId!);
      setTestRun(data);
      setResults(data.results || []);
      setError(null);
    } catch (err) {
      setError('Failed to load test run details');
      console.error('Error loading test run details:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading test run details...</p>
      </Container>
    );
  }

  if (error || !testRun) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">
          <Alert.Heading>Error</Alert.Heading>
          <p>{error || 'Test run not found'}</p>
          <Button variant="outline-danger" onClick={() => navigate('/agent-testing/results')}>
            Back to Test Results
          </Button>
        </Alert>
      </Container>
    );
  }

  const passRate = testRun.totalTests && testRun.totalTests > 0
    ? Math.round(((testRun.passedTests || 0) / testRun.totalTests) * 100)
    : 0;

  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Test Run Details</h2>
        <Button variant="outline-secondary" onClick={() => navigate('/agent-testing/results')}>
          ← Back to Results
        </Button>
      </div>

      {/* Test Run Summary */}
      <Card className="mb-4">
        <Card.Header style={{ backgroundColor: theme.colors.primary, color: 'white' }}>
          <h5 className="mb-0">Run Summary</h5>
        </Card.Header>
        <Card.Body>
          <div className="row">
            <div className="col-md-3">
              <strong>Run ID:</strong>
              <p style={{ fontFamily: 'monospace' }}>{testRun.id}</p>
            </div>
            <div className="col-md-3">
              <strong>Category:</strong>
              <p>{testRun.categoryName || 'N/A'}</p>
            </div>
            <div className="col-md-3">
              <strong>Status:</strong>
              <p>
                <Badge bg={
                  testRun.status === 'completed' ? 'success' :
                  testRun.status === 'running' ? 'primary' :
                  'danger'
                }>
                  {testRun.status}
                </Badge>
              </p>
            </div>
            <div className="col-md-3">
              <strong>Pass Rate:</strong>
              <p>
                <Badge bg={passRate >= 80 ? 'success' : passRate >= 60 ? 'warning' : 'danger'}>
                  {passRate}%
                </Badge>
              </p>
            </div>
          </div>
          <div className="row mt-3">
            <div className="col-md-3">
              <strong>Total Tests:</strong>
              <p>{testRun.totalTests || 0}</p>
            </div>
            <div className="col-md-3">
              <strong>Passed:</strong>
              <p style={{ color: theme.colors.success }}>{testRun.passedTests || 0}</p>
            </div>
            <div className="col-md-3">
              <strong>Failed:</strong>
              <p style={{ color: theme.colors.danger }}>{testRun.failedTests || 0}</p>
            </div>
            <div className="col-md-3">
              <strong>Started:</strong>
              <p>{new Date(testRun.startTime).toLocaleString()}</p>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Test Results Table */}
      <Card>
        <Card.Header style={{ backgroundColor: theme.colors.primary, color: 'white' }}>
          <h5 className="mb-0">Test Results ({results.length})</h5>
        </Card.Header>
        <Card.Body>
          {results.length === 0 ? (
            <Alert variant="info">
              No detailed test results available yet. Tests may still be running.
            </Alert>
          ) : (
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>Test Case</th>
                  <th>Agent</th>
                  <th>Status</th>
                  <th>Duration</th>
                  <th>Accuracy</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result, index) => (
                  <tr key={result.id || index}>
                    <td>{result.testCaseName || result.testCaseId}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.9em' }}>
                      {result.agentId?.substring(0, 12)}...
                    </td>
                    <td>
                      <Badge bg={result.status === 'passed' ? 'success' : 'danger'}>
                        {result.status}
                      </Badge>
                    </td>
                    <td>{result.duration}ms</td>
                    <td>
                      {result.evaluation?.accuracy 
                        ? `${(result.evaluation.accuracy * 100).toFixed(1)}%`
                        : 'N/A'}
                    </td>
                    <td>{new Date(result.timestamp).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default TestRunDetails;
