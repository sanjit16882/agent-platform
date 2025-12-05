# qTest Integration

## Overview

Integrate DDTF with qTest for enterprise test management and reporting.

## Configuration

```javascript
// config/qtest.config.js
module.exports = {
  qtestUrl: 'https://yourcompany.qtestnet.com',
  apiToken: process.env.QTEST_API_TOKEN,
  projectId: 12345,
  testCycleId: 67890
};
```

## qTest Reporter

**qtest-reporter.js:**
```javascript
const axios = require('axios');

class DDTFQTestReporter {
  constructor(config) {
    this.qtestUrl = config.qtestUrl;
    this.apiToken = config.apiToken;
    this.projectId = config.projectId;
    this.ddtfApi = 'http://localhost:3002/api/testing';
  }
  
  async executeDDTFAndReport(agentId, testIds, testCycleId) {
    // Execute DDTF tests
    const executeResponse = await axios.post(`${this.ddtfApi}/execute`, {
      agentId: agentId,
      testIds: testIds
    });
    
    const runId = executeResponse.data.runId;
    const results = await this.waitForCompletion(runId);
    
    // Report to qTest
    await this.reportResults(testCycleId, results);
    
    return results;
  }
  
  async reportResults(testCycleId, ddtfResults) {
    for (const result of ddtfResults.results) {
      const testRunId = await this.findQTestRun(result.test_id, testCycleId);
      
      if (!testRunId) {
        console.warn(`No qTest run found for ${result.test_id}`);
        continue;
      }
      
      await this.submitTestLog(testRunId, result);
    }
  }
  
  async submitTestLog(testRunId, ddtfResult) {
    const status = ddtfResult.passed ? 'PASSED' : 'FAILED';
    
    const testLog = {
      status: status,
      exe_start_date: new Date(ddtfResult.startTime).toISOString(),
      exe_end_date: new Date(ddtfResult.endTime).toISOString(),
      note: this.formatNote(ddtfResult),
      attachments: [
        {
          name: `${ddtfResult.test_id}_result.json`,
          content_type: 'application/json',
          data: Buffer.from(JSON.stringify(ddtfResult, null, 2)).toString('base64')
        }
      ]
    };
    
    await axios.post(
      `${this.qtestUrl}/api/v3/projects/${this.projectId}/test-runs/${testRunId}/auto-test-logs`,
      testLog,
      {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
  }
  
  formatNote(result) {
    return `
DDTF Test Result
================
Test: ${result.test_name}
Score: ${result.score}/100
Model: ${result.metadata?.model || 'N/A'}
Cost: $${result.cost}
Duration: ${result.duration}ms

${result.explanation}
    `.trim();
  }
  
  async findQTestRun(ddtfTestId, testCycleId) {
    // Find qTest run by DDTF test ID
    // Implementation depends on your qTest setup
    return null; // Placeholder
  }
  
  async waitForCompletion(runId, timeout = 300000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const response = await axios.get(`${this.ddtfApi}/results/${runId}`);
      if (response.data.status === 'completed') {
        return response.data;
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    throw new Error('DDTF test timeout');
  }
}

module.exports = DDTFQTestReporter;
```

## Best Practices

1. **Test Cycles**: Organize AI tests in qTest test cycles
2. **Parameters**: Use qTest parameters for different AI models
3. **Requirements**: Link tests to qTest requirements
4. **Dashboards**: Create qTest dashboards for AI metrics
5. **Automation**: Integrate with qTest automation host
