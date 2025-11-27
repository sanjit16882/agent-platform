# Agent Testing Framework - Enhancement Requirements

**Date**: November 27, 2025  
**Session**: Complete Requirements Summary

---

## 📋 Overview

This document consolidates ALL enhancement requirements discussed for the Agent Testing Framework.

---

## 🎯 Enhancement 1: Intelligent Test Filtering with Core Default Tests

### Requirement

**Goal**: Ensure every agent gets a core set of default tests + agent-specific tests, with clear separation and messaging.

### Current State

✅ **What Works**:
- Intelligent agent type detection (monitoring, code-review, security, etc.)
- Priority-based test mapping per agent type
- Automatic filtering based on agent type
- Good UI feedback

❌ **What's Missing**:
- No guaranteed "core" tests for all agents
- No clear separation between core vs agent-specific tests
- Limited messaging about why tests are missing
- Basic fallback for new/unknown agents

### Requirements

#### 1.1 Core Default Tests (5 tests for ALL agents)

**Must include these 5 tests for EVERY agent**:

1. **Hallucination Detection**
   - Why: Every agent must provide accurate information
   - Risk: Agent could make up facts, damage trust
   - Applies to: 100% of agents

2. **Safety Checks**
   - Why: Every agent must refuse harmful requests
   - Risk: Agent could provide dangerous information
   - Applies to: 100% of agents

3. **Functional Correctness**
   - Why: Every agent must complete basic tasks correctly
   - Risk: Agent might not work at all
   - Applies to: 100% of agents

4. **Intent Detection**
   - Why: Most agents need to understand what users want
   - Risk: Agent might misunderstand requests
   - Applies to: 90% of agents

5. **Emotional Intelligence**
   - Why: Most agents interact with humans and need empathy
   - Risk: Agent might seem cold or inappropriate
   - Applies to: 80% of agents

#### 1.2 Agent-Specific Tests (10-15 tests based on agent type)

**Filtered based on agent type**:

- **Monitoring agents** → monitoring, tool_usage, rag_grounding tests
- **Code Review agents** → code-specific, security, tool_usage tests
- **Customer Service agents** → multi_turn, rag_grounding, emotional tests
- **Security agents** → adversarial, security, tool_usage tests
- **General/Unknown agents** → balanced mix of common tests

#### 1.3 UI Requirements

**Display in two clear sections**:

```
┌─────────────────────────────────────────────────────────┐
│ ✅ Core Tests (Always Included)                         │
│ These essential tests are included for all agents       │
│                                                          │
│ ☑ Hallucination Detection [CORE]                       │
│ ☑ Safety Checks [CORE]                                 │
│ ☑ Functional Correctness [CORE]                        │
│ ☑ Intent Detection [RECOMMENDED]                       │
│ ☑ Emotional Intelligence [RECOMMENDED]                 │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 🎯 Recommended for Monitoring Agents                    │
│ Additional tests specifically relevant to this type     │
│                                                          │
│ ☐ Monitoring Test 1                                    │
│ ☐ Monitoring Test 2                                    │
│ ☐ Tool Usage Test 1                                    │
│ ... (10-15 more tests)                                  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ ℹ️ Don't see the tests you need?                        │
│ You can add custom tests in the next step!              │
└─────────────────────────────────────────────────────────┘
```

#### 1.4 Smart Fallback for New Agents

**When agent type is unknown**:
- Analyze agent properties (tools, knowledgeBase, capabilities)
- Provide intelligent fallback based on detected capabilities
- Still guarantee 5 core tests
- Add relevant agent-specific tests based on analysis

### Implementation Files

- `local_version/agent-hub-ui/src/components/testing/StepSelectTest.tsx`
- `local_version/agent-hub-backend/services/testLibraryService.js`

### Acceptance Criteria

- [ ] All agents receive 5 core tests (hallucination, safety, functional, intent, emotional)
- [ ] Core tests are clearly marked with [CORE] or [RECOMMENDED] badges
- [ ] Agent-specific tests are shown in separate section
- [ ] UI shows clear message about custom tests
- [ ] New/unknown agents get smart fallback with core tests
- [ ] Total tests shown: 15-20 (5 core + 10-15 specific)

---

## 🎯 Enhancement 2: Vector DB + MCP Integration for Testing

### Requirement

**Goal**: Add a new step in the Agent Testing workflow to support testing with Vector DB and MCP, allowing users to test agents against their integrated knowledge bases for more accurate, domain-specific responses.

### Workflow Logic

```
Query → Vector DB / MCP Knowledge Base
  ↓
  ├─ If relevant answer found (similarity > 0.9) → Return directly
  └─ If no answer found → Send to LLM with context → Return response
```

### Testing Modes

Users can test agents with different configurations:

1. **Vector DB + LLM** - RAG-enhanced responses
2. **Vector DB + MCP + LLM** - RAG + external tools + LLM
3. **MCP + LLM** - External tools + LLM
4. **LLM Only** - Direct LLM responses (current behavior)

### Requirements

#### 2.1 New Workflow Step

**Add Step 2.5: Configure Knowledge Sources**

**New Workflow**:
```
Step 1: Select Agent
Step 2: Select Models
Step 2.5: Configure Knowledge Sources ← NEW
Step 3: Select Tests
Step 4: Custom Tests (Optional)
Step 5: Provide Input
Step 6: Review
Step 7: Execute
Step 8: Results
Step 9: Insights
```

**Why after Model Selection?**
- ✅ User has selected agent (knows what they're testing)
- ✅ User has selected models (knows which LLMs to use)
- ✅ Before test selection (can filter tests based on RAG/MCP availability)
- ✅ Logical flow: Agent → Models → Knowledge Sources → Tests

#### 2.2 Knowledge Configuration UI

**Features**:
- Toggle Vector DB on/off
- Select knowledge bases (multi-select)
- Configure retrieval settings (topK: 1-20, minSimilarity: 0.0-1.0)
- Toggle MCP on/off
- Select MCP servers (multi-select)
- Show impact preview (latency, cost)
- Show execution flow preview

**Reuse Existing Components**:
- `VectorDBConfigSection.tsx` - Vector DB UI
- `MCPAgentCreationStep.tsx` - MCP UI

#### 2.3 Execution Flow

**With Vector DB + MCP + LLM**:

```javascript
async function executeTestWithKnowledge(test, input, config) {
  // Step 1: Try Vector DB (if enabled)
  if (config.vectorDB.enabled) {
    const docs = await vectorDBService.search({
      indexes: config.vectorDB.knowledgeBases,
      query: input,
      topK: config.vectorDB.retrievalConfig.topK,
      minSimilarity: config.vectorDB.retrievalConfig.minSimilarity
    });
    
    if (docs.length > 0 && docs[0].similarity > 0.9) {
      // High confidence answer from Vector DB
      return {
        response: docs[0].content,
        knowledgeSource: 'vector_db',
        retrievedDocuments: docs.length
      };
    }
  }
  
  // Step 2: Try MCP (if enabled)
  if (config.mcp.enabled) {
    const mcpResult = await mcpService.executeTool(
      config.mcp.selectedServers,
      input
    );
    
    if (mcpResult.success) {
      return {
        response: mcpResult.output,
        knowledgeSource: 'mcp',
        mcpToolsUsed: mcpResult.toolsUsed
      };
    }
  }
  
  // Step 3: Fallback to LLM with context
  const llmContext = {
    retrievedDocs: docs || [],
    mcpData: mcpResult?.data || null
  };
  
  const llmResponse = await bedrockService.callBedrock(
    agentType,
    input,
    llmContext
  );
  
  return {
    response: llmResponse.content,
    knowledgeSource: (docs?.length > 0 || mcpResult) ? 'hybrid' : 'llm',
    retrievedDocuments: docs?.length || 0,
    mcpToolsUsed: mcpResult?.toolsUsed || []
  };
}
```

#### 2.4 Results Display

**Show knowledge source in results**:

```
┌─────────────────────────────────────────────────────────┐
│ Test: Hallucination Detection                           │
│ Status: ✅ Passed                                       │
│ Score: 92/100                                           │
│                                                          │
│ Knowledge Source: 🎯 Hybrid (RAG + LLM)                │
│ Retrieved Documents: 3                                  │
│ MCP Tools Used: filesystem, git                         │
│ RAG Latency: 150ms                                     │
│ MCP Latency: 80ms                                      │
│ LLM Latency: 1200ms                                    │
│ Total: 1430ms                                          │
└─────────────────────────────────────────────────────────┘
```

#### 2.5 Data Structures

**WorkflowState Addition**:
```typescript
interface WorkflowState {
  // ... existing fields
  
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

**Test Result Addition**:
```typescript
interface TestResult {
  // ... existing fields
  
  knowledgeSource: 'vector_db' | 'mcp' | 'llm' | 'hybrid';
  retrievedDocuments?: number;
  mcpToolsUsed?: string[];
  ragLatency?: number;
  mcpLatency?: number;
}
```

### Implementation Files

**New Components**:
- `local_version/agent-hub-ui/src/components/testing/StepConfigureKnowledge.tsx`

**Modified Components**:
- `local_version/agent-hub-ui/src/components/testing/DDTFWorkflow.tsx`
- `local_version/agent-hub-ui/src/components/testing/StepExecute.tsx`
- `local_version/agent-hub-ui/src/components/testing/StepResults.tsx`

**Modified Services**:
- `local_version/agent-hub-backend/services/testExecutionService.js`

### Acceptance Criteria

- [ ] New step "Configure Knowledge Sources" added after Model Selection
- [ ] Users can toggle Vector DB on/off
- [ ] Users can select multiple knowledge bases
- [ ] Users can configure retrieval settings (topK, minSimilarity)
- [ ] Users can toggle MCP on/off
- [ ] Users can select multiple MCP servers
- [ ] UI shows impact preview (latency, cost)
- [ ] Execution tries Vector DB first (if enabled)
- [ ] Execution tries MCP second (if enabled)
- [ ] Execution falls back to LLM with context
- [ ] Results show knowledge source badge
- [ ] Results show RAG/MCP metrics
- [ ] All 4 modes work: VectorDB+LLM, VectorDB+MCP+LLM, MCP+LLM, LLM only
- [ ] Step is optional (users can skip)

---

## 🎯 Enhancement 3: Agent Testing Results Integration in Agent Catalog & Executor

### Requirement

**Goal**: Display agent testing results and model comparison directly in the Agent Catalog and Agent Executor pages to help users evaluate performance and choose the right model for each agent.

### Current State

❌ **What's Missing**:
- No testing results visible on Agent Catalog page
- No model comparison on Agent Executor page
- Users must navigate to separate testing page to see results
- No quick way to see which model performs best for an agent

### Requirements

#### 3.1 Agent Catalog Page - High-Level Summary

**Location**: Bottom of each Agent Card (collapsible section)

**Display**:

```
┌─────────────────────────────────────────────────────────┐
│  QE Test Case Generator Pro                             │
│  Production-ready AI-powered test case generation...    │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 🧪 Test Performance Summary                     │   │
│  │ ┌─────────────────────────────────────────────┐ │   │
│  │ │ Best Model: Claude 3.5 Sonnet    Score: 92% │ │   │
│  │ │ Last Tested: 2 hours ago         Tests: 15  │ │   │
│  │ │                                              │ │   │
│  │ │ Model Comparison:                            │ │   │
│  │ │ Claude 3.5 Sonnet  ████████████████░░  92%  │ │   │
│  │ │ Claude 3 Haiku     ████████████░░░░░░  78%  │ │   │
│  │ │ Titan Text         ██████████░░░░░░░░  65%  │ │   │
│  │ └─────────────────────────────────────────────┘ │   │
│  │                                                  │   │
│  │ [Run Quick Test]  [View Full Analysis →]        │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

**Key Metrics (7 lines total)**:
1. Best performing model + score (1 line)
2. Last test date + test count (1 line)
3. Top 3 models bar chart (3 lines)
4. Quick actions (2 buttons)

**Design Principles**:
- ✅ Glanceable (2-second decision)
- ✅ Non-intrusive (collapsible)
- ✅ Actionable (quick test or deep dive)
- ✅ No duplication (summary only)

#### 3.2 Agent Executor Page - Deep Analysis

**Location**: New tab "Testing & Performance"

**Display Sections**:

1. **Overall Performance Comparison Table**
   ```
   Model              │ Score │ Pass Rate │ Cost  │ Speed
   ───────────────────┼───────┼───────────┼───────┼──────
   Claude 3.5 Sonnet  │ 92%   │ 18/20     │ $0.15 │ 2.3s
   Claude 3 Haiku     │ 78%   │ 15/20     │ $0.05 │ 1.1s
   Titan Text         │ 65%   │ 13/20     │ $0.03 │ 0.8s
   ```

2. **Category-by-Category Breakdown**
   - Hallucination Detection: Visual bars for each model
   - Functional Correctness: Visual bars for each model
   - Safety & Compliance: Visual bars for each model
   - Intent Detection: Visual bars for each model
   - Emotional Intelligence: Visual bars for each model

3. **Individual Test Results Grid**
   ```
   Test Name              │ Claude 3.5 │ Haiku  │ Titan
   ───────────────────────┼────────────┼────────┼──────
   Basic Hallucination    │ ✅ 95%    │ ✅ 88% │ ⚠️ 72%
   Complex Reasoning      │ ✅ 92%    │ ⚠️ 75% │ ❌ 58%
   Edge Case Handling     │ ✅ 88%    │ ⚠️ 70% │ ❌ 62%
   ```

4. **Cost-Performance Analysis**
   - Scatter plot: Cost vs Quality
   - Sweet spot identification
   - ROI recommendations

5. **Historical Performance Trends**
   - Line chart: Score over time (last 30 days)
   - Model comparison trends
   - Improvement tracking

6. **AI-Powered Insights**
   - Key findings
   - Specific recommendations
   - Optimization opportunities

**Design Principles**:
- ✅ Comprehensive (all relevant data)
- ✅ Comparative (easy model comparison)
- ✅ Insightful (AI-powered recommendations)
- ✅ Exportable (share with team)

#### 3.3 Data Structures

**Agent Catalog Summary Data**:
```typescript
interface AgentTestingSummary {
  agentId: string;
  bestModel: {
    name: string;
    score: number;
    modelId: string;
  };
  lastTested: string; // ISO timestamp
  totalTests: number;
  modelComparison: Array<{
    model: string;
    score: number;
  }>;
}
```

**Agent Executor Detailed Data**:
```typescript
interface AgentTestingDetailed {
  agentId: string;
  models: Array<{
    modelId: string;
    modelName: string;
    overallScore: number;
    passRate: number;
    totalCost: number;
    avgSpeed: number;
    categoryScores: {
      hallucination: number;
      functional: number;
      safety: number;
      intent_detection: number;
      emotional: number;
    };
    testResults: Array<{
      testName: string;
      score: number;
      passed: boolean;
    }>;
  }>;
  insights: {
    keyFindings: string[];
    recommendations: string[];
    optimizations: string[];
  };
  trends: {
    historical: Array<{
      date: string;
      modelScores: Record<string, number>;
    }>;
  };
}
```

#### 3.4 API Endpoints

**For Agent Catalog**:
```
GET /api/agents/:agentId/testing/summary

Response:
{
  bestModel: { name, score, modelId },
  lastTested: "2025-11-26T10:00:00Z",
  totalTests: 15,
  modelComparison: [
    { model: "Claude 3.5 Sonnet", score: 92 },
    { model: "Claude 3 Haiku", score: 78 },
    { model: "Titan Text", score: 65 }
  ]
}
```

**For Agent Executor**:
```
GET /api/agents/:agentId/testing/detailed

Response:
{
  models: [...],
  insights: {...},
  trends: {...}
}

POST /api/agents/:agentId/testing/run
Body: { models: [...], testSuiteId: "..." }
Response: { runId, status }
```

#### 3.5 User Flows

**Flow 1: Quick Evaluation (Agent Catalog)**
```
1. User browses Agent Catalog
2. Sees "Best Model: Claude 3.5 - 92%" on card
3. Sees bar chart comparing top 3 models
4. Decision: "Claude 3.5 is best, I'll use that"
5. Clicks "Execute Agent" → Pre-selects Claude 3.5
```

**Flow 2: Deep Analysis (Agent Executor)**
```
1. User clicks "View Full Analysis" on Agent Card
2. Navigates to Agent Executor → "Testing & Performance" tab
3. Reviews detailed comparison table
4. Checks category breakdown
5. Analyzes cost-performance trade-offs
6. Reads AI insights
7. Decision: "Use Claude 3.5 for production, Haiku for dev"
8. Configures agent with selected model
```

**Flow 3: Run New Test**
```
1. User on Agent Executor page
2. Clicks "Run Comprehensive Test Suite"
3. Selects models to compare
4. Test runs (shows progress)
5. Results appear in all sections
6. AI generates new insights
7. User exports results for team
```

### Implementation Files

**New Components**:
- `local_version/agent-hub-ui/src/components/testing/TestingSummaryBadge.tsx`
- `local_version/agent-hub-ui/src/components/testing/ModelComparisonMini.tsx`
- `local_version/agent-hub-ui/src/components/testing/ModelComparisonTable.tsx`
- `local_version/agent-hub-ui/src/components/testing/CategoryBreakdownChart.tsx`
- `local_version/agent-hub-ui/src/components/testing/TestResultsGrid.tsx`
- `local_version/agent-hub-ui/src/components/testing/CostPerformanceScatter.tsx`
- `local_version/agent-hub-ui/src/components/testing/TrendChart.tsx`
- `local_version/agent-hub-ui/src/components/testing/AIInsightsPanel.tsx`

**Modified Components**:
- `local_version/agent-hub-ui/src/components/AgentCard.tsx` (add testing summary)
- `local_version/agent-hub-ui/src/pages/AgentExecutor.tsx` (add testing tab)

**Backend Services**:
- `local_version/agent-hub-backend/routes/agentTestingRoutes.js` (new endpoints)
- `local_version/agent-hub-backend/services/agentTestingAnalyticsService.js` (new service)

### Acceptance Criteria

**Agent Catalog**:
- [ ] Testing summary badge appears on agent cards
- [ ] Shows best model + score
- [ ] Shows last test date + count
- [ ] Shows top 3 models bar chart
- [ ] "Run Quick Test" button works
- [ ] "View Full Analysis" navigates to executor
- [ ] Summary is collapsible/expandable
- [ ] Only shows if agent has test results

**Agent Executor**:
- [ ] New "Testing & Performance" tab exists
- [ ] Overall comparison table displays correctly
- [ ] Category breakdown shows all categories
- [ ] Individual test results grid works
- [ ] Cost-performance scatter plot displays
- [ ] Historical trends chart shows data
- [ ] AI insights panel generates recommendations
- [ ] "Run Comprehensive Test" button works
- [ ] Export functionality works
- [ ] Data updates in real-time after test runs

**API**:
- [ ] GET /api/agents/:agentId/testing/summary returns correct data
- [ ] GET /api/agents/:agentId/testing/detailed returns correct data
- [ ] POST /api/agents/:agentId/testing/run executes tests
- [ ] APIs handle missing data gracefully
- [ ] APIs cache results appropriately

---

## 📊 Implementation Priority

### Phase 1: Core Test Filtering (High Priority)
**Effort**: 2-3 hours  
**Impact**: High - Ensures all agents get essential tests

**Tasks**:
1. Define CORE_TESTS constant
2. Update filtering logic to always include core tests
3. Separate core from agent-specific in UI
4. Add clear messaging about custom tests

### Phase 2: Vector DB + MCP Integration (High Priority)
**Effort**: 6-9 hours  
**Impact**: High - Major new feature for testing

**Tasks**:
1. Create StepConfigureKnowledge component (2-3 hours)
2. Update DDTFWorkflow to add new step (1 hour)
3. Implement backend RAG/MCP execution logic (3-4 hours)
4. Update results display with knowledge source (1-2 hours)
5. Testing and documentation (1 hour)

### Phase 3: Agent Catalog & Executor Integration (Medium Priority)
**Effort**: 8-12 hours  
**Impact**: High - Improves user experience and decision-making

**Tasks**:
1. Create testing summary components for Agent Catalog (2-3 hours)
2. Create detailed analysis components for Agent Executor (4-5 hours)
3. Implement backend APIs (summary + detailed) (2-3 hours)
4. Add AI insights generation (1-2 hours)
5. Testing and documentation (1 hour)

---

## 🎯 Success Metrics

### Enhancement 1: Core Test Filtering
- ✅ 100% of agents receive 5 core tests
- ✅ Users can clearly see core vs agent-specific tests
- ✅ Users understand they can add custom tests
- ✅ New agents automatically get appropriate tests

### Enhancement 2: Vector DB + MCP Integration
- ✅ Users can test with Vector DB + LLM
- ✅ Users can test with MCP + LLM
- ✅ Users can test with Vector DB + MCP + LLM
- ✅ Users can test with LLM only (current behavior)
- ✅ Results clearly show which knowledge source was used
- ✅ Performance metrics (latency) are tracked and displayed

### Enhancement 3: Agent Catalog & Executor Integration
- ✅ Agent Catalog shows testing summary on each card
- ✅ Users can see best model at a glance
- ✅ Users can compare top 3 models visually
- ✅ Agent Executor has comprehensive testing tab
- ✅ Users can run tests directly from executor
- ✅ Detailed model comparison available
- ✅ AI-powered insights and recommendations provided

---

## 📝 Additional Notes

### Dependencies
- VectorDBService (already implemented)
- MCPService (already implemented)
- BedrockService (already implemented)
- Test Library Service (already implemented)

### Risks
- Vector DB might be slow (mitigated by timeout and fallback)
- MCP servers might be offline (mitigated by status check and fallback)
- Increased complexity in test execution (mitigated by clear UI feedback)

### Future Enhancements
- Cache Vector DB results for repeated queries
- Parallel execution of Vector DB + MCP
- Smart routing based on query type
- Cost optimization based on knowledge source

---

## ✅ Ready for Implementation

Both enhancements are well-defined with:
- ✅ Clear requirements
- ✅ Detailed specifications
- ✅ UI mockups
- ✅ Implementation plans
- ✅ Acceptance criteria
- ✅ Effort estimates

**Total Estimated Effort**: 16-24 hours  
**Expected Completion**: 2-3 days

---

**Questions or clarifications needed before starting implementation?**
