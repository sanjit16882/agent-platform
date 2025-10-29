import React, { useState } from 'react';
import { Row, Col, Card, Button, Form, Badge, ListGroup } from 'react-bootstrap';
import { DataMapping, MappingSession, DataField } from '../../types/dataMapping';

interface FieldMappingPanelProps {
  session: MappingSession;
  selectedMapping: DataMapping | null;
  onSelectMapping: (mapping: DataMapping | null) => void;
  onCreateMapping: (sourceField: string, targetField: string) => void;
  onUpdateMapping: (mappingId: string, updates: Partial<DataMapping>) => void;
  onDeleteMapping: (mappingId: string) => void;
}

const FieldMappingPanel: React.FC<FieldMappingPanelProps> = ({
  session,
  selectedMapping,
  onSelectMapping,
  onCreateMapping,
  onUpdateMapping,
  onDeleteMapping
}) => {
  const [draggedField, setDraggedField] = useState<{ field: DataField; type: 'source' | 'target' } | null>(null);
  const [selectedSourceField, setSelectedSourceField] = useState<string>('');
  const [selectedTargetField, setSelectedTargetField] = useState<string>('');

  // Handle drag start
  const handleDragStart = (field: DataField, type: 'source' | 'target') => {
    setDraggedField({ field, type });
  };

  // Handle drop
  const handleDrop = (targetField: DataField, targetType: 'source' | 'target') => {
    if (!draggedField || draggedField.type === targetType) return;

    if (draggedField.type === 'source' && targetType === 'target') {
      // Create mapping from source to target
      onCreateMapping(draggedField.field.name, targetField.name);
    }

    setDraggedField(null);
  };

  // Handle manual mapping creation
  const handleCreateManualMapping = () => {
    if (selectedSourceField && selectedTargetField) {
      onCreateMapping(selectedSourceField, selectedTargetField);
      setSelectedSourceField('');
      setSelectedTargetField('');
    }
  };

  // Check if field is already mapped
  const isFieldMapped = (fieldName: string, type: 'source' | 'target') => {
    return session.mappings.some(mapping => 
      type === 'source' ? mapping.sourceField === fieldName : mapping.targetField === fieldName
    );
  };

  // Get mapping for field
  const getMappingForField = (fieldName: string, type: 'source' | 'target') => {
    return session.mappings.find(mapping => 
      type === 'source' ? mapping.sourceField === fieldName : mapping.targetField === fieldName
    );
  };

  // Render field item
  const renderFieldItem = (field: DataField, type: 'source' | 'target') => {
    const isMapped = isFieldMapped(field.name, type);
    const mapping = getMappingForField(field.name, type);
    const isSelected = selectedMapping?.id === mapping?.id;

    return (
      <ListGroup.Item
        key={field.id}
        className={`field-item ${isMapped ? 'mapped' : ''} ${isSelected ? 'selected' : ''}`}
        draggable
        onDragStart={() => handleDragStart(field, type)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={() => handleDrop(field, type)}
        onClick={() => mapping && onSelectMapping(mapping)}
        style={{ cursor: 'pointer' }}
      >
        <div className="d-flex justify-content-between align-items-start">
          <div className="flex-grow-1">
            <div className="d-flex align-items-center mb-1">
              <strong>{field.name}</strong>
              <Badge bg="primary" className="ms-2 small">
                {field.type}
              </Badge>
              {field.required && (
                <Badge bg="danger" className="ms-1 small">
                  Required
                </Badge>
              )}
            </div>
            {field.description && (
              <small className="text-muted">{field.description}</small>
            )}
            {isMapped && mapping && (
              <div className="mt-2">
                <Badge bg="success" className="small">
                  Mapped to: {type === 'source' ? mapping.targetField : mapping.sourceField}
                </Badge>
                {mapping.transformation?.type !== 'direct' && (
                  <Badge bg="info" className="ms-1 small">
                    {mapping.transformation?.type}
                  </Badge>
                )}
              </div>
            )}
          </div>
          {isMapped && mapping && (
            <Button
              variant="outline-danger"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteMapping(mapping.id);
              }}
            >
              Remove
            </Button>
          )}
        </div>
      </ListGroup.Item>
    );
  };

  return (
    <div className="field-mapping-panel">
      <Row>
        {/* Source Fields */}
        <Col md={5}>
          <Card>
            <Card.Header className="bg-primary text-white">
              <h6 className="mb-0">
                Source: {session.sourceComponent.name}
              </h6>
            </Card.Header>
            <Card.Body className="p-0">
              <ListGroup variant="flush">
                {session.sourceComponent.outputs.map(field => 
                  renderFieldItem(field, 'source')
                )}
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>

        {/* Mapping Controls */}
        <Col md={2} className="d-flex flex-column justify-content-center">
          <div className="text-center mb-3">
            <div className="mapping-arrow">
              <svg width="60" height="30" viewBox="0 0 60 30">
                <defs>
                  <marker id="arrowhead" markerWidth="10" markerHeight="7" 
                          refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#0d6efd" />
                  </marker>
                </defs>
                <line x1="5" y1="15" x2="50" y2="15" 
                      stroke="#0d6efd" strokeWidth="2" markerEnd="url(#arrowhead)" />
              </svg>
            </div>
          </div>

          {/* Manual Mapping Controls */}
          <Card className="mb-3">
            <Card.Body className="p-3">
              <h6 className="mb-3">Manual Mapping</h6>
              
              <Form.Group className="mb-2">
                <Form.Label className="small">Source Field</Form.Label>
                <Form.Select
                  size="sm"
                  value={selectedSourceField}
                  onChange={(e) => setSelectedSourceField(e.target.value)}
                >
                  <option value="">Select source...</option>
                  {session.sourceComponent.outputs.map(field => (
                    <option key={field.id} value={field.name}>
                      {field.name} ({field.type})
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="small">Target Field</Form.Label>
                <Form.Select
                  size="sm"
                  value={selectedTargetField}
                  onChange={(e) => setSelectedTargetField(e.target.value)}
                >
                  <option value="">Select target...</option>
                  {session.targetComponent.inputs.map(field => (
                    <option key={field.id} value={field.name}>
                      {field.name} ({field.type})
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Button
                variant="primary"
                size="sm"
                onClick={handleCreateManualMapping}
                disabled={!selectedSourceField || !selectedTargetField}
                className="w-100"
              >
                Create Mapping
              </Button>
            </Card.Body>
          </Card>

          {/* Mapping Statistics */}
          <Card>
            <Card.Body className="p-3 text-center">
              <div className="mb-2">
                <strong>{session.mappings.length}</strong>
                <br />
                <small className="text-muted">Mappings</small>
              </div>
              <div className="mb-2">
                <strong>
                  {session.targetComponent.inputs.filter(f => f.required && 
                    isFieldMapped(f.name, 'target')).length}
                  /
                  {session.targetComponent.inputs.filter(f => f.required).length}
                </strong>
                <br />
                <small className="text-muted">Required Fields</small>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Target Fields */}
        <Col md={5}>
          <Card>
            <Card.Header className="bg-primary text-white">
              <h6 className="mb-0">
                Target: {session.targetComponent.name}
              </h6>
            </Card.Header>
            <Card.Body className="p-0">
              <ListGroup variant="flush">
                {session.targetComponent.inputs.map(field => 
                  renderFieldItem(field, 'target')
                )}
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Instructions */}
      <div className="mt-3">
        <Card className="bg-light">
          <Card.Body className="p-3">
            <h6 className="mb-2">How to Create Mappings:</h6>
            <ul className="mb-0 small">
              <li><strong>Drag & Drop:</strong> Drag a source field to a target field to create a mapping</li>
              <li><strong>Manual Selection:</strong> Use the dropdown menus in the center panel</li>
              <li><strong>Edit Mapping:</strong> Click on a mapped field to select it, then use the Transformation tab</li>
              <li><strong>Remove Mapping:</strong> Click the "Remove" button on any mapped field</li>
            </ul>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
};

export default FieldMappingPanel;