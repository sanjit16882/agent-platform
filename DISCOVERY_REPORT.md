# Discovery Report - Testing Framework Enhancements

## 📊 Current State Analysis

### ✅ What EXISTS and WORKS

1. **Database Schema** ✅
   - `test_library` table exists with proper structure
   - Has `category` field with 10 predefined categories
   - Has `type` field (system, user, template)
   - Has `input_format` field (plain_text, json, multi_turn, parameterized)
   - Has `input_content` field for test inputs
   - **28 comprehensive tests** already seeded

2. **Test Categories** ✅ ALREADY IMPLEMENTED
   - Categories exist in database:
     - hallucination
     - functional
     - emotional
     - safety
     - rag_grounding
     - tool_usage
     - db_query
     - intent_detection
     - multi_turn
     - adversarial
   - Tests are already categorized!

3. **Test Selection UI** ✅ EXISTS
   - `StepSelectTest.tsx` component works
   - Has category filter dropdown
   - Has type filter dropdown
   - Select all/clear all buttons
   - Shows test count

4. **Test Input System** ✅ EXISTS
   - `StepProvideInput.tsx` handles inputs
   - `TestInputEditor.tsx` for editing
   - Tracks configuration progress
   - Stores inputs per test

5. **API Endpoints** ✅ EXIST
   - `GET /api/testing/library/list` - List tests
   - `POST /api/testing/library/create` - Create test
   - `PUT /api/testing/library/:id/update` - Update test
   - `DELETE /api/testing/library/:id` - Delete test

### ❌ What's MISSING

1. **Predefined Inputs per Agent** ❌
   - No agent-test-input mapping table
   - No default inputs for specific agents
   - Users must manually enter inputs for every test

2. **Categorized UI (Accordion/Collapsible)** ❌
   - Current UI has dropdown filter
   - NOT grouped/collapsible by category
   - Can't expand/collapse categories
   - Can't select all tests in a category

3. **Test Management UI** ❌
   - No dedicated test management page
   - Can't add/edit/delete tests from UI
   - No test templates UI

4. **Agent Analytics** ❌
   - No analytics table
   - No tracking of test runs per agent
   - No trend analysis
   - No best/worst run tracking

5. **Agent Names in Results** ❌
   - Results show agent IDs, not names
   - No agent details fetched with results

6. **Visual Charts** ❌
   - No chart components
   - No visualizations

---

## 🎯 What ACTUALLY Needs to Be Built

### Priority 1: Predefined Inputs (HIGH IMPACT)

**Problem**: Users don't know what inputs to provide for each agent type

**Solution**:
1. Create `agent_test_inputs` table
2. Seed with default inputs for common agents
3. Auto-load inputs in StepProvideInput
4. Allow override

**Files to Create/Modify**:
```
CREATE:
- migrations/create-agent-test-inputs.sql
- services/agentTestMappingService.js

MODIFY:
- StepProvideInput.tsx (add auto-load logic)
- DDTFWorkflow.tsx (pass agent to StepProvideInput)
```

**Example Data**:
```sql
-- Code Review Agent
INSERT INTO agent_test_inputs VALUES
('code-reviewer', 'test_functional_001', 'function calculateTotal(items) { return items.reduce((sum, item) => sum + item.price, 0); }', 'plain_text'),
('code-reviewer', 'test_safety_001', 'const password = "admin123"; // hardcoded password', 'plain_text');

-- API Tester Agent
INSERT INTO agent_test_inputs VALUES
('api-tester', 'test_functional_001', '{"endpoint": "/api/users", "method": "GET"}', 'json');
```

---

### Priority 2: Categorized UI with Accordion (MEDIUM IMPACT)

**Problem**: Current dropdown filter doesn't show category grouping clearly

**Solution**:
1. Create new component `StepSelectTestCategorized.tsx`
2. Group tests by category
3. Accordion/collapsible sections
4. Select all per category

**Files to Create/Modify**:
```
CREATE:
- StepSelectTestCategorized.tsx

MODIFY:
- DDTFWorkflow.tsx (use new component instead of StepSelectTest)
```

**UI Design**:
```
📁 Hallucination Tests (5) [Select All] [▼]
  ✓ Basic Fact Verification
  ✓ Data Interpretation
  □ Source Attribution
  ...

📁 Functional Tests (6) [Select All] [▼]
  □ Simple Calculation
  □ Text Summarization
  ...
```

---

### Priority 3: Agent Analytics (HIGH VALUE)

**Problem**: No way to track agent performance over time

**Solution**:
1. Create `agent_analytics` table
2. Update analytics on each test run
3. Create analytics dashboard component
4. Add charts

**Files to Create/Modify**:
```
CREATE:
- migrations/create-agent-analytics.sql
- services/agentAnalyticsService.js
- routes/analyticsRoutes.js
- components/testing/AgentAnalyticsDashboard.tsx
- components/testing/charts/ScoreTrendChart.tsx
- components/testing/charts/CategoryPerformanceChart.tsx

MODIFY:
- StepExecute.tsx (track analytics after execution)
- AgentTestingMain.tsx (add analytics route)
```

---

### Priority 4: Test Management UI (POWER USER)

**Problem**: Can't manage tests from UI

**Solution**:
1. Create test management page
2. Add/edit/delete modals
3. Test templates

**Files to Create/Modify**:
```
CREATE:
- components/testing/TestManagementPage.tsx
- components/testing/TestEditorModal.tsx
- components/testing/TestTemplateSelector.tsx

MODIFY:
- AgentTestingMain.tsx (add test management route)
```

---

### Priority 5: Agent Names Display (POLISH)

**Problem**: Shows agent IDs instead of names

**Solution**:
1. Fetch agent details with test runs
2. Display agent name everywhere
3. Format: "Agent Name (id)"

**Files to Modify**:
```
MODIFY:
- StepResults.tsx
- TestResultsViewer.tsx
- AnalyticsDashboard.tsx
- VersionComparison.tsx
```

---

## 📋 DETAILED IMPLEMENTATION PLAN

### Phase 1: Predefined Inputs (2-3 hours)

#### Step 1.1: Database Migration (30 min)
```sql
CREATE TABLE agent_test_inputs (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  test_id TEXT NOT NULL,
  input_content TEXT NOT NULL,
  input_format TEXT DEFAULT 'plain_text',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(agent_id, test_id)
);

-- Seed data for Code Review Agent
INSERT INTO agent_test_inputs (id, agent_id, test_id, input_content, input_format) VALUES
('ati_001', 'code-reviewer', 'test_functional_001', 
 'function add(a, b) { return a + b; }', 'plain_text'),
('ati_002', 'code-reviewer', 'test_safety_001', 
 'const apiKey = "sk-1234567890"; // exposed API key', 'plain_text'),
('ati_003', 'code-reviewer', 'test_hallucination_001',
 'function calculateDiscount(price) { return price * 0.1; }', 'plain_text');
```

#### Step 1.2: Backend Service (45 min)
Create `agentTestMappingService.js`:
```javascript
class AgentTestMappingService {
  async getInputsForAgent(agentId, testIds) {
    // Query agent_test_inputs table
    // Return map of testId -> input
  }
  
  async saveInputForAgent(agentId, testId, input) {
    // Insert or update
  }
}
```

#### Step 1.3: API Endpoint (15 min)
Add to `testingRoutes.js`:
```javascript
GET /api/testing/agent-inputs/:agentId?testIds=test1,test2
```

#### Step 1.4: Frontend Integration (1 hour)
Update `StepProvideInput.tsx`:
```typescript
useEffect(() => {
  if (selectedAgent && selectedTests.length > 0) {
    loadPredefinedInputs();
  }
}, [selectedAgent, selectedTests]);

const loadPredefinedInputs = async () => {
  const testIds = selectedTests.map(t => t.id).join(',');
  const response = await fetch(
    `${API_BASE_URL}/api/testing/agent-inputs/${selectedAgent.id}?testIds=${testIds}`
  );
  const data = await response.json();
  
  // Auto-populate inputs
  const autoInputs = {};
  data.inputs.forEach(input => {
    autoInputs[input.test_id] = {
      content: input.input_content,
      format: input.input_format,
      isPredefined: true
    };
  });
  
  onUpdateInputs(autoInputs);
};
```

**RISKS**:
- Need to pass `selectedAgent` to StepProvideInput (currently not passed)
- Need to update DDTFWorkflow to pass agent prop

---

### Phase 2: Categorized UI (1.5 hours)

#### Step 2.1: Create Component (1 hour)
New file: `StepSelectTestCategorized.tsx`
```typescript
// Group tests by category
const testsByCategory = tests.reduce((acc, test) => {
  if (!acc[test.category]) acc[test.category] = [];
  acc[test.category].push(test);
  return acc;
}, {});

// Render accordion
{Object.entries(testsByCategory).map(([category, tests]) => (
  <Accordion key={category}>
    <AccordionHeader>
      {category} ({tests.length})
      <Button onClick={() => selectAllInCategory(category)}>
        Select All
      </Button>
    </AccordionHeader>
    <AccordionBody>
      {tests.map(test => <TestCard test={test} />)}
    </AccordionBody>
  </Accordion>
))}
```

#### Step 2.2: Integration (30 min)
Update `DDTFWorkflow.tsx`:
```typescript
import StepSelectTestCategorized from './StepSelectTestCategorized';

// Replace StepSelectTest with StepSelectTestCategorized
case 2:
  return <StepSelectTestCategorized ... />;
```

**RISKS**:
- Need accordion component (might need to create one)
- Styling needs to match theme

---

### Phase 3: Agent Analytics (3 hours)

#### Step 3.1: Database (30 min)
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
  last_run_date DATETIME,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### Step 3.2: Service & API (1 hour)
Create `agentAnalyticsService.js` and endpoints

#### Step 3.3: Dashboard Component (1.5 hours)
Create `AgentAnalyticsDashboard.tsx` with charts

**RISKS**:
- Recharts library might need configuration
- Chart data transformation complexity

---

## ⚠️ RISKS & UNKNOWNS

1. **Agent ID Format** ❓
   - Don't know exact format of agent IDs
   - Need to verify how agents are stored

2. **Accordion Component** ❓
   - Don't see existing accordion in codebase
   - Might need to build from scratch

3. **Chart Library** ❓
   - Recharts is mentioned but need to verify it's installed
   - Need to check if it works with current setup

4. **Data Volume** ❓
   - Don't know how many agents exist
   - Don't know how many test runs exist
   - Analytics queries might be slow

5. **Agent-Test Relationship** ❓
   - Don't know if agents have "types" or "categories"
   - Might need different inputs per agent instance, not just agent type

---

## ✅ RECOMMENDED APPROACH

### Start with Phase 1: Predefined Inputs

**Why**:
- Solves your immediate question
- Highest user impact
- Relatively low risk
- Clear requirements

**Steps**:
1. Create database migration (I'll show you SQL)
2. You review and approve
3. Run migration
4. Create backend service
5. Add API endpoint
6. Update frontend component
7. Test with one agent
8. Fix issues
9. Seed data for all agents

**Time Estimate**: 2-3 hours (realistic, including testing)

**Success Criteria**:
- ✅ When user selects Code Review Agent + tests, inputs auto-load
- ✅ User can override if needed
- ✅ Inputs are appropriate for code review

---

## 🎯 NEXT STEP

**I recommend we start with Phase 1.1: Database Migration**

I'll create the SQL file with:
1. Table creation
2. Sample data for Code Review Agent
3. Sample data for 2-3 other common agents

**Should I proceed with creating the migration SQL?**

After you review and approve, I'll:
1. Create the backend service
2. Add API endpoint
3. Update frontend
4. Test it works

One step at a time, with your approval at each stage.

**Ready to proceed?**
