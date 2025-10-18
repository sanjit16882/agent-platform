// Core requirement parsing utilities for intelligent code generation

export interface ParsedRequirements {
  baseUrl?: string;
  testScenarios: string[];
  technologies: Technology[];
  selectors: SelectorMap;
  workflows: Workflow[];
  domain: string;
  complexity: ComplexityLevel;
}

export interface Technology {
  name: string;
  version?: string;
  framework?: string;
  type: 'frontend' | 'backend' | 'database' | 'testing' | 'deployment' | 'monitoring';
}

export interface SelectorMap {
  [key: string]: string;
}

export interface Workflow {
  name: string;
  steps: string[];
  type: 'login' | 'registration' | 'checkout' | 'api' | 'custom';
}

export enum ComplexityLevel {
  BASIC = 'basic',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced'
}

export class RequirementParser {
  /**
   * Parse user requirements and extract technical specifications
   */
  static parseRequirements(input: string): ParsedRequirements {
    const inputLower = input.toLowerCase();
    
    return {
      baseUrl: this.extractUrls(input)[0],
      testScenarios: this.extractTestScenarios(input),
      technologies: this.identifyTechnologies(input),
      selectors: this.extractSelectors(input),
      workflows: this.detectWorkflows(input),
      domain: this.identifyDomain(input),
      complexity: this.assessComplexity(input)
    };
  }

  /**
   * Extract URLs from requirements text
   */
  static extractUrls(input: string): string[] {
    const urlRegex = /https?:\/\/[^\s\)]+/g;
    const matches = input.match(urlRegex) || [];
    return matches.map(url => url.replace(/[.,;:]$/, '')); // Remove trailing punctuation
  }

  /**
   * Identify test scenarios from requirements
   */
  static extractTestScenarios(input: string): string[] {
    const scenarios: string[] = [];
    const inputLower = input.toLowerCase();

    // Common test scenarios
    const scenarioPatterns = [
      { pattern: /login|authentication|sign.?in/g, scenario: 'login' },
      { pattern: /registration|signup|sign.?up|create.?account/g, scenario: 'registration' },
      { pattern: /checkout|payment|purchase|buy/g, scenario: 'checkout' },
      { pattern: /search|filter|query/g, scenario: 'search' },
      { pattern: /upload|file|attachment/g, scenario: 'file_upload' },
      { pattern: /api|endpoint|rest|graphql/g, scenario: 'api_testing' },
      { pattern: /mobile|app|android|ios/g, scenario: 'mobile_testing' },
      { pattern: /performance|load|stress/g, scenario: 'performance_testing' }
    ];

    scenarioPatterns.forEach(({ pattern, scenario }) => {
      if (pattern.test(inputLower)) {
        scenarios.push(scenario);
      }
    });

    return scenarios.length > 0 ? scenarios : ['general_testing'];
  }

  /**
   * Identify technologies mentioned in requirements
   */
  static identifyTechnologies(input: string): Technology[] {
    const technologies: Technology[] = [];
    const inputLower = input.toLowerCase();

    const techPatterns = [
      // Frontend frameworks
      { pattern: /react|reactjs/g, tech: { name: 'React', type: 'frontend' as const } },
      { pattern: /angular/g, tech: { name: 'Angular', type: 'frontend' as const } },
      { pattern: /vue|vuejs/g, tech: { name: 'Vue.js', type: 'frontend' as const } },
      
      // Testing frameworks
      { pattern: /selenium/g, tech: { name: 'Selenium', type: 'testing' as const } },
      { pattern: /cypress/g, tech: { name: 'Cypress', type: 'testing' as const } },
      { pattern: /playwright/g, tech: { name: 'Playwright', type: 'testing' as const } },
      { pattern: /pytest/g, tech: { name: 'PyTest', type: 'testing' as const } },
      { pattern: /jest/g, tech: { name: 'Jest', type: 'testing' as const } },
      
      // Backend technologies
      { pattern: /node\.?js|nodejs/g, tech: { name: 'Node.js', type: 'backend' as const } },
      { pattern: /python/g, tech: { name: 'Python', type: 'backend' as const } },
      { pattern: /java(?!script)/g, tech: { name: 'Java', type: 'backend' as const } },
      { pattern: /\.net|dotnet|c#/g, tech: { name: '.NET', type: 'backend' as const } },
      
      // Databases
      { pattern: /postgresql|postgres/g, tech: { name: 'PostgreSQL', type: 'database' as const } },
      { pattern: /mysql/g, tech: { name: 'MySQL', type: 'database' as const } },
      { pattern: /mongodb|mongo/g, tech: { name: 'MongoDB', type: 'database' as const } },
      
      // Cloud platforms
      { pattern: /aws|amazon.?web.?services/g, tech: { name: 'AWS', type: 'deployment' as const } },
      { pattern: /azure/g, tech: { name: 'Azure', type: 'deployment' as const } },
      { pattern: /gcp|google.?cloud/g, tech: { name: 'Google Cloud', type: 'deployment' as const } },
      
      // Monitoring
      { pattern: /prometheus/g, tech: { name: 'Prometheus', type: 'monitoring' as const } },
      { pattern: /grafana/g, tech: { name: 'Grafana', type: 'monitoring' as const } },
      { pattern: /cloudwatch/g, tech: { name: 'CloudWatch', type: 'monitoring' as const } }
    ];

    techPatterns.forEach(({ pattern, tech }) => {
      if (pattern.test(inputLower)) {
        technologies.push(tech);
      }
    });

    return technologies;
  }

  /**
   * Extract CSS selectors and element identifiers
   */
  static extractSelectors(input: string): SelectorMap {
    const selectors: SelectorMap = {};
    
    // Extract ID selectors (#id)
    const idMatches = input.match(/#[\w-]+/g) || [];
    idMatches.forEach(match => {
      const id = match.substring(1);
      selectors[id] = match;
    });

    // Extract class selectors (.class)
    const classMatches = input.match(/\.[\w-]+/g) || [];
    classMatches.forEach(match => {
      const className = match.substring(1);
      selectors[className] = match;
    });

    // Extract common form field patterns
    const fieldPatterns = [
      { pattern: /email.?field|email.?input/gi, selector: '#email' },
      { pattern: /password.?field|password.?input/gi, selector: '#password' },
      { pattern: /login.?button|sign.?in.?button/gi, selector: '#login-btn' },
      { pattern: /submit.?button/gi, selector: 'button[type="submit"]' },
      { pattern: /username.?field/gi, selector: '#username' },
      { pattern: /first.?name/gi, selector: '#firstName' },
      { pattern: /last.?name/gi, selector: '#lastName' }
    ];

    fieldPatterns.forEach(({ pattern, selector }) => {
      if (pattern.test(input)) {
        const key = selector.replace(/[#\[\]"=]/g, '').replace(/type/, '');
        selectors[key] = selector;
      }
    });

    return selectors;
  }

  /**
   * Detect workflow patterns in requirements
   */
  static detectWorkflows(input: string): Workflow[] {
    const workflows: Workflow[] = [];
    const inputLower = input.toLowerCase();

    // Login workflow
    if (/login|sign.?in|authentication/.test(inputLower)) {
      workflows.push({
        name: 'Login Flow',
        type: 'login',
        steps: [
          'Navigate to login page',
          'Enter email/username',
          'Enter password',
          'Click login button',
          'Verify successful login'
        ]
      });
    }

    // Registration workflow
    if (/registration|signup|sign.?up|create.?account/.test(inputLower)) {
      workflows.push({
        name: 'Registration Flow',
        type: 'registration',
        steps: [
          'Navigate to registration page',
          'Fill personal information',
          'Enter email and password',
          'Accept terms and conditions',
          'Submit registration form',
          'Verify account creation'
        ]
      });
    }

    // Checkout workflow
    if (/checkout|payment|purchase|buy/.test(inputLower)) {
      workflows.push({
        name: 'Checkout Flow',
        type: 'checkout',
        steps: [
          'Add items to cart',
          'Navigate to checkout',
          'Enter shipping information',
          'Select payment method',
          'Complete payment',
          'Verify order confirmation'
        ]
      });
    }

    // API workflow
    if (/api|endpoint|rest|graphql/.test(inputLower)) {
      workflows.push({
        name: 'API Testing Flow',
        type: 'api',
        steps: [
          'Setup API client',
          'Authenticate if required',
          'Send API requests',
          'Validate responses',
          'Test error scenarios'
        ]
      });
    }

    return workflows;
  }

  /**
   * Identify the domain/industry from requirements
   */
  static identifyDomain(input: string): string {
    const inputLower = input.toLowerCase();

    const domainPatterns = [
      { pattern: /bank|financial|trading|payment|credit|debit/g, domain: 'financial' },
      { pattern: /ecommerce|e-commerce|shop|store|retail|cart|checkout/g, domain: 'ecommerce' },
      { pattern: /health|medical|hospital|patient|hipaa|healthcare/g, domain: 'healthcare' },
      { pattern: /education|school|university|student|learning/g, domain: 'education' },
      { pattern: /social|media|post|comment|like|share/g, domain: 'social_media' },
      { pattern: /saas|software|platform|dashboard|admin/g, domain: 'saas' },
      { pattern: /game|gaming|player|score|level/g, domain: 'gaming' }
    ];

    for (const { pattern, domain } of domainPatterns) {
      if (pattern.test(inputLower)) {
        return domain;
      }
    }

    return 'general';
  }

  /**
   * Assess complexity level of requirements
   */
  static assessComplexity(input: string): ComplexityLevel {
    const inputLower = input.toLowerCase();
    let complexityScore = 0;

    // Complexity indicators
    const complexityFactors = [
      { pattern: /multi.?factor|mfa|2fa|otp/g, score: 2 },
      { pattern: /api|endpoint|integration/g, score: 1 },
      { pattern: /mobile|app|android|ios/g, score: 2 },
      { pattern: /payment|checkout|transaction/g, score: 2 },
      { pattern: /upload|file|attachment/g, score: 1 },
      { pattern: /real.?time|websocket|streaming/g, score: 3 },
      { pattern: /microservice|distributed|cluster/g, score: 3 },
      { pattern: /performance|load|stress|concurrent/g, score: 2 },
      { pattern: /security|encryption|compliance|audit/g, score: 2 },
      { pattern: /workflow|orchestration|pipeline/g, score: 2 }
    ];

    complexityFactors.forEach(({ pattern, score }) => {
      if (pattern.test(inputLower)) {
        complexityScore += score;
      }
    });

    // Determine complexity level
    if (complexityScore >= 8) return ComplexityLevel.ADVANCED;
    if (complexityScore >= 4) return ComplexityLevel.INTERMEDIATE;
    return ComplexityLevel.BASIC;
  }
}