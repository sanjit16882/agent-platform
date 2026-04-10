import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, Form, Button, Alert, Row, Col, Badge, Spinner, Accordion, Modal } from 'react-bootstrap';
// Removed static nlpAnalysisService - now using dynamic intelligence
import BedrockStatus from './BedrockStatus';
import BedrockModelSelector from './BedrockModelSelector';
import { IntelligenceModal } from './IntelligenceModal';
import { MCPAgentCreationStep, MCPAgentConfig } from './mcp/MCPAgentCreationStep';
import VectorDBConfigSection from './VectorDBConfigSection';
import AgentConfigurationGuide from './AgentConfigurationGuide';
import AgentTemplateSelector from './AgentTemplateSelector';
import TestRecommendationSection from './TestRecommendationSection';

// Local type definitions (previously from nlpAnalysisService)
interface NLPAnalysis {
  type: string;
  frameworks: string[];
  languages: string[];
  capabilities: string[];
  suggestedTemplates: string[];
  confidence: number;
  keywords: string[];
  intent?: string; // 'create-agent' or 'use-existing-agent'
  noMatchesFound?: boolean; // Flag when no existing agents match
}

interface TemplateMatch {
  id: string;
  name: string;
  description: string;
  confidence: number;
}

// Simple fallback functions (no longer using static keyword matching)
const createFallbackAnalysis = (description: string): NLPAnalysis => ({
  type: 'Custom',
  frameworks: [],
  languages: [],
  capabilities: ['automation'],
  suggestedTemplates: ['Custom Agent'],
  confidence: 50,
  keywords: []
});

const generateTemplateSuggestions = (analysis: NLPAnalysis): TemplateMatch[] => ([
  {
    id: 'custom-template',
    name: 'Custom Agent Template',
    description: 'A flexible template for your custom agent',
    confidence: 70
  }
]);

const generateNameSuggestions = (description: string, analysis: NLPAnalysis): string[] => {
  const baseNames = ['Custom Agent', 'Smart Agent', 'Automation Agent'];
  return baseNames.map(name => `${analysis.type} ${name}`);
};

// Convert technical intent names to user-friendly display names
const formatAgentType = (type: string): string => {
  const typeMap: { [key: string]: string } = {
    'code_review': 'Code Review',
    'testing': 'Testing & QA',
    'data_processing': 'Data Processing',
    'security': 'Security Analysis',
    'devops': 'DevOps & Infrastructure',
    'business': 'Business Intelligence',
    'automation': 'Process Automation',
    'api_integration': 'API Integration',
    'monitoring': 'System Monitoring',
    'deployment': 'Deployment & CI/CD',
    'general': 'General Purpose'
  };
  
  return typeMap[type.toLowerCase()] || type.charAt(0).toUpperCase() + type.slice(1);
};

// Convert technical capabilities to user-benefit focused descriptions
const formatCapability = (capability: string): string => {
  const capabilityMap: { [key: string]: string } = {
    'static_analysis': 'Code Quality Report',
    'security_check': 'Security Risk Assessment',
    'vulnerability_scan': 'Vulnerability Report',
    'code_quality': 'Quality Improvement Tips',
    'performance_analysis': 'Performance Recommendations',
    'test_generation': 'Automated Test Suite',
    'automation': 'Process Automation',
    'data_validation': 'Data Quality Check',
    'report_generation': 'Custom Reports',
    'file_processing': 'File Transformation',
    'api_testing': 'API Health Check',
    'integration_testing': 'Integration Validation',
    'deployment': 'Deployment Assistance',
    'monitoring': 'System Health Monitoring',
    'logging': 'Log Insights',
    'code_review': 'Code Review Feedback',
    'bug_detection': 'Bug Detection Report',
    'style_checking': 'Code Style Guide',
    'dependency_check': 'Dependency Analysis',
    'compliance_check': 'Compliance Report'
  };
  
  return capabilityMap[capability.toLowerCase()] || 
         capability.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const NLPAgentBuilder: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Core agent data
  const [agentName, setAgentName] = useState('');
  const [agentDescription, setAgentDescription] = useState('');
  const [processingLogic, setProcessingLogic] = useState('');
  
  // NLP Analysis
  const [nlpAnalysis, setNlpAnalysis] = useState<NLPAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [templateSuggestions, setTemplateSuggestions] = useState<TemplateMatch[]>([]);
  const [nameSuggestions, setNameSuggestions] = useState<string[]>([]);
  
  // Manual overrides (advanced)
  const [manualType, setManualType] = useState('');
  const [manualFrameworks, setManualFrameworks] = useState<string[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Bedrock integration
  const [selectedBedrockModel, setSelectedBedrockModel] = useState<string>('');
  const [selectedBedrockModelName, setSelectedBedrockModelName] = useState<string>('');
  

  const [showMCPStep, setShowMCPStep] = useState(false);
  const [mcpConfig, setMcpConfig] = useState<MCPAgentConfig>({
    enabled: false,
    selectedServers: [],
    autoDetected: false,
    recommendedServers: []
  });
  
  // Test Recommendation state
  const [agentCategory, setAgentCategory] = useState<string | null>(null);
  const [agentSubType, setAgentSubType] = useState<string | null>(null);

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
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // AI suggestions modal state
  const [intelligenceSidebarOpen, setIntelligenceSidebarOpen] = useState(false);
  
  // Testing framework state
  const [showTestingModal, setShowTestingModal] = useState(false);
  const [testingStatus, setTestingStatus] = useState<'idle' | 'running' | 'completed' | 'failed'>('idle');
  const [testProgress, setTestProgress] = useState(0);
  const [comprehensiveTestResults, setComprehensiveTestResults] = useState<any[]>([]);
  const [createdAgentId, setCreatedAgentId] = useState<string | null>(null);

  // Dynamic Intelligence Analysis
  const analyzeDescription = useCallback(
    async (description: string) => {
      if (description.length < 20) {
        setNlpAnalysis(null);
        setTemplateSuggestions([]);
        setNameSuggestions([]);
        return;
      }

      setIsAnalyzing(true);
      try {
        console.log('🔍 Calling Dynamic Intelligence for auto-detection...');
        
        // Call the dynamic intelligence service
        const response = await fetch('http://localhost:3002/api/intelligence/analyze-query-dynamic', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'sk-agenthub-system-internal-frontend-key',
          },
          body: JSON.stringify({
            query: description,
            userId: 'current-user',
            context: {
              type: 'agent-builder',
              data: { description }
            }
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to analyze description');
        }

        const data = await response.json();
        
        if (data.success && data.analysis) {
          // Transform dynamic analysis to NLP format
          // Map backend intent to safe display type
          const safeType = (data.analysis.intent === 'create-agent') ? 'Custom' : (data.analysis.intent || 'Custom');
          const noMatchesFound = data.analysis.intent === 'create-agent' && data.existingAgents?.length === 0;
          
          // Calculate the REAL confidence based on existing agent matches
          // If no agents match, confidence should be 0 (not the semantic analysis confidence)
          let realConfidence = 0;
          if (data.existingAgents && data.existingAgents.length > 0) {
            // Use the highest similarity score from existing agents
            const highestSimilarity = Math.max(...data.existingAgents.map((a: any) => a.similarity || 0));
            realConfidence = highestSimilarity;
          }
          
          const dynamicAnalysis = {
            type: safeType,
            frameworks: data.analysis.frameworks || [],
            languages: data.analysis.languages || [],
            capabilities: data.analysis.capabilities || [],
            suggestedTemplates: data.suggestions?.map((s: any) => s.title) || [],
            confidence: realConfidence, // Use agent similarity, not semantic confidence
            keywords: data.analysis.keywords || [],
            intent: data.analysis.intent,
            noMatchesFound: noMatchesFound || realConfidence === 0
          };
          
          console.log('✅ Dynamic analysis result:', {
            ...dynamicAnalysis,
            semanticConfidence: Math.round(data.analysis.confidence * 100) + '%',
            agentMatchConfidence: realConfidence + '%',
            matchingAgents: data.existingAgents?.length || 0
          });
          setNlpAnalysis(dynamicAnalysis);
          
          // Generate simple suggestions based on dynamic analysis
          const templates = generateTemplateSuggestions(dynamicAnalysis);
          setTemplateSuggestions(templates);
          
          const names = generateNameSuggestions(description, dynamicAnalysis);
          setNameSuggestions(names);
        } else {
          // Simple fallback if dynamic analysis fails
          console.log('⚠️ Dynamic analysis failed, using simple fallback');
          const fallbackAnalysis = createFallbackAnalysis(description);
          setNlpAnalysis(fallbackAnalysis);
          
          const templates = generateTemplateSuggestions(fallbackAnalysis);
          setTemplateSuggestions(templates);
          
          const names = generateNameSuggestions(description, fallbackAnalysis);
          setNameSuggestions(names);
        }
      } catch (error) {
        console.error('❌ Dynamic analysis failed:', error);
        // Simple fallback
        try {
          const fallbackAnalysis = createFallbackAnalysis(description);
          setNlpAnalysis(fallbackAnalysis);
          
          const templates = generateTemplateSuggestions(fallbackAnalysis);
          setTemplateSuggestions(templates);
          
          const names = generateNameSuggestions(description, fallbackAnalysis);
          setNameSuggestions(names);
        } catch (fallbackError) {
          console.error('Fallback analysis failed:', fallbackError);
        }
      } finally {
        setIsAnalyzing(false);
      }
    },
    []
  );

  // Debounce the analysis - but don't re-analyze if user has applied a suggestion
  useEffect(() => {
    const timer = setTimeout(() => {
      if (agentDescription && !agentName) {
        // Only analyze if no agent name is set (meaning user hasn't applied a suggestion yet)
        analyzeDescription(agentDescription);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [agentDescription, analyzeDescription, agentName]);

  const runComprehensiveTests = async (agentId: string) => {
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

      // Create agent component from the NLP-generated agent
      const agentComponent = {
        id: agentId,
        name: agentName,
        type: 'custom', // Always use 'custom' type for NLP-generated agents
        config: { processingLogic },
        inputs: [{ name: 'input', type: 'string', required: true, source: 'user' }],
        outputs: [
          { name: 'result', type: 'string', description: 'Processed output' },
          { name: 'analysis', type: 'object', description: 'Analysis metadata' }
        ],
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

    } catch (error: any) {
      console.error('Comprehensive testing failed:', error);
      setTestingStatus('failed');
    }
  };

  const handleCreateAgent = async () => {
    if (!agentName || !agentDescription || !processingLogic) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const finalType = manualType || nlpAnalysis?.type || 'Custom';
      const finalFrameworks = manualFrameworks.length > 0 ? manualFrameworks : nlpAnalysis?.frameworks || [];

      const requestBody = {
        templateId: selectedTemplate?.id || 'custom',
        name: agentName,
        description: agentDescription,
        purpose: agentDescription, // Use description as purpose
        category: agentCategory || finalType, // Use selected category or fallback to finalType
        agentSubType: agentSubType, // Add subcategory for test recommendations
        inputSchema: [
          {
            name: 'input',
            type: 'string',
            required: true,
            description: 'Input data for processing'
          }
        ],
        outputSchema: [
          {
            name: 'result',
            type: 'string',
            description: 'Processed output'
          },
          {
            name: 'analysis',
            type: 'object',
            description: 'Analysis metadata'
          }
        ],
        processingLogic: processingLogic,
        selectedModel: selectedBedrockModel,
        vectorDB: vectorDBConfig.enabled ? vectorDBConfig : undefined,
        metadata: {
          nlpAnalysis: nlpAnalysis,
          detectedFrameworks: finalFrameworks,
          confidence: nlpAnalysis?.confidence || 0,
          mcpConfig: mcpConfig,
          templateId: selectedTemplate?.id,
          templateName: selectedTemplate?.name,
          vectorDBConfig: vectorDBConfig,
          agentCategory: agentCategory, // Store in metadata too
          agentSubType: agentSubType
        },
        mcpIntegration: mcpConfig.enabled ? {
          enabled: true,
          selectedServers: mcpConfig.selectedServers,
          autoDetected: mcpConfig.autoDetected
        } : undefined
      };

      const response = await fetch('http://localhost:3002/api/v1/agents/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      const result = await response.json();

      if (result.success) {
        setCreatedAgentId(result.data?.agentId || result.data?.id || 'created-agent');
        const mcpMessage = mcpConfig.enabled 
          ? ` with ${mcpConfig.selectedServers.length} MCP server${mcpConfig.selectedServers.length !== 1 ? 's' : ''} configured`
          : '';
        setSuccess(`✅ Agent "${agentName}" created successfully${mcpMessage}!`);
      } else {
        setError(result.error || 'Failed to create agent');
      }
    } catch (error) {
      setError('Failed to create agent: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const applyNameSuggestion = (name: string) => {
    setAgentName(name);
  };

  const getConfidenceColor = (confidence: number, noMatchesFound?: boolean) => {
    // If no matches found, always show success (green) since we're confident about creating new
    if (noMatchesFound) return 'success';
    
    // Confidence is already a percentage (0-100), so divide by 100 for comparison
    const normalizedConfidence = confidence / 100;
    if (normalizedConfidence >= 0.8) return 'success';
    if (normalizedConfidence >= 0.6) return 'warning';
    return 'danger';
  };

  const getConfidenceText = (confidence: number, noMatchesFound?: boolean) => {
    // If no matches found, show clear message instead of percentage
    if (noMatchesFound || confidence === 0) {
      return '✨ Ready to Create New Agent';
    }
    // Display confidence as percentage with proper formatting
    return `${confidence}% Match`;
  };

  // Intelligence sidebar handlers
  const handleAcceptSuggestion = (suggestion: any) => {
    console.log('🎯 Applying suggestion:', suggestion);
    
    switch (suggestion.type) {
      case 'template':
        if (suggestion.actionData?.action === 'use_existing') {
          // "Use This Agent" - Apply existing agent directly
          const agentName = suggestion.title.replace('Use ', '');
          setAgentName(agentName);
          setAgentDescription(suggestion.description.replace('Apply this existing agent to your project', 
            `This agent is based on the existing "${agentName}" with ${suggestion.confidence}% similarity match.`));
          
          // Generate processing logic based on the agent's purpose
          setProcessingLogic(`This agent performs the following operations:

1. Analyze the input data
2. Apply ${agentName.toLowerCase()} processing logic
3. Generate structured output based on the agent's capabilities
4. Return results with analysis metadata

// Based on existing agent: ${agentName}
// Similarity match: ${suggestion.confidence}%`);

          // Set the NLP analysis to reflect the applied agent (prevent re-analysis)
          setNlpAnalysis({
            type: 'code_review', // Set appropriate type based on the agent
            frameworks: ['python'], // Set based on the agent
            languages: ['python'],
            capabilities: ['static_analysis', 'security_check'],
            suggestedTemplates: [agentName],
            confidence: suggestion.confidence, // Use the similarity match as confidence
            keywords: ['code', 'quality', 'analysis']
          });
          
          console.log('✅ Applied existing agent:', agentName);
          
        } else if (suggestion.actionData?.action === 'fork_agent') {
          // "Customize" - Use as template but allow modifications
          const baseAgentName = suggestion.title.replace('Customize ', '').replace('Fork ', '');
          setAgentName(`Custom ${baseAgentName}`);
          setAgentDescription(suggestion.description.replace('Start with this agent and modify it for your needs', 
            `This is a customized version of "${baseAgentName}". Modify as needed for your specific requirements.`));
          
          // Generate customizable processing logic
          setProcessingLogic(`// Customized version of: ${baseAgentName}
// Original similarity: ${Math.round(suggestion.confidence / 0.8)}%

This agent is based on "${baseAgentName}" but can be customized for your specific needs:

1. Analyze the input data (customize input validation here)
2. Apply processing logic (modify the core logic as needed)
3. Generate output (customize output format here)
4. Return results with metadata

// TODO: Customize the processing steps above for your specific use case`);

          // Set the NLP analysis to reflect the customized agent
          setNlpAnalysis({
            type: 'code_review', // Set appropriate type based on the base agent
            frameworks: ['python'], // Set based on the base agent
            languages: ['python'],
            capabilities: ['static_analysis', 'security_check'],
            suggestedTemplates: [baseAgentName],
            confidence: Math.round(suggestion.confidence * 0.8), // Slightly lower confidence for customization
            keywords: ['code', 'quality', 'analysis', 'custom']
          });
          
          console.log('✅ Applied customizable template:', baseAgentName);
          
        } else if (suggestion.actionData?.templateId) {
          // Regular template suggestion
          setAgentName(suggestion.title);
          setAgentDescription(suggestion.description);
        }
        break;
        
      case 'optimization':
        // Apply optimization suggestions to processing logic
        if (suggestion.actionData?.optimizations) {
          const optimizations = suggestion.actionData.optimizations.join(', ');
          setProcessingLogic(prev => prev + `\n\n// Recommended optimizations: ${optimizations}`);
        }
        break;
        
      default:
        console.log('Unknown suggestion type:', suggestion.type);
    }
  };

  // Template selection state
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  // Apply template configuration
  const applyTemplate = (template: any | null) => {
    if (!template) {
      // Custom agent - just close template selector
      setShowTemplateSelector(false);
      setSelectedTemplate(null);
      return;
    }

    setSelectedTemplate(template);
    setShowTemplateSelector(false);

    // Pre-fill agent configuration based on template
    setAgentName(template.name);
    setAgentDescription(template.description);
    
    // Set processing logic based on template
    setProcessingLogic(`// ${template.name} - ${template.useCase}

1. Receive and validate input
2. Process according to ${template.name} logic
3. Generate appropriate response
4. Return results

// Customize the processing steps above for your specific needs`);

    // Apply Vector DB configuration
    if (template.config?.vectorDB?.enabled) {
      setVectorDBConfig({
        enabled: true,
        provider: template.config.vectorDB.provider || 'mock',
        knowledgeBases: template.config.vectorDB.knowledgeBases || [],
        retrievalConfig: template.config.vectorDB.retrievalConfig || {
          topK: 5,
          minSimilarity: 0.7
        }
      });
    } else {
      setVectorDBConfig({
        enabled: false,
        provider: 'mock',
        knowledgeBases: [],
        retrievalConfig: {
          topK: 5,
          minSimilarity: 0.7
        }
      });
    }

    // Apply MCP configuration
    if (template.config?.mcpConfig?.enabled) {
      setMcpConfig({
        enabled: true,
        selectedServers: template.config.mcpConfig.serverId ? [template.config.mcpConfig.serverId] : [],
        autoDetected: false,
        recommendedServers: []
      });
    } else {
      setMcpConfig({
        enabled: false,
        selectedServers: [],
        autoDetected: false,
        recommendedServers: []
      });
    }

    // Apply LLM configuration
    if (template.config?.llmConfig?.model) {
      setSelectedBedrockModel(template.config.llmConfig.model);
      setSelectedBedrockModelName(template.config.llmConfig.model);
    }

    // Set NLP analysis to match template
    setNlpAnalysis({
      type: template.id,
      frameworks: [],
      languages: [],
      capabilities: [],
      suggestedTemplates: [template.name],
      confidence: 100,
      keywords: []
    });

    console.log('✅ Applied template:', template.name);
  };

  // Auto-apply template from navigation state (when coming from /agent-templates page)
  useEffect(() => {
    const state = location.state as any;
    if (state?.selectedTemplate) {
      console.log('🎯 Auto-applying template from navigation:', state.selectedTemplate);
      applyTemplate(state.selectedTemplate);
      // Clear the state to prevent re-applying on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  return (
    <div className="container-fluid py-4">
      <Row>
        <Col lg={8}>
          {/* Configuration Guide */}
          <AgentConfigurationGuide compact={true} />

          {/* Template Selector - Collapsible Section */}
          <Card className="mb-4 border-primary">
            <Card.Header 
              className="bg-light"
              style={{ cursor: 'pointer' }}
              onClick={() => setShowTemplateSelector(!showTemplateSelector)}
            >
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="mb-1">
                    🎯 Quick Start with Templates
                    <Badge bg="secondary" className="ms-2">Optional</Badge>
                  </h5>
                  <small className="text-muted">Choose a pre-configured template or start from scratch</small>
                </div>
                <Button 
                  variant="link" 
                  size="sm"
                  className="text-decoration-none"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowTemplateSelector(!showTemplateSelector);
                  }}
                >
                  {showTemplateSelector ? '▼ Collapse' : '▶ Expand'}
                </Button>
              </div>
            </Card.Header>
            {showTemplateSelector && (
              <Card.Body>
                <AgentTemplateSelector onSelectTemplate={applyTemplate} />
              </Card.Body>
            )}
          </Card>

          {/* Show selected template info */}
          {selectedTemplate && !showTemplateSelector && (
            <Alert variant="success" className="mb-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <strong>{selectedTemplate.icon} Using Template: {selectedTemplate.name}</strong>
                  <div className="small text-muted mt-1">
                    Configuration pre-filled. You can modify any settings below.
                  </div>
                </div>
                <Button 
                  variant="outline-success" 
                  size="sm"
                  onClick={() => setShowTemplateSelector(true)}
                >
                  Change Template
                </Button>
              </div>
            </Alert>
          )}

          <Card>
            <Card.Header className="bg-primary text-white">
              <h4 className="mb-1">🤖 Create Your Agent with Natural Language</h4>
              <p className="mb-0" style={{ fontSize: '0.95rem', opacity: '0.95' }}>
                Describe what you want your agent to do, and we'll configure it automatically
              </p>
            </Card.Header>
            <Card.Body>
              {error && <Alert variant="danger">{error}</Alert>}
              {success && <Alert variant="success">{success}</Alert>}

              {/* Agent Description - Main Input */}
              <Form.Group className="mb-4">
                <Form.Label>
                  <h5>📝 Describe Your Agent</h5>
                  <div className="text-muted" style={{ fontSize: '0.9rem' }}>
                    Tell us what your agent should do in natural language. Be specific about the task, input, and expected output.
                  </div>
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  placeholder="Example: Create a code review agent that analyzes Python code for security vulnerabilities, checks coding standards, and suggests improvements. It should accept code files as input and return a detailed analysis report with recommendations."
                  value={agentDescription}
                  onChange={(e) => setAgentDescription(e.target.value)}
                  className="mb-2"
                />
                <div className="d-flex justify-content-between">
                  <span className="text-muted" style={{ fontSize: '0.85rem' }}>
                    {agentDescription.length}/500 characters
                  </span>
                  {isAnalyzing && (
                    <span className="text-primary" style={{ fontSize: '0.85rem' }}>
                      <Spinner animation="border" size="sm" className="me-1" />
                      Analyzing description...
                    </span>
                  )}
                </div>
              </Form.Group>

              {/* NLP Analysis Results */}
              {nlpAnalysis && (
                <Alert variant={nlpAnalysis.noMatchesFound ? "success" : "info"} className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <strong>{nlpAnalysis.noMatchesFound ? '✨ No Matching Agents Found' : '🔍 Auto-detected Properties'}</strong>
                    <Badge bg={getConfidenceColor(nlpAnalysis.confidence, nlpAnalysis.noMatchesFound)}>
                      {getConfidenceText(nlpAnalysis.confidence, nlpAnalysis.noMatchesFound)}
                    </Badge>
                  </div>
                  {nlpAnalysis.noMatchesFound && (
                    <div className="mb-2 text-muted small">
                      No existing agents match your description. Let's create a new one!
                    </div>
                  )}
                  <Row>
                    <Col md={12}>
                      <div className="mb-2">
                        <strong>Agent Type:</strong>
                        <Badge bg="primary" className="ms-2">{formatAgentType(nlpAnalysis.type)}</Badge>
                      </div>
                      {nlpAnalysis.capabilities.length > 0 && (
                        <div className="mb-2">
                          <strong>Key Capabilities:</strong>
                          <div className="mt-1">
                            {nlpAnalysis.capabilities.slice(0, 3).map(cap => (
                              <Badge key={cap} bg="outline-success" className="me-1 mb-1" style={{fontSize: '0.75rem'}}>
                                {formatCapability(cap)}
                              </Badge>
                            ))}
                            {nlpAnalysis.capabilities.length > 3 && (
                              <Badge bg="outline-secondary" style={{fontSize: '0.75rem'}}>
                                +{nlpAnalysis.capabilities.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </Col>
                  </Row>
                </Alert>
              )}

              {/* Template Suggestions */}
              {templateSuggestions.length > 0 && (
                <Alert variant="success" className="mb-4">
                  <Alert.Heading className="h6">💡 Suggested Templates</Alert.Heading>
                  <div className="d-flex gap-2 flex-wrap">
                    {templateSuggestions.map(template => (
                      <Button 
                        key={template.id}
                        variant="outline-success" 
                        size="sm"
                        onClick={() => applyTemplate(template)}
                      >
                        {template.name}
                        <Badge bg="success" className="ms-1">
                          {template.confidence}%
                        </Badge>
                      </Button>
                    ))}
                  </div>
                </Alert>
              )}

              {/* Agent Name */}
              <Form.Group className="mb-3">
                <Form.Label>
                  <strong>Agent Name</strong> <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter a name for your agent"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                />
                {nameSuggestions.length > 0 && (
                  <div className="mt-2">
                    <span className="text-muted" style={{ fontSize: '0.85rem' }}>Suggestions: </span>
                    {nameSuggestions.map(name => (
                      <Button
                        key={name}
                        variant="outline-primary"
                        size="sm"
                        className="me-1 mb-1"
                        onClick={() => applyNameSuggestion(name)}
                      >
                        {name}
                      </Button>
                    ))}
                  </div>
                )}
              </Form.Group>

              {/* Processing Logic */}
              <Form.Group className="mb-4">
                <Form.Label>
                  <strong>Processing Logic</strong> <span className="text-danger">*</span>
                  <div className="text-muted d-block" style={{ fontSize: '0.9rem' }}>
                    Describe the step-by-step logic for how your agent should process the input
                  </div>
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={6}
                  placeholder="Describe the processing steps:&#10;1. Parse the input data&#10;2. Apply validation rules&#10;3. Process according to business logic&#10;4. Format the output&#10;5. Return results with metadata"
                  value={processingLogic}
                  onChange={(e) => setProcessingLogic(e.target.value)}
                />
              </Form.Group>

              {/* MCP Integration Configuration */}
              <MCPAgentCreationStep
                agentType={nlpAnalysis?.type || manualType || 'Custom'}
                agentDescription={agentDescription}
                onMCPConfigChange={setMcpConfig}
                initialConfig={mcpConfig}
              />

              {/* Bedrock Model Selection */}
              <Card className="mb-3">
                <Card.Header>
                  <strong>AI Model</strong>
                </Card.Header>
                <Card.Body>
                  <BedrockModelSelector
                    selectedModel={selectedBedrockModel}
                    onModelChange={(modelId, modelName) => {
                      setSelectedBedrockModel(modelId);
                      setSelectedBedrockModelName(modelName);
                    }}
                    agentType={nlpAnalysis?.type?.toLowerCase() || 'custom'}
                    label=""
                    required={true}
                  />
                </Card.Body>
              </Card>

              {/* Vector DB Configuration */}
              <div className="mt-3">
                <VectorDBConfigSection
                  config={vectorDBConfig}
                  onChange={setVectorDBConfig}
                  onCostChange={setVectorDBCost}
                  onLatencyChange={setVectorDBLatency}
                />
              </div>

              {/* Test Recommendation Section */}
              <div className="mt-3">
                <TestRecommendationSection
                  category={agentCategory}
                  agentSubType={agentSubType}
                  onCategoryChange={setAgentCategory}
                  onAgentSubTypeChange={setAgentSubType}
                  disabled={loading}
                />
              </div>

              {/* Advanced Configuration */}
              <Accordion className="mt-4">
                <Accordion.Item eventKey="0">
                  <Accordion.Header>
                    ⚙️ Advanced Configuration (Optional)
                  </Accordion.Header>
                  <Accordion.Body>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Override Auto-detected Type</Form.Label>
                          <Form.Select 
                            value={manualType} 
                            onChange={(e) => setManualType(e.target.value)}
                          >
                            <option value="">
                              Use Auto-detected ({nlpAnalysis?.type || 'Custom'})
                            </option>
                            <option value="QE">QE/Testing</option>
                            <option value="DevOps">DevOps</option>
                            <option value="Security">Security</option>
                            <option value="Business">Business</option>
                            <option value="Code Review">Code Review</option>
                            <option value="Data Processing">Data Processing</option>
                            <option value="Custom">Custom</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Additional Frameworks</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="e.g., React, Docker, AWS"
                            value={manualFrameworks.join(', ')}
                            onChange={(e) => setManualFrameworks(
                              e.target.value.split(',').map(f => f.trim()).filter(f => f)
                            )}
                          />
                          <Form.Text className="text-muted">
                            Comma-separated list of additional frameworks
                          </Form.Text>
                        </Form.Group>
                      </Col>
                    </Row>
                  </Accordion.Body>
                </Accordion.Item>
              </Accordion>

              {/* Intelligence Assistant Button */}
              {!createdAgentId ? (
                <div className="d-flex gap-2 mt-4">
                  <Button
                    variant="outline-primary"
                    onClick={() => setIntelligenceSidebarOpen(true)}
                    disabled={!agentDescription}
                  >
                    🧠 Get AI Suggestions
                  </Button>
                  <div className="flex-grow-1">
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={handleCreateAgent}
                      disabled={loading || !agentName || !agentDescription || !processingLogic}
                      className="w-100"
                    >
                      {loading ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Creating Agent...
                        </>
                      ) : (
                        '🚀 Create Agent'
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-4">
                  <Alert variant="success" className="mb-3">
                    <strong>✅ Agent Created Successfully!</strong>
                    <p className="mb-0">Your NLP-powered agent "{agentName}" has been created. Test it before deploying!</p>
                  </Alert>
                  <div className="d-flex gap-2">
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={() => setShowTestingModal(true)}
                      className="flex-grow-1"
                    >
                      🧪 Test Agent
                    </Button>
                    <Button
                      variant="outline-primary"
                      size="lg"
                      onClick={() => navigate('/agents')}
                    >
                      Go to Catalog
                    </Button>
                    <Button
                      variant="outline-secondary"
                      size="lg"
                      onClick={() => {
                        setCreatedAgentId(null);
                        setAgentName('');
                        setAgentDescription('');
                        setProcessingLogic('');
                        setError(null);
                        setSuccess(null);
                        setNlpAnalysis(null);
                      }}
                    >
                      Create Another
                    </Button>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Sidebar */}
        <Col lg={4}>
          <BedrockStatus />
          
          {/* Tips Card */}
          <Card className="mt-4">
            <Card.Header>
              <h6 className="mb-0">💡 Tips for Better Results</h6>
            </Card.Header>
            <Card.Body>
              <ul className="mb-0" style={{ fontSize: '0.9rem' }}>
                <li><strong>Be specific:</strong> Include input types, processing steps, and expected outputs</li>
                <li><strong>Mention frameworks:</strong> Include technologies like Python, React, Docker, etc.</li>
                <li><strong>Describe the domain:</strong> Testing, security, data processing, etc.</li>
                <li><strong>Include examples:</strong> "processes CSV files and generates reports"</li>
              </ul>
            </Card.Body>
          </Card>

          {/* Example Descriptions */}
          <Card className="mt-3">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h6 className="mb-0">📋 Example Descriptions</h6>
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => {
                  console.log('Navigating to classic builder...');
                  navigate('/agent-builder-classic');
                }}
                style={{ fontWeight: '500' }}
              >
                🔧 Classic Builder
              </Button>
            </Card.Header>
            <Card.Body>
              <div style={{ fontSize: '0.9rem' }}>
                <div className="mb-2">
                  <strong>Code Review:</strong>
                  <div className="text-muted" style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
                    "Analyze Python code for security vulnerabilities and suggest improvements"
                  </div>
                </div>
                <div className="mb-2">
                  <strong>Testing:</strong>
                  <div className="text-muted" style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
                    "Generate Selenium test cases for web application login flows"
                  </div>
                </div>
                <div className="mb-0">
                  <strong>Data Processing:</strong>
                  <div className="text-muted" style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
                    "Process CSV files, validate data, and generate summary reports"
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

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
            AI Suggestions for Your Agent
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <IntelligenceModal
            context={{
              type: 'agent-builder',
              data: {
                description: agentDescription,
                name: agentName,
                type: nlpAnalysis?.type,
                frameworks: nlpAnalysis?.frameworks,
                processingLogic: processingLogic
              }
            }}
            onAcceptSuggestion={(suggestion) => {
              handleAcceptSuggestion(suggestion);
              setIntelligenceSidebarOpen(false);
            }}
          />
        </Modal.Body>
      </Modal>

      {/* Comprehensive Testing Modal */}
      <Modal show={showTestingModal} onHide={() => setShowTestingModal(false)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>
            🧪 Comprehensive Agent Testing - {agentName}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div>
            {/* Testing Overview */}
            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6>NLP Agent Testing Suite</h6>
                <div className="d-flex gap-2">
                  {testingStatus === 'running' && (
                    <div className="d-flex align-items-center me-3">
                      <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                      <span>Testing... {testProgress}%</span>
                    </div>
                  )}
                  <Button 
                    variant="primary"
                    onClick={() => createdAgentId && runComprehensiveTests(createdAgentId)}
                    disabled={testingStatus === 'running' || !createdAgentId}
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
                  <strong>NLP Agent Testing Suite</strong>
                  <p className="mb-0">
                    Test your NLP-powered agent with comprehensive validation including natural language 
                    processing capabilities, security scanning, performance benchmarks, and integration tests.
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
                <strong>NLP Agent Testing Complete!</strong>
                <div className="mt-2">
                  <div>Total Categories: {comprehensiveTestResults.length}</div>
                  <div>
                    Passed Categories: {comprehensiveTestResults.filter(r => r.status === 'passed').length}/{comprehensiveTestResults.length}
                  </div>
                  {comprehensiveTestResults.every(r => r.status === 'passed') && (
                    <div className="mt-2">
                      <strong>✅ All tests passed! Your NLP agent is ready for deployment.</strong>
                    </div>
                  )}
                </div>
              </Alert>
            )}

            {testingStatus === 'failed' && (
              <Alert variant="warning">
                <strong>Some Tests Failed</strong>
                <p className="mb-0">
                  Review the failed tests above and consider refining your processing logic. 
                  You can still deploy the agent, but it may not function optimally.
                </p>
              </Alert>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowTestingModal(false)}>
            Close
          </Button>
          {testingStatus === 'completed' && comprehensiveTestResults.every(r => r.status === 'passed') && (
            <Button variant="success" onClick={() => {
              setShowTestingModal(false);
              navigate('/agents');
            }}>
              🚀 Deploy to Catalog
            </Button>
          )}
          {testingStatus === 'completed' && !comprehensiveTestResults.every(r => r.status === 'passed') && (
            <>
              <Button variant="warning" onClick={() => createdAgentId && runComprehensiveTests(createdAgentId)}>
                🔄 Retry Tests
              </Button>
              <Button variant="outline-success" onClick={() => {
                setShowTestingModal(false);
                navigate('/agents');
              }}>
                Deploy Anyway
              </Button>
            </>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default NLPAgentBuilder;