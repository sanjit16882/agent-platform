/**
 * AgentTemplates Component
 * 
 * Pre-configured agent templates for common use cases
 * Helps users quickly create agents with optimal configurations
 */

import React from 'react';
import { Container, Row, Col, Card, Badge, Button } from 'react-bootstrap';

export interface AgentTemplate {
  id: string;
  name: string;
  icon: string;
  description: string;
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
    mcp: {
      enabled: boolean;
      server?: string;
    };
    model: string;
    estimatedCost: number;
    estimatedLatency: number;
  };
}

export const AGENT_TEMPLATES: AgentTemplate[] = [
  {
    id: 'simple-chatbot',
    name: 'Simple Chatbot',
    icon: '💬',
    description: 'Basic Q&A chatbot without external dependencies',
    useCase: 'Basic Q&A, simple conversations, quick responses',
    config: {
      vectorDB: { enabled: false },
      mcp: { enabled: false },
      model: 'claude-3-haiku',
      estimatedCost: 0.50,
      estimatedLatency: 500
    }
  },
  {
    id: 'faq-bot',
    name: 'FAQ Bot',
    icon: '📚',
    description: 'Search documentation and answer questions',
    useCase: 'Customer support, documentation search, knowledge base queries',
    config: {
      vectorDB: {
        enabled: true,
        provider: 'opensearch',
        knowledgeBases: [],
        retrievalConfig: { topK: 5, minSimilarity: 0.7 }
      },
      mcp: { enabled: false },
      model: 'claude-3-haiku',
      estimatedCost: 0.75,
      estimatedLatency: 700
    }
  },
  {
    id: 'code-assistant',
    name: 'Code Assistant',
    icon: '💻',
    description: 'Search code repositories and use development tools',
    useCase: 'Code review, API integration, development assistance',
    config: {
      vectorDB: {
        enabled: true,
        provider: 'opensearch',
        knowledgeBases: [],
        retrievalConfig: { topK: 10, minSimilarity: 0.6 }
      },
      mcp: { enabled: true, server: 'github-api' },
      model: 'claude-3-sonnet',
      estimatedCost: 0.85,
      estimatedLatency: 1200
    }
  },
  {
    id: 'data-analyst',
    name: 'Data Analyst',
    icon: '📊',
    description: 'Query databases and analyze data',
    useCase: 'Data analysis, SQL queries, report generation',
    config: {
      vectorDB: { enabled: false },
      mcp: { enabled: true, server: 'database-query' },
      model: 'claude-3-sonnet',
      estimatedCost: 0.60,
      estimatedLatency: 1000
    }
  },
  {
    id: 'customer-support',
    name: 'Customer Support',
    icon: '🎧',
    description: 'Full-featured support agent with knowledge base and tools',
    useCase: 'Customer support, ticket management, escalation handling',
    config: {
      vectorDB: {
        enabled: true,
        provider: 'opensearch',
        knowledgeBases: [],
        retrievalConfig: { topK: 5, minSimilarity: 0.7 }
      },
      mcp: { enabled: true, server: 'slack-integration' },
      model: 'claude-3-sonnet',
      estimatedCost: 0.85,
      estimatedLatency: 1200
    }
  }
];

interface AgentTemplatesProps {
  onSelectTemplate: (template: AgentTemplate | null) => void;
}

const AgentTemplates: React.FC<AgentTemplatesProps> = ({ onSelectTemplate }) => {
  
  return (
    <Container>
      <h3>Choose an Agent Template</h3>
      <p className="text-muted">
        Start with a pre-configured template or create a custom agent from scratch
      </p>
      
      <Row className="g-3">
        {AGENT_TEMPLATES.map(template => (
          <Col md={6} lg={4} key={template.id}>
            <Card 
              className="h-100 cursor-pointer hover-shadow"
              style={{ cursor: 'pointer', transition: 'all 0.2s' }}
              onClick={() => onSelectTemplate(template)}
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
                  </div>
                  <div className="d-flex gap-2 mb-2 flex-wrap">
                    <Badge bg="primary">LLM</Badge>
                    {template.config.vectorDB.enabled && (
                      <Badge bg="info">Vector DB</Badge>
                    )}
                    {template.config.mcp.enabled && (
                      <Badge bg="success">MCP</Badge>
                    )}
                  </div>
                  
                  <div className="small text-muted">
                    <div className="d-flex justify-content-between">
                      <span>💰 Cost:</span>
                      <strong>${template.config.estimatedCost}/1K queries</strong>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span>⚡ Latency:</span>
                      <strong>{template.config.estimatedLatency}ms avg</strong>
                    </div>
                  </div>
                </div>
                
                <hr />
                
                <div className="small">
                  <strong>Use Case:</strong><br />
                  <span className="text-muted">{template.useCase}</span>
                </div>
              </Card.Body>
              <Card.Footer className="text-center bg-light">
                <Button variant="outline-primary" size="sm">
                  Select Template
                </Button>
              </Card.Footer>
            </Card>
          </Col>
        ))}
        
        {/* Custom Agent Option */}
        <Col md={6} lg={4}>
          <Card 
            className="h-100 cursor-pointer hover-shadow border-primary"
            style={{ cursor: 'pointer', transition: 'all 0.2s' }}
            onClick={() => onSelectTemplate(null)}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(13,110,253,0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '';
            }}
          >
            <Card.Body className="d-flex flex-column justify-content-center align-items-center">
              <div style={{ fontSize: '3rem' }}>⚙️</div>
              <Card.Title className="mt-3 text-center">Custom Agent</Card.Title>
              <Card.Text className="text-center text-muted">
                Configure your agent from scratch with full control over all options
              </Card.Text>
              <div className="mt-3">
                <Badge bg="secondary" className="me-2">Flexible</Badge>
                <Badge bg="secondary">Advanced</Badge>
              </div>
            </Card.Body>
            <Card.Footer className="text-center bg-primary bg-opacity-10">
              <Button variant="primary" size="sm">
                Start from Scratch
              </Button>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AgentTemplates;
