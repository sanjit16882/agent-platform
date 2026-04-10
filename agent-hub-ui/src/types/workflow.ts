/**
 * Workflow Types
 * Type definitions for multi-agent workflow components
 */

export interface TestCase {
  id: string;
  name: string;
  category: string;
  code: string;
  relatedIssue?: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export interface DDTFDimension {
  name: string;
  score: number;
  passed: number;
  failed: number;
  total: number;
  weight: number;
  tests: DDTFTest[];
}

export interface DDTFTest {
  id: string;
  name: string;
  passed: boolean;
  score: number;
  duration: number;
}

export interface DDTFResults {
  overallScore: number;
  grade: string;
  totalTests: number;
  passed: number;
  failed: number;
  passRate: number;
  dimensions: DDTFDimension[];
  failedTests: FailedTest[];
  executionMetadata: {
    duration: number;
    timestamp: string;
    model: string;
  };
}

export interface FailedTest {
  id: string;
  name: string;
  dimension: string;
  expected: string;
  actual: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  recommendation: string;
  suggestedFix: string;
}

export interface DeploymentReadiness {
  status: 'READY' | 'READY_WITH_MINOR_FIXES' | 'NEEDS_IMPROVEMENT' | 'NOT_READY';
  passRate: number;
  criticalIssues: number;
  highIssues: number;
  recommendations: string[];
  blockers: Blocker[];
  summary: string;
}

export interface Blocker {
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  fix: string;
}

export interface Coverage {
  estimated: boolean;
  lines: number;
  branches: number;
  functions: number;
  uncoveredPaths: string[];
}

export interface TestingAgentOutput {
  generatedTests: TestCase[];
  ddtfResults: DDTFResults;
  deploymentReadiness: DeploymentReadiness;
  coverage: Coverage;
  textSummary: string;
}

export interface Agent {
  id: string;
  name: string;
  category: string;
  capabilities?: string[];
  description?: string;
  model?: string;
}

export const AVAILABLE_AGENTS: Agent[] = [
  {
    id: 'code-analysis-agent',
    name: 'Code Analysis Agent',
    category: 'code-analysis',
    capabilities: ['code-analysis', 'security-scan'],
    description: 'Analyzes code quality, detects issues, and provides recommendations',
  },
  {
    id: 'testing-agent',
    name: 'Testing Agent (Enhanced)',
    category: 'testing',
    capabilities: ['test-generation', 'test-execution', 'ddtf-testing'],
    description: 'Generates context-aware tests, executes DDTF, and assesses deployment readiness',
  },
  {
    id: 'documentation-agent',
    name: 'Documentation Agent',
    category: 'documentation',
    capabilities: ['documentation', 'report-generation'],
    description: 'Generates comprehensive documentation and reports',
  },
  {
    id: 'monitoring-agent',
    name: 'Monitoring Agent',
    category: 'monitoring',
    capabilities: ['monitoring-setup', 'alert-creation'],
    description: 'Sets up monitoring and alerting configurations',
  },
];

export const WORKFLOW_TEMPLATES = [
  {
    id: 'code-review',
    name: 'Code Review',
    description: 'Comprehensive code analysis and testing',
    agents: ['code-analysis-agent', 'testing-agent'],
  },
  {
    id: 'full-pipeline',
    name: 'Full Development Pipeline',
    description: 'Complete analysis, testing, and documentation',
    agents: ['code-analysis-agent', 'testing-agent', 'documentation-agent'],
  },
  {
    id: 'deployment-ready',
    name: 'Deployment Readiness Check',
    description: 'Analysis, testing, documentation, and monitoring setup',
    agents: ['code-analysis-agent', 'testing-agent', 'documentation-agent', 'monitoring-agent'],
  },
];
