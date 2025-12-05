/**
 * VectorDBConfigSection Component
 * 
 * Provides UI for configuring Vector DB (RAG) settings for agents
 * 
 * Features:
 * - Enable/disable Vector DB toggle
 * - Knowledge base selection
 * - Retrieval configuration (topK, minSimilarity)
 * - Cost and latency impact display
 * 
 * CRITICAL: This is a NEW component that can be integrated into
 * existing agent builders without modifying them
 */

import React, { useState, useEffect } from 'react';
import { Form, Card, Alert, Badge, ProgressBar } from 'react-bootstrap';

interface VectorDBConfig {
  enabled: boolean;
  provider: string;
  knowledgeBases: string[];
  retrievalConfig: {
    topK: number;
    minSimilarity: number;
    maxTokens?: number;
  };
}

interface KnowledgeBase {
  id: string;
  name: string;
  description: string;
  documentCount: number;
}

interface VectorDBConfigSectionProps {
  config: VectorDBConfig;
  onChange: (config: VectorDBConfig) => void;
  onCostChange?: (cost: number) => void;
  onLatencyChange?: (latency: number) => void;
}

const VectorDBConfigSection: React.FC<VectorDBConfigSectionProps> = ({
  config,
  onChange,
  onCostChange,
  onLatencyChange
}) => {
  
  const [availableKnowledgeBases, setAvailableKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Load available knowledge bases and providers
  useEffect(() => {
    loadKnowledgeBases();
    loadProviders();
  }, []);
  
  // Calculate cost and latency when config changes
  useEffect(() => {
    if (config.enabled) {
      const cost = 0.25;  // $0.25 per 1000 queries
      const latency = 200;  // 200ms average
      
      if (onCostChange) onCostChange(cost);
      if (onLatencyChange) onLatencyChange(latency);
    } else {
      if (onCostChange) onCostChange(0);
      if (onLatencyChange) onLatencyChange(0);
    }
  }, [config.enabled, onCostChange, onLatencyChange]);
  
  const loadProviders = async () => {
    try {
      const response = await fetch('http://localhost:3002/api/v1/vector-db/providers');
      const data = await response.json();
      
      if (data.success) {
        // Combine approved and marketplace providers
        const allProviders = [
          ...(data.data.approved || []),
          ...(data.data.marketplace || [])
        ];
        setProviders(allProviders);
      }
    } catch (error) {
      console.error('Failed to load providers:', error);
      // Fallback to empty array
      setProviders([]);
    }
  };
  
  const loadKnowledgeBases = async () => {
    setLoading(true);
    try {
      // In production, this would call the API
      // const response = await fetch('/api/v1/knowledge-bases');
      // const data = await response.json();
      
      // Mock data for now
      setAvailableKnowledgeBases([
        {
          id: 'kb-1',
          name: 'Product Documentation',
          description: 'Product docs and user guides',
          documentCount: 150
        },
        {
          id: 'kb-2',
          name: 'Support Tickets',
          description: 'Historical support tickets',
          documentCount: 500
        },
        {
          id: 'kb-3',
          name: 'FAQ Database',
          description: 'Frequently asked questions',
          documentCount: 75
        }
      ]);
    } catch (error) {
      console.error('Failed to load knowledge bases:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleToggle = (enabled: boolean) => {
    onChange({
      ...config,
      enabled
    });
  };
  
  const handleProviderChange = (provider: string) => {
    onChange({
      ...config,
      provider
    });
  };
  
  const handleKnowledgeBaseToggle = (kbId: string) => {
    const knowledgeBases = config.knowledgeBases.includes(kbId)
      ? config.knowledgeBases.filter(id => id !== kbId)
      : [...config.knowledgeBases, kbId];
    
    onChange({
      ...config,
      knowledgeBases
    });
  };
  
  const handleTopKChange = (topK: number) => {
    onChange({
      ...config,
      retrievalConfig: {
        ...config.retrievalConfig,
        topK
      }
    });
  };
  
  const handleMinSimilarityChange = (minSimilarity: number) => {
    onChange({
      ...config,
      retrievalConfig: {
        ...config.retrievalConfig,
        minSimilarity
      }
    });
  };
  
  return (
    <Card className="mb-3">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <div>
          <strong>Knowledge Base (Optional)</strong>
          <Badge bg="info" className="ms-2">RAG</Badge>
        </div>
        <Form.Check 
          type="switch"
          id="vector-db-toggle"
          checked={config.enabled}
          onChange={(e) => handleToggle(e.target.checked)}
          label=""
        />
      </Card.Header>
      
      <Card.Body>
        <Form.Text className="text-muted d-block mb-3">
          Give your agent access to custom knowledge bases for context-aware responses using Retrieval Augmented Generation (RAG)
        </Form.Text>
        
        {config.enabled ? (
          <>
            {/* Provider Selection */}
            <Form.Group className="mb-3">
              <Form.Label>Vector DB Provider</Form.Label>
              <Form.Select
                value={config.provider}
                onChange={(e) => handleProviderChange(e.target.value)}
              >
                {providers.length === 0 ? (
                  <option>Loading providers...</option>
                ) : (
                  <>
                    <option value="mock">Mock (Development)</option>
                    {providers.map(provider => (
                      <option key={provider.id} value={provider.id}>
                        {provider.icon} {provider.name} {provider.status === 'marketplace' ? '(Marketplace)' : ''}
                      </option>
                    ))}
                  </>
                )}
              </Form.Select>
              <Form.Text className="text-muted">
                {providers.find(p => p.id === config.provider)?.description || 'Select the vector database provider for storing embeddings'}
              </Form.Text>
            </Form.Group>
            
            {/* Knowledge Base Selection */}
            <Form.Group className="mb-3">
              <Form.Label>
                Knowledge Bases
                {config.knowledgeBases.length > 0 && (
                  <Badge bg="success" className="ms-2">
                    {config.knowledgeBases.length} selected
                  </Badge>
                )}
              </Form.Label>
              
              {loading ? (
                <div className="text-center py-3">
                  <div className="spinner-border spinner-border-sm" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <span className="ms-2">Loading knowledge bases...</span>
                </div>
              ) : availableKnowledgeBases.length === 0 ? (
                <Alert variant="warning">
                  <small>
                    <strong>No knowledge bases found.</strong><br />
                    Create a knowledge base first to enable RAG for your agent.
                    <a href="/knowledge-bases" className="alert-link ms-1">
                      Go to Knowledge Base Management
                    </a>
                  </small>
                </Alert>
              ) : (
                <div className="border rounded p-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {availableKnowledgeBases.map(kb => (
                    <Form.Check
                      key={kb.id}
                      type="checkbox"
                      id={`kb-${kb.id}`}
                      label={
                        <div>
                          <strong>{kb.name}</strong>
                          <Badge bg="secondary" className="ms-2">{kb.documentCount} docs</Badge>
                          <br />
                          <small className="text-muted">{kb.description}</small>
                        </div>
                      }
                      checked={config.knowledgeBases.includes(kb.id)}
                      onChange={() => handleKnowledgeBaseToggle(kb.id)}
                      className="mb-2"
                    />
                  ))}
                </div>
              )}
              
              <Form.Text className="text-muted">
                Select one or more knowledge bases for your agent to search
              </Form.Text>
            </Form.Group>
            
            {/* Retrieval Configuration */}
            <Form.Group className="mb-3">
              <Form.Label>
                Documents to Retrieve (Top-K)
                <Badge bg="secondary" className="ms-2">{config.retrievalConfig.topK}</Badge>
              </Form.Label>
              <Form.Range
                min={1}
                max={20}
                value={config.retrievalConfig.topK}
                onChange={(e) => handleTopKChange(parseInt(e.target.value))}
              />
              <Form.Text className="text-muted">
                Number of relevant documents to include as context (1-20)
              </Form.Text>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>
                Minimum Similarity
                <Badge bg="secondary" className="ms-2">{config.retrievalConfig.minSimilarity.toFixed(2)}</Badge>
              </Form.Label>
              <Form.Range
                min={0}
                max={1}
                step={0.05}
                value={config.retrievalConfig.minSimilarity}
                onChange={(e) => handleMinSimilarityChange(parseFloat(e.target.value))}
              />
              <Form.Text className="text-muted">
                Only retrieve documents with similarity above this threshold (0.0-1.0)
              </Form.Text>
            </Form.Group>
            
            {/* Cost and Performance Impact */}
            <Alert variant="info">
              <div className="d-flex align-items-start">
                <div className="me-2">💡</div>
                <div className="flex-grow-1">
                  <strong>Impact on Performance & Cost:</strong>
                  <div className="mt-2">
                    <div className="d-flex justify-content-between mb-1">
                      <small>Additional Cost:</small>
                      <small><strong>+$0.25</strong> per 1000 queries</small>
                    </div>
                    <div className="d-flex justify-content-between mb-1">
                      <small>Additional Latency:</small>
                      <small><strong>+200ms</strong> average</small>
                    </div>
                    <div className="d-flex justify-content-between">
                      <small>Benefits:</small>
                      <small><strong>Context-aware responses, reduced hallucinations</strong></small>
                    </div>
                  </div>
                </div>
              </div>
            </Alert>
            
            {/* Quick Actions */}
            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-outline-primary btn-sm"
                onClick={() => window.open('/knowledge-bases', '_blank')}
              >
                Manage Knowledge Bases
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={loadKnowledgeBases}
              >
                Refresh List
              </button>
            </div>
          </>
        ) : (
          <Alert variant="secondary">
            <small>
              Enable Vector DB to give your agent access to custom knowledge bases.
              This allows your agent to provide context-aware responses using Retrieval Augmented Generation (RAG).
            </small>
          </Alert>
        )}
      </Card.Body>
    </Card>
  );
};

export default VectorDBConfigSection;
