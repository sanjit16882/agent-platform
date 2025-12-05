# Model Comparison - Quick Reference

## Quick Start

```bash
# 1. Start backend
cd local_version/agent-hub-backend
npm start

# 2. Start frontend
cd local_version/agent-hub-ui
npm start

# 3. Navigate to
http://localhost:4001/agent-testing/model-comparison
```

## API Quick Reference

### Execute Tests with Custom Model

```javascript
POST http://localhost:4002/api/testing/execute

{
  "agentId": "your-agent-id",
  "testIds": ["test-1", "test-2"],
  "options": {
    "modelId": "anthropic.claude-3-5-haiku-20241022-v1:0",
    "timeout": 30000
  }
}
```

### Response Format

```javascript
{
  "success": true,
  "data": {
    "run_id": "uuid",
    "overall_score": 87.5,
    "summary": {
      "total": 10,
      "passed": 9,
      "failed": 1,
      "pass_rate": 90.0
    },
    "results": [...]
  }
}
```

## Available Models

| Model | ID | Best For | Cost |
|-------|-----|----------|------|
| Claude 3.5 Sonnet v2 | `anthropic.claude-3-5-sonnet-20241022-v2:0` | Complex tasks | High |
| Claude 3.5 Haiku | `anthropic.claude-3-5-haiku-20241022-v1:0` | Simple tasks | Low |
| Claude 3 Opus | `anthropic.claude-3-opus-20240229-v1:0` | Previous flagship | High |
| Claude 3 Sonnet | `anthropic.claude-3-sonnet-20240229-v1:0` | Balanced | Medium |

## Component Props

### ModelComparison Component

```typescript
// No props required - self-contained component
<ModelComparison />
```

### State Structure

```typescript
interface ModelTestRun {
  model_id: string;
  model_name: string;
  run_id: string;
  overall_score: number;
  pass_rate: number;
  total_tests: number;
  passed_tests: number;
  failed_tests: number;
  total_time: number;
  results: TestResult[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  error?: string;
}
```

## Common Tasks

### Add a New Model

1. Update `AVAILABLE_MODELS` array in `ModelComparison.tsx`:

```typescript
{
  id: 'your-model-id',
  name: 'Model Name',
  provider: 'Provider',
  description: 'Description'
}
```

### Customize Execution Options

```typescript
const response = await axios.post(`${API_BASE_URL}/api/testing/execute`, {
  agentId: selectedAgent,
  testIds: selectedTests,
  options: {
    modelId: modelId,
    timeout: 30000,        // Adjust timeout
    context: {             // Add custom context
      custom_param: 'value'
    }
  }
});
```

### Export Custom Format

```typescript
const exportResults = () => {
  const data = {
    // Your custom format
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { 
    type: 'application/json' 
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `comparison-${Date.now()}.json`;
  a.click();
};
```

## Troubleshooting

### Issue: Models not executing

**Check:**
```bash
# Backend running?
curl http://localhost:4002/health

# AWS credentials configured?
aws sts get-caller-identity

# Model ID correct?
# Check AWS Bedrock console for available models
```

### Issue: Slow execution

**Solutions:**
- Reduce number of tests
- Use fewer models
- Check network connection
- Verify AWS region is optimal

### Issue: Results not displaying

**Check:**
```javascript
// Browser console for errors
console.log(modelRuns);

// API response
console.log(response.data);

// State updates
console.log('Status:', run.status);
```

## Code Snippets

### Programmatic Model Comparison

```javascript
const compareModels = async (agentId, testIds, modelIds) => {
  const results = [];
  
  for (const modelId of modelIds) {
    const response = await fetch('http://localhost:4002/api/testing/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agentId,
        testIds,
        options: { modelId }
      })
    });
    
    const data = await response.json();
    results.push({
      modelId,
      score: data.data.summary.overall_score,
      passRate: data.data.summary.pass_rate
    });
  }
  
  return results;
};

// Usage
const results = await compareModels(
  'agent-123',
  ['test-1', 'test-2'],
  [
    'anthropic.claude-3-5-haiku-20241022-v1:0',
    'anthropic.claude-3-5-sonnet-20241022-v2:0'
  ]
);

console.log('Best model:', results.sort((a, b) => b.score - a.score)[0]);
```

### Custom Results Display

```typescript
const CustomResults: React.FC<{ modelRuns: ModelTestRun[] }> = ({ modelRuns }) => {
  const bestModel = modelRuns
    .filter(r => r.status === 'completed')
    .reduce((best, current) => 
      current.overall_score > best.overall_score ? current : best
    );
  
  return (
    <div>
      <h2>Winner: {bestModel.model_name}</h2>
      <p>Score: {bestModel.overall_score}%</p>
    </div>
  );
};
```

### Parallel Execution (Future)

```typescript
// Not yet implemented, but here's how it could work:
const executeParallel = async () => {
  const promises = selectedModels.map(modelId =>
    axios.post(`${API_BASE_URL}/api/testing/execute`, {
      agentId: selectedAgent,
      testIds: selectedTests,
      options: { modelId }
    })
  );
  
  const results = await Promise.all(promises);
  // Process results...
};
```

## File Locations

```
Frontend:
├── src/components/testing/
│   ├── ModelComparison.tsx          ← Main component
│   └── AgentTestingMain.tsx         ← Navigation

Backend:
├── services/
│   └── testExecutionService.js      ← Execution logic
└── src/services/
    └── bedrockService.js            ← AWS Bedrock calls

Documentation:
├── docs/
│   ├── MODEL_COMPARISON_GUIDE.md    ← User guide
│   ├── MODEL_COMPARISON_FLOW.md     ← Architecture
│   └── MODEL_COMPARISON_QUICK_REF.md ← This file
```

## Testing Checklist

- [ ] Backend running on port 4002
- [ ] Frontend running on port 4001
- [ ] Can navigate to model comparison page
- [ ] Can select agent
- [ ] Can select multiple models
- [ ] Can select tests
- [ ] Execution starts and shows progress
- [ ] Results display correctly
- [ ] Export works
- [ ] Error handling works

## Performance Benchmarks

| Scenario | Expected Time |
|----------|---------------|
| 2 models, 5 tests | ~20-30 seconds |
| 3 models, 10 tests | ~60-90 seconds |
| 4 models, 15 tests | ~120-180 seconds |

*Times vary based on model speed and test complexity*

## Best Practices

✅ **DO:**
- Start with 2 models and 5 tests
- Include variety in test selection
- Export results for documentation
- Run multiple times for critical decisions
- Consider cost vs. performance

❌ **DON'T:**
- Select only 1 model (minimum 2)
- Run 50+ tests (too slow)
- Ignore failed models (check errors)
- Compare without baseline
- Forget to document findings

## Support

- **Documentation**: `local_version/docs/MODEL_COMPARISON_GUIDE.md`
- **Architecture**: `local_version/docs/MODEL_COMPARISON_FLOW.md`
- **Implementation**: `local_version/docs/MODEL_COMPARISON_IMPLEMENTATION.md`
- **UI Testing**: `docs/implementation/UI_TESTING_GUIDE.md`

## Version

- **Feature Version**: 1.0.0
- **Added**: November 2025
- **Status**: Production Ready ✅
