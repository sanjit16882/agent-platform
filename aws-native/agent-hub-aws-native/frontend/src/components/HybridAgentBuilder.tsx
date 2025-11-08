import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Badge, Alert, Tabs, Tab, ProgressBar } from 'react-bootstrap';

interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  category: 'mcp' | 'lambda' | 'hybrid' | 'bedrock';
  complexity: 'simple' | 'intermediate' | 'advanced';
  estimatedCost: string;
  features: string[];
}

interface IntelligenceRecommendation {
  template: AgentTemplate;
  confidence: number;
  reasoning: string;
  estimatedFit: number;
}

const HybridAgentBuilder: React.FC = () => {
  const [activeTab, setActiveTab] = useState('purpose');
  const [purpose, setPurpose] = useState('');
  const [requirements, setRequirements] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<AgentTemplate | null>(null);
  const [recommendations, setRecommendations] = useState<IntelligenceRecommendation[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [buildProgress, setBuildProgress] = useState(0);

  const agentTemplates: AgentTemplate[] = [
    {
      id: 'office365-automation',
      name: 'Office 365 Automation Agent',
      description: 'Automates Excel, Word, PowerPoint, and SharePoint operations',
      category: 'mcp',
      complexity: 'intermediate',
      estimatedCost: '$0.05-0.15/execution',
      features: ['Excel Operations', 'Document Generation', 'SharePoint Integration', 'Email Automation']
    },
    {
      id: 'teams-integration',
      name: 'Microsoft Teams Integration Agent',
      description: 'Manages Teams messages, channels, and meeting automation',
      category: 'mcp',
      complexity: 'simple',
      estimatedCost: '$0.02-0.08/execution',
      features: ['Message Sending', 'Channel Management', 'Meeting Scheduling', 'Notification System']
    },
    {
      id: 'github-workflow',
      name: 'GitHub Workflow Agent',
      description: 'Automates GitHub operations, PR management, and CI/CD workflows',
      category: 'hybrid',
      complexity: 'advanced',
      estimatedCost: '$0.10-0.25/execution',
      features: ['PR Management', 'Issue Tracking', 'Code Review', 'Deployment Automation']
    },
    {
      id: 'data-processing',
      name: 'Data Processing Agent',
      description: 'Handles large-scale data transformation and analysis',
      category: 'lambda',
      complexity: 'advanced',
      estimatedCost: '$0.15-0.40/execution',
      features: ['ETL Operations', 'Data Validation', 'Report Generation', 'API Integration']
    },
    {
      id: 'bedrock-ai',
      name: 'Bedrock AI Agent',
      description: 'Leverages AWS Bedrock for advanced AI capabilities',
      category: 'bedrock',
      complexity: 'advanced',
      estimatedCost: '$0.20-0.60/execution',
      features: ['Natural Language Processing', 'Content Generation', 'Sentiment Analysis', 'AI Reasoning']
    }
  ];

  const analyzeRequirements = async () => {
    if (!purpose.trim()) return;
    
    setIsAnalyzing(true);
    setBuildProgress(20);
    
    // Simulate intelligence analysis
    await new Promise(resolve => setTimeout(resolve, 1500));
    setBuildProgress(60);
    
    // Mock intelligence recommendations based on purpose
    const mockRecommendations: IntelligenceRecommendation[] = [];
    
    if (purpose.toLowerCase().includes('excel') || purpose.toLowerCase().includes('office')) {
      mockRecommendations.push({
        template: agentTemplates[0],
        confidence: 0.92,
        reasoning: 'High match for Office 365 operations based on Excel/Office keywords',
        estimatedFit: 95
      });
    }
    
    if (purpose.toLowerCase().includes('teams') || purpose.toLowerCase().includes('message')) {
      mockRecommendations.push({
        template: agentTemplates[1],
        confidence: 0.88,
        reasoning: 'Strong match for Teams integration based on messaging requirements',
        estimatedFit: 90
      });
    }
    
    if (purpose.toLowerCase().includes('github') || purpose.toLowerCase().includes('code')) {
      mockRecommendations.push({
        template: agentTemplates[2],
        confidence: 0.85,
        reasoning: 'Good match for GitHub workflow automation',
        estimatedFit: 87
      });
    }
    
    if (purpose.toLowerCase().includes('data') || purpose.toLowerCase().includes('process')) {
      mockRecommendations.push({
        template: agentTemplates[3],
        confidence: 0.80,
        reasoning: 'Suitable for data processing requirements',
        estimatedFit: 82
      });
    }
    
    // Always include Bedrock AI as a fallback option
    mockRecommendations.push({
      template: agentTemplates[4],
      confidence: 0.75,
      reasoning: 'AI-powered solution can handle complex requirements with natural language processing',
      estimatedFit: 78
    });
    
    setBuildProgress(100);
    setRecommendations(mockRecommendations.slice(0, 3)); // Top 3 recommendations
    setIsAnalyzing(false);
  };

  const selectTemplate = (template: AgentTemplate) => {
    setSelectedTemplate(template);
    setActiveTab('configure');
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simple': return 'success';
      case 'intermediate': return 'warning';
      case 'advanced': return 'danger';
      default: return 'secondary';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'mcp': return 'primary';
      case 'lambda': return 'info';
      case 'hybrid': return 'warning';
      case 'bedrock': return 'success';
      default: return 'secondary';
    }
  };

  return (
    <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <Container fluid className="p-4">
        {/* Header */}
        <div className="mb-4">
          <h2 className="text-primary mb-1" style={{ fontSize: '1.75rem', fontWeight: '600' }}>
            🤖 Hybrid Agent Builder
          </h2>
          <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>
            AI-powered agent creation with intelligent template recommendations
          </p>
        </div>

        {/* Intelligence Banner */}
        <Alert variant="info" className="mb-4">
          <div className="d-flex align-items-center">
            <span className="me-2">🧠</span>
            <div>
              <strong>Intelligence Layer Active:</strong> Our AI will analyze your requirements and recommend the best agent template for your use case.
            </div>
          </div>
        </Alert>

        <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'purpose')} className="mb-4">
          {/* Purpose & Requirements Tab */}
          <Tab eventKey="purpose" title="1. Define Purpose">
            <Card className="border-0 shadow-sm">
              <Card.Body className="p-4">
                <h5 className="mb-3">What do you want your agent to do?</h5>
                
                <Form.Group className="mb-4">
                  <Form.Label>Agent Purpose <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    placeholder="Describe what you want your agent to accomplish. For example: 'Automate Excel report generation from Teams data' or 'Process GitHub pull requests and send notifications'"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                  />
                  <Form.Text className="text-muted">
                    Be specific about your requirements. Our AI will analyze this to recommend the best approach.
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>Additional Requirements</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Any specific requirements, constraints, or preferences..."
                    value={requirements}
                    onChange={(e) => setRequirements(e.target.value)}
                  />
                </Form.Group>

                <div className="d-flex gap-2">
                  <Button 
                    variant="primary" 
                    onClick={analyzeRequirements}
                    disabled={!purpose.trim() || isAnalyzing}
                  >
                    {isAnalyzing ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Analyzing Requirements...
                      </>
                    ) : (
                      <>
                        🧠 Analyze & Get Recommendations
                      </>
                    )}
                  </Button>
                </div>

                {isAnalyzing && (
                  <div className="mt-3">
                    <div className="d-flex justify-content-between mb-2">
                      <small>Intelligence Analysis Progress</small>
                      <small>{buildProgress}%</small>
                    </div>
                    <ProgressBar now={buildProgress} variant="primary" />
                  </div>
                )}
              </Card.Body>
            </Card>
          </Tab>

          {/* Template Selection Tab */}
          <Tab eventKey="templates" title="2. Select Template" disabled={recommendations.length === 0}>
            <Card className="border-0 shadow-sm">
              <Card.Body className="p-4">
                <h5 className="mb-3">🎯 AI Recommendations</h5>
                
                {recommendations.length > 0 && (
                  <Alert variant="success" className="mb-4">
                    <strong>Intelligence Analysis Complete!</strong> Found {recommendations.length} recommended templates based on your requirements.
                  </Alert>
                )}

                <Row>
                  {recommendations.map((rec, index) => (
                    <Col md={6} lg={4} key={rec.template.id} className="mb-4">
                      <Card 
                        className={`h-100 ${selectedTemplate?.id === rec.template.id ? 'border-primary' : 'border-light'}`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => selectTemplate(rec.template)}
                      >
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <Badge bg="success" className="mb-2">
                              #{index + 1} Recommendation
                            </Badge>
                            <Badge bg={getCategoryColor(rec.template.category)}>
                              {rec.template.category.toUpperCase()}
                            </Badge>
                          </div>
                          
                          <h6 className="mb-2">{rec.template.name}</h6>
                          <p className="text-muted small mb-3">{rec.template.description}</p>
                          
                          <div className="mb-3">
                            <div className="d-flex justify-content-between mb-1">
                              <small>AI Confidence</small>
                              <small>{Math.round(rec.confidence * 100)}%</small>
                            </div>
                            <ProgressBar 
                              now={rec.confidence * 100} 
                              variant={rec.confidence > 0.8 ? 'success' : 'warning'}
                              size="sm"
                            />
                          </div>

                          <div className="mb-3">
                            <small className="text-muted d-block mb-1">Reasoning:</small>
                            <small className="text-info">{rec.reasoning}</small>
                          </div>

                          <div className="d-flex justify-content-between align-items-center">
                            <Badge bg={getComplexityColor(rec.template.complexity)}>
                              {rec.template.complexity}
                            </Badge>
                            <small className="text-muted">{rec.template.estimatedCost}</small>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>

                {selectedTemplate && (
                  <Alert variant="primary" className="mt-4">
                    <strong>Selected:</strong> {selectedTemplate.name} - Ready to configure!
                  </Alert>
                )}
              </Card.Body>
            </Card>
          </Tab>

          {/* Configuration Tab */}
          <Tab eventKey="configure" title="3. Configure" disabled={!selectedTemplate}>
            <Card className="border-0 shadow-sm">
              <Card.Body className="p-4">
                {selectedTemplate && (
                  <>
                    <h5 className="mb-3">⚙️ Configure {selectedTemplate.name}</h5>
                    
                    <Alert variant="info" className="mb-4">
                      <strong>Template Features:</strong>
                      <ul className="mb-0 mt-2">
                        {selectedTemplate.features.map((feature, index) => (
                          <li key={index}>{feature}</li>
                        ))}
                      </ul>
                    </Alert>

                    <Form>
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Agent Name</Form.Label>
                            <Form.Control 
                              type="text" 
                              placeholder="My Custom Agent"
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Environment</Form.Label>
                            <Form.Select>
                              <option>Development</option>
                              <option>Staging</option>
                              <option>Production</option>
                            </Form.Select>
                          </Form.Group>
                        </Col>
                      </Row>

                      <Form.Group className="mb-3">
                        <Form.Label>Configuration Parameters</Form.Label>
                        <Form.Control 
                          as="textarea" 
                          rows={4}
                          placeholder="Enter configuration parameters in JSON format..."
                        />
                      </Form.Group>

                      <div className="d-flex gap-2">
                        <Button variant="success" size="lg">
                          🚀 Deploy Agent
                        </Button>
                        <Button variant="outline-secondary">
                          💾 Save as Draft
                        </Button>
                        <Button variant="outline-info">
                          🧪 Test Configuration
                        </Button>
                      </div>
                    </Form>
                  </>
                )}
              </Card.Body>
            </Card>
          </Tab>
        </Tabs>
      </Container>
    </div>
  );
};

export default HybridAgentBuilder;