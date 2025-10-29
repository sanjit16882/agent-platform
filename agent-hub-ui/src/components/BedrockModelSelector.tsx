import React, { useState, useEffect } from 'react';
import { Form, Card, Badge, Alert, Spinner, Button } from 'react-bootstrap';
import { bedrockService, BedrockModel } from '../services/bedrockService';

interface BedrockModelSelectorProps {
  selectedModel?: string;
  onModelChange: (modelId: string, modelName: string) => void;
  agentType?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
}

const BedrockModelSelector: React.FC<BedrockModelSelectorProps> = ({
  selectedModel,
  onModelChange,
  agentType = 'llm',
  label = 'AI Model',
  required = false,
  disabled = false
}) => {
  const [models, setModels] = useState<BedrockModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBedrockAvailable, setIsBedrockAvailable] = useState(false);

  useEffect(() => {
    loadModels();
  }, []);

  useEffect(() => {
    // Auto-select recommended model if none selected
    if (models.length > 0 && !selectedModel) {
      const recommendedModelId = bedrockService.getModelRecommendation(agentType);
      const recommendedModel = models.find(m => m.id === recommendedModelId);
      if (recommendedModel) {
        onModelChange(recommendedModel.id, recommendedModel.name);
      }
    }
  }, [models, selectedModel, agentType, onModelChange]);

  const loadModels = async () => {
    try {
      setLoading(true);
      setError(null);
      const status = await bedrockService.getAvailableModels();
      setModels(status.available_models);
      setIsBedrockAvailable(status.demo_info.real_ai);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load models');
      // Fallback to mock models if Bedrock is unavailable
      setModels([
        {
          id: 'haiku',
          name: 'anthropic.claude-3-haiku-20240307-v1:0',
          max_tokens: 2000,
          temperature: 0.1,
          cost_per_1m_tokens: '$0.25',
          best_for: ['Quick tasks', 'Cost optimization'],
          status: '⚠️ Fallback'
        },
        {
          id: 'sonnet',
          name: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
          max_tokens: 4000,
          temperature: 0.1,
          cost_per_1m_tokens: '$3.00',
          best_for: ['Complex reasoning', 'High quality'],
          status: '⚠️ Fallback'
        }
      ]);
      setIsBedrockAvailable(false);
    } finally {
      setLoading(false);
    }
  };

  const handleModelChange = (modelId: string) => {
    const model = models.find(m => m.id === modelId);
    if (model) {
      onModelChange(modelId, model.name);
    }
  };

  const getModelBadgeColor = (model: BedrockModel) => {
    if (model.status.includes('Available')) return 'success';
    if (model.status.includes('Fallback')) return 'warning';
    return 'secondary';
  };

  const getRecommendationBadge = (modelId: string) => {
    const recommended = bedrockService.getModelRecommendation(agentType);
    if (modelId === recommended) {
      return <Badge bg="info" className="ms-2">Recommended for {agentType.toUpperCase()}</Badge>;
    }
    return null;
  };

  if (loading) {
    return (
      <Form.Group className="mb-3">
        <Form.Label>{label} {required && <span className="text-danger">*</span>}</Form.Label>
        <div className="d-flex align-items-center">
          <Spinner animation="border" size="sm" className="me-2" />
          <span>Loading available models...</span>
        </div>
      </Form.Group>
    );
  }

  return (
    <Form.Group className="mb-3">
      <Form.Label>{label} {required && <span className="text-danger">*</span>}</Form.Label>
      
      {!isBedrockAvailable && (
        <Alert variant="warning" className="mb-2">
          <small>
            ⚠️ Using fallback models - Bedrock connection unavailable. 
            <Button variant="link" size="sm" className="p-0 ms-1" onClick={loadModels}>
              Retry
            </Button>
          </small>
        </Alert>
      )}

      <Form.Select
        value={selectedModel || ''}
        onChange={(e) => handleModelChange(e.target.value)}
        disabled={disabled}
        required={required}
      >
        <option value="">Select an AI model...</option>
        {models.map((model) => (
          <option key={model.id} value={model.id}>
            {bedrockService.getModelDisplayName(model.id)} - {model.max_tokens.toLocaleString()} tokens
          </option>
        ))}
      </Form.Select>

      {selectedModel && (
        <div className="mt-2">
          {models.filter(m => m.id === selectedModel).map((model) => (
            <Card key={model.id} className="border-0" style={{ backgroundColor: '#f8f9fa' }}>
              <Card.Body className="p-2">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <strong>{bedrockService.getModelDisplayName(model.id)}</strong>
                    <Badge bg={getModelBadgeColor(model)} className="ms-2">
                      {model.status}
                    </Badge>
                    {getRecommendationBadge(model.id)}
                  </div>
                </div>
                <div className="small text-muted mt-1">
                  <div>{bedrockService.getModelDescription(model.id)}</div>
                  <div className="mt-1">
                    <strong>Max Tokens:</strong> {model.max_tokens?.toLocaleString() || 'N/A'} | 
                    <strong> Temperature:</strong> {model.temperature || 'N/A'}
                    {model.cost_per_1m_tokens && (
                      <> | <strong>Cost:</strong> {typeof model.cost_per_1m_tokens === 'string' ? model.cost_per_1m_tokens : 'Variable'}</>
                    )}
                  </div>
                  {model.best_for && Array.isArray(model.best_for) && model.best_for.length > 0 && (
                    <div><strong>Best for:</strong> {model.best_for.join(', ')}</div>
                  )}
                </div>
              </Card.Body>
            </Card>
          ))}
        </div>
      )}

      {error && (
        <div className="small text-muted mt-1">
          <span className="text-warning">⚠️</span> {error}
        </div>
      )}
    </Form.Group>
  );
};

export default BedrockModelSelector;