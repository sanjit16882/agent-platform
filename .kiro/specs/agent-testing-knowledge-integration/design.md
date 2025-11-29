# Design Document: Agent Testing Knowledge Integration

## Overview

This feature integrates Vector DB (RAG) and MCP (Model Context Protocol) capabilities into the Agent Testing workflow. It adds a new optional step where users can configure knowledge sources for testing, enabling comprehensive validation of agents that use retrieval-augmented generation and external tools.

The design prioritizes:
- **Seamless integration** with existing workflow
- **Auto-population** of agent configurations
- **Transparent execution** showing which knowledge source provided answers
- **Performance visibility** with latency and cost tracking
- **Flexibility** allowing users to test with or without knowledge sources

## Architecture

### High-Level Flow

```
User selects agent
    ↓
Agent config loaded (Vector DB + MCP settings)
    ↓
User selects models
    ↓
[NEW] Knowledge Configuration Step
    ↓ (auto-populated with agent's config)
User reviews/modifies knowledge sources (optional)
    ↓
User selects tests
    ↓
Tests execute with knowledge sources
    ↓ (Vector DB → MCP → LLM fallback)
Results display with knowledge source tracking
```

### Execution Modes

The system supports four execution modes based on configuration:

1. **LLM Only**: Direct LLM calls (current behavior)
2. **RAG Mode**: Vector DB → LLM with context
3. **MCP Mode**: MCP tools → LLM with context
4. **Full-stack Mode**: Vector DB → MCP → LLM with context

### Knowledge Source Priority

```
Query received
    ↓
1. Try Vector DB (if enabled)
    ├─ High confidence (>0.9 similarity) → Return directly
    └─ Low confidence → Continue
    ↓
2. Try MCP (if enabled)
    ├─ Tool provides answer → Return directly
    └─ No answer → Continue
    ↓
3. Call LLM with context
    ├─ Include retrieved documents (if any)
    ├─ Include MCP data (if any)
    └─ Return response (mark as 'hybrid' if context used)
```

## Components and Interfaces

### New Components

#### 1. StepConfigureKnowledge.tsx

Main component for the knowledge configuration step.

**Props:**
```typescript
interface StepConfigureKnowledgeProps {
  agentConfig: AgentConfig;           // Agent's existing config
  onNext: (config: KnowledgeConfig) => void;
  onBack: () => void;
  onSkip: () => void;
  initialConfig?: KnowledgeConfig;    // For state restoration
}
```

**State:**
```typescript
interface KnowledgeConfigState {
  vectorDB: {
    enabled: boolean;
    provider: string;
    knowledgeBases: string[];
    retrievalConfig: {
      topK: number;
      minSimilarity: number;
    };
  };
  mcp: {
    enabled: boolean;
    selectedServers: string[];
  };
  isModified: boolean;  // Track if user changed defaults
}
```

**Features:**
- Auto-populate from agent config on mount
- Toggle Vector DB on/off
- Multi-select knowledge bases
- Slider controls for topK and minSimilarity
- Toggle MCP on/off
- Multi-select MCP servers
- Preview panel showing execution flow and impact
- Skip button for LLM-only testing

#### 2. KnowledgeSourcePreview.tsx

Displays execution flow preview and performance impact.

**Props:**
```typescript
interface KnowledgeSourcePreviewProps {
  config: KnowledgeConfigState;
  estimatedLatency: number;
  estimatedCost: number;
}
```

**Display:**
- Execution flow diagram (Vector DB → MCP → LLM)
- Estimated latency increase
- Estimated cost per 1K queries
- Number of knowledge bases selected
- Number of MCP servers selected

### Modified Components

#### 3. DDTFWorkflow.tsx

**Changes:**
- Add Step 2.5 to STEPS array
- Update WorkflowState interface
- Add renderStep case for knowledge configuration
- Pass agent config to StepConfigureKnowledge

**Updated STEPS:**
```typescript
const STEPS = [
  { id: 1, name: 'Select Agent', component: StepSelectAgent },
  { id: 2, name: 'Select Models', component: StepSelectModels },
  { id: 2.5, name: 'Configure Knowledge', component: StepConfigureKnowledge }, // NEW
  { id: 3, name: 'Select Tests', component: StepSelectTests },
  { id: 4, name: 'Custom Tests', component: StepCustomTests },
  { id: 5, name: 'Provide Input', component: StepProvideInput },
  { id: 6, name: 'Review', component: StepReview },
  { id: 7, name: 'Execute', component: StepExecute },
  { id: 8, name: 'Results', component: StepResults },
  { id: 9, name: 'Insights', component: StepInsights }
];
```

**Updated WorkflowState:**
```typescript
interface WorkflowState {
  currentStep: number;
  selectedAgent: Agent;
  selectedModels: Model[];
  knowledgeConfig: KnowledgeConfig;  // NEW
  selectedTests: Test[];
  customTests: CustomTest[];
  testInputs: TestInput[];
  executionResults: TestResult[];
}
```

#### 4. StepExecute.tsx

**Changes:**
- Accept knowledgeConfig prop
- Show execution flow in real-time
- Display knowledge source attempts

**Execution Flow Display:**
```typescript
interface ExecutionStep {
  source: 'vector_db' | 'mcp' | 'llm';
  status: 'pending' | 'in_progress' | 'success' | 'skipped' | 'failed';
  message: string;
  latency?: number;
  details?: any;
}
```

**UI Updates:**
```
🔍 Searching Vector DB...
  ✓ Found 3 relevant documents (250ms)
  
🔧 Executing MCP tools...
  ⊘ No applicable tools found
  
🤖 Generating LLM response with context...
  ✓ Response generated (450ms)
```

#### 5. StepResults.tsx

**Changes:**
- Display knowledge source badges
- Show retrieval metrics
- Show MCP tool usage
- Include knowledge source in exports

**New Result Fields:**
```typescript
interface TestResult {
  // ... existing fields
  knowledgeSource: 'vector_db' | 'mcp' | 'llm' | 'hybrid';
  retrievedDocuments?: number;
  mcpToolsUsed?: string[];
  ragLatency?: number;
  mcpLatency?: number;
  llmLatency?: number;
}
```

**Badge Display:**
```
Test 1: Hallucination Detection
[Vector DB] ✓ Passed (95%)
Retrieved 3 documents in 250ms

Test 2: Tool Usage
[MCP] ✓ Passed (92%)
Used tools: filesystem.read, git.log

Test 3: Reasoning
[Hybrid] ✓ Passed (88%)
RAG: 2 docs, MCP: 1 tool, LLM: 450ms
```

### Services

#### 6. testExecutionService.js

**New Method:**
```javascript
async executeTestWithKnowledge(test, input, agentConfig, knowledgeConfig) {
  const result = {
    testId: test.id,
    knowledgeSource: null,
    response: null,
    retrievedDocuments: 0,
    mcpToolsUsed: [],
    ragLatency: 0,
    mcpLatency: 0,
    llmLatency: 0,
    passed: false,
    score: 0
  };

  let retrievedDocs = [];
  let mcpData = null;

  // Step 1: Try Vector DB
  if (knowledgeConfig.vectorDB.enabled) {
    const ragStart = Date.now();
    try {
      retrievedDocs = await vectorDBService.search({
        indexes: knowledgeConfig.vectorDB.knowledgeBases,
        query: input,
        topK: knowledgeConfig.vectorDB.retrievalConfig.topK,
        minSimilarity: knowledgeConfig.vectorDB.retrievalConfig.minSimilarity
      });
      result.ragLatency = Date.now() - ragStart;
      result.retrievedDocuments = retrievedDocs.length;

      // High confidence answer from Vector DB
      if (retrievedDocs.length > 0 && retrievedDocs[0].similarity > 0.9) {
        result.response = retrievedDocs[0].content;
        result.knowledgeSource = 'vector_db';
        result.passed = this.evaluateResponse(test, result.response);
        result.score = this.calculateScore(test, result.response);
        return result;
      }
    } catch (error) {
      console.error('Vector DB search failed:', error);
    }
  }

  // Step 2: Try MCP
  if (knowledgeConfig.mcp.enabled) {
    const mcpStart = Date.now();
    try {
      const mcpResult = await mcpService.executeTool(
        knowledgeConfig.mcp.selectedServers,
        input,
        agentConfig
      );
      result.mcpLatency = Date.now() - mcpStart;
      result.mcpToolsUsed = mcpResult.toolsUsed || [];

      if (mcpResult.success && mcpResult.output) {
        result.response = mcpResult.output;
        result.knowledgeSource = 'mcp';
        result.passed = this.evaluateResponse(test, result.response);
        result.score = this.calculateScore(test, result.response);
        return result;
      }

      mcpData = mcpResult.data;
    } catch (error) {
      console.error('MCP execution failed:', error);
    }
  }

  // Step 3: Fallback to LLM with context
  const llmStart = Date.now();
  const llmContext = {
    retrievedDocs: retrievedDocs,
    mcpData: mcpData
  };

  const llmResponse = await bedrockService.callBedrock(
    agentConfig.agentType,
    input,
    llmContext
  );

  result.llmLatency = Date.now() - llmStart;
  result.response = llmResponse.content;
  result.knowledgeSource = 
    (retrievedDocs.length > 0 || result.mcpToolsUsed.length > 0)
      ? 'hybrid'
      : 'llm';

  result.passed = this.evaluateResponse(test, result.response);
  result.score = this.calculateScore(test, result.response);

  return result;
}
```

#### 7. vectorDBService.js (existing)

**Used Methods:**
```javascript
async search(params) {
  // Returns: Array<{ content: string, similarity: number, metadata: any }>
}
```

#### 8. mcpService.js (existing)

**Used Methods:**
```javascript
async executeTool(servers, input, agentConfig) {
  // Returns: { success: boolean, output: string, toolsUsed: string[], data: any }
}
```

## Data Models

### KnowledgeConfig

```typescript
interface KnowledgeConfig {
  vectorDB: {
    enabled: boolean;
    provider: string;              // 'opensearch' | 'pinecone' | 'chroma'
    knowledgeBases: string[];      // Array of KB IDs
    retrievalConfig: {
      topK: number;                // 1-10, default: 5
      minSimilarity: number;       // 0.0-1.0, default: 0.7
    };
  };
  mcp: {
    enabled: boolean;
    selectedServers: string[];     // Array of MCP server IDs
  };
}
```

### TestResult (Extended)

```typescript
interface TestResult {
  // Existing fields
  testId: string;
  testName: string;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  score: number;
  explanation: string;
  
  // NEW: Knowledge source tracking
  knowledgeSource: 'vector_db' | 'mcp' | 'llm' | 'hybrid';
  retrievedDocuments?: number;
  mcpToolsUsed?: string[];
  ragLatency?: number;
  mcpLatency?: number;
  llmLatency?: number;
  totalLatency: number;
}
```

### AgentConfig (Existing)

```typescript
interface AgentConfig {
  id: string;
  name: string;
  agentType: string;
  systemPrompt: string;
  
  // Existing Vector DB config
  vectorDB?: {
    enabled: boolean;
    provider: string;
    knowledgeBases: string[];
    retrievalConfig: {
      topK: number;
      minSimilarity: number;
    };
  };
  
  // Existing MCP config
  mcp?: {
    enabled: boolean;
    servers: string[];
  };
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Configuration Auto-Population

*For any* agent with Vector DB or MCP configuration, when that agent is selected for testing, the knowledge configuration step should automatically populate with the agent's existing settings.

**Validates: Requirements 2.1, 2.2, 2.3**

### Property 2: Knowledge Source Priority

*For any* test execution with multiple knowledge sources enabled, the system should attempt Vector DB first, then MCP, then LLM, and should not skip any enabled source unless a previous source provided a high-confidence answer.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

### Property 3: Knowledge Source Tracking Completeness

*For any* completed test, the result should contain exactly one knowledge source designation (vector_db, mcp, llm, or hybrid), and the designation should accurately reflect which sources were actually used.

**Validates: Requirements 4.1, 4.4**

### Property 4: Latency Tracking Accuracy

*For any* test execution, the sum of ragLatency, mcpLatency, and llmLatency should equal the totalLatency within a small margin of error (±50ms for overhead).

**Validates: Requirements 4.2, 4.3, 5.4**

### Property 5: Skip Step Equivalence

*For any* test execution where the knowledge configuration step is skipped, the behavior should be identical to executing with both vectorDB.enabled and mcp.enabled set to false.

**Validates: Requirements 1.6, 6.4**

### Property 6: State Preservation

*For any* workflow state containing knowledge configuration, navigating backward and forward through steps should preserve the knowledge configuration without modification.

**Validates: Requirements 6.3**

### Property 7: Export Completeness

*For any* test result that used knowledge sources, the exported data should include all knowledge source fields (knowledgeSource, retrievedDocuments, mcpToolsUsed, latencies).

**Validates: Requirements 7.4**

### Property 8: Execution Mode Consistency

*For any* combination of vectorDB.enabled and mcp.enabled settings, the system should execute in exactly one of the four defined modes (LLM-only, RAG, MCP, Full-stack), and the mode should be correctly recorded.

**Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5**

## Error Handling

### Vector DB Failures

```typescript
try {
  retrievedDocs = await vectorDBService.search(params);
} catch (error) {
  console.error('Vector DB search failed:', error);
  // Continue to MCP or LLM
  // Log error for debugging
  // Show warning in UI (non-blocking)
}
```

### MCP Failures

```typescript
try {
  mcpResult = await mcpService.executeTool(params);
} catch (error) {
  console.error('MCP execution failed:', error);
  // Continue to LLM
  // Log error for debugging
  // Show warning in UI (non-blocking)
}
```

### LLM Failures

```typescript
try {
  llmResponse = await bedrockService.callBedrock(params);
} catch (error) {
  console.error('LLM call failed:', error);
  // This is critical - cannot continue
  // Show error to user
  // Mark test as failed
  throw error;
}
```

### Graceful Degradation

The system should gracefully degrade when knowledge sources fail:
1. Vector DB fails → Try MCP
2. MCP fails → Try LLM
3. LLM fails → Show error (cannot recover)

## Testing Strategy

### Unit Tests

1. **StepConfigureKnowledge Component**
   - Test auto-population from agent config
   - Test toggle enable/disable
   - Test knowledge base selection
   - Test MCP server selection
   - Test skip functionality

2. **testExecutionService**
   - Test Vector DB high-confidence path
   - Test MCP success path
   - Test LLM fallback path
   - Test hybrid path (context from RAG/MCP)
   - Test error handling for each source

3. **Knowledge Source Tracking**
   - Test correct source designation
   - Test latency tracking
   - Test document count tracking
   - Test tool usage tracking

### Integration Tests

1. **End-to-End Workflow**
   - Test complete workflow with knowledge sources
   - Test workflow with skip
   - Test state preservation across navigation
   - Test export with knowledge source data

2. **Execution Modes**
   - Test LLM-only mode
   - Test RAG mode
   - Test MCP mode
   - Test Full-stack mode

### Property-Based Tests

Property-based tests will be implemented using the testing framework specified for the project (e.g., fast-check for JavaScript/TypeScript).

Each property test should:
- Run a minimum of 100 iterations
- Be tagged with the property number from this design document
- Use the format: `**Feature: agent-testing-knowledge-integration, Property {number}: {property_text}**`

## Performance Considerations

### Latency Impact

- Vector DB search: +200-300ms
- MCP tool execution: +100-500ms (varies by tool)
- LLM with context: +50-100ms (larger context)

**Total estimated impact:** +350-900ms depending on configuration

### Cost Impact

- Vector DB queries: ~$0.10 per 1K queries
- MCP tool execution: Variable (depends on tool)
- LLM with larger context: +20-30% token cost

**Total estimated impact:** +$0.20-0.40 per 1K queries

### Optimization Strategies

1. **Caching**: Cache Vector DB results for identical queries
2. **Parallel Execution**: Execute Vector DB and MCP in parallel when both enabled
3. **Early Termination**: Stop at first high-confidence answer
4. **Batch Processing**: Batch multiple test queries to Vector DB

## UI/UX Considerations

### Visual Hierarchy

1. **Agent's Config Badge**: Show "Using agent's config" badge when defaults are used
2. **Modified Indicator**: Show "Modified" badge when user changes defaults
3. **Impact Preview**: Prominently display latency and cost impact
4. **Execution Flow**: Visual diagram showing Vector DB → MCP → LLM

### User Guidance

1. **Tooltips**: Explain topK and minSimilarity parameters
2. **Recommendations**: Suggest optimal settings based on agent type
3. **Warnings**: Warn if no knowledge bases selected but Vector DB enabled
4. **Skip Guidance**: Explain that skipping means LLM-only testing

### Accessibility

1. **Keyboard Navigation**: Full keyboard support for all controls
2. **Screen Reader**: Proper ARIA labels for all interactive elements
3. **Color Contrast**: Ensure badges and indicators meet WCAG AA standards
4. **Focus Management**: Clear focus indicators for all controls

## Migration and Rollout

### Phase 1: Backend Integration (Week 1)
- Implement testExecutionService.executeTestWithKnowledge()
- Add knowledge source tracking to TestResult model
- Update database schema for new fields

### Phase 2: UI Components (Week 1-2)
- Create StepConfigureKnowledge component
- Create KnowledgeSourcePreview component
- Update DDTFWorkflow with new step

### Phase 3: Execution and Results (Week 2)
- Update StepExecute with execution flow display
- Update StepResults with knowledge source badges
- Add export functionality for new fields

### Phase 4: Testing and Polish (Week 2-3)
- Write unit tests
- Write integration tests
- Write property-based tests
- Performance testing
- UI/UX polish

### Backward Compatibility

- Existing test results without knowledge source data will display as "LLM" mode
- Agents without Vector DB/MCP config will show empty configuration options
- Skipping the knowledge step maintains current LLM-only behavior

---

**Status**: Ready for implementation  
**Estimated Effort**: 2-3 weeks  
**Risk Level**: Low (additive feature, no breaking changes)
