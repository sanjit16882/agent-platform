export interface AgentTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  purpose: string;
  inputSchema: {
    name: string;
    type: string;
    required: boolean;
    description: string;
  }[];
  outputSchema: {
    name: string;
    type: string;
    description: string;
  }[];
  processingLogic: string;
}

export const AGENT_TEMPLATES: AgentTemplate[] = [
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