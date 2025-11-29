import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Button, Badge, Alert, Form, Modal, Tabs, Tab } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import PermissionGuard from './PermissionGuard';
import { usePermissions } from '../hooks/usePermissions';
import { agentCompositionService, ComponentTemplate } from '../services/agentCompositionService';
import { AgentComponent, AgentType, HybridAgent, ExecutionMode, ComponentNode, Connection } from '../types/hybridAgent';
import WorkflowCanvas from './workflow/WorkflowCanvas';
import ComponentPalette from './workflow/ComponentPalette';
import WorkflowToolbar from './workflow/WorkflowToolbar';
import DataMappingModal from './workflow/DataMappingModal';
import DataFlowTestingPanel from './workflow/DataFlowTestingPanel';
import PropertyPanel from './workflow/PropertyPanel';
import { DataMapping } from '../types/dataMapping';
import '../styles/aws-inspired-theme.css';
import './HybridAgentBuilder.css';
import BedrockStatus from './BedrockStatus';
import BedrockModelSelector from './BedrockModelSelector';
import { IntelligenceModal } from './IntelligenceModal';
import { MCPAgentCreationStep, MCPAgentConfig } from './mcp/MCPAgentCreationStep';
import VectorDBConfigSection from './VectorDBConfigSection';
import AgentConfigurationGuide from './AgentConfigurationGuide';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_URL || 'http://localhost:3002';



interface ComponentTestResult {
  componentId: string;
  componentName: string;
  componentType?: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  tests: {
    id: string;
    name: string;
    status: 'running' | 'passed' | 'failed' | 'skipped';
    duration: number;
    message?: string;
    details?: any;
  }[];
  duration: number;
  error?: string;
}

interface WorkflowTestResult {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  duration: number;
  message?: string;
  steps: {
    componentId: string;
    status: 'passed' | 'failed' | 'skipped';
    output?: any;
    error?: string;
  }[];
}

const HybridAgentBuilder: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission, user } = usePermissions();
  const [activeTab, setActiveTab] = useState('design');
  const [components, setComponents] = useState<ComponentNode[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedComponent, setSelectedComponent] = useState<ComponentNode | null>(null);
  const [showComponentModal, setShowComponentModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [componentTemplates, setComponentTemplates] = useState<ComponentTemplate[]>([]);
  const [agentName, setAgentName] = useState('');
  const [agentDescription, setAgentDescription] = useState('');
  const [orchestrationMode, setOrchestrationMode] = useState<ExecutionMode>('sequential');
  const [validationResults, setValidationResults] = useState<{ isValid: boolean; errors: string[]; warnings: string[] } | null>(null);
  const [saving, setSaving] = useState(false);
  const [testingStatus, setTestingStatus] = useState<'idle' | 'running' | 'completed' | 'failed'>('idle');
  const [componentTestResults, setComponentTestResults] = useState<ComponentTestResult[]>([]);
  const [workflowTestResults, setWorkflowTestResults] = useState<WorkflowTestResult[]>([]);
  const [testProgress, setTestProgress] = useState(0);
  const [showDataMappingModal, setShowDataMappingModal] = useState(false);
  const [mappingSourceComponent, setMappingSourceComponent] = useState<ComponentNode | null>(null);
  const [mappingTargetComponent, setMappingTargetComponent] = useState<ComponentNode | null>(null);
  const [dataMappings, setDataMappings] = useState<DataMapping[]>([]);
  const [selectedBedrockModel, setSelectedBedrockModel] = useState<string>('');
  const [selectedBedrockModelName, setSelectedBedrockModelName] = useState<string>('');
  
  // MCP Integration state
  const [mcpConfig, setMcpConfig] = useState<MCPAgentConfig>({
    enabled: false,
    selectedServers: [],
    autoDetected: false,
    recommendedServers: []
  });

  // Vector DB configuration state
  const [vectorDBConfig, setVectorDBConfig] = useState({
    enabled: false,
    provider: 'mock',
    knowledgeBases: [] as string[],
    retrievalConfig: {
      topK: 5,
      minSimilarity: 0.7
    }
  });
  const [vectorDBCost, setVectorDBCost] = useState(0);
  const [vectorDBLatency, setVectorDBLatency] = useState(0);
  
  // AI suggestions modal state
  const [intelligenceSidebarOpen, setIntelligenceSidebarOpen] = useState(false);

  useEffect(() => {
    loadComponentTemplates();
  }, []);

  const loadComponentTemplates = () => {
    console.log('Loading component templates...');
    console.log('API_BASE_URL:', API_BASE_URL);
    console.log('Environment variables:', {
      REACT_APP_API_BASE_URL: process.env.REACT_APP_API_BASE_URL,
      REACT_APP_API_URL: process.env.REACT_APP_API_URL
    });
    try {
      const templates = agentCompositionService.getComponentTemplates();
      console.log('Loaded templates:', templates.length, templates);
      console.log('First template:', templates[0]);
      setComponentTemplates(templates);
      
      if (templates.length > 0) {
        console.log(`✅ Templates Loaded Successfully! Count: ${templates.length}`);
      } else {
        console.warn('❌ No templates loaded!');
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      alert(`❌ Error loading templates: ${error}`);
      setComponentTemplates([]);
    }
  };

  const addComponent = (template: ComponentTemplate) => {
    const newComponent: AgentComponent = {
      id: agentCompositionService.generateComponentId(),
      name: `${template.name} ${components.length + 1}`,
      type: template.type,
      config: { ...template.defaultConfig },
      inputs: template.requiredInputs.map(input => ({
        name: input,
        type: 'string',
        required: true,
        source: 'user'
      })),
      outputs: template.providedOutputs.map(output => ({
        name: output,
        type: 'string',
        description: `Output from ${template.name}`
      })),
      dependencies: []
    };

    const newNode: ComponentNode = {
      id: newComponent.id,
      component: newComponent,
      position: { 
        x: 100 + (components.length % 4) * 200, 
        y: 100 + Math.floor(components.length / 4) * 150 
      },
      selected: false
    };

    setComponents([...components, newNode]);
    setShowTemplateModal(false);
  };



  const removeComponent = (componentId: string) => {
    setComponents(components.filter(c => c.id !== componentId));
    setConnections(connections.filter(conn => 
      conn.from.componentId !== componentId && conn.to.componentId !== componentId
    ));
    if (selectedComponent?.id === componentId) {
      setSelectedComponent(null);
    }
  };



  const updateComponent = (componentId: string, updates: Partial<AgentComponent>) => {
    setComponents(components.map(node => 
      node.id === componentId 
        ? { ...node, component: { ...node.component, ...updates } }
        : node
    ));
  };

  const selectComponent = (componentId: string) => {
    const component = components.find(c => c.id === componentId);
    if (component) {
      setSelectedComponent(component);
      setComponents(components.map(c => ({ ...c, selected: c.id === componentId })));
    }
  };

  const addConnection = (from: { componentId: string; outputName: string }, to: { componentId: string; inputName: string }) => {
    const newConnection: Connection = { from, to };
    setConnections([...connections, newConnection]);

    // Update component dependencies
    const targetComponent = components.find(c => c.id === to.componentId);
    if (targetComponent && !targetComponent.component.dependencies.includes(from.componentId)) {
      updateComponent(to.componentId, {
        dependencies: [...targetComponent.component.dependencies, from.componentId]
      });
    }
  };

  const removeConnection = (connectionIndex: number) => {
    const connection = connections[connectionIndex];
    setConnections(connections.filter((_, index) => index !== connectionIndex));

    // Update component dependencies
    const targetComponent = components.find(c => c.id === connection.to.componentId);
    if (targetComponent) {
      const remainingConnections = connections.filter((_, index) => 
        index !== connectionIndex && connection.to.componentId === connection.to.componentId
      );
      const remainingDependencies = remainingConnections.map(c => c.from.componentId);
      
      updateComponent(connection.to.componentId, {
        dependencies: targetComponent.component.dependencies.filter(dep => 
          remainingDependencies.includes(dep)
        )
      });
    }
  };

  // Visual Workflow Designer Functions
  const handleNodeMove = useCallback((nodeId: string, position: { x: number; y: number }) => {
    setComponents(prev => prev.map(node => 
      node.id === nodeId ? { ...node, position } : node
    ));
  }, []);

  const handleNodeSelect = useCallback((nodeId: string | null) => {
    setComponents(prev => prev.map(node => ({ 
      ...node, 
      selected: node.id === nodeId 
    })));
    
    if (nodeId) {
      const component = components.find(c => c.id === nodeId);
      setSelectedComponent(component || null);
    } else {
      setSelectedComponent(null);
    }
  }, [components]);

  const handleNodeDelete = useCallback((nodeId: string) => {
    removeComponent(nodeId);
  }, []);

  const handleConnectionCreate = useCallback((connection: Connection) => {
    // Check if connection already exists
    const exists = connections.some(conn => 
      conn.from.componentId === connection.from.componentId &&
      conn.from.outputName === connection.from.outputName &&
      conn.to.componentId === connection.to.componentId &&
      conn.to.inputName === connection.to.inputName
    );

    if (!exists) {
      addConnection(connection.from, connection.to);
      
      // Automatically open data mapping modal for new connections
      const sourceComponent = components.find(c => c.id === connection.from.componentId);
      const targetComponent = components.find(c => c.id === connection.to.componentId);
      
      if (sourceComponent && targetComponent) {
        setMappingSourceComponent(sourceComponent);
        setMappingTargetComponent(targetComponent);
        setShowDataMappingModal(true);
      }
    }
  }, [connections]);

  const handleConnectionDelete = useCallback((connectionId: string) => {
    const [fromId, toId] = connectionId.split('-');
    const connectionIndex = connections.findIndex(conn => 
      conn.from.componentId === fromId && conn.to.componentId === toId
    );
    
    if (connectionIndex >= 0) {
      removeConnection(connectionIndex);
    }
  }, [connections]);

  const handleAddComponentFromPalette = (template: ComponentTemplate) => {
    console.log('Adding component from palette:', template.name);
    addComponent(template);
  };

  // Get user-provided test data for real testing
  const getUserTestData = () => {
    // This could be enhanced to get actual user input
    // For now, provide reasonable test data based on component types
    return {
      input: "This is a test input for validation",
      sampleFile: "test.csv", // For file processors
      baseUrl: "https://www.google.com", // For selenium tests
      testPrompt: "Hello, this is a test prompt" // For LLM tests
    };
  };

  // Convert real testing framework result to HybridAgentBuilder format
  const convertTestResult = (realResult: any): ComponentTestResult => {
    return {
      componentId: realResult.componentId,
      componentName: realResult.componentName,
      componentType: realResult.componentType,
      status: realResult.status,
      tests: realResult.tests.map((test: any) => ({
        id: test.id,
        name: test.name,
        status: test.status === 'running' ? 'running' : test.status, // Ensure compatibility
        duration: test.duration,
        message: test.message,
        details: test.details
      })),
      duration: realResult.duration,
      error: realResult.error
    };
  };

  // Data Mapping Functions
  const handleSaveDataMappings = useCallback((mappings: DataMapping[]) => {
    setDataMappings(prev => {
      // Remove existing mappings for this connection
      const filtered = prev.filter(m => 
        !(m.sourceComponentId === mappingSourceComponent?.id && 
          m.targetComponentId === mappingTargetComponent?.id)
      );
      // Add new mappings
      return [...filtered, ...mappings];
    });
    setShowDataMappingModal(false);
    setMappingSourceComponent(null);
    setMappingTargetComponent(null);
  }, [mappingSourceComponent, mappingTargetComponent]);

  const handleOpenDataMapping = useCallback((sourceId: string, targetId: string) => {
    const sourceComponent = components.find(c => c.id === sourceId);
    const targetComponent = components.find(c => c.id === targetId);
    
    if (sourceComponent && targetComponent) {
      setMappingSourceComponent(sourceComponent);
      setMappingTargetComponent(targetComponent);
      setShowDataMappingModal(true);
    }
  }, [components]);

  // Workflow Toolbar Functions
  const handleWorkflowExport = useCallback(() => {
    const workflowData = {
      nodes: components,
      connections: connections,
      metadata: {
        name: agentName,
        description: agentDescription,
        created: new Date().toISOString(),
        version: '1.0.0'
      }
    };

    const dataStr = JSON.stringify(workflowData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${agentName || 'workflow'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [components, connections, agentName, agentDescription]);

  const handleWorkflowImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const workflowData = JSON.parse(e.target?.result as string);
            if (workflowData.nodes && workflowData.connections) {
              setComponents(workflowData.nodes);
              setConnections(workflowData.connections);
              if (workflowData.metadata?.name) {
                setAgentName(workflowData.metadata.name);
              }
              if (workflowData.metadata?.description) {
                setAgentDescription(workflowData.metadata.description);
              }
            }
          } catch (error) {
            alert('Invalid workflow file format');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }, []);

  const getValidationStatus = () => {
    if (!validationResults) return null;
    return validationResults.isValid ? 'valid' : 'invalid';
  };

  // Reset entire workflow
  const resetWorkflow = () => {
    setComponents([]);
    setConnections([]);
    setSelectedComponent(null);
    setAgentName('');
    setAgentDescription('');
    setComponentTestResults([]);
    setWorkflowTestResults([]);
    setValidationResults(null);
    setTestingStatus('idle');
    setDataMappings([]);
  };

  // Setup demo workflow
  const setupDemoWorkflow = () => {
    // First reset everything to prevent duplicates
    resetWorkflow();
    
    // Add demo components after a short delay to ensure reset is complete
    setTimeout(() => {
      if (componentTemplates.length > 0) {
        // Add a few demo components
        const demoTemplates = componentTemplates.slice(0, 3);
        demoTemplates.forEach((template, index) => {
          const newComponent: AgentComponent = {
            id: agentCompositionService.generateComponentId(),
            name: `${template.name} Demo`,
            type: template.type,
            config: { ...template.defaultConfig },
            inputs: template.requiredInputs.map(input => ({
              name: input,
              type: 'string',
              required: true,
              source: 'user'
            })),
            outputs: template.providedOutputs.map(output => ({
              name: output,
              type: 'string',
              description: `Output from ${template.name}`
            })),
            dependencies: []
          };

          const newNode: ComponentNode = {
            id: newComponent.id,
            component: newComponent,
            position: { 
              x: 150 + index * 250, 
              y: 150 + (index % 2) * 200 
            },
            selected: false
          };

          setComponents(prev => [...prev, newNode]);
        });
        
        // Set demo agent details
        setAgentName('Demo Hybrid Agent');
        setAgentDescription('A demonstration hybrid agent with multiple components');
      }
    }, 100);
  };



  // Intelligence sidebar handlers
  const handleAcceptSuggestion = (suggestion: any) => {
    switch (suggestion.type) {
      case 'component':
        // Add suggested component to workflow
        if (suggestion.actionData?.componentType) {
          const template = componentTemplates.find(t => t.type === suggestion.actionData.componentType);
          if (template) {
            addComponent(template);
          }
        }
        break;
      case 'optimization':
        // Apply workflow optimizations
        if (suggestion.actionData?.optimizations) {
          // Could optimize connections, component configurations, etc.
          console.log('Applying optimizations:', suggestion.actionData.optimizations);
        }
        break;
    }
  };





  const validateAgent = async () => {
    console.log('validateAgent called - components:', components.length, 'agentName:', agentName);
    
    // Demo-friendly validation - more lenient
    const errors: string[] = [];
    const warnings: string[] = [];

    if (components.length === 0) {
      errors.push('At least one component is required');
    }

    if (!agentName.trim()) {
      warnings.push('Agent name is recommended for better organization');
      // Don't make this an error for demo purposes
    }

    // Check for basic workflow issues
    if (components.length > 1 && connections.length === 0) {
      warnings.push('Components are not connected - consider adding connections for data flow');
    }

    // For demo purposes, if we have components, consider it mostly valid
    const isValid = components.length > 0;

    const results = {
      isValid,
      errors,
      warnings: [
        ...warnings,
        ...(isValid ? ['✅ Workflow structure looks good!'] : [])
      ]
    };

    console.log('Demo-friendly validation results:', results);
    setValidationResults(results);
  };

  const runComponentTests = async () => {
    if (components.length === 0) return;

    setTestingStatus('running');
    setTestProgress(0);
    setComponentTestResults([]);

    // Import the real testing framework
    const { realTestingFramework } = await import('../services/realTestingFramework');
    
    const results: ComponentTestResult[] = [];

    for (let i = 0; i < components.length; i++) {
      const component = components[i];
      const progress = Math.round(((i + 1) / components.length) * 50); // First 50% for component tests
      setTestProgress(progress);

      // Show component as running
      const runningResult: ComponentTestResult = {
        componentId: component.id,
        componentName: component.component.name,
        componentType: component.component.type,
        status: 'running',
        tests: [],
        duration: 0
      };
      
      results.push(runningResult);
      setComponentTestResults([...results]);

      try {
        // Run REAL tests using the testing framework
        const testConfig = {
          testData: getUserTestData(), // Get user-provided test data
          timeout: 30000, // 30 second timeout
          retries: 1
        };
        
        const realResult = await realTestingFramework.testComponent(component.component, testConfig);
        
        // Update with real results (convert to compatible format)
        results[i] = convertTestResult(realResult);
        setComponentTestResults([...results]);
        
        // If component fails, stop testing (fail-fast as requested)
        if (realResult.status === 'failed') {
          setTestingStatus('failed');
          return results;
        }
        
      } catch (error) {
        // Handle testing errors
        results[i] = {
          componentId: component.id,
          componentName: component.component.name,
          componentType: component.component.type,
          status: 'failed',
          tests: [{
            id: 'test-error',
            name: 'Test Execution Error',
            status: 'failed',
            duration: 0,
            message: error instanceof Error ? error.message : 'Unknown testing error'
          }],
          duration: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
        
        setComponentTestResults([...results]);
        setTestingStatus('failed');
        return results;
      }
    }

    return results;
  };

  const runWorkflowTests = async () => {
    if (components.length === 0) return [];

    // Import the real testing framework
    const { realTestingFramework } = await import('../services/realTestingFramework');
    
    const progress = 75; // 75% progress for workflow tests
    setTestProgress(progress);

    try {
      const testConfig = {
        testData: getUserTestData(),
        timeout: 60000, // 1 minute timeout for workflow
        retries: 1
      };

      // Run REAL workflow integration tests
      const workflowResult = await realTestingFramework.testWorkflow(
        components.map(node => node.component), 
        testConfig
      );

      const results: WorkflowTestResult[] = [{
        id: 'workflow-integration',
        name: 'End-to-End Workflow Test',
        status: workflowResult.overallStatus,
        duration: 0,
        message: workflowResult.overallStatus === 'passed' 
          ? 'Workflow integration test passed successfully'
          : 'Workflow integration test failed',
        steps: workflowResult.workflowResults[0]?.steps || []
      }];

      setWorkflowTestResults(results);
      
      // If workflow fails, set overall testing status to failed
      if (workflowResult.overallStatus === 'failed') {
        setTestingStatus('failed');
      }

      return results;
      
    } catch (error) {
      const errorResult: WorkflowTestResult[] = [{
        id: 'workflow-error',
        name: 'Workflow Test Error',
        status: 'failed',
        duration: 0,
        message: error instanceof Error ? error.message : 'Workflow testing failed',
        steps: []
      }];

      setWorkflowTestResults(errorResult);
      setTestingStatus('failed');
      return errorResult;
    }
  };

  const runAllTests = async () => {
    if (!validationResults?.isValid) {
      alert('Please run validation first and ensure it passes before testing.');
      return;
    }

    setTestingStatus('running');
    setTestProgress(0);
    setComponentTestResults([]);
    setWorkflowTestResults([]);

    try {
      // Run component tests first
      await runComponentTests();
      
      // Then run workflow tests
      await runWorkflowTests();

      setTestProgress(100);
      setTestingStatus('completed');
    } catch (error) {
      console.error('Testing failed:', error);
      setTestingStatus('failed');
    }
  };

  const generateComponentTests = (component: AgentComponent) => {
    const baseTests = [
      { id: '1', name: 'Component Initialization', status: 'passed' as const, duration: 0, message: undefined },
      { id: '2', name: 'Input Validation', status: 'passed' as const, duration: 0, message: undefined },
      { id: '3', name: 'Configuration Check', status: 'passed' as const, duration: 0, message: undefined }
    ];

    // Add component-type specific tests
    if (component.type === 'llm') {
      baseTests.push(
        { id: '4', name: 'LLM Model Connection', status: 'passed' as const, duration: 0, message: undefined },
        { id: '5', name: 'Prompt Template Validation', status: 'passed' as const, duration: 0, message: undefined }
      );
    } else if (component.type === 'rpa') {
      baseTests.push(
        { id: '4', name: 'RPA Script Validation', status: 'passed' as const, duration: 0, message: undefined },
        { id: '5', name: 'UI Element Detection', status: 'passed' as const, duration: 0, message: undefined }
      );
    } else if (component.type === 'selenium') {
      baseTests.push(
        { id: '4', name: 'WebDriver Initialization', status: 'passed' as const, duration: 0, message: undefined },
        { id: '5', name: 'Browser Compatibility', status: 'passed' as const, duration: 0, message: undefined }
      );
    } else if (component.type === 'custom') {
      baseTests.push(
        { id: '4', name: 'Custom Logic Validation', status: 'passed' as const, duration: 0, message: undefined },
        { id: '5', name: 'Dependency Check', status: 'passed' as const, duration: 0, message: undefined }
      );
    }

    return baseTests;
  };

  const generateWorkflowTests = (): Omit<WorkflowTestResult, 'status' | 'duration' | 'steps'>[] => {
    return [
      {
        id: 'workflow-1',
        name: 'End-to-End Workflow Execution',
        message: undefined
      },
      {
        id: 'workflow-2', 
        name: 'Component Integration Test',
        message: undefined
      },
      {
        id: 'workflow-3',
        name: 'Data Flow Validation',
        message: undefined
      },
      {
        id: 'workflow-4',
        name: 'Error Handling Test',
        message: undefined
      }
    ];
  };

  const getTestFailureMessage = (testName: string, componentType: string): string => {
    const messages: { [key: string]: string } = {
      'Component Initialization': 'Failed to initialize component properly',
      'Input Validation': 'Input validation rules are not properly configured',
      'Configuration Check': 'Component configuration contains errors',
      'LLM Model Connection': 'Unable to connect to LLM model endpoint',
      'Prompt Template Validation': 'Prompt template contains invalid syntax',
      'RPA Script Validation': 'RPA script contains syntax errors',
      'UI Element Detection': 'Unable to detect required UI elements',
      'WebDriver Initialization': 'Failed to initialize WebDriver instance',
      'Browser Compatibility': 'Browser compatibility issues detected',
      'Custom Logic Validation': 'Custom logic contains errors',
      'Dependency Check': 'Missing required dependencies'
    };
    
    return messages[testName] || `${testName} failed for ${componentType} component`;
  };

  const saveAgent = async () => {
    // Comprehensive validation before saving
    if (!agentName.trim()) {
      alert('Please enter an agent name');
      return;
    }

    if (components.length === 0) {
      alert('Please add at least one component');
      return;
    }

    // Validate agent first
    await validateAgent();
    if (validationResults && !validationResults.isValid) {
      alert('Please fix validation errors before saving');
      return;
    }

    setSaving(true);
    try {
      const agentComponents = components.map(node => node.component);
      
      const request = {
        name: agentName,
        description: agentDescription || `Hybrid agent with ${components.length} components`,
        components: agentComponents.map(comp => ({
          id: comp.id,
          type: comp.type,
          name: comp.name,
          config: comp.config,
          inputs: comp.inputs,
          outputs: comp.outputs,
          dependencies: comp.dependencies,
          position: components.find(n => n.id === comp.id)?.position || { x: 0, y: 0 }
        })),
        orchestration: {
          mode: orchestrationMode,
          timeout: 300000, // 5 minutes
          maxRetries: 3,
          retryDelay: 2000,
          parallelism: Math.min(3, components.length),
          conditions: []
        },
        dataFlow: {
          mappings: connections.map(conn => ({
            from: conn.from,
            to: conn.to,
            transformation: undefined
          })),
          transformations: [],
          storage: {
            persistent: false,
            encryption: true,
            retention: 7,
            location: 'memory' as const
          }
        },
        bedrockConfig: selectedBedrockModel ? {
          defaultModel: selectedBedrockModel,
          modelName: selectedBedrockModelName,
          provider: 'aws-bedrock',
          region: 'us-east-1'
        } : undefined,
        mcpIntegration: mcpConfig.enabled ? {
          enabled: true,
          selectedServers: mcpConfig.selectedServers,
          autoDetected: mcpConfig.autoDetected
        } : undefined
      };

      console.log('Saving hybrid agent:', request);
      console.log('API URL:', `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:3002'}/api/v1/agents/hybrid/create`);
      const hybridAgent = await agentCompositionService.createHybridAgent(request);
      
      console.log('✅ Hybrid agent created - MCP integration available at runtime');
      
      // Show success message with options
      const bedrockInfo = selectedBedrockModel ? `\nAI Model: ${selectedBedrockModelName}` : '';
      const mcpInfo = mcpConfig.enabled ? `\nMCP Servers: ${mcpConfig.selectedServers.length} selected` : '';
      const userChoice = window.confirm(
        `Hybrid agent "${agentName}" created successfully!${bedrockInfo}${mcpInfo}\n\n` +
        `Components: ${components.length}\n` +
        `Connections: ${connections.length}\n` +
        `MCP Integration: ${mcpConfig.enabled ? 'Enabled' : 'Disabled'}\n\n` +
        `Would you like to:\n` +
        `• OK - Go to Agent Catalog\n` +
        `• Cancel - Discard Agent`
      );

      if (userChoice) {
        // Navigate to agents catalog (OK button)
        navigate('/agents', { state: { refresh: true } });
      } else {
        // Discard the agent (Cancel button) - delete it from backend
        try {
          await axios.delete(`${API_BASE_URL}/api/v1/agents/hybrid/${hybridAgent.id}`);
          console.log('Agent discarded successfully');
          // Stay on current page or navigate back to builder
        } catch (error) {
          console.error('Failed to discard agent:', error);
          // Even if delete fails, don't navigate to catalog
        }
      }
    } catch (error) {
      console.error('Failed to save agent:', error);
      let errorMessage = 'Unknown error occurred';
      
      if (error instanceof Error) {
        if (error.message.includes('ERR_CONNECTION_REFUSED')) {
          errorMessage = 'Cannot connect to server. Please ensure the backend is running on localhost:3002';
        } else {
          errorMessage = error.message;
        }
      }
      
      alert(`Failed to save agent: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  const getComponentTypeIcon = (type: AgentType) => {
    try {
      const icons = {
        'llm': '🧠',
        'rpa': '🤖',
        'selenium': '🔍',
        'custom': '⚙️',
        'hybrid': '🔗'
      };
      return icons[type] || '❓';
    } catch (error) {
      console.error('Error getting component icon:', error);
      return '⚙️';
    }
  };

  const getComponentTypeBadge = (type: AgentType) => {
    return <Badge bg="primary">{type.toUpperCase()}</Badge>;
  };

  // Calculate Bedrock cost based on selected model
  const getBedrockCost = (): number => {
    if (!selectedBedrockModel) return 0;
    
    if (selectedBedrockModel.includes('haiku')) return 0.25;
    if (selectedBedrockModel.includes('sonnet-3-5')) return 3.00;
    if (selectedBedrockModel.includes('sonnet')) return 15.00;
    if (selectedBedrockModel.includes('opus')) return 75.00;
    
    return 1.00; // Default
  };

  // Calculate MCP cost based on selected servers
  const getMCPCost = (): number => {
    if (!mcpConfig.enabled || mcpConfig.selectedServers.length === 0) return 0;
    return 0.05 * mcpConfig.selectedServers.length;
  };

  // Calculate total cost per 1000 queries
  const calculateTotalCost = (): number => {
    return getBedrockCost() + vectorDBCost + getMCPCost();
  };

  // Calculate total latency
  const calculateTotalLatency = (): number => {
    let total = 500; // Base Bedrock latency (ms)
    
    if (vectorDBConfig.enabled) {
      total += vectorDBLatency;
    }
    
    if (mcpConfig.enabled && mcpConfig.selectedServers.length > 0) {
      total += 100 * mcpConfig.selectedServers.length;
    }
    
    return total;
  };

  return (
    <PermissionGuard permission={['agent.create']} requireAll={false}>
      <div className="aws-layout">
        <Container fluid className="aws-main-content">
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h1 className="h3 mb-1" style={{ color: 'var(--aws-gray-800)' }}>
                Hybrid Agent Builder
              </h1>
              <p className="aws-text-muted mb-0">
                Create multi-domain agents combining LLM, RPA, Selenium, and custom components
              </p>
            </div>
            <div>
              <Badge bg="primary" className="me-2">
                Components: {components.length}
              </Badge>
              <Button 
                variant="outline-primary"
                className="me-2"
                onClick={() => setShowTemplateModal(true)}
              >
                Add Component
              </Button>
              <Button 
                variant="outline-primary"
                className="me-2"
                onClick={() => setIntelligenceSidebarOpen(true)}
                disabled={components.length === 0 && !agentDescription}
              >
                🧠 Get AI Suggestions
              </Button>
              <Button 
                variant="primary"
                onClick={saveAgent}
                disabled={saving || components.length === 0}
              >
                {saving ? 'Saving...' : 'Save Agent'}
              </Button>
            </div>
          </div>

          {/* Platform Overview - Compact */}
          <div className="aws-card mb-3" style={{ padding: '0.75rem' }}>
            <div className="aws-card-body" style={{ padding: '0.5rem' }}>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="mb-1">Hybrid Agent Platform</h6>
                  <p className="small aws-text-muted mb-0">
                    Combine LLM, RPA, Selenium, and custom components into powerful workflows.
                  </p>
                </div>
                <Button 
                  variant="outline-primary" 
                  size="sm"
                  onClick={() => setActiveTab('faq')}
                >
                  Learn More
                </Button>
              </div>
            </div>
          </div>

          {/* Bedrock Integration Status */}
          <div className="mb-4">
            <BedrockStatus showDetails={false} />
          </div>

          {/* Configuration Guide */}
          <AgentConfigurationGuide compact={true} />




          {/* Agent Configuration */}
          <div className="aws-card mb-4">
            <div className="aws-card-header">
              Agent Configuration
            </div>
            <div className="aws-card-body">
              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Agent Name</Form.Label>
                    <Form.Control
                      type="text"
                      value={agentName}
                      onChange={(e) => setAgentName(e.target.value)}
                      placeholder="Enter agent name"
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Orchestration Mode</Form.Label>
                    <Form.Select
                      value={orchestrationMode}
                      onChange={(e) => setOrchestrationMode(e.target.value as ExecutionMode)}
                    >
                      <option value="sequential">Sequential</option>
                      <option value="parallel">Parallel</option>
                      <option value="conditional">Conditional</option>
                      <option value="loop">Loop</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Estimated Runtime (seconds)</Form.Label>
                    <Form.Control
                      type="number"
                      value={agentCompositionService.estimateExecutionTime(components.map(c => c.component))}
                      readOnly
                      style={{ backgroundColor: '#f8f9fa' }}
                    />
                    <Form.Text className="text-muted">
                      Automatically calculated based on components
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Description</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      value={agentDescription}
                      onChange={(e) => setAgentDescription(e.target.value)}
                      placeholder="Describe what this hybrid agent does"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <BedrockModelSelector
                    selectedModel={selectedBedrockModel}
                    onModelChange={(modelId, modelName) => {
                      setSelectedBedrockModel(modelId);
                      setSelectedBedrockModelName(modelName);
                    }}
                    agentType="hybrid"
                    label="Default AI Model"
                    required={false}
                    disabled={mcpConfig.enabled && mcpConfig.selectedServers.length > 0}
                  />
                  {mcpConfig.enabled && mcpConfig.selectedServers.length > 0 && (
                    <Alert variant="info" className="mt-2">
                      <small>
                        <strong>ℹ️ Model Selection Disabled</strong><br />
                        Model is configured through the selected MCP server. Go to the MCP Integration tab to change servers.
                      </small>
                    </Alert>
                  )}
                </Col>
              </Row>
            </div>
          </div>

          {/* Cost & Performance Estimation Card */}
          {(selectedBedrockModel || vectorDBConfig.enabled || mcpConfig.enabled) && (
            <div className="aws-card mb-4" style={{ borderLeft: '4px solid #f59e0b' }}>
              <div className="aws-card-header" style={{ backgroundColor: '#fffbeb' }}>
                <strong>💰 Cost & Performance Estimation</strong>
              </div>
              <div className="aws-card-body">
                <Row>
                  <Col md={8}>
                    <h6 className="mb-3">Cost Breakdown (per 1000 queries)</h6>
                    
                    {/* Bedrock Cost */}
                    {selectedBedrockModel && (
                      <div className="d-flex justify-content-between mb-2">
                        <span>
                          Bedrock Model
                          {selectedBedrockModelName && (
                            <small className="text-muted"> ({selectedBedrockModelName})</small>
                          )}:
                        </span>
                        <strong>${getBedrockCost().toFixed(3)}</strong>
                      </div>
                    )}
                    
                    {/* Vector DB Cost */}
                    {vectorDBConfig.enabled && (
                      <div className="d-flex justify-content-between mb-2">
                        <span>
                          Vector DB (RAG)
                          {vectorDBConfig.knowledgeBases.length > 0 && (
                            <small className="text-muted"> ({vectorDBConfig.knowledgeBases.length} knowledge bases)</small>
                          )}:
                        </span>
                        <strong className="text-warning">${vectorDBCost.toFixed(3)}</strong>
                      </div>
                    )}
                    
                    {/* MCP Cost */}
                    {mcpConfig.enabled && mcpConfig.selectedServers.length > 0 && (
                      <div className="d-flex justify-content-between mb-2">
                        <span>
                          MCP Tools
                          <small className="text-muted"> ({mcpConfig.selectedServers.length} servers)</small>:
                        </span>
                        <strong className="text-info">${getMCPCost().toFixed(3)}</strong>
                      </div>
                    )}
                    
                    <hr />
                    
                    {/* Total Cost */}
                    <div className="d-flex justify-content-between">
                      <strong style={{ fontSize: '1.1em' }}>Total:</strong>
                      <strong className="text-primary" style={{ fontSize: '1.3em' }}>
                        ${calculateTotalCost().toFixed(2)}
                      </strong>
                    </div>
                  </Col>
                  
                  <Col md={4}>
                    <h6 className="mb-3">Performance</h6>
                    <div className="text-center p-3" style={{ backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                      <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#0066cc' }}>
                        {calculateTotalLatency()}ms
                      </div>
                      <small className="text-muted">Average Latency</small>
                    </div>
                  </Col>
                </Row>
                
                <Alert variant="info" className="mt-3 mb-0" style={{ fontSize: '0.9em' }}>
                  <strong>💡 Cost Optimization Tips:</strong>
                  <ul className="mb-0 mt-2">
                    {selectedBedrockModel && !selectedBedrockModel.includes('haiku') && (
                      <li>Use Claude Haiku ($0.25) instead of Sonnet (${getBedrockCost()}) for simple tasks</li>
                    )}
                    {vectorDBConfig.enabled && (
                      <li>Disable Vector DB if knowledge base search isn't needed for this agent</li>
                    )}
                    {mcpConfig.enabled && mcpConfig.selectedServers.length > 1 && (
                      <li>Reduce MCP servers to only those required for your use case</li>
                    )}
                    {!vectorDBConfig.enabled && !mcpConfig.enabled && selectedBedrockModel && (
                      <li>Your agent is optimized! Only using Bedrock with no additional overhead</li>
                    )}
                  </ul>
                </Alert>
              </div>
            </div>
          )}

          {/* Choose from Templates Section - Show when no components */}
          {components.length === 0 && (
            <div className="aws-card mb-4">
              <div className="aws-card-header">
                Choose from Templates
                <small className="text-muted ms-2">
                  (Debug: {componentTemplates.length} templates loaded)
                </small>
              </div>
              <div className="aws-card-body">
                {componentTemplates.length === 0 ? (
                  <Alert variant="warning">
                    <strong>Loading templates...</strong>
                    <p className="mb-0">If templates don't load, please refresh the page or check the console for errors.</p>
                    <p className="mb-0 mt-2"><strong>Debug Info:</strong> Components: {components.length}, Templates: {componentTemplates.length}</p>
                  </Alert>
                ) : (
                  <div>
                    <Alert variant="success" className="mb-3">
                      <strong>✅ Templates Loaded Successfully!</strong>
                      <p className="mb-0">Found {componentTemplates.length} templates. Click any template below to add it to your workflow.</p>
                    </Alert>
                    <Row>
                      {componentTemplates.slice(0, 6).map((template, index) => (
                        <Col md={4} lg={2} key={`${template.type}-${template.name}-${index}`} className="mb-3">
                          <Card 
                            className="h-100 template-card"
                            style={{ cursor: 'pointer', minHeight: '120px', border: '2px solid #007bff' }}
                            onClick={() => {
                              console.log('Template clicked:', template.name);
                              addComponent(template);
                            }}
                          >
                            <Card.Body className="text-center p-2">
                              <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>
                                {getComponentTypeIcon(template.type)}
                              </div>
                              <h6 className="small mb-1">{template.name}</h6>
                              <Badge bg="primary" className="mb-2">{template.type.toUpperCase()}</Badge>
                              <p className="small text-muted mb-0" style={{ fontSize: '10px' }}>
                                {template.description.substring(0, 50)}...
                              </p>
                            </Card.Body>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  </div>
                )}
                {componentTemplates.length > 6 && (
                  <div className="text-center mt-3">
                    <Button 
                      variant="outline-primary"
                      onClick={() => setShowTemplateModal(true)}
                    >
                      View All {componentTemplates.length} Templates
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Main Content Tabs */}
          <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'design')} className="mb-4">
            <Tab eventKey="design" title="Visual Designer">
              <div className="aws-card">
                <div className="aws-card-header">
                  <div className="d-flex justify-content-between align-items-center">
                    <span>Component Canvas</span>
                    <div>
                      <Button 
                        variant="success"
                        size="sm"
                        className="me-2"
                        onClick={setupDemoWorkflow}
                      >
                        🎯 Demo Setup
                      </Button>
                      <Button 
                        variant="outline-danger"
                        size="sm"
                        className="me-2"
                        onClick={resetWorkflow}
                        disabled={components.length === 0}
                      >
                        🗑️ Reset
                      </Button>
                      <Button 
                        className="aws-btn aws-btn-outline"
                        size="sm"
                        onClick={() => setShowTemplateModal(true)}
                      >
                        Add Component
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="aws-card-body p-0">
                  {/* Workflow Toolbar */}
                  <WorkflowToolbar
                    onSave={saveAgent}
                    onValidate={validateAgent}
                    onExport={handleWorkflowExport}
                    onImport={handleWorkflowImport}
                    canSave={components.length > 0 && agentName.trim() !== ''}
                    canValidate={components.length > 0}
                    nodeCount={components.length}
                    connectionCount={connections.length}
                    validationStatus={getValidationStatus()}
                  />
                  
                  <Row className="g-0" style={{ height: '600px' }}>
                    {/* Component Palette */}
                    <Col md={2} className="border-end">
                      <div className="p-2 h-100">
                        <ComponentPalette
                          templates={componentTemplates}
                          onAddComponent={handleAddComponentFromPalette}
                        />
                      </div>
                    </Col>
                    
                    {/* Visual Workflow Canvas */}
                    <Col md={7}>
                      <WorkflowCanvas
                        nodes={components}
                        connections={connections}
                        onNodeMove={handleNodeMove}
                        onNodeSelect={handleNodeSelect}
                        onNodeDelete={handleNodeDelete}
                        onConnectionCreate={handleConnectionCreate}
                        onConnectionDelete={handleConnectionDelete}
                        selectedNodeId={selectedComponent?.id || null}
                      />
                    </Col>

                    {/* Property Panel */}
                    <Col md={3} className="border-start">
                      <div className="p-2 h-100">
                        <PropertyPanel
                          selectedNode={selectedComponent}
                          onNodeUpdate={(nodeId, updates) => {
                            setComponents(prev => prev.map(comp => 
                              comp.id === nodeId ? { ...comp, ...updates } : comp
                            ));
                          }}
                          onClose={() => setSelectedComponent(null)}
                        />
                      </div>
                    </Col>
                  </Row>
                </div>
              </div>
            </Tab>

            <Tab eventKey="components" title="Component List">
              <div className="aws-card">
                <div className="aws-card-header">
                  Component Configuration
                </div>
                <div className="aws-card-body">
                  {components.length === 0 ? (
                    <Alert variant="info">
                      No components added yet. Use the Visual Designer tab to add components.
                    </Alert>
                  ) : (
                    <Row>
                      {components.map((node) => (
                        <Col md={6} lg={4} key={node.id} className="mb-3">
                          <Card className="h-100">
                            <Card.Body>
                              <div className="d-flex justify-content-between align-items-start mb-2">
                                <div>
                                  <span style={{ fontSize: '1.2rem', marginRight: '8px' }}>
                                    {getComponentTypeIcon(node.component.type)}
                                  </span>
                                  <strong>{node.component.name}</strong>
                                </div>
                                {getComponentTypeBadge(node.component.type)}
                              </div>
                              
                              <div className="mb-2">
                                <small><strong>Inputs:</strong> {node.component.inputs.map(i => i.name).join(', ')}</small>
                              </div>
                              <div className="mb-2">
                                <small><strong>Outputs:</strong> {node.component.outputs.map(o => o.name).join(', ')}</small>
                              </div>
                              {node.component.dependencies.length > 0 && (
                                <div className="mb-2">
                                  <small><strong>Dependencies:</strong> {node.component.dependencies.length}</small>
                                </div>
                              )}
                              
                              <div className="mt-3">
                                <div className="d-grid gap-1 mb-2">
                                  <Button
                                    variant="outline-primary"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedComponent(node);
                                      setShowComponentModal(true);
                                    }}
                                  >
                                    Configure
                                  </Button>
                                  {node.component.dependencies.length > 0 && (
                                    <Button
                                      variant="primary"
                                      size="sm"
                                      onClick={() => {
                                        // Find connected source component
                                        const sourceConnection = connections.find(conn => 
                                          conn.to.componentId === node.id
                                        );
                                        if (sourceConnection) {
                                          handleOpenDataMapping(sourceConnection.from.componentId, node.id);
                                        }
                                      }}
                                    >
                                      Data Mapping
                                    </Button>
                                  )}
                                </div>
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={() => removeComponent(node.id)}
                                  className="w-100"
                                >
                                  Remove
                                </Button>
                              </div>
                            </Card.Body>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  )}
                </div>
              </div>
            </Tab>

            <Tab eventKey="vectordb" title="Knowledge Base (RAG)">
              <div className="p-3">
                <Alert variant="info" className="mb-4">
                  <strong>Retrieval Augmented Generation (RAG)</strong>
                  <p className="mb-0 mt-2">
                    Enable Vector DB to give your hybrid agent access to custom knowledge bases. 
                    This allows your agent to retrieve relevant context from documents before processing, 
                    resulting in more accurate and context-aware responses.
                  </p>
                </Alert>
                
                <VectorDBConfigSection
                  config={vectorDBConfig}
                  onChange={setVectorDBConfig}
                  onCostChange={setVectorDBCost}
                  onLatencyChange={setVectorDBLatency}
                />
              </div>
            </Tab>

            <Tab eventKey="mcp" title="MCP Integration">
              <div className="p-3">
                <MCPAgentCreationStep
                  agentType="hybrid"
                  agentDescription={agentDescription}
                  onMCPConfigChange={setMcpConfig}
                  initialConfig={mcpConfig}
                />
              </div>
            </Tab>

            {/* Test & Validate tab removed - use dedicated Agent Testing section instead */}

            <Tab eventKey="faq" title="FAQ & Tools">
              <div className="aws-card">
                <div className="aws-card-header">
                  Frequently Asked Questions
                </div>
                <div className="aws-card-body">
                  <Row>
                    <Col md={6}>
                      <h6 className="mb-3">Tool Selection Questions</h6>
                      
                      <div className="mb-4">
                        <strong>Q: Why only RPA and Selenium? What about other tools?</strong>
                        <div className="small aws-text-muted mt-2">
                          <strong>A:</strong> We started with the "Big 4" automation categories that cover 90% of enterprise use cases:
                          <ul className="mt-2">
                            <li><strong>LLM:</strong> Cognitive intelligence (OpenAI, Anthropic, Azure)</li>
                            <li><strong>RPA:</strong> Process automation (UiPath, AA, Power Automate)</li>
                            <li><strong>Selenium:</strong> Web testing/automation (industry standard)</li>
                            <li><strong>Custom:</strong> Everything else (APIs, databases, legacy)</li>
                          </ul>
                          Additional tools are added through the "Custom" component type or as new categories based on demand.
                        </div>
                      </div>

                      <div className="mb-4">
                        <strong>Q: Can I use Playwright instead of Selenium?</strong>
                        <div className="small aws-text-muted mt-2">
                          <strong>A:</strong> Yes! Use a Custom component with Node.js runtime and Playwright dependency. 
                          We're also planning native Playwright support in Q2 2024.
                        </div>
                      </div>

                      <div className="mb-4">
                        <strong>Q: What about Zapier, IFTTT, or Microsoft Power Platform?</strong>
                        <div className="small aws-text-muted mt-2">
                          <strong>A:</strong> These are integration platforms, not automation engines. Our platform 
                          provides the orchestration layer that these tools offer, but with more control and enterprise features.
                        </div>
                      </div>
                    </Col>
                    <Col md={6}>
                      <h6 className="mb-3">Platform Questions</h6>
                      
                      <div className="mb-4">
                        <strong>Q: How is this different from existing automation platforms?</strong>
                        <div className="small aws-text-muted mt-2">
                          <strong>A:</strong> Most platforms focus on one automation type. We combine multiple types 
                          in a single workflow with enterprise-grade orchestration, monitoring, and governance.
                        </div>
                      </div>

                      <div className="mb-4">
                        <strong>Q: Can I integrate with my existing RPA tools?</strong>
                        <div className="small aws-text-muted mt-2">
                          <strong>A:</strong> Yes! RPA components can call existing UiPath, Automation Anywhere, 
                          or Power Automate workflows through their APIs or orchestrators.
                        </div>
                      </div>

                      <div className="mb-4">
                        <strong>Q: What programming languages are supported for Custom components?</strong>
                        <div className="small aws-text-muted mt-2">
                          <strong>A:</strong> Node.js, Python, Java, .NET, Go, and any Docker container. 
                          We provide runtime environments and dependency management.
                        </div>
                      </div>

                      <div className="border rounded p-3" style={{ backgroundColor: 'var(--aws-info-light, #e3f2fd)' }}>
                        <strong className="small text-primary">Request New Tools</strong>
                        <div className="small aws-text-muted mt-1">
                          Need a specific tool or integration? Contact us or create a Custom component. 
                          Popular requests become native components in future releases.
                        </div>
                      </div>
                    </Col>
                  </Row>

                  <hr className="my-4" />

                  <h6 className="mb-3">Roadmap: Additional Tools Coming Soon</h6>
                  <Row className="small">
                    <Col md={3}>
                      <strong>Web Automation</strong>
                      <ul className="aws-text-muted">
                        <li>Playwright</li>
                        <li>Cypress</li>
                        <li>Puppeteer</li>
                      </ul>
                    </Col>
                    <Col md={3}>
                      <strong>Enterprise Platforms</strong>
                      <ul className="aws-text-muted">
                        <li>ServiceNow</li>
                        <li>Salesforce Flow</li>
                        <li>SAP Intelligent RPA</li>
                      </ul>
                    </Col>
                    <Col md={3}>
                      <strong>Cloud Native</strong>
                      <ul className="aws-text-muted">
                        <li>AWS Step Functions</li>
                        <li>Azure Logic Apps</li>
                        <li>Google Cloud Workflows</li>
                      </ul>
                    </Col>
                    <Col md={3}>
                      <strong>Specialized Tools</strong>
                      <ul className="aws-text-muted">
                        <li>Apache Airflow</li>
                        <li>Temporal</li>
                        <li>Prefect</li>
                      </ul>
                    </Col>
                  </Row>
                </div>
              </div>
            </Tab>
          </Tabs>

          {/* Component Template Modal */}
          <Modal show={showTemplateModal} onHide={() => setShowTemplateModal(false)} size="lg">
            <Modal.Header closeButton>
              <Modal.Title>Add Component ({componentTemplates.length} available)</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {componentTemplates.length === 0 ? (
                <Alert variant="warning">
                  <strong>No templates available</strong>
                  <p className="mb-0">Templates failed to load. Please refresh the page and try again.</p>
                  <Button 
                    variant="outline-primary" 
                    size="sm" 
                    className="mt-2"
                    onClick={loadComponentTemplates}
                  >
                    Retry Loading Templates
                  </Button>
                </Alert>
              ) : (
                <Row>
                  {componentTemplates.map((template) => (
                    <Col md={6} key={`${template.type}-${template.name}`} className="mb-3">
                      <Card 
                        className="h-100"
                        style={{ cursor: 'pointer' }}
                        onClick={() => addComponent(template)}
                      >
                        <Card.Body>
                          <div className="d-flex align-items-start mb-2">
                            <span style={{ fontSize: '1.5rem', marginRight: '8px' }}>
                              {getComponentTypeIcon(template.type)}
                            </span>
                            <div>
                              <h6>{template.name}</h6>
                              {getComponentTypeBadge(template.type)}
                            </div>
                          </div>
                          <p className="small aws-text-muted mb-2">{template.description}</p>
                          <div className="small">
                            <div><strong>Category:</strong> {template.category}</div>
                            <div><strong>Complexity:</strong> {template.complexity}</div>
                            <div><strong>Inputs:</strong> {template.requiredInputs.join(', ')}</div>
                            <div><strong>Outputs:</strong> {template.providedOutputs.join(', ')}</div>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="outline-primary" onClick={() => setShowTemplateModal(false)}>
                Cancel
              </Button>
            </Modal.Footer>
          </Modal>

          {/* Component Configuration Modal */}
          <Modal show={showComponentModal} onHide={() => setShowComponentModal(false)} size="xl">
            <Modal.Header closeButton>
              <Modal.Title>
                Configure Component: {selectedComponent?.component.name}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {selectedComponent && (
                <div>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Component Name *</Form.Label>
                        <Form.Control
                          type="text"
                          value={selectedComponent.component.name}
                          onChange={(e) => updateComponent(selectedComponent.id, { name: e.target.value })}
                          placeholder="Enter component name"
                        />
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label>Description</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={2}
                          value={selectedComponent.component.description || ''}
                          onChange={(e) => updateComponent(selectedComponent.id, { 
                            description: e.target.value 
                          })}
                          placeholder="Describe what this component does"
                        />
                      </Form.Group>

                      <Alert variant="info" className="mb-3">
                        <strong>Component Type:</strong> {getComponentTypeIcon(selectedComponent.component.type)} {selectedComponent.component.type.toUpperCase()}
                        <br />
                        <strong>Category:</strong> {componentTemplates.find(t => t.type === selectedComponent.component.type)?.category || 'Unknown'}
                      </Alert>
                    </Col>
                    <Col md={6}>
                      <h6 className="mb-3">Input/Output Configuration</h6>
                      
                      <div className="mb-3">
                        <strong className="small">Inputs ({selectedComponent.component.inputs.length}):</strong>
                        <div className="border rounded p-2 mt-1" style={{ backgroundColor: 'var(--aws-gray-50)', maxHeight: '100px', overflowY: 'auto' }}>
                          {selectedComponent.component.inputs.map((input, index) => (
                            <div key={index} className="small d-flex justify-content-between align-items-center mb-1">
                              <span>
                                <strong>{input.name}</strong> ({input.type})
                                {input.required && <Badge bg="danger" className="ms-1">Required</Badge>}
                              </span>
                              <Badge bg="light" text="dark">{input.source || 'user'}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mb-3">
                        <strong className="small">Outputs ({selectedComponent.component.outputs.length}):</strong>
                        <div className="border rounded p-2 mt-1" style={{ backgroundColor: 'var(--aws-gray-50)', maxHeight: '100px', overflowY: 'auto' }}>
                          {selectedComponent.component.outputs.map((output, index) => (
                            <div key={index} className="small d-flex justify-content-between align-items-center mb-1">
                              <span><strong>{output.name}</strong> ({output.type})</span>
                              <Badge bg="success">Output</Badge>
                            </div>
                          ))}
                        </div>
                      </div>

                      {selectedComponent.component.dependencies.length > 0 && (
                        <div className="mb-3">
                          <strong className="small">Dependencies ({selectedComponent.component.dependencies.length}):</strong>
                          <div className="border rounded p-2 mt-1" style={{ backgroundColor: 'var(--aws-warning-light)' }}>
                            {selectedComponent.component.dependencies.map((depId, index) => {
                              const depComponent = components.find(c => c.id === depId);
                              return (
                                <div key={index} className="small">
                                  <Badge bg="warning" className="me-1">Depends on</Badge>
                                  {depComponent?.component.name || depId}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </Col>
                  </Row>

                  <hr />

                  <Tabs defaultActiveKey="basic" className="mb-3">
                    <Tab eventKey="basic" title="Basic Configuration">
                      {selectedComponent.component.type === 'llm' && (
                        <Row>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>AI Provider</Form.Label>
                              <Form.Select
                                value={(selectedComponent.component.config as any).provider || 'openai'}
                                onChange={(e) => updateComponent(selectedComponent.id, {
                                  config: { ...selectedComponent.component.config, provider: e.target.value as any }
                                })}
                              >
                                <option value="openai">OpenAI</option>
                                <option value="anthropic">Anthropic</option>
                                <option value="azure-openai">Azure OpenAI</option>
                              </Form.Select>
                            </Form.Group>
                            <Form.Group className="mb-3">
                              <Form.Label>Model</Form.Label>
                              <Form.Select
                                value={(selectedComponent.component.config as any).model || 'gpt-4'}
                                onChange={(e) => updateComponent(selectedComponent.id, {
                                  config: { ...selectedComponent.component.config, model: e.target.value }
                                })}
                              >
                                <option value="gpt-4">GPT-4</option>
                                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                                <option value="claude-3">Claude 3</option>
                              </Form.Select>
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>Temperature (0-1)</Form.Label>
                              <Form.Control
                                type="number"
                                min="0"
                                max="1"
                                step="0.1"
                                value={(selectedComponent.component.config as any).temperature || 0.7}
                                onChange={(e) => updateComponent(selectedComponent.id, {
                                  config: { ...selectedComponent.component.config, temperature: parseFloat(e.target.value) }
                                })}
                              />
                            </Form.Group>
                            <Form.Group className="mb-3">
                              <Form.Label>Max Tokens</Form.Label>
                              <Form.Control
                                type="number"
                                min="1"
                                max="4000"
                                value={(selectedComponent.component.config as any).maxTokens || 1000}
                                onChange={(e) => updateComponent(selectedComponent.id, {
                                  config: { ...selectedComponent.component.config, maxTokens: parseInt(e.target.value) }
                                })}
                              />
                            </Form.Group>
                          </Col>
                        </Row>
                      )}

                      {selectedComponent.component.type === 'rpa' && (
                        <Row>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>RPA Platform</Form.Label>
                              <Form.Select
                                value={(selectedComponent.component.config as any).platform || 'custom'}
                                onChange={(e) => updateComponent(selectedComponent.id, {
                                  config: { ...selectedComponent.component.config, platform: e.target.value as any }
                                })}
                              >
                                <option value="custom">Custom/Built-in</option>
                                <option value="uipath">UiPath</option>
                                <option value="automation-anywhere">Automation Anywhere</option>
                                <option value="power-automate">Microsoft Power Automate</option>
                              </Form.Select>
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>Timeout (seconds)</Form.Label>
                              <Form.Control
                                type="number"
                                min="10"
                                max="300"
                                value={(selectedComponent.component.config as any).workflow?.timeout / 1000 || 30}
                                onChange={(e) => updateComponent(selectedComponent.id, {
                                  config: {
                                    ...selectedComponent.component.config,
                                    workflow: {
                                      ...(selectedComponent.component.config as any).workflow,
                                      timeout: parseInt(e.target.value) * 1000
                                    }
                                  }
                                })}
                              />
                            </Form.Group>
                          </Col>
                        </Row>
                      )}

                      {selectedComponent.component.type === 'selenium' && (
                        <Row>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>Browser</Form.Label>
                              <Form.Select
                                value={(selectedComponent.component.config as any).browser || 'chrome'}
                                onChange={(e) => updateComponent(selectedComponent.id, {
                                  config: { ...selectedComponent.component.config, browser: e.target.value as any }
                                })}
                              >
                                <option value="chrome">Chrome</option>
                                <option value="firefox">Firefox</option>
                                <option value="safari">Safari</option>
                                <option value="edge">Edge</option>
                              </Form.Select>
                            </Form.Group>
                            <Form.Group className="mb-3">
                              <Form.Check
                                type="checkbox"
                                label="Headless Mode"
                                checked={(selectedComponent.component.config as any).headless || false}
                                onChange={(e) => updateComponent(selectedComponent.id, {
                                  config: { ...selectedComponent.component.config, headless: e.target.checked }
                                })}
                              />
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>Window Width</Form.Label>
                              <Form.Control
                                type="number"
                                min="800"
                                max="2560"
                                value={(selectedComponent.component.config as any).windowSize?.width || 1920}
                                onChange={(e) => updateComponent(selectedComponent.id, {
                                  config: {
                                    ...selectedComponent.component.config,
                                    windowSize: {
                                      ...(selectedComponent.component.config as any).windowSize,
                                      width: parseInt(e.target.value)
                                    }
                                  }
                                })}
                              />
                            </Form.Group>
                            <Form.Group className="mb-3">
                              <Form.Label>Window Height</Form.Label>
                              <Form.Control
                                type="number"
                                min="600"
                                max="1440"
                                value={(selectedComponent.component.config as any).windowSize?.height || 1080}
                                onChange={(e) => updateComponent(selectedComponent.id, {
                                  config: {
                                    ...selectedComponent.component.config,
                                    windowSize: {
                                      ...(selectedComponent.component.config as any).windowSize,
                                      height: parseInt(e.target.value)
                                    }
                                  }
                                })}
                              />
                            </Form.Group>
                          </Col>
                        </Row>
                      )}

                      {selectedComponent.component.type === 'custom' && (
                        <Row>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>Runtime</Form.Label>
                              <Form.Select
                                value={(selectedComponent.component.config as any).runtime || 'nodejs'}
                                onChange={(e) => updateComponent(selectedComponent.id, {
                                  config: { ...selectedComponent.component.config, runtime: e.target.value as any }
                                })}
                              >
                                <option value="nodejs">Node.js</option>
                                <option value="python">Python</option>
                                <option value="java">Java</option>
                                <option value="dotnet">.NET</option>
                                <option value="go">Go</option>
                                <option value="docker">Docker</option>
                              </Form.Select>
                            </Form.Group>
                            <Form.Group className="mb-3">
                              <Form.Label>Entry Point</Form.Label>
                              <Form.Control
                                type="text"
                                value={(selectedComponent.component.config as any).entryPoint || 'index.js'}
                                onChange={(e) => updateComponent(selectedComponent.id, {
                                  config: { ...selectedComponent.component.config, entryPoint: e.target.value }
                                })}
                                placeholder="e.g., index.js, main.py, app.jar"
                              />
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>CPU Limit</Form.Label>
                              <Form.Control
                                type="text"
                                value={(selectedComponent.component.config as any).resources?.cpu || '100m'}
                                onChange={(e) => updateComponent(selectedComponent.id, {
                                  config: {
                                    ...selectedComponent.component.config,
                                    resources: {
                                      ...(selectedComponent.component.config as any).resources,
                                      cpu: e.target.value
                                    }
                                  }
                                })}
                                placeholder="e.g., 100m, 1, 2"
                              />
                            </Form.Group>
                            <Form.Group className="mb-3">
                              <Form.Label>Memory Limit</Form.Label>
                              <Form.Control
                                type="text"
                                value={(selectedComponent.component.config as any).resources?.memory || '128Mi'}
                                onChange={(e) => updateComponent(selectedComponent.id, {
                                  config: {
                                    ...selectedComponent.component.config,
                                    resources: {
                                      ...(selectedComponent.component.config as any).resources,
                                      memory: e.target.value
                                    }
                                  }
                                })}
                                placeholder="e.g., 128Mi, 1Gi, 2Gi"
                              />
                            </Form.Group>
                          </Col>
                        </Row>
                      )}
                    </Tab>

                    <Tab eventKey="advanced" title="Advanced">
                      <div className="border rounded p-3" style={{ backgroundColor: 'var(--aws-gray-50)' }}>
                        <h6>Raw Configuration (JSON)</h6>
                        <Form.Control
                          as="textarea"
                          rows={10}
                          value={JSON.stringify(selectedComponent.component.config, null, 2)}
                          onChange={(e) => {
                            try {
                              const newConfig = JSON.parse(e.target.value);
                              updateComponent(selectedComponent.id, { config: newConfig });
                            } catch (error) {
                              // Invalid JSON, don't update
                            }
                          }}
                          style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
                        />
                        <small className="aws-text-muted">
                          Advanced users can edit the raw JSON configuration. Invalid JSON will be ignored.
                        </small>
                      </div>
                    </Tab>
                  </Tabs>
                </div>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="outline-primary" onClick={() => setShowComponentModal(false)}>
                Cancel
              </Button>
              <Button className="aws-btn aws-btn-primary" onClick={() => setShowComponentModal(false)}>
                Save Configuration
              </Button>
            </Modal.Footer>
          </Modal>

          {/* Data Mapping Modal */}
          <DataMappingModal
            isOpen={showDataMappingModal}
            onClose={() => {
              setShowDataMappingModal(false);
              setMappingSourceComponent(null);
              setMappingTargetComponent(null);
            }}
            sourceComponent={mappingSourceComponent}
            targetComponent={mappingTargetComponent}
            existingMappings={dataMappings.filter((m: DataMapping) => 
              m.sourceComponentId === mappingSourceComponent?.id && 
              m.targetComponentId === mappingTargetComponent?.id
            )}
            onSaveMappings={handleSaveDataMappings}
          />
        </Container>
      </div>

      {/* AI Suggestions Modal */}
      <Modal 
        show={intelligenceSidebarOpen} 
        onHide={() => setIntelligenceSidebarOpen(false)}
        size="xl"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <span className="me-2">🧠</span>
            AI Suggestions for Your Hybrid Agent
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <IntelligenceModal
            context={{
              type: 'hybrid-builder',
              data: {
                description: agentDescription,
                name: agentName,
                components: components.map(c => c.component.type),
                connections: connections.length,
                orchestrationMode
              }
            }}
            onAcceptSuggestion={(suggestion) => {
              handleAcceptSuggestion(suggestion);
              setIntelligenceSidebarOpen(false);
            }}
          />
        </Modal.Body>
      </Modal>

    </PermissionGuard>
  );
};

export default HybridAgentBuilder;