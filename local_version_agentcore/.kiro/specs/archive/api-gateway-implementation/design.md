# API Gateway Design Document

## Overview

The API Gateway will be implemented as a RESTful service layer that sits between external clients and the existing AgentHub platform. It will provide secure, authenticated access to agent execution capabilities with comprehensive monitoring, rate limiting, and webhook support.

## Architecture

### High-Level Architecture

```
External Clients
       ↓
   API Gateway
   ├── Authentication Middleware
   ├── Rate Limiting Middleware  
   ├── Request Validation
   └── Execution Controller
       ↓
   Agent Execution Service
       ↓
   Existing AgentHub Core
```

### Technology Stack

- **Backend Framework:** Node.js with Express.js (integrates well with existing React frontend)
- **Authentication:** JWT tokens with API key authentication
- **Rate Limiting:** Redis-based rate limiting with sliding window
- **Documentation:** Swagger/OpenAPI 3.0 with automated generation
- **Database:** Extend existing data layer for API keys and execution tracking
- **Webhooks:** Async job queue with retry logic

## Components and Interfaces

### 1. API Gateway Server (`/backend/api-gateway/`)

#### Core Routes
```javascript
// Agent Execution
POST   /api/v1/agents/{agentId}/execute
GET    /api/v1/agents/{agentId}
GET    /api/v1/agents

// Execution Management  
GET    /api/v1/executions/{executionId}
GET    /api/v1/executions/{executionId}/results
GET    /api/v1/executions/{executionId}/logs
DELETE /api/v1/executions/{executionId}

// API Key Management
POST   /api/v1/auth/keys
GET    /api/v1/auth/keys
DELETE /api/v1/auth/keys/{keyId}

// Webhooks
POST   /api/v1/webhooks
GET    /api/v1/webhooks
PUT    /api/v1/webhooks/{webhookId}
DELETE /api/v1/webhooks/{webhookId}

// Documentation
GET    /api/docs
GET    /api/openapi.json
```

#### Authentication Middleware
```javascript
// API Key Authentication
const authenticateApiKey = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
  
  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }
  
  const keyData = await validateApiKey(apiKey);
  if (!keyData || keyData.revoked || keyData.expired) {
    return res.status(401).json({ error: 'Invalid or expired API key' });
  }
  
  req.user = keyData.user;
  req.apiKey = keyData;
  next();
};
```

#### Rate Limiting Middleware
```javascript
// Redis-based rate limiting
const rateLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'api_rate_limit:'
  }),
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute per API key
  keyGenerator: (req) => req.apiKey.id,
  message: {
    error: 'Rate limit exceeded',
    retryAfter: 60
  }
});
```

### 2. Agent Execution Controller

```javascript
class AgentExecutionController {
  async executeAgent(req, res) {
    const { agentId } = req.params;
    const { inputs, sync = false, timeout = 300 } = req.body;
    
    try {
      // Validate agent exists and user has access
      const agent = await this.agentService.getAgent(agentId, req.user);
      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }
      
      // Create execution record
      const execution = await this.executionService.createExecution({
        agentId,
        userId: req.user.id,
        inputs,
        apiKeyId: req.apiKey.id,
        sync,
        timeout
      });
      
      if (sync) {
        // Synchronous execution - wait for completion
        const result = await this.executionService.executeAndWait(execution.id, timeout);
        return res.json({
          executionId: execution.id,
          status: result.status,
          results: result.data,
          duration: result.duration
        });
      } else {
        // Asynchronous execution - return immediately
        this.executionService.executeAsync(execution.id);
        return res.status(202).json({
          executionId: execution.id,
          status: 'queued',
          statusUrl: `/api/v1/executions/${execution.id}`,
          resultsUrl: `/api/v1/executions/${execution.id}/results`
        });
      }
    } catch (error) {
      return res.status(500).json({ 
        error: 'Execution failed', 
        details: error.message 
      });
    }
  }
  
  async getExecutionStatus(req, res) {
    const { executionId } = req.params;
    
    try {
      const execution = await this.executionService.getExecution(executionId, req.user);
      if (!execution) {
        return res.status(404).json({ error: 'Execution not found' });
      }
      
      return res.json({
        executionId: execution.id,
        status: execution.status,
        progress: execution.progress,
        startedAt: execution.startedAt,
        completedAt: execution.completedAt,
        duration: execution.duration,
        error: execution.error
      });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to get execution status' });
    }
  }
}
```

### 3. Webhook Service

```javascript
class WebhookService {
  async sendWebhook(webhookUrl, payload, signature) {
    const maxRetries = 5;
    let attempt = 0;
    
    while (attempt < maxRetries) {
      try {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': signature,
            'User-Agent': 'AgentHub-Webhook/1.0'
          },
          body: JSON.stringify(payload),
          timeout: 10000
        });
        
        if (response.ok) {
          return { success: true, attempt: attempt + 1 };
        }
        
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      } catch (error) {
        attempt++;
        if (attempt >= maxRetries) {
          return { success: false, error: error.message, attempts: attempt };
        }
        
        // Exponential backoff: 2^attempt seconds
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }
  
  async notifyExecutionComplete(execution) {
    const webhooks = await this.getWebhooksForUser(execution.userId);
    
    const payload = {
      event: 'execution.completed',
      executionId: execution.id,
      agentId: execution.agentId,
      status: execution.status,
      timestamp: new Date().toISOString(),
      results: execution.status === 'completed' ? execution.results : null,
      error: execution.status === 'failed' ? execution.error : null
    };
    
    for (const webhook of webhooks) {
      const signature = this.generateSignature(payload, webhook.secret);
      await this.sendWebhook(webhook.url, payload, signature);
    }
  }
}
```

## Data Models

### API Key Model
```javascript
{
  id: 'ak_1234567890abcdef',
  userId: 'user_123',
  name: 'Production API Key',
  keyHash: 'sha256_hash_of_key',
  permissions: ['agent:execute', 'agent:read'],
  rateLimit: 1000, // requests per hour
  createdAt: '2024-01-01T00:00:00Z',
  expiresAt: '2024-12-31T23:59:59Z',
  lastUsedAt: '2024-01-15T10:30:00Z',
  revoked: false
}
```

### Execution Model (Extended)
```javascript
{
  id: 'exec_1234567890abcdef',
  agentId: 'agent_123',
  userId: 'user_123',
  apiKeyId: 'ak_1234567890abcdef', // New field
  inputs: { /* agent inputs */ },
  status: 'completed', // queued, running, completed, failed, timeout
  progress: 100,
  results: { /* execution results */ },
  error: null,
  sync: false, // New field
  timeout: 300, // New field
  startedAt: '2024-01-15T10:30:00Z',
  completedAt: '2024-01-15T10:35:00Z',
  duration: 300000 // milliseconds
}
```

### Webhook Model
```javascript
{
  id: 'wh_1234567890abcdef',
  userId: 'user_123',
  url: 'https://example.com/webhook',
  events: ['execution.completed', 'execution.failed'],
  secret: 'webhook_secret_for_signature',
  active: true,
  createdAt: '2024-01-01T00:00:00Z',
  lastTriggeredAt: '2024-01-15T10:35:00Z'
}
```

## Error Handling

### Standard Error Response Format
```javascript
{
  error: 'Brief error description',
  code: 'ERROR_CODE',
  details: 'Detailed error message',
  timestamp: '2024-01-15T10:30:00Z',
  requestId: 'req_1234567890abcdef'
}
```

### Error Codes
- `INVALID_API_KEY` - API key is invalid, expired, or revoked
- `RATE_LIMIT_EXCEEDED` - Too many requests from this API key
- `AGENT_NOT_FOUND` - Specified agent does not exist or access denied
- `EXECUTION_NOT_FOUND` - Execution ID not found or access denied
- `VALIDATION_ERROR` - Request validation failed
- `EXECUTION_TIMEOUT` - Agent execution exceeded timeout limit
- `EXECUTION_FAILED` - Agent execution failed due to internal error
- `WEBHOOK_DELIVERY_FAILED` - Webhook notification could not be delivered

## Testing Strategy

### Unit Tests
- API key authentication and validation
- Rate limiting logic
- Request validation and sanitization
- Webhook signature generation and verification
- Error handling and response formatting

### Integration Tests
- End-to-end agent execution via API
- Webhook delivery and retry logic
- API documentation accuracy
- Rate limiting behavior under load
- Authentication flow with various scenarios

### Load Tests
- API performance under concurrent requests
- Rate limiting effectiveness
- Database performance with API key lookups
- Webhook delivery performance

### Security Tests
- API key security and entropy
- Request injection and validation bypass attempts
- Rate limiting bypass attempts
- Webhook signature verification
- CORS and security headers validation

## Performance Considerations

### Caching Strategy
- Cache API key validation results (5-minute TTL)
- Cache agent metadata for faster lookups
- Use Redis for rate limiting counters
- Cache OpenAPI documentation generation

### Scalability
- Stateless API design for horizontal scaling
- Async webhook delivery to prevent blocking
- Database connection pooling
- Request/response compression

### Monitoring
- API response time metrics
- Rate limiting hit rates
- Webhook delivery success rates
- Error rate monitoring by endpoint
- API key usage analytics