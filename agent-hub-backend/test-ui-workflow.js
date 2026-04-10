/**
 * Test UI Workflow Execution
 * Tests the workflow with mock agents (no S3 dependency)
 */

const MultiAgentCoordinator = require('./src/services/multiAgentCoordinator');

// Mock Bedrock Service
const mockBedrockService = {
  async callBedrock(category, prompt, options) {
    console.log(`📞 Bedrock called for: ${category}`);
    return {
      success: true,
      content: 'Mock response from Bedrock...'
    };
  }
};

// Mock S3 Agent Service with predefined agents
const mockS3AgentService = {
  async getAgentById(agentId) {
    console.log(`🔍 Looking for agent: ${agentId}`);
    
    const agents = {
      'code-analysis-agent': {
        id: 'code-analysis-agent',
        name: 'Code Analysis Agent',
        category: 'code-analysis',
        capabilities: ['code-analysis', 'security-scan'],
        instructions: 'Analyze code quality and detect issues',
        model: 'anthropic.claude-3-sonnet-20240229-v1:0'
      },
      'testing-agent': {
        id: 'testing-agent',
        name: 'Testing Agent',
        category: 'testing',
        capabilities: ['test-generation', 'test-execution', 'ddtf-testing'],
        instructions: 'Generate and execute tests',
        model: 'anthropic.claude-3-sonnet-20240229-v1:0'
      },
      'documentation-agent': {
        id: 'documentation-agent',
        name: 'Documentation Agent',
        category: 'documentation',
        capabilities: ['documentation', 'report-generation'],
        instructions: 'Generate comprehensive documentation',
        model: 'anthropic.claude-3-sonnet-20240229-v1:0'
      }
    };
    
    const agent = agents[agentId];
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }
    
    return agent;
  }
};

async function testUIWorkflow() {
  console.log('🚀 Testing UI Workflow Execution');
  console.log('=' .repeat(80));
  
  const coordinator = new MultiAgentCoordinator(mockBedrockService, mockS3AgentService);
  
  const code = `function calculateUserDiscount(user, cart) {
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
}`;

  const task = {
    type: 'code-review',
    input: code,
    agentSequence: ['code-analysis-agent', 'testing-agent'],
    metadata: {
      requestId: 'ui-test-workflow',
      timestamp: new Date().toISOString()
    }
  };
  
  console.log('📝 Task Configuration:');
  console.log(`Type: ${task.type}`);
  console.log(`Agents: ${task.agentSequence.join(' → ')}`);
  console.log(`Code Length: ${code.length} characters`);
  console.log('');
  
  try {
    const result = await coordinator.executeWorkflow(task);
    
    console.log('');
    console.log('=' .repeat(80));
    console.log('✅ WORKFLOW COMPLETED!');
    console.log('=' .repeat(80));
    console.log('');
    console.log('📊 Workflow Summary:');
    console.log(`Status: ${result.success ? '✅ Success' : '❌ Failed'}`);
    console.log(`Workflow ID: ${result.workflowId}`);
    console.log(`Total Duration: ${result.summary.totalDuration}`);
    console.log(`Successful Agents: ${result.summary.successfulAgents}/${result.summary.totalAgents}`);
    console.log('');
    
    console.log('📋 Agent Results:');
    result.results.forEach((agentResult, index) => {
      console.log('');
      console.log(`${index + 1}. ${agentResult.agentName}`);
      console.log(`   Status: ${agentResult.status === 'success' ? '✅' : '❌'} ${agentResult.status}`);
      console.log(`   Duration: ${agentResult.duration}ms`);
      
      if (agentResult.status === 'success' && agentResult.output) {
        if (typeof agentResult.output === 'object') {
          // Check if it's Testing Agent with enhanced output
          if (agentResult.output.generatedTests) {
            console.log('   🧪 Testing Agent Enhanced Output:');
            console.log(`   - Generated Tests: ${agentResult.output.generatedTests.length}`);
            console.log(`   - DDTF Score: ${agentResult.output.ddtfResults.overallScore}/100 (${agentResult.output.ddtfResults.grade})`);
            console.log(`   - Tests Passed: ${agentResult.output.ddtfResults.passed}/${agentResult.output.ddtfResults.totalTests}`);
            console.log(`   - Deployment: ${agentResult.output.deploymentReadiness.status}`);
          } else {
            console.log(`   Output: ${JSON.stringify(agentResult.output).substring(0, 100)}...`);
          }
        } else {
          console.log(`   Output: ${agentResult.output.substring(0, 100)}...`);
        }
      } else if (agentResult.error) {
        console.log(`   Error: ${agentResult.error}`);
      }
    });
    
    console.log('');
    console.log('=' .repeat(80));
    console.log('🎉 Test Complete!');
    console.log('=' .repeat(80));
    
  } catch (error) {
    console.error('');
    console.error('=' .repeat(80));
    console.error('❌ WORKFLOW FAILED!');
    console.error('=' .repeat(80));
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testUIWorkflow().catch(console.error);
