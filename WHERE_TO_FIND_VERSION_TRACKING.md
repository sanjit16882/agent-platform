# Where to Find Version Tracking

## 🔍 Quick Answer

**Location**: Agent Testing → Compare Versions

**URL**: `http://localhost:3000/agent-testing/comparison`

---

## 📍 Navigation Path

### Method 1: From Main Menu
```
1. Click "Agent Testing" in the main navigation
2. You'll see the Agent Testing dashboard with 4 cards:
   - 🧪 Run Tests
   - 📊 Compare Versions  ← CLICK HERE
   - 📈 Analytics
   - 🎭 Multimodal Testing
3. Click "Compare Versions" card
```

### Method 2: Direct URL
```
Navigate to: http://localhost:3000/agent-testing/comparison
```

### Method 3: From Analytics Dashboard
```
1. Go to Agent Testing → Analytics
2. In the "Recent Test Runs" table, you'll see multiple runs
3. Click "Compare" button (if available)
4. Or manually select runs to compare
```

---

## 🎯 What You'll See

### Version Comparison Page Layout:

```
┌─────────────────────────────────────────────────────────┐
│  📊 Compare Versions                                     │
│  Compare test results across different runs              │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Select Agent                                            │
│  [Dropdown: Choose an agent ▼]                          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Select Test Runs to Compare                             │
│                                                          │
│  Run 1: [Select first run ▼]                            │
│  Run 2: [Select second run ▼]                           │
│                                                          │
│  [Compare Versions]                                      │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Comparison Results                                      │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Metric          │ Run 1  │ Run 2  │ Delta        │ │
│  ├───────────────────────────────────────────────────┤ │
│  │ Overall Score   │ 75.0%  │ 78.0%  │ +3.0% ↑     │ │
│  │ Pass Rate       │ 85%    │ 90%    │ +5% ↑       │ │
│  │ Total Tests     │ 20     │ 20     │ 0           │ │
│  └───────────────────────────────────────────────────┘ │
│                                                          │
│  Category Comparison                                     │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Hallucination   │ 88%    │ 92%    │ +4% ↑       │ │
│  │ Functional      │ 75%    │ 78%    │ +3% ↑       │ │
│  │ Safety          │ 90%    │ 95%    │ +5% ↑       │ │
│  └───────────────────────────────────────────────────┘ │
│                                                          │
│  Individual Test Comparison                              │
│  ✅ Test 1: 85% → 92% (+7%) Improved                   │
│  ⚠️  Test 2: 80% → 75% (-5%) Regressed                 │
│  ➡️  Test 3: 90% → 90% (0%) Unchanged                  │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 How to Use Version Tracking

### Step 1: Select an Agent
1. Open the "Select Agent" dropdown
2. Choose the agent you want to track versions for
3. The system will load all test runs for that agent

### Step 2: Select Two Runs to Compare
1. In "Run 1" dropdown, select an older test run
2. In "Run 2" dropdown, select a newer test run
3. You'll see runs listed with:
   - Date/time
   - Overall score
   - Pass rate
   - Number of tests

### Step 3: View Comparison
1. Click "Compare Versions" button
2. The comparison results will show:
   - **Overall metrics comparison** (scores, pass rates)
   - **Category-by-category comparison** (hallucination, functional, etc.)
   - **Individual test comparison** (which tests improved/regressed)
   - **Delta indicators** (↑ improved, ↓ regressed, → unchanged)

---

## 📊 Version Tracking Features

### 1. Overall Metrics Comparison
Shows high-level changes:
- Overall Score: 75% → 78% (+3%)
- Pass Rate: 85% → 90% (+5%)
- Total Tests: 20 → 20 (0)

### 2. Category Comparison
Breaks down by test category:
- Hallucination: 88% → 92% (+4%)
- Functional: 75% → 78% (+3%)
- Safety: 90% → 95% (+5%)
- Tool Usage: 70% → 72% (+2%)

### 3. Individual Test Comparison
Shows each test's change:
- ✅ Improved: Tests that scored higher
- ⚠️ Regressed: Tests that scored lower
- ➡️ Unchanged: Tests with same score

### 4. Visual Indicators
- **Green ↑**: Improvement
- **Red ↓**: Regression
- **Gray →**: No change

---

## 🔢 Version Numbering

The system automatically assigns version numbers to test runs:

```
Version 5 (Latest)  ← Most recent test run
Version 4
Version 3
Version 2
Version 1 (Oldest)  ← First test run
```

### How Versions Are Created:
- Every time you run tests, a new version is created
- Versions are numbered sequentially
- Each version has a unique run ID
- Versions are tracked per agent

---

## 💡 Use Cases

### 1. Track Improvements Over Time
```
Compare: Version 1 vs Version 5
Result: See overall improvement from 70% → 85%
```

### 2. Identify Regressions
```
Compare: Version 4 vs Version 5
Result: Detect if latest changes caused any regressions
```

### 3. A/B Testing
```
Compare: Version with Config A vs Version with Config B
Result: See which configuration performs better
```

### 4. Before/After Analysis
```
Compare: Before prompt change vs After prompt change
Result: Measure impact of prompt modifications
```

---

## 🎯 Example Workflow

### Scenario: You made changes to your agent and want to see if it improved

1. **Run baseline test** (creates Version 1)
   - Score: 75%
   - Pass Rate: 80%

2. **Make changes to agent**
   - Update prompts
   - Modify configuration
   - Add new tools

3. **Run test again** (creates Version 2)
   - Score: 78%
   - Pass Rate: 85%

4. **Compare versions**
   - Go to Agent Testing → Compare Versions
   - Select your agent
   - Run 1: Version 1 (baseline)
   - Run 2: Version 2 (after changes)
   - Click "Compare Versions"

5. **View results**
   - Overall Score: +3% improvement ✅
   - Pass Rate: +5% improvement ✅
   - Hallucination: +4% improvement ✅
   - Functional: +3% improvement ✅
   - Conclusion: Changes improved performance!

---

## 🔧 Backend API Endpoints

The version tracking uses these endpoints:

### Get Version History:
```
GET /api/testing/agents/:agentId/versions?limit=20
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "version": 5,
      "runId": "run-123",
      "timestamp": "2025-11-26T10:00:00Z",
      "overallScore": 78,
      "passRate": 90,
      "totalTests": 20
    }
  ]
}
```

### Compare Two Versions:
```
POST /api/testing/versions/compare
Body: { "runId1": "run-123", "runId2": "run-456" }
```

**Response:**
```json
{
  "success": true,
  "data": {
    "run1": { "overallScore": 75, "passRate": 85 },
    "run2": { "overallScore": 78, "passRate": 90 },
    "deltas": {
      "overallScore": 3,
      "passRate": 5
    },
    "categoryComparison": {...},
    "testComparison": [...]
  }
}
```

---

## 📸 Visual Guide

### Main Dashboard:
```
┌─────────────────────────────────────────────────────────┐
│  AI Agent Testing Framework                              │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ 🧪 Run Tests │  │ 📊 Compare   │  │ 📈 Analytics │ │
│  │              │  │    Versions  │  │              │ │
│  │ Execute      │  │              │  │ Visualize    │ │
│  │ tests        │  │ Track        │  │ trends       │ │
│  │              │  │ improvements │  │              │ │
│  │ [Start] →    │  │ [Compare] →  │  │ [View] →     │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                         ↑                                │
│                    CLICK HERE                            │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ Summary

**Where**: Agent Testing → Compare Versions  
**URL**: `/agent-testing/comparison`  
**Purpose**: Compare test results across different runs  
**Features**: 
- Version history tracking
- Side-by-side comparison
- Delta calculations
- Improvement/regression detection

**To see it now**:
1. Navigate to `http://localhost:3000/agent-testing/comparison`
2. Select an agent
3. Select two test runs
4. Click "Compare Versions"

That's where version tracking lives! 🎉
