interface ExecutionAnalysis {
  analysisType: string;
  outputFormat: string;
  parameters: { [key: string]: any };
  confidence: number;
  detectedIntent: string;
  suggestedInputs: string[];
}

interface AgentCapability {
  analysisTypes: Array<{ value: string; label: string }>;
  outputFormats: Array<{ value: string; label: string }>;
  parameters: { [key: string]: any };
}

class NLPExecutionService {
  private agentCapabilities: { [key: string]: AgentCapability } = {
    'Security': {
      analysisTypes: [
        { value: 'vulnerability_scan', label: 'Vulnerability Scan' },
        { value: 'penetration_test', label: 'Penetration Testing' },
        { value: 'compliance_audit', label: 'Compliance Audit' },
        { value: 'threat_analysis', label: 'Threat Analysis' },
        { value: 'security_review', label: 'Security Code Review' }
      ],
      outputFormats: [
        { value: 'detailed_report', label: 'Detailed Security Report' },
        { value: 'executive_summary', label: 'Executive Summary' },
        { value: 'technical_findings', label: 'Technical Findings' },
        { value: 'compliance_checklist', label: 'Compliance Checklist' },
        { value: 'json', label: 'JSON Data' }
      ],
      parameters: {
        scanDepth: ['surface', 'deep', 'comprehensive'],
        includeRemediation: true,
        priorityLevel: ['critical', 'high', 'medium', 'low', 'all']
      }
    },
    'QE': {
      analysisTypes: [
        { value: 'test_generation', label: 'Test Case Generation' },
        { value: 'failure_analysis', label: 'Failure Analysis' },
        { value: 'test_automation', label: 'Test Automation' },
        { value: 'performance_testing', label: 'Performance Testing' },
        { value: 'regression_testing', label: 'Regression Testing' }
      ],
      outputFormats: [
        { value: 'test_suite', label: 'Complete Test Suite' },
        { value: 'test_cases', label: 'Individual Test Cases' },
        { value: 'automation_code', label: 'Automation Code' },
        { value: 'test_report', label: 'Test Execution Report' },
        { value: 'json', label: 'JSON Format' }
      ],
      parameters: {
        framework: ['selenium', 'cypress', 'playwright', 'junit', 'pytest'],
        testType: ['unit', 'integration', 'e2e', 'api', 'performance'],
        coverage: ['basic', 'comprehensive', 'edge_cases']
      }
    },
    'DevOps': {
      analysisTypes: [
        { value: 'infrastructure_analysis', label: 'Infrastructure Analysis' },
        { value: 'deployment_optimization', label: 'Deployment Optimization' },
        { value: 'monitoring_setup', label: 'Monitoring Setup' },
        { value: 'cost_optimization', label: 'Cost Optimization' },
        { value: 'security_hardening', label: 'Security Hardening' }
      ],
      outputFormats: [
        { value: 'infrastructure_report', label: 'Infrastructure Report' },
        { value: 'deployment_plan', label: 'Deployment Plan' },
        { value: 'monitoring_config', label: 'Monitoring Configuration' },
        { value: 'cost_analysis', label: 'Cost Analysis Report' },
        { value: 'json', label: 'JSON Data' }
      ],
      parameters: {
        platform: ['aws', 'azure', 'gcp', 'kubernetes', 'docker'],
        scope: ['single_service', 'microservices', 'full_stack'],
        priority: ['cost', 'performance', 'security', 'reliability']
      }
    },
    'Business': {
      analysisTypes: [
        { value: 'data_analysis', label: 'Data Analysis' },
        { value: 'trend_analysis', label: 'Trend Analysis' },
        { value: 'performance_metrics', label: 'Performance Metrics' },
        { value: 'forecasting', label: 'Business Forecasting' },
        { value: 'competitive_analysis', label: 'Competitive Analysis' }
      ],
      outputFormats: [
        { value: 'executive_dashboard', label: 'Executive Dashboard' },
        { value: 'detailed_report', label: 'Detailed Analysis Report' },
        { value: 'presentation', label: 'Presentation Format' },
        { value: 'csv_export', label: 'CSV Export' },
        { value: 'json', label: 'JSON Data' }
      ],
      parameters: {
        timeframe: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
        granularity: ['high_level', 'detailed', 'granular'],
        includeVisualizations: true
      }
    },
    'Code Review': {
      analysisTypes: [
        { value: 'security_review', label: 'Security Code Review' },
        { value: 'quality_analysis', label: 'Code Quality Analysis' },
        { value: 'performance_review', label: 'Performance Review' },
        { value: 'best_practices', label: 'Best Practices Check' },
        { value: 'refactoring_suggestions', label: 'Refactoring Suggestions' }
      ],
      outputFormats: [
        { value: 'detailed_review', label: 'Detailed Review Report' },
        { value: 'summary_report', label: 'Summary Report' },
        { value: 'inline_comments', label: 'Inline Comments' },
        { value: 'improvement_plan', label: 'Improvement Plan' },
        { value: 'json', label: 'JSON Format' }
      ],
      parameters: {
        language: ['python', 'javascript', 'java', 'csharp', 'go', 'typescript'],
        focusArea: ['security', 'performance', 'maintainability', 'readability'],
        severity: ['critical', 'major', 'minor', 'all']
      }
    },
    'Custom': {
      analysisTypes: [
        { value: 'standard', label: 'Standard Analysis' },
        { value: 'comprehensive', label: 'Comprehensive Analysis' },
        { value: 'custom', label: 'Custom Processing' }
      ],
      outputFormats: [
        { value: 'report', label: 'Standard Report' },
        { value: 'json', label: 'JSON Format' },
        { value: 'custom', label: 'Custom Format' }
      ],
      parameters: {}
    }
  };

  private intentKeywords: { [key: string]: string[] } = {
    // Security keywords
    'vulnerability_scan': ['vulnerability', 'scan', 'security holes', 'exploits', 'cve', 'owasp'],
    'penetration_test': ['penetration', 'pentest', 'ethical hack', 'security test', 'attack simulation'],
    'compliance_audit': ['compliance', 'audit', 'regulation', 'standard', 'policy', 'gdpr', 'hipaa'],
    'threat_analysis': ['threat', 'risk', 'attack vector', 'malware', 'intrusion'],
    
    // QE keywords
    'test_generation': ['generate test', 'create test', 'test case', 'test suite', 'automated test'],
    'failure_analysis': ['failure', 'bug', 'error', 'defect', 'issue', 'problem'],
    'test_automation': ['automate', 'automation', 'selenium', 'cypress', 'playwright'],
    'performance_testing': ['performance', 'load test', 'stress test', 'benchmark'],
    
    // DevOps keywords
    'infrastructure_analysis': ['infrastructure', 'server', 'cloud', 'architecture', 'system'],
    'deployment_optimization': ['deploy', 'deployment', 'release', 'pipeline', 'ci/cd'],
    'monitoring_setup': ['monitor', 'alert', 'logging', 'metrics', 'observability'],
    'cost_optimization': ['cost', 'budget', 'optimize', 'reduce expense', 'savings'],
    
    // Business keywords
    'data_analysis': ['analyze data', 'data analysis', 'insights', 'patterns', 'trends'],
    'performance_metrics': ['metrics', 'kpi', 'performance', 'dashboard', 'tracking'],
    'forecasting': ['forecast', 'predict', 'projection', 'future', 'trend'],
    
    // Code Review keywords
    'security_review': ['security review', 'secure code', 'vulnerability', 'injection'],
    'quality_analysis': ['code quality', 'clean code', 'maintainability', 'technical debt'],
    'performance_review': ['performance', 'optimization', 'efficiency', 'speed'],
    'best_practices': ['best practice', 'standard', 'convention', 'guideline']
  };

  private formatKeywords: { [key: string]: string[] } = {
    'detailed_report': ['detailed', 'comprehensive', 'full report', 'complete analysis'],
    'executive_summary': ['summary', 'executive', 'high level', 'overview', 'brief'],
    'technical_findings': ['technical', 'findings', 'details', 'deep dive'],
    'json': ['json', 'data', 'api', 'structured', 'machine readable'],
    'csv_export': ['csv', 'excel', 'spreadsheet', 'export', 'table'],
    'presentation': ['presentation', 'slides', 'powerpoint', 'visual'],
    'automation_code': ['code', 'script', 'automation', 'executable'],
    'test_suite': ['test suite', 'complete tests', 'full testing'],
    'inline_comments': ['inline', 'comments', 'annotations', 'code comments']
  };

  /**
   * Analyze execution request and extract parameters
   */
  async analyzeExecutionRequest(description: string, agentCategory: string): Promise<ExecutionAnalysis> {
    const lowerDesc = description.toLowerCase();
    const capabilities = this.agentCapabilities[agentCategory] || this.agentCapabilities['Custom'];
    
    // Detect analysis type
    const analysisType = this.detectAnalysisType(lowerDesc, capabilities.analysisTypes);
    
    // Detect output format
    const outputFormat = this.detectOutputFormat(lowerDesc, capabilities.outputFormats);
    
    // Extract parameters
    const parameters = this.extractParameters(lowerDesc, capabilities.parameters, agentCategory);
    
    // Detect intent
    const detectedIntent = this.detectIntent(lowerDesc, analysisType);
    
    // Generate suggested inputs
    const suggestedInputs = this.generateSuggestedInputs(agentCategory, analysisType);
    
    // Calculate confidence
    const confidence = this.calculateExecutionConfidence(lowerDesc, analysisType, outputFormat);

    return {
      analysisType,
      outputFormat,
      parameters,
      confidence,
      detectedIntent,
      suggestedInputs
    };
  }

  private detectAnalysisType(description: string, availableTypes: Array<{ value: string; label: string }>): string {
    let bestMatch = availableTypes[0]?.value || 'standard';
    let highestScore = 0;

    Object.entries(this.intentKeywords).forEach(([intent, keywords]) => {
      const score = keywords.reduce((acc, keyword) => {
        return acc + (description.includes(keyword) ? keyword.length : 0);
      }, 0);

      if (score > highestScore && availableTypes.some(type => type.value === intent)) {
        highestScore = score;
        bestMatch = intent;
      }
    });

    return bestMatch;
  }

  private detectOutputFormat(description: string, availableFormats: Array<{ value: string; label: string }>): string {
    let bestMatch = availableFormats[0]?.value || 'report';
    let highestScore = 0;

    Object.entries(this.formatKeywords).forEach(([format, keywords]) => {
      const score = keywords.reduce((acc, keyword) => {
        return acc + (description.includes(keyword) ? keyword.length : 0);
      }, 0);

      if (score > highestScore && availableFormats.some(fmt => fmt.value === format)) {
        highestScore = score;
        bestMatch = format;
      }
    });

    return bestMatch;
  }

  private extractParameters(description: string, availableParams: { [key: string]: any }, category: string): { [key: string]: any } {
    const parameters: { [key: string]: any } = {};

    // Extract framework/technology
    if (availableParams.framework) {
      const frameworks = availableParams.framework as string[];
      const detectedFramework = frameworks.find(fw => description.includes(fw.toLowerCase()));
      if (detectedFramework) {
        parameters.framework = detectedFramework;
      }
    }

    // Extract language
    if (availableParams.language) {
      const languages = availableParams.language as string[];
      const detectedLanguage = languages.find(lang => description.includes(lang.toLowerCase()));
      if (detectedLanguage) {
        parameters.language = detectedLanguage;
      }
    }

    // Extract platform
    if (availableParams.platform) {
      const platforms = availableParams.platform as string[];
      const detectedPlatform = platforms.find(platform => description.includes(platform.toLowerCase()));
      if (detectedPlatform) {
        parameters.platform = detectedPlatform;
      }
    }

    // Extract priority/severity
    if (availableParams.priority || availableParams.severity) {
      const priorities = (availableParams.priority || availableParams.severity) as string[];
      const detectedPriority = priorities.find(priority => description.includes(priority));
      if (detectedPriority) {
        parameters.priority = detectedPriority;
        parameters.severity = detectedPriority;
      }
    }

    // Extract scope/coverage
    if (availableParams.scope || availableParams.coverage) {
      const scopes = (availableParams.scope || availableParams.coverage) as string[];
      if (description.includes('comprehensive') || description.includes('complete')) {
        parameters.scope = 'comprehensive';
        parameters.coverage = 'comprehensive';
      } else if (description.includes('basic') || description.includes('simple')) {
        parameters.scope = 'basic';
        parameters.coverage = 'basic';
      }
    }

    return parameters;
  }

  private detectIntent(description: string, analysisType: string): string {
    const intents: { [key: string]: string } = {
      'vulnerability_scan': 'Find security vulnerabilities and weaknesses',
      'penetration_test': 'Simulate attacks to test security defenses',
      'compliance_audit': 'Check compliance with regulations and standards',
      'test_generation': 'Generate automated test cases and scenarios',
      'failure_analysis': 'Analyze test failures and identify root causes',
      'infrastructure_analysis': 'Analyze infrastructure setup and configuration',
      'data_analysis': 'Analyze data patterns and generate insights',
      'security_review': 'Review code for security issues and vulnerabilities',
      'quality_analysis': 'Analyze code quality and maintainability'
    };

    return intents[analysisType] || 'Process the input according to agent capabilities';
  }

  private generateSuggestedInputs(category: string, analysisType: string): string[] {
    const suggestions: { [key: string]: { [key: string]: string[] } } = {
      'Security': {
        'vulnerability_scan': [
          'Scan my web application for SQL injection and XSS vulnerabilities',
          'Check my API endpoints for authentication bypass issues',
          'Analyze my Docker containers for security misconfigurations'
        ],
        'compliance_audit': [
          'Audit my system for GDPR compliance requirements',
          'Check HIPAA compliance for healthcare data handling',
          'Verify SOC 2 compliance for our cloud infrastructure'
        ]
      },
      'QE': {
        'test_generation': [
          'Generate Cypress tests for user login and registration flow',
          'Create API tests for REST endpoints with error handling',
          'Generate unit tests for payment processing module'
        ],
        'failure_analysis': [
          'Analyze why my Selenium tests are failing on Chrome browser',
          'Debug API test failures in staging environment',
          'Investigate performance test failures under load'
        ]
      },
      'DevOps': {
        'infrastructure_analysis': [
          'Analyze my AWS infrastructure for cost optimization opportunities',
          'Review Kubernetes cluster configuration for best practices',
          'Assess Docker container security and performance'
        ],
        'monitoring_setup': [
          'Set up monitoring for microservices with alerting rules',
          'Configure logging for distributed applications',
          'Create dashboards for application performance metrics'
        ]
      },
      'Code Review': {
        'security_review': [
          'Review Python Flask application for security vulnerabilities',
          'Analyze JavaScript code for XSS and injection flaws',
          'Check Java Spring Boot code for security best practices'
        ],
        'quality_analysis': [
          'Analyze React components for code quality and maintainability',
          'Review Python code for PEP 8 compliance and best practices',
          'Check TypeScript code for type safety and clean architecture'
        ]
      }
    };

    return suggestions[category]?.[analysisType] || [
      'Describe what you want to analyze or process',
      'Provide specific requirements for the analysis',
      'Include any particular focus areas or constraints'
    ];
  }

  private calculateExecutionConfidence(description: string, analysisType: string, outputFormat: string): number {
    let confidence = 0.3; // Base confidence

    // Confidence from description length
    if (description.length > 20) confidence += 0.2;
    if (description.length > 50) confidence += 0.2;

    // Confidence from keyword matches
    const analysisKeywords = this.intentKeywords[analysisType] || [];
    const matchedKeywords = analysisKeywords.filter((keyword: string) => description.includes(keyword));
    confidence += Math.min(matchedKeywords.length * 0.1, 0.2);

    // Confidence from format detection
    const formatKeywords = this.formatKeywords[outputFormat] || [];
    const matchedFormats = formatKeywords.filter((keyword: string) => description.includes(keyword));
    confidence += Math.min(matchedFormats.length * 0.05, 0.1);

    return Math.min(confidence, 1);
  }

  /**
   * Get available capabilities for an agent category
   */
  getAgentCapabilities(category: string): AgentCapability {
    return this.agentCapabilities[category] || this.agentCapabilities['Custom'];
  }

  /**
   * Generate execution suggestions based on agent type
   */
  getExecutionSuggestions(category: string): string[] {
    const suggestions: { [key: string]: string[] } = {
      'Security': [
        'Scan for OWASP Top 10 vulnerabilities with detailed remediation steps',
        'Perform penetration testing on web application login system',
        'Audit cloud infrastructure for compliance with security standards'
      ],
      'QE': [
        'Generate comprehensive test suite for e-commerce checkout flow',
        'Create API automation tests with data validation and error handling',
        'Analyze test failures and provide root cause analysis with fixes'
      ],
      'DevOps': [
        'Optimize AWS infrastructure costs and provide savings recommendations',
        'Set up monitoring and alerting for microservices architecture',
        'Analyze deployment pipeline and suggest performance improvements'
      ],
      'Business': [
        'Analyze sales data trends and generate quarterly performance report',
        'Create executive dashboard with key business metrics and insights',
        'Forecast revenue growth based on historical data and market trends'
      ],
      'Code Review': [
        'Review Python code for security vulnerabilities and best practices',
        'Analyze JavaScript application for performance optimization opportunities',
        'Check code quality and suggest refactoring improvements'
      ]
    };

    return suggestions[category] || [
      'Describe what you want this agent to analyze or process',
      'Specify the type of output or report you need',
      'Include any specific requirements or constraints'
    ];
  }
}

export const nlpExecutionService = new NLPExecutionService();
export type { ExecutionAnalysis, AgentCapability };