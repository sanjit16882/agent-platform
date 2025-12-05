# Mock Definitions

This directory contains mock definitions for simulating external dependencies during testing.

## Overview

Mock definitions allow the testing framework to run without requiring live connections to external services like AWS Bedrock or MCP servers. This enables:

- **Offline Testing**: Run tests without internet connectivity
- **Consistent Results**: Predictable responses for reliable testing
- **Fast Execution**: No network latency or API rate limits
- **Cost Savings**: No charges for API calls during testing
- **Safe Testing**: No risk of affecting production systems

## Mock Files

### bedrock-mocks.json
Mock definitions for AWS Bedrock LLM service:
- Claude v2 model responses
- Titan model responses
- Error scenarios (throttling, invalid model)
- Model listing
- Connection testing

### mcp-mocks.json
Mock definitions for MCP (Model Context Protocol) servers:
- Tool listing
- Search tool responses
- Calculator tool responses
- File read tool responses
- Error scenarios

## Mock Definition Format

```json
{
  "id": "unique-mock-id",
  "service": "service-name",
  "endpoint": "/api/endpoint",
  "method": "POST",
  "request_matcher": {
    "field": "value"
  },
  "response": {
    "status": 200,
    "body": {
      "data": "response data"
    },
    "latency_ms": 250,
    "headers": {
      "Content-Type": "application/json"
    }
  }
}
```

### Fields

- **id**: Unique identifier for the mock
- **service**: Service name (e.g., "bedrock", "mcp")
- **endpoint**: API endpoint path
- **method**: HTTP method (GET, POST, PUT, DELETE)
- **request_matcher** (optional): Match specific request fields
- **response**: Mock response definition
  - **status**: HTTP status code
  - **body**: Response body (JSON)
  - **latency_ms** (optional): Simulated network latency
  - **headers** (optional): Response headers

## Usage

### Enable Mock Mode

Set environment variable:
```bash
TESTING_MOCK_ENABLED=true
```

### Load Mocks

Mocks are automatically loaded when the testing service starts:

```javascript
const MockRegistry = require('./services/mockRegistry');
const MockLoader = require('./services/mockLoader');

const registry = new MockRegistry();
const loader = new MockLoader(registry);

await loader.loadAll();
```

### Hot-Reload

Enable hot-reloading to automatically reload mocks when files change:

```bash
TESTING_MOCK_HOT_RELOAD=true
```

## Creating Custom Mocks

1. Create a new JSON file in this directory
2. Follow the mock definition format
3. Add your mock definitions to the "mocks" array
4. Restart the service or wait for hot-reload

### Example

```json
{
  "description": "Custom mocks for my service",
  "version": "1.0",
  "mocks": [
    {
      "id": "my-custom-mock",
      "service": "my-service",
      "endpoint": "/api/my-endpoint",
      "method": "POST",
      "response": {
        "status": 200,
        "body": {
          "message": "Custom response"
        },
        "latency_ms": 100
      }
    }
  ]
}
```

## Testing Mocks

Test that mocks are working:

```bash
# Check mock registry stats
curl http://localhost:3002/api/testing/mocks/stats

# List all loaded mocks
curl http://localhost:3002/api/testing/mocks/list
```

## Best Practices

1. **Realistic Responses**: Make mock responses similar to real API responses
2. **Include Errors**: Add error scenarios for comprehensive testing
3. **Vary Latency**: Use different latency values to simulate real conditions
4. **Document Mocks**: Add descriptions to explain what each mock does
5. **Version Control**: Keep mock files in version control
6. **Update Regularly**: Keep mocks in sync with actual API changes

## Troubleshooting

### Mocks Not Loading

- Check that mock files are valid JSON
- Verify file names end with `.json`
- Check console logs for parsing errors
- Ensure mocks directory path is correct

### Mocks Not Matching

- Verify endpoint paths match exactly
- Check HTTP method matches
- Review request_matcher fields
- Check mock registry stats for match counts

### Hot-Reload Not Working

- Ensure `TESTING_MOCK_HOT_RELOAD=true`
- Check file system permissions
- Verify mocks directory is accessible
- Check console logs for watcher errors
