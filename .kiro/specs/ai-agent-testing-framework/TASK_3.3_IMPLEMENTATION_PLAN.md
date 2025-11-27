# Task 3.3: Analytics Dashboard - Implementation Plan

**Status:** In Progress  
**Estimated Time:** 2 hours  
**Started:** 2024-11-21

---

## 📋 Task Overview

Create an analytics dashboard for visualizing testing trends and insights:
1. Test history charts
2. Score trends over time
3. Pass rate analysis
4. Cost analysis
5. Performance metrics
6. Category breakdown

---

## 🎯 Component Design

### AnalyticsDashboard Component

**Purpose:** Comprehensive analytics and insights for agent testing performance

**Key Features:**
- Test execution history timeline
- Pass rate trends (line chart)
- Score distribution (bar chart)
- Category performance breakdown
- Cost analysis over time
- Performance metrics (latency, throughput)
- Filter by date range and agent
- Export analytics data

---

## 🎨 UI Design

### Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│ Analytics Dashboard                                         │
├─────────────────────────────────────────────────────────────┤
│ Filters: [Agent ▼] [Date Range ▼] [Category ▼]            │
├─────────────────────────────────────────────────────────────┤
│ Summary Cards                                               │
│ ┌──────────┬──────────┬──────────┬──────────┐             │
│ │ Total    │ Avg Pass │ Avg      │ Total    │             │
│ │ Tests    │ Rate     │ Score    │ Cost     │             │
│ │ 1,234    │ 87%      │ 85.5     │ $12.50   │             │
│ └──────────┴──────────┴──────────┴──────────┘             │
├─────────────────────────────────────────────────────────────┤
│ Pass Rate Trend                                             │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ 100% ┤                                    ●              ││
│ │  90% ┤                          ●───●───●               ││
│ │  80% ┤                ●───●───●                         ││
│ │  70% ┤      ●───●───●                                   ││
│ │  60% ┤●───●                                             ││
│ │      └────────────────────────────────────────────────  ││
│ │       Jan  Feb  Mar  Apr  May  Jun  Jul  Aug  Sep      ││
│ └─────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────┤
│ Category Performance                                        │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ Hallucination  ████████████████░░░░ 80%                 ││
│ │ Functional     ██████████████████░░ 90%                 ││
│ │ Tool Usage     ████████████░░░░░░░░ 60%                 ││
│ │ Emotional      ██████████████████░░ 90%                 ││
│ │ Safety         ████████████████████ 100%                ││
│ └─────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────┤
│ Recent Test Runs                                            │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ 2024-11-21 10:30 | Agent A | 18/20 (90%) | $0.50       ││
│ │ 2024-11-21 09:15 | Agent B | 15/20 (75%) | $0.45       ││
│ │ 2024-11-20 16:45 | Agent A | 19/20 (95%) | $0.52       ││
│ └─────────────────────────────────────────────────────────┘│
│                                                              │
│ [Export Analytics] [View Detailed Report]                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Implementation Steps

### Step 1: Create AnalyticsDashboard Component (30 min)

**File:** `local_version/agent-hub-ui/src/components/testing/AnalyticsDashboard.tsx`

**Structure:**
```typescript
interface AnalyticsDashboardProps {
  agentId?: string;
  dateRange?: { start: string; end: string };
}

interface AnalyticsData {
  totalTests: number;
  averagePassRate: number;
  averageScore: number;
  totalCost: number;
  passRateTrend: Array<{ date: string; passRate: number }>;
  categoryPerformance: Array<{ category: string; passRate: number; count: number }>;
  recentRuns: Array<TestRun>;
}
```

### Step 2: Summary Cards (15 min)

**Metrics:**
- Total tests executed
- Average pass rate
- Average score
- Total cost
- Trend indicators (↑ ↓)

### Step 3: Pass Rate Trend Chart (30 min)

**Features:**
- Line chart showing pass rate over time
- X-axis: Date
- Y-axis: Pass rate (%)
- Hover tooltips with details
- Responsive design

**Implementation:**
- Use CSS for simple line chart
- Or use lightweight chart library if available
- Show last 30 days by default

### Step 4: Category Performance Breakdown (20 min)

**Features:**
- Horizontal bar chart
- Show pass rate per category
- Color-coded bars
- Test count per category
- Sort by pass rate

### Step 5: Recent Test Runs Table (15 min)

**Features:**
- List of recent test runs
- Date, agent, results, cost
- Click to view details
- Pagination
- Sort by date

### Step 6: Filters and Export (10 min)

**Filters:**
- Agent selection
- Date range picker
- Category filter

**Export:**
- Export to JSON
- Export to CSV
- Include all analytics data

---

## 📝 Detailed Implementation

### 1. Component Structure

```typescript
import React, { useState, useEffect } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { theme } from '../../styles/theme';

interface AnalyticsDashboardProps {
  agentId?: string;
  dateRange?: { start: string; end: string };
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  agentId,
  dateRange
}) => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(agentId || 'all');
  const [selectedDateRange, setSelectedDateRange] = useState('30');

  useEffect(() => {
    fetchAnalytics();
  }, [selectedAgent, selectedDateRange]);

  return (
    <div>
      {/* Filters */}
      {/* Summary Cards */}
      {/* Pass Rate Trend */}
      {/* Category Performance */}
      {/* Recent Runs */}
      {/* Export */}
    </div>
  );
};
```

### 2. Summary Cards

```typescript
<div style={{
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: theme.spacing.lg,
  marginBottom: theme.spacing.xl
}}>
  <Card>
    <Card.Body style={{ textAlign: 'center' }}>
      <div style={{ fontSize: theme.typography.fontSize['2xl'], fontWeight: 'bold' }}>
        {analytics.totalTests}
      </div>
      <div style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.textSecondary }}>
        Total Tests
      </div>
    </Card.Body>
  </Card>
  {/* More cards */}
</div>
```

### 3. Simple Line Chart (CSS-based)

```typescript
const PassRateTrendChart: React.FC<{ data: Array<{ date: string; passRate: number }> }> = ({ data }) => {
  const maxValue = 100;
  const points = data.map((item, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - (item.passRate / maxValue) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg viewBox="0 0 100 100" style={{ width: '100%', height: '200px' }}>
      <polyline
        points={points}
        fill="none"
        stroke={theme.colors.primary}
        strokeWidth="2"
      />
      {data.map((item, index) => {
        const x = (index / (data.length - 1)) * 100;
        const y = 100 - (item.passRate / maxValue) * 100;
        return (
          <circle
            key={index}
            cx={x}
            cy={y}
            r="3"
            fill={theme.colors.primary}
          />
        );
      })}
    </svg>
  );
};
```

### 4. Category Performance Bars

```typescript
<div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
  {analytics.categoryPerformance.map(cat => (
    <div key={cat.category}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: theme.spacing.xs }}>
        <span>{cat.category}</span>
        <span>{cat.passRate}%</span>
      </div>
      <div style={{
        width: '100%',
        height: '20px',
        backgroundColor: theme.colors.backgroundSecondary,
        borderRadius: theme.borderRadius.sm,
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${cat.passRate}%`,
          height: '100%',
          backgroundColor: getColorForPassRate(cat.passRate),
          transition: 'width 0.3s ease'
        }} />
      </div>
    </div>
  ))}
</div>
```

### 5. Helper Functions

```typescript
const getColorForPassRate = (passRate: number): string => {
  if (passRate >= 90) return theme.colors.success;
  if (passRate >= 75) return theme.colors.primary;
  if (passRate >= 60) return theme.colors.warning;
  return theme.colors.danger;
};

const calculateTrend = (current: number, previous: number): string => {
  const diff = current - previous;
  if (diff > 0) return `↑ +${diff.toFixed(1)}%`;
  if (diff < 0) return `↓ ${diff.toFixed(1)}%`;
  return '→ 0%';
};

const formatCurrency = (amount: number): string => {
  return `$${amount.toFixed(2)}`;
};
```

---

## ✅ Acceptance Criteria Checklist

- [ ] Test history charts
  - [ ] Pass rate trend line chart
  - [ ] Visual timeline
  
- [ ] Score trends
  - [ ] Average score over time
  - [ ] Score distribution
  
- [ ] Pass rate over time
  - [ ] Line chart visualization
  - [ ] Trend indicators
  
- [ ] Cost analysis
  - [ ] Total cost display
  - [ ] Cost per test
  - [ ] Cost trends
  
- [ ] Component renders correctly
  - [ ] No TypeScript errors
  - [ ] Responsive design
  - [ ] Loading states

---

## 🧪 Testing Plan

### Manual Testing:
1. Load dashboard with no filters
2. Filter by specific agent
3. Change date range
4. Verify charts update
5. Export analytics data
6. Check responsive design

### Edge Cases:
- No test data available
- Single test run
- All tests failed
- All tests passed
- Very large datasets

---

## 📁 Files to Create

### New Files:
1. `local_version/agent-hub-ui/src/components/testing/AnalyticsDashboard.tsx`

### Modified Files:
1. `local_version/agent-hub-ui/src/components/testing/index.tsx` (export)

---

## 🎯 Success Metrics

- ✅ Display test history charts
- ✅ Show score trends
- ✅ Visualize pass rate over time
- ✅ Display cost analysis
- ✅ Show category breakdown
- ✅ Export analytics data
- ✅ No TypeScript errors
- ✅ Responsive design

---

**Ready to implement the final task!** 🚀

