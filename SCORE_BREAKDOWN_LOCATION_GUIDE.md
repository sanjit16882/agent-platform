# Score Breakdown Component - Location Guide

## Where to Find It

The **ScoreBreakdown** component appears on the **Test Results Viewer** page.

### Navigation Path:
```
Agent Testing → Run Tests → Execute Tests → View Results
                                              ↓
                                    Test Results Viewer
                                              ↓
                                    Score Breakdown Card
```

### Direct URL:
```
http://localhost:3000/agent-testing/results/:runId
```

---

## Page Layout

The Test Results Viewer page shows results in this order:

```
┌─────────────────────────────────────────────────────────┐
│  Test Results                          [Export JSON] [Export CSV]  │
│  Test Suite Name • Date/Time                            │
└─────────────────────────────────────────────────────────┘

┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│  Total   │ │  Passed  │ │  Failed  │ │ Overall  │
│  Tests   │ │  Tests   │ │  Tests   │ │  Score   │
│   20     │ │   18     │ │    2     │ │  78.0%   │
└──────────┘ └──────────┘ └──────────┘ └──────────┘

┌─────────────────────────────────────────────────────────┐
│  📊 Score Breakdown                    ← NEW COMPONENT  │
│  ┌─────────────────────────────────────────────────┐   │
│  │              78.0%                              │   │
│  │         Overall Score                           │   │
│  │         [Acceptable]                            │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  📈 How Your Score Compares                             │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Excellent (90-100%)      Top 10%                │   │
│  │ Good (80-89%)            Top 40%                │   │
│  │ Acceptable (70-79%)      ← You are here         │   │
│  │ Needs Improvement        Below Average          │   │
│  │ Poor (0-59%)             Bottom 5%              │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Category Performance                                   │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Hallucination    ████████████████░░░░  92%      │   │
│  │ Functional       ████████████░░░░░░░░  78%      │   │
│  │ Safety           ██████████████████░░  95%      │   │
│  │ Tool Usage       ████████░░░░░░░░░░░░  65%      │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  💡 How to Improve Your Score                           │
│  • Improve response completeness with more details      │
│  • Ensure output format matches expectations            │
│  • Reduce any hallucinations or unverified claims       │
│  • Target score: 80+ for good performance               │
│                                                         │
│  ℹ️ Scores are calculated in real-time based on        │
│     weighted criteria evaluation.                       │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Filters and Search                                     │
│  [Search tests...] [All] [Passed] [Failed]             │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Individual Test Results                                │
│  ✓ Test 1: Hallucination Check - 92%                   │
│  ✗ Test 2: Functional Test - 65%                       │
│  ✓ Test 3: Safety Test - 95%                           │
│  ...                                                    │
└─────────────────────────────────────────────────────────┘
```

---

## How to Access

### Method 1: Through Workflow
1. Go to **Agent Testing** (main menu)
2. Click **"Start Testing"** or **"Run Tests"**
3. Complete the test workflow (select agent, tests, etc.)
4. Click **"Execute Tests"**
5. After execution completes, you'll see the **Test Results Viewer**
6. The **Score Breakdown** card appears below the summary cards

### Method 2: From Analytics
1. Go to **Agent Testing → Analytics**
2. Find a test run in the "Recent Test Runs" table
3. Click **"View Details"** or the run ID
4. You'll be taken to the **Test Results Viewer**
5. Scroll down to see the **Score Breakdown** card

### Method 3: From Version Comparison
1. Go to **Agent Testing → Compare Versions**
2. Select two test runs to compare
3. Click on either run ID to view details
4. You'll see the **Score Breakdown** for that run

---

## What the Component Shows

### 1. Overall Score Display
- Large, color-coded score (78.0%)
- Score label (Excellent, Good, Acceptable, etc.)
- Visual badge with color

### 2. Score Distribution
- Shows where you rank compared to others
- Highlights your position (e.g., "← You are here")
- Provides context (Top 10%, Average, etc.)

### 3. Category Performance (if available)
- Visual progress bars for each test category
- Percentage scores
- Color-coded (green = good, yellow = acceptable, red = poor)

### 4. Individual Criteria Scores (if available)
- Breakdown of each scoring criterion
- Points earned vs. max points
- Specific feedback for each criterion
- Pass/fail indicators

### 5. Improvement Tips
- Contextual suggestions based on your score
- Specific actions to improve
- Target score recommendations

### 6. Transparency Note
- Explains that scores are calculated in real-time
- Clarifies the scoring methodology

---

## Code Location

### Component File:
```
local_version/agent-hub-ui/src/components/testing/ScoreBreakdown.tsx
```

### Integration Point:
```typescript
// In TestResultsViewer.tsx (line ~353)

{/* Score Breakdown */}
<ScoreBreakdown
  overallScore={testRun.overall_score || 0}
  categoryScores={scores}
  showDetails={true}
/>
```

### Props:
- `overallScore`: number (0-100)
- `categoryScores`: Record<string, number> (optional)
- `criteriaResults`: Array of criterion objects (optional)
- `showDetails`: boolean (default: true)

---

## When It Appears

The ScoreBreakdown component appears:
- ✅ After any test execution completes
- ✅ When viewing historical test results
- ✅ When accessing results from analytics
- ✅ When viewing results from version comparison

It does NOT appear:
- ❌ During test execution (before completion)
- ❌ On the main Agent Testing dashboard
- ❌ In the workflow steps (before execution)

---

## Example Screenshots

### Location in Page Flow:
```
1. Agent Testing Dashboard
   ↓ Click "Start Testing"
   
2. DDTF Workflow (9 steps)
   ↓ Complete steps 1-7
   
3. Step 8: Results
   ↓ This is where you see it!
   
   ┌─────────────────────────────┐
   │  Summary Cards              │
   └─────────────────────────────┘
   
   ┌─────────────────────────────┐
   │  📊 Score Breakdown         │  ← HERE!
   │  (New Component)            │
   └─────────────────────────────┘
   
   ┌─────────────────────────────┐
   │  Individual Test Results    │
   └─────────────────────────────┘
```

---

## Testing the Component

### To see the Score Breakdown:

1. **Quick Test**:
   ```bash
   # Navigate to
   http://localhost:3000/agent-testing/workflow
   
   # Complete workflow and execute tests
   # After execution, you'll see the Score Breakdown
   ```

2. **View Existing Results**:
   ```bash
   # If you have a test run ID
   http://localhost:3000/agent-testing/results/run-123
   
   # The Score Breakdown will appear automatically
   ```

3. **From Analytics**:
   ```bash
   # Navigate to
   http://localhost:3000/agent-testing/analytics
   
   # Click any test run to view its Score Breakdown
   ```

---

## Summary

**Location**: Test Results Viewer page  
**URL Pattern**: `/agent-testing/results/:runId`  
**Position**: Between summary cards and individual test results  
**Purpose**: Provide transparent, detailed scoring information  
**Visibility**: Always visible when viewing test results  

The component answers the question: **"Is my 78% score real?"** by showing exactly how it was calculated!
