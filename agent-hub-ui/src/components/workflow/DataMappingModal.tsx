import React, { useState, useEffect } from 'react';
import { Modal, Row, Col, Card, Button, Form, Alert, Badge, Tabs, Tab } from 'react-bootstrap';
import { ComponentNode } from '../../types/hybridAgent';
import { 
  DataMapping, 
  DataField, 
  MappingSession, 
  DataTransformation,
  TransformationType,
  DataPreview
} from '../../types/dataMapping';
import dataTransformationService from '../../services/dataTransformationService';
import FieldMappingPanel from './FieldMappingPanel';
import TransformationEditor from './TransformationEditor';
import DataPreviewPanel from './DataPreviewPanel';
import './DataMappingModal.css';

interface DataMappingModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceComponent: ComponentNode | null;
  targetComponent: ComponentNode | null;
  existingMappings?: DataMapping[];
  onSaveMappings: (mappings: DataMapping[]) => void;
}

const DataMappingModal: React.FC<DataMappingModalProps> = ({
  isOpen,
  onClose,
  sourceComponent,
  targetComponent,
  existingMappings = [],
  onSaveMappings
}) => {
  const [activeTab, setActiveTab] = useState('mapping');
  const [mappingSession, setMappingSession] = useState<MappingSession | null>(null);
  const [selectedMapping, setSelectedMapping] = useState<DataMapping | null>(null);
  const [dataPreview, setDataPreview] = useState<DataPreview | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Initialize mapping session when components are available
  useEffect(() => {
    if (sourceComponent && targetComponent) {
      const session: MappingSession = {
        id: `mapping-${sourceComponent.id}-${targetComponent.id}`,
        sourceComponent: {
          id: sourceComponent.id,
          name: sourceComponent.component.name,
          outputs: getComponentOutputFields(sourceComponent)
        },
        targetComponent: {
          id: targetComponent.id,
          name: targetComponent.component.name,
          inputs: getComponentInputFields(targetComponent)
        },
        mappings: existingMappings,
        isComplete: false,
        lastModified: new Date()
      };
      
      setMappingSession(session);
    }
  }, [sourceComponent, targetComponent, existingMappings]);

  // Get output fields from source component
  const getComponentOutputFields = (component: ComponentNode): DataField[] => {
    // Demo data - in production this would come from component metadata
    const baseFields: DataField[] = [
      {
        id: 'output_1',
        name: 'result',
        type: 'string',
        description: 'Main output result',
        required: true
      },
      {
        id: 'output_2', 
        name: 'metadata',
        type: 'object',
        description: 'Processing metadata',
        required: false
      }
    ];

    // Add component-specific fields based on type
    switch (component.component.type) {
      case 'llm':
        return [
          ...baseFields,
          {
            id: 'llm_response',
            name: 'response',
            type: 'string',
            description: 'LLM generated response',
            required: true
          },
          {
            id: 'llm_tokens',
            name: 'tokenUsage',
            type: 'number',
            description: 'Tokens consumed',
            required: false
          }
        ];
        
      case 'rpa':
        return [
          ...baseFields,
          {
            id: 'rpa_status',
            name: 'automationStatus',
            type: 'string',
            description: 'RPA execution status',
            required: true
          },
          {
            id: 'rpa_data',
            name: 'extractedData',
            type: 'object',
            description: 'Data extracted by RPA',
            required: false
          }
        ];
        
      case 'selenium':
        return [
          ...baseFields,
          {
            id: 'selenium_screenshot',
            name: 'screenshot',
            type: 'file',
            description: 'Screenshot capture',
            required: false
          },
          {
            id: 'selenium_elements',
            name: 'elements',
            type: 'array',
            description: 'Found web elements',
            required: false
          }
        ];
        
      default:
        return baseFields;
    }
  };

  // Get input fields from target component
  const getComponentInputFields = (component: ComponentNode): DataField[] => {
    // Demo data - in production this would come from component metadata
    const baseFields: DataField[] = [
      {
        id: 'input_1',
        name: 'data',
        type: 'string',
        description: 'Input data to process',
        required: true
      },
      {
        id: 'input_2',
        name: 'options',
        type: 'object',
        description: 'Processing options',
        required: false
      }
    ];

    // Add component-specific fields
    switch (component.component.type) {
      case 'llm':
        return [
          {
            id: 'llm_prompt',
            name: 'prompt',
            type: 'string',
            description: 'LLM prompt text',
            required: true
          },
          {
            id: 'llm_context',
            name: 'context',
            type: 'string',
            description: 'Additional context',
            required: false
          },
          ...baseFields
        ];
        
      case 'rpa':
        return [
          {
            id: 'rpa_target',
            name: 'targetApplication',
            type: 'string',
            description: 'Target application',
            required: true
          },
          {
            id: 'rpa_actions',
            name: 'actions',
            type: 'array',
            description: 'RPA actions to perform',
            required: true
          },
          ...baseFields
        ];
        
      default:
        return baseFields;
    }
  };

  // Create new mapping
  const handleCreateMapping = (sourceField: string, targetField: string) => {
    if (!mappingSession) return;

    const newMapping: DataMapping = {
      id: `mapping-${Date.now()}`,
      sourceComponentId: mappingSession.sourceComponent.id,
      targetComponentId: mappingSession.targetComponent.id,
      sourceField,
      targetField,
      transformation: {
        id: `transform-${Date.now()}`,
        type: 'direct',
        config: { direct: {} }
      },
      validation: [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const updatedMappings = [...mappingSession.mappings, newMapping];
    setMappingSession({
      ...mappingSession,
      mappings: updatedMappings,
      lastModified: new Date()
    });
  };

  // Update existing mapping
  const handleUpdateMapping = (mappingId: string, updates: Partial<DataMapping>) => {
    if (!mappingSession) return;

    const updatedMappings = mappingSession.mappings.map(mapping =>
      mapping.id === mappingId 
        ? { ...mapping, ...updates, updatedAt: new Date() }
        : mapping
    );

    setMappingSession({
      ...mappingSession,
      mappings: updatedMappings,
      lastModified: new Date()
    });
  };

  // Delete mapping
  const handleDeleteMapping = (mappingId: string) => {
    if (!mappingSession) return;

    const updatedMappings = mappingSession.mappings.filter(m => m.id !== mappingId);
    setMappingSession({
      ...mappingSession,
      mappings: updatedMappings,
      lastModified: new Date()
    });

    if (selectedMapping?.id === mappingId) {
      setSelectedMapping(null);
    }
  };

  // Generate data preview
  const handleGeneratePreview = async () => {
    if (!mappingSession) return;

    setIsGeneratingPreview(true);
    try {
      // Generate sample source data
      const sampleData = generateSampleData(mappingSession.sourceComponent);
      
      const preview = await dataTransformationService.generatePreview(
        sampleData,
        mappingSession.mappings,
        3
      );
      
      setDataPreview(preview);
      setActiveTab('preview');
    } catch (error) {
      console.error('Preview generation failed:', error);
      setValidationErrors([`Preview failed: ${error instanceof Error ? error.message : 'Unknown error'}`]);
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  // Generate sample data for preview
  const generateSampleData = (component: { outputs: DataField[] }) => {
    const sampleData: any = {};
    
    component.outputs.forEach(field => {
      switch (field.type) {
        case 'string':
          sampleData[field.name] = `Sample ${field.name} value`;
          break;
        case 'number':
          sampleData[field.name] = Math.floor(Math.random() * 100);
          break;
        case 'boolean':
          sampleData[field.name] = Math.random() > 0.5;
          break;
        case 'array':
          sampleData[field.name] = ['item1', 'item2', 'item3'];
          break;
        case 'object':
          sampleData[field.name] = { key: 'value', nested: { data: 'example' } };
          break;
        default:
          sampleData[field.name] = `Sample ${field.type}`;
      }
    });
    
    return sampleData;
  };

  // Save mappings
  const handleSave = () => {
    if (!mappingSession) return;

    // Validate mappings
    const errors: string[] = [];
    
    // Check for required target fields that aren't mapped
    const requiredTargetFields = mappingSession.targetComponent.inputs.filter(f => f.required);
    const mappedTargetFields = mappingSession.mappings.map(m => m.targetField);
    
    requiredTargetFields.forEach(field => {
      if (!mappedTargetFields.includes(field.name)) {
        errors.push(`Required field "${field.name}" is not mapped`);
      }
    });

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    onSaveMappings(mappingSession.mappings);
    onClose();
  };

  if (!mappingSession) {
    return null;
  }

  return (
    <Modal show={isOpen} onHide={onClose} size="xl" className="data-mapping-modal">
      <Modal.Header closeButton>
        <Modal.Title>
          Data Mapping: {mappingSession.sourceComponent.name} → {mappingSession.targetComponent.name}
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        {validationErrors.length > 0 && (
          <Alert variant="danger" className="mb-3">
            <strong>Validation Errors:</strong>
            <ul className="mb-0 mt-2">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </Alert>
        )}

        <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'mapping')} className="mb-3">
          <Tab eventKey="mapping" title="Field Mapping">
            <FieldMappingPanel
              session={mappingSession}
              selectedMapping={selectedMapping}
              onSelectMapping={setSelectedMapping}
              onCreateMapping={handleCreateMapping}
              onUpdateMapping={handleUpdateMapping}
              onDeleteMapping={handleDeleteMapping}
            />
          </Tab>
          
          <Tab eventKey="transformation" title="Transformation" disabled={!selectedMapping}>
            {selectedMapping && (
              <TransformationEditor
                mapping={selectedMapping}
                onUpdateTransformation={(transformation) => 
                  handleUpdateMapping(selectedMapping.id, { transformation })
                }
              />
            )}
          </Tab>
          
          <Tab eventKey="preview" title={
            <span>
              Preview 
              {dataPreview && <Badge bg="primary" className="ms-2">Ready</Badge>}
            </span>
          }>
            <DataPreviewPanel
              preview={dataPreview}
              isGenerating={isGeneratingPreview}
              onGenerate={handleGeneratePreview}
            />
          </Tab>
        </Tabs>
      </Modal.Body>
      
      <Modal.Footer>
        <div className="d-flex justify-content-between w-100">
          <div>
            <small className="text-muted">
              {mappingSession.mappings.length} mappings configured
            </small>
          </div>
          <div>
            <Button variant="outline-primary" onClick={onClose} className="me-2">
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave}>
              Save Mappings
            </Button>
          </div>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default DataMappingModal;