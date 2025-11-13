/**
 * VectorDBAdminDashboard
 * 
 * Admin dashboard for reviewing and approving Vector DB access requests
 */

import React, { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Badge, Button, Alert, Spinner, Modal, Form, Tabs, Tab } from 'react-bootstrap';
import { AccessRequest } from '../types/vectorDB';
import api from '../utils/apiClient';

const VectorDBAdminDashboard: React.FC = () => {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<AccessRequest | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [comments, setComments] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/v1/vector-db/access-requests');
      const data = await response.json();
      
      if (data.success) {
        setRequests(data.data);
      } else {
        setError('Failed to load requests');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;
    
    try {
      setProcessing(true);
      const response = await fetch(
        `http://localhost:3002/api/v1/vector-db/access-requests/${selectedRequest.id}/approve`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ comments })
        }
      );
      
      const data = await response.json();
      
      if (data.success) {
        await fetchRequests();
        setShowApproveModal(false);
        setComments('');
        setSelectedRequest(null);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectionReason.trim()) return;
    
    try {
      setProcessing(true);
      const response = await fetch(
        `http://localhost:3002/api/v1/vector-db/access-requests/${selectedRequest.id}/reject`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: rejectionReason })
        }
      );
      
      const data = await response.json();
      
      if (data.success) {
        await fetchRequests();
        setShowRejectModal(false);
        setRejectionReason('');
        setSelectedRequest(null);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: 'warning',
      approved: 'success',
      rejected: 'danger',
      deployed: 'info'
    };
    return <Badge bg={variants[status] || 'secondary'}>{status.toUpperCase()}</Badge>;
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffMins > 0) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const approvedRequests = requests.filter(r => r.status === 'approved');
  const rejectedRequests = requests.filter(r => r.status === 'rejected');
  const deployedRequests = requests.filter(r => r.status === 'deployed');

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading access requests...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <Alert.Heading>Error Loading Requests</Alert.Heading>
          <p>{error}</p>
          <Button variant="outline-danger" onClick={fetchRequests}>Retry</Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <div className="mb-4">
        <h2>🔐 Vector DB Access Requests</h2>
        <p className="text-muted">Review and approve marketplace provider access requests</p>
      </div>

      {/* Statistics */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h3 className="text-warning">{pendingRequests.length}</h3>
              <p className="mb-0 text-muted">Pending</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h3 className="text-success">{approvedRequests.length}</h3>
              <p className="mb-0 text-muted">Approved</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h3 className="text-danger">{rejectedRequests.length}</h3>
              <p className="mb-0 text-muted">Rejected</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h3 className="text-info">{deployedRequests.length}</h3>
              <p className="mb-0 text-muted">Deployed</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Tabs for different statuses */}
      <Tabs defaultActiveKey="pending" className="mb-3">
        <Tab eventKey="pending" title={`Pending (${pendingRequests.length})`}>
          {pendingRequests.length === 0 ? (
            <Alert variant="info">No pending requests</Alert>
          ) : (
            <Row>
              {pendingRequests.map(request => (
                <Col key={request.id} md={12} className="mb-3">
                  <Card>
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="flex-grow-1">
                          <h5>
                            {request.providerName}
                            {getStatusBadge(request.status)}
                            <span className="ms-2"></span>
                          </h5>
                          <p className="text-muted small mb-2">
                            Requested by {request.requestedByEmail} • {getTimeAgo(request.requestedAt)}
                          </p>
                          
                          <div className="mb-3">
                            <strong>Business Justification:</strong>
                            <p className="mb-0">{request.businessJustification}</p>
                          </div>
                          
                          <div className="mb-3">
                            <strong>Estimated Usage:</strong>
                            <ul className="mb-0">
                              <li>{request.estimatedUsage.documents.toLocaleString()} documents</li>
                              <li>{request.estimatedUsage.queriesPerMonth.toLocaleString()} queries/month</li>
                              <li>Team size: {request.estimatedUsage.teamSize}</li>
                            </ul>
                          </div>
                          
                          <div>
                            <strong>Approvers:</strong>
                            <div className="d-flex gap-2 mt-2">
                              {request.approvers.map(approver => (
                                <Badge
                                  key={approver.userId}
                                  bg={
                                    approver.status === 'approved' ? 'success' :
                                    approver.status === 'rejected' ? 'danger' : 'secondary'
                                  }
                                >
                                  {approver.role}: {approver.status}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        <div className="d-flex gap-2">
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowApproveModal(true);
                            }}
                          >
                            ✓ Approve
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowRejectModal(true);
                            }}
                          >
                            ✗ Reject
                          </Button>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Tab>

        <Tab eventKey="approved" title={`Approved (${approvedRequests.length})`}>
          {approvedRequests.length === 0 ? (
            <Alert variant="info">No approved requests</Alert>
          ) : (
            <Row>
              {approvedRequests.map(request => (
                <Col key={request.id} md={6} className="mb-3">
                  <Card>
                    <Card.Body>
                      <h6>{request.providerName} {getStatusBadge(request.status)}</h6>
                      <p className="text-muted small mb-0">
                        {request.requestedByEmail} • {getTimeAgo(request.updatedAt)}
                      </p>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Tab>

        <Tab eventKey="rejected" title={`Rejected (${rejectedRequests.length})`}>
          {rejectedRequests.length === 0 ? (
            <Alert variant="info">No rejected requests</Alert>
          ) : (
            <Row>
              {rejectedRequests.map(request => (
                <Col key={request.id} md={6} className="mb-3">
                  <Card>
                    <Card.Body>
                      <h6>{request.providerName} {getStatusBadge(request.status)}</h6>
                      <p className="text-muted small">{request.requestedByEmail}</p>
                      {request.rejectionReason && (
                        <Alert variant="danger" className="mb-0">
                          <small><strong>Reason:</strong> {request.rejectionReason}</small>
                        </Alert>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Tab>
      </Tabs>

      {/* Approve Modal */}
      <Modal show={showApproveModal} onHide={() => setShowApproveModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Approve Request</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Approve access request for <strong>{selectedRequest?.providerName}</strong>?</p>
          <Form.Group>
            <Form.Label>Comments (Optional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Add any comments or notes..."
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowApproveModal(false)}>
            Cancel
          </Button>
          <Button
            variant="success"
            onClick={handleApprove}
            disabled={processing}
          >
            {processing ? 'Approving...' : '✓ Approve'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Reject Modal */}
      <Modal show={showRejectModal} onHide={() => setShowRejectModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Reject Request</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Reject access request for <strong>{selectedRequest?.providerName}</strong>?</p>
          <Form.Group>
            <Form.Label>Rejection Reason <span className="text-danger">*</span></Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Explain why this request is being rejected..."
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRejectModal(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleReject}
            disabled={processing || !rejectionReason.trim()}
          >
            {processing ? 'Rejecting...' : '✗ Reject'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default VectorDBAdminDashboard;
