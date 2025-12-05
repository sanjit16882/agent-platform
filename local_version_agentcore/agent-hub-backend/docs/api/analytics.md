# Analytics API Documentation

## Overview

The Analytics API provides comprehensive insights into agent execution history, performance metrics, cost breakdowns, and optimization recommendations. This helps users make informed decisions when selecting and configuring agents.

## Endpoints

### 1. Agent Execution History

**GET** `/api/v1/agents/:id/executions`

Get detailed execution history for a specific agent.

**Query Parameters:**
- `execution_mode` (optional): Filter by mode (bedrock-only, rag, mcp, full-stack)
- `status` (optional): Filter by status (success, error, running)
- `start_date` (optional): Filter by start date (ISO 8601 format)
- `end_date` (optional): Filter by end date (ISO 8601 format)
- `limit` (optional): Number of results per page (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Example Request:**
```bash
GET /api/v1/agents/code-reviewer/executions?execution_mode=rag&limit=20
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "executions": [
      {
        "id": "exec-123",
        "agent_id": "code-reviewer",
        "execution_mode": "rag",
        "status": "success",
        "started_at": "2024-11-12T10:30:00Z",
        "completed_at": "2024-11-12T10:30:02Z",
        "duration_ms": 2150,
        "documents_retrieved": 5,
        "tools_invoked": 0,
        "llm_cost": 0.008,
        "vector_db_cost": 0.001,
        "mcp_cost": 0.000,
        "total_cost": 0.009,
        "llm_latency_ms": 1800,
        "vector_db_latency_ms": 350,
        "mcp_latency_ms": 0,
        "input_tokens": 450,
        "output_tokens": 320,
        "error_message": null,
        "metadata": {
          "knowledge_base_id": "kb-docs",
          "query_type": "code_review"
        }
      }
    ],
    "pagination": {
      "total": 1250,
      "limit": 20,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

---

### 2. Agent Analytics

**GET** `/api/v1/agents/:id/analytics`

Get comprehensive analytics for a specific agent.

**Query Parameters:**
- `days` (optional): Number of days to analyze (default: 30)

**Example Request:**
```bash
GET /api/v1/agents/code-reviewer/analytics?days=30
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "agent_id": "code-reviewer",
    "period_days": 30,
    "overall": {
      "total_executions": 1250,
      "successful_executions": 1180,
      "avg_duration_ms": 850,
      "total_cost": 12.45,
      "avg_cost_per_execution": 0.00996,
      "avg_documents_retrieved": 3.2,
      "avg_tools_invoked": 0
    },
    "execution_mode_distribution": [
      {
        "execution_mode": "rag",
        "count": 1100,
        "avg_duration_ms": 820,
        "avg_cost": 0.0095
      },
      {
        "execution_mode": "bedrock-only",
        "count": 150,
        "avg_duration_ms": 650,
        "avg_cost": 0.0075
      }
    ],
    "cost_breakdown": [
      {
        "execution_mode": "rag",
        "total_llm_cost": 8.80,
        "total_vector_db_cost": 1.10,
        "total_mcp_cost": 0.00,
        "total_cost": 9.90,
        "execution_count": 1100
      }
    ],
    "latency_breakdown": [
      {
        "execution_mode": "rag",
        "avg_llm_latency": 650,
        "avg_vector_db_latency": 170,
        "avg_mcp_latency": 0,
        "avg_total_latency": 820,
        "max_latency": 2500,
        "min_latency": 450
      }
    ],
    "success_rates": [
      {
        "execution_mode": "rag",
        "total_executions": 1100,
        "successful_executions": 1045,
        "failed_executions": 55,
        "success_rate": 95.00
      }
    ],
    "daily_trend": [
      {
        "date": "2024-11-01",
        "executions": 42,
        "successful": 40,
        "avg_duration": 830,
        "total_cost": 0.42
      }
    ]
  }
}
```

---

### 3. Vector DB Analytics

**GET** `/api/v1/analytics/vector-db`

Get Vector DB usage statistics across all agents.

**Query Parameters:**
- `days` (optional): Number of days to analyze (default: 30)

**Example Request:**
```bash
GET /api/v1/analytics/vector-db?days=30
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "period_days": 30,
    "overall": {
      "total_rag_executions": 5420,
      "avg_documents_retrieved": 4.2,
      "avg_search_latency_ms": 120,
      "max_search_latency_ms": 450,
      "min_search_latency_ms": 45,
      "total_vector_db_cost": 2.15,
      "avg_cost_per_search": 0.000397
    },
    "usage_by_agent": [
      {
        "agent_id": "code-reviewer",
        "rag_executions": 1100,
        "avg_documents": 3.2,
        "avg_latency_ms": 170,
        "total_cost": 0.55
      },
      {
        "agent_id": "faq-bot",
        "rag_executions": 2800,
        "avg_documents": 5.1,
        "avg_latency_ms": 95,
        "total_cost": 1.12
      }
    ],
    "knowledge_base_usage": [
      {
        "kb_id": "kb-docs",
        "usage_count": 3200,
        "avg_documents_retrieved": 4.5
      },
      {
        "kb_id": "kb-faq",
        "usage_count": 2220,
        "avg_documents_retrieved": 3.8
      }
    ],
    "cache_hit_rate": 0,
    "note": "Cache hit rate tracking not yet implemented"
  }
}
```

---

### 4. Cost Optimization Recommendations

**GET** `/api/v1/analytics/cost-optimization`

Analyze execution patterns and generate cost optimization recommendations.

**Query Parameters:**
- `days` (optional): Number of days to analyze (default: 30)

**Example Request:**
```bash
GET /api/v1/analytics/cost-optimization?days=30
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "period_days": 30,
    "high_cost_agents": [
      {
        "agent_id": "data-analyst",
        "total_executions": 850,
        "total_cost": 15.30,
        "avg_cost_per_execution": 0.018,
        "execution_mode": "full-stack",
        "avg_duration_ms": 1850
      }
    ],
    "execution_mode_efficiency": [
      {
        "execution_mode": "bedrock-only",
        "executions": 2500,
        "avg_cost": 0.0065,
        "avg_latency": 550,
        "success_rate": 97.5
      },
      {
        "execution_mode": "rag",
        "executions": 5420,
        "avg_cost": 0.0095,
        "avg_latency": 820,
        "success_rate": 95.2
      },
      {
        "execution_mode": "full-stack",
        "executions": 1200,
        "avg_cost": 0.0180,
        "avg_latency": 1650,
        "success_rate": 92.8
      }
    ],
    "recommendations": [
      {
        "type": "execution_mode_optimization",
        "priority": "high",
        "agent_id": "data-analyst",
        "current_mode": "full-stack",
        "suggested_mode": "rag",
        "reason": "Agent uses full-stack mode but may not need all MCP tools",
        "current_cost": 15.30,
        "estimated_savings": 4.59,
        "impact": "high"
      },
      {
        "type": "vector_db_optimization",
        "priority": "medium",
        "agent_id": "code-reviewer",
        "reason": "High Vector DB latency detected",
        "current_latency": 2100,
        "suggested_action": "Reduce topK parameter or optimize knowledge base",
        "estimated_improvement": "30-40% latency reduction",
        "impact": "medium"
      },
      {
        "type": "token_optimization",
        "priority": "medium",
        "agent_id": "documentation-writer",
        "reason": "High token usage detected",
        "avg_tokens": 6500,
        "suggested_action": "Optimize prompts, reduce context length, or use smaller model",
        "current_cost": 8.20,
        "estimated_savings": 1.64,
        "impact": "medium"
      }
    ],
    "summary": {
      "total_recommendations": 12,
      "high_priority": 3,
      "medium_priority": 6,
      "low_priority": 3,
      "total_potential_savings": 8.45
    }
  }
}
```

---

## Recommendation Types

### 1. Execution Mode Optimization
Suggests switching to simpler execution modes when full capabilities aren't needed.
- **Priority**: High
- **Savings**: 20-30% cost reduction

### 2. Vector DB Optimization
Identifies high latency in Vector DB searches and suggests improvements.
- **Priority**: Medium
- **Improvement**: 30-40% latency reduction

### 3. Vector DB Underutilization
Detects agents with Vector DB enabled but low document retrieval.
- **Priority**: Low
- **Savings**: Small cost reduction

### 4. Token Optimization
Identifies high token usage and suggests prompt optimization.
- **Priority**: Medium
- **Savings**: 15-25% cost reduction

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "details": "Detailed error information"
}
```

**Common HTTP Status Codes:**
- `200 OK`: Successful request
- `400 Bad Request`: Invalid parameters
- `404 Not Found`: Agent not found
- `500 Internal Server Error`: Server error

---

## Usage Examples

### Get Last 7 Days of Executions
```bash
curl "http://localhost:4002/api/v1/agents/code-reviewer/executions?days=7&limit=100"
```

### Get Analytics for Specific Period
```bash
curl "http://localhost:4002/api/v1/agents/code-reviewer/analytics?days=14"
```

### Get Cost Optimization for Last 90 Days
```bash
curl "http://localhost:4002/api/v1/analytics/cost-optimization?days=90"
```

### Filter by Execution Mode
```bash
curl "http://localhost:4002/api/v1/agents/code-reviewer/executions?execution_mode=rag"
```

### Filter by Status
```bash
curl "http://localhost:4002/api/v1/agents/code-reviewer/executions?status=error"
```

---

## Database Schema

The analytics endpoints query the `agent_execution_logs` table:

```sql
CREATE TABLE agent_execution_logs (
    id VARCHAR(255) PRIMARY KEY,
    agent_id VARCHAR(255) NOT NULL,
    execution_id VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    duration_ms INTEGER,
    execution_mode VARCHAR(50) DEFAULT 'bedrock-only',
    documents_retrieved INTEGER DEFAULT 0,
    tools_invoked INTEGER DEFAULT 0,
    llm_cost DECIMAL(10,6) DEFAULT 0.000000,
    vector_db_cost DECIMAL(10,6) DEFAULT 0.000000,
    mcp_cost DECIMAL(10,6) DEFAULT 0.000000,
    total_cost DECIMAL(10,6) DEFAULT 0.000000,
    llm_latency_ms INTEGER DEFAULT 0,
    vector_db_latency_ms INTEGER DEFAULT 0,
    mcp_latency_ms INTEGER DEFAULT 0,
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    error_message TEXT,
    metadata JSON,
    
    INDEX idx_ael_agent_id (agent_id),
    INDEX idx_ael_execution_mode (execution_mode),
    INDEX idx_ael_status (status),
    INDEX idx_ael_started_at (started_at),
    INDEX idx_ael_total_cost (total_cost)
);
```

---

## Next Steps

1. **Run Migrations**: Execute migration 009 to add token tracking
2. **Populate Data**: Ensure agent executions log to agent_execution_logs
3. **Frontend Integration**: Build UI components to display analytics
4. **Testing**: Write comprehensive tests for all endpoints
5. **Monitoring**: Set up alerts for high costs or errors

---

## Support

For issues or questions, please refer to the main documentation or contact the development team.
