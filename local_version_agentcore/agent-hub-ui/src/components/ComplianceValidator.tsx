import React, { useState, useEffect } from 'react';
import { Alert, Card, Badge, Button, ProgressBar, Modal, Table, Row, Col } from 'react-bootstrap';
import { complianceService, ComplianceResult, ComplianceViolation } from '../services/complianceService';
import { TemplateParameter } from '../services/templateService';

interface ComplianceValidatorProps {
  templateId: string;
  parameters: TemplateParameter[];
  values: Record<string, any>;
  onComplianceChange: (result: ComplianceResult) => void;
  autoValidate?: boolean;
}

const ComplianceValidator: React.FC<ComplianceValidatorProps> = ({
  templateId,
  parameters,
  values,
  onComplianceChange,
  autoValidate = true
}) => {
  const [complianceResult, setComplianceResult] = useState<ComplianceResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [lastValidation, setLastValidation] = useState<Date | null>(null);

  useEffect(() => {
    if (autoValidate && Object.keys(values).length > 0) {
      const debounceTimer = setTimeout(() => {
        validateCompliance();
      }, 1000); // Debounce validation

      return () => clearTimeout(debounceTimer);
    }
  }, [values, autoValidate]);

  const validateCompliance = async () => {
    try {
      setIsValidating(true);
      
      // Simulate compliance scanning
      const result = await complianceService.scanAgent(templateId, templateId);
      
      // Add parameter-specific compliance checks
      const parameterViolations = await validateParameterCompliance();
      
      const enhancedResult = {
        ...result,
        violations: [...result.violations, ...parameterViolations]
      };
      
      // Recalculate score based on all violations
      const totalViolations = enhancedResult.violations.length;
      const criticalViolations = enhancedResult.violations.filter(v => v.severity === 'Critical').length;
      const highViolations = enhancedResult.violations.filter(v => v.severity === 'High').length;
      
      let score = 100;
      score -= criticalViolations * 20;
      score -= highViolations * 10;
      score -= (totalViolations - criticalViolations - highViolations) * 5;
      score = Math.max(0, score);
      
      enhancedResult.score = score;
      enhancedResult.overallStatus = score >= 90 ? 'Compliant' : score >= 70 ? 'Warning' : 'Non-Compliant';
      
      setComplianceResult(enhancedResult);
      setLastValidation(new Date());
      onComplianceChange(enhancedResult);
      
    } catch (error) {
      console.error('Compliance validation failed:', error);
    } finally {
      setIsValidating(false);
    }
  };

  const validateParameterCompliance = async (): Promise<ComplianceViolation[]> => {
    const violations: ComplianceViolation[] = [];
    
    for (const param of parameters) {
      if (param.compliance && param.compliance.length > 0) {
        const value = values[param.name];
        
        for (const rule of param.compliance) {
          let hasViolation = false;
          let violationMessage = '';
          
          switch (rule.policyId) {
            case 'security-url-validation':
              if (value && !isValidUrl(value)) {
                hasViolation = true;
                violationMessage = `Invalid URL format in ${param.name}`;
              }
              break;
              
            case 'data-privacy':
              if (param.name.toLowerCase().includes('email') && value && !isValidEmail(value)) {
                hasViolation = true;
                violationMessage = `Invalid email format in ${param.name}`;
              }
              break;
              
            case 'security-secrets':
              if (param.type === 'secret' && (!value || value.length < 8)) {
                hasViolation = true;
                violationMessage = `Weak or missing secret in ${param.name}`;
              }
              break;
              
            case 'required-fields':
              if (param.required && (!value || value === '')) {
                hasViolation = true;
                violationMessage = `Required field ${param.name} is empty`;
              }
              break;
          }
          
          if (hasViolation) {
            violations.push({
              ruleId: rule.policyId,
              ruleName: `Parameter Compliance: ${param.name}`,
              severity: rule.severity,
              message: violationMessage,
              location: {
                file: 'wizard-configuration',
                line: 1,
                column: 1
              },
              remediation: `Please correct the ${param.name} field to meet compliance requirements`,
              status: 'Open',
              detectedAt: new Date()
            });
          }
        }
      }
    }
    
    return violations;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Compliant': return 'success';
      case 'Warning': return 'warning';
      case 'Non-Compliant': return 'danger';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Compliant': return '🛡️';
      case 'Warning': return '⚠️';
      case 'Non-Compliant': return '❌';
      default: return '🔍';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical': return 'danger';
      case 'High': return 'warning';
      case 'Medium': return 'info';
      case 'Low': return 'secondary';
      default: return 'light';
    }
  };

  const groupViolationsBySeverity = () => {
    if (!complianceResult) return {};
    
    return complianceResult.violations.reduce((groups, violation) => {
      const severity = violation.severity;
      if (!groups[severity]) {
        groups[severity] = [];
      }
      groups[severity].push(violation);
      return groups;
    }, {} as Record<string, ComplianceViolation[]>);
  };

  if (!complianceResult && !isValidating) {
    return (
      <Card className="border-info">
        <Card.Body className="text-center">
          <div className="mb-3">
            <span style={{ fontSize: '3rem' }}>🔍</span>
          </div>
          <h6>Compliance Validation</h6>
          <p className="text-muted mb-3">
            Run compliance validation to ensure your configuration meets all policy requirements.
          </p>
          <Button variant="primary" onClick={validateCompliance}>
            🛡️ Run Compliance Check
          </Button>
        </Card.Body>
      </Card>
    );
  }

  if (isValidating) {
    return (
      <Card className="border-primary">
        <Card.Body className="text-center">
          <div className="mb-3">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Validating...</span>
            </div>
          </div>
          <h6>Validating Compliance</h6>
          <p className="text-muted">
            Checking your configuration against compliance policies...
          </p>
        </Card.Body>
      </Card>
    );
  }

  const violationGroups = groupViolationsBySeverity();

  return (
    <div className="compliance-validator">
      {/* Main Status Card */}
      <Card className={`border-${getStatusColor(complianceResult!.overallStatus)} mb-3`}>
        <Card.Header className={`bg-${getStatusColor(complianceResult!.overallStatus)} bg-opacity-10`}>
          <div className="d-flex justify-content-between align-items-center">
            <h6 className="mb-0">
              {getStatusIcon(complianceResult!.overallStatus)} Compliance Status
            </h6>
            <div className="d-flex align-items-center gap-2">
              <Badge bg={getStatusColor(complianceResult!.overallStatus)}>
                {complianceResult!.overallStatus}
              </Badge>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={validateCompliance}
                disabled={isValidating}
              >
                🔄 Refresh
              </Button>
            </div>
          </div>
        </Card.Header>
        <Card.Body>
          <Row className="align-items-center">
            <Col md={8}>
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span>Compliance Score</span>
                  <strong>{complianceResult!.score}/100</strong>
                </div>
                <ProgressBar
                  variant={getStatusColor(complianceResult!.overallStatus)}
                  now={complianceResult!.score}
                  style={{ height: '8px' }}
                />
              </div>
              
              <div className="d-flex justify-content-between text-muted small">
                <span>Last checked: {lastValidation?.toLocaleTimeString()}</span>
                <span>{complianceResult!.violations.length} total issues</span>
              </div>
            </Col>
            
            <Col md={4} className="text-center">
              {complianceResult!.violations.length > 0 ? (
                <Button
                  variant="outline-warning"
                  onClick={() => setShowDetailsModal(true)}
                >
                  📋 View Details
                </Button>
              ) : (
                <div className="text-success">
                  <div style={{ fontSize: '2rem' }}>✅</div>
                  <small>All checks passed</small>
                </div>
              )}
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Violation Summary */}
      {complianceResult!.violations.length > 0 && (
        <Card className="mb-3">
          <Card.Header>
            <h6 className="mb-0">⚠️ Policy Violations Summary</h6>
          </Card.Header>
          <Card.Body>
            <Row>
              {Object.entries(violationGroups).map(([severity, violations]) => (
                <Col key={severity} md={3} className="text-center mb-3">
                  <div className={`p-3 rounded bg-${getSeverityColor(severity)} bg-opacity-10`}>
                    <div className={`h4 text-${getSeverityColor(severity)} mb-1`}>
                      {violations.length}
                    </div>
                    <div className="small text-muted">{severity}</div>
                  </div>
                </Col>
              ))}
            </Row>
            
            {complianceResult!.violations.slice(0, 3).map((violation, index) => (
              <Alert key={index} variant={getSeverityColor(violation.severity)} className="mb-2">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <strong>{violation.ruleName}</strong>
                    <div className="small">{violation.message}</div>
                  </div>
                  <Badge bg={getSeverityColor(violation.severity)}>
                    {violation.severity}
                  </Badge>
                </div>
              </Alert>
            ))}
            
            {complianceResult!.violations.length > 3 && (
              <div className="text-center">
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => setShowDetailsModal(true)}
                >
                  View {complianceResult!.violations.length - 3} more violations
                </Button>
              </div>
            )}
          </Card.Body>
        </Card>
      )}

      {/* Recommendations */}
      {complianceResult!.recommendations.length > 0 && (
        <Card>
          <Card.Header>
            <h6 className="mb-0">💡 Recommendations</h6>
          </Card.Header>
          <Card.Body>
            <ul className="mb-0">
              {complianceResult!.recommendations.map((recommendation, index) => (
                <li key={index} className="mb-1">{recommendation}</li>
              ))}
            </ul>
          </Card.Body>
        </Card>
      )}

      {/* Detailed Violations Modal */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>📋 Compliance Violation Details</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {complianceResult!.violations.length > 0 ? (
            <Table striped responsive>
              <thead>
                <tr>
                  <th>Severity</th>
                  <th>Rule</th>
                  <th>Message</th>
                  <th>Remediation</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {complianceResult!.violations.map((violation, index) => (
                  <tr key={index}>
                    <td>
                      <Badge bg={getSeverityColor(violation.severity)}>
                        {violation.severity}
                      </Badge>
                    </td>
                    <td>{violation.ruleName}</td>
                    <td>{violation.message}</td>
                    <td className="small text-muted">{violation.remediation}</td>
                    <td>
                      <Badge bg={violation.status === 'Open' ? 'warning' : 'success'}>
                        {violation.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <div className="text-center">
              <div style={{ fontSize: '3rem' }} className="mb-3">✅</div>
              <h5>No Violations Found</h5>
              <p className="text-muted">Your configuration meets all compliance requirements.</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={validateCompliance}>
            🔄 Re-validate
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

export default ComplianceValidator;