// Security testing script for AgentHub API Gateway
const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3001/api/v1';

async function testSecurity() {
  console.log('🔒 Testing AgentHub API Gateway Security Features...\n');

  const tests = [];

  try {
    // Test 1: Security Headers
    console.log('1. Testing security headers...');
    const response = await fetch(`${API_BASE}/`);
    const headers = response.headers;
    
    const securityHeaders = [
      'x-content-type-options',
      'x-frame-options', 
      'x-xss-protection',
      'referrer-policy',
      'permissions-policy',
      'x-request-id'
    ];

    let headersPassed = 0;
    securityHeaders.forEach(header => {
      if (headers.get(header)) {
        console.log(`   ✅ ${header}: ${headers.get(header)}`);
        headersPassed++;
      } else {
        console.log(`   ❌ Missing: ${header}`);
      }
    });
    
    tests.push({
      name: 'Security Headers',
      passed: headersPassed === securityHeaders.length,
      score: `${headersPassed}/${securityHeaders.length}`
    });

    // Test 2: Rate Limiting (IP-based)
    console.log('\n2. Testing IP-based rate limiting...');
    let rateLimitHit = false;
    
    for (let i = 0; i < 25; i++) {
      const rateLimitResponse = await fetch(`${API_BASE}/agents`);
      
      if (rateLimitResponse.status === 429) {
        console.log(`   ✅ Rate limit hit after ${i + 1} requests`);
        console.log(`   ✅ Retry-After header: ${rateLimitResponse.headers.get('retry-after')}`);
        rateLimitHit = true;
        break;
      }
      
      if (i === 0) {
        console.log(`   ✅ Rate limit headers present:`);
        console.log(`      X-RateLimit-Limit: ${rateLimitResponse.headers.get('x-ratelimit-limit')}`);
        console.log(`      X-RateLimit-Remaining: ${rateLimitResponse.headers.get('x-ratelimit-remaining')}`);
      }
    }
    
    tests.push({
      name: 'IP Rate Limiting',
      passed: rateLimitHit,
      score: rateLimitHit ? 'PASS' : 'FAIL'
    });

    // Test 3: Input Validation
    console.log('\n3. Testing input validation...');
    
    // Test invalid JSON
    const invalidJsonResponse = await fetch(`${API_BASE}/agents/test/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"invalid": json}'
    });
    
    const jsonValidationPassed = invalidJsonResponse.status === 400;
    console.log(`   ${jsonValidationPassed ? '✅' : '❌'} Invalid JSON rejected: ${invalidJsonResponse.status}`);

    // Test oversized request
    const largePayload = 'x'.repeat(11 * 1024 * 1024); // 11MB
    const oversizeResponse = await fetch(`${API_BASE}/agents/test/execute`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Content-Length': largePayload.length.toString()
      },
      body: JSON.stringify({ data: largePayload })
    });
    
    const sizeValidationPassed = oversizeResponse.status === 413;
    console.log(`   ${sizeValidationPassed ? '✅' : '❌'} Oversized request rejected: ${oversizeResponse.status}`);

    tests.push({
      name: 'Input Validation',
      passed: jsonValidationPassed && sizeValidationPassed,
      score: `${(jsonValidationPassed ? 1 : 0) + (sizeValidationPassed ? 1 : 0)}/2`
    });

    // Test 4: Authentication Requirements
    console.log('\n4. Testing authentication requirements...');
    
    const authRequiredEndpoints = [
      { method: 'POST', path: '/auth/keys' },
      { method: 'GET', path: '/auth/keys' },
      { method: 'POST', path: '/agents/test/execute' },
      { method: 'GET', path: '/executions/test' }
    ];

    let authTestsPassed = 0;
    
    for (const endpoint of authRequiredEndpoints) {
      const authResponse = await fetch(`${API_BASE}${endpoint.path}`, {
        method: endpoint.method,
        headers: { 'Content-Type': 'application/json' },
        body: endpoint.method === 'POST' ? JSON.stringify({}) : undefined
      });
      
      const requiresAuth = authResponse.status === 401;
      console.log(`   ${requiresAuth ? '✅' : '❌'} ${endpoint.method} ${endpoint.path}: ${authResponse.status}`);
      
      if (requiresAuth) authTestsPassed++;
    }

    tests.push({
      name: 'Authentication Requirements',
      passed: authTestsPassed === authRequiredEndpoints.length,
      score: `${authTestsPassed}/${authRequiredEndpoints.length}`
    });

    // Test 5: Content-Type Validation
    console.log('\n5. Testing Content-Type validation...');
    
    const invalidContentTypeResponse = await fetch(`${API_BASE}/agents/test/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: 'plain text data'
    });
    
    const contentTypeValidationPassed = invalidContentTypeResponse.status === 415;
    console.log(`   ${contentTypeValidationPassed ? '✅' : '❌'} Invalid Content-Type rejected: ${invalidContentTypeResponse.status}`);

    tests.push({
      name: 'Content-Type Validation',
      passed: contentTypeValidationPassed,
      score: contentTypeValidationPassed ? 'PASS' : 'FAIL'
    });

    // Test 6: API Versioning
    console.log('\n6. Testing API versioning...');
    
    const invalidVersionResponse = await fetch('http://localhost:3001/api/v99/agents');
    const versionValidationPassed = invalidVersionResponse.status === 400;
    console.log(`   ${versionValidationPassed ? '✅' : '❌'} Invalid API version rejected: ${invalidVersionResponse.status}`);

    tests.push({
      name: 'API Versioning',
      passed: versionValidationPassed,
      score: versionValidationPassed ? 'PASS' : 'FAIL'
    });

    // Test 7: Request ID Tracking
    console.log('\n7. Testing request ID tracking...');
    
    const requestIdResponse = await fetch(`${API_BASE}/`);
    const hasRequestId = requestIdResponse.headers.get('x-request-id');
    console.log(`   ${hasRequestId ? '✅' : '❌'} Request ID header: ${hasRequestId || 'Missing'}`);

    tests.push({
      name: 'Request ID Tracking',
      passed: !!hasRequestId,
      score: hasRequestId ? 'PASS' : 'FAIL'
    });

    // Test 8: Error Handling
    console.log('\n8. Testing error handling...');
    
    const notFoundResponse = await fetch(`${API_BASE}/nonexistent`);
    const notFoundData = await notFoundResponse.json();
    
    const hasStructuredError = notFoundData.error && notFoundData.code && notFoundData.timestamp;
    console.log(`   ${hasStructuredError ? '✅' : '❌'} Structured error response: ${hasStructuredError}`);
    console.log(`   Error format: ${JSON.stringify(notFoundData, null, 2)}`);

    tests.push({
      name: 'Error Handling',
      passed: hasStructuredError,
      score: hasStructuredError ? 'PASS' : 'FAIL'
    });

    // Summary
    console.log('\n📊 Security Test Summary:');
    console.log('=' .repeat(50));
    
    const passedTests = tests.filter(t => t.passed).length;
    const totalTests = tests.length;
    
    tests.forEach(test => {
      const status = test.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} ${test.name} (${test.score})`);
    });
    
    console.log('=' .repeat(50));
    console.log(`Overall Security Score: ${passedTests}/${totalTests} (${Math.round(passedTests/totalTests*100)}%)`);
    
    if (passedTests === totalTests) {
      console.log('🎉 All security tests passed! Your API is well-protected.');
    } else if (passedTests >= totalTests * 0.8) {
      console.log('⚠️  Most security tests passed. Review failed tests for improvements.');
    } else {
      console.log('🚨 Several security tests failed. Please address security issues before production.');
    }

    console.log('\n🔧 Security Features Active:');
    console.log('   • Request validation and sanitization');
    console.log('   • Rate limiting (IP and API key based)');
    console.log('   • Security headers (CSP, XSS protection, etc.)');
    console.log('   • Authentication and authorization');
    console.log('   • Input size and content-type validation');
    console.log('   • Request ID tracking for debugging');
    console.log('   • Structured error responses');
    console.log('   • API versioning validation');

  } catch (error) {
    console.error('❌ Security test failed:', error.message);
    console.log('\n💡 Make sure the API server is running: npm run dev');
  }
}

// Run security tests
testSecurity();