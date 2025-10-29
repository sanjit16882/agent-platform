import React from 'react';
import { Button, ButtonGroup, Badge } from 'react-bootstrap';
import './WorkflowToolbar.css';

interface WorkflowToolbarProps {
  onSave: () => void;
  onValidate: () => void;
  onExport: () => void;
  onImport: () => void;
  canSave: boolean;
  canValidate: boolean;
  nodeCount: number;
  connectionCount: number;
  validationStatus?: 'valid' | 'invalid' | 'pending' | null;
  readonly?: boolean;
}

const WorkflowToolbar: React.FC<WorkflowToolbarProps> = ({
  onSave,
  onValidate,
  onExport,
  onImport,
  canSave,
  canValidate,
  nodeCount,
  connectionCount,
  validationStatus,
  readonly = false
}) => {
  const getValidationBadge = () => {
    switch (validationStatus) {
      case 'valid':
        return <Badge bg="success" className="ms-2">Valid</Badge>;
      case 'invalid':
        return <Badge bg="danger" className="ms-2">Invalid</Badge>;
      case 'pending':
        return <Badge bg="warning" className="ms-2">Validating...</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="workflow-toolbar">
      <div className="toolbar-section">
        <h6 className="toolbar-title mb-0">Workflow Designer</h6>
        {getValidationBadge()}
      </div>

      <div className="toolbar-section">
        <div className="workflow-stats">
          <span className="stat-item">
            <strong>{nodeCount}</strong> Components
          </span>
          <span className="stat-item">
            <strong>{connectionCount}</strong> Connections
          </span>
        </div>
      </div>

      {!readonly && (
        <div className="toolbar-section">
          <ButtonGroup size="sm">
            <Button
              variant="outline-secondary"
              onClick={onImport}
              title="Import Workflow"
            >
              📁 Import
            </Button>
            <Button
              variant="outline-secondary"
              onClick={onExport}
              disabled={nodeCount === 0}
              title="Export Workflow"
            >
              💾 Export
            </Button>
          </ButtonGroup>
        </div>
      )}

      <div className="toolbar-section">
        <ButtonGroup size="sm">
          <Button
            variant="outline-primary"
            onClick={onValidate}
            disabled={!canValidate}
            title="Validate Workflow"
          >
            ✓ Validate
          </Button>
          {!readonly && (
            <Button
              variant="primary"
              onClick={onSave}
              disabled={!canSave}
              title="Save Workflow"
            >
              💾 Save
            </Button>
          )}
        </ButtonGroup>
      </div>


    </div>
  );
};

export default WorkflowToolbar;