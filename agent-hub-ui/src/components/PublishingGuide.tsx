import React from 'react';
import { Container, Row, Col, Card, Button, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import '../styles/aws-inspired-theme.css';

const PublishingGuide: React.FC = () => {
  const workflowSteps = [
    {
      step: 1,
      title: 'Create Your Agent',
      description: 'Build your agent using one of three methods',
      methods: [
        {
          name: 'Agent Builder',
          icon: '🤖',
          description: 'Use natural language to describe your agent',
          route: '/agent-builder',
          example: 'Create an agent that analyzes customer feedback and categorizes it by sentiment'
        },
        {
          name: 'From Template',
          icon: '📋',
          description: 'Start with a pre-built template and customize',
          route: '/templates',
          example: 'Use "Sentiment Analyzer" template and customize for your needs'
        },
        {
          name: 'From Scratch',
          icon: '⚡',
          description: 'Build completely custom agent with code',
          route: '/upload',
          example: 'Upload your own agent code and configuration'
        }
      ]
    },
    {
      step: 2,
      title: 'Test & Validate',
      description: 'Ensure your agent works correctly',
      actions: [
        'Execute your agent with test data',
        'Verify outputs are correct',
        'Check performance and reliability',
        'Ensure agent status is "Ready"'
      ]
    },
    {
      step: 3,
      title: 'Publish to Marketplace',
      description: 'Share your agent with others',
      process: [
        'Navigate to Agents page',
        'Click "Publish to Marketplace" button',
        'Follow the 4-step publishing workflow',
        'Choose your target marketplace'
      ]
    }
  ];

  const marketplaceTypes = [
    {
      name: 'Internal Company',
      icon: '🏢',
      description: 'Share within your organization',
      approval: 'No approval required',
      audience: 'Company employees only',
      benefits: ['Quick sharing', 'Internal collaboration', 'No external review']
    },
    {
      name: 'Partner Marketplace',
      icon: '🤝',
      description: 'Share with trusted partners',
      approval: 'Approval required',
      audience: 'Partner organizations',
      benefits: ['Controlled sharing', 'Business partnerships', 'Revenue opportunities']
    },
    {
      name: 'Public Marketplace',
      icon: '🌍',
      description: 'Share with everyone',
      approval: 'Approval required',
      audience: 'All platform users',
      benefits: ['Maximum reach', 'Community impact', 'Recognition']
    }
  ];

  return (
    <div className="aws-layout">
      <Container fluid className="aws-main-content">
        {/* Header */}
        <div className="text-center mb-5">
          <h1 className="h2 mb-3" style={{ color: 'var(--aws-blue)' }}>
            🏪 Agent Publishing Guide
          </h1>
          <p className="aws-text-muted mb-4">
            Complete workflow from creating an agent to publishing it in the marketplace
          </p>
        </div>

        {/* Quick Start */}
        <div className="aws-alert aws-alert-info mb-4">
          <div className="d-flex align-items-start">
            <div className="me-2">🚀</div>
            <div>
              <strong>Quick Start:</strong> Already have an agent ready? 
              <Link to="/publish-agent" className="ms-2 text-decoration-none">
                <Button size="sm" className="aws-btn aws-btn-primary">
                  Publish Now →
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Workflow Steps */}
        {workflowSteps.map((workflow, index) => (
          <div key={workflow.step} className="aws-card mb-4">
            <div className="aws-card-header">
              <div className="d-flex align-items-center">
                <div 
                  className="rounded-circle d-flex align-items-center justify-content-center me-3"
                  style={{
                    width: '40px',
                    height: '40px',
                    backgroundColor: 'var(--aws-orange)',
                    color: 'white',
                    fontWeight: 'bold'
                  }}
                >
                  {workflow.step}
                </div>
                <div>
                  <h5 className="mb-0">{workflow.title}</h5>
                  <small className="aws-text-muted">{workflow.description}</small>
                </div>
              </div>
            </div>
            <div className="aws-card-body">
              {/* Step 1: Creation Methods */}
              {workflow.step === 1 && (
                <Row>
                  {workflow.methods?.map((method, idx) => (
                    <Col md={4} key={idx} className="mb-3">
                      <Card className="h-100 border-0 aws-shadow">
                        <Card.Body className="text-center">
                          <div style={{ fontSize: '2rem' }} className="mb-2">
                            {method.icon}
                          </div>
                          <h6 className="mb-2">{method.name}</h6>
                          <p className="small aws-text-muted mb-3">{method.description}</p>
                          <div className="border rounded p-2 mb-3" style={{ backgroundColor: 'var(--aws-gray-50)' }}>
                            <small className="aws-text-muted">
                              <strong>Example:</strong> {method.example}
                            </small>
                          </div>
                          <Link to={method.route} className="text-decoration-none">
                            <Button className="aws-btn aws-btn-outline w-100">
                              Start Here
                            </Button>
                          </Link>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              )}

              {/* Step 2: Testing */}
              {workflow.step === 2 && (
                <Row>
                  <Col md={6}>
                    <h6 className="mb-3">✅ Validation Checklist</h6>
                    <ul className="list-unstyled">
                      {workflow.actions?.map((action, idx) => (
                        <li key={idx} className="mb-2 d-flex align-items-start">
                          <span className="me-2">•</span>
                          <span className="small">{action}</span>
                        </li>
                      ))}
                    </ul>
                  </Col>
                  <Col md={6}>
                    <Alert variant="warning" className="mb-0">
                      <strong>⚠️ Important:</strong> Only agents with "Ready" status can be published. 
                      Draft agents must be completed and tested first.
                    </Alert>
                  </Col>
                </Row>
              )}

              {/* Step 3: Publishing */}
              {workflow.step === 3 && (
                <Row>
                  <Col md={6}>
                    <h6 className="mb-3">📋 Publishing Process</h6>
                    <ol className="small">
                      {workflow.process?.map((step, idx) => (
                        <li key={idx} className="mb-1">{step}</li>
                      ))}
                    </ol>
                  </Col>
                  <Col md={6}>
                    <div className="text-center">
                      <Link to="/agents" className="text-decoration-none">
                        <Button className="aws-btn aws-btn-primary mb-2">
                          Go to Agents Page
                        </Button>
                      </Link>
                      <br />
                      <small className="aws-text-muted">
                        Find the "Publish to Marketplace" button
                      </small>
                    </div>
                  </Col>
                </Row>
              )}
            </div>
          </div>
        ))}

        {/* Marketplace Types */}
        <div className="aws-card mb-4">
          <div className="aws-card-header">
            🏪 Marketplace Options
          </div>
          <div className="aws-card-body">
            <Row>
              {marketplaceTypes.map((marketplace, index) => (
                <Col md={4} key={index} className="mb-3">
                  <Card className="h-100 border-0 aws-shadow">
                    <Card.Body>
                      <div className="text-center mb-3">
                        <div style={{ fontSize: '2rem' }} className="mb-2">
                          {marketplace.icon}
                        </div>
                        <h6>{marketplace.name}</h6>
                        <p className="small aws-text-muted">{marketplace.description}</p>
                      </div>
                      
                      <div className="mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <small><strong>Approval:</strong></small>
                          <span className={`aws-status-badge ${
                            marketplace.approval.includes('No') ? 'aws-status-success' : 'aws-status-warning'
                          }`}>
                            {marketplace.approval.includes('No') ? 'INSTANT' : 'REQUIRED'}
                          </span>
                        </div>
                        <div className="mb-2">
                          <small><strong>Audience:</strong> {marketplace.audience}</small>
                        </div>
                      </div>

                      <div>
                        <small><strong>Benefits:</strong></small>
                        <ul className="small aws-text-muted mt-1 mb-0">
                          {marketplace.benefits.map((benefit, idx) => (
                            <li key={idx}>{benefit}</li>
                          ))}
                        </ul>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        </div>

        {/* Examples */}
        <div className="aws-card mb-4">
          <div className="aws-card-header">
            💡 Publishing Examples
          </div>
          <div className="aws-card-body">
            <Row>
              <Col md={6}>
                <h6>📋 Template-Based Agent</h6>
                <div className="border rounded p-3 mb-3" style={{ backgroundColor: 'var(--aws-gray-50)' }}>
                  <ol className="small mb-0">
                    <li>Go to Templates → Select "Sentiment Analyzer"</li>
                    <li>Customize for your industry (e.g., "E-commerce Review Analyzer")</li>
                    <li>Test with sample customer reviews</li>
                    <li>Publish to Internal Marketplace</li>
                    <li>Share with marketing team</li>
                  </ol>
                </div>
              </Col>
              <Col md={6}>
                <h6>🤖 Agent Builder Creation</h6>
                <div className="border rounded p-3 mb-3" style={{ backgroundColor: 'var(--aws-gray-50)' }}>
                  <ol className="small mb-0">
                    <li>Go to Agent Builder</li>
                    <li>Describe: "Create an agent that processes invoices and extracts billing information"</li>
                    <li>Review generated configuration</li>
                    <li>Test with sample invoices</li>
                    <li>Publish to Partner Marketplace</li>
                  </ol>
                </div>
              </Col>
            </Row>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <h5 className="mb-3">Ready to Get Started?</h5>
          <div className="d-flex justify-content-center gap-3">
            <Link to="/agent-builder" className="text-decoration-none">
              <Button className="aws-btn aws-btn-primary">
                🤖 Create with Agent Builder
              </Button>
            </Link>
            <Link to="/templates" className="text-decoration-none">
              <Button className="aws-btn aws-btn-secondary">
                📋 Browse Templates
              </Button>
            </Link>
            <Link to="/publish-agent" className="text-decoration-none">
              <Button className="aws-btn aws-btn-outline">
                🏪 Publish Existing Agent
              </Button>
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default PublishingGuide;