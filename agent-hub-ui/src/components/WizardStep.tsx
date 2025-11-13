import React, { useState } from 'react';
import { Form, Row, Col, Alert, Card, Badge, Button, Modal } from 'react-bootstrap';
import { AgentTemplate } from '../services/templateService';
import CodeHighlighter from './CodeHighlighter';
import ParameterForm from './ParameterForm';
import ComplianceValidator from './ComplianceValidator';
import ConditionalFieldRenderer from './ConditionalFieldRenderer';

interface WizardStepProps {
  step: any;
  values: Record<string, any>;
  errors: Record<string, string[]>;
  onValueChange: (field: string, value: any) => void;
  template: AgentTemplate;
  complianceStatus?: any;
}

const WizardStep: React.FC<WizardStepProps> = ({
  step,
  values,
  errors,
  onValueChange,
  template,
  complianceStatus
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const [previewCode, setPreviewCode] = useState<string>('');

  const renderParameterInput = (param: any) => {
    const hasError = errors[param.name] && errors[param.name].length > 0;
    const value = values[param.name] || '';

    const handleChange = (newValue: any) => {
      onValueChange(param.name, newValue);
    };

    const getInputComponent = () => {
      switch (param.type) {
        case 'select':
          return (
            <Form.Select
              value={value}
              onChange={(e) => handleChange(e.target.value)}
              isInvalid={hasError}
            >
              <option value="">Select {param.name}...</option>
              {param.options?.map((option: any, index: number) => (
                <option key={index} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Form.Select>
          );

        case 'multiselect':
          return (
            <div>
              {param.options?.map((option: any, index: number) => (
                <Form.Check
                  key={index}
                  type="checkbox"
                  id={`${param.name}-${index}`}
                  label={option.label}
                  checked={Array.isArray(value) && value.includes(option.value)}
                  onChange={(e) => {
                    const currentValues = Array.isArray(value) ? value : [];
                    if (e.target.checked) {
                      handleChange([...currentValues, option.value]);
                    } else {
                      handleChange(currentValues.filter((v: any) => v !== option.value));
                    }
                  }}
                />
              ))}
            </div>
          );

        case 'boolean':
          return (
            <Form.Check
              type="checkbox"
              id={param.name}
              label={param.description}
              checked={Boolean(value)}
              onChange={(e) => handleChange(e.target.checked)}
            />
          );

        case 'number':
          return (
            <Form.Control
              type="number"
              value={value}
              onChange={(e) => handleChange(parseInt(e.target.value) || 0)}
              placeholder={param.description}
              isInvalid={hasError}
            />
          );

        case 'secret':
          return (
            <Form.Control
              type="password"
              value={value}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={param.description}
              isInvalid={hasError}
            />
          );

        case 'file':
          return (
            <Form.Control
              type="file"
              onChange={(e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    handleChange(event.target?.result);
                  };
                  reader.readAsText(file);
                }
              }}
              isInvalid={hasError}
            />
          );

        default:
          return (
            <Form.Control
              type="text"
              value={value}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={param.description}
              isInvalid={hasError}
            />
          );
      }
    };

    return (
      <Form.Group key={param.name} className="mb-3">
        <Form.Label className="d-flex align-items-center">
          <strong>{param.name}</strong>
          {param.required && <span className="text-danger ms-1">*</span>}
          {param.compliance && param.compliance.length > 0 && (
            <Badge bg="warning" className="ms-2 small">
              Compliance Required
            </Badge>
          )}
        </Form.Label>
        
        {param.description && (
          <Form.Text className="text-muted d-block mb-2">
            {param.description}
          </Form.Text>
        )}
        
        {getInputComponent()}
        
        {hasError && (
          <Form.Control.Feedback type="invalid" className="d-block">
            {errors[param.name].join(', ')}
          </Form.Control.Feedback>
        )}
        
        {param.validation && (
          <Form.Text className="text-muted">
            {param.validation.map((rule: any, index: number) => (
              <small key={index} className="d-block">
                {rule.message}
              </small>
            ))}
          </Form.Text>
        )}
      </Form.Group>
    );
  };

  const renderGovernanceReview = () => {
    return (
      <div>
        <Alert variant="info" className="mb-4">
          <h5>Governance Review</h5>
          <p className="mb-0">
            Your agent configuration is being reviewed for compliance and governance requirements.
          </p>
        </Alert>

        {/* Compliance Status */}
        {complianceStatus && (
          <Card className="mb-4">
            <Card.Header>
              <h6 className="mb-0">Compliance Check Results</h6>
            </Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span>Overall Status:</span>
                <Badge 
                  bg={complianceStatus.overallStatus === 'Compliant' ? 'success' : 
                      complianceStatus.overallStatus === 'Warning' ? 'warning' : 'danger'}
                  className="px-3 py-2"
                >
                  {complianceStatus.overallStatus}
                </Badge>
              </div>
              
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span>Compliance Score:</span>
                <strong>{complianceStatus.score}/100</strong>
              </div>
              
              {complianceStatus.violations && complianceStatus.violations.length > 0 && (
                <div>
                  <h6 className="text-warning">Policy Violations</h6>
                  {complianceStatus.violations.map((violation: any, index: number) => (
                    <Alert key={index} variant="warning" className="small">
                      <strong>{violation.severity}:</strong> {violation.message}
                      <br />
                      <em>Remediation: {violation.remediation}</em>
                    </Alert>
                  ))}
                </div>
              )}
              
              {complianceStatus.recommendations && complianceStatus.recommendations.length > 0 && (
                <div className="mt-3">
                  <h6>Recommendations</h6>
                  <ul className="small">
                    {complianceStatus.recommendations.map((rec: string, index: number) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </Card.Body>
          </Card>
        )}

        {/* Template Approval Status */}
        <Card className="mb-4">
          <Card.Header>
            <h6 className="mb-0">Template Approval</h6>
          </Card.Header>
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span>Template Status:</span>
              <Badge bg="success">Approved</Badge>
            </div>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span>Approved By:</span>
              <span>{template.approvedBy || 'System'}</span>
            </div>
            <div className="d-flex justify-content-between align-items-center">
              <span>Approval Date:</span>
              <span>{template.approvedAt ? new Date(template.approvedAt).toLocaleDateString() : 'N/A'}</span>
            </div>
          </Card.Body>
        </Card>

        {/* Configuration Summary */}
        <Card>
          <Card.Header>
            <h6 className="mb-0">Configuration Summary</h6>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={6}>
                <div className="mb-2">
                  <strong>Agent Name:</strong>
                  <br />
                  <span className="text-muted">{values.agentName || 'Unnamed Agent'}</span>
                </div>
                <div className="mb-2">
                  <strong>Template:</strong>
                  <br />
                  <span className="text-muted">{template.name}</span>
                </div>
                <div className="mb-2">
                  <strong>Category:</strong>
                  <br />
                  <Badge bg="primary">{template.category}</Badge>
                </div>
              </Col>
              <Col md={6}>
                <div className="mb-2">
                  <strong>Parameters Configured:</strong>
                  <br />
                  <span className="text-muted">
                    {Object.keys(values).filter(key => values[key] !== '' && values[key] !== null).length} parameters
                  </span>
                </div>
                <div className="mb-2">
                  <strong>Technologies:</strong>
                  <br />
                  <div>
                    {template.technologies.slice(0, 3).map((tech, index) => (
                      <Badge key={index} bg="light" text="dark" className="me-1 mb-1">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </div>
    );
  };

  const renderPreviewDeploy = () => {
    const generatePreview = async () => {
      try {
        // Simulate code generation preview
        const preview = `# Generated Agent: ${values.agentName || 'New Agent'}
# Template: ${template.name}
# Category: ${template.category}

import os
import json
from datetime import datetime

class ${(values.agentName || 'NewAgent').replace(/\s+/g, '')}:
    def __init__(self):
        self.config = {
${Object.entries(values).map(([key, value]) => 
  `            "${key}": ${JSON.stringify(value)}`
).join(',\n')}
        }
        
    def execute(self):
        """Main execution method"""
        print(f"Starting {self.config.get('agentName', 'Agent')}...")
        
        # Your agent logic will be generated here
        # Based on template: ${template.name}
        
        return {
            "status": "success",
            "timestamp": datetime.now().isoformat(),
            "config": self.config
        }

if __name__ == "__main__":
    agent = ${(values.agentName || 'NewAgent').replace(/\s+/g, '')}()
    result = agent.execute()
    print(json.dumps(result, indent=2))`;
        
        setPreviewCode(preview);
        setShowPreview(true);
      } catch (error) {
        console.error('Preview generation failed:', error);
      }
    };

    return (
      <div>
        <Alert variant="success" className="mb-4">
          <h5>Ready to Deploy</h5>
          <p className="mb-0">
            Your agent configuration is complete and ready for deployment.
          </p>
        </Alert>

        {/* Final Configuration Review */}
        <Card className="mb-4">
          <Card.Header>
            <h6 className="mb-0">Final Configuration</h6>
          </Card.Header>
          <Card.Body>
            <Row>
              {Object.entries(values).filter(([key, value]) => value !== '' && value !== null).map(([key, value]) => (
                <Col key={key} md={6} className="mb-2">
                  <strong>{key}:</strong>
                  <br />
                  <span className="text-muted">
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </span>
                </Col>
              ))}
            </Row>
          </Card.Body>
        </Card>

        {/* Preview Actions */}
        <Card>
          <Card.Header>
            <h6 className="mb-0">Code Preview</h6>
          </Card.Header>
          <Card.Body>
            <p className="text-muted mb-3">
              Preview the generated agent code before deployment.
            </p>
            <Button variant="outline-primary" onClick={generatePreview}>
              Generate Preview
            </Button>
          </Card.Body>
        </Card>

        {/* Preview Modal */}
        <Modal show={showPreview} onHide={() => setShowPreview(false)} size="lg" centered>
          <Modal.Header closeButton>
            <Modal.Title>Generated Code Preview</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Alert variant="info">
              <strong>Preview:</strong> This is a sample of the code that will be generated for your agent.
            </Alert>
            <CodeHighlighter 
              code={previewCode} 
              language="python"
              title="Generated Agent Code"
            />
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowPreview(false)}>
              Close Preview
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    );
  };

  // Render step content based on step type
  const renderStepContent = () => {
    if (step.id === 'governance-review') {
      return renderGovernanceReview();
    }
    
    if (step.id === 'preview-deploy') {
      return renderPreviewDeploy();
    }
    
    // Regular parameter step
    return (
      <div>
        {step.parameters.length > 0 ? (
          <ConditionalFieldRenderer
            parameters={step.parameters}
            values={values}
            onVisibilityChange={(param, isVisible) => {
              // Handle field visibility changes
              if (!isVisible && values[param]) {
                // Clear value when field becomes hidden
                onValueChange(param, '');
              }
            }}
          >
            {(visibleParameters) => (
              <ParameterForm
                parameters={visibleParameters}
                values={values}
                errors={errors}
                onValueChange={onValueChange}
                onValidationChange={(field, isValid) => {
                  // Handle validation changes
                  console.log(`Field ${field} validation:`, isValid);
                }}
                governanceMode={step.governanceCheckpoint || false}
                complianceRules={template.parameters.flatMap(p => p.compliance || [])}
              />
            )}
          </ConditionalFieldRenderer>
        ) : (
          <Alert variant="info">
            No additional configuration required for this step.
          </Alert>
        )}
        
        {/* Add compliance validator for governance steps */}
        {step.governanceCheckpoint && (
          <div className="mt-4">
            <ComplianceValidator
              templateId={template.id}
              parameters={step.parameters}
              values={values}
              onComplianceChange={(result) => {
                // Handle compliance changes
                console.log('Compliance result:', result);
              }}
              autoValidate={true}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="wizard-step">
      {renderStepContent()}
    </div>
  );
};

export default WizardStep;