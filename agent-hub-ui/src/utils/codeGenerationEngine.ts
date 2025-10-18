// Core code generation engine with template management and validation

import { ParsedRequirements } from './requirementParser';
import { GenerationContext, TemplateStrategy, Feature, BestPractice } from './contextAnalyzer';

export interface GeneratedCode {
  mainCode: string;
  configFiles: ConfigFile[];
  dependencies: Dependency[];
  documentation: string;
  runInstructions: string[];
  metadata: CodeMetadata;
}

export interface ConfigFile {
  filename: string;
  content: string;
  type: 'json' | 'yaml' | 'ini' | 'js' | 'py' | 'ts' | 'xml' | 'txt';
  description: string;
}

export interface Dependency {
  name: string;
  version?: string;
  type: 'npm' | 'pip' | 'maven' | 'nuget' | 'gem';
  description: string;
}

export interface CodeMetadata {
  generatedAt: Date;
  framework: string;
  language: string;
  testType: string;
  complexity: string;
  features: string[];
  estimatedSetupTime: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export class CodeGenerationEngine {
  /**
   * Generate code based on requirements and context
   */
  static generateCode(
    requirements: ParsedRequirements,
    context: GenerationContext
  ): GeneratedCode {
    // Validate context first
    const validation = this.validateGenerationContext(context);
    if (!validation.valid) {
      throw new Error(`Invalid generation context: ${validation.errors.join(', ')}`);
    }

    // Generate code based on template strategy
    switch (context.templateStrategy) {
      case TemplateStrategy.ENTERPRISE_GRADE:
        return this.generateEnterpriseGradeCode(requirements, context);
      case TemplateStrategy.PRODUCTION_READY:
        return this.generateProductionReadyCode(requirements, context);
      case TemplateStrategy.ENHANCED_TEMPLATE:
        return this.generateEnhancedTemplateCode(requirements, context);
      default:
        return this.generateBasicTemplateCode(requirements, context);
    }
  }

  /**
   * Generate enterprise-grade code with all features
   */
  private static generateEnterpriseGradeCode(
    requirements: ParsedRequirements,
    context: GenerationContext
  ): GeneratedCode {
    const baseCode = this.generateProductionReadyCode(requirements, context);
    
    // Add enterprise features
    const enterpriseFeatures = [
      '# Enterprise Features',
      '# - Advanced error handling and recovery',
      '# - Comprehensive logging and monitoring',
      '# - Performance metrics collection',
      '# - Security scanning integration',
      '# - CI/CD pipeline integration',
      '# - Multi-environment support',
      ''
    ].join('\n');

    return {
      ...baseCode,
      mainCode: enterpriseFeatures + baseCode.mainCode,
      configFiles: [
        ...baseCode.configFiles,
        this.generateCIPipelineConfig(context),
        this.generateDockerConfig(context),
        this.generateSecurityConfig(context)
      ],
      dependencies: [
        ...baseCode.dependencies,
        { name: 'docker', type: 'npm', description: 'Container support' },
        { name: 'security-scanner', type: 'npm', description: 'Security scanning' }
      ],
      metadata: {
        ...baseCode.metadata,
        complexity: 'Enterprise',
        estimatedSetupTime: '2-4 hours'
      }
    };
  }

  /**
   * Generate production-ready code with best practices
   */
  private static generateProductionReadyCode(
    requirements: ParsedRequirements,
    context: GenerationContext
  ): GeneratedCode {
    const baseCode = this.generateEnhancedTemplateCode(requirements, context);
    
    // Add production features
    const productionFeatures = [
      '# Production-Ready Features',
      '# - Comprehensive error handling',
      '# - Structured logging',
      '# - Configuration management',
      '# - Test reporting',
      '# - Parallel execution support',
      ''
    ].join('\n');

    return {
      ...baseCode,
      mainCode: productionFeatures + baseCode.mainCode,
      configFiles: [
        ...baseCode.configFiles,
        this.generateLoggingConfig(context),
        this.generateReportingConfig(context)
      ],
      dependencies: [
        ...baseCode.dependencies,
        { name: 'logging-framework', type: 'npm', description: 'Advanced logging' },
        { name: 'test-reporter', type: 'npm', description: 'Test reporting' }
      ],
      metadata: {
        ...baseCode.metadata,
        complexity: 'Production',
        estimatedSetupTime: '1-2 hours'
      }
    };
  }

  /**
   * Generate enhanced template code with additional features
   */
  private static generateEnhancedTemplateCode(
    requirements: ParsedRequirements,
    context: GenerationContext
  ): GeneratedCode {
    const baseCode = this.generateBasicTemplateCode(requirements, context);
    
    // Add enhanced features
    const enhancedFeatures = [
      '# Enhanced Features',
      '# - Page Object Model',
      '# - Custom utilities',
      '# - Better error handling',
      '# - Configuration support',
      ''
    ].join('\n');

    return {
      ...baseCode,
      mainCode: enhancedFeatures + baseCode.mainCode,
      configFiles: [
        ...baseCode.configFiles,
        this.generateConfigFile(context)
      ],
      dependencies: [
        ...baseCode.dependencies,
        { name: 'config-loader', type: 'npm', description: 'Configuration management' }
      ],
      metadata: {
        ...baseCode.metadata,
        complexity: 'Enhanced',
        estimatedSetupTime: '30-60 minutes'
      }
    };
  }

  /**
   * Generate basic template code
   */
  private static generateBasicTemplateCode(
    requirements: ParsedRequirements,
    context: GenerationContext
  ): GeneratedCode {
    const framework = this.getFrameworkName(context.outputFormat);
    const language = this.getLanguageName(context.outputFormat);
    
    const basicCode = [
      `# Basic ${framework} Test Template`,
      `# Generated for: ${requirements.domain} domain`,
      `# Complexity: ${requirements.complexity}`,
      '',
      '# TODO: Customize this template for your specific needs',
      '# TODO: Add your test scenarios',
      '# TODO: Configure test data',
      '',
      'class BasicTest:',
      '    def setup_method(self):',
      '        """Setup method for test initialization"""',
      '        pass',
      '',
      '    def test_basic_scenario(self):',
      '        """Basic test scenario"""',
      '        # Add your test logic here',
      '        assert True',
      '',
      '    def teardown_method(self):',
      '        """Cleanup method"""',
      '        pass'
    ].join('\n');

    return {
      mainCode: basicCode,
      configFiles: [
        {
          filename: 'requirements.txt',
          content: this.generateBasicDependencies(context).map(d => `${d.name}${d.version ? '==' + d.version : ''}`).join('\n'),
          type: 'txt' as const,
          description: 'Python dependencies'
        }
      ],
      dependencies: this.generateBasicDependencies(context),
      documentation: this.generateBasicDocumentation(requirements, context),
      runInstructions: this.generateBasicRunInstructions(context),
      metadata: {
        generatedAt: new Date(),
        framework,
        language,
        testType: context.agentType,
        complexity: 'Basic',
        features: context.requiredFeatures.map(f => f.toString()),
        estimatedSetupTime: '15-30 minutes'
      }
    };
  }

  /**
   * Validate generation context
   */
  private static validateGenerationContext(context: GenerationContext): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Required field validation
    if (!context.agentType) errors.push('Agent type is required');
    if (!context.outputFormat) errors.push('Output format is required');
    if (!context.templateStrategy) errors.push('Template strategy is required');

    // Feature compatibility validation
    if (context.requiredFeatures.includes(Feature.MOBILE_SUPPORT)) {
      if (context.outputFormat.toString().includes('cypress')) {
        warnings.push('Cypress has limited mobile testing support');
        suggestions.push('Consider using Playwright or Selenium for mobile testing');
      }
    }

    // Best practice recommendations
    if (!context.bestPractices.includes(BestPractice.CLEAN_CODE)) {
      suggestions.push('Consider adding error handling for more robust tests');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  /**
   * Generate configuration file
   */
  private static generateConfigFile(context: GenerationContext): ConfigFile {
    const config = {
      framework: this.getFrameworkName(context.outputFormat),
      timeout: 30000,
      retries: 2,
      parallel: context.requiredFeatures.includes(Feature.PARALLEL_EXECUTION),
      reporting: context.requiredFeatures.includes(Feature.REPORTING)
    };

    return {
      filename: 'test.config.json',
      content: JSON.stringify(config, null, 2),
      type: 'json',
      description: 'Test configuration file'
    };
  }

  /**
   * Generate logging configuration
   */
  private static generateLoggingConfig(context: GenerationContext): ConfigFile {
    const loggingConfig = {
      version: 1,
      formatters: {
        default: {
          format: '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        }
      },
      handlers: {
        console: {
          class: 'logging.StreamHandler',
          formatter: 'default',
          level: 'INFO'
        },
        file: {
          class: 'logging.FileHandler',
          filename: 'test.log',
          formatter: 'default',
          level: 'DEBUG'
        }
      },
      root: {
        level: 'DEBUG',
        handlers: ['console', 'file']
      }
    };

    return {
      filename: 'logging.json',
      content: JSON.stringify(loggingConfig, null, 2),
      type: 'json',
      description: 'Logging configuration'
    };
  }

  /**
   * Generate reporting configuration
   */
  private static generateReportingConfig(context: GenerationContext): ConfigFile {
    return {
      filename: 'pytest.ini',
      content: [
        '[tool:pytest]',
        'testpaths = tests',
        'python_files = test_*.py',
        'python_classes = Test*',
        'python_functions = test_*',
        'addopts = ',
        '    -v',
        '    --tb=short',
        '    --html=reports/report.html',
        '    --self-contained-html',
        'markers =',
        '    smoke: Smoke tests',
        '    regression: Regression tests'
      ].join('\n'),
      type: 'ini',
      description: 'PyTest configuration with HTML reporting'
    };
  }

  /**
   * Generate CI pipeline configuration
   */
  private static generateCIPipelineConfig(context: GenerationContext): ConfigFile {
    const pipeline = {
      name: 'Test Pipeline',
      on: ['push', 'pull_request'],
      jobs: {
        test: {
          'runs-on': 'ubuntu-latest',
          steps: [
            { uses: 'actions/checkout@v2' },
            { uses: 'actions/setup-python@v2', with: { 'python-version': '3.9' } },
            { run: 'pip install -r requirements.txt' },
            { run: 'pytest --html=reports/report.html' },
            { uses: 'actions/upload-artifact@v2', with: { name: 'test-reports', path: 'reports/' } }
          ]
        }
      }
    };

    return {
      filename: '.github/workflows/test.yml',
      content: JSON.stringify(pipeline, null, 2),
      type: 'yaml',
      description: 'GitHub Actions CI pipeline'
    };
  }

  /**
   * Generate Docker configuration
   */
  private static generateDockerConfig(context: GenerationContext): ConfigFile {
    const dockerfile = [
      'FROM python:3.9-slim',
      '',
      'WORKDIR /app',
      '',
      'COPY requirements.txt .',
      'RUN pip install -r requirements.txt',
      '',
      'COPY . .',
      '',
      'CMD ["pytest", "--html=reports/report.html"]'
    ].join('\n');

    return {
      filename: 'Dockerfile',
      content: dockerfile,
      type: 'txt' as const,
      description: 'Docker configuration for containerized testing'
    };
  }

  /**
   * Generate security configuration
   */
  private static generateSecurityConfig(context: GenerationContext): ConfigFile {
    const securityConfig = {
      security: {
        'dependency-check': true,
        'code-scanning': true,
        'secret-scanning': true
      },
      tools: {
        bandit: { enabled: true },
        safety: { enabled: true },
        semgrep: { enabled: true }
      }
    };

    return {
      filename: 'security.json',
      content: JSON.stringify(securityConfig, null, 2),
      type: 'json',
      description: 'Security scanning configuration'
    };
  }

  /**
   * Generate basic dependencies
   */
  private static generateBasicDependencies(context: GenerationContext): Dependency[] {
    const framework = context.outputFormat.toString();
    
    if (framework.includes('selenium')) {
      return [
        { name: 'selenium', version: '4.15.0', type: 'pip', description: 'Selenium WebDriver' },
        { name: 'pytest', version: '7.4.3', type: 'pip', description: 'Testing framework' },
        { name: 'webdriver-manager', version: '4.0.1', type: 'pip', description: 'WebDriver management' }
      ];
    }
    
    if (framework.includes('cypress')) {
      return [
        { name: 'cypress', version: '13.6.0', type: 'npm', description: 'Cypress testing framework' },
        { name: '@cypress/xpath', type: 'npm', description: 'XPath support for Cypress' }
      ];
    }
    
    return [
      { name: 'pytest', version: '7.4.3', type: 'pip', description: 'Testing framework' }
    ];
  }

  /**
   * Generate basic documentation
   */
  private static generateBasicDocumentation(
    requirements: ParsedRequirements,
    context: GenerationContext
  ): string {
    return [
      `# ${this.getFrameworkName(context.outputFormat)} Test Suite`,
      '',
      '## Overview',
      `This test suite was generated for ${requirements.domain} domain testing.`,
      `Complexity level: ${requirements.complexity}`,
      '',
      '## Features',
      ...context.requiredFeatures.map(f => `- ${f.replace(/_/g, ' ')}`),
      '',
      '## Setup Instructions',
      '1. Install dependencies',
      '2. Configure test environment',
      '3. Run tests',
      '',
      '## Best Practices',
      ...context.bestPractices.map(p => `- ${p.replace(/_/g, ' ')}`),
      ''
    ].join('\n');
  }

  /**
   * Generate basic run instructions
   */
  private static generateBasicRunInstructions(context: GenerationContext): string[] {
    const framework = context.outputFormat.toString();
    
    if (framework.includes('selenium') || framework.includes('pytest')) {
      return [
        'pip install -r requirements.txt',
        'pytest -v --html=reports/report.html',
        'open reports/report.html'
      ];
    }
    
    if (framework.includes('cypress')) {
      return [
        'npm install',
        'npx cypress run',
        'npx cypress open'
      ];
    }
    
    return [
      'Install dependencies',
      'Run tests',
      'View results'
    ];
  }

  /**
   * Get framework name from output format
   */
  private static getFrameworkName(outputFormat: any): string {
    const format = outputFormat.toString();
    if (format.includes('selenium')) return 'Selenium';
    if (format.includes('cypress')) return 'Cypress';
    if (format.includes('playwright')) return 'Playwright';
    if (format.includes('pytest')) return 'PyTest';
    return 'Generic';
  }

  /**
   * Get language name from output format
   */
  private static getLanguageName(outputFormat: any): string {
    const format = outputFormat.toString();
    if (format.includes('python')) return 'Python';
    if (format.includes('js') || format.includes('javascript')) return 'JavaScript';
    if (format.includes('typescript')) return 'TypeScript';
    if (format.includes('java')) return 'Java';
    return 'Generic';
  }
}