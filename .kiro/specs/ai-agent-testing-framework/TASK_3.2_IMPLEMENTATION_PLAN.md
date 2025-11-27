# Task 3.2: Version Comparison - Implementation Plan

**Status:** In Progress  
**Estimated Time:** 2 hours  
**Started:** 2024-11-21

---

## 📋 Task Overview

Create a component for comparing test results across different agent versions or test runs:
1. Side-by-side comparison of test results
2. Diff highlighting for changes
3. Score comparison visualization
4. Timeline view of test history
5. Filter by test category
6. Export comparison report

---

## 🎯 Component Design

### VersionComparison Component

**Purpose:** Compare 2+ test runs side-by-side to identify improvements and regressions

**Key Features:**
- Select multiple test runs for comparison
- Side-by-side result display
- Diff highlighting (improved/regressed/unchanged)
- Score delta visualization (+5%, -3%)
- Timeline view of selected runs
- Filter by test category
- Export comparison to JSON/CSV

---

## 🎨 UI Design

### Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│ Version Comparison                                          │
├─────────────────────────────────────────────────────────────┤
│ Select Runs to Compare:                                     │
│ [Run 1 ▼] [Run 2 ▼] [+ Add Run]                           │
│                                                              │
│ Timeline: ●────────●────────●                               │
│          Run 1   Run 2   Run 3                              │
├─────────────────────────────────────────────────────────────┤
│ Summary Comparison                                          │
│ ┌──────────────┬──────────────┬──────────────┐            │
│ │   Run 1      │   Run 2      │   Delta      │            │
│ ├──────────────┼──────────────┼──────────────┤            │
│ │ Pass: 18/20  │ Pass: 19/20  │ +1 (+5%) ↑   │            │
│ │ Score: 85%   │ Score: 90%   │ +5% ↑        │            │
│ │ Time: 45s    │ Time: 42s    │ -3s ↓        │            │
│ └──────────────┴──────────────┴──────────────┘            │
├─────────────────────────────────────────────────────────────┤
│ Detailed Comparison                                         │
│ Filter: [All ▼] [Hallucination] [Functional] [Tool Usage]  │
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ Test: User Authentication                                ││
│ │ ┌────────────┬────────────┬────────────┐                ││
│ │ │  Run 1     │  Run 2     │  Status    │                ││
│ │ ├────────────┼────────────┼────────────┤                ││
│ │ │ ✗ Failed   │ ✓ Passed   │ ↑ Improved │                ││
│ │ │ Score: 60% │ Score: 95% │ +35%       │                ││
│ │ └────────────┴────────────┴────────────┘                ││
│ └──────────────────────────────────────────────────────────┘│
│                                                              │
│ [Export Comparison] [View Full Details]                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Implementation Steps

### Step 1: Create VersionComparison Component (45 min)

**File:** `local_version/agent-hub-ui/src/components/testing/VersionComparison.tsx`

**Structure:**
```typescript
interface VersionComparisonProps {
  agentId?: string;  // Optional: filter runs by agent
  runIds?: string[]; // Optional: pre-select runs
}

interface TestRun {
  id: string;
  agentId: string;
  startTime: string;
  totalTests: number;
  passedTests: number;
  passRate: number;
  averageScore: number;
  duration: number;
}

interface ComparisonResult {
  testName: string;
  category: string;
  runs: {
    runId: string;
    passed: boolean;
    score: number;
    explanation: string;
  }[];
  status: 'improved' | 'regressed' | 'unchanged';
  delta: number;
}
```

**Components:**
1. Run selector dropdowns
2. Timeline visualization
3. Summary comparison table
4. Detailed test comparison
5. Export functionality

### Step 2: Fetch and Process Data (30 min)

**API Calls:**
- `GET /api/testing/runs` - Fetch all runs
- `GET /api/testing/runs/:runId` - Fetch specific run details

**Data Processing:**
1. Fetch selected test runs
2. Align tests by name across runs
3. Calculate deltas (score, pass/fail)
4. Determine status (improved/regressed/unchanged)
5. Sort by significance (biggest changes first)

### Step 3: Summary Comparison Section (20 min)

**Metrics to Compare:**
- Total tests
- Passed tests
- Pass rate (%)
- Average score
- Execution time
- Cost (if available)

**Visualization:**
- Side-by-side metrics
- Delta with arrows (↑ improved, ↓ regressed, → unchanged)
- Color coding (green=improved, red=regressed, gray=unchanged)

### Step 4: Detailed Test Comparison (30 min)

**Features:**
- List all tests with results from each run
- Highlight differences
- Show score deltas
- Expandable details for each test
- Filter by category
- Sort by delta magnitude

**Status Indicators:**
- ↑ Improved (green) - Failed → Passed or score increased
- ↓ Regressed (red) - Passed → Failed or score decreased
- → Unchanged (gray) - Same result

### Step 5: Timeline Visualization (15 min)

**Features:**
- Visual timeline of selected runs
- Show dates/times
- Clickable to select/deselect runs
- Highlight selected runs

### Step 6: Export Functionality (10 min)

**Export Formats:**
- JSON - Full comparison data
- CSV - Tabular format for spreadsheets

**Export Content:**
- Summary metrics
- All test comparisons
- Deltas and status
- Timestamps

---

## 📝 Detailed Implementation

### 1. Component Structure

```typescript
import React, { useState, useEffect } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { theme } from '../../styles/theme';

interface VersionComparisonProps {
  agentId?: string;
  runIds?: string[];
}

const VersionComparison: React.FC<VersionComparisonProps> = ({
  agentId,
  runIds: initialRunIds
}) => {
  const [availableRuns, setAvailableRuns] = useState<TestRun[]>([]);
  const [selectedRunIds, setSelectedRunIds] = useState<string[]>(initialRunIds || []);
  const [comparisonData, setComparisonData] = useState<ComparisonResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterCategory, setFilterCategory] = useState('all');

  // Fetch available runs
  useEffect(() => {
    fetchAvailableRuns();
  }, [agentId]);

  // Fetch and compare when runs selected
  useEffect(() => {
    if (selectedRunIds.length >= 2) {
      compareRuns();
    }
  }, [selectedRunIds]);

  return (
    <div>
      {/* Run Selection */}
      {/* Timeline */}
      {/* Summary Comparison */}
      {/* Detailed Comparison */}
      {/* Export */}
    </div>
  );
};
```

### 2. Run Selection UI

```typescript
<Card>
  <Card.Header>
    <Card.Title>Select Runs to Compare</Card.Title>
  </Card.Header>
  <Card.Body>
    <div style={{ display: 'flex', gap: theme.spacing.md, flexWrap: 'wrap' }}>
      {selectedRunIds.map((runId, index) => (
        <select
          key={index}
          value={runId}
          onChange={(e) => handleRunChange(index, e.target.value)}
        >
          <option value="">Select Run {index + 1}</option>
          {availableRuns.map(run => (
            <option key={run.id} value={run.id}>
              {formatRunLabel(run)}
            </option>
          ))}
        </select>
      ))}
      {selectedRunIds.length < 5 && (
        <Button variant="outline-primary" onClick={addRunSlot}>
          + Add Run
        </Button>
      )}
    </div>
  </Card.Body>
</Card>
```

### 3. Summary Comparison Table

```typescript
<Card>
  <Card.Header>
    <Card.Title>Summary Comparison</Card.Title>
  </Card.Header>
  <Card.Body>
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th>Metric</th>
          {selectedRuns.map(run => (
            <th key={run.id}>{formatDate(run.startTime)}</th>
          ))}
          <th>Delta</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Pass Rate</td>
          {selectedRuns.map(run => (
            <td key={run.id}>{run.passRate}%</td>
          ))}
          <td>{calculateDelta('passRate')}</td>
        </tr>
        {/* More metrics */}
      </tbody>
    </table>
  </Card.Body>
</Card>
```

### 4. Detailed Test Comparison

```typescript
<Card>
  <Card.Header>
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <Card.Title>Detailed Comparison</Card.Title>
      <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
        <option value="all">All Categories</option>
        <option value="hallucination">Hallucination</option>
        <option value="functional">Functional</option>
        <option value="tool_usage">Tool Usage</option>
      </select>
    </div>
  </Card.Header>
  <Card.Body>
    {filteredComparisons.map(comparison => (
      <div key={comparison.testName} style={{ marginBottom: theme.spacing.lg }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <strong>{comparison.testName}</strong>
            <Badge variant={getStatusVariant(comparison.status)}>
              {getStatusIcon(comparison.status)} {comparison.status}
            </Badge>
          </div>
          <div>{comparison.delta > 0 ? '+' : ''}{comparison.delta}%</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${selectedRunIds.length}, 1fr)`, gap: theme.spacing.sm }}>
          {comparison.runs.map(run => (
            <div key={run.runId}>
              {run.passed ? '✓' : '✗'} {run.score}%
            </div>
          ))}
        </div>
      </div>
    ))}
  </Card.Body>
</Card>
```

### 5. Helper Functions

```typescript
const calculateDelta = (metric: string): string => {
  if (selectedRuns.length < 2) return '-';
  const first = selectedRuns[0][metric];
  const last = selectedRuns[selectedRuns.length - 1][metric];
  const delta = last - first;
  const arrow = delta > 0 ? '↑' : delta < 0 ? '↓' : '→';
  return `${delta > 0 ? '+' : ''}${delta}% ${arrow}`;
};

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'improved': return 'success';
    case 'regressed': return 'danger';
    default: return 'secondary';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'improved': return '↑';
    case 'regressed': return '↓';
    default: return '→';
  }
};

const formatRunLabel = (run: TestRun): string => {
  return `${formatDate(run.startTime)} - ${run.passRate}% (${run.passedTests}/${run.totalTests})`;
};
```

---

## ✅ Acceptance Criteria Checklist

- [ ] Side-by-side comparison
  - [ ] Select 2+ runs
  - [ ] Display results side-by-side
  
- [ ] Diff highlighting
  - [ ] Improved tests (green)
  - [ ] Regressed tests (red)
  - [ ] Unchanged tests (gray)
  
- [ ] Score comparison
  - [ ] Show score deltas
  - [ ] Calculate percentage changes
  - [ ] Display with arrows
  
- [ ] Timeline view
  - [ ] Visual timeline of runs
  - [ ] Clickable selection
  - [ ] Date/time labels
  
- [ ] Component renders correctly
  - [ ] No TypeScript errors
  - [ ] Responsive design
  - [ ] Loading states

---

## 🧪 Testing Plan

### Manual Testing:
1. Select 2 test runs
2. Verify summary comparison shows correct deltas
3. Verify detailed comparison highlights changes
4. Filter by category
5. Export to JSON and CSV
6. Add/remove runs dynamically

### Edge Cases:
- No runs available
- Only 1 run selected
- Runs with different test sets
- Missing test data
- Very large deltas

---

## 📁 Files to Create

### New Files:
1. `local_version/agent-hub-ui/src/components/testing/VersionComparison.tsx`

### Modified Files:
1. `local_version/agent-hub-ui/src/components/testing/index.tsx` (export)

---

## 🎯 Success Metrics

- ✅ Compare 2+ test runs side-by-side
- ✅ Highlight improvements and regressions
- ✅ Show score deltas with arrows
- ✅ Filter by test category
- ✅ Export comparison data
- ✅ No TypeScript errors
- ✅ Responsive design

---

**Ready to implement!** 🚀

