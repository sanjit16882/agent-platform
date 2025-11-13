# Task 11: Agent Management UI Updates - Test Plan

## Overview
This document outlines the testing steps to verify that Task 11 (Agent Management UI Updates) has been successfully completed.

## Prerequisites
- Frontend running on http://localhost:3001
- Backend running on http://localhost:5001
- At least one agent created with different configurations (Vector DB enabled, MCP enabled, both, or neither)

## Test Cases

### Test Case 11.1: AgentCard Component Display

**Objective**: Verify that AgentCard displays execution mode badge, Vector DB status, MCP status, and estimated cost.

**Steps**:
1. Navigate to the Agent Management page (http://localhost:3001/agents or similar)
2. Locate an agent card

**Expected Results**:
- ✅ Agent card displays execution mode badge with appropriate icon and label:
  - 🤖 LLM Only (for bedrock-only)
  - 📚 RAG (for rag mode)
  - 🔧 MCP (for mcp mode)
  - ⚡ Full Stack (for full-stack mode)
- ✅ If Vector DB is enabled, displays "📊 Vector DB (X)" badge showing number of knowledge bases
- ✅ If MCP is enabled, displays MCP indicator badge
- ✅ Metrics section shows:
  - Executions count
  - Rating
  - Cost per 1K queries (or status if cost not available)

**Test Variations**:
- Test with agent that has Vector DB only
- Test with agent that has MCP only
- Test with agent that has both Vector DB and MCP
- Test with agent that has neither (bedrock-only)

---

### Test Case 11.2: AgentDetailsModal Component Display

**Objective**: Verify that AgentDetailsModal displays execution mode section, Vector DB configuration, and cost/latency estimates.

**Steps**:
1. Navigate to the Agent Management page
2. Click "Details" button on an agent card
3. Review the "Overview" tab in the modal

**Expected Results**:
- ✅ Modal opens successfully
- ✅ "Agent Information" section displays basic agent details
- ✅ "Execution Configuration" section is visible (if agent has execution mode configured)
- ✅ Execution mode is displayed with descriptive label and icon
- ✅ If Vector DB is enabled:
  - Shows "Vector DB: Enabled"
  - Displays provider name
  - Shows number of knowledge bases configured
- ✅ Cost and latency estimates section displays:
  - Estimated cost per 1K queries (formatted as $X.XX/1K queries)
  - Estimated average latency (formatted as Xms avg)

**Test Variations**:
- Test with agent that has Vector DB enabled
- Test with agent that has MCP enabled
- Test with agent that has both
- Test with agent that has neither

---

### Test Case 11.3: EditAgentModal Preservation

**Objective**: Verify that EditAgentModal functionality is unchanged and MCP dropdown works correctly.

**Steps**:
1. Navigate to the Agent Management page
2. Click "Configure" or "Edit" button on an agent card
3. Review the Edit Agent Modal

**Expected Results**:
- ✅ Modal opens successfully
- ✅ Agent name field is populated correctly
- ✅ Description field is populated correctly
- ✅ MCP Server dropdown is present and functional:
  - Shows "None - No MCP integration" as first option
  - Lists available MCP servers with name and description
  - If agent has MCP association, correct server is pre-selected
- ✅ Model selector is present and functional:
  - Shows available Bedrock models
  - If agent has model configured, correct model is pre-selected
  - Model selection is independent (not disabled when MCP is selected)
- ✅ Save button works correctly
- ✅ Changes are persisted after saving

**Test Variations**:
- Test editing an agent with MCP association
- Test editing an agent without MCP association
- Test changing MCP server selection
- Test removing MCP association (select "None")

---

### Test Case 11.4: Integration Testing

**Objective**: Verify that all components work together correctly and existing functionality is preserved.

**Steps**:
1. Create a new agent with Vector DB enabled
2. View the agent card and verify badges display correctly
3. Open agent details modal and verify execution configuration displays
4. Edit the agent and add MCP integration
5. Verify agent card now shows both Vector DB and MCP badges
6. Verify agent details modal shows full-stack execution mode

**Expected Results**:
- ✅ Agent creation works correctly
- ✅ Agent card updates immediately after changes
- ✅ Agent details modal reflects current configuration
- ✅ Edit modal preserves all settings
- ✅ No console errors or warnings
- ✅ No visual glitches or layout issues

---

## Regression Testing

### Existing MCP Functionality
**Objective**: Verify that existing MCP functionality is not broken.

**Steps**:
1. Navigate to MCP Management page
2. Verify MCP servers are listed correctly
3. Create an agent with MCP integration using the Hybrid Agent Builder
4. Execute the agent and verify MCP tools are invoked correctly
5. Edit the agent using EditAgentModal and verify MCP dropdown works

**Expected Results**:
- ✅ MCP Management page works as before
- ✅ Hybrid Agent Builder MCP tab is unchanged
- ✅ MCP tool invocation works correctly
- ✅ EditAgentModal MCP dropdown functions correctly
- ✅ No breaking changes to existing MCP code

---

## Test Results

### Test Execution Date: [To be filled by tester]

| Test Case | Status | Notes |
|-----------|--------|-------|
| 11.1: AgentCard Display | ⏳ Pending | |
| 11.2: AgentDetailsModal Display | ⏳ Pending | |
| 11.3: EditAgentModal Preservation | ⏳ Pending | |
| 11.4: Integration Testing | ⏳ Pending | |
| Regression: MCP Functionality | ⏳ Pending | |

### Issues Found
[To be filled by tester]

### Sign-off
- [ ] All test cases passed
- [ ] No critical issues found
- [ ] Ready for production deployment

---

## Notes

### Code Quality
- ✅ No TypeScript errors in AgentCard.tsx
- ✅ No TypeScript errors in AgentDetailsModal.tsx
- ✅ No TypeScript errors in EditAgentModal.tsx
- ✅ All components follow existing code patterns
- ✅ No modifications to existing MCP code

### Implementation Details
- AgentCard component: Lines 95-125 implement new badges
- AgentDetailsModal component: Lines 250-295 implement execution configuration display
- EditAgentModal component: Unchanged, preserves existing MCP functionality

### Requirements Mapping
- Task 11.1 → Requirements 5.5, 6.4
- Task 11.2 → Requirements 5.5, 6.4
- Task 11.3 → Requirements 10.2, 10.3, 13.1, 13.2, 13.9
- Task 11.4 → Requirements 14.6, 15.1, 15.6
