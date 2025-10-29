import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Badge, Alert, Form, Modal } from 'react-bootstrap';
import PermissionGuard from './PermissionGuard';
import { usePermissions } from '../hooks/usePermissions';
import { FaRocket, FaServer, FaShieldAlt, FaExclamationTriangle } from 'react-icons/fa';

// Type assertions for React Icons
const RocketIcon = FaRocket as any;
const ServerIcon = FaServer as any;
const ShieldIcon = FaShieldAlt as any;
const WarningIcon = FaExclamationTriangle as any;

interface Environment {
  id: string;
  name: string;
  type: 'development' | 'staging' | 'production';
  description: string;
  requiredPermissions: string[];
  approvalRequired: boolean;
  status: 'active' | 'maintenance' | 'restricted';
}

interface DeploymentControlProps {
  agentId?: string;
  agentName?: string;
}

const DeploymentControl: React.FC<DeploymentControlProps> = ({ 
  agentId = 'agent-1', 
  agentName = 'Sample Agent' 
}) => {
  const { hasPermission, user, getAccessLevel } = usePermissions();
  const [selectedEnvironment, setSelectedEnvironment] = useState<Environment | null>(null);
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [deploymentNotes, setDeploymentNotes] = useState('');

  const environments: Environment[] = [
    {
      id: 'dev',
      name: 'Development',
      type: 'development',
      description: 'Development environment for testing and experimentation',
      requiredPermissions: ['agent.deploy'],
      approvalRequired: false,
      status: 'active'
    },
    {
      id: 'staging',
      name: 'Staging',
      type: 'staging',
      description: 'Pre-production environment for final testing',
      requiredPermissions: ['agent.deploy'],
      approvalRequired: true,
      status: 'active'
    },
    {
      id: 'prod',
      name: 'Production',
      type: 'production',
      description: 'Live production environment',
      requiredPermissions: ['agent.deploy', 'system.admin'],
      approvalRequired: true,
      status: 'active'
    }
  ];

  const canDeployToEnvironment = (env: Environment): boolean => {
    // Admin can deploy anywhere
    if (hasPermission('all')) return true;
    
    // Check specific environment permissions
    switch (env.type) {
      case 'development':
        return hasPermission(['agent.deploy', 'agent.manage'], false);
      case 'staging':
        return hasPermission(['agent.deploy']) && (user?.role === 'Developer' || user?.role === 'Admin');
      case 'production':
        return hasPermission(['agent.deploy', 'system.admin'], true) || user?.role === 'Admin';
      default:
        return false;
    }
  };

  const getEnvironmentBadge = (env: Environment) => {
    switch (env.type) {
      case 'development':
        return <Badge bg="info">Development</Badge>;
      case 'staging':
        return <Badge bg="warning">Staging</Badge>;
      case 'production':
        return <Badge bg="danger">Production</Badge>;
      default:
        return <Badge bg="secondary">{env.type}</Badge>;
    }
  };

  const getAccessLevelBadge = () => {
    const level = getAccessLevel();
    switch (level) {
      case 'admin':
        return <Badge bg="danger">Full Access</Badge>;
      case 'power-user':
        return <Badge bg="warning">Limited Production</Badge>;
      case 'standard':
        return <Badge bg="info">Dev/Staging Only</Badge>;
      default:
        return <Badge bg="secondary">View Only</Badge>;
    }
  };

  const handleDeploy = (env: Environment) => {
    setSelectedEnvironment(env);
    setShowDeployModal(true);
  };

  const confirmDeployment = () => {
    if (!selectedEnvironment) return;
    
    // Simulate deployment
    alert(`Deploying ${agentName} to ${selectedEnvironment.name} environment...`);
    setShowDeployModal(false);
    setSelectedEnvironment(null);
    setDeploymentNotes('');
  };

  return (
    <PermissionGuard permission="agent.view">
      <Container fluid className="mt-4">
        {/* Header */}
        <div className="mb-4">
          <h4 className="mb-1">
            <RocketIcon className="me-2" />
            Deployment Control
          </h4>
          <p className="text-muted mb-0">
            Environment-based deployment with role restrictions
          </p>
        </div>

        {/* Access Level Info */}
        <Alert variant="info" className="mb-4">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <strong>Your Access Level:</strong> {getAccessLevelBadge()}
              <br />
              <small>Role: {user?.role} | Permissions vary by environment</small>
            </div>
            <div>
              <strong>Agent:</strong> {agentName}
            </div>
          </div>
        </Alert>

        {/* Environment Cards */}
        <Row>
          {environments.map((env) => {
            const canDeploy = canDeployToEnvironment(env);
            const hasRequiredPermissions = env.requiredPermissions.every(perm => hasPermission(perm));
            
            return (
              <Col md={4} key={env.id} className="mb-4">
                <Card className={`h-100 ${canDeploy ? 'border-success' : 'border-secondary'}`}>
                  <Card.Header className="d-flex justify-content-between align-items-center">
                    <div>
                      <ServerIcon className="me-2" />
                      <strong>{env.name}</strong>
                    </div>
                    {getEnvironmentBadge(env)}
                  </Card.Header>
                  <Card.Body>
                    <p className="text-muted small mb-3">
                      {env.description}
                    </p>
                    
                    {/* Permission Requirements */}
                    <div className="mb-3">
                      <small className="text-muted">Required Permissions:</small>
                      <div className="mt-1">
                        {env.requiredPermissions.map((perm, index) => (
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

                    {/* Approval Requirements */}
                    {env.approvalRequired && (
                      <div className="mb-3">
                        <Badge bg="warning" className="mb-2">
                          <ShieldIcon className="me-1" />
                          Approval Required
                        </Badge>
                        <br />
                        <small className="text-muted">
                          Deployments require manager approval
                        </small>
                      </div>
                    )}

                    {/* Access Control Messages */}
                    {!canDeploy && (
                      <Alert variant="warning" className="small mb-3">
                        <WarningIcon className="me-1" />
                        <strong>Access Restricted:</strong>
                        <br />
                        {!hasRequiredPermissions && "Missing required permissions"}
                        {env.type === 'production' && user?.role !== 'Admin' && user?.role !== 'Developer' && 
                          " Production access limited to Admins and Senior Developers"}
                      </Alert>
                    )}

                    {/* Deployment Button */}
                    <div className="d-grid">
                      <Button
                        variant={canDeploy ? 'primary' : 'secondary'}
                        disabled={!canDeploy}
                        onClick={() => handleDeploy(env)}
                      >
                        <RocketIcon className="me-1" />
                        {canDeploy ? 'Deploy' : 'Access Denied'}
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>

        {/* Role-Specific Guidance */}
        <Card className="mt-4">
          <Card.Header>
            <h6 className="mb-0">
              <ShieldIcon className="me-2" />
              Environment Access by Role
            </h6>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={6}>
                <h6>Development Environment</h6>
                <ul className="small">
                  <li><Badge bg="success">✓</Badge> Developers, Business Users, Testing Team</li>
                  <li><Badge bg="success">✓</Badge> No approval required</li>
                  <li><Badge bg="success">✓</Badge> Immediate deployment</li>
                </ul>
              </Col>
              <Col md={6}>
                <h6>Staging Environment</h6>
                <ul className="small">
                  <li><Badge bg="warning">⚠</Badge> Developers, Admins only</li>
                  <li><Badge bg="warning">⚠</Badge> Approval required</li>
                  <li><Badge bg="info">ℹ</Badge> Pre-production testing</li>
                </ul>
              </Col>
            </Row>
            <Row className="mt-3">
              <Col md={6}>
                <h6>Production Environment</h6>
                <ul className="small">
                  <li><Badge bg="danger">🔒</Badge> Admins only</li>
                  <li><Badge bg="danger">🔒</Badge> Strict approval process</li>
                  <li><Badge bg="danger">🔒</Badge> Audit trail required</li>
                </ul>
              </Col>
              <Col md={6}>
                <h6>Your Current Access</h6>
                <ul className="small">
                  <li><strong>Role:</strong> {user?.role}</li>
                  <li><strong>Level:</strong> {getAccessLevel()}</li>
                  <li><strong>Can Deploy To:</strong> {
                    environments
                      .filter(env => canDeployToEnvironment(env))
                      .map(env => env.name)
                      .join(', ') || 'None'
                  }</li>
                </ul>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Deployment Confirmation Modal */}
        <Modal show={showDeployModal} onHide={() => setShowDeployModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>
              Deploy to {selectedEnvironment?.name}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedEnvironment && (
              <>
                <Alert variant={selectedEnvironment.type === 'production' ? 'danger' : 'warning'}>
                  <strong>Deployment Confirmation</strong>
                  <br />
                  You are about to deploy <strong>{agentName}</strong> to the{' '}
                  <strong>{selectedEnvironment.name}</strong> environment.
                  {selectedEnvironment.approvalRequired && (
                    <>
                      <br />
                      <WarningIcon className="me-1" />
                      This deployment requires approval.
                    </>
                  )}
                </Alert>

                <Form.Group className="mb-3">
                  <Form.Label>Deployment Notes</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={deploymentNotes}
                    onChange={(e) => setDeploymentNotes(e.target.value)}
                    placeholder="Enter deployment notes, change description, or approval justification..."
                    required={selectedEnvironment.approvalRequired}
                  />
                </Form.Group>
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDeployModal(false)}>
              Cancel
            </Button>
            <Button 
              variant={selectedEnvironment?.type === 'production' ? 'danger' : 'primary'}
              onClick={confirmDeployment}
              disabled={selectedEnvironment?.approvalRequired && !deploymentNotes.trim()}
            >
              <RocketIcon className="me-1" />
              {selectedEnvironment?.approvalRequired ? 'Submit for Approval' : 'Deploy Now'}
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </PermissionGuard>
  );
};

export default DeploymentControl;