/**
 * VectorDBConfigModal
 * 
 * Modal for configuring an approved Vector DB provider
 * Dynamically generates form fields based on provider's config template
 */

import React, { useState } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { VectorDBProvider, ConfigField } from '../types/vectorDB';

interface VectorDBConfigModalProps {
  show: boolean;
  provider: VectorDBProvider | null;
  onHide: () => void;
  onSave: (providerId: string, config: Record<string, any>) => void;
}

const VectorDBConfigModal: React.FC<VectorDBConfigModalProps> = ({
  show,
  provider,
  onHide,
  onSave
}) => {
  const [config, setConfig] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [validating, setValidating] = useState(false);

  const handleFieldChange = (fieldName: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [fieldName]: value
    }));
    
    // Clear error for this field
    if (errors[fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const validateConfig = async () => {
    if (!provider) return false;
    
    setValidating(true);
    const newErrors: Record<string, string> = {};
    
    // Client-side validation
    provider.configTemplate.fields.forEach(field => {
      if (field.required && !config[field.name]) {
        newErrors[field.name] = `${field.label} is required`;
      }
    });
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setValidating(false);
      return false;
    }
    
    // Server-side validation
    try {
      const response = await fetch(
        `http://localhost:3002/api/v1/vector-db/providers/${provider.id}/validate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config)
        }
      );
      
      const data = await response.json();
      
      if (data.success && data.data.valid) {
        setValidating(false);
        return true;
      } else {
        // Map server errors to fields
        data.data.errors.forEach((error: string) => {
          newErrors['general'] = error;
        });
        setErrors(newErrors);
        setValidating(false);
        return false;
      }
    } catch (error) {
      newErrors['general'] = 'Failed to validate configuration';
      setErrors(newErrors);
      setValidating(false);
      return false;
    }
  };

  const handleSave = async () => {
    const isValid = await validateConfig();
    if (isValid && provider) {
      onSave(provider.id, config);
      handleClose();
    }
  };

  const handleClose = () => {
    setConfig({});
    setErrors({});
    onHide();
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
            onChange={(e) => handleFieldChange(field.name, parseInt(e.target.value))}
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
            <option value="">Select...</option>
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
            checked={value}
            onChange={(e) => handleFieldChange(field.name, e.target.checked)}
          />
        );
      
      default:
        return null;
    }
  };

  if (!provider) return null;

  return (
    <>
      <style>{`
        .vector-db-config-modal .modal-dialog {
          display: flex !important;
          align-items: center !important;
          min-height: calc(100vh - 3.5rem) !important;
          margin: 1.75rem auto !important;
        }
        
        .vector-db-config-modal.modal.show {
          display: flex !important;
          align-items: center !important;
        }
      `}</style>
      
      <Modal 
        show={show} 
        onHide={handleClose} 
        size="lg" 
        centered
        className="vector-db-config-modal"
      >
        <Modal.Header closeButton>
        <Modal.Title>
          <span style={{ fontSize: '1.5rem', marginRight: '8px' }}>
            {provider.icon}
          </span>
          Configure {provider.name}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {errors.general && (
          <Alert variant="danger" dismissible onClose={() => setErrors({})}>
            {errors.general}
          </Alert>
        )}

        <Alert variant="info">
          <strong>📦 {provider.name}</strong>
          <p className="mb-0 mt-2">{provider.description}</p>
        </Alert>

        <Form>
          {provider.configTemplate.fields.map(field => (
            <Form.Group key={field.name} className="mb-3">
              <Form.Label>
                {field.label}
                {field.required && <span className="text-danger"> *</span>}
              </Form.Label>
              
              {renderField(field)}
              
              {field.helpText && (
                <Form.Text className="text-muted">
                  {field.helpText}
                </Form.Text>
              )}
              
              {errors[field.name] && (
                <Form.Control.Feedback type="invalid" style={{ display: 'block' }}>
                  {errors[field.name]}
                </Form.Control.Feedback>
              )}
            </Form.Group>
          ))}
        </Form>

        <Alert variant="warning" className="mt-3">
          <small>
            <strong>⚠️ Note:</strong> Make sure the Vector DB service is running and accessible
            at the configured host and port before saving.
          </small>
        </Alert>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={validating}
        >
          {validating ? 'Validating...' : 'Save Configuration'}
        </Button>
      </Modal.Footer>
    </Modal>
    </>
  );
};

export default VectorDBConfigModal;
