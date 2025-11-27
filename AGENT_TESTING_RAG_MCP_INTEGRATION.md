# Agent Testing: Vector DB + MCP Integration

## 📋 Requirement Summary

Add a new step in the Agent Testing workflow to support testing with Vector DB and MCP. This allows users to test agents against their integrated knowledge bases for more accurate, domain-specific responses.

### Workflow Logic

```
Query → Vector DB / MCP Knowledge Base
  ↓
  ├─ If relevant answer found → Return directly
  └─ If no answer found → Send to LLM → Return response
```

### Testing Modes

Users can test agents with different configurations:
1. **Vector DB + LLM** - RAG-enhanced responses
2. **Vector DB + MCP + LLM** - RAG + external tools
3. **MCP + LLM** - External tools only
4. **LLM Only** - Direct LLM responses (current behavior)

---

## 🎯 Implementation Plan

### Step Placement Decision

**RECOMMENDATION: Add AFTER Model Selection (Step 2.5)**

**Reasoning:**
- ✅ User has selected agent (knows what they're testing)
- ✅ User has selected models (knows which LLMs to use)
- ✅ Before test selection (can filter tests based on RAG/MCP availability)
- ✅ Logical flow: Agent → Models → **Knowledge Sources** → Tests → Execute

**New Workflow:**
```
Step 1: Select Agent
Step 2: Select Models
Step 2.5: Configure Knowledge Sources (NEW) ← Vector DB + MCP
Step 3: Select Tests
Step 4: Custom Tests (Optional)
Step 5: Provide Input
Step 6: Review
Step 7: Execute
Step 8: Results
Step 9: Insights
```

---

## 🔧 Components to Create/Modify

### 1. New Component: `StepConfigureKnowledge.tsx`

Combines Vector DB and MCP configuration for testing.

**Features:**
- Toggle Vector DB on/off
- Select knowledge bases
- Configure retrieval settings (topK, minSimilarity)
- Toggle MCP on/off
- Select MCP servers
- Show impact on test execution (latency, cost)
- Preview: "Your tests will use RAG + MCP + LLM"

**Reuses:**
- `VectorDBConfigSection.tsx` - Vector DB UI
- `MCPAgentCreationStep.tsx` - MCP UI

### 2. Modified Component: `DDTFWorkflow.tsx`

**Changes:**
- Add new step to STEPS array
- Add knowledge config to WorkflowState
- Add renderStep case for Step 2.5
- Update step numbers (shift by 1)

### 3. Modified Component: `StepExecute.tsx`

**Changes:**
- Accept knowledge config as prop
- Implement RAG retrieval before LLM call
- Implement MCP tool execution
- Show execution flow in UI:
  - "🔍 Searching Vector DB..."
  - "✓ Found 3 relevant documents"
  - "🔧 Executing MCP tools..."
  - "🤖 Generating LLM response..."

### 4. Modified Service: `testExecutionService.js`

**Changes:**
- Add `executeTestWithKnowledge()` method
- Implement RAG retrieval logic
- Implement MCP tool execution logic
- Fallback to LLM if no knowledge found
- Track which source provided the answer (RAG/MCP/LLM)

---

## 📊 Data Structures

### WorkflowState Addition

```typescript
interface WorkflowState {
  // ... existing fields
  
  // NEW: Knowledge configuration
  knowledgeConfig: {
    vectorDB: {
      enabled: boolean;
      provider: string;
      knowledgeBases: string[];
      retrievalConfig: {
        topK: number;
        minSimilarity: number;
      };
    };
    mcp: {
      enabled: boolean;
      selectedServers: string[];
    };
  };
}
```

### Test Execution Result Addition

```typescript
interface TestResult {
  // ... existing fields
  
  // NEW: Knowledge source tracking
  knowledgeSource: 'vector_db' | 'mcp' | 'llm' | 'hybrid';
  retrievedDocuments?: number;
  mcpToolsUsed?: string[];
  ragLatency?: number;
  mcpLatency?: number;
}
```

---

## 🔄 Execution Flow

### With Vector DB + MCP + LLM

```javascript
async function executeTestWithKnowledge(test, input, config) {
  const result = {
    knowledgeSource: null,
    response: null,
    retrievedDocuments: 0,
    mcpToolsUsed: [],
    ragLatency: 0,
    mcpLatency: 0
  };
  
  // Step 1: Try Vector DB (if enabled)
  if (config.vectorDB.enabled) {
    const ragStart = Date.now();
    const docs = await vectorDBService.search({
      indexes: config.vectorDB.knowledgeBases,
      query: input,
      topK: config.vectorDB.retrievalConfig.topK,
      minSimilarity: config.vectorDB.retrievalConfig.minSimilarity
    });
    result.ragLatency = Date.now() - ragStart;
    result.retrievedDocuments = docs.length;
    
    if (docs.length > 0 && docs[0].similarity > 0.9) {
      // High confidence answer from Vector DB
      result.response = docs[0].content;
      result.knowledgeSource = 'vector_db';
      return result;
    }
  }
  
  // Step 2: Try MCP (if enabled)
  if (config.mcp.enabled) {
    const mcpStart = Date.now();
    const mcpResult = await mcpService.executeTool(
      config.mcp.selectedServers,
      input
    );
    result.mcpLatency = Date.now() - mcpStart;
    result.mcpToolsUsed = mcpResult.toolsUsed;
    
    if (mcpResult.success) {
      // MCP provided answer
      result.response = mcpResult.output;
      result.knowledgeSource = 'mcp';
      return result;
    }
  }
  
  // Step 3: Fallback to LLM
  const llmContext = {
    retrievedDocs: result.retrievedDocuments > 0 ? docs : [],
    mcpData: result.mcpToolsUsed.length > 0 ? mcpResult.data : null
  };
  
  const llmResponse = await bedrockService.callBedrock(
    agentType,
    input,
    llmContext
  );
  
  result.response = llmResponse.content;
  result.knowledgeSource = 
    (result.retrievedDocuments > 0 || result.mcpToolsUsed.length > 0)
      ? 'hybrid'
      : 'llm';
  
  return result;
}
```

---

## 🎨 UI Mockup

### Step 2.5: Configure Knowledge Sources

```
┌─────────────────────────────────────────────────────────────┐
│ Configure Knowledge Sources (Optional)                       │
│ Enhance test responses with Vector DB and MCP integration   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ 📚 Vector DB (RAG)                          [Toggle: ON]    │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ Provider: AWS OpenSearch                              │   │
│ │                                                        │   │
│ │ Knowledge Bases: ✓ Product Docs (150 docs)           │   │
│ │                  ✓ Support Tickets (500 docs)        │   │
│ │                  ☐ FAQ Database (75 docs)            │   │
│ │                                                        │   │
│ │ Top-K: [====●====] 5 documents                       │   │
│ │ Min Similarity: [======●==] 0.70                     │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
│ 🔌 MCP Integration                          [Toggle: ON]    │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ Selected Servers:                                     │   │
│ │ ✓ 🗂️ Filesystem (read, write, list)                  │   │
│ │ ✓ 🌿 Git (commit, branch, log)                       │   │
│ │ ☐ 🗄️ Database (query, insert, update)               │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
│ 💡 Test Execution Preview                                   │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ Your tests will use:                                  │   │
│ │ 1. 🔍 Search 2 knowledge bases (5 docs each)         │   │
│ │ 2. 🔧 Execute MCP tools if needed                    │   │
│ │ 3. 🤖 Generate LLM response with context            │   │
│ │                                                        │   │
│ │ Impact: +300ms latency, +$0.30 per 1K queries       │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
│ [Skip This Step]                          [Continue →]      │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ Implementation Checklist

### Phase 1: Component Creation
- [ ] Create `StepConfigureKnowledge.tsx`
- [ ] Integrate VectorDBConfigSection
- [ ] Integrate MCPAgentCreationStep
- [ ] Add preview/impact display

### Phase 2: Workflow Integration
- [ ] Update `DDTFWorkflow.tsx` STEPS array
- [ ] Add knowledge config to WorkflowState
- [ ] Add renderStep case for Step 2.5
- [ ] Update step navigation logic

### Phase 3: Backend Integration
- [ ] Update `testExecutionService.js`
- [ ] Add `executeTestWithKnowledge()` method
- [ ] Integrate VectorDBService
- [ ] Integrate MCP service
- [ ] Add fallback logic

### Phase 4: Execution Updates
- [ ] Update `StepExecute.tsx`
- [ ] Accept knowledge config prop
- [ ] Show execution flow in UI
- [ ] Track knowledge sources

### Phase 5: Results Display
- [ ] Update `StepResults.tsx`
- [ ] Show knowledge source badges
- [ ] Display RAG/MCP metrics
- [ ] Show retrieved documents count

### Phase 6: Testing & Documentation
- [ ] Test all 4 modes (VectorDB+LLM, VectorDB+MCP+LLM, MCP+LLM, LLM only)
- [ ] Create user documentation
- [ ] Add tooltips and help text
- [ ] Performance testing

---

## 🚀 Estimated Effort

- **Phase 1-2**: 2-3 hours (UI components)
- **Phase 3-4**: 3-4 hours (Backend integration)
- **Phase 5-6**: 1-2 hours (Results & testing)
- **Total**: 6-9 hours

---

## 📝 Notes

- Reuse existing VectorDB and MCP components (no duplication)
- Make step optional (users can skip if not needed)
- Clear visual feedback on what's being used
- Track performance impact (latency, cost)
- Show knowledge source in results (transparency)

Ready to implement! 🎯
