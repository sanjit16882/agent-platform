# Custom Test Creation Feature

## Overview
Add ability for users to create custom tests during the testing workflow, allowing unlimited flexibility in testing scenarios.

## User Flow

### Current Workflow (8 steps):
1. Select Agent
2. Select Models
3. Select Tests (from library)
4. Provide Input
5. Review
6. Execute
7. Results
8. Insights

### Enhanced Workflow (9 steps):
1. Select Agent
2. Select Models
3. **Select Tests** (from library)
4. **Create Custom Tests** (NEW - optional)
5. Provide Input
6. Review
7. Execute
8. Results
9. Insights

## Step 4: Create Custom Tests

### UI Design

```
┌─────────────────────────────────────────────────────────┐
│ Create Custom Tests (Optional)                          │
│ Add your own test scenarios                             │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ [+ Add Custom Test]                                      │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Custom Test #1                              [Remove] │ │
│ ├─────────────────────────────────────────────────────┤ │
│ │ Test Name: *                                         │ │
│ │ [My Custom Test                                    ] │ │
│ │                                                      │ │
│ │ Category:                                            │ │
│ │ [Functional ▼]                                       │ │
│ │                                                      │ │
│ │ Test Input:                                          │ │
│ │ [                                                  ] │ │
│ │ [                                                  ] │ │
│ │                                                      │ │
│ │ Expected Behavior:                                   │ │
│ │ [                                                  ] │ │
│ │ [                                                  ] │ │
│ │                                                      │ │
│ │ Scoring Criteria (Optional):                         │ │
│ │ ☑ Accuracy (Weight: 50%)                            │ │
│ │ ☑ Completeness (Weight: 30%)                        │ │
│ │ ☑ Format (Weight: 20%)                              │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ Custom Tests: 1                                          │
│ Library Tests: 3                                         │
│ Total Tests: 4                                           │
└─────────────────────────────────────────────────────────┘
```

### Features

1. **Add Multiple Custom Tests**
   - Click "+ Add Custom Test" to create new test
   - Each test has its own card
   - Can add unlimited tests

2. **Test Configuration**
   - **Test Name**: User-defined name
   - **Category**: Dropdown (Functional, Hallucination, Emotional, Safety, Tool Usage, Custom)
   - **Test Input**: What to send to the agent
   - **Expected Behavior**: What the agent should do
   - **Scoring Criteria**: Optional weighted criteria

3. **Validation**
   - Test name required
   - Input required
   - Expected behavior required
   - Category defaults to "Custom"

4. **Integration**
   - Custom tests merge with library tests
   - All tests go through same execution pipeline
   - Custom tests saved to session (optional: save to library)

## Implementation

### 1. Create StepCreateCustomTests Component

```typescript
// local_version/agent-hub-ui/src/components/testing/StepCreateCustomTests.tsx

interface CustomTest {
  id: string;
  name: string;
  category: string;
  input_content: string;
  expected_behavior: string;
  scoring_rules?: {
    accuracy?: { weight: number };
    completeness?: { weight: number };
    format?: { weight: number };
  };
}

const StepCreateCustomTests: React.FC<Props> = ({
  customTests,
  onCustomTestsChange,
  onNext
}) => {
  const [tests, setTests] = useState<CustomTest[]>(customTests || []);
  
  const addTest = () => {
    const newTest: CustomTest = {
      id: `custom_${Date.now()}`,
      name: '',
      category: 'custom',
      input_content: '',
      expected_behavior: ''
    };
    setTests([...tests, newTest]);
  };
  
  const removeTest = (id: string) => {
    setTests(tests.filter(t => t.id !== id));
  };
  
  const updateTest = (id: string, updates: Partial<CustomTest>) => {
    setTests(tests.map(t => t.id === id ? { ...t, ...updates } : t));
  };
  
  const handleNext = () => {
    onCustomTestsChange(tests);
    onNext();
  };
  
  return (
    <div>
      <Card>
        <Card.Header>
          <Card.Title>Create Custom Tests (Optional)</Card.Title>
          <Card.Text>Add your own test scenarios</Card.Text>
        </Card.Header>
        <Card.Body>
          <Button onClick={addTest}>+ Add Custom Test</Button>
          
          {tests.map((test, index) => (
            <Card key={test.id} style={{ marginTop: '1rem' }}>
              <Card.Header>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Custom Test #{index + 1}</span>
                  <Button variant="danger" size="sm" onClick={() => removeTest(test.id)}>
                    Remove
                  </Button>
                </div>
              </Card.Header>
              <Card.Body>
                <FormField label="Test Name *">
                  <input
                    value={test.name}
                    onChange={(e) => updateTest(test.id, { name: e.target.value })}
                    placeholder="e.g., Test API Error Handling"
                  />
                </FormField>
                
                <FormField label="Category">
                  <select
                    value={test.category}
                    onChange={(e) => updateTest(test.id, { category: e.target.value })}
                  >
                    <option value="functional">Functional</option>
                    <option value="hallucination">Hallucination</option>
                    <option value="emotional">Emotional</option>
                    <option value="safety">Safety</option>
                    <option value="tool_usage">Tool Usage</option>
                    <option value="custom">Custom</option>
                  </select>
                </FormField>
                
                <FormField label="Test Input *">
                  <textarea
                    value={test.input_content}
                    onChange={(e) => updateTest(test.id, { input_content: e.target.value })}
                    placeholder="What to send to the agent..."
                    rows={4}
                  />
                </FormField>
                
                <FormField label="Expected Behavior *">
                  <textarea
                    value={test.expected_behavior}
                    onChange={(e) => updateTest(test.id, { expected_behavior: e.target.value })}
                    placeholder="What the agent should do..."
                    rows={3}
                  />
                </FormField>
              </Card.Body>
            </Card>
          ))}
          
          <div style={{ marginTop: '1rem', padding: '1rem', background: '#f5f5f5' }}>
            <strong>Summary:</strong>
            <div>Custom Tests: {tests.length}</div>
            <div>Total Tests: {tests.length + libraryTestCount}</div>
          </div>
        </Card.Body>
      </Card>
      
      <Button onClick={handleNext} disabled={!canProceed()}>
        Next →
      </Button>
    </div>
  );
};
```

### 2. Update DDTFWorkflow

```typescript
// Add to workflow state
interface WorkflowState {
  // ... existing fields
  customTests: CustomTest[];
}

// Add step
const STEPS = [
  { id: 1, name: 'Select Agent', description: 'Choose the agent to test' },
  { id: 2, name: 'Select Models', description: 'Choose AI models to test' },
  { id: 3, name: 'Select Tests', description: 'Choose tests to run' },
  { id: 4, name: 'Custom Tests', description: 'Create custom tests (optional)' },
  { id: 5, name: 'Provide Input', description: 'Configure test inputs' },
  { id: 6, name: 'Review', description: 'Review your configuration' },
  { id: 7, name: 'Execute', description: 'Run the tests' },
  { id: 8, name: 'Results', description: 'View test results' },
  { id: 9, name: 'Insights', description: 'Generate AI insights' }
];

// In renderStep()
case 3:
  return (
    <StepCreateCustomTests
      customTests={workflowState.customTests}
      libraryTestCount={workflowState.selectedTests.length}
      onCustomTestsChange={(tests) => updateWorkflowState({ customTests: tests })}
      onNext={handleNext}
    />
  );
```

### 3. Merge Custom Tests with Library Tests

```typescript
// Before execution, merge tests
const allTests = [
  ...workflowState.selectedTests,
  ...workflowState.customTests.map(ct => ({
    id: ct.id,
    name: ct.name,
    category: ct.category,
    input_content: ct.input_content,
    expected_behavior: ct.expected_behavior,
    scoring_rules: ct.scoring_rules,
    type: 'custom',
    input_format: 'plain_text'
  }))
];
```

### 4. Optional: Save Custom Tests to Library

```typescript
const saveCustomTestToLibrary = async (customTest: CustomTest) => {
  const response = await fetch(`${API_BASE_URL}/api/testing/library/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: customTest.name,
      category: customTest.category,
      type: 'custom',
      input_format: 'plain_text',
      input_content: customTest.input_content,
      expected_behavior: customTest.expected_behavior,
      scoring_rules: customTest.scoring_rules
    })
  });
  
  return response.json();
};
```

## Benefits

1. **Unlimited Flexibility** - Users can test any scenario
2. **Quick Iteration** - Create tests on-the-fly without leaving workflow
3. **Reusability** - Option to save custom tests to library
4. **No Limitations** - Not restricted to pre-defined test library
5. **Better Coverage** - Test edge cases specific to their use case

## User Experience

1. User selects library tests (optional)
2. User creates custom tests (optional)
3. Both types merge seamlessly
4. All tests execute together
5. Results show both library and custom tests

## Implementation Priority

1. **Phase 1**: Basic custom test creation (name, input, expected)
2. **Phase 2**: Advanced scoring criteria
3. **Phase 3**: Save to library feature
4. **Phase 4**: Test templates and quick-add

## Files to Create/Modify

1. **NEW**: `local_version/agent-hub-ui/src/components/testing/StepCreateCustomTests.tsx`
2. **UPDATE**: `local_version/agent-hub-ui/src/components/testing/DDTFWorkflow.tsx`
3. **UPDATE**: `local_version/agent-hub-ui/src/components/testing/StepReview.tsx` (show custom tests)

Would you like me to implement this feature now?
