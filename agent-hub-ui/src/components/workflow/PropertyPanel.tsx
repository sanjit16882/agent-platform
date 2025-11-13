import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Row, Col, Badge, Alert, Accordion } from 'react-bootstrap';
import { ComponentNode } from '../../types/hybridAgent';

// React Icons compatibility fix - using createElement
const { createElement } = React;
const icons = require('react-icons/fa');

const CogIcon = (props: any) => createElement(icons.FaCog, props);
const CodeIcon = (props: any) => createElement(icons.FaCode, props);
const CheckIcon = (props: any) => createElement(icons.FaCheck, props);
const TimesIcon = (props: any) => createElement(icons.FaTimes, props);

interface PropertyPanelProps {
  selectedNode: ComponentNode | null;
  onNodeUpdate: (nodeId: string, updates: Partial<ComponentNode>) => void;
  onClose: () => void;
  readonly?: boolean;
}

interface ComponentProperty {
  key: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'select';
  options?: string[];
  description?: string;
  required?: boolean;
}

const PropertyPanel: React.FC<PropertyPanelProps> = ({
  selectedNode,
  onNodeUpdate,
  onClose,
  readonly = false
}) => {
  const [properties, setProperties] = useState<ComponentProperty[]>([]);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (selectedNode) {
      setProperties(generatePropertiesFromNode(selectedNode));
      setValidationErrors({});
      setHasUnsavedChanges(false);
    }
  }, [selectedNode]);

  const generatePropertiesFromNode = (node: ComponentNode): ComponentProperty[] => {
    const config = node.component.config as any;
    
    const baseProperties: ComponentProperty[] = [
      {
        key: 'name',
        value: node.component.name || '',
        type: 'string',
        description: 'Display name for this component',
        required: true
      },
      {
        key: 'description',
        value: node.component.description || '',
        type: 'string',
        description: 'Description of what this component does'
      }
    ];

    // Add type-specific properties
    const typeSpecificProperties: ComponentProperty[] = [];
    
    if (node.component.type === 'llm') {
      typeSpecificProperties.push(
        {
          key: 'model',
          value: config?.model || 'claude-3-haiku',
          type: 'select',
          options: ['claude-3-haiku', 'claude-3-sonnet', 'gpt-4', 'gpt-3.5-turbo'],
          description: 'AI model to use for processing',
          required: true
        },
        {
          key: 'temperature',
          value: config?.temperature || 0.7,
          type: 'number',
          description: 'Controls randomness in AI responses (0.0 - 1.0)'
        }
      );
    }
    
    // Add common properties
    typeSpecificProperties.push({
      key: 'timeout',
      value: config?.timeout || 30000,
      type: 'number',
      description: 'Timeout in milliseconds'
    });
    
    return [...baseProperties, ...typeSpecificProperties];
  };

  const handlePropertyChange = (key: string, value: any) => {
    setProperties(prev => prev.map(prop => 
      prop.key === key ? { ...prop, value } : prop
    ));
    setHasUnsavedChanges(true);
    
    // Clear validation error for this field
    if (validationErrors[key]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  };

  const validateProperties = (): boolean => {
    const errors: Record<string, string> = {};
    
    properties.forEach(prop => {
      if (prop.required && (!prop.value || prop.value === '')) {
        errors[prop.key] = `${prop.key} is required`;
      }
      
      if (prop.type === 'number' && prop.value !== '' && isNaN(Number(prop.value))) {
        errors[prop.key] = `${prop.key} must be a valid number`;
      }
    });
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = () => {
    if (!selectedNode || readonly) return;
    
    if (!validateProperties()) {
      return;
    }
    
    // Convert properties back to node configuration
    const updatedConfig: any = { ...selectedNode.component.config };
    const updatedComponent = { ...selectedNode.component };
    
    properties.forEach(prop => {
      if (prop.key === 'name') {
        updatedComponent.name = prop.value;
      } else if (prop.key === 'description') {
        updatedComponent.description = prop.value;
      } else {
        updatedConfig[prop.key] = prop.value;
      }
    });
    
    updatedComponent.config = updatedConfig;
    
    onNodeUpdate(selectedNode.id, { component: updatedComponent });
    setHasUnsavedChanges(false);
  };

  const handleReset = () => {
    if (selectedNode) {
      setProperties(generatePropertiesFromNode(selectedNode));
      setValidationErrors({});
      setHasUnsavedChanges(false);
    }
  };

  const renderPropertyInput = (prop: ComponentProperty) => {
    const hasError = validationErrors[prop.key];
    
    switch (prop.type) {
      case 'boolean':
        return (
          <Form.Check
            type="switch"
            checked={prop.value}
            onChange={(e) => handlePropertyChange(prop.key, e.target.checked)}
            disabled={readonly}
            isInvalid={!!hasError}
          />
        );
      
      case 'select':
        return (
          <Form.Select
            value={prop.value}
            onChange={(e) => handlePropertyChange(prop.key, e.target.value)}
            disabled={readonly}
            isInvalid={!!hasError}
          >
            {prop.options?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </Form.Select>
        );
      
      case 'number':
        return (
          <Form.Control
            type="number"
            value={prop.value}
            onChange={(e) => handlePropertyChange(prop.key, parseFloat(e.target.value) || 0)}
            disabled={readonly}
            isInvalid={!!hasError}
          />
        );
      
      default:
        return (
          <Form.Control
            type="text"
            value={prop.value}
            onChange={(e) => handlePropertyChange(prop.key, e.target.value)}
            disabled={readonly}
            isInvalid={!!hasError}
          />
        );
    }
  };

  if (!selectedNode) {
    return (
      <div className="property-panel h-100 d-flex align-items-center justify-content-center" style={{ background: '#f8f9fa' }}>
        <div className="text-center p-4">
          <div className="mb-3" style={{ fontSize: '3rem', opacity: 0.3 }}>
            <CogIcon />
          </div>
          <h6 className="mb-2" style={{ color: '#495057' }}>No Component Selected</h6>
          <p className="text-muted small mb-0" style={{ maxWidth: '250px' }}>
            Select a component from the workflow canvas to view and edit its properties.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="property-panel h-100" style={{ background: '#fff', borderLeft: '1px solid #dee2e6' }}>
      <div className="p-3 border-bottom bg-light">
        <div className="d-flex justify-content-between align-items-start">
          <div className="flex-grow-1">
            <div className="d-flex align-items-center gap-2 mb-1">
              <Badge bg="primary" className="px-2 py-1">
                {selectedNode.component.type.toUpperCase()}
              </Badge>
              <small className="text-muted">ID: {selectedNode.id.substring(0, 8)}</small>
            </div>
            <h6 className="mb-0">{selectedNode.component.name}</h6>
          </div>
          <Button variant="link" size="sm" onClick={onClose} className="text-muted p-0">
            <TimesIcon />
          </Button>
        </div>
      </div>
      
      <div className="p-3" style={{ overflowY: 'auto', height: 'calc(100% - 80px)' }}>
        {/* Validation Errors Alert */}
        {Object.keys(validationErrors).length > 0 && (
          <Alert variant="danger" className="py-2 mb-3">
            <small>
              <strong>⚠️ Validation Errors:</strong>
              <ul className="mb-0 mt-1 ps-3">
                {Object.entries(validationErrors).map(([key, error]) => (
                  <li key={key}>{error}</li>
                ))}
              </ul>
            </small>
          </Alert>
        )}

        {/* Properties Form */}
        <div className="mb-4">
          <div className="d-flex align-items-center gap-2 mb-3">
            <CodeIcon style={{ fontSize: '14px', color: '#6c757d' }} />
            <h6 className="mb-0 small fw-bold">Configuration</h6>
          </div>
          {properties.map(prop => (
            <Form.Group key={prop.key} className="mb-3">
              <Form.Label>
                {prop.key.charAt(0).toUpperCase() + prop.key.slice(1)}
                {prop.required && <span className="text-danger ms-1">*</span>}
              </Form.Label>
              {renderPropertyInput(prop)}
              {prop.description && (
                <Form.Text className="text-muted">
                  {prop.description}
                </Form.Text>
              )}
              {validationErrors[prop.key] && (
                <Form.Text className="text-danger">
                  {validationErrors[prop.key]}
                </Form.Text>
              )}
            </Form.Group>
          ))}
        </div>

        {/* Component Info */}
        <div className="mb-4">
          <h6 className="mb-3">Input/Output Information</h6>
          <Row>
            <Col md={6}>
              <div className="border rounded p-3 bg-light">
                <h6 className="small mb-2">Expected Inputs</h6>
                <div className="small text-muted">
                  {selectedNode.component.inputs?.map(input => (
                    <div key={input.name}>
                      <strong>{input.name}</strong> ({input.type})
                      {input.required && <span className="text-danger">*</span>}
                    </div>
                  )) || <em>Dynamic inputs</em>}
                </div>
              </div>
            </Col>
            <Col md={6}>
              <div className="border rounded p-3 bg-light">
                <h6 className="small mb-2">Generated Outputs</h6>
                <div className="small text-muted">
                  {selectedNode.component.outputs?.map(output => (
                    <div key={output.name}>
                      <strong>{output.name}</strong> ({output.type})
                    </div>
                  )) || <em>Dynamic outputs</em>}
                </div>
              </div>
            </Col>
          </Row>
        </div>

        {/* Unsaved Changes Warning */}
        {hasUnsavedChanges && (
          <Alert variant="warning" className="py-2 mb-3">
            <small>
              <strong>⚠️ Unsaved Changes:</strong> Remember to save your changes.
            </small>
          </Alert>
        )}

        {/* Action Buttons */}
        {!readonly && (
          <div className="d-grid gap-2">
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={!hasUnsavedChanges || Object.keys(validationErrors).length > 0}
              className="d-flex align-items-center justify-content-center gap-2"
            >
              <CheckIcon style={{ fontSize: '12px' }} />
              Save Changes
            </Button>
            <Button
              variant="outline-secondary"
              onClick={handleReset}
              disabled={!hasUnsavedChanges}
              size="sm"
            >
              Reset
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertyPanel;