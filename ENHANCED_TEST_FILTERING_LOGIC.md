# Enhanced Test Filtering Logic

## Overview

**Goal**: Show 5 core tests + agent-specific tests, with clear separation

---

## Two-Tier Filtering System

### Tier 1: Core Tests (Always Shown)
```
5 tests that appear for EVERY agent:
1. Hallucination
2. Safety
3. Functional
4. Intent Detection
5. Emotional
```

### Tier 2: Agent-Specific Tests (Filtered by Agent Type)
```
Additional tests based on agent type/capabilities:
- Monitoring agent → monitoring, tool_usage, rag_grounding tests
- Code Review agent → code-specific tests
- Customer Service → multi_turn, conversation tests
- etc.
```

---

## Filtering Logic Flow

```
┌─────────────────────────────────────────────────────────┐
│ 1. User Selects Agent                                   │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 2. Detect Agent Type                                    │
│    - Check agent.type                                   │
│    - Check agent.category                               │
│    - Check agent.name (keywords)                        │
│    - Check agent.capabilities                           │
│    Result: "monitoring" | "code-review" | "general"     │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 3. Get Core Tests (Always)                              │
│    Filter tests where category IN:                      │
│    ['hallucination', 'safety', 'functional',            │
│     'intent_detection', 'emotional']                    │
│    Mark as: isCore = true                               │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 4. Get Agent-Specific Tests                             │
│    Use priority map for agent type:                     │
│    - monitoring → monitoring:10, tool_usage:9, etc.     │
│    - code-review → code:10, security:9, etc.            │
│    Filter tests NOT in core                             │
│    Score by priority                                    │
│    Take top 10-15                                       │
│    Mark as: isCore = false                              │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 5. Combine & Display                                    │
│    Section 1: Core Tests (5)                            │
│    Section 2: Agent-Specific Tests (10-15)              │
│    Total: 15-20 tests                                   │
└─────────────────────────────────────────────────────────┘
```

---

## Implementation Code

### Step 1: Define Core Tests

```typescript
const CORE_TESTS = {
  hallucination: {
    priority: 10,
    reason: 'Ensures accuracy and truthfulness',
    alwaysInclude: true
  },
  safety: {
    priority: 10,
    reason: 'Ensures safe and appropriate responses',
    alwaysInclude: true
  },
  functional: {
    priority: 10,
    reason: 'Validates basic task completion',
    alwaysInclude: true
  },
  intent_detection: {
    priority: 10,
    reason: 'Validates understanding of user goals',
    alwaysInclude: true
  },
  emotional: {
    priority: 10,
    reason: 'Ensures appropriate emotional responses',
    alwaysInclude: true
  }
};
```

### Step 2: Enhanced Agent Type Detection

```typescript
const getAgentType = (agent: any): string => {
  // Priority 1: Explicit type
  if (agent.type) {
    return agent.type.toLowerCase();
  }
  
  // Priority 2: Category
  if (agent.category) {
    return agent.category.toLowerCase().replace(/\s+/g, '-');
  }
  
  // Priority 3: Name-based detection
  const name = agent.name?.toLowerCase() || '';
  
  // Monitoring/Performance
  if (name.includes('monitor') || name.includes('performance') || 
      name.includes('observability') || name.includes('metrics')) {
    return 'monitoring';
  }
  
  // Code-related
  if (name.includes('code') || name.includes('review') || 
      name.includes('lint') || name.includes('quality')) {
    return 'code-review';
  }
  
  // Security
  if (name.includes('security') || name.includes('scan') || 
      name.includes('vulnerability') || name.includes('audit')) {
    return 'security-scan';
  }
  
  // Testing/QA
  if (name.includes('test') || name.includes('qa') || 
      name.includes('quality assurance')) {
    return 'qa-tester';
  }
  
  // Customer Service
  if (name.includes('customer') || name.includes('support') || 
      name.includes('service') || name.includes('helpdesk')) {
    return 'customer-service';
  }
  
  // Data/Analytics
  if (name.includes('data') || name.includes('analytic') || 
      name.includes('insight') || name.includes('report')) {
    return 'analytics';
  }
  
  // DevOps/Automation
  if (name.includes('devops') || name.includes('automat') || 
      name.includes('workflow') || name.includes('orchestrat')) {
    return 'automation';
  }
  
  // Priority 4: Capability-based detection
  if (agent.tools?.length > 0 && agent.knowledgeBase) {
    return 'analytics'; // Has both tools and knowledge
  }
  
  if (agent.tools?.length > 0) {
    return 'automation'; // Has tools
  }
  
  if (agent.knowledgeBase || agent.rag_enabled) {
    return 'qa-tester'; // Has knowledge base
  }
  
  // Default
  return 'general';
};
```

### Step 3: Agent-Specific Test Mapping

```typescript
const AGENT_SPECIFIC_TESTS = {
  'monitoring': {
    'monitoring': 10,        // Monitoring-specific tests
    'tool_usage': 9,         // Needs to call APIs
    'rag_grounding': 7,      // Must stay grounded in data
    'adversarial': 5         // Resistance to attacks
  },
  'code-review': {
    'tool_usage': 9,         // May use linting tools
    'rag_grounding': 8,      // Must base on actual code
    'adversarial': 6,        // Resist code injection
    'multi_turn': 5          // May have conversations
  },
  'security-scan': {
    'adversarial': 10,       // Critical for security
    'tool_usage': 8,         // Uses security tools
    'rag_grounding': 7,      // Must base on actual findings
    'monitoring': 5          // May monitor systems
  },
  'qa-tester': {
    'tool_usage': 10,        // Uses testing tools
    'rag_grounding': 9,      // Must base on specs
    'multi_turn': 6,         // Test conversations
    'adversarial': 5         // Test edge cases
  },
  'customer-service': {
    'multi_turn': 10,        // Conversations are key
    'rag_grounding': 8,      // Must use knowledge base
    'tool_usage': 7,         // May use CRM tools
    'adversarial': 6         // Handle difficult customers
  },
  'analytics': {
    'rag_grounding': 10,     // Must base on data
    'tool_usage': 9,         // Uses data tools
    'monitoring': 6,         // May monitor metrics
    'adversarial': 4         // Less critical
  },
  'automation': {
    'tool_usage': 10,        // Heavy tool usage
    'adversarial': 7,        // Resist malicious commands
    'monitoring': 6,         // May monitor workflows
    'multi_turn': 5          // May have conversations
  },
  'general': {
    'tool_usage': 7,         // May use tools
    'rag_grounding': 7,      // May use knowledge
    'multi_turn': 6,         // May converse
    'adversarial': 5,        // Basic resistance
    'monitoring': 3          // Less likely
  }
};
```

### Step 4: Main Filtering Function

```typescript
const filterTestsForAgent = () => {
  const agentType = getAgentType(selectedAgent);
  console.log(`🎯 Agent type detected: ${agentType}`);
  
  // STEP 1: Get Core Tests (Always included)
  const coreTestCategories = Object.keys(CORE_TESTS);
  const coreTests = tests
    .filter(test => coreTestCategories.includes(test.category))
    .map(test => ({
      ...test,
      relevanceScore: CORE_TESTS[test.category].priority,
      isCore: true,
      reason: CORE_TESTS[test.category].reason,
      section: 'core'
    }));
  
  console.log(`✅ Found ${coreTests.length} core tests`);
  
  // STEP 2: Get Agent-Specific Tests
  const priorityMap = AGENT_SPECIFIC_TESTS[agentType] || AGENT_SPECIFIC_TESTS['general'];
  
  const agentSpecificTests = tests
    .filter(test => !coreTestCategories.includes(test.category)) // Exclude core
    .map(test => ({
      ...test,
      relevanceScore: priorityMap[test.category] || 0,
      isCore: false,
      section: 'agent-specific'
    }))
    .filter(test => test.relevanceScore > 0) // Only relevant tests
    .sort((a, b) => b.relevanceScore - a.relevanceScore) // Sort by priority
    .slice(0, 15); // Top 15 agent-specific tests
  
  console.log(`✅ Found ${agentSpecificTests.length} agent-specific tests for ${agentType}`);
  
  // STEP 3: Combine
  const allRecommendedTests = [...coreTests, ...agentSpecificTests];
  
  setRecommendedTests(allRecommendedTests);
  setCoreTestCount(coreTests.length);
  setAgentSpecificCount(agentSpecificTests.length);
  
  console.log(`📊 Total recommended: ${allRecommendedTests.length} (${coreTests.length} core + ${agentSpecificTests.length} specific)`);
};
```

---

## Example Outputs

### Example 1: Monitoring Agent

**Input**: Agent name = "DevOps Infrastructure Monitor"

**Detection**: `agentType = 'monitoring'`

**Output**:
```
Core Tests (5):
  ✅ Hallucination Detection
  ✅ Safety Checks
  ✅ Functional Correctness
  ✅ Intent Detection
  ✅ Emotional Intelligence

Agent-Specific Tests (15):
  🎯 Monitoring Test 1 (priority: 10)
  🎯 Monitoring Test 2 (priority: 10)
  🎯 Tool Usage Test 1 (priority: 9)
  🎯 Tool Usage Test 2 (priority: 9)
  🎯 RAG Grounding Test 1 (priority: 7)
  ... (10 more)

Total: 20 tests
```

### Example 2: Customer Service Agent

**Input**: Agent name = "Customer Support Assistant"

**Detection**: `agentType = 'customer-service'`

**Output**:
```
Core Tests (5):
  ✅ Hallucination Detection
  ✅ Safety Checks
  ✅ Functional Correctness
  ✅ Intent Detection
  ✅ Emotional Intelligence

Agent-Specific Tests (15):
  🎯 Multi-Turn Conversation Test 1 (priority: 10)
  🎯 Multi-Turn Conversation Test 2 (priority: 10)
  🎯 RAG Grounding Test 1 (priority: 8)
  🎯 RAG Grounding Test 2 (priority: 8)
  🎯 Tool Usage Test 1 (priority: 7)
  ... (10 more)

Total: 20 tests
```

### Example 3: Unknown/New Agent

**Input**: Agent name = "My Custom Agent"

**Detection**: `agentType = 'general'` (fallback)

**Output**:
```
Core Tests (5):
  ✅ Hallucination Detection
  ✅ Safety Checks
  ✅ Functional Correctness
  ✅ Intent Detection
  ✅ Emotional Intelligence

Agent-Specific Tests (10):
  🎯 Tool Usage Test 1 (priority: 7)
  🎯 RAG Grounding Test 1 (priority: 7)
  🎯 Multi-Turn Test 1 (priority: 6)
  🎯 Adversarial Test 1 (priority: 5)
  ... (6 more)

Total: 15 tests
```

---

## Key Features

### 1. Guaranteed Core Coverage
- ✅ Every agent gets 5 core tests
- ✅ No matter what type
- ✅ No configuration needed

### 2. Intelligent Agent Detection
- ✅ Checks type, category, name, capabilities
- ✅ Falls back gracefully to 'general'
- ✅ Works for new agents automatically

### 3. Prioritized Agent-Specific Tests
- ✅ Each agent type has custom priority map
- ✅ Tests sorted by relevance
- ✅ Top 10-15 most relevant tests

### 4. Clear Separation
- ✅ Core tests marked with `isCore: true`
- ✅ Agent-specific marked with `isCore: false`
- ✅ Can display in separate UI sections

### 5. Automatic Support for New Agents
- ✅ Falls back to 'general' type
- ✅ Still gets 5 core tests
- ✅ Gets reasonable agent-specific tests
- ✅ No manual configuration needed

---

## Benefits

### For Users:
- ✅ Always see essential tests
- ✅ See relevant tests for their agent
- ✅ Clear understanding of what's being tested
- ✅ Can proceed to custom tests if needed

### For System:
- ✅ Automatic agent type detection
- ✅ Scales to new agent types
- ✅ No manual configuration
- ✅ Consistent test coverage

### For New Agents:
- ✅ Automatically supported
- ✅ Get core tests immediately
- ✅ Get reasonable agent-specific tests
- ✅ No setup required

---

## Summary

**Logic**:
1. Detect agent type (type → category → name → capabilities → fallback)
2. Get 5 core tests (always)
3. Get 10-15 agent-specific tests (based on priority map)
4. Combine and display in separate sections

**Result**:
- 15-20 total tests per agent
- 5 core (universal)
- 10-15 specific (relevant)
- Clear separation in UI
- Automatic support for new agents
