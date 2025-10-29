import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Button, Alert, Row, Col, Badge } from 'react-bootstrap';
import BedrockStatus from './BedrockStatus';
import BedrockModelSelector from './BedrockModelSelector';

interface AgentTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  purpose: string;
  inputSchema: {
    name: string;
    type: string;
    required: boolean;
    description: string;
  }[];
  outputSchema: {
    name: string;
    type: string;
    description: string;
  }[];
}

const PurposeDrivenAgentBuilder: React.FC = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<AgentTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<AgentTemplate | null>(null);
  const [agentName, setAgentName] = useState('');
  const [agentDescription, setAgentDescription] = useState('');
  const [inputs, setInputs] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Custom agent creation state
  const [customPurpose, setCustomPurpose] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [customInputs, setCustomInputs] = useState<Array<{name: string, type: string, required: boolean, description: string}>>([]);
  const [customOutputs, setCustomOutputs] = useState<Array<{name: string, type: string, description: string}>>([]);
  const [processingLogic, setProcessingLogic] = useState('');
  const [selectedBedrockModel, setSelectedBedrockModel] = useState<string>('');
  const [selectedBedrockModelName, setSelectedBedrockModelName] = useState<string>('');

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_URL || 'http://localhost:3002'}/api/v1/nlp/templates`);
      const data = await response.json();
      if (data.success) {
        setTemplates(data.data.templates);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
      setError('Failed to load agent templates');
    }
  };

  const handleTemplateSelect = (template: AgentTemplate) => {
    setSelectedTemplate(template);
    setAgentName(template.name);
    setAgentDescription(template.description);
    
    // Initialize inputs with empty values
    const initialInputs: Record<string, any> = {};
    template.inputSchema.forEach(input => {
      initialInputs[input.name] = '';
    });
    setInputs(initialInputs);
    setError(null);
    setSuccess(null);
  };

  const handleInputChange = (inputName: string, value: any) => {
    setInputs(prev => ({
      ...prev,
      [inputName]: value
    }));
  };

  const validateInputs = (): boolean => {
    if (!selectedTemplate) return false;
    
    if (selectedTemplate.id === 'custom') {
      // Validate custom agent
      if (!customPurpose.trim()) {
        setError('Agent purpose is required for custom agents');
        return false;
      }
      if (!processingLogic.trim()) {
        setError('Processing logic description is required');
        return false;
      }
      if (customInputs.length === 0) {
        setError('At least one input parameter is required');
        return false;
      }
      if (customOutputs.length === 0) {
        setError('At least one output parameter is required');
        return false;
      }
      
      // Validate input/output schemas
      const invalidInputs = customInputs.filter(input => !input.name.trim() || !input.description.trim());
      if (invalidInputs.length > 0) {
        setError('All input parameters must have name and description');
        return false;
      }
      
      const invalidOutputs = customOutputs.filter(output => !output.name.trim() || !output.description.trim());
      if (invalidOutputs.length > 0) {
        setError('All output parameters must have name and description');
        return false;
      }
      
      return true;
    } else {
      // Validate template-based agent
      const missingRequired = selectedTemplate.inputSchema
        .filter(input => input.required && !inputs[input.name]?.trim())
        .map(input => input.name);
      
      if (missingRequired.length > 0) {
        setError(`Please fill in required fields: ${missingRequired.join(', ')}`);
        return false;
      }
      
      return true;
    }
  };

  const createAgent = async () => {
    if (!selectedTemplate || !validateInputs()) return;

    setLoading(true);
    setError(null);

    try {
      let requestBody;
      
      if (selectedTemplate.id === 'custom') {
        // Create custom agent template first, then create agent
        requestBody = {
          templateId: 'custom',
          name: agentName,
          description: agentDescription,
          purpose: customPurpose,
          category: customCategory || 'Custom',
          inputSchema: customInputs,
          outputSchema: customOutputs,
          processingLogic: processingLogic,
          customInputs: inputs,
          bedrockConfig: selectedBedrockModel ? {
            defaultModel: selectedBedrockModel,
            modelName: selectedBedrockModelName,
            provider: 'aws-bedrock',
            region: 'us-east-1'
          } : undefined
        };
      } else {
        // Use existing template
        requestBody = {
          templateId: selectedTemplate.id,
          name: agentName,
          description: agentDescription,
          customInputs: inputs,
          bedrockConfig: selectedBedrockModel ? {
            defaultModel: selectedBedrockModel,
            modelName: selectedBedrockModelName,
            provider: 'aws-bedrock',
            region: 'us-east-1'
          } : undefined
        };
      }

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3002'}/api/v1/agents/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      const result = await response.json();
      
      if (result.success) {
        setSuccess('Agent created successfully! Redirecting to catalog...');
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

  const renderInputField = (input: any) => {
    const value = inputs[input.name] || '';
    
    switch (input.type) {
      case 'array':
        return (
          <Form.Control
            as="textarea"
            rows={3}
            value={Array.isArray(value) ? value.join('\n') : value}
            onChange={(e) => handleInputChange(input.name, e.target.value.split('\n').filter(v => v.trim()))}
            placeholder={`${input.description} (one per line)`}
          />
        );
      case 'object':
        return (
          <Form.Control
            as="textarea"
            rows={4}
            value={typeof value === 'object' ? JSON.stringify(value, null, 2) : value}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                handleInputChange(input.name, parsed);
              } catch {
                handleInputChange(input.name, e.target.value);
              }
            }}
            placeholder={`${input.description} (JSON format)`}
          />
        );
      default:
        return (
          <Form.Control
            type="text"
            value={value}
            onChange={(e) => handleInputChange(input.name, e.target.value)}
            placeholder={input.description}
          />
        );
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '2rem', textAlign: 'center' }}>
        Purpose-Driven Agent Builder
      </h1>
      
      {/* Bedrock Integration Status */}
      <div className="mb-4">
        <BedrockStatus showDetails={false} />
      </div>
      
      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="info" className="mb-4">
          {success}
        </Alert>
      )}

      {!selectedTemplate ? (
        <div>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h3 className="mb-0">Create Your Agent</h3>
            <Button 
              variant="primary" 
              onClick={() => setSelectedTemplate({ id: 'custom', name: 'Custom Agent', category: 'Custom', description: 'Create a new agent with custom purpose', purpose: 'Define your own agent purpose', inputSchema: [], outputSchema: [] })}
            >
              + Create Custom Agent
            </Button>
          </div>
          
          <Alert variant="info" className="mb-4">
            <strong>Two Ways to Create Agents:</strong>
            <ul className="mb-0 mt-2">
              <li><strong>Use Template:</strong> Start with a proven template for common tasks</li>
              <li><strong>Create Custom:</strong> Build a completely new agent with your own purpose and logic</li>
            </ul>
          </Alert>

          <h4 className="mb-3">Choose from Templates</h4>
          <Row>
            {templates.map((template) => (
              <Col md={6} lg={4} key={template.id} className="mb-4">
                <Card 
                  className="h-100 cursor-pointer border-2"
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleTemplateSelect(template)}
                >
                  <Card.Header className="bg-primary text-white">
                    <h5 className="mb-0">{template.name}</h5>
                    <Badge bg="light" text="dark">{template.category}</Badge>
                  </Card.Header>
                  <Card.Body>
                    <p className="text-muted mb-2">{template.description}</p>
                    <div className="mb-3">
                      <strong>Purpose:</strong>
                      <p className="small">{template.purpose}</p>
                    </div>
                    <div className="mb-2">
                      <strong>Inputs:</strong>
                      <ul className="small mb-0">
                        {template.inputSchema.slice(0, 3).map(input => (
                          <li key={input.name}>
                            {input.name} {input.required && <span className="text-danger">*</span>}
                          </li>
                        ))}
                        {template.inputSchema.length > 3 && <li>... and {template.inputSchema.length - 3} more</li>}
                      </ul>
                    </div>
                    <div>
                      <strong>Outputs:</strong>
                      <ul className="small mb-0">
                        {template.outputSchema.slice(0, 2).map(output => (
                          <li key={output.name}>{output.name}</li>
                        ))}
                        {template.outputSchema.length > 2 && <li>... and {template.outputSchema.length - 2} more</li>}
                      </ul>
                    </div>
                  </Card.Body>
                  <Card.Footer className="text-center">
                    <Button variant="outline-primary" size="sm">
                      Select This Template
                    </Button>
                  </Card.Footer>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      ) : (
        <div>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h3>{selectedTemplate.id === 'custom' ? 'Create Custom Agent' : `Configure ${selectedTemplate.name}`}</h3>
            <Button 
              variant="outline-secondary" 
              onClick={() => setSelectedTemplate(null)}
            >
              {selectedTemplate.id === 'custom' ? 'Back to Templates' : 'Change Template'}
            </Button>
          </div>

          <Row>
            <Col md={8}>
              <Card className="mb-4">
                <Card.Header>
                  <h5>{selectedTemplate.id === 'custom' ? 'Custom Agent Definition' : 'Agent Configuration'}</h5>
                </Card.Header>
                <Card.Body>
                  <Form.Group className="mb-3">
                    <Form.Label>Agent Name</Form.Label>
                    <Form.Control
                      type="text"
                      value={agentName}
                      onChange={(e) => setAgentName(e.target.value)}
                      placeholder="Enter a custom name for your agent"
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Description</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      value={agentDescription}
                      onChange={(e) => setAgentDescription(e.target.value)}
                      placeholder="Describe what this agent will do"
                    />
                  </Form.Group>

                  <BedrockModelSelector
                    selectedModel={selectedBedrockModel}
                    onModelChange={(modelId, modelName) => {
                      setSelectedBedrockModel(modelId);
                      setSelectedBedrockModelName(modelName);
                    }}
                    agentType={selectedTemplate?.category?.toLowerCase() || 'custom'}
                    label="AI Model"
                    required={false}
                  />

                  {selectedTemplate.id === 'custom' && (
                    <>
                      <Form.Group className="mb-3">
                        <Form.Label>Agent Purpose <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          value={customPurpose}
                          onChange={(e) => setCustomPurpose(e.target.value)}
                          placeholder="Define the specific purpose and context of your agent. Be clear about what it should accomplish and how it should behave."
                        />
                        <Form.Text className="text-muted">
                          This defines the agent's core functionality and ensures it performs only its intended task.
                        </Form.Text>
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label>Category</Form.Label>
                        <Form.Select
                          value={customCategory}
                          onChange={(e) => setCustomCategory(e.target.value)}
                        >
                          <option value="">Select a category</option>
                          <option value="Communication">Communication</option>
                          <option value="Data Processing">Data Processing</option>
                          <option value="Development">Development</option>
                          <option value="DevOps">DevOps</option>
                          <option value="Test Automation">Test Automation</option>
                          <option value="Business Logic">Business Logic</option>
                          <option value="Content Generation">Content Generation</option>
                          <option value="Analysis">Analysis</option>
                          <option value="Custom">Custom</option>
                        </Form.Select>
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label>Processing Logic Description <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={4}
                          value={processingLogic}
                          onChange={(e) => setProcessingLogic(e.target.value)}
                          placeholder="Describe how your agent should process inputs and generate outputs. Be specific about the logic, transformations, or operations it should perform."
                        />
                        <Form.Text className="text-muted">
                          This will be used to generate the actual processing logic for your agent.
                        </Form.Text>
                      </Form.Group>

                      <div className="mb-4">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h6>Input Schema</h6>
                          <Button 
                            variant="outline-primary" 
                            size="sm"
                            onClick={() => setCustomInputs([...customInputs, {name: '', type: 'string', required: true, description: ''}])}
                          >
                            + Add Input
                          </Button>
                        </div>
                        {customInputs.map((input, index) => (
                          <Card key={index} className="mb-2">
                            <Card.Body className="py-2">
                              <Row>
                                <Col md={3}>
                                  <Form.Control
                                    size="sm"
                                    placeholder="Input name"
                                    value={input.name}
                                    onChange={(e) => {
                                      const newInputs = [...customInputs];
                                      newInputs[index].name = e.target.value;
                                      setCustomInputs(newInputs);
                                    }}
                                  />
                                </Col>
                                <Col md={2}>
                                  <Form.Select
                                    size="sm"
                                    value={input.type}
                                    onChange={(e) => {
                                      const newInputs = [...customInputs];
                                      newInputs[index].type = e.target.value;
                                      setCustomInputs(newInputs);
                                    }}
                                  >
                                    <option value="string">String</option>
                                    <option value="number">Number</option>
                                    <option value="boolean">Boolean</option>
                                    <option value="array">Array</option>
                                    <option value="object">Object</option>
                                  </Form.Select>
                                </Col>
                                <Col md={5}>
                                  <Form.Control
                                    size="sm"
                                    placeholder="Description"
                                    value={input.description}
                                    onChange={(e) => {
                                      const newInputs = [...customInputs];
                                      newInputs[index].description = e.target.value;
                                      setCustomInputs(newInputs);
                                    }}
                                  />
                                </Col>
                                <Col md={1}>
                                  <Form.Check
                                    type="checkbox"
                                    label="Req"
                                    checked={input.required}
                                    onChange={(e) => {
                                      const newInputs = [...customInputs];
                                      newInputs[index].required = e.target.checked;
                                      setCustomInputs(newInputs);
                                    }}
                                  />
                                </Col>
                                <Col md={1}>
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => {
                                      const newInputs = customInputs.filter((_, i) => i !== index);
                                      setCustomInputs(newInputs);
                                    }}
                                  >
                                    ×
                                  </Button>
                                </Col>
                              </Row>
                            </Card.Body>
                          </Card>
                        ))}
                        {customInputs.length === 0 && (
                          <Alert variant="info" className="small">
                            Add input parameters that your agent will need to process.
                          </Alert>
                        )}
                      </div>

                      <div className="mb-4">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h6>Output Schema</h6>
                          <Button 
                            variant="outline-success" 
                            size="sm"
                            onClick={() => setCustomOutputs([...customOutputs, {name: '', type: 'string', description: ''}])}
                          >
                            + Add Output
                          </Button>
                        </div>
                        {customOutputs.map((output, index) => (
                          <Card key={index} className="mb-2">
                            <Card.Body className="py-2">
                              <Row>
                                <Col md={3}>
                                  <Form.Control
                                    size="sm"
                                    placeholder="Output name"
                                    value={output.name}
                                    onChange={(e) => {
                                      const newOutputs = [...customOutputs];
                                      newOutputs[index].name = e.target.value;
                                      setCustomOutputs(newOutputs);
                                    }}
                                  />
                                </Col>
                                <Col md={2}>
                                  <Form.Select
                                    size="sm"
                                    value={output.type}
                                    onChange={(e) => {
                                      const newOutputs = [...customOutputs];
                                      newOutputs[index].type = e.target.value;
                                      setCustomOutputs(newOutputs);
                                    }}
                                  >
                                    <option value="string">String</option>
                                    <option value="number">Number</option>
                                    <option value="boolean">Boolean</option>
                                    <option value="array">Array</option>
                                    <option value="object">Object</option>
                                  </Form.Select>
                                </Col>
                                <Col md={6}>
                                  <Form.Control
                                    size="sm"
                                    placeholder="Description"
                                    value={output.description}
                                    onChange={(e) => {
                                      const newOutputs = [...customOutputs];
                                      newOutputs[index].description = e.target.value;
                                      setCustomOutputs(newOutputs);
                                    }}
                                  />
                                </Col>
                                <Col md={1}>
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => {
                                      const newOutputs = customOutputs.filter((_, i) => i !== index);
                                      setCustomOutputs(newOutputs);
                                    }}
                                  >
                                    ×
                                  </Button>
                                </Col>
                              </Row>
                            </Card.Body>
                          </Card>
                        ))}
                        {customOutputs.length === 0 && (
                          <Alert variant="info" className="small">
                            Define what outputs your agent will produce.
                          </Alert>
                        )}
                      </div>
                    </>
                  )}

                  <h6 className="mb-3">Input Configuration</h6>
                  {selectedTemplate.inputSchema.map((input) => (
                    <Form.Group key={input.name} className="mb-3">
                      <Form.Label>
                        {input.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        {input.required && <span className="text-danger"> *</span>}
                      </Form.Label>
                      {renderInputField(input)}
                      <Form.Text className="text-muted">
                        {input.description}
                      </Form.Text>
                    </Form.Group>
                  ))}
                </Card.Body>
              </Card>

              <div className="text-center">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={createAgent}
                  disabled={loading}
                  style={{ minWidth: '200px' }}
                >
                  {loading ? 'Creating Agent...' : 'Create Agent'}
                </Button>
              </div>
            </Col>

            <Col md={4}>
              <Card>
                <Card.Header>
                  <h6>Agent Preview</h6>
                </Card.Header>
                <Card.Body>
                  {selectedTemplate.id === 'custom' ? (
                    <>
                      <div className="mb-3">
                        <strong>Purpose:</strong>
                        <p className="small text-muted">
                          {customPurpose || 'Define your agent\'s specific purpose above'}
                        </p>
                      </div>
                      
                      <div className="mb-3">
                        <strong>Category:</strong>
                        <Badge bg="secondary">{customCategory || 'Custom'}</Badge>
                      </div>

                      <div className="mb-3">
                        <strong>Inputs ({customInputs.length}):</strong>
                        {customInputs.length > 0 ? (
                          <ul className="small">
                            {customInputs.slice(0, 3).map((input, index) => (
                              <li key={index}>
                                <strong>{input.name}:</strong> {input.description}
                                {input.required && <span className="text-danger"> *</span>}
                              </li>
                            ))}
                            {customInputs.length > 3 && <li>... and {customInputs.length - 3} more</li>}
                          </ul>
                        ) : (
                          <p className="small text-muted">Add input parameters above</p>
                        )}
                      </div>

                      <div className="mb-3">
                        <strong>Outputs ({customOutputs.length}):</strong>
                        {customOutputs.length > 0 ? (
                          <ul className="small">
                            {customOutputs.slice(0, 3).map((output, index) => (
                              <li key={index}>
                                <strong>{output.name}:</strong> {output.description}
                              </li>
                            ))}
                            {customOutputs.length > 3 && <li>... and {customOutputs.length - 3} more</li>}
                          </ul>
                        ) : (
                          <p className="small text-muted">Define output parameters above</p>
                        )}
                      </div>

                      <Alert variant="info" className="small">
                        <strong>Custom Agent:</strong> This agent will be created with your specific purpose and processing logic. Ensure all fields are properly defined for optimal functionality.
                      </Alert>
                    </>
                  ) : (
                    <>
                      <div className="mb-3">
                        <strong>Purpose:</strong>
                        <p className="small text-muted">{selectedTemplate.purpose}</p>
                      </div>
                      
                      <div className="mb-3">
                        <strong>Category:</strong>
                        <Badge bg="primary">{selectedTemplate.category}</Badge>
                      </div>

                      <div className="mb-3">
                        <strong>Expected Outputs:</strong>
                        <ul className="small">
                          {selectedTemplate.outputSchema.map(output => (
                            <li key={output.name}>
                              <strong>{output.name}:</strong> {output.description}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <Alert variant="info" className="small">
                        This agent will perform only its intended function: {selectedTemplate.purpose.toLowerCase()}
                      </Alert>
                    </>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </div>
      )}
    </div>
  );
};

export default PurposeDrivenAgentBuilder;