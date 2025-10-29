import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Button, Alert, Row, Col, Badge, Spinner, Accordion } from 'react-bootstrap';
import { nlpAnalysisService, NLPAnalysis, TemplateMatch } from '../services/nlpAnalysisService';
import BedrockStatus from './BedrockStatus';
import BedrockModelSelector from './BedrockModelSelector';

const NLPAgentBuilder: React.FC = () => {
  const navigate = useNavigate();
  
  // Core agent data
  const [agentName, setAgentName] = useState('');
  const [agentDescription, setAgentDescription] = useState('');
  const [processingLogic, setProcessingLogic] = useState('');
  
  // NLP Analysis
  const [nlpAnalysis, setNlpAnalysis] = useState<NLPAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [templateSuggestions, setTemplateSuggestions] = useState<TemplateMatch[]>([]);
  const [nameSuggestions, setNameSuggestions] = useState<string[]>([]);
  
  // Manual overrides (advanced)
  const [manualType, setManualType] = useState('');
  const [manualFrameworks, setManualFrameworks] = useState<string[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Bedrock integration
  const [selectedBedrockModel, setSelectedBedrockModel] = useState<string>('');
  const [selectedBedrockModelName, setSelectedBedrockModelName] = useState<string>('');
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Debounced NLP analysis
  const analyzeDescription = useCallback(
    async (description: string) => {
      if (description.length < 20) {
        setNlpAnalysis(null);
        setTemplateSuggestions([]);
        setNameSuggestions([]);
        return;
      }

      setIsAnalyzing(true);
      try {
        const analysis = await nlpAnalysisService.analyzeDescription(description);
        setNlpAnalysis(analysis);
        
        const templates = nlpAnalysisService.getTemplateSuggestions(analysis);
        setTemplateSuggestions(templates);
        
        const names = nlpAnalysisService.generateNameSuggestions(description, analysis);
        setNameSuggestions(names);
      } catch (error) {
        console.error('NLP analysis failed:', error);
      } finally {
        setIsAnalyzing(false);
      }
    },
    []
  );

  // Debounce the analysis
  useEffect(() => {
    const timer = setTimeout(() => {
      if (agentDescription) {
        analyzeDescription(agentDescription);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [agentDescription, analyzeDescription]);

  const handleCreateAgent = async () => {
    if (!agentName || !agentDescription || !processingLogic) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const finalType = manualType || nlpAnalysis?.type || 'Custom';
      const finalFrameworks = manualFrameworks.length > 0 ? manualFrameworks : nlpAnalysis?.frameworks || [];

      const requestBody = {
        templateId: 'custom',
        name: agentName,
        description: agentDescription,
        purpose: agentDescription, // Use description as purpose
        category: finalType,
        inputSchema: [
          {
            name: 'input',
            type: 'string',
            required: true,
            description: 'Input data for processing'
          }
        ],
        outputSchema: [
          {
            name: 'result',
            type: 'string',
            description: 'Processed output'
          },
          {
            name: 'analysis',
            type: 'object',
            description: 'Analysis metadata'
          }
        ],
        processingLogic: processingLogic,
        selectedModel: selectedBedrockModel,
        metadata: {
          nlpAnalysis: nlpAnalysis,
          detectedFrameworks: finalFrameworks,
          confidence: nlpAnalysis?.confidence || 0
        }
      };

      const response = await fetch('http://localhost:3002/api/v1/agents/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(`✅ Agent "${agentName}" created successfully!`);
        setTimeout(() => {
          navigate('/agents');
        }, 2000);
      } else {
        setError(result.error || 'Failed to create agent');
      }
    } catch (error) {
      setError('Failed to create agent: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const applyTemplate = (template: TemplateMatch) => {
    setAgentName(template.name);
    setProcessingLogic(`This agent is designed to ${template.description.toLowerCase()}. It will process the input data according to the following logic:\n\n1. Analyze the input data\n2. Apply ${template.name.toLowerCase()} processing\n3. Generate structured output\n4. Provide analysis metadata`);
  };

  const applyNameSuggestion = (name: string) => {
    setAgentName(name);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'success';
    if (confidence >= 0.6) return 'warning';
    return 'danger';
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.8) return 'High Confidence';
    if (confidence >= 0.6) return 'Medium Confidence';
    return 'Low Confidence';
  };

  return (
    <div className="container-fluid py-4">
      <Row>
        <Col lg={8}>
          <Card>
            <Card.Header className="bg-primary text-white">
              <h4 className="mb-1">🤖 Create Your Agent with Natural Language</h4>
              <p className="mb-0" style={{ fontSize: '0.95rem', opacity: '0.95' }}>
                Describe what you want your agent to do, and we'll configure it automatically
              </p>
            </Card.Header>
            <Card.Body>
              {error && <Alert variant="danger">{error}</Alert>}
              {success && <Alert variant="success">{success}</Alert>}

              {/* Agent Description - Main Input */}
              <Form.Group className="mb-4">
                <Form.Label>
                  <h5>📝 Describe Your Agent</h5>
                  <div className="text-muted" style={{ fontSize: '0.9rem' }}>
                    Tell us what your agent should do in natural language. Be specific about the task, input, and expected output.
                  </div>
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  placeholder="Example: Create a code review agent that analyzes Python code for security vulnerabilities, checks coding standards, and suggests improvements. It should accept code files as input and return a detailed analysis report with recommendations."
                  value={agentDescription}
                  onChange={(e) => setAgentDescription(e.target.value)}
                  className="mb-2"
                />
                <div className="d-flex justify-content-between">
                  <span className="text-muted" style={{ fontSize: '0.85rem' }}>
                    {agentDescription.length}/500 characters
                  </span>
                  {isAnalyzing && (
                    <span className="text-primary" style={{ fontSize: '0.85rem' }}>
                      <Spinner animation="border" size="sm" className="me-1" />
                      Analyzing description...
                    </span>
                  )}
                </div>
              </Form.Group>

              {/* NLP Analysis Results */}
              {nlpAnalysis && (
                <Alert variant="info" className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <strong>🔍 Auto-detected Properties</strong>
                    <Badge bg={getConfidenceColor(nlpAnalysis.confidence)}>
                      {getConfidenceText(nlpAnalysis.confidence)}
                    </Badge>
                  </div>
                  <Row>
                    <Col md={6}>
                      <div className="mb-2">
                        <strong>Type:</strong>
                        <Badge bg="primary" className="ms-2">{nlpAnalysis.type}</Badge>
                      </div>
                      {nlpAnalysis.frameworks.length > 0 && (
                        <div className="mb-2">
                          <strong>Frameworks:</strong>
                          {nlpAnalysis.frameworks.map(fw => (
                            <Badge key={fw} bg="secondary" className="ms-1">{fw}</Badge>
                          ))}
                        </div>
                      )}
                    </Col>
                    <Col md={6}>
                      {nlpAnalysis.capabilities.length > 0 && (
                        <div className="mb-2">
                          <strong>Capabilities:</strong>
                          <div className="mt-1">
                            {nlpAnalysis.capabilities.slice(0, 4).map(cap => (
                              <Badge key={cap} bg="outline-info" className="me-1 mb-1" style={{fontSize: '0.7rem'}}>
                                {cap.replace('_', ' ')}
                              </Badge>
                            ))}
                            {nlpAnalysis.capabilities.length > 4 && (
                              <Badge bg="outline-secondary" style={{fontSize: '0.7rem'}}>
                                +{nlpAnalysis.capabilities.length - 4} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </Col>
                  </Row>
                </Alert>
              )}

              {/* Template Suggestions */}
              {templateSuggestions.length > 0 && (
                <Alert variant="success" className="mb-4">
                  <Alert.Heading className="h6">💡 Suggested Templates</Alert.Heading>
                  <div className="d-flex gap-2 flex-wrap">
                    {templateSuggestions.map(template => (
                      <Button 
                        key={template.id}
                        variant="outline-success" 
                        size="sm"
                        onClick={() => applyTemplate(template)}
                      >
                        {template.name}
                        <Badge bg="success" className="ms-1">
                          {Math.round(template.confidence * 100)}%
                        </Badge>
                      </Button>
                    ))}
                  </div>
                </Alert>
              )}

              {/* Agent Name */}
              <Form.Group className="mb-3">
                <Form.Label>
                  <strong>Agent Name</strong> <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter a name for your agent"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                />
                {nameSuggestions.length > 0 && (
                  <div className="mt-2">
                    <span className="text-muted" style={{ fontSize: '0.85rem' }}>Suggestions: </span>
                    {nameSuggestions.map(name => (
                      <Button
                        key={name}
                        variant="outline-primary"
                        size="sm"
                        className="me-1 mb-1"
                        onClick={() => applyNameSuggestion(name)}
                      >
                        {name}
                      </Button>
                    ))}
                  </div>
                )}
              </Form.Group>

              {/* Processing Logic */}
              <Form.Group className="mb-4">
                <Form.Label>
                  <strong>Processing Logic</strong> <span className="text-danger">*</span>
                  <div className="text-muted d-block" style={{ fontSize: '0.9rem' }}>
                    Describe the step-by-step logic for how your agent should process the input
                  </div>
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={6}
                  placeholder="Describe the processing steps:&#10;1. Parse the input data&#10;2. Apply validation rules&#10;3. Process according to business logic&#10;4. Format the output&#10;5. Return results with metadata"
                  value={processingLogic}
                  onChange={(e) => setProcessingLogic(e.target.value)}
                />
              </Form.Group>

              {/* Bedrock Model Selection */}
              <BedrockModelSelector
                selectedModel={selectedBedrockModel}
                onModelChange={(modelId, modelName) => {
                  setSelectedBedrockModel(modelId);
                  setSelectedBedrockModelName(modelName);
                }}
                agentType={nlpAnalysis?.type?.toLowerCase() || 'custom'}
                label="AI Model (Optional)"
                required={false}
              />

              {/* Advanced Configuration */}
              <Accordion className="mt-4">
                <Accordion.Item eventKey="0">
                  <Accordion.Header>
                    ⚙️ Advanced Configuration (Optional)
                  </Accordion.Header>
                  <Accordion.Body>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Override Auto-detected Type</Form.Label>
                          <Form.Select 
                            value={manualType} 
                            onChange={(e) => setManualType(e.target.value)}
                          >
                            <option value="">
                              Use Auto-detected ({nlpAnalysis?.type || 'Custom'})
                            </option>
                            <option value="QE">QE/Testing</option>
                            <option value="DevOps">DevOps</option>
                            <option value="Security">Security</option>
                            <option value="Business">Business</option>
                            <option value="Code Review">Code Review</option>
                            <option value="Data Processing">Data Processing</option>
                            <option value="Custom">Custom</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Additional Frameworks</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="e.g., React, Docker, AWS"
                            value={manualFrameworks.join(', ')}
                            onChange={(e) => setManualFrameworks(
                              e.target.value.split(',').map(f => f.trim()).filter(f => f)
                            )}
                          />
                          <Form.Text className="text-muted">
                            Comma-separated list of additional frameworks
                          </Form.Text>
                        </Form.Group>
                      </Col>
                    </Row>
                  </Accordion.Body>
                </Accordion.Item>
              </Accordion>

              {/* Create Button */}
              <div className="d-grid gap-2 mt-4">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleCreateAgent}
                  disabled={loading || !agentName || !agentDescription || !processingLogic}
                >
                  {loading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Creating Agent...
                    </>
                  ) : (
                    '🚀 Create Agent'
                  )}
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Sidebar */}
        <Col lg={4}>
          <BedrockStatus />
          
          {/* Tips Card */}
          <Card className="mt-4">
            <Card.Header>
              <h6 className="mb-0">💡 Tips for Better Results</h6>
            </Card.Header>
            <Card.Body>
              <ul className="mb-0" style={{ fontSize: '0.9rem' }}>
                <li><strong>Be specific:</strong> Include input types, processing steps, and expected outputs</li>
                <li><strong>Mention frameworks:</strong> Include technologies like Python, React, Docker, etc.</li>
                <li><strong>Describe the domain:</strong> Testing, security, data processing, etc.</li>
                <li><strong>Include examples:</strong> "processes CSV files and generates reports"</li>
              </ul>
            </Card.Body>
          </Card>

          {/* Example Descriptions */}
          <Card className="mt-3">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h6 className="mb-0">📋 Example Descriptions</h6>
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => {
                  console.log('Navigating to classic builder...');
                  navigate('/agent-builder-classic');
                }}
                style={{ fontWeight: '500' }}
              >
                🔧 Classic Builder
              </Button>
            </Card.Header>
            <Card.Body>
              <div style={{ fontSize: '0.9rem' }}>
                <div className="mb-2">
                  <strong>Code Review:</strong>
                  <div className="text-muted" style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
                    "Analyze Python code for security vulnerabilities and suggest improvements"
                  </div>
                </div>
                <div className="mb-2">
                  <strong>Testing:</strong>
                  <div className="text-muted" style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
                    "Generate Selenium test cases for web application login flows"
                  </div>
                </div>
                <div className="mb-0">
                  <strong>Data Processing:</strong>
                  <div className="text-muted" style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
                    "Process CSV files, validate data, and generate summary reports"
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default NLPAgentBuilder;