# Task 3.1: Agent Catalog Sync - Implementation Plan

**Status:** In Progress  
**Estimated Time:** 1 hour  
**Started:** 2024-11-21

---

## 📋 Task Overview

Integrate the testing framework with the Agent Catalog to:
1. Auto-update agent status after test execution
2. Display "Tested" badge on agent cards
3. Show last test score and pass rate
4. Link to test history from agent cards
5. Refresh catalog when tests complete

---

## 🔍 Current State Analysis

### What's Already Implemented ✅

1. **AgentCatalog.tsx** already has:
   - `enrichAgentsWithTestingData()` function that fetches test runs
   - `testingStatus` field in Agent interface
   - Event listener for 'test-results-updated' event
   - Auto-refresh when test results update

2. **Agent Interface** includes:
   ```typescript
   testingStatus?: {
     lastTestRun: string;
     passRate: number;
     totalTests: number;
     universalTests: {
       total: number;
       passed: number;
       passRate: number;
     };
     quality: 'excellent' | 'good' | 'fair' | 'poor' | 'not-tested';
   }
   ```

3. **Backend API** has:
   - `/api/testing/runs` endpoint to fetch all test runs
   - Test execution service that saves results

### What's Missing ❌

1. **Visual Display** - Agent cards don't show testing status
2. **Badge Component** - No "Tested" badge on cards
3. **Test History Link** - No way to navigate to test history
4. **Quality Indicator** - No visual quality indicator
5. **Event Emission** - Test execution doesn't emit 'test-results-updated' event

---

## 🎯 Implementation Steps

### Step 1: Update AgentCard Component (30 min)

**File:** `local_version/agent-hub-ui/src/components/common/AgentCard.tsx`

**Changes:**
1. Add testing status display section
2. Add "Tested" badge when agent has test results
3. Add quality indicator (color-coded)
4. Add pass rate display
5. Add "View Test History" button
6. Add last test date display

**UI Design:**
```
┌─────────────────────────────────────┐
│ Agent Name              [Tested ✓]  │
│ Category                Quality: ⭐  │
│                                      │
│ Description...                       │
│                                      │
│ ┌──────────────────────────────────┐│
│ │ 📊 Test Results                  ││
│ │ Pass Rate: 85% (17/20 tests)     ││
│ │ Last Tested: 2 hours ago         ││
│ │ [View Test History →]            ││
│ └──────────────────────────────────┘│
│                                      │
│ [Edit] [Toggle] [Delete]            │
└─────────────────────────────────────┘
```

### Step 2: Emit Event After Test Execution (10 min)

**File:** `local_version/agent-hub-ui/src/components/testing/StepExecute.tsx`

**Changes:**
1. After test execution completes, emit custom event:
```typescript
// Emit event to refresh Agent Catalog
window.dispatchEvent(new CustomEvent('test-results-updated', {
  detail: { runId, agentIds, results }
}));
```

### Step 3: Add Test History Navigation (10 min)

**File:** `local_version/agent-hub-ui/src/components/common/AgentCard.tsx`

**Changes:**
1. Add "View Test History" button
2. Navigate to testing page with agent filter:
```typescript
const handleViewTestHistory = () => {
  navigate(`/testing/history?agentId=${agent.agent_id}`);
};
```

### Step 4: Create Testing Badge Component (10 min)

**File:** `local_version/agent-hub-ui/src/components/common/TestingBadge.tsx` (NEW)

**Purpose:** Reusable badge component for testing status

**Features:**
- Shows "Tested" with checkmark
- Color-coded by quality (excellent=green, good=blue, fair=orange, poor=red)
- Shows pass rate on hover
- Optional compact mode

---

## 📝 Detailed Implementation

### 1. TestingBadge Component

```typescript
import React from 'react';
import Badge from './Badge';
import { theme } from '../../styles/theme';

interface TestingBadgeProps {
  quality: 'excellent' | 'good' | 'fair' | 'poor' | 'not-tested';
  passRate?: number;
  compact?: boolean;
}

const TestingBadge: React.FC<TestingBadgeProps> = ({ 
  quality, 
  passRate, 
  compact = false 
}) => {
  if (quality === 'not-tested') {
    return null; // Don't show badge if not tested
  }

  const getVariant = () => {
    switch (quality) {
      case 'excellent': return 'success';
      case 'good': return 'primary';
      case 'fair': return 'warning';
      case 'poor': return 'danger';
      default: return 'secondary';
    }
  };

  const getIcon = () => {
    switch (quality) {
      case 'excellent': return '⭐';
      case 'good': return '✓';
      case 'fair': return '⚠';
      case 'poor': return '✗';
      default: return '?';
    }
  };

  return (
    <Badge 
      variant={getVariant()}
      title={passRate ? `Pass Rate: ${passRate}%` : undefined}
    >
      {getIcon()} {compact ? '' : 'Tested'}
    </Badge>
  );
};

export default TestingBadge;
```

### 2. Update AgentCard Component

Add testing status section after description:

```typescript
{/* Testing Status Section */}
{agent.testingStatus && agent.testingStatus.quality !== 'not-tested' && (
  <div style={{
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.md,
    border: `1px solid ${theme.colors.border}`
  }}>
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.sm
    }}>
      <div style={{
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.semibold,
        color: theme.colors.textPrimary
      }}>
        📊 Test Results
      </div>
      <TestingBadge 
        quality={agent.testingStatus.quality}
        passRate={agent.testingStatus.passRate}
      />
    </div>
    
    <div style={{
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xs
    }}>
      Pass Rate: {agent.testingStatus.passRate}% 
      ({agent.testingStatus.universalTests.passed}/{agent.testingStatus.universalTests.total} tests)
    </div>
    
    <div style={{
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors.textMuted,
      marginBottom: theme.spacing.sm
    }}>
      Last Tested: {formatRelativeTime(agent.testingStatus.lastTestRun)}
    </div>
    
    <Button
      variant="outline-primary"
      size="sm"
      onClick={() => navigate(`/testing/history?agentId=${agent.agent_id}`)}
      style={{ width: '100%' }}
    >
      View Test History →
    </Button>
  </div>
)}
```

### 3. Update StepExecute Component

After test execution completes:

```typescript
// After saving results and generating insights
console.log('✅ Test execution complete');

// Emit event to refresh Agent Catalog
window.dispatchEvent(new CustomEvent('test-results-updated', {
  detail: {
    runId: testRun.id,
    agentIds: [selectedAgent.agent_id],
    results: testResults,
    timestamp: new Date().toISOString()
  }
}));

console.log('🔔 Emitted test-results-updated event');
```

### 4. Helper Function for Relative Time

Add to AgentCard or utils:

```typescript
const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
};
```

---

## ✅ Acceptance Criteria Checklist

- [ ] Auto-update agent status after test
  - [ ] Event emitted from StepExecute
  - [ ] AgentCatalog listens and refreshes
  
- [ ] Display "Tested" badge
  - [ ] TestingBadge component created
  - [ ] Badge shows on agent cards with test results
  - [ ] Color-coded by quality
  
- [ ] Show last test score
  - [ ] Pass rate displayed
  - [ ] Test count displayed (passed/total)
  - [ ] Quality indicator shown
  
- [ ] Link to test history
  - [ ] "View Test History" button added
  - [ ] Navigation to testing page with agent filter
  
- [ ] Integration works end-to-end
  - [ ] Run test → see badge appear
  - [ ] Click history → see test results
  - [ ] Refresh catalog → data persists

---

## 🧪 Testing Plan

### Manual Testing Steps:

1. **Test Badge Display:**
   - Open Agent Catalog
   - Find agent with test results
   - Verify badge appears with correct color
   - Hover over badge to see pass rate

2. **Test Execution Integration:**
   - Run DDTF workflow for an agent
   - Complete test execution
   - Return to Agent Catalog
   - Verify agent card shows updated test results

3. **Test History Navigation:**
   - Click "View Test History" on agent card
   - Verify navigation to testing page
   - Verify agent filter is applied
   - Verify test results are displayed

4. **Quality Indicators:**
   - Test with different pass rates:
     - 95% → Excellent (green)
     - 80% → Good (blue)
     - 65% → Fair (orange)
     - 40% → Poor (red)

---

## 📁 Files to Create/Modify

### New Files:
1. `local_version/agent-hub-ui/src/components/common/TestingBadge.tsx`

### Modified Files:
1. `local_version/agent-hub-ui/src/components/common/AgentCard.tsx`
2. `local_version/agent-hub-ui/src/components/testing/StepExecute.tsx`
3. `local_version/agent-hub-ui/src/components/testing/index.tsx` (export TestingBadge)

---

## 🎯 Success Metrics

- ✅ Agents with test results show "Tested" badge
- ✅ Pass rate and test count visible on cards
- ✅ Quality indicator color-coded correctly
- ✅ Test history accessible from agent cards
- ✅ Catalog auto-refreshes after test execution
- ✅ No TypeScript errors
- ✅ Responsive design maintained

---

## 🚀 Next Steps After Completion

1. Update PROGRESS_TRACKER.md
2. Update SESSION_TRACKER.md
3. Create TASK_3.1_COMPLETE_SUMMARY.md
4. Move to Task 3.2: Version Comparison

---

**Ready to implement!** 🎉

