/**
 * Testing Agent Results Component
 * Displays enhanced Testing Agent output with visualizations
 */

import React, { useState } from 'react';
import { Card, Row, Col, Badge, Button, Collapse, ProgressBar, Alert, Tab, Tabs } from 'react-bootstrap';
import { TestingAgentOutput } from '../../types/workflow';
import { CodePreview } from './CodePreview';
import { DDTFDimensionChart } from './DDTFDimensionChart';
import { DeploymentReadinessCard } from './DeploymentReadinessCard';

interface TestingAgentResultsProps {
  output: TestingAgentOutput;
  isLoading?: boolean;
}

export const TestingAgentResults: React.FC<TestingAgentResultsProps> = ({ 
  output, 
  isLoading = false 
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedTest, setExpandedTest] = useState<string | null>(null);

  if (isLoading) {
    return (
      <Card className="mb-4">
        <Card.Header>
          <h5><span className="me-2">🧪</span>Testing Agent Results</h5>
        </Card.Header>
        <Card.Body>
          <div className="text-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Executing tests and analyzing results...</p>
          </div>
        </Card.Body>
      </Card>
    );
  }

  const getGradeBadgeVariant = (grade: string) => {
    if (grade.startsWith('A')) return 'success';
    if (grade.startsWith('B')) return 'info';
    if (grade.startsWith('C')) return 'warning';
    return 'danger';
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'critical': return 'danger';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'validation': return '✅';
      case 'error-handling': return '⚠️';
      case 'security': return '🔒';
      case 'performance': return '⚡';
      case 'unit': return '🧪';
      case 'integration': return '🔗';
      default: return '📝';
    }
  };

  return (
    <Card className="mb-4">
      <Card.Header>
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <span className="me-2">🧪</span>Testing Agent Results
          </h5>
          <div className="d-flex gap-2">
            <Badge bg={getGradeBadgeVariant(output.ddtfResults.grade)} className="fs-6">
              {output.ddtfResults.overallScore}/100 ({output.ddtfResults.grade})
            </Badge>
            <Badge bg="primary" className="fs-6">
              {output.ddtfResults.passed}/{output.ddtfResults.totalTests} Tests
            </Badge>
          </div>
        </div>
      </Card.Header>
      <Card.Body>
        <Tabs
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k || 'overview')}
          className="mb-3"
        >
          <Tab eventKey="overview" title="📊 Overview">
            <Row>
              <Col md={6}>
                <DeploymentReadinessCard readiness={output.deploymentReadiness} />
              </Col>
              <Col md={6}>
                <Card className="h-100">
                  <Card.Header>
                    <h6 className="mb-0">📈 Coverage Estimation</h6>
                  </Card.Header>
                  <Card.Body>
                    <div className="mb-3">
                      <div className="d-flex justify-content-between mb-1">
                        <span>Lines</span>
                        <span>{output.coverage.lines}%</span>
                      </div>
                      <ProgressBar 
                        now={output.coverage.lines} 
                        variant={output.coverage.lines >= 80 ? 'success' : output.coverage.lines >= 60 ? 'warning' : 'danger'}
                      />
                    </div>
                    <div className="mb-3">
                      <div className="d-flex justify-content-between mb-1">
                        <span>Branches</span>
                        <span>{output.coverage.branches}%</span>
                      </div>
                      <ProgressBar 
                        now={output.coverage.branches} 
                        variant={output.coverage.branches >= 80 ? 'success' : output.coverage.branches >= 60 ? 'warning' : 'danger'}
                      />
                    </div>
                    <div className="mb-3">
                      <div className="d-flex justify-content-between mb-1">
                        <span>Functions</span>
                        <span>{output.coverage.functions}%</span>
                      </div>
                      <ProgressBar 
                        now={output.coverage.functions} 
                        variant={output.coverage.functions >= 80 ? 'success' : output.coverage.functions >= 60 ? 'warning' : 'danger'}
                      />
                    </div>
                    {output.coverage.uncoveredPaths.length > 0 && (
                      <div>
                        <h6 className="text-warning">Uncovered Paths:</h6>
                        <ul className="list-unstyled">
                          {output.coverage.uncoveredPaths.map((path, index) => (
                            <li key={index} className="text-muted small">
                              • {path}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Tab>

          <Tab eventKey="tests" title={`🧪 Generated Tests (${output.generatedTests.length})`}>
            <div className="mb-3">
              <Alert variant="info">
                <strong>Generated {output.generatedTests.length} test cases</strong> based on code complexity and detected issues.
              </Alert>
            </div>
            {output.generatedTests.map((test) => (
              <Card key={test.id} className="mb-3">
                <Card.Header>
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-2">
                      <span>{getCategoryIcon(test.category)}</span>
                      <strong>{test.name}</strong>
                      <Badge bg={getPriorityBadgeVariant(test.priority)}>
                        {test.priority}
                      </Badge>
                      <Badge bg="secondary">{test.category}</Badge>
                      {test.relatedIssue && (
                        <Badge bg="warning">Issue: {test.relatedIssue}</Badge>
                      )}
                    </div>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => setExpandedTest(expandedTest === test.id ? null : test.id)}
                    >
                      {expandedTest === test.id ? 'Hide Code' : 'Show Code'}
                    </Button>
                  </div>
                </Card.Header>
                <Collapse in={expandedTest === test.id}>
                  <div>
                    <Card.Body>
                      <CodePreview code={test.code} language="javascript" />
                    </Card.Body>
                  </div>
                </Collapse>
              </Card>
            ))}
          </Tab>

          <Tab eventKey="ddtf" title="📊 DDTF Results">
            <Row>
              <Col md={6}>
                <DDTFDimensionChart dimensions={output.ddtfResults.dimensions} />
              </Col>
              <Col md={6}>
                <Card>
                  <Card.Header>
                    <h6 className="mb-0">📈 Test Summary</h6>
                  </Card.Header>
                  <Card.Body>
                    <div className="row text-center">
                      <div className="col-4">
                        <div className="h3 text-success">{output.ddtfResults.passed}</div>
                        <div className="text-muted">Passed</div>
                      </div>
                      <div className="col-4">
                        <div className="h3 text-danger">{output.ddtfResults.failed}</div>
                        <div className="text-muted">Failed</div>
                      </div>
                      <div className="col-4">
                        <div className="h3 text-primary">{output.ddtfResults.passRate}%</div>
                        <div className="text-muted">Pass Rate</div>
                      </div>
                    </div>
                    <hr />
                    <div className="text-center">
                      <div className="h2 mb-1">
                        <Badge bg={getGradeBadgeVariant(output.ddtfResults.grade)} className="fs-4">
                          {output.ddtfResults.grade}
                        </Badge>
                      </div>
                      <div className="text-muted">Overall Grade</div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            <div className="mt-4">
              <h6>Dimension Breakdown</h6>
              {output.ddtfResults.dimensions.map((dimension) => (
                <Card key={dimension.name} className="mb-2">
                  <Card.Body className="py-2">
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center gap-2">
                        <strong>{dimension.name}</strong>
                        <Badge bg={dimension.score >= 90 ? 'success' : dimension.score >= 70 ? 'warning' : 'danger'}>
                          {dimension.score}/100
                        </Badge>
                        <span className="text-muted">({dimension.passed}/{dimension.total})</span>
                      </div>
                      <div style={{ width: '200px' }}>
                        <ProgressBar 
                          now={dimension.score} 
                          variant={dimension.score >= 90 ? 'success' : dimension.score >= 70 ? 'warning' : 'danger'}
                        />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              ))}
            </div>

            {output.ddtfResults.failedTests.length > 0 && (
              <div className="mt-4">
                <h6 className="text-danger">❌ Failed Tests ({output.ddtfResults.failedTests.length})</h6>
                {output.ddtfResults.failedTests.map((test) => (
                  <Card key={test.id} className="mb-2 border-danger">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h6 className="text-danger">{test.name}</h6>
                          <div className="mb-2">
                            <Badge bg="secondary" className="me-2">{test.dimension}</Badge>
                            <Badge bg={getPriorityBadgeVariant(test.severity)}>{test.severity}</Badge>
                          </div>
                          <div className="mb-2">
                            <strong>Expected:</strong> {test.expected}
                          </div>
                          <div className="mb-2">
                            <strong>Actual:</strong> {test.actual}
                          </div>
                          <div className="mb-2">
                            <strong>Recommendation:</strong> {test.recommendation}
                          </div>
                          {test.suggestedFix && (
                            <div>
                              <strong>Suggested Fix:</strong>
                              <CodePreview code={test.suggestedFix} language="javascript" />
                            </div>
                          )}
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                ))}
              </div>
            )}
          </Tab>

          <Tab eventKey="raw" title="📄 Raw Output">
            <Card>
              <Card.Header>
                <h6 className="mb-0">Raw Text Summary</h6>
              </Card.Header>
              <Card.Body>
                <pre className="bg-light p-3 rounded" style={{ fontSize: '0.85rem', maxHeight: '400px', overflow: 'auto' }}>
                  {output.textSummary}
                </pre>
              </Card.Body>
            </Card>
          </Tab>
        </Tabs>
      </Card.Body>
    </Card>
  );
};
