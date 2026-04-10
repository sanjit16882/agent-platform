/**
 * Test Multi-Agent Workflow with User Discount Code
 * Tests: Code Analysis → Testing Agent → Documentation Agent
 */

const MultiAgentCoordinator = require('./src/services/multiAgentCoordinator');

// Mock Bedrock Service
const mockBedrockService = {
  async callBedrock(category, prompt, options) {
    console.log(`\n📞 Bedrock called for: ${category}`);
    
    if (category === 'test-generator') {
      return {
        success: true,
        content: `\`\`\`javascript
test('should calculate total correctly', () => {
  const user = { isPremium: false };
  const cart = { items: [{ price: 50, quantity: 2 }] };
  expect(calculateUserDiscount(user, cart)).toBe(100);
});

test('should apply premium discount', () => {
  const user = { isPremium: true };
  const cart = { items: [{ price: 100, quantity: 1 }] };
  expect(calculateUserDiscount(user, cart)).toBe(90);
});

test('should apply bulk discount for orders over 100', () => {
  const user = { isPremium: false };
  const cart = { items: [{ price: 60, quantity: 2 }] };
  expect(calculateUserDiscount(user, cart)).toBe(110);
});

test('should handle empty cart', () => {
  const user = { isPremium: false };
  const cart = { items: [] };
  expect(calculateUserDiscount(user, cart)).toBe(0);
});
\`\`\``
      };
    }
    
    return {
      success: true,
      content: 'Mock response from Bedrock'
    };
  }
};

// Mock S3 Agent Service
const mockS3AgentService = {
  async getAgentById(agentId) {
    const agents = {
      'code-analysis-agent': {
        id: 'code-analysis-agent',
        name: 'Code Analysis Agent',
        category: 'code-analysis',
        capabilities: ['code-analysis', 'security-scan'],
        model: 'anthropic.claude-3-sonnet-20240229-v1:0'
      },
      'testing-agent': {
        id: 'testing-agent',
        name: 'Testing Agent',
        category: 'testing',
        capabilities: ['test-generation', 'test-execution', 'ddtf-testing'],
        model: 'anthropic.claude-3-sonnet-20240229-v1:0'
      },
      'documentation-agent': {
        id: 'documentation-agent',
        name: 'Documentation Agent',
        category: 'documentation',
        capabilities: ['documentation', 'report-generation'],
        model: 'anthropic.claude-3-sonnet-20240229-v1:0'
      }
    };
    
    return agents[agentId] || null;
  },
  
  async listAgents() {
    return [];
  }
};

// Your code to analyze
const userDiscountCode = `
function calculateUserDiscount(user, cart) {
  let total = 0;
  for (let i = 0; i < cart.items.length; i++) {
    total += cart.items[i].price * cart.items[i].quantity;
  }
  if (user.isPremium) {
    total = total * 0.9;
  }
  if (total > 100) {
    total = total - 10;
  }
  return total;
}
`;

async function testUserDiscountWorkflow() {
  console.log('🚀 Testing Multi-Agent Workflow with User Discount Code');
  console.log('='.repeat(80));
  console.log('\n📋 Workflow: Code Analysis → Testing → Documentation\n');
  
  try {
    // Initialize coordinator
    const coordinator = new MultiAgentCoordinator(mockBedrockService, mockS3AgentService);
    
    console.log('✅ Coordinator initialized\n');
    
    // Define workflow task
    const task = {
      type: 'code-review-and-test',
      input: userDiscountCode,
      agentSequence: [
        'code-analysis-agent',
        'testing-agent',
        'documentation-agent'
      ],
      metadata: {
        requestId: 'user-discount-test-001',
        timestamp: new Date().toISOString()
      }
    };
    
    console.log('📝 Analyzing Your Code:');
    console.log(userDiscountCode);
    console.log('\n⏱️  Starting workflow execution...\n');
    console.log('='.repeat(80));
    
    // Execute workflow
    const result = await coordinator.executeWorkflow(task);
    
    console.log('\n' + '='.repeat(80));
    console.log('\n✅ WORKFLOW COMPLETED!\n');
    
    // Display results
    console.log('📊 Workflow Summary:');
    console.log(`   Status: ${result.success ? '✅ Success' : '❌ Failed'}`);
    console.log(`   Workflow ID: ${result.workflowId}`);
    console.log(`   Total Duration: ${result.summary.totalDuration}`);
    console.log(`   Successful Agents: ${result.summary.successfulAgents}/${result.summary.totalAgents}`);
    
    console.log('\n' + '='.repeat(80));
    console.log('\n📋 Detailed Results:\n');
    
    // Display each agent's results
    result.results.forEach((agentResult, index) => {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`\n${index + 1}. ${agentResult.agentName}`);
      console.log(`   Status: ${agentResult.status === 'success' ? '✅' : '❌'} ${agentResult.status}`);
      console.log(`   Duration: ${agentResult.duration}ms`);
      
      if (agentResult.status === 'success') {
        // Special handling for Testing Agent to show enhanced output
        if (agentResult.agentName.toLowerCase().includes('testing')) {
          console.log('\n   🧪 TESTING AGENT - ENHANCED RESULTS:');
          console.log('   ' + '─'.repeat(76));
          
          if (agentResult.output && typeof agentResult.output === 'object') {
            const output = agentResult.output;
            
            // Generated Tests
            if (output.generatedTests && output.generatedTests.length > 0) {
              console.log('\n   📝 Generated Tests:');
              output.generatedTests.forEach((test, i) => {
                console.log(`\n   ${i + 1}. ${test.name}`);
                console.log(`      Category: ${test.category}`);
                console.log(`      Priority: ${test.priority}`);
                if (test.relatedIssue) {
                  console.log(`      Related Issue: ${test.relatedIssue}`);
                }
                if (test.code) {
                  console.log(`      Code Preview: ${test.code.substring(0, 80)}...`);
                }
              });
            }
            
            // DDTF Results
            if (output.ddtfResults) {
              console.log('\n   ' + '─'.repeat(76));
              console.log('\n   📊 DDTF TEST RESULTS:');
              console.log(`   Overall Score: ${output.ddtfResults.overallScore}/100`);
              console.log(`   Grade: ${output.ddtfResults.grade}`);
              console.log(`   Tests Passed: ${output.ddtfResults.passed}/${output.ddtfResults.totalTests}`);
              console.log(`   Pass Rate: ${output.ddtfResults.passRate}%`);
              
              if (output.ddtfResults.dimensions && output.ddtfResults.dimensions.length > 0) {
                console.log('\n   Dimension Breakdown:');
                output.ddtfResults.dimensions.forEach(dim => {
                  const icon = dim.score >= 90 ? '✅' : dim.score >= 70 ? '⚠️' : '❌';
                  const bar = '█'.repeat(Math.floor(dim.score / 10)) + '░'.repeat(10 - Math.floor(dim.score / 10));
                  console.log(`   ${icon} ${dim.name.padEnd(20)} ${bar} ${dim.score}/100 (${dim.passed}/${dim.total})`);
                });
              }
              
              if (output.ddtfResults.failedTests && output.ddtfResults.failedTests.length > 0) {
                console.log('\n   ❌ Failed Tests:');
                output.ddtfResults.failedTests.forEach((test, i) => {
                  console.log(`\n   ${i + 1}. ${test.name}`);
                  console.log(`      Dimension: ${test.dimension}`);
                  console.log(`      Severity: ${test.severity}`);
                  console.log(`      Recommendation: ${test.recommendation.substring(0, 70)}...`);
                });
              }
            }
            
            // Deployment Readiness
            if (output.deploymentReadiness) {
              console.log('\n   ' + '─'.repeat(76));
              console.log('\n   🚀 DEPLOYMENT READINESS:');
              
              const statusIcon = {
                'READY': '✅',
                'READY_WITH_MINOR_FIXES': '⚠️',
                'NEEDS_IMPROVEMENT': '📊',
                'NOT_READY': '🚫'
              }[output.deploymentReadiness.status] || '❓';
              
              console.log(`   ${statusIcon} Status: ${output.deploymentReadiness.status}`);
              console.log(`   Pass Rate: ${output.deploymentReadiness.passRate}%`);
              console.log(`   Critical Issues: ${output.deploymentReadiness.criticalIssues}`);
              console.log(`   High Issues: ${output.deploymentReadiness.highIssues}`);
              
              if (output.deploymentReadiness.summary) {
                console.log(`\n   ${output.deploymentReadiness.summary}`);
              }
              
              if (output.deploymentReadiness.recommendations && output.deploymentReadiness.recommendations.length > 0) {
                console.log('\n   Top Recommendations:');
                output.deploymentReadiness.recommendations.slice(0, 5).forEach((rec, i) => {
                  console.log(`   ${i + 1}. ${rec}`);
                });
              }
              
              if (output.deploymentReadiness.blockers && output.deploymentReadiness.blockers.length > 0) {
                console.log('\n   🚫 Deployment Blockers:');
                output.deploymentReadiness.blockers.forEach((blocker, i) => {
                  console.log(`   ${i + 1}. [${blocker.severity}] ${blocker.title}`);
                });
              }
            }
            
            // Coverage
            if (output.coverage) {
              console.log('\n   ' + '─'.repeat(76));
              console.log('\n   📈 COVERAGE ESTIMATION:');
              console.log(`   Lines:     ${output.coverage.lines}%`);
              console.log(`   Branches:  ${output.coverage.branches}%`);
              console.log(`   Functions: ${output.coverage.functions}%`);
              
              if (output.coverage.uncoveredPaths && output.coverage.uncoveredPaths.length > 0) {
                console.log('\n   Uncovered Paths:');
                output.coverage.uncoveredPaths.forEach((path, i) => {
                  console.log(`   - ${path}`);
                });
              }
            }
          } else {
            console.log(`\n   Output: ${agentResult.output.substring(0, 200)}...`);
          }
        } else {
          // For other agents, show brief output
          const outputPreview = typeof agentResult.output === 'string' 
            ? agentResult.output.substring(0, 300)
            : JSON.stringify(agentResult.output).substring(0, 300);
          console.log(`\n   Output Preview:\n   ${outputPreview}...`);
        }
      } else {
        console.log(`\n   ❌ Error: ${agentResult.error}`);
      }
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('\n🎉 Test Complete!\n');
    
    // Save results
    const fs = require('fs');
    fs.writeFileSync(
      'user-discount-workflow-results.json',
      JSON.stringify(result, null, 2)
    );
    console.log('💾 Full results saved to: user-discount-workflow-results.json\n');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the test
console.log('\n');
testUserDiscountWorkflow();
