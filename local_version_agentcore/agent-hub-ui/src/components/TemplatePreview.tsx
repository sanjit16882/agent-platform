import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Alert, Spinner, Form, Row, Col } from 'react-bootstrap';
import { AgentTemplate, templateService } from '../services/templateService';
import CodeHighlighter from './CodeHighlighter';

interface TemplatePreviewProps {
  template: AgentTemplate;
}

const TemplatePreview: React.FC<TemplatePreviewProps> = ({ template }) => {
  const [previewData, setPreviewData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sampleParams, setSampleParams] = useState<Record<string, any>>({});
  const [activePreview, setActivePreview] = useState<'template' | 'generated'>('template');

  useEffect(() => {
    // Initialize sample parameters with default values
    const initialParams: Record<string, any> = {};
    template.parameters.forEach(param => {
      if (param.defaultValue !== undefined) {
        initialParams[param.name] = param.defaultValue;
      } else {
        // Provide sample values based on parameter type
        switch (param.type) {
          case 'string':
            initialParams[param.name] = param.name.includes('url') ? 'https://example.com' : 'sample-value';
            break;
          case 'number':
            initialParams[param.name] = 10;
            break;
          case 'boolean':
            initialParams[param.name] = true;
            break;
          case 'select':
            initialParams[param.name] = param.options?.[0]?.value || 'option1';
            break;
          default:
            initialParams[param.name] = 'sample-value';
        }
      }
    });
    setSampleParams(initialParams);
  }, [template]);

  const generatePreview = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const generated = await templateService.generateCode(template, sampleParams);
      setPreviewData(generated);
      setActivePreview('generated');
    } catch (err) {
      setError('Failed to generate preview');
      console.error('Preview generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleParamChange = (paramName: string, value: any) => {
    setSampleParams(prev => ({
      ...prev,
      [paramName]: value
    }));
  };

  return (
    <div>
      {/* Preview Controls */}
      <Card className="mb-4">
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Code Preview</h5>
            <div className="btn-group" role="group">
              <Button
                variant={activePreview === 'template' ? 'primary' : 'outline-primary'}
                size="sm"
                onClick={() => setActivePreview('template')}
              >
                📄 Template Code
              </Button>
              <Button
                variant={activePreview === 'generated' ? 'primary' : 'outline-primary'}
                size="sm"
                onClick={() => setActivePreview('generated')}
                disabled={!previewData}
              >
                Generated Code
              </Button>
            </div>
          </div>
        </Card.Header>
        <Card.Body>
          <div className="mb-3">
            <p className="text-muted">
              Preview the template code or generate a sample with custom parameters.
            </p>
            
            {template.parameters.length > 0 && (
              <div className="mb-3">
                <h6>Sample Parameters:</h6>
                <Row>
                  {template.parameters.slice(0, 4).map((param, index) => (
                    <Col key={index} md={6} className="mb-2">
                      <Form.Group>
                        <Form.Label className="small">
                          {param.name}
                          {param.required && <span className="text-danger">*</span>}
                        </Form.Label>
                        {param.type === 'select' && param.options ? (
                          <Form.Select
                            size="sm"
                            value={sampleParams[param.name] || ''}
                            onChange={(e) => handleParamChange(param.name, e.target.value)}
                          >
                            {param.options.map((option, optIndex) => (
                              <option key={optIndex} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </Form.Select>
                        ) : param.type === 'boolean' ? (
                          <Form.Check
                            type="checkbox"
                            checked={sampleParams[param.name] || false}
                            onChange={(e) => handleParamChange(param.name, e.target.checked)}
                          />
                        ) : (
                          <Form.Control
                            size="sm"
                            type={param.type === 'number' ? 'number' : 'text'}
                            value={sampleParams[param.name] || ''}
                            onChange={(e) => handleParamChange(param.name, 
                              param.type === 'number' ? parseInt(e.target.value) : e.target.value
                            )}
                            placeholder={param.description}
                          />
                        )}
                      </Form.Group>
                    </Col>
                  ))}
                </Row>
                
                <Button
                  variant="success"
                  size="sm"
                  onClick={generatePreview}
                  disabled={loading}
                  className="mt-2"
                >
                  {loading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Generating...
                    </>
                  ) : (
                    <>Generate Preview</>
                  )}
                </Button>
              </div>
            )}
          </div>
        </Card.Body>
      </Card>

      {error && (
        <Alert variant="danger" className="mb-4">
          <strong>Preview Error:</strong> {error}
        </Alert>
      )}

      {/* Template Code Preview */}
      {activePreview === 'template' && (
        <Card>
          <Card.Header>
            <h6 className="mb-0">📄 Template Source Code</h6>
          </Card.Header>
          <Card.Body>
            <div className="mb-3">
              <Badge bg="info" className="me-2">Template</Badge>
              <Badge bg="light" text="dark">
                {template.technologies.join(', ')}
              </Badge>
            </div>
            
            <CodeHighlighter 
              code={template.codeTemplate || '# Template code will be displayed here'} 
              language="python"
            />
            
            {template.configTemplate && Object.keys(template.configTemplate).length > 0 && (
              <div className="mt-4">
                <h6>Configuration Template:</h6>
                <CodeHighlighter 
                  code={JSON.stringify(template.configTemplate, null, 2)} 
                  language="json"
                />
              </div>
            )}
          </Card.Body>
        </Card>
      )}

      {/* Generated Code Preview */}
      {activePreview === 'generated' && previewData && (
        <div>
          {previewData.files.map((file: any, index: number) => (
            <Card key={index} className="mb-3">
              <Card.Header>
                <div className="d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">📄 {file.path}</h6>
                  <div>
                    <Badge bg="primary" className="me-2">
                      {file.type}
                    </Badge>
                    <Badge bg="light" text="dark">
                      {file.language}
                    </Badge>
                  </div>
                </div>
              </Card.Header>
              <Card.Body>
                <CodeHighlighter 
                  code={file.content} 
                  language={file.language}
                />
              </Card.Body>
            </Card>
          ))}
          
          {previewData.configuration && (
            <Card className="mb-3">
              <Card.Header>
                <h6 className="mb-0">Generated Configuration</h6>
              </Card.Header>
              <Card.Body>
                <CodeHighlighter 
                  code={JSON.stringify(previewData.configuration, null, 2)} 
                  language="json"
                />
              </Card.Body>
            </Card>
          )}
          
          {previewData.dependencies && previewData.dependencies.length > 0 && (
            <Card>
              <Card.Header>
                <h6 className="mb-0">📦 Dependencies</h6>
              </Card.Header>
              <Card.Body>
                <div className="d-flex flex-wrap gap-2">
                  {previewData.dependencies.map((dep: string, index: number) => (
                    <Badge key={index} bg="light" text="dark">
                      {dep}
                    </Badge>
                  ))}
                </div>
              </Card.Body>
            </Card>
          )}
        </div>
      )}

      {activePreview === 'generated' && !previewData && (
        <Card>
          <Card.Body className="text-center text-muted">
            <p>Click "Generate Preview" to see the generated code with your parameters.</p>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default TemplatePreview;