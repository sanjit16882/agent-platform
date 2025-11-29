# Backend Refactoring Guide

## Problem We're Solving

**Issue**: Fixing one page breaks another because:
1. Same routes duplicated across 4 server files
2. No request validation - breaking changes go unnoticed
3. No shared types - frontend and backend have different expectations
4. No integration tests - can't verify end-to-end flows

## Solution Architecture

### 1. Shared Types (`src/shared/types.ts`)
Single source of truth for all data structures used by frontend and backend.

```typescript
import { AgentExecutionRequest, AgentExecutionResponse } from './shared/types';
```

### 2. Request Validation (`src/shared/validation.ts`)
Validates all incoming requests to catch breaking changes early.

```typescript
import { RequestValidator } from './shared/validation';

app.post('/api/v1/agents/:agentId/execute',
  RequestValidator.validateAgentId,
  RequestValidator.validateAgentExecution,
  handler
);
```

### 3. Shared Route Handlers (`src/routes/sharedAgentRoutes.ts`)
Core business logic in one place - fix once, fixed everywhere.

```typescript
import { SharedAgentHandlers } from './routes/sharedAgentRoutes';

const handlers = new SharedAgentHandlers({
  executionService,
  createdAgents,
  s3Storage,
  callBedrock
});
```

### 4. Route Registration (`src/routes/registerSharedRoutes.ts`)
Easy way to register all routes consistently.

```typescript
import { registerSharedAgentRoutes } from './routes/registerSharedRoutes';

registerSharedAgentRoutes(app, {
  executionService,
  createdAgents,
  s3Storage,
  callBedrock
});
```

### 5. Integration Tests (`src/tests/integration/agentRoutes.test.ts`)
Verify complete flows work correctly.

```bash
npm test
```

## Migration Steps

### Step 1: Install Test Dependencies

```bash
cd local_version/agent-hub-backend
npm install --save-dev jest ts-jest @types/jest supertest @types/supertest
```

### Step 2: Run Tests to Verify Setup

```bash
npm test
```

This will run the integration tests and show you if everything works.

### Step 3: Update server.ts

Replace the duplicate route definitions with shared routes:

**BEFORE** (server.ts):
```typescript
// Duplicate code in server.ts, production-server.ts, reliable-server.ts, etc.
app.get('/api/v1/agents/:agentId', (req, res) => {
  // 50+ lines of code
  // If you fix a bug here, you need to fix it in 3 other places!
});
```

**AFTER** (server.ts):
```typescript
import { registerSharedAgentRoutes } from './routes/registerSharedRoutes';

registerSharedAgentRoutes(app, {
  executionService,
  createdAgents,
  s3Storage,
  callBedrock
});
// Done! All routes registered with validation
```

See `server-updated-example.ts` for a complete example.

### Step 4: Update Other Servers

Apply the same changes to:
- `production-server.ts`
- `reliable-server.ts`
- `lambda-production-server.ts`

### Step 5: Update Frontend to Use Shared Types

Copy `src/shared/types.ts` to frontend:

```bash
# From backend directory
cp src/shared/types.ts ../agent-hub-ui/src/types/backend-types.ts
```

Then in frontend components:

```typescript
import { AgentExecutionRequest, AgentExecutionResponse } from '../types/backend-types';

const executeAgent = async (request: AgentExecutionRequest): Promise<AgentExecutionResponse> => {
  const response = await axios.post(`/api/v1/agents/${agentId}/execute`, request);
  return response.data;
};
```

## Benefits After Refactoring

### ✅ Fix Once, Fixed Everywhere
- Bug fix in `sharedAgentRoutes.ts` applies to all servers
- No more "I fixed it in server.ts but forgot production-server.ts"

### ✅ Catch Breaking Changes Early
- Request validation rejects invalid requests immediately
- Frontend gets clear error messages about what's wrong

### ✅ Type Safety
- TypeScript ensures frontend and backend agree on data structures
- Refactoring tools can update all usages automatically

### ✅ Easier Testing
- Integration tests verify complete flows
- Mock different scenarios easily
- Catch regressions before deployment

### ✅ Better Developer Experience
- Clear error messages
- Consistent API responses
- Self-documenting code with types

## Testing Strategy

### Unit Tests
Test individual functions in isolation:

```typescript
describe('AgentDefaultsService', () => {
  it('should generate correct agent name', () => {
    expect(AgentDefaultsService.getAgentName('test-agent')).toBe('Test Agent');
  });
});
```

### Integration Tests
Test complete request/response flows:

```typescript
describe('Agent Execution', () => {
  it('should execute agent end-to-end', async () => {
    const response = await request(app)
      .post('/api/v1/agents/test-agent/execute')
      .send(validRequest);
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
```

### Contract Tests
Verify frontend and backend agree:

```typescript
describe('API Contract', () => {
  it('should match expected response format', async () => {
    const response = await request(app).get('/api/v1/agents/test');
    
    // Response matches AgentInfo interface
    expect(response.body.data).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
      description: expect.any(String),
      category: expect.any(String)
    });
  });
});
```

## Rollback Plan

If something goes wrong:

1. **Keep old files**: Don't delete original server files immediately
2. **Feature flag**: Use environment variable to switch between old/new routes
3. **Gradual migration**: Migrate one server at a time
4. **Monitor**: Watch logs and error rates after deployment

```typescript
// Feature flag example
if (process.env.USE_SHARED_ROUTES === 'true') {
  registerSharedAgentRoutes(app, options);
} else {
  // Old route definitions
}
```

## Next Steps

1. ✅ Review the refactored code
2. ✅ Run integration tests
3. ✅ Update one server file (start with server.ts)
4. ✅ Test locally
5. ✅ Update remaining servers
6. ✅ Update frontend to use shared types
7. ✅ Deploy to staging
8. ✅ Monitor and verify
9. ✅ Deploy to production

## Questions?

- **Q: Will this break existing functionality?**
  - A: No, the shared routes implement the same logic, just consolidated.

- **Q: Do I need to update the frontend?**
  - A: Not immediately, but using shared types will prevent future issues.

- **Q: What if I need server-specific behavior?**
  - A: Pass different options to `registerSharedAgentRoutes()` or add server-specific routes separately.

- **Q: How do I add a new endpoint?**
  - A: Add it to `sharedAgentRoutes.ts` and it's available in all servers.

## Success Metrics

After refactoring, you should see:
- ✅ Fewer "fix one thing, break another" incidents
- ✅ Faster development (no duplicate code to maintain)
- ✅ Better test coverage
- ✅ Clearer error messages
- ✅ More confident deployments
