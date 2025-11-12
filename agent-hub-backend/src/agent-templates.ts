export interface AgentTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  purpose?: string;
  inputs?: {
    name: string;
    type: string;
    required: boolean;
    description: string;
    options?: string[];
  }[];
  outputs?: {
    name: string;
    type: string;
    description: string;
  }[];
  inputSchema?: {
    name: string;
    type: string;
    required: boolean;
    description: string;
  }[];
  outputSchema?: {
    name: string;
    type: string;
    description: string;
  }[];
  processingLogic: string;
  tags?: string[];
  supportedTechnologies?: string[];
  estimatedTime?: string;
  complexity?: string;
}

export const AGENT_TEMPLATES: AgentTemplate[] = [
  // Production Agents
  {
    id: 'code-syntax-fixer',
    name: 'Code Syntax Fix Agent',
    description: 'Specialized agent for fixing syntax errors, formatting issues, and code style problems',
    category: 'Development',
    inputs: [
      { name: 'codeContent', type: 'text', required: true, description: 'Code with syntax errors or formatting issues' },
      { name: 'language', type: 'select', required: false, description: 'Programming language', options: ['javascript', 'typescript', 'python', 'java', 'csharp', 'go', 'rust', 'auto-detect'] },
      { name: 'fixType', type: 'select', required: false, description: 'Type of fixes needed', options: ['syntax-errors', 'formatting', 'style', 'all'] }
    ],
    outputs: [
      { name: 'fixedCode', type: 'text', description: 'Code with syntax errors and formatting issues fixed' },
      { name: 'fixesSummary', type: 'array', description: 'List of fixes applied' },
      { name: 'suggestions', type: 'array', description: 'Additional improvement suggestions' }
    ],
    processingLogic: 'production_syntax_fixer',
    tags: ['syntax-fix', 'code-formatting', 'error-fixing', 'code-style', 'linting'],
    supportedTechnologies: ['javascript', 'typescript', 'python', 'java', 'csharp', 'go', 'rust'],
    estimatedTime: '1-2 minutes',
    complexity: 'low'
  },
  {
    id: 'code-review-agent',
    name: 'Code Review Agent',
    description: 'Comprehensive code review and analysis for quality, security, and best practices',
    category: 'Development',
    inputs: [
      { name: 'codeContent', type: 'text', required: true, description: 'Code to review (files, functions, or snippets)' },
      { name: 'reviewType', type: 'select', required: false, description: 'Review focus', options: ['comprehensive', 'security', 'performance', 'style', 'best-practices'] },
      { name: 'language', type: 'select', required: false, description: 'Programming language', options: ['javascript', 'typescript', 'python', 'java', 'csharp', 'go', 'rust', 'auto-detect'] }
    ],
    outputs: [
      { name: 'reviewResults', type: 'object', description: 'Detailed code review findings' },
      { name: 'suggestions', type: 'array', description: 'Improvement suggestions with examples' },
      { name: 'securityIssues', type: 'array', description: 'Security vulnerabilities found' },
      { name: 'qualityScore', type: 'number', description: 'Overall code quality score (0-100)' }
    ],
    processingLogic: 'production_code_review',
    tags: ['code-review', 'security', 'quality', 'analysis', 'best-practices', 'static-analysis'],
    supportedTechnologies: ['javascript', 'typescript', 'python', 'java', 'csharp', 'go', 'rust', 'react', 'node'],
    estimatedTime: '2-4 minutes',
    complexity: 'medium'
  },
  {
    id: 'qe-test-generator-v2',
    name: 'QE Test Case Generator Pro',
    description: 'Advanced test case generation for QE teams with multiple framework support',
    category: 'QE',
    inputs: [
      { name: 'requirements', type: 'text', required: true, description: 'Test requirements or user story' },
      { name: 'outputFormat', type: 'select', required: false, description: 'Test framework', options: ['cypress', 'selenium-python', 'playwright'] }
    ],
    outputs: [
      { name: 'testFiles', type: 'array', description: 'Generated test files' },
      { name: 'configFiles', type: 'array', description: 'Configuration files' },
      { name: 'documentation', type: 'text', description: 'Test documentation' }
    ],
    processingLogic: 'production_qe_generator',
    tags: ['testing', 'automation', 'qe', 'cypress', 'selenium', 'playwright'],
    supportedTechnologies: ['cypress', 'selenium', 'playwright', 'javascript', 'python'],
    estimatedTime: '2-4 minutes',
    complexity: 'medium'
  },
  {
    id: 'devops-monitor-v1',
    name: 'DevOps Infrastructure Monitor',
    description: 'Comprehensive infrastructure monitoring and analysis',
    category: 'DevOps',
    inputs: [
      { name: 'infrastructureData', type: 'text', required: true, description: 'Infrastructure configuration or logs' },
      { name: 'analysisType', type: 'select', required: false, description: 'Analysis type', options: ['performance', 'security', 'cost', 'compliance'] }
    ],
    outputs: [
      { name: 'analysis', type: 'object', description: 'Infrastructure analysis results' },
      { name: 'recommendations', type: 'array', description: 'Improvement recommendations' }
    ],
    processingLogic: 'production_devops_monitor',
    tags: ['devops', 'monitoring', 'infrastructure', 'performance', 'security'],
    supportedTechnologies: ['kubernetes', 'docker', 'aws', 'azure', 'gcp'],
    estimatedTime: '3-5 minutes',
    complexity: 'high'
  },
  {
    id: 'security-scanner-pro',
    name: 'Security Vulnerability Scanner',
    description: 'Advanced security scanning and vulnerability assessment',
    category: 'Security',
    inputs: [
      { name: 'codeOrConfig', type: 'text', required: true, description: 'Code or configuration to scan' }
    ],
    outputs: [
      { name: 'vulnerabilities', type: 'array', description: 'Detected vulnerabilities' },
      { name: 'complianceReport', type: 'object', description: 'Compliance assessment' }
    ],
    processingLogic: 'production_security_scanner',
    tags: ['security', 'vulnerability', 'compliance', 'scanning'],
    supportedTechnologies: ['javascript', 'python', 'java', 'docker', 'kubernetes'],
    estimatedTime: '2-3 minutes',
    complexity: 'medium'
  },
  {
    id: 'business-analyzer',
    name: 'Business Intelligence Analyzer',
    description: 'Business data analysis and insights generation',
    category: 'Business',
    inputs: [
      { name: 'businessData', type: 'text', required: true, description: 'Business data or requirements' }
    ],
    outputs: [
      { name: 'insights', type: 'array', description: 'Business insights' },
      { name: 'recommendations', type: 'array', description: 'Business recommendations' }
    ],
    processingLogic: 'production_business_analyzer',
    tags: ['business', 'analytics', 'insights', 'intelligence'],
    supportedTechnologies: ['data-analysis', 'reporting', 'visualization'],
    estimatedTime: '1-2 minutes',
    complexity: 'low'
  },
  {
    id: 'email-rephraser',
    name: 'Email Rephraser Agent',
    category: 'Communication',
    description: 'Rephrases email content to be more professional and clear',
    purpose: 'Transform casual or unclear email content into professional, well-structured communication',
    inputSchema: [
      {
        name: 'email_content',
        type: 'string',
        required: true,
        description: 'The original email content to be rephrased'
      },
      {
        name: 'tone',
        type: 'string',
        required: false,
        description: 'Desired tone: professional, friendly, formal, casual'
      }
    ],
    outputSchema: [
      {
        name: 'rephrased_content',
        type: 'string',
        description: 'The professionally rephrased email content'
      },
      {
        name: 'improvements_made',
        type: 'array',
        description: 'List of specific improvements made to the original content'
      }
    ],
    processingLogic: 'email_rephrasing'
  },
  {
    id: 'selenium-code-generator',
    name: 'Selenium Code Generator Agent',
    category: 'Test Automation',
    description: 'Generates Selenium test code in specified programming language',
    purpose: 'Create functional Selenium test scripts based on user requirements and target language',
    inputSchema: [
      {
        name: 'test_requirements',
        type: 'string',
        required: true,
        description: 'Description of what the test should do'
      },
      {
        name: 'programming_language',
        type: 'string',
        required: true,
        description: 'Target programming language: Java, Python, C#, JavaScript'
      },
      {
        name: 'target_url',
        type: 'string',
        required: false,
        description: 'URL of the application to test'
      }
    ],
    outputSchema: [
      {
        name: 'test_code',
        type: 'string',
        description: 'Complete Selenium test code in the specified language'
      },
      {
        name: 'dependencies',
        type: 'array',
        description: 'Required dependencies and imports'
      },
      {
        name: 'setup_instructions',
        type: 'string',
        description: 'Instructions for running the generated test'
      }
    ],
    processingLogic: 'selenium_code_generation'
  },
  {
    id: 'devops-monitoring',
    name: 'DevOps Monitoring Agent',
    category: 'DevOps',
    description: 'Generates monitoring configurations and alerts for infrastructure',
    purpose: 'Create comprehensive monitoring solutions for DevOps infrastructure and applications',
    inputSchema: [
      {
        name: 'infrastructure_type',
        type: 'string',
        required: true,
        description: 'Type of infrastructure: AWS, Azure, GCP, Kubernetes, Docker'
      },
      {
        name: 'services_to_monitor',
        type: 'array',
        required: true,
        description: 'List of services or components to monitor'
      },
      {
        name: 'alert_thresholds',
        type: 'object',
        required: false,
        description: 'Custom alert thresholds for metrics'
      }
    ],
    outputSchema: [
      {
        name: 'monitoring_config',
        type: 'string',
        description: 'Complete monitoring configuration file'
      },
      {
        name: 'alert_rules',
        type: 'array',
        description: 'Configured alert rules and thresholds'
      },
      {
        name: 'dashboard_config',
        type: 'string',
        description: 'Dashboard configuration for visualization'
      }
    ],
    processingLogic: 'devops_monitoring'
  },
  {
    id: 'api-documentation-generator',
    name: 'API Documentation Generator Agent',
    category: 'Development',
    description: 'Generates comprehensive API documentation from code or specifications',
    purpose: 'Create detailed, user-friendly API documentation with examples and usage guidelines',
    inputSchema: [
      {
        name: 'api_specification',
        type: 'string',
        required: true,
        description: 'API specification, code, or endpoint descriptions'
      },
      {
        name: 'documentation_format',
        type: 'string',
        required: true,
        description: 'Output format: OpenAPI, Markdown, HTML, Postman Collection'
      }
    ],
    outputSchema: [
      {
        name: 'documentation',
        type: 'string',
        description: 'Complete API documentation in requested format'
      },
      {
        name: 'examples',
        type: 'array',
        description: 'Code examples and usage samples'
      }
    ],
    processingLogic: 'api_documentation'
  },
  {
    id: 'data-validator',
    name: 'Data Validation Agent',
    category: 'Data Processing',
    description: 'Validates data against specified rules and formats',
    purpose: 'Ensure data quality and compliance with defined validation rules and business logic',
    inputSchema: [
      {
        name: 'data_input',
        type: 'string',
        required: true,
        description: 'Data to be validated (JSON, CSV, XML, etc.)'
      },
      {
        name: 'validation_rules',
        type: 'array',
        required: true,
        description: 'List of validation rules to apply'
      },
      {
        name: 'data_format',
        type: 'string',
        required: true,
        description: 'Input data format: JSON, CSV, XML, SQL'
      }
    ],
    outputSchema: [
      {
        name: 'validation_results',
        type: 'object',
        description: 'Detailed validation results with pass/fail status'
      },
      {
        name: 'errors_found',
        type: 'array',
        description: 'List of validation errors with line numbers and descriptions'
      },
      {
        name: 'corrected_data',
        type: 'string',
        description: 'Data with corrections applied where possible'
      }
    ],
    processingLogic: 'data_validation'
  }
];