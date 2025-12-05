/**
 * AgentTemplateSelector Component
 * 
 * Provides pre-configured agent templates for common use cases
 * 
 * Templates:
 * 1. Simple Chatbot - Bedrock only
 * 2. FAQ Bot - Vector DB only
 * 3. Code Assistant - Vector DB + MCP
 * 4. Data Analyst - MCP only
 * 5. Customer Support - Full stack (Vector DB + MCP)
 */

import React from 'react';
import { Container, Row, Col, Card, Badge, Button } from 'react-bootstrap';

interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  useCase: string;
  config: {
    vectorDB: {
      enabled: boolean;
      provider?: string;
      knowledgeBases?: string[];
      retrievalConfig?: {
        topK: number;
        minSimilarity: number;
      };
    };
    mcpConfig: {
      enabled: boolean;
      serverId?: string;
    };
    llmConfig: {
      model: string;
      temperature: number;
    };
  };
  estimatedCost: number;
  estimatedLatency: number;
  complexity: 'simple' | 'medium' | 'complex';
}

const AGENT_TEMPLATES: AgentTemplate[] = [
  {
    id: 'simple-chatbot',
    name: 'Simple Chatbot',
    description: 'Basic Q&A chatbot without external dependencies',
    icon: '💬',
    useCase: 'Basic Q&A, simple conversations, quick responses',
    config: {
      vectorDB: { enabled: false },
      mcpConfig: { enabled: false },
      llmConfig: {
        model: 'claude-3-haiku',
        temperature: 0.7
      }
    },
    estimatedCost: 0.50,
    estimatedLatency: 500,
    complexity: 'simple'
  },
  {
    id: 'faq-bot',
    name: 'FAQ Bot',
    description: 'Search documentation and answer questions from knowledge base',
    icon: '📚',
    useCase: 'Customer support, documentation search, knowledge base queries',
    config: {
      vectorDB: {
        enabled: true,
        provider: 'opensearch',
        knowledgeBases: [],
        retrievalConfig: {
          topK: 5,
          minSimilarity: 0.7
        }
      },
      mcpConfig: { enabled: false },
      llmConfig: {
        model: 'claude-3-haiku',
        temperature: 0.7
      }
    },
    estimatedCost: 0.75,
    estimatedLatency: 700,
    complexity: 'medium'
  },
  {
    id: 'code-assistant',
    name: 'Code Assistant',
    description: 'Search code repositories and use development tools',
    icon: '💻',
    useCase: 'Code review, API integration, development assistance',
    config: {
      vectorDB: {
        enabled: true,
        provider: 'opensearch',
        knowledgeBases: [],
        retrievalConfig: {
          topK: 10,
          minSimilarity: 0.6
        }
      },
      mcpConfig: {
        enabled: true,
        serverId: ''
      },
      llmConfig: {
        model: 'claude-3-sonnet',
        temperature: 0.5
      }
    },
    estimatedCost: 0.85,
    estimatedLatency: 1200,
    complexity: 'complex'
  },
  {
    id: 'data-analyst',
    name: 'Data Analyst',
    description: 'Query databases and analyze data using external tools',
    icon: '📊',
    useCase: 'Data analysis, SQL queries, report generation',
    config: {
      vectorDB: { enabled: false },
      mcpConfig: {
        enabled: true,
        serverId: ''
      },
      llmConfig: {
        model: 'claude-3-sonnet',
        temperature: 0.3
      }
    },
    estimatedCost: 0.60,
    estimatedLatency: 1000,
    complexity: 'medium'
  },
  {
    id: 'customer-support',
    name: 'Customer Support',
    description: 'Full-featured support agent with knowledge base and tools',
    icon: '🎧',
    useCase: 'Customer support, ticket management, escalation handling',
    config: {
      vectorDB: {
        enabled: true,
        provider: 'opensearch',
        knowledgeBases: [],
        retrievalConfig: {
          topK: 5,
          minSimilarity: 0.7
        }
      },
      mcpConfig: {
        enabled: true,
        serverId: ''
      },
      llmConfig: {
        model: 'claude-3-sonnet',
        temperature: 0.7
      }
    },
    estimatedCost: 0.85,
    estimatedLatency: 1200,
    complexity: 'complex'
  }
];

interface AgentTemplateSelectorProps {
  onSelectTemplate: (template: AgentTemplate | null) => void;
}

const AgentTemplateSelector: React.FC<AgentTemplateSelectorProps> = ({ onSelectTemplate }) => {
  
  const getComplexityColor = (complexity: string) => {
    return 'secondary';
  };
  
  const getExecutionMode = (template: AgentTemplate) => {
    const hasVectorDB = template.config.vectorDB.enabled;
    const hasMCP = template.config.mcpConfig.enabled;
    
    if (!hasVectorDB && !hasMCP) return 'Bedrock Only';
    if (hasVectorDB && !hasMCP) return 'RAG';
    if (!hasVectorDB && hasMCP) return 'MCP';
    if (hasVectorDB && hasMCP) return 'Full Stack';
    return 'Unknown';
  };
  
  return (
    <Container className="py-4">
      <div className="text-center mb-4">
        <h3>Choose an Agent Template</h3>
        <p className="text-muted">
          Start with a pre-configured template or create a custom agent from scratch
        </p>
      </div>
      
      <Row className="g-3">
        {AGENT_TEMPLATES.map(template => (
          <Col md={6} lg={4} key={template.id}>
            <Card 
              className="h-100 cursor-pointer hover-shadow"
              onClick={() => onSelectTemplate(template)}
              style={{ cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '';
              }}
            >
              <Card.Body>
                <div className="text-center mb-3">
                  <div style={{ fontSize: '3rem' }}>{template.icon}</div>
                </div>
                
                <Card.Title className="text-center">{template.name}</Card.Title>
                
                <Card.Text className="text-muted small text-center">
                  {template.description}
                </Card.Text>
                
                <div className="mt-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <small className="text-muted">Configuration:</small>
                    <Badge bg={getComplexityColor(template.complexity)}>
                      {template.complexity}
                    </Badge>
                  </div>
                  
                  <div className="d-flex gap-2 mb-3 flex-wrap align-items-center">
                    <Badge bg={template.config.vectorDB.enabled ? 'success' : 'light'} text={template.config.vectorDB.enabled ? 'white' : 'dark'}>
                      {template.config.vectorDB.enabled ? '✓' : '✗'} Vector DB
                    </Badge>
                    <Badge bg={template.config.mcpConfig.enabled ? 'success' : 'light'} text={template.config.mcpConfig.enabled ? 'white' : 'dark'}>
                      {template.config.mcpConfig.enabled ? '✓' : '✗'} MCP
                    </Badge>
                    <Badge bg="dark">
                      {getExecutionMode(template)}
                    </Badge>
                  </div>
                  
                  <div className="small text-muted mb-2">
                    <div className="d-flex justify-content-between">
                      <span>💰 Cost:</span>
                      <strong>${template.estimatedCost.toFixed(2)}/1K queries</strong>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span>⚡ Latency:</span>
                      <strong>{template.estimatedLatency}ms avg</strong>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span>🤖 Model:</span>
                      <strong>{template.config.llmConfig.model}</strong>
                    </div>
                  </div>
                </div>
                
                <hr />
                
                <div className="small">
                  <strong>Use Case:</strong><br />
                  <span className="text-muted">{template.useCase}</span>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
        
        {/* Custom Agent Option */}
        <Col md={6} lg={4}>
          <Card 
            className="h-100 cursor-pointer hover-shadow border-primary"
            onClick={() => onSelectTemplate(null)}
            style={{ cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '';
            }}
          >
            <Card.Body className="d-flex flex-column justify-content-center align-items-center text-center">
              <div style={{ fontSize: '3rem' }} className="mb-3">⚙️</div>
              <Card.Title>Custom Agent</Card.Title>
              <Card.Text className="text-muted">
                Configure your agent from scratch with full control over all options
              </Card.Text>
              <Badge bg="dark" className="mt-2">Advanced</Badge>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <div className="mt-4 text-center">
        <small className="text-muted">
          💡 Tip: You can modify any template after selection to customize it for your needs
        </small>
      </div>
    </Container>
  );
};

export default AgentTemplateSelector;
export { AGENT_TEMPLATES };
export type { AgentTemplate };
