import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, Spinner, Alert, Row, Col } from 'react-bootstrap';
import { bedrockService, BedrockStatus as BedrockStatusType } from '../services/bedrockService';

interface BedrockStatusProps {
  showDetails?: boolean;
  onModelSelect?: (modelId: string) => void;
  selectedModel?: string;
}

const BedrockStatus: React.FC<BedrockStatusProps> = ({ 
  showDetails = false, 
  onModelSelect,
  selectedModel 
}) => {
  const [status, setStatus] = useState<BedrockStatusType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);

  useEffect(() => {
    loadBedrockStatus();
  }, []);

  const loadBedrockStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const bedrockStatus = await bedrockService.getAvailableModels();
      setStatus(bedrockStatus);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load Bedrock status');
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    try {
      setTestingConnection(true);
      const result = await bedrockService.testConnection();
      if (result.success) {
        alert(`✅ Connection successful!\n\nModel: ${result.model_used}\nTime: ${result.connection_time}\nTokens: ${result.tokens_used.input_tokens} input, ${result.tokens_used.output_tokens} output`);
      } else {
        alert('❌ Connection test failed');
      }
    } catch (error) {
      alert(`❌ Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setTestingConnection(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <Card.Body className="text-center">
          <Spinner animation="border" size="sm" className="me-2" />
          Loading Bedrock status...
        </Card.Body>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="warning">
        <Alert.Heading>Bedrock Connection Issue</Alert.Heading>
        <p>{error}</p>
        <Button variant="outline-warning" size="sm" onClick={loadBedrockStatus}>
          Retry Connection
        </Button>
      </Alert>
    );
  }

  if (!status) {
    return (
      <Alert variant="danger">
        No Bedrock status available
      </Alert>
    );
  }

  const isRealBedrock = status.demo_info.real_ai;
  const statusColor = isRealBedrock ? 'success' : 'warning';

  return (
    <Card>
      <Card.Header className="d-flex justify-content-between align-items-center">
        <div>
          <strong>🤖 AWS Bedrock Integration</strong>
          <Badge bg={statusColor} className="ms-2">
            {isRealBedrock ? 'LIVE' : 'MOCK'}
          </Badge>
        </div>
        <div>
          <Button 
            variant="outline-primary" 
            size="sm" 
            onClick={testConnection}
            disabled={testingConnection}
          >
            {testingConnection ? (
              <>
                <Spinner animation="border" size="sm" className="me-1" />
                Testing...
              </>
            ) : (
              'Test Connection'
            )}
          </Button>
          <Button 
            variant="outline-secondary" 
            size="sm" 
            className="ms-2"
            onClick={loadBedrockStatus}
          >
            Refresh
          </Button>
        </div>
      </Card.Header>
      <Card.Body>
        <Row>
          <Col md={6}>
            <div className="mb-3">
              <strong>Status:</strong> {status.bedrock_status}
            </div>
            <div className="mb-3">
              <strong>Provider:</strong> {status.demo_info.provider}
            </div>
            <div className="mb-3">
              <strong>Region:</strong> {status.demo_info.region}
            </div>
            <div className="mb-3">
              <strong>Models Available:</strong> {status.demo_info.models_count}
            </div>
          </Col>
          <Col md={6}>
            <div className="mb-3">
              <strong>Real AI:</strong> {isRealBedrock ? '✅ Yes' : '❌ Mock Data'}
            </div>
            <div className="mb-3">
              <strong>Cost Tracking:</strong> {status.demo_info.cost_tracking ? '✅ Enabled' : '❌ Disabled'}
            </div>
            <div className="mb-3">
              <strong>Last Updated:</strong> {new Date(status.timestamp).toLocaleTimeString()}
            </div>
          </Col>
        </Row>

        {showDetails && (
          <>
            <hr />
            <h6>Available Models:</h6>
            <Row>
              {status.available_models.map((model) => (
                <Col md={4} key={model.id} className="mb-3">
                  <Card 
                    className={`h-100 ${selectedModel === model.id ? 'border-primary' : ''}`}
                    style={{ cursor: onModelSelect ? 'pointer' : 'default' }}
                    onClick={() => onModelSelect && onModelSelect(model.id)}
                  >
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h6 className="mb-0">{bedrockService.getModelDisplayName(model.id)}</h6>
                        <Badge bg="success" className="ms-2">
                          {model.status}
                        </Badge>
                      </div>
                      <p className="small text-muted mb-2">
                        {bedrockService.getModelDescription(model.id)}
                      </p>
                      <div className="small">
                        <div><strong>Max Tokens:</strong> {model.max_tokens?.toLocaleString() || 'N/A'}</div>
                        <div><strong>Temperature:</strong> {model.temperature || 'N/A'}</div>
                        {model.best_for && Array.isArray(model.best_for) && model.best_for.length > 0 && (
                          <div><strong>Best For:</strong> {model.best_for.join(', ')}</div>
                        )}
                        {model.cost_per_1m_tokens && (
                          <div><strong>Cost:</strong> {typeof model.cost_per_1m_tokens === 'string' ? model.cost_per_1m_tokens : 'Variable'}</div>
                        )}
                      </div>
                      {selectedModel === model.id && (
                        <Badge bg="primary" className="mt-2">
                          Selected
                        </Badge>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </>
        )}
      </Card.Body>
    </Card>
  );
};

export default BedrockStatus;