# DDTF Integration Documentation

## Overview

This directory contains comprehensive integration guides for DDTF (Data-Driven Testing Framework) with popular testing frameworks and test management tools.

## Available Integrations

### Testing Frameworks

| Framework | Type | Complexity | Documentation |
|-----------|------|------------|---------------|
| [Robot Framework](./ROBOT_FRAMEWORK_INTEGRATION.md) | Test Automation | Low | REST API + Custom Library |
| [Selenium WebDriver](./SELENIUM_INTEGRATION.md) | UI Testing | Low | Side-by-Side Execution |
| [Cypress](./CYPRESS_INTEGRATION.md) | E2E Testing | Low | Custom Commands + Plugin |
| [JUnit](./JUNIT_INTEGRATION.md) | Java Testing | Medium | Maven Plugin + Client |
| [Pytest](./PYTEST_INTEGRATION.md) | Python Testing | Medium | Fixtures + Plugin |

### Test Management Tools

| Tool | Type | Complexity | Documentation |
|------|------|------------|---------------|
| [TestRail](./TESTRAIL_INTEGRATION.md) | Test Management | Medium | API Integration + Webhooks |
| [Xray (Jira)](./XRAY_JIRA_INTEGRATION.md) | Jira Plugin | Medium | REST API + Automation |
| [qTest](./QTEST_INTEGRATION.md) | Enterprise TM | Medium | API Integration |

## Integration Patterns

### 1. Side-by-Side Execution
Run DDTF tests alongside existing tests in CI/CD pipelines.

**Best for:** Teams with established testing frameworks

**Example:**
```yaml
test-pipeline:
  parallel:
    - run: robot tests/
    - run: agent-test run --agent chatbot
```

### 2. API Integration
Call DDTF REST API from any test framework.

**Best for:** Maximum flexibility and language independence

**Example:**
```python
import requests
response = requests.post('http://localhost:3002/api/testing/execute', 
                        json={'agentId': 'chatbot', 'testIds': ['quality_check']})
```

### 3. CLI Integration
Execute DDTF tests via command-line interface.

**Best for:** CI/CD pipelines and automation scripts

**Example:**
```bash
agent-test run --agent chatbot --tests quality_check --report junit
```

### 4. SDK Integration
Use JavaScript/TypeScript SDK for programmatic access.

**Best for:** Node.js applications and custom integrations

**Example:**
```javascript
const { DDTFClient } = require('@agent-hub/testing-sdk');
const client = new DDTFClient();
const results = await client.executeTest({agentId: 'chatbot'});
```

### 5. Plugin/Library
Framework-specific wrappers for native integration.

**Best for:** Deep integration with existing test suites

**Example:**
```robot
*** Settings ***
Library    DDTFLibrary

*** Test Cases ***
Test AI Quality
    ${result}=    Run DDTF Test    chatbot    quality_check
    Should Be True    ${result.passRate} >= 80
```

## Quick Start Guide

### 1. Choose Your Integration Method

Based on your current stack:
- **Java/Maven** → JUnit Integration
- **Python** → Pytest Integration
- **JavaScript/Node.js** → Cypress or SDK
- **Robot Framework** → Robot Framework Integration
- **Any Language** → REST API Integration

### 2. Install Required Components

```bash
# Install DDTF CLI
npm install -g @agent-hub/testing-cli

# Start DDTF service
agent-test serve

# Or use existing DDTF instance
export DDTF_API_URL=http://localhost:3002
```

### 3. Configure Integration

Follow the specific integration guide for your framework.

### 4. Run Tests

```bash
# Via CLI
agent-test run --agent my-agent --report junit

# Via framework
pytest tests/ai_tests.py
robot tests/ai_quality.robot
mvn test -Dtest=AIAgentTest
```

## Common Use Cases

### Use Case 1: E2E Testing with UI Validation
```
Selenium/Cypress → Interact with AI feature → DDTF validates response quality
```

### Use Case 2: API Testing with AI Validation
```
Postman/REST Assured → Call AI endpoint → DDTF validates accuracy
```

### Use Case 3: Regression Testing
```
CI/CD Pipeline → Run DDTF tests → Report to TestRail/Xray
```

### Use Case 4: Quality Gates
```
PR Trigger → DDTF tests → Block merge if quality < threshold
```

## Best Practices

### 1. Separation of Concerns
- Use existing frameworks for traditional testing (UI, API, unit)
- Use DDTF specifically for AI quality validation
- Don't try to replace your entire test suite with DDTF

### 2. CI/CD Integration
- Run DDTF tests in parallel with other tests
- Set appropriate quality thresholds
- Generate unified reports

### 3. Test Management
- Link DDTF tests to requirements in your TM tool
- Track AI quality metrics over time
- Create dashboards for visibility

### 4. Cost Management
- Monitor DDTF test costs
- Optimize test selection
- Use appropriate AI models for different test types

### 5. Reporting
- Export results to standard formats (JUnit XML, TAP)
- Integrate with existing reporting tools
- Create custom dashboards for AI metrics

## Support Matrix

| Feature | Robot | Selenium | Cypress | JUnit | Pytest | TestRail | Xray | qTest |
|---------|-------|----------|---------|-------|--------|----------|------|-------|
| REST API | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| CLI | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| SDK | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Plugin/Library | ✅ | ⚠️ | ✅ | ✅ | ✅ | N/A | N/A | N/A |
| Webhooks | N/A | N/A | N/A | N/A | N/A | ✅ | ✅ | ✅ |
| Auto-reporting | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ✅ | ✅ | ✅ |

✅ Fully Supported | ⚠️ Partial Support | N/A Not Applicable

## Getting Help

- **Documentation**: See individual integration guides
- **Examples**: Check `examples/` directory for sample code
- **API Reference**: See [API Documentation](../API_REFERENCE.md)
- **Issues**: Report integration issues on GitHub

## Contributing

We welcome contributions for additional integrations! See [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## License

See [LICENSE](../../LICENSE) for details.
