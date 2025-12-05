/**
 * VectorDBRequestAccessModal
 * 
 * Modal for requesting access to marketplace Vector DB providers
 * Collects business justification and configuration details
 */

import React, { useState } from 'react';
import { Modal, Button, Form, Alert, Badge } from 'react-bootstrap';
import { VectorDBProvider } from '../types/vectorDB';

interface VectorDBRequestAccessModalProps {
  show: boolean;
  provider: VectorDBProvider | null;
  onHide: () => void;
  onSubmit: (request: any) => void;
}

const VectorDBRequestAccessModal: React.FC<VectorDBRequestAccessModalProps> = ({
  show,
  provider,
  onHide,
  onSubmit
}) => {
  const [justification, setJustification] = useState('');
  const [estimatedDocuments, setEstimatedDocuments] = useState('10000');
  const [estimatedQueries, setEstimatedQueries] = useState('50000');
  const [teamSize, setTeamSize] = useState('5');
  const [config, setConfig] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!provider) return;
    
    if (!justification.trim()) {
      setError('Business justification is required');
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      const request = {
        providerId: provider.id,
        providerName: provider.name,
        businessJustification: justification,
        estimatedUsage: {
          documents: parseInt(estimatedDocuments),
          queriesPerMonth: parseInt(estimatedQueries),
          teamSize: parseInt(teamSize)
        },
        configuration: config
      };
      
      await onSubmit(request);
      handleClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setJustification('');
    setEstimatedDocuments('10000');
    setEstimatedQueries('50000');
    setTeamSize('5');
    setConfig({});
    setError(null);
    onHide();
  };

  if (!provider) return null;

  return (
    <Modal 
      show={show} 
      onHide={handleClose} 
      size="lg" 
      centered
      dialogClassName="modal-dialog-centered"
    >
      <Modal.Header closeButton>
        <Modal.Title>
          🔒 Request Access to {provider.name}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Alert variant="info">
          <div className="d-flex align-items-start">
            <span style={{ fontSize: '2rem', marginRight: '12px' }}>
              {provider.icon}
            </span>
            <div>
              <strong>{provider.name}</strong>
              <p className="mb-0 mt-1">{provider.description}</p>
            </div>
          </div>
        </Alert>

        <Form>
          {/* Business Justification */}
          <Form.Group className="mb-3">
            <Form.Label>
              Business Justification <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Explain why you need this Vector DB provider and how it will be used..."
            />
            <Form.Text className="text-muted">
              Provide a clear business case for using this provider
            </Form.Text>
          </Form.Group>

          {/* Estimated Usage */}
          <div className="mb-3">
            <h6>Estimated Usage</h6>
            <p className="text-muted small">
              Help us understand your expected usage to provision appropriate resources
            </p>

            <Form.Group className="mb-2">
              <Form.Label>Number of Documents</Form.Label>
              <Form.Control
                type="number"
                value={estimatedDocuments}
                onChange={(e) => setEstimatedDocuments(e.target.value)}
                placeholder="e.g., 10000"
              />
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label>Queries per Month</Form.Label>
              <Form.Control
                type="number"
                value={estimatedQueries}
                onChange={(e) => setEstimatedQueries(e.target.value)}
                placeholder="e.g., 50000"
              />
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label>Team Size</Form.Label>
              <Form.Control
                type="number"
                value={teamSize}
                onChange={(e) => setTeamSize(e.target.value)}
                placeholder="e.g., 5"
              />
            </Form.Group>
          </div>

          {/* Configuration Preview */}
          <Alert variant="secondary">
            <h6>Configuration Details</h6>
            <p className="small mb-2">
              After approval, you'll be able to configure these settings:
            </p>
            <ul className="small mb-0">
              {provider.configTemplate.fields.map(field => (
                <li key={field.name}>
                  {field.label} {field.required && <Badge bg="danger" className="ms-1">Required</Badge>}
                </li>
              ))}
            </ul>
          </Alert>

          {/* Approval Process Info */}
          <Alert variant="warning">
            <h6>📋 Approval Process</h6>
            <ol className="small mb-0">
              <li>Your request will be sent to platform administrators</li>
              <li>Admin and security teams will review your justification</li>
              <li>Once approved, the provider will be automatically deployed</li>
              <li>You'll receive an email notification when it's ready</li>
              <li>The provider will appear in your "Approved Providers" list</li>
            </ol>
          </Alert>
        </Form>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          variant="warning"
          onClick={handleSubmit}
          disabled={submitting || !justification.trim()}
        >
          {submitting ? 'Submitting...' : '🔒 Submit Request'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default VectorDBRequestAccessModal;
