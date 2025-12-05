/**
 * API Error Checker
 * Tests all API endpoints and identifies issues
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3002';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  section: (msg) => console.log(`\n${colors.cyan}${'='.repeat(60)}\n${msg}\n${'='.repeat(60)}${colors.reset}\n`)
};

// Track all errors
const errors = [];
const warnings = [];
const successes = [];

// Test an endpoint
async function testEndpoint(name, method, url, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${url}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      validateStatus: () => true // Don't throw on any status
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    
    const result = {
      name,
      method,
      url,
      status: response.status,
      success: response.status >= 200 && response.status < 300,
      data: response.data
    };

    if (result.success) {
      log.success(`${method} ${url} - ${response.status}`);
      successes.push(result);
    } else if (response.status === 401 || response.status === 403) {
      log.warning(`${method} ${url} - ${response.status} (Auth Required)`);
      warnings.push(result);
    } else {
      log.error(`${method} ${url} - ${response.status}`);
      console.log(`   Response: ${JSON.stringify(response.data).substring(0, 100)}`);
      errors.push(result);
    }

    return result;
  } catch (error) {
    log.error(`${method} ${url} - ${error.message}`);
    const result = {
      name,
      method,
      url,
      status: 0,
      success: false,
      error: error.message
    };
    errors.push(result);
    return result;
  }
}

// Main test function
async function runTests() {
  log.section('API Error Checker - Testing All Endpoints');

  // Test 1: Health Check
  log.info('Testing Health Check...');
  await testEndpoint('Health Check', 'GET', '/health');

  // Test 2: List Agents (without auth)
  log.info('\nTesting Agent Endpoints (No Auth)...');
  await testEndpoint('List Agents', 'GET', '/api/v1/agents');
  await testEndpoint('Get Specific Agent', 'GET', '/api/v1/agents/test-agent');
  await testEndpoint('Get GitHub MCP Agent', 'GET', '/api/v1/agents/github-mcp');

  // Test 3: Execute Agent (without auth)
  log.info('\nTesting Agent Execution (No Auth)...');
  await testEndpoint('Execute Agent', 'POST', '/api/v1/agents/test-agent/execute', {
    taskDescription: 'Test task',
    inputs: {},
    context: { executionMode: 'test' }
  });

  // Test 4: Create Hybrid Agent (without auth)
  log.info('\nTesting Hybrid Agent Creation (No Auth)...');
  await testEndpoint('Create Hybrid Agent', 'POST', '/api/v1/agents/hybrid/create', {
    name: 'Test Agent',
    description: 'A test agent',
    category: 'Testing'
  });

  // Test 5: S3 Endpoints
  log.info('\nTesting S3 Endpoints...');
  await testEndpoint('List S3 Agents', 'GET', '/api/v1/agents/s3');
  await testEndpoint('Get S3 Agent', 'GET', '/api/v1/agents/s3/test-agent');

  // Test 6: Analytics
  log.info('\nTesting Analytics Endpoints...');
  await testEndpoint('Get Executions', 'GET', '/api/v1/analytics/executions');

  // Test 7: FinOps
  log.info('\nTesting FinOps Endpoints...');
  await testEndpoint('FinOps Dashboard', 'GET', '/api/v1/finops/dashboard');

  // Test 8: MCP
  log.info('\nTesting MCP Endpoints...');
  await testEndpoint('List MCP Servers', 'GET', '/api/mcp/servers');
  await testEndpoint('MCP Server Status', 'GET', '/api/mcp/servers/github/status');

  // Test 9: DevOps
  log.info('\nTesting DevOps Endpoints...');
  await testEndpoint('DevOps Metrics', 'GET', '/api/devops/metrics');

  // Test 10: Testing Framework
  log.info('\nTesting Framework Endpoints...');
  await testEndpoint('Test Suites', 'GET', '/api/testing/suites');

  // Generate Report
  log.section('Test Results Summary');

  console.log(`${colors.green}✅ Successful: ${successes.length}${colors.reset}`);
  console.log(`${colors.yellow}⚠️  Auth Required: ${warnings.length}${colors.reset}`);
  console.log(`${colors.red}❌ Failed: ${errors.length}${colors.reset}`);

  // Show errors in detail
  if (errors.length > 0) {
    log.section('Failed Endpoints (Need Fixing)');
    errors.forEach(err => {
      console.log(`\n${colors.red}❌ ${err.method} ${err.url}${colors.reset}`);
      console.log(`   Status: ${err.status}`);
      if (err.data) {
        console.log(`   Response: ${JSON.stringify(err.data, null, 2)}`);
      }
      if (err.error) {
        console.log(`   Error: ${err.error}`);
      }
    });
  }

  // Show auth warnings
  if (warnings.length > 0) {
    log.section('Endpoints Requiring Authentication');
    warnings.forEach(warn => {
      console.log(`${colors.yellow}⚠️  ${warn.method} ${warn.url} - Status ${warn.status}${colors.reset}`);
    });
    console.log(`\n${colors.yellow}Note: These endpoints require API key authentication.${colors.reset}`);
    console.log(`${colors.yellow}This is expected behavior for protected endpoints.${colors.reset}`);
  }

  // Generate fix recommendations
  log.section('Recommended Fixes');

  if (errors.length > 0) {
    console.log('1. Check if these endpoints exist in your server files:');
    errors.forEach(err => {
      console.log(`   - ${err.method} ${err.url}`);
    });
    console.log('\n2. Verify route registration in server.ts');
    console.log('3. Check for typos in endpoint paths');
    console.log('4. Ensure all required middleware is loaded');
  }

  if (warnings.length > 0) {
    console.log('\nFor authentication warnings:');
    console.log('1. Frontend should include API key in requests');
    console.log('2. Or disable API key validation for development');
    console.log('3. Or whitelist certain endpoints from auth');
  }

  // Save report to file
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: successes.length + warnings.length + errors.length,
      successful: successes.length,
      authRequired: warnings.length,
      failed: errors.length
    },
    successes,
    warnings,
    errors
  };

  const fs = require('fs');
  fs.writeFileSync('api-test-report.json', JSON.stringify(report, null, 2));
  log.success('\nReport saved to: api-test-report.json');

  // Exit with error code if there are failures
  process.exit(errors.length > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  log.error(`Test runner failed: ${error.message}`);
  console.error(error);
  process.exit(1);
});
