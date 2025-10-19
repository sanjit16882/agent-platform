import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Tab, Tabs, Alert, Modal, Spinner } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { templateService, AgentTemplate } from '../services/templateService';
import { governanceService } from '../services/governanceService';
import { complianceService } from '../services/complianceService';
import { templateAnalyticsService } from '../services/templateAnalyticsService';
import TemplatePreview from './TemplatePreview';
import TemplateGovernance from './TemplateGovernance';
import TemplateAnalytics from './TemplateAnalytics';
import CodeHighlighter from './CodeHighlighter';

const TemplateDetails: React.FC = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  
  const [template, setTemplate] = useState<AgentTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    if (templateId) {
      loadTemplateDetails(templateId);
    }
  }, [templateId]);

  const loadTemplateDetails = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const [templateData, analyticsData] = await Promise.all([
        templateService.getTemplate(id),
        templateAnalyticsService.getTemplatePerformance(id)
      ]);
      
      if (!templateData) {
        setError('Template not found');
        return;
      }
      
      setTemplate(templateData);
      setAnalytics(analyticsData);
    } catch (err) {
      setError('Failed to load template details');
      console.error('Error loading template:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFromTemplate = async () => {
    if (!template) return;

    try {
      // Check if template requires approval
      if (template.approvalStatus !== 'Approved') {
        await governanceService.submitForApproval(template.id, 'Creation');
        alert('Template requires approval. Your request has been submitted for review.');
        return;
      }

      // Navigate to template wizard
      navigate(`/templates/${template.id}/create`);
    } catch (error) {
      console.error('Error creating from template:', error);
      alert('Failed to create agent from template. Please try again.');
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      'QE': '🧪',
      'DevOps': '⚙️',
      'Security': '🔒',
      'Business': '📊'
    };
    return icons[category as keyof typeof icons] || '📋';
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'QE': 'primary',
      'DevOps': 'success',
      'Security': 'danger',
      'Business': 'warning'
    };
    return colors[category as keyof typeof colors] || 'secondary';
  };

  const getApprovalStatusColor = (status: string) => {
    const colors = {
      'Approved': 'success',
      'Pending': 'warning',
      'Rejected': 'danger',
      'Draft': 'secondary'
    };
    return colors[status as keyof typeof colors] || 'secondary';
  };

  const getComplianceStatusColor = (status: string) => {
    const colors = {
      'Compliant': 'success',
      'Non-Compliant': 'danger',
      'Under-Review': 'warning'
    };
    return colors[status as keyof typeof colors] || 'secondary';
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={i} className="text-warning">★</span>);
    }
    
    if (hasHalfStar) {
      stars.push(<span key="half" className="text-warning">☆</span>);
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<span key={`empty-${i}`} className="text-muted">☆</span>);
    }
    
    return stars;
  };

  if (loading) {
    return (
      <Container className="mt-4">
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Loading template details...</p>
        </div>
      </Container>
    );
  }

  if (error || !template) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">
          <Alert.Heading>Error Loading Template</Alert.Heading>
          <p>{error || 'Template not found'}</p>
          <Button variant="outline-danger" onClick={() => navigate('/templates')}>
            Back to Templates
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="mt-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex align-items-center mb-3">
            <Button 
              variant="outline-secondary" 
              onClick={() => navigate('/templates')}
              className="me-3"
            >
              ← Back to Templates
            </Button>
            <div className="flex-grow-1">
              <div className="d-flex align-items-center mb-2">
                <span style={{ fontSize: '2rem', marginRight: '12px' }}>
                  {getCategoryIcon(template.category)}
                </span>
                <h1 className="display-6 mb-0">{template.name}</h1>
                <Badge bg={getCategoryColor(template.category)} className="ms-3">
                  {template.category}
                </Badge>
              </div>
              <p className="lead text-muted mb-0">{template.description}</p>
            </div>
          </div>
        </Col>
      </Row>

      {/* Status and Actions Bar */}
      <Row className="mb-4">
        <Col md={8}>
          <div className="d-flex align-items-center gap-3">
            <Badge bg={getApprovalStatusColor(template.approvalStatus)} className="px-3 py-2">
              {template.approvalStatus === 'Approved' ? '✅' : 
               template.approvalStatus === 'Pending' ? '⏳' : 
               template.approvalStatus === 'Rejected' ? '❌' : '📝'} 
              {template.approvalStatus}
            </Badge>
            
            <Badge bg={getComplianceStatusColor(template.complianceStatus)} className="px-3 py-2">
              {template.complianceStatus === 'Compliant' ? '🛡️' : 
               template.complianceStatus === 'Non-Compliant' ? '⚠️' : '🔍'} 
              {template.complianceStatus}
            </Badge>
            
            <div className="d-flex align-items-center">
              {renderStars(template.rating)}
              <span className="ms-2 text-muted">({template.rating})</span>
            </div>
            
            <Badge bg="light" text="dark">
              {template.usageCount.toLocaleString()} uses
            </Badge>
            
            <Badge bg="info">
              v{template.version}
            </Badge>
          </div>
        </Col>
        
        <Col md={4} className="text-end">
          <Button
            variant="primary"
            size="lg"
            onClick={handleCreateFromTemplate}
            disabled={template.approvalStatus !== 'Approved'}
            className="me-2"
          >
            {template.approvalStatus === 'Approved' ? (
              <>🚀 Create Agent</>
            ) : template.approvalStatus === 'Pending' ? (
              <>⏳ Pending Approval</>
            ) : (
              <>❌ Not Available</>
            )}
          </Button>
          
          <Button
            variant="outline-secondary"
            onClick={() => setShowCreateModal(true)}
          >
            📋 Quick Preview
          </Button>
        </Col>
      </Row>

      {/* Main Content Tabs */}
      <Row>
        <Col>
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k || 'overview')}
            className="mb-4"
          >
            {/* Overview Tab */}
            <Tab eventKey="overview" title="📋 Overview">
              <Row>
                <Col md={8}>
                  <Card className="mb-4">
                    <Card.Header>
                      <h5 className="mb-0">Template Information</h5>
                    </Card.Header>
                    <Card.Body>
                      <Row>
                        <Col md={6}>
                          <div className="mb-3">
                            <strong>Complexity:</strong>
                            <Badge 
                              bg={template.complexity === 'Beginner' ? 'success' : 
                                  template.complexity === 'Intermediate' ? 'warning' : 'danger'} 
                              className="ms-2"
                            >
                              {template.complexity}
                            </Badge>
                          </div>
                          
                          <div className="mb-3">
                            <strong>Estimated Setup Time:</strong>
                            <span className="ms-2">~{template.estimatedSetupTime} minutes</span>
                          </div>
                          
                          <div className="mb-3">
                            <strong>Author:</strong>
                            <span className="ms-2">{template.author}</span>
                          </div>
                        </Col>
                        
                        <Col md={6}>
                          <div className="mb-3">
                            <strong>Created:</strong>
                            <span className="ms-2">{new Date(template.createdAt).toLocaleDateString()}</span>
                          </div>
                          
                          <div className="mb-3">
                            <strong>Last Updated:</strong>
                            <span className="ms-2">{new Date(template.updatedAt).toLocaleDateString()}</span>
                          </div>
                          
                          <div className="mb-3">
                            <strong>Status:</strong>
                            <Badge bg={template.isActive ? 'success' : 'secondary'} className="ms-2">
                              {template.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>

                  {/* Technologies */}
                  <Card className="mb-4">
                    <Card.Header>
                      <h5 className="mb-0">🛠️ Technologies & Dependencies</h5>
                    </Card.Header>
                    <Card.Body>
                      <div className="mb-3">
                        <strong>Technologies:</strong>
                        <div className="mt-2">
                          {template.technologies.map((tech, index) => (
                            <Badge key={index} bg="primary" className="me-2 mb-2">
                              {tech}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <strong>Dependencies:</strong>
                        <div className="mt-2">
                          {template.dependencies.map((dep, index) => (
                            <div key={index} className="d-flex align-items-center mb-2">
                              <Badge bg="light" text="dark" className="me-2">
                                {dep.name} v{dep.version}
                              </Badge>
                              {dep.securityScan && (
                                <Badge 
                                  bg={dep.securityScan.status === 'Clean' ? 'success' : 
                                      dep.securityScan.status === 'Warning' ? 'warning' : 'danger'}
                                  className="small"
                                >
                                  {dep.securityScan.status}
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <strong>Tags:</strong>
                        <div className="mt-2">
                          {template.tags.map((tag, index) => (
                            <Badge key={index} bg="light" text="dark" className="me-2 mb-2">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </Card.Body>
                  </Card>

                  {/* Documentation */}
                  <Card>
                    <Card.Header>
                      <h5 className="mb-0">📚 Documentation</h5>
                    </Card.Header>
                    <Card.Body>
                      <div className="mb-3">
                        {template.documentation ? (
                          <div dangerouslySetInnerHTML={{ __html: template.documentation.replace(/\n/g, '<br>') }} />
                        ) : (
                          <p className="text-muted">No documentation available.</p>
                        )}
                      </div>
                      
                      {template.sampleOutputs.length > 0 && (
                        <div>
                          <h6>Sample Outputs:</h6>
                          {template.sampleOutputs.map((output, index) => (
                            <div key={index} className="mb-3">
                              <strong>{output.name}:</strong>
                              <p className="text-muted small">{output.description}</p>
                              <CodeHighlighter 
                                code={output.content} 
                                language={output.type === 'json' ? 'json' : 'text'}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>

                {/* Sidebar */}
                <Col md={4}>
                  {analytics && (
                    <TemplateAnalytics templateId={template.id} analytics={analytics} />
                  )}
                </Col>
              </Row>
            </Tab>

            {/* Code Preview Tab */}
            <Tab eventKey="preview" title="👁️ Code Preview">
              <TemplatePreview template={template} />
            </Tab>

            {/* Governance Tab */}
            <Tab eventKey="governance" title="🏛️ Governance">
              <TemplateGovernance template={template} />
            </Tab>

            {/* Parameters Tab */}
            <Tab eventKey="parameters" title="⚙️ Parameters">
              <Card>
                <Card.Header>
                  <h5 className="mb-0">Template Parameters</h5>
                </Card.Header>
                <Card.Body>
                  {template.parameters.length > 0 ? (
                    <div className="table-responsive">
                      <table className="table table-striped">
                        <thead>
                          <tr>
                            <th>Parameter</th>
                            <th>Type</th>
                            <th>Required</th>
                            <th>Default</th>
                            <th>Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {template.parameters.map((param, index) => (
                            <tr key={index}>
                              <td>
                                <code>{param.name}</code>
                                {param.compliance && param.compliance.length > 0 && (
                                  <Badge bg="warning" className="ms-2 small">
                                    Compliance
                                  </Badge>
                                )}
                              </td>
                              <td>
                                <Badge bg="light" text="dark">
                                  {param.type}
                                </Badge>
                              </td>
                              <td>
                                <Badge bg={param.required ? 'danger' : 'success'}>
                                  {param.required ? 'Required' : 'Optional'}
                                </Badge>
                              </td>
                              <td>
                                {param.defaultValue ? (
                                  <code>{JSON.stringify(param.defaultValue)}</code>
                                ) : (
                                  <span className="text-muted">None</span>
                                )}
                              </td>
                              <td>{param.description}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-muted">No parameters defined for this template.</p>
                  )}
                </Card.Body>
              </Card>
            </Tab>
          </Tabs>
        </Col>
      </Row>

      {/* Quick Preview Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            🚀 Create Agent from {template.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info">
            <strong>Ready to create your agent?</strong><br />
            This template will generate a complete agent package with all necessary files and configurations.
          </Alert>
          
          <div className="mb-3">
            <strong>What you'll get:</strong>
            <ul className="mt-2">
              <li>Complete source code with {template.technologies.join(', ')}</li>
              <li>Configuration files and documentation</li>
              <li>Test cases and validation scripts</li>
              <li>Deployment-ready package</li>
            </ul>
          </div>
          
          <div className="mb-3">
            <strong>Estimated setup time:</strong> ~{template.estimatedSetupTime} minutes
          </div>
          
          {template.approvalStatus !== 'Approved' && (
            <Alert variant="warning">
              This template requires approval before use. Click "Request Approval" to submit for review.
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={() => {
              setShowCreateModal(false);
              handleCreateFromTemplate();
            }}
            disabled={template.approvalStatus !== 'Approved'}
          >
            {template.approvalStatus === 'Approved' ? 
              '🚀 Create Agent' : 
              '📝 Request Approval'
            }
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default TemplateDetails;