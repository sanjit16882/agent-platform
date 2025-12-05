# Xray (Jira) Integration

## Overview

Integrate DDTF with Xray Test Management for Jira to manage AI agent tests within your Jira workflow.

## Prerequisites

- Jira with Xray plugin installed
- Xray API credentials
- DDTF running and accessible

## Configuration

```javascript
// config/xray.config.js
module.exports = {
  jiraUrl: 'https://yourcompany.atlassian.net',
  clientId: process.env.XRAY_CLIENT_ID,
  clientSecret: process.env.XRAY_CLIENT_SECRET,
  projectKey: 'AITEST',
  testPlanKey: 'AITEST-123'
};
```

## Xray Reporter

**xray-reporter.js:**
```javascript
const axios = require('axios');

class DDTFXrayReporter {
  constructor(config) {
    this.jiraUrl = config.jiraUrl;
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.projectKey = config.projectKey;
    this.ddtfApi = 'http://localhost:3002/api/testing';
    this.token = null;
  }
  
  async authenticate() {
    const response = await axios.post(
      'https://xray.cloud.getxray.app/api/v2/authenticate',
      {
        client_id: this.clientId,
        client_secret: this.clientSecret
      }
    );
    
    this.token = response.data;
    return this.token;
  }
  
  async executeDDTFAndReport(agentId, testIds, testExecutionKey) {
    // Authenticate
    await this.authenticate();
    
    // Execute DDTF tests
    const executeResponse = await axios.post(`${this.ddtfApi}/execute`, {
      agentId: agentId,
      testIds: testIds
    });
    
    const runId = executeResponse.data.runId;
    const results = await this.waitForCompletion(runId);
    
    // Convert to Xray format and import
    const xrayResults = this.convertToXrayFormat(results, testExecutionKey);
    await this.importResults(xrayResults);
    
    return results;
  }
  
  convertToXrayFormat(ddtfResults, testExecutionKey) {
    return {
      testExecutionKey: testExecutionKey,
      info: {
        summary: `DDTF Test Run - ${ddtfResults.agentName}`,
        description: `Automated AI quality tests\nPass Rate: ${ddtfResults.passRate}%`,
        startDate: new Date(ddtfResults.startTime).toISOString(),
        finishDate: new Date(ddtfResults.endTime).toISOString()
      },
      tests: ddtfResults.results.map(result => ({
        testKey: this.getXrayTestKey(result.test_id),
        status: result.passed ? 'PASSED' : 'FAILED',
        comment: this.formatComment(result),
        duration: result.duration,
        evidences: [
          {
            data: Buffer.from(JSON.stringify(result, null, 2)).toString('base64'),
            filename: `${result.test_id}_result.json`,
            contentType: 'application/json'
          }
        ]
      }))
    };
  }
  
  formatComment(result) {
    return `
**DDTF Test Result**
Score: ${result.score}/100
Model: ${result.metadata?.model || 'N/A'}
Cost: $${result.cost}
Tokens: ${result.tokens_used}

${result.explanation}
    `.trim();
  }
  
  async importResults(xrayResults) {
    const response = await axios.post(
      'https://xray.cloud.getxray.app/api/v2/import/execution',
      xrayResults,
      {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data;
  }
  
  getXrayTestKey(ddtfTestId) {
    // Map DDTF test ID to Xray test key
    // This should be configured based on your setup
    const mapping = {
      'accuracy_check': 'AITEST-101',
      'hallucination_check': 'AITEST-102',
      'relevance_check': 'AITEST-103'
    };
    
    return mapping[ddtfTestId] || null;
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

module.exports = DDTFXrayReporter;
```

## Usage Example

```javascript
const DDTFXrayReporter = require('./xray-reporter');

async function runAITestsWithXray() {
  const reporter = new DDTFXrayReporter({
    jiraUrl: 'https://yourcompany.atlassian.net',
    clientId: process.env.XRAY_CLIENT_ID,
    clientSecret: process.env.XRAY_CLIENT_SECRET,
    projectKey: 'AITEST'
  });
  
  // Execute and report to Xray
  const results = await reporter.executeDDTFAndReport(
    'chatbot_support',
    ['accuracy_check', 'hallucination_check'],
    'AITEST-EXEC-456'  // Test Execution key
  );
  
  console.log(`Results imported to Xray: ${results.passRate}% pass rate`);
}

runAITestsWithXray().catch(console.error);
```

## CI/CD Integration

**Jenkinsfile:**
```groovy
pipeline {
    agent any
    
    environment {
        XRAY_CLIENT_ID = credentials('xray-client-id')
        XRAY_CLIENT_SECRET = credentials('xray-client-secret')
    }
    
    stages {
        stage('Run AI Tests') {
            steps {
                script {
                    sh 'node scripts/run-ddtf-xray.js'
                }
            }
        }
    }
    
    post {
        always {
            // Xray results are automatically imported
            echo 'Test results imported to Xray'
        }
    }
}
```

## Jira Automation

Create Jira automation rule:
```
Trigger: When Test Execution status changes to "DONE"
Condition: Test Execution has label "ai-quality"
Action: Run DDTF tests via webhook
```

## Best Practices

1. **Test Mapping**: Maintain mapping between DDTF tests and Xray test keys
2. **Test Plans**: Organize AI tests in Xray test plans
3. **Requirements**: Link Xray tests to Jira requirements/stories
4. **Dashboards**: Create Jira dashboards for AI quality metrics
5. **Automation**: Use Jira automation to trigger DDTF tests
