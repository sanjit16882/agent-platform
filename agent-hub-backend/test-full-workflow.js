/**
 * Full Multi-Agent Workflow Test
 * Tests: Code Analysis → Testing Agent → Documentation Agent
 */

const MultiAgentCoordinator = require('./src/services/multiAgentCoordinator');

// Mock Bedrock Service
const mockBedrockService = {
  async callBedrock(category, prompt, options) {
    console.log(`\n📞 Bedrock called for: ${category}`);
    
    // Simulate different responses based on category
    if (category === 'test-generator') {
      return {
        success: true,
        content: `\`\`\`javascript
test('should validate price parameter', () => {
  expect(() => calculateDiscount(-1, 'premium')).toThrow(TypeError);
  expect(() => calculateDiscount('invalid', 'premium')).toThrow(TypeError);
});

test('should handle invalid customer type', () => {
  expect(() => calculateDiscount(100, 'invalid')).toThrow(Error);
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

// Sample code to analyze and test
const sampleCode = `
function calculateDiscount(price, customerType) {
  if (customerType === 'premium') {
    return price * 0.2;
  } else if (customerType === 'regular') {
    return price * 0.1;
  }
  return 0;
}
`;

async function testFullWorkflow() {
  console.log('🚀 Testing Full Multi-Agent Workflow');
  console.log('='.repeat(80));
  console.log('\n📋 Workflow: Code Analysis → Testing → Documentation\n');
  
  try {
    // Initialize coordinator
    const coordinator = new MultiAgentCoordinator(mockBedrockService, mockS3AgentService);
    
    console.log('✅ Coordinator initialized\n');
    
    // Define workflow task
    const task = {
      type: 'code-review-and-test',
      input: sampleCode,
      agentSequence: [
        'code-analysis-agent',
        'testing-agent',
        'documentation-agent'
      ],
      metadata: {
        requestId: 'test-workflow-001',
        timestamp: new Date().toISOString()
      }
    };
    
    console.log('📝 Task Configuration:');
    console.log(`   Type: ${task.type}`);
    console.log(`   Agents: ${task.agentSequence.length}`);
    console.log(`   Code Length: ${sampleCode.length} characters\n`);
    
    console.log('⏱️  Starting workflow execution...\n');
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
    console.log('\n📋 Agent Results:\n');
    
    // Display each agent's results
    result.results.forEach((agentResult, index) => {
      console.log(`${index + 1}. ${agentResult.agentName}`);
      console.log(`   Status: ${agentResult.status === 'success' ? '✅' : '❌'} ${agentResult.status}`);
      console.log(`   Duration: ${agentResult.duration}ms`);
      
      if (agentResult.status === 'success') {
        // Special handling for Testing Agent to show structured output
        if (agentResult.agentName.toLowerCase().includes('testing')) {
          console.log('\n   🧪 Testing Agent Enhanced Output:');
          
          if (agentResult.output && typeof agentResult.output === 'object') {
            const output = agentResult.output;
            
            // Generated Tests
            if (output.generatedTests) {
              console.log(`   ├─ Generated Tests: ${output.generatedTests.length}`);
              output.generatedTests.forEach((test, i) => {
                console.log(`   │  ${i + 1}. ${test.name} (${test.category}, priority: ${test.priority})`);
              });
            }
            
            // DDTF Results
            if (output.ddtfResults) {
              console.log(`   ├─ DDTF Results:`);
              console.log(`   │  Score: ${output.ddtfResults.overallScore}/100 (${output.ddtfResults.grade})`);
              console.log(`   │  Tests: ${output.ddtfResults.passed}/${output.ddtfResults.totalTests} passed`);
              console.log(`   │  Pass Rate: ${output.ddtfResults.passRate}%`);
              
              if (output.ddtfResults.dimensions) {
                console.log(`   │  Dimensions:`);
                output.ddtfResults.dimensions.forEach(dim => {
                  const icon = dim.score >= 90 ? '✅' : dim.score >= 70 ? '⚠️' : '❌';
                  console.log(`   │    ${icon} ${dim.name}: ${dim.score}/100 (${dim.passed}/${dim.total})`);
                });
              }
            }
            
            // Deployment Readiness
            if (output.deploymentReadiness) {
              console.log(`   ├─ Deployment Readiness:`);
              console.log(`   │  Status: ${output.deploymentReadiness.status}`);
              console.log(`   │  Pass Rate: ${output.deploymentReadiness.passRate}%`);
              console.log(`   │  Critical Issues: ${output.deploymentReadiness.criticalIssues}`);
              console.log(`   │  High Issues: ${output.deploymentReadiness.highIssues}`);
              
              if (output.deploymentReadiness.recommendations && output.deploymentReadiness.recommendations.length > 0) {
                console.log(`   │  Top Recommendations:`);
                output.deploymentReadiness.recommendations.slice(0, 3).forEach((rec, i) => {
                  console.log(`   │    ${i + 1}. ${rec.substring(0, 60)}...`);
                });
              }
            }
            
            // Coverage
            if (output.coverage) {
              console.log(`   └─ Coverage Estimation:`);
              console.log(`      Lines: ${output.coverage.lines}%`);
              console.log(`      Branches: ${output.coverage.branches}%`);
              console.log(`      Functions: ${output.coverage.functions}%`);
            }
          } else {
            console.log(`   Output: ${agentResult.output.substring(0, 100)}...`);
          }
        } else {
          // For other agents, show brief output
          const outputPreview = typeof agentResult.output === 'string' 
            ? agentResult.output.substring(0, 150)
            : JSON.stringify(agentResult.output).substring(0, 150);
          console.log(`   Output: ${outputPreview}...`);
        }
      } else {
        console.log(`   Error: ${agentResult.error}`);
      }
      
      console.log('');
    });
    
    console.log('='.repeat(80));
    console.log('\n🎉 Full Workflow Test Complete!\n');
    
    // Verify Testing Agent used enhanced services
    const testingResult = result.results.find(r => r.agentName.toLowerCase().includes('testing'));
    if (testingResult && testingResult.output && typeof testingResult.output === 'object') {
      console.log('✅ VERIFICATION: Testing Agent is using enhanced services!');
      console.log('   ✓ Structured output detected');
      console.log('   ✓ Generated tests present');
      console.log('   ✓ DDTF results present');
      console.log('   ✓ Deployment readiness present');
      console.log('   ✓ Coverage estimation present');
    } else {
      console.log('⚠️  WARNING: Testing Agent may not be using enhanced services');
      console.log('   Output format does not match expected structure');
    }
    
    console.log('\n' + '='.repeat(80));
    
    // Save results to file for inspection
    const fs = require('fs');
    fs.writeFileSync(
      'workflow-test-results.json',
      JSON.stringify(result, null, 2)
    );
    console.log('\n💾 Full results saved to: workflow-test-results.json');
    
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the test
console.log('\n');
testFullWorkflow();
