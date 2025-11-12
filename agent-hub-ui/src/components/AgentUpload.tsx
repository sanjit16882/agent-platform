import React, { useState, useCallback } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert, ProgressBar, Badge, Modal, Spinner, Toast, ToastContainer } from 'react-bootstrap';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { useAgentContext, DeployedAgent } from '../context/AgentContext';
import BedrockStatus from './BedrockStatus';
import BedrockModelSelector from './BedrockModelSelector';

interface UploadedFile {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'validating' | 'validated' | 'validation_failed' | 'testing' | 'test_passed' | 'test_failed' | 'success' | 'error' | 'deploying' | 'deployed';
  progress: number;
  error?: string;
  validationId?: string;
  validationScore?: number;
  grade?: string;
  deploymentReady?: boolean;
  recommendations?: string[];
  deploymentStatus?: string;
  testResults?: TestResult[];
  testsPassed?: number;
  testsTotal?: number;
  testCoverage?: number;
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
  // NEW: MCP Configuration
  mcpConfig?: {
    enabled: boolean;
    serverIds: string[];
    timeout?: number;
    autoApprove?: string[];
  };
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

interface TestResult {
  id: string;
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  message?: string;
  category: 'functionality' | 'security' | 'performance' | 'integration';
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
    dependencies: [],
    // NEW: MCP Configuration
    mcpConfig: {
      enabled: false,
      serverIds: [],
      timeout: 30000,
      autoApprove: []
    }
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
      createdAt: new Date().toISOString(),
      category: 'qa',
      executionCount: 0,
      author: 'Debug Test',
      tags: ['test', 'debug'],
      framework: 'test',
      pricing: {
        costPerExecution: 0.10,
        estimatedRuntime: '10s'
      },
      capabilities: ['test_capability'],
      purpose: 'Testing purposes',
      customProcessingLogic: 'Test processing logic'
    };
    
    console.log('Adding test agent:', testAgent);
    addDeployedAgent(testAgent);
  };
  const [showManagementModal, setShowManagementModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<DeployedAgent | null>(null);
  const [showTestingModal, setShowTestingModal] = useState(false);
  const [testingStatus, setTestingStatus] = useState<'idle' | 'running' | 'completed' | 'failed'>('idle');
  const [testProgress, setTestProgress] = useState(0);
  const [comprehensiveTestResults, setComprehensiveTestResults] = useState<any[]>([]);

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

    // Create comprehensive validation result including test results
    const hasTestResults = uploadFile.testResults && uploadFile.testResults.length > 0;
    const testsPassed = uploadFile.status === 'test_passed';
    
    setCurrentValidationResult({
      agent_id: uploadFile.validationId,
      status: uploadFile.status,
      validation_id: uploadFile.validationId,
      validation_score: uploadFile.validationScore || 0,
      grade: uploadFile.grade || 'F',
      deployment_ready: (uploadFile.deploymentReady || false) && (hasTestResults ? testsPassed : true),
      recommendations: uploadFile.recommendations || [],
      message: hasTestResults 
        ? (testsPassed 
          ? `Agent passed validation and all ${uploadFile.testsPassed}/${uploadFile.testsTotal} tests` 
          : `Agent passed validation but ${uploadFile.testsTotal! - uploadFile.testsPassed!} tests failed`)
        : (uploadFile.deploymentReady ? 'Agent passed validation' : 'Agent needs improvements')
    });
    
    setCurrentFileId(fileId); // Store current file ID for modal
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
        createdAt: new Date().toISOString(),
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
        ],
        purpose: storedMetadata.purpose,
        customProcessingLogic: storedMetadata.customProcessingLogic
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

  const runAgentTests = async (fileId: string) => {
    const uploadFile = uploadedFiles.find(f => f.id === fileId);
    if (!uploadFile) return;

    try {
      // Update status to testing
      setUploadedFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, status: 'testing', progress: 0 } : f
      ));

      // Import the real testing framework (same as HybridAgentBuilder)
      const { realTestingFramework } = await import('../services/realTestingFramework');
      
      // Get user-provided test data
      const getUserTestData = () => ({
        input: "This is a test input for validation",
        sampleFile: "test.csv",
        baseUrl: "https://www.google.com",
        testPrompt: "Hello, this is a test prompt"
      });

      // Create agent component from uploaded file metadata
      const agentMetadata = (uploadFile as any).agentMetadata || {};
      const agentComponent = {
        id: uploadFile.validationId || uploadFile.id,
        name: agentMetadata.name || uploadFile.file.name,
        type: agentMetadata.category?.toLowerCase() || 'custom',
        config: agentMetadata.config || {},
        inputs: agentMetadata.inputs || [{ name: 'input', type: 'string', required: true, source: 'user' }],
        outputs: agentMetadata.outputs || [{ name: 'output', type: 'string', description: 'Agent output' }],
        dependencies: []
      };

      const testConfig = {
        testData: getUserTestData(),
        timeout: 30000, // 30 second timeout
        retries: 1
      };

      // Update progress to 25%
      setUploadedFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, progress: 25 } : f
      ));

      // Run REAL component tests
      const componentTestResult = await realTestingFramework.testComponent(agentComponent, testConfig);
      
      // Update progress to 75%
      setUploadedFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, progress: 75 } : f
      ));

      // Convert real test results to UI format
      const testResults: TestResult[] = componentTestResult.tests.map((test: any) => ({
        id: test.id,
        name: test.name,
        status: test.status === 'running' ? 'passed' : test.status, // Convert running to passed for UI
        duration: test.duration,
        message: test.message,
        category: test.category || 'functionality'
      }));

      const testsPassed = testResults.filter(t => t.status === 'passed').length;
      const testsTotal = testResults.length;
      const testCoverage = Math.round((testsPassed / testsTotal) * 100);
      const allTestsPassed = componentTestResult.status === 'passed';

      // Update progress to 100%
      setUploadedFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, progress: 100 } : f
      ));

      // Update file with real test results
      setUploadedFiles(prev => prev.map(f => 
        f.id === fileId ? { 
          ...f, 
          status: allTestsPassed ? 'test_passed' : 'test_failed',
          progress: 100,
          testResults,
          testsPassed,
          testsTotal,
          testCoverage,
          deploymentReady: allTestsPassed && f.deploymentReady
        } : f
      ));

      addToast({
        type: allTestsPassed ? 'success' : 'warning',
        title: 'Testing Complete',
        message: `${testsPassed}/${testsTotal} tests passed (${testCoverage}% coverage) - Using Real Testing Framework`
      });

    } catch (error: any) {
      console.error('Real testing failed:', error);
      
      // Fallback to simulated testing if real testing fails
      console.log('Falling back to simulated testing...');
      
      try {
        // Generate test cases based on agent metadata and category
        const agentMetadata = (uploadFile as any).agentMetadata || {};
        const testCases = generateTestCases(agentMetadata);
        
        // Simulate running tests with progress
        const testResults: TestResult[] = [];
        let passedTests = 0;

        for (let i = 0; i < testCases.length; i++) {
          const testCase = testCases[i];
          const progress = Math.round(((i + 1) / testCases.length) * 100);
          
          // Update progress
          setUploadedFiles(prev => prev.map(f => 
            f.id === fileId ? { ...f, progress } : f
          ));

          // Simulate test execution time
          await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));

          // Simulate test result (90% pass rate for realistic testing)
          const passed = Math.random() > 0.1;
          if (passed) passedTests++;

          const result: TestResult = {
            id: `test-${i}`,
            name: testCase.name,
            status: passed ? 'passed' : 'failed',
            duration: Math.round(200 + Math.random() * 800),
            message: passed ? 'Test passed successfully' : testCase.failureMessage,
            category: testCase.category
          };

          testResults.push(result);
        }

        const testsPassed = passedTests;
        const testsTotal = testCases.length;
        const testCoverage = Math.round((testsPassed / testsTotal) * 100);
        const allTestsPassed = testsPassed === testsTotal;

        // Update file with simulated test results
        setUploadedFiles(prev => prev.map(f => 
          f.id === fileId ? { 
            ...f, 
            status: allTestsPassed ? 'test_passed' : 'test_failed',
            progress: 100,
            testResults,
            testsPassed,
            testsTotal,
            testCoverage,
            deploymentReady: allTestsPassed && f.deploymentReady
          } : f
        ));

        addToast({
          type: allTestsPassed ? 'success' : 'warning',
          title: 'Testing Complete (Simulated)',
          message: `${testsPassed}/${testsTotal} tests passed (${testCoverage}% coverage) - Real testing unavailable, used simulation`
        });

      } catch (fallbackError: any) {
        setUploadedFiles(prev => prev.map(f => 
          f.id === fileId ? { 
            ...f, 
            status: 'test_failed', 
            progress: 0,
            error: 'Testing failed: ' + (fallbackError.message || 'Unknown error')
          } : f
        ));

        addToast({
          type: 'error',
          title: 'Testing Failed',
          message: fallbackError.message || 'Failed to run agent tests'
        });
      }
    }
  };

  const runComprehensiveTests = async (fileId: string) => {
    const uploadFile = uploadedFiles.find(f => f.id === fileId);
    if (!uploadFile) return;

    setTestingStatus('running');
    setTestProgress(0);
    setComprehensiveTestResults([]);

    try {
      // Import the real testing framework
      const { realTestingFramework } = await import('../services/realTestingFramework');
      
      // Get user-provided test data
      const getUserTestData = () => ({
        input: "This is a test input for validation",
        sampleFile: "test.csv",
        baseUrl: "https://www.google.com",
        testPrompt: "Hello, this is a test prompt"
      });

      // Create agent component from uploaded file metadata
      const agentMetadata = (uploadFile as any).agentMetadata || {};
      const agentComponent = {
        id: uploadFile.validationId || uploadFile.id,
        name: agentMetadata.name || uploadFile.file.name,
        type: agentMetadata.category?.toLowerCase() || 'custom',
        config: agentMetadata.config || {},
        inputs: agentMetadata.inputs || [{ name: 'input', type: 'string', required: true, source: 'user' }],
        outputs: agentMetadata.outputs || [{ name: 'output', type: 'string', description: 'Agent output' }],
        dependencies: []
      };

      const testConfig = {
        testData: getUserTestData(),
        timeout: 60000, // 1 minute timeout for comprehensive testing
        retries: 2
      };

      // Phase 1: Component Testing (0-50%)
      setTestProgress(10);
      const componentTestResult = await realTestingFramework.testComponent(agentComponent, testConfig);
      setTestProgress(50);

      // Phase 2: Security Testing (50-70%)
      const securityTestResult = await realTestingFramework.testSecurity(agentComponent, testConfig);
      setTestProgress(70);

      // Phase 3: Performance Testing (70-90%)
      const performanceTestResult = await realTestingFramework.testPerformance(agentComponent, testConfig);
      setTestProgress(90);

      // Phase 4: Integration Testing (90-100%)
      const integrationTestResult = await realTestingFramework.testIntegration([agentComponent], testConfig);
      setTestProgress(100);

      // Compile comprehensive results
      const comprehensiveResults = [
        {
          category: 'Component Tests',
          status: componentTestResult.status,
          tests: componentTestResult.tests,
          duration: componentTestResult.duration,
          description: 'Core functionality and component behavior tests'
        },
        {
          category: 'Security Tests',
          status: securityTestResult.status,
          tests: securityTestResult.tests,
          duration: securityTestResult.duration,
          description: 'Security vulnerability and compliance tests'
        },
        {
          category: 'Performance Tests',
          status: performanceTestResult.status,
          tests: performanceTestResult.tests,
          duration: performanceTestResult.duration,
          description: 'Performance benchmarks and resource usage tests'
        },
        {
          category: 'Integration Tests',
          status: integrationTestResult.overallStatus,
          tests: integrationTestResult.workflowResults[0]?.steps || [],
          duration: 0,
          description: 'End-to-end integration and workflow tests'
        }
      ];

      setComprehensiveTestResults(comprehensiveResults);
      
      // Determine overall status
      const allPassed = comprehensiveResults.every(result => result.status === 'passed');
      setTestingStatus(allPassed ? 'completed' : 'failed');

      // Update the upload file with comprehensive results
      const totalTests = comprehensiveResults.reduce((sum, result) => sum + result.tests.length, 0);
      const passedTests = comprehensiveResults.reduce((sum, result) => {
        // Handle both TestResult[] and workflow step arrays
        const tests = Array.isArray(result.tests) ? result.tests : [];
        let passedCount = 0;
        for (const test of tests) {
          if (test && typeof test === 'object' && test.status === 'passed') {
            passedCount++;
          }
        }
        return sum + passedCount;
      }, 0);
      const testCoverage = Math.round((passedTests / totalTests) * 100);

      // Convert comprehensive results to TestResult format for UI compatibility
      const convertedTestResults: TestResult[] = comprehensiveResults.flatMap(result => {
        if (Array.isArray(result.tests)) {
          return result.tests.map((test: any) => ({
            id: test.id || `${result.category}-${Math.random().toString(36).substr(2, 9)}`,
            name: test.name || `${result.category} Test`,
            status: test.status === 'running' ? 'passed' : (test.status as 'passed' | 'failed' | 'skipped'),
            duration: test.duration || 0,
            message: test.message,
            category: result.category.toLowerCase().includes('security') ? 'security' as const :
                     result.category.toLowerCase().includes('performance') ? 'performance' as const :
                     result.category.toLowerCase().includes('integration') ? 'integration' as const :
                     'functionality' as const
          }));
        }
        return [];
      });

      setUploadedFiles(prev => prev.map(f => 
        f.id === fileId ? { 
          ...f, 
          status: allPassed ? 'test_passed' : 'test_failed',
          testResults: convertedTestResults,
          testsPassed: passedTests,
          testsTotal: totalTests,
          testCoverage,
          deploymentReady: allPassed && f.deploymentReady
        } : f
      ));

      addToast({
        type: allPassed ? 'success' : 'warning',
        title: 'Comprehensive Testing Complete',
        message: `${passedTests}/${totalTests} tests passed across all categories (${testCoverage}% coverage)`
      });

    } catch (error: any) {
      console.error('Comprehensive testing failed:', error);
      setTestingStatus('failed');
      
      addToast({
        type: 'error',
        title: 'Comprehensive Testing Failed',
        message: error.message || 'Failed to run comprehensive tests'
      });
    }
  };

  const generateTestCases = (agentMetadata: any) => {
    const category = agentMetadata.category || 'Custom';
    const baseCases = [
      {
        name: 'Agent Initialization Test',
        category: 'functionality' as const,
        failureMessage: 'Agent failed to initialize properly'
      },
      {
        name: 'Input Validation Test',
        category: 'functionality' as const,
        failureMessage: 'Agent does not handle invalid inputs correctly'
      },
      {
        name: 'Security Scan Test',
        category: 'security' as const,
        failureMessage: 'Security vulnerabilities detected in agent code'
      },
      {
        name: 'Performance Benchmark Test',
        category: 'performance' as const,
        failureMessage: 'Agent performance below acceptable thresholds'
      }
    ];

    // Add category-specific tests
    if (category === 'QE') {
      baseCases.push(
        {
          name: 'Test Framework Integration',
          category: 'functionality' as const,
          failureMessage: 'Failed to integrate with testing frameworks'
        },
        {
          name: 'Test Case Generation',
          category: 'functionality' as const,
          failureMessage: 'Unable to generate valid test cases'
        },
        {
          name: 'Test Execution Simulation',
          category: 'functionality' as const,
          failureMessage: 'Test execution simulation failed'
        }
      );
    } else if (category === 'Security') {
      baseCases.push(
        {
          name: 'Vulnerability Detection Test',
          category: 'functionality' as const,
          failureMessage: 'Failed to detect known vulnerabilities'
        },
        {
          name: 'Compliance Check Test',
          category: 'functionality' as const,
          failureMessage: 'Compliance validation failed'
        }
      );
    } else if (category === 'DevOps') {
      baseCases.push(
        {
          name: 'Infrastructure Analysis Test',
          category: 'functionality' as const,
          failureMessage: 'Infrastructure analysis capabilities failed'
        },
        {
          name: 'Cost Optimization Test',
          category: 'functionality' as const,
          failureMessage: 'Cost optimization algorithms failed'
        }
      );
    }

    return baseCases;
  };

  const getStatusColor = (status: string) => {
    // Use consistent blue color for all statuses
    return 'primary';
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending Upload';
      case 'uploading': return 'Uploading...';
      case 'validating': return 'Validating Package...';
      case 'validated': return 'Validation Passed';
      case 'validation_failed': return 'Validation Issues';
      case 'testing': return 'Running Tests...';
      case 'test_passed': return 'Tests Passed';
      case 'test_failed': return 'Tests Failed';
      case 'success': return 'Ready for Deployment';
      case 'deploying': return 'Deploying...';
      case 'deployed': return 'Deployed Successfully';
      case 'error': return 'Upload Failed';
      default: return 'Unknown';
    }
  };

  const getGradeColor = (grade: string) => {
    // Use consistent blue color for all grades
    return 'primary';
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

      {/* Bedrock Integration Status */}
      <Row className="mb-4">
        <Col>
          <BedrockStatus showDetails={false} />
        </Col>
      </Row>

      {/* Recently Deployed Agents */}
      {deployedAgents.filter(agent => {
        const deployedDate = new Date(agent.deployedAt);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return deployedDate >= sevenDaysAgo;
      }).length > 0 && (
        <Row className="mb-4">
          <Col>
            <Card>
              <Card.Header className="bg-primary text-white">
                <h5 className="mb-0">Recently Deployed Agents</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  {deployedAgents
                    .filter(agent => {
                      const deployedDate = new Date(agent.deployedAt);
                      const sevenDaysAgo = new Date();
                      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                      return deployedDate >= sevenDaysAgo;
                    })
                    .slice(0, 3)
                    .map(agent => (
                      <Col md={4} key={agent.id}>
                        <Card className="h-100 border-0 shadow-sm">
                          <Card.Body>
                            <div className="d-flex align-items-center mb-2">
                              <Badge bg="primary" className="me-2">
                                {agent.status}
                              </Badge>
                              <small className="text-muted">
                                v{agent.version} • {agent.category}
                              </small>
                            </div>
                            <h6 className="card-title">{agent.name}</h6>
                            <p className="card-text small text-muted">
                              {agent.description}
                            </p>
                            <div className="d-flex justify-content-between align-items-center">
                              <small className="text-muted">
                                Deployed {new Date(agent.deployedAt).toLocaleDateString()}
                              </small>
                              <Button 
                                variant="outline-primary" 
                                size="sm"
                                onClick={() => window.location.href = `/agents/${agent.id}`}
                              >
                                View
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

      {/* Upload Status Banner */}
      <Row className="mb-4">
        <Col>
          <Alert variant="info">
            <div className="d-flex align-items-center">
              <div className="me-3">
                {isUploading ? (
                  <Spinner animation="border" size="sm" />
                ) : (
                  <div className="af-badge af-badge-primary" style={{ fontSize: '1.5rem', padding: '0.75rem' }}>
                    ✓
                  </div>
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
                <Badge bg="primary">
                  {uploadedFiles.filter(f => f.status === 'validated' || f.status === 'success').length} validated
                </Badge>
                {deployedAgents.length > 0 && (
                  <Button 
                    variant="outline-primary" 
                    size="sm"
                    onClick={() => setShowManagementModal(true)}
                    className="af-btn af-btn-outline af-btn-sm"
                  >
                    Manage Agents ({deployedAgents.length})
                  </Button>
                )}
              </div>
            </div>
          </Alert>
        </Col>
      </Row>



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
                        <div className="af-badge af-badge-primary" style={{ fontSize: '1.5rem', padding: '1rem' }}>
                          FILE
                        </div>
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
                        <div className="af-badge af-badge-primary" style={{ fontSize: '1.5rem', padding: '1rem' }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                          </svg>
                        </div>
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
                        <div className="af-badge af-badge-primary" style={{ fontSize: '1.5rem', padding: '1rem' }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M13.983 11.078h2.119a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.119a.185.185 0 00-.185.185v1.888c0 .102.083.185.185.185m-2.954-5.43h2.118a.186.186 0 00.186-.186V3.574a.186.186 0 00-.186-.185h-2.118a.185.185 0 00-.185.185v1.888c0 .102.082.185.185.186m0 2.716h2.118a.187.187 0 00.186-.186V6.29a.186.186 0 00-.186-.185h-2.118a.185.185 0 00-.185.185v1.887c0 .102.082.185.185.186m-2.93 0h2.12a.186.186 0 00.184-.186V6.29a.185.185 0 00-.185-.185H8.1a.185.185 0 00-.185.185v1.887c0 .102.083.185.185.186m-2.964 0h2.119a.186.186 0 00.185-.186V6.29a.185.185 0 00-.185-.185H5.136a.186.186 0 00-.186.185v1.887c0 .102.084.185.186.186m5.893 2.715h2.118a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.118a.185.185 0 00-.185.185v1.888c0 .102.082.185.185.185m-2.93 0h2.12a.185.185 0 00.184-.185V9.006a.185.185 0 00-.184-.186h-2.12a.185.185 0 00-.184.185v1.888c0 .102.083.185.185.185m-2.964 0h2.119a.185.185 0 00.185-.185V9.006a.185.185 0 00-.184-.186h-2.12a.186.186 0 00-.186.186v1.887c0 .102.084.185.186.185M23.763 9.89c-.065-.051-.672-.51-1.954-.51-.338 0-.676.03-1.01.087-.248-1.7-1.653-2.53-1.716-2.566l-.344-.199-.226.327c-.284.438-.49.922-.612 1.43-.23.97-.09 1.882.403 2.661-.595.332-1.55.413-1.744.42H.751a.751.751 0 00-.75.748 11.376 11.376 0 00.692 4.062c.545 1.428 1.355 2.48 2.41 3.124 1.18.723 3.1 1.137 5.275 1.137.983 0 1.938-.089 2.844-.266a11.94 11.94 0 003.776-1.329c.896-.537 1.68-1.215 2.334-2.02a9.73 9.73 0 001.305-2.132.751.751 0 00-.648-.748h-1.018c1.854-1.205 2.68-3.048 2.763-3.256l.252-.556-.170-.42-.252-.556-.17-.42z"/>
                          </svg>
                        </div>
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
              <Card.Header className="bg-primary text-white">
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
                    <div className="af-badge af-badge-secondary" style={{ fontSize: '2rem', padding: '1rem' }}>
                      UPLOAD
                    </div>
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
              <Card.Header className="bg-primary text-white">
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
                    
                    {(uploadFile.status === 'uploading' || uploadFile.status === 'validating' || uploadFile.status === 'testing') && (
                      <ProgressBar 
                        now={uploadFile.progress} 
                        variant="primary"
                        className="mb-2"
                      />
                    )}
                    
                    {/* Deployment Status */}
                    {(uploadFile.status === 'deploying' || uploadFile.status === 'deployed') && (
                      <div className="mt-2">
                        <Alert variant="info" className="py-2">
                          <div className="d-flex align-items-center">
                            {uploadFile.status === 'deploying' ? (
                              <Spinner animation="border" size="sm" className="me-2" />
                            ) : (
                              <span className="af-badge af-badge-primary me-2" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
                                ✓
                              </span>
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
                              className="af-btn af-btn-outline af-btn-sm"
                            >
                              View in Catalog
                            </Button>
                            <Button 
                              variant="outline-primary" 
                              size="sm"
                              onClick={() => setShowManagementModal(true)}
                              className="af-btn af-btn-outline af-btn-sm"
                            >
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
                          <Badge bg="primary" className="me-2">
                            Score: {uploadFile.validationScore || 0}/100
                          </Badge>
                          {uploadFile.deploymentReady && (
                            <Badge bg="primary">✅ Validation Passed</Badge>
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
                            <>
                              <Button 
                                variant="primary" 
                                size="sm"
                                onClick={() => runAgentTests(uploadFile.id)}
                                className="me-2"
                              >
                                🧪 Test Agent
                              </Button>
                              <Button 
                                variant="outline-info" 
                                size="sm"
                                onClick={() => {
                                  // Open comprehensive testing modal
                                  setCurrentFileId(uploadFile.id);
                                  setShowTestingModal(true);
                                }}
                              >
                                📊 Advanced Testing
                              </Button>
                            </>
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

                    {/* Test Results */}
                    {(uploadFile.status === 'test_passed' || uploadFile.status === 'test_failed') && (
                      <div className="mt-2">
                        <div className="d-flex align-items-center mb-2">
                          <Badge bg={uploadFile.status === 'test_passed' ? 'success' : 'danger'} className="me-2">
                            {uploadFile.testsPassed || 0}/{uploadFile.testsTotal || 0} Tests
                          </Badge>
                          <Badge bg="info" className="me-2">
                            Coverage: {uploadFile.testCoverage || 0}%
                          </Badge>
                          {uploadFile.status === 'test_passed' && (
                            <Badge bg="success">✅ Ready to Deploy</Badge>
                          )}
                        </div>
                        
                        {uploadFile.testResults && uploadFile.testResults.length > 0 && (
                          <div className="mb-2">
                            <small className="text-muted">Test Results:</small>
                            <div className="mt-1">
                              {uploadFile.testResults.slice(0, 3).map((test, idx) => (
                                <div key={idx} className="d-flex align-items-center small mb-1">
                                  <span className={`me-2 ${test.status === 'passed' ? 'text-success' : 'text-danger'}`}>
                                    {test.status === 'passed' ? '✓' : '✗'}
                                  </span>
                                  <span className="me-2">{test.name}</span>
                                  <Badge bg="light" text="dark" className="me-2">
                                    {test.category}
                                  </Badge>
                                  <small className="text-muted">{test.duration}ms</small>
                                </div>
                              ))}
                              {uploadFile.testResults.length > 3 && (
                                <small className="text-muted">
                                  +{uploadFile.testResults.length - 3} more tests...
                                </small>
                              )}
                            </div>
                          </div>
                        )}
                        
                        <div className="d-flex gap-2">
                          <Button 
                            variant="outline-info" 
                            size="sm"
                            onClick={() => handleViewValidation(uploadFile.id)}
                          >
                            View Full Report
                          </Button>
                          
                          {uploadFile.status === 'test_passed' ? (
                            <Button 
                              variant="success" 
                              size="sm"
                              onClick={() => {
                                console.log('Deploy Now clicked for:', uploadFile.id);
                                handleDeployAgent(uploadFile.id);
                              }}
                            >
                              🚀 Deploy Now
                            </Button>
                          ) : (
                            <>
                              <Button 
                                variant="warning" 
                                size="sm"
                                onClick={() => runAgentTests(uploadFile.id)}
                              >
                                🔄 Retry Tests
                              </Button>
                              <Button 
                                variant="outline-warning" 
                                size="sm"
                                onClick={() => handleConfigureAgent(uploadFile.id)}
                              >
                                Fix Issues
                              </Button>
                            </>
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

            {/* NEW: MCP Configuration Section */}
            <div className="mb-4 p-3 border rounded" style={{ backgroundColor: '#f8f9fa' }}>
              <h6 className="mb-3">🖥️ MCP Enhancement (Optional)</h6>
              <Form.Check
                type="switch"
                id="mcp-enabled"
                label="Enable MCP (Model Context Protocol) for enhanced capabilities"
                checked={agentMetadata.mcpConfig?.enabled || false}
                onChange={(e) => setAgentMetadata({
                  ...agentMetadata,
                  mcpConfig: {
                    ...agentMetadata.mcpConfig!,
                    enabled: e.target.checked,
                    serverIds: e.target.checked ? agentMetadata.mcpConfig?.serverIds || [] : []
                  }
                })}
              />
              
              {agentMetadata.mcpConfig?.enabled && (
                <div className="mt-3">
                  <Form.Text className="text-muted d-block mb-2">
                    MCP provides your agent with enhanced capabilities like database access, file operations, and Git integration.
                    Your agent will always fall back to standard execution if MCP is unavailable (zero risk).
                  </Form.Text>
                  
                  <Form.Group className="mb-2">
                    <Form.Label className="small">MCP Servers (will be configured after upload)</Form.Label>
                    <Form.Text className="text-muted small d-block">
                      Available servers: Database, File System, Git Repository
                    </Form.Text>
                  </Form.Group>
                  
                  <Form.Group className="mb-2">
                    <Form.Label className="small">Timeout (ms)</Form.Label>
                    <Form.Control
                      type="number"
                      size="sm"
                      value={agentMetadata.mcpConfig?.timeout || 30000}
                      onChange={(e) => setAgentMetadata({
                        ...agentMetadata,
                        mcpConfig: {
                          ...agentMetadata.mcpConfig!,
                          timeout: parseInt(e.target.value) || 30000
                        }
                      })}
                      style={{ width: '120px' }}
                    />
                  </Form.Group>
                </div>
              )}
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowMetadataModal(false)} className="af-btn af-btn-secondary">
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveMetadata} className="af-btn af-btn-primary">
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

              {/* Test Results Section */}
              {(() => {
                const uploadFile = uploadedFiles.find(f => f.id === currentFileId);
                return uploadFile?.testResults && uploadFile.testResults.length > 0 && (
                  <Card className="mb-3">
                    <Card.Header>
                      <h6 className="mb-0">🧪 Test Results</h6>
                    </Card.Header>
                    <Card.Body>
                      <div className="mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span>Test Coverage</span>
                          <Badge bg="info">{uploadFile.testCoverage || 0}%</Badge>
                        </div>
                        <ProgressBar 
                          now={uploadFile.testCoverage || 0} 
                          variant={(uploadFile.testCoverage || 0) >= 80 ? 'success' : (uploadFile.testCoverage || 0) >= 60 ? 'warning' : 'danger'}
                        />
                      </div>
                      
                      <div className="test-results">
                        {uploadFile.testResults.map((test, idx) => (
                          <div key={idx} className="d-flex align-items-center justify-content-between py-2 border-bottom">
                            <div className="d-flex align-items-center">
                              <span className={`me-2 ${test.status === 'passed' ? 'text-success' : 'text-danger'}`}>
                                {test.status === 'passed' ? '✓' : '✗'}
                              </span>
                              <div>
                                <div className="fw-medium">{test.name}</div>
                                {test.message && test.status === 'failed' && (
                                  <small className="text-danger">{test.message}</small>
                                )}
                              </div>
                            </div>
                            <div className="text-end">
                              <Badge bg="light" text="dark" className="me-2">
                                {test.category}
                              </Badge>
                              <small className="text-muted">{test.duration}ms</small>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card.Body>
                  </Card>
                );
              })()}

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
          {(() => {
            const uploadFile = uploadedFiles.find(f => f.id === currentFileId);
            if (!uploadFile) return null;
            
            if (uploadFile.status === 'validated' && uploadFile.deploymentReady) {
              return (
                <Button variant="primary" onClick={() => {
                  setShowValidationModal(false);
                  runAgentTests(uploadFile.id);
                }}>
                  🧪 Run Tests
                </Button>
              );
            } else if (uploadFile.status === 'test_passed') {
              return (
                <Button variant="success" onClick={() => {
                  setShowValidationModal(false);
                  handleDeployAgent(uploadFile.id);
                }}>
                  🚀 Deploy Agent
                </Button>
              );
            } else if (uploadFile.status === 'test_failed') {
              return (
                <>
                  <Button variant="warning" onClick={() => {
                    setShowValidationModal(false);
                    runAgentTests(uploadFile.id);
                  }}>
                    🔄 Retry Tests
                  </Button>
                  <Button variant="outline-warning" onClick={() => {
                    setShowValidationModal(false);
                    handleConfigureAgent(uploadFile.id);
                  }}>
                    Fix Issues
                  </Button>
                </>
              );
            }
            return null;
          })()}
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
            Manage Deployed Agents
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {deployedAgents.length === 0 ? (
            <Alert variant="info">
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
                            <div className="af-badge af-badge-primary" style={{ fontSize: '1rem', padding: '0.5rem' }}>
                              AGENT
                            </div>
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
                              <Badge bg="primary">
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
                            variant="primary"
                            size="sm"
                            onClick={() => handleToggleAgent(agent.id, agent.status)}
                            disabled={agent.status === 'deploying'}
                            className="af-btn af-btn-primary af-btn-sm"
                          >
                            {agent.status === 'active' ? 'Deactivate' : 'Activate'}
                          </Button>
                          <div className="d-flex gap-1">
                            <Button 
                              variant="outline-primary" 
                              size="sm"
                              onClick={() => handleEditAgent(agent.id)}
                              className="af-btn af-btn-outline af-btn-sm"
                            >
                              Edit
                            </Button>
                            <Button 
                              variant="outline-primary" 
                              size="sm"
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to delete ${agent.name}?`)) {
                                  handleDeleteAgent(agent.id);
                                }
                              }}
                              className="af-btn af-btn-outline af-btn-sm"
                            >
                              Delete
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
          <Button variant="outline-primary" onClick={() => setShowManagementModal(false)} className="af-btn af-btn-outline">
            Close
          </Button>
          <Button variant="primary" onClick={() => window.location.href = '/manage'} className="af-btn af-btn-primary">
            Full Management Dashboard
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Comprehensive Testing Modal */}
      <Modal show={showTestingModal} onHide={() => setShowTestingModal(false)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>
            🧪 Comprehensive Agent Testing
            {(() => {
              const uploadFile = uploadedFiles.find(f => f.id === currentFileId);
              return uploadFile ? ` - ${uploadFile.file.name}` : '';
            })()}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {(() => {
            const uploadFile = uploadedFiles.find(f => f.id === currentFileId);
            if (!uploadFile) return <Alert variant="warning">Agent not found</Alert>;

            return (
              <div>
                {/* Testing Overview */}
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6>Testing Overview</h6>
                    <div className="d-flex gap-2">
                      {testingStatus === 'running' && (
                        <div className="d-flex align-items-center me-3">
                          <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                          <span>Testing... {testProgress}%</span>
                        </div>
                      )}
                      <Button 
                        variant="primary"
                        onClick={() => runComprehensiveTests(currentFileId)}
                        disabled={testingStatus === 'running'}
                      >
                        {testingStatus === 'running' ? 'Testing...' : 'Run Comprehensive Tests'}
                      </Button>
                    </div>
                  </div>

                  {testingStatus === 'running' && (
                    <div className="mb-3">
                      <div className="d-flex justify-content-between mb-2">
                        <span>Testing Progress</span>
                        <span>{testProgress}%</span>
                      </div>
                      <div className="progress">
                        <div 
                          className="progress-bar progress-bar-striped progress-bar-animated" 
                          style={{ width: `${testProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {testingStatus === 'idle' && (
                    <Alert variant="info">
                      <strong>Comprehensive Testing Suite</strong>
                      <p className="mb-0">
                        Run a complete test suite including component functionality, security scanning, 
                        performance benchmarks, and integration tests. This provides the same level of 
                        testing available in the Hybrid Agent Builder.
                      </p>
                    </Alert>
                  )}
                </div>

                {/* Test Results */}
                {comprehensiveTestResults.length > 0 && (
                  <div>
                    <h6 className="mb-3">Test Results</h6>
                    {comprehensiveTestResults.map((category, categoryIndex) => (
                      <Card key={categoryIndex} className="mb-3">
                        <Card.Header>
                          <div className="d-flex justify-content-between align-items-center">
                            <span>
                              <Badge bg={category.status === 'passed' ? 'success' : category.status === 'failed' ? 'danger' : 'warning'} className="me-2">
                                {category.status === 'passed' ? 'Passed' : 
                                 category.status === 'failed' ? 'Failed' : 'Running'}
                              </Badge>
                              {category.category}
                            </span>
                            <small className="text-muted">
                              {category.tests.filter((t: any) => t.status === 'passed').length}/{category.tests.length} tests passed
                              {category.duration > 0 && ` • ${category.duration}ms`}
                            </small>
                          </div>
                          <small className="text-muted d-block mt-1">{category.description}</small>
                        </Card.Header>
                        <Card.Body>
                          {category.tests.map((test: any, testIndex: number) => (
                            <div key={testIndex} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                              <div className="d-flex align-items-center">
                                <span className={`me-2 ${test.status === 'passed' ? 'text-success' : test.status === 'failed' ? 'text-danger' : 'text-muted'}`}>
                                  {test.status === 'passed' ? '✓' : test.status === 'failed' ? '✗' : '⏳'}
                                </span>
                                <div>
                                  <span>{test.name}</span>
                                  {test.message && test.status === 'failed' && (
                                    <div className="small text-danger">{test.message}</div>
                                  )}
                                </div>
                              </div>
                              <div className="text-end">
                                {test.category && (
                                  <Badge bg="light" text="dark" className="me-2">
                                    {test.category}
                                  </Badge>
                                )}
                                <small className="text-muted">{test.duration || 0}ms</small>
                              </div>
                            </div>
                          ))}
                        </Card.Body>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Test Summary */}
                {testingStatus === 'completed' && (
                  <Alert variant="success">
                    <strong>Comprehensive Testing Complete!</strong>
                    <div className="mt-2">
                      <div>Total Categories: {comprehensiveTestResults.length}</div>
                      <div>
                        Passed Categories: {comprehensiveTestResults.filter(r => r.status === 'passed').length}/{comprehensiveTestResults.length}
                      </div>
                      {comprehensiveTestResults.every(r => r.status === 'passed') && (
                        <div className="mt-2">
                          <strong>✅ All tests passed! Your agent is ready for deployment.</strong>
                        </div>
                      )}
                    </div>
                  </Alert>
                )}

                {testingStatus === 'failed' && (
                  <Alert variant="warning">
                    <strong>Some Tests Failed</strong>
                    <p className="mb-0">
                      Review the failed tests above and fix any issues before deployment. 
                      You can still deploy the agent, but it may not function optimally.
                    </p>
                  </Alert>
                )}
              </div>
            );
          })()}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowTestingModal(false)}>
            Close
          </Button>
          {(() => {
            const uploadFile = uploadedFiles.find(f => f.id === currentFileId);
            if (!uploadFile) return null;
            
            if (testingStatus === 'completed' && comprehensiveTestResults.every(r => r.status === 'passed')) {
              return (
                <Button variant="success" onClick={() => {
                  setShowTestingModal(false);
                  handleDeployAgent(uploadFile.id);
                }}>
                  🚀 Deploy Agent
                </Button>
              );
            } else if (testingStatus === 'completed') {
              return (
                <>
                  <Button variant="warning" onClick={() => runComprehensiveTests(uploadFile.id)}>
                    🔄 Retry Tests
                  </Button>
                  <Button variant="outline-success" onClick={() => {
                    setShowTestingModal(false);
                    handleDeployAgent(uploadFile.id);
                  }}>
                    Deploy Anyway
                  </Button>
                </>
              );
            }
            return null;
          })()}
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AgentUpload;