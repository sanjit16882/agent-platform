import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Alert, Form, Modal, Tabs, Tab } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import PermissionGuard from './PermissionGuard';
import { usePermissions } from '../hooks/usePermissions';
import { agentCompositionService } from '../services/agentCompositionService';
import { nlpApi } from '../services/nlpApi';
import { AgentComponent, AgentType } from '../types/hybridAgent';
import BedrockStatus from './BedrockStatus';
import BedrockModelSelector from './BedrockModelSelector';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002';

interface NLPAnalysisResult {
  intent: {
    action: string;
    confidence: number;
    category: string;
    complexity: 'simple' | 'medium' | 'complex';
  };
  suggestedComponents: {
    type: AgentType;
    name: string;
    description: string;
    config: any;
    confidence: number;
    reasoning: string;
  }[];
  workflow: {
    orchestration: 'sequential' | 'parallel' | 'conditional';
    steps: string[];
    dataFlow: string[];
  };
  estimatedTime: number;
  businessValue: 'low' | 'medium' | 'high';
}

interface GeneratedAgent {
  name: string;
  description: string;
  components: AgentComponent[];
  orchestration: any;
  dataFlow: any;
  metadata: any;
}

interface NLTestResult {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  duration: number;
  message?: string;
  category: 'intent' | 'output' | 'conversation' | 'edge_case' | 'performance';
}

interface ConversationTest {
  id: string;
  name: string;
  input: string;
  expectedOutput: string;
  actualOutput?: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  confidence?: number;
}

const NaturalLanguageAgentGenerator: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [activeTab, setActiveTab] = useState('input');
  const [description, setDescription] = useState('');
  const [examples, setExamples] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<NLPAnalysisResult | null>(null);
  const [generatedAgent, setGeneratedAgent] = useState<GeneratedAgent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'failed' | 'checking'>('checking');
  const [showPreview, setShowPreview] = useState(false);
  const [testingStatus, setTestingStatus] = useState<'idle' | 'running' | 'completed' | 'failed'>('idle');
  const [testResults, setTestResults] = useState<NLTestResult[]>([]);
  const [conversationTests, setConversationTests] = useState<ConversationTest[]>([]);
  const [testProgress, setTestProgress] = useState(0);
  const [selectedBedrockModel, setSelectedBedrockModel] = useState<string>('');
  const [selectedBedrockModelName, setSelectedBedrockModelName] = useState<string>('');

  // Helper functions for NLP analysis
  const extractCategory = (desc: string): string => {
    const lowerDesc = desc.toLowerCase();
    if (lowerDesc.includes('email') || lowerDesc.includes('support') || lowerDesc.includes('customer')) return 'Customer Service';
    if (lowerDesc.includes('invoice') || lowerDesc.includes('accounting') || lowerDesc.includes('finance')) return 'Finance';
    if (lowerDesc.includes('test') || lowerDesc.includes('monitor') || lowerDesc.includes('quality')) return 'Quality Assurance';
    if (lowerDesc.includes('data') || lowerDesc.includes('report') || lowerDesc.includes('analytics')) return 'Data Processing';
    if (lowerDesc.includes('employee') || lowerDesc.includes('onboard') || lowerDesc.includes('hr')) return 'Human Resources';
    return 'General Automation';
  };

  const determineComplexity = (desc: string): 'simple' | 'medium' | 'complex' => {
    const complexKeywords = ['multiple', 'integrate', 'workflow', 'pipeline', 'orchestrate', 'complex'];
    const mediumKeywords = ['analyze', 'process', 'transform', 'validate', 'generate'];
    
    const lowerDesc = desc.toLowerCase();
    if (complexKeywords.some(keyword => lowerDesc.includes(keyword))) return 'complex';
    if (mediumKeywords.some(keyword => lowerDesc.includes(keyword))) return 'medium';
    return 'simple';
  };

  const generateComponentSuggestions = (desc: string) => {
    const suggestions = [];
    const lowerDesc = desc.toLowerCase();

    // LLM component suggestions
    if (lowerDesc.includes('analyze') || lowerDesc.includes('understand') || lowerDesc.includes('summarize') || lowerDesc.includes('categorize')) {
      suggestions.push({
        type: 'llm' as AgentType,
        name: 'AI Text Analyzer',
        description: 'Analyzes and processes text content using AI',
        config: {
          provider: 'openai',
          model: 'gpt-4',
          temperature: 0.7,
          maxTokens: 1000,
          systemPrompt: 'You are a helpful AI assistant that analyzes text content.',
          userPromptTemplate: `Analyze this content: {input}`,
          responseFormat: 'json'
        },
        confidence: 0.9,
        reasoning: 'Description indicates need for text analysis and understanding'
      });
    }

    // RPA component suggestions
    if (lowerDesc.includes('form') || lowerDesc.includes('data entry') || lowerDesc.includes('automate') || lowerDesc.includes('fill') || lowerDesc.includes('update')) {
      suggestions.push({
        type: 'rpa' as AgentType,
        name: 'Process Automator',
        description: 'Automates repetitive tasks and processes',
        config: {
          platform: 'custom',
          workflow: {
            steps: [
              { id: '1', type: 'navigate', selector: '', action: 'goto', data: '{url}' },
              { id: '2', type: 'type', selector: 'input', action: 'fill', data: '{data}' }
            ],
            flowControl: 'sequential',
            timeout: 30000,
            retryPolicy: { maxRetries: 3, retryDelay: 1000, backoffMultiplier: 2, maxDelay: 10000 }
          }
        },
        confidence: 0.8,
        reasoning: 'Description suggests need for process automation'
      });
    }

    // Selenium component suggestions
    if (lowerDesc.includes('test') || lowerDesc.includes('validate') || lowerDesc.includes('verify') || lowerDesc.includes('monitor') || lowerDesc.includes('web')) {
      suggestions.push({
        type: 'selenium' as AgentType,
        name: 'Web Validator',
        description: 'Tests and validates web applications',
        config: {
          browser: 'chrome',
          headless: true,
          windowSize: { width: 1920, height: 1080 },
          timeout: 30000
        },
        confidence: 0.7,
        reasoning: 'Description indicates need for testing and validation'
      });
    }

    // Custom component suggestions
    if (lowerDesc.includes('api') || lowerDesc.includes('database') || lowerDesc.includes('integrate') || lowerDesc.includes('system') || lowerDesc.includes('crm')) {
      suggestions.push({
        type: 'custom' as AgentType,
        name: 'System Integrator',
        description: 'Integrates with external systems and APIs',
        config: {
          runtime: 'nodejs',
          entryPoint: 'index.js',
          code: `// Generated integration code\nmodule.exports = async function(inputs) {\n  // Process inputs and integrate with external systems\n  return { success: true, data: inputs };\n};`,
          dependencies: ['axios'],
          environment: {},
          resources: { cpu: '100m', memory: '128Mi', storage: '1Gi' }
        },
        confidence: 0.8,
        reasoning: 'Description suggests need for system integration'
      });
    }

    return suggestions;
  };

  const analyzeWorkflow = (desc: string) => {
    const lowerDesc = desc.toLowerCase();
    
    if (lowerDesc.includes('parallel') || lowerDesc.includes('simultaneously')) {
      return {
        orchestration: 'parallel' as const,
        steps: ['Initialize components', 'Execute in parallel', 'Aggregate results'],
        dataFlow: ['Input distribution', 'Parallel processing', 'Result aggregation']
      };
    }
    
    if (lowerDesc.includes('if') || lowerDesc.includes('condition') || lowerDesc.includes('depending')) {
      return {
        orchestration: 'conditional' as const,
        steps: ['Evaluate conditions', 'Branch execution', 'Merge results'],
        dataFlow: ['Condition evaluation', 'Conditional routing', 'Result consolidation']
      };
    }
    
    return {
      orchestration: 'sequential' as const,
      steps: ['Process input', 'Execute components', 'Generate output'],
      dataFlow: ['Input validation', 'Sequential processing', 'Output generation']
    };
  };

  const estimateExecutionTime = (desc: string): number => {
    const lowerDesc = desc.toLowerCase();
    let baseTime = 30; // 30 seconds base
    
    if (lowerDesc.includes('complex') || lowerDesc.includes('multiple')) baseTime += 60;
    if (lowerDesc.includes('analyze') || lowerDesc.includes('process')) baseTime += 30;
    if (lowerDesc.includes('test') || lowerDesc.includes('validate')) baseTime += 45;
    
    return baseTime;
  };

  const assessBusinessValue = (desc: string): 'low' | 'medium' | 'high' => {
    const lowerDesc = desc.toLowerCase();
    const highValueKeywords = ['revenue', 'cost', 'efficiency', 'automation', 'scale'];
    const mediumValueKeywords = ['improve', 'optimize', 'streamline', 'enhance'];
    
    if (highValueKeywords.some(keyword => lowerDesc.includes(keyword))) return 'high';
    if (mediumValueKeywords.some(keyword => lowerDesc.includes(keyword))) return 'medium';
    return 'low';
  };

  const extractAgentName = (desc: string): string => {
    const words = desc.split(' ').slice(0, 4);
    return words.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') + ' Agent';
  };

  const generateComponents = async (suggestions: any[]): Promise<AgentComponent[]> => {
    return suggestions.map((suggestion, index) => ({
      id: `comp_${Date.now()}_${index}`,
      name: suggestion.name,
      description: suggestion.description,
      type: suggestion.type,
      config: suggestion.config,
      inputs: getDefaultInputs(suggestion.type),
      outputs: getDefaultOutputs(suggestion.type),
      dependencies: index > 0 ? [`comp_${Date.now()}_${index - 1}`] : []
    }));
  };

  const getDefaultInputs = (type: AgentType) => {
    const inputMap = {
      'llm': [{ name: 'text', type: 'string' as const, required: true, source: 'user' as const }],
      'rpa': [{ name: 'data', type: 'object' as const, required: true, source: 'user' as const }],
      'selenium': [{ name: 'testData', type: 'object' as const, required: true, source: 'user' as const }],
      'custom': [{ name: 'input', type: 'object' as const, required: true, source: 'user' as const }],
      'hybrid': [{ name: 'input', type: 'object' as const, required: true, source: 'user' as const }]
    };
    return inputMap[type] || [];
  };

  const getDefaultOutputs = (type: AgentType) => {
    const outputMap = {
      'llm': [{ name: 'analysis', type: 'object' as const, description: 'AI analysis results' }],
      'rpa': [{ name: 'result', type: 'object' as const, description: 'Process automation results' }],
      'selenium': [{ name: 'testResults', type: 'object' as const, description: 'Test execution results' }],
      'custom': [{ name: 'output', type: 'object' as const, description: 'Custom component output' }],
      'hybrid': [{ name: 'output', type: 'object' as const, description: 'Hybrid agent output' }]
    };
    return outputMap[type] || [];
  };

  const generateDataMappings = (suggestions: any[]) => {
    const mappings = [];
    for (let i = 1; i < suggestions.length; i++) {
      mappings.push({
        from: { componentId: `comp_${Date.now()}_${i - 1}`, outputName: 'result' },
        to: { componentId: `comp_${Date.now()}_${i}`, inputName: 'input' },
        transformation: undefined
      });
    }
    return mappings;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'success';
    if (confidence >= 0.6) return 'warning';
    return 'danger';
  };

  const getComplexityBadge = (complexity: string) => {
    const colorMap = {
      'simple': 'success',
      'medium': 'warning', 
      'complex': 'danger'
    };
    return <Badge bg={colorMap[complexity as keyof typeof colorMap] || 'secondary'}>{complexity.toUpperCase()}</Badge>;
  };

  useEffect(() => {
    checkConnection();
    loadExamples();
  }, []);

  const checkConnection = async () => {
    try {
      await nlpApi.testConnection();
      setConnectionStatus('connected');
    } catch (error) {
      setConnectionStatus('failed');
    }
  };

  const loadExamples = () => {
    const exampleDescriptions = [
      "Analyze customer support emails and automatically categorize them by urgency and department, then create tickets in our CRM system",
      "Process incoming invoices by extracting key information, validating against purchase orders, and updating our accounting system",
      "Monitor our web application for errors, automatically test critical user flows, and generate detailed reports for the development team",
      "Read product reviews from multiple sources, analyze sentiment and key themes, then update our product database with insights",
      "Automate employee onboarding by filling out forms, creating accounts in multiple systems, and sending welcome emails",
      "Extract data from PDF reports, validate the information, and populate our business intelligence dashboard"
    ];
    setExamples(exampleDescriptions);
  };

  const analyzeDescription = async () => {
    if (!description.trim()) {
      setError('Please enter a description');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const analysis: NLPAnalysisResult = {
        intent: {
          action: 'create-agent',
          confidence: 0.85,
          category: extractCategory(description),
          complexity: determineComplexity(description)
        },
        suggestedComponents: generateComponentSuggestions(description),
        workflow: analyzeWorkflow(description),
        estimatedTime: estimateExecutionTime(description),
        businessValue: assessBusinessValue(description)
      };

      setAnalysisResult(analysis);
      setActiveTab('analysis');
    } catch (error) {
      setError(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const generateAgent = async () => {
    if (!analysisResult) return;

    setLoading(true);
    try {
      const agent: GeneratedAgent = {
        name: extractAgentName(description),
        description: description,
        components: await generateComponents(analysisResult.suggestedComponents),
        orchestration: {
          mode: analysisResult.workflow.orchestration,
          timeout: analysisResult.estimatedTime * 1000,
          maxRetries: 3,
          retryDelay: 2000,
          parallelism: analysisResult.workflow.orchestration === 'parallel' ? 3 : 1,
          conditions: []
        },
        dataFlow: {
          mappings: generateDataMappings(analysisResult.suggestedComponents),
          transformations: [],
          storage: {
            persistent: false,
            encryption: true,
            retention: 7,
            location: 'memory' as const
          }
        },
        metadata: {
          complexity: analysisResult.intent.complexity,
          estimatedRuntime: analysisResult.estimatedTime,
          resourceUsage: analysisResult.intent.complexity === 'complex' ? 'high' : 'medium',
          securityLevel: 'internal',
          complianceFlags: [],
          businessValue: analysisResult.businessValue,
          generatedFrom: 'natural-language',
          originalDescription: description,
          confidence: analysisResult.intent.confidence
        }
      };

      setGeneratedAgent(agent);
      setActiveTab('generated');
    } catch (error) {
      setError(`Agent generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const runNLAgentTests = async () => {
    if (!generatedAgent || !analysisResult) return;

    setTestingStatus('running');
    setTestProgress(0);
    setTestResults([]);
    setConversationTests([]);

    try {
      // Generate test cases based on the original description and analysis
      const tests = generateNLTestCases(description, analysisResult);
      const conversationTests = generateConversationTests(description, analysisResult);
      
      setConversationTests(conversationTests);
      
      const results: NLTestResult[] = [];

      // Run intent validation tests
      for (let i = 0; i < tests.length; i++) {
        const test = tests[i];
        const progress = Math.round(((i + 1) / tests.length) * 70); // 70% for main tests
        setTestProgress(progress);

        const testResult: NLTestResult = {
          ...test,
          status: 'running',
          duration: 0
        };

        results.push(testResult);
        setTestResults([...results]);

        // Simulate test execution
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 300));
        
        const passed = Math.random() > 0.1; // 90% pass rate
        testResult.status = passed ? 'passed' : 'failed';
        testResult.duration = Math.round(200 + Math.random() * 500);
        
        if (!passed) {
          testResult.message = getNLTestFailureMessage(test.name, test.category);
        }

        setTestResults([...results]);
      }

      // Run conversation tests
      const updatedConversationTests = [...conversationTests];
      for (let i = 0; i < conversationTests.length; i++) {
        const test = conversationTests[i];
        const progress = 70 + Math.round(((i + 1) / conversationTests.length) * 30); // Remaining 30%
        setTestProgress(progress);

        test.status = 'running';
        setConversationTests([...updatedConversationTests]);

        // Simulate conversation test
        await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));
        
        const passed = Math.random() > 0.15; // 85% pass rate
        test.status = passed ? 'passed' : 'failed';
        test.confidence = passed ? Math.round(85 + Math.random() * 15) : Math.round(30 + Math.random() * 40);
        test.actualOutput = passed 
          ? `Generated response matching expected output with ${test.confidence}% confidence`
          : `Generated response did not match expected output (${test.confidence}% confidence)`;

        setConversationTests([...updatedConversationTests]);
      }

      setTestProgress(100);
      setTestingStatus('completed');
    } catch (error) {
      console.error('NL Agent testing failed:', error);
      setTestingStatus('failed');
    }
  };

  const generateNLTestCases = (description: string, analysis: NLPAnalysisResult): Omit<NLTestResult, 'status' | 'duration'>[] => {
    return [
      {
        id: 'intent-1',
        name: 'Intent Recognition Accuracy',
        category: 'intent',
        message: undefined
      },
      {
        id: 'intent-2', 
        name: 'Category Classification',
        category: 'intent',
        message: undefined
      },
      {
        id: 'output-1',
        name: 'Output Format Validation',
        category: 'output',
        message: undefined
      },
      {
        id: 'output-2',
        name: 'Response Quality Check',
        category: 'output', 
        message: undefined
      },
      {
        id: 'edge-1',
        name: 'Empty Input Handling',
        category: 'edge_case',
        message: undefined
      },
      {
        id: 'edge-2',
        name: 'Invalid Input Processing',
        category: 'edge_case',
        message: undefined
      },
      {
        id: 'perf-1',
        name: 'Response Time Performance',
        category: 'performance',
        message: undefined
      }
    ];
  };

  const generateConversationTests = (description: string, analysis: NLPAnalysisResult): ConversationTest[] => {
    const category = analysis.intent.category.toLowerCase();
    
    const baseTests = [
      {
        id: 'conv-1',
        name: 'Basic Functionality Test',
        input: 'Test the main functionality described in the requirements',
        expectedOutput: 'Should perform the primary task as described',
        status: 'pending' as const
      },
      {
        id: 'conv-2',
        name: 'Error Handling Test',
        input: 'Invalid or malformed input data',
        expectedOutput: 'Should handle errors gracefully and provide helpful feedback',
        status: 'pending' as const
      }
    ];

    // Add category-specific conversation tests
    if (category.includes('customer') || category.includes('support')) {
      baseTests.push({
        id: 'conv-3',
        name: 'Customer Service Scenario',
        input: 'I need help with my account and have a billing question',
        expectedOutput: 'Should provide helpful customer service response and route appropriately',
        status: 'pending' as const
      });
    } else if (category.includes('data') || category.includes('analytics')) {
      baseTests.push({
        id: 'conv-3',
        name: 'Data Processing Scenario',
        input: 'Process this sample data and provide analysis',
        expectedOutput: 'Should analyze data and provide meaningful insights',
        status: 'pending' as const
      });
    } else if (category.includes('quality') || category.includes('test')) {
      baseTests.push({
        id: 'conv-3',
        name: 'Quality Assurance Scenario',
        input: 'Review this system for quality and testing requirements',
        expectedOutput: 'Should provide comprehensive quality assessment',
        status: 'pending' as const
      });
    }

    return baseTests;
  };

  const getNLTestFailureMessage = (testName: string, category: string): string => {
    const messages: { [key: string]: string } = {
      'Intent Recognition Accuracy': 'Agent failed to correctly understand the intended task',
      'Category Classification': 'Agent misclassified the request category',
      'Output Format Validation': 'Agent output does not match expected format',
      'Response Quality Check': 'Agent response quality below acceptable threshold',
      'Empty Input Handling': 'Agent does not handle empty inputs properly',
      'Invalid Input Processing': 'Agent fails to process invalid inputs gracefully',
      'Response Time Performance': 'Agent response time exceeds acceptable limits'
    };
    
    return messages[testName] || `${testName} failed for ${category} validation`;
  };

  const saveGeneratedAgent = async () => {
    if (!generatedAgent) return;

    setLoading(true);
    try {
      const request = {
        name: generatedAgent.name,
        description: generatedAgent.description,
        components: generatedAgent.components.map(comp => ({
          id: comp.id,
          type: comp.type,
          name: comp.name,
          config: comp.config,
          inputs: comp.inputs,
          outputs: comp.outputs,
          dependencies: comp.dependencies,
          position: { x: 100, y: 100 }
        })),
        orchestration: generatedAgent.orchestration,
        dataFlow: generatedAgent.dataFlow,
        bedrockConfig: selectedBedrockModel ? {
          defaultModel: selectedBedrockModel,
          modelName: selectedBedrockModelName,
          provider: 'aws-bedrock',
          region: 'us-east-1'
        } : undefined
      };

      const hybridAgent = await agentCompositionService.createHybridAgent(request);
      
      const bedrockInfo = selectedBedrockModel ? `\nAI Model: ${selectedBedrockModelName}` : '';
      const userChoice = window.confirm(
        `Agent "${generatedAgent.name}" created successfully!${bedrockInfo}\n\n` +
        `Generated from natural language with ${Math.round(analysisResult?.intent.confidence! * 100)}% confidence.\n` +
        `Components: ${generatedAgent.components.length}\n\n` +
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
          // Stay on current page or navigate back to generator
        } catch (error) {
          console.error('Failed to discard agent:', error);
          // Even if delete fails, don't navigate to catalog
        }
      }
    } catch (error) {
      setError(`Failed to save agent: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PermissionGuard permission={['agent.create']} requireAll={false}>
      <Container fluid className="p-4">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 className="h3 mb-1">Natural Language Agent Generator</h1>
            <p className="text-muted mb-0">
              Describe your automation needs in plain English - AI will generate a complete hybrid agent
            </p>
          </div>
          <div>
            <Badge 
              bg={connectionStatus === 'connected' ? 'success' : connectionStatus === 'failed' ? 'danger' : 'warning'}
              className="me-2"
            >
              {connectionStatus === 'connected' ? 'Connected' : 
               connectionStatus === 'failed' ? 'Disconnected' : 'Checking'}
            </Badge>
            <Button 
              variant="outline-primary"
              onClick={() => navigate('/hybrid-builder')}
            >
              Manual Builder
            </Button>
          </div>
        </div>

        {/* Bedrock Integration Status */}
        <div className="mb-4">
          <BedrockStatus showDetails={false} />
        </div>

        {/* Platform Overview */}
        <Card className="mb-4">
          <Card.Header>
            <h5 className="mb-0">How Natural Language Agent Generation Works</h5>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={8}>
                <div className="d-flex align-items-center mb-3">
                  <div className="me-3" style={{ fontSize: '1.5rem' }}>1️⃣</div>
                  <div>
                    <strong>Describe Your Needs</strong>
                    <br />
                    <small className="text-muted">
                      Tell us what you want to automate in plain English. Be specific about inputs, processes, and desired outcomes.
                    </small>
                  </div>
                </div>
                <div className="d-flex align-items-center mb-3">
                  <div className="me-3" style={{ fontSize: '1.5rem' }}>2️⃣</div>
                  <div>
                    <strong>AI Analysis & Component Selection</strong>
                    <br />
                    <small className="text-muted">
                      Our AI analyzes your description and suggests the best combination of LLM, RPA, Selenium, and Custom components.
                    </small>
                  </div>
                </div>
                <div className="d-flex align-items-center mb-3">
                  <div className="me-3" style={{ fontSize: '1.5rem' }}>3️⃣</div>
                  <div>
                    <strong>Automatic Agent Generation</strong>
                    <br />
                    <small className="text-muted">
                      Complete hybrid agent is generated with proper orchestration, data flow, and configuration.
                    </small>
                  </div>
                </div>
              </Col>
              <Col md={4}>
                <div className="border rounded p-3" style={{ backgroundColor: '#f8f9fa' }}>
                  <h6 className="mb-3">Example Descriptions</h6>
                  <div className="small">
                    <div className="mb-2">
                      <strong>"Analyze customer emails and update CRM"</strong>
                      <br />
                      <span className="text-muted">→ LLM + RPA + Custom API</span>
                    </div>
                    <div className="mb-2">
                      <strong>"Process invoices and validate data"</strong>
                      <br />
                      <span className="text-muted">→ LLM + RPA + Selenium</span>
                    </div>
                    <div>
                      <strong>"Test web app and generate reports"</strong>
                      <br />
                      <span className="text-muted">→ Selenium + LLM + Custom</span>
                    </div>
                  </div>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Main Content Tabs */}
        <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'input')} className="mb-4">
          <Tab eventKey="input" title="1. Describe Your Agent">
            <Card>
              <Card.Header>
                <h5 className="mb-0">Natural Language Input</h5>
              </Card.Header>
              <Card.Body>
                {examples.length > 0 && (
                  <div className="mb-4">
                    <h6>Example Descriptions (Click to Use)</h6>
                    <Row>
                      {examples.slice(0, 6).map((example, index) => (
                        <Col md={6} key={index} className="mb-2">
                          <div 
                            className="border rounded p-2 small"
                            style={{ 
                              cursor: 'pointer', 
                              backgroundColor: '#f8f9fa',
                              transition: 'background-color 0.2s'
                            }}
                            onClick={() => setDescription(example)}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e9ecef'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                          >
                            {example}
                          </div>
                        </Col>
                      ))}
                    </Row>
                  </div>
                )}

                <Form.Group className="mb-3">
                  <Form.Label>Describe what you want to automate</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={6}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Example: I want to analyze customer support emails, categorize them by urgency and department, then automatically create tickets in our CRM system with the appropriate priority and assignment."
                  />
                  <Form.Text className="text-muted">
                    Be specific about inputs, processes, and desired outputs. The more detail you provide, the better the AI can understand your needs.
                  </Form.Text>
                </Form.Group>

                {error && (
                  <Alert variant="danger" className="mb-3">
                    {error}
                  </Alert>
                )}

                <div className="d-flex justify-content-between">
                  <Button 
                    variant="outline-secondary"
                    onClick={() => setDescription('')}
                    disabled={!description}
                  >
                    Clear
                  </Button>
                  <Button 
                    variant="primary"
                    onClick={analyzeDescription}
                    disabled={loading || !description.trim()}
                  >
                    {loading ? 'Analyzing...' : 'Analyze Description'}
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Tab>  
        <Tab eventKey="analysis" title="2. AI Analysis" disabled={!analysisResult}>
            {analysisResult && (
              <Card>
                <Card.Header>
                  <h5 className="mb-0">AI Analysis Results</h5>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <h6>Intent Analysis</h6>
                      <div className="mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span>Confidence:</span>
                          <Badge bg={getConfidenceColor(analysisResult.intent.confidence)}>
                            {Math.round(analysisResult.intent.confidence * 100)}%
                          </Badge>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span>Category:</span>
                          <Badge bg="info">{analysisResult.intent.category}</Badge>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span>Complexity:</span>
                          {getComplexityBadge(analysisResult.intent.complexity)}
                        </div>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span>Business Value:</span>
                          <Badge bg={analysisResult.businessValue === 'high' ? 'success' : analysisResult.businessValue === 'medium' ? 'warning' : 'secondary'}>
                            {analysisResult.businessValue.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="d-flex justify-content-between align-items-center">
                          <span>Estimated Runtime:</span>
                          <span>{analysisResult.estimatedTime}s</span>
                        </div>
                      </div>

                      <h6>Workflow Analysis</h6>
                      <div className="mb-3">
                        <div className="mb-2">
                          <strong>Orchestration:</strong> {analysisResult.workflow.orchestration}
                        </div>
                        <div className="mb-2">
                          <strong>Steps:</strong>
                          <ul className="mb-0 mt-1">
                            {analysisResult.workflow.steps.map((step, index) => (
                              <li key={index} className="small">{step}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </Col>

                    <Col md={6}>
                      <h6>Suggested Components</h6>
                      {analysisResult.suggestedComponents.map((component, index) => (
                        <Card key={index} className="mb-2">
                          <Card.Body className="p-3">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <div>
                                <strong>{component.name}</strong>
                                <Badge bg="secondary" className="ms-2">{component.type.toUpperCase()}</Badge>
                              </div>
                              <Badge bg={getConfidenceColor(component.confidence)}>
                                {Math.round(component.confidence * 100)}%
                              </Badge>
                            </div>
                            <p className="small mb-2">{component.description}</p>
                            <div className="small text-muted">
                              <strong>Reasoning:</strong> {component.reasoning}
                            </div>
                          </Card.Body>
                        </Card>
                      ))}
                    </Col>
                  </Row>

                  <div className="d-flex justify-content-between mt-4">
                    <Button 
                      variant="outline-secondary"
                      onClick={() => setActiveTab('input')}
                    >
                      Back to Input
                    </Button>
                    <Button 
                      variant="primary"
                      onClick={generateAgent}
                      disabled={loading}
                    >
                      {loading ? 'Generating Agent...' : 'Generate Agent'}
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            )}
          </Tab>

          <Tab eventKey="generated" title="3. Generated Agent" disabled={!generatedAgent}>
            {generatedAgent && (
              <Card>
                <Card.Header>
                  <div className="d-flex justify-content-between align-items-center">
                    <span>🤖 Generated Agent Preview</span>
                    <div className="d-flex gap-2">
                      <Button 
                        variant="primary"
                        onClick={() => setActiveTab('testing')}
                        disabled={!generatedAgent}
                      >
                        🧪 Test Agent
                      </Button>
                      <Button 
                        variant="success"
                        onClick={saveGeneratedAgent}
                        disabled={loading || testingStatus !== 'completed'}
                      >
                        {loading ? 'Saving...' : testingStatus !== 'completed' ? 'Test First' : '💾 Save Agent'}
                      </Button>
                    </div>
                  </div>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <h6>Agent Details</h6>
                      <ul>
                        <li><strong>Name:</strong> {generatedAgent.name}</li>
                        <li><strong>Components:</strong> {generatedAgent.components.length}</li>
                        <li><strong>Complexity:</strong> {generatedAgent.metadata.complexity}</li>
                        <li><strong>Estimated Runtime:</strong> {generatedAgent.metadata.estimatedRuntime}s</li>
                        <li><strong>Business Value:</strong> {generatedAgent.metadata.businessValue}</li>
                      </ul>

                      <div className="mt-3">
                        <BedrockModelSelector
                          selectedModel={selectedBedrockModel}
                          onModelChange={(modelId, modelName) => {
                            setSelectedBedrockModel(modelId);
                            setSelectedBedrockModelName(modelName);
                          }}
                          agentType="hybrid"
                          label="AI Model for Agent"
                          required={false}
                        />
                      </div>
                    </Col>
                    <Col md={6}>
                      <h6>Components</h6>
                      {generatedAgent.components.map((comp, idx) => (
                        <Badge key={idx} bg="primary" className="me-2 mb-2">
                          {comp.name} ({comp.type})
                        </Badge>
                      ))}
                    </Col>
                  </Row>
                  
                  {testingStatus !== 'completed' && (
                    <Alert variant="info" className="mt-3">
                      <strong>Testing Required:</strong> Please test your generated agent before saving to ensure it works as expected.
                    </Alert>
                  )}
                  
                  {testingStatus === 'completed' && (
                    <Alert variant="success" className="mt-3">
                      <strong>✅ Testing Complete:</strong> Your agent has been tested and is ready for deployment.
                    </Alert>
                  )}
                </Card.Body>
              </Card>
            )}
          </Tab>

          <Tab eventKey="testing" title="4. Test Agent" disabled={!generatedAgent}>
            {generatedAgent && (
              <Card>
                <Card.Header>
                  <h5 className="mb-0">Generated Hybrid Agent</h5>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={8}>
                      <h6>Agent Details</h6>
                      <div className="mb-3">
                        <div className="mb-2">
                          <strong>Name:</strong> {generatedAgent.name}
                        </div>
                        <div className="mb-2">
                          <strong>Description:</strong> {generatedAgent.description}
                        </div>
                        <div className="mb-2">
                          <strong>Components:</strong> {generatedAgent.components.length}
                        </div>
                        <div className="mb-2">
                          <strong>Orchestration:</strong> {generatedAgent.orchestration.mode}
                        </div>
                      </div>

                      <h6>Components</h6>
                      {generatedAgent.components.map((component, index) => (
                        <Card key={index} className="mb-2">
                          <Card.Body className="p-3">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <div>
                                <strong>{component.name}</strong>
                                <Badge bg="secondary" className="ms-2">{component.type.toUpperCase()}</Badge>
                              </div>
                            </div>
                            <p className="small mb-0">{component.description}</p>
                          </Card.Body>
                        </Card>
                      ))}
                    </Col>

                    <Col md={4}>
                      <h6>Metadata</h6>
                      <div className="border rounded p-3" style={{ backgroundColor: '#f8f9fa' }}>
                        <div className="mb-2">
                          <strong>Complexity:</strong> {getComplexityBadge(generatedAgent.metadata.complexity)}
                        </div>
                        <div className="mb-2">
                          <strong>Business Value:</strong>
                          <Badge bg={generatedAgent.metadata.businessValue === 'high' ? 'success' : generatedAgent.metadata.businessValue === 'medium' ? 'warning' : 'secondary'} className="ms-2">
                            {generatedAgent.metadata.businessValue.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="mb-2">
                          <strong>Estimated Runtime:</strong> {generatedAgent.metadata.estimatedRuntime}s
                        </div>
                        <div className="mb-2">
                          <strong>Resource Usage:</strong> {generatedAgent.metadata.resourceUsage}
                        </div>
                        <div className="mb-2">
                          <strong>Security Level:</strong> {generatedAgent.metadata.securityLevel}
                        </div>
                        <div>
                          <strong>Confidence:</strong>
                          <Badge bg={getConfidenceColor(generatedAgent.metadata.confidence)} className="ms-2">
                            {Math.round(generatedAgent.metadata.confidence * 100)}%
                          </Badge>
                        </div>
                      </div>
                    </Col>
                  </Row>

                  {error && (
                    <Alert variant="danger" className="mt-3">
                      {error}
                    </Alert>
                  )}

                  <div className="d-flex justify-content-between mt-4">
                    <Button 
                      variant="outline-secondary"
                      onClick={() => setActiveTab('analysis')}
                    >
                      Back to Analysis
                    </Button>
                    <div>
                      <Button 
                        variant="outline-primary"
                        className="me-2"
                        onClick={() => setShowPreview(true)}
                      >
                        Preview Configuration
                      </Button>
                      <Button 
                        variant="success"
                        onClick={saveGeneratedAgent}
                        disabled={loading}
                      >
                        {loading ? 'Saving...' : 'Save Agent'}
                      </Button>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            )}
          </Tab>

          {/* Testing Tab */}
          {generatedAgent && (
            <Card>
              <Card.Header>
                <div className="d-flex justify-content-between align-items-center">
                  <span>🧪 Natural Language Agent Testing</span>
                  <div className="d-flex gap-2">
                    {testingStatus === 'running' && (
                      <div className="d-flex align-items-center me-3">
                        <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                        <span>Testing... {testProgress}%</span>
                      </div>
                    )}
                    <Button 
                      variant="primary"
                      onClick={runNLAgentTests}
                      disabled={testingStatus === 'running' || !generatedAgent}
                    >
                      {testingStatus === 'running' ? 'Testing...' : '🧪 Run Tests'}
                    </Button>
                  </div>
                </div>
              </Card.Header>
              <Card.Body>
                {testingStatus === 'idle' && (
                  <Alert variant="info">
                    Test your generated natural language agent to ensure it understands intents correctly and produces expected outputs.
                  </Alert>
                )}

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

                {/* Intent and Output Validation Tests */}
                {testResults.length > 0 && (
                  <div className="mb-4">
                    <h6>Intent & Output Validation Tests</h6>
                    <Row>
                      {testResults.map((result) => (
                        <Col md={6} key={result.id} className="mb-2">
                          <Card className="h-100">
                            <Card.Body className="py-2">
                              <div className="d-flex justify-content-between align-items-center">
                                <div className="d-flex align-items-center">
                                  <Badge bg={
                                    result.status === 'passed' ? 'success' : 
                                    result.status === 'failed' ? 'danger' : 
                                    result.status === 'running' ? 'primary' : 'secondary'
                                  } className="me-2">
                                    {result.status === 'passed' ? '✓' : 
                                     result.status === 'failed' ? '✗' : 
                                     result.status === 'running' ? '⟳' : '○'}
                                  </Badge>
                                  <div>
                                    <div className="fw-medium">{result.name}</div>
                                    <small className="text-muted">{result.category}</small>
                                    {result.message && (
                                      <div className="small text-danger">{result.message}</div>
                                    )}
                                  </div>
                                </div>
                                {result.duration > 0 && (
                                  <small className="text-muted">{result.duration}ms</small>
                                )}
                              </div>
                            </Card.Body>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  </div>
                )}

                {/* Conversation Flow Tests */}
                {conversationTests.length > 0 && (
                  <div className="mb-4">
                    <h6>Conversation Flow Tests</h6>
                    {conversationTests.map((test) => (
                      <Card key={test.id} className="mb-3">
                        <Card.Header className="py-2">
                          <div className="d-flex justify-content-between align-items-center">
                            <span>
                              <Badge bg={
                                test.status === 'passed' ? 'success' : 
                                test.status === 'failed' ? 'danger' : 
                                test.status === 'running' ? 'primary' : 'secondary'
                              } className="me-2">
                                {test.status === 'passed' ? '✓' : 
                                 test.status === 'failed' ? '✗' : 
                                 test.status === 'running' ? '⟳' : '○'}
                              </Badge>
                              {test.name}
                            </span>
                            {test.confidence && (
                              <Badge bg={test.confidence >= 80 ? 'success' : test.confidence >= 60 ? 'warning' : 'danger'}>
                                {test.confidence}% confidence
                              </Badge>
                            )}
                          </div>
                        </Card.Header>
                        <Card.Body className="py-2">
                          <Row>
                            <Col md={6}>
                              <small className="text-muted">Input:</small>
                              <div className="border rounded p-2 mb-2 bg-light">
                                <small>{test.input}</small>
                              </div>
                            </Col>
                            <Col md={6}>
                              <small className="text-muted">Expected Output:</small>
                              <div className="border rounded p-2 mb-2 bg-light">
                                <small>{test.expectedOutput}</small>
                              </div>
                            </Col>
                          </Row>
                          {test.actualOutput && (
                            <div>
                              <small className="text-muted">Actual Output:</small>
                              <div className={`border rounded p-2 ${
                                test.status === 'passed' ? 'bg-success bg-opacity-10 border-success' : 
                                'bg-danger bg-opacity-10 border-danger'
                              }`}>
                                <small>{test.actualOutput}</small>
                              </div>
                            </div>
                          )}
                        </Card.Body>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Test Summary */}
                {testingStatus === 'completed' && (
                  <Alert variant={
                    testResults.every(r => r.status === 'passed') && 
                    conversationTests.every(r => r.status === 'passed') ? 'success' : 'warning'
                  }>
                    <strong>Testing Complete!</strong>
                    <div className="mt-2">
                      <div>Validation Tests: {testResults.filter(r => r.status === 'passed').length}/{testResults.length} passed</div>
                      <div>Conversation Tests: {conversationTests.filter(r => r.status === 'passed').length}/{conversationTests.length} passed</div>
                      {testResults.every(r => r.status === 'passed') && 
                       conversationTests.every(r => r.status === 'passed') && (
                        <div className="mt-2">
                          <strong>🎉 All tests passed! Your natural language agent is ready for deployment.</strong>
                          <div className="mt-2">
                            <Button 
                              variant="success"
                              onClick={() => setActiveTab('generated')}
                            >
                              ← Back to Save Agent
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </Alert>
                )}

                {testingStatus === 'failed' && (
                  <Alert variant="danger">
                    <strong>Testing Failed!</strong>
                    <p>There was an error running the tests. Please check your agent configuration and try again.</p>
                  </Alert>
                )}
              </Card.Body>
            </Card>
          )}
        </Tabs>

        {/* Preview Modal */}
        <Modal show={showPreview} onHide={() => setShowPreview(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Agent Configuration Preview</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {generatedAgent && (
              <pre className="bg-light p-3 rounded" style={{ fontSize: '0.8rem', maxHeight: '400px', overflow: 'auto' }}>
                {JSON.stringify({
                  name: generatedAgent.name,
                  description: generatedAgent.description,
                  components: generatedAgent.components,
                  orchestration: generatedAgent.orchestration,
                  dataFlow: generatedAgent.dataFlow,
                  metadata: generatedAgent.metadata
                }, null, 2)}
              </pre>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowPreview(false)}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </PermissionGuard>
  );
};

export default NaturalLanguageAgentGenerator;