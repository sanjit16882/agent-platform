import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Badge, Alert, Form, Modal, Tabs, Tab } from 'react-bootstrap';
import PermissionGuard from './PermissionGuard';
import { usePermissions } from '../hooks/usePermissions';
import { FaStore, FaGlobe, FaBuilding, FaShieldAlt, FaCheckCircle } from 'react-icons/fa';

// Type assertions for React Icons
const StoreIcon = FaStore as any;
const GlobeIcon = FaGlobe as any;
const BuildingIcon = FaBuilding as any;
const ShieldIcon = FaShieldAlt as any;
const CheckIcon = FaCheckCircle as any;

interface MarketplaceOption {
  id: string;
  name: string;
  type: 'internal' | 'public' | 'partner';
  description: string;
  requiredPermissions: string[];
  approvalRequired: boolean;
  reviewProcess: string;
  audience: string;
}

interface MarketplacePublishingProps {
  agentId?: string;
  agentName?: string;
}

const MarketplacePublishing: React.FC<MarketplacePublishingProps> = ({ 
  agentId = 'agent-1', 
  agentName = 'Sample Agent' 
}) => {
  const { hasPermission, user } = usePermissions();
  const [selectedMarketplace, setSelectedMarketplace] = useState<MarketplaceOption | null>(null);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishingData, setPublishingData] = useState({
    title: '',
    description: '',
    category: '',
    tags: '',
    pricing: 'free',
    justification: ''
  });

  const marketplaceOptions: MarketplaceOption[] = [
    {
      id: 'internal',
      name: 'Internal Company Marketplace',
      type: 'internal',
      description: 'Share with your organization',
      requiredPermissions: ['template.publish'],
      approvalRequired: false,
      reviewProcess: 'Automatic approval for internal sharing',
      audience: 'Company employees only'
    },
    {
      id: 'partner',
      name: 'Partner Marketplace',
      type: 'partner',
      description: 'Share with trusted partners',
      requiredPermissions: ['template.publish', 'system.admin'],
      approvalRequired: true,
      reviewProcess: 'Security review and partner approval required',
      audience: 'Approved business partners'
    },
    {
      id: 'public',
      name: 'Public Marketplace',
      type: 'public',
      description: 'Share with everyone',
      requiredPermissions: ['template.publish', 'system.admin'],
      approvalRequired: true,
      reviewProcess: 'Full security audit, compliance check, and quality review',
      audience: 'Global public marketplace'
    }
  ];

  const getMarketplaceBadge = (marketplace: MarketplaceOption) => {
    switch (marketplace.type) {
      case 'internal':
        return <Badge bg="primary"><BuildingIcon className="me-1" />Internal</Badge>;
      case 'partner':
        return <Badge bg="warning"><ShieldIcon className="me-1" />Partner</Badge>;
      case 'public':
        return <Badge bg="success"><GlobeIcon className="me-1" />Public</Badge>;
      default:
        return <Badge bg="secondary">{marketplace.type}</Badge>;
    }
  };

  const handlePublish = (marketplace: MarketplaceOption) => {
    setSelectedMarketplace(marketplace);
    setPublishingData({
      title: agentName,
      description: `${agentName} - Published to ${marketplace.name}`,
      category: '',
      tags: '',
      pricing: 'free',
      justification: ''
    });
    setShowPublishModal(true);
  };

  const handleConfirmPublish = async () => {
    if (!selectedMarketplace) return;
    
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3002'}/api/v1/marketplace/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentId: agentId,
          title: publishingData.title,
          description: publishingData.description,
          category: publishingData.category || 'Custom',
          marketplace: selectedMarketplace.id
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`✅ Success! "${publishingData.title}" has been published to ${selectedMarketplace.name}!`);
      } else {
        alert(`❌ Failed to publish: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Publishing error:', error);
      alert('❌ Failed to publish agent. Please try again.');
    }
    
    setShowPublishModal(false);
    setSelectedMarketplace(null);
  };

  return (
    <PermissionGuard permission="template.view">
      <Container fluid className="mt-4">
        {/* Header */}
        <div className="mb-4">
          <h4 className="mb-1">
            <StoreIcon className="me-2" />
            Marketplace Publishing
          </h4>
          <p className="text-muted mb-0">
            Publish agents to different marketplaces with role-based restrictions
          </p>
        </div>

        {/* Marketplace Options */}
        <Row>
          {marketplaceOptions.map((marketplace) => {
            const hasRequiredPermissions = marketplace.requiredPermissions.every(perm => hasPermission(perm));
            const canPublish = hasRequiredPermissions && 
              (marketplace.type !== 'public' || user?.role === 'Admin') &&
              (marketplace.type !== 'partner' || hasPermission('system.admin'));

            return (
              <Col md={4} key={marketplace.id} className="mb-4">
                <Card className={`h-100 ${canPublish ? 'border-primary' : 'border-secondary'}`}>
                  <Card.Header className="d-flex justify-content-between align-items-center">
                    <div>
                      {getMarketplaceBadge(marketplace)}
                    </div>
                    <div>
                      {canPublish ? (
                        <CheckIcon className="text-success" />
                      ) : (
                        <span className="text-muted">🔒</span>
                      )}
                    </div>
                  </Card.Header>
                  <Card.Body>
                    <h6>{marketplace.name}</h6>
                    <p className="small text-muted mb-3">{marketplace.description}</p>
                    
                    <div className="mb-3">
                      <small className="text-muted">Required Permissions:</small>
                      <div className="mt-1">
                        {marketplace.requiredPermissions.map((perm, index) => (
                          <Badge 
                            key={index} 
                            bg={hasPermission(perm) ? 'success' : 'secondary'} 
                            className="me-1 mb-1"
                          >
                            {hasPermission(perm) ? '✓' : '✗'} {perm}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="mb-3">
                      <small className="text-muted">Review Process:</small>
                      <br />
                      <small className="text-info">{marketplace.reviewProcess}</small>
                    </div>

                    {marketplace.approvalRequired && (
                      <div className="mb-3">
                        <Badge bg="warning" className="mb-2">
                          <ShieldIcon className="me-1" />
                          Approval Required
                        </Badge>
                      </div>
                    )}

                    {!canPublish && (
                      <Alert variant="warning" className="small mb-3">
                        <strong>Access Restricted:</strong>
                        <br />
                        {!hasRequiredPermissions && "Missing required permissions"}
                        {marketplace.type === 'public' && user?.role !== 'Admin' && 
                          " Public publishing limited to Admins"}
                        {marketplace.type === 'partner' && !hasPermission('system.admin') && 
                          " Partner publishing requires admin privileges"}
                      </Alert>
                    )}

                    <div className="d-grid">
                      <Button
                        variant={canPublish ? 'primary' : 'secondary'}
                        disabled={!canPublish}
                        onClick={() => handlePublish(marketplace)}
                      >
                        <StoreIcon className="me-1" />
                        {canPublish ? 'Publish' : 'Access Denied'}
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>

        {/* Publishing Modal */}
        <Modal show={showPublishModal} onHide={() => setShowPublishModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>
              Publish to {selectedMarketplace?.name}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedMarketplace && (
              <>
                <Alert variant={selectedMarketplace.type === 'public' ? 'warning' : 'info'}>
                  <strong>Publishing to {selectedMarketplace.name}</strong>
                  <br />
                  {selectedMarketplace.reviewProcess}
                </Alert>

                <Form>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Title</Form.Label>
                        <Form.Control
                          type="text"
                          value={publishingData.title}
                          onChange={(e) => setPublishingData({...publishingData, title: e.target.value})}
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Category</Form.Label>
                        <Form.Select
                          value={publishingData.category}
                          onChange={(e) => setPublishingData({...publishingData, category: e.target.value})}
                          required
                        >
                          <option value="">Select category</option>
                          <option value="automation">Automation</option>
                          <option value="analytics">Analytics</option>
                          <option value="security">Security</option>
                          <option value="finops">FinOps</option>
                          <option value="custom">Custom</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label>Description</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={publishingData.description}
                      onChange={(e) => setPublishingData({...publishingData, description: e.target.value})}
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Tags (comma-separated)</Form.Label>
                    <Form.Control
                      type="text"
                      value={publishingData.tags}
                      onChange={(e) => setPublishingData({...publishingData, tags: e.target.value})}
                      placeholder="automation, productivity, security"
                    />
                  </Form.Group>

                  {selectedMarketplace.approvalRequired && (
                    <Form.Group className="mb-3">
                      <Form.Label>Business Justification</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        value={publishingData.justification}
                        onChange={(e) => setPublishingData({...publishingData, justification: e.target.value})}
                        placeholder="Explain the business value and why this should be published..."
                        required
                      />
                    </Form.Group>
                  )}
                </Form>
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowPublishModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleConfirmPublish}>
              Confirm Publishing
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </PermissionGuard>
  );
};

export default MarketplacePublishing;