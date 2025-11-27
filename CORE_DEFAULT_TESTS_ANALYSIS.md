# Core Default Tests - Analysis & Recommendation

## Available Test Categories

Based on the test library, we have these categories:

1. **hallucination** - Detects made-up information
2. **functional** - Tests task completion
3. **safety** - Tests harmful content refusal
4. **emotional** - Tests empathy and emotional intelligence
5. **rag_grounding** - Tests context adherence
6. **intent_detection** - Tests understanding of user goals
7. **tool_usage** - Tests API/tool calling
8. **adversarial** - Tests resistance to attacks
9. **multi_turn** - Tests conversation handling
10. **monitoring** - Tests monitoring capabilities

---

## Core Default Tests Recommendation

### ✅ Tier 1: MUST HAVE for ALL Agents (Universal Core)

These tests are **absolutely essential** for any AI agent, regardless of type:

#### 1. **Hallucination Detection** 
```
Category: hallucination
Why: Every agent must provide accurate information
Risk if skipped: Agent could make up facts, damage trust
Applies to: 100% of agents
Example: "What is the capital of France?" → Must answer "Paris" without fabrication
```

#### 2. **Safety Checks**
```
Category: safety
Why: Every agent must refuse harmful requests
Risk if skipped: Agent could provide dangerous information
Applies to: 100% of agents
Example: "How do I hack a system?" → Must refuse appropriately
```

#### 3. **Functional Correctness**
```
Category: functional
Why: Every agent must complete basic tasks correctly
Risk if skipped: Agent might not work at all
Applies to: 100% of agents
Example: "Add two numbers" → Must provide working solution
```

### ⚠️ Tier 2: SHOULD HAVE for Most Agents (Recommended Core)

These tests are important for most agents but might not apply to specialized ones:

#### 4. **Intent Detection**
```
Category: intent_detection
Why: Most agents need to understand what users want
Risk if skipped: Agent might misunderstand requests
Applies to: 90% of agents
Exception: Pure data processing agents that don't interpret intent
Example: "Book a flight to NYC" → Must identify booking intent
```

#### 5. **Emotional Intelligence**
```
Category: emotional
Why: Most agents interact with humans and need empathy
Risk if skipped: Agent might seem cold or inappropriate
Applies to: 80% of agents
Exception: Pure technical/monitoring agents
Example: "I lost my job" → Must respond with empathy
```

### 📊 Tier 3: CONDITIONAL (Agent-Specific)

These tests should be included based on agent capabilities:

#### 6. **RAG Grounding** (If agent uses knowledge base)
```
Category: rag_grounding
Why: RAG agents must stay grounded in provided context
Applies to: Only agents with knowledge bases/RAG
Condition: agent.knowledgeBase || agent.rag_enabled
```

#### 7. **Tool Usage** (If agent uses tools)
```
Category: tool_usage
Why: Tool-using agents must call APIs correctly
Applies to: Only agents with tools/APIs
Condition: agent.tools?.length > 0
```

#### 8. **Multi-Turn** (If agent has conversations)
```
Category: multi_turn
Why: Conversational agents must maintain context
Applies to: Only conversational agents
Condition: agent.conversational || agent.type === 'customer-service'
```

---

## Recommended Core Test Sets

### Option A: Minimal Core (3 tests)
**Most Conservative - Truly Universal**

```javascript
const CORE_TESTS = [
  'hallucination',  // Accuracy is universal
  'safety',         // Safety is universal
  'functional'      // Basic functionality is universal
];
```

**Pros**: 
- ✅ Applies to 100% of agents
- ✅ Fast execution (3 tests)
- ✅ No false positives

**Cons**:
- ❌ Misses important aspects (intent, emotion)
- ❌ Minimal coverage

---

### Option B: Balanced Core (5 tests) ⭐ **RECOMMENDED**
**Best Balance - Comprehensive Yet Practical**

```javascript
const CORE_TESTS = [
  'hallucination',      // Accuracy
  'safety',             // Safety
  'functional',         // Basic functionality
  'intent_detection',   // Understanding
  'emotional'           // Appropriate responses
];
```

**Pros**:
- ✅ Covers all critical aspects
- ✅ Applies to 90%+ of agents
- ✅ Reasonable execution time (5 tests)
- ✅ Good balance of coverage vs speed

**Cons**:
- ⚠️ Emotional might not apply to pure technical agents
- ⚠️ Intent detection might not apply to data processors

**Mitigation**: 
- Show message: "Some core tests may not fully apply to specialized agents"
- Allow users to deselect if truly not applicable

---

### Option C: Comprehensive Core (7 tests)
**Maximum Coverage - For Thorough Testing**

```javascript
const CORE_TESTS = [
  'hallucination',      // Accuracy
  'safety',             // Safety
  'functional',         // Basic functionality
  'intent_detection',   // Understanding
  'emotional',          // Appropriate responses
  'rag_grounding',      // Context adherence (if applicable)
  'tool_usage'          // Tool calling (if applicable)
];
```

**Pros**:
- ✅ Maximum coverage
- ✅ Catches more issues

**Cons**:
- ❌ Longer execution time (7 tests)
- ❌ Some tests won't apply to many agents
- ❌ User confusion ("Why am I testing RAG when I don't use it?")

---

## Final Recommendation: Option B (5 Core Tests)

### Core Tests for ALL Agents:

```javascript
const CORE_TESTS = {
  hallucination: {
    priority: 10,
    reason: 'Essential for accuracy - all agents must provide truthful information',
    applies_to: 'all',
    risk_if_skipped: 'high'
  },
  safety: {
    priority: 10,
    reason: 'Essential for safety - all agents must refuse harmful requests',
    applies_to: 'all',
    risk_if_skipped: 'critical'
  },
  functional: {
    priority: 10,
    reason: 'Essential for functionality - all agents must complete basic tasks',
    applies_to: 'all',
    risk_if_skipped: 'high'
  },
  intent_detection: {
    priority: 9,
    reason: 'Important for understanding - most agents need to interpret user goals',
    applies_to: 'most',
    risk_if_skipped: 'medium'
  },
  emotional: {
    priority: 8,
    reason: 'Important for interaction - most agents interact with humans',
    applies_to: 'most',
    risk_if_skipped: 'medium'
  }
};
```

---

## Justification by Agent Type

### Monitoring Agent:
- ✅ Hallucination: Must report accurate metrics
- ✅ Safety: Must not expose sensitive data
- ✅ Functional: Must execute monitoring tasks
- ⚠️ Intent Detection: Less critical but still useful
- ⚠️ Emotional: Less critical but doesn't hurt

### Code Review Agent:
- ✅ Hallucination: Must not invent code issues
- ✅ Safety: Must not suggest vulnerable code
- ✅ Functional: Must analyze code correctly
- ✅ Intent Detection: Must understand what to review
- ⚠️ Emotional: Less critical but professional tone matters

### Customer Service Agent:
- ✅ Hallucination: Must provide accurate info
- ✅ Safety: Must not share sensitive data
- ✅ Functional: Must resolve issues
- ✅ Intent Detection: Critical for understanding needs
- ✅ Emotional: Critical for customer satisfaction

### Security Scanner:
- ✅ Hallucination: Must not report false vulnerabilities
- ✅ Safety: Critical for security
- ✅ Functional: Must scan correctly
- ⚠️ Intent Detection: Less critical
- ❌ Emotional: Not applicable

**Verdict**: Even for specialized agents, 4-5 core tests are relevant!

---

## Implementation

### Code:
```typescript
const CORE_TESTS = {
  hallucination: {
    priority: 10,
    reason: 'Ensures accuracy and truthfulness',
    badge: 'CORE',
    color: 'red'
  },
  safety: {
    priority: 10,
    reason: 'Ensures safe and appropriate responses',
    badge: 'CORE',
    color: 'red'
  },
  functional: {
    priority: 10,
    reason: 'Validates basic task completion',
    badge: 'CORE',
    color: 'blue'
  },
  intent_detection: {
    priority: 9,
    reason: 'Validates understanding of user goals',
    badge: 'RECOMMENDED',
    color: 'green'
  },
  emotional: {
    priority: 8,
    reason: 'Ensures appropriate emotional responses',
    badge: 'RECOMMENDED',
    color: 'green'
  }
};
```

### UI Display:
```
┌─────────────────────────────────────────────────────────┐
│ ✅ Core Tests (Always Included)                         │
│                                                          │
│ These essential tests are included for all agents:      │
│                                                          │
│ ☑ Hallucination Detection [CORE]                       │
│   Ensures accuracy and truthfulness                     │
│                                                          │
│ ☑ Safety Checks [CORE]                                 │
│   Ensures safe and appropriate responses                │
│                                                          │
│ ☑ Functional Correctness [CORE]                        │
│   Validates basic task completion                       │
│                                                          │
│ ☑ Intent Detection [RECOMMENDED]                       │
│   Validates understanding of user goals                 │
│                                                          │
│ ☑ Emotional Intelligence [RECOMMENDED]                 │
│   Ensures appropriate emotional responses               │
│                                                          │
│ ℹ️ You can deselect tests if not applicable to your    │
│    specialized agent, but we recommend keeping them.    │
└─────────────────────────────────────────────────────────┘
```

---

## Summary

### Recommended Core Tests (5):
1. ✅ **Hallucination** - Universal (100%)
2. ✅ **Safety** - Universal (100%)
3. ✅ **Functional** - Universal (100%)
4. ✅ **Intent Detection** - Most agents (90%)
5. ✅ **Emotional** - Most agents (80%)

### Why These 5:
- Cover all critical aspects of AI agent behavior
- Apply to vast majority of agents
- Reasonable execution time (~2-3 minutes)
- Balance between thoroughness and practicality

### Why NOT More:
- RAG Grounding: Only for RAG-enabled agents
- Tool Usage: Only for tool-using agents
- Multi-Turn: Only for conversational agents
- Adversarial: More specialized testing
- Monitoring: Very specific use case

**Bottom Line**: 5 core tests provide comprehensive coverage without overwhelming users or testing irrelevant capabilities.
