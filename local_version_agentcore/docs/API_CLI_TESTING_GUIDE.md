# Agent Testing API & CLI Guide

## Overview

This guide covers the API endpoints and CLI tools for programmatic agent testing. Developers and SDETs can use these tools to:

- Create and manage test suites programmatically
- Execute tests from CI/CD pipelines
- Extend the test library with custom tests
- Automate test execution and reporting

---

## Table of Contents

1. [REST API](#rest-api)
2. [CLI Tool](#cli-tool)
3. [SDK/Client Library](#sdk-client-library)
4. [CI/CD Integration](#cicd-integration)
5. [Examples](#examples)

---

## REST API

### Base URL
```
http://localhost:3002/api/v1/testing
```

### Authentication
All API requests require an API key in the header:
```
Authorization: Bearer YOUR_API_KEY
```

---

### Endpoints

#### 1. Test Management

##### GET /tests
Get all available tests

**Query Parameters:**
- `category` (optional): Filter by category (functional, safety, hallucination, performance)
- `agentType` (optional): Filter by agent type
- `tags` (optional): Comma-separated tags

**Response:**
```json
{
  "tests": [
    {
      "id": "test_001",
      "name": "Data Transformation",
      "category": "functional",
      "description": "Tests data transformation capability",
      "input_format": "plain_text",
      "expected_output_type": "structured",
      "scoring_criteria": {
        "accuracy": 0.4,
        "completeness": 0.3,
        "format": 0.3
      }
    }
  ],
  "total": 25
}
```

##### POST /tests
Create a custom test

**Request Body:**
```json
{
  "name": "Custom API Test",
  "category": "functional",
  "description": "Tests API integration",
  "input_format": "json",
  "expected_output_type": "json",
  "scoring_criteria": {
    "accuracy": 0.5,
    "latency": 0.3,
    "format": 0.2
  },
  "sample_prompts": [
    "Fetch user data from API",
    "Process API response"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "test": {
    "id": "custom_test_001",
    "name": "Custom API Test",
    "created_at": "2025-11-27T10:00:00Z"
  }
}
```

##### PUT /tests/:testId
Update an existing test

##### DELETE /tests/:testId
Delete a test

---

#### 2. Test Execution

##### POST /execute
Execute tests for an agent

**Request Body:**
```json
{
  "agentId": "agent_123",
  "modelIds": ["claude-3-5-sonnet", "gpt-4"],
  "testIds": ["test_001", "test_002"],
  "inputs": {
    "test_001": {
      "content": "Transform this data: {name: 'John', age: 30}",
      "format": "plain_text"
    },
    "test_002": {
      "content": "Calculate factorial of 5",
      "format": "plain_text"
    }
  },
  "knowledgeConfig": {
    "vectorDB": {
      "enabled": true,
      "knowledgeBases": ["kb_001"],
      "retrievalConfig": {
        "topK": 5,
        "minSimilarity": 0.7
      }
    },
    "mcp": {
      "enabled": false,
      "selectedServers": []
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "runId": "run_abc123",
  "status": "queued",
  "estimatedTime": 45,
  "message": "Test execution started"
}
```

##### GET /execute/:runId
Get execution status and results

**Response:**
```json
{
  "runId": "run_abc123",
  "status": "completed",
  "agentId": "agent_123",
  "startTime": "2025-11-27T10:00:00Z",
  "endTime": "2025-11-27T10:00:45Z",
  "totalTests": 2,
  "passedTests": 2,
  "passRate": 100,
  "averageScore": 85.5,
  "results": [
    {
      "testId": "test_001",
      "testName": "Data Transformation",
      "passed": true,
      "score": 90,
      "latency": 1200,
      "cost": 0.002,
      "output": "Transformed data successfully",
      "scoreBreakdown": {
        "accuracy": 0.95,
        "completeness": 0.90,
        "format": 0.85
      }
    }
  ]
}
```

##### POST /execute/batch
Execute multiple test runs in batch

**Request Body:**
```json
{
  "runs": [
    {
      "agentId": "agent_123",
      "modelIds": ["claude-3-5-sonnet"],
      "testIds": ["test_001"]
    },
    {
      "agentId": "agent_456",
      "modelIds": ["gpt-4"],
      "testIds": ["test_002"]
    }
  ]
}
```

---

#### 3. Results & Analytics

##### GET /runs
Get all test runs

**Query Parameters:**
- `agentId` (optional): Filter by agent
- `status` (optional): Filter by status (queued, running, completed, failed)
- `startDate` (optional): Filter by start date
- `endDate` (optional): Filter by end date
- `limit` (optional): Number of results (default: 50)
- `offset` (optional): Pagination offset

##### GET /analytics
Get analytics data

**Query Parameters:**
- `agentId` (optional): Filter by agent
- `days` (optional): Number of days (default: 30)

**Response:**
```json
{
  "totalTests": 150,
  "totalRuns": 25,
  "averagePassRate": 85.5,
  "averageScore": 78.2,
  "totalCost": 2.45,
  "categoryPerformance": [
    {
      "category": "functional",
      "passRate": 90.5,
      "count": 50,
      "avgScore": 82.3
    }
  ]
}
```

---

## CLI Tool

### Installation

```bash
npm install -g @agent-hub/testing-cli
```

Or use locally:
```bash
cd local_version/agent-hub-cli
npm install
npm link
```

### Configuration

Create a config file at `~/.agent-hub/config.json`:

```json
{
  "apiUrl": "http://localhost:3002",
  "apiKey": "your-api-key-here",
  "defaultAgent": "agent_123"
}
```

Or set environment variables:
```bash
export AGENT_HUB_API_URL=http://localhost:3002
export AGENT_HUB_API_KEY=your-api-key-here
```

---

### Commands

#### 1. Test Management

##### List all tests
```bash
agent-test list

# Filter by category
agent-test list --category functional

# Filter by tags
agent-test list --tags "api,integration"
```

##### Create a custom test
```bash
agent-test create \
  --name "Custom API Test" \
  --category functional \
  --description "Tests API integration" \
  --input-format json \
  --file ./test-definition.json
```

##### View test details
```bash
agent-test show test_001
```

##### Delete a test
```bash
agent-test delete custom_test_001
```

---

#### 2. Test Execution

##### Run tests
```bash
# Run specific tests
agent-test run \
  --agent agent_123 \
  --models claude-3-5-sonnet,gpt-4 \
  --tests test_001,test_002 \
  --input-file ./test-inputs.json

# Run all tests in a category
agent-test run \
  --agent agent_123 \
  --models claude-3-5-sonnet \
  --category functional

# Run with knowledge sources
agent-test run \
  --agent agent_123 \
  --models claude-3-5-sonnet \
  --tests test_001 \
  --vector-db \
  --knowledge-bases kb_001,kb_002 \
  --mcp \
  --mcp-servers server_001
```

##### Watch test execution
```bash
agent-test run --agent agent_123 --tests test_001 --watch
```

##### Run tests from a test suite file
```bash
agent-test run --suite ./test-suite.yaml
```

Example `test-suite.yaml`:
```yaml
name: "API Integration Test Suite"
agent: agent_123
models:
  - claude-3-5-sonnet
  - gpt-4
tests:
  - id: test_001
    input:
      content: "Transform this data"
      format: plain_text
  - id: test_002
    input:
      content: "Calculate factorial"
      format: plain_text
knowledgeConfig:
  vectorDB:
    enabled: true
    knowledgeBases:
      - kb_001
    retrievalConfig:
      topK: 5
      minSimilarity: 0.7
```

---

#### 3. Results & Reporting

##### View test run results
```bash
agent-test results run_abc123

# View with detailed breakdown
agent-test results run_abc123 --detailed

# Export results
agent-test results run_abc123 --export json --output ./results.json
agent-test results run_abc123 --export csv --output ./results.csv
```

##### List recent runs
```bash
agent-test runs

# Filter by agent
agent-test runs --agent agent_123

# Filter by status
agent-test runs --status completed

# Filter by date range
agent-test runs --start-date 2025-11-01 --end-date 2025-11-27
```

##### View analytics
```bash
agent-test analytics

# For specific agent
agent-test analytics --agent agent_123

# For specific time period
agent-test analytics --days 7

# Export analytics
agent-test analytics --export json --output ./analytics.json
```

---

#### 4. CI/CD Integration

##### Run tests and exit with status code
```bash
# Exit code 0 if all tests pass, 1 if any fail
agent-test run \
  --agent agent_123 \
  --tests test_001,test_002 \
  --ci-mode \
  --fail-threshold 80
```

##### Generate test report for CI
```bash
agent-test run \
  --agent agent_123 \
  --tests test_001,test_002 \
  --ci-mode \
  --report junit \
  --output ./test-results.xml
```

---

## SDK/Client Library

### Installation

```bash
npm install @agent-hub/testing-sdk
```

### Usage

```javascript
const { AgentTestingClient } = require('@agent-hub/testing-sdk');

// Initialize client
const client = new AgentTestingClient({
  apiUrl: 'http://localhost:3002',
  apiKey: 'your-api-key-here'
});

// List tests
const tests = await client.tests.list({ category: 'functional' });

// Create a custom test
const newTest = await client.tests.create({
  name: 'Custom Test',
  category: 'functional',
  description: 'My custom test',
  input_format: 'plain_text',
  expected_output_type: 'text',
  scoring_criteria: {
    accuracy: 0.5,
    completeness: 0.5
  }
});

// Execute tests
const run = await client.execute({
  agentId: 'agent_123',
  modelIds: ['claude-3-5-sonnet'],
  testIds: ['test_001', 'test_002'],
  inputs: {
    test_001: {
      content: 'Test input',
      format: 'plain_text'
    }
  }
});

// Wait for completion
const results = await client.waitForCompletion(run.runId, {
  timeout: 60000,
  pollInterval: 2000
});

// Get analytics
const analytics = await client.analytics.get({
  agentId: 'agent_123',
  days: 30
});
```

### TypeScript Support

```typescript
import { AgentTestingClient, TestRun, TestResult } from '@agent-hub/testing-sdk';

const client = new AgentTestingClient({
  apiUrl: 'http://localhost:3002',
  apiKey: process.env.AGENT_HUB_API_KEY!
});

const run: TestRun = await client.execute({
  agentId: 'agent_123',
  modelIds: ['claude-3-5-sonnet'],
  testIds: ['test_001']
});

const results: TestResult[] = await client.getResults(run.runId);
```

---

## CI/CD Integration

### GitHub Actions

```yaml
name: Agent Testing

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
    
    - name: Install Agent Testing CLI
      run: npm install -g @agent-hub/testing-cli
    
    - name: Run Agent Tests
      env:
        AGENT_HUB_API_URL: ${{ secrets.AGENT_HUB_API_URL }}
        AGENT_HUB_API_KEY: ${{ secrets.AGENT_HUB_API_KEY }}
      run: |
        agent-test run \
          --agent agent_123 \
          --models claude-3-5-sonnet \
          --category functional \
          --ci-mode \
          --fail-threshold 80 \
          --report junit \
          --output ./test-results.xml
    
    - name: Publish Test Results
      uses: EnricoMi/publish-unit-test-result-action@v2
      if: always()
      with:
        files: ./test-results.xml
```

### Jenkins

```groovy
pipeline {
    agent any
    
    environment {
        AGENT_HUB_API_URL = credentials('agent-hub-api-url')
        AGENT_HUB_API_KEY = credentials('agent-hub-api-key')
    }
    
    stages {
        stage('Install CLI') {
            steps {
                sh 'npm install -g @agent-hub/testing-cli'
            }
        }
        
        stage('Run Tests') {
            steps {
                sh '''
                    agent-test run \
                      --agent agent_123 \
                      --models claude-3-5-sonnet \
                      --category functional \
                      --ci-mode \
                      --fail-threshold 80 \
                      --report junit \
                      --output ./test-results.xml
                '''
            }
        }
        
        stage('Publish Results') {
            steps {
                junit 'test-results.xml'
            }
        }
    }
}
```

### GitLab CI

```yaml
agent-testing:
  stage: test
  image: node:18
  script:
    - npm install -g @agent-hub/testing-cli
    - |
      agent-test run \
        --agent agent_123 \
        --models claude-3-5-sonnet \
        --category functional \
        --ci-mode \
        --fail-threshold 80 \
        --report junit \
        --output ./test-results.xml
  artifacts:
    reports:
      junit: test-results.xml
```

---

## Examples

### Example 1: Create and Run Custom Test

```bash
# 1. Create test definition file
cat > custom-test.json << EOF
{
  "name": "API Response Validation",
  "category": "functional",
  "description": "Validates API response format and content",
  "input_format": "json",
  "expected_output_type": "json",
  "scoring_criteria": {
    "accuracy": 0.4,
    "format": 0.3,
    "completeness": 0.3
  },
  "sample_prompts": [
    "Validate this API response: {\"status\": 200, \"data\": {\"user\": \"John\"}}",
    "Check if API response contains required fields"
  ]
}
EOF

# 2. Create the test
agent-test create --file custom-test.json

# 3. Create input file
cat > test-input.json << EOF
{
  "content": "Validate this API response: {\"status\": 200, \"data\": {\"user\": \"John\", \"email\": \"john@example.com\"}}",
  "format": "json"
}
EOF

# 4. Run the test
agent-test run \
  --agent agent_123 \
  --models claude-3-5-sonnet \
  --tests custom_test_001 \
  --input-file test-input.json \
  --watch

# 5. View results
agent-test results <run_id> --detailed
```

### Example 2: Programmatic Test Suite

```javascript
const { AgentTestingClient } = require('@agent-hub/testing-sdk');

async function runTestSuite() {
  const client = new AgentTestingClient({
    apiUrl: 'http://localhost:3002',
    apiKey: process.env.AGENT_HUB_API_KEY
  });

  // Create custom tests
  const tests = await Promise.all([
    client.tests.create({
      name: 'Test 1: Data Validation',
      category: 'functional',
      description: 'Validates data format',
      input_format: 'json',
      expected_output_type: 'json',
      scoring_criteria: { accuracy: 0.5, format: 0.5 }
    }),
    client.tests.create({
      name: 'Test 2: Error Handling',
      category: 'safety',
      description: 'Tests error handling',
      input_format: 'plain_text',
      expected_output_type: 'text',
      scoring_criteria: { accuracy: 0.6, safety: 0.4 }
    })
  ]);

  // Execute tests
  const run = await client.execute({
    agentId: 'agent_123',
    modelIds: ['claude-3-5-sonnet', 'gpt-4'],
    testIds: tests.map(t => t.id),
    inputs: {
      [tests[0].id]: {
        content: '{"name": "John", "age": 30}',
        format: 'json'
      },
      [tests[1].id]: {
        content: 'Handle this error: Division by zero',
        format: 'plain_text'
      }
    }
  });

  // Wait for completion
  console.log('Waiting for test completion...');
  const results = await client.waitForCompletion(run.runId);

  // Analyze results
  console.log(`\nTest Results:`);
  console.log(`Pass Rate: ${results.passRate}%`);
  console.log(`Average Score: ${results.averageScore}`);
  
  results.results.forEach(result => {
    console.log(`\n${result.testName}:`);
    console.log(`  Passed: ${result.passed}`);
    console.log(`  Score: ${result.score}`);
    console.log(`  Latency: ${result.latency}ms`);
  });

  // Cleanup
  await Promise.all(tests.map(t => client.tests.delete(t.id)));
}

runTestSuite().catch(console.error);
```

### Example 3: CI/CD Integration Script

```bash
#!/bin/bash
# ci-test.sh - Run agent tests in CI/CD pipeline

set -e

# Configuration
AGENT_ID="agent_123"
MODELS="claude-3-5-sonnet,gpt-4"
FAIL_THRESHOLD=80

# Run tests
echo "Running agent tests..."
agent-test run \
  --agent "$AGENT_ID" \
  --models "$MODELS" \
  --category functional \
  --ci-mode \
  --fail-threshold "$FAIL_THRESHOLD" \
  --report junit \
  --output ./test-results.xml

# Check results
if [ $? -eq 0 ]; then
  echo "✅ All tests passed!"
  exit 0
else
  echo "❌ Tests failed!"
  exit 1
fi
```

---

## Error Handling

### API Error Responses

```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "Test ID 'test_999' not found",
    "details": {
      "field": "testIds",
      "value": "test_999"
    }
  }
}
```

### Common Error Codes

- `INVALID_INPUT`: Invalid request parameters
- `NOT_FOUND`: Resource not found
- `UNAUTHORIZED`: Invalid or missing API key
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `EXECUTION_FAILED`: Test execution failed
- `TIMEOUT`: Request timeout

---

## Best Practices

1. **Use test suites** for organizing related tests
2. **Version control** your test definitions
3. **Set appropriate timeouts** for long-running tests
4. **Monitor test costs** in production
5. **Use CI/CD integration** for automated testing
6. **Tag tests** for better organization
7. **Export results** for historical analysis
8. **Set fail thresholds** appropriate for your use case

---

## Support

For issues or questions:
- GitHub: https://github.com/your-org/agent-hub
- Documentation: https://docs.agent-hub.com
- Email: support@agent-hub.com
