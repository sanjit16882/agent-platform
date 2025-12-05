# Agent Templates Guide

## ✅ Task 10: Agent Templates - COMPLETE

Agent templates are now fully integrated into the Agent Builder!

## 🎯 How to Use Templates

### Access the Agent Builder
1. Start your application (frontend on port 4001)
2. Navigate to: `http://localhost:4001/agent-builder`
3. You'll see the **template selector** at the top

### Choose a Template

You'll see 6 options:

#### 1. 💬 Simple Chatbot
- **Configuration:** Bedrock Only
- **Cost:** $0.50/1K queries
- **Latency:** 500ms
- **Use Case:** Basic Q&A, simple conversations
- **Pre-configured:**
  - Model: Claude 3 Haiku
  - Vector DB: Disabled
  - MCP: Disabled

#### 2. 📚 FAQ Bot
- **Configuration:** Vector DB (RAG)
- **Cost:** $0.75/1K queries
- **Latency:** 700ms
- **Use Case:** Documentation search, knowledge base queries
- **Pre-configured:**
  - Model: Claude 3 Haiku
  - Vector DB: Enabled ✅
  - MCP: Disabled
  - TopK: 5, MinSimilarity: 0.7

#### 3. 💻 Code Assistant
- **Configuration:** Vector DB + MCP (Full Stack)
- **Cost:** $0.85/1K queries
- **Latency:** 1200ms
- **Use Case:** Code review, API integration
- **Pre-configured:**
  - Model: Claude 3 Sonnet
  - Vector DB: Enabled ✅
  - MCP: Enabled ✅
  - TopK: 10, MinSimilarity: 0.6

#### 4. 📊 Data Analyst
- **Configuration:** MCP Only
- **Cost:** $0.60/1K queries
- **Latency:** 1000ms
- **Use Case:** SQL queries, data analysis
- **Pre-configured:**
  - Model: Claude 3 Sonnet
  - Vector DB: Disabled
  - MCP: Enabled ✅
  - Temperature: 0.3 (for accuracy)

#### 5. 🎧 Customer Support
- **Configuration:** Vector DB + MCP (Full Stack)
- **Cost:** $0.85/1K queries
- **Latency:** 1200ms
- **Use Case:** Support tickets, escalation handling
- **Pre-configured:**
  - Model: Claude 3 Sonnet
  - Vector DB: Enabled ✅
  - MCP: Enabled ✅

#### 6. ⚙️ Custom Agent
- **Configuration:** Start from scratch
- **Pre-configured:** Nothing
- **Use Case:** Full control over all settings

## 🚀 User Flow

### With Template (Fast):
1. Go to `/agent-builder`
2. Click **"FAQ Bot"** template
3. Form pre-fills with optimal settings
4. Select your knowledge bases
5. Click "Create Agent"
⏱️ **Time: 30 seconds**

### Without Template (Manual):
1. Go to `/agent-builder`
2. Click "Skip Templates"
3. Fill everything manually
4. Configure Vector DB manually
5. Configure MCP manually
6. Click "Create Agent"
⏱️ **Time: 5-10 minutes**

## ✨ What Happens When You Select a Template

The system automatically:
- ✅ Pre-fills agent name
- ✅ Pre-fills description
- ✅ Pre-fills processing logic
- ✅ Enables/disables Vector DB
- ✅ Enables/disables MCP
- ✅ Sets optimal model
- ✅ Sets optimal temperature
- ✅ Sets optimal retrieval config
- ✅ Stores template name in metadata

## 🔧 Customization

After selecting a template, you can:
- ✅ Change the agent name
- ✅ Modify the description
- ✅ Edit processing logic
- ✅ Select different knowledge bases
- ✅ Select different MCP servers
- ✅ Adjust retrieval settings
- ✅ Change the model
- ✅ Switch templates (click "Change Template")

## 📊 Template Comparison

| Template | Vector DB | MCP | Cost | Latency | Complexity |
|----------|-----------|-----|------|---------|------------|
| Simple Chatbot | ❌ | ❌ | $0.50 | 500ms | Simple |
| FAQ Bot | ✅ | ❌ | $0.75 | 700ms | Medium |
| Code Assistant | ✅ | ✅ | $0.85 | 1200ms | Complex |
| Data Analyst | ❌ | ✅ | $0.60 | 1000ms | Medium |
| Customer Support | ✅ | ✅ | $0.85 | 1200ms | Complex |

## 💾 Metadata Storage

When you create an agent from a template, the system stores:

```json
{
  "templateId": "faq-bot",
  "templateName": "FAQ Bot",
  "vectorDBConfig": {
    "enabled": true,
    "provider": "opensearch",
    "knowledgeBases": ["kb-1"],
    "retrievalConfig": {
      "topK": 5,
      "minSimilarity": 0.7
    }
  },
  "mcpConfig": {
    "enabled": false
  }
}
```

## ✅ Task 10 Completion Checklist

- ✅ 10.1 - AgentTemplateSelector component (already existed)
- ✅ 10.2 - All 5 templates defined + Custom option
- ✅ 10.3 - Template selection integrated into NLPAgentBuilder
- ✅ 10.4 - Template preview with all details
- ✅ 10.5 - Ready for testing

## 🧪 Testing Checklist

Test each template:
- [ ] Simple Chatbot - Creates Bedrock-only agent
- [ ] FAQ Bot - Creates agent with Vector DB enabled
- [ ] Code Assistant - Creates agent with Vector DB + MCP
- [ ] Data Analyst - Creates agent with MCP only
- [ ] Customer Support - Creates agent with Vector DB + MCP
- [ ] Custom Agent - Starts with blank form
- [ ] Change Template - Can switch templates
- [ ] Modify Settings - Can customize after template selection

## 🎉 Complete!

Task 10 is fully implemented and ready to use at `/agent-builder`!
