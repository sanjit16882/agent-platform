import React, { useState, useMemo } from 'react';
import { Form, Card, Badge, Button } from 'react-bootstrap';
import { ComponentTemplate } from '../../services/agentCompositionService';
import './ComponentPalette.css';

interface ComponentPaletteProps {
  templates: ComponentTemplate[];
  onAddComponent: (template: ComponentTemplate) => void;
  readonly?: boolean;
}

const ComponentPalette: React.FC<ComponentPaletteProps> = ({
  templates,
  onAddComponent,
  readonly = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Get unique categories
  const categories = useMemo(() => {
    const uniqueTypes = Array.from(new Set(templates.map(t => t.type)));
    const cats = ['all', ...uniqueTypes];
    return cats;
  }, [templates]);

  // Filter templates based on search and category
  const filteredTemplates = useMemo(() => {
    return templates.filter(template => {
      const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           template.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || template.type === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [templates, searchTerm, selectedCategory]);

  const getTypeIcon = (type: string) => {
    // Removed fancy icons for clean, professional appearance
    return '';
  };

  const getTypeColor = (type: string) => {
    // Use consistent blue color for all component types
    return 'primary';
  };

  return (
    <div className="component-palette">
      <div className="palette-header">
        <h6 className="mb-3">Component Library</h6>
        
        {/* Search */}
        <Form.Group className="mb-3">
          <Form.Control
            type="text"
            placeholder="Search components..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="sm"
          />
        </Form.Group>

        {/* Category Filter */}
        <Form.Group className="mb-3">
          <Form.Select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            size="sm"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === 'all' ? 'All Categories' : category.toUpperCase()}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
      </div>

      {/* Component List */}
      <div className="palette-content">
        {filteredTemplates.length === 0 ? (
          <div className="text-center text-muted py-3">
            <small>No components found</small>
          </div>
        ) : (
          filteredTemplates.map(template => (
            <Card key={template.id} className="component-template-card mb-2">
              <Card.Body className="p-2">
                <div className="d-flex align-items-start justify-content-between">
                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <small className="fw-bold">{template.name}</small>
                      <Badge bg={getTypeColor(template.type)} className="badge-sm">
                        {template.type}
                      </Badge>
                    </div>
                    <p className="small text-muted mb-2" style={{ fontSize: '11px' }}>
                      {template.description}
                    </p>
                    
                    {/* Template Details */}
                    <div className="template-details">
                      {template.requiredInputs.length > 0 && (
                        <div className="mb-1">
                          <small className="text-muted">Inputs: </small>
                          <small>{template.requiredInputs.join(', ')}</small>
                        </div>
                      )}
                      {template.providedOutputs.length > 0 && (
                        <div className="mb-1">
                          <small className="text-muted">Outputs: </small>
                          <small>{template.providedOutputs.join(', ')}</small>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {!readonly && (
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => onAddComponent(template)}
                      className="ms-2"
                      style={{ fontSize: '11px', padding: '2px 6px' }}
                    >
                      Add
                    </Button>
                  )}
                </div>
              </Card.Body>
            </Card>
          ))
        )}
      </div>

      {/* Palette Footer */}
      <div className="palette-footer mt-3 pt-2 border-top">
        <small className="text-muted">
          {filteredTemplates.length} of {templates.length} components
        </small>
      </div>


    </div>
  );
};

export default ComponentPalette;