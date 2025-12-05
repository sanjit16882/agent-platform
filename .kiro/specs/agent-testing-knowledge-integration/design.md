# Design Document: Agent Testing Knowledge Integration & Dynamic Test Suggestion

## Overview

This feature enhances the Agent Testing workflow with two major capabilities:

### 1. Knowledge Integration (Existing)
Integrates Vector DB (RAG) and MCP (Model Context Protocol) capabilities into the Agent Testing workflow. It adds a new optional step where users can configure knowledge sources for testing, enabling comprehensive validation of agents that use retrieval-augmented generation and external tools.

### 2. Dynamic Test Suggestion System (NEW)
Implements an intelligent, metadata-driven test recommendation system that automatically displays relevant CORE tests based on agent category and type. This ensures unbiased, reliable testing while preventing hallucination in test selection.

The design prioritizes:
- **Seamless integration** with existing workflow
- **Auto-population** of agent configurations
- **Transparent execution** showing which knowledge source provided answers
- **Performance visibility** with latency and cost tracking
- **Flexibility** allowing users to test with or without knowledge sources
- **Metadata-driven recommendations** ensuring test independence from LLM output
- **Bias prevention** for hallucination and accuracy testing
- **Scalability** allowing easy addition of new categories and tests
- **Clear visual distinction** between CORE and LLM-suggested tests

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

## Dynamic Test Suggestion System Architecture

### Test Metadata Structure

The system uses a metadata-driven approach to map agent categories and types to CORE tests:

```
Agent Category (e.g., QE)
  └─ Agent Type (e.g., Test Case Creation)
      └─ CORE Test IDs [test-1, test-2, test-3]
```

### Metadata Storage

**File:** `testMetadata.json`

```json
{
  "version": "1.0",
  "lastUpdated": "2025-11-30",
  "categories": {
    "QE": {
      "displayName": "Quality Engineering",
      "description": "Agents focused on software quality assurance and testing",
      "agentTypes": {
        "Test Case Creation": {
          "description": "Agents that generate test cases from requirements",
          "coreTests": ["test-qe-001", "test-qe-002", "test-qe-003", "test-accuracy-001", "test-hallucination-001"]
        },
        "Defect Reporting": {
          "description": "Agents that analyze and report software defects",
          "coreTests": ["test-qe-004", "test-qe-005", "test-accuracy-002", "test-hallucination-002"]
        },
        "Test Automation": {
          "description": "Agents that create automated test scripts",
          "coreTests": ["test-qe-006", "test-qe-007", "test-code-quality-001"]
        }
      }
    },
    "DevOps": {
      "displayName": "DevOps Engineering",
      "description": "Agents focused on CI/CD, infrastructure, and deployment automation",
      "agentTypes": {
        "CI/CD Pipeline": {
          "description": "Agents that manage continuous integration and deployment",
          "coreTests": ["test-devops-001", "test-devops-002", "test-automation-001"]
        },
        "Infrastructure as Code": {
          "description": "Agents that generate and manage IaC configurations",
          "coreTests": ["test-devops-003", "test-devops-004", "test-code-quality-002"]
        }
      }
    },
    "Security": {
      "displayName": "Security",
      "description": "Agents focused on security analysis and threat detection",
      "agentTypes": {
        "Vulnerability Assessment": {
          "description": "Agents that identify security vulnerabilities",
          "coreTests": ["test-security-001", "test-security-002", "test-accuracy-003"]
        },
        "Security Audit": {
          "description": "Agents that perform security audits",
          "coreTests": ["test-security-003", "test-security-004", "test-hallucination-003"]
        }
      }
    }
  }
}
```

### Test Library Schema

**File:** `testLibrary.json`

```json
{
  "tests": [
    {
      "id": "test-qe-001",
      "name": "Test Case Completeness",
      "description": "Validates that generated test cases include all required elements",
      "category": "QE",
      "applicableAgentTypes": ["Test Case Creation"],
      "dimension": "task_completion",
      "isCoreTest": true,
      "estimatedExecutionTime": 30,
      "prompt": "Generate test cases for a login feature with username and password fields.",
      "expectedCriteria": [
        "Includes positive test cases",
        "Includes negative test cases",
        "Includes edge cases",
        "Specifies expected results"
      ]
    },
    {
      "id": "test-hallucination-001",
      "name": "Hallucination Detection - Requirements",
      "description": "Tests if agent fabricates requirements that don't exist",
      "category": "Universal",
      "applicableAgentTypes": ["*"],
      "dimension": "accuracy",
      "isCoreTest": true,
      "estimatedExecutionTime": 45,
      "prompt": "Based on the following requirement: 'User can login with email', what are the password requirements?",
      "expectedBehavior": "Should indicate that password requirements are not specified in the given requirement"
    }
  ]
}
```

### Components for Dynamic Test Suggestion

#### 9. All Agent Builders Enhancement (Non-Breaking Addition)

**Applies to ALL Agent Builder Types:**
1. **Hybrid Agent Builder** (`HybridAgentBuilder.tsx`)
2. **NLP Agent Builder** (`NLPAgentBuilder.tsx`)
3. **Purpose-Driven Agent Builder** (`PurposeDrivenAgentBuilder.tsx`)
4. **Natural Language Agent Generator** (`NaturalLanguageAgentGenerator.tsx`)
5. **Edit Agent Modal** (`EditAgentModal.tsx`)

**IMPORTANT**: These fields are **additive only** and do NOT modify or interfere with existing agent creation functionality including:
- ✅ Agent name and description
- ✅ Model selection
- ✅ System prompt configuration
- ✅ Vector DB configuration (existing)
- ✅ MCP integration (existing)
- ✅ All other existing agent settings

**New Fields (Added to Existing Form):**
```typescript
interface AgentFormData {
  // EXISTING FIELDS (unchanged)
  name: string;
  description: string;
  agentType: string;           // Existing field (e.g., "chatbot", "assistant")
  systemPrompt: string;
  modelId: string;
  vectorDB?: VectorDBConfig;   // Existing Vector DB config
  mcp?: MCPConfig;             // Existing MCP config
  
  // NEW FIELDS (additive only)
  category: string;            // NEW: Required dropdown for test recommendations
  agentSubType: string;        // NEW: Required dropdown (renamed to avoid conflict with existing agentType)
}
```

**Note on Naming**: To avoid confusion with the existing `agentType` field, we'll use:
- `category` - The domain classification (QE, DevOps, Security, etc.)
- `agentSubType` - The specific sub-classification within the category

**UI Changes (Added to Existing Form):**
```tsx
{/* EXISTING FORM FIELDS - UNCHANGED */}
<Form.Group>
  <Form.Label>Agent Name *</Form.Label>
  <Form.Control type="text" value={formData.name} onChange={handleNameChange} required />
</Form.Group>

<Form.Group>
  <Form.Label>Description *</Form.Label>
  <Form.Control as="textarea" value={formData.description} onChange={handleDescriptionChange} required />
</Form.Group>

<Form.Group>
  <Form.Label>Model *</Form.Label>
  <Form.Select value={formData.modelId} onChange={handleModelChange} required>
    {/* Model options */}
  </Form.Select>
</Form.Group>

{/* EXISTING VECTOR DB SECTION - UNCHANGED */}
<Card className="mb-3">
  <Card.Header>Knowledge Base (Optional)</Card.Header>
  <Card.Body>
    {/* Existing Vector DB configuration */}
  </Card.Body>
</Card>

{/* EXISTING MCP SECTION - UNCHANGED */}
<Card className="mb-3">
  <Card.Header>External Tools (Optional)</Card.Header>
  <Card.Body>
    {/* Existing MCP configuration */}
  </Card.Body>
</Card>

{/* NEW SECTION - ADDED BELOW EXISTING SECTIONS */}
<Card className="mb-3 border-info">
  <Card.Header className="bg-info text-white">
    <InfoCircle size={16} /> Test Recommendations (Optional)
  </Card.Header>
  <Card.Body>
    <p className="text-muted small">
      Help us recommend relevant tests by categorizing your agent. This is optional but improves test selection.
    </p>
    
    <Form.Group className="mb-3">
      <Form.Label>Agent Category</Form.Label>
      <Form.Select
        value={formData.category}
        onChange={handleCategoryChange}
      >
        <option value="">Select a category (optional)...</option>
        <option value="QE">Quality Engineering</option>
        <option value="DevOps">DevOps Engineering</option>
        <option value="Security">Security</option>
        <option value="Security Testing">Security Testing</option>
        <option value="Automated Testing">Automated Testing</option>
        <option value="Development">Development</option>
        <option value="Business Analysis">Business Analysis</option>
        <option value="Product Management">Product Management</option>
        <option value="Project Management">Project Management</option>
        <option value="Production Support">Production Support</option>
        <option value="SRE">Site Reliability Engineering</option>
      </Form.Select>
    </Form.Group>

    <Form.Group>
      <Form.Label>Agent Sub-Type</Form.Label>
      <Form.Select
        value={formData.agentSubType}
        onChange={handleAgentSubTypeChange}
        disabled={!formData.category}
      >
        <option value="">Select a sub-type (optional)...</option>
        {agentSubTypes[formData.category]?.map(type => (
          <option key={type.id} value={type.id}>{type.name}</option>
        ))}
      </Form.Select>
      <Form.Text className="text-muted">
        This helps us recommend relevant tests when you test this agent
      </Form.Text>
    </Form.Group>
  </Card.Body>
</Card>

{/* EXISTING SAVE BUTTON - UNCHANGED */}
<Button type="submit" variant="primary">Save Agent</Button>
```

**Key Design Principles:**
1. **Non-Breaking**: Category/sub-type fields are optional and don't affect agent creation
2. **Isolated Section**: New fields are in a separate card section, clearly labeled
3. **No Conflicts**: Renamed to `agentSubType` to avoid conflict with existing `agentType` field
4. **Graceful Degradation**: If not provided, agent works normally, just without test recommendations
5. **Clear Purpose**: UI explains these fields are for test recommendations only
6. **Universal Application**: Same fields added to ALL agent builders for consistency

**Implementation Strategy:**
- Create a reusable component: `TestRecommendationSection.tsx`
- Import and use in all 4 agent builders + Edit Agent Modal
- Ensures consistent UI/UX across all agent creation flows
- Single source of truth for category/sub-type selection

#### 10. StepSelectTests Enhancement

**File:** `StepSelectTests.tsx`

**New State:**
```typescript
interface TestSelectionState {
  coreTests: Test[];              // Recommended CORE tests
  llmSuggestedTests: Test[];      // Optional LLM suggestions
  allTests: Test[];               // Complete test library
  selectedTests: string[];        // Selected test IDs
  showLLMSuggestions: boolean;    // Toggle for LLM suggestions
  loadingLLMSuggestions: boolean;
}
```

**UI Structure:**
```tsx
<Container>
  {/* Agent Info Banner */}
  {!agent.category && (
    <Alert variant="info">
      <AlertCircle size={20} />
      💡 This agent doesn't have a category. Add one to get personalized test recommendations!
      <Button variant="link" onClick={handleEditAgent}>Edit Agent</Button>
    </Alert>
  )}

  {/* CORE Tests Section */}
  {coreTests.length > 0 && (
    <Card className="mb-4">
      <Card.Header className="bg-success text-white">
        <h5>🎯 Recommended CORE Tests for {agent.name}</h5>
        <small>These tests are specifically selected for {agent.category} - {agent.agentType} agents</small>
      </Card.Header>
      <Card.Body>
        {coreTests.map(test => (
          <TestCard
            key={test.id}
            test={test}
            badge={<Badge bg="success">CORE</Badge>}
            tooltip="Metadata-driven test, independent of LLM output"
            selected={selectedTests.includes(test.id)}
            onToggle={handleToggleTest}
          />
        ))}
      </Card.Body>
    </Card>
  )}

  {/* LLM Suggestions Section */}
  <Card className="mb-4">
    <Card.Header>
      <h5>🤖 LLM-Suggested Tests (Advisory)</h5>
      <Button
        variant="outline-primary"
        size="sm"
        onClick={handleGetLLMSuggestions}
        disabled={loadingLLMSuggestions}
      >
        {loadingLLMSuggestions ? 'Loading...' : 'Get LLM Suggestions'}
      </Button>
    </Card.Header>
    {showLLMSuggestions && (
      <Card.Body>
        <Alert variant="warning">
          <AlertTriangle size={16} />
          These suggestions are advisory only and generated by AI. Review carefully before use.
        </Alert>
        {llmSuggestedTests.map(test => (
          <TestCard
            key={test.id}
            test={test}
            badge={<Badge bg="warning" className="text-dark">
              <AlertTriangle size={12} /> LLM Suggested
            </Badge>}
            tooltip="AI-generated suggestion, requires review"
            selected={selectedTests.includes(test.id)}
            onToggle={handleToggleTest}
          />
        ))}
      </Card.Body>
    )}
  </Card>

  {/* All Tests Section */}
  <Card>
    <Card.Header>
      <h5>📚 All Available Tests</h5>
      <Form.Control
        type="search"
        placeholder="Search tests..."
        onChange={handleSearch}
      />
    </Card.Header>
    <Card.Body>
      {allTests.map(test => (
        <TestCard
          key={test.id}
          test={test}
          selected={selectedTests.includes(test.id)}
          onToggle={handleToggleTest}
        />
      ))}
    </Card.Body>
  </Card>

  {/* Selection Summary */}
  <Card className="mt-4 bg-light">
    <Card.Body>
      <h6>Selection Summary</h6>
      <p>
        CORE Tests: {selectedTests.filter(id => coreTests.find(t => t.id === id)).length} |
        LLM-Suggested: {selectedTests.filter(id => llmSuggestedTests.find(t => t.id === id)).length} |
        Other: {selectedTests.filter(id => !coreTests.find(t => t.id === id) && !llmSuggestedTests.find(t => t.id === id)).length}
      </p>
    </Card.Body>
  </Card>
</Container>
```

#### 11. TestRecommendationSection Component (NEW - Reusable)

**File:** `TestRecommendationSection.tsx`

Reusable component for category/sub-type selection, used in all agent builders.

**Props:**
```typescript
interface TestRecommendationSectionProps {
  category: string | null;
  agentSubType: string | null;
  onCategoryChange: (category: string) => void;
  onAgentSubTypeChange: (subType: string) => void;
  disabled?: boolean;
}
```

**Features:**
- Category dropdown with 11 options
- Agent sub-type dropdown (populated based on category)
- Help text explaining purpose
- Tooltips for guidance
- Consistent styling across all builders

**Usage in Agent Builders:**
```tsx
// In HybridAgentBuilder.tsx
import TestRecommendationSection from './TestRecommendationSection';

<TestRecommendationSection
  category={formData.category}
  agentSubType={formData.agentSubType}
  onCategoryChange={handleCategoryChange}
  onAgentSubTypeChange={handleAgentSubTypeChange}
/>

// Same usage in:
// - NLPAgentBuilder.tsx
// - PurposeDrivenAgentBuilder.tsx
// - NaturalLanguageAgentGenerator.tsx
// - EditAgentModal.tsx
```

#### 12. TestMetadataAdmin Component (NEW)

**File:** `TestMetadataAdmin.tsx`

Admin interface for managing test metadata mappings.

**Features:**
- View all categories and agent types
- Add/edit/delete categories
- Add/edit/delete agent types
- Assign CORE tests to agent types
- Search and filter tests
- Export/import metadata (JSON/CSV)
- Validation and preview

**UI Structure:**
```tsx
<Container>
  <Row>
    <Col md={4}>
      {/* Category Tree */}
      <Card>
        <Card.Header>Categories & Agent Types</Card.Header>
        <Card.Body>
          <Tree
            data={categories}
            onSelect={handleSelectNode}
            onAdd={handleAddNode}
            onEdit={handleEditNode}
            onDelete={handleDeleteNode}
          />
        </Card.Body>
      </Card>
    </Col>
    <Col md={8}>
      {/* Test Assignment */}
      <Card>
        <Card.Header>
          CORE Tests for {selectedAgentType}
        </Card.Header>
        <Card.Body>
          <TestLibrarySelector
            availableTests={allTests}
            assignedTests={assignedTests}
            onAssign={handleAssignTest}
            onUnassign={handleUnassignTest}
          />
        </Card.Body>
      </Card>
    </Col>
  </Row>
</Container>
```

### Services for Dynamic Test Suggestion

#### 12. testMetadataService.js (NEW)

**File:** `local_version/agent-hub-backend/src/services/testMetadataService.js`

```javascript
class TestMetadataService {
  constructor() {
    this.metadata = null;
    this.loadMetadata();
  }

  loadMetadata() {
    // Load from testMetadata.json
    const fs = require('fs');
    const path = require('path');
    const metadataPath = path.join(__dirname, '../data/testMetadata.json');
    this.metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
  }

  getCoreTestsForAgent(category, agentType) {
    if (!this.metadata.categories[category]) {
      return [];
    }

    const categoryData = this.metadata.categories[category];
    if (!categoryData.agentTypes[agentType]) {
      return [];
    }

    const testIds = categoryData.agentTypes[agentType].coreTests;
    return testIds;
  }

  getAllCategories() {
    return Object.keys(this.metadata.categories).map(key => ({
      id: key,
      displayName: this.metadata.categories[key].displayName,
      description: this.metadata.categories[key].description
    }));
  }

  getAgentTypesForCategory(category) {
    if (!this.metadata.categories[category]) {
      return [];
    }

    const agentTypes = this.metadata.categories[category].agentTypes;
    return Object.keys(agentTypes).map(key => ({
      id: key,
      description: agentTypes[key].description,
      coreTestCount: agentTypes[key].coreTests.length
    }));
  }

  addCategory(categoryId, displayName, description) {
    this.metadata.categories[categoryId] = {
      displayName,
      description,
      agentTypes: {}
    };
    this.saveMetadata();
  }

  addAgentType(category, agentTypeId, description, coreTests = []) {
    if (!this.metadata.categories[category]) {
      throw new Error(`Category ${category} does not exist`);
    }

    this.metadata.categories[category].agentTypes[agentTypeId] = {
      description,
      coreTests
    };
    this.saveMetadata();
  }

  assignTestToAgentType(category, agentType, testId) {
    const agentTypeData = this.metadata.categories[category]?.agentTypes[agentType];
    if (!agentTypeData) {
      throw new Error(`Agent type ${agentType} not found in category ${category}`);
    }

    if (!agentTypeData.coreTests.includes(testId)) {
      agentTypeData.coreTests.push(testId);
      this.saveMetadata();
    }
  }

  unassignTestFromAgentType(category, agentType, testId) {
    const agentTypeData = this.metadata.categories[category]?.agentTypes[agentType];
    if (!agentTypeData) {
      throw new Error(`Agent type ${agentType} not found in category ${category}`);
    }

    agentTypeData.coreTests = agentTypeData.coreTests.filter(id => id !== testId);
    this.saveMetadata();
  }

  saveMetadata() {
    const fs = require('fs');
    const path = require('path');
    const metadataPath = path.join(__dirname, '../data/testMetadata.json');
    
    // Update lastUpdated timestamp
    this.metadata.lastUpdated = new Date().toISOString();
    
    fs.writeFileSync(metadataPath, JSON.stringify(this.metadata, null, 2));
  }

  validateMetadata() {
    const errors = [];
    
    // Validate that all referenced test IDs exist in test library
    const testLibrary = require('./testLibraryService').getAllTests();
    const validTestIds = new Set(testLibrary.map(t => t.id));

    for (const [categoryId, category] of Object.entries(this.metadata.categories)) {
      for (const [agentTypeId, agentType] of Object.entries(category.agentTypes)) {
        for (const testId of agentType.coreTests) {
          if (!validTestIds.has(testId)) {
            errors.push({
              category: categoryId,
              agentType: agentTypeId,
              testId,
              error: 'Test ID does not exist in test library'
            });
          }
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }
}

module.exports = new TestMetadataService();
```

#### 13. llmTestSuggestionService.js (NEW)

**File:** `local_version/agent-hub-backend/src/services/llmTestSuggestionService.js`

```javascript
class LLMTestSuggestionService {
  async suggestTests(agentName, agentDescription, category, agentType) {
    try {
      const prompt = `You are a QA expert. Based on the following agent details, suggest 3-5 additional tests that would be valuable:

Agent Name: ${agentName}
Agent Description: ${agentDescription}
Category: ${category}
Agent Type: ${agentType}

Suggest tests that are:
1. Specific to this agent's purpose
2. Not generic tests (we already have those)
3. Focused on edge cases or domain-specific scenarios

Return ONLY a JSON array of test IDs from our test library that would be relevant. Format:
["test-id-1", "test-id-2", "test-id-3"]`;

      const response = await bedrockService.callBedrock({
        model: 'claude-3-haiku',
        prompt,
        maxTokens: 500
      });

      const suggestedTestIds = JSON.parse(response.content);
      
      // Validate that suggested test IDs exist
      const testLibrary = require('./testLibraryService');
      const validSuggestions = suggestedTestIds.filter(id => 
        testLibrary.getTestById(id) !== null
      );

      return {
        success: true,
        suggestions: validSuggestions,
        confidence: 0.7,
        requiresReview: true,
        source: 'llm'
      };
    } catch (error) {
      console.error('LLM test suggestion failed:', error);
      return {
        success: false,
        suggestions: [],
        error: error.message
      };
    }
  }
}

module.exports = new LLMTestSuggestionService();
```

#### 14. testLibraryService.js (Enhanced)

**File:** `local_version/agent-hub-backend/src/services/testLibraryService.js`

**New Methods:**
```javascript
class TestLibraryService {
  // ... existing methods

  getTestsByIds(testIds) {
    return this.tests.filter(test => testIds.includes(test.id));
  }

  getCoreTests() {
    return this.tests.filter(test => test.isCoreTest === true);
  }

  getTestsByCategory(category) {
    return this.tests.filter(test => 
      test.category === category || test.category === 'Universal'
    );
  }

  getTestsByAgentType(category, agentType) {
    return this.tests.filter(test => 
      test.applicableAgentTypes.includes(agentType) ||
      test.applicableAgentTypes.includes('*')
    );
  }

  markTestAsCoreTest(testId, isCoreTest = true) {
    const test = this.getTestById(testId);
    if (test) {
      test.isCoreTest = isCoreTest;
      this.saveTests();
    }
  }
}
```

### API Endpoints for Dynamic Test Suggestion

#### 15. Test Metadata Routes

**File:** `local_version/agent-hub-backend/src/routes/testMetadata.js` (NEW)

```javascript
const express = require('express');
const router = express.Router();
const testMetadataService = require('../services/testMetadataService');
const testLibraryService = require('../services/testLibraryService');

// GET /api/v1/test-metadata/categories
router.get('/categories', (req, res) => {
  try {
    const categories = testMetadataService.getAllCategories();
    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/v1/test-metadata/agent-types/:category
router.get('/agent-types/:category', (req, res) => {
  try {
    const { category } = req.params;
    const agentTypes = testMetadataService.getAgentTypesForCategory(category);
    res.json({ success: true, agentTypes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/v1/test-metadata/core-tests/:category/:agentType
router.get('/core-tests/:category/:agentType', (req, res) => {
  try {
    const { category, agentType } = req.params;
    const testIds = testMetadataService.getCoreTestsForAgent(category, agentType);
    const tests = testLibraryService.getTestsByIds(testIds);
    res.json({ success: true, coreTests: tests });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/v1/test-metadata/suggest-tests
router.post('/suggest-tests', async (req, res) => {
  try {
    const { agentName, agentDescription, category, agentType } = req.body;
    const llmSuggestionService = require('../services/llmTestSuggestionService');
    const result = await llmSuggestionService.suggestTests(
      agentName,
      agentDescription,
      category,
      agentType
    );
    
    if (result.success) {
      const tests = testLibraryService.getTestsByIds(result.suggestions);
      res.json({
        success: true,
        suggestedTests: tests,
        confidence: result.confidence,
        requiresReview: result.requiresReview
      });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Admin endpoints (protected)

// POST /api/v1/test-metadata/admin/category
router.post('/admin/category', (req, res) => {
  try {
    const { categoryId, displayName, description } = req.body;
    testMetadataService.addCategory(categoryId, displayName, description);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/v1/test-metadata/admin/agent-type
router.post('/admin/agent-type', (req, res) => {
  try {
    const { category, agentTypeId, description, coreTests } = req.body;
    testMetadataService.addAgentType(category, agentTypeId, description, coreTests);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/v1/test-metadata/admin/assign-test
router.post('/admin/assign-test', (req, res) => {
  try {
    const { category, agentType, testId } = req.body;
    testMetadataService.assignTestToAgentType(category, agentType, testId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/v1/test-metadata/admin/unassign-test
router.delete('/admin/unassign-test', (req, res) => {
  try {
    const { category, agentType, testId } = req.body;
    testMetadataService.unassignTestFromAgentType(category, agentType, testId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/v1/test-metadata/admin/validate
router.get('/admin/validate', (req, res) => {
  try {
    const validation = testMetadataService.validateMetadata();
    res.json({ success: true, validation });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
```

### Database Schema Updates

#### Agent Schema

```sql
ALTER TABLE agents ADD COLUMN category VARCHAR(100);
ALTER TABLE agents ADD COLUMN agent_type VARCHAR(100);

-- For existing agents, set default values
UPDATE agents SET category = 'Development', agent_type = 'General' WHERE category IS NULL;
```

#### Test Library Schema

```sql
ALTER TABLE tests ADD COLUMN is_core_test BOOLEAN DEFAULT FALSE;
ALTER TABLE tests ADD COLUMN applicable_categories TEXT; -- JSON array
ALTER TABLE tests ADD COLUMN applicable_agent_types TEXT; -- JSON array
ALTER TABLE tests ADD COLUMN dimension VARCHAR(50); -- accuracy, hallucination, task_completion, etc.
```

#### Test Execution Results Schema

```sql
ALTER TABLE test_results ADD COLUMN test_source VARCHAR(20); -- 'core' or 'llm_suggested' or 'custom'
ALTER TABLE test_results ADD COLUMN requires_review BOOLEAN DEFAULT FALSE;
```

## Correctness Properties for Dynamic Test Suggestion

### Property 9: Category-Based Test Filtering

*For any* agent with a defined category and agent type, when the user reaches Step 3 (Select Tests), the system should display only CORE tests that are mapped to that category/agent type combination in the metadata table.

**Validates: Requirements 9, 10, 11**

### Property 10: CORE Test Independence

*For any* test marked as isCoreTest=true, the test definition (prompt, expected criteria) should never be modified or generated by an LLM. All CORE tests must be predefined in the test library.

**Validates: Requirement 12**

### Property 11: LLM Suggestion Advisory Labeling

*For any* test suggested by the LLM service, the test should be displayed with a "LLM Suggested" badge, a warning icon, and a disclaimer stating "These suggestions are advisory only and generated by AI."

**Validates: Requirement 13**

### Property 12: Metadata Validation

*For any* test ID referenced in the testMetadata.json file, that test ID must exist in the test library. The validation service should detect and report any orphaned test ID references.

**Validates: Requirements 10, 14**

### Property 13: Backward Compatibility for Uncategorized Agents

*For any* agent without a category or agent type, when the user reaches Step 3, the system should display all available tests without filtering and show an info banner encouraging categorization.

**Validates: Requirement 15**

### Property 14: Test Badge Consistency

*For any* test displayed in Step 3, the test should have exactly one primary badge: either "CORE" (green) for metadata-driven tests, "LLM Suggested" (yellow) for AI-generated suggestions, or no badge for general tests.

**Validates: Requirement 16**

### Property 15: Category-Agent Type Relationship

*For any* agent type selection, the agent type must belong to the currently selected category. The system should not allow selecting an agent type from a different category.

**Validates: Requirement 9**

### Property 16: CORE Test Library Completeness

*For any* of the 11 predefined categories, there must exist at least 5 CORE tests mapped to at least one agent type within that category.

**Validates: Requirement 17**

## Implementation Phases

### Phase 1: Metadata Foundation (Week 1)
1. Create testMetadata.json with initial mappings
2. Create testLibrary.json with CORE tests
3. Implement testMetadataService
4. Implement testLibraryService enhancements
5. Create API endpoints for metadata

### Phase 2: Agent Builder Enhancement (Week 1)
1. Add category dropdown to Agent Builder
2. Add agent type dropdown (populated based on category)
3. Update agent schema with new fields
4. Migrate existing agents (prompt for categorization)

### Phase 3: Test Selection Enhancement (Week 2)
1. Update StepSelectTests component
2. Implement CORE test filtering logic
3. Add badge system (CORE, LLM Suggested)
4. Add info banner for uncategorized agents
5. Implement LLM suggestion feature (optional)

### Phase 4: Admin Tools (Week 2)
1. Create TestMetadataAdmin component
2. Implement category/agent type management
3. Implement test assignment interface
4. Add validation and export features

### Phase 5: Testing & Documentation (Week 3)
1. Write unit tests for all new services
2. Write integration tests for workflow
3. Write property-based tests
4. Update user documentation
5. Create admin guide for metadata management

## Non-Breaking Implementation Guarantee

### Existing Agent Creation Functionality - UNCHANGED

The following existing agent creation features are **completely unaffected** by the new category/sub-type fields:

#### ✅ Core Agent Fields (Unchanged)
- Agent name
- Agent description  
- Agent type (existing field for chatbot/assistant/etc.)
- System prompt
- Model selection

#### ✅ Vector DB Integration (Unchanged)
- Vector DB toggle
- Provider selection (OpenSearch, Pinecone, Pgvector)
- Knowledge base selection
- Retrieval configuration (topK, minSimilarity)
- Cost and latency estimates

#### ✅ MCP Integration (Unchanged)
- MCP toggle
- MCP server selection
- Tool configuration
- Auto-invoke settings
- Existing mcpConfigService integration

#### ✅ Other Existing Features (Unchanged)
- Agent templates
- Cost transparency
- Performance estimates
- Agent metadata storage
- Edit agent modal
- All existing API endpoints

### New Fields - Additive Only

The new category/sub-type fields are:
- **Optional** - Not required for agent creation
- **Isolated** - In a separate UI section
- **Non-blocking** - Agent works without them
- **Purpose-specific** - Only used for test recommendations

### Field Naming Strategy

To avoid conflicts with existing fields:
- **Existing**: `agentType` (e.g., "chatbot", "assistant", "code-helper")
- **New**: `category` (e.g., "QE", "DevOps", "Security")
- **New**: `agentSubType` (e.g., "Test Case Creation", "CI/CD Pipeline")

### Database Schema - Additive Only

```sql
-- NEW COLUMNS (nullable, no defaults, no constraints)
ALTER TABLE agents ADD COLUMN category VARCHAR(100) NULL;
ALTER TABLE agents ADD COLUMN agent_sub_type VARCHAR(100) NULL;

-- Existing agents will have NULL values (perfectly valid)
-- No migration required
-- No data loss
-- No breaking changes
```

### API Backward Compatibility

**Existing Endpoints - Unchanged:**
```javascript
// POST /api/v1/agents - Still works with existing payload
{
  "name": "My Agent",
  "description": "...",
  "agentType": "chatbot",
  "modelId": "claude-3",
  "vectorDB": {...},
  "mcp": {...}
}
// ✅ Works perfectly, category/agentSubType are optional
```

**Enhanced Endpoints - Backward Compatible:**
```javascript
// POST /api/v1/agents - Now accepts optional fields
{
  "name": "My Agent",
  "description": "...",
  "agentType": "chatbot",
  "modelId": "claude-3",
  "vectorDB": {...},
  "mcp": {...},
  "category": "QE",           // NEW: Optional
  "agentSubType": "API Testing" // NEW: Optional
}
// ✅ Works with or without new fields
```

## Risk Mitigation

### Risk 1: Breaking Existing Agent Creation
**Mitigation**: 
- Category/sub-type fields are optional
- Separate UI section, clearly labeled
- No changes to existing form validation
- No changes to existing save logic
- Existing agents continue to work without these fields

### Risk 2: Field Name Conflicts
**Mitigation**: 
- Renamed to `agentSubType` to avoid conflict with existing `agentType`
- Clear naming convention: `category` + `agentSubType` for test recommendations
- Existing `agentType` field remains unchanged

### Risk 3: LLM Suggestions Bias CORE Tests
**Mitigation**: Strict separation - CORE tests are never modified by LLM. LLM can only suggest from existing test library, not create new tests.

### Risk 4: Incomplete Test Metadata
**Mitigation**: Validation service checks for orphaned test IDs. Admin interface prevents saving invalid mappings.

### Risk 5: User Confusion Between CORE and LLM Tests
**Mitigation**: Clear visual distinction with badges, tooltips, and disclaimers. Separate sections in UI.

### Risk 6: Existing Agents Without Categories
**Mitigation**: Backward compatibility - uncategorized agents show all tests. Gentle prompts to add categories.

### Risk 7: Metadata Management Complexity
**Mitigation**: Intuitive admin interface with tree view, drag-and-drop, and validation. Export/import for backup.

## Success Metrics

1. **Adoption Rate**: % of agents with category/type defined
2. **Test Selection Efficiency**: Time to select tests (should decrease)
3. **CORE Test Usage**: % of test runs using CORE tests
4. **LLM Suggestion Accuracy**: % of LLM suggestions accepted by users
5. **Metadata Coverage**: % of categories with adequate CORE tests

---

**Status**: Design complete - Ready for implementation  
**Estimated Effort**: 3 weeks  
**Risk Level**: Low-Medium (new feature, requires careful metadata management)


*For any* test result that used knowledge sources, the exported data should include all knowledge source fields (knowledgeSource, retrievedDocuments, mcpToolsUsed, latencies).

**Validates: Requirements 7.4**

### Property 8: Execution Mode Consistency

*For any* combination of vectorDB.enabled and mcp.enabled settings, the system should execute in exactly one of the four defined modes (LLM-only, RAG, MCP, Full-stack), and the mode should be correctly recorded.

**Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5**

## Error Handling (Knowledge Integration)

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
