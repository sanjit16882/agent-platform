# Testing Framework Enhancements - Implementation Plan

## Overview
Comprehensive enhancements to make the AI Agent Testing Framework production-ready with better UX, agent-specific testing, and analytics.

## Requirements

### 1. Predefined Inputs for Every Agent ✅
**Goal**: Auto-load appropriate test inputs based on selected agent

**Implementation**:
- Create agent-test mapping in database
- Store predefined inputs per agent type
- Auto-populate inputs in Step 4 (Provide Input)
- Allow override if needed

**Database Schema**:
```sql
CREATE TABLE agent_test_inputs (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  test_id TEXT NOT NULL,
  input_content TEXT NOT NULL,
  input_format TEXT DEFAULT 'plain_text',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (test_id) REFERENCES test_library(id)
);
```

**Example Mappings**:
- Code Review Agent → Code samples with issues
- Security Scanner → Code with vulnerabilities
- API Tester → API endpoint definitions
- Data Validator → Sample datasets

---

### 2. Categorized Test Groups ✅
**Goal**: Organize tests by category with expand/collapse UI

**Categories**:
1. **Hallucination Tests** - Factual accuracy, source verification
2. **Functional Tests** - Core functionality, edge cases
3. **Safety Tests** - Harmful content, bias detection
4. **Reasoning Tests** - Logic, problem-solving
5. **Context Retention** - Multi-turn conversations
6. **Tool Usage** - Tool selection, parameter passing
7. **RAG Evaluation** - Retrieval accuracy, context usage
8. **Intent Detection** - User intent understanding
9. **Adversarial Tests** - Prompt injection, jailbreak

**UI Features**:
- Accordion/collapsible sections per category
- Select all/none per category
- Show test count per category
- Filter by category
- Visual badges for category

**Component**: `StepSelectTestCategorized.tsx`

---

### 3. Add & Define New Tests ✅
**Goal**: Allow users to create, edit, and delete tests

**Features**:
- **Add Test**: Modal/form with fields:
  - Test name
  - Description
  - Category (dropdown)
  - Input content
  - Input format (plain_text, json, code)
  - Expected behavior
  - Scoring rules
  - Tags
- **Edit Test**: Same form, pre-populated
- **Delete Test**: Confirmation dialog
- **Test Templates**: Quick start templates per category

**UI Components**:
- `TestManagementPage.tsx` - Main test library page
- `TestEditorModal.tsx` - Add/edit modal
- `TestTemplateSelector.tsx` - Template picker

**API Endpoints**:
```
POST   /api/testing/library/create
PUT    /api/testing/library/:id/update
DELETE /api/testing/library/:id
GET    /api/testing/library/templates
```

---

### 4. Analytics & Metrics (Per Agent) ✅
**Goal**: Comprehensive analytics dashboard per agent

**Metrics to Track**:
1. **Total Test Runs** - Count of all executions
2. **Average Score** - Mean score across all runs
3. **Highest Score** - Best performance + details
4. **Lowest Score** - Worst performance + details
5. **Trend Line** - Score over time
6. **Pass Rate** - Percentage of passed tests
7. **Category Performance** - Scores by test category
8. **Model Performance** - If multi-model testing used
9. **Cost Analysis** - Total cost, cost per test
10. **Recent Activity** - Last 10 runs

**Database Schema**:
```sql
CREATE TABLE agent_analytics (
  agent_id TEXT PRIMARY KEY,
  total_runs INTEGER DEFAULT 0,
  average_score REAL DEFAULT 0,
  highest_score REAL DEFAULT 0,
  highest_run_id TEXT,
  lowest_score REAL DEFAULT 0,
  lowest_run_id TEXT,
  total_tests_executed INTEGER DEFAULT 0,
  total_cost REAL DEFAULT 0,
  last_run_date DATETIME,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**UI Component**: `AgentAnalyticsDashboard.tsx`

**Features**:
- Summary cards (total runs, avg score, etc.)
- Line chart: Score trend over time
- Bar chart: Performance by category
- Table: Recent test runs
- Comparison: Best vs worst run
- Export: CSV/JSON download

---

### 5. Show Results by Agent ✅
**Goal**: Display agent name instead of ID everywhere

**Changes Needed**:
1. **Test Results Page**: Show agent name in header
2. **Analytics Page**: Group by agent name
3. **Comparison Page**: Show agent names
4. **Results List**: Display agent name + description

**Implementation**:
- Fetch agent details when loading results
- Cache agent info to avoid repeated API calls
- Display format: "Agent Name (agent-id)"
- Add agent avatar/icon if available

**API Enhancement**:
```javascript
// Include agent details in test run response
{
  run_id: "uuid",
  agent: {
    id: "code-reviewer",
    name: "Code Review Agent",
    description: "Reviews code for quality...",
    model: "claude-3-5-sonnet"
  },
  results: [...]
}
```

---

### 6. Visual Charts ✅
**Goal**: Modern, clean visualizations using Recharts

**Chart Types**:

1. **Bar Chart** - Scores by Category
   - X-axis: Test categories
   - Y-axis: Average score
   - Color: Green (>80), Yellow (60-80), Red (<60)

2. **Line Chart** - Score Trend Over Time
   - X-axis: Test run date
   - Y-axis: Overall score
   - Multiple lines if comparing models
   - Trend line overlay

3. **Pie Chart** - Pass/Fail Distribution
   - Passed tests (green)
   - Failed tests (red)
   - Warnings (yellow)

4. **Stacked Bar Chart** - Category Performance
   - X-axis: Test runs
   - Y-axis: Score
   - Stacked by category

5. **Radar Chart** - Multi-dimensional Performance
   - Axes: Different test categories
   - Shows strengths/weaknesses

6. **Heatmap** (Optional) - Model vs Category Performance
   - Rows: Models
   - Columns: Categories
   - Color intensity: Score

**Library**: Recharts (already used in project)

**Theme Integration**:
- Use Agent Hub color palette
- Consistent spacing and typography
- Responsive design
- Tooltips with detailed info
- Legend with clear labels

---

## Implementation Order

### Phase 1: Foundation (Week 1)
1. ✅ Database schema updates
2. ✅ Test categorization system
3. ✅ Agent-test input mappings
4. ✅ API endpoints for test management

### Phase 2: UI Components (Week 2)
1. ✅ Categorized test selection UI
2. ✅ Test management page
3. ✅ Test editor modal
4. ✅ Predefined input auto-loading

### Phase 3: Analytics (Week 3)
1. ✅ Agent analytics data collection
2. ✅ Analytics dashboard UI
3. ✅ Chart components
4. ✅ Export functionality

### Phase 4: Polish (Week 4)
1. ✅ Agent name display everywhere
2. ✅ Visual improvements
3. ✅ Performance optimization
4. ✅ Documentation

---

## File Structure

```
local_version/agent-hub-backend/
├── migrations/
│   ├── add-agent-test-inputs.sql
│   ├── add-agent-analytics.sql
│   └── add-test-categories.sql
├── services/
│   ├── testLibraryService.js (enhanced)
│   ├── agentAnalyticsService.js (new)
│   └── agentTestMappingService.js (new)
└── routes/
    ├── testingRoutes.js (enhanced)
    └── analyticsRoutes.js (new)

local_version/agent-hub-ui/src/components/
├── testing/
│   ├── StepSelectTestCategorized.tsx (new)
│   ├── TestManagementPage.tsx (new)
│   ├── TestEditorModal.tsx (new)
│   ├── AgentAnalyticsDashboard.tsx (new)
│   ├── charts/
│   │   ├── ScoreTrendChart.tsx (new)
│   │   ├── CategoryPerformanceChart.tsx (new)
│   │   ├── PassFailPieChart.tsx (new)
│   │   └── RadarPerformanceChart.tsx (new)
│   └── StepProvideInput.tsx (enhanced)
```

---

## Success Criteria

### Predefined Inputs
- ✅ Inputs auto-load for each agent
- ✅ Users can override if needed
- ✅ Inputs are agent-appropriate

### Test Categories
- ✅ All tests are categorized
- ✅ UI shows expandable categories
- ✅ Can select by category
- ✅ Visual badges for categories

### Test Management
- ✅ Can add new tests
- ✅ Can edit existing tests
- ✅ Can delete tests
- ✅ Templates available

### Analytics
- ✅ Shows all required metrics
- ✅ Charts are clear and accurate
- ✅ Trend analysis works
- ✅ Can export data

### Agent Names
- ✅ Agent names shown everywhere
- ✅ No raw IDs visible
- ✅ Consistent formatting

### Visual Charts
- ✅ All chart types implemented
- ✅ Follows design system
- ✅ Responsive
- ✅ Interactive tooltips

---

## Next Steps

1. Start with database migrations
2. Implement backend services
3. Build UI components
4. Add charts and visualizations
5. Test and refine
6. Document for users

Ready to begin implementation! 🚀
