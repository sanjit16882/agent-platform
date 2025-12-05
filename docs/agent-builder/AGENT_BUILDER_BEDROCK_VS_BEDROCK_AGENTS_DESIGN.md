# Agent Builder: Bedrock Runtime vs Bedrock Agents - Complete Design

## Overview

Give users a choice at the start of agent creation:
- **Bedrock Runtime (Custom)** - Full control, more configuration
- **Bedrock Agents (Quick)** - AWS-managed, less configuration

---

## Step 1: Choose Agent Backend

### UI Design
```
┌─────────────────────────────────────────────────────────────┐
│  Create New Agent                                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Choose how to build your agent:                           │
│                                                             │
│  ┌──────────────────────────┐  ┌──────────────────────────┐│
│  │ 🔧 Custom Agent          │  │ ⚡ Bedrock Agent (Quick) ││
│  │ (Bedrock Runtime)        │  │ (AWS-Managed)            ││
│  │                          │  │                          ││
│  │ ✅ Full control          │  │ ✅ Quick setup           ││
│  │ ✅ Custom orchestration  │  │ ✅ AWS-managed           ││
│  │ ✅ Unique features       │  │ ✅ Built-in RAG          ││
│  │ ✅ Your infrastructure   │  │ ✅ Built-in tools        ││
│  │                          │  │ ✅ Auto-scaling          ││
│  │ ⚠️ More configuration    │  │ ⚠️ Less flexibility      ││
│  │ ⚠️ You maintain          │  │ ⚠️ AWS constraints       ││
│  │                          │  │                          ││
│  │ [Select Custom]          │  │ [Select Bedrock Agent]   ││
│  └──────────────────────────┘  └──────────────────────────┘│
│                                                             │
│  💡 Not sure? Use Bedrock Agent for standard use cases     │
│     or Custom Agent for unique requirements                │
└─────────────────────────────────────────────────────────────┘
```

---

## Configuration Comparison

### What User Needs to Configure

| Configuration | Custom Agent (Bedrock Runtime) | Bedrock Agent (AWS-Managed) |
|---------------|-------------------------------|----------------------------|
| **Basic Info** | ✅ Required | ✅ Required |
| **Model Selection** | ✅ Required | ✅ Required |
| **Instructions/Prompt** | ✅ Required (detailed) | ✅ Required (simpler) |
| **RAG Configuration** | ✅ Manual setup | ✅ Select Knowledge Base |
| **Tool/Action Setup** | ✅ Manual implementation | ✅ Select Action Groups |
| **Orchestration Logic** | ✅ Custom code | ❌ AWS handles |
| **Memory Management** | ✅ Configure storage | ❌ AWS handles |
| **Session Handling** | ✅ Implement yourself | ❌ AWS handles |
| **Error Handling** | ✅ Custom logic | ❌ AWS handles |
| **Security/Guardrails** | ✅ Implement yourself | ✅ Select Guardrails |
| **Monitoring** | ✅ Custom setup | ✅ Built-in CloudWatch |
| **Scaling** | ✅ Your infrastructure | ❌ AWS auto-scales |


---

## Detailed Configuration Screens

### A. Custom Agent (Bedrock Runtime) - Full Configuration

#### Step 1: Basic Information
```
┌─────────────────────────────────────────────────────────────┐
│  Step 1: Basic Information                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Agent Name: [Customer Support Agent____________]          │
│                                                             │
│  Description:                                               │
│  [Assists customers with product questions and support___] │
│  [_____________________________________________________]   │
│                                                             │
│  Agent Type:                                                │
│  ○ Purpose-Driven  ○ Hybrid  ○ Workflow  ○ Custom         │
│                                                             │
│  Foundation Model:                                          │
│  [Claude 3 Haiku ▼]                                        │
│  💰 Cost: $0.25/$1.25 per 1M tokens                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Step 2: Instructions & Prompt Engineering
```
┌─────────────────────────────────────────────────────────────┐
│  Step 2: Instructions & Prompt Engineering                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  System Prompt: *                                           │
│  [You are a helpful customer support agent. Your role is_] │
│  [to assist customers with product questions, technical__] │
│  [support, and account issues. Be professional and______] │
│  [empathetic in all interactions._______________________] │
│  [_____________________________________________________]   │
│                                                             │
│  📝 Prompt Template Variables:                              │
│  Available: {user_input}, {context}, {history}, {tools}    │
│                                                             │
│  Advanced Prompt Settings:                                  │
│  ☑ Include conversation history                            │
│  ☑ Include retrieved context (RAG)                         │
│  ☑ Include available tools                                 │
│  ☐ Custom prompt template                                  │
│                                                             │
│  Temperature: [0.7_____] (0.0 - 1.0)                       │
│  Max Tokens: [2000____] (100 - 4096)                       │
│  Top P: [0.9_______] (0.0 - 1.0)                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Step 3: RAG Configuration (Manual Setup)
```
┌─────────────────────────────────────────────────────────────┐
│  Step 3: RAG Configuration                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Enable RAG/Knowledge Base: [ON/OFF]                       │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ Vector Database Configuration                       │  │
│  │                                                     │  │
│  │ Provider: [Pinecone ▼]                             │  │
│  │                                                     │  │
│  │ Connection Settings:                                │  │
│  │ API Key: [••••••••••••••••••]                      │  │
│  │ Environment: [us-west1-gcp_____________]           │  │
│  │ Index Name: [customer-support-kb_______]           │  │
│  │                                                     │  │
│  │ Embedding Model:                                    │  │
│  │ [AWS Titan Embeddings ▼]                           │  │
│  │ Dimension: [1536]                                   │  │
│  │                                                     │  │
│  │ Retrieval Settings:                                 │  │
│  │ Top K Results: [5____] (1-20)                      │  │
│  │ Min Similarity: [0.70_] (0.0-1.0)                  │  │
│  │ Max Context Tokens: [1500_] (500-3000)             │  │
│  │                                                     │  │
│  │ ☑ Re-rank results                                   │  │
│  │ ☑ Include metadata in context                       │  │
│  │ ☐ Hybrid search (keyword + semantic)                │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  Context Injection Strategy:                                │
│  ○ Prepend to prompt                                       │
│  ○ Append to prompt                                        │
│  ○ Custom template                                         │
│                                                             │
│  Fallback Behavior (no results):                            │
│  ○ Answer without context                                  │
│  ○ Return "I don't know"                                   │
│  ○ Custom message                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Step 4: Orchestration Logic
```
┌─────────────────────────────────────────────────────────────┐
│  Step 4: Orchestration Logic                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Orchestration Pattern:                                     │
│  ○ Simple (Single LLM call)                                │
│  ○ ReAct (Reasoning + Acting)                              │
│  ○ Chain-of-Thought                                        │
│  ○ Multi-step (Custom loop)                                │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ Multi-Step Configuration                            │  │
│  │                                                     │  │
│  │ Max Iterations: [5____] (1-10)                     │  │
│  │                                                     │  │
│  │ Step Sequence:                                      │  │
│  │ 1. [Analyze user intent_________________]          │  │
│  │ 2. [Search knowledge base_______________]          │  │
│  │ 3. [Execute tools if needed_____________]          │  │
│  │ 4. [Generate response___________________]          │  │
│  │ 5. [Validate response___________________]          │  │
│  │                                                     │  │
│  │ ☑ Allow tool chaining                               │  │
│  │ ☑ Validate each step                                │  │
│  │ ☐ Parallel tool execution                           │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  Error Handling:                                            │
│  On LLM Error: [Retry 3 times ▼]                          │
│  On Tool Error: [Continue with partial results ▼]         │
│  On Timeout: [Return best effort response ▼]              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Step 5: Tool/Function Configuration
```
┌─────────────────────────────────────────────────────────────┐
│  Step 5: Tools & Functions                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Available Tools: [+ Add Tool]                              │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ Tool 1: Reset Password                              │  │
│  │                                                     │  │
│  │ Function Name: [reset_password__________]          │  │
│  │                                                     │  │
│  │ Description:                                        │  │
│  │ [Resets user password and sends email__________]   │  │
│  │                                                     │  │
│  │ Parameters:                                         │  │
│  │ • user_id (string, required)                        │  │
│  │ • email (string, required)                          │  │
│  │ • send_notification (boolean, optional)             │  │
│  │                                                     │  │
│  │ Implementation:                                     │  │
│  │ ○ API Endpoint                                      │  │
│  │   URL: [https://api.company.com/reset-password]    │  │
│  │   Method: [POST ▼]                                  │  │
│  │   Headers: [Authorization: Bearer {token}]         │  │
│  │                                                     │  │
│  │ ○ Lambda Function                                   │  │
│  │   ARN: [arn:aws:lambda:us-east-1:123:function:...] │  │
│  │                                                     │  │
│  │ ○ Custom Code                                       │  │
│  │   [Write custom implementation]                     │  │
│  │                                                     │  │
│  │ Error Handling:                                     │  │
│  │ ☑ Retry on failure (3 attempts)                     │  │
│  │ ☑ Log errors                                        │  │
│  │ ☐ Fallback to manual process                        │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ Tool 2: Check Order Status                          │  │
│  │ [Similar configuration...]                          │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  Tool Selection Strategy:                                   │
│  ○ LLM decides (function calling)                          │
│  ○ Rule-based (keyword matching)                           │
│  ○ Hybrid (LLM + rules)                                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Step 6: Memory & Session Management
```
┌─────────────────────────────────────────────────────────────┐
│  Step 6: Memory & Session Management                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Conversation Memory:                                       │
│  ○ None (stateless)                                        │
│  ○ Short-term (current session only)                       │
│  ○ Long-term (persistent across sessions)                  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ Memory Configuration                                │  │
│  │                                                     │  │
│  │ Storage Backend:                                    │  │
│  │ ○ In-memory (Redis)                                 │  │
│  │   Host: [localhost_____________]                    │  │
│  │   Port: [6379___]                                   │  │
│  │                                                     │  │
│  │ ○ Database (PostgreSQL)                             │  │
│  │   Connection: [postgresql://..._______________]     │  │
│  │                                                     │  │
│  │ ○ DynamoDB                                          │  │
│  │   Table: [agent-sessions__________]                │  │
│  │                                                     │  │
│  │ History Length:                                     │  │
│  │ Max Messages: [20___] (5-100)                      │  │
│  │ Max Tokens: [2000_] (500-4000)                     │  │
│  │                                                     │  │
│  │ Retention:                                          │  │
│  │ Session TTL: [24 hours ▼]                          │  │
│  │ ☑ Auto-cleanup expired sessions                     │  │
│  │                                                     │  │
│  │ Summarization:                                      │  │
│  │ ☑ Summarize long conversations                      │  │
│  │ Trigger: [After 10 messages ▼]                     │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  Context Window Management:                                 │
│  ☑ Sliding window (keep recent messages)                   │
│  ☐ Importance-based (keep important messages)              │
│  ☐ Semantic compression (summarize old messages)           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Step 7: Security & Guardrails
```
┌─────────────────────────────────────────────────────────────┐
│  Step 7: Security & Guardrails                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Input Validation:                                          │
│  ☑ Sanitize user input                                     │
│  ☑ Block malicious prompts (prompt injection)              │
│  ☑ Rate limiting (100 requests/minute)                     │
│  ☑ Content filtering (profanity, PII)                      │
│                                                             │
│  Output Validation:                                         │
│  ☑ Block sensitive information (API keys, passwords)       │
│  ☑ Content moderation (harmful content)                    │
│  ☑ Fact-checking (optional)                                │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ Custom Guardrails                                   │  │
│  │                                                     │  │
│  │ Blocked Topics:                                     │  │
│  │ • [Politics_____________________________] [Remove] │  │
│  │ • [Medical advice_______________________] [Remove] │  │
│  │ • [Financial advice_____________________] [Remove] │  │
│  │ [+ Add Topic]                                       │  │
│  │                                                     │  │
│  │ Required Disclaimers:                               │  │
│  │ ☑ "I'm an AI assistant"                             │  │
│  │ ☑ "Verify important information"                    │  │
│  │ ☐ Custom disclaimer                                 │  │
│  │                                                     │  │
│  │ Fallback Responses:                                 │  │
│  │ On blocked topic: [I cannot discuss that topic__]  │  │
│  │ On error: [I'm having trouble. Please try again_]  │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  Access Control:                                            │
│  Authentication: [API Key ▼]                               │
│  Authorization: [Role-based ▼]                             │
│  ☑ Log all interactions                                    │
│  ☑ Audit trail                                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Step 8: Monitoring & Logging
```
┌─────────────────────────────────────────────────────────────┐
│  Step 8: Monitoring & Logging                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Logging Configuration:                                     │
│  ○ CloudWatch Logs                                         │
│  ○ Custom logging service                                  │
│  ○ Both                                                    │
│                                                             │
│  Log Level: [INFO ▼]                                       │
│  (DEBUG, INFO, WARN, ERROR)                                │
│                                                             │
│  What to Log:                                               │
│  ☑ User inputs                                             │
│  ☑ Agent responses                                         │
│  ☑ Tool calls                                              │
│  ☑ RAG retrievals                                          │
│  ☑ Errors and exceptions                                   │
│  ☑ Performance metrics                                     │
│  ☐ Full conversation history                               │
│                                                             │
│  Metrics to Track:                                          │
│  ☑ Response time (latency)                                 │
│  ☑ Token usage                                             │
│  ☑ Cost per interaction                                    │
│  ☑ Success/failure rate                                    │
│  ☑ User satisfaction (if available)                        │
│                                                             │
│  Alerts:                                                    │
│  ☑ High error rate (> 5%)                                  │
│  ☑ High latency (> 5 seconds)                              │
│  ☑ High cost (> $100/day)                                  │
│  ☑ Security incidents                                      │
│                                                             │
│  Alert Destination:                                         │
│  Email: [admin@company.com______________]                  │
│  Slack: [#alerts-channel________________]                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```


---

### B. Bedrock Agent (AWS-Managed) - Simplified Configuration

#### Step 1: Basic Information (Same as Custom)
```
┌─────────────────────────────────────────────────────────────┐
│  Step 1: Basic Information                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Agent Name: [Customer Support Agent____________]          │
│                                                             │
│  Description:                                               │
│  [Assists customers with product questions and support___] │
│                                                             │
│  Foundation Model:                                          │
│  [Claude 3 Haiku ▼]                                        │
│  💰 Cost: $0.25/$1.25 per 1M tokens + $0.0007/request     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Step 2: Instructions (Simplified)
```
┌─────────────────────────────────────────────────────────────┐
│  Step 2: Instructions                                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Agent Instructions: *                                      │
│  [You are a helpful customer support agent. Assist______] │
│  [customers with product questions, technical support,__] │
│  [and account issues. Be professional and empathetic.___] │
│  [_____________________________________________________]   │
│                                                             │
│  💡 Tip: Be clear and specific. AWS Bedrock will handle    │
│     the orchestration, tool calling, and memory for you.   │
│                                                             │
│  ℹ️ AWS automatically handles:                              │
│  • Prompt engineering                                       │
│  • Multi-step reasoning                                     │
│  • Tool selection                                           │
│  • Context management                                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Step 3: Knowledge Bases (Simplified)
```
┌─────────────────────────────────────────────────────────────┐
│  Step 3: Knowledge Bases (Optional)                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Enable Knowledge Base: [ON/OFF]                            │
│                                                             │
│  Select Knowledge Bases:                                    │
│  ☑ Product Documentation (150 docs)                        │
│  ☑ FAQ Database (75 docs)                                  │
│  ☐ Support Tickets Archive (500 docs)                      │
│                                                             │
│  💡 Knowledge Bases are managed by AWS Bedrock              │
│     Upload documents in Vector DB Admin                     │
│                                                             │
│  Retrieval Settings:                                        │
│  Top K Results: [5____] (1-20)                             │
│                                                             │
│  ℹ️ AWS automatically handles:                              │
│  • Document chunking                                        │
│  • Embedding generation                                     │
│  • Semantic search                                          │
│  • Context injection                                        │
│  • Re-ranking                                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Step 4: Action Groups (Simplified)
```
┌─────────────────────────────────────────────────────────────┐
│  Step 4: Action Groups (Optional)                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Enable Actions: [ON/OFF]                                   │
│                                                             │
│  Select Action Groups:                                      │
│  ☑ Password Management                                     │
│    • reset_password                                         │
│    • change_password                                        │
│                                                             │
│  ☑ Order Management                                        │
│    • check_order_status                                     │
│    • cancel_order                                           │
│                                                             │
│  ☐ Account Management                                      │
│    • update_profile                                         │
│    • delete_account                                         │
│                                                             │
│  [+ Create New Action Group]                                │
│                                                             │
│  💡 Action Groups are Lambda functions or APIs              │
│     Define them once, use across multiple agents            │
│                                                             │
│  ℹ️ AWS automatically handles:                              │
│  • Tool selection (when to call)                            │
│  • Parameter extraction                                     │
│  • Error handling                                           │
│  • Result integration                                       │
│  • Multi-tool orchestration                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Step 5: Guardrails (Simplified)
```
┌─────────────────────────────────────────────────────────────┐
│  Step 5: Guardrails (Optional)                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Enable Guardrails: [ON/OFF]                                │
│                                                             │
│  Select Guardrail:                                          │
│  ○ Default (Basic content filtering)                       │
│  ○ Strict (Enhanced filtering + PII detection)             │
│  ○ Custom (Create your own)                                │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ Guardrail Configuration                             │  │
│  │                                                     │  │
│  │ Content Filters:                                    │  │
│  │ ☑ Hate speech                                       │  │
│  │ ☑ Insults                                           │  │
│  │ ☑ Sexual content                                    │  │
│  │ ☑ Violence                                          │  │
│  │                                                     │  │
│  │ PII Detection:                                      │  │
│  │ ☑ Email addresses                                   │  │
│  │ ☑ Phone numbers                                     │  │
│  │ ☑ Credit card numbers                               │  │
│  │ ☑ SSN                                               │  │
│  │                                                     │  │
│  │ Blocked Topics:                                     │  │
│  │ • [Medical advice_______] [Remove]                  │  │
│  │ • [Financial advice_____] [Remove]                  │  │
│  │ [+ Add Topic]                                       │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ℹ️ AWS automatically applies guardrails to:                │
│  • User inputs                                              │
│  • Agent outputs                                            │
│  • Retrieved context                                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Step 6: Review & Create
```
┌─────────────────────────────────────────────────────────────┐
│  Step 6: Review & Create                                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Agent Summary:                                             │
│                                                             │
│  Name: Customer Support Agent                               │
│  Model: Claude 3 Haiku                                      │
│  Knowledge Bases: 2 selected                                │
│  Action Groups: 2 selected                                  │
│  Guardrails: Enabled (Strict)                               │
│                                                             │
│  Estimated Cost:                                            │
│  • LLM: $0.25/$1.25 per 1M tokens                          │
│  • Agent: $0.0007 per request                              │
│  • Knowledge Base: $0.002 per query                        │
│  • Estimated monthly: $50-100 (1000 requests/day)          │
│                                                             │
│  AWS Will Automatically Handle:                             │
│  ✅ Orchestration & reasoning                               │
│  ✅ RAG (retrieval & context injection)                     │
│  ✅ Tool calling & chaining                                 │
│  ✅ Memory & session management                             │
│  ✅ Error handling & retries                                │
│  ✅ Monitoring & logging (CloudWatch)                       │
│  ✅ Auto-scaling                                            │
│                                                             │
│  [← Back]  [Create Agent]                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Side-by-Side Comparison

### Configuration Steps

| Step | Custom Agent (Bedrock Runtime) | Bedrock Agent (AWS-Managed) |
|------|-------------------------------|----------------------------|
| **1. Basic Info** | Name, description, model | Name, description, model |
| **2. Instructions** | Detailed prompt engineering | Simple instructions |
| **3. RAG** | Manual: Vector DB, embeddings, retrieval logic | Simple: Select Knowledge Bases |
| **4. Orchestration** | Manual: ReAct, CoT, custom loops | ❌ AWS handles automatically |
| **5. Tools** | Manual: API endpoints, Lambda, custom code | Simple: Select Action Groups |
| **6. Memory** | Manual: Redis, DB, DynamoDB setup | ❌ AWS handles automatically |
| **7. Security** | Manual: Input validation, output filtering | Simple: Select Guardrails |
| **8. Monitoring** | Manual: CloudWatch, custom logging | ❌ AWS handles automatically |
| **Total Steps** | 8 detailed steps | 5 simple steps |
| **Time to Create** | 30-60 minutes | 5-10 minutes |

