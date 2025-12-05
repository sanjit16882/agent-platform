import React, { useState, useEffect } from 'react';
import { Form, Row, Col, Alert, Card, Badge, Button, Modal, Tooltip, OverlayTrigger } from 'react-bootstrap';
import { TemplateParameter } from '../services/templateService';
import { complianceService } from '../services/complianceService';
import { governanceService } from '../services/governanceService';

interface ParameterFormProps {
  parameters: TemplateParameter[];
  values: Record<string, any>;
  errors: Record<string, string[]>;
  onValueChange: (field: string, value: any) => void;
  onValidationChange: (field: string, isValid: boolean) => void;
  governanceMode?: boolean;
  complianceRules?: any[];
}

const ParameterForm: React.FC<ParameterFormProps> = ({
  parameters,
  values,
  errors,
  onValueChange,
  onValidationChange,
  governanceMode = false,
  complianceRules = []
}) => {
  const [fieldValidation, setFieldValidation] = useState<Record<string, any>>({});
  const [complianceStatus, setComplianceStatus] = useState<Record<string, any>>({});
  const [showComplianceModal, setShowComplianceModal] = useState(false);
  const [selectedField, setSelectedField] = useState<string>('');

  useEffect(() => {
    // Run compliance validation when values change
    if (governanceMode) {
      validateCompliance();
    }
  }, [values, governanceMode]);

  const validateCompliance = async () => {
    const status: Record<string, any> = {};
    
    for (const param of parameters) {
      if (param.compliance && param.compliance.length > 0) {
        const value = values[param.name];
        if (value) {
          // Simulate compliance validation
          const violations = param.compliance.filter(rule => {
            // Simple compliance rule checking
            if (rule.policyId === 'security-url-validation' && param.type === 'string') {
              return !isValidUrl(value);
            }
            if (rule.policyId === 'data-privacy' && param.name.toLowerCase().includes('email')) {
              return !isValidEmail(value);
            }
            return false;
          });
          
          status[param.name] = {
            isCompliant: violations.length === 0,
            violations,
            lastChecked: new Date()
          };
        }
      }
    }
    
    setComplianceStatus(status);
  };

  const handleValueChange = async (param: TemplateParameter, value: any) => {
    // Update value
    onValueChange(param.name, value);
    
    // Run field validation
    const validation = await validateField(param, value);
    setFieldValidation(prev => ({
      ...prev,
      [param.name]: validation
    }));
    
    // Notify parent of validation status
    onValidationChange(param.name, validation.isValid);
  };

  const validateField = async (param: TemplateParameter, value: any): Promise<any> => {
    const validation = {
      isValid: true,
      errors: [] as string[],
      warnings: [] as string[],
      suggestions: [] as string[]
    };

    // Required field validation
    if (param.required && (!value || value === '')) {
      validation.isValid = false;
      validation.errors.push(`${param.name} is required`);
    }

    // Type-specific validation
    if (value && value !== '') {
      switch (param.type) {
        case 'string':
          if (param.validation) {
            for (const rule of param.validation) {
              switch (rule.type) {
                case 'url':
                  if (!isValidUrl(value)) {
                    validation.isValid = false;
                    validation.errors.push('Must be a valid URL');
                  }
                  break;
                case 'email':
                  if (!isValidEmail(value)) {
                    validation.isValid = false;
                    validation.errors.push('Must be a valid email address');
                  }
                  break;
                case 'minLength':
                  if (value.length < rule.value) {
                    validation.isValid = false;
                    validation.errors.push(`Must be at least ${rule.value} characters`);
                  }
                  break;
                case 'maxLength':
                  if (value.length > rule.value) {
                    validation.isValid = false;
                    validation.errors.push(`Must be no more than ${rule.value} characters`);
                  }
                  break;
                case 'pattern':
                  const regex = new RegExp(rule.value);
                  if (!regex.test(value)) {
                    validation.isValid = false;
                    validation.errors.push(rule.message || 'Invalid format');
                  }
                  break;
              }
            }
          }
          break;
          
        case 'number':
          const numValue = Number(value);
          if (isNaN(numValue)) {
            validation.isValid = false;
            validation.errors.push('Must be a valid number');
          }
          break;
      }
    }

    // Governance-specific validation
    if (governanceMode && param.compliance) {
      for (const rule of param.compliance) {
        if (rule.severity === 'Critical' && !value) {
          validation.isValid = false;
          validation.errors.push(`Critical compliance requirement: ${rule.description}`);
        } else if (rule.severity === 'High' && !value) {
          validation.warnings.push(`High priority compliance: ${rule.description}`);
        }
      }
    }

    // Smart suggestions
    if (param.name.toLowerCase().includes('url') && value && !value.startsWith('http')) {
      validation.suggestions.push('Consider adding https:// prefix');
    }
    
    if (param.name.toLowerCase().includes('timeout') && Number(value) > 30000) {
      validation.warnings.push('High timeout values may impact performance');
    }

    return validation;
  };

  const renderFieldInput = (param: TemplateParameter) => {
    const value = values[param.name] || '';
    const hasError = errors[param.name] && errors[param.name].length > 0;
    const validation = fieldValidation[param.name];
    const compliance = complianceStatus[param.name];
    
    const getInputComponent = () => {
      const commonProps = {
        value: param.type === 'boolean' ? undefined : value,
        onChange: (e: any) => {
          const newValue = param.type === 'boolean' ? e.target.checked :
                          param.type === 'number' ? (parseInt(e.target.value) || 0) :
                          e.target.value;
          handleValueChange(param, newValue);
        },
        isInvalid: hasError || (validation && !validation.isValid),
        className: `${compliance && !compliance.isCompliant ? 'border-warning' : ''}`
      };

      switch (param.type) {
        case 'select':
          return (
            <Form.Select {...commonProps}>
              <option value="">Select {param.name}...</option>
              {param.options?.map((option, index) => (
                <option key={index} value={option.value} disabled={option.disabled}>
                  {option.label}
                  {option.description && ` - ${option.description}`}
                </option>
              ))}
            </Form.Select>
          );

        case 'multiselect':
          return (
            <div className="border rounded p-2" style={{ maxHeight: '150px', overflowY: 'auto' }}>
              {param.options?.map((option, index) => (
                <Form.Check
                  key={index}
                  type="checkbox"
                  id={`${param.name}-${index}`}
                  label={
                    <div>
                      <strong>{option.label}</strong>
                      {option.description && (
                        <div className="small text-muted">{option.description}</div>
                      )}
                    </div>
                  }
                  checked={Array.isArray(value) && value.includes(option.value)}
                  onChange={(e) => {
                    const currentValues = Array.isArray(value) ? value : [];
                    const newValue = e.target.checked
                      ? [...currentValues, option.value]
                      : currentValues.filter((v: any) => v !== option.value);
                    handleValueChange(param, newValue);
                  }}
                  disabled={option.disabled}
                  className="mb-2"
                />
              ))}
            </div>
          );

        case 'boolean':
          return (
            <div className="d-flex align-items-center">
              <Form.Check
                type="checkbox"
                id={param.name}
                checked={Boolean(value)}
                onChange={(e) => handleValueChange(param, e.target.checked)}
                className="me-2"
              />
              <Form.Label htmlFor={param.name} className="mb-0">
                {param.description || `Enable ${param.name}`}
              </Form.Label>
            </div>
          );

        case 'number':
          return (
            <Form.Control
              type="number"
              {...commonProps}
              placeholder={param.description}
            />
          );

        case 'secret':
          return (
            <div>
              <Form.Control
                type="password"
                {...commonProps}
                placeholder={param.description}
              />
              {governanceMode && (
                <Form.Text className="text-warning">
                  🔒 This field contains sensitive data and will be encrypted
                </Form.Text>
              )}
            </div>
          );

        case 'file':
          return (
            <div>
              <Form.Control
                type="file"
                onChange={(e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      handleValueChange(param, {
                        name: file.name,
                        content: event.target?.result,
                        size: file.size,
                        type: file.type
                      });
                    };
                    reader.readAsText(file);
                  }
                }}
                accept={param.validation?.find((v: any) => v.type === 'fileType')?.value}
              />
              {value && typeof value === 'object' && value.name && (
                <Form.Text className="text-success">
                  ✅ File loaded: {value.name} ({(value.size / 1024).toFixed(1)} KB)
                </Form.Text>
              )}
            </div>
          );

        default:
          return (
            <Form.Control
              type="text"
              {...commonProps}
              placeholder={param.description}
            />
          );
      }
    };

    return (
      <div key={param.name} className={`parameter-field ${param.required ? 'required' : ''} ${param.compliance ? 'compliance' : ''}`}>
        <Form.Group className="mb-4">
          {/* Field Label with Indicators */}
          <Form.Label className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center">
              <strong>{param.name}</strong>
              {param.required && <span className="text-danger ms-1">*</span>}
              
              {/* Compliance Indicator */}
              {param.compliance && param.compliance.length > 0 && (
                <OverlayTrigger
                  placement="top"
                  overlay={
                    <Tooltip>
                      Compliance rules apply to this field
                    </Tooltip>
                  }
                >
                  <Badge 
                    bg={compliance && compliance.isCompliant ? 'success' : 'warning'} 
                    className="ms-2 small"
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      setSelectedField(param.name);
                      setShowComplianceModal(true);
                    }}
                  >
                    🛡️ Compliance
                  </Badge>
                </OverlayTrigger>
              )}
              
              {/* Governance Mode Indicator */}
              {governanceMode && (
                <Badge bg="info" className="ms-2 small">
                  🏛️ Governed
                </Badge>
              )}
            </div>
            
            {/* Field Status Indicators */}
            <div className="d-flex align-items-center gap-1">
              {validation && validation.isValid && (
                <Badge bg="success" className="small">✅</Badge>
              )}
              {validation && !validation.isValid && (
                <Badge bg="danger" className="small">❌</Badge>
              )}
              {validation && validation.warnings.length > 0 && (
                <Badge bg="warning" className="small">⚠️</Badge>
              )}
            </div>
          </Form.Label>
          
          {/* Field Description */}
          {param.description && (
            <Form.Text className="text-muted d-block mb-2">
              {param.description}
            </Form.Text>
          )}
          
          {/* Input Component */}
          {getInputComponent()}
          
          {/* Validation Messages */}
          {validation && validation.errors.length > 0 && (
            <div className="invalid-feedback d-block">
              {validation.errors.map((error: any, index: number) => (
                <div key={index}>❌ {error}</div>
              ))}
            </div>
          )}
          
          {validation && validation.warnings.length > 0 && (
            <div className="text-warning small mt-1">
              {validation.warnings.map((warning: any, index: number) => (
                <div key={index}>⚠️ {warning}</div>
              ))}
            </div>
          )}
          
          {validation && validation.suggestions.length > 0 && (
            <div className="text-info small mt-1">
              {validation.suggestions.map((suggestion: any, index: number) => (
                <div key={index}>💡 {suggestion}</div>
              ))}
            </div>
          )}
          
          {/* Compliance Status */}
          {compliance && (
            <div className={`mt-2 p-2 rounded ${compliance.isCompliant ? 'bg-success bg-opacity-10' : 'bg-warning bg-opacity-10'}`}>
              <small className={compliance.isCompliant ? 'text-success' : 'text-warning'}>
                {compliance.isCompliant ? '🛡️ Compliant' : '⚠️ Compliance Issues'}
                {compliance.violations && compliance.violations.length > 0 && (
                  <span> - {compliance.violations.length} violation(s)</span>
                )}
              </small>
            </div>
          )}
          
          {/* Conditional Logic Helper */}
          {param.conditional && (
            <Form.Text className="text-muted">
              <small>
                💡 This field visibility depends on other selections
              </small>
            </Form.Text>
          )}
        </Form.Group>
      </div>
    );
  };

  const groupParametersByType = () => {
    const groups = {
      required: parameters.filter(p => p.required),
      compliance: parameters.filter(p => p.compliance && p.compliance.length > 0 && !p.required),
      optional: parameters.filter(p => !p.required && (!p.compliance || p.compliance.length === 0))
    };
    
    return groups;
  };

  const groups = groupParametersByType();

  return (
    <div className="parameter-form">
      {/* Required Parameters */}
      {groups.required.length > 0 && (
        <Card className="mb-4 border-danger">
          <Card.Header className="bg-danger bg-opacity-10">
            <h6 className="mb-0 text-danger">
              <strong>Required Parameters</strong>
              <Badge bg="danger" className="ms-2">{groups.required.length}</Badge>
            </h6>
          </Card.Header>
          <Card.Body>
            <Row>
              {groups.required.map((param, index) => (
                <Col key={param.name} md={index % 2 === 0 ? 12 : 12} lg={6}>
                  {renderFieldInput(param)}
                </Col>
              ))}
            </Row>
          </Card.Body>
        </Card>
      )}

      {/* Compliance Parameters */}
      {groups.compliance.length > 0 && (
        <Card className="mb-4 border-warning">
          <Card.Header className="bg-warning bg-opacity-10">
            <h6 className="mb-0 text-warning">
              <strong>🛡️ Compliance Parameters</strong>
              <Badge bg="warning" className="ms-2">{groups.compliance.length}</Badge>
            </h6>
          </Card.Header>
          <Card.Body>
            <Alert variant="warning" className="mb-3">
              <small>
                <strong>Governance Notice:</strong> These parameters have compliance requirements that must be met.
              </small>
            </Alert>
            <Row>
              {groups.compliance.map((param, index) => (
                <Col key={param.name} md={index % 2 === 0 ? 12 : 12} lg={6}>
                  {renderFieldInput(param)}
                </Col>
              ))}
            </Row>
          </Card.Body>
        </Card>
      )}

      {/* Optional Parameters */}
      {groups.optional.length > 0 && (
        <Card className="mb-4">
          <Card.Header className="bg-light">
            <h6 className="mb-0 text-muted">
              <strong>Optional Parameters</strong>
              <Badge bg="secondary" className="ms-2">{groups.optional.length}</Badge>
            </h6>
          </Card.Header>
          <Card.Body>
            <Row>
              {groups.optional.map((param, index) => (
                <Col key={param.name} md={index % 2 === 0 ? 12 : 12} lg={6}>
                  {renderFieldInput(param)}
                </Col>
              ))}
            </Row>
          </Card.Body>
        </Card>
      )}

      {/* Compliance Details Modal */}
      <Modal show={showComplianceModal} onHide={() => setShowComplianceModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>🛡️ Compliance Details: {selectedField}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedField && parameters.find(p => p.name === selectedField)?.compliance && (
            <div>
              <Alert variant="info">
                <strong>Compliance Requirements</strong><br />
                This field must meet the following compliance standards:
              </Alert>
              
              {parameters.find(p => p.name === selectedField)?.compliance?.map((rule, index) => (
                <Card key={index} className="mb-3">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h6>{rule.policyId}</h6>
                      <Badge bg={
                        rule.severity === 'Critical' ? 'danger' :
                        rule.severity === 'High' ? 'warning' :
                        rule.severity === 'Medium' ? 'info' : 'secondary'
                      }>
                        {rule.severity}
                      </Badge>
                    </div>
                    <p className="mb-0">{rule.description}</p>
                  </Card.Body>
                </Card>
              ))}
              
              {complianceStatus[selectedField] && (
                <Alert variant={complianceStatus[selectedField].isCompliant ? 'success' : 'warning'}>
                  <strong>Current Status:</strong> {complianceStatus[selectedField].isCompliant ? 'Compliant' : 'Non-Compliant'}
                  <br />
                  <small>Last checked: {complianceStatus[selectedField].lastChecked.toLocaleString()}</small>
                </Alert>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowComplianceModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );

  // Utility functions
  function isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
};

export default ParameterForm;