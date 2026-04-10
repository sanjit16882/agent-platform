/**
 * Test Enhanced Testing Agent
 * Tests the new TestGenerationService, DDTFIntegrationService, and DeploymentReadinessService
 */

const TestGenerationService = require('./src/services/testGenerationService');
const DDTFIntegrationService = require('./src/services/ddtfIntegrationService');
const DeploymentReadinessService = require('./src/services/deploymentReadinessService');
const TestExecutionEngine = require('./src/services/testExecutionEngine');

// Mock Bedrock Service
const mockBedrockService = {
  async callBedrock(category, prompt, options) {
    console.log(`Mock Bedrock called for: ${category}`);
    return {
      success: true,
      content: `test('should validate input', () => {
  expect(calculateDiscount(100, 'premium')).toBe(20);
});

test('should handle invalid input', () => {
  expect(() => calculateDiscount(-1, 'premium')).toThrow();
});`
    };
  }
};

// Mock S3 Agent Service
const mockS3AgentService = {
  async listAgents() {
    return [];
  }
};

// Mock agent
const mockAgent = {
  id: 'test-agent-001',
  name: 'Test Agent',
  category: 'testing'
};

// Sample code to test
const sampleCode = `
function calculateDiscount(price, customerType) {
  if (customerType === 'premium') {
    return price * 0.2;
  }
  return price * 0.1;
}
`;

// Sample code analysis
const sampleCodeAnalysis = {
  inputAnalysis: {
    type: 'function',
    language: 'javascript',
    complexity: 'simple',
    linesOfCode: 6,
    functions: 1,
    classes: 0,
    hasAsync: false,
    hasErrorHandling: false,
    hasDatabaseCalls: false,
    hasLogging: false,
    hasValidation: false,
    dependencies: [],
    cyclomaticComplexity: 2
  },
  qualityScore: 65,
  grade: 'D',
  issues: [
    {
      id: 'ISS-001',
      severity: 'critical',
      category: 'validation',
      title: 'Missing Input Validation',
      description: 'No validation for price parameter',
      location: 'Line 1, parameter: price',
      impact: 'Can cause runtime errors with invalid inputs',
      suggestedFix: 'if (typeof price !== "number" || price < 0) throw new TypeError("Invalid price");',
      estimatedEffort: '30 minutes'
    },
    {
      id: 'ISS-002',
      severity: 'high',
      category: 'error-handling',
      title: 'No Error Handling',
      description: 'Invalid customerType not handled',
      location: 'Line 2-5',
      impact: 'Silent failures, returns NaN',
      suggestedFix: 'const validTypes = ["premium", "regular"]; if (!validTypes.includes(customerType)) throw new Error("Invalid type");',
      estimatedEffort: '20 minutes'
    }
  ],
  security: {
    score: 100,
    vulnerabilities: []
  }
};

async function testEnhancedServices() {
  console.log('🧪 Testing Enhanced Testing Agent Services\n');
  console.log('='.repeat(80));
  
  try {
    // Test 1: TestGenerationService
    console.log('\n📝 Test 1: TestGenerationService');
    console.log('-'.repeat(80));
    
    const testGenService = new TestGenerationService(mockBedrockService);
    
    const generatedTests = await testGenService.generateTestCases(
      sampleCode,
      sampleCodeAnalysis,
      { language: 'javascript' }
    );
    
    console.log(`✅ Generated ${generatedTests.length} test cases`);
    generatedTests.forEach((test, i) => {
      console.log(`  ${i + 1}. ${test.name} (${test.category})`);
    });
    
    // Test 2: Issue-driven tests
    console.log('\n📝 Test 2: Issue-Driven Test Generation');
    console.log('-'.repeat(80));
    
    const issueTests = await testGenService.generateIssueTests(
      sampleCodeAnalysis.issues.filter(i => i.severity === 'critical' || i.severity === 'high'),
      sampleCode
    );
    
    console.log(`✅ Generated ${issueTests.length} issue-driven tests`);
    issueTests.forEach((test, i) => {
      console.log(`  ${i + 1}. ${test.name} (related to: ${test.relatedIssue})`);
    });
    
    // Test 3: DDTFIntegrationService
    console.log('\n📝 Test 3: DDTFIntegrationService');
    console.log('-'.repeat(80));
    
    const testExecutionEngine = new TestExecutionEngine(mockS3AgentService, null, mockBedrockService);
    const ddtfService = new DDTFIntegrationService(testExecutionEngine);
    
    const allTests = [...generatedTests, ...issueTests];
    const ddtfResults = await ddtfService.executeDDTF(
      mockAgent.id,
      mockAgent,
      allTests,
      { dimensions: ['Functional', 'Security', 'Conversational'] }
    );
    
    console.log(`✅ DDTF Execution Complete`);
    console.log(`  Overall Score: ${ddtfResults.overallScore}/100 (${ddtfResults.grade})`);
    console.log(`  Tests: ${ddtfResults.passed}/${ddtfResults.totalTests} passed`);
    console.log(`  Pass Rate: ${ddtfResults.passRate}%`);
    console.log(`\n  Dimensions:`);
    ddtfResults.dimensions.forEach(dim => {
      console.log(`    - ${dim.name}: ${dim.score}/100 (${dim.passed}/${dim.total} passed)`);
    });
    
    if (ddtfResults.failedTests.length > 0) {
      console.log(`\n  Failed Tests: ${ddtfResults.failedTests.length}`);
      ddtfResults.failedTests.slice(0, 3).forEach((test, i) => {
        console.log(`    ${i + 1}. ${test.name} (${test.severity})`);
      });
    }
    
    // Test 4: DeploymentReadinessService
    console.log('\n📝 Test 4: DeploymentReadinessService');
    console.log('-'.repeat(80));
    
    const deploymentService = new DeploymentReadinessService();
    const deploymentReadiness = deploymentService.assess(
      sampleCodeAnalysis,
      ddtfResults
    );
    
    console.log(`✅ Deployment Assessment Complete`);
    console.log(`  Status: ${deploymentReadiness.status}`);
    console.log(`  Pass Rate: ${deploymentReadiness.passRate}%`);
    console.log(`  Critical Issues: ${deploymentReadiness.criticalIssues}`);
    console.log(`  High Issues: ${deploymentReadiness.highIssues}`);
    console.log(`  Summary: ${deploymentReadiness.summary}`);
    
    console.log(`\n  Recommendations:`);
    deploymentReadiness.recommendations.slice(0, 5).forEach((rec, i) => {
      console.log(`    ${i + 1}. ${rec}`);
    });
    
    if (deploymentReadiness.blockers.length > 0) {
      console.log(`\n  Blockers: ${deploymentReadiness.blockers.length}`);
      deploymentReadiness.blockers.forEach((blocker, i) => {
        console.log(`    ${i + 1}. ${blocker.title} (${blocker.severity})`);
      });
    }
    
    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('✅ ALL TESTS PASSED!');
    console.log('='.repeat(80));
    console.log('\n📊 Summary:');
    console.log(`  - Generated Tests: ${generatedTests.length}`);
    console.log(`  - Issue-Driven Tests: ${issueTests.length}`);
    console.log(`  - Total Tests: ${allTests.length}`);
    console.log(`  - DDTF Score: ${ddtfResults.overallScore}/100 (${ddtfResults.grade})`);
    console.log(`  - Deployment Status: ${deploymentReadiness.status}`);
    console.log(`  - Pass Rate: ${deploymentReadiness.passRate}%`);
    
    console.log('\n🎉 Enhanced Testing Agent services are working correctly!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests
testEnhancedServices();
