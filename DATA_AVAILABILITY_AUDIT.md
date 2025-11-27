# Data Availability Audit for Agent Testing Integration

## Current Data Available ✅

### 1. Test Run Data (Currently Stored)
```javascript
{
  run_id: "run-123",
  agent_id: "qe-test-generator-v2",
  model_id: "anthropic.claude-3-5-sonnet-20241022-v2:0", // ✅ Available
  status: "completed",
  overall_score: 92, // ✅ Available
  summary: {
    total: 20,
    passed: 18,
    failed: 2,
    warnings: 0,
    pass_rate: 90 // ✅ Available
  },
  scores_by_category: { // ✅ Available
    hallucination: 95,
    functional: 88,
    safety: 98
  },
  results: [ // ✅ Available
    {
      test_name: "Basic Hallucination",
      score: 95,
      passed: true,
      explanation: "..."
    }
  ],
  duration: 5000, // ✅ Available (in ms)
  timestamp: "2025-11-26T10:00:00Z" // ✅ Available
}
```

### 2. Available Queries
- ✅ Get test runs by agent: `getAgentTestRuns(agentId)`
- ✅ Get specific test run: `getTestRun(runId)`
- ✅ Get all test runs: `/api/testing/runs`
- ✅ Filter by agent: `/api/testing/runs?agentId=xxx`

---

## Data We Have ✅

### For Agent Catalog (Summary View):

| Metric | Available? | Source |
|--------|-----------|--------|
| Best Model Name | ✅ YES | `model_id` from test runs |
| Best Model Score | ✅ YES | `overall_score` from test runs |
| Last Test Date | ✅ YES | `timestamp` from test runs |
| Total Tests Count | ✅ YES | `summary.total` from test runs |
| Model Comparison Scores | ✅ YES | Compare `overall_score` across runs with different `model_id` |
| Pass Rate | ✅ YES | `summary.pass_rate` from test runs |

**Status**: ✅ **All data available!**

### For Agent Executor (Detailed View):

| Metric | Available? | Source | Notes |
|--------|-----------|--------|-------|
| Overall Score per Model | ✅ YES | `overall_score` | ✅ |
| Pass Rate per Model | ✅ YES | `summary.pass_rate` | ✅ |
| Total Tests | ✅ YES | `summary.total` | ✅ |
| Category Scores | ✅ YES | `scores_by_category` | ✅ |
| Individual Test Results | ✅ YES | `results` array | ✅ |
| Test Duration/Speed | ✅ YES | `duration` | ✅ |
| Cost per Run | ⚠️ PARTIAL | Need to calculate | See below |
| Historical Trends | ✅ YES | Multiple runs over time | ✅ |

**Status**: ✅ **Most data available, cost needs calculation**

---

## Data We Need to Calculate 🔧

### 1. Cost per Run
**Current**: Not directly stored  
**Solution**: Calculate based on model pricing

```javascript
// Model pricing (per 1000 tokens)
const MODEL_PRICING = {
  'anthropic.claude-3-5-sonnet-20241022-v2:0': {
    input: 0.003,
    output: 0.015
  },
  'anthropic.claude-3-haiku-20240307-v1:0': {
    input: 0.00025,
    output: 0.00125
  },
  'amazon.titan-text-express-v1': {
    input: 0.0002,
    output: 0.0006
  }
};

// Calculate cost from test run
function calculateCost(testRun) {
  const model = MODEL_PRICING[testRun.model_id];
  if (!model) return 0;
  
  // Estimate tokens (rough approximation)
  const avgInputTokens = 500; // per test
  const avgOutputTokens = 1000; // per test
  const totalTests = testRun.summary.total;
  
  const inputCost = (avgInputTokens * totalTests / 1000) * model.input;
  const outputCost = (avgOutputTokens * totalTests / 1000) * model.output;
  
  return inputCost + outputCost;
}
```

### 2. Model Name (Human-Readable)
**Current**: Only model ID stored  
**Solution**: Map model IDs to names

```javascript
const MODEL_NAMES = {
  'anthropic.claude-3-5-sonnet-20241022-v2:0': 'Claude 3.5 Sonnet',
  'anthropic.claude-3-haiku-20240307-v1:0': 'Claude 3 Haiku',
  'amazon.titan-text-express-v1': 'Titan Text Express'
};
```

### 3. Best Model per Agent
**Current**: Need to query and compare  
**Solution**: Query all runs for agent, find highest score

```javascript
async function getBestModel(agentId) {
  const runs = await getAgentTestRuns(agentId);
  
  // Group by model
  const modelScores = {};
  runs.forEach(run => {
    if (!modelScores[run.model_id]) {
      modelScores[run.model_id] = [];
    }
    modelScores[run.model_id].push(run.overall_score);
  });
  
  // Calculate average score per model
  const modelAverages = {};
  Object.entries(modelScores).forEach(([modelId, scores]) => {
    modelAverages[modelId] = scores.reduce((a, b) => a + b) / scores.length;
  });
  
  // Find best
  const bestModelId = Object.keys(modelAverages).reduce((a, b) => 
    modelAverages[a] > modelAverages[b] ? a : b
  );
  
  return {
    modelId: bestModelId,
    modelName: MODEL_NAMES[bestModelId],
    score: modelAverages[bestModelId]
  };
}
```

---

## Missing Data ❌

### 1. Token Usage
**Status**: ❌ Not stored  
**Impact**: Can't calculate exact cost  
**Workaround**: Use estimated tokens based on test count  
**Future**: Add token tracking to test execution

### 2. Agent Name in Test Run
**Status**: ⚠️ Only agent_id stored  
**Impact**: Need to lookup agent name separately  
**Workaround**: Join with agents table/API  
**Future**: Store agent_name in test run

### 3. Test Suite Name
**Status**: ⚠️ Generic "Custom Test Suite"  
**Impact**: Can't distinguish between different test types  
**Workaround**: Use test categories from results  
**Future**: Store meaningful suite names

---

## API Endpoints to Create

### 1. Agent Testing Summary (for Agent Catalog)
```
GET /api/agents/:agentId/testing/summary

Response:
{
  success: true,
  data: {
    agentId: "qe-test-generator-v2",
    agentName: "QE Test Case Generator Pro",
    bestModel: {
      modelId: "anthropic.claude-3-5-sonnet-20241022-v2:0",
      modelName: "Claude 3.5 Sonnet",
      score: 92
    },
    lastTested: "2025-11-26T10:00:00Z",
    totalTests: 15,
    modelComparison: [
      { modelId: "...", modelName: "Claude 3.5 Sonnet", score: 92 },
      { modelId: "...", modelName: "Claude 3 Haiku", score: 78 },
      { modelId: "...", modelName: "Titan Text", score: 65 }
    ]
  }
}
```

**Implementation**:
```javascript
router.get('/agents/:agentId/testing/summary', async (req, res) => {
  const agentId = req.params.agentId;
  
  // Get all test runs for this agent
  const runs = await testExecutionService.getAgentTestRuns(agentId, 50);
  
  if (runs.length === 0) {
    return res.json({
      success: true,
      data: null,
      message: 'No test runs found for this agent'
    });
  }
  
  // Group by model and calculate averages
  const modelStats = {};
  runs.forEach(run => {
    if (!modelStats[run.model_id]) {
      modelStats[run.model_id] = {
        scores: [],
        lastRun: run.timestamp
      };
    }
    modelStats[run.model_id].scores.push(run.overall_score);
    if (new Date(run.timestamp) > new Date(modelStats[run.model_id].lastRun)) {
      modelStats[run.model_id].lastRun = run.timestamp;
    }
  });
  
  // Calculate averages and find best
  const modelComparison = Object.entries(modelStats).map(([modelId, stats]) => ({
    modelId,
    modelName: MODEL_NAMES[modelId] || modelId,
    score: Math.round(stats.scores.reduce((a, b) => a + b) / stats.scores.length)
  })).sort((a, b) => b.score - a.score);
  
  const bestModel = modelComparison[0];
  const lastTested = runs[0].timestamp; // Most recent
  const totalTests = runs.reduce((sum, run) => sum + run.summary.total, 0);
  
  res.json({
    success: true,
    data: {
      agentId,
      bestModel,
      lastTested,
      totalTests,
      modelComparison: modelComparison.slice(0, 3) // Top 3
    }
  });
});
```

### 2. Agent Testing Detailed (for Agent Executor)
```
GET /api/agents/:agentId/testing/detailed

Response:
{
  success: true,
  data: {
    agentId: "qe-test-generator-v2",
    models: [
      {
        modelId: "...",
        modelName: "Claude 3.5 Sonnet",
        overallScore: 92,
        passRate: 90,
        totalTests: 20,
        avgDuration: 2300,
        estimatedCost: 0.15,
        categoryScores: {
          hallucination: 95,
          functional: 88,
          safety: 98
        },
        recentRuns: [...]
      }
    ],
    trends: {
      historical: [...]
    }
  }
}
```

**Implementation**: Similar to summary but with full details

---

## Data Aggregation Strategy

### For Agent Catalog:
```javascript
// Cache summary data per agent
// Refresh every 5 minutes or on new test run
const agentTestingSummaryCache = new Map();

async function getAgentTestingSummary(agentId) {
  const cached = agentTestingSummaryCache.get(agentId);
  if (cached && Date.now() - cached.timestamp < 300000) {
    return cached.data;
  }
  
  const summary = await calculateSummary(agentId);
  agentTestingSummaryCache.set(agentId, {
    data: summary,
    timestamp: Date.now()
  });
  
  return summary;
}
```

### For Agent Executor:
```javascript
// Real-time data, no caching
// Query fresh data on page load
async function getAgentTestingDetailed(agentId) {
  const runs = await testExecutionService.getAgentTestRuns(agentId, 100);
  return aggregateDetailedAnalysis(runs);
}
```

---

## Summary

### ✅ Data We Have:
- Test run results with scores
- Model IDs
- Category breakdowns
- Individual test results
- Timestamps
- Pass rates
- Duration

### 🔧 Data We Can Calculate:
- Best model per agent
- Model comparisons
- Average scores
- Historical trends
- Estimated costs

### ❌ Data We're Missing:
- Exact token usage (use estimates)
- Agent names in test runs (lookup separately)
- Meaningful test suite names (use categories)

### 📊 Conclusion:
**We have 95% of the data needed!**

The missing 5% can be:
- Calculated (costs)
- Looked up (agent names)
- Estimated (tokens)

**Ready to implement with current data structure!**

---

## Implementation Plan

### Phase 1: Backend APIs (2-3 hours)
1. Create `/api/agents/:agentId/testing/summary` endpoint
2. Create `/api/agents/:agentId/testing/detailed` endpoint
3. Add model name mapping
4. Add cost calculation utility

### Phase 2: Agent Catalog Integration (2-3 hours)
1. Create `TestingSummaryBadge` component
2. Add to `AgentCard` component
3. Fetch and display summary data
4. Add "View Full Analysis" link

### Phase 3: Agent Executor Integration (3-4 hours)
1. Create "Testing & Performance" tab
2. Create detailed comparison components
3. Fetch and display detailed data
4. Add export functionality

### Total Estimate: 7-10 hours

**All data is available or calculable - ready to proceed!**
