/**
 * Test Script for Agent Testing Framework Fixes
 * Tests export, version tracking, and multimodal endpoints
 */

const API_BASE = 'http://localhost:3002';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEndpoint(name, method, url, body = null) {
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${API_BASE}${url}`, options);
    const data = await response.json();
    
    if (response.ok && data.success !== false) {
      log(`✅ ${name}: PASS`, 'green');
      return { success: true, data };
    } else {
      log(`❌ ${name}: FAIL - ${data.error || 'Unknown error'}`, 'red');
      return { success: false, error: data.error };
    }
  } catch (error) {
    log(`❌ ${name}: ERROR - ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function runTests() {
  log('\n🧪 Testing Agent Testing Framework Fixes\n', 'cyan');
  
  let testRunId = null;
  let agentId = null;
  
  // Test 1: Health Check
  log('📋 Test 1: Health Check', 'blue');
  await testEndpoint('Health Check', 'GET', '/api/testing/health');
  
  // Test 2: Get Test Runs
  log('\n📋 Test 2: Get Test Runs', 'blue');
  const runsResult = await testEndpoint('Get Test Runs', 'GET', '/api/testing/runs?limit=5');
  if (runsResult.success && runsResult.data.data && runsResult.data.data.length > 0) {
    testRunId = runsResult.data.data[0].id || runsResult.data.data[0].run_id;
    agentId = runsResult.data.data[0].agentId || runsResult.data.data[0].agent_id;
    log(`   Found test run: ${testRunId}`, 'yellow');
    log(`   Found agent: ${agentId}`, 'yellow');
  }
  
  // Test 3: Export Endpoints
  log('\n📋 Test 3: Export Functionality', 'blue');
  if (testRunId) {
    await testEndpoint('Export JSON', 'GET', `/api/testing/runs/${testRunId}/export?format=json`);
    await testEndpoint('Export CSV', 'GET', `/api/testing/runs/${testRunId}/export?format=csv`);
    
    if (runsResult.data.data.length >= 2) {
      const runIds = runsResult.data.data.slice(0, 2).map(r => r.id || r.run_id);
      await testEndpoint('Batch Export', 'POST', '/api/testing/runs/export/batch', {
        runIds,
        format: 'json'
      });
    }
  } else {
    log('   ⚠️  Skipping export tests - no test runs found', 'yellow');
  }
  
  // Test 4: Version Tracking
  log('\n📋 Test 4: Version Tracking', 'blue');
  if (agentId) {
    await testEndpoint('Get Version History', 'GET', `/api/testing/agents/${agentId}/versions?limit=10`);
    
    if (runsResult.data.data.length >= 2) {
      const runId1 = runsResult.data.data[0].id || runsResult.data.data[0].run_id;
      const runId2 = runsResult.data.data[1].id || runsResult.data.data[1].run_id;
      await testEndpoint('Compare Versions', 'POST', '/api/testing/versions/compare', {
        runId1,
        runId2
      });
    }
  } else {
    log('   ⚠️  Skipping version tracking tests - no agent found', 'yellow');
  }
  
  // Test 5: Multimodal Testing
  log('\n📋 Test 5: Multimodal Testing', 'blue');
  await testEndpoint('Get Multimodal Capabilities', 'GET', '/api/testing/multimodal/capabilities');
  
  await testEndpoint('Validate Multimodal Inputs', 'POST', '/api/testing/multimodal/validate', {
    inputs: {
      text: 'Test prompt',
      image: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
      audio: null,
      video: null
    }
  });
  
  if (agentId && testRunId) {
    await testEndpoint('Execute Multimodal Test', 'POST', '/api/testing/multimodal/execute', {
      agentId,
      testId: 'test-hallucination-1',
      inputs: {
        text: 'Describe what you see',
        image: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
        metadata: { testMode: true }
      }
    });
  } else {
    log('   ⚠️  Skipping multimodal execution - no agent/test found', 'yellow');
  }
  
  // Summary
  log('\n' + '='.repeat(60), 'cyan');
  log('📊 Test Summary', 'cyan');
  log('='.repeat(60), 'cyan');
  log('\n✅ All endpoint tests completed!', 'green');
  log('\nNew Features Tested:', 'blue');
  log('  1. Export Data (JSON/CSV)', 'yellow');
  log('  2. Version Tracking & Comparison', 'yellow');
  log('  3. Multimodal Testing', 'yellow');
  log('\n💡 Check the output above for any failures\n', 'cyan');
}

// Run tests
runTests().catch(error => {
  log(`\n❌ Test suite failed: ${error.message}`, 'red');
  process.exit(1);
});
