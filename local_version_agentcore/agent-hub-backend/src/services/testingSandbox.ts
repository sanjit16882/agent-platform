import { AgentTemplate } from '../agent-templates';
import { AgentProcessor } from '../agent-processors';

export interface TestScenario {
  id: string;
  name: string;
  description: string;
  type: 'functional' | 'safety' | 'edge-case' | 'performance';
  mockData: any;
  expectedOutput?: any;
  assertions: TestAssertion[];
}

export interface TestAssertion {
  field: string;
  operator: 'equals' | 'contains' | 'matches' | 'exists' | 'type';
  expected: any;
  description: string;
}

export interface TestResult {
  scenarioId: string;
  passed: boolean;
  executionTime: number;
  actualOutput: any;
  assertionResults: AssertionResult[];
  errors?: string[];
}

export interface AssertionResult {
  assertion: TestAssertion;
  passed: boolean;
  actual: any;
  message: string;
}

export class TestingSandbox {
  private scenarios: Map<string, TestScenario> = new Map();

  // Built-in test scenarios for common agent types
  private getDefaultScenarios(agentType: string): TestScenario[] {
    const scenarios: Record<string, TestScenario[]> = {
      'test-generator': [
        {
          id: 'test-gen-functional',
          name: 'Basic Function Test Generation',
          description: 'Test generating tests for a simple function',
          type: 'functional',
          mockData: {
            source_code: 'function add(a, b) { return a + b; }',
            file_path: 'utils.js',
            context: { language: 'javascript', framework: 'jest' }
          },
          assertions: [
            {
              field: 'test_cases',
              operator: 'contains',
              expected: 'describe',
              description: 'Should contain describe block'
            },
            {
              field: 'test_cases',
              operator: 'contains',
              expected: 'expect',
              description: 'Should contain expect assertions'
            }
          ]
        },
        {
          id: 'test-gen-edge-case',
          name: 'Edge Case Handling',
          description: 'Test with empty/null inputs',
          type: 'edge-case',
          mockData: {
            source_code: '',
            file_path: 'empty.js',
            context: { language: 'javascript' }
          },
          assertions: [
            {
              field: 'success',
              operator: 'equals',
              expected: false,
              description: 'Should fail gracefully with empty input'
            }
          ]
        }
      ],
      'security-scanner': [
        {
          id: 'security-functional',
          name: 'Basic Security Scan',
          description: 'Test security scanning with vulnerable code',
          type: 'functional',
          mockData: {
            source_code: 'eval(userInput); // Dangerous!',
            file_path: 'vulnerable.js',
            context: { language: 'javascript' }
          },
          assertions: [
            {
              field: 'security_issues',
              operator: 'exists',
              expected: true,
              description: 'Should detect security issues'
            },
            {
              field: 'security_issues.length',
              operator: 'equals',
              expected: 1,
              description: 'Should find at least one issue'
            }
          ]
        },
        {
          id: 'security-safe-code',
          name: 'Safe Code Test',
          description: 'Test with secure code',
          type: 'safety',
          mockData: {
            source_code: 'const result = safeFunction(validatedInput);',
            file_path: 'safe.js',
            context: { language: 'javascript' }
          },
          assertions: [
            {
              field: 'security_issues.length',
              operator: 'equals',
              expected: 0,
              description: 'Should find no security issues'
            }
          ]
        }
      ]
    };

    return scenarios[agentType] || [];
  }

  async runTestScenario(
    agentId: string, 
    scenarioId: string, 
    template: AgentTemplate
  ): Promise<TestResult> {
    const scenario = this.scenarios.get(scenarioId);
    if (!scenario) {
      throw new Error(`Test scenario ${scenarioId} not found`);
    }

    const startTime = Date.now();
    
    try {
      // Execute agent with mock data
      const result = await this.executeAgentWithMockData(agentId, scenario.mockData, template);
      const executionTime = Date.now() - startTime;

      // Run assertions
      const assertionResults = await this.runAssertions(scenario.assertions, result);
      const passed = assertionResults.every(ar => ar.passed);

      return {
        scenarioId,
        passed,
        executionTime,
        actualOutput: result,
        assertionResults
      };

    } catch (error: any) {
      return {
        scenarioId,
        passed: false,
        executionTime: Date.now() - startTime,
        actualOutput: null,
        assertionResults: [],
        errors: [error.message]
      };
    }
  }

  async runAllScenarios(agentId: string, template: AgentTemplate): Promise<TestResult[]> {
    const agentType = template.category?.toLowerCase() || 'unknown';
    
    // Load default scenarios for this agent type
    const defaultScenarios = this.getDefaultScenarios(agentType);
    defaultScenarios.forEach(scenario => {
      this.scenarios.set(scenario.id, scenario);
    });

    const results: TestResult[] = [];
    
    for (const [scenarioId] of this.scenarios) {
      const result = await this.runTestScenario(agentId, scenarioId, template);
      results.push(result);
    }

    return results;
  }

  private async executeAgentWithMockData(
    agentId: string, 
    mockData: any, 
    template: AgentTemplate
  ): Promise<any> {
    // Use the appropriate processor based on agent category/id
    const agentType = template.category?.toLowerCase() || template.id;
    
    switch (agentType) {
      case 'testing':
      case 'test-generator':
        return await AgentProcessor.processEmailRephrasing(mockData, template); // Use existing processor as example
      case 'security':
      case 'security-scanner':
        return await AgentProcessor.processEmailRephrasing(mockData, template); // Use existing processor as example
      case 'communication':
      case 'email-rephraser':
        return await AgentProcessor.processEmailRephrasing(mockData, template);
      default:
        // Default to email rephrasing processor for testing
        return await AgentProcessor.processEmailRephrasing(mockData, template);
    }
  }

  private async runAssertions(assertions: TestAssertion[], actualOutput: any): Promise<AssertionResult[]> {
    return assertions.map(assertion => {
      const actual = this.getNestedValue(actualOutput, assertion.field);
      const passed = this.evaluateAssertion(assertion, actual);
      
      return {
        assertion,
        passed,
        actual,
        message: passed 
          ? `✅ ${assertion.description}` 
          : `❌ ${assertion.description} - Expected: ${assertion.expected}, Got: ${actual}`
      };
    });
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  private evaluateAssertion(assertion: TestAssertion, actual: any): boolean {
    switch (assertion.operator) {
      case 'equals':
        return actual === assertion.expected;
      case 'contains':
        return typeof actual === 'string' && actual.includes(assertion.expected);
      case 'matches':
        return new RegExp(assertion.expected).test(String(actual));
      case 'exists':
        return actual !== undefined && actual !== null;
      case 'type':
        return typeof actual === assertion.expected;
      default:
        return false;
    }
  }

  // Add custom test scenario
  addCustomScenario(scenario: TestScenario): void {
    this.scenarios.set(scenario.id, scenario);
  }

  // Get test coverage report
  getTestCoverage(results: TestResult[]): {
    totalScenarios: number;
    passedScenarios: number;
    failedScenarios: number;
    coverageByType: Record<string, number>;
    averageExecutionTime: number;
  } {
    const totalScenarios = results.length;
    const passedScenarios = results.filter(r => r.passed).length;
    const failedScenarios = totalScenarios - passedScenarios;
    
    const coverageByType: Record<string, number> = {};
    const executionTimes = results.map(r => r.executionTime);
    
    // Group by scenario type
    for (const [scenarioId] of this.scenarios) {
      const scenario = this.scenarios.get(scenarioId)!;
      const result = results.find(r => r.scenarioId === scenarioId);
      
      if (!coverageByType[scenario.type]) {
        coverageByType[scenario.type] = 0;
      }
      
      if (result?.passed) {
        coverageByType[scenario.type]++;
      }
    }

    return {
      totalScenarios,
      passedScenarios,
      failedScenarios,
      coverageByType,
      averageExecutionTime: executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length
    };
  }
}