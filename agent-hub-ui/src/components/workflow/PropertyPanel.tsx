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
      <Card className="property-panel">
        <Card.Body className="text-center py-5">
          <div className="text-muted mb-3" style={{ fontSize: '2rem' }}>⚙️</div>
          <h5>No Component Selected</h5>
          <p className="text-muted">
            Select a component from the workflow canvas to view and edit its properties.
          </p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="property-panel">
      <Card.Header>
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h6 className="mb-0">
              ⚙️ Component Properties
            </h6>
            <small className="text-muted">
              {selectedNode.component.type} - {selectedNode.component.name}
            </small>
          </div>
          <Button variant="outline-secondary" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>
      </Card.Header>
      
      <Card.Body>
        {/* Component Type Badge */}
        <div className="mb-3">
          <Badge bg="primary" className="me-2">
            {selectedNode.component.type}
          </Badge>
          <Badge bg="secondary">
            ID: {selectedNode.id}
          </Badge>
        </div>

        {/* Validation Errors Alert */}
        {Object.keys(validationErrors).length > 0 && (
          <Alert variant="danger" className="py-2">
            <small>
              <strong>Validation Errors:</strong>
              <ul className="mb-0 mt-1">
                {Object.entries(validationErrors).map(([key, error]) => (
                  <li key={key}>{error}</li>
                ))}
              </ul>
            </small>
          </Alert>
        )}

        {/* Properties Form */}
        <div className="mb-4">
          <h6 className="mb-3">Configuration</h6>
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

        {/* Action Buttons */}
        {!readonly && (
          <div className="d-flex gap-2">
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={!hasUnsavedChanges || Object.keys(validationErrors).length > 0}
            >
              ✓ Save Changes
            </Button>
            <Button
              variant="outline-secondary"
              onClick={handleReset}
              disabled={!hasUnsavedChanges}
            >
              Reset
            </Button>
          </div>
        )}

        {/* Unsaved Changes Warning */}
        {hasUnsavedChanges && (
          <Alert variant="warning" className="mt-3 py-2">
            <small>
              <strong>Unsaved Changes:</strong> You have unsaved changes to this component.
            </small>
          </Alert>
        )}
      </Card.Body>
    </Card>
  );
};

export default PropertyPanel;