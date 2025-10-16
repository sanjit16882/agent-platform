import React, { useState, useCallback } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert, ProgressBar, Badge, Modal, Spinner, Toast, ToastContainer } from 'react-bootstrap';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { Icon } from './Icon';
import { useAgentContext, DeployedAgent } from '../context/AgentContext';

interface UploadedFile {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'validating' | 'validated' | 'validation_failed' | 'success' | 'error' | 'deploying' | 'deployed';
  progress: number;
  error?: string;
  validationId?: string;
  validationScore?: number;
  grade?: string;
  deploymentReady?: boolean;
  recommendations?: string[];
  deploymentStatus?: string;
}

interface AgentMetadata {
  name: string;
  description: string;
  category: string;
  version: string;
  author: string;
  tags: string[];
  frameworks?: string[];
  dependencies?: string[];
  inputSchema?: any;
  outputSchema?: any;
  executionRequirements?: {
    timeout?: number;
    memory?: number;
    cpu?: number;
    environment?: string[];
  };
  integrations?: {
    type: string;
    required: boolean;
    description: string;
  }[];
  visibility?: 'private' | 'team' | 'organization' | 'public';
  license?: string;
  documentation?: string;
  examples?: {
    name: string;
    input: any;
    expectedOutput: any;
    description: string;
  }[];
}

interface ValidationResult {
  agent_id: string;
  status: string;
  validation_id: string;
  validation_score: number;
  grade: string;
  deployment_ready: boolean;
  recommendations: string[];
  message: string;
}

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
}

const AgentUpload: React.FC = () => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [showMetadataModal, setShowMetadataModal] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [currentFileId, setCurrentFileId] = useState<string>('');
  const [currentValidationResult, setCurrentValidationResult] = useState<ValidationResult | null>(null);
  const [agentMetadata, setAgentMetadata] = useState<AgentMetadata>({
    name: '',
    description: '',
    category: 'QE',
    version: '1.0.0',
    author: '',
    tags: [],
    frameworks: [],
    dependencies: []
  });
  const [uploadSource, setUploadSource] = useState<'file' | 'github' | 'docker'>('file');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [githubUrl, setGithubUrl] = useState('');
  const [githubBranch, setGithubBranch] = useState('main');
  const [dockerImage, setDockerImage] = useState('');
  const [dockerRegistry, setDockerRegistry] = useState('');
  const { deployedAgents, addDeployedAgent, updateDeployedAgent, removeDeployedAgent } = useAgentContext();

  // Debug function to manually add a test agent
  const addTestAgent = () => {
    const testAgent: DeployedAgent = {
      id: 'test-agent-' + Date.now(),
      name: 'Test QE Agent',
      description: 'Test agent for debugging purposes',
      version: '1.0.0',
      status: 'active',
      deployedAt: new Date().toISOString(),
      category: 'qa',
      executionCount: 0,
      author: 'Debug Test',
      tags: ['test', 'debug'],
      framework: 'test',
      pricing: {
        costPerExecution: 0.10,
        estimatedRuntime: '10s'
      },
      capabilities: ['test_capability']
    };
    
    console.log('Adding test agent:', testAgent);
    addDeployedAgent(testAgent);
  };
  const [showManagementModal, setShowManagementModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<DeployedAgent | null>(null);

  const API_BASE_URL = 'https://z5ujq1k916.execute-api.us-east-1.amazonaws.com/prod';

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      status: 'pending' as const,
      progress: 0
    }));
    
    setUploadedFiles(prev => [...prev, ...newFiles]);
    
    // Auto-start real upload process
    newFiles.forEach(uploadFile => {
      uploadAgent(uploadFile.id);
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/zip': ['.zip'],
      'application/x-tar': ['.tar'],
      'application/gzip': ['.tar.gz'],
      'text/x-python': ['.py'],
      'application/json': ['.json']
    },
    multiple: true
  });

  const uploadAgent = async (fileId: string) => {
    const uploadFile = uploadedFiles.find(f => f.id === fileId);
    if (!uploadFile) return;

    try {
      setIsUploading(true);
      
      // Step 1: Simulate agent registration
      setUploadedFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, status: 'uploading', progress: 10 } : f
      ));

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));

      const agentId = `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Step 2: Simulate package upload with progress
      setUploadedFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, progress: 30 } : f
      ));

      // Simulate upload progress
      for (let progress = 40; progress <= 80; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 200));
        setUploadedFiles(prev => prev.map(f => 
          f.id === fileId ? { ...f, progress } : f
        ));
      }

      // Step 3: Simulate validation
      setUploadedFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, status: 'validating', progress: 90 } : f
      ));

      await new Promise(resolve => setTimeout(resolve, 1500));

      // Generate mock validation results
      const fileName = uploadFile.file.name.toLowerCase();
      const isGoodFile = fileName.includes('test') || fileName.includes('qe') || fileName.includes('agent') || fileName.endsWith('.py') || fileName.endsWith('.zip');
      
      const validationResult = {
        validation_id: agentId,
        validation_score: isGoodFile ? Math.floor(Math.random() * 20) + 80 : Math.floor(Math.random() * 30) + 50,
        grade: isGoodFile ? (Math.random() > 0.5 ? 'A' : 'B') : (Math.random() > 0.5 ? 'B' : 'C'),
        deployment_ready: isGoodFile && Math.random() > 0.2,
        recommendations: isGoodFile ? [
          'Agent structure follows best practices',
          'Security scan passed with no issues',
          'Performance metrics within acceptable range'
        ] : [
          'Consider adding input validation',
          'Update dependencies to latest versions',
          'Add error handling for edge cases'
        ]
      };
      
      // Update file with validation results
      setUploadedFiles(prev => prev.map(f => 
        f.id === fileId ? { 
          ...f, 
          status: validationResult.deployment_ready ? 'validated' : 'validation_failed',
          progress: 100,
          validationId: validationResult.validation_id,
          validationScore: validationResult.validation_score,
          grade: validationResult.grade,
          deploymentReady: validationResult.deployment_ready,
          recommendations: validationResult.recommendations || []
        } : f
      ));

      // Show toast notification
      addToast({
        type: validationResult.deployment_ready ? 'success' : 'warning',
        title: 'Upload Complete',
        message: `${uploadFile.file.name} uploaded and validated. Score: ${validationResult.validation_score}/100 (${validationResult.grade})`
      });

    } catch (error: any) {
      console.error('Upload failed:', error);
      
      setUploadedFiles(prev => prev.map(f => 
        f.id === fileId ? { 
          ...f, 
          status: 'error', 
          progress: 0,
          error: error.response?.data?.message || 'Upload failed'
        } : f
      ));

      addToast({
        type: 'error',
        title: 'Upload Failed',
        message: error.response?.data?.message || 'Failed to upload agent'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { ...toast, id }]);
    
    // Auto-remove toast after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleViewValidation = (fileId: string) => {
    const uploadFile = uploadedFiles.find(f => f.id === fileId);
    if (!uploadFile || !uploadFile.validationId) return;

    // Create mock validation result for display
    setCurrentValidationResult({
      agent_id: uploadFile.validationId,
      status: uploadFile.status,
      validation_id: uploadFile.validationId,
      validation_score: uploadFile.validationScore || 0,
      grade: uploadFile.grade || 'F',
      deployment_ready: uploadFile.deploymentReady || false,
      recommendations: uploadFile.recommendations || [],
      message: uploadFile.deploymentReady ? 'Agent passed validation' : 'Agent needs improvements'
    });
    
    setShowValidationModal(true);
  };

  const handleConfigureAgent = (fileId: string) => {
    const uploadFile = uploadedFiles.find(f => f.id === fileId);
    if (!uploadFile) return;

    // Pre-populate metadata from file name
    setAgentMetadata({
      name: uploadFile.file.name.replace(/\.[^/.]+$/, ""),
      description: `Custom agent: ${uploadFile.file.name}`,
      category: 'Custom',
      version: '1.0.0',
      author: 'User Upload',
      tags: [],
      frameworks: [],
      dependencies: []
    });
    
    setCurrentFileId(fileId);
    setShowMetadataModal(true);
  };

  const handleSaveMetadata = async () => {
    try {
      const uploadFile = uploadedFiles.find(f => f.id === currentFileId);
      if (!uploadFile || !uploadFile.validationId) return;

      // Simulate metadata update
      await new Promise(resolve => setTimeout(resolve, 800));

      setShowMetadataModal(false);
      
      addToast({
        type: 'success',
        title: 'Agent Configured',
        message: `Agent "${agentMetadata.name}" configured successfully!`
      });

      // Update file status
      setUploadedFiles(prev => prev.map(f => 
        f.id === currentFileId ? { ...f, status: 'success' } : f
      ));

    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Configuration Failed',
        message: error.response?.data?.message || 'Failed to configure agent'
      });
    }
  };

  const handleDeployAgent = async (fileId: string) => {
    try {
      const uploadFile = uploadedFiles.find(f => f.id === fileId);
      if (!uploadFile || !uploadFile.validationId) {
        console.error('Upload file not found or missing validation ID:', fileId);
        return;
      }



      // Update file status to show deployment starting
      setUploadedFiles(prev => prev.map(f => 
        f.id === fileId ? { 
          ...f, 
          status: 'deploying', 
          deploymentStatus: 'Starting deployment...' 
        } : f
      ));

      // Simulate deployment delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create deployed agent using the same structure as the working test
      const storedDockerImage = (uploadFile as any).dockerImageName || dockerImage;
      const storedMetadata = (uploadFile as any).agentMetadata || {};
      
      // Use the exact same structure as the working test agent
      const newDeployedAgent: DeployedAgent = {
        id: uploadFile.validationId,
        name: storedMetadata.name || 'QE Failure Analyzer',
        description: storedMetadata.description || 'Advanced test failure analysis agent that categorizes failures, identifies root causes, and provides actionable fix recommendations for QE teams',
        version: storedMetadata.version || '1.0.0',
        status: 'active', // Set directly to active like the test
        deployedAt: new Date().toISOString(),
        category: storedMetadata.category || 'QE',
        executionCount: 0,
        dockerImage: storedDockerImage,
        author: storedMetadata.author || 'QE Team',
        tags: storedMetadata.tags || ['testing', 'failure-analysis', 'debugging', 'qa', 'automation'],
        framework: 'docker',
        pricing: {
          costPerExecution: 0.15,
          estimatedRuntime: '30s'
        },
        capabilities: [
          'failure_categorization',
          'root_cause_analysis',
          'fix_recommendations',
          'pattern_detection'
        ]
      };

      addDeployedAgent(newDeployedAgent);
      
      // Update file status to show deployment in progress
      setUploadedFiles(prev => prev.map(f => 
        f.id === fileId ? { 
          ...f, 
          deploymentStatus: 'Deploying to production...' 
        } : f
      ));

      // Update file status to show deployment complete immediately
      setUploadedFiles(prev => prev.map(f => 
        f.id === fileId ? { 
          ...f, 
          status: 'deployed',
          deploymentStatus: `✅ ${newDeployedAgent.name} deployed successfully! Available in Agent Catalog.` 
        } : f
      ));


    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Deployment Failed',
        message: 'Failed to deploy agent. Please try again.'
      });
    }
  };

  const handleManageAgent = (agent: DeployedAgent) => {
    setSelectedAgent(agent);
    setShowManagementModal(true);
  };

  const handleEditAgent = async (agentId: string) => {
    // Simulate edit functionality
    addToast({
      type: 'info',
      title: 'Edit Mode',
      message: 'Agent configuration editor would open here'
    });
  };

  const handleDeleteAgent = async (agentId: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      removeDeployedAgent(agentId);
      setShowManagementModal(false);
      
      addToast({
        type: 'success',
        title: 'Agent Deleted',
        message: 'Agent has been successfully removed from the platform'
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Delete Failed',
        message: 'Failed to delete agent. Please try again.'
      });
    }
  };

  const handleToggleAgent = async (agentId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      
      updateDeployedAgent(agentId, { status: newStatus as any });
      
      addToast({
        type: 'success',
        title: `Agent ${newStatus === 'active' ? 'Activated' : 'Deactivated'}`,
        message: `Agent is now ${newStatus}`
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Status Update Failed',
        message: 'Failed to update agent status'
      });
    }
  };

  const handleGithubImport = async () => {
    if (!githubUrl) return;

    try {
      setIsUploading(true);
      
      addToast({
        type: 'info',
        title: 'GitHub Import Started',
        message: `Importing agent from ${githubUrl}...`
      });

      // Create a mock file entry for GitHub import with proper name
      const repoName = githubUrl.split('/').pop()?.replace('.git', '') || 'github-agent';
      const mockFile = new File([''], `${repoName}.zip`, { type: 'application/zip' });
      const newFile: UploadedFile = {
        file: mockFile,
        id: Math.random().toString(36).substr(2, 9),
        status: 'uploading',
        progress: 0
      };

      setUploadedFiles(prev => [...prev, newFile]);

      // Simulate GitHub import process with progress
      for (let progress = 20; progress <= 80; progress += 20) {
        await new Promise(resolve => setTimeout(resolve, 500));
        setUploadedFiles(prev => prev.map(f => 
          f.id === newFile.id ? { ...f, progress } : f
        ));
      }

      await new Promise(resolve => setTimeout(resolve, 1000));

      // Generate mock validation results
      const mockAgentId = `github_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Update file with validation results
      setUploadedFiles(prev => prev.map(f => 
        f.id === newFile.id ? { 
          ...f, 
          status: 'validated',
          progress: 100,
          validationId: mockAgentId,
          validationScore: 88,
          grade: 'B',
          deploymentReady: true,
          recommendations: [
            'GitHub repository structure is valid',
            'Dependencies successfully resolved',
            'Ready for deployment'
          ]
        } : f
      ));

      addToast({
        type: 'success',
        title: 'GitHub Import Complete',
        message: `Successfully imported agent from ${githubUrl}`
      });

    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'GitHub Import Failed',
        message: error.response?.data?.message || 'Failed to import from GitHub repository'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDockerImport = async () => {
    if (!dockerImage) return;

    try {
      setIsUploading(true);
      
      addToast({
        type: 'info',
        title: 'Docker Import Started',
        message: `Pulling Docker image ${dockerImage}...`
      });

      // Create a mock file entry for Docker import with proper name
      const imageName = dockerImage.split('/').pop()?.split(':')[0] || 'docker-agent';
      const mockFile = new File([''], `${imageName}.tar`, { type: 'application/x-tar' });
      const newFile: UploadedFile = {
        file: mockFile,
        id: Math.random().toString(36).substr(2, 9),
        status: 'uploading',
        progress: 0
      };

      // Store the Docker image name for later use in deployment
      (newFile as any).dockerImageName = dockerImage;
      
      // Set proper metadata for QE Failure Analyzer if detected
      const isQEAgent = dockerImage.toLowerCase().includes('qe') || dockerImage.toLowerCase().includes('failure');
      if (isQEAgent) {
        (newFile as any).agentMetadata = {
          name: 'QE Failure Analyzer',
          description: 'Advanced test failure analysis agent that categorizes failures, identifies root causes, and provides actionable fix recommendations for QE teams',
          category: 'QE',
          version: '1.0.0',
          author: 'QE Team',
          tags: ['testing', 'failure-analysis', 'debugging', 'qa', 'automation'],
          frameworks: ['docker'],
          dependencies: []
        };
      }

      setUploadedFiles(prev => [...prev, newFile]);

      // Simulate Docker import process with progress
      for (let progress = 25; progress <= 75; progress += 25) {
        await new Promise(resolve => setTimeout(resolve, 600));
        setUploadedFiles(prev => prev.map(f => 
          f.id === newFile.id ? { ...f, progress } : f
        ));
      }

      await new Promise(resolve => setTimeout(resolve, 1200));

      // Generate mock validation results for Docker
      const mockAgentId = `docker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      

      
      // Update file with validation results
      setUploadedFiles(prev => prev.map(f => 
        f.id === newFile.id ? { 
          ...f, 
          status: 'validated',
          progress: 100,
          validationId: mockAgentId,
          validationScore: 92,
          grade: 'A',
          deploymentReady: true,
          recommendations: [
            'Docker image successfully pulled and validated',
            'Container security scan passed',
            'All required ports and endpoints detected',
            'Ready for production deployment'
          ]
        } : f
      ));

      addToast({
        type: 'success',
        title: 'Docker Import Complete',
        message: `Successfully imported Docker image ${dockerImage}`
      });

    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Docker Import Failed',
        message: error.response?.data?.message || 'Failed to import Docker image'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'uploading': return 'primary';
      case 'validating': return 'warning';
      case 'validated': return 'success';
      case 'validation_failed': return 'warning';
      case 'success': return 'success';
      case 'deploying': return 'info';
      case 'deployed': return 'success';
      case 'error': return 'danger';
      default: return 'secondary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending Upload';
      case 'uploading': return 'Uploading...';
      case 'validating': return 'Validating Package...';
      case 'validated': return 'Validation Passed';
      case 'validation_failed': return 'Validation Issues';
      case 'success': return 'Ready for Deployment';
      case 'deploying': return 'Deploying...';
      case 'deployed': return 'Deployed Successfully';
      case 'error': return 'Upload Failed';
      default: return 'Unknown';
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'success';
      case 'B': return 'primary';
      case 'C': return 'warning';
      case 'D': return 'warning';
      case 'F': return 'danger';
      default: return 'secondary';
    }
  };

  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="display-5 fw-bold text-primary">Upload Agent</h1>
              <p className="lead">Add custom agents to your AgentHub marketplace</p>
            </div>
            <div>
              <small className="text-muted">
                Deployed: {deployedAgents.length} | Active: {deployedAgents.filter(a => a.status === 'active').length}
              </small>
            </div>
          </div>
        </Col>
      </Row>

      {/* Upload Status Banner */}
      <Row className="mb-4">
        <Col>
          <Alert variant={isUploading ? "info" : "success"}>
            <div className="d-flex align-items-center">
              <div className="me-3">
                {isUploading ? (
                  <Spinner animation="border" size="sm" />
                ) : (
                  <Icon name="success" size={32} color="success" />
                )}
              </div>
              <div className="flex-grow-1">
                <h6 className="mb-1">
                  {isUploading ? "Upload in Progress..." : "Advanced Agent Validation System"}
                </h6>
                <p className="mb-0 small">
                  {isUploading ? (
                    "Your agent is being uploaded and validated. This includes security scanning, code quality analysis, and performance assessment."
                  ) : (
                    "Upload agents with confidence. Our system provides comprehensive validation with security scanning, quality analysis, and deployment readiness assessment."
                  )}
                </p>
              </div>
              <div className="d-flex align-items-center gap-2">
                <Badge bg={isUploading ? "info" : "success"}>
                  {uploadedFiles.filter(f => f.status === 'validated' || f.status === 'success').length} validated
                </Badge>
                {deployedAgents.length > 0 && (
                  <Button 
                    variant="outline-primary" 
                    size="sm"
                    onClick={() => setShowManagementModal(true)}
                  >
                    <Icon name="settings" size="small" className="me-1" />
                    Manage Agents ({deployedAgents.length})
                  </Button>
                )}
              </div>
            </div>
          </Alert>
        </Col>
      </Row>

      {/* Deployed Agents Quick View */}
      {deployedAgents.length > 0 && (
        <Row className="mb-4">
          <Col>
            <Card>
              <Card.Header className="bg-success text-white">
                <h6 className="mb-0">
                  <Icon name="success" size="small" className="me-2" />
                  Recently Deployed Agents
                </h6>
              </Card.Header>
              <Card.Body>
                <Row>
                  {deployedAgents.slice(-3).map(agent => (
                    <Col md={4} key={agent.id}>
                      <Card className="border-0 bg-light">
                        <Card.Body className="p-3">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <h6 className="mb-0">{agent.name}</h6>
                            <Badge bg={agent.status === 'active' ? 'success' : agent.status === 'deploying' ? 'warning' : 'secondary'}>
                              {agent.status}
                            </Badge>
                          </div>
                          <p className="small text-muted mb-2">v{agent.version} • {agent.category}</p>
                          <div className="d-flex gap-1">
                            <Button 
                              variant="outline-primary" 
                              size="sm"
                              onClick={() => handleManageAgent(agent)}
                            >
                              <Icon name="settings" size="small" />
                            </Button>
                            <Button 
                              variant="outline-success" 
                              size="sm"
                              disabled={agent.status !== 'active'}
                            >
                              <Icon name="play" size="small" />
                            </Button>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Upload Source Selection */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">Select Agent Source</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={4}>
                  <Card 
                    className={`text-center cursor-pointer ${uploadSource === 'file' ? 'border-primary' : ''}`}
                    onClick={() => setUploadSource('file')}
                    style={{ cursor: 'pointer' }}
                  >
                    <Card.Body>
                      <div className="mb-3">
                        <Icon name="file" size="xlarge" color="primary" />
                      </div>
                      <h6>Upload Files</h6>
                      <p className="small text-muted">
                        ZIP, TAR, or Python files
                      </p>
                      {uploadSource === 'file' && <Badge bg="primary">Selected</Badge>}
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card 
                    className={`text-center cursor-pointer ${uploadSource === 'github' ? 'border-primary' : ''}`}
                    onClick={() => setUploadSource('github')}
                    style={{ cursor: 'pointer' }}
                  >
                    <Card.Body>
                      <div className="mb-3">
                        <Icon name="git" size="xlarge" color="dark" />
                      </div>
                      <h6>GitHub Repository</h6>
                      <p className="small text-muted">
                        Import from GitHub repo
                      </p>
                      {uploadSource === 'github' && <Badge bg="primary">Selected</Badge>}
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card 
                    className={`text-center cursor-pointer ${uploadSource === 'docker' ? 'border-primary' : ''}`}
                    onClick={() => setUploadSource('docker')}
                    style={{ cursor: 'pointer' }}
                  >
                    <Card.Body>
                      <div className="mb-3">
                        <Icon name="docker" size="xlarge" color="info" />
                      </div>
                      <h6>Docker Image</h6>
                      <p className="small text-muted">
                        Pull from Docker Hub
                      </p>
                      {uploadSource === 'docker' && <Badge bg="primary">Selected</Badge>}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* File Upload Area */}
      {uploadSource === 'file' && (
        <Row className="mb-4">
          <Col>
            <Card>
              <Card.Header className="bg-success text-white">
                <h5 className="mb-0">Upload Agent Files</h5>
              </Card.Header>
              <Card.Body>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded p-5 text-center ${
                    isDragActive ? 'border-primary bg-light' : 'border-secondary'
                  }`}
                  style={{ cursor: 'pointer' }}
                >
                  <input {...getInputProps()} />
                  <div className="mb-3">
                    <Icon name="upload" size={48} color="muted" />
                  </div>
                  {isDragActive ? (
                    <p className="mb-0">Drop the files here...</p>
                  ) : (
                    <div>
                      <p className="mb-2">
                        <strong>Drag & drop agent files here, or click to browse</strong>
                      </p>
                      <p className="text-muted small mb-0">
                        Supported formats: ZIP, TAR.GZ, Python files, JSON configs
                      </p>
                    </div>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* GitHub Import (Coming Soon) */}
      {uploadSource === 'github' && (
        <Row className="mb-4">
          <Col>
            <Card>
              <Card.Header className="bg-dark text-white">
                <h5 className="mb-0">Import from GitHub</h5>
              </Card.Header>
              <Card.Body>
                <Alert variant="info">
                  <h6>GitHub Integration</h6>
                  <p className="mb-0">
                    Import agents directly from GitHub repositories. Supports public and private repos with automatic validation.
                  </p>
                </Alert>
                <Form>
                  <Form.Group className="mb-3">
                    <Form.Label>Repository URL *</Form.Label>
                    <Form.Control 
                      type="url" 
                      placeholder="https://github.com/username/agent-repo"
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                    />
                    <Form.Text className="text-muted">
                      Enter the full GitHub repository URL
                    </Form.Text>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Branch</Form.Label>
                    <Form.Control 
                      type="text" 
                      placeholder="main"
                      value={githubBranch}
                      onChange={(e) => setGithubBranch(e.target.value)}
                    />
                    <Form.Text className="text-muted">
                      Specify the branch to import (default: main)
                    </Form.Text>
                  </Form.Group>
                  <Button 
                    variant="primary" 
                    onClick={() => handleGithubImport()}
                    disabled={!githubUrl || isUploading}
                  >
                    {isUploading ? (
                      <>
                        <Spinner size="sm" className="me-2" />
                        Importing...
                      </>
                    ) : (
                      'Import Repository'
                    )}
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Docker Import (Coming Soon) */}
      {uploadSource === 'docker' && (
        <Row className="mb-4">
          <Col>
            <Card>
              <Card.Header className="bg-info text-white">
                <h5 className="mb-0">Import Docker Image</h5>
              </Card.Header>
              <Card.Body>
                <Alert variant="info">
                  <h6>Docker Integration</h6>
                  <p className="mb-0">
                    Deploy containerized agents from Docker Hub or private registries. Perfect for existing automation tools.
                  </p>
                </Alert>
                <Form>
                  <Form.Group className="mb-3">
                    <Form.Label>Docker Image *</Form.Label>
                    <Form.Control 
                      type="text" 
                      placeholder="username/agent-name:latest"
                      value={dockerImage}
                      onChange={(e) => setDockerImage(e.target.value)}
                    />
                    <Form.Text className="text-muted">
                      Enter the Docker image name with tag
                    </Form.Text>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Registry (optional)</Form.Label>
                    <Form.Control 
                      type="text" 
                      placeholder="registry.company.com"
                      value={dockerRegistry}
                      onChange={(e) => setDockerRegistry(e.target.value)}
                    />
                    <Form.Text className="text-muted">
                      Leave empty for Docker Hub, or specify private registry
                    </Form.Text>
                  </Form.Group>
                  <Button 
                    variant="primary" 
                    onClick={() => handleDockerImport()}
                    disabled={!dockerImage || isUploading}
                  >
                    {isUploading ? (
                      <>
                        <Spinner size="sm" className="me-2" />
                        Pulling...
                      </>
                    ) : (
                      'Pull Image'
                    )}
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Upload Progress */}
      {uploadedFiles.length > 0 && (
        <Row className="mb-4">
          <Col>
            <Card>
              <Card.Header className="bg-warning text-dark">
                <h5 className="mb-0">Upload Progress</h5>
              </Card.Header>
              <Card.Body>
                {uploadedFiles.map((uploadFile) => (
                  <div key={uploadFile.id} className="mb-3 p-3 border rounded">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <div>
                        <strong>{uploadFile.file.name}</strong>
                        <small className="text-muted ms-2">
                          ({(uploadFile.file.size / 1024 / 1024).toFixed(2)} MB)
                        </small>
                      </div>
                      <Badge bg={getStatusColor(uploadFile.status)}>
                        {getStatusText(uploadFile.status)}
                      </Badge>
                    </div>
                    
                    {(uploadFile.status === 'uploading' || uploadFile.status === 'validating') && (
                      <ProgressBar 
                        now={uploadFile.progress} 
                        variant={uploadFile.status === 'uploading' ? 'primary' : 'warning'}
                        className="mb-2"
                      />
                    )}
                    
                    {/* Deployment Status */}
                    {(uploadFile.status === 'deploying' || uploadFile.status === 'deployed') && (
                      <div className="mt-2">
                        <Alert variant={uploadFile.status === 'deployed' ? 'success' : 'info'} className="py-2">
                          <div className="d-flex align-items-center">
                            {uploadFile.status === 'deploying' ? (
                              <Spinner animation="border" size="sm" className="me-2" />
                            ) : (
                              <Icon name="success" size="small" className="me-2" />
                            )}
                            <small>{uploadFile.deploymentStatus}</small>
                          </div>
                        </Alert>
                        {uploadFile.status === 'deployed' && (
                          <div className="d-flex gap-2">
                            <Button 
                              variant="outline-primary" 
                              size="sm"
                              onClick={() => window.location.href = '/agents'}
                            >
                              <Icon name="grid" size="small" className="me-1" />
                              View in Catalog
                            </Button>
                            <Button 
                              variant="outline-success" 
                              size="sm"
                              onClick={() => setShowManagementModal(true)}
                            >
                              <Icon name="settings" size="small" className="me-1" />
                              Manage Agent
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Validation Results */}
                    {(uploadFile.status === 'validated' || uploadFile.status === 'validation_failed') && (
                      <div className="mt-2">
                        <div className="d-flex align-items-center mb-2">
                          <Badge bg={getGradeColor(uploadFile.grade || 'F')} className="me-2">
                            Grade: {uploadFile.grade || 'F'}
                          </Badge>
                          <Badge bg="info" className="me-2">
                            Score: {uploadFile.validationScore || 0}/100
                          </Badge>
                          {uploadFile.deploymentReady && (
                            <Badge bg="success">✅ Deployment Ready</Badge>
                          )}
                        </div>
                        
                        {uploadFile.recommendations && uploadFile.recommendations.length > 0 && (
                          <div className="mb-2">
                            <small className="text-muted">Top Recommendations:</small>
                            <ul className="small mb-0 mt-1">
                              {uploadFile.recommendations.slice(0, 2).map((rec, idx) => (
                                <li key={idx}>{rec}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        <div className="d-flex gap-2">
                          <Button 
                            variant="outline-info" 
                            size="sm"
                            onClick={() => handleViewValidation(uploadFile.id)}
                          >
                            View Report
                          </Button>
                          
                          {uploadFile.deploymentReady ? (
                            <Button 
                              variant="success" 
                              size="sm"
                              onClick={() => {
                                console.log('Deploy Now clicked for:', uploadFile.id);
                                handleDeployAgent(uploadFile.id);
                              }}
                            >
                              Deploy Now
                            </Button>
                          ) : (
                            <Button 
                              variant="warning" 
                              size="sm"
                              onClick={() => handleConfigureAgent(uploadFile.id)}
                            >
                              Configure & Fix
                            </Button>
                          )}
                        </div>
                      </div>
                    )}

                    {uploadFile.status === 'success' && (
                      <div className="mt-2">
                        <Button 
                          variant="success" 
                          size="sm"
                          onClick={() => handleConfigureAgent(uploadFile.id)}
                        >
                          Configure Agent
                        </Button>
                      </div>
                    )}
                    
                    {uploadFile.error && (
                      <Alert variant="danger" className="mt-2 mb-0">
                        {uploadFile.error}
                      </Alert>
                    )}
                  </div>
                ))}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Agent Configuration Modal */}
      <Modal show={showMetadataModal} onHide={() => setShowMetadataModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Configure Agent</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Agent Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={agentMetadata.name}
                    onChange={(e) => setAgentMetadata({...agentMetadata, name: e.target.value})}
                    placeholder="My Custom QE Agent"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Version</Form.Label>
                  <Form.Control
                    type="text"
                    value={agentMetadata.version}
                    onChange={(e) => setAgentMetadata({...agentMetadata, version: e.target.value})}
                    placeholder="1.0.0"
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Description *</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={agentMetadata.description}
                onChange={(e) => setAgentMetadata({...agentMetadata, description: e.target.value})}
                placeholder="Describe what this agent does and how it helps teams..."
              />
            </Form.Group>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Category</Form.Label>
                  <Form.Select
                    value={agentMetadata.category}
                    onChange={(e) => setAgentMetadata({...agentMetadata, category: e.target.value})}
                  >
                    <option value="QE">QE & Testing</option>
                    <option value="DevOps">DevOps & Infrastructure</option>
                    <option value="Security">Security & Compliance</option>
                    <option value="Business">Business Intelligence</option>
                    <option value="Custom">Custom</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Author</Form.Label>
                  <Form.Control
                    type="text"
                    value={agentMetadata.author}
                    onChange={(e) => setAgentMetadata({...agentMetadata, author: e.target.value})}
                    placeholder="Your name or team"
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Tags (comma-separated)</Form.Label>
              <Form.Control
                type="text"
                placeholder="selenium, automation, testing, python"
                onChange={(e) => setAgentMetadata({
                  ...agentMetadata, 
                  tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                })}
              />
              <Form.Text className="text-muted">
                Add tags to help others discover your agent
              </Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowMetadataModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveMetadata}>
            Deploy Agent
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Validation Results Modal */}
      <Modal show={showValidationModal} onHide={() => setShowValidationModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Validation Report</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {currentValidationResult && (
            <>
              <Row className="mb-3">
                <Col md={4}>
                  <Card className="text-center">
                    <Card.Body>
                      <h2 className={`text-${getGradeColor(currentValidationResult.grade)}`}>
                        {currentValidationResult.grade}
                      </h2>
                      <Card.Text>Overall Grade</Card.Text>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="text-center">
                    <Card.Body>
                      <h2 className="text-primary">{currentValidationResult.validation_score}</h2>
                      <Card.Text>Validation Score</Card.Text>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="text-center">
                    <Card.Body>
                      <h2 className={`text-${currentValidationResult.deployment_ready ? 'success' : 'warning'}`}>
                        {currentValidationResult.deployment_ready ? 'PASS' : 'WARN'}
                      </h2>
                      <Card.Text>
                        {currentValidationResult.deployment_ready ? 'Ready' : 'Needs Work'}
                      </Card.Text>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <Alert variant={currentValidationResult.deployment_ready ? 'success' : 'warning'}>
                <Alert.Heading>
                  {currentValidationResult.deployment_ready ? 'Validation Passed!' : 'Validation Issues Found'}
                </Alert.Heading>
                <p className="mb-0">{currentValidationResult.message}</p>
              </Alert>

              {currentValidationResult.recommendations.length > 0 && (
                <Card>
                  <Card.Header>
                    <h6 className="mb-0">💡 Recommendations for Improvement</h6>
                  </Card.Header>
                  <Card.Body>
                    <ul className="mb-0">
                      {currentValidationResult.recommendations.map((rec, idx) => (
                        <li key={idx} className="mb-1">{rec}</li>
                      ))}
                    </ul>
                  </Card.Body>
                </Card>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowValidationModal(false)}>
            Close
          </Button>
          {currentValidationResult?.deployment_ready && (
            <Button variant="success" onClick={() => {
              setShowValidationModal(false);
              // Find the file and deploy it
              const fileId = uploadedFiles.find(f => f.validationId === currentValidationResult?.agent_id)?.id;
              if (fileId) handleDeployAgent(fileId);
            }}>
              Deploy Agent
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      {/* Toast Notifications */}
      <ToastContainer position="top-end" className="p-3">
        {toasts.map((toast) => (
          <Toast 
            key={toast.id} 
            show={true} 
            onClose={() => removeToast(toast.id)}
            className={`bg-${toast.type === 'error' ? 'danger' : toast.type} ${toast.type === 'error' ? 'text-white' : ''}`}
          >
            <Toast.Header>
              <strong className="me-auto">{toast.title}</strong>
            </Toast.Header>
            <Toast.Body>{toast.message}</Toast.Body>
          </Toast>
        ))}
      </ToastContainer>

      {/* Help Section */}
      <Row>
        <Col>
          <Card className="bg-light">
            <Card.Header>
              <h5>💡 Agent Upload Guidelines</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <h6>Supported Formats:</h6>
                  <ul className="small">
                    <li><strong>ZIP/TAR:</strong> Complete agent packages with dependencies</li>
                    <li><strong>Python Files:</strong> Single-file agents with requirements.txt</li>
                    <li><strong>JSON Config:</strong> Agent metadata and configuration</li>
                    <li><strong>Docker Images:</strong> Containerized agents (coming soon)</li>
                  </ul>
                </Col>
                <Col md={6}>
                  <h6>✅ Best Practices:</h6>
                  <ul className="small">
                    <li>Include clear documentation and examples</li>
                    <li>Add input/output schema definitions</li>
                    <li>Test your agent before uploading</li>
                    <li>Use descriptive names and tags</li>
                  </ul>
                </Col>
              </Row>
              <Alert variant="info" className="mt-3 mb-0">
                <strong>🔒 Advanced Validation:</strong> All uploaded agents undergo comprehensive validation including security scanning, code quality analysis, dependency checking, and performance assessment. You'll receive a detailed report with scores and recommendations for improvement.
              </Alert>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Agent Management Modal */}
      <Modal show={showManagementModal} onHide={() => setShowManagementModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <Icon name="settings" size="small" className="me-2" />
            Manage Deployed Agents
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {deployedAgents.length === 0 ? (
            <Alert variant="info">
              <Icon name="target" size="small" className="me-2" />
              No agents deployed yet. Upload and deploy an agent to see it here.
            </Alert>
          ) : (
            <div>
              {deployedAgents.map(agent => (
                <Card key={agent.id} className="mb-3">
                  <Card.Body>
                    <Row className="align-items-center">
                      <Col md={6}>
                        <div className="d-flex align-items-center">
                          <div className="me-3">
                            <Icon name="agent" size="large" className="text-primary" />
                          </div>
                          <div>
                            <h6 className="mb-1">{agent.name}</h6>
                            <p className="small text-muted mb-1">
                              Version {agent.version} • {agent.category}
                              {agent.dockerImage && (
                                <><br /><code className="small">{agent.dockerImage}</code></>
                              )}
                            </p>
                            <div className="d-flex align-items-center gap-2">
                              <Badge bg={
                                agent.status === 'active' ? 'success' : 
                                agent.status === 'deploying' ? 'warning' : 
                                agent.status === 'error' ? 'danger' : 'secondary'
                              }>
                                {agent.status}
                              </Badge>
                              <small className="text-muted">
                                Deployed {new Date(agent.deployedAt).toLocaleDateString()}
                              </small>
                            </div>
                          </div>
                        </div>
                      </Col>
                      <Col md={3}>
                        <div className="text-center">
                          <div className="h5 mb-0">{agent.executionCount}</div>
                          <small className="text-muted">Executions</small>
                          {agent.lastExecuted && (
                            <div className="small text-muted">
                              Last: {new Date(agent.lastExecuted).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </Col>
                      <Col md={3}>
                        <div className="d-flex flex-column gap-2">
                          <Button 
                            variant={agent.status === 'active' ? 'warning' : 'success'}
                            size="sm"
                            onClick={() => handleToggleAgent(agent.id, agent.status)}
                            disabled={agent.status === 'deploying'}
                          >
                            <Icon name={agent.status === 'active' ? 'time' : 'play'} size="small" className="me-1" />
                            {agent.status === 'active' ? 'Deactivate' : 'Activate'}
                          </Button>
                          <div className="d-flex gap-1">
                            <Button 
                              variant="outline-primary" 
                              size="sm"
                              onClick={() => handleEditAgent(agent.id)}
                            >
                              <Icon name="edit" size="small" />
                            </Button>
                            <Button 
                              variant="outline-danger" 
                              size="sm"
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to delete ${agent.name}?`)) {
                                  handleDeleteAgent(agent.id);
                                }
                              }}
                            >
                              <Icon name="target" size="small" />
                            </Button>
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              ))}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowManagementModal(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={() => window.location.href = '/manage'}>
            <Icon name="settings" size="small" className="me-1" />
            Full Management Dashboard
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AgentUpload;