# Execution Logs Service

## Overview

The `executionLogsService` manages agent execution logs with support for storing, querying, and analyzing execution history. It provides the data foundation for the Analytics API.

## Features

- ✅ Store execution logs with complete metadata
- ✅ Query logs with flexible filtering
- ✅ Calculate analytics and aggregates
- ✅ Track costs and performance metrics
- ✅ Support for all execution modes (bedrock-only, rag, mcp, full-stack)

## Storage

Currently uses **AWS S3** for storage:
- **Bucket**: `agenthub-agents-storage`
- **Prefix**: `execution-logs/{agentId}/{executionId}.json`
- **Format**: JSON with complete execution metadata

## Usage

### Import the Service

```typescript
import executionLogsService from './services/executionLogsService';
```

### Save Execution Log

```typescript
const log = await executionLogsService.saveExecutionLog({
  agent_id: 'agent-123',
  execution_mode: 'rag',
  status: 'success',
  started_at: new Date().toISOString(),
  completed_at: new Date().toISOString(),
  duration_ms: 1000,
  input_text: 'What is the capital of France?',
  output_text: 'The capital of France is Paris.',
  input_tokens: 50,
  output_tokens: 20,
  llm_cost: 0.50,
  vector_db_cost: 0.25,
  mcp_cost: 0,
  total_cost: 0.75,
  llm_latency_ms: 500,
  vector_db_latency_ms: 200,
  mcp_latency_ms: 0,
  documents_retrieved: 3,
  tools_invoked: 0,
  metadata: {
    model: 'claude-3-sonnet',
    temperature: 0.7
  }
});

console.log('Execution log saved:', log.id);
```

### Query Execution Logs

```typescript
const result = await executionLogsService.getExecutionLogs({
  agentId: 'agent-123',
  mode: 'rag',
  status: 'success',
  startDate: '2024-11-01T00:00:00Z',
  endDate: '2024-11-12T23:59:59Z',
  limit: 50,
  offset: 0
});

console.log(`Found ${result.total} executions`);
console.log(`Showing ${result.logs.length} logs`);
console.log(`Has more: ${result.hasMore}`);
```

### Get Single Execution Log

```typescript
const log = await executionLogsService.getExecutionLog('agent-123', 'exec-456');

if (log) {
  console.log('Execution mode:', log.execution_mode);
  console.log('Total cost:', log.total_cost);
  console.log('Duration:', log.duration_ms, 'ms');
}
```

### Get Analytics

```typescript
const analytics = await executionLogsService.getAnalytics('agent-123', '7d');

console.log('Total executions:', analytics.totalExecutions);
console.log('Success rate:', analytics.successRate);
console.log('Total cost:', analytics.costBreakdown.total);
console.log('Average latency:', analytics.latencyBreakdown.average, 'ms');
```

### Get Vector DB Analytics

```typescript
const vectorDBAnalytics = await executionLogsService.getVectorDBAnalytics('7d', 'agent-123');

console.log('Total searches:', vectorDBAnalytics.totalSearches);
console.log('Average documents retrieved:', vectorDBAnalytics.averageDocumentsRetrieved);
console.log('Average search latency:', vectorDBAnalytics.averageSearchLatency, 'ms');
console.log('Total cost:', vectorDBAnalytics.totalCost);
```

## Integration with Agent Execution Router

### Example Integration

```typescript
import executionLogsService from './services/executionLogsService';
import { AgentExecutionRouter } from './services/agentExecutionRouter';

class EnhancedAgentExecutionRouter extends AgentExecutionRouter {
  
  async executeAgent(query: string, agentConfig: any, context?: any) {
    const startTime = Date.now();
    const startedAt = new Date().toISOString();
    
    try {
      // Execute agent
      const result = await super.executeAgent(query, agentConfig, context);
      
      // Log successful execution
      await executionLogsService.saveExecutionLog({
        agent_id: agentConfig.agentId,
        execution_mode: result.mode,
        status: 'success',
        started_at: startedAt,
        completed_at: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
        input_text: query,
        output_text: result.content,
        input_tokens: result.usage?.input_tokens,
        output_tokens: result.usage?.output_tokens,
        llm_cost: result.cost.llm,
        vector_db_cost: result.cost.vectorDB,
        mcp_cost: result.cost.mcp,
        total_cost: result.cost.total,
        llm_latency_ms: result.metadata?.llmLatency,
        vector_db_latency_ms: result.metadata?.vectorSearchLatency,
        mcp_latency_ms: result.metadata?.mcpLatency,
        documents_retrieved: result.metadata?.documentsRetrieved,
        tools_invoked: result.metadata?.toolsInvoked,
        tool_names: result.metadata?.toolNames,
        metadata: {
          model: agentConfig.model,
          temperature: agentConfig.temperature,
          knowledge_bases: agentConfig.vectorDB?.knowledgeBases
        }
      });
      
      return result;
      
    } catch (error: any) {
      // Log failed execution
      await executionLogsService.saveExecutionLog({
        agent_id: agentConfig.agentId,
        execution_mode: this.determineExecutionMode(agentConfig),
        status: 'failed',
        started_at: startedAt,
        completed_at: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
        input_text: query,
        error_message: error.message,
        llm_cost: 0,
        total_cost: 0
      });
      
      throw error;
    }
  }
}
```

## Data Model

### ExecutionLog Interface

```typescript
interface ExecutionLog {
  // Identifiers
  id: string;
  agent_id: string;
  
  // Execution details
  execution_mode: 'bedrock-only' | 'rag' | 'mcp' | 'full-stack';
  status: 'success' | 'failed' | 'timeout';
  
  // Timing
  started_at: string;
  completed_at?: string;
  duration_ms?: number;
  
  // Input/Output
  input_text: string;
  output_text?: string;
  error_message?: string;
  
  // Usage
  input_tokens?: number;
  output_tokens?: number;
  
  // Cost breakdown
  llm_cost: number;
  vector_db_cost?: number;
  mcp_cost?: number;
  total_cost: number;
  
  // Latency breakdown
  llm_latency_ms?: number;
  vector_db_latency_ms?: number;
  mcp_latency_ms?: number;
  
  // Metadata
  documents_retrieved?: number;
  tools_invoked?: number;
  tool_names?: string[];
  metadata?: any;
  
  created_at: string;
}
```

## Performance Considerations

### S3 Storage Performance

- **Write latency**: ~100-200ms per log
- **Read latency**: ~50-100ms per log
- **List operations**: Can be slow for large numbers of logs
- **Cost**: Very low ($0.023 per GB/month)

### Optimization Strategies

1. **Batch Writes**: Queue logs and write in batches
2. **Caching**: Cache recent logs in memory or Redis
3. **Indexing**: Use S3 object metadata for filtering
4. **Aggregation**: Pre-compute daily/weekly aggregates

### Scaling Considerations

- **Current limit**: ~1000 logs per agent (S3 list limit)
- **For high-volume agents**: Consider database migration
- **For analytics**: Pre-compute aggregates daily

## Migration to SQL Database

The service is designed to support migration to SQL database:

```sql
-- See migrations/008_enhance_agent_execution_logs.sql
CREATE TABLE agent_execution_logs (
  id VARCHAR(255) PRIMARY KEY,
  agent_id VARCHAR(255) NOT NULL,
  execution_mode VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL,
  started_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  duration_ms INTEGER,
  input_text TEXT,
  output_text TEXT,
  error_message TEXT,
  input_tokens INTEGER,
  output_tokens INTEGER,
  llm_cost DECIMAL(10,6),
  vector_db_cost DECIMAL(10,6),
  mcp_cost DECIMAL(10,6),
  total_cost DECIMAL(10,6),
  llm_latency_ms INTEGER,
  vector_db_latency_ms INTEGER,
  mcp_latency_ms INTEGER,
  documents_retrieved INTEGER,
  tools_invoked INTEGER,
  tool_names JSON,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_agent_id (agent_id),
  INDEX idx_execution_mode (execution_mode),
  INDEX idx_started_at (started_at),
  INDEX idx_status (status)
);
```

## Error Handling

The service includes comprehensive error handling:

```typescript
try {
  await executionLogsService.saveExecutionLog(log);
} catch (error) {
  console.error('Failed to save execution log:', error);
  // Log is lost, but execution continues
  // Consider implementing retry logic or dead letter queue
}
```

## Testing

### Unit Tests

```typescript
import executionLogsService from './executionLogsService';

describe('ExecutionLogsService', () => {
  it('should save execution log', async () => {
    const log = await executionLogsService.saveExecutionLog({
      agent_id: 'test-agent',
      execution_mode: 'bedrock-only',
      status: 'success',
      input_text: 'test query',
      llm_cost: 0.50,
      total_cost: 0.50
    });
    
    expect(log.id).toBeDefined();
    expect(log.agent_id).toBe('test-agent');
  });
  
  it('should query execution logs', async () => {
    const result = await executionLogsService.getExecutionLogs({
      agentId: 'test-agent',
      limit: 10
    });
    
    expect(result.logs).toBeInstanceOf(Array);
    expect(result.total).toBeGreaterThanOrEqual(0);
  });
});
```

## Monitoring

Monitor these metrics:

- **Write success rate**: Track failed log writes
- **Write latency**: Monitor S3 write performance
- **Query latency**: Track query performance
- **Storage costs**: Monitor S3 storage costs
- **Error rate**: Track service errors

## Future Enhancements

1. **Real-time streaming**: Stream logs to analytics dashboard
2. **Data retention**: Implement automatic log archival/deletion
3. **Compression**: Compress old logs to reduce storage costs
4. **Search**: Add full-text search capabilities
5. **Export**: Export logs to data warehouse for advanced analytics

## Support

For questions or issues, please contact the development team or file an issue in the project repository.
