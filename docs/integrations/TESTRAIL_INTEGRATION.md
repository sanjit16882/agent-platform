# TestRail Integration

## Overview

Integrate DDTF with TestRail for comprehensive test management and reporting.

## Integration Architecture

```
DDTF Tests → Execute → Results → TestRail API → Update Test Cases
```

## Setup

### 1. TestRail API Configuration

```javascript
// config/testrail.config.js
module.exports = {
  host: 'https://yourcompany.testrail.io',
  user: 'your-email@company.com',
  apiKey: process.env.TESTRAIL_API_KEY,
  projectId: 1,
  suiteId: 2
};
```

### 2. Install TestRail Client

```bash
npm install testrail-api axios
```

## TestRail Reporter

**testrail-reporter.js:**
```javascript
const TestRail = require('testrail-api');
const axios = require('axios');

class DDTFTestRailReporter {
  constructor(config) {
    this.testrail = new TestRail({
      host: config.host,
      user: config.user,
      password: config.apiKey
    });
    
    this.projectId = config.projectId;
    this.suiteId = config.suiteId;
    this.ddtfApi = 'http://localhost:3002/api/testing';
  }
  
  async createTestRun(name, description) {
    /**
     * Create a new test run in TestRail
     */
    const run = await this.testrail.addRun(this.projectId, {
      suite_id: this.suiteId,
      name: name,
      description: description,
      include_all: false
    });
    
    return run.body.id;
  }
  
  async executeDDTFAndReport(agentId, testIds, testRailRunId) {
    /**
     * Execute DDTF tests and report results to TestRail
     */
    // Execute DDTF test
    const executeResponse = await axios.post(`${this.ddtfApi}/execute`, {
      agentId: agentId,
      testIds: testIds
    });
    
    const runId = executeResponse.data.runId;
    
    // Wait for completion
    const results = await this.waitForCompletion(runId);
    
    // Report to TestRail
    await this.reportResults(testRailRunId, results);
    
    return results;
  }
  
  async waitForCompletion(runId, timeout = 300000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const response = await axios.get(`${this.ddtfApi}/results/${runId}`);
      const data = response.data;
      
      if (data.status === 'completed') {
        return data;
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    throw new Error('DDTF test timeout');
  }
  
  async reportResults(testRailRunId, ddtfResults) {
    /**
     * Report DDTF results to TestRail
     */
    const results = ddtfResults.results || [];
    
    for (const result of results) {
      // Map DDTF test to TestRail case
      const caseId = await this.findTestRailCase(result.test_id);
      
      if (!caseId) {
        console.warn(`No TestRail case found for ${result.test_id}`);
        continue;
      }
      
      // Determine status
      const statusId = result.passed ? 1 : 5; // 1=Passed, 5=Failed
      
      // Add result to TestRail
      await this.testrail.addResultForCase(testRailRunId, caseId, {
        status_id: statusId,
        comment: this.formatComment(result),
        elapsed: `${Math.round(result.duration / 1000)}s`,
        custom_score: result.score,
        custom_ai_model: result.metadata?.model || 'N/A'
      });
    }
    
    // Add overall summary
    await this.addRunSummary(testRailRunId, ddtfResults);
  }
  
  formatComment(result) {
    return `
**DDTF Test Result**

Test: ${result.test_name}
Category: ${result.test_category}
Score: ${result.score}/100

${result.explanation}

**Input:** ${result.input_used}
**Expected:** ${result.expected_output}
**Actual:** ${result.actual_output.substring(0, 500)}...

Cost: $${result.cost}
Tokens: ${result.tokens_used}
Duration: ${result.duration}ms
    `.trim();
  }
  
  async findTestRailCase(ddtfTestId) {
    /**
     * Find TestRail case ID by DDTF test ID
     * Assumes custom field 'custom_ddtf_test_id' exists
     */
    const cases = await this.testrail.getCases(this.projectId, {
      suite_id: this.suiteId
    });
    
    const matchingCase = cases.body.find(c => 
      c.custom_ddtf_test_id === ddtfTestId
    );
    
    return matchingCase?.id;
  }
  
  async addRunSummary(testRailRunId, ddtfResults) {
    /**
     * Add summary comment to test run
     */
    const summary = `
**DDTF Test Run Summary**

Total Tests: ${ddtfResults.totalTests}
Passed: ${ddtfResults.passedTests}
Failed: ${ddtfResults.totalTests - ddtfResults.passedTests}
Pass Rate: ${ddtfResults.passRate}%
Average Score: ${ddtfResults.averageScore}

Total Cost: $${ddtfResults.cost}
Total Duration: ${ddtfResults.duration}ms

Agent: ${ddtfResults.agentName} (${ddtfResults.agentId})
    `.trim();
    
    await this.testrail.updateRun(testRailRunId, {
      description: summary
    });
  }
}

module.exports = DDTFTestRailReporter;
```


## Usage Example

```javascript
const DDTFTestRailReporter = require('./testrail-reporter');

async function runAITests() {
  const reporter = new DDTFTestRailReporter({
    host: 'https://yourcompany.testrail.io',
    user: 'your-email@company.com',
    apiKey: process.env.TESTRAIL_API_KEY,
    projectId: 1,
    suiteId: 2
  });
  
  // Create test run in TestRail
  const testRailRunId = await reporter.createTestRun(
    'AI Agent Quality Tests - Sprint 23',
    'Automated DDTF tests for chatbot and search agents'
  );
  
  console.log(`Created TestRail run: ${testRailRunId}`);
  
  // Execute DDTF tests and report to TestRail
  const results = await reporter.executeDDTFAndReport(
    'chatbot_support',
    ['accuracy_check', 'hallucination_check', 'relevance_check'],
    testRailRunId
  );
  
  console.log(`Test run completed: ${results.passRate}% pass rate`);
}

runAITests().catch(console.error);
```

## CI/CD Integration

**GitHub Actions:**
```yaml
name: DDTF + TestRail Integration

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM
  workflow_dispatch:

jobs:
  ai-quality-tests:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Run DDTF tests with TestRail reporting
        env:
          TESTRAIL_API_KEY: ${{ secrets.TESTRAIL_API_KEY }}
          TESTRAIL_USER: ${{ secrets.TESTRAIL_USER }}
        run: node scripts/run-ddtf-testrail.js
```

## TestRail Custom Fields

Add these custom fields to your TestRail project:

1. **DDTF Test ID** (Text)
   - API Name: `custom_ddtf_test_id`
   - Used to map TestRail cases to DDTF tests

2. **AI Score** (Integer)
   - API Name: `custom_score`
   - Stores DDTF test score (0-100)

3. **AI Model** (String)
   - API Name: `custom_ai_model`
   - Stores which AI model was tested

4. **Cost** (Decimal)
   - API Name: `custom_cost`
   - Stores test execution cost

## Webhook Integration

Set up TestRail webhook to trigger DDTF tests:

**webhook-handler.js:**
```javascript
const express = require('express');
const DDTFTestRailReporter = require('./testrail-reporter');

const app = express();
app.use(express.json());

app.post('/webhook/testrail', async (req, res) => {
  const event = req.body;
  
  // Trigger DDTF tests when test run is created
  if (event.event === 'run_added') {
    const runId = event.run_id;
    const projectId = event.project_id;
    
    // Execute DDTF tests
    const reporter = new DDTFTestRailReporter(config);
    await reporter.executeDDTFAndReport(
      'chatbot_support',
      ['quality_check'],
      runId
    );
  }
  
  res.json({ success: true });
});

app.listen(3003, () => {
  console.log('TestRail webhook handler running on port 3003');
});
```

## Best Practices

1. **Test Mapping**: Maintain clear mapping between DDTF tests and TestRail cases
2. **Custom Fields**: Use custom fields to store AI-specific metrics
3. **Automated Runs**: Schedule regular DDTF test runs via CI/CD
4. **Detailed Comments**: Include comprehensive test details in TestRail comments
5. **Milestones**: Link test runs to TestRail milestones for release tracking
6. **Dashboards**: Create TestRail dashboards to visualize AI quality trends

## TestRail Dashboard Configuration

Create custom dashboard with:
- AI Quality Trend (pass rate over time)
- Average AI Score by Agent
- Cost per Test Run
- Hallucination Detection Rate
- Model Performance Comparison

## Reporting Example

TestRail test result will show:
```
Status: Passed ✓
Score: 85/100
Model: claude-3-5-sonnet
Cost: $0.023
Duration: 3.2s

Test Details:
- Accuracy: 90%
- Relevance: 85%
- No hallucinations detected

Input: "What is your refund policy?"
Expected: Clear policy explanation
Actual: "Our refund policy allows returns within 30 days..."
```
