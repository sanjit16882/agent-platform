# Bedrock Agents Integration - Impact Analysis

## Overview

Adding Bedrock Agents as an option will **ADD NEW FUNCTIONALITY** without breaking existing features. This is a **NON-BREAKING CHANGE** if implemented correctly.

---

## Impact Assessment

### ✅ NO IMPACT (Existing functionality continues to work)

These features will **NOT be affected**:

1. **Existing Custom Agents**
   - All current agents continue to work
   - No migration required
   - Same execution flow
   - Same APIs

2. **Agent Execution Service**
   - Current execution logic unchanged
   - Existing agents use same runtime
   - No performance impact

3. **Testing Framework**
   - All existing tests continue to work
   - Test execution unchanged
   - Test results unchanged

4. **Analytics & Monitoring**
   - Current dashboards work as-is
   - Existing metrics unchanged
   - Historical data preserved

5. **Vector DB Integration**
   - Current RAG implementation unchanged
   - Existing vector DB connections work
   - Document management unchanged

6. **User Management**
   - Authentication unchanged
   - Authorization unchanged
   - User roles unchanged

---

## ⚠️ CHANGES REQUIRED (New functionality to add)

### 1. Agent Builder Page (MAJOR CHANGE)

**Current State:**
```
Agent Builder
├── Basic Information
├── Agent Type Selection (Purpose-Driven, Hybrid, etc.)
├── Model Selection
├── Instructions
├── Knowledge Base (Optional)
└── Create Agent
```

**New State:**
```
Agent Builder
├── Step 1: Choose Backend ← NEW!
│   ├── Custom Agent (Bedrock Runtime)
│   └── Bedrock Agent (AWS-Managed)
│
├── IF Custom Agent (Current flow):
│   ├── Basic Information
│   ├── Agent Type Selection
│   ├── Model Selection
│   ├── Instructions
│   ├── RAG Configuration (Detailed)
│   ├── Orchestration (Detailed)
│   ├── Tools (Detailed)
│   ├── Memory (Detailed)
│   ├── Security (Detailed)
│   └── Monitoring (Detailed)
│
└── IF Bedrock Agent (New flow):
    ├── Basic Information
    ├── Instructions (Simplified)
    ├── Knowledge Bases (Select)
    ├── Action Groups (Select)
    ├── Guardrails (Select)
    └── Review & Create
```

**Impact:**
- ✅ Existing agent creation flow preserved
- ✅ New backend choice step added at start
- ✅ New simplified flow for Bedrock Agents
- ⚠️ UI needs to branch based on choice

**Files to Modify:**
- `local_version/agent-hub-ui/src/pages/AgentBuilderPage.tsx`
- `local_version/agent-hub-ui/src/components/AgentBuilder/*`

---

### 2. Agent Model (DATABASE SCHEMA CHANGE)

**Current Schema:**
```typescript
interface Agent {
  id: string;
  name: string;
  description: string;
  type: 'purpose-driven' | 'hybrid' | 'workflow';
  modelId: string;
  instructions: string;
  ragConfig?: {
    enabled: boolean;
    vectorDB: string;
    // ... other RAG settings
  };
  // ... other fields
}
```

**New Schema:**
```typescript
interface Agent {
  id: string;
  name: string;
  description: string;
  
  // NEW FIELD
  backend: 'custom' | 'bedrock-agent'; // ← ADD THIS
  
  // Existing fields (for custom agents)
  type?: 'purpose-driven' | 'hybrid' | 'workflow'; // Optional now
  modelId: string;
  instructions: string;
  ragConfig?: {
    enabled: boolean;
    vectorDB: string;
    // ... other RAG settings
  };
  
  // NEW FIELDS (for Bedrock Agents)
  bedrockAgentConfig?: {
    agentId: string;           // AWS Bedrock Agent ID
    agentAliasId: string;      // AWS Alias ID
    knowledgeBaseIds: string[]; // Associated KB IDs
    actionGroupIds: string[];   // Associated Action Group IDs
    guardrailId?: string;       // Guardrail ID
  };
  
  // ... other fields
}
```

**Impact:**
- ⚠️ Database migration required
- ✅ Backward compatible (existing agents have backend='custom' by default)
- ⚠️ Need to update agent CRUD operations

**Migration Script:**
```sql
-- Add new column with default value
ALTER TABLE agents 
ADD COLUMN backend VARCHAR(20) DEFAULT 'custom';

-- Add new column for Bedrock Agent config
ALTER TABLE agents 
ADD COLUMN bedrock_agent_config JSONB;

-- Existing agents automatically get backend='custom'
-- No data loss, fully backward compatible
```

---

### 3. Agent Execution Service (MAJOR CHANGE)

**Current Implementation:**
```typescript
// agentExecutionService.ts
export async function executeAgent(agentId: string, input: string) {
  const agent = await getAgent(agentId);
  
  // Current: Always use custom execution
  const context = await buildContext(agent, input);
  const prompt = await buildPrompt(agent, context);
  const response = await callBedrockRuntime(agent.modelId, prompt);
  
  return parseResponse(response);
}
```

**New Implementation:**
```typescript
// agentExecutionService.ts
export async function executeAgent(agentId: string, input: string, sessionId: string) {
  const agent = await getAgent(agentId);
  
  // NEW: Branch based on backend type
  if (agent.backend === 'bedrock-agent') {
    return executeBedrockAgent(agent, input, sessionId);
  } else {
    return executeCustomAgent(agent, input, sessionId);
  }
}

// Existing function (unchanged)
async function executeCustomAgent(agent: Agent, input: string, sessionId: string) {
  const context = await buildContext(agent, input);
  const prompt = await buildPrompt(agent, context);
  const response = await callBedrockRuntime(agent.modelId, prompt);
  return parseResponse(response);
}

// NEW function
async function executeBedrockAgent(agent: Agent, input: string, sessionId: string) {
  const client = new BedrockAgentRuntimeClient({ region: 'us-east-1' });
  
  const response = await client.send(new InvokeAgentCommand({
    agentId: agent.bedrockAgentConfig.agentId,
    agentAliasId: agent.bedrockAgentConfig.agentAliasId,
    sessionId: sessionId,
    inputText: input
  }));
  
  let answer = '';
  for await (const event of response.completion) {
    if (event.chunk?.bytes) {
      answer += new TextDecoder().decode(event.chunk.bytes);
    }
  }
  
  return { answer };
}
```

**Impact:**
- ⚠️ Need to add branching logic
- ✅ Existing custom agent execution unchanged
- ⚠️ Need to install new AWS SDK: `@aws-sdk/client-bedrock-agent-runtime`

**Files to Modify:**
- `local_version/agent-hub-backend/src/services/agentExecutionService.ts`

---

### 4. Agent Management APIs (MINOR CHANGES)

**Current APIs:**
```
POST   /api/v1/agents              - Create agent
GET    /api/v1/agents/:id          - Get agent
PUT    /api/v1/agents/:id          - Update agent
DELETE /api/v1/agents/:id          - Delete agent
POST   /api/v1/agents/:id/execute  - Execute agent
```

**Changes Needed:**

#### Create Agent API
```typescript
// BEFORE
POST /api/v1/agents
{
  "name": "Customer Support",
  "type": "purpose-driven",
  "modelId": "claude-3-haiku",
  "instructions": "...",
  "ragConfig": { ... }
}

// AFTER (Custom Agent - same as before)
POST /api/v1/agents
{
  "backend": "custom",  // ← NEW FIELD
  "name": "Customer Support",
  "type": "purpose-driven",
  "modelId": "claude-3-haiku",
  "instructions": "...",
  "ragConfig": { ... }
}

// AFTER (Bedrock Agent - new format)
POST /api/v1/agents
{
  "backend": "bedrock-agent",  // ← NEW FIELD
  "name": "Customer Support",
  "modelId": "claude-3-haiku",
  "instructions": "...",
  "bedrockAgentConfig": {      // ← NEW FIELD
    "knowledgeBaseIds": ["kb-1", "kb-2"],
    "actionGroupIds": ["ag-1", "ag-2"],
    "guardrailId": "gr-1"
  }
}
```

**Impact:**
- ⚠️ API validation needs to handle both formats
- ✅ Backward compatible (backend defaults to 'custom')
- ⚠️ Need to create actual Bedrock Agent in AWS when backend='bedrock-agent'

**Files to Modify:**
- `local_version/agent-hub-backend/src/routes/agentRoutes.ts`
- `local_version/agent-hub-backend/src/services/agentService.ts`

---

### 5. Agent Details Page (MINOR CHANGE)

**Current Display:**
```
Agent Details
├── Name
├── Type (Purpose-Driven, Hybrid, etc.)
├── Model
├── Instructions
├── RAG Configuration
└── Actions (Edit, Delete, Test)
```

**New Display:**
```
Agent Details
├── Name
├── Backend Type ← NEW! (Custom or Bedrock Agent)
├── Type (if custom)
├── Model
├── Instructions
├── Configuration (different based on backend)
│   ├── IF Custom: RAG Config, Orchestration, Tools, etc.
│   └── IF Bedrock: Knowledge Bases, Action Groups, Guardrails
└── Actions (Edit, Delete, Test)
```

**Impact:**
- ⚠️ UI needs to show different fields based on backend
- ✅ No breaking changes to existing display

**Files to Modify:**
- `local_version/agent-hub-ui/src/pages/AgentDetailsPage.tsx`

---

### 6. Testing Framework (MINOR CHANGE)

**Current Testing:**
```typescript
// Test execution works the same for all agents
const result = await executeAgent(agentId, testInput);
const score = evaluateResponse(result, expectedOutput);
```

**New Testing:**
```typescript
// Same interface, but execution differs internally
const result = await executeAgent(agentId, testInput, sessionId);
const score = evaluateResponse(result, expectedOutput);

// Testing framework doesn't need to know about backend type!
// The execution service handles the branching
```

**Impact:**
- ✅ NO CHANGES to testing framework
- ✅ Tests work the same for both backend types
- ✅ Test results format unchanged

**Files to Modify:**
- None! Testing framework is backend-agnostic

---

### 7. Analytics & Monitoring (MINOR CHANGE)

**Current Analytics:**
```
Dashboard shows:
├── Total agents
├── Executions per agent
├── Success rate
├── Average response time
└── Cost per agent
```

**New Analytics:**
```
Dashboard shows:
├── Total agents (by backend type) ← NEW BREAKDOWN
│   ├── Custom: 45
│   └── Bedrock: 12
├── Executions per agent
├── Success rate (by backend type) ← NEW BREAKDOWN
├── Average response time (by backend type) ← NEW BREAKDOWN
└── Cost per agent (by backend type) ← NEW BREAKDOWN
```

**Impact:**
- ⚠️ Add backend type filter to analytics
- ⚠️ Show cost breakdown by backend
- ✅ Existing metrics continue to work

**Files to Modify:**
- `local_version/agent-hub-ui/src/pages/AnalyticsDashboard.tsx`
- `local_version/agent-hub-backend/src/services/analyticsService.ts`

---

### 8. Cost Tracking (MINOR CHANGE)

**Current Cost Calculation:**
```typescript
// Only tracks LLM token costs
function calculateCost(agent: Agent, execution: Execution) {
  const inputCost = (execution.inputTokens / 1000000) * MODEL_COSTS[agent.modelId].input;
  const outputCost = (execution.outputTokens / 1000000) * MODEL_COSTS[agent.modelId].output;
  return inputCost + outputCost;
}
```

**New Cost Calculation:**
```typescript
function calculateCost(agent: Agent, execution: Execution) {
  // LLM costs (same for both)
  const inputCost = (execution.inputTokens / 1000000) * MODEL_COSTS[agent.modelId].input;
  const outputCost = (execution.outputTokens / 1000000) * MODEL_COSTS[agent.modelId].output;
  let totalCost = inputCost + outputCost;
  
  // NEW: Add Bedrock Agent service costs
  if (agent.backend === 'bedrock-agent') {
    totalCost += 0.0007; // Per request
    
    // Add Knowledge Base costs if used
    if (execution.knowledgeBaseQueriesCount > 0) {
      totalCost += execution.knowledgeBaseQueriesCount * 0.002;
    }
  }
  
  return totalCost;
}
```

**Impact:**
- ⚠️ Need to track additional cost components
- ⚠️ Need to track KB query count for Bedrock Agents
- ✅ Existing cost tracking continues to work

**Files to Modify:**
- `local_version/agent-hub-backend/src/services/costTrackingService.ts`

---

## Summary of Changes

### Files That Need Modification

| File | Change Type | Impact |
|------|------------|--------|
| **Frontend** | | |
| `AgentBuilderPage.tsx` | Major | Add backend choice step |
| `AgentDetailsPage.tsx` | Minor | Show backend-specific fields |
| `AnalyticsDashboard.tsx` | Minor | Add backend type filters |
| **Backend** | | |
| `agentExecutionService.ts` | Major | Add branching logic |
| `agentService.ts` | Minor | Handle both agent types |
| `agentRoutes.ts` | Minor | Validate both formats |
| `costTrackingService.ts` | Minor | Track additional costs |
| **Database** | | |
| `agents` table | Minor | Add backend column |
| **Dependencies** | | |
| `package.json` | Minor | Add Bedrock Agent SDK |

### New Files to Create

| File | Purpose |
|------|---------|
| `bedrockAgentService.ts` | Create/manage Bedrock Agents in AWS |
| `bedrockAgentExecutionService.ts` | Execute Bedrock Agents |
| `BedrockAgentBuilder.tsx` | UI for Bedrock Agent creation |

---

## Migration Strategy

### Phase 1: Add New Functionality (No Breaking Changes)
1. Add `backend` column to database (default='custom')
2. Add backend choice to Agent Builder
3. Add Bedrock Agent execution logic
4. All existing agents continue to work as 'custom'

### Phase 2: Test & Validate
1. Create test Bedrock Agents
2. Verify execution works
3. Verify analytics work
4. Verify cost tracking works

### Phase 3: Production Rollout
1. Deploy to production
2. Monitor for issues
3. Gradually migrate agents if desired

---

## Backward Compatibility

### ✅ Fully Backward Compatible

1. **Existing Agents**
   - All existing agents get `backend='custom'` automatically
   - No changes to their configuration
   - No changes to their execution
   - No migration required

2. **Existing APIs**
   - All existing API calls continue to work
   - `backend` field is optional (defaults to 'custom')
   - Response format unchanged

3. **Existing UI**
   - Agent list shows all agents (both types)
   - Existing agent details work as before
   - Existing analytics work as before

4. **Existing Tests**
   - All existing tests continue to pass
   - No changes to test execution
   - No changes to test results

---

## Risk Assessment

### Low Risk ✅
- Database migration (simple column addition)
- UI changes (additive, not replacing)
- API changes (backward compatible)
- Testing framework (no changes needed)

### Medium Risk ⚠️
- Agent execution service (branching logic)
- Cost tracking (new cost components)
- Analytics (new breakdowns)

### High Risk ❌
- None! This is a purely additive feature

---

## Rollback Plan

If issues arise, rollback is simple:

1. **Remove backend choice from UI**
   - Users can only create custom agents
   - Existing Bedrock Agents continue to work

2. **Disable Bedrock Agent creation**
   - Set feature flag to disable
   - No code changes needed

3. **Full rollback**
   - Revert database migration
   - Remove new code
   - All existing functionality restored

---

## Conclusion

### ✅ What WON'T Change
- Existing custom agents work exactly as before
- Existing APIs work exactly as before
- Existing UI works exactly as before
- Existing tests work exactly as before
- No breaking changes!

### ⚠️ What WILL Change
- Agent Builder adds backend choice step
- Agent model adds backend field
- Agent execution adds branching logic
- Analytics adds backend type breakdown
- Cost tracking adds Bedrock Agent costs

### 🎯 Impact Level: LOW
This is a **non-breaking, additive change** that preserves all existing functionality while adding new capabilities.
