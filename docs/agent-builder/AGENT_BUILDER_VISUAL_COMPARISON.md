# Agent Builder - Visual Comparison

## Initial Choice Screen

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Create New Agent                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Choose how to build your agent:                                   │
│                                                                     │
│  ┌──────────────────────────────┐  ┌──────────────────────────────┐│
│  │ 🔧 Custom Agent              │  │ ⚡ Bedrock Agent (Quick)     ││
│  │ (Bedrock Runtime)            │  │ (AWS-Managed)                ││
│  │                              │  │                              ││
│  │ ✅ Full control              │  │ ✅ Quick setup (5-10 min)    ││
│  │ ✅ Custom orchestration      │  │ ✅ AWS-managed               ││
│  │ ✅ Unique features           │  │ ✅ Built-in RAG              ││
│  │ ✅ Your infrastructure       │  │ ✅ Built-in tools            ││
│  │ ✅ Lower per-request cost    │  │ ✅ Auto-scaling              ││
│  │                              │  │ ✅ Built-in monitoring       ││
│  │ ⚠️ More configuration        │  │ ⚠️ Less flexibility          ││
│  │ ⚠️ You maintain              │  │ ⚠️ AWS constraints           ││
│  │ ⚠️ 30-60 min setup           │  │ ⚠️ Higher per-request cost   ││
│  │                              │  │                              ││
│  │ [Select Custom]              │  │ [Select Bedrock Agent]       ││
│  └──────────────────────────────┘  └──────────────────────────────┘│
│                                                                     │
│  💡 Not sure? Use Bedrock Agent for standard use cases             │
│     or Custom Agent for unique requirements                        │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Configuration Steps Comparison

### Custom Agent (8 Steps)

```
Step 1: Basic Information
┌─────────────────────────────────────┐
│ Name: [___________________]         │
│ Description: [____________]         │
│ Model: [Claude 3 Haiku ▼]          │
└─────────────────────────────────────┘

Step 2: Prompt Engineering ⚠️
┌─────────────────────────────────────┐
│ System Prompt: *                    │
│ [You are a helpful assistant...]    │
│ [_________________________________] │
│                                     │
│ Temperature: [0.7_____]             │
│ Max Tokens: [2000____]              │
│ Top P: [0.9_______]                 │
└─────────────────────────────────────┘

Step 3: RAG Configuration ⚠️
┌─────────────────────────────────────┐
│ ⚠️ Manual RAG Setup Required        │
│                                     │
│ Vector DB: [Pinecone ▼]             │
│ API Key: [••••••••••]               │
│ Environment: [us-west1-gcp]         │
│ Index: [customer-support-kb]        │
│ Top K: [5____]                      │
│ Min Similarity: [0.70_]             │
│                                     │
│ You also need to implement:         │
│ • Embedding generation              │
│ • Vector search queries             │
│ • Context injection                 │
└─────────────────────────────────────┘

Step 4: Orchestration Logic ⚠️
┌─────────────────────────────────────┐
│ ⚠️ Custom Orchestration Required    │
│                                     │
│ Pattern:                            │
│ ○ Simple                            │
│ ○ ReAct                             │
│ ○ Chain-of-Thought                  │
│ ○ Multi-step (Custom)               │
│                                     │
│ Max Iterations: [5____]             │
│ Error Handling: [Retry 3x ▼]       │
└─────────────────────────────────────┘

Step 5: Tools & Functions ⚠️
┌─────────────────────────────────────┐
│ ⚠️ Manual Tool Implementation       │
│                                     │
│ Tool 1: Reset Password              │
│ • Function: [reset_password]        │
│ • Implementation:                   │
│   ○ API Endpoint                    │
│   ○ Lambda Function                 │
│   ○ Custom Code                     │
│                                     │
│ [+ Add Tool]                        │
└─────────────────────────────────────┘

Step 6: Memory & Sessions ⚠️
┌─────────────────────────────────────┐
│ ⚠️ Manual Memory Setup Required     │
│                                     │
│ Storage:                            │
│ ○ Redis                             │
│ ○ PostgreSQL                        │
│ ○ DynamoDB                          │
│                                     │
│ Max Messages: [20___]               │
│ Session TTL: [24 hours ▼]          │
└─────────────────────────────────────┘

Step 7: Security & Guardrails ⚠️
┌─────────────────────────────────────┐
│ ⚠️ Manual Security Setup            │
│                                     │
│ ☑ Input validation                  │
│ ☑ Output filtering                  │
│ ☑ Rate limiting (100/min)           │
│ ☑ Content filtering                 │
│                                     │
│ Blocked Topics:                     │
│ • [Medical advice] [Remove]         │
│ • [Financial advice] [Remove]       │
└─────────────────────────────────────┘

Step 8: Monitoring & Logging ⚠️
┌─────────────────────────────────────┐
│ ⚠️ Manual Monitoring Setup          │
│                                     │
│ Logging: [CloudWatch ▼]             │
│ Log Level: [INFO ▼]                 │
│                                     │
│ ☑ User inputs                       │
│ ☑ Agent responses                   │
│ ☑ Tool calls                        │
│ ☑ Errors                            │
│                                     │
│ Alerts: [admin@company.com]         │
└─────────────────────────────────────┘
```

---

### Bedrock Agent (5 Steps)

```
Step 1: Basic Information
┌─────────────────────────────────────┐
│ Name: [___________________]         │
│ Description: [____________]         │
│ Model: [Claude 3 Haiku ▼]          │
└─────────────────────────────────────┘

Step 2: Instructions ✅
┌─────────────────────────────────────┐
│ ✅ Simplified Configuration         │
│                                     │
│ Instructions: *                     │
│ [You are a helpful customer...]     │
│ [_________________________________] │
│                                     │
│ ℹ️ AWS automatically handles:       │
│ • Prompt engineering                │
│ • Multi-step reasoning              │
│ • Tool selection                    │
│ • Context management                │
└─────────────────────────────────────┘

Step 3: Knowledge Bases ✅
┌─────────────────────────────────────┐
│ ✅ Built-in RAG                     │
│                                     │
│ Select Knowledge Bases:             │
│ ☑ Product Documentation (150)      │
│ ☑ FAQ Database (75)                 │
│ ☐ Support Tickets (500)             │
│                                     │
│ Top K: [5____]                      │
│                                     │
│ ℹ️ AWS automatically handles:       │
│ • Document chunking                 │
│ • Embedding generation              │
│ • Semantic search                   │
│ • Context injection                 │
│ • Re-ranking                        │
└─────────────────────────────────────┘

Step 4: Action Groups ✅
┌─────────────────────────────────────┐
│ ✅ Built-in Tool Calling            │
│                                     │
│ Select Action Groups:               │
│ ☑ Password Management               │
│   • reset_password                  │
│   • change_password                 │
│                                     │
│ ☑ Order Management                  │
│   • check_order_status              │
│   • cancel_order                    │
│                                     │
│ ℹ️ AWS automatically handles:       │
│ • Tool selection                    │
│ • Parameter extraction              │
│ • Error handling                    │
│ • Result integration                │
└─────────────────────────────────────┘

Step 5: Guardrails ✅
┌─────────────────────────────────────┐
│ ✅ Built-in Security                │
│                                     │
│ Select Guardrail:                   │
│ ○ Default (Basic filtering)         │
│ ○ Strict (Enhanced + PII)           │
│ ○ Custom                            │
│                                     │
│ Content Filters:                    │
│ ☑ Hate speech                       │
│ ☑ Sexual content                    │
│ ☑ Violence                          │
│                                     │
│ PII Detection:                      │
│ ☑ Email, Phone, SSN                 │
│                                     │
│ ℹ️ AWS automatically applies to:    │
│ • User inputs                       │
│ • Agent outputs                     │
│ • Retrieved context                 │
└─────────────────────────────────────┘

Step 6: Review & Create ✅
┌─────────────────────────────────────┐
│ ✅ Ready to Deploy                  │
│                                     │
│ Agent Summary:                      │
│ • Name: Customer Support Agent      │
│ • Model: Claude 3 Haiku             │
│ • Knowledge Bases: 2 selected       │
│ • Action Groups: 2 selected         │
│ • Guardrails: Enabled               │
│                                     │
│ AWS Will Automatically Handle:      │
│ ✅ Orchestration & reasoning        │
│ ✅ RAG (retrieval & context)        │
│ ✅ Tool calling & chaining          │
│ ✅ Memory & sessions                │
│ ✅ Error handling                   │
│ ✅ Monitoring (CloudWatch)          │
│ ✅ Auto-scaling                     │
│                                     │
│ [Create Agent]                      │
└─────────────────────────────────────┘
```

---

## Side-by-Side Summary

| Aspect | Custom Agent | Bedrock Agent |
|--------|-------------|---------------|
| **Steps** | 8 steps | 5 steps |
| **Time** | 30-60 min | 5-10 min |
| **Complexity** | High ⚠️ | Low ✅ |
| **RAG Setup** | Manual ⚠️ | Select KBs ✅ |
| **Orchestration** | Custom code ⚠️ | AWS handles ✅ |
| **Tools** | Implement ⚠️ | Select ✅ |
| **Memory** | Configure ⚠️ | AWS handles ✅ |
| **Security** | Implement ⚠️ | Select ✅ |
| **Monitoring** | Setup ⚠️ | AWS handles ✅ |
| **Control** | Full ✅ | Limited ⚠️ |
| **Flexibility** | High ✅ | Low ⚠️ |
| **Maintenance** | You ⚠️ | AWS ✅ |
| **Cost/request** | Lower ✅ | Higher ⚠️ |

---

## When to Use Each

### Use Custom Agent When:
✅ You need unique orchestration logic  
✅ You want full control  
✅ You have custom requirements  
✅ You want to minimize per-request costs  
✅ You need specific agent types (Purpose-Driven, Hybrid, etc.)  

### Use Bedrock Agent When:
✅ You want quick setup  
✅ Standard use cases (support, Q&A, search)  
✅ You prefer AWS-managed infrastructure  
✅ You want built-in monitoring  
✅ You need auto-scaling  

---

## User Experience

### Custom Agent User:
"I need to configure everything manually, but I get full control and can build exactly what I need."

### Bedrock Agent User:
"I just select what I need, and AWS handles the rest. Quick and easy!"

Both are valid choices depending on requirements! 🎯
