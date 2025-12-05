import React from 'react';
import { Card, Alert, Badge, ListGroup, Row, Col } from 'react-bootstrap';

interface DynamicResultsRendererProps {
  results: any;
  agentName?: string;
}

/**
 * Dynamic Results Renderer
 * Renders execution results for ANY agent type dynamically
 */
const DynamicResultsRenderer: React.FC<DynamicResultsRendererProps> = ({ results, agentName }) => {
  if (!results) {
    return (
      <Alert variant="info">
        No results to display. Execute the agent to see results.
      </Alert>
    );
  }

  // Extract common fields
  const summary = results.summary || {};
  const findings = results.findings || results.vulnerabilities || results.issues || [];
  const recommendations = results.recommendations || [];
  const analysisType = results.analysisType || 'general';

  return (
    <div className="dynamic-results">
      {/* Summary Card */}
      {Object.keys(summary).length > 0 && (
        <Card className="mb-4">
          <Card.Header className="bg-primary text-white">
            <h5 className="mb-0">📊 Execution Summary</h5>
          </Card.Header>
          <Card.Body>
            <Row>
              {Object.entries(summary).map(([key, value]) => (
                <Col md={3} key={key} className="mb-3">
                  <div className="text-center">
                    <h3 className={`mb-1 ${getSeverityColor(key)}`}>{String(value)}</h3>
                    <small className="text-muted">{formatKey(key)}</small>
                  </div>
                </Col>
              ))}
            </Row>
          </Card.Body>
        </Card>
      )}

      {/* Findings/Issues */}
      {findings.length > 0 && (
        <Card className="mb-4">
          <Card.Header className="bg-warning text-dark">
            <h5 className="mb-0">🔍 Findings ({findings.length})</h5>
          </Card.Header>
          <Card.Body>
            <ListGroup>
              {findings.map((finding: any, index: number) => (
                <ListGroup.Item key={index} className="mb-2">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <Badge bg={getSeverityBadge(finding.severity)} className="me-2">
                        {finding.severity?.toUpperCase() || 'MEDIUM'}
                      </Badge>
                      {finding.category && (
                        <Badge bg="secondary" className="me-2">
                          {finding.category}
                        </Badge>
                      )}
                      {finding.line && (
                        <Badge bg="info">Line {finding.line}</Badge>
                      )}
                    </div>
                  </div>
                  
                  <h6 className="mb-2">{finding.title || finding.message || 'Issue Detected'}</h6>
                  
                  {finding.description && (
                    <p className="mb-2 text-muted">{finding.description}</p>
                  )}
                  
                  {finding.code && (
                    <pre className="bg-light p-2 rounded mb-2">
                      <code>{finding.code}</code>
                    </pre>
                  )}
                  
                  {finding.recommendation && (
                    <Alert variant="success" className="mb-0 mt-2">
                      <strong>💡 Recommendation:</strong> {finding.recommendation}
                    </Alert>
                  )}
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Card.Body>
        </Card>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card className="mb-4">
          <Card.Header className="bg-success text-white">
            <h5 className="mb-0">💡 Recommendations</h5>
          </Card.Header>
          <Card.Body>
            <ListGroup>
              {recommendations.map((rec: any, index: number) => (
                <ListGroup.Item key={index}>
                  {typeof rec === 'string' ? rec : rec.title || rec.message}
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Card.Body>
        </Card>
      )}

      {/* Raw Results (fallback for any other data) */}
      {findings.length === 0 && recommendations.length === 0 && (
        <Card className="mb-4">
          <Card.Header>
            <h5 className="mb-0">📋 Results</h5>
          </Card.Header>
          <Card.Body>
            <pre className="bg-light p-3 rounded" style={{ maxHeight: '400px', overflow: 'auto' }}>
              {JSON.stringify(results, null, 2)}
            </pre>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

// Helper functions
function getSeverityColor(key: string): string {
  const keyLower = key.toLowerCase();
  if (keyLower.includes('critical')) return 'text-danger';
  if (keyLower.includes('high')) return 'text-warning';
  if (keyLower.includes('medium')) return 'text-info';
  if (keyLower.includes('low')) return 'text-secondary';
  return 'text-primary';
}

function getSeverityBadge(severity: string): string {
  if (!severity) return 'secondary';
  const sev = severity.toLowerCase();
  if (sev === 'critical') return 'danger';
  if (sev === 'high') return 'warning';
  if (sev === 'medium') return 'info';
  if (sev === 'low') return 'secondary';
  return 'primary';
}

function formatKey(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default DynamicResultsRenderer;
