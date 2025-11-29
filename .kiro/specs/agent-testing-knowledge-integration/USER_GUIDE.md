# Agent Testing Knowledge Integration - User Guide

## Overview

The Agent Testing Knowledge Integration feature allows you to test your AI agents with Vector DB (RAG) and MCP (Model Context Protocol) capabilities. This enables comprehensive testing of agents that use knowledge bases and external tools, not just direct LLM responses.

## Key Features

- **Vector DB Integration**: Test agents with Retrieval-Augmented Generation (RAG)
- **MCP Integration**: Test agents with external tool execution
- **Auto-Population**: Agent's existing configurations automatically populate
- **Flexible Testing**: Test with or without knowledge sources
- **Transparent Results**: See which knowledge source provided each answer
- **Performance Metrics**: Track latency and cost for each source

## Execution Modes

The system supports four execution modes:

1. **LLM Only**: Direct LLM responses (fastest, cheapest)
2. **RAG Mode**: Vector DB → LLM with context
3. **MCP Mode**: MCP tools → LLM with context
4. **Full-stack Mode**: Vector DB → MCP → LLM (most powerful)

## Workflow

### Step 1: Select Agent
Choose the agent you want to test from your agent catalog.

### Step 2: Select Models
Choose one or more AI models to test (e.g., Claude 3.5 Sonnet, GPT-4).

### Step 3: Configure Knowledge Sources (Optional)

This is the new step where you configure Vector DB and MCP integration.

#### Vector DB Configuration

1. **Enable Vector DB**: Toggle the Vector DB switch to ON
2. **Select Knowledge Bases**: Check the knowledge bases you want to use
3. **Configure Retrieval Settings**:
   - **Top-K**: Number of documents to retrieve (1-10)
     - Higher values provide more context but increase latency
     - Recommended: 5 documents
   - **Min Similarity**: Minimum similarity threshold (0.0-1.0)
     - Higher values return only highly relevant documents
     - Recommended: 0.7

#### MCP Configuration

1. **Enable MCP**: Toggle the MCP switch to ON
2. **Select MCP Servers**: Check the MCP servers you want to use
   - Filesystem: File operations
   - Git: Version control operations
   - Database: Database queries

#### Auto-Population

If your agent already has Vector DB or MCP configured:
- Settings will automatically populate with the agent's configuration
- You'll see a green badge: "✓ Agent has knowledge sources configured"
- You can use these defaults or customize them for testing

#### Skip Option

If you don't need knowledge sources:
- Click "Skip (LLM Only)" to proceed with direct LLM testing
- This is the fastest option and uses the least resources

### Step 4-6: Select Tests, Provide Input, Review
Continue with the standard testing workflow.

### Step 7: Execute Tests

During execution, you'll see:
- **Execution Mode**: LLM-only, RAG, MCP, or Full-stack
- **Knowledge Sources Enabled**: Which sources are active
- **Real-time Progress**: Current test being executed

### Step 8: View Results

Results include:

#### Knowledge Source Badges
Each test result shows a badge indicating which source provided the answer:
- 📚 **Vector DB**: Answer came from knowledge base
- 🔌 **MCP**: Answer came from MCP tool execution
- 🔄 **Hybrid**: Answer used context from RAG/MCP + LLM
- 🤖 **LLM**: Direct LLM response

#### Knowledge Source Metrics
For tests that used knowledge sources, you'll see:
- **Retrieved Documents**: Number of documents found in Vector DB
- **MCP Tools Used**: List of tools that were executed
- **Latency Breakdown**:
  - Vector DB search time
  - MCP execution time
  - LLM generation time
  - Total time

#### Export Options
All knowledge source data is included in exports:
- **JSON**: Complete data with all metrics
- **CSV**: Tabular format with knowledge source columns
- **HTML**: Formatted report with knowledge source information

## Execution Flow

### With Vector DB + MCP + LLM (Full-stack Mode)

```
Query received
    ↓
1. Search Vector DB
    ├─ High confidence (>0.9 similarity) → Return directly ✓
    └─ Low confidence → Continue
    ↓
2. Execute MCP Tools
    ├─ Tool provides answer → Return directly ✓
    └─ No answer → Continue
    ↓
3. Call LLM with context
    ├─ Include retrieved documents (if any)
    ├─ Include MCP data (if any)
    └─ Return response (marked as 'hybrid')
```

### Performance Impact

**Estimated Latency:**
- Vector DB: +200-300ms
- MCP: +100-500ms (varies by tool)
- LLM with context: +50-100ms

**Estimated Cost:**
- Vector DB: +$0.10 per 1K queries
- MCP: Variable (depends on tool)
- Total: +$0.20-0.40 per 1K queries

## Best Practices

### When to Use Vector DB
- Testing agents that need domain-specific knowledge
- Validating RAG accuracy and relevance
- Testing with large knowledge bases
- Ensuring agents cite correct information

### When to Use MCP
- Testing agents that use external tools
- Validating tool selection and execution
- Testing filesystem, git, or database operations
- Ensuring proper error handling

### When to Use Full-stack Mode
- Comprehensive testing of production agents
- Validating complex workflows
- Testing agents that combine knowledge + tools
- End-to-end integration testing

### When to Skip (LLM Only)
- Quick smoke tests
- Testing pure reasoning capabilities
- Baseline performance testing
- Cost-sensitive testing scenarios

## Troubleshooting

### No Knowledge Bases Available
- Ensure knowledge bases are created in the Vector DB admin panel
- Check that knowledge bases have documents indexed
- Verify Vector DB service is running

### MCP Servers Not Listed
- Ensure MCP servers are configured in the system
- Check MCP service status
- Verify server permissions

### High Latency
- Reduce Top-K value (fewer documents)
- Increase Min Similarity threshold (more selective)
- Disable unused knowledge sources
- Consider using fewer MCP servers

### Low Relevance Scores
- Increase Top-K value (more documents)
- Decrease Min Similarity threshold (less selective)
- Review knowledge base content quality
- Check query phrasing

## Examples

### Example 1: Testing with Agent's Default Config

```
1. Select agent: "Customer Support Bot"
2. Select model: "Claude 3.5 Sonnet"
3. Knowledge Sources:
   - Auto-populated: ✓ Product Docs, ✓ Support Tickets
   - Click "Continue" (use defaults)
4. Select tests and execute
```

### Example 2: Custom Knowledge Configuration

```
1. Select agent: "Code Assistant"
2. Select model: "GPT-4 Turbo"
3. Knowledge Sources:
   - Enable Vector DB
   - Select: ✓ Code Examples, ✓ API Documentation
   - Top-K: 3 documents
   - Min Similarity: 0.8
   - Enable MCP
   - Select: ✓ Filesystem, ✓ Git
4. Select tests and execute
```

### Example 3: LLM-Only Testing

```
1. Select agent: "General Assistant"
2. Select model: "Claude 3.5 Sonnet"
3. Knowledge Sources:
   - Click "Skip (LLM Only)"
4. Select tests and execute
```

## FAQ

**Q: Can I test an agent without Vector DB/MCP even if it has them configured?**  
A: Yes! Just click "Skip (LLM Only)" to test with direct LLM responses.

**Q: Will my changes affect the agent's production configuration?**  
A: No. Changes in the testing workflow only affect the test execution, not the agent's configuration.

**Q: Can I compare results with and without knowledge sources?**  
A: Yes! Run tests once with knowledge sources, then run again with "Skip (LLM Only)" to compare.

**Q: What does "Hybrid" knowledge source mean?**  
A: Hybrid means the LLM was called with context from Vector DB and/or MCP, but neither source provided a direct answer.

**Q: How do I know if Vector DB or MCP provided the answer?**  
A: Check the knowledge source badge on each test result. Vector DB and MCP badges mean those sources provided the answer directly.

## Support

For issues or questions:
- Check the troubleshooting section above
- Review test results for error messages
- Check system logs for detailed error information
- Contact your system administrator

---

**Version**: 1.0  
**Last Updated**: November 28, 2025
