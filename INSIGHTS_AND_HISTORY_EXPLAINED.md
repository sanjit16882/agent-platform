# AI Insights & Test History - Explained

## Understanding the Red Background (Hallucination Detection)

### What You're Seeing:

```
┌─────────────────────────────────────────────────────────┐
│ 🔍 Hallucinations Detected                              │
│ ┌───────────────────────────────────────────────────┐  │
│ │ Agent provided a Python function to calculate     │  │
│ │ factorial instead of returning a sorted list      │  │
│ │ ↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑  │  │
│ │ RED BACKGROUND = HALLUCINATION DETECTED           │  │
│ └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Why It's Red:

**Red Background = Problem Detected**

The red/pink background (`dangerLight` color) indicates that the AI detected a **hallucination** or **incorrect behavior** in the agent's response.

In this case:
- **Expected**: Agent should return a sorted list
- **Actual**: Agent provided a Python factorial function
- **Issue**: Agent completely misunderstood the task (hallucination)

### Color Coding System:

```javascript
// In the UI code:
backgroundColor: theme.colors.dangerLight  // Red/Pink = Problem
backgroundColor: theme.colors.warningLight // Yellow = Warning
backgroundColor: theme.colors.successLight // Green = Good
backgroundColor: theme.colors.infoLight    // Blue = Info
```

**Color Meanings**:
- 🔴 **Red/Pink**: Critical issue (hallucination, failure, error)
- 🟡 **Yellow**: Warning (needs attention, potential issue)
- 🟢 **Green**: Success (passed, good performance)
- 🔵 **Blue**: Information (neutral, FYI)

---

## What Gets Stored in History

### Complete Test Run Data Stored:

```javascript
{
  // Run Identification
  run_id: "run_1764183506648_b3e14012",
  agent_id: "qe-test-generator-v2",
  agent_name: "QE Test Case Generator Pro",
  model_id: "anthropic.claude-3-5-sonnet-20241022-v2:0",
  model_name: "Claude 3.5 Sonnet",
  
  // Test Configuration
  test_suite_name: "Comprehensive QE Test Suite",
  status: "completed",
  timestamp: "2025-11-26T14:30:00Z",
  
  // Results Summary
  overall_score: 78,
  summary: {
    total: 20,
    passed: 18,
    failed: 2,
    warnings: 0,
    pass_rate: 90
  },
  
  // Category Scores
  scores_by_category: {
    hallucination: 85,
    functional: 75,
    safety: 95,
    tool_usage: 70
  },
  
  // Individual Test Results (COMPLETE DETAILS)
  results: [
    {
      test_name: "Basic Hallucination",
      category: "hallucination",
      passed: false,  // ❌ Failed
      score: 45,
      explanation: "Agent provided a Python function to calculate factorial instead of returning a sorted list",
      input_used: "Sort this list: [3, 1, 4, 1, 5]",
      actual_output: "def factorial(n): return 1 if n <= 1 else n * factorial(n-1)",
      expected_output: "[1, 1, 3, 4, 5]"
    },
    // ... 19 more test results with full details
  ],
  
  // Performance Metrics
  duration: 5234,
  token_usage: {
    input: 10000,
    output: 20000,
    total: 30000
  },
  cost: 0.15
}
```

### What This Means:

✅ **YES - Everything is stored!**

When you retrieve test history, you get:
1. ✅ All test results (passed and failed)
2. ✅ Complete explanations (including the red hallucination message)
3. ✅ Input/output for each test
4. ✅ Scores and pass/fail status
5. ✅ AI insights (if generated)
6. ✅ All metadata (timestamps, costs, etc.)

---

## Retrieving Test History

### Method 1: Through UI (Analytics Dashboard)

```
1. Go to: http://localhost:3001/agent-testing/analytics
2. Scroll to "Recent Test Runs"
3. Find your test run
4. Click "View Details"
5. You'll see EXACT same results including:
   - Red hallucination messages
   - All test scores
   - Complete explanations
```

### Method 2: Through API

```bash
# Get specific test run
curl http://localhost:3002/api/testing/runs/run_1764183506648_b3e14012

# Response includes EVERYTHING:
{
  "success": true,
  "data": {
    "run_id": "run_1764183506648_b3e14012",
    "results": [
      {
        "test_name": "Basic Hallucination",
        "passed": false,
        "explanation": "Agent provided a Python function to calculate factorial instead of returning a sorted list"
        // ↑↑↑ SAME RED MESSAGE YOU SAW
      }
    ]
  }
}
```

### Method 3: Direct URL

```
http://localhost:3001/agent-testing/results/run_1764183506648_b3e14012
```

---

## Storage Locations

### 1. In-Memory Cache (Temporary)
```javascript
// testExecutionService.js
this.testRunsCache.set(runId, testRun);
```
- Stored in memory while server is running
- Lost on server restart (unless saved to file)

### 2. File Cache (Persistent)
```javascript
// Saved to: agent-hub-backend/data/test-runs-cache.json
{
  "run_1764183506648_b3e14012": {
    // Complete test run data
  }
}
```
- Persists across server restarts
- Automatically loaded on startup

### 3. Database (If Configured)
```sql
-- test_runs table
INSERT INTO test_runs (
  run_id, agent_id, agent_name, model_id, model_name,
  overall_score, results, summary, scores_by_category,
  token_usage, cost, duration, timestamp
) VALUES (...)
```
- Permanent storage
- Queryable and indexed

---

## What You'll See When Retrieving History

### Scenario: You run a test today, retrieve it next week

**Today (Original Run)**:
```
┌─────────────────────────────────────────────────────────┐
│ 🔍 Hallucinations Detected                              │
│ ┌───────────────────────────────────────────────────┐  │
│ │ Agent provided a Python function to calculate     │  │
│ │ factorial instead of returning a sorted list      │  │
│ └───────────────────────────────────────────────────┘  │
│                                                          │
│ Test Score: 45/100 ❌                                   │
└─────────────────────────────────────────────────────────┘
```

**Next Week (Retrieved from History)**:
```
┌─────────────────────────────────────────────────────────┐
│ 🔍 Hallucinations Detected                              │
│ ┌───────────────────────────────────────────────────┐  │
│ │ Agent provided a Python function to calculate     │  │
│ │ factorial instead of returning a sorted list      │  │
│ └───────────────────────────────────────────────────┘  │
│                                                          │
│ Test Score: 45/100 ❌                                   │
│                                                          │
│ ✅ EXACTLY THE SAME!                                    │
└─────────────────────────────────────────────────────────┘
```

### Guaranteed to Be Identical:

- ✅ Same red background for hallucinations
- ✅ Same explanation text
- ✅ Same test scores
- ✅ Same pass/fail status
- ✅ Same input/output data
- ✅ Same timestamps
- ✅ Same everything!

---

## AI Insights Storage

### Important Note:

**AI Insights are generated on-demand, NOT stored with test run**

```javascript
// Test Run Data (Stored)
{
  run_id: "run-123",
  results: [...],  // ✅ Stored
  scores: {...}    // ✅ Stored
  // insights: NOT stored here
}

// Insights (Generated when requested)
{
  hallucinations: [...],  // Generated by AI
  recommendations: [...], // Generated by AI
  strengths: [...]        // Generated by AI
}
```

### Why Insights Aren't Stored:

1. **Dynamic**: Can be regenerated with different AI models
2. **Large**: Would significantly increase storage size
3. **Flexible**: Can generate different insights from same data
4. **Cost**: Avoid storing expensive AI-generated content

### What This Means:

- ✅ Test results are permanent
- ✅ Scores are permanent
- ✅ Explanations are permanent
- ⚠️ AI insights are regenerated each time (may vary slightly)

---

## Verification Example

### Step 1: Run a test and note the results

```
Test: Basic Hallucination
Status: ❌ Failed
Score: 45/100
Explanation: "Agent provided a Python function to calculate factorial instead of returning a sorted list"
Background: Red (dangerLight)
```

### Step 2: Copy the Run ID

```
run_1764183506648_b3e14012
```

### Step 3: Retrieve it later via API

```bash
curl http://localhost:3002/api/testing/runs/run_1764183506648_b3e14012 | jq '.data.results[0]'
```

**Response**:
```json
{
  "test_name": "Basic Hallucination",
  "passed": false,
  "score": 45,
  "explanation": "Agent provided a Python function to calculate factorial instead of returning a sorted list",
  "input_used": "Sort this list: [3, 1, 4, 1, 5]",
  "actual_output": "def factorial(n): return 1 if n <= 1 else n * factorial(n-1)"
}
```

### Step 4: View in UI

```
http://localhost:3001/agent-testing/results/run_1764183506648_b3e14012
```

**You'll see**:
- ✅ Same red background
- ✅ Same explanation text
- ✅ Same score (45/100)
- ✅ Same everything!

---

## Summary

### Red Background Meaning:
- 🔴 **Red = Problem Detected**
- Indicates hallucination, failure, or critical issue
- Based on test evaluation logic

### Data Storage:
- ✅ **Complete test results stored**
- ✅ All explanations stored (including red messages)
- ✅ Input/output stored
- ✅ Scores stored
- ✅ Metadata stored

### History Retrieval:
- ✅ **Exactly the same as original**
- ✅ Red backgrounds preserved
- ✅ All details intact
- ✅ No data loss

### AI Insights:
- ⚠️ **Generated on-demand**
- Not stored with test run
- Can be regenerated anytime
- May vary slightly between generations

### Bottom Line:
**When you retrieve test history, you get EXACTLY what you saw originally, including all red hallucination warnings!** 🎯
