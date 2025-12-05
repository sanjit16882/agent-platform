import React from 'react';
import { Card, Badge, Alert } from 'react-bootstrap';

interface PurposeDrivenResultsProps {
  result: any;
  agentName: string;
  agentPurpose: string;
}

const PurposeDrivenResults: React.FC<PurposeDrivenResultsProps> = ({ 
  result, 
  agentName, 
  agentPurpose 
}) => {
  if (!result || !result.success) {
    return (
      <Alert variant="danger">
        <h6>Execution Failed</h6>
        <p>{result?.error || 'Unknown error occurred'}</p>
      </Alert>
    );
  }

  const renderEmailRephraserResults = () => (
    <div>
      <Card className="mb-4">
        <Card.Header className="bg-success text-white">
          <h6 className="mb-0">Rephrased Email Content</h6>
        </Card.Header>
        <Card.Body>
          <div style={{ 
            backgroundColor: '#f8f9fa', 
            padding: '1rem', 
            borderRadius: '0.375rem',
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap',
            border: '1px solid #dee2e6'
          }}>
            {result.results?.rephrased_content || 'No content generated'}
          </div>
        </Card.Body>
      </Card>

      {result.results?.improvements_made && (
        <Card>
          <Card.Header>
            <h6 className="mb-0">Improvements Made</h6>
          </Card.Header>
          <Card.Body>
            <ul className="mb-0">
              {result.results.improvements_made.map((improvement: string, index: number) => (
                <li key={index}>{improvement}</li>
              ))}
            </ul>
          </Card.Body>
        </Card>
      )}
    </div>
  );

  const renderSeleniumResults = () => (
    <div>
      <Card className="mb-4">
        <Card.Header className="bg-primary text-white">
          <h6 className="mb-0">Generated Test Code</h6>
        </Card.Header>
        <Card.Body>
          <pre style={{ 
            backgroundColor: '#f8f9fa', 
            padding: '1rem', 
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            overflow: 'auto',
            maxHeight: '400px'
          }}>
            {result.results?.test_code || 'No code generated'}
          </pre>
        </Card.Body>
      </Card>

      <div className="row">
        <div className="col-md-6">
          <Card className="mb-3">
            <Card.Header>
              <h6 className="mb-0">Dependencies</h6>
            </Card.Header>
            <Card.Body>
              {result.results?.dependencies?.map((dep: string, index: number) => (
                <Badge key={index} bg="secondary" className="me-1 mb-1">
                  {dep}
                </Badge>
              ))}
            </Card.Body>
          </Card>
        </div>
        <div className="col-md-6">
          <Card className="mb-3">
            <Card.Header>
              <h6 className="mb-0">Setup Instructions</h6>
            </Card.Header>
            <Card.Body>
              <div style={{ fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>
                {result.results?.setup_instructions || 'No instructions provided'}
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  );

  const renderDevOpsResults = () => (
    <div>
      <Card className="mb-4">
        <Card.Header className="bg-warning text-dark">
          <h6 className="mb-0">Monitoring Configuration</h6>
        </Card.Header>
        <Card.Body>
          <pre style={{ 
            backgroundColor: '#f8f9fa', 
            padding: '1rem', 
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            overflow: 'auto',
            maxHeight: '300px'
          }}>
            {result.results?.monitoring_config || 'No configuration generated'}
          </pre>
        </Card.Body>
      </Card>

      <div className="row">
        <div className="col-md-6">
          <Card className="mb-3">
            <Card.Header>
              <h6 className="mb-0">Alert Rules</h6>
            </Card.Header>
            <Card.Body>
              {result.results?.alert_rules?.map((rule: any, index: number) => (
                <div key={index} className="mb-2 p-2 bg-light rounded">
                  <strong>{rule.service}</strong><br />
                  <small>Metric: {rule.metric} | Threshold: {rule.threshold}</small><br />
                  <small>Action: {rule.action}</small>
                </div>
              ))}
            </Card.Body>
          </Card>
        </div>
        <div className="col-md-6">
          <Card className="mb-3">
            <Card.Header>
              <h6 className="mb-0">Dashboard Configuration</h6>
            </Card.Header>
            <Card.Body>
              <pre style={{ fontSize: '0.75rem', overflow: 'auto', maxHeight: '200px' }}>
                {result.results?.dashboard_config || 'No dashboard config'}
              </pre>
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  );

  const renderGenericResults = () => (
    <Card>
      <Card.Header>
        <h6 className="mb-0">Processing Results</h6>
      </Card.Header>
      <Card.Body>
        <pre style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '1rem', 
          borderRadius: '0.375rem',
          fontSize: '0.875rem'
        }}>
          {JSON.stringify(result.results, null, 2)}
        </pre>
      </Card.Body>
    </Card>
  );

  const getResultsRenderer = () => {
    if (result.results?.rephrased_content) return renderEmailRephraserResults();
    if (result.results?.test_code) return renderSeleniumResults();
    if (result.results?.monitoring_config) return renderDevOpsResults();
    return renderGenericResults();
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4>Execution Complete</h4>
          <p className="text-muted mb-0">{agentName}</p>
        </div>
        <div className="text-end">
          <Badge bg="success" className="mb-1">
            {result.results?.summary?.processing_time || '2.3s'}
          </Badge>
          <br />
          <small className="text-muted">Processing Time</small>
        </div>
      </div>

      <Alert variant="info" className="mb-4">
        <strong>Purpose:</strong> {agentPurpose}
      </Alert>

      {getResultsRenderer()}

      {result.results?.metadata && (
        <Card className="mt-4">
          <Card.Header>
            <h6 className="mb-0">Execution Metadata</h6>
          </Card.Header>
          <Card.Body>
            <div className="row">
              <div className="col-md-4">
                <strong>Agent Type:</strong><br />
                <Badge bg="secondary">{result.results.metadata.agent_type}</Badge>
              </div>
              <div className="col-md-4">
                <strong>Processing Method:</strong><br />
                <Badge bg="info">{result.results.metadata.processing_method}</Badge>
              </div>
              <div className="col-md-4">
                <strong>Input Analysis:</strong><br />
                <small>{result.results.metadata.input_analysis}</small>
              </div>
            </div>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default PurposeDrivenResults;