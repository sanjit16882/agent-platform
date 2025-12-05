# DDTF Integration Architecture

## Overview

This document describes the technical architecture of DDTF integrations with external testing frameworks and test management tools.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     Testing Frameworks Layer                     │
├──────────────┬──────────────┬──────────────┬───────────────────┤
│ Robot        │ Selenium     │ Cypress      │ JUnit / Pytest    │
│ Framework    │ WebDriver    │              │                   │
└──────┬───────┴──────┬───────┴──────┬───────┴──────┬────────────┘
       │              │              │              │
       │              │              │              │
       ▼              ▼              ▼              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Integration Layer                             │
├──────────────┬──────────────┬──────────────┬───────────────────┤
│ REST API     │ CLI Tool     │ SDK/Library  │ Plugins           │
│ Calls        │ Commands     │ Methods      │ Custom Wrappers   │
└──────┬───────┴──────┬───────┴──────┬───────┴──────┬────────────┘
       │              │              │              │
       └──────────────┴──────────────┴──────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DDTF Core API                               │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  POST /api/testing/execute                             │    │
│  │  GET  /api/testing/results/:runId                      │    │
│  │  GET  /api/testing/library/list                        │    │
│  │  POST /api/testing/library/create                      │    │
│  └────────────────────────────────────────────────────────┘    │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Test Execution Engine                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │ Test Runner │  │ AI Models   │  │ Evaluator   │            │
│  │             │→ │ (Bedrock)   │→ │             │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Results & Reporting                           │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐               │
│  │ JSON       │  │ JUnit XML  │  │ TAP        │               │
│  │ Results    │  │ Export     │  │ Format     │               │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘               │
└────────┼───────────────┼───────────────┼────────────────────────┘
         │               │               │
         ▼               ▼               ▼
┌─────────────────────────────────────────────────────────────────┐
│                Test Management Tools Layer                       │
├──────────────┬──────────────┬──────────────┬───────────────────┤
│ TestRail     │ Xray (Jira)  │ qTest        │ Custom TM         │
└──────────────┴──────────────┴──────────────┴───────────────────┘
```

## Integration Patterns

### Pattern 1: Direct API Integration

```
Test Framework → HTTP Request → DDTF API → Response → Test Framework
```

**Characteristics:**
- Language agnostic
- No dependencies
- Maximum flexibility
- Requires HTTP client

**Example:**
```javascript
// Any language with HTTP support
POST http://localhost:3002/api/testing/execute
{
  "agentId": "chatbot",
  "testIds": ["quality_check"]
}
```

### Pattern 2: CLI Integration

```
Test Framework → Shell Command → DDTF CLI → DDTF API → Results File
```

**Characteristics:**
- Simple integration
- Works with any CI/CD tool
- File-based results
- Process-based execution

**Example:**
```bash
# From any test framework
agent-test run --agent chatbot --output results.json
```

### Pattern 3: SDK Integration

```
Test Framework → SDK Method → DDTF API → Parsed Response → Test Framework
```

**Characteristics:**
- Type-safe (TypeScript)
- Promise-based
- Built-in retry logic
- Automatic polling

**Example:**
```typescript
import { DDTFClient } from '@agent-hub/testing-sdk';
const client = new DDTFClient();
const results = await client.executeTest({agentId: 'chatbot'});
```

### Pattern 4: Plugin/Library Integration

```
Test Framework → Native Command → Plugin/Library → DDTF API → Native Result
```

**Characteristics:**
- Framework-native syntax
- Deep integration
- Custom assertions
- Framework-specific features

**Example:**
```python
# Pytest plugin
def test_ai_quality(ddtf_client):
    result = ddtf_client.execute_test('chatbot', ['quality_check'])
    assert result.pass_rate >= 80
```

## Data Flow

### Test Execution Flow

```
1. Test Request
   ↓
2. DDTF API receives request
   ↓
3. Test Execution Service
   ├→ Load test definitions
   ├→ Prepare test inputs
   └→ Execute tests
       ↓
4. AI Model Invocation
   ├→ AWS Bedrock API
   ├→ Model inference
   └→ Response capture
       ↓
5. Evaluation Engine
   ├→ Score calculation
   ├→ Hallucination detection
   └→ Quality metrics
       ↓
6. Results Storage
   ├→ In-memory cache
   ├→ S3 storage
   └→ Database (optional)
       ↓
7. Response to Client
   ├→ JSON format
   ├→ JUnit XML (if requested)
   └→ Custom format
       ↓
8. Test Management Integration
   ├→ TestRail API
   ├→ Xray API
   └→ qTest API
```

### Webhook Flow

```
1. Test Management Tool
   ↓ (Webhook trigger)
2. DDTF Webhook Handler
   ↓
3. Parse webhook payload
   ↓
4. Execute DDTF tests
   ↓
5. Wait for completion
   ↓
6. Report results back
   ↓ (API call)
7. Test Management Tool
```

## Component Responsibilities

### DDTF Core
- Test execution orchestration
- AI model integration
- Result evaluation
- Data storage

### Integration Layer
- Protocol translation (HTTP, CLI, SDK)
- Authentication handling
- Error handling and retry
- Result formatting

### Test Framework Adapters
- Framework-specific syntax
- Native assertions
- Test lifecycle hooks
- Reporting integration

### Test Management Connectors
- Bidirectional sync
- Test case mapping
- Result reporting
- Webhook handling

## Security Considerations

### API Authentication
```
Client → API Key Header → DDTF API → Validate → Execute
```

### Test Management Integration
```
DDTF → OAuth/API Token → Test Management Tool → Validate → Update
```

### Data Privacy
- Test inputs/outputs encrypted in transit (HTTPS)
- Sensitive data masked in logs
- API keys stored securely (environment variables)
- Results access controlled by API keys

## Scalability

### Horizontal Scaling
```
Load Balancer
    ├→ DDTF Instance 1
    ├→ DDTF Instance 2
    └→ DDTF Instance N
         ↓
    Shared Storage (S3)
```

### Async Processing
```
Client Request → Queue → Worker Pool → Results Cache
```

### Caching Strategy
```
Test Results → Redis Cache → 24h TTL
Test Definitions → In-Memory → Hot reload
```

## Error Handling

### Retry Logic
```
Request → Attempt 1 → Fail → Wait → Attempt 2 → Fail → Wait → Attempt 3
                                                                    ↓
                                                              Return Error
```

### Timeout Handling
```
Request → Start Timer → Execute → Check Timer → Timeout? → Cancel & Return
```

### Graceful Degradation
```
Primary API → Fail → Fallback API → Fail → Cached Results → Fail → Error
```

## Monitoring & Observability

### Metrics
- Test execution count
- Pass/fail rates
- Average execution time
- API response times
- Error rates

### Logging
- Request/response logs
- Error logs with stack traces
- Performance logs
- Integration logs

### Tracing
- Distributed tracing (OpenTelemetry)
- Request correlation IDs
- End-to-end test execution tracking

## Performance Optimization

### Parallel Execution
```
Test Suite → Split → [Test 1, Test 2, Test 3] → Execute in Parallel → Merge Results
```

### Batch Processing
```
Multiple Tests → Batch Request → Single API Call → Parallel Execution → Batch Response
```

### Result Caching
```
Test Request → Check Cache → Hit? → Return Cached → Miss? → Execute → Cache → Return
```

## Future Enhancements

1. **GraphQL API**: Alternative to REST for flexible queries
2. **gRPC Support**: High-performance binary protocol
3. **Message Queue Integration**: Kafka/RabbitMQ for async processing
4. **Real-time Updates**: WebSocket for live test progress
5. **Multi-tenancy**: Isolated environments per organization
