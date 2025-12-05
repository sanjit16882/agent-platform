// Template Service for Rapid Prototyping & Template System
// Provides comprehensive template management with governance and compliance

export interface TemplateParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'multiselect' | 'file' | 'secret';
  description: string;
  defaultValue?: any;
  required: boolean;
  validation?: ValidationRule[];
  options?: ParameterOption[];
  conditional?: ConditionalLogic;
  compliance?: ComplianceRule[];
}

export interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'url' | 'email' | 'custom';
  value?: any;
  message: string;
}

export interface ParameterOption {
  label: string;
  value: any;
  description?: string;
  disabled?: boolean;
}

export interface ConditionalLogic {
  showIf?: string; // JavaScript expression
  hideIf?: string;
  requiredIf?: string;
}

export interface ComplianceRule {
  policyId: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  description: string;
}

export interface TemplateDependency {
  name: string;
  version: string;
  type: 'npm' | 'pip' | 'maven' | 'docker' | 'system';
  optional: boolean;
  securityScan?: SecurityScanResult;
}

export interface SecurityScanResult {
  status: 'Clean' | 'Warning' | 'Vulnerable';
  vulnerabilities: number;
  lastScanned: Date;
}

export interface SampleOutput {
  name: string;
  description: string;
  content: string;
  type: 'json' | 'xml' | 'text' | 'html' | 'csv';
}

export interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  category: 'QE' | 'DevOps' | 'Security' | 'Business';
  version: string;
  author: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Template Configuration
  complexity: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedSetupTime: number; // minutes
  tags: string[];
  
  // Technical Details
  technologies: string[];
  dependencies: TemplateDependency[];
  parameters: TemplateParameter[];
  
  // Content
  codeTemplate: string;
  configTemplate: object;
  documentation: string;
  sampleOutputs: SampleOutput[];
  
  // Governance
  approvalStatus: 'Draft' | 'Pending' | 'Approved' | 'Rejected';
  complianceStatus: 'Compliant' | 'Non-Compliant' | 'Under-Review';
  approvedBy?: string;
  approvedAt?: Date;
  
  // Metadata
  usageCount: number;
  rating: number;
  lastUsed: Date;
  isActive: boolean;
  
  // Version Control
  versionHistory: TemplateVersion[];
  parentVersion?: string;
}

export interface TemplateVersion {
  version: string;
  changes: ChangeLog[];
  author: string;
  createdAt: Date;
  commitMessage: string;
  tags: string[];
  isActive: boolean;
}

export interface ChangeLog {
  type: 'Added' | 'Modified' | 'Removed' | 'Fixed';
  component: string;
  description: string;
  impact: 'Low' | 'Medium' | 'High';
}

export interface TemplateFilters {
  category?: string[];
  complexity?: string[];
  technologies?: string[];
  approvalStatus?: string[];
  complianceStatus?: string[];
  tags?: string[];
  author?: string;
  minRating?: number;
  maxSetupTime?: number;
}

export interface TemplateAnalytics {
  templateId: string;
  usageStats: {
    totalUsage: number;
    uniqueUsers: number;
    successRate: number;
    averageSetupTime: number;
    lastUsed: Date;
  };
  performanceMetrics: {
    averageRating: number;
    completionRate: number;
    errorRate: number;
    supportTickets: number;
  };
  trends: {
    usageTrend: 'up' | 'down' | 'stable';
    trendPercentage: number;
    popularityRank: number;
  };
}

export interface GeneratedCode {
  files: GeneratedFile[];
  configuration: object;
  dependencies: string[];
  documentation: string;
  testCases: TestCase[];
  metadata: AgentMetadata;
}

export interface GeneratedFile {
  path: string;
  content: string;
  type: 'source' | 'config' | 'test' | 'documentation';
  language: string;
}

export interface TestCase {
  name: string;
  description: string;
  input: object;
  expectedOutput: object;
  type: 'unit' | 'integration' | 'e2e';
}

export interface AgentMetadata {
  name: string;
  description: string;
  version: string;
  author: string;
  templateId: string;
  templateVersion: string;
  createdAt: Date;
  governance: GovernanceMetadata;
}

export interface GovernanceMetadata {
  approvalRequired: boolean;
  approvedBy?: string;
  approvedAt?: Date;
  complianceStatus: string;
  auditTrail: AuditEntry[];
}

export interface AuditEntry {
  timestamp: Date;
  action: string;
  user: string;
  details: string;
}

export interface PublishResult {
  success: boolean;
  templateId: string;
  version: string;
  message: string;
  warnings?: string[];
}

export class TemplateService {
  private static instance: TemplateService;
  private templates: AgentTemplate[];
  private analytics: Map<string, TemplateAnalytics>;

  constructor() {
    this.templates = this.generateMockTemplates();
    this.analytics = this.generateMockAnalytics();
  }

  static getInstance(): TemplateService {
    if (!TemplateService.instance) {
      TemplateService.instance = new TemplateService();
    }
    return TemplateService.instance;
  }

  // Core Template Operations
  async getTemplates(filters?: TemplateFilters): Promise<AgentTemplate[]> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    let filteredTemplates = [...this.templates];
    
    if (filters) {
      if (filters.category?.length) {
        filteredTemplates = filteredTemplates.filter(t => 
          filters.category!.includes(t.category)
        );
      }
      
      if (filters.complexity?.length) {
        filteredTemplates = filteredTemplates.filter(t => 
          filters.complexity!.includes(t.complexity)
        );
      }
      
      if (filters.technologies?.length) {
        filteredTemplates = filteredTemplates.filter(t => 
          t.technologies.some(tech => filters.technologies!.includes(tech))
        );
      }
      
      if (filters.approvalStatus?.length) {
        filteredTemplates = filteredTemplates.filter(t => 
          filters.approvalStatus!.includes(t.approvalStatus)
        );
      }
      
      if (filters.complianceStatus?.length) {
        filteredTemplates = filteredTemplates.filter(t => 
          filters.complianceStatus!.includes(t.complianceStatus)
        );
      }
      
      if (filters.minRating) {
        filteredTemplates = filteredTemplates.filter(t => 
          t.rating >= filters.minRating!
        );
      }
      
      if (filters.maxSetupTime) {
        filteredTemplates = filteredTemplates.filter(t => 
          t.estimatedSetupTime <= filters.maxSetupTime!
        );
      }
    }
    
    return filteredTemplates.sort((a, b) => b.usageCount - a.usageCount);
  }

  async getTemplate(id: string): Promise<AgentTemplate | null> {
    await new Promise(resolve => setTimeout(resolve, 150));
    return this.templates.find(t => t.id === id) || null;
  }

  async searchTemplates(query: string): Promise<AgentTemplate[]> {
    await new Promise(resolve => setTimeout(resolve, 180));
    
    const searchTerm = query.toLowerCase();
    return this.templates.filter(template => 
      template.name.toLowerCase().includes(searchTerm) ||
      template.description.toLowerCase().includes(searchTerm) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
      template.technologies.some(tech => tech.toLowerCase().includes(searchTerm))
    );
  }

  async getTemplatesByCategory(category: string): Promise<AgentTemplate[]> {
    await new Promise(resolve => setTimeout(resolve, 120));
    return this.templates.filter(t => t.category === category);
  }

  async getPopularTemplates(limit: number = 10): Promise<AgentTemplate[]> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return this.templates
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit);
  }

  async getTemplateAnalytics(id: string): Promise<TemplateAnalytics | null> {
    await new Promise(resolve => setTimeout(resolve, 150));
    return this.analytics.get(id) || null;
  }

  // Template Management Operations
  async createTemplate(template: Partial<AgentTemplate>): Promise<AgentTemplate> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const newTemplate: AgentTemplate = {
      id: `template-${Date.now()}`,
      name: template.name || 'New Template',
      description: template.description || '',
      category: template.category || 'Business',
      version: '1.0.0',
      author: template.author || 'Current User',
      createdAt: new Date(),
      updatedAt: new Date(),
      complexity: template.complexity || 'Beginner',
      estimatedSetupTime: template.estimatedSetupTime || 15,
      tags: template.tags || [],
      technologies: template.technologies || [],
      dependencies: template.dependencies || [],
      parameters: template.parameters || [],
      codeTemplate: template.codeTemplate || '',
      configTemplate: template.configTemplate || {},
      documentation: template.documentation || '',
      sampleOutputs: template.sampleOutputs || [],
      approvalStatus: 'Draft',
      complianceStatus: 'Under-Review',
      usageCount: 0,
      rating: 0,
      lastUsed: new Date(),
      isActive: true,
      versionHistory: []
    };
    
    this.templates.push(newTemplate);
    return newTemplate;
  }

  async updateTemplate(id: string, updates: Partial<AgentTemplate>): Promise<AgentTemplate> {
    await new Promise(resolve => setTimeout(resolve, 250));
    
    const templateIndex = this.templates.findIndex(t => t.id === id);
    if (templateIndex === -1) {
      throw new Error('Template not found');
    }
    
    const template = this.templates[templateIndex];
    const updatedTemplate = {
      ...template,
      ...updates,
      updatedAt: new Date()
    };
    
    this.templates[templateIndex] = updatedTemplate;
    return updatedTemplate;
  }

  async publishTemplate(id: string): Promise<PublishResult> {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const template = await this.getTemplate(id);
    if (!template) {
      return {
        success: false,
        templateId: id,
        version: '',
        message: 'Template not found'
      };
    }
    
    // Simulate validation and publishing
    const warnings: string[] = [];
    
    if (!template.documentation) {
      warnings.push('Template documentation is missing');
    }
    
    if (template.parameters.length === 0) {
      warnings.push('Template has no configurable parameters');
    }
    
    // Update template status
    await this.updateTemplate(id, {
      approvalStatus: 'Pending',
      complianceStatus: 'Under-Review'
    });
    
    return {
      success: true,
      templateId: id,
      version: template.version,
      message: 'Template submitted for approval',
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  // Code Generation
  async generateCode(template: AgentTemplate, parameters: Record<string, any>): Promise<GeneratedCode> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Simulate code generation based on template and parameters
    const files: GeneratedFile[] = [
      {
        path: 'src/main.py',
        content: this.generateMainFile(template, parameters),
        type: 'source',
        language: 'python'
      },
      {
        path: 'config/settings.json',
        content: JSON.stringify(this.generateConfig(template, parameters), null, 2),
        type: 'config',
        language: 'json'
      },
      {
        path: 'README.md',
        content: this.generateReadme(template, parameters),
        type: 'documentation',
        language: 'markdown'
      }
    ];
    
    return {
      files,
      configuration: this.generateConfig(template, parameters),
      dependencies: template.dependencies.map(d => `${d.name}==${d.version}`),
      documentation: this.generateDocumentation(template, parameters),
      testCases: this.generateTestCases(template, parameters),
      metadata: {
        name: parameters.agentName || template.name,
        description: parameters.agentDescription || template.description,
        version: '1.0.0',
        author: 'Generated from Template',
        templateId: template.id,
        templateVersion: template.version,
        createdAt: new Date(),
        governance: {
          approvalRequired: template.approvalStatus === 'Approved',
          complianceStatus: template.complianceStatus,
          auditTrail: []
        }
      }
    };
  }

  // Analytics and Reporting
  async getTemplateUsageStats(): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const totalTemplates = this.templates.length;
    const activeTemplates = this.templates.filter(t => t.isActive).length;
    const approvedTemplates = this.templates.filter(t => t.approvalStatus === 'Approved').length;
    const totalUsage = this.templates.reduce((sum, t) => sum + t.usageCount, 0);
    
    return {
      totalTemplates,
      activeTemplates,
      approvedTemplates,
      totalUsage,
      averageRating: this.calculateAverageRating(),
      categoryDistribution: this.getCategoryDistribution(),
      popularityTrends: this.getPopularityTrends()
    };
  }

  // Private helper methods
  private generateMockTemplates(): AgentTemplate[] {
    return [
      {
        id: 'web-ui-automation-pro-v3',
        name: 'Web UI Test Automation Pro',
        description: 'Professional web UI testing framework with Playwright, Selenium, and Cypress support. Includes advanced features like visual regression testing, cross-browser compatibility, and CI/CD integration.',
        category: 'QE',
        version: '3.2.1',
        author: 'QE Team',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-10-10'),
        complexity: 'Intermediate',
        estimatedSetupTime: 15,
        tags: ['testing', 'automation', 'web', 'playwright', 'selenium', 'cypress'],
        technologies: ['Playwright', 'TypeScript', 'Jest', 'Docker'],
        dependencies: [
          { name: 'playwright', version: '1.40.0', type: 'npm', optional: false, securityScan: { status: 'Clean', vulnerabilities: 0, lastScanned: new Date() } },
          { name: 'typescript', version: '5.2.0', type: 'npm', optional: false, securityScan: { status: 'Clean', vulnerabilities: 0, lastScanned: new Date() } }
        ],
        parameters: [
          {
            name: 'applicationUrl',
            type: 'string',
            description: 'Base URL of the application to test',
            required: true,
            validation: [{ type: 'url', message: 'Must be a valid URL' }],
            compliance: [{ policyId: 'security-url-validation', severity: 'Medium', description: 'URL must be validated for security' }]
          },
          {
            name: 'testFramework',
            type: 'select',
            description: 'Testing framework to use',
            options: [
              { label: 'Playwright', value: 'playwright', description: 'Modern, fast, and reliable' },
              { label: 'Selenium', value: 'selenium', description: 'Industry standard, wide browser support' },
              { label: 'Cypress', value: 'cypress', description: 'Developer-friendly, great debugging' }
            ],
            defaultValue: 'playwright',
            required: true
          }
        ],
        codeTemplate: '# Web UI Test Automation Template\n# Generated code will be inserted here',
        configTemplate: { framework: '{{testFramework}}', baseUrl: '{{applicationUrl}}' },
        documentation: 'Comprehensive web UI testing framework with enterprise-grade features.',
        sampleOutputs: [
          {
            name: 'Test Results',
            description: 'Sample test execution results',
            content: '{"tests": 25, "passed": 23, "failed": 2, "duration": "2m 34s"}',
            type: 'json'
          }
        ],
        approvalStatus: 'Approved',
        complianceStatus: 'Compliant',
        approvedBy: 'Tech Lead',
        approvedAt: new Date('2024-10-01'),
        usageCount: 1247,
        rating: 4.7,
        lastUsed: new Date(Date.now() - 2 * 60 * 60 * 1000),
        isActive: true,
        versionHistory: []
      },
      {
        id: 'api-test-automation-suite-v2',
        name: 'API Test Automation Suite',
        description: 'Comprehensive API testing framework supporting REST, GraphQL, and SOAP APIs. Includes contract testing, performance validation, and security scanning.',
        category: 'QE',
        version: '2.1.0',
        author: 'API Team',
        createdAt: new Date('2024-02-20'),
        updatedAt: new Date('2024-10-08'),
        complexity: 'Intermediate',
        estimatedSetupTime: 20,
        tags: ['api', 'testing', 'rest', 'graphql', 'postman', 'karate'],
        technologies: ['REST Assured', 'Postman', 'Karate', 'Newman'],
        dependencies: [
          { name: 'rest-assured', version: '5.3.0', type: 'maven', optional: false, securityScan: { status: 'Clean', vulnerabilities: 0, lastScanned: new Date() } }
        ],
        parameters: [
          {
            name: 'apiBaseUrl',
            type: 'string',
            description: 'Base URL for the API endpoints',
            required: true,
            validation: [{ type: 'url', message: 'Must be a valid API URL' }]
          },
          {
            name: 'authType',
            type: 'select',
            description: 'Authentication method',
            options: [
              { label: 'Bearer Token', value: 'bearer' },
              { label: 'API Key', value: 'apikey' },
              { label: 'OAuth 2.0', value: 'oauth2' },
              { label: 'Basic Auth', value: 'basic' }
            ],
            defaultValue: 'bearer',
            required: true
          }
        ],
        codeTemplate: '# API Test Automation Template',
        configTemplate: { baseUrl: '{{apiBaseUrl}}', auth: '{{authType}}' },
        documentation: 'Enterprise-grade API testing with comprehensive validation.',
        sampleOutputs: [],
        approvalStatus: 'Approved',
        complianceStatus: 'Compliant',
        usageCount: 892,
        rating: 4.5,
        lastUsed: new Date(Date.now() - 45 * 60 * 1000),
        isActive: true,
        versionHistory: []
      },
      {
        id: 'cicd-pipeline-builder-v1',
        name: 'CI/CD Pipeline Builder',
        description: 'Automated CI/CD pipeline generator supporting Jenkins, GitHub Actions, and Azure DevOps. Includes deployment strategies, testing integration, and monitoring.',
        category: 'DevOps',
        version: '1.5.2',
        author: 'DevOps Team',
        createdAt: new Date('2024-03-10'),
        updatedAt: new Date('2024-10-05'),
        complexity: 'Advanced',
        estimatedSetupTime: 30,
        tags: ['cicd', 'jenkins', 'github-actions', 'azure-devops', 'deployment'],
        technologies: ['Jenkins', 'GitHub Actions', 'Docker', 'Kubernetes'],
        dependencies: [
          { name: 'jenkins', version: '2.420.0', type: 'docker', optional: false, securityScan: { status: 'Clean', vulnerabilities: 0, lastScanned: new Date() } }
        ],
        parameters: [
          {
            name: 'pipelinePlatform',
            type: 'select',
            description: 'CI/CD platform to use',
            options: [
              { label: 'Jenkins', value: 'jenkins' },
              { label: 'GitHub Actions', value: 'github' },
              { label: 'Azure DevOps', value: 'azure' }
            ],
            defaultValue: 'jenkins',
            required: true
          },
          {
            name: 'deploymentTarget',
            type: 'select',
            description: 'Deployment target environment',
            options: [
              { label: 'Kubernetes', value: 'k8s' },
              { label: 'Docker Swarm', value: 'swarm' },
              { label: 'AWS ECS', value: 'ecs' },
              { label: 'Traditional Servers', value: 'servers' }
            ],
            defaultValue: 'k8s',
            required: true
          }
        ],
        codeTemplate: '# CI/CD Pipeline Template',
        configTemplate: { platform: '{{pipelinePlatform}}', target: '{{deploymentTarget}}' },
        documentation: 'Professional CI/CD pipeline with enterprise features.',
        sampleOutputs: [],
        approvalStatus: 'Approved',
        complianceStatus: 'Compliant',
        usageCount: 634,
        rating: 4.6,
        lastUsed: new Date(Date.now() - 20 * 60 * 1000),
        isActive: true,
        versionHistory: []
      },
      {
        id: 'security-vulnerability-scanner-v2',
        name: 'Security Vulnerability Scanner',
        description: 'Comprehensive security scanning solution with OWASP ZAP integration, dependency scanning, and compliance reporting for SOC2, GDPR, and HIPAA.',
        category: 'Security',
        version: '2.0.1',
        author: 'Security Team',
        createdAt: new Date('2024-01-25'),
        updatedAt: new Date('2024-10-12'),
        complexity: 'Advanced',
        estimatedSetupTime: 25,
        tags: ['security', 'vulnerability', 'owasp', 'compliance', 'scanning'],
        technologies: ['OWASP ZAP', 'Nessus', 'Python', 'Docker'],
        dependencies: [
          { name: 'owasp-zap', version: '2.14.0', type: 'docker', optional: false, securityScan: { status: 'Clean', vulnerabilities: 0, lastScanned: new Date() } }
        ],
        parameters: [
          {
            name: 'scanTarget',
            type: 'string',
            description: 'Target URL or IP address to scan',
            required: true,
            validation: [{ type: 'url', message: 'Must be a valid URL or IP address' }]
          },
          {
            name: 'scanType',
            type: 'select',
            description: 'Type of security scan to perform',
            options: [
              { label: 'Quick Scan', value: 'quick' },
              { label: 'Full Scan', value: 'full' },
              { label: 'Compliance Scan', value: 'compliance' }
            ],
            defaultValue: 'quick',
            required: true
          }
        ],
        codeTemplate: '# Security Scanner Template',
        configTemplate: { target: '{{scanTarget}}', type: '{{scanType}}' },
        documentation: 'Enterprise security scanning with compliance reporting.',
        sampleOutputs: [],
        approvalStatus: 'Approved',
        complianceStatus: 'Compliant',
        usageCount: 456,
        rating: 4.8,
        lastUsed: new Date(Date.now() - 30 * 60 * 1000),
        isActive: true,
        versionHistory: []
      },
      {
        id: 'business-analytics-pipeline-v1',
        name: 'Business Analytics Pipeline',
        description: 'Automated data analytics and reporting pipeline with ETL capabilities, dashboard generation, and business intelligence insights.',
        category: 'Business',
        version: '1.3.0',
        author: 'Analytics Team',
        createdAt: new Date('2024-04-05'),
        updatedAt: new Date('2024-10-07'),
        complexity: 'Intermediate',
        estimatedSetupTime: 35,
        tags: ['analytics', 'etl', 'dashboard', 'business-intelligence', 'reporting'],
        technologies: ['Python', 'Pandas', 'Tableau', 'Power BI'],
        dependencies: [
          { name: 'pandas', version: '2.1.0', type: 'pip', optional: false, securityScan: { status: 'Clean', vulnerabilities: 0, lastScanned: new Date() } }
        ],
        parameters: [
          {
            name: 'dataSource',
            type: 'select',
            description: 'Primary data source',
            options: [
              { label: 'SQL Database', value: 'sql' },
              { label: 'CSV Files', value: 'csv' },
              { label: 'API Endpoints', value: 'api' },
              { label: 'Cloud Storage', value: 'cloud' }
            ],
            defaultValue: 'sql',
            required: true
          },
          {
            name: 'reportingTool',
            type: 'select',
            description: 'Reporting and visualization tool',
            options: [
              { label: 'Tableau', value: 'tableau' },
              { label: 'Power BI', value: 'powerbi' },
              { label: 'Custom Dashboard', value: 'custom' }
            ],
            defaultValue: 'tableau',
            required: true
          }
        ],
        codeTemplate: '# Business Analytics Template',
        configTemplate: { source: '{{dataSource}}', reporting: '{{reportingTool}}' },
        documentation: 'Comprehensive business analytics with automated insights.',
        sampleOutputs: [],
        approvalStatus: 'Approved',
        complianceStatus: 'Compliant',
        usageCount: 289,
        rating: 4.4,
        lastUsed: new Date(Date.now() - 3 * 60 * 60 * 1000),
        isActive: true,
        versionHistory: []
      }
    ];
  }

  private generateMockAnalytics(): Map<string, TemplateAnalytics> {
    const analytics = new Map<string, TemplateAnalytics>();
    
    this.templates.forEach(template => {
      analytics.set(template.id, {
        templateId: template.id,
        usageStats: {
          totalUsage: template.usageCount,
          uniqueUsers: Math.floor(template.usageCount * 0.3),
          successRate: 92 + Math.random() * 6, // 92-98%
          averageSetupTime: template.estimatedSetupTime * (0.8 + Math.random() * 0.4),
          lastUsed: template.lastUsed
        },
        performanceMetrics: {
          averageRating: template.rating,
          completionRate: 85 + Math.random() * 12, // 85-97%
          errorRate: Math.random() * 8, // 0-8%
          supportTickets: Math.floor(Math.random() * 5)
        },
        trends: {
          usageTrend: Math.random() > 0.3 ? 'up' : Math.random() > 0.5 ? 'stable' : 'down',
          trendPercentage: Math.random() * 25,
          popularityRank: Math.floor(Math.random() * this.templates.length) + 1
        }
      });
    });
    
    return analytics;
  }

  private generateMainFile(template: AgentTemplate, parameters: Record<string, any>): string {
    return `#!/usr/bin/env python3
"""
${template.name}
Generated from template: ${template.id}
Author: ${template.author}
"""

import os
import sys
import json
from datetime import datetime

class ${this.toPascalCase(template.name)}:
    def __init__(self):
        self.config = self.load_config()
        
    def load_config(self):
        """Load configuration from settings file"""
        with open('config/settings.json', 'r') as f:
            return json.load(f)
    
    def execute(self):
        """Main execution method"""
        print(f"Starting {self.config.get('name', 'Agent')}...")
        
        # Template-specific logic will be generated here
        # Based on parameters: ${JSON.stringify(parameters)}
        
        return {
            "status": "success",
            "timestamp": datetime.now().isoformat(),
            "results": "Template execution completed"
        }

if __name__ == "__main__":
    agent = ${this.toPascalCase(template.name)}()
    result = agent.execute()
    print(json.dumps(result, indent=2))
`;
  }

  private generateConfig(template: AgentTemplate, parameters: Record<string, any>): object {
    return {
      name: parameters.agentName || template.name,
      version: template.version,
      template: {
        id: template.id,
        version: template.version
      },
      parameters: parameters,
      metadata: {
        createdAt: new Date().toISOString(),
        author: template.author,
        category: template.category
      }
    };
  }

  private generateReadme(template: AgentTemplate, parameters: Record<string, any>): string {
    return `# ${parameters.agentName || template.name}

${template.description}

## Generated from Template
- **Template**: ${template.name} (${template.id})
- **Version**: ${template.version}
- **Category**: ${template.category}
- **Complexity**: ${template.complexity}

## Configuration
${JSON.stringify(parameters, null, 2)}

## Usage
\`\`\`bash
python src/main.py
\`\`\`

## Dependencies
${template.dependencies.map(d => `- ${d.name} (${d.version})`).join('\n')}

## Documentation
${template.documentation}

---
Generated on ${new Date().toISOString()}
`;
  }

  private generateDocumentation(template: AgentTemplate, parameters: Record<string, any>): string {
    return `Documentation for ${template.name} - Generated agent with parameters: ${JSON.stringify(parameters)}`;
  }

  private generateTestCases(template: AgentTemplate, parameters: Record<string, any>): TestCase[] {
    return [
      {
        name: 'Basic Execution Test',
        description: 'Test basic agent execution',
        input: { action: 'execute' },
        expectedOutput: { status: 'success' },
        type: 'unit'
      }
    ];
  }

  private calculateAverageRating(): number {
    const ratings = this.templates.map(t => t.rating);
    return ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
  }

  private getCategoryDistribution(): Record<string, number> {
    const distribution: Record<string, number> = {};
    this.templates.forEach(template => {
      distribution[template.category] = (distribution[template.category] || 0) + 1;
    });
    return distribution;
  }

  private getPopularityTrends(): any[] {
    return this.templates.map(template => ({
      templateId: template.id,
      name: template.name,
      usageCount: template.usageCount,
      trend: Math.random() > 0.5 ? 'up' : 'down'
    }));
  }

  private toPascalCase(str: string): string {
    return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
      return index === 0 ? word.toLowerCase() : word.toUpperCase();
    }).replace(/\s+/g, '');
  }
}

// Global template service instance
export const templateService = TemplateService.getInstance();