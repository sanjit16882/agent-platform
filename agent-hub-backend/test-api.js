// Simple API test script
const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3001/api/v1';

async function testAPI() {
  console.log('🚀 Testing AgentHub API Gateway...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch('http://localhost:3001/health');
    const health = await healthResponse.json();
    console.log('✅ Health check:', health.status);

    // Test 2: Get API info
    console.log('\n2. Testing API info...');
    const apiResponse = await fetch(`${API_BASE}/`);
    const apiInfo = await apiResponse.json();
    console.log('✅ API Info:', apiInfo.name);

    // Test 3: List agents (no auth required)
    console.log('\n3. Testing agent listing...');
    const agentsResponse = await fetch(`${API_BASE}/agents`);
    const agents = await agentsResponse.json();
    console.log(`✅ Found ${agents.total} agents`);
    console.log('   Categories:', agents.categories.join(', '));

    // Test 4: Get specific agent
    if (agents.agents.length > 0) {
      const firstAgent = agents.agents[0];
      console.log(`\n4. Testing agent details for: ${firstAgent.name}`);
      const agentResponse = await fetch(`${API_BASE}/agents/${firstAgent.id}`);
      const agentDetails = await agentResponse.json();
      console.log('✅ Agent details retrieved');
      console.log('   Can execute:', agentDetails.canExecute);
      console.log('   Default timeout:', agentDetails.executionInfo.defaultTimeout + 's');
    }

    // Test 5: Try to execute without auth (should fail)
    console.log('\n5. Testing execution without auth (should fail)...');
    const noAuthResponse = await fetch(`${API_BASE}/agents/qe-test-generator-v2/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inputs: { requirements: 'Test login', framework: 'cypress' }
      })
    });
    
    if (noAuthResponse.status === 401) {
      console.log('✅ Authentication properly required');
    } else {
      console.log('❌ Expected 401, got:', noAuthResponse.status);
    }

    // Test 6: Get permissions info
    console.log('\n6. Testing permissions endpoint...');
    const permissionsResponse = await fetch(`${API_BASE}/auth/permissions`);
    const permissions = await permissionsResponse.json();
    console.log('✅ Available permissions:', permissions.permissions.length);

    console.log('\n🎉 Basic API tests completed successfully!');
    console.log('\n📚 Next steps:');
    console.log('   1. Generate an API key: POST /api/v1/auth/keys');
    console.log('   2. Execute agents with authentication');
    console.log('   3. Check execution status and results');
    console.log('\n📖 Full API documentation: http://localhost:3001/api/docs');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure the API server is running: npm run dev');
  }
}

// Run tests
testAPI();