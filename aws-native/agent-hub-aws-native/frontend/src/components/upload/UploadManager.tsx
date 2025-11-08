import React, { useState, useCallback } from 'react';
import { Card, Nav, Tab, Alert, ProgressBar } from 'react-bootstrap';
import { FileUploader } from './FileUploader';
import { GitImporter } from './GitImporter';
import { DockerUploader } from './DockerUploader';
import { CodeEditor } from './CodeEditor';

interface UploadProgress {
  stage: string;
  progress: number;
  message: string;
}

interface UploadResult {
  success: boolean;
  agentId?: string;
  error?: string;
  warnings?: string[];
}

export const UploadManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('file');
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleUploadStart = useCallback(() => {
    setIsUploading(true);
    setUploadResult(null);
    setUploadProgress({
      stage: 'Initializing',
      progress: 0,
      message: 'Preparing upload...'
    });
  }, []);

  const handleUploadProgress = useCallback((progress: UploadProgress) => {
    setUploadProgress(progress);
  }, []);

  const handleUploadComplete = useCallback((result: UploadResult) => {
    setIsUploading(false);
    setUploadProgress(null);
    setUploadResult(result);
  }, []);

  const renderUploadStatus = () => {
    if (uploadProgress) {
      return (
        <Alert variant="info" className="mt-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <strong>{uploadProgress.stage}</strong>
            <span>{uploadProgress.progress}%</span>
          </div>
          <ProgressBar now={uploadProgress.progress} className="mb-2" />
          <small>{uploadProgress.message}</small>
        </Alert>
      );
    }

    if (uploadResult) {
      return (
        <Alert variant={uploadResult.success ? 'success' : 'danger'} className="mt-3">
          {uploadResult.success ? (
            <>
              <strong>Upload Successful!</strong>
              <p className="mb-1">Agent ID: {uploadResult.agentId}</p>
              {uploadResult.warnings && uploadResult.warnings.length > 0 && (
                <div className="mt-2">
                  <strong>Warnings:</strong>
                  <ul className="mb-0 mt-1">
                    {uploadResult.warnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <>
              <strong>Upload Failed</strong>
              <p className="mb-0">{uploadResult.error}</p>
            </>
          )}
        </Alert>
      );
    }

    return null;
  };

  return (
    <div className="upload-manager">
      <Card>
        <Card.Header>
          <h4 className="mb-0">Upload Agent</h4>
          <small className="text-muted">
            Choose your preferred method to upload an agent to the platform
          </small>
        </Card.Header>
        <Card.Body>
          <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'file')}>
            <Nav variant="tabs" className="mb-3">
              <Nav.Item>
                <Nav.Link eventKey="file">
                  <i className="fas fa-file-upload me-2"></i>
                  File Upload
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="git">
                  <i className="fab fa-git-alt me-2"></i>
                  Git Repository
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="docker">
                  <i className="fab fa-docker me-2"></i>
                  Docker Container
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="code">
                  <i className="fas fa-code me-2"></i>
                  Direct Code
                </Nav.Link>
              </Nav.Item>
            </Nav>

            <Tab.Content>
              <Tab.Pane eventKey="file">
                <FileUploader
                  onUploadStart={handleUploadStart}
                  onUploadProgress={handleUploadProgress}
                  onUploadComplete={handleUploadComplete}
                  disabled={isUploading}
                />
              </Tab.Pane>
              <Tab.Pane eventKey="git">
                <GitImporter
                  onUploadStart={handleUploadStart}
                  onUploadProgress={handleUploadProgress}
                  onUploadComplete={handleUploadComplete}
                  disabled={isUploading}
                />
              </Tab.Pane>
              <Tab.Pane eventKey="docker">
                <DockerUploader
                  onUploadStart={handleUploadStart}
                  onUploadProgress={handleUploadProgress}
                  onUploadComplete={handleUploadComplete}
                  disabled={isUploading}
                />
              </Tab.Pane>
              <Tab.Pane eventKey="code">
                <CodeEditor
                  onUploadStart={handleUploadStart}
                  onUploadProgress={handleUploadProgress}
                  onUploadComplete={handleUploadComplete}
                  disabled={isUploading}
                />
              </Tab.Pane>
            </Tab.Content>
          </Tab.Container>

          {renderUploadStatus()}
        </Card.Body>
      </Card>
    </div>
  );
};

export default UploadManager;