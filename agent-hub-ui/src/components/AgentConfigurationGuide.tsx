import React, { useState } from 'react';
import { Alert, Card, Row, Col, Button, Collapse, Badge } from 'react-bootstrap';

interface AgentConfigurationGuideProps {
  compact?: boolean;
}

const AgentConfigurationGuide: React.FC<AgentConfigurationGuideProps> = ({ compact = false }) => {
  const [isExpanded, setIsExpanded] = useState(!compact);

  return (
    <Card className="mb-4" style={{ border: '2px solid #3b82f6' }}>
      <Card.Header 
        style={{ 
          background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
          color: '#fff',
          cursor: compact ? 'pointer' : 'default'
        }}
        onClick={() => compact && setIsExpanded(!isExpanded)}
      >
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <strong style={{ color: '#ffffff' }}>💡 Configuration Guide</strong>
            <span className="ms-2" style={{ fontSize: '0.9rem', color: '#ffffff' }}>
              When to use Vector DB, MCP Server, or Model Directly
            </span>
          </div>
          {compact && (
            <Button 
              variant="link" 
              size="sm" 
              style={{ color: '#fff', textDecoration: 'none' }}
            >
              {isExpanded ? '▼ Hide' : '▶ Show Guide'}
            </Button>
          )}
        </div>
      </Card.Header>
      
      <Collapse in={isExpanded}>
        <Card.Body>
          <Row className="g-3">
            {/* Vector DB / Knowledge Base (RAG) */}
            <Col md={4}>
              <Card className="h-100" style={{ border: '2px solid #10b981' }}>
                <Card.Header style={{ background: '#10b981', color: '#fff' }}>
                  <strong>📖 Vector DB (RAG)</strong>
                  <Badge bg="light" text="dark" className="ms-2">Knowledge Base</Badge>
                </Card.Header>
                <Card.Body>
                  <h6 className="text-success mb-3">✅ Use When:</h6>
                  <ul className="small mb-3">
                    <li>You need to query <strong>custom documents</strong> or knowledge bases</li>
                    <li>Your agent needs <strong>domain-specific information</strong></li>
                    <li>You want to provide <strong>context from your own data</strong></li>
                    <li>You need <strong>semantic search</strong> across documents</li>
                    <li>Working with <strong>large document collections</strong></li>
                  </ul>
                  
                  <h6 className="text-primary mb-2">📋 Examples:</h6>
                  <ul className="small mb-3">
                    <li>Company policy Q&A bot</li>
                    <li>Technical documentation assistant</li>
                    <li>Product catalog search</li>
                    <li>Legal document analysis</li>
                    <li>Research paper summarization</li>
                  </ul>
                  
                  <Alert variant="info" className="small mb-0">
                    <strong>How it works:</strong> Converts your documents into embeddings, stores them in a vector database, and retrieves relevant context before sending to the AI model.
                  </Alert>
                </Card.Body>
              </Card>
            </Col>

            {/* MCP Server */}
            <Col md={4}>
              <Card className="h-100" style={{ border: '2px solid #f59e0b' }}>
                <Card.Header style={{ background: '#f59e0b', color: '#fff' }}>
                  <strong>🔌 MCP Server</strong>
                  <Badge bg="light" text="dark" className="ms-2">Tool Integration</Badge>
                </Card.Header>
                <Card.Body>
                  <h6 className="text-warning mb-3">✅ Use When:</h6>
                  <ul className="small mb-3">
                    <li>Your agent needs to <strong>interact with external tools</strong></li>
                    <li>You want <strong>real-time data access</strong> (APIs, databases)</li>
                    <li>You need to <strong>perform actions</strong> (file operations, API calls)</li>
                    <li>You want <strong>dynamic capabilities</strong> that change over time</li>
                    <li>Integrating with <strong>third-party services</strong></li>
                  </ul>
                  
                  <h6 className="text-primary mb-2">📋 Examples:</h6>
                  <ul className="small mb-3">
                    <li>GitHub repository management</li>
                    <li>Database query execution</li>
                    <li>File system operations</li>
                    <li>Slack/Teams integration</li>
                    <li>Weather/stock data fetching</li>
                  </ul>
                  
                  <Alert variant="info" className="small mb-0">
                    <strong>How it works:</strong> Provides your agent with tools and functions it can call to interact with external systems, APIs, and services in real-time.
                  </Alert>
                </Card.Body>
              </Card>
            </Col>

            {/* Model Directly */}
            <Col md={4}>
              <Card className="h-100" style={{ border: '2px solid #8b5cf6' }}>
                <Card.Header style={{ background: '#8b5cf6', color: '#fff' }}>
                  <strong>🧠 Model Directly</strong>
                  <Badge bg="light" text="dark" className="ms-2">Pure AI</Badge>
                </Card.Header>
                <Card.Body>
                  <h6 className="text-primary mb-3">✅ Use When:</h6>
                  <ul className="small mb-3">
                    <li>You need <strong>general knowledge</strong> responses</li>
                    <li>Your task is <strong>creative or generative</strong></li>
                    <li>You want <strong>simple conversational AI</strong></li>
                    <li>No external data or tools needed</li>
                    <li>Working with <strong>text transformation</strong> tasks</li>
                  </ul>
                  
                  <h6 className="text-primary mb-2">📋 Examples:</h6>
                  <ul className="small mb-3">
                    <li>Content generation (blogs, emails)</li>
                    <li>Language translation</li>
                    <li>Code generation/explanation</li>
                    <li>General Q&A chatbot</li>
                    <li>Text summarization</li>
                  </ul>
                  
                  <Alert variant="info" className="small mb-0">
                    <strong>How it works:</strong> Sends prompts directly to the AI model (GPT-4, Claude, etc.) using only the model's built-in knowledge and your prompt.
                  </Alert>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Combination Scenarios */}
          <Alert variant="success" className="mt-4 mb-0">
            <Row>
              <Col md={12}>
                <h6 className="mb-3">🎯 <strong>Pro Tip: Combine Multiple Approaches!</strong></h6>
              </Col>
              <Col md={6}>
                <div className="mb-2">
                  <Badge bg="success" className="me-2">Vector DB + Model</Badge>
                  <span className="small">
                    Perfect for <strong>knowledge-enhanced chatbots</strong> that need both custom data and AI reasoning
                  </span>
                </div>
                <div className="mb-2">
                  <Badge bg="warning" className="me-2">MCP + Model</Badge>
                  <span className="small">
                    Ideal for <strong>action-oriented agents</strong> that need to interact with tools and APIs
                  </span>
                </div>
              </Col>
              <Col md={6}>
                <div className="mb-2">
                  <Badge bg="info" className="me-2">Vector DB + MCP + Model</Badge>
                  <span className="small">
                    Ultimate setup for <strong>enterprise agents</strong> with custom knowledge, tool access, and AI reasoning
                  </span>
                </div>
                <div className="mb-2">
                  <Badge bg="secondary" className="me-2">Model Only</Badge>
                  <span className="small">
                    Best for <strong>simple use cases</strong> where built-in AI knowledge is sufficient
                  </span>
                </div>
              </Col>
            </Row>
          </Alert>

          {/* Quick Decision Tree */}
          <Card className="mt-3" style={{ background: '#f8fafc' }}>
            <Card.Body>
              <h6 className="mb-3">🤔 <strong>Quick Decision Tree:</strong></h6>
              <div className="small">
                <div className="mb-2">
                  <strong>1. Do you need custom/proprietary data?</strong>
                  <div className="ms-3 text-muted">
                    ✅ Yes → Use <Badge bg="success">Vector DB</Badge>
                    <br />
                    ❌ No → Continue to question 2
                  </div>
                </div>
                <div className="mb-2">
                  <strong>2. Does your agent need to perform actions or call APIs?</strong>
                  <div className="ms-3 text-muted">
                    ✅ Yes → Use <Badge bg="warning">MCP Server</Badge>
                    <br />
                    ❌ No → Continue to question 3
                  </div>
                </div>
                <div className="mb-0">
                  <strong>3. Is general AI knowledge sufficient?</strong>
                  <div className="ms-3 text-muted">
                    ✅ Yes → Use <Badge bg="primary">Model Directly</Badge>
                    <br />
                    ❌ No → Reconsider questions 1 & 2
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Card.Body>
      </Collapse>
    </Card>
  );
};

export default AgentConfigurationGuide;
