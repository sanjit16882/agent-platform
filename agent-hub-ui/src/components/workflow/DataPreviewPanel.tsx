import React from 'react';
import { Card, Button, Alert, Row, Col, Badge, Spinner } from 'react-bootstrap';
import { DataPreview } from '../../types/dataMapping';

interface DataPreviewPanelProps {
  preview: DataPreview | null;
  isGenerating: boolean;
  onGenerate: () => void;
}

const DataPreviewPanel: React.FC<DataPreviewPanelProps> = ({
  preview,
  isGenerating,
  onGenerate
}) => {
  // Format JSON data for display
  const formatData = (data: any): string => {
    if (data === null || data === undefined) {
      return 'null';
    }
    
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  };

  // Render data comparison
  const renderDataComparison = () => {
    if (!preview) return null;

    return (
      <Row>
        <Col md={6}>
          <Card>
            <Card.Header className="bg-primary text-white">
              <h6 className="mb-0">Source Data</h6>
            </Card.Header>
            <Card.Body>
              <pre className="data-preview-content">
                {formatData(preview.sourceData)}
              </pre>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card>
            <Card.Header className="bg-primary text-white">
              <h6 className="mb-0">Transformed Data</h6>
            </Card.Header>
            <Card.Body>
              {preview.transformedData ? (
                <pre className="data-preview-content">
                  {formatData(preview.transformedData)}
                </pre>
              ) : (
                <Alert variant="warning">
                  No transformed data available. Check for transformation errors.
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    );
  };

  // Render preview statistics
  const renderPreviewStats = () => {
    if (!preview) return null;

    return (
      <Card className="mb-3">
        <Card.Body>
          <Row className="text-center">
            <Col md={3}>
              <div>
                <h5 className="text-primary mb-1">{preview.sampleSize}</h5>
                <small className="text-muted">Sample Size</small>
              </div>
            </Col>
            <Col md={3}>
              <div>
                <h5 className="text-primary mb-1">{preview.executionTime}ms</h5>
                <small className="text-muted">Execution Time</small>
              </div>
            </Col>
            <Col md={3}>
              <div>
                <h5 className={`mb-1 ${preview.errors.length > 0 ? 'text-danger' : 'text-success'}`}>
                  {preview.errors.length}
                </h5>
                <small className="text-muted">Errors</small>
              </div>
            </Col>
            <Col md={3}>
              <div>
                <Badge bg={preview.transformedData ? 'success' : 'danger'} className="mb-1">
                  {preview.transformedData ? 'Success' : 'Failed'}
                </Badge>
                <br />
                <small className="text-muted">Status</small>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    );
  };

  // Render errors
  const renderErrors = () => {
    if (!preview || preview.errors.length === 0) return null;

    return (
      <Alert variant="danger" className="mb-3">
        <h6>Transformation Errors:</h6>
        <ul className="mb-0">
          {preview.errors.map((error, index) => (
            <li key={index}>
              <strong>{error.fieldId}:</strong> {error.message}
            </li>
          ))}
        </ul>
      </Alert>
    );
  };

  return (
    <div className="data-preview-panel">
      {/* Generate Preview Button */}
      <div className="text-center mb-4">
        <Button
          variant="primary"
          size="lg"
          onClick={onGenerate}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Generating Preview...
            </>
          ) : (
            'Generate Data Preview'
          )}
        </Button>
        <div className="mt-2">
          <small className="text-muted">
            Generate a preview to see how your transformations will affect the data
          </small>
        </div>
      </div>

      {/* Loading State */}
      {isGenerating && (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <div className="mt-3">
            <h6>Generating Preview...</h6>
            <p className="text-muted">
              Running transformations on sample data
            </p>
          </div>
        </div>
      )}

      {/* Preview Results */}
      {preview && !isGenerating && (
        <>
          {renderPreviewStats()}
          {renderErrors()}
          {renderDataComparison()}
          
          {/* Preview Info */}
          <Card className="mt-3 bg-light">
            <Card.Body>
              <h6 className="mb-2">Preview Information</h6>
              <ul className="mb-0 small">
                <li>This preview uses sample data to demonstrate transformations</li>
                <li>Actual data may vary in structure and content</li>
                <li>Test your mappings thoroughly before deploying to production</li>
                <li>Performance may differ with larger datasets</li>
              </ul>
            </Card.Body>
          </Card>
        </>
      )}

      {/* No Preview State */}
      {!preview && !isGenerating && (
        <Card className="text-center py-5">
          <Card.Body>
            <div className="mb-3">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-muted">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14,2 14,8 20,8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10,9 9,9 8,9"></polyline>
              </svg>
            </div>
            <h5>No Preview Generated</h5>
            <p className="text-muted">
              Click "Generate Data Preview" to see how your transformations will affect the data
            </p>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default DataPreviewPanel;