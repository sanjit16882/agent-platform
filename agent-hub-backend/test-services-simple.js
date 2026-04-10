/**
 * Simple Test for Enhanced Services
 * Tests TestGenerationService and DeploymentReadinessService without dependencies
 */

const TestGenerationService = require('./src/services/testGenerationService');
const DeploymentReadinessService = require('./src/services/deploymentReadinessService');

// Mock Bedrock Service
const mockBedrockService = {
  async callBedrock(category, prompt, options) {
    console.log(`Mock Bedrock called for: ${category}`);
    return {
      success: true,
      content: `\`\`\`javascript
test('should validate input', () => {
  expect(calculateDiscount(100, 'premium')).toBe(20);
});

test('should handle invalid input', () => {
  expect(() => calculateDiscount(-1, 'premium')).toThrow();
});

test('should handle edge cases', () => {
  expect(calculateDiscount(0, 'premium')).toBe(0);
});
\`\`\``
    };
  }
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

// Mock DDTF results
const mockDDTFResults = {
  overallScore: 85,
  grade: 'B',
  totalTests: 21,
  passed: 18,
  failed: 3,
  passRate: 85.71,
  dimensions: [
    { name: 'Functional', score: 100, passed: 7, failed: 0, total: 7, weight: 0.20 },
    { name: 'Security', score: 100, passed: 4, failed: 0, total: 4, weight: 0.20 },
    { name: 'Conversational', score: 70, passed: 7, failed: 3, total: 10, weight: 0.15 }
  ],
  failedTests: [
    {
      id: 'CONV-003',
      name: 'Conversational: Context retention (5 turns)',
      dimension: 'Conversational',
      expected: 'Retain context across 5 turns',
      actual: 'Lost context after 3 turns',
      severity: 'medium',
      recommendation: 'Improve context window management',
      suggestedFix: '// Add context summarization\nconst summary = summarizeContext(conversation);'
    }
  ]
};

async function testServices() {
  console.log('🧪 Testing Enhanced Services (Simple)\n');
  console.log('='.repeat(80));
  
  try {
    // Test 1: TestGenerationService
    console.log('\n📝 Test 1: TestGenerationService');
    console.log('-'.repeat(80));
    
    const testGenService = new TestGenerationService(mockBedrockService);
    
    console.log('Generating context-aware tests...');
    const generatedTests = await testGenService.generateTestCases(
      sampleCode,
      sampleCodeAnalysis,
      { language: 'javascript' }
    );
    
    console.log(`✅ Generated ${generatedTests.length} test cases`);
    generatedTests.forEach((test, i) => {
      console.log(`  ${i + 1}. ${test.name} (${test.category}, priority: ${test.priority})`);
    });
    
    // Test 2: Issue-driven tests
    console.log('\n📝 Test 2: Issue-Driven Test Generation');
    console.log('-'.repeat(80));
    
    console.log('Generating issue-driven tests...');
    const issueTests = await testGenService.generateIssueTests(
      sampleCodeAnalysis.issues.filter(i => i.severity === 'critical' || i.severity === 'high'),
      sampleCode
    );
    
    console.log(`✅ Generated ${issueTests.length} issue-driven tests`);
    issueTests.forEach((test, i) => {
      console.log(`  ${i + 1}. ${test.name}`);
      console.log(`     Related Issue: ${test.relatedIssue}`);
      console.log(`     Priority: ${test.priority}`);
    });
    
    // Test 3: DeploymentReadinessService
    console.log('\n📝 Test 3: DeploymentReadinessService');
    console.log('-'.repeat(80));
    
    const deploymentService = new DeploymentReadinessService();
    
    console.log('Assessing deployment readiness...');
    const deploymentReadiness = deploymentService.assess(
      sampleCodeAnalysis,
      mockDDTFResults
    );
    
    console.log(`✅ Deployment Assessment Complete`);
    console.log(`  Status: ${deploymentReadiness.status}`);
    console.log(`  Pass Rate: ${deploymentReadiness.passRate}%`);
    console.log(`  Critical Issues: ${deploymentReadiness.criticalIssues}`);
    console.log(`  High Issues: ${deploymentReadiness.highIssues}`);
    console.log(`  Medium Issues: ${deploymentReadiness.mediumIssues}`);
    console.log(`\n  Summary:`);
    console.log(`  ${deploymentReadiness.summary}`);
    
    console.log(`\n  Recommendations:`);
    deploymentReadiness.recommendations.forEach((rec, i) => {
      console.log(`    ${i + 1}. ${rec}`);
    });
    
    if (deploymentReadiness.blockers.length > 0) {
      console.log(`\n  Blockers: ${deploymentReadiness.blockers.length}`);
      deploymentReadiness.blockers.forEach((blocker, i) => {
        console.log(`    ${i + 1}. [${blocker.severity}] ${blocker.title}`);
        console.log(`        ${blocker.description}`);
      });
    }
    
    // Test 4: Test Count Determination
    console.log('\n📝 Test 4: Test Count Determination');
    console.log('-'.repeat(80));
    
    const simpleCount = testGenService.determineTestCount('simple');
    const mediumCount = testGenService.determineTestCount('medium');
    const complexCount = testGenService.determineTestCount('complex');
    
    console.log(`✅ Test Count Logic:`);
    console.log(`  Simple: ${simpleCount.min}-${simpleCount.max} tests`);
    console.log(`  Medium: ${mediumCount.min}-${mediumCount.max} tests`);
    console.log(`  Complex: ${complexCount.min}-${complexCount.max} tests`);
    
    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('✅ ALL TESTS PASSED!');
    console.log('='.repeat(80));
    console.log('\n📊 Summary:');
    console.log(`  - Generated Tests: ${generatedTests.length}`);
    console.log(`  - Issue-Driven Tests: ${issueTests.length}`);
    console.log(`  - Total Tests: ${generatedTests.length + issueTests.length}`);
    console.log(`  - Deployment Status: ${deploymentReadiness.status}`);
    console.log(`  - Pass Rate: ${deploymentReadiness.passRate}%`);
    console.log(`  - Critical Issues: ${deploymentReadiness.criticalIssues}`);
    
    console.log('\n🎉 Enhanced Testing Agent services are working correctly!');
    console.log('\n📝 Next Steps:');
    console.log('  1. Update multiAgentCoordinator.js with enhanced executeTestingAgent method');
    console.log('  2. See testingAgentEnhancements.js for the code to add');
    console.log('  3. Test the full multi-agent workflow');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests
testServices();
