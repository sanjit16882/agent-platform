# Testing API Endpoints

API endpoints for the DDATF (Dimension-Driven Agent Testing Framework).

## Base URL

```
/api/testing
```

---

## Endpoints

### 1. Execute Tests

Execute tests for an agent with a specific model.

**Endpoint**: `POST /api/testing/execute`

**Request Body**:
```json
{
  "agentId": "agent-001",
  "modelId": "claude-3-haiku",
  "testSuiteId": "universal",
  "options": {
    "mode": "demo",
    "timeout": 30000
  }
}
```

**Response**:
```json
{
  "runId": "run_1234567890_abc123",
  "agentId": "agent-001",
  "modelId": "claude-3-haiku",
  "summary": {
    "total": 50,
    "passed": 48,
    "failed": 2,
    "errors": 0,
    "passRate": 96.0
  },
  "costs": {
    "total": 0.125,
    "perTest": 0.0025,
    "details": {
      "summary": { ... },
      "byModel": { ... },
      "comparison": { ... }
    }
  },
  "results": [
    {
      "id": "result-001",
      "testId": "Q001",
      "status": "passed",
      "duration": 1250,
      "cost": 0.0025
    }
  ],
  "timestamp": "2024-11-19T10:30:00Z"
}
```

---

### 2. Compare Models

Compare multiple models for the same agent.

**Endpoint**: `POST /api/testing/compare-models`

**Request Body**:
```json
{
  "agentId": "agent-001",
  "models": ["claude-3-haiku", "claude-3.5-sonnet", "amazon-titan-text-express"],
  "testSuiteId": "universal",
  "options": {
    "mode": "demo",
    "timeout": 30000
  }
}
```

**Response**:
```json
{
  "comparisonId": "cmp_1234567890_abc123",
  "agentId": "agent-001",
  "models": [
    {
      "modelId": "claude-3-haiku",
      "runId": "cmp_1234567890_abc123_claude-3-haiku",
      "accuracy": 92.0,
      "totalTests": 50,
      "passed": 46,
      "failed": 4,
      "totalCost": 0.125,
      "avgCostPerTest": 0.0025
    },
    {
      "modelId": "claude-3.5-sonnet",
      "runId": "cmp_1234567890_abc123_claude-3.5-sonnet",
      "accuracy": 98.0,
      "totalTests": 50,
      "passed": 49,
      "failed": 1,
      "totalCost": 0.750,
      "avgCostPerTest": 0.015
    }
  ],
  "winners": {
    "bestAccuracy": "claude-3.5-sonnet",
    "cheapest": "claude-3-haiku",
    "bestValue": "claude-3-haiku"
  },
  "insights": [
    "claude-3.5-sonnet is 6.0% more accurate but costs 500.0% more",
    "claude-3-haiku offers excellent accuracy (92.0%) at the lowest cost"
  ],
  "recommendation": "claude-3-haiku",
  "timestamp": "2024-11-19T10:30:00Z"
}
```

---

### 3. Get Cost Report

Get detailed cost report for a test run.

**Endpoint**: `GET /api/testing/costs/:runId`

**Response**:
```json
{
  "summary": {
    "runId": "run_1234567890_abc123",
    "totalCost": 0.125,
    "totalTokens": 15000,
    "testCount": 50,
    "averageCostPerTest": 0.0025,
    "averageTokensPerTest": 300
  },
  "byModel": {
    "claude-3-haiku": {
      "modelId": "claude-3-haiku",
      "totalCost": 0.125,
      "totalTokens": 15000,
      "testCount": 50,
      "averageCostPerTest": 0.0025,
      "averageTokensPerTest": 300
    }
  },
  "comparison": {
    "cheapest": {
      "modelId": "claude-3-haiku",
      "cost": 0.125,
      "costPerTest": 0.0025
    },
    "mostExpensive": {
      "modelId": "claude-3-haiku",
      "cost": 0.125,
      "costPerTest": 0.0025
    },
    "savings": {
      "amount": 0,
      "percent": 0
    },
    "recommendation": "Cost difference between models is minimal (0.0%)"
  },
  "tests": [
    {
      "testId": "result-001",
      "modelId": "claude-3-haiku",
      "cost": 0.0025,
      "tokens": 300,
      "timestamp": "2024-11-19T10:30:00Z"
    }
  ]
}
```

---

### 4. Compare Model Costs

Compare costs between models in a run.

**Endpoint**: `GET /api/testing/costs/compare/:runId`

**Response**:
```json
{
  "cheapest": {
    "modelId": "claude-3-haiku",
    "cost": 0.125,
    "costPerTest": 0.0025
  },
  "mostExpensive": {
    "modelId": "claude-3.5-sonnet",
    "cost": 0.750,
    "costPerTest": 0.015
  },
  "savings": {
    "amount": 0.625,
    "percent": 83.3
  },
  "recommendation": "Using claude-3-haiku could save 83.3% in costs"
}
```

---

### 5. Get Testing Statistics

Get overall testing statistics.

**Endpoint**: `GET /api/testing/stats`

**Response**:
```json
{
  "tests": {
    "totalRuns": 150,
    "totalTests": 7500,
    "passed": 7200,
    "failed": 300,
    "passRate": 96.0,
    "avgDuration": 1250
  },
  "costs": {
    "totalCost": 18.75,
    "totalTokens": 2250000,
    "avgCostPerTest": 0.0025
  },
  "timestamp": "2024-11-19T10:30:00Z"
}
```

---

### 6. Export Cost Data

Export cost data as CSV.

**Endpoint**: `POST /api/testing/export-costs/:runId`

**Response**: CSV file download

```csv
Test ID,Model ID,Input Tokens,Output Tokens,Total Tokens,Cost,Timestamp
result-001,claude-3-haiku,100,200,300,0.0025,2024-11-19T10:30:00Z
result-002,claude-3-haiku,150,250,400,0.0030,2024-11-19T10:30:15Z
```

---

## Error Responses

All endpoints return standard error responses:

```json
{
  "error": "Error type",
  "message": "Detailed error message"
}
```

**Status Codes**:
- `400` - Bad Request (missing or invalid parameters)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

---

## Usage Examples

### Execute Tests (cURL)

```bash
curl -X POST http://localhost:3000/api/testing/execute \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "agent-001",
    "modelId": "claude-3-haiku",
    "options": {
      "mode": "demo"
    }
  }'
```

### Compare Models (cURL)

```bash
curl -X POST http://localhost:3000/api/testing/compare-models \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "agent-001",
    "models": ["claude-3-haiku", "claude-3.5-sonnet"]
  }'
```

### Get Cost Report (cURL)

```bash
curl http://localhost:3000/api/testing/costs/run_1234567890_abc123
```

### Export Costs (cURL)

```bash
curl -X POST http://localhost:3000/api/testing/export-costs/run_1234567890_abc123 \
  -o costs.csv
```

---

## Integration

### Express.js Integration

```javascript
const express = require('express');
const testingRoutes = require('./routes/testing');

const app = express();
app.use(express.json());

// Add database to app locals
app.locals.db = database;

// Mount testing routes
app.use('/api/testing', testingRoutes);

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

---

## Notes

- All costs are in USD
- Token counts are estimates (4 characters ≈ 1 token)
- Demo mode uses simulated responses
- Real mode requires AWS Bedrock credentials
- Cost tracking is automatic when enabled
- Database triggers maintain cost summaries

---

## See Also

- [Framework Documentation](../framework/QUICKSTART.md)
- [Cost Tracking Guide](../framework/services/CostTracker.js)
- [Agent Execution Service](../framework/services/AgentExecutionService.js)
