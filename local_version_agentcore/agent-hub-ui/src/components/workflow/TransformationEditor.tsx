import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Row, Col, Alert, Badge } from 'react-bootstrap';
import { DataMapping, DataTransformation, TransformationType, TransformationConfig, DataType } from '../../types/dataMapping';

interface TransformationEditorProps {
  mapping: DataMapping;
  onUpdateTransformation: (transformation: DataTransformation) => void;
}

const TransformationEditor: React.FC<TransformationEditorProps> = ({
  mapping,
  onUpdateTransformation
}) => {
  const [transformationType, setTransformationType] = useState<TransformationType>(
    mapping.transformation?.type || 'direct'
  );
  const [config, setConfig] = useState<TransformationConfig>(
    mapping.transformation?.config || { direct: {} }
  );
  const [testInput, setTestInput] = useState<string>('');
  const [testOutput, setTestOutput] = useState<string>('');
  const [testError, setTestError] = useState<string>('');

  // Update transformation when type changes
  useEffect(() => {
    const newTransformation: DataTransformation = {
      id: mapping.transformation?.id || `transform-${Date.now()}`,
      type: transformationType,
      config: getDefaultConfig(transformationType),
      description: getTransformationDescription(transformationType)
    };

    setConfig(newTransformation.config);
    onUpdateTransformation(newTransformation);
  }, [transformationType]);

  // Get default configuration for transformation type
  const getDefaultConfig = (type: TransformationType): TransformationConfig => {
    switch (type) {
      case 'direct':
        return { direct: {} };
      case 'format':
        return { format: { template: '${value}' } };
      case 'convert':
        return { convert: { fromType: 'string', toType: 'string' } };
      case 'filter':
        return { filter: { condition: 'data !== null', keepMatching: true } };
      case 'aggregate':
        return { aggregate: { operation: 'sum' } };
      case 'split':
        return { split: { delimiter: ',' } };
      case 'join':
        return { join: { separator: ', ', fields: [] } };
      case 'conditional':
        return { conditional: { condition: 'data !== null', trueValue: 'valid', falseValue: 'invalid' } };
      case 'custom':
        return { custom: { code: 'return data;' } };
      default:
        return { direct: {} };
    }
  };

  // Get transformation description
  const getTransformationDescription = (type: TransformationType): string => {
    const descriptions = {
      direct: 'Pass data through without modification',
      format: 'Format data using templates',
      convert: 'Convert between data types',
      filter: 'Filter data based on conditions',
      aggregate: 'Aggregate array data',
      split: 'Split strings into arrays',
      join: 'Join arrays or fields into strings',
      conditional: 'Apply conditional logic',
      custom: 'Custom JavaScript transformation'
    };
    return descriptions[type] || 'Unknown transformation';
  };

  // Update configuration
  const updateConfig = (updates: Partial<TransformationConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    
    const updatedTransformation: DataTransformation = {
      id: mapping.transformation?.id || `transform-${Date.now()}`,
      type: transformationType,
      config: newConfig,
      description: getTransformationDescription(transformationType)
    };
    
    onUpdateTransformation(updatedTransformation);
  };

  // Test transformation
  const handleTestTransformation = async () => {
    try {
      setTestError('');
      
      // Simple test implementation (production would use the actual service)
      let result = testInput;
      
      switch (transformationType) {
        case 'format':
          if (config.format?.template) {
            result = config.format.template.replace(/\$\{([^}]+)\}/g, (match, key) => {
              if (key === 'value') return testInput;
              return match;
            });
          }
          break;
          
        case 'convert':
          if (config.convert?.toType === 'number') {
            result = String(Number(testInput) || 0);
          } else if (config.convert?.toType === 'boolean') {
            result = String(Boolean(testInput));
          }
          break;
          
        case 'split':
          if (config.split?.delimiter) {
            result = JSON.stringify(testInput.split(config.split.delimiter));
          }
          break;
          
        case 'custom':
          if (config.custom?.code) {
            try {
              const func = new Function('data', config.custom.code);
              result = String(func(testInput));
            } catch (error) {
              throw new Error(`Custom code error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          }
          break;
          
        default:
          result = testInput;
      }
      
      setTestOutput(result);
    } catch (error) {
      setTestError(error instanceof Error ? error.message : 'Test failed');
      setTestOutput('');
    }
  };

  // Render configuration form based on transformation type
  const renderConfigurationForm = () => {
    switch (transformationType) {
      case 'format':
        return (
          <Form.Group className="mb-3">
            <Form.Label>Template</Form.Label>
            <Form.Control
              type="text"
              value={config.format?.template || ''}
              onChange={(e) => updateConfig({ format: { template: e.target.value } })}
              placeholder="e.g., ${firstName} ${lastName}"
            />
            <Form.Text className="text-muted">
              Use ${'{fieldName}'} to reference fields. For single values, use ${'{value}'}
            </Form.Text>
          </Form.Group>
        );

      case 'convert':
        return (
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>From Type</Form.Label>
                <Form.Select
                  value={config.convert?.fromType || 'string'}
                  onChange={(e) => updateConfig({ 
                    convert: { 
                      fromType: e.target.value as DataType,
                      toType: config.convert?.toType || 'string',
                      options: config.convert?.options
                    } 
                  })}
                >
                  <option value="string">String</option>
                  <option value="number">Number</option>
                  <option value="boolean">Boolean</option>
                  <option value="array">Array</option>
                  <option value="object">Object</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>To Type</Form.Label>
                <Form.Select
                  value={config.convert?.toType || 'string'}
                  onChange={(e) => updateConfig({ 
                    convert: { 
                      fromType: config.convert?.fromType || 'string',
                      toType: e.target.value as DataType,
                      options: config.convert?.options
                    } 
                  })}
                >
                  <option value="string">String</option>
                  <option value="number">Number</option>
                  <option value="boolean">Boolean</option>
                  <option value="array">Array</option>
                  <option value="object">Object</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        );

      case 'filter':
        return (
          <>
            <Form.Group className="mb-3">
              <Form.Label>Condition</Form.Label>
              <Form.Control
                type="text"
                value={config.filter?.condition || ''}
                onChange={(e) => updateConfig({ 
                  filter: { 
                    condition: e.target.value,
                    keepMatching: config.filter?.keepMatching !== false
                  } 
                })}
                placeholder="e.g., data !== null && data.length > 0"
              />
              <Form.Text className="text-muted">
                JavaScript expression. Use 'data' to reference the input value.
              </Form.Text>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Keep matching items (uncheck to keep non-matching)"
                checked={config.filter?.keepMatching !== false}
                onChange={(e) => updateConfig({ 
                  filter: { 
                    condition: config.filter?.condition || 'data !== null',
                    keepMatching: e.target.checked 
                  } 
                })}
              />
            </Form.Group>
          </>
        );

      case 'split':
        return (
          <Form.Group className="mb-3">
            <Form.Label>Delimiter</Form.Label>
            <Form.Control
              type="text"
              value={config.split?.delimiter || ''}
              onChange={(e) => updateConfig({ 
                split: { 
                  ...config.split, 
                  delimiter: e.target.value 
                } 
              })}
              placeholder="e.g., , or | or ;"
            />
          </Form.Group>
        );

      case 'join':
        return (
          <Form.Group className="mb-3">
            <Form.Label>Separator</Form.Label>
            <Form.Control
              type="text"
              value={config.join?.separator || ''}
              onChange={(e) => updateConfig({ 
                join: { 
                  separator: e.target.value,
                  fields: config.join?.fields || []
                } 
              })}
              placeholder="e.g., , or | or ;"
            />
          </Form.Group>
        );

      case 'conditional':
        return (
          <>
            <Form.Group className="mb-3">
              <Form.Label>Condition</Form.Label>
              <Form.Control
                type="text"
                value={config.conditional?.condition || ''}
                onChange={(e) => updateConfig({ 
                  conditional: { 
                    condition: e.target.value,
                    trueValue: config.conditional?.trueValue || 'valid',
                    falseValue: config.conditional?.falseValue || 'invalid'
                  } 
                })}
                placeholder="e.g., data > 0"
              />
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>True Value</Form.Label>
                  <Form.Control
                    type="text"
                    value={config.conditional?.trueValue || ''}
                    onChange={(e) => updateConfig({ 
                      conditional: { 
                        condition: config.conditional?.condition || 'data !== null',
                        trueValue: e.target.value,
                        falseValue: config.conditional?.falseValue || 'invalid'
                      } 
                    })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>False Value</Form.Label>
                  <Form.Control
                    type="text"
                    value={config.conditional?.falseValue || ''}
                    onChange={(e) => updateConfig({ 
                      conditional: { 
                        condition: config.conditional?.condition || 'data !== null',
                        trueValue: config.conditional?.trueValue || 'valid',
                        falseValue: e.target.value
                      } 
                    })}
                  />
                </Form.Group>
              </Col>
            </Row>
          </>
        );

      case 'custom':
        return (
          <Form.Group className="mb-3">
            <Form.Label>JavaScript Code</Form.Label>
            <Form.Control
              as="textarea"
              rows={6}
              value={config.custom?.code || ''}
              onChange={(e) => updateConfig({ 
                custom: { 
                  ...config.custom, 
                  code: e.target.value 
                } 
              })}
              placeholder="return data.toUpperCase();"
              style={{ fontFamily: 'monospace' }}
            />
            <Form.Text className="text-muted">
              Write JavaScript code that transforms the input data. Use 'data' parameter and return the result.
            </Form.Text>
          </Form.Group>
        );

      default:
        return (
          <Alert variant="info">
            No configuration required for direct mapping.
          </Alert>
        );
    }
  };

  return (
    <div className="transformation-editor">
      <Row>
        <Col md={8}>
          <Card>
            <Card.Header className="bg-primary text-white">
              <h6 className="mb-0">Transformation Configuration</h6>
            </Card.Header>
            <Card.Body>
              <Form.Group className="mb-3">
                <Form.Label>Transformation Type</Form.Label>
                <Form.Select
                  value={transformationType}
                  onChange={(e) => setTransformationType(e.target.value as TransformationType)}
                >
                  <option value="direct">Direct (No transformation)</option>
                  <option value="format">Format Template</option>
                  <option value="convert">Type Conversion</option>
                  <option value="filter">Filter Data</option>
                  <option value="split">Split String</option>
                  <option value="join">Join Array</option>
                  <option value="conditional">Conditional Logic</option>
                  <option value="custom">Custom JavaScript</option>
                </Form.Select>
              </Form.Group>

              <Alert variant="info" className="mb-3">
                <strong>Description:</strong> {getTransformationDescription(transformationType)}
              </Alert>

              {renderConfigurationForm()}
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card>
            <Card.Header className="bg-light">
              <h6 className="mb-0">Test Transformation</h6>
            </Card.Header>
            <Card.Body>
              <Form.Group className="mb-3">
                <Form.Label>Test Input</Form.Label>
                <Form.Control
                  type="text"
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  placeholder="Enter test data"
                />
              </Form.Group>

              <Button
                variant="primary"
                size="sm"
                onClick={handleTestTransformation}
                className="mb-3 w-100"
              >
                Test Transform
              </Button>

              {testError && (
                <Alert variant="danger" className="mb-3">
                  <strong>Error:</strong> {testError}
                </Alert>
              )}

              {testOutput && (
                <Form.Group className="mb-3">
                  <Form.Label>Output</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={testOutput}
                    readOnly
                    style={{ backgroundColor: '#f8f9fa' }}
                  />
                </Form.Group>
              )}

              <div className="text-center">
                <Badge bg="primary">
                  {mapping.sourceField} → {mapping.targetField}
                </Badge>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default TransformationEditor;