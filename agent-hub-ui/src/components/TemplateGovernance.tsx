import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, Alert, Table, Modal, Form, Row, Col, ProgressBar } from 'react-bootstrap';
import { AgentTemplate } from '../services/templateService';
import { governanceService, ApprovalRequest } from '../services/governanceService';
import { complianceService, ComplianceResult } from '../services/complianceService';

interface TemplateGovernanceProps {
  template: AgentTemplate;
}

const TemplateGovernance: React.FC<TemplateGovernanceProps> = ({ template }) => {
  const [approvalHistory, setApprovalHistory] = useState<any[]>([]);
  const [complianceResult, setComplianceResult] = useState<ComplianceResult | null>(null);
  const [versionHistory, setVersionHistory] = useState<any[]>([]);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGovernanceData();
  }, [template.id]);

  const loadGovernanceData = async () => {
    try {
      setLoading(true);
      
      const [approvals, compliance, versions] = await Promise.all([
        governanceService.getApprovalHistory(template.id),
        complianceService.scanAgent(template.id, template.id),
        governanceService.getVersionHistory(template.id)
      ]);
      
      setApprovalHistory(approvals);
      setComplianceResult(compliance);
      setVersionHistory(versions);
    } catch (error) {
      console.error('Error loading governance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitForApproval = async () => {
    try {
      await governanceService.submitForApproval(template.id, 'Update');
      setShowApprovalModal(false);
      loadGovernanceData();
      alert('Template submitted for approval successfully!');
    } catch (error) {
      console.error('Error submitting for approval:', error);
      alert('Failed to submit for approval. Please try again.');
    }
  };

  const getApprovalStatusIcon = (status: string) => {
    const icons = {
      'Approved': '✓',
      'Pending': '○',
      'Rejected': '✗',
      'Draft': '•'
    };
    return icons[status as keyof typeof icons] || '?';
  };

  const getComplianceStatusIcon = (status: string) => {
    const icons = {
      'Compliant': '✓',
      'Non-Compliant': '!',
      'Under-Review': '○'
    };
    return icons[status as keyof typeof icons] || '?';
  };

  const getComplianceScore = () => {
    if (!complianceResult) return 0;
    return complianceResult.score;
  };

  const getComplianceColor = (score: number) => {
    if (score >= 90) return 'success';
    if (score >= 70) return 'warning';
    return 'danger';
  };

  if (loading) {
    return (
      <div className="text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading governance data...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Governance Overview */}
      <Row className="mb-4">
        <Col md={6}>
          <Card className="h-100">
            <Card.Header>
              <h5 className="mb-0">Approval Status</h5>
            </Card.Header>
            <Card.Body>
              <div className="text-center mb-3">
                <div style={{ fontSize: '3rem' }}>
                  {getApprovalStatusIcon(template.approvalStatus)}
                </div>
                <h4 className="mt-2">{template.approvalStatus}</h4>
                {template.approvedBy && (
                  <p className="text-muted">
                    Approved by {template.approvedBy}<br />
                    on {template.approvedAt ? new Date(template.approvedAt).toLocaleDateString() : 'N/A'}
                  </p>
                )}
              </div>
              
              {template.approvalStatus !== 'Approved' && (
                <div className="d-grid">
                  <Button
                    variant="primary"
                    onClick={() => setShowApprovalModal(true)}
                  >
                    Submit for Approval
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card className="h-100">
            <Card.Header>
              <h5 className="mb-0">Compliance Status</h5>
            </Card.Header>
            <Card.Body>
              <div className="text-center mb-3">
                <div style={{ fontSize: '3rem' }}>
                  {getComplianceStatusIcon(template.complianceStatus)}
                </div>
                <h4 className="mt-2">{template.complianceStatus}</h4>
                {complianceResult && (
                  <div>
                    <ProgressBar
                      variant={getComplianceColor(getComplianceScore())}
                      now={getComplianceScore()}
                      label={`${getComplianceScore()}%`}
                      className="mb-2"
                    />
                    <p className="text-muted">
                      Compliance Score: {getComplianceScore()}/100
                    </p>
                  </div>
                )}
              </div>
              
              <div className="d-grid">
                <Button
                  variant="outline-info"
                  onClick={() => loadGovernanceData()}
                >
                  Rescan Compliance
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Compliance Details */}
      {complianceResult && (
        <Card className="mb-4">
          <Card.Header>
            <h5 className="mb-0">Compliance Report</h5>
          </Card.Header>
          <Card.Body>
            {complianceResult.violations.length > 0 ? (
              <div>
                <Alert variant="warning">
                  <strong>Policy Violations Found:</strong> {complianceResult.violations.length} issues need attention.
                </Alert>
                
                <div className="table-responsive">
                  <Table striped size="sm">
                    <thead>
                      <tr>
                        <th>Severity</th>
                        <th>Rule</th>
                        <th>Message</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {complianceResult.violations.map((violation, index) => (
                        <tr key={index}>
                          <td>
                            <Badge bg={
                              violation.severity === 'Critical' ? 'danger' :
                              violation.severity === 'High' ? 'warning' :
                              violation.severity === 'Medium' ? 'info' : 'secondary'
                            }>
                              {violation.severity}
                            </Badge>
                          </td>
                          <td>{violation.ruleName}</td>
                          <td>{violation.message}</td>
                          <td>
                            <Badge bg={
                              violation.status === 'Resolved' ? 'success' :
                              violation.status === 'Acknowledged' ? 'info' : 'warning'
                            }>
                              {violation.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </div>
            ) : (
              <Alert variant="success">
                <strong>No Policy Violations Found</strong><br />
                This template meets all compliance requirements.
              </Alert>
            )}
            
            {complianceResult.recommendations.length > 0 && (
              <div className="mt-3">
                <h6>Recommendations:</h6>
                <ul>
                  {complianceResult.recommendations.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </Card.Body>
        </Card>
      )}

      {/* Version History */}
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">Version History</h5>
        </Card.Header>
        <Card.Body>
          {versionHistory.length > 0 ? (
            <div className="table-responsive">
              <Table striped size="sm">
                <thead>
                  <tr>
                    <th>Version</th>
                    <th>Author</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Changes</th>
                  </tr>
                </thead>
                <tbody>
                  {versionHistory.slice(0, 5).map((version, index) => (
                    <tr key={index}>
                      <td>
                        <Badge bg="primary">v{version.version}</Badge>
                        {version.isActive && (
                          <Badge bg="success" className="ms-1">Current</Badge>
                        )}
                      </td>
                      <td>{version.author}</td>
                      <td>{new Date(version.createdAt).toLocaleDateString()}</td>
                      <td>
                        <Badge bg={
                          version.approvalStatus === 'Approved' ? 'success' :
                          version.approvalStatus === 'Pending' ? 'warning' : 'secondary'
                        }>
                          {getApprovalStatusIcon(version.approvalStatus)} {version.approvalStatus}
                        </Badge>
                      </td>
                      <td>{version.commitMessage || 'No description'}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          ) : (
            <p className="text-muted">No version history available.</p>
          )}
        </Card.Body>
      </Card>

      {/* Approval History */}
      <Card>
        <Card.Header>
          <h5 className="mb-0">Approval History</h5>
        </Card.Header>
        <Card.Body>
          {approvalHistory.length > 0 ? (
            <div className="table-responsive">
              <Table striped size="sm">
                <thead>
                  <tr>
                    <th>Action</th>
                    <th>User</th>
                    <th>Date</th>
                    <th>Status Change</th>
                    <th>Comments</th>
                  </tr>
                </thead>
                <tbody>
                  {approvalHistory.map((approval, index) => (
                    <tr key={index}>
                      <td>{approval.action}</td>
                      <td>{approval.user}</td>
                      <td>{new Date(approval.timestamp).toLocaleDateString()}</td>
                      <td>
                        <Badge bg="light" text="dark" className="me-1">
                          {approval.previousStatus}
                        </Badge>
                        →
                        <Badge bg="primary" className="ms-1">
                          {approval.newStatus}
                        </Badge>
                      </td>
                      <td>{approval.comments || 'No comments'}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          ) : (
            <p className="text-muted">No approval history available.</p>
          )}
        </Card.Body>
      </Card>

      {/* Approval Modal */}
      <Modal show={showApprovalModal} onHide={() => setShowApprovalModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Submit for Approval</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info">
            <strong>Template Approval Request</strong><br />
            This will submit the template for review by the governance team.
          </Alert>
          
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Request Type</Form.Label>
              <Form.Select>
                <option value="Update">Template Update</option>
                <option value="Creation">New Template</option>
                <option value="Deployment">Deployment Approval</option>
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Comments (Optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Describe the changes or provide additional context..."
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowApprovalModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmitForApproval}>
            Submit for Approval
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default TemplateGovernance;