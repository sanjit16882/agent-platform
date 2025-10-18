import React, { useState } from 'react';
import { Button, Dropdown, Modal, Form, Row, Col, Badge, Alert, Spinner } from 'react-bootstrap';
import { exportService } from '../services/exportService';

interface ExportOptionsProps {
  executionResult: any;
  agentName: string;
  agentCategory: string;
  variant?: string;
  size?: 'sm' | 'lg';
  className?: string;
}

const ExportOptions: React.FC<ExportOptionsProps> = ({
  executionResult,
  agentName,
  agentCategory,
  variant = 'success',
  size,
  className = ''
}) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'excel' | 'word'>('pdf');
  const [isExporting, setIsExporting] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    includeCode: true,
    includeMetrics: true,
    includeRecommendations: true,
    includeCharts: false,
    customTitle: '',
    addWatermark: false
  });

  const handleQuickExport = async (format: 'pdf' | 'excel' | 'word') => {
    setIsExporting(true);
    try {
      await exportService.generateExecutionReport(
        executionResult,
        format,
        agentName,
        agentCategory
      );
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCustomExport = async () => {
    setIsExporting(true);
    try {
      // In a real implementation, we would pass the custom options
      await exportService.generateExecutionReport(
        executionResult,
        selectedFormat,
        agentName,
        agentCategory
      );
      setShowModal(false);
    } catch (error) {
      console.error('Custom export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const getFormatIcon = (format: string): string => {
    switch (format) {
      case 'pdf': return '📄';
      case 'excel': return '📊';
      case 'word': return '📝';
      default: return '📋';
    }
  };

  const getFormatDescription = (format: string): string => {
    switch (format) {
      case 'pdf': return 'Professional report with formatting and charts';
      case 'excel': return 'Spreadsheet with data tables and metrics';
      case 'word': return 'Editable document with detailed analysis';
      default: return 'Standard export format';
    }
  };

  const getEstimatedSize = (format: string): string => {
    switch (format) {
      case 'pdf': return '~2-5 MB';
      case 'excel': return '~500 KB';
      case 'word': return '~1-3 MB';
      default: return '~1 MB';
    }
  };

  if (isExporting) {
    return (
      <Button variant={variant} size={size} disabled className={className}>
        <Spinner animation="border" size="sm" className="me-2" />
        Exporting...
      </Button>
    );
  }

  return (
    <>
      <Dropdown className={className}>
        <Dropdown.Toggle variant={variant} size={size}>
          📥 Export Report
        </Dropdown.Toggle>

        <Dropdown.Menu>
          <Dropdown.Header>Quick Export</Dropdown.Header>
          
          <Dropdown.Item onClick={() => handleQuickExport('pdf')}>
            <div className="d-flex justify-content-between align-items-center">
              <span>📄 PDF Report</span>
              <Badge bg="primary" className="ms-2">Recommended</Badge>
            </div>
            <small className="text-muted">Professional formatted report</small>
          </Dropdown.Item>
          
          <Dropdown.Item onClick={() => handleQuickExport('excel')}>
            <div className="d-flex justify-content-between align-items-center">
              <span>📊 Excel Spreadsheet</span>
            </div>
            <small className="text-muted">Data tables and metrics</small>
          </Dropdown.Item>
          
          <Dropdown.Item onClick={() => handleQuickExport('word')}>
            <div className="d-flex justify-content-between align-items-center">
              <span>📝 Word Document</span>
            </div>
            <small className="text-muted">Editable detailed report</small>
          </Dropdown.Item>

          <Dropdown.Divider />
          
          <Dropdown.Item onClick={() => setShowModal(true)}>
            <span>⚙️ Custom Export Options</span>
            <br />
            <small className="text-muted">Configure export settings</small>
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>

      {/* Custom Export Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>📋 Custom Export Options</Modal.Title>
        </Modal.Header>
        
        <Modal.Body>
          <Alert variant="info">
            <strong>💡 Pro Tip:</strong> Customize your export to include only the sections you need for your specific use case.
          </Alert>

          <Form>
            {/* Format Selection */}
            <Form.Group className="mb-4">
              <Form.Label className="fw-bold">Export Format</Form.Label>
              <Row>
                {(['pdf', 'excel', 'word'] as const).map(format => (
                  <Col key={format} md={4} className="mb-2">
                    <Form.Check
                      type="radio"
                      id={`format-${format}`}
                      name="format"
                      checked={selectedFormat === format}
                      onChange={() => setSelectedFormat(format)}
                      label={
                        <div>
                          <div className="fw-bold">
                            {getFormatIcon(format)} {format.toUpperCase()}
                          </div>
                          <small className="text-muted">
                            {getFormatDescription(format)}
                          </small>
                          <br />
                          <Badge bg="secondary" className="small">
                            {getEstimatedSize(format)}
                          </Badge>
                        </div>
                      }
                    />
                  </Col>
                ))}
              </Row>
            </Form.Group>

            {/* Content Options */}
            <Form.Group className="mb-4">
              <Form.Label className="fw-bold">Include in Export</Form.Label>
              <Row>
                <Col md={6}>
                  <Form.Check
                    type="checkbox"
                    id="includeCode"
                    checked={exportOptions.includeCode}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, includeCode: e.target.checked }))}
                    label="Generated Code Files"
                  />
                  <Form.Check
                    type="checkbox"
                    id="includeMetrics"
                    checked={exportOptions.includeMetrics}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, includeMetrics: e.target.checked }))}
                    label="Performance Metrics"
                  />
                </Col>
                <Col md={6}>
                  <Form.Check
                    type="checkbox"
                    id="includeRecommendations"
                    checked={exportOptions.includeRecommendations}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, includeRecommendations: e.target.checked }))}
                    label="Recommendations"
                  />
                  <Form.Check
                    type="checkbox"
                    id="includeCharts"
                    checked={exportOptions.includeCharts}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, includeCharts: e.target.checked }))}
                    label="Charts & Visualizations"
                    disabled={selectedFormat === 'excel'}
                  />
                </Col>
              </Row>
            </Form.Group>

            {/* Customization Options */}
            <Form.Group className="mb-4">
              <Form.Label className="fw-bold">Customization</Form.Label>
              <Row>
                <Col md={8}>
                  <Form.Group className="mb-2">
                    <Form.Label>Custom Report Title (Optional)</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder={`${agentName} - Execution Report`}
                      value={exportOptions.customTitle}
                      onChange={(e) => setExportOptions(prev => ({ ...prev, customTitle: e.target.value }))}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-2">
                    <Form.Label>&nbsp;</Form.Label>
                    <Form.Check
                      type="checkbox"
                      id="addWatermark"
                      checked={exportOptions.addWatermark}
                      onChange={(e) => setExportOptions(prev => ({ ...prev, addWatermark: e.target.checked }))}
                      label="Add Watermark"
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Form.Group>

            {/* Preview Information */}
            <Alert variant="light" className="border">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <strong>Export Preview:</strong>
                  <br />
                  <small className="text-muted">
                    {selectedFormat.toUpperCase()} • {agentCategory} Agent • {new Date().toLocaleDateString()}
                  </small>
                </div>
                <Badge bg="info">
                  {getEstimatedSize(selectedFormat)}
                </Badge>
              </div>
            </Alert>
          </Form>
        </Modal.Body>
        
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleCustomExport}
            disabled={isExporting}
          >
            {isExporting ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Generating...
              </>
            ) : (
              <>
                {getFormatIcon(selectedFormat)} Generate {selectedFormat.toUpperCase()}
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default ExportOptions;