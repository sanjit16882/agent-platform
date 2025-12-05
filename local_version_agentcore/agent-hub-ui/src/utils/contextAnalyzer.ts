// Context analyzer for determining optimal code generation strategy

import { ParsedRequirements, ComplexityLevel, Technology } from './requirementParser';

export interface GenerationContext {
  agentType: AgentType;
  outputFormat: OutputFormat;
  complexity: ComplexityLevel;
  requiredFeatures: Feature[];
  bestPractices: BestPractice[];
  templateStrategy: TemplateStrategy;
}

export enum AgentType {
  QE_TESTING = 'qe_testing',
  SECURITY_SCANNING = 'security_scanning',
  DEVOPS_MONITORING = 'devops_monitoring',
  BUSINESS_INTELLIGENCE = 'business_intelligence',
  CUSTOM = 'custom'
}

export enum OutputFormat {
  SELENIUM_PYTHON = 'selenium-python',
  CYPRESS = 'cypress',
  PLAYWRIGHT_JS = 'playwright-js',
  POSTMAN_COLLECTION = 'postman-collection',
  KARATE_FEATURE = 'karate-feature',
  PYTEST = 'pytest',
  ROBOT_FRAMEWORK = 'robot-framework',
  REST_ASSURED = 'rest-assured'
}

export enum Feature {
  PAGE_OBJECT_MODEL = 'page_object_model',
  ERROR_HANDLING = 'error_handling',
  LOGGING = 'logging',
  REPORTING = 'reporting',
  PARALLEL_EXECUTION = 'parallel_execution',
  DATA_DRIVEN = 'data_driven',
  API_INTEGRATION = 'api_integration',
  MOBILE_SUPPORT = 'mobile_support',
  PERFORMANCE_TESTING = 'performance_testing',
  SECURITY_TESTING = 'security_testing'
}

export enum BestPractice {
  EXPLICIT_WAITS = 'explicit_waits',
  PROPER_ASSERTIONS = 'proper_assertions',
  TEST_DATA_MANAGEMENT = 'test_data_management',
  CONFIGURATION_MANAGEMENT = 'configuration_management',
  DEPENDENCY_INJECTION = 'dependency_injection',
  CLEAN_CODE = 'clean_code',
  DOCUMENTATION = 'documentation',
  VERSION_CONTROL = 'version_control'
}

export enum TemplateStrategy {
  BASIC_TEMPLATE = 'basic_template',
  ENHANCED_TEMPLATE = 'enhanced_template',
  PRODUCTION_READY = 'production_ready',
  ENTERPRISE_GRADE = 'enterprise_grade'
}

export class ContextAnalyzer {
  /**
   * Analyze parsed requirements and determine generation context
   */
  static analyzeContext(
    requirements: ParsedRequirements,
    agentType: string,
    outputFormat: string
  ): GenerationContext {
    const mappedAgentType = this.mapAgentType(agentType);
    const mappedOutputFormat = this.mapOutputFormat(outputFormat);
    const requiredFeatures = this.determineRequiredFeatures(requirements, mappedAgentType);
    const bestPractices = this.determineBestPractices(requirements, mappedAgentType);
    const templateStrategy = this.selectTemplateStrategy(requirements, requiredFeatures);

    return {
      agentType: mappedAgentType,
      outputFormat: mappedOutputFormat,
      complexity: requirements.complexity,
      requiredFeatures,
      bestPractices,
      templateStrategy
    };
  }

  /**
   * Map agent ID to AgentType enum
   */
  private static mapAgentType(agentId: string): AgentType {
    if (agentId.includes('qe') || agentId.includes('test')) {
      return AgentType.QE_TESTING;
    }
    if (agentId.includes('security') || agentId.includes('scanner')) {
      return AgentType.SECURITY_SCANNING;
    }
    if (agentId.includes('devops') || agentId.includes('monitor')) {
      return AgentType.DEVOPS_MONITORING;
    }
    if (agentId.includes('business') || agentId.includes('intelligence')) {
      return AgentType.BUSINESS_INTELLIGENCE;
    }
    return AgentType.CUSTOM;
  }

  /**
   * Map output format string to OutputFormat enum
   */
  private static mapOutputFormat(format: string): OutputFormat {
    const formatMap: { [key: string]: OutputFormat } = {
      'selenium-python': OutputFormat.SELENIUM_PYTHON,
      'cypress': OutputFormat.CYPRESS,
      'playwright-js': OutputFormat.PLAYWRIGHT_JS,
      'postman-collection': OutputFormat.POSTMAN_COLLECTION,
      'karate-feature': OutputFormat.KARATE_FEATURE,
      'pytest': OutputFormat.PYTEST,
      'robot-framework': OutputFormat.ROBOT_FRAMEWORK,
      'rest-assured': OutputFormat.REST_ASSURED
    };

    return formatMap[format] || OutputFormat.SELENIUM_PYTHON;
  }

  /**
   * Determine required features based on requirements and agent type
   */
  private static determineRequiredFeatures(
    requirements: ParsedRequirements,
    agentType: AgentType
  ): Feature[] {
    const features: Feature[] = [];

    // Base features for all agent types
    features.push(Feature.ERROR_HANDLING, Feature.LOGGING, Feature.REPORTING);

    // QE Testing specific features
    if (agentType === AgentType.QE_TESTING) {
      features.push(Feature.PAGE_OBJECT_MODEL, Feature.REPORTING);

      // Add features based on test scenarios
      if (requirements.testScenarios.includes('api_testing')) {
        features.push(Feature.API_INTEGRATION);
      }
      if (requirements.testScenarios.includes('mobile_testing')) {
        features.push(Feature.MOBILE_SUPPORT);
      }
      if (requirements.testScenarios.includes('performance_testing')) {
        features.push(Feature.PERFORMANCE_TESTING);
      }

      // Add features based on complexity
      if (requirements.complexity === ComplexityLevel.ADVANCED) {
        features.push(Feature.PARALLEL_EXECUTION, Feature.DATA_DRIVEN);
      }
    }

    // Security scanning features
    if (agentType === AgentType.SECURITY_SCANNING) {
      features.push(Feature.SECURITY_TESTING, Feature.REPORTING);
    }

    // DevOps monitoring features
    if (agentType === AgentType.DEVOPS_MONITORING) {
      features.push(Feature.PERFORMANCE_TESTING, Feature.REPORTING);
    }

    // Business intelligence features
    if (agentType === AgentType.BUSINESS_INTELLIGENCE) {
      features.push(Feature.DATA_DRIVEN, Feature.REPORTING);
    }

    return Array.from(new Set(features)); // Remove duplicates
  }

  /**
   * Determine best practices based on requirements and agent type
   */
  private static determineBestPractices(
    requirements: ParsedRequirements,
    agentType: AgentType
  ): BestPractice[] {
    const practices: BestPractice[] = [];

    // Base best practices for all types
    practices.push(
      BestPractice.CLEAN_CODE,
      BestPractice.DOCUMENTATION,
      BestPractice.CONFIGURATION_MANAGEMENT
    );

    // QE Testing best practices
    if (agentType === AgentType.QE_TESTING) {
      practices.push(
        BestPractice.EXPLICIT_WAITS,
        BestPractice.PROPER_ASSERTIONS,
        BestPractice.TEST_DATA_MANAGEMENT
      );

      // Add practices based on complexity
      if (requirements.complexity !== ComplexityLevel.BASIC) {
        practices.push(BestPractice.DEPENDENCY_INJECTION);
      }
    }

    // Security scanning best practices
    if (agentType === AgentType.SECURITY_SCANNING) {
      practices.push(BestPractice.CONFIGURATION_MANAGEMENT);
    }

    // Add version control for all non-basic implementations
    if (requirements.complexity !== ComplexityLevel.BASIC) {
      practices.push(BestPractice.VERSION_CONTROL);
    }

    return Array.from(new Set(practices)); // Remove duplicates
  }

  /**
   * Select appropriate template strategy based on requirements and features
   */
  private static selectTemplateStrategy(
    requirements: ParsedRequirements,
    features: Feature[]
  ): TemplateStrategy {
    // Determine strategy based on complexity and features
    const featureCount = features.length;
    const { complexity } = requirements;

    if (complexity === ComplexityLevel.ADVANCED && featureCount >= 8) {
      return TemplateStrategy.ENTERPRISE_GRADE;
    }

    if (complexity === ComplexityLevel.INTERMEDIATE || featureCount >= 6) {
      return TemplateStrategy.PRODUCTION_READY;
    }

    if (featureCount >= 4) {
      return TemplateStrategy.ENHANCED_TEMPLATE;
    }

    return TemplateStrategy.BASIC_TEMPLATE;
  }

  /**
   * Get recommended technologies based on context
   */
  static getRecommendedTechnologies(context: GenerationContext): Technology[] {
    const technologies: Technology[] = [];

    switch (context.outputFormat) {
      case OutputFormat.SELENIUM_PYTHON:
        technologies.push(
          { name: 'Selenium', type: 'testing' },
          { name: 'Python', type: 'backend' },
          { name: 'PyTest', type: 'testing' }
        );
        break;

      case OutputFormat.CYPRESS:
        technologies.push(
          { name: 'Cypress', type: 'testing' },
          { name: 'JavaScript', type: 'frontend' },
          { name: 'Node.js', type: 'backend' }
        );
        break;

      case OutputFormat.PLAYWRIGHT_JS:
        technologies.push(
          { name: 'Playwright', type: 'testing' },
          { name: 'TypeScript', type: 'frontend' },
          { name: 'Node.js', type: 'backend' }
        );
        break;

      default:
        break;
    }

    return technologies;
  }

  /**
   * Validate context for code generation
   */
  static validateContext(context: GenerationContext): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate required fields
    if (!context.agentType) {
      errors.push('Agent type is required');
    }

    if (!context.outputFormat) {
      errors.push('Output format is required');
    }

    // Validate feature compatibility
    if (context.requiredFeatures.includes(Feature.MOBILE_SUPPORT) && 
        context.outputFormat === OutputFormat.CYPRESS) {
      errors.push('Cypress does not support mobile testing');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}