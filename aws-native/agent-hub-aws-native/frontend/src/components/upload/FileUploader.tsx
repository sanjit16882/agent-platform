import React, { useState, useCallback, useRef } from 'react';
import { Form, Button, Alert, ListGroup } from 'react-bootstrap';

interface FileUploaderProps {
  onUploadStart: () => void;
  onUploadProgress: (progress: { stage: string; progress: number; message: string }) => void;
  onUploadComplete: (result: { success: boolean; agentId?: string; error?: string; warnings?: string[] }) => void;
  disabled: boolean;
}

interface UploadFile {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'complete' | 'error';
  error?: string;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onUploadStart,
  onUploadProgress,
  onUploadComplete,
  disabled
}) => {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [agentName, setAgentName] = useState('');
  const [agentDescription, setAgentDescription] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supportedFormats = [
    '.zip', '.tar', '.tar.gz', '.py', '.js', '.ts', '.json', '.yaml', '.yml'
  ];

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  }, []);

  const handleFiles = useCallback((fileList: File[]) => {
    const newFiles: UploadFile[] = fileList.map(file => ({
      file,
      id: `${file.name}-${Date.now()}`,
      status: 'pending'
    }));

    // Validate file types
    const validFiles = newFiles.filter(({ file }) => {
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      return supportedFormats.includes(extension) || file.type.startsWith('application/');
    });

    const invalidFiles = newFiles.filter(({ file }) => {
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      return !supportedFormats.includes(extension) && !file.type.startsWith('application/');
    });

    if (invalidFiles.length > 0) {
      alert(`Unsupported file types: ${invalidFiles.map(f => f.file.name).join(', ')}`);
    }

    setFiles(prev => [...prev, ...validFiles]);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  }, [handleFiles]);

  const removeFile = useCallback((fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  }, []);

  const uploadFiles = useCallback(async () => {
    if (files.length === 0) {
      alert('Please select files to upload');
      return;
    }

    if (!agentName.trim()) {
      alert('Please enter an agent name');
      return;
    }

    onUploadStart();

    try {
      // Simulate upload process with multiple stages
      onUploadProgress({
        stage: 'Validating Files',
        progress: 10,
        message: 'Checking file integrity and format...'
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      onUploadProgress({
        stage: 'Uploading Files',
        progress: 30,
        message: 'Transferring files to server...'
      });

      // Create FormData for file upload
      const formData = new FormData();
      files.forEach(({ file }) => {
        formData.append('files', file);
      });
      formData.append('agentName', agentName);
      formData.append('agentDescription', agentDescription);
      formData.append('uploadMethod', 'file');

      await new Promise(resolve => setTimeout(resolve, 2000));

      onUploadProgress({
        stage: 'Processing Agent',
        progress: 70,
        message: 'Analyzing agent structure and dependencies...'
      });

      await new Promise(resolve => setTimeout(resolve, 1500));

      onUploadProgress({
        stage: 'Finalizing',
        progress: 90,
        message: 'Creating agent entry and metadata...'
      });

      await new Promise(resolve => setTimeout(resolve, 500));

      // Simulate successful upload
      const agentId = `agent_${Date.now()}`;
      onUploadComplete({
        success: true,
        agentId,
        warnings: files.length > 5 ? ['Large number of files may impact performance'] : undefined
      });

      // Reset form
      setFiles([]);
      setAgentName('');
      setAgentDescription('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      onUploadComplete({
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      });
    }
  }, [files, agentName, agentDescription, onUploadStart, onUploadProgress, onUploadComplete]);

  return (
    <div className="file-uploader">
      <Form>
        <Form.Group className="mb-3">
          <Form.Label>Agent Name *</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter agent name"
            value={agentName}
            onChange={(e) => setAgentName(e.target.value)}
            disabled={disabled}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Description</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            placeholder="Describe what this agent does"
            value={agentDescription}
            onChange={(e) => setAgentDescription(e.target.value)}
            disabled={disabled}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Files</Form.Label>
          <div
            className={`border rounded p-4 text-center ${dragActive ? 'border-primary bg-light' : 'border-dashed'}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            style={{ minHeight: '120px', cursor: 'pointer' }}
            onClick={() => fileInputRef.current?.click()}
          >
            <i className="fas fa-cloud-upload-alt fa-2x text-muted mb-2"></i>
            <p className="mb-1">Drag and drop files here, or click to browse</p>
            <small className="text-muted">
              Supported formats: {supportedFormats.join(', ')}
            </small>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileInput}
              style={{ display: 'none' }}
              accept={supportedFormats.join(',')}
              disabled={disabled}
            />
          </div>
        </Form.Group>

        {files.length > 0 && (
          <div className="mb-3">
            <h6>Selected Files:</h6>
            <ListGroup>
              {files.map(({ file, id, status, error }) => (
                <ListGroup.Item key={id} className="d-flex justify-content-between align-items-center">
                  <div>
                    <strong>{file.name}</strong>
                    <small className="text-muted ms-2">({(file.size / 1024).toFixed(1)} KB)</small>
                    {error && <div className="text-danger small">{error}</div>}
                  </div>
                  <div className="d-flex align-items-center">
                    {status === 'pending' && (
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => removeFile(id)}
                        disabled={disabled}
                      >
                        <i className="fas fa-times"></i>
                      </Button>
                    )}
                    {status === 'uploading' && (
                      <i className="fas fa-spinner fa-spin text-primary"></i>
                    )}
                    {status === 'complete' && (
                      <i className="fas fa-check text-success"></i>
                    )}
                    {status === 'error' && (
                      <i className="fas fa-exclamation-triangle text-danger"></i>
                    )}
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </div>
        )}

        <Alert variant="info" className="small">
          <strong>Supported Agent Types:</strong>
          <ul className="mb-0 mt-1">
            <li>Python agents (.py files or .zip/.tar archives)</li>
            <li>JavaScript/Node.js agents (.js/.ts files or archives)</li>
            <li>Configuration-based agents (.json/.yaml files)</li>
            <li>Multi-file agent packages (compressed archives)</li>
          </ul>
        </Alert>

        <div className="d-flex justify-content-end">
          <Button
            variant="primary"
            onClick={uploadFiles}
            disabled={disabled || files.length === 0 || !agentName.trim()}
          >
            <i className="fas fa-upload me-2"></i>
            Upload Agent
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default FileUploader;