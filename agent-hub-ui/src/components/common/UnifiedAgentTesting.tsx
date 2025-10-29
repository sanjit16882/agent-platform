import React, { useState, useEffect } from 'react';
import { Card, Button, Alert, Badge, ProgressBar, Row, Col, Accordion } from 'react-bootstrap';
import { 
  agentTestingService, 
  TestSuite, 
  UnifiedTestResult, 
  AgentTestingConfig, 
  TestingProgress 
} from '../../services/agentTestingService';

interface UnifiedAgentTestingProps {
  config: AgentTestingConfig;
  onTestingComplete?: (summary: any) => void;
  onTestingStart?: () => void;
  onTestingFailed?: (error: string) => void;
  disabled?: boolean;
  className?: string;
}

const UnifiedAgentTesting: React.FC<UnifiedAgentTestingProps> = ({
  config,
  onTestingComplete,
  onTestingStart,
  onTestingFailed,
  disabled = false,
  className = ''
}) => {
  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [testingStatus, setTestingStatus] = useState<'idle' | 'running' | 'completed' | 'failed'>('idle');
  const [progress, setProgress] = useState<TestingProgress | null>(null);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    // Generate test suites when config changes
    if (config.agentData) {
      const suites = agentTestingService.generateTestSuites(config);
      setTestSuites(suites);
    }
  }, [config]);

  const runTests = async () => {
    if (testSuites.length === 0) return;

    setTestingStatus('running');
    setProgress(null);
    setSummary(null);
    onTestingStart?.();

    try {
      const results = await agentTestingService.executeTestSuites(
        testSuites,
        // Progress callback
        (progressData) => {
          setProgress(progressData);
        },
        // Suite complete callback
        (completedSuite) => {
          setTestSuites(prev => prev.map(suite => 
            suite.id === completedSuite.id ? completedSuite : suite
          ));
        },
        // Test complete callback
        (completedTest) => {
          setTestSuites(prev => prev.map(suite => ({
            ...suite,
            tests: suite.tests.map(test => 
              test.id === completedTest.id ? completedTest : test
            )
          })));
        }
      );

      setTestSuites(results);
      const testSummary = agentTestingService.getTestSummary(results);
      setSummary(testSummary);
      setTestingStatus('completed');
      onTestingComplete?.(testSummary);

    } catch (error) {
      console.error('Testing failed:', error);
      setTestingStatus('failed');
      onTestingFailed?.(error instanceof Error ? error.message : 'Testing failed');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return '✓';
      case 'failed': return '✗';
      case 'running': return '⟳';
      case 'skipped': return '○';
      default: return '○';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'success';
      case 'failed': return 'danger';
      case 'running': return 'primary';
      case 'skipped': return 'secondary';
      default: return 'secondary';
    }
  };

  return (
    <div className={className}>
      <Card>
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <span>🧪 Agent Testing Suite</span>
            <div className="d-flex gap-2 align-items-center">
              {progress && testingStatus === 'running' && (
                <div className="d-flex align-items-center me-3">
                  <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                  <span className="small">
                    {progress.currentSuite} • {progress.overallProgress}%
                    {progress.estimatedTimeRemaining > 0 && (
                      <span className="text-muted"> • ~{Math.round(progress.estimatedTimeRemaining / 1000)}s remaining</span>
                    )}
                  </span>
                </div>
              )}
              <Button 
                variant="primary"
                onClick={runTests}
                disabled={disabled || testingStatus === 'running' || testSuites.length === 0}
              >
                {testingStatus === 'running' ? 'Testing...' : 
                 testSuites.length === 0 ? 'No Tests Available' :
                 '🧪 Run All Tests'}
              </Button>
            </div>
          </div>
        </Card.Header>
        <Card.Body>
          {testingStatus === 'idle' && testSuites.length > 0 && (
            <Alert variant="info">
              <strong>Ready to Test:</strong> {testSuites.length} test suites with {testSuites.reduce((acc, suite) => acc + suite.tests.length, 0)} total tests.
              Click "Run All Tests" to validate your agent.
            </Alert>
          )}

          {testingStatus === 'idle' && testSuites.length === 0 && (
            <Alert variant="warning">
              <strong>No Tests Available:</strong> Unable to generate tests for this agent configuration.
            </Alert>
          )}

          {/* Overall Progress */}
          {progress && testingStatus === 'running' && (
            <div className="mb-4">
              <div className="d-flex justify-content-between mb-2">
                <span>Overall Progress</span>
                <span>{progress.overallProgress}%</span>
              </div>
              <ProgressBar 
                now={progress.overallProgress} 
                variant="primary"
                className="mb-2"
              />
              <div className="small text-muted">
                Currently running: {progress.currentTest}
              </div>
            </div>
          )}

          {/* Test Suites */}
          {testSuites.length > 0 && (
            <Accordion>
              {testSuites.map((suite, index) => (
                <Accordion.Item key={suite.id} eventKey={index.toString()}>
                  <Accordion.Header>
                    <div className="d-flex justify-content-between align-items-center w-100 me-3">
                      <div className="d-flex align-items-center">
                        <Badge bg={getStatusColor(suite.status)} className="me-2">
                          {getStatusIcon(suite.status)}
                        </Badge>
                        <span>{suite.name}</span>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        {suite.status !== 'pending' && (
                          <>
                            <Badge bg="light" text="dark">
                              {suite.tests.filter(t => t.status === 'passed').length}/{suite.tests.length}
                            </Badge>
                            {suite.passRate > 0 && (
                              <Badge bg={suite.passRate >= 85 ? 'success' : suite.passRate >= 70 ? 'warning' : 'danger'}>
                                {suite.passRate}%
                              </Badge>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </Accordion.Header>
                  <Accordion.Body>
                    <p className="text-muted mb-3">{suite.description}</p>
                    
                    {suite.tests.map((test) => (
                      <div key={test.id} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                        <div className="d-flex align-items-center">
                          <Badge bg={getStatusColor(test.status)} className="me-2">
                            {getStatusIcon(test.status)}
                          </Badge>
                          <div>
                            <div className="fw-medium">{test.name}</div>
                            <small className="text-muted">{test.category}</small>
                            {test.message && (
                              <div className="small text-danger mt-1">{test.message}</div>
                            )}
                          </div>
                        </div>
                        <div className="text-end">
                          {test.confidence && (
                            <Badge bg={test.confidence >= 80 ? 'success' : test.confidence >= 60 ? 'warning' : 'danger'} className="me-2">
                              {test.confidence}%
                            </Badge>
                          )}
                          {test.duration > 0 && (
                            <small className="text-muted">{test.duration}ms</small>
                          )}
                        </div>
                      </div>
                    ))}
                  </Accordion.Body>
                </Accordion.Item>
              ))}
            </Accordion>
          )}

          {/* Test Summary */}
          {summary && testingStatus === 'completed' && (
            <Alert variant={summary.readyForDeployment ? 'success' : 'warning'} className="mt-4">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <strong>
                    {summary.readyForDeployment ? '🎉 All Tests Passed!' : '⚠️ Some Tests Failed'}
                  </strong>
                  <div className="mt-2">
                    <Row>
                      <Col md={3}>
                        <div className="text-center">
                          <div className="h5 mb-0">{summary.passedTests}/{summary.totalTests}</div>
                          <small className="text-muted">Tests Passed</small>
                        </div>
                      </Col>
                      <Col md={3}>
                        <div className="text-center">
                          <div className="h5 mb-0">{summary.overallPassRate}%</div>
                          <small className="text-muted">Pass Rate</small>
                        </div>
                      </Col>
                      <Col md={3}>
                        <div className="text-center">
                          <div className="h5 mb-0">{Math.round(summary.totalDuration / 1000)}s</div>
                          <small className="text-muted">Total Time</small>
                        </div>
                      </Col>
                      <Col md={3}>
                        <div className="text-center">
                          <div className="h5 mb-0">{testSuites.length}</div>
                          <small className="text-muted">Test Suites</small>
                        </div>
                      </Col>
                    </Row>
                  </div>
                </div>
                <div>
                  {summary.readyForDeployment ? (
                    <Badge bg="success" className="fs-6">
                      ✅ Ready for Deployment
                    </Badge>
                  ) : (
                    <Badge bg="warning" className="fs-6">
                      ⚠️ Needs Attention
                    </Badge>
                  )}
                </div>
              </div>
            </Alert>
          )}

          {testingStatus === 'failed' && (
            <Alert variant="danger">
              <strong>Testing Failed!</strong>
              <p>There was an error running the test suites. Please check your agent configuration and try again.</p>
            </Alert>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default UnifiedAgentTesting;