# Analytics and Execution History API

This document describes the Analytics and Execution History API endpoints for the Modular Agent Builder.

## Overview

The Analytics API provides comprehensive insights into agent execution patterns, costs, performance, and optimization opportunities. It supports:

- **Execution History**: Query and filter execution logs
- **Agent Analytics**: Aggregate metrics and trends
- **Vector DB Analytics**: Vector database usage statistics
- **Cost Optimization**: AI-powered recommendations

## Endpoints

### 1. Execution History

#### GET /api/v1/agents/:id/executions

List execution history for an agent with filtering and pagination.

**Query Parameters:**
- `mode` (optional): Filter by execution mode (`bedrock-only`, `rag`, `mcp`, `full-stack`)
- `status` (optional): Filter by status (`success`, `failed`, `timeout`)
- `startDate` (optional): Filter by start date (ISO 8601 format)
- `endDate` (optional): Filter by end date (ISO 8601 format)
- `limit` (optional): Number of results (default: 50, max: 500)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "executions": [
    {
      "id": "exec-123",
      "agent_id": "agent-456",
      "execution_mode": "rag",
      "status": "success",
      "started_at": "2024-11-12T10:00:00Z",
      "completed_at": "2024-11-12T10:00:01Z",
      "duration_ms": 1000,
      "input_text": "What is the capital of France?",
      "output_text": "The capital of France is Paris.",
      "documents_retrieved": 3,
      "tools_invoked": 0,
      "llm_cost": 0.50,
      "vector_db_cost": 0.25,
      "mcp_cost": 0,
      "total_cost": 0.75,
      "llm_latency_ms": 500,
      "vector_db_latency_ms": 200,
      "mcp_latency_ms": 0
    }
  ],
  "total": 150,
  "limit": 50,
  "offset": 0,
  "hasMore": true
}
```

#### GET /api/v1/agents/:id/executions/:executionId

Get detailed execution log for a specific execution.

**Response:**
```json
{
  "success": true,
  "execution": {
    "id": "exec-123",
    "agent_id": "agent-456",
    "execution_mode": "rag",
    "status": "success",
    "started_at": "2024-11-12T10:00:00Z",
    "completed_at": "2024-11-12T10:00:01Z",
    "duration_ms": 1000,
    "input_text": "What is the capital of France?",
    "output_text": "The capital of France is Paris.",
    "input_tokens": 50,
    "output_tokens": 20,
    "documents_retrieved": 3,
    "tools_invoked": 0,
    "tool_names": [],
    "llm_cost": 0.50,
    "vector_db_cost": 0.25,
    "mcp_cost": 0,
    "total_cost": 0.75,
    "llm_latency_ms": 500,
    "vector_db_latency_ms": 200,
    "mcp_latency_ms": 0,
    "metadata": {
      "model": "claude-3-sonnet",
      "temperature": 0.7,
      "knowledge_bases": ["kb-1"]
    }
  }
}
```

### 2. Agent Analytics

#### GET /api/v1/agents/:id/analytics

Get comprehensive analytics for an agent over a time period.

**Query Parameters:**
- `period` (optional): Time period (`24h`, `7d`, `30d`, `90d`) - default: `7d`

**Response:**
```json
{
  "success": true,
  "analytics": {
    "period": "7d",
    "totalExecutions": 1250,
    "successRate": 0.96,
    "modeDistribution": {
      "bedrock-only": { "count": 500, "percentage": 40 },
      "rag": { "count": 450, "percentage": 36 },
      "mcp": { "count": 200, "percentage": 16 },
      "full-stack": { "count": 100, "percentage": 8 }
    },
    "costBreakdown": {
      "total": 625.50,
      "llm": 500.00,
      "vectorDB": 100.50,
      "mcp": 25.00,
      "averagePerQuery": 0.50
    },
    "latencyBreakdown": {
      "average": 750,
      "p50": 600,
      "p95": 1200,
      "p99": 2000,
      "byComponent": {
        "llm": 500,
        "vectorDB": 150,
        "mcp": 100
      }
    },
    "successRatesByMode": {
      "bedrock-only": 0.98,
      "rag": 0.96,
      "mcp": 0.94,
      "full-stack": 0.92
    },
    "topErrors": [
      { "error": "Vector DB timeout", "count": 15, "percentage": 30 },
      { "error": "MCP tool unavailable", "count": 12, "percentage": 24 }
    ],
    "trends": [
      {
        "date": "2024-11-05",
        "executions": 180,
        "successRate": 0.96,
        "averageCost": 0.52,
        "averageLatency": 720
      }
    ]
  }
}
```

### 3. Vector DB Analytics

#### GET /api/v1/analytics/vector-db

Get Vector DB usage statistics across all agents or for a specific agent.

**Query Parameters:**
- `period` (optional): Time period (`24h`, `7d`, `30d`, `90d`) - default: `7d`
- `agentId` (optional): Filter by specific agent

**Response:**
```json
{
  "success": true,
  "analytics": {
    "period": "7d",
    "agentId": "all",
    "totalSearches": 550,
    "averageDocumentsRetrieved": 3.2,
    "averageSearchLatency": 180,
    "cacheHitRate": 0.35,
    "totalCost": 125.50,
    "averageCostPerSearch": 0.23,
    "costBreakdown": {
      "embeddingGeneration": 55.00,
      "vectorSearch": 45.50,
      "documentRetrieval": 25.00
    },
    "latencyDistribution": {
      "p50": 150,
      "p95": 300,
      "p99": 500,
      "max": 800
    },
    "retrievalQuality": {
      "averageSimilarity": 0.82,
      "documentsWithHighSimilarity": 0.75,
      "documentsWithLowSimilarity": 0.10
    },
    "trends": [
      {
        "date": "2024-11-05",
        "searches": 75,
        "averageLatency": 175,
        "cacheHitRate": 0.32,
        "averageDocuments": 3.1
      }
    ]
  }
}
```

### 4. Cost Optimization

#### GET /api/v1/analytics/cost-optimization

Get AI-powered cost optimization recommendations.

**Query Parameters:**
- `agentId` (optional): Analyze specific agent

**Response:**
```json
{
  "success": true,
  "recommendations": [
    {
      "id": "rec-1",
      "priority": "high",
      "type": "execution_mode",
      "title": "Switch to RAG mode for FAQ queries",
      "description": "40% of queries are FAQ-related and could use Vector DB instead of full-stack mode",
      "estimatedSavings": {
        "monthly": 125.00,
        "percentage": 15
      },
      "impact": {
        "cost": "high",
        "latency": "medium",
        "accuracy": "neutral"
      },
      "actionable": true,
      "action": {
        "type": "update_agent_config",
        "agentId": "agent-123",
        "changes": {
          "executionMode": "rag",
          "vectorDB": {
            "enabled": true,
            "knowledgeBases": ["kb-faq"]
          }
        }
      }
    }
  ],
  "summary": {
    "totalRecommendations": 4,
    "highPriority": 1,
    "mediumPriority": 2,
    "lowPriority": 1,
    "totalPotentialSavings": {
      "monthly": 275.00,
      "annual": 3300.00,
      "percentage": 33
    }
  }
}
```

#### POST /api/v1/analytics/cost-optimization/:recommendationId/apply

Apply a cost optimization recommendation.

**Response:**
```json
{
  "success": true,
  "message": "Recommendation applied successfully",
  "recommendationId": "rec-1",
  "appliedAt": "2024-11-12T10:00:00Z"
}
```

## Data Storage

### Current Implementation

The analytics system currently uses **S3** for storing execution logs:

- **Bucket**: `agenthub-agents-storage` (configurable via `S3_AGENTS_BUCKET`)
- **Prefix**: `execution-logs/{agentId}/{executionId}.json`
- **Format**: JSON files with complete execution metadata

### Future Migration

The system is designed to support migration to a SQL database (MySQL/PostgreSQL) using the schema defined in `migrations/008_enhance_agent_execution_logs.sql`.

## Usage Examples

### Get Recent Executions

```bash
curl "http://localhost:3000/api/v1/agents/agent-123/executions?limit=10&status=success"
```

### Get Analytics for Last 30 Days

```bash
curl "http://localhost:3000/api/v1/agents/agent-123/analytics?period=30d"
```

### Get Vector DB Analytics

```bash
curl "http://localhost:3000/api/v1/analytics/vector-db?period=7d&agentId=agent-123"
```

### Get Cost Optimization Recommendations

```bash
curl "http://localhost:3000/api/v1/analytics/cost-optimization?agentId=agent-123"
```

### Apply Recommendation

```bash
curl -X POST "http://localhost:3000/api/v1/analytics/cost-optimization/rec-1/apply"
```

## Integration with Agent Execution Router

The Analytics API integrates with the `AgentExecutionRouter` to automatically log all executions:

```typescript
import executionLogsService from './services/executionLogsService';

// After agent execution
await executionLogsService.saveExecutionLog({
  agent_id: agentId,
  execution_mode: 'rag',
  status: 'success',
  started_at: startTime,
  completed_at: new Date().toISOString(),
  duration_ms: Date.now() - startTime.getTime(),
  input_text: query,
  output_text: response.content,
  llm_cost: 0.50,
  vector_db_cost: 0.25,
  total_cost: 0.75,
  documents_retrieved: 3,
  llm_latency_ms: 500,
  vector_db_latency_ms: 200
});
```

## Performance Considerations

### S3 Storage

- **Pros**: Scalable, durable, cost-effective
- **Cons**: Higher latency for queries, limited filtering capabilities
- **Best for**: Long-term storage, infrequent queries

### Optimization Strategies

1. **Caching**: Cache frequently accessed analytics in memory or Redis
2. **Aggregation**: Pre-compute daily/weekly aggregates
3. **Indexing**: Use S3 object metadata for faster filtering
4. **Pagination**: Always use pagination for large result sets

### Future Improvements

1. **Database Migration**: Move to SQL database for better query performance
2. **Real-time Analytics**: Use streaming analytics for live dashboards
3. **Data Warehouse**: Export to data warehouse for advanced analytics
4. **Machine Learning**: Use ML models for better cost optimization recommendations

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

Common HTTP status codes:
- `200`: Success
- `404`: Resource not found
- `500`: Internal server error

## Security

- All endpoints require authentication (implement based on your auth system)
- Sensitive data (input/output text) should be encrypted at rest
- Access control: Users should only see their own agents' analytics
- Rate limiting: Implement rate limiting to prevent abuse

## Monitoring

Monitor these metrics for the Analytics API:

- **Request latency**: Track p50, p95, p99 latencies
- **Error rate**: Monitor 4xx and 5xx errors
- **S3 costs**: Track S3 storage and request costs
- **Cache hit rate**: Monitor cache effectiveness

## Support

For questions or issues with the Analytics API, please contact the development team or file an issue in the project repository.
