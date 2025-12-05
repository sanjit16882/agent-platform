# Bedrock Agents: Core vs Quick - Clarification

## Important Clarification

**There is only ONE AWS service: Amazon Bedrock Agents**

"Core" and "Quick" are **NOT separate AWS services**. They are:
- **Implementation patterns** we create in our application
- **Different ways to use** the same AWS Bedrock Agents service
- **UI/UX approaches** to simplify or expose complexity

---

## The Single AWS Service

### **Amazon Bedrock Agents** (The Only Service)

**AWS Service Name:** `Amazon Bedrock Agents`

**What AWS Provides:**
```typescript
// This is the ONLY AWS service
import { BedrockAgentClient } from '@aws-sdk/client-bedrock-agent';
import { BedrockAgentRuntimeClient } from '@aws-sdk/client-bedrock-agent-runtime';

// All these features come from ONE service:
- CreateAgent
- CreateAgentActionGroup
- AssociateAgentKnowledgeBase
- InvokeAgent
- PrepareAgent
```

**AWS Documentation:**
- Service: https://aws.amazon.com/bedrock/agents/
- API Reference: https://docs.aws.amazon.com/bedrock/latest/APIReference/API_Operations_Agents_for_Amazon_Bedrock.html

---

## What We're Actually Building

### Our Application Layer (Not AWS)

```
┌─────────────────────────────────────────────────────┐
│           OUR APPLICATION (What we build)           │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────────┐      ┌──────────────────┐   │
│  │  "Quick" Builder │      │  "Core" Builder  │   │
│  │  (Simplified UI) │      │  (Advanced UI)   │   │
│  └────────┬─────────┘      └────────┬─────────┘   │
│           │                         │             │
│           └─────────┬───────────────┘             │
│                     │                             │
│                     ▼                             │
│         ┌───────────────────────┐                 │
│         │  Our Backend Service  │                 │
│         │  (Node.js/TypeScript) │                 │
│         └───────────┬───────────┘                 │
└─────────────────────┼─────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│              AWS BEDROCK AGENTS                     │
│         (The actual AWS service)                    │
│                                                     │
│  - CreateAgent()                                    │
│  - CreateAgentActionGroup()                         │
│  - AssociateAgentKnowledgeBase()                    │
│  - InvokeAgent()                                    │
└─────────────────────────────────────────────────────┘
```

---

## How "Quick" vs "Core" Works

### "Quick Agent" (Our Simplified Approach)

**What it is:**
- A **simplified UI wizard** in our app
- Uses **minimal configuration** of AWS Bedrock Agents
- **Pre-configured defaults** for common use cases
- **Hides complexity** from the user

**What it does behind the scenes:**
```typescript
// User sees: Simple 3-step form
// We do: Call AWS Bedrock Agents with sensible defaults

async function createQuickAgent(userInput) {
  // Step 1: Create agent with defaults
  const agent = await bedrockClient.send(new CreateAgentCommand({
    agentName: userInput.name,
    instruction: userInput.instruction,
    foundationModel: 'anthropic.claude-3-haiku-20240307-v1:0', // Default to cheapest
    agentResourceRoleArn: DEFAULT_ROLE_ARN,
    idleSessionTTLInSeconds: 600, // Default 10 min
    // No action groups - keep it simple
    // No guardrails - use defaults
    // No custom memory config - use defaults
  }));

  // Step 2: Associate single knowledge base (if provided)
  if (userInput.knowledgeBaseId) {
    await bedrockClient.send(new AssociateAgentKnowledgeBaseCommand({
      agentId: agent.agentId,
      agentVersion: 'DRAFT',
      knowledgeBaseId: userInput.knowledgeBaseId,
      description: 'Primary knowledge base'
    }));
  }

  // Step 3: Prepare agent
  await bedrockClient.send(new PrepareAgentCommand({
    agentId: agent.agentId
  }));

  return agent;
}
```

**User Experience:**
```
Step 1: Name & Instructions (1 minute)
Step 2: Select Knowledge Base (1 minute)
Step 3: Choose Model (1 minute)
Click "Create" → Done! (2 minutes)
Total: ~5 minutes
```

---

### "Core Agent" (Our Advanced Approach)

**What it is:**
- A **full-featured UI** in our app
- Exposes **all AWS Bedrock Agents capabilities**
- **Advanced configuration** options
- **Maximum flexibility**

**What it does behind the scenes:**
```typescript
// User sees: Multi-tab advanced configuration
// We do: Call AWS Bedrock Agents with full control

async function createCoreAgent(userConfig) {
  // Step 1: Create agent with full config
  const agent = await bedrockClient.send(new CreateAgentCommand({
    agentName: userConfig.name,
    instruction: userConfig.instruction,
    foundationModel: userConfig.selectedModel, // User chooses
    agentResourceRoleArn: userConfig.roleArn,
    idleSessionTTLInSeconds: userConfig.sessionTTL,
    description: userConfig.description,
    
    // Advanced: Guardrails
    guardrailConfiguration: userConfig.guardrailId ? {
      guardrailIdentifier: userConfig.guardrailId,
      guardrailVersion: userConfig.guardrailVersion
    } : undefined,
    
    // Advanced: Prompt override
    promptOverrideConfiguration: userConfig.promptOverride,
  }));

  // Step 2: Create multiple action groups
  for (const actionGroup of userConfig.actionGroups) {
    await bedrockClient.send(new CreateAgentActionGroupCommand({
      agentId: agent.agentId,
      agentVersion: 'DRAFT',
      actionGroupName: actionGroup.name,
      description: actionGroup.description,
      actionGroupExecutor: {
        lambda: actionGroup.lambdaArn
      },
      apiSchema: {
        payload: JSON.stringify(actionGroup.openApiSchema)
      },
      actionGroupState: 'ENABLED'
    }));
  }

  // Step 3: Associate multiple knowledge bases
  for (const kb of userConfig.knowledgeBases) {
    await bedrockClient.send(new AssociateAgentKnowledgeBaseCommand({
      agentId: agent.agentId,
      agentVersion: 'DRAFT',
      knowledgeBaseId: kb.id,
      description: kb.description,
      knowledgeBaseState: 'ENABLED'
    }));
  }

  // Step 4: Prepare agent
  await bedrockClient.send(new PrepareAgentCommand({
    agentId: agent.agentId
  }));

  return agent;
}
```

**User Experience:**
```
Tab 1: Basic Info (5 minutes)
Tab 2: Knowledge Bases (3 minutes)
Tab 3: Action Groups (10 minutes)
Tab 4: Memory Config (2 minutes)
Tab 5: Guardrails (3 minutes)
Tab 6: Advanced Settings (2 minutes)
Click "Create" → Done!
Total: ~25 minutes
```

---

## Side-by-Side Comparison

| Aspect | "Quick" (Our Simple UI) | "Core" (Our Advanced UI) |
|--------|------------------------|-------------------------|
| **AWS Service Used** | Amazon Bedrock Agents | Amazon Bedrock Agents |
| **AWS API Calls** | CreateAgent, AssociateKB, PrepareAgent | CreateAgent, CreateActionGroup, AssociateKB, PrepareAgent |
| **Configuration Options** | 3-5 fields | 20+ fields |
| **Setup Time** | 5 minutes | 25 minutes |
| **Knowledge Bases** | 1 (single) | Multiple |
| **Action Groups** | None | Multiple |
| **Guardrails** | Default | Custom |
| **Memory Config** | Default | Custom |
| **Target User** | Beginners | Advanced users |
| **Use Case** | Simple Q&A, RAG | Complex workflows, API integration |

---

## Real-World Example

### Scenario: Customer Support Bot

#### Using "Quick" Approach:
```typescript
// User fills simple form:
{
  name: "Customer Support Bot",
  instruction: "You are a helpful customer support agent. Answer questions using the knowledge base.",
  knowledgeBaseId: "kb-customer-docs-123"
}

// We create agent with defaults:
const agent = await createQuickAgent({
  name: "Customer Support Bot",
  instruction: "You are a helpful customer support agent...",
  knowledgeBaseId: "kb-customer-docs-123",
  model: "claude-3-haiku" // Default
});

// Result: Simple Q&A bot, ready in 5 minutes
```

#### Using "Core" Approach:
```typescript
// User configures everything:
{
  name: "Customer Support Bot",
  instruction: "You are a helpful customer support agent...",
  model: "claude-3-sonnet", // User chooses better model
  
  knowledgeBases: [
    { id: "kb-customer-docs-123", description: "Product docs" },
    { id: "kb-support-history-456", description: "Past tickets" }
  ],
  
  actionGroups: [
    {
      name: "CRM Integration",
      lambdaArn: "arn:aws:lambda:...:function:crm-lookup",
      openApiSchema: { /* CRM API schema */ }
    },
    {
      name: "Ticket Management",
      lambdaArn: "arn:aws:lambda:...:function:create-ticket",
      openApiSchema: { /* Ticket API schema */ }
    }
  ],
  
  guardrailId: "guardrail-pii-filter-789",
  sessionTTL: 1800, // 30 minutes
  memoryConfig: { enableSessionSummary: true }
}

// We create agent with full config:
const agent = await createCoreAgent(fullConfig);

// Result: Advanced bot with CRM integration, ready in 25 minutes
```

---

## The Truth About AWS Services

### What AWS Actually Provides:

1. **Amazon Bedrock Agents** ✅
   - Agent orchestration
   - Session management
   - Reasoning and planning
   - Action group execution
   - Knowledge base integration

2. **Amazon Bedrock Knowledge Bases** ✅
   - Document ingestion
   - Vector storage
   - Semantic search
   - RAG capabilities

3. **Amazon Bedrock** ✅
   - Foundation models (Claude, Titan)
   - Model inference
   - Streaming responses

### What AWS Does NOT Provide:

❌ "Bedrock Agent Quick" - This doesn't exist as an AWS service
❌ "Bedrock Agent Core" - This doesn't exist as an AWS service
❌ Pre-built UI for agent creation
❌ Simplified wizard for beginners
❌ Agent templates or presets

**We build these ourselves!**

---

## Our Application Architecture

```typescript
// Our application provides TWO paths to the SAME AWS service

// Path 1: Quick Builder (Our simplified wrapper)
class QuickAgentBuilder {
  async create(simpleConfig) {
    // We add defaults and call AWS Bedrock Agents
    return await awsBedrockAgents.createAgent({
      ...DEFAULT_CONFIG,
      ...simpleConfig
    });
  }
}

// Path 2: Core Builder (Our advanced wrapper)
class CoreAgentBuilder {
  async create(advancedConfig) {
    // We expose all options and call AWS Bedrock Agents
    return await awsBedrockAgents.createAgent(advancedConfig);
  }
}

// Both use the SAME AWS service underneath!
```

---

## Why This Approach?

### Benefits of Our "Quick" vs "Core" Pattern:

1. **Beginner-Friendly**
   - "Quick" hides complexity
   - Gets users started fast
   - Reduces learning curve

2. **Power User Support**
   - "Core" exposes everything
   - Maximum flexibility
   - Advanced use cases

3. **Progressive Disclosure**
   - Start with "Quick"
   - Upgrade to "Core" when needed
   - Smooth learning path

4. **Single Backend**
   - Both use same AWS APIs
   - No duplicate code
   - Easy to maintain

---

## Summary

### The Reality:

**AWS Service:**
- ✅ Amazon Bedrock Agents (ONE service)

**Our Application:**
- ✅ "Quick Agent Builder" (simplified UI we build)
- ✅ "Core Agent Builder" (advanced UI we build)

**Both builders use the exact same AWS Bedrock Agents service underneath!**

### Analogy:

Think of it like a car:
- **AWS Bedrock Agents** = The car engine (one engine)
- **"Quick" mode** = Automatic transmission (easy to drive)
- **"Core" mode** = Manual transmission (full control)

Same engine, different driving experience!

---

## Pricing Impact

**Important:** Since both "Quick" and "Core" use the same AWS service, **pricing is identical**:

- Both use Amazon Bedrock Agents: $0.00070 per request
- Both use same foundation models
- Both use same knowledge bases
- Both use same action groups (if configured)

**The only difference is the UI/UX we provide to configure them!**

---

## Next Steps

When building the standalone app, we'll create:

1. **Quick Agent Builder UI** (5-minute wizard)
   - Simple form
   - Minimal options
   - Calls AWS Bedrock Agents with defaults

2. **Core Agent Builder UI** (Advanced configuration)
   - Multi-tab interface
   - All options exposed
   - Calls AWS Bedrock Agents with full control

3. **Shared Backend Service**
   - Single service that talks to AWS
   - Handles both "Quick" and "Core" requests
   - Same AWS SDK, different parameters

**Both are just different ways to use Amazon Bedrock Agents!**
