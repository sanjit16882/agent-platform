// Compliance Service for Template System
// Provides policy enforcement, compliance scanning, and certification management

export interface CompliancePolicy {
  id: string;
  name: string;
  description: string;
  category: 'Security' | 'Quality' | 'Performance' | 'Legal' | 'Operational';
  rules: ComplianceRule[];
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  isActive: boolean;
  applicableTemplates: string[];
  createdAt: Date;
  updatedAt: Date;
  version: string;
}

export interface ComplianceRule {
  id: string;
  name: string;
  description: string;
  type: 'CodePattern' | 'Configuration' | 'Dependency' | 'Documentation' | 'Testing';
  pattern?: string; // Regex pattern for code scanning
  condition: string; // JavaScript expression for evaluation
  message: string;
  remediation: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  isActive: boolean;
}

export interface ComplianceResult {
  agentId: string;
  templateId: string;
  overallStatus: 'Compliant' | 'Non-Compliant' | 'Warning';
  violations: ComplianceViolation[];
  score: number; // 0-100
  lastChecked: Date;
  recommendations: string[];
  certificationStatus: CertificationStatus;
}

export interface ComplianceViolation {
  ruleId: string;
  ruleName: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  message: string;
  location?: {
    file: string;
    line: number;
    column: number;
  };
  remediation: string;
  status: 'Open' | 'Acknowledged' | 'Resolved' | 'Waived';
  detectedAt: Date;
  resolvedAt?: Date;
}

export interface CertificationStatus {
  isActive: boolean;
  certifiedBy?: string;
  certifiedAt?: Date;
  expiresAt?: Date;
  certificationLevel: 'Basic' | 'Standard' | 'Advanced' | 'Enterprise';
  requirements: CertificationRequirement[];
}

export interface CertificationRequirement {
  id: string;
  name: string;
  description: string;
  status: 'Pending' | 'Met' | 'Failed';
  evidence?: string;
  verifiedAt?: Date;
}

export interface PolicyValidationResult {
  policyId: string;
  policyName: string;
  status: 'Pass' | 'Fail' | 'Warning';
  violations: ComplianceViolation[];
  score: number;
}

export interface ComplianceReport {
  id: string;
  agentId: string;
  templateId: string;
  reportType: 'Standard' | 'Detailed' | 'Executive' | 'Regulatory';
  generatedAt: Date;
  generatedBy: string;
  overallScore: number;
  complianceStatus: 'Compliant' | 'Non-Compliant' | 'Warning';
  policyResults: PolicyValidationResult[];
  recommendations: string[];
  executiveSummary: string;
  nextReviewDate: Date;
}

export interface ComplianceMetrics {
  totalAgents: number;
  compliantAgents: number;
  nonCompliantAgents: number;
  warningAgents: number;
  complianceRate: number;
  averageScore: number;
  criticalViolations: number;
  highViolations: number;
  mediumViolations: number;
  lowViolations: number;
  trendsOverTime: ComplianceTrend[];
}

export interface ComplianceTrend {
  date: Date;
  complianceRate: number;
  averageScore: number;
  totalViolations: number;
}

export interface ComplianceFilters {
  status?: string[];
  severity?: string[];
  category?: string[];
  templateId?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export class ComplianceService {
  private static instance: ComplianceService;
  private policies: CompliancePolicy[];
  private complianceResults: Map<string, ComplianceResult>;
  private reports: ComplianceReport[];

  constructor() {
    this.policies = this.generateMockPolicies();
    this.complianceResults = this.generateMockComplianceResults();
    this.reports = this.generateMockReports();
  }

  static getInstance(): ComplianceService {
    if (!ComplianceService.instance) {
      ComplianceService.instance = new ComplianceService();
    }
    return ComplianceService.instance;
  }

  // Policy Management
  async getPolicies(): Promise<CompliancePolicy[]> {
    await new Promise(resolve => setTimeout(resolve, 150));
    return this.policies.filter(p => p.isActive);
  }

  async getPolicy(id: string): Promise<CompliancePolicy | null> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return this.policies.find(p => p.id === id) || null;
  }

  async createPolicy(policy: Partial<CompliancePolicy>): Promise<CompliancePolicy> {
    await new Promise(resolve => setTimeout(resolve, 200));

    const newPolicy: CompliancePolicy = {
      id: `policy-${Date.now()}`,
      name: policy.name || 'New Policy',
      description: policy.description || '',
      category: policy.category || 'Security',
      rules: policy.rules || [],
      severity: policy.severity || 'Medium',
      isActive: policy.isActive !== undefined ? policy.isActive : true,
      applicableTemplates: policy.applicableTemplates || [],
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '1.0.0'
    };

    this.policies.push(newPolicy);
    return newPolicy;
  }

  async updatePolicy(id: string, updates: Partial<CompliancePolicy>): Promise<CompliancePolicy> {
    await new Promise(resolve => setTimeout(resolve, 180));

    const policyIndex = this.policies.findIndex(p => p.id === id);
    if (policyIndex === -1) {
      throw new Error('Policy not found');
    }

    const updatedPolicy = {
      ...this.policies[policyIndex],
      ...updates,
      updatedAt: new Date()
    };

    this.policies[policyIndex] = updatedPolicy;
    return updatedPolicy;
  }

  // Compliance Scanning
  async scanAgent(agentId: string, templateId: string): Promise<ComplianceResult> {
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate scanning time

    const applicablePolicies = this.policies.filter(p => 
      p.isActive && (p.applicableTemplates.length === 0 || p.applicableTemplates.includes(templateId))
    );

    const violations: ComplianceViolation[] = [];
    let totalScore = 100;

    // Simulate policy violations
    for (const policy of applicablePolicies) {
      for (const rule of policy.rules) {
        if (Math.random() < 0.15) { // 15% chance of violation
          const violation: ComplianceViolation = {
            ruleId: rule.id,
            ruleName: rule.name,
            severity: rule.severity,
            message: rule.message,
            location: {
              file: 'src/main.py',
              line: Math.floor(Math.random() * 100) + 1,
              column: Math.floor(Math.random() * 80) + 1
            },
            remediation: rule.remediation,
            status: 'Open',
            detectedAt: new Date()
          };

          violations.push(violation);

          // Deduct score based on severity
          const scoreDeduction = {
            'Low': 2,
            'Medium': 5,
            'High': 10,
            'Critical': 20
          }[rule.severity];

          totalScore -= scoreDeduction;
        }
      }
    }

    totalScore = Math.max(0, totalScore);

    const overallStatus: ComplianceResult['overallStatus'] = 
      totalScore >= 90 ? 'Compliant' :
      totalScore >= 70 ? 'Warning' : 'Non-Compliant';

    const result: ComplianceResult = {
      agentId,
      templateId,
      overallStatus,
      violations,
      score: totalScore,
      lastChecked: new Date(),
      recommendations: this.generateRecommendations(violations),
      certificationStatus: {
        isActive: totalScore >= 85,
        certificationLevel: this.determineCertificationLevel(totalScore),
        requirements: this.generateCertificationRequirements(totalScore)
      }
    };

    this.complianceResults.set(agentId, result);
    return result;
  }

  async validatePolicies(agentId: string, templateId: string, policies: CompliancePolicy[]): Promise<PolicyValidationResult[]> {
    await new Promise(resolve => setTimeout(resolve, 400));

    return policies.map(policy => {
      const violations: ComplianceViolation[] = [];
      let score = 100;

      // Simulate policy validation
      for (const rule of policy.rules) {
        if (Math.random() < 0.1) { // 10% chance of violation per rule
          violations.push({
            ruleId: rule.id,
            ruleName: rule.name,
            severity: rule.severity,
            message: rule.message,
            remediation: rule.remediation,
            status: 'Open',
            detectedAt: new Date()
          });

          score -= { 'Low': 5, 'Medium': 10, 'High': 20, 'Critical': 30 }[rule.severity];
        }
      }

      score = Math.max(0, score);

      return {
        policyId: policy.id,
        policyName: policy.name,
        status: score >= 80 ? 'Pass' : score >= 60 ? 'Warning' : 'Fail',
        violations,
        score
      };
    });
  }

  async getCertificationStatus(agentId: string): Promise<CertificationStatus | null> {
    await new Promise(resolve => setTimeout(resolve, 120));

    const result = this.complianceResults.get(agentId);
    return result?.certificationStatus || null;
  }

  async generateComplianceReport(agentId: string, reportType: ComplianceReport['reportType'] = 'Standard'): Promise<ComplianceReport> {
    await new Promise(resolve => setTimeout(resolve, 600));

    const result = this.complianceResults.get(agentId);
    if (!result) {
      throw new Error('No compliance data found for agent');
    }

    const report: ComplianceReport = {
      id: `report-${Date.now()}`,
      agentId,
      templateId: result.templateId,
      reportType,
      generatedAt: new Date(),
      generatedBy: 'Current User',
      overallScore: result.score,
      complianceStatus: result.overallStatus,
      policyResults: await this.validatePolicies(agentId, result.templateId, this.policies),
      recommendations: result.recommendations,
      executiveSummary: this.generateExecutiveSummary(result),
      nextReviewDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days from now
    };

    this.reports.push(report);
    return report;
  }

  async updateComplianceStatus(agentId: string, status: ComplianceResult['overallStatus']): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 150));

    const result = this.complianceResults.get(agentId);
    if (result) {
      result.overallStatus = status;
      result.lastChecked = new Date();
      this.complianceResults.set(agentId, result);
    }
  }

  // Analytics and Reporting
  async getComplianceMetrics(): Promise<ComplianceMetrics> {
    await new Promise(resolve => setTimeout(resolve, 200));

    const results = Array.from(this.complianceResults.values());
    const totalAgents = results.length;
    const compliantAgents = results.filter(r => r.overallStatus === 'Compliant').length;
    const nonCompliantAgents = results.filter(r => r.overallStatus === 'Non-Compliant').length;
    const warningAgents = results.filter(r => r.overallStatus === 'Warning').length;

    const allViolations = results.flatMap(r => r.violations);
    const criticalViolations = allViolations.filter(v => v.severity === 'Critical').length;
    const highViolations = allViolations.filter(v => v.severity === 'High').length;
    const mediumViolations = allViolations.filter(v => v.severity === 'Medium').length;
    const lowViolations = allViolations.filter(v => v.severity === 'Low').length;

    const averageScore = totalAgents > 0 ? 
      results.reduce((sum, r) => sum + r.score, 0) / totalAgents : 0;

    return {
      totalAgents,
      compliantAgents,
      nonCompliantAgents,
      warningAgents,
      complianceRate: totalAgents > 0 ? (compliantAgents / totalAgents) * 100 : 0,
      averageScore,
      criticalViolations,
      highViolations,
      mediumViolations,
      lowViolations,
      trendsOverTime: this.generateComplianceTrends()
    };
  }

  async getComplianceReports(filters?: ComplianceFilters): Promise<ComplianceReport[]> {
    await new Promise(resolve => setTimeout(resolve, 180));

    let filteredReports = [...this.reports];

    if (filters) {
      if (filters.templateId) {
        filteredReports = filteredReports.filter(r => r.templateId === filters.templateId);
      }

      if (filters.dateRange) {
        filteredReports = filteredReports.filter(r => 
          r.generatedAt >= filters.dateRange!.start && 
          r.generatedAt <= filters.dateRange!.end
        );
      }
    }

    return filteredReports.sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime());
  }

  async getViolationsByCategory(): Promise<Record<string, number>> {
    await new Promise(resolve => setTimeout(resolve, 120));

    const violations = Array.from(this.complianceResults.values()).flatMap(r => r.violations);
    const categories: Record<string, number> = {};

    for (const violation of violations) {
      const policy = this.policies.find(p => p.rules.some(r => r.id === violation.ruleId));
      if (policy) {
        categories[policy.category] = (categories[policy.category] || 0) + 1;
      }
    }

    return categories;
  }

  // Private helper methods
  private generateMockPolicies(): CompliancePolicy[] {
    return [
      {
        id: 'security-policy-001',
        name: 'Security Code Standards',
        description: 'Enforces secure coding practices and vulnerability prevention',
        category: 'Security',
        rules: [
          {
            id: 'rule-001',
            name: 'No Hardcoded Secrets',
            description: 'Prevents hardcoded passwords, API keys, and secrets in code',
            type: 'CodePattern',
            pattern: '(password|api_key|secret)\\s*=\\s*["\'][^"\']+["\']',
            condition: 'code.includes("password =") || code.includes("api_key =")',
            message: 'Hardcoded secrets detected in code',
            remediation: 'Use environment variables or secure credential management',
            severity: 'Critical',
            isActive: true
          },
          {
            id: 'rule-002',
            name: 'Input Validation Required',
            description: 'Ensures all user inputs are properly validated',
            type: 'CodePattern',
            pattern: 'input\\(.*\\)',
            condition: 'hasUserInput && !hasValidation',
            message: 'User input without validation detected',
            remediation: 'Add input validation and sanitization',
            severity: 'High',
            isActive: true
          }
        ],
        severity: 'Critical',
        isActive: true,
        applicableTemplates: [],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-10-01'),
        version: '2.1.0'
      },
      {
        id: 'quality-policy-001',
        name: 'Code Quality Standards',
        description: 'Enforces code quality, documentation, and testing requirements',
        category: 'Quality',
        rules: [
          {
            id: 'rule-003',
            name: 'Documentation Required',
            description: 'All functions must have proper documentation',
            type: 'Documentation',
            condition: 'functions.length > 0 && documentedFunctions / functions.length < 0.8',
            message: 'Insufficient code documentation',
            remediation: 'Add docstrings to all public functions and classes',
            severity: 'Medium',
            isActive: true
          },
          {
            id: 'rule-004',
            name: 'Test Coverage Minimum',
            description: 'Minimum 70% test coverage required',
            type: 'Testing',
            condition: 'testCoverage < 70',
            message: 'Test coverage below minimum threshold',
            remediation: 'Add unit tests to achieve minimum 70% coverage',
            severity: 'High',
            isActive: true
          }
        ],
        severity: 'Medium',
        isActive: true,
        applicableTemplates: [],
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-09-15'),
        version: '1.5.0'
      },
      {
        id: 'performance-policy-001',
        name: 'Performance Standards',
        description: 'Ensures optimal performance and resource usage',
        category: 'Performance',
        rules: [
          {
            id: 'rule-005',
            name: 'Memory Usage Limit',
            description: 'Agent memory usage should not exceed 512MB',
            type: 'Configuration',
            condition: 'memoryLimit > 512',
            message: 'Memory limit exceeds recommended threshold',
            remediation: 'Optimize memory usage or justify higher limits',
            severity: 'Medium',
            isActive: true
          },
          {
            id: 'rule-006',
            name: 'Response Time SLA',
            description: 'Agent response time should be under 5 seconds',
            type: 'Configuration',
            condition: 'averageResponseTime > 5000',
            message: 'Response time exceeds SLA requirements',
            remediation: 'Optimize code performance or review architecture',
            severity: 'High',
            isActive: true
          }
        ],
        severity: 'Medium',
        isActive: true,
        applicableTemplates: [],
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date('2024-08-01'),
        version: '1.2.0'
      }
    ];
  }

  private generateMockComplianceResults(): Map<string, ComplianceResult> {
    const results = new Map<string, ComplianceResult>();

    const agentIds = [
      'web-ui-automation-pro-v3',
      'api-test-automation-suite-v2',
      'cicd-pipeline-builder-v1',
      'security-vulnerability-scanner-v2',
      'business-analytics-pipeline-v1'
    ];

    agentIds.forEach(agentId => {
      const score = 75 + Math.random() * 20; // 75-95 score range
      const violations: ComplianceViolation[] = [];

      // Generate some violations based on score
      if (score < 90) {
        violations.push({
          ruleId: 'rule-003',
          ruleName: 'Documentation Required',
          severity: 'Medium',
          message: 'Some functions lack proper documentation',
          location: { file: 'src/main.py', line: 45, column: 1 },
          remediation: 'Add docstrings to undocumented functions',
          status: 'Open',
          detectedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
        });
      }

      if (score < 80) {
        violations.push({
          ruleId: 'rule-004',
          ruleName: 'Test Coverage Minimum',
          severity: 'High',
          message: 'Test coverage is below 70%',
          remediation: 'Add unit tests to increase coverage',
          status: 'Open',
          detectedAt: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000)
        });
      }

      results.set(agentId, {
        agentId,
        templateId: agentId,
        overallStatus: score >= 85 ? 'Compliant' : score >= 70 ? 'Warning' : 'Non-Compliant',
        violations,
        score: Math.round(score),
        lastChecked: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
        recommendations: this.generateRecommendations(violations),
        certificationStatus: {
          isActive: score >= 80,
          certificationLevel: this.determineCertificationLevel(score),
          requirements: this.generateCertificationRequirements(score)
        }
      });
    });

    return results;
  }

  private generateMockReports(): ComplianceReport[] {
    return [
      {
        id: 'report-001',
        agentId: 'web-ui-automation-pro-v3',
        templateId: 'web-ui-automation-pro-v3',
        reportType: 'Standard',
        generatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        generatedBy: 'Compliance Officer',
        overallScore: 87,
        complianceStatus: 'Compliant',
        policyResults: [],
        recommendations: ['Improve test coverage', 'Add more documentation'],
        executiveSummary: 'Agent meets compliance requirements with minor recommendations for improvement.',
        nextReviewDate: new Date(Date.now() + 88 * 24 * 60 * 60 * 1000)
      }
    ];
  }

  private generateRecommendations(violations: ComplianceViolation[]): string[] {
    const recommendations: string[] = [];

    if (violations.some(v => v.severity === 'Critical')) {
      recommendations.push('Address critical security vulnerabilities immediately');
    }

    if (violations.some(v => v.ruleName.includes('Documentation'))) {
      recommendations.push('Improve code documentation and comments');
    }

    if (violations.some(v => v.ruleName.includes('Test'))) {
      recommendations.push('Increase test coverage and add more comprehensive tests');
    }

    if (violations.some(v => v.ruleName.includes('Performance'))) {
      recommendations.push('Optimize performance and resource usage');
    }

    if (recommendations.length === 0) {
      recommendations.push('Maintain current compliance standards');
    }

    return recommendations;
  }

  private determineCertificationLevel(score: number): CertificationStatus['certificationLevel'] {
    if (score >= 95) return 'Enterprise';
    if (score >= 85) return 'Advanced';
    if (score >= 75) return 'Standard';
    return 'Basic';
  }

  private generateCertificationRequirements(score: number): CertificationRequirement[] {
    return [
      {
        id: 'req-001',
        name: 'Security Standards',
        description: 'Meet all security policy requirements',
        status: score >= 80 ? 'Met' : 'Pending',
        verifiedAt: score >= 80 ? new Date() : undefined
      },
      {
        id: 'req-002',
        name: 'Quality Standards',
        description: 'Meet code quality and documentation standards',
        status: score >= 75 ? 'Met' : 'Pending',
        verifiedAt: score >= 75 ? new Date() : undefined
      },
      {
        id: 'req-003',
        name: 'Performance Standards',
        description: 'Meet performance and resource usage requirements',
        status: score >= 85 ? 'Met' : 'Pending',
        verifiedAt: score >= 85 ? new Date() : undefined
      }
    ];
  }

  private generateExecutiveSummary(result: ComplianceResult): string {
    const status = result.overallStatus;
    const score = result.score;
    const violationCount = result.violations.length;

    if (status === 'Compliant') {
      return `Agent demonstrates excellent compliance with a score of ${score}/100. ${violationCount === 0 ? 'No violations detected.' : `${violationCount} minor issues identified for continuous improvement.`}`;
    } else if (status === 'Warning') {
      return `Agent shows good compliance with a score of ${score}/100. ${violationCount} issues identified that should be addressed to maintain compliance standards.`;
    } else {
      return `Agent requires attention with a score of ${score}/100. ${violationCount} violations detected that must be resolved to achieve compliance.`;
    }
  }

  private generateComplianceTrends(): ComplianceTrend[] {
    const trends: ComplianceTrend[] = [];
    const now = new Date();

    for (let i = 30; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      trends.push({
        date,
        complianceRate: 75 + Math.random() * 20, // 75-95%
        averageScore: 80 + Math.random() * 15, // 80-95
        totalViolations: Math.floor(Math.random() * 20) + 5 // 5-25 violations
      });
    }

    return trends;
  }
}

// Global compliance service instance
export const complianceService = ComplianceService.getInstance();