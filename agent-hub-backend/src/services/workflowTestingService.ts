// Comprehensive Data Flow Testing and Validation Service
// Task 6.7 Implementation

interface TestScenario {
  id: string;
  name: string;
  description: string;
  testData: any;
  expectedOutput?: any;
  validationRules: ValidationRule[];
}

interface ValidationRule {
  id: string;
  type: 'schema' | 'dataType' | 'range' | 'format' | 'custom';
  field: string;
  rule: any;
  message: string;
}

interface ComponentTestResult {
  componentId: string;
  componentName: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  executionTime: number;
  inputData: any;
  outputData: any;
  errors: string[];
  warnings: string[];
  performanceMetrics: PerformanceMetrics;
}

interface PerformanceMetrics {
  executionTime: number;
  memoryUsage: number;
  throughput: number;
  dataProcessed: number;
  errorRate: number;
}

interface WorkflowTestResult {
  workflowId: string;
  testScenarioId: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  startTime: Date;
  endTime?: Date;
  componentResults: ComponentTestResult[];
  overallPerformance: PerformanceMetrics;
  dataFlowValidation: DataFlowValidationResult;
}

interface DataFlowValidationResult {
  isValid: boolean;
  dataIntegrity: boolean;
  schemaCompliance: boolean;
  performanceAcceptable: boolean;
  issues: ValidationIssue[];
}

interface ValidationIssue {
  severity: 'error' | 'warning' | 'info';
  component: string;
  field: string;
  message: string;
  suggestion?: string;
}

export class WorkflowTestingService {
  private testScenarios: Map<string, TestScenario> = new Map();
  private testResults: Map<string, WorkflowTestResult> = new Map();

  constructor() {
    this.initializeDefaultTestScenarios();
  }

  // Initialize default test scenarios for common use cases
  private initializeDefaultTestScenarios() {
    const scenarios: TestScenario[] = [
      {
        id: 'data_processing_basic',
        name: 'Basic Data Processing',
        description: 'Test basic data transformation and validation',
        testData: {
          users: [
            { id: 1, name: 'John Doe', email: 'john@example.com', age: 30 },
            { id: 2, name: 'Jane Smith', email: 'jane@example.com', age: 25 },
            { id: 3, name: 'Bob Johnson', email: 'bob@example.com', age: 35 }
          ]
        },
        validationRules: [
          {
            id: 'email_format',
            type: 'format',
            field: 'email',
            rule: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: 'Email must be in valid format'
          },
          {
            id: 'age_range',
            type: 'range',
            field: 'age',
            rule: { min: 0, max: 120 },
            message: 'Age must be between 0 and 120'
          }
        ]
      },
      {
        id: 'api_integration_test',
        name: 'API Integration Test',
        description: 'Test API calls and response handling',
        testData: {
          apiEndpoint: 'https://jsonplaceholder.typicode.com/users',
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        },
        validationRules: [
          {
            id: 'response_structure',
            type: 'schema',
            field: 'response',
            rule: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  name: { type: 'string' },
                  email: { type: 'string' }
                }
              }
            },
            message: 'Response must be an array of user objects'
          }
        ]
      },
      {
        id: 'file_processing_test',
        name: 'File Processing Test',
        description: 'Test file upload and processing capabilities',
        testData: {
          file: {
            name: 'test_data.csv',
            content: 'id,name,email\n1,John,john@example.com\n2,Jane,jane@example.com',
            type: 'text/csv'
          }
        },
        validationRules: [
          {
            id: 'csv_structure',
            type: 'custom',
            field: 'parsedData',
            rule: (data: any) => Array.isArray(data) && data.length > 0,
            message: 'CSV must be parsed into array with data'
          }
        ]
      },
      {
        id: 'performance_stress_test',
        name: 'Performance Stress Test',
        description: 'Test performance with large datasets',
        testData: {
          largeDataset: this.generateLargeTestDataset(1000)
        },
        validationRules: [
          {
            id: 'performance_threshold',
            type: 'custom',
            field: 'executionTime',
            rule: (time: number) => time < 5000, // 5 seconds
            message: 'Execution time must be under 5 seconds'
          }
        ]
      }
    ];

    scenarios.forEach(scenario => {
      this.testScenarios.set(scenario.id, scenario);
    });
  }

  // Generate large test dataset for performance testing
  private generateLargeTestDataset(size: number): any[] {
    const dataset = [];
    for (let i = 0; i < size; i++) {
      dataset.push({
        id: i + 1,
        name: `User ${i + 1}`,
        email: `user${i + 1}@example.com`,
        age: Math.floor(Math.random() * 80) + 18,
        department: ['Engineering', 'Sales', 'Marketing', 'HR'][Math.floor(Math.random() * 4)],
        salary: Math.floor(Math.random() * 100000) + 30000,
        joinDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
      });
    }
    return dataset;
  }

  // Run comprehensive workflow test
  async runWorkflowTest(workflowId: string, components: any[], testScenarioId: string): Promise<WorkflowTestResult> {
    const scenario = this.testScenarios.get(testScenarioId);
    if (!scenario) {
      throw new Error(`Test scenario ${testScenarioId} not found`);
    }

    const testResult: WorkflowTestResult = {
      workflowId,
      testScenarioId,
      status: 'running',
      startTime: new Date(),
      componentResults: [],
      overallPerformance: {
        executionTime: 0,
        memoryUsage: 0,
        throughput: 0,
        dataProcessed: 0,
        errorRate: 0
      },
      dataFlowValidation: {
        isValid: true,
        dataIntegrity: true,
        schemaCompliance: true,
        performanceAcceptable: true,
        issues: []
      }
    };

    try {
      console.log(`🧪 Starting workflow test: ${scenario.name}`);
      
      // Test each component in sequence
      let currentData = scenario.testData;
      const startTime = Date.now();

      for (const component of components) {
        const componentResult = await this.testComponent(component, currentData, scenario.validationRules);
        testResult.componentResults.push(componentResult);

        if (componentResult.status === 'failed') {
          testResult.status = 'failed';
          break;
        }

        // Use output as input for next component
        currentData = componentResult.outputData || currentData;
      }

      const totalExecutionTime = Date.now() - startTime;
      
      // Calculate overall performance metrics
      testResult.overallPerformance = this.calculateOverallPerformance(testResult.componentResults, totalExecutionTime);
      
      // Validate data flow
      testResult.dataFlowValidation = await this.validateDataFlow(testResult.componentResults, scenario);
      
      // Determine final status
      if (testResult.status !== 'failed') {
        testResult.status = testResult.dataFlowValidation.isValid ? 'passed' : 'failed';
      }

      testResult.endTime = new Date();
      
      // Store result
      this.testResults.set(`${workflowId}_${testScenarioId}`, testResult);
      
      console.log(`✅ Workflow test completed: ${testResult.status}`);
      return testResult;

    } catch (error) {
      testResult.status = 'failed';
      testResult.endTime = new Date();
      testResult.dataFlowValidation.issues.push({
        severity: 'error',
        component: 'workflow',
        field: 'execution',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
      
      console.error('❌ Workflow test failed:', error);
      return testResult;
    }
  }

  // Test individual component
  private async testComponent(component: any, inputData: any, validationRules: ValidationRule[]): Promise<ComponentTestResult> {
    const startTime = Date.now();
    
    const result: ComponentTestResult = {
      componentId: component.id,
      componentName: component.name || component.type,
      status: 'running',
      executionTime: 0,
      inputData,
      outputData: null,
      errors: [],
      warnings: [],
      performanceMetrics: {
        executionTime: 0,
        memoryUsage: 0,
        throughput: 0,
        dataProcessed: 0,
        errorRate: 0
      }
    };

    try {
      console.log(`🔧 Testing component: ${result.componentName}`);

      // Simulate component execution based on type
      const outputData = await this.simulateComponentExecution(component, inputData);
      result.outputData = outputData;

      // Validate output against rules
      const validationResults = this.validateOutput(outputData, validationRules);
      result.errors = validationResults.errors;
      result.warnings = validationResults.warnings;

      // Calculate performance metrics
      const executionTime = Date.now() - startTime;
      result.executionTime = executionTime;
      result.performanceMetrics = {
        executionTime,
        memoryUsage: this.estimateMemoryUsage(inputData, outputData),
        throughput: this.calculateThroughput(inputData, executionTime),
        dataProcessed: this.calculateDataSize(inputData),
        errorRate: result.errors.length / Math.max(1, this.getDataItemCount(inputData))
      };

      // Determine status
      result.status = result.errors.length > 0 ? 'failed' : 'passed';

      console.log(`✅ Component test completed: ${result.componentName} - ${result.status}`);
      return result;

    } catch (error) {
      result.status = 'failed';
      result.executionTime = Date.now() - startTime;
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
      
      console.error(`❌ Component test failed: ${result.componentName}`, error);
      return result;
    }
  }

  // Simulate component execution based on type
  private async simulateComponentExecution(component: any, inputData: any): Promise<any> {
    // Add small delay to simulate processing
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));

    switch (component.type) {
      case 'data_processor':
        return this.simulateDataProcessing(inputData);
      
      case 'api_caller':
        return this.simulateApiCall(inputData);
      
      case 'file_processor':
        return this.simulateFileProcessing(inputData);
      
      case 'llm_processor':
        return this.simulateLLMProcessing(inputData);
      
      case 'validator':
        return this.simulateValidation(inputData);
      
      default:
        // Generic processing - just pass through with some transformation
        return {
          ...inputData,
          processed: true,
          processedAt: new Date().toISOString(),
          componentType: component.type
        };
    }
  }

  // Simulate different types of component processing
  private simulateDataProcessing(data: any): any {
    if (Array.isArray(data.users)) {
      return {
        processedUsers: data.users.map((user: any) => ({
          ...user,
          fullName: user.name,
          emailDomain: user.email?.split('@')[1] || 'unknown',
          ageGroup: user.age < 30 ? 'young' : user.age < 50 ? 'middle' : 'senior'
        })),
        totalCount: data.users.length,
        processedAt: new Date().toISOString()
      };
    }
    return { ...data, processed: true };
  }

  private async simulateApiCall(data: any): Promise<any> {
    // Simulate API response
    return {
      status: 200,
      data: [
        { id: 1, name: 'API User 1', email: 'api1@example.com' },
        { id: 2, name: 'API User 2', email: 'api2@example.com' }
      ],
      headers: { 'content-type': 'application/json' },
      requestData: data
    };
  }

  private simulateFileProcessing(data: any): any {
    if (data.file && data.file.content) {
      const lines = data.file.content.split('\n');
      const headers = lines[0]?.split(',') || [];
      const rows = lines.slice(1).map(line => {
        const values = line.split(',');
        const obj: any = {};
        headers.forEach((header, index) => {
          obj[header.trim()] = values[index]?.trim() || '';
        });
        return obj;
      });

      return {
        parsedData: rows,
        rowCount: rows.length,
        columns: headers,
        fileInfo: {
          name: data.file.name,
          type: data.file.type,
          size: data.file.content.length
        }
      };
    }
    return data;
  }

  private simulateLLMProcessing(data: any): any {
    return {
      response: `Processed: ${JSON.stringify(data).substring(0, 100)}...`,
      confidence: 0.85,
      tokens: Math.floor(Math.random() * 500) + 100,
      model: 'claude-3-haiku',
      processingTime: Math.floor(Math.random() * 2000) + 500
    };
  }

  private simulateValidation(data: any): any {
    const issues = [];
    if (Array.isArray(data.users)) {
      data.users.forEach((user: any, index: number) => {
        if (!user.email || !user.email.includes('@')) {
          issues.push(`User ${index + 1}: Invalid email format`);
        }
        if (!user.age || user.age < 0 || user.age > 120) {
          issues.push(`User ${index + 1}: Invalid age`);
        }
      });
    }

    return {
      isValid: issues.length === 0,
      validationIssues: issues,
      validatedData: data,
      validationRules: ['email_format', 'age_range', 'required_fields']
    };
  }

  // Validate output against rules
  private validateOutput(outputData: any, rules: ValidationRule[]): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const rule of rules) {
      try {
        const isValid = this.applyValidationRule(outputData, rule);
        if (!isValid) {
          if (rule.type === 'custom' && rule.field === 'executionTime') {
            warnings.push(rule.message);
          } else {
            errors.push(`${rule.field}: ${rule.message}`);
          }
        }
      } catch (error) {
        errors.push(`Validation error for ${rule.field}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return { errors, warnings };
  }

  // Apply individual validation rule
  private applyValidationRule(data: any, rule: ValidationRule): boolean {
    const fieldValue = this.getFieldValue(data, rule.field);

    switch (rule.type) {
      case 'schema':
        return this.validateSchema(fieldValue, rule.rule);
      
      case 'dataType':
        return typeof fieldValue === rule.rule;
      
      case 'range':
        return fieldValue >= rule.rule.min && fieldValue <= rule.rule.max;
      
      case 'format':
        return rule.rule.test ? rule.rule.test(fieldValue) : rule.rule === fieldValue;
      
      case 'custom':
        return typeof rule.rule === 'function' ? rule.rule(fieldValue) : true;
      
      default:
        return true;
    }
  }

  // Get field value from nested object
  private getFieldValue(data: any, fieldPath: string): any {
    return fieldPath.split('.').reduce((obj, key) => obj?.[key], data);
  }

  // Basic schema validation
  private validateSchema(data: any, schema: any): boolean {
    if (schema.type === 'array') {
      return Array.isArray(data);
    }
    if (schema.type === 'object') {
      return typeof data === 'object' && data !== null;
    }
    return typeof data === schema.type;
  }

  // Calculate overall performance metrics
  private calculateOverallPerformance(componentResults: ComponentTestResult[], totalTime: number): PerformanceMetrics {
    const totalComponents = componentResults.length;
    const failedComponents = componentResults.filter(r => r.status === 'failed').length;
    
    return {
      executionTime: totalTime,
      memoryUsage: componentResults.reduce((sum, r) => sum + r.performanceMetrics.memoryUsage, 0),
      throughput: componentResults.reduce((sum, r) => sum + r.performanceMetrics.throughput, 0) / totalComponents,
      dataProcessed: componentResults.reduce((sum, r) => sum + r.performanceMetrics.dataProcessed, 0),
      errorRate: failedComponents / totalComponents
    };
  }

  // Validate data flow between components
  private async validateDataFlow(componentResults: ComponentTestResult[], scenario: TestScenario): Promise<DataFlowValidationResult> {
    const issues: ValidationIssue[] = [];
    let dataIntegrity = true;
    let schemaCompliance = true;
    let performanceAcceptable = true;

    // Check data flow continuity
    for (let i = 0; i < componentResults.length - 1; i++) {
      const current = componentResults[i];
      const next = componentResults[i + 1];

      // Check if output of current component is compatible with input of next
      if (current.outputData && next.inputData) {
        const compatibility = this.checkDataCompatibility(current.outputData, next.inputData);
        if (!compatibility.compatible) {
          dataIntegrity = false;
          issues.push({
            severity: 'error',
            component: current.componentName,
            field: 'output',
            message: `Data incompatibility with ${next.componentName}: ${compatibility.reason}`,
            suggestion: 'Add data transformation component between these components'
          });
        }
      }
    }

    // Check performance thresholds
    const avgExecutionTime = componentResults.reduce((sum, r) => sum + r.executionTime, 0) / componentResults.length;
    if (avgExecutionTime > 3000) { // 3 seconds threshold
      performanceAcceptable = false;
      issues.push({
        severity: 'warning',
        component: 'workflow',
        field: 'performance',
        message: `Average component execution time (${avgExecutionTime}ms) exceeds recommended threshold`,
        suggestion: 'Consider optimizing slow components or adding parallel processing'
      });
    }

    // Check error rates
    const errorRate = componentResults.filter(r => r.status === 'failed').length / componentResults.length;
    if (errorRate > 0.1) { // 10% error rate threshold
      issues.push({
        severity: 'error',
        component: 'workflow',
        field: 'reliability',
        message: `High error rate detected: ${(errorRate * 100).toFixed(1)}%`,
        suggestion: 'Review and fix failing components before deployment'
      });
    }

    return {
      isValid: issues.filter(i => i.severity === 'error').length === 0,
      dataIntegrity,
      schemaCompliance,
      performanceAcceptable,
      issues
    };
  }

  // Check data compatibility between components
  private checkDataCompatibility(outputData: any, inputData: any): { compatible: boolean; reason?: string } {
    // Basic compatibility checks
    if (typeof outputData !== typeof inputData) {
      return { compatible: false, reason: 'Data type mismatch' };
    }

    if (Array.isArray(outputData) !== Array.isArray(inputData)) {
      return { compatible: false, reason: 'Array/object structure mismatch' };
    }

    return { compatible: true };
  }

  // Utility methods for performance calculation
  private estimateMemoryUsage(inputData: any, outputData: any): number {
    const inputSize = JSON.stringify(inputData || {}).length;
    const outputSize = JSON.stringify(outputData || {}).length;
    return (inputSize + outputSize) * 2; // Rough estimate in bytes
  }

  private calculateThroughput(data: any, executionTime: number): number {
    const dataSize = this.calculateDataSize(data);
    return executionTime > 0 ? dataSize / executionTime : 0; // bytes per ms
  }

  private calculateDataSize(data: any): number {
    return JSON.stringify(data || {}).length;
  }

  private getDataItemCount(data: any): number {
    if (Array.isArray(data)) return data.length;
    if (data && typeof data === 'object') return Object.keys(data).length;
    return 1;
  }

  // Public methods for accessing test scenarios and results
  getTestScenarios(): TestScenario[] {
    return Array.from(this.testScenarios.values());
  }

  getTestScenario(id: string): TestScenario | undefined {
    return this.testScenarios.get(id);
  }

  getTestResult(workflowId: string, scenarioId: string): WorkflowTestResult | undefined {
    return this.testResults.get(`${workflowId}_${scenarioId}`);
  }

  getAllTestResults(): WorkflowTestResult[] {
    return Array.from(this.testResults.values());
  }

  // Generate automated test scenarios based on workflow configuration
  generateAutomatedTestScenarios(workflow: any): TestScenario[] {
    const scenarios: TestScenario[] = [];

    // Generate basic functionality test
    scenarios.push({
      id: `${workflow.id}_basic_test`,
      name: 'Basic Functionality Test',
      description: 'Test basic workflow execution with standard data',
      testData: this.generateBasicTestData(workflow),
      validationRules: this.generateBasicValidationRules(workflow)
    });

    // Generate edge case test
    scenarios.push({
      id: `${workflow.id}_edge_case_test`,
      name: 'Edge Case Test',
      description: 'Test workflow with edge cases and boundary conditions',
      testData: this.generateEdgeCaseTestData(workflow),
      validationRules: this.generateEdgeCaseValidationRules(workflow)
    });

    // Generate performance test
    scenarios.push({
      id: `${workflow.id}_performance_test`,
      name: 'Performance Test',
      description: 'Test workflow performance with large datasets',
      testData: this.generatePerformanceTestData(workflow),
      validationRules: this.generatePerformanceValidationRules(workflow)
    });

    return scenarios;
  }

  // Generate test data based on workflow components
  private generateBasicTestData(workflow: any): any {
    // Analyze workflow components to generate appropriate test data
    const hasDataProcessor = workflow.components?.some((c: any) => c.type === 'data_processor');
    const hasApiCaller = workflow.components?.some((c: any) => c.type === 'api_caller');
    const hasFileProcessor = workflow.components?.some((c: any) => c.type === 'file_processor');

    let testData: any = {};

    if (hasDataProcessor) {
      testData.users = [
        { id: 1, name: 'Test User 1', email: 'test1@example.com', age: 25 },
        { id: 2, name: 'Test User 2', email: 'test2@example.com', age: 30 }
      ];
    }

    if (hasApiCaller) {
      testData.apiConfig = {
        endpoint: 'https://api.example.com/data',
        method: 'GET',
        headers: { 'Authorization': 'Bearer test-token' }
      };
    }

    if (hasFileProcessor) {
      testData.file = {
        name: 'test.csv',
        content: 'id,name,value\n1,Item1,100\n2,Item2,200',
        type: 'text/csv'
      };
    }

    return testData;
  }

  private generateEdgeCaseTestData(workflow: any): any {
    return {
      emptyData: [],
      nullData: null,
      largeString: 'x'.repeat(10000),
      specialCharacters: '!@#$%^&*()_+-=[]{}|;:,.<>?',
      unicodeText: '🚀 Unicode test 中文 العربية',
      malformedJson: '{"incomplete": json',
      extremeNumbers: {
        veryLarge: Number.MAX_SAFE_INTEGER,
        verySmall: Number.MIN_SAFE_INTEGER,
        zero: 0,
        negative: -999999
      }
    };
  }

  private generatePerformanceTestData(workflow: any): any {
    return {
      largeDataset: this.generateLargeTestDataset(5000),
      concurrentRequests: Array.from({ length: 100 }, (_, i) => ({
        id: i,
        data: `Request ${i} data`
      }))
    };
  }

  private generateBasicValidationRules(workflow: any): ValidationRule[] {
    return [
      {
        id: 'output_exists',
        type: 'custom',
        field: 'output',
        rule: (data: any) => data !== null && data !== undefined,
        message: 'Output must exist'
      },
      {
        id: 'execution_time',
        type: 'custom',
        field: 'executionTime',
        rule: (time: number) => time < 10000, // 10 seconds
        message: 'Execution time must be under 10 seconds'
      }
    ];
  }

  private generateEdgeCaseValidationRules(workflow: any): ValidationRule[] {
    return [
      {
        id: 'handles_null_input',
        type: 'custom',
        field: 'status',
        rule: (status: string) => status !== 'failed',
        message: 'Workflow must handle null input gracefully'
      },
      {
        id: 'handles_empty_data',
        type: 'custom',
        field: 'errors',
        rule: (errors: string[]) => errors.length === 0,
        message: 'Workflow must handle empty data without errors'
      }
    ];
  }

  private generatePerformanceValidationRules(workflow: any): ValidationRule[] {
    return [
      {
        id: 'performance_threshold',
        type: 'custom',
        field: 'executionTime',
        rule: (time: number) => time < 30000, // 30 seconds for large data
        message: 'Performance test must complete within 30 seconds'
      },
      {
        id: 'memory_usage',
        type: 'custom',
        field: 'memoryUsage',
        rule: (memory: number) => memory < 100000000, // 100MB
        message: 'Memory usage must be under 100MB'
      }
    ];
  }
}

export default WorkflowTestingService;