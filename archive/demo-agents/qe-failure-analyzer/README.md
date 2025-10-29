# QE Failure Analyzer Agent

## Overview
Advanced test failure analysis agent that helps QE teams quickly identify root causes of test failures and provides actionable fix recommendations.

## Features
- **Intelligent Categorization**: Automatically categorizes failures (timeout, network, assertion, async, etc.)
- **Root Cause Analysis**: Identifies likely causes based on error patterns and stack traces
- **Fix Recommendations**: Provides specific, actionable steps to resolve issues
- **Priority Assessment**: Ranks failures by urgency and impact
- **Pattern Detection**: Identifies trends across multiple failures

## Docker Usage

### Build the Image
```bash
docker build -t qe-failure-analyzer:1.0.0 .
```

### Run the Container
```bash
docker run -p 8080:8080 -e OPENAI_API_KEY=your_key qe-failure-analyzer:1.0.0
```

### Demo Image Details
- **Image Name**: `qe-failure-analyzer:1.0.0`
- **Registry**: `your-registry.com/qe-failure-analyzer:1.0.0`
- **Size**: ~200MB
- **Ports**: 8080 (HTTP API)
- **Environment Variables**: 
  - `OPENAI_API_KEY` (optional for demo)

## API Endpoints

### POST /analyze
Analyze test failures and get recommendations
```json
{
  "failures": [
    {
      "test_name": "user login test",
      "error_message": "Timeout: Element not found",
      "stack_trace": "at waitForElement...",
      "test_file": "login.test.js"
    }
  ],
  "test_framework": "jest",
  "project_context": "E-commerce web application"
}
```

### GET /health
Health check endpoint

### GET /info
Agent metadata and capabilities

## Example Analysis Output
```json
{
  "summary": "Analyzed 5 test failures. Most common issue: Timeout. Found 2 high-priority issues.",
  "total_failures": 5,
  "categories": {
    "timeout": 2,
    "assertion": 2,
    "network": 1
  },
  "analyses": [
    {
      "failure_category": "timeout",
      "root_cause": "Test execution exceeded time limit, likely due to slow operations",
      "confidence_score": 0.85,
      "suggested_fixes": [
        "Increase timeout threshold for slow operations",
        "Add proper wait conditions for async operations"
      ],
      "priority": "high"
    }
  ],
  "recommendations": [
    "Consider implementing a comprehensive timeout strategy",
    "High number of critical failures detected - consider immediate team review"
  ],
  "estimated_fix_time": "4.5 hours"
}
```

## Integration Examples

### CI/CD Pipeline
```yaml
- name: Analyze Test Failures
  run: |
    curl -X POST http://qe-analyzer:8080/analyze \
      -H "Content-Type: application/json" \
      -d @test-failures.json
```

### Jest Integration
```javascript
// Custom Jest reporter
class FailureAnalyzerReporter {
  onTestResult(test, testResult) {
    if (testResult.numFailingTests > 0) {
      // Send failures to analyzer
      analyzeFailures(testResult.testResults);
    }
  }
}
```

## Demo Script
1. **Upload**: Use Docker image `qe-failure-analyzer:1.0.0`
2. **Configure**: Set basic environment variables
3. **Test**: Send sample failure data
4. **Show Results**: Display categorized analysis and recommendations
5. **Manage**: Edit configuration, view logs, or delete agent