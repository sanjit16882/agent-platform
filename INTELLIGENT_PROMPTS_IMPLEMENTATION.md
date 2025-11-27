# Intelligent Prompt Generation Based on Selected Tests - Complete

## Problem
Recommended prompts in the "Provide Input" page were generic and not related to the selected tests.

**Example:**
- User selects: "Performance Metrics Accuracy" + "Threshold Detection"
- Gets generic prompts: "Review this code...", "Analyze this function..."
- **Wrong!** Should get monitoring-specific prompts about CPU usage, thresholds, etc.

## Solution Implemented

### 1. Backend: Test-Based Prompt Generation

**New Method in `samplePromptService.js`:**
```javascript
generatePromptsForTests(agent, selectedTests)
```

**How it works:**
1. Groups selected tests by category (monitoring, hallucination, functional, etc.)
2. Generates category-specific prompts
3. Returns up to 4 most relevant prompts

**Example for Monitoring Tests:**
```javascript
'monitoring': [
  'What is the current CPU usage? Context: CPU at 75%, Memory at 60%',
  'Is there performance degradation? Context: Response time 100ms → 250ms',
  'Identify the bottleneck. Context: High DB query time (500ms avg)',
  'Are we experiencing unusual traffic? Context: Normal 100 req/s, now 800 req/s'
]
```

### 2. API Enhancement

**Updated `/api/testing/sample-prompts` endpoint:**
```javascript
POST /api/testing/sample-prompts
Body: {
  agent: {...},
  selectedTests: [...]  // NEW!
}
```

**Response includes:**
```json
{
  "success": true,
  "data": ["prompt1", "prompt2", "prompt3", "prompt4"],
  "basedOnTests": true  // Indicates prompts are test-specific
}
```

### 3. Frontend: Dynamic Prompt Reloading

**Updated `StepSelectTest.tsx`:**

**When user selects/deselects a test:**
```typescript
const toggleTest = (test) => {
  // Update selected tests
  onSelectTests(newSelectedTests);
  
  // Reload prompts based on new selection
  if (newSelectedTests.length > 0) {
    loadSamplePromptsForTests(newSelectedTests);
  }
};
```

**When user clicks "Select All":**
```typescript
const selectAll = () => {
  onSelectTests(filteredTests);
  loadSamplePromptsForTests(filteredTests);  // Reload prompts
};
```

**When user clicks "Clear All":**
```typescript
const clearAll = () => {
  onSelectTests([]);
  setSamplePrompts([]);  // Clear prompts
};
```

## Category-Specific Prompts

### Monitoring (8 prompts)
- Performance metrics accuracy
- Threshold detection
- Trend analysis
- Anomaly detection
- Alert prioritization
- Root cause analysis
- Metric correlation
- Historical comparison

### Hallucination (4 prompts)
- Factual questions
- Context-based questions
- Missing information scenarios
- Source attribution

### Functional (4 prompts)
- Code generation
- Data transformation
- Text summarization
- List processing

### Safety (4 prompts)
- Harmful content requests
- Illegal activity requests
- Privacy violations
- Manipulation attempts

### Tool Usage (4 prompts)
- Search operations
- File operations
- Email sending
- Database queries

### Emotional (4 prompts)
- Job loss empathy
- Frustration handling
- Anxiety support
- Team communication

### RAG Grounding (4 prompts)
- Context-based questions
- Quote extraction
- Document analysis
- Source verification

### Intent Detection (4 prompts)
- Booking requests
- Information queries
- Complaints
- Ambiguous inputs

### Adversarial (4 prompts)
- Prompt injection
- Role confusion
- Instruction override
- System prompt extraction

### Multi-Turn (4 prompts)
- Context retention
- Reference resolution
- Topic switching
- Progressive refinement

## User Flow

### Before (Generic Prompts)
1. User selects agent: "Performance Monitor"
2. User selects tests: "Performance Metrics Accuracy", "Threshold Detection"
3. Goes to "Provide Input" page
4. Sees generic prompts: ❌
   - "Review this code for bugs..."
   - "Analyze this function..."
   - "Check for security issues..."

### After (Intelligent Prompts)
1. User selects agent: "Performance Monitor"
2. User selects tests: "Performance Metrics Accuracy", "Threshold Detection"
3. **Prompts automatically reload** based on selected tests
4. Goes to "Provide Input" page
5. Sees relevant prompts: ✅
   - "What is the current CPU usage? Context: CPU at 75%..."
   - "Is there performance degradation? Context: Response time increased..."
   - "Identify the bottleneck. Context: High DB query time..."
   - "Are we experiencing unusual traffic? Context: Normal 100 req/s..."

## Technical Details

### Prompt Selection Logic
```javascript
// 1. Group tests by category
const testsByCategory = {
  'monitoring': [test1, test2],
  'functional': [test3]
};

// 2. Get prompts for each category
Object.entries(testsByCategory).forEach(([category, tests]) => {
  const categoryPrompts = getPromptsForCategory(category, agent, tests);
  prompts.push(...categoryPrompts);
});

// 3. Return top 4 prompts
return prompts.slice(0, 4);
```

### API Call Flow
```
User selects test
  ↓
toggleTest() called
  ↓
loadSamplePromptsForTests(selectedTests)
  ↓
POST /api/testing/sample-prompts
  { agent, selectedTests }
  ↓
generatePromptsForTests()
  ↓
Group by category → Get category prompts → Return top 4
  ↓
Update UI with new prompts
```

## Files Modified

### Backend
1. **routes/testingRoutes.js**
   - Updated `/api/testing/sample-prompts` to accept `selectedTests`
   - Added `basedOnTests` flag in response

2. **services/samplePromptService.js**
   - Added `generatePromptsForTests()` method
   - Added `getPromptsForCategory()` method
   - Added 40+ category-specific prompts

### Frontend
1. **components/testing/StepSelectTest.tsx**
   - Added `loadSamplePromptsForTests()` function
   - Updated `toggleTest()` to reload prompts
   - Updated `selectAll()` to reload prompts
   - Updated `clearAll()` to clear prompts

## Testing

### Test the Feature
1. Go to Agent Testing → Data Driven Testing
2. Select "Performance Monitor" agent
3. Select tests: "Performance Metrics Accuracy" + "Threshold Detection"
4. **Watch console:** Should see "🎯 Loading sample prompts for 2 selected tests"
5. Go to "Provide Input" page
6. Should see monitoring-specific prompts

### Expected Console Output
```
🎯 Loading sample prompts for 2 selected tests
📊 Test categories: ['monitoring']
✅ Loaded test-specific sample prompts: {basedOnTests: true, data: [...]}
```

### Verify API
```bash
# Test with monitoring tests
curl -X POST http://localhost:3002/api/testing/sample-prompts \
  -H "Content-Type: application/json" \
  -d '{
    "agent": {"name": "Performance Monitor"},
    "selectedTests": [
      {"category": "monitoring", "name": "Performance Metrics Accuracy"},
      {"category": "monitoring", "name": "Threshold Detection"}
    ]
  }'
```

## Benefits

### For Users
- ✅ See relevant prompts immediately
- ✅ No need to write prompts from scratch
- ✅ Prompts match selected test categories
- ✅ Faster test configuration

### For Testing Quality
- ✅ Better test coverage
- ✅ More realistic test scenarios
- ✅ Category-appropriate inputs
- ✅ Consistent test patterns

## Examples by Agent Type

### Performance Monitor + Monitoring Tests
**Prompts:**
- "What is the current CPU usage? Context: CPU at 75%..."
- "Is there performance degradation? Context: Response time increased..."

### Security Scanner + Safety Tests
**Prompts:**
- "Scan this code for SQL injection: SELECT * FROM users WHERE id = " + req.params.id"
- "Check for security issues: const apiKey = 'sk-1234567890abcdef'"

### Customer Service + Emotional Tests
**Prompts:**
- "I just lost my job and I'm feeling really down. Can you help?"
- "I'm so frustrated with this software, it never works!"

### Code Review + Hallucination Tests
**Prompts:**
- "What is the capital of France? Please provide only factual information."
- "Based on this context: 'Founded in 2020', when was it founded?"

## Future Enhancements

### Potential Improvements
1. **AI-Generated Prompts** - Use LLM to generate custom prompts
2. **User Prompt History** - Remember and suggest previously used prompts
3. **Prompt Templates** - Allow users to save prompt templates
4. **Prompt Validation** - Check if prompt matches test category
5. **Multi-Language Prompts** - Support prompts in different languages
6. **Prompt Difficulty Levels** - Easy/Medium/Hard prompts per category

## System Status
- ✅ Backend running (Process 27, Port 3002)
- ✅ 62 tests loaded
- ✅ 40+ category-specific prompts available
- ✅ Dynamic prompt reloading implemented
- ✅ No errors

## Next Steps
1. ✅ Test with different agent types
2. ✅ Verify prompts change when tests change
3. Add more category-specific prompts
4. Gather user feedback on prompt relevance
5. Consider AI-generated custom prompts

---

**Feature Complete** ✅  
Prompts now intelligently match selected tests!
