import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, Table, Alert, Modal, ProgressBar, Tab, Tabs } from 'react-bootstrap';
import { AgentTemplate } from '../services/templateService';
import { governanceService } from '../services/governanceService';

interface GovernanceInfoProps {
  template: AgentTemplate;
}

const GovernanceInfo: React.FC<GovernanceInfoProps> = ({ template }) => {
  const [versionHistory, setVersionHistory] = useState<any[]>([]);
  const [approvalHistory, setApprovalHistory] = useState<any[]>([]);
  const [auditTrail, setAuditTrail] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [activeTab, setActiveTab] = useState('status');

  useEffect(() => {
    loadGovernanceData();
  }, [template.id]);

  const loadGovernanceData = async () => {
    try {
      setLoading(true);
      
      // Load version history
      const versions = await governanceService.getVersionHistory(template.id);
      setVersionHistory(versions);
      
      // Load approval history
      const approvals = await governanceService.getApprovalHistory(template.id);
      setApprovalHistory(approvals);
      
      // Load audit trail
      const audit = await governanceService.getAuditTrail({
        resource: ['Template'],
        dateRange: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          end: new Date()
        }
      });
      setAuditTrail(audit.filter(entry => entry.resourceId.includes(template.id)));
      
    } catch (error) {
      console.error('Error loading governance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitForApproval = async () => {
    try {
      await governanceService.submitForApproval(template.id, 'Update');
      alert('Template submitted for approval successfully!');
      setShowApprovalModal(false);
      loadGovernanceData(); // Refresh data
    } catch (error) {
      console.error('Error submitting for approval:', error);
      alert('Failed to submit for approval. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'Approved': 'success',
      'Pending': 'warning',
      'Rejected': 'danger',
      'Draft': 'secondary'
    };
    return colors[status as keyof typeof colors] || 'secondary';
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      'Approved': '✅',
      'Pending': '⏳',
      'Rejected': '❌',
      'Draft': '📝'
    };
    return icons[status as keyof typeof icons] || '📋';
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading governance information...</span>
        </div>
        <p className="mt-2">Loading governance information...</p>
      </div>
    );
  }

  return (
    <div>
      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k || 'status')}
        className="mb-4"
      >
        {/* Governance Status Tab */}
        <Tab eventKey="status" title="📊 Status Overview">
          <div className="row">
            <div className="col-md-8">
              {/* Current Status */}
              <Card className="mb-4">
                <Card.Header>
                  <h5 className="mb-0">🏛️ Current Governance Status</h5>
                </Card.Header>
                <Card.Body>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <h6>Approval Status</h6>
                        <Badge 
                          bg={getStatusColor(template.approvalStatus)} 
                          className="d-flex align-items-center w-fit"
                        >
                          <span className="me-2">{getStatusIcon(template.approvalStatus)}</span>
                          {template.approvalStatus}
                        </Badge>
                        {template.approvedBy && (
                          <small className="text-muted d-block mt-1">
                            Approved by {template.approvedBy} on{' '}
                            {template.approvedAt && new Date(template.approvedAt).toLocaleDateString()}
                          </small>
                        )}
                      </div>
                    </div>
                    
                    <div className="col-md-6">
                      <div className="mb-3">
                        <h6>Version Control</h6>
                        <div className="d-flex align-items-center">
                          <Badge bg="info" className="me-2">v{template.version}</Badge>
                          <small className="text-muted">
                            {versionHistory.length} version{versionHistory.length !== 1 ? 's' : ''}
                          </small>
                        </div>
                        <small className="text-muted d-block">
                          Last updated: {new Date(template.updatedAt).toLocaleDateString()}
                        </small>
                      </div>
                    </div>
                  </div>
                  
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <h6>Compliance Status</h6>
                        <Badge 
                          bg={template.complianceStatus === 'Compliant' ? 'success' : 
                              template.complianceStatus === 'Under-Review' ? 'warning' : 'danger'}
                          className="d-flex align-items-center w-fit"
                        >
                          <span className="me-2">
                            {template.complianceStatus === 'Compliant' ? '🛡️' : 
                             template.complianceStatus === 'Under-Review' ? '🔍' : '⚠️'}
                          </span>
                          {template.complianceStatus}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="col-md-6">
                      <div className="mb-3">
                        <h6>Activity Level</h6>
                        <div className="d-flex align-items-center">
                          <Badge bg="success" className="me-2">Active</Badge>
                          <small className="text-muted">
                            {template.usageCount} uses this month
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card.Body>
              </Card>

              {/* Governance Actions */}
              <Card className="mb-4">
                <Card.Header>
                  <h5 className="mb-0">⚡ Governance Actions</h5>
                </Card.Header>
                <Card.Body>
                  <div className="d-grid gap-2 d-md-flex">
                    <Button 
                      variant="primary"
                      onClick={() => setShowApprovalModal(true)}
                      disabled={template.approvalStatus === 'Pending'}
                    >
                      📋 Submit for Approval
                    </Button>
                    
                    <Button variant="outline-info">
                      📊 View Full Audit Trail
                    </Button>
                    
                    <Button variant="outline-secondary">
                      🔄 Request Version Rollback
                    </Button>
                    
                    <Button variant="outline-warning">
                      🔒 Update Compliance Status
                    </Button>
                  </div>
                  
                  {template.approvalStatus === 'Pending' && (
                    <Alert variant="warning" className="mt-3 mb-0">
                      <strong>Pending Approval:</strong> This template is currently under review. 
                      No changes can be made until the approval process is complete.
                    </Alert>
                  )}
                </Card.Body>
              </Card>
            </div>

            <div className="col-md-4">
              {/* Governance Metrics */}
              <Card className="mb-4">
                <Card.Header>
                  <h5 className="mb-0">📈 Governance Metrics</h5>
                </Card.Header>
                <Card.Body>
                  <div className="mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <small>Approval Rate</small>
                      <small className="fw-bold">95%</small>
                    </div>
                    <ProgressBar variant="success" now={95} style={{ height: '8px' }} />
                  </div>
                  
                  <div className="mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <small>Compliance Score</small>
                      <small className="fw-bold">87%</small>
                    </div>
                    <ProgressBar variant="info" now={87} style={{ height: '8px' }} />
                  </div>
                  
                  <div className="mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <small>Version Stability</small>
                      <small className="fw-bold">92%</small>
                    </div>
                    <ProgressBar variant="primary" now={92} style={{ height: '8px' }} />
                  </div>
                  
                  <div className="text-center mt-3">
                    <Badge bg="success" className="px-3 py-2">
                      🏆 Governance Grade: A
                    </Badge>
                  </div>
                </Card.Body>
              </Card>

              {/* Recent Activity */}
              <Card>
                <Card.Header>
                  <h5 className="mb-0">🕒 Recent Activity</h5>
                </Card.Header>
                <Card.Body>
                  {auditTrail.slice(0, 5).map((entry, index) => (
                    <div key={index} className="mb-2 pb-2 border-bottom">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <small className="fw-bold">{entry.action}</small>
                          <div className="text-muted small">
                            by {entry.userName}
                          </div>
                        </div>
                        <small className="text-muted">
                          {new Date(entry.timestamp).toLocaleDateString()}
                        </small>
                      </div>
                    </div>
                  ))}
                  
                  {auditTrail.length === 0 && (
                    <p className="text-muted small mb-0">No recent activity</p>
                  )}
                </Card.Body>
              </Card>
            </div>
          </div>
        </Tab>

        {/* Version History Tab */}
        <Tab eventKey="versions" title="📚 Version History">
          <Card>
            <Card.Header>
              <h5 className="mb-0">📚 Version History</h5>
            </Card.Header>
            <Card.Body>
              {versionHistory.length > 0 ? (
                <Table responsive>
                  <thead>
                    <tr>
                      <th>Version</th>
                      <th>Author</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Changes</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {versionHistory.map((version, index) => (
                      <tr key={index}>
                        <td>
                          <Badge bg="info">v{version.version}</Badge>
                          {version.isActive && (
                            <Badge bg="success" className="ms-1">Current</Badge>
                          )}
                        </td>
                        <td>{version.author}</td>
                        <td>{new Date(version.createdAt).toLocaleDateString()}</td>
                        <td>
                          <Badge bg={getStatusColor(version.approvalStatus)}>
                            {getStatusIcon(version.approvalStatus)} {version.approvalStatus}
                          </Badge>
                        </td>
                        <td>
                          <small>{version.commitMessage}</small>
                          {version.changes && version.changes.length > 0 && (
                            <div className="mt-1">
                              {version.changes.slice(0, 2).map((change: any, idx: number) => (
                                <Badge key={idx} bg="light" text="dark" className="me-1 small">
                                  {change.type}: {change.component}
                                </Badge>
                              ))}
                              {version.changes.length > 2 && (
                                <Badge bg="light" text="dark" className="small">
                                  +{version.changes.length - 2} more
                                </Badge>
                              )}
                            </div>
                          )}
                        </td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            <Button variant="outline-primary" size="sm">
                              👁️ View
                            </Button>
                            {!version.isActive && (
                              <Button variant="outline-warning" size="sm">
                                🔄 Restore
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <p className="text-muted">No version history available.</p>
              )}
            </Card.Body>
          </Card>
        </Tab>

        {/* Approval History Tab */}
        <Tab eventKey="approvals" title="✅ Approval History">
          <Card>
            <Card.Header>
              <h5 className="mb-0">✅ Approval History</h5>
            </Card.Header>
            <Card.Body>
              {approvalHistory.length > 0 ? (
                <Table responsive>
                  <thead>
                    <tr>
                      <th>Request</th>
                      <th>Submitted By</th>
                      <th>Date</th>
                      <th>Status</th>
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
                          <Badge bg={getStatusColor(approval.newStatus)}>
                            {getStatusIcon(approval.newStatus)} {approval.newStatus}
                          </Badge>
                        </td>
                        <td>
                          <small>{approval.comments || 'No comments'}</small>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <p className="text-muted">No approval history available.</p>
              )}
            </Card.Body>
          </Card>
        </Tab>

        {/* Audit Trail Tab */}
        <Tab eventKey="audit" title="🔍 Audit Trail">
          <Card>
            <Card.Header>
              <h5 className="mb-0">🔍 Audit Trail</h5>
            </Card.Header>
            <Card.Body>
              {auditTrail.length > 0 ? (
                <Table responsive>
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>User</th>
                      <th>Action</th>
                      <th>Resource</th>
                      <th>Outcome</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditTrail.map((entry, index) => (
                      <tr key={index}>
                        <td>
                          <small>{new Date(entry.timestamp).toLocaleString()}</small>
                        </td>
                        <td>{entry.userName}</td>
                        <td>{entry.action}</td>
                        <td>
                          <Badge bg="light" text="dark">{entry.resource}</Badge>
                        </td>
                        <td>
                          <Badge 
                            bg={entry.outcome === 'Success' ? 'success' : 
                                entry.outcome === 'Warning' ? 'warning' : 'danger'}
                          >
                            {entry.outcome === 'Success' ? '✅' : 
                             entry.outcome === 'Warning' ? '⚠️' : '❌'} 
                            {entry.outcome}
                          </Badge>
                        </td>
                        <td>
                          <small>{JSON.stringify(entry.details).substring(0, 50)}...</small>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <p className="text-muted">No audit trail entries found.</p>
              )}
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>

      {/* Submit for Approval Modal */}
      <Modal show={showApprovalModal} onHide={() => setShowApprovalModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>📋 Submit Template for Approval</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info">
            <h6>Approval Process</h6>
            <p className="mb-0">
              Submitting this template for approval will initiate the governance review process. 
              The template will be reviewed by designated approvers based on your organization's policies.
            </p>
          </Alert>
          
          <div className="bg-light p-3 rounded">
            <h6>Review Checklist:</h6>
            <ul className="mb-0">
              <li>✅ Template functionality verified</li>
              <li>✅ Security requirements met</li>
              <li>✅ Compliance policies satisfied</li>
              <li>✅ Documentation complete</li>
              <li>✅ Testing completed</li>
            </ul>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowApprovalModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmitForApproval}>
            📋 Submit for Approval
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default GovernanceInfo;