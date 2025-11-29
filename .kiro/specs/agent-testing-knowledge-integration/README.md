# Agent Testing Knowledge Integration - Spec Summary

## Overview

This spec defines the integration of Vector DB (RAG) and MCP (Model Context Protocol) capabilities into the Agent Testing workflow. It enables comprehensive testing of agents that use knowledge bases and external tools, not just direct LLM responses.

## Feature Summary

**What it does:**
- Adds a new optional step in the Agent Testing workflow for configuring knowledge sources
- Auto-populates Vector DB and MCP settings from the agent's existing configuration
- Executes tests using a priority system: Vector DB → MCP → LLM
- Tracks which knowledge source provided each answer
- Displays performance metrics (latency, cost) for each source

**Key Benefits:**
- Test agents with realistic production configurations
- Validate RAG and MCP integrations
- Understand which knowledge sources are being used
- Identify performance bottlenecks
- Compare agent behavior with and without knowledge sources

## Execution Modes

1. **LLM Only**: Direct LLM calls (current behavior)
2. **RAG Mode**: Vector DB → LLM with context
3. **MCP Mode**: MCP tools → LLM with context
4. **Full-stack Mode**: Vector DB → MCP → LLM with context

## Workflow Integration

**New workflow:**
```
Step 1: Select Agent
Step 2: Select Models
Step 2.5: Configure Knowledge Sources (NEW) ← Optional
Step 3: Select Tests
Step 4: Custom Tests
Step 5: Provide Input
Step 6: Review
Step 7: Execute
Step 8: Results
Step 9: Insights
```

## Files in This Spec

- **requirements.md**: 8 requirements with 40 acceptance criteria in EARS format
- **design.md**: Complete technical design with architecture, components, data models, and 8 correctness properties
- **tasks.md**: 12 main tasks with 35 sub-tasks for implementation
- **README.md**: This file

## Implementation Status

**Status**: ✅ Spec Complete - Ready for Implementation

**Next Steps:**
1. Open `tasks.md` in the Kiro IDE
2. Click "Start task" next to Task 1 to begin implementation
3. Follow the task list sequentially

## Key Design Decisions

1. **Auto-population**: Agent's existing Vector DB/MCP config automatically populates as defaults
2. **Optional Step**: Users can skip knowledge configuration for LLM-only testing
3. **Graceful Degradation**: If Vector DB fails, try MCP; if MCP fails, try LLM
4. **Transparent Tracking**: Every test result shows which knowledge source provided the answer
5. **Performance Visibility**: Display latency and cost impact for each knowledge source

## Dependencies

- Existing Vector DB service (`vectorDBService.js`)
- Existing MCP service (`mcpService.js`)
- Existing Bedrock service (`bedrockService.js`)
- Agent Testing workflow (`DDTFWorkflow.tsx`)

## Estimated Effort

- **Backend**: 1 week (services, execution logic, error handling)
- **Frontend**: 1 week (components, workflow integration, results display)
- **Testing**: 3-4 days (unit tests, property tests, integration tests)
- **Polish**: 2-3 days (UI/UX, documentation, performance testing)

**Total**: 2-3 weeks

## Success Criteria

- [ ] Users can configure Vector DB and MCP for testing
- [ ] Agent configurations auto-populate correctly
- [ ] Tests execute using the correct knowledge source priority
- [ ] Results clearly show which knowledge source was used
- [ ] Performance metrics are accurate and visible
- [ ] All 8 correctness properties are validated
- [ ] All tests pass (unit, property, integration)
- [ ] Documentation is complete

---

**Created**: November 27, 2025  
**Status**: Ready for Implementation  
**Spec Version**: 1.0
