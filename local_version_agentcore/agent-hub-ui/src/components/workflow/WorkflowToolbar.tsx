import React, { useState } from 'react';
import { Button, ButtonGroup, Badge, Dropdown, Form, Modal } from 'react-bootstrap';
import './WorkflowToolbar.css';

// React Icons compatibility fix - using createElement
const { createElement } = React;
const icons = require('react-icons/fa');

const FaSave = (props: any) => createElement(icons.FaSave, props);
const FaCheck = (props: any) => createElement(icons.FaCheck, props);
const FaDownload = (props: any) => createElement(icons.FaDownload, props);
const FaUpload = (props: any) => createElement(icons.FaUpload, props);
const FaSearchPlus = (props: any) => createElement(icons.FaSearchPlus, props);
const FaSearchMinus = (props: any) => createElement(icons.FaSearchMinus, props);
const FaExpand = (props: any) => createElement(icons.FaExpand, props);
const FaUndo = (props: any) => createElement(icons.FaUndo, props);
const FaRedo = (props: any) => createElement(icons.FaRedo, props);
const FaCog = (props: any) => createElement(icons.FaCog, props);
const FaPlay = (props: any) => createElement(icons.FaPlay, props);

interface WorkflowToolbarProps {
  onSave: () => void;
  onValidate: () => void;
  onExport: () => void;
  onImport: () => void;
  onTest?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onZoomFit?: () => void;
  onZoomReset?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canSave: boolean;
  canValidate: boolean;
  canUndo?: boolean;
  canRedo?: boolean;
  nodeCount: number;
  connectionCount: number;
  currentZoom?: number;
  validationStatus?: 'valid' | 'invalid' | 'pending' | null;
  readonly?: boolean;
}

const WorkflowToolbar: React.FC<WorkflowToolbarProps> = ({
  onSave,
  onValidate,
  onExport,
  onImport,
  onTest,
  onZoomIn,
  onZoomOut,
  onZoomFit,
  onZoomReset,
  onUndo,
  onRedo,
  canSave,
  canValidate,
  canUndo = false,
  canRedo = false,
  nodeCount,
  connectionCount,
  currentZoom = 1,
  validationStatus,
  readonly = false
}) => {
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'yaml' | 'png'>('json');
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

  const handleExport = () => {
    if (exportFormat === 'png') {
      // Handle PNG export (screenshot)
      // This would need to be implemented with html2canvas or similar
      console.log('PNG export not yet implemented');
    } else {
      onExport();
    }
    setShowExportModal(false);
  };

  return (
    <>
      <div className="workflow-toolbar">
        {/* Left Section - Title and Status */}
        <div className="toolbar-section">
          <h6 className="toolbar-title mb-0">Workflow Designer</h6>
          {getValidationBadge()}
        </div>

        {/* Center Section - Stats and Zoom */}
        <div className="toolbar-section">
          <div className="workflow-stats">
            <span className="stat-item">
              <strong>{nodeCount}</strong> Components
            </span>
            <span className="stat-item">
              <strong>{connectionCount}</strong> Connections
            </span>
            <span className="stat-item">
              <strong>{Math.round(currentZoom * 100)}%</strong> Zoom
            </span>
          </div>
        </div>

        {/* Right Section - Action Buttons */}
        <div className="toolbar-section">
          {/* Undo/Redo Controls */}
          {!readonly && (onUndo || onRedo) && (
            <ButtonGroup size="sm" className="me-2">
              <Button
                variant="outline-secondary"
                onClick={onUndo}
                disabled={!canUndo}
                title="Undo (Ctrl+Z)"
              >
                <FaUndo />
              </Button>
              <Button
                variant="outline-secondary"
                onClick={onRedo}
                disabled={!canRedo}
                title="Redo (Ctrl+Y)"
              >
                <FaRedo />
              </Button>
            </ButtonGroup>
          )}

          {/* Zoom Controls */}
          {(onZoomIn || onZoomOut || onZoomFit || onZoomReset) && (
            <ButtonGroup size="sm" className="me-2">
              <Button
                variant="outline-secondary"
                onClick={onZoomOut}
                title="Zoom Out (-)"
              >
                <FaSearchMinus />
              </Button>
              <Button
                variant="outline-secondary"
                onClick={onZoomReset}
                title="Reset Zoom (1)"
              >
                {Math.round(currentZoom * 100)}%
              </Button>
              <Button
                variant="outline-secondary"
                onClick={onZoomIn}
                title="Zoom In (+)"
              >
                <FaSearchPlus />
              </Button>
              <Button
                variant="outline-secondary"
                onClick={onZoomFit}
                title="Fit to View (0)"
              >
                <FaExpand />
              </Button>
            </ButtonGroup>
          )}

          {/* File Operations */}
          <ButtonGroup size="sm" className="me-2">
            <Button
              variant="outline-secondary"
              onClick={onImport}
              title="Import Workflow"
            >
              <FaUpload className="me-1" />
              Import
            </Button>
            <Dropdown as={ButtonGroup}>
              <Button
                variant="outline-secondary"
                onClick={() => setShowExportModal(true)}
                disabled={nodeCount === 0}
                title="Export Workflow"
              >
                <FaDownload className="me-1" />
                Export
              </Button>
              <Dropdown.Toggle 
                split 
                variant="outline-secondary" 
                disabled={nodeCount === 0}
              />
              <Dropdown.Menu>
                <Dropdown.Item onClick={() => { setExportFormat('json'); handleExport(); }}>
                  Export as JSON
                </Dropdown.Item>
                <Dropdown.Item onClick={() => { setExportFormat('yaml'); handleExport(); }}>
                  Export as YAML
                </Dropdown.Item>
                <Dropdown.Item onClick={() => { setExportFormat('png'); handleExport(); }}>
                  Export as Image
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </ButtonGroup>

          {/* Workflow Actions */}
          <ButtonGroup size="sm">
            {onTest && (
              <Button
                variant="outline-primary"
                onClick={onTest}
                disabled={!canValidate || nodeCount === 0}
                title="Test Workflow"
              >
                <FaPlay className="me-1" />
                Test
              </Button>
            )}
            <Button
              variant="outline-warning"
              onClick={onValidate}
              disabled={!canValidate || nodeCount === 0}
              title="Validate Workflow"
            >
              <FaCheck className="me-1" />
              Validate
            </Button>
            {!readonly && (
              <Button
                variant="primary"
                onClick={onSave}
                disabled={!canSave}
                title="Save Workflow (Ctrl+S)"
              >
                <FaSave className="me-1" />
                Save
              </Button>
            )}
          </ButtonGroup>
        </div>
      </div>

      {/* Export Modal */}
      <Modal show={showExportModal} onHide={() => setShowExportModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Export Workflow</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Export Format</Form.Label>
              <Form.Select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as 'json' | 'yaml' | 'png')}
              >
                <option value="json">JSON - Machine readable format</option>
                <option value="yaml">YAML - Human readable format</option>
                <option value="png">PNG - Visual diagram image</option>
              </Form.Select>
            </Form.Group>
            
            <div className="export-info">
              {exportFormat === 'json' && (
                <div className="text-muted small">
                  Exports the complete workflow configuration including all components, 
                  connections, and settings in JSON format.
                </div>
              )}
              {exportFormat === 'yaml' && (
                <div className="text-muted small">
                  Exports the workflow in YAML format, which is more human-readable 
                  and easier to edit manually.
                </div>
              )}
              {exportFormat === 'png' && (
                <div className="text-muted small">
                  Exports a visual representation of the workflow as a PNG image 
                  for documentation or presentation purposes.
                </div>
              )}
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowExportModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleExport}>
            <FaDownload className="me-1" />
            Export
          </Button>
        </Modal.Footer>
      </Modal>

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
    </>
  );
};

export default WorkflowToolbar;