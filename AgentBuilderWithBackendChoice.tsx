/**
 * AgentBuilderWithBackendChoice
 * 
 * Allows users to choose between Custom Agent (Bedrock Runtime) 
 * and Bedrock Agent (AWS-Managed) with appropriate configuration screens
 */

import React, { useState } from 'react';
import { Container, Card, Row, Col, Button, Form, Badge, Alert } from 'react-bootstrap';

type AgentBackend = 'custom' | 'bedrock-agent' | null;

const AgentBuilderWithBackendChoice: React.FC = () => {
  const [backend, setBackend] = useState<AgentBackend>(null);
  const [step, setStep] = useState(1);
  
  // Custom Agent state
  const [customConfig, setCustomConfig] = useState({
    name: '',
    description: '',
    model: 'anthropic.claude-3-haiku-20240307-v1:0',
    systemPrompt: '',
    temperature: 0.7,
    maxTokens: 2000,
    ragEnabled: false,
    vectorDB: {
      provider: 'pinecone',
      apiKey: '',
      environment: '',
      indexName: '',
      topK: 5,
      minSimilarity: 0.7
    },
    orchestration: 'simple',
    tools: [],
    memory: {
      enabled: false,
      backend: 'redis',
      maxMessages: 20
    },
    security: {
      inputValidation: true,
      outputValidation: true,
      rateLimit: 100
    }
  });
  
  // Bedrock Agent state
  const [bedrockConfig, setBedrockConfig] = useState({
    name: '',
    description: '',
    model: 'anthropic.claude-3-haiku-20240307-v1:0',
    instructions: '',
    knowledgeBases: [],
    actionGroups: [],
    guardrails: {
      enabled: false,
      type: 'default'
    }
  });
  
  // Step 1: Choose Backend
  const renderBackendChoice = () => (
    <Container className="py-5">
      <h2 className="mb-4">Create New Agent</h2>
      <p className="text-muted mb-4">Choose how to build your agent:</p>
      
      <Row>
        {/* Custom Agent Option */}
        <Col md={6}>
          <Card 
            className={`h-100 cursor-pointer ${backend === 'custom' ? 'border-primary' : ''}`}
            onClick={() => setBackend('custom')}
            style={{ cursor: 'pointer' }}
          >
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start mb-3">
                <h4>🔧 Custom Agent</h4>
                <Badge bg="info">Full Control</Badge>
              </div>
              
              <p className="text-muted mb-3">Build with Bedrock Runtime API</p>
              
              <div className="mb-3">
                <strong>✅ Advantages:</strong>
                <ul className="mt-2">
                  <li>Full control over orchestration</li>
                  <li>Custom features and logic</li>
                  <li>Your infrastructure</li>
                  <li>Unique agent types</li>
                  <li>Lower per-request cost</li>
                </ul>
              </div>
              
              <div className="mb-3">
                <strong>⚠️ Considerations:</strong>
                <ul className="mt-2">
                  <li>More configuration required</li>
                  <li>You maintain the code</li>
                  <li>Manual RAG setup</li>
                  <li>Custom monitoring</li>
                </ul>
              </div>
              
              <div className="mt-3">
                <Badge bg="secondary" className="me-2">30-60 min setup</Badge>
                <Badge bg="secondary">8 configuration steps</Badge>
              </div>
              
              <Button 
                variant={backend === 'custom' ? 'primary' : 'outline-primary'}
                className="w-100 mt-3"
                onClick={() => {
                  setBackend('custom');
                  setStep(2);
                }}
              >
                Select Custom Agent
              </Button>
            </Card.Body>
          </Card>
        </Col>
        
        {/* Bedrock Agent Option */}
        <Col md={6}>
          <Card 
            className={`h-100 cursor-pointer ${backend === 'bedrock-agent' ? 'border-primary' : ''}`}
            onClick={() => setBackend('bedrock-agent')}
            style={{ cursor: 'pointer' }}
          >
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start mb-3">
                <h4>⚡ Bedrock Agent</h4>
                <Badge bg="success">Quick & Easy</Badge>
              </div>
              
              <p className="text-muted mb-3">AWS-managed agent service</p>
              
              <div className="mb-3">
                <strong>✅ Advantages:</strong>
                <ul className="mt-2">
                  <li>Quick setup (5-10 minutes)</li>
                  <li>AWS-managed infrastructure</li>
                  <li>Built-in RAG & tools</li>
                  <li>Auto-scaling</li>
                  <li>Built-in monitoring</li>
                </ul>
              </div>
              
              <div className="mb-3">
                <strong>⚠️ Considerations:</strong>
                <ul className="mt-2">
                  <li>Less flexibility</li>
                  <li>AWS constraints</li>
                  <li>Higher per-request cost</li>
                  <li>Limited customization</li>
                </ul>
              </div>
              
              <div className="mt-3">
                <Badge bg="secondary" className="me-2">5-10 min setup</Badge>
                <Badge bg="secondary">5 configuration steps</Badge>
              </div>
              
              <Button 
                variant={backend === 'bedrock-agent' ? 'primary' : 'outline-primary'}
                className="w-100 mt-3"
                onClick={() => {
                  setBackend('bedrock-agent');
                  setStep(2);
                }}
              >
                Select Bedrock Agent
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Alert variant="info" className="mt-4">
        <strong>💡 Not sure which to choose?</strong>
        <ul className="mb-0 mt-2">
          <li><strong>Choose Bedrock Agent</strong> for standard use cases (customer support, Q&A, document search)</li>
          <li><strong>Choose Custom Agent</strong> for unique requirements, custom workflows, or full control</li>
        </ul>
      </Alert>
    </Container>
  );
  
  // Custom Agent Configuration Steps
  const renderCustomAgentConfig = () => {
    switch (step) {
      case 2:
        return renderCustomBasicInfo();
      case 3:
        return renderCustomPromptEngineering();
      case 4:
        return renderCustomRAGConfig();
      case 5:
        return renderCustomOrchestration();
      case 6:
        return renderCustomTools();
      case 7:
        return renderCustomMemory();
      case 8:
        return renderCustomSecurity();
      case 9:
        return renderCustomMonitoring();
      default:
        return null;
    }
  };
  
  const renderCustomBasicInfo = () => (
    <Container className="py-4">
      <h3>Step 2: Basic Information</h3>
      <Badge bg="info" className="mb-3">Custom Agent (Bedrock Runtime)</Badge>
      
      <Card>
        <Card.Body>
          <Form.Group className="mb-3">
            <Form.Label>Agent Name *</Form.Label>
            <Form.Control 
              placeholder="e.g., Customer Support Agent"
              value={customConfig.name}
              onChange={(e) => setCustomConfig({...customConfig, name: e.target.value})}
            />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control 
              as="textarea"
              rows={3}
              placeholder="Describe what this agent does..."
              value={customConfig.description}
              onChange={(e) => setCustomConfig({...customConfig, description: e.target.value})}
            />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Foundation Model *</Form.Label>
            <Form.Select 
              value={customConfig.model}
              onChange={(e) => setCustomConfig({...customConfig, model: e.target.value})}
            >
              <option value="anthropic.claude-3-haiku-20240307-v1:0">Claude 3 Haiku (Fastest, Cheapest)</option>
              <option value="anthropic.claude-3-sonnet-20240229-v1:0">Claude 3 Sonnet (Balanced)</option>
              <option value="anthropic.claude-3-5-sonnet-20240620-v1:0">Claude 3.5 Sonnet (Best)</option>
            </Form.Select>
            <Form.Text>💰 Cost: $0.25/$1.25 per 1M tokens</Form.Text>
          </Form.Group>
          
          <div className="d-flex justify-content-between mt-4">
            <Button variant="secondary" onClick={() => setStep(1)}>← Back</Button>
            <Button variant="primary" onClick={() => setStep(3)}>Next: Prompt Engineering →</Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
  
  const renderCustomPromptEngineering = () => (
    <Container className="py-4">
      <h3>Step 3: Instructions & Prompt Engineering</h3>
      <Badge bg="info" className="mb-3">Custom Agent - Full Control</Badge>
      
      <Card>
        <Card.Body>
          <Alert variant="warning">
            <strong>⚠️ Advanced Configuration Required</strong><br />
            You need to manually engineer prompts, handle context injection, and manage conversation flow.
          </Alert>
          
          <Form.Group className="mb-3">
            <Form.Label>System Prompt *</Form.Label>
            <Form.Control 
              as="textarea"
              rows={6}
              placeholder="You are a helpful assistant..."
              value={customConfig.systemPrompt}
              onChange={(e) => setCustomConfig({...customConfig, systemPrompt: e.target.value})}
            />
            <Form.Text>
              Available variables: {'{user_input}'}, {'{context}'}, {'{history}'}, {'{tools}'}
            </Form.Text>
          </Form.Group>
          
          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Temperature</Form.Label>
                <Form.Range 
                  min={0} 
                  max={1} 
                  step={0.1}
                  value={customConfig.temperature}
                  onChange={(e) => setCustomConfig({...customConfig, temperature: parseFloat(e.target.value)})}
                />
                <Form.Text>{customConfig.temperature}</Form.Text>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Max Tokens</Form.Label>
                <Form.Control 
                  type="number"
                  value={customConfig.maxTokens}
                  onChange={(e) => setCustomConfig({...customConfig, maxTokens: parseInt(e.target.value)})}
                />
              </Form.Group>
            </Col>
          </Row>
          
          <div className="d-flex justify-content-between mt-4">
            <Button variant="secondary" onClick={() => setStep(2)}>← Back</Button>
            <Button variant="primary" onClick={() => setStep(4)}>Next: RAG Configuration →</Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
  
  const renderCustomRAGConfig = () => (
    <Container className="py-4">
      <h3>Step 4: RAG Configuration</h3>
      <Badge bg="info" className="mb-3">Custom Agent - Manual Setup</Badge>
      
      <Card>
        <Card.Body>
          <Alert variant="warning">
            <strong>⚠️ Manual RAG Setup Required</strong><br />
            You need to configure vector database, embeddings, retrieval logic, and context injection manually.
          </Alert>
          
          <Form.Check 
            type="switch"
            label="Enable RAG / Knowledge Base"
            checked={customConfig.ragEnabled}
            onChange={(e) => setCustomConfig({...customConfig, ragEnabled: e.target.checked})}
            className="mb-3"
          />
          
          {customConfig.ragEnabled && (
            <>
              <Form.Group className="mb-3">
                <Form.Label>Vector DB Provider *</Form.Label>
                <Form.Select>
                  <option value="pinecone">Pinecone</option>
                  <option value="opensearch">OpenSearch</option>
                  <option value="chromadb">ChromaDB</option>
                </Form.Select>
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>API Key *</Form.Label>
                <Form.Control type="password" placeholder="Your API key" />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Environment *</Form.Label>
                <Form.Control placeholder="e.g., us-west1-gcp" />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Index Name *</Form.Label>
                <Form.Control placeholder="e.g., customer-support-kb" />
              </Form.Group>
              
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Top K Results</Form.Label>
                    <Form.Control type="number" defaultValue={5} />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Min Similarity</Form.Label>
                    <Form.Control type="number" step={0.1} defaultValue={0.7} />
                  </Form.Group>
                </Col>
              </Row>
              
              <Alert variant="info">
                <strong>You also need to implement:</strong>
                <ul className="mb-0 mt-2">
                  <li>Embedding generation logic</li>
                  <li>Vector search queries</li>
                  <li>Context injection into prompts</li>
                  <li>Re-ranking (optional)</li>
                </ul>
              </Alert>
            </>
          )}
          
          <div className="d-flex justify-content-between mt-4">
            <Button variant="secondary" onClick={() => setStep(3)}>← Back</Button>
            <Button variant="primary" onClick={() => setStep(5)}>Next: Orchestration →</Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
  
  // Bedrock Agent Configuration Steps
  const renderBedrockAgentConfig = () => {
    switch (step) {
      case 2:
        return renderBedrockBasicInfo();
      case 3:
        return renderBedrockInstructions();
      case 4:
        return renderBedrockKnowledgeBases();
      case 5:
        return renderBedrockActionGroups();
      case 6:
        return renderBedrockGuardrails();
      case 7:
        return renderBedrockReview();
      default:
        return null;
    }
  };
  
  const renderBedrockBasicInfo = () => (
    <Container className="py-4">
      <h3>Step 2: Basic Information</h3>
      <Badge bg="success" className="mb-3">Bedrock Agent (AWS-Managed)</Badge>
      
      <Card>
        <Card.Body>
          <Form.Group className="mb-3">
            <Form.Label>Agent Name *</Form.Label>
            <Form.Control 
              placeholder="e.g., Customer Support Agent"
              value={bedrockConfig.name}
              onChange={(e) => setBedrockConfig({...bedrockConfig, name: e.target.value})}
            />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control 
              as="textarea"
              rows={3}
              placeholder="Describe what this agent does..."
              value={bedrockConfig.description}
              onChange={(e) => setBedrockConfig({...bedrockConfig, description: e.target.value})}
            />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Foundation Model *</Form.Label>
            <Form.Select 
              value={bedrockConfig.model}
              onChange={(e) => setBedrockConfig({...bedrockConfig, model: e.target.value})}
            >
              <option value="anthropic.claude-3-haiku-20240307-v1:0">Claude 3 Haiku</option>
              <option value="anthropic.claude-3-sonnet-20240229-v1:0">Claude 3 Sonnet</option>
              <option value="anthropic.claude-3-5-sonnet-20240620-v1:0">Claude 3.5 Sonnet</option>
            </Form.Select>
            <Form.Text>💰 Cost: $0.25/$1.25 per 1M tokens + $0.0007/request</Form.Text>
          </Form.Group>
          
          <div className="d-flex justify-content-between mt-4">
            <Button variant="secondary" onClick={() => setStep(1)}>← Back</Button>
            <Button variant="primary" onClick={() => setStep(3)}>Next: Instructions →</Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
  
  const renderBedrockInstructions = () => (
    <Container className="py-4">
      <h3>Step 3: Instructions</h3>
      <Badge bg="success" className="mb-3">Bedrock Agent - Simplified</Badge>
      
      <Card>
        <Card.Body>
          <Alert variant="success">
            <strong>✅ Simplified Configuration</strong><br />
            Just provide clear instructions. AWS Bedrock handles prompt engineering, orchestration, and reasoning automatically.
          </Alert>
          
          <Form.Group className="mb-3">
            <Form.Label>Agent Instructions *</Form.Label>
            <Form.Control 
              as="textarea"
              rows={6}
              placeholder="You are a helpful customer support agent. Assist customers with product questions, technical support, and account issues. Be professional and empathetic."
              value={bedrockConfig.instructions}
              onChange={(e) => setBedrockConfig({...bedrockConfig, instructions: e.target.value})}
            />
            <Form.Text>
              💡 Tip: Be clear and specific. AWS Bedrock will handle the rest.
            </Form.Text>
          </Form.Group>
          
          <Alert variant="info">
            <strong>ℹ️ AWS automatically handles:</strong>
            <ul className="mb-0 mt-2">
              <li>Prompt engineering</li>
              <li>Multi-step reasoning</li>
              <li>Tool selection</li>
              <li>Context management</li>
            </ul>
          </Alert>
          
          <div className="d-flex justify-content-between mt-4">
            <Button variant="secondary" onClick={() => setStep(2)}>← Back</Button>
            <Button variant="primary" onClick={() => setStep(4)}>Next: Knowledge Bases →</Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
  
  const renderBedrockKnowledgeBases = () => (
    <Container className="py-4">
      <h3>Step 4: Knowledge Bases (Optional)</h3>
      <Badge bg="success" className="mb-3">Bedrock Agent - Built-in RAG</Badge>
      
      <Card>
        <Card.Body>
          <Alert variant="success">
            <strong>✅ Built-in RAG</strong><br />
            Just select knowledge bases. AWS handles chunking, embeddings, retrieval, and context injection automatically.
          </Alert>
          
          <Form.Group className="mb-3">
            <Form.Label>Select Knowledge Bases</Form.Label>
            <Form.Check 
              type="checkbox"
              label="Product Documentation (150 docs)"
              className="mb-2"
            />
            <Form.Check 
              type="checkbox"
              label="FAQ Database (75 docs)"
              className="mb-2"
            />
            <Form.Check 
              type="checkbox"
              label="Support Tickets Archive (500 docs)"
            />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Top K Results</Form.Label>
            <Form.Range min={1} max={20} defaultValue={5} />
            <Form.Text>5 results</Form.Text>
          </Form.Group>
          
          <Alert variant="info">
            <strong>ℹ️ AWS automatically handles:</strong>
            <ul className="mb-0 mt-2">
              <li>Document chunking</li>
              <li>Embedding generation</li>
              <li>Semantic search</li>
              <li>Context injection</li>
              <li>Re-ranking</li>
            </ul>
          </Alert>
          
          <div className="d-flex justify-content-between mt-4">
            <Button variant="secondary" onClick={() => setStep(3)}>← Back</Button>
            <Button variant="primary" onClick={() => setStep(5)}>Next: Action Groups →</Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
  
  // Main render
  if (step === 1) {
    return renderBackendChoice();
  }
  
  if (backend === 'custom') {
    return renderCustomAgentConfig();
  }
  
  if (backend === 'bedrock-agent') {
    return renderBedrockAgentConfig();
  }
  
  return null;
};

export default AgentBuilderWithBackendChoice;
