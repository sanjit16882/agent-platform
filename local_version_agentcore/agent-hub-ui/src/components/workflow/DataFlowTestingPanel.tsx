import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Badge, Alert, ProgressBar, Table, Modal, Form, Tabs, Tab, Spinner } from 'react-bootstrap';
// React Icons compatibility fix - using createElement
const { createElement } = React;
const icons = require('react-icons/fa');

const FaPlay = (props: any) => createElement(icons.FaPlay, props);
const FaStop = (props: any) => createElement(icons.FaStop, props);
const FaPause = (props: any) => createElement(icons.FaPause, props);
const FaEye = (props: any) => createElement(icons.FaEye, props);
const FaDownload = (props: any) => createElement(icons.FaDownload, props);
const FaChartLine = (props: any) => createElement(icons.FaChartLine, props);
const FaCog = (props: any) => createElement(icons.FaCog, props);
const FaFlask = (props: any) => createElement(icons.FaFlask, props);
const FaCheckCircle = (props: any) => createElement(icons.FaCheckCircle, props);
const FaExclamationTriangle = (props: any) => createElement(icons.FaExclamationTriangle, props);
const FaTimes = (props: any) => createElement(icons.FaTimes, props);

interface TestScenario {
  id: string;
  name: string;
  description: string;
  testData: any;
}

interface ComponentTestResult {
  componentId: string;
  componentName: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  executionTime: number;
  inputData: any;
  outputData: any;
  errors: string[];
  warnings: string[];
  performanceMetrics: {
    executionTime: number;
    memoryUsage: number;
    throughput: number;
    dataProcessed: number;
    errorRate: number;
  };
}

interface WorkflowTestResult {
  workflowId: string;
  testScenarioId: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  startTime: Date;
  endTime?: Date;
  componentResults: ComponentTestResult[];
  overallPerformance: {
    executionTime: number;
    memoryUsage: number;
    throughput: number;
    dataProcessed: number;
    errorRate: number;
  };
  dataFlowValidation: {
    isValid: boolean;
    dataIntegrity: boolean;
    schemaCompliance: boolean;
    performanceAcceptable: boolean;
    issues: Array<{
      severity: 'error' | 'warning' | 'info';
      component: string;
      field: string;
      message: string;
      suggestion?: string;
    }>;
  };
}

interface DataFlowTestingPanelProps {
  workflowId: string;
  components: any[];
  onTestComplete?: (result: WorkflowTestResult) => void;
}

const DataFlowTestingPanel: React.FC<DataFlowTestingPanelProps> = ({
  workflowId,
  components,
  onTestComplete
}) => {
  const [testScenarios, setTestScenarios] = useState<TestScenario[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<string>('');
  const [testResult, setTestResult] = useState<WorkflowTestResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);
  const [performanceTestSize, setPerformanceTestSize] = useState(1000);
  const [performanceTestDuration, setPerformanceTestDuration] = useState(30);
  const [testProgress, setTestProgress] = useState(0);
  const [currentTestingComponent, setCurrentTestingComponent] = useState<string>('');

  useEffect(() => {
    fetchTestScenarios();
  }, []);

  const getFallbackTestScenarios = (): TestScenario[] => {
    return [
      {
        id: 'basic-flow',
        name: 'Basic Data Flow',
        description: 'Test basic data flow between components',
        testData: {
          inputData: { text: 'Sample input text', type: 'string' },
          expectedOutput: { processed: true, result: 'Processed text' },
          components: ['input', 'processor', 'output']
        }
      },
      {
        id: 'error-handling',
        name: 'Error Handling',
        description: 'Test error handling in data flow',
        testData: {
          inputData: { text: '', type: 'invalid' },
          expectedOutput: { error: 'Invalid input', processed: false },
          components: ['input', 'validator', 'error-handler']
        }
      },
      {
        id: 'complex-flow',
        name: 'Complex Multi-Step Flow',
        description: 'Test complex data transformation flow',
        testData: {
          inputData: { data: [1, 2, 3, 4, 5], operation: 'transform' },
          expectedOutput: { transformed: [2, 4, 6, 8, 10], count: 5 },
          components: ['input', 'transformer', 'aggregator', 'output']
        }
      }
    ];
  };

  const fetchTestScenarios = async () => {
    try {
      const response = await fetch('/api/v1/workflow/test-scenarios');
      
      // Check if response is actually JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        // Backend endpoint doesn't exist, use fallback scenarios
        console.log('Test scenarios endpoint not available, using fallback data');
        setTestScenarios(getFallbackTestScenarios());
        if (getFallbackTestScenarios().length > 0) {
          setSelectedScenario(getFallbackTestScenarios()[0].id);
        }
        return;
      }
      
      const data = await response.json();
      
      if (data.success) {
        setTestScenarios(data.scenarios);
        if (data.scenarios.length > 0) {
          setSelectedScenario(data.scenarios[0].id);
        }
      } else {
        console.error('Failed to fetch test scenarios:', data.error);
        setTestScenarios(getFallbackTestScenarios());
        if (getFallbackTestScenarios().length > 0) {
          setSelectedScenario(getFallbackTestScenarios()[0].id);
        }
      }
    } catch (error) {
      // Network error or JSON parsing error - use fallback
      console.log('Using fallback test scenarios due to API unavailability');
      setTestScenarios(getFallbackTestScenarios());
      if (getFallbackTestScenarios().length > 0) {
        setSelectedScenario(getFallbackTestScenarios()[0].id);
      }
    }
  };

  const generateAutomatedScenarios = async () => {
    try {
      const response = await fetch(`/api/v1/workflow/${workflowId}/generate-test-scenarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflow: {
            id: workflowId,
            components: components
          }
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setTestScenarios(prev => [...prev, ...data.scenarios]);
        if (data.scenarios.length > 0) {
          setSelectedScenario(data.scenarios[0].id);
        }
      }
    } catch (error) {
      console.error('Error generating test scenarios:', error);
    }
  };

  const runWorkflowTest = async () => {
    if (!selectedScenario || components.length === 0) {
      return;
    }

    setIsRunning(true);
    setTestProgress(0);
    setCurrentTestingComponent('');

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setTestProgress(prev => {
          const newProgress = prev + (100 / components.length) / 10;
          return Math.min(newProgress, 95);
        });
      }, 200);

      const response = await fetch(`/api/v1/workflow/${workflowId}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          components: components,
          testScenarioId: selectedScenario
        })
      });

      clearInterval(progressInterval);
      setTestProgress(100);

      const data = await response.json();
      
      if (data.success) {
        setTestResult(data.testResult);
        onTestComplete?.(data.testResult);
      }
    } catch (error) {
      console.error('Error running workflow test:', error);
    } finally {
      setIsRunning(false);
      setTimeout(() => setTestProgress(0), 1000);
    }
  };

  const runPerformanceTest = async () => {
    if (components.length === 0) return;

    setIsRunning(true);
    setShowPerformanceModal(false);

    try {
      const response = await fetch(`/api/v1/workflow/${workflowId}/performance-test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          components: components,
          dataSize: performanceTestSize,
          testDuration: performanceTestDuration
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setTestResult(data.testResult);
        onTestComplete?.(data.testResult);
      }
    } catch (error) {
      console.error('Error running performance test:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const validateDataFlow = async () => {
    if (components.length === 0) return;

    setIsRunning(true);

    try {
      const response = await fetch(`/api/v1/workflow/${workflowId}/validate-data-flow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          components: components,
          sampleData: { sample: 'validation data' }
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Create a simplified test result for validation
        const validationResult: WorkflowTestResult = {
          workflowId,
          testScenarioId: 'data_flow_validation',
          status: data.validation.isValid ? 'passed' : 'failed',
          startTime: new Date(),
          endTime: new Date(),
          componentResults: data.componentResults,
          overallPerformance: {
            executionTime: 0,
            memoryUsage: 0,
            throughput: 0,
            dataProcessed: 0,
            errorRate: 0
          },
          dataFlowValidation: data.validation
        };
        
        setTestResult(validationResult);
        onTestComplete?.(validationResult);
      }
    } catch (error) {
      console.error('Error validating data flow:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <FaCheckCircle className="text-success" />;
      case 'failed': return <FaTimes className="text-danger" />;
      case 'running': return <Spinner animation="border" size="sm" className="text-primary" />;
      default: return <FaPause className="text-muted" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'passed': return 'success';
      case 'failed': return 'danger';
      case 'running': return 'primary';
      default: return 'secondary';
    }
  };

  return (
    <div className="data-flow-testing-panel">
      <Card>
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              <FaFlask className="me-2" />
              Comprehensive Data Flow Testing
            </h5>
            <div>
              <Button
                variant="outline-secondary"
                size="sm"
                className="me-2"
                onClick={generateAutomatedScenarios}
                disabled={isRunning}
              >
                <FaCog className="me-1" />
                Generate Tests
              </Button>
              <Button
                variant="outline-info"
                size="sm"
                onClick={() => setShowPerformanceModal(true)}
                disabled={isRunning}
              >
                <FaChartLine className="me-1" />
                Performance Test
              </Button>
            </div>
          </div>
        </Card.Header>
        <Card.Body>
          {/* Test Scenario Selection */}
          <Row className="mb-3">
            <Col md={8}>
              <Form.Group>
                <Form.Label>Test Scenario</Form.Label>
                <Form.Select
                  value={selectedScenario}
                  onChange={(e) => setSelectedScenario(e.target.value)}
                  disabled={isRunning}
                >
                  <option value="">Select a test scenario...</option>
                  {testScenarios.map(scenario => (
                    <option key={scenario.id} value={scenario.id}>
                      {scenario.name}
                    </option>
                  ))}
                </Form.Select>
                {selectedScenario && (
                  <Form.Text className="text-muted">
                    {testScenarios.find(s => s.id === selectedScenario)?.description}
                  </Form.Text>
                )}
              </Form.Group>
            </Col>
            <Col md={4} className="d-flex align-items-end">
              <div className="d-grid gap-2 w-100">
                <Button
                  variant="primary"
                  onClick={runWorkflowTest}
                  disabled={isRunning || !selectedScenario || components.length === 0}
                >
                  {isRunning ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <FaPlay className="me-1" />
                      Run Test
                    </>
                  )}
                </Button>
                <Button
                  variant="outline-warning"
                  size="sm"
                  onClick={validateDataFlow}
                  disabled={isRunning || components.length === 0}
                >
                  <FaEye className="me-1" />
                  Validate Flow
                </Button>
              </div>
            </Col>
          </Row>

          {/* Test Progress */}
          {isRunning && (
            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span>Testing Progress</span>
                <span>{Math.round(testProgress)}%</span>
              </div>
              <ProgressBar now={testProgress} animated />
              {currentTestingComponent && (
                <small className="text-muted">
                  Currently testing: {currentTestingComponent}
                </small>
              )}
            </div>
          )}

          {/* Test Results Summary */}
          {testResult && (
            <div className="mb-3">
              <Alert variant={getStatusVariant(testResult.status)}>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <strong>
                      {getStatusIcon(testResult.status)}
                      <span className="ms-2">
                        Test {testResult.status.toUpperCase()}
                      </span>
                    </strong>
                    <div className="mt-1">
                      <small>
                        Components: {testResult.componentResults.length} | 
                        Execution Time: {testResult.overallPerformance.executionTime}ms |
                        Error Rate: {(testResult.overallPerformance.errorRate * 100).toFixed(1)}%
                      </small>
                    </div>
                  </div>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => setShowResultModal(true)}
                  >
                    <FaEye className="me-1" />
                    View Details
                  </Button>
                </div>
              </Alert>
            </div>
          )}

          {/* Component Status Overview */}
          {testResult && testResult.componentResults.length > 0 && (
            <div>
              <h6>Component Test Results</h6>
              <Table size="sm" className="mb-0">
                <thead>
                  <tr>
                    <th>Component</th>
                    <th>Status</th>
                    <th>Execution Time</th>
                    <th>Issues</th>
                  </tr>
                </thead>
                <tbody>
                  {testResult.componentResults.map((result, index) => (
                    <tr key={index}>
                      <td>{result.componentName}</td>
                      <td>
                        <Badge bg={getStatusVariant(result.status)}>
                          {getStatusIcon(result.status)}
                          <span className="ms-1">{result.status}</span>
                        </Badge>
                      </td>
                      <td>{result.executionTime}ms</td>
                      <td>
                        {result.errors.length > 0 && (
                          <Badge bg="danger" className="me-1">
                            {result.errors.length} errors
                          </Badge>
                        )}
                        {result.warnings.length > 0 && (
                          <Badge bg="warning">
                            {result.warnings.length} warnings
                          </Badge>
                        )}
                        {result.errors.length === 0 && result.warnings.length === 0 && (
                          <span className="text-muted">None</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}

          {/* No Components Warning */}
          {components.length === 0 && (
            <Alert variant="info">
              <FaExclamationTriangle className="me-2" />
              Add components to your workflow to enable testing.
            </Alert>
          )}
        </Card.Body>
      </Card>

      {/* Detailed Results Modal */}
      <Modal show={showResultModal} onHide={() => setShowResultModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Detailed Test Results</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {testResult && (
            <Tabs defaultActiveKey="overview">
              <Tab eventKey="overview" title="Overview">
                <div className="mt-3">
                  <Row>
                    <Col md={6}>
                      <h6>Test Information</h6>
                      <p><strong>Workflow ID:</strong> {testResult.workflowId}</p>
                      <p><strong>Test Scenario:</strong> {testResult.testScenarioId}</p>
                      <p><strong>Status:</strong> 
                        <Badge bg={getStatusVariant(testResult.status)} className="ms-2">
                          {testResult.status}
                        </Badge>
                      </p>
                      <p><strong>Duration:</strong> {testResult.endTime && testResult.startTime ? 
                        new Date(testResult.endTime).getTime() - new Date(testResult.startTime).getTime() : 0}ms</p>
                    </Col>
                    <Col md={6}>
                      <h6>Performance Metrics</h6>
                      <p><strong>Execution Time:</strong> {testResult.overallPerformance.executionTime}ms</p>
                      <p><strong>Memory Usage:</strong> {(testResult.overallPerformance.memoryUsage / 1024).toFixed(2)}KB</p>
                      <p><strong>Throughput:</strong> {testResult.overallPerformance.throughput.toFixed(2)} bytes/ms</p>
                      <p><strong>Error Rate:</strong> {(testResult.overallPerformance.errorRate * 100).toFixed(1)}%</p>
                    </Col>
                  </Row>
                </div>
              </Tab>
              
              <Tab eventKey="components" title="Component Results">
                <div className="mt-3">
                  {testResult.componentResults.map((result, index) => (
                    <Card key={index} className="mb-3">
                      <Card.Header>
                        <div className="d-flex justify-content-between align-items-center">
                          <span>{result.componentName}</span>
                          <Badge bg={getStatusVariant(result.status)}>
                            {result.status}
                          </Badge>
                        </div>
                      </Card.Header>
                      <Card.Body>
                        <Row>
                          <Col md={6}>
                            <h6>Input Data</h6>
                            <pre className="small bg-light p-2 rounded">
                              {JSON.stringify(result.inputData, null, 2)}
                            </pre>
                          </Col>
                          <Col md={6}>
                            <h6>Output Data</h6>
                            <pre className="small bg-light p-2 rounded">
                              {JSON.stringify(result.outputData, null, 2)}
                            </pre>
                          </Col>
                        </Row>
                        {(result.errors.length > 0 || result.warnings.length > 0) && (
                          <div className="mt-3">
                            {result.errors.length > 0 && (
                              <Alert variant="danger" className="py-2">
                                <strong>Errors:</strong>
                                <ul className="mb-0 mt-1">
                                  {result.errors.map((error, i) => (
                                    <li key={i}>{error}</li>
                                  ))}
                                </ul>
                              </Alert>
                            )}
                            {result.warnings.length > 0 && (
                              <Alert variant="warning" className="py-2">
                                <strong>Warnings:</strong>
                                <ul className="mb-0 mt-1">
                                  {result.warnings.map((warning, i) => (
                                    <li key={i}>{warning}</li>
                                  ))}
                                </ul>
                              </Alert>
                            )}
                          </div>
                        )}
                      </Card.Body>
                    </Card>
                  ))}
                </div>
              </Tab>
              
              <Tab eventKey="validation" title="Data Flow Validation">
                <div className="mt-3">
                  <Row>
                    <Col md={3}>
                      <div className="text-center p-3 border rounded">
                        <h6>Data Integrity</h6>
                        <Badge bg={testResult.dataFlowValidation.dataIntegrity ? 'success' : 'danger'}>
                          {testResult.dataFlowValidation.dataIntegrity ? 'PASS' : 'FAIL'}
                        </Badge>
                      </div>
                    </Col>
                    <Col md={3}>
                      <div className="text-center p-3 border rounded">
                        <h6>Schema Compliance</h6>
                        <Badge bg={testResult.dataFlowValidation.schemaCompliance ? 'success' : 'danger'}>
                          {testResult.dataFlowValidation.schemaCompliance ? 'PASS' : 'FAIL'}
                        </Badge>
                      </div>
                    </Col>
                    <Col md={3}>
                      <div className="text-center p-3 border rounded">
                        <h6>Performance</h6>
                        <Badge bg={testResult.dataFlowValidation.performanceAcceptable ? 'success' : 'warning'}>
                          {testResult.dataFlowValidation.performanceAcceptable ? 'GOOD' : 'SLOW'}
                        </Badge>
                      </div>
                    </Col>
                    <Col md={3}>
                      <div className="text-center p-3 border rounded">
                        <h6>Overall</h6>
                        <Badge bg={testResult.dataFlowValidation.isValid ? 'success' : 'danger'}>
                          {testResult.dataFlowValidation.isValid ? 'VALID' : 'INVALID'}
                        </Badge>
                      </div>
                    </Col>
                  </Row>
                  
                  {testResult.dataFlowValidation.issues.length > 0 && (
                    <div className="mt-4">
                      <h6>Issues Found</h6>
                      {testResult.dataFlowValidation.issues.map((issue, index) => (
                        <Alert key={index} variant={issue.severity === 'error' ? 'danger' : 'warning'}>
                          <div>
                            <strong>{issue.component} - {issue.field}:</strong> {issue.message}
                          </div>
                          {issue.suggestion && (
                            <div className="mt-1">
                              <small><strong>Suggestion:</strong> {issue.suggestion}</small>
                            </div>
                          )}
                        </Alert>
                      ))}
                    </div>
                  )}
                </div>
              </Tab>
            </Tabs>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowResultModal(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={() => {
            // Export test results
            const dataStr = JSON.stringify(testResult, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `test-results-${workflowId}-${Date.now()}.json`;
            link.click();
            URL.revokeObjectURL(url);
          }}>
            <FaDownload className="me-1" />
            Export Results
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Performance Test Modal */}
      <Modal show={showPerformanceModal} onHide={() => setShowPerformanceModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Performance Test Configuration</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Data Size (number of items)</Form.Label>
              <Form.Control
                type="number"
                value={performanceTestSize}
                onChange={(e) => setPerformanceTestSize(parseInt(e.target.value) || 1000)}
                min="100"
                max="10000"
              />
              <Form.Text className="text-muted">
                Number of data items to process during the test
              </Form.Text>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Test Duration Limit (seconds)</Form.Label>
              <Form.Control
                type="number"
                value={performanceTestDuration}
                onChange={(e) => setPerformanceTestDuration(parseInt(e.target.value) || 30)}
                min="5"
                max="300"
              />
              <Form.Text className="text-muted">
                Maximum time allowed for the test to complete
              </Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPerformanceModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={runPerformanceTest}>
            <FaChartLine className="me-1" />
            Run Performance Test
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default DataFlowTestingPanel;