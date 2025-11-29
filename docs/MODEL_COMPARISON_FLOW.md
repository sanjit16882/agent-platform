# Model Comparison Feature Flow

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                         │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │           AgentTestingMain.tsx                            │  │
│  │  - Main dashboard with feature cards                      │  │
│  │  - Navigation to Model Comparison                         │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                    │
│                              ▼                                    │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │           ModelComparison.tsx                             │  │
│  │                                                            │  │
│  │  Step 1: Select Agent                                     │  │
│  │  Step 2: Select Models (2-4)                              │  │
│  │  Step 3: Select Tests                                     │  │
│  │  Step 4: View Results                                     │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                    │
└──────────────────────────────┼────────────────────────────────────┘
                               │
                               │ HTTP POST /api/testing/execute
                               │ (with modelId in options)
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Backend (Express)                           │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │           testingRoutes.js                                │  │
│  │  POST /api/testing/execute                                │  │
│  │  - Validates request                                      │  │
│  │  - Calls TestExecutionService                             │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                    │
│                              ▼                                    │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │        TestExecutionService.js                            │  │
│  │  - executeTestSuite()                                     │  │
│  │  - executeTest()                                          │  │
│  │  - invokeAgent() ← passes modelId in context             │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                    │
│                              ▼                                    │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │           BedrockService.js                               │  │
│  │  - callBedrock()                                          │  │
│  │  - Checks for context.model_id                            │  │
│  │  - Uses custom model or default mapping                   │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                    │
└──────────────────────────────┼────────────────────────────────────┘
                               │
                               │ AWS SDK
                               ▼
                    ┌──────────────────────┐
                    │   AWS Bedrock API    │
                    │  - Claude Models     │
                    └──────────────────────┘
```

## User Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    User Journey                                  │
└─────────────────────────────────────────────────────────────────┘

1. Navigate to Testing Framework
   │
   ├─→ Click "🔬 Model Comparison" card
   │
   ▼

2. Select Agent
   │
   ├─→ View list of available agents
   ├─→ Click on desired agent
   ├─→ Click "Next: Select Models"
   │
   ▼

3. Select Models
   │
   ├─→ View 4 available Claude models
   ├─→ Check 2-4 models to compare
   │   ├─ Claude 3.5 Sonnet v2 (Most capable)
   │   ├─ Claude 3.5 Haiku (Fast & efficient)
   │   ├─ Claude 3 Opus (Previous flagship)
   │   └─ Claude 3 Sonnet (Balanced)
   ├─→ Click "Next: Select Tests"
   │
   ▼

4. Select Tests
   │
   ├─→ View available test library
   ├─→ Check tests to run (5-15 recommended)
   ├─→ Click "Run Comparison"
   │
   ▼

5. Execution Phase
   │
   ├─→ Progress bar shows execution
   ├─→ Status updates: "Currently testing: Model X"
   ├─→ Counter: "2 / 4 models completed"
   │
   ▼

6. View Results
   │
   ├─→ Summary Section
   │   ├─ Best Model
   │   ├─ Best Score
   │   ├─ Models Tested
   │   └─ Tests Per Model
   │
   ├─→ Individual Model Cards
   │   ├─ Overall Score (color-coded)
   │   ├─ Pass Rate
   │   ├─ Tests Passed/Failed
   │   ├─ Total Time
   │   └─ Per-Test Breakdown
   │
   └─→ Actions
       ├─ Start New Comparison
       └─ Export Results (JSON)
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Request Flow                                  │
└─────────────────────────────────────────────────────────────────┘

Frontend State:
┌──────────────────────────────────────┐
│ selectedAgent: "agent-id"            │
│ selectedModels: [                    │
│   "claude-3-5-haiku...",             │
│   "claude-3-5-sonnet..."             │
│ ]                                    │
│ selectedTests: [                     │
│   "test-1", "test-2", "test-3"       │
│ ]                                    │
└──────────────────────────────────────┘
              │
              │ For each model:
              ▼
┌──────────────────────────────────────┐
│ POST /api/testing/execute            │
│ {                                    │
│   agentId: "agent-id",               │
│   testIds: ["test-1", ...],          │
│   options: {                         │
│     modelId: "claude-3-5-haiku...",  │
│     timeout: 30000                   │
│   }                                  │
│ }                                    │
└──────────────────────────────────────┘
              │
              ▼
┌──────────────────────────────────────┐
│ Backend Processing                   │
│ - Validate inputs                    │
│ - Load tests from library            │
│ - Execute each test                  │
│ - Evaluate results                   │
│ - Calculate metrics                  │
└──────────────────────────────────────┘
              │
              ▼
┌──────────────────────────────────────┐
│ Response                             │
│ {                                    │
│   success: true,                     │
│   data: {                            │
│     run_id: "uuid",                  │
│     overall_score: 87.5,             │
│     summary: {                       │
│       total: 10,                     │
│       passed: 9,                     │
│       failed: 1,                     │
│       pass_rate: 90.0                │
│     },                               │
│     results: [...]                   │
│   }                                  │
│ }                                    │
└──────────────────────────────────────┘
              │
              ▼
┌──────────────────────────────────────┐
│ Frontend Updates State               │
│ modelRuns[i] = {                     │
│   model_id: "...",                   │
│   model_name: "Claude 3.5 Haiku",    │
│   run_id: "uuid",                    │
│   overall_score: 87.5,               │
│   pass_rate: 90.0,                   │
│   results: [...],                    │
│   status: 'completed'                │
│ }                                    │
└──────────────────────────────────────┘
              │
              │ Repeat for next model
              ▼
         All models complete
              │
              ▼
┌──────────────────────────────────────┐
│ Display Comparison Results           │
│ - Summary with best model            │
│ - Individual model cards             │
│ - Export option                      │
└──────────────────────────────────────┘
```

## State Management

```
┌─────────────────────────────────────────────────────────────────┐
│                    Component State                               │
└─────────────────────────────────────────────────────────────────┘

Initial State:
┌──────────────────────────────────────┐
│ step: 1                              │
│ agents: []                           │
│ tests: []                            │
│ selectedAgent: ''                    │
│ selectedModels: []                   │
│ selectedTests: []                    │
│ modelRuns: []                        │
│ isExecuting: false                   │
│ currentModel: ''                     │
└──────────────────────────────────────┘

After Agent Selection (Step 1):
┌──────────────────────────────────────┐
│ step: 2                              │
│ selectedAgent: 'agent-123'           │
└──────────────────────────────────────┘

After Model Selection (Step 2):
┌──────────────────────────────────────┐
│ step: 3                              │
│ selectedModels: [                    │
│   'claude-3-5-haiku...',             │
│   'claude-3-5-sonnet...'             │
│ ]                                    │
└──────────────────────────────────────┘

After Test Selection (Step 3):
┌──────────────────────────────────────┐
│ step: 4                              │
│ selectedTests: [                     │
│   'test-1', 'test-2', 'test-3'       │
│ ]                                    │
│ isExecuting: true                    │
│ modelRuns: [                         │
│   { status: 'pending', ... },        │
│   { status: 'pending', ... }         │
│ ]                                    │
└──────────────────────────────────────┘

During Execution:
┌──────────────────────────────────────┐
│ currentModel: 'Claude 3.5 Haiku'     │
│ modelRuns: [                         │
│   { status: 'running', ... },        │
│   { status: 'pending', ... }         │
│ ]                                    │
└──────────────────────────────────────┘

After Completion:
┌──────────────────────────────────────┐
│ isExecuting: false                   │
│ currentModel: ''                     │
│ modelRuns: [                         │
│   { status: 'completed',             │
│     overall_score: 87.5,             │
│     results: [...] },                │
│   { status: 'completed',             │
│     overall_score: 92.3,             │
│     results: [...] }                 │
│ ]                                    │
└──────────────────────────────────────┘
```

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Error Scenarios                               │
└─────────────────────────────────────────────────────────────────┘

Scenario 1: Model Execution Fails
┌──────────────────────────────────────┐
│ Try to execute test for Model A      │
│         │                            │
│         ▼                            │
│   AWS API Error                      │
│         │                            │
│         ▼                            │
│   Catch error in try/catch           │
│         │                            │
│         ▼                            │
│   Update modelRuns[i]:               │
│   - status: 'failed'                 │
│   - error: error.message             │
│         │                            │
│         ▼                            │
│   Continue to next model             │
│   (don't stop entire comparison)     │
└──────────────────────────────────────┘

Scenario 2: Invalid Selection
┌──────────────────────────────────────┐
│ User clicks "Run Comparison"         │
│         │                            │
│         ▼                            │
│   Validate:                          │
│   - selectedAgent exists?            │
│   - selectedModels.length >= 2?      │
│   - selectedTests.length > 0?        │
│         │                            │
│         ▼                            │
│   If invalid:                        │
│   - Show alert()                     │
│   - Don't proceed                    │
└──────────────────────────────────────┘

Scenario 3: Backend Unavailable
┌──────────────────────────────────────┐
│ API call fails (network error)       │
│         │                            │
│         ▼                            │
│   Axios throws error                 │
│         │                            │
│         ▼                            │
│   Catch in try/catch                 │
│         │                            │
│         ▼                            │
│   Update modelRuns[i]:               │
│   - status: 'failed'                 │
│   - error: 'Network error'           │
│         │                            │
│         ▼                            │
│   Display error in UI                │
└──────────────────────────────────────┘
```

## Performance Considerations

```
┌─────────────────────────────────────────────────────────────────┐
│                    Execution Time                                │
└─────────────────────────────────────────────────────────────────┘

Sequential Execution:
┌──────────────────────────────────────┐
│ Model 1: 10 tests × 2s = 20s         │
│ Model 2: 10 tests × 2s = 20s         │
│ Model 3: 10 tests × 2s = 20s         │
│ Model 4: 10 tests × 2s = 20s         │
│ ─────────────────────────────────    │
│ Total: 80 seconds                    │
└──────────────────────────────────────┘

Factors Affecting Time:
- Number of models selected
- Number of tests selected
- Model response time (Haiku faster than Sonnet)
- Network latency
- Test complexity

Optimization Opportunities:
- Parallel execution (future enhancement)
- Test batching
- Response caching
- Progressive results display
```

## Key Design Decisions

1. **Sequential vs Parallel Execution**
   - Current: Sequential (simpler, easier to debug)
   - Future: Parallel (faster, better UX)

2. **Error Handling Strategy**
   - Fail gracefully per model
   - Don't stop entire comparison on single failure
   - Show detailed error messages

3. **State Management**
   - Local component state (React hooks)
   - No global state needed
   - Simple and maintainable

4. **Model Configuration**
   - Hardcoded list of 4 Claude models
   - Easy to extend with more models
   - Dynamic config creation for custom models

5. **Results Display**
   - Show all results together at end
   - Could be enhanced with progressive display
   - Export functionality for further analysis
