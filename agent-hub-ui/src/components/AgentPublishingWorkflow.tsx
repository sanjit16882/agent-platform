import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Alert, Form, Modal, Tabs, Tab, ProgressBar } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import PermissionGuard from './PermissionGuard';
import { usePermissions } from '../hooks/usePermissions';
import '../styles/aws-inspired-theme.css';

interface Agent {
  id: string;
  name: string;
  description: string;
  category: string;
  status: 'draft' | 'ready' | 'published';
  createdFrom?: 'template' | 'scratch' | 'agent-builder';
  templateId?: string;
}

interface PublishingStep {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  current: boolean;
}

const AgentPublishingWorkflow: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPermission, user } = usePermissions();
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [publishingData, setPublishingData] = useState({
    title: '',
    description: '',
    category: '',
    tags: '',
    marketplace: 'internal',
    pricing: 'free',
    justification: ''
  });

  useEffect(() => {
    // Check if agent data was passed from hybrid builder
    const stateData = location.state as any;
    if (stateData && (stateData.agentId || stateData.selectedAgent)) {
      const agent = stateData.selectedAgent || {
        id: stateData.agentId,
        name: stateData.agentName || 'Hybrid Agent',
        description: 'Generated hybrid agent',
        category: 'Hybrid Automation',
        status: 'ready'
      };
      
      setSelectedAgent(agent);
      setPublishingData(prevData => ({
        ...prevData,
        title: agent.name,
        description: agent.description,
        category: agent.category
      }));
      setCurrentStep(2); // Skip agent selection step
    }
  }, [location.state]);

  // Mock agents - in real app, this would come from API
  const myAgents: Agent[] = [
    {
      id: 'agent-1',
      name: 'Customer Sentiment Analyzer',
      description: 'Analyzes customer feedback and categorizes by sentiment',
      category: 'Analytics',
      status: 'ready',
      createdFrom: 'template',
      templateId: 'sentiment-analyzer'
    },
    {
      id: 'agent-2',
      name: 'Invoice Data Extractor',
      description: 'Extracts billing information from invoice documents',
      category: 'Document Processing',
      status: 'ready',
      createdFrom: 'agent-builder'
    },
    {
      id: 'agent-3',
      name: 'Code Quality Checker',
      description: 'Analyzes code repositories and suggests improvements',
      category: 'Development',
      status: 'draft',
      createdFrom: 'scratch'
    }
  ];

  const publishingSteps: PublishingStep[] = [
    {
      id: 1,
      title: 'Select Agent',
      description: 'Choose the agent you want to publish',
      completed: !!selectedAgent,
      current: currentStep === 1
    },
    {
      id: 2,
      title: 'Agent Details',
      description: 'Provide marketplace information',
      completed: currentStep > 2,
      current: currentStep === 2
    },
    {
      id: 3,
      title: 'Choose Marketplace',
      description: 'Select target marketplace',
      completed: currentStep > 3,
      current: currentStep === 3
    },
    {
      id: 4,
      title: 'Review & Submit',
      description: 'Final review and submission',
      completed: currentStep > 4,
      current: currentStep === 4
    }
  ];

  const marketplaceOptions = [
    {
      id: 'internal',
      name: 'Internal Company Marketplace',
      description: 'Share with your organization',
      approvalRequired: false,
      icon: '🏢'
    },
    {
      id: 'partner',
      name: 'Partner Marketplace',
      description: 'Share with trusted partners',
      approvalRequired: true,
      icon: '🤝'
    },
    {
      id: 'public',
      name: 'Public Marketplace',
      description: 'Share with everyone',
      approvalRequired: true,
      icon: '🌍'
    }
  ];

  const handleAgentSelect = (agent: Agent) => {
    setSelectedAgent(agent);
    setPublishingData({
      ...publishingData,
      title: agent.name,
      description: agent.description,
      category: agent.category
    });
    setCurrentStep(2);
  };

  const handlePublish = async () => {
    try {
      // Mock API call
      const response = await fetch('/api/v1/marketplace/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: selectedAgent?.id,
          ...publishingData
        })
      });

      if (response.ok) {
        setShowPublishModal(false);
        // Show success message or redirect
        alert('Agent published successfully!');
      }
    } catch (error) {
      console.error('Publishing failed:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, string> = {
      'draft': 'aws-status-warning',
      'ready': 'aws-status-success',
      'published': 'aws-status-info'
    };
    return statusMap[status] || 'aws-status-info';
  };

  const getCreationBadge = (createdFrom: string) => {
    const creationMap: Record<string, { label: string; icon: string }> = {
      'template': { label: 'From Template', icon: '📋' },
      'agent-builder': { label: 'Agent Builder', icon: '🤖' },
      'scratch': { label: 'From Scratch', icon: '⚡' }
    };
    return creationMap[createdFrom] || { label: 'Unknown', icon: '❓' };
  };

  return (
    <PermissionGuard permission={['template.publish']} requireAll={false}>
      <div className="aws-layout">
        <Container fluid className="aws-main-content">
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h1 className="h3 mb-1" style={{ color: 'var(--aws-gray-800)' }}>
                🏪 Publish Agent to Marketplace
              </h1>
              <p className="aws-text-muted mb-0">
                Share your agents with others through the marketplace
              </p>
            </div>
            <Button 
              className="aws-btn aws-btn-secondary"
              onClick={() => navigate('/marketplace')}
            >
              View Marketplace
            </Button>
          </div>

          {/* Publishing Workflow Steps */}
          <div className="aws-card mb-4">
            <div className="aws-card-header">
              📋 Publishing Workflow
            </div>
            <div className="aws-card-body">
              <Row>
                {publishingSteps.map((step, index) => (
                  <Col md={3} key={step.id} className="mb-3">
                    <div className="d-flex align-items-center">
                      <div 
                        className={`rounded-circle d-flex align-items-center justify-content-center me-3`}
                        style={{
                          width: '40px',
                          height: '40px',
                          backgroundColor: step.completed ? 'var(--aws-success)' : 
                                         step.current ? 'var(--aws-orange)' : 'var(--aws-gray-300)',
                          color: 'white',
                          fontWeight: 'bold'
                        }}
                      >
                        {step.completed ? '✓' : step.id}
                      </div>
                      <div>
                        <h6 className="mb-1" style={{ 
                          color: step.current ? 'var(--aws-orange)' : 'var(--aws-gray-700)' 
                        }}>
                          {step.title}
                        </h6>
                        <small className="aws-text-muted">{step.description}</small>
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>
              <ProgressBar 
                now={(currentStep - 1) * 25} 
                className="mt-3"
                style={{ height: '4px' }}
              />
            </div>
          </div>

          {/* Step 1: Select Agent */}
          {currentStep === 1 && (
            <div className="aws-card">
              <div className="aws-card-header">
                🤖 Step 1: Select Agent to Publish
              </div>
              <div className="aws-card-body">
                <Alert variant="info" className="mb-4">
                  <strong>💡 Publishing Requirements:</strong> Only agents with "Ready" status can be published. 
                  Draft agents need to be completed first.
                </Alert>

                <Row>
                  {myAgents.map((agent) => (
                    <Col md={6} lg={4} key={agent.id} className="mb-3">
                      <Card 
                        className={`h-100 ${agent.status === 'ready' ? 'border-success' : ''}`}
                        style={{ 
                          cursor: agent.status === 'ready' ? 'pointer' : 'not-allowed',
                          opacity: agent.status === 'ready' ? 1 : 0.6
                        }}
                        onClick={() => agent.status === 'ready' && handleAgentSelect(agent)}
                      >
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <h6 className="mb-1">{agent.name}</h6>
                            <span className={`aws-status-badge ${getStatusBadge(agent.status)}`}>
                              {agent.status.toUpperCase()}
                            </span>
                          </div>
                          <p className="small aws-text-muted mb-2">{agent.description}</p>
                          <div className="d-flex justify-content-between align-items-center">
                            <Badge bg="light" text="dark">{agent.category}</Badge>
                            {agent.createdFrom && (
                              <span className="small aws-text-muted">
                                {getCreationBadge(agent.createdFrom).icon} {getCreationBadge(agent.createdFrom).label}
                              </span>
                            )}
                          </div>
                          {agent.status === 'ready' && (
                            <Button 
                              className="aws-btn aws-btn-primary w-100 mt-3"
                              size="sm"
                            >
                              Select for Publishing
                            </Button>
                          )}
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>

                {myAgents.filter(a => a.status === 'ready').length === 0 && (
                  <Alert variant="warning">
                    <strong>No Ready Agents:</strong> You don't have any agents ready for publishing. 
                    <Button 
                      variant="link" 
                      className="p-0 ms-2"
                      onClick={() => navigate('/agent-builder')}
                    >
                      Create a new agent
                    </Button>
                  </Alert>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Agent Details */}
          {currentStep === 2 && selectedAgent && (
            <div className="aws-card">
              <div className="aws-card-header">
                📝 Step 2: Agent Details for Marketplace
              </div>
              <div className="aws-card-body">
                <Alert variant="info" className="mb-4">
                  <strong>Selected Agent:</strong> {selectedAgent.name}
                  {selectedAgent.createdFrom && (
                    <span className="ms-2">
                      ({getCreationBadge(selectedAgent.createdFrom).icon} {getCreationBadge(selectedAgent.createdFrom).label})
                    </span>
                  )}
                </Alert>

                <Form>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Marketplace Title</Form.Label>
                        <Form.Control
                          type="text"
                          value={publishingData.title}
                          onChange={(e) => setPublishingData({...publishingData, title: e.target.value})}
                          placeholder="Enter marketplace title"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Category</Form.Label>
                        <Form.Select
                          value={publishingData.category}
                          onChange={(e) => setPublishingData({...publishingData, category: e.target.value})}
                        >
                          <option value="">Select category</option>
                          <option value="Analytics">Analytics</option>
                          <option value="Document Processing">Document Processing</option>
                          <option value="Development">Development</option>
                          <option value="Security">Security</option>
                          <option value="QA">QA & Testing</option>
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
                      placeholder="Describe what your agent does and its benefits"
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Tags (comma-separated)</Form.Label>
                    <Form.Control
                      type="text"
                      value={publishingData.tags}
                      onChange={(e) => setPublishingData({...publishingData, tags: e.target.value})}
                      placeholder="e.g., sentiment, analysis, customer, feedback"
                    />
                  </Form.Group>

                  <div className="d-flex justify-content-between">
                    <Button 
                      className="aws-btn aws-btn-secondary"
                      onClick={() => setCurrentStep(1)}
                    >
                      ← Back
                    </Button>
                    <Button 
                      className="aws-btn aws-btn-primary"
                      onClick={() => setCurrentStep(3)}
                      disabled={!publishingData.title || !publishingData.description}
                    >
                      Next: Choose Marketplace →
                    </Button>
                  </div>
                </Form>
              </div>
            </div>
          )}

          {/* Step 3: Choose Marketplace */}
          {currentStep === 3 && (
            <div className="aws-card">
              <div className="aws-card-header">
                🏪 Step 3: Choose Target Marketplace
              </div>
              <div className="aws-card-body">
                <Row>
                  {marketplaceOptions.map((marketplace) => (
                    <Col md={4} key={marketplace.id} className="mb-3">
                      <Card 
                        className={`h-100 ${publishingData.marketplace === marketplace.id ? 'border-primary' : ''}`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => setPublishingData({...publishingData, marketplace: marketplace.id})}
                      >
                        <Card.Body className="text-center">
                          <div style={{ fontSize: '2rem' }} className="mb-2">
                            {marketplace.icon}
                          </div>
                          <h6>{marketplace.name}</h6>
                          <p className="small aws-text-muted mb-2">{marketplace.description}</p>
                          {marketplace.approvalRequired && (
                            <Badge bg="warning" className="mb-2">Approval Required</Badge>
                          )}
                          {publishingData.marketplace === marketplace.id && (
                            <Badge bg="primary">Selected</Badge>
                          )}
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>

                <div className="d-flex justify-content-between mt-4">
                  <Button 
                    className="aws-btn aws-btn-secondary"
                    onClick={() => setCurrentStep(2)}
                  >
                    ← Back
                  </Button>
                  <Button 
                    className="aws-btn aws-btn-primary"
                    onClick={() => setCurrentStep(4)}
                    disabled={!publishingData.marketplace}
                  >
                    Next: Review & Submit →
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Review & Submit */}
          {currentStep === 4 && (
            <div className="aws-card">
              <div className="aws-card-header">
                ✅ Step 4: Review & Submit
              </div>
              <div className="aws-card-body">
                <Alert variant="success" className="mb-4">
                  <strong>Ready to Publish!</strong> Review your submission details below.
                </Alert>

                <Row>
                  <Col md={6}>
                    <h6>Agent Information</h6>
                    <ul className="list-unstyled small">
                      <li><strong>Name:</strong> {selectedAgent?.name}</li>
                      <li><strong>Title:</strong> {publishingData.title}</li>
                      <li><strong>Category:</strong> {publishingData.category}</li>
                      <li><strong>Created From:</strong> {selectedAgent?.createdFrom && getCreationBadge(selectedAgent.createdFrom).label}</li>
                    </ul>
                  </Col>
                  <Col md={6}>
                    <h6>Publishing Details</h6>
                    <ul className="list-unstyled small">
                      <li><strong>Marketplace:</strong> {marketplaceOptions.find(m => m.id === publishingData.marketplace)?.name}</li>
                      <li><strong>Approval Required:</strong> {marketplaceOptions.find(m => m.id === publishingData.marketplace)?.approvalRequired ? 'Yes' : 'No'}</li>
                      <li><strong>Tags:</strong> {publishingData.tags || 'None'}</li>
                    </ul>
                  </Col>
                </Row>

                <div className="border rounded p-3 mb-4" style={{ backgroundColor: 'var(--aws-gray-50)' }}>
                  <h6>Description</h6>
                  <p className="small mb-0">{publishingData.description}</p>
                </div>

                <div className="d-flex justify-content-between">
                  <Button 
                    className="aws-btn aws-btn-secondary"
                    onClick={() => setCurrentStep(3)}
                  >
                    ← Back
                  </Button>
                  <Button 
                    className="aws-btn aws-btn-primary"
                    onClick={handlePublish}
                  >
                    🚀 Publish Agent
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Help Section */}
          <div className="aws-card mt-4">
            <div className="aws-card-header">
              💡 Publishing Help
            </div>
            <div className="aws-card-body">
              <Row>
                <Col md={4}>
                  <h6>📋 From Template</h6>
                  <p className="small aws-text-muted">
                    Agents created from templates can be customized and published as new templates for others to use.
                  </p>
                </Col>
                <Col md={4}>
                  <h6>🤖 Agent Builder</h6>
                  <p className="small aws-text-muted">
                    Agents created with natural language descriptions can be shared to help others build similar agents.
                  </p>
                </Col>
                <Col md={4}>
                  <h6>⚡ From Scratch</h6>
                  <p className="small aws-text-muted">
                    Custom-built agents showcase advanced functionality and can become popular marketplace items.
                  </p>
                </Col>
              </Row>
            </div>
          </div>
        </Container>
      </div>
    </PermissionGuard>
  );
};

export default AgentPublishingWorkflow;