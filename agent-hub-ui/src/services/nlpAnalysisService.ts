interface NLPAnalysis {
  type: string;
  frameworks: string[];
  languages: string[];
  capabilities: string[];
  suggestedTemplates: string[];
  confidence: number;
  keywords: string[];
}

interface TemplateMatch {
  id: string;
  name: string;
  description: string;
  confidence: number;
}

class NLPAnalysisService {
  private typeKeywords: { [key: string]: string[] } = {
    'QE': [
      'test', 'testing', 'qa', 'quality assurance', 'automation', 'selenium', 'cypress', 
      'playwright', 'junit', 'pytest', 'test case', 'test suite', 'bug', 'defect',
      'regression', 'integration test', 'unit test', 'e2e', 'end-to-end', 'failure analysis'
    ],
    'DevOps': [
      'deploy', 'deployment', 'infrastructure', 'docker', 'kubernetes', 'ci/cd', 'pipeline',
      'monitoring', 'logging', 'metrics', 'aws', 'azure', 'gcp', 'terraform', 'ansible',
      'jenkins', 'github actions', 'build', 'release', 'container', 'orchestration'
    ],
    'Security': [
      'security', 'vulnerability', 'scan', 'penetration', 'audit', 'compliance', 'encryption',
      'authentication', 'authorization', 'firewall', 'threat', 'malware', 'owasp', 'ssl',
      'certificate', 'access control', 'security policy', 'risk assessment'
    ],
    'Business': [
      'analytics', 'business', 'report', 'dashboard', 'metrics', 'kpi', 'revenue', 'sales',
      'customer', 'marketing', 'finance', 'roi', 'conversion', 'analysis', 'insights',
      'data visualization', 'business intelligence', 'forecasting'
    ],
    'Code Review': [
      'code review', 'code analysis', 'static analysis', 'code quality', 'refactor',
      'best practices', 'code standards', 'linting', 'code smell', 'technical debt',
      'peer review', 'pull request', 'merge request', 'code inspection'
    ],
    'Data Processing': [
      'data', 'processing', 'etl', 'transform', 'parse', 'extract', 'clean', 'normalize',
      'database', 'sql', 'nosql', 'csv', 'json', 'xml', 'api', 'integration'
    ]
  };

  private frameworkKeywords: { [key: string]: string[] } = {
    'Python': ['python', 'pytest', 'django', 'flask', 'pandas', 'numpy', 'fastapi'],
    'JavaScript': ['javascript', 'js', 'node', 'react', 'vue', 'angular', 'express', 'cypress'],
    'Java': ['java', 'spring', 'junit', 'maven', 'gradle', 'selenium'],
    'C#': ['c#', 'csharp', '.net', 'dotnet', 'asp.net', 'nunit'],
    'Go': ['go', 'golang', 'gin', 'gorilla'],
    'Selenium': ['selenium', 'webdriver', 'browser automation'],
    'Cypress': ['cypress', 'e2e testing'],
    'Playwright': ['playwright', 'browser testing'],
    'Docker': ['docker', 'container', 'dockerfile'],
    'Kubernetes': ['kubernetes', 'k8s', 'kubectl', 'helm'],
    'AWS': ['aws', 'lambda', 'ec2', 's3', 'cloudformation'],
    'Terraform': ['terraform', 'infrastructure as code', 'iac']
  };

  private templates = [
    {
      id: 'qe-test-generator',
      name: 'QE Test Generator',
      description: 'Generates automated test cases and test suites',
      keywords: ['test', 'automation', 'qa', 'testing', 'test case']
    },
    {
      id: 'code-reviewer',
      name: 'Code Review Agent',
      description: 'Analyzes code quality and provides improvement suggestions',
      keywords: ['code review', 'code analysis', 'quality', 'refactor', 'best practices']
    },
    {
      id: 'security-scanner',
      name: 'Security Scanner',
      description: 'Scans for security vulnerabilities and compliance issues',
      keywords: ['security', 'vulnerability', 'scan', 'audit', 'compliance']
    },
    {
      id: 'devops-monitor',
      name: 'DevOps Monitor',
      description: 'Monitors infrastructure and deployment pipelines',
      keywords: ['devops', 'monitoring', 'infrastructure', 'deployment', 'pipeline']
    },
    {
      id: 'data-processor',
      name: 'Data Processor',
      description: 'Processes and transforms data from various sources',
      keywords: ['data', 'processing', 'transform', 'etl', 'parse']
    },
    {
      id: 'business-analyzer',
      name: 'Business Analyzer',
      description: 'Analyzes business metrics and generates insights',
      keywords: ['business', 'analytics', 'metrics', 'insights', 'report']
    }
  ];

  /**
   * Analyze description and extract agent properties
   */
  async analyzeDescription(description: string): Promise<NLPAnalysis> {
    const lowerDesc = description.toLowerCase();
    
    // Extract keywords
    const keywords = this.extractKeywords(lowerDesc);
    
    // Detect type
    const type = this.detectType(lowerDesc, keywords);
    
    // Detect frameworks and languages
    const frameworks = this.detectFrameworks(lowerDesc);
    const languages = this.detectLanguages(lowerDesc);
    
    // Generate capabilities
    const capabilities = this.generateCapabilities(lowerDesc, type, frameworks);
    
    // Find matching templates
    const suggestedTemplates = this.findMatchingTemplates(lowerDesc, keywords);
    
    // Calculate confidence
    const confidence = this.calculateConfidence(lowerDesc, type, frameworks, capabilities);

    return {
      type,
      frameworks,
      languages,
      capabilities,
      suggestedTemplates: suggestedTemplates.map(t => t.id),
      confidence,
      keywords
    };
  }

  private extractKeywords(description: string): string[] {
    const keywords: string[] = [];
    
    // Extract all keywords from all categories
    Object.values(this.typeKeywords).flat().forEach(keyword => {
      if (description.includes(keyword)) {
        keywords.push(keyword);
      }
    });
    
    Object.values(this.frameworkKeywords).flat().forEach(keyword => {
      if (description.includes(keyword)) {
        keywords.push(keyword);
      }
    });
    
    return Array.from(new Set(keywords)); // Remove duplicates
  }

  private detectType(description: string, keywords: string[]): string {
    const typeScores: { [key: string]: number } = {};
    
    // Score each type based on keyword matches
    Object.entries(this.typeKeywords).forEach(([type, typeKeywords]) => {
      typeScores[type] = 0;
      typeKeywords.forEach(keyword => {
        if (description.includes(keyword)) {
          // Give higher score for exact matches
          typeScores[type] += keyword.length > 5 ? 2 : 1;
        }
      });
    });
    
    // Find the type with highest score
    const maxScore = Math.max(...Object.values(typeScores));
    const detectedType = Object.entries(typeScores).find(([_, score]) => score === maxScore)?.[0];
    
    return detectedType && maxScore > 0 ? detectedType : 'Custom';
  }

  private detectFrameworks(description: string): string[] {
    const frameworks: string[] = [];
    
    Object.entries(this.frameworkKeywords).forEach(([framework, keywords]) => {
      const hasMatch = keywords.some(keyword => description.includes(keyword));
      if (hasMatch) {
        frameworks.push(framework);
      }
    });
    
    return frameworks;
  }

  private detectLanguages(description: string): string[] {
    const languages = ['Python', 'JavaScript', 'Java', 'C#', 'Go'];
    return languages.filter(lang => 
      this.frameworkKeywords[lang as keyof typeof this.frameworkKeywords]?.some((keyword: string) => description.includes(keyword))
    );
  }

  private generateCapabilities(description: string, type: string, frameworks: string[]): string[] {
    const capabilities: string[] = [];
    
    // Base capabilities by type
    const typeCapabilities: { [key: string]: string[] } = {
      'QE': ['test_generation', 'test_execution', 'failure_analysis', 'test_reporting'],
      'DevOps': ['deployment', 'monitoring', 'infrastructure_management', 'ci_cd'],
      'Security': ['vulnerability_scanning', 'security_audit', 'compliance_check', 'threat_analysis'],
      'Business': ['data_analysis', 'reporting', 'metrics_calculation', 'insights_generation'],
      'Code Review': ['code_analysis', 'quality_assessment', 'best_practices_check', 'refactoring_suggestions'],
      'Data Processing': ['data_extraction', 'data_transformation', 'data_validation', 'data_integration']
    };
    
    // Add type-specific capabilities
    if (typeCapabilities[type]) {
      capabilities.push(...typeCapabilities[type]);
    }
    
    // Add framework-specific capabilities
    frameworks.forEach(framework => {
      capabilities.push(`${framework.toLowerCase()}_support`);
    });
    
    // Add description-specific capabilities
    if (description.includes('api')) capabilities.push('api_integration');
    if (description.includes('database')) capabilities.push('database_operations');
    if (description.includes('report')) capabilities.push('report_generation');
    if (description.includes('notification')) capabilities.push('notification_system');
    
    return Array.from(new Set(capabilities)); // Remove duplicates
  }

  private findMatchingTemplates(description: string, keywords: string[]): TemplateMatch[] {
    const matches: TemplateMatch[] = [];
    
    this.templates.forEach(template => {
      let score = 0;
      template.keywords.forEach(keyword => {
        if (description.includes(keyword)) {
          score += 1;
        }
      });
      
      if (score > 0) {
        matches.push({
          ...template,
          confidence: Math.min(score / template.keywords.length, 1)
        });
      }
    });
    
    // Sort by confidence and return top 3
    return matches
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3);
  }

  private calculateConfidence(description: string, type: string, frameworks: string[], capabilities: string[]): number {
    let confidence = 0;
    
    // Base confidence from description length
    if (description.length > 50) confidence += 0.2;
    if (description.length > 100) confidence += 0.2;
    
    // Confidence from type detection
    if (type !== 'Custom') confidence += 0.3;
    
    // Confidence from frameworks
    confidence += Math.min(frameworks.length * 0.1, 0.2);
    
    // Confidence from capabilities
    confidence += Math.min(capabilities.length * 0.05, 0.3);
    
    return Math.min(confidence, 1);
  }

  /**
   * Get template suggestions based on analysis
   */
  getTemplateSuggestions(analysis: NLPAnalysis): TemplateMatch[] {
    return this.templates
      .filter(template => analysis.suggestedTemplates.includes(template.id))
      .map(template => ({
        ...template,
        confidence: 0.8 // Default confidence for suggested templates
      }));
  }

  /**
   * Generate agent name suggestions based on description
   */
  generateNameSuggestions(description: string, analysis: NLPAnalysis): string[] {
    const suggestions: string[] = [];
    const { type, frameworks } = analysis;
    
    // Type-based suggestions
    const typeNames: { [key: string]: string[] } = {
      'QE': ['Test Generator', 'QA Assistant', 'Test Analyzer', 'Quality Inspector'],
      'DevOps': ['Deploy Master', 'Infrastructure Monitor', 'Pipeline Assistant', 'DevOps Helper'],
      'Security': ['Security Scanner', 'Vulnerability Detector', 'Security Auditor', 'Threat Analyzer'],
      'Business': ['Business Analyzer', 'Metrics Dashboard', 'Insights Generator', 'Report Builder'],
      'Code Review': ['Code Reviewer', 'Quality Checker', 'Code Analyzer', 'Review Assistant'],
      'Data Processing': ['Data Processor', 'Data Transformer', 'ETL Assistant', 'Data Pipeline']
    };
    
    if (typeNames[type]) {
      suggestions.push(...typeNames[type]);
    }
    
    // Framework-specific suggestions
    frameworks.forEach(framework => {
      suggestions.push(`${framework} ${type} Agent`);
    });
    
    // Custom suggestions based on keywords
    if (description.includes('monitor')) suggestions.push('Monitor Agent');
    if (description.includes('analyze')) suggestions.push('Analysis Agent');
    if (description.includes('generate')) suggestions.push('Generator Agent');
    
    return Array.from(new Set(suggestions)).slice(0, 5);
  }
}

export const nlpAnalysisService = new NLPAnalysisService();
export type { NLPAnalysis, TemplateMatch };