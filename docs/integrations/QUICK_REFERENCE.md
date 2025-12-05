# DDTF Integration Quick Reference

## One-Page Integration Guide

### REST API Integration (Any Language)

```bash
# Execute test
POST http://localhost:3002/api/testing/execute
{
  "agentId": "chatbot_support",
  "testIds": ["quality_check"],
  "models": ["claude-3-5-sonnet"]
}

# Get results
GET http://localhost:3002/api/testing/results/{runId}
```

### CLI Integration

```bash
# Install
npm install -g @agent-hub/testing-cli

# Run test
agent-test run --agent chatbot --tests quality_check --report junit

# List tests
agent-test list --category accuracy

# Get results
agent-test results {runId}
```

### Robot Framework

```robot
*** Settings ***
Library    RequestsLibrary

*** Test Cases ***
Test AI Quality
    ${response}=    POST    http://localhost:3002/api/testing/execute
    ...    json={"agentId": "chatbot", "testIds": ["quality_check"]}
    Should Be Equal As Strings    ${response.json()['success']}    True
```

### Selenium (Java)

```java
// Execute DDTF test
HttpClient client = HttpClient.newHttpClient();
String payload = "{\"agentId\":\"chatbot\",\"testIds\":[\"quality_check\"]}";
HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("http://localhost:3002/api/testing/execute"))
    .POST(HttpRequest.BodyPublishers.ofString(payload))
    .build();
HttpResponse<String> response = client.send(request, 
    HttpResponse.BodyHandlers.ofString());
```

### Cypress

```javascript
// Custom command
Cypress.Commands.add('validateAI', (agentId, testIds) => {
  return cy.request({
    method: 'POST',
    url: 'http://localhost:3002/api/testing/execute',
    body: { agentId, testIds }
  }).then((response) => {
    expect(response.body.success).to.be.true;
    return response.body.runId;
  });
});

// Usage
cy.validateAI('chatbot', ['quality_check']);
```

### JUnit

```java
@Test
public void testAIQuality() throws Exception {
    DDTFClient client = new DDTFClient("http://localhost:3002");
    TestRun result = client.executeTest(
        TestRequest.builder()
            .agentId("chatbot")
            .testIds(Arrays.asList("quality_check"))
            .build()
    );
    assertTrue(result.getPassRate() >= 80);
}
```

### Pytest

```python
def test_ai_quality(ddtf_client):
    result = ddtf_client.execute_test(
        agent_id="chatbot",
        test_ids=["quality_check"]
    )
    assert result["passRate"] >= 80
```

### TestRail Integration

```javascript
const reporter = new DDTFTestRailReporter(config);
const runId = await reporter.createTestRun("AI Tests");
await reporter.executeDDTFAndReport("chatbot", ["quality_check"], runId);
```

### Xray (Jira) Integration

```javascript
const reporter = new DDTFXrayReporter(config);
await reporter.executeDDTFAndReport(
    "chatbot", 
    ["quality_check"], 
    "AITEST-EXEC-123"
);
```

## CI/CD Examples

### GitHub Actions
```yaml
- name: AI Quality Tests
  run: |
    npm install -g @agent-hub/testing-cli
    agent-test run --agent chatbot --report junit --output results.xml
```

### Jenkins
```groovy
stage('AI Tests') {
    steps {
        sh 'agent-test run --agent chatbot --report junit'
        junit 'results.xml'
    }
}
```

### GitLab CI
```yaml
ai-tests:
  script:
    - agent-test run --agent chatbot --report junit
  artifacts:
    reports:
      junit: results.xml
```

## Common Patterns

### Pattern 1: Quality Gate
```javascript
const result = await ddtfClient.executeTest({agentId: 'chatbot'});
if (result.passRate < 80) {
    throw new Error('AI quality below threshold');
}
```

### Pattern 2: Parallel Testing
```bash
# Run multiple agents in parallel
agent-test run --agent chatbot &
agent-test run --agent search &
wait
```

### Pattern 3: Conditional Testing
```python
if is_ai_feature_enabled():
    result = ddtf_client.execute_test('chatbot', ['quality_check'])
    assert result['passRate'] >= 80
```

## Environment Variables

```bash
# DDTF API Configuration
export DDTF_API_URL=http://localhost:3002
export DDTF_API_KEY=your-api-key

# Test Configuration
export DDTF_TIMEOUT=300
export DDTF_RETRY_COUNT=3
export DDTF_MIN_PASS_RATE=80
```

## Response Format

```json
{
  "success": true,
  "runId": "run_123456",
  "status": "completed",
  "agentId": "chatbot_support",
  "agentName": "Support Chatbot",
  "totalTests": 5,
  "passedTests": 4,
  "passRate": 80,
  "averageScore": 85,
  "cost": 0.15,
  "duration": 12500,
  "results": [
    {
      "test_id": "quality_check",
      "test_name": "Quality Check",
      "passed": true,
      "score": 85,
      "explanation": "Test passed with good quality",
      "duration": 2500,
      "cost": 0.03
    }
  ]
}
```

## Error Handling

```javascript
try {
    const result = await ddtfClient.executeTest({agentId: 'chatbot'});
} catch (error) {
    if (error.code === 'TIMEOUT') {
        // Handle timeout
    } else if (error.code === 'API_ERROR') {
        // Handle API error
    } else {
        // Handle other errors
    }
}
```

## Best Practices

1. **Set Timeouts**: Always set appropriate timeouts
2. **Handle Errors**: Implement proper error handling
3. **Retry Logic**: Add retry for transient failures
4. **Parallel Execution**: Run tests in parallel when possible
5. **Quality Thresholds**: Define clear pass/fail criteria
6. **Cost Monitoring**: Track and optimize test costs
7. **Caching**: Cache results when appropriate
8. **Logging**: Log test execution for debugging

## Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| Connection refused | Check DDTF service is running |
| Timeout | Increase timeout or check network |
| 401 Unauthorized | Verify API key is correct |
| 404 Not Found | Check endpoint URL and agent ID |
| Test failed | Review test explanation in results |

## Support

- **Documentation**: `/docs/integrations/`
- **API Reference**: `/docs/API_REFERENCE.md`
- **Examples**: `/examples/`
- **Issues**: GitHub Issues

---

**Quick Start**: `npm install -g @agent-hub/testing-cli && agent-test run --agent my-agent`
