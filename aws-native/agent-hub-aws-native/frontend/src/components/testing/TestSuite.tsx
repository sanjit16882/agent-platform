import React, { useState, useCallback, useEffect } from 'react';
import { Card, Row, Col, Button, Form, Alert, Badge, ProgressBar, ListGroup } from 'react-bootstrap';
import { TestRunner } from './TestRunner';
import { TestResults } from './TestResults';
import { PerformanceMonitor } from './PerformanceMonitor';
import { SecurityScanner } from './SecurityScanner';

interface TestCase {
  id: string;
  name: string;
  type: 'unit' | 'integration' | 'performance' | 'security';
  description: string;
  enabled: boolean;
  parameters: Record<string, any>;
}

interface TestSuiteConfig {
  agentId: string;
  testCases: TestCase[];
  environment: 'local' | 'staging' | 'production';
  timeout: number;
  retries: number;
}

interface TestExecution {
  id: string;
  suiteId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  results: TestResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
  };
}

interface TestResult {
  testCaseId: string;
  status: 'passed' | 'failed' | 'skipped' | 'error';
  duration: number;
  message?: string;
  details?: any;
  metrics?: Record<string, number>;
}

export const TestSuite: React.FC<{ agentId: string }> = ({ agentId }) => {
  const [testConfig, setTestConfig] = useState<TestSuiteConfig>({
    agentId,
    testCases: [],
    environment: 'local',
    timeout: 30000,
    retries: 1
  });

  const [currentExecution, setCurrentExecution] = useState<TestExecution | null>(null);
  const [testHistory, setTestHistory] = useState<TestExecution[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTests, setSelectedTests] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Load default test cases for the agent
    loadDefaultTestCases();
  }, [agentId]);

  const loadDefaultTestCases = useCallback(async () => {
    try {
      // Simulate loading test cases from API
      const defaultTests: TestCase[] = [
        {
          id: 'unit_basic_functionality',
          name: 'Basic Functionality',
          type: 'unit',
          description: 'Test core agent functions',
          enabled: true,
          parameters: { timeout: 5000 }
        },
        {
          id: 'unit_input_validation',
          name: 'Input Validation',
          type: 'unit',
          description: 'Test input parameter validation',
          enabled: true,
          parameters: { testInvalidInputs: true }
        },
        {
          id: 'integration_api_calls',
          name: 'API Integration',
          type: 'integration',
          description: 'Test external API interactions',
          enabled: true,
          parameters: { mockApis: true }
        },
        {
          id: 'performance_load_test',
          name: 'Load Testing',
          type: 'performance',
          description: 'Test agent under load',
          enabled: false,
          parameters: { concurrentRequests: 10, duration: 60 }
        },
        {
          id: 'security_vulnerability_scan',
          name: 'Security Scan',
          type: 'security',
          description: 'Scan for security vulnerabilities',
          enabled: true,
          parameters: { scanDepth: 'medium' }
        }
      ];

      setTestConfig(prev => ({ ...prev, testCases: defaultTests }));
      setSelectedTests(new Set(defaultTests.filter(t => t.enabled).map(t => t.id)));
    } catch (error) {
      console.error('Failed to load test cases:', error);
    }
  }, [agentId]);

  const toggleTestCase = useCallback((testId: string) => {
    setSelectedTests(prev => {
      const newSet = new Set(prev);
      if (newSet.has(testId)) {
        newSet.delete(testId);
      } else {
        newSet.add(testId);
      }
      return newSet;
    });
  }, []);

  const runTests = useCallback(async () => {
    if (selectedTests.size === 0) {
      alert('Please select at least one test to run');
      return;
    }

    setIsRunning(true);
    const executionId = `exec_${Date.now()}`;
    
    const execution: TestExecution = {
      id: executionId,
      suiteId: `suite_${agentId}`,
      status: 'running',
      startTime: new Date(),
      results: [],
      summary: {
        total: selectedTests.size,
        passed: 0,
        failed: 0,
        skipped: 0
      }
    };

    setCurrentExecution(execution);

    try {
      const selectedTestCases = testConfig.testCases.filter(tc => selectedTests.has(tc.id));
      const results: TestResult[] = [];

      for (const testCase of selectedTestCases) {
        // Simulate test execution
        const startTime = Date.now();
        
        // Update execution status
        setCurrentExecution(prev => prev ? {
          ...prev,
          results: [...results, {
            testCaseId: testCase.id,
            status: 'passed', // Will be updated
            duration: 0,
            message: 'Running...'
          }]
        } : null);

        await new Promise(resolve => setTimeout(resolve, Math.random() * 3000 + 1000));

        const duration = Date.now() - startTime;
        const success = Math.random() > 0.2; // 80% success rate for demo

        const result: TestResult = {
          testCaseId: testCase.id,
          status: success ? 'passed' : 'failed',
          duration,
          message: success ? 'Test passed successfully' : 'Test failed - assertion error',
          details: success ? { assertions: 5, allPassed: true } : { 
            assertions: 5, 
            failed: ['Expected output format mismatch'],
            error: 'AssertionError: Expected string, got number'
          },
          metrics: testCase.type === 'performance' ? {
            responseTime: duration,
            memoryUsage: Math.random() * 100,
            cpuUsage: Math.random() * 50
          } : undefined
        };

        results.push(result);
      }

      // Calculate final summary
      const summary = {
        total: results.length,
        passed: results.filter(r => r.status === 'passed').length,
        failed: results.filter(r => r.status === 'failed').length,
        skipped: results.filter(r => r.status === 'skipped').length
      };

      const finalExecution: TestExecution = {
        ...execution,
        status: summary.failed > 0 ? 'failed' : 'completed',
        endTime: new Date(),
        results,
        summary
      };

      setCurrentExecution(finalExecution);
      setTestHistory(prev => [finalExecution, ...prev.slice(0, 9)]); // Keep last 10 executions

    } catch (error) {
      setCurrentExecution(prev => prev ? {
        ...prev,
        status: 'failed',
        endTime: new Date()
      } : null);
    } finally {
      setIsRunning(false);
    }
  }, [selectedTests, testConfig.testCases, agentId]);

  const getTestTypeIcon = (type: string) => {
    switch (type) {
      case 'unit': return 'fas fa-cog';
      case 'integration': return 'fas fa-link';
      case 'performance': return 'fas fa-tachometer-alt';
      case 'security': return 'fas fa-shield-alt';
      default: return 'fas fa-vial';
    }
  };

  const getTestTypeColor = (type: string) => {
    switch (type) {
      case 'unit': return 'primary';
      case 'integration': return 'info';
      case 'performance': return 'warning';
      case 'security': return 'danger';
      default: return 'secondary';
    }
  };

  return (
    <div className="test-suite">
      <Card className="mb-4">
        <Card.Header>
          <Row className="align-items-center">
            <Col>
              <h4 className="mb-0">Agent Testing Suite</h4>
              <small className="text-muted">
                Comprehensive testing for agent: {agentId}
              </small>
            </Col>
            <Col xs="auto">
              <div className="d-flex gap-2">
                <Form.Select
                  size="sm"
                  value={testConfig.environment}
                  onChange={(e) => setTestConfig(prev => ({ 
                    ...prev, 
                    environment: e.target.value as 'local' | 'staging' | 'production' 
                  }))}
                  disabled={isRunning}
                >
                  <option value="local">Local</option>
                  <option value="staging">Staging</option>
                  <option value="production">Production</option>
                </Form.Select>
                <Button
                  variant="primary"
                  onClick={runTests}
                  disabled={isRunning || selectedTests.size === 0}
                >
                  {isRunning ? (
                    <>
                      <i className="fas fa-spinner fa-spin me-2"></i>
                      Running...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-play me-2"></i>
                      Run Tests ({selectedTests.size})
                    </>
                  )}
                </Button>
              </div>
            </Col>
          </Row>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <h6>Available Tests</h6>
              <ListGroup className="mb-3">
                {testConfig.testCases.map(testCase => (
                  <ListGroup.Item
                    key={testCase.id}
                    className="d-flex justify-content-between align-items-center"
                  >
                    <div className="d-flex align-items-center">
                      <Form.Check
                        type="checkbox"
                        checked={selectedTests.has(testCase.id)}
                        onChange={() => toggleTestCase(testCase.id)}
                        disabled={isRunning}
                        className="me-3"
                      />
                      <div>
                        <div className="d-flex align-items-center">
                          <i className={`${getTestTypeIcon(testCase.type)} me-2`}></i>
                          <strong>{testCase.name}</strong>
                          <Badge 
                            bg={getTestTypeColor(testCase.type)} 
                            className="ms-2"
                          >
                            {testCase.type}
                          </Badge>
                        </div>
                        <small className="text-muted">{testCase.description}</small>
                      </div>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Col>
            <Col md={6}>
              <h6>Test Configuration</h6>
              <Form>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Timeout (ms)</Form.Label>
                      <Form.Control
                        type="number"
                        value={testConfig.timeout}
                        onChange={(e) => setTestConfig(prev => ({ 
                          ...prev, 
                          timeout: parseInt(e.target.value) 
                        }))}
                        disabled={isRunning}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Retries</Form.Label>
                      <Form.Control
                        type="number"
                        min="0"
                        max="5"
                        value={testConfig.retries}
                        onChange={(e) => setTestConfig(prev => ({ 
                          ...prev, 
                          retries: parseInt(e.target.value) 
                        }))}
                        disabled={isRunning}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Form>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {currentExecution && (
        <TestResults execution={currentExecution} />
      )}

      {testHistory.length > 0 && (
        <Card className="mt-4">
          <Card.Header>
            <h5 className="mb-0">Test History</h5>
          </Card.Header>
          <Card.Body>
            <ListGroup>
              {testHistory.map(execution => (
                <ListGroup.Item key={execution.id} className="d-flex justify-content-between align-items-center">
                  <div>
                    <strong>
                      {execution.startTime.toLocaleString()}
                    </strong>
                    <div className="small text-muted">
                      Duration: {execution.endTime ? 
                        Math.round((execution.endTime.getTime() - execution.startTime.getTime()) / 1000) : 
                        '...'
                      }s
                    </div>
                  </div>
                  <div className="text-end">
                    <Badge 
                      bg={execution.status === 'completed' ? 'success' : 
                          execution.status === 'failed' ? 'danger' : 'secondary'}
                    >
                      {execution.status}
                    </Badge>
                    <div className="small text-muted mt-1">
                      {execution.summary.passed}/{execution.summary.total} passed
                    </div>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default TestSuite;