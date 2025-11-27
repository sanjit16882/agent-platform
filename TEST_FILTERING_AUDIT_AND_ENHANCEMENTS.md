# Test Filtering - Current Implementation Audit & Enhancements

## ✅ What's Already Implemented

### 1. Intelligent Agent Type Detection
```javascript
getAgentType(agent) {
  // Checks agent.type, agent.category, agent.name
  // Returns: monitoring, code-review, security-scan, api-tester, 
  //          data-validator, customer-service, analytics, automation, general
}
```

**Status**: ✅ **Working well** - Automatically detects agent type

### 2. Priority-Based Test Mapping
```javascript
agentTestMapping = {
  'monitoring': {
    'monitoring': 10,      // Highest priority
    'tool_usage': 9,
    'hallucination': 8,
    // ... more categories
  },
  'code-review': { ... },
  'general': { ... }
}
```

**Status**: ✅ **Working well** - Each agent type has prioritized test categories

### 3. Intelligent Filtering
```javascript
// Scores tests by relevance
// Sorts by score (highest first)
// Takes top 25 tests
```

**Status**: ✅ **Working** - Filters tests based on agent type

### 4. UI Feedback
```
"🎯 Top 25 Recommended Tests for [Agent Name]"
"These tests are intelligently selected based on your agent's type..."
```

**Status**: ✅ **Good** - Clear messaging

---

## ❌ What's Missing (Based on Requirements)

### 1. Core Default Tests
**Requirement**: "Every agent should include a core set of default tests (e.g., hallucination, emotion detection, intent detection)"

**Current State**: ❌ **Not explicitly defined**
- Tests are filtered by priority, but no guaranteed "core" set
- Some agent types might not get hallucination tests if priority is low

**Issue**: If an agent type doesn't have a category in the priority map, those tests won't appear

### 2. Clear Messaging for Limited Tests
**Requirement**: "Display a clear message and allow the user to proceed with adding custom tests"

**Current State**: ⚠️ **Partially implemented**
- Shows "Top X Recommended Tests"
- But doesn't explain WHY some tests are missing
- No clear call-to-action for custom tests

### 3. Automatic Support for New Agents
**Requirement**: "Automatically supports newly added agents, so appropriate agent-specific tests are surfaced without manual configuration"

**Current State**: ⚠️ **Partially working**
- Falls back to 'general' type if no match
- But 'general' mapping might not be optimal for all new agents

---

## 🔧 Required Enhancements

### Enhancement 1: Define Core Default Tests

**Add a CORE_TESTS constant that ALWAYS appears**:

```javascript
const CORE_TESTS = [
  'hallucination',      // MUST test for accuracy
  'intent_detection',   // MUST understand user intent
  'emotional',          // MUST handle emotions appropriately
  'safety'              // MUST be safe
];
```

**Logic**:
```javascript
// 1. Always include core tests (priority 10)
// 2. Add agent-specific tests (priority 1-9)
// 3. Sort by priority
```

### Enhancement 2: Improved Messaging

**Add clear sections**:

```
┌─────────────────────────────────────────────────────────┐
│ ✅ Core Tests (Always Included)                         │
│ • Hallucination Detection                               │
│ • Intent Detection                                      │
│ • Emotional Handling                                    │
│ • Safety Checks                                         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 🎯 Agent-Specific Tests (Recommended for Monitoring)    │
│ • Monitoring-specific tests                             │
│ • Tool Usage tests                                      │
│ • RAG Grounding tests                                   │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ ℹ️ Don't see the tests you need?                        │
│ You can add custom tests in the next step!              │
│ [Continue to Custom Tests →]                            │
└─────────────────────────────────────────────────────────┘
```

### Enhancement 3: Smarter Fallback for New Agents

**Improve the 'general' fallback**:

```javascript
// Instead of just 'general', analyze agent properties
function getSmartFallback(agent) {
  const coreTests = CORE_TESTS; // Always include
  
  // Analyze agent properties to add relevant tests
  const additionalTests = [];
  
  if (agent.tools || agent.capabilities?.includes('tool_use')) {
    additionalTests.push('tool_usage');
  }
  
  if (agent.knowledgeBase || agent.rag_enabled) {
    additionalTests.push('rag_grounding');
  }
  
  if (agent.multimodal) {
    additionalTests.push('multimodal');
  }
  
  return [...coreTests, ...additionalTests];
}
```

---

## 📋 Implementation Plan

### Phase 1: Add Core Tests (High Priority)

**File**: `StepSelectTest.tsx`

**Changes**:
1. Define `CORE_TESTS` constant
2. Update `filterTestsForAgent()` to always include core tests
3. Separate core tests from agent-specific tests in UI

**Code**:
```typescript
const CORE_TESTS = {
  'hallucination': { priority: 10, reason: 'Essential for accuracy' },
  'intent_detection': { priority: 10, reason: 'Essential for understanding' },
  'emotional': { priority: 10, reason: 'Essential for appropriate responses' },
  'safety': { priority: 10, reason: 'Essential for safe operation' }
};

const filterTestsForAgent = () => {
  const agentType = getAgentType(selectedAgent);
  const priorityMap = agentTestMapping[agentType] || agentTestMapping['general'];
  
  // 1. Get core tests (always included)
  const coreTests = tests.filter(test => 
    Object.keys(CORE_TESTS).includes(test.category)
  ).map(test => ({
    ...test,
    relevanceScore: CORE_TESTS[test.category].priority,
    isCore: true,
    reason: CORE_TESTS[test.category].reason
  }));
  
  // 2. Get agent-specific tests
  const agentSpecificTests = tests
    .filter(test => !Object.keys(CORE_TESTS).includes(test.category))
    .map(test => ({
      ...test,
      relevanceScore: priorityMap[test.category] || 0,
      isCore: false
    }))
    .filter(test => test.relevanceScore > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 15); // Top 15 agent-specific
  
  // 3. Combine: core + agent-specific
  const filtered = [...coreTests, ...agentSpecificTests];
  
  setRecommendedTests(filtered);
  setCoreTestCount(coreTests.length);
  setAgentSpecificCount(agentSpecificTests.length);
};
```

### Phase 2: Improve UI Messaging (Medium Priority)

**Add sections to UI**:

```typescript
<Card>
  <Card.Header>
    <Card.Title>✅ Core Tests (Always Included)</Card.Title>
    <Card.Text>
      These essential tests are included for all agents
    </Card.Text>
  </Card.Header>
  <Card.Body>
    {recommendedTests.filter(t => t.isCore).map(test => (
      <TestCard test={test} badge="CORE" />
    ))}
  </Card.Body>
</Card>

<Card>
  <Card.Header>
    <Card.Title>🎯 Recommended for {agentType}</Card.Title>
    <Card.Text>
      Additional tests specifically relevant to this agent type
    </Card.Text>
  </Card.Header>
  <Card.Body>
    {recommendedTests.filter(t => !t.isCore).map(test => (
      <TestCard test={test} />
    ))}
  </Card.Body>
</Card>

<Card style={{ backgroundColor: theme.colors.infoLight }}>
  <Card.Body>
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: theme.typography.fontSize.lg, marginBottom: theme.spacing.md }}>
        ℹ️ Don't see the tests you need?
      </div>
      <div style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.textSecondary }}>
        You can add custom tests in the next step!
      </div>
    </div>
  </Card.Body>
</Card>
```

### Phase 3: Smart Fallback (Low Priority)

**Enhance agent type detection**:

```typescript
const getAgentType = (agent: any): string => {
  // Existing detection logic...
  
  // If no match, analyze agent properties
  if (noMatchFound) {
    return getSmartFallback(agent);
  }
};

const getSmartFallback = (agent: any): string => {
  // Analyze agent capabilities
  const capabilities = [];
  
  if (agent.tools?.length > 0) capabilities.push('tool_usage');
  if (agent.knowledgeBase) capabilities.push('rag_grounding');
  if (agent.multimodal) capabilities.push('multimodal');
  
  // Return most specific type based on capabilities
  if (capabilities.includes('tool_usage') && capabilities.includes('rag_grounding')) {
    return 'analytics'; // Likely an analytics agent
  }
  
  return 'general';
};
```

---

## 🎯 Expected Outcomes

### Before Enhancement:
```
Tests Shown: 25 (mixed, no guarantee of core tests)
Message: "Top 25 Recommended Tests"
Issue: User doesn't know why some tests are missing
```

### After Enhancement:
```
Core Tests: 4 (always shown)
  ✅ Hallucination Detection (CORE)
  ✅ Intent Detection (CORE)
  ✅ Emotional Handling (CORE)
  ✅ Safety Checks (CORE)

Agent-Specific Tests: 15 (for monitoring agents)
  🎯 Monitoring-specific tests
  🎯 Tool Usage tests
  🎯 RAG Grounding tests

Message: "Don't see what you need? Add custom tests in the next step!"
```

---

## 📊 Comparison

| Feature | Current | Enhanced |
|---------|---------|----------|
| Core tests guaranteed | ❌ No | ✅ Yes (4 core) |
| Clear messaging | ⚠️ Basic | ✅ Detailed |
| Sections (core vs specific) | ❌ No | ✅ Yes |
| Custom test guidance | ❌ No | ✅ Yes |
| New agent support | ⚠️ Basic | ✅ Smart fallback |
| Total tests shown | 25 | 19 (4 core + 15 specific) |

---

## 🚀 Implementation Priority

### Must Have (Phase 1):
1. ✅ Define CORE_TESTS constant
2. ✅ Always include core tests
3. ✅ Separate core from agent-specific in logic

### Should Have (Phase 2):
1. ✅ UI sections (Core vs Agent-Specific)
2. ✅ Clear messaging about custom tests
3. ✅ Visual badges for core tests

### Nice to Have (Phase 3):
1. ⚠️ Smart fallback based on agent properties
2. ⚠️ Dynamic capability detection
3. ⚠️ Test recommendations based on agent tools

---

## Summary

**Current State**: ✅ Good foundation with intelligent filtering

**Gaps**:
- ❌ No guaranteed core tests
- ❌ Limited messaging about missing tests
- ⚠️ Basic fallback for new agents

**Solution**: Add core tests + improve UI messaging + smart fallback

**Effort**: ~2-3 hours for Phase 1 & 2

**Impact**: ✅ Better user experience, ✅ Guaranteed test coverage, ✅ Clear guidance
