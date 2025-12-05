# Amazon Bedrock Agents - Core Features (Official AWS Service)

## Official AWS Service: Amazon Bedrock Agents

**Service URL:** https://aws.amazon.com/bedrock/agents/
**Documentation:** https://docs.aws.amazon.com/bedrock/latest/userguide/agents.html

---

## 🎯 Core Features (What AWS Actually Provides)

### 1. **Intelligent Orchestration & Reasoning**

#### Automatic Task Decomposition
**What it does:**
- Breaks down complex user requests into steps
- Creates a plan to accomplish the task
- Executes steps in the right order
- Adapts based on results

**Example:**
```
User: "Find our top customer and send them a thank you email"

Agent automatically:
1. Queries knowledge base for customer data
2. Analyzes to find top customer
3. Calls action group to get email template
4. Calls action group to send email
5. Confirms completion
```

**AWS API:**
```typescript
// You just invoke the agent, AWS handles orchestration
const response = await bedrockAgentRuntime.invokeAgent({
  agentId: 'AGENT123',
  sessionId: 'session-456',
  inputText: 'Find our top customer and send them a thank you email'
});

// AWS automatically orchestrates all the steps!
```

---

### 2. **Action Groups (API & Lambda Integration)**

#### Native API Integration
**What it does:**
- Connects agents to your APIs and Lambda functions
- Automatically extracts parameters from user queries
- Calls APIs at the right time
- Handles responses and errors

**How it works:**
```typescript
// Define action group with OpenAPI schema
const actionGroup = {
  actionGroupName: 'CustomerAPI',
  description: 'Manage customer data',
  
  // Provide OpenAPI spec
  apiSchema: {
    openapi: '3.0.0',
    paths: {
      '/customers/{id}': {
        get: {
          description: 'Get customer by ID',
          parameters: [
            { name: 'id', in: 'path', required: true }
          ]
        }
      },
      '/customers': {
        post: {
          description: 'Create new customer',
          requestBody: { /* ... */ }
        }
      }
    }
  },
  
  // Lambda function to execute
  actionGroupExecutor: {
    lambda: 'arn:aws:lambda:us-east-1:123456789:function:customer-api'
  }
};

// AWS automatically:
// 1. Understands when to call this API
// 2. Extracts parameters from user query
// 3. Calls your Lambda function
// 4. Processes the response
```

**Real Example:**
```
User: "What's the email for customer ID 12345?"

AWS Bedrock Agent:
1. Recognizes need to call CustomerAPI
2. Extracts parameter: id=12345
3. Calls GET /customers/12345
4. Gets response: { email: "john@example.com" }
5. Responds: "The email for customer 12345 is john@example.com"
```

---

### 3. **Knowledge Base Integration (RAG)**

#### Automatic Retrieval Augmented Generation
**What it does:**
- Automatically searches knowledge bases when needed
- Retrieves relevant documents
- Grounds responses in your data
- Provides citations

**How it works:**
```typescript
// Associate knowledge base with agent
await bedrockAgent.associateAgentKnowledgeBase({
  agentId: 'AGENT123',
  knowledgeBaseId: 'KB456',
  description: 'Product documentation and FAQs'
});

// Agent automatically queries KB when relevant
```

**Real Example:**
```
User: "How do I reset my password?"

AWS Bedrock Agent:
1. Recognizes this needs documentation
2. Automatically queries knowledge base
3. Retrieves relevant docs about password reset
4. Synthesizes answer from retrieved content
5. Responds with answer + citations

Response: "To reset your password:
1. Click 'Forgot Password' on login page
2. Enter your email
3. Check email for reset link
[Source: User Guide, page 23]"
```

**Features:**
- Automatic relevance detection
- Multi-document retrieval
- Citation tracking
- Semantic search

---

### 4. **Session Memory & Context Management**

#### Automatic Conversation Context
**What it does:**
- Remembers conversation history
- Maintains context across turns
- Summarizes long conversations
- Tracks user preferences

**How it works:**
```typescript
// Session is automatically managed
const response1 = await invokeAgent({
  agentId: 'AGENT123',
  sessionId: 'session-789',
  inputText: 'My name is John'
});

// Later in same session...
const response2 = await invokeAgent({
  agentId: 'AGENT123',
  sessionId: 'session-789', // Same session
  inputText: 'What is my name?'
});

// Agent remembers: "Your name is John"
```

**Features:**
- Automatic context retention
- Session summarization
- Memory retrieval
- Context window management

---

### 5. **Multi-Step Reasoning & Planning**

#### Chain-of-Thought Processing
**What it does:**
- Creates execution plans
- Reasons through problems
- Makes decisions
- Handles complex logic

**Example:**
```
User: "Compare our Q1 and Q2 sales and recommend actions"

Agent's reasoning (automatic):
1. Need Q1 sales data → Query knowledge base
2. Need Q2 sales data → Query knowledge base
3. Compare the numbers → Internal reasoning
4. Identify trends → Analysis
5. Generate recommendations → Synthesis
6. Present findings → Response
```

**Trace Output:**
```json
{
  "trace": {
    "orchestrationTrace": [
      {
        "rationale": "I need to retrieve Q1 sales data",
        "invocationType": "KNOWLEDGE_BASE",
        "observation": "Q1 sales: $1.2M"
      },
      {
        "rationale": "I need to retrieve Q2 sales data",
        "invocationType": "KNOWLEDGE_BASE",
        "observation": "Q2 sales: $1.5M"
      },
      {
        "rationale": "Q2 shows 25% growth. This is positive.",
        "invocationType": "FINISH",
        "finalResponse": "Q2 sales increased 25% to $1.5M..."
      }
    ]
  }
}
```

---

### 6. **Guardrails Integration**

#### Built-in Safety Controls
**What it does:**
- Content filtering
- PII detection and redaction
- Topic restrictions
- Toxicity prevention
- Hallucination detection

**How it works:**
```typescript
// Attach guardrail to agent
const agent = await bedrockAgent.createAgent({
  agentName: 'Customer Support',
  guardrailConfiguration: {
    guardrailIdentifier: 'guardrail-pii-filter',
    guardrailVersion: 'DRAFT'
  }
});

// All responses automatically filtered
```

**Features:**
- Automatic PII redaction
- Content policy enforcement
- Topic blocking
- Sensitive data protection

---

### 7. **Streaming Responses**

#### Real-time Response Generation
**What it does:**
- Streams responses as they're generated
- Provides real-time feedback
- Shows reasoning steps
- Better user experience

**How it works:**
```typescript
const response = await bedrockAgentRuntime.invokeAgent({
  agentId: 'AGENT123',
  sessionId: 'session-456',
  inputText: 'Explain quantum computing',
  enableTrace: true
});

// Stream events as they arrive
for await (const event of response.completion) {
  if (event.chunk) {
    // Text chunk
    const text = new TextDecoder().decode(event.chunk.bytes);
    console.log(text);
  }
  
  if (event.trace) {
    // Reasoning step
    console.log('Agent is thinking:', event.trace);
  }
}
```

---

### 8. **Prompt Templates & Customization**

#### Customizable Agent Behavior
**What it does:**
- Define agent personality
- Set response style
- Control behavior
- Add constraints

**How it works:**
```typescript
const agent = await bedrockAgent.createAgent({
  agentName: 'Support Bot',
  
  // Base instruction
  instruction: `You are a helpful customer support agent.
  
  Guidelines:
  - Be friendly and professional
  - Always verify customer identity first
  - Escalate complex issues to human agents
  - Never share sensitive information
  - Provide step-by-step instructions`,
  
  // Advanced prompt override (optional)
  promptOverrideConfiguration: {
    promptConfigurations: [
      {
        promptType: 'PRE_PROCESSING',
        promptCreationMode: 'OVERRIDDEN',
        promptState: 'ENABLED',
        basePromptTemplate: 'Custom pre-processing prompt...'
      }
    ]
  }
});
```

---

### 9. **Agent Aliases & Versioning**

#### Production Deployment Management
**What it does:**
- Create agent versions
- Deploy to aliases
- A/B testing
- Rollback capability

**How it works:**
```typescript
// Prepare agent (creates version)
await bedrockAgent.prepareAgent({
  agentId: 'AGENT123'
});

// Create production alias
await bedrockAgent.createAgentAlias({
  agentId: 'AGENT123',
  agentAliasName: 'production',
  description: 'Production version'
});

// Create test alias
await bedrockAgent.createAgentAlias({
  agentId: 'AGENT123',
  agentAliasName: 'test',
  description: 'Testing version'
});

// Invoke specific version
await invokeAgent({
  agentId: 'AGENT123',
  agentAliasId: 'production', // or 'test'
  inputText: 'Hello'
});
```

---

### 10. **Trace & Observability**

#### Built-in Debugging & Monitoring
**What it does:**
- Shows agent reasoning
- Tracks API calls
- Monitors performance
- Debugging information

**Trace Information:**
```json
{
  "trace": {
    "orchestrationTrace": {
      "rationale": "User wants to know about pricing",
      "invocationType": "KNOWLEDGE_BASE",
      "observation": "Retrieved pricing document"
    },
    "knowledgeBaseLookup": {
      "retrievedReferences": [
        {
          "content": "Pricing starts at $99/month",
          "location": {
            "s3Location": "s3://docs/pricing.pdf"
          }
        }
      ]
    },
    "actionGroupInvocation": {
      "actionGroupName": "PricingAPI",
      "apiPath": "/pricing/calculate",
      "executionType": "LAMBDA",
      "invocationInput": {
        "parameters": [
          { "name": "plan", "value": "enterprise" }
        ]
      }
    }
  }
}
```

---

## 📊 Feature Comparison Table

| Feature | Description | Benefit |
|---------|-------------|---------|
| **Orchestration** | Automatic task planning | No manual workflow code |
| **Action Groups** | API/Lambda integration | Easy tool integration |
| **Knowledge Bases** | Automatic RAG | No custom vector DB code |
| **Session Memory** | Context management | Multi-turn conversations |
| **Reasoning** | Chain-of-thought | Complex problem solving |
| **Guardrails** | Safety controls | Built-in protection |
| **Streaming** | Real-time responses | Better UX |
| **Prompt Templates** | Customization | Control behavior |
| **Versioning** | Deployment management | Safe updates |
| **Tracing** | Observability | Easy debugging |

---

## 🔧 Technical Capabilities

### Supported Foundation Models
- Claude 3.5 Sonnet
- Claude 3 Sonnet
- Claude 3 Haiku
- Claude 2.1
- Claude 2.0
- Claude Instant

### Supported Action Types
- AWS Lambda functions
- API Gateway endpoints
- Return of control (custom handling)

### Supported Knowledge Base Types
- Amazon OpenSearch Serverless
- Amazon Aurora PostgreSQL (pgvector)
- Pinecone
- Redis Enterprise Cloud

### Session Management
- Automatic session creation
- Session TTL configuration (60-3600 seconds)
- Session memory retrieval
- Session deletion

---

## 💰 Pricing Breakdown

### Agent Invocation
- **$0.00070 per request**
- Includes orchestration, reasoning, and execution

### Additional Costs
- **Foundation Model:** Token-based pricing
- **Knowledge Base:** $0.002 per query
- **Action Groups:** Lambda execution costs
- **Guardrails:** $0.75 per 1,000 text units

### Example Cost Calculation
```
Scenario: 10,000 agent invocations per month

Agent requests:     10,000 × $0.00070 = $7.00
LLM tokens:         5M tokens (Haiku) = $7.50
KB queries:         5,000 × $0.002 = $10.00
Lambda calls:       2,000 × $0.0000002 = $0.40
Guardrails:         10,000 × $0.00075 = $7.50

Total: ~$32.40/month
```

---

## 🚀 Real-World Use Cases

### 1. Customer Support Agent
**Features Used:**
- Knowledge Base (FAQs, docs)
- Action Groups (CRM API, ticket system)
- Session Memory (conversation context)
- Guardrails (PII protection)

### 2. DevOps Automation Agent
**Features Used:**
- Action Groups (AWS APIs, deployment tools)
- Reasoning (multi-step workflows)
- Tracing (debugging)

### 3. Data Analysis Agent
**Features Used:**
- Knowledge Base (reports, data)
- Action Groups (database queries)
- Reasoning (analysis and insights)

### 4. Sales Assistant Agent
**Features Used:**
- Knowledge Base (product catalog)
- Action Groups (CRM, pricing API)
- Session Memory (customer context)
- Prompt Templates (sales personality)

---

## 📝 Code Example: Complete Agent Setup

```typescript
import { 
  BedrockAgentClient,
  CreateAgentCommand,
  CreateAgentActionGroupCommand,
  AssociateAgentKnowledgeBaseCommand,
  PrepareAgentCommand
} from '@aws-sdk/client-bedrock-agent';

import {
  BedrockAgentRuntimeClient,
  InvokeAgentCommand
} from '@aws-sdk/client-bedrock-agent-runtime';

// 1. Create agent
const agentClient = new BedrockAgentClient({ region: 'us-east-1' });

const agent = await agentClient.send(new CreateAgentCommand({
  agentName: 'Customer Support Agent',
  description: 'Helps customers with product questions',
  instruction: 'You are a helpful customer support agent...',
  foundationModel: 'anthropic.claude-3-haiku-20240307-v1:0',
  agentResourceRoleArn: 'arn:aws:iam::123456789:role/BedrockAgentRole',
  idleSessionTTLInSeconds: 600
}));

const agentId = agent.agent.agentId;

// 2. Add action group
await agentClient.send(new CreateAgentActionGroupCommand({
  agentId,
  agentVersion: 'DRAFT',
  actionGroupName: 'CustomerAPI',
  description: 'Customer management operations',
  actionGroupExecutor: {
    lambda: 'arn:aws:lambda:us-east-1:123456789:function:customer-api'
  },
  apiSchema: {
    payload: JSON.stringify({
      openapi: '3.0.0',
      paths: {
        '/customers/{id}': {
          get: { description: 'Get customer by ID' }
        }
      }
    })
  }
}));

// 3. Associate knowledge base
await agentClient.send(new AssociateAgentKnowledgeBaseCommand({
  agentId,
  agentVersion: 'DRAFT',
  knowledgeBaseId: 'KB123456',
  description: 'Product documentation'
}));

// 4. Prepare agent
await agentClient.send(new PrepareAgentCommand({ agentId }));

// 5. Invoke agent
const runtimeClient = new BedrockAgentRuntimeClient({ region: 'us-east-1' });

const response = await runtimeClient.send(new InvokeAgentCommand({
  agentId,
  agentAliasId: 'TSTALIASID',
  sessionId: 'session-123',
  inputText: 'What are the features of product X?',
  enableTrace: true
}));

// 6. Process streaming response
for await (const event of response.completion) {
  if (event.chunk) {
    const text = new TextDecoder().decode(event.chunk.bytes);
    console.log('Response:', text);
  }
  
  if (event.trace) {
    console.log('Trace:', JSON.stringify(event.trace, null, 2));
  }
}
```

---

## 🎯 Summary: Core Features

**Amazon Bedrock Agents provides:**

1. ✅ **Automatic Orchestration** - No manual workflow code
2. ✅ **Action Groups** - Easy API/Lambda integration
3. ✅ **Knowledge Bases** - Built-in RAG
4. ✅ **Session Memory** - Automatic context management
5. ✅ **Multi-Step Reasoning** - Complex problem solving
6. ✅ **Guardrails** - Built-in safety
7. ✅ **Streaming** - Real-time responses
8. ✅ **Customization** - Prompt templates
9. ✅ **Versioning** - Production deployment
10. ✅ **Observability** - Built-in tracing

**All for $0.00070 per request!**

This is what makes Bedrock Agents powerful - you get enterprise-grade agent orchestration without building it yourself!
