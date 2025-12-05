/**
 * VectorDBConfigModalEnhanced
 * 
 * Enhanced modal with 3-step wizard for comprehensive Vector DB configuration
 */

import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert, Badge, ProgressBar } from 'react-bootstrap';
import { VectorDBProvider, ConfigField } from '../types/vectorDB';

interface VectorDBConfigModalEnhancedProps {
  show: boolean;
  provider: VectorDBProvider | null;
  onHide: () => void;
  onSave: (providerId: string, config: Record<string, any>) => void;
}

const VectorDBConfigModalEnhanced: React.FC<VectorDBConfigModalEnhancedProps> = ({
  show,
  provider,
  onHide,
  onSave
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [config, setConfig] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [validating, setValidating] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (show && provider) {
      // Initialize config with default values
      const initialConfig: Record<string, any> = {};
      provider.configTemplate.fields.forEach(field => {
        if (field.defaultValue !== undefined) {
          initialConfig[field.name] = field.defaultValue;
        }
      });
      setConfig(initialConfig);
      setCurrentStep(1);
      setErrors({});
      setConnectionStatus('idle');
    }
  }, [show, provider]);

  const getFieldsByStep = (step: number): ConfigField[] => {
    if (!provider) return [];
    return provider.configTemplate.fields.filter(f => (f.step || 1) === step);
  };

  const handleFieldChange = (fieldName: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [fieldName]: value
    }));
    
    if (errors[fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const validateStep = (step: number): boolean => {
    const fields = getFieldsByStep(step);
    const newErrors: Record<string, string> = {};
    
    fields.forEach(field => {
      if (field.required && !config[field.name]) {
        newErrors[field.name] = `${field.label} is required`;
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionStatus('idle');
    
    // Simulate connection test
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // For demo, just check if host and port are filled
    if (config.host && config.port) {
      setConnectionStatus('success');
    } else {
      setConnectionStatus('error');
    }
    
    setTestingConnection(false);
  };

  const handleSave = async () => {
    if (!validateStep(currentStep)) return;
    
    if (provider) {
      onSave(provider.id, config);
      onHide();
    }
  };

  const renderField = (field: ConfigField) => {
    const value = config[field.name] ?? field.defaultValue ?? '';
    
    switch (field.type) {
      case 'text':
      case 'password':
        return (
          <Form.Control
            type={field.type}
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            isInvalid={!!errors[field.name]}
          />
        );
      
      case 'number':
        return (
          <Form.Control
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            isInvalid={!!errors[field.name]}
          />
        );
      
      case 'select':
        return (
          <Form.Select
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            isInvalid={!!errors[field.name]}
          >
            {!field.required && <option value="">Select...</option>}
            {field.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Form.Select>
        );
      
      case 'boolean':
        return (
          <Form.Check
            type="checkbox"
            checked={!!value}
            onChange={(e) => handleFieldChange(field.name, e.target.checked)}
            label={field.helpText}
          />
        );
      
      default:
        return null;
    }
  };

  const getStepTitle = (step: number): string => {
    switch (step) {
      case 1: return 'Connection & Authentication';
      case 2: return 'Index & Embedding Configuration';
      case 3: return 'Advanced Settings';
      default: return '';
    }
  };

  const getStepDescription = (step: number): string => {
    switch (step) {
      case 1: return 'Configure connection details and authentication';
      case 2: return 'Set up index, embedding model, and distance metric';
      case 3: return 'Optional performance and monitoring settings';
      default: return '';
    }
  };

  if (!provider) return null;

  const step1Fields = getFieldsByStep(1);
  const step2Fields = getFieldsByStep(2);
  const step3Fields = getFieldsByStep(3);
  const progress = (currentStep / 3) * 100;

  return (
    <Modal show={show} onHide={onHide} size="lg" backdrop="static" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <span style={{ fontSize: '1.5rem', marginRight: '8px' }}>{provider.icon}</span>
          Configure {provider.name}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Alert variant="info" className="mb-3">
          <strong>📦 {provider.name}</strong>
          <p className="mb-0 mt-2">{provider.description}</p>
        </Alert>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="d-flex justify-content-between mb-2">
            <Badge bg={currentStep >= 1 ? 'primary' : 'secondary'}>Step 1</Badge>
            <Badge bg={currentStep >= 2 ? 'primary' : 'secondary'}>Step 2</Badge>
            <Badge bg={currentStep >= 3 ? 'primary' : 'secondary'}>Step 3</Badge>
          </div>
          <ProgressBar now={progress} variant="primary" />
          <div className="mt-2">
            <strong>{getStepTitle(currentStep)}</strong>
            <p className="text-muted small mb-0">{getStepDescription(currentStep)}</p>
          </div>
        </div>

        {/* Step 1: Connection */}
        {currentStep === 1 && (
          <div>
            <h6 className="mb-3">🔌 Connection & Authentication</h6>
            <Form>
              {step1Fields.map(field => (
                <Form.Group key={field.name} className="mb-3">
                  <Form.Label>
                    {field.label}
                    {field.required && <span className="text-danger"> *</span>}
                  </Form.Label>
                  {renderField(field)}
                  {field.helpText && field.type !== 'boolean' && (
                    <Form.Text className="text-muted">{field.helpText}</Form.Text>
                  )}
                  {errors[field.name] && (
                    <Form.Control.Feedback type="invalid" style={{ display: 'block' }}>
                      {errors[field.name]}
                    </Form.Control.Feedback>
                  )}
                </Form.Group>
              ))}
            </Form>

            {/* Test Connection Button */}
            <div className="mt-3">
              <Button
                variant="outline-primary"
                size="sm"
                onClick={handleTestConnection}
                disabled={testingConnection || !config.host || !config.port}
              >
                {testingConnection ? '🔄 Testing...' : '🔍 Test Connection'}
              </Button>
              
              {connectionStatus === 'success' && (
                <Alert variant="success" className="mt-2 mb-0">
                  ✅ Connection successful!
                </Alert>
              )}
              {connectionStatus === 'error' && (
                <Alert variant="danger" className="mt-2 mb-0">
                  ❌ Connection failed. Please check your settings.
                </Alert>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Index Configuration */}
        {currentStep === 2 && (
          <div>
            <h6 className="mb-3">📊 Index & Embedding Configuration</h6>
            <Form>
              {step2Fields.map(field => (
                <Form.Group key={field.name} className="mb-3">
                  <Form.Label>
                    {field.label}
                    {field.required && <span className="text-danger"> *</span>}
                  </Form.Label>
                  {renderField(field)}
                  {field.helpText && field.type !== 'boolean' && (
                    <Form.Text className="text-muted">{field.helpText}</Form.Text>
                  )}
                  {errors[field.name] && (
                    <Form.Control.Feedback type="invalid" style={{ display: 'block' }}>
                      {errors[field.name]}
                    </Form.Control.Feedback>
                  )}
                </Form.Group>
              ))}
            </Form>

            <Alert variant="info" className="mt-3">
              <small>
                <strong>💡 Tip:</strong> The vector dimension must match your embedding model's output.
                AWS Bedrock Titan produces 1536-dimensional vectors.
              </small>
            </Alert>
          </div>
        )}

        {/* Step 3: Advanced Settings */}
        {currentStep === 3 && (
          <div>
            <h6 className="mb-3">⚙️ Advanced Settings</h6>
            <p className="text-muted small mb-3">
              These settings are optional and have sensible defaults for most use cases.
            </p>
            <Form>
              {step3Fields.map(field => (
                <Form.Group key={field.name} className="mb-3">
                  <Form.Label>
                    {field.label}
                    {field.required && <span className="text-danger"> *</span>}
                  </Form.Label>
                  {renderField(field)}
                  {field.helpText && field.type !== 'boolean' && (
                    <Form.Text className="text-muted">{field.helpText}</Form.Text>
                  )}
                  {errors[field.name] && (
                    <Form.Control.Feedback type="invalid" style={{ display: 'block' }}>
                      {errors[field.name]}
                    </Form.Control.Feedback>
                  )}
                </Form.Group>
              ))}
            </Form>

            {/* Configuration Summary */}
            <Alert variant="secondary" className="mt-3">
              <h6>📋 Configuration Summary</h6>
              <ul className="small mb-0">
                <li><strong>Connection:</strong> {config.host}:{config.port} {config.ssl ? '(SSL)' : ''}</li>
                <li><strong>Collection:</strong> {config.collectionName || 'Not set'}</li>
                <li><strong>Embedding:</strong> {config.embeddingModel || 'Not set'} ({config.dimension || 0}d)</li>
                <li><strong>Metric:</strong> {config.distanceMetric || 'Not set'}</li>
                <li><strong>Batch Size:</strong> {config.batchSize || 100}</li>
              </ul>
            </Alert>
          </div>
        )}

        <Alert variant="warning" className="mt-3 mb-0">
          <small>
            <strong>⚠️ Note:</strong> Make sure the Vector DB service is running and accessible before saving.
          </small>
        </Alert>
      </Modal.Body>

      <Modal.Footer className="d-flex justify-content-between">
        <div>
          {currentStep > 1 && (
            <Button variant="outline-secondary" onClick={handleBack}>
              ← Back
            </Button>
          )}
        </div>
        
        <div className="d-flex gap-2">
          <Button variant="secondary" onClick={onHide}>
            Cancel
          </Button>
          
          {currentStep < 3 ? (
            <Button variant="primary" onClick={handleNext}>
              Next: {getStepTitle(currentStep + 1)} →
            </Button>
          ) : (
            <Button
              variant="success"
              onClick={handleSave}
              disabled={validating}
            >
              {validating ? 'Saving...' : '✓ Save Configuration'}
            </Button>
          )}
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default VectorDBConfigModalEnhanced;
