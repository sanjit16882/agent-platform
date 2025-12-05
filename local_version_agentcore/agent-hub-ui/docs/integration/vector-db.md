# Vector DB Integration Guide

## ✅ Vector DB is Already Integrated!

The Vector DB (RAG) functionality is **already integrated** into the existing **Agent Builder** page.

## 🎯 How to Access

### Option 1: Navigation Bar
1. Start your application:
   - Backend: `cd local_version/agent-hub-backend && npm start` (port 4002)
   - Frontend: `cd local_version/agent-hub-ui && npm start` (port 4001)

2. Open browser: `http://localhost:4001`

3. Click **"Agent Builder"** in the navigation bar

### Option 2: Direct URL
```
http://localhost:4001/agent-builder
```

## 📋 What You'll See

The Agent Builder includes:

1. **Agent Description** - Describe what your agent does
2. **Agent Name** - Name your agent
3. **Processing Logic** - Define how it processes inputs
4. **MCP Integration** - Optional external tools
5. **AI Model Selection** - Choose Bedrock model
6. **Knowledge Base (Vector DB)** ← This is the new feature!
   - Toggle to enable/disable
   - Provider selection
   - Knowledge base selection
   - Retrieval configuration

## 🎨 Vector DB Features

When you scroll down in the Agent Builder, you'll see:

**Knowledge Base (Optional)** card with:
- ✅ Enable/Disable toggle
- ✅ Provider selection (OpenSearch, Pinecone, Pgvector, Mock)
- ✅ Knowledge base multi-select
- ✅ Documents to retrieve slider (topK)
- ✅ Minimum similarity slider
- ✅ Cost impact display (+$0.25 per 1K queries)
- ✅ Latency impact display (+200ms)

## 🚀 Quick Start

1. Go to `/agent-builder`
2. Fill in agent description and name
3. Scroll down to **"Knowledge Base (Optional)"** section
4. Toggle the switch to enable Vector DB
5. Select knowledge bases
6. Adjust retrieval settings
7. Create your agent!

## 💡 Why One Page?

We integrated Vector DB into the existing Agent Builder because:
- ✅ No duplicate pages
- ✅ One clear place to create agents
- ✅ All features in one location
- ✅ Easier to maintain
- ✅ Better user experience

## 📍 Page Locations

- **Agent Builder** (`/agent-builder`) - Create agents with Vector DB, MCP, and LLM
- **Hybrid Builder** (`/hybrid-builder`) - Create workflow-based multi-component agents
- **Knowledge Bases** (`/knowledge-bases`) - Manage Vector DB indexes

## ✅ Task 9 Complete!

Task 9 was already complete - the NLPAgentBuilder already had:
- ✅ VectorDBConfigSection component integrated
- ✅ Vector DB state management
- ✅ Cost and latency tracking
- ✅ MCP integration
- ✅ Bedrock model selection

No duplicate page needed! 🎉
