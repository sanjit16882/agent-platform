# Model Comparison Guide

## Overview

The Model Comparison feature allows you to run the same test suite across multiple AI models simultaneously and compare their performance. This helps you:

- **Select the best model** for your specific use case
- **Optimize costs** by comparing performance vs. price
- **Track model improvements** across different versions
- **Make data-driven decisions** about model selection

## Available Models

### Anthropic Claude Models

1. **Claude 3.5 Sonnet v2** (`anthropic.claude-3-5-sonnet-20241022-v2:0`)
   - Most capable model
   - Best for complex reasoning tasks
   - Higher cost, best performance

2. **Claude 3.5 Haiku** (`anthropic.claude-3-5-haiku-20241022-v1:0`)
   - Fast and efficient
   - Good for simple to moderate tasks
   - Lower cost, good performance

3. **Claude 3 Opus** (`anthropic.claude-3-opus-20240229-v1:0`)
   - Previous generation flagship
   - Strong performance on complex tasks
   - Moderate cost

4. **Claude 3 Sonnet** (`anthropic.claude-3-sonnet-20240229-v1:0`)
   - Balanced performance and speed
   - Good for general purpose tasks
   - Moderate cost

## How to Use

### Step 1: Select Agent
Choose the agent you want to test across different models.

### Step 2: Select Models
Select 2 or more models to compare. We recommend:
- **2-4 models** for focused comparison
- Include at least one fast model (Haiku) and one powerful model (Sonnet/Opus)

### Step 3: Select Tests
Choose the tests you want to run. Consider:
- **Test variety**: Include different test categories
- **Test count**: 5-15 tests provide good coverage without excessive runtime
- **Relevance**: Select tests that match your use case

### Step 4: Review Results
The system will:
1. Run tests sequentially for each model
2. Display real-time progress
3. Show detailed results for each model
4. Highlight the best performing model

## Results Interpretation

### Metrics Provided

- **Overall Score**: Average score across all tests (0-100%)
- **Pass Rate**: Percentage of tests that passed
- **Tests Passed**: Number of passed tests vs. total
- **Total Time**: Total execution time for all tests
- **Individual Test Results**: Detailed breakdown per test

### Comparison Insights

The results page shows:
- **Best Model**: Model with highest overall score
- **Side-by-side comparison**: All models displayed together
- **Per-test breakdown**: See which model performed best on each test
- **Performance vs. Cost**: Consider both metrics for optimal selection

## Best Practices

### Model Selection Strategy

1. **Start with 2-3 models**
   - One fast model (Haiku)
   - One powerful model (Sonnet v2)
   - One balanced model (Sonnet v1 or Opus)

2. **Consider your use case**
   - **Simple tasks**: Compare Haiku vs. Sonnet
   - **Complex reasoning**: Compare Opus vs. Sonnet v2
   - **Cost optimization**: Compare all models to find sweet spot

3. **Test variety matters**
   - Include tests from multiple categories
   - Mix simple and complex tests
   - Include edge cases

### Interpreting Results

1. **Don't just look at overall score**
   - Check pass rate
   - Review individual test results
   - Consider execution time

2. **Cost vs. Performance trade-off**
   - Haiku: ~10x cheaper than Sonnet v2
   - If Haiku scores 85% and Sonnet v2 scores 90%, Haiku might be better value

3. **Consistency matters**
   - A model with consistent 80% scores might be better than one with 90% and 60%
   - Check standard deviation across tests

## Use Cases

### 1. Initial Model Selection
**Goal**: Choose the best model for a new agent

**Approach**:
- Test all 4 models
- Use comprehensive test suite (15-20 tests)
- Focus on tests matching your use case

### 2. Cost Optimization
**Goal**: Reduce costs without sacrificing quality

**Approach**:
- Compare current model vs. cheaper alternatives
- Use production-like test scenarios
- Set acceptable performance threshold (e.g., 85%)

### 3. Model Upgrade Evaluation
**Goal**: Decide if upgrading to newer model is worth it

**Approach**:
- Compare old vs. new version
- Use existing test suite
- Look for improvements in weak areas

### 4. A/B Testing
**Goal**: Validate model performance in specific scenarios

**Approach**:
- Select 2 models
- Use targeted test suite
- Run multiple times for consistency

## Export and Reporting

### Export Options
- **JSON format**: Complete results with all metadata
- **Filename**: `model-comparison-{timestamp}.json`

### Report Contents
- Agent information
- Timestamp
- Model configurations
- Complete test results
- Performance metrics

### Using Exported Data
```javascript
{
  "agent_id": "test-agent",
  "agent_name": "Test Agent",
  "timestamp": "2025-11-21T10:30:00Z",
  "models": [
    {
      "model_id": "anthropic.claude-3-5-haiku-20241022-v1:0",
      "model_name": "Claude 3.5 Haiku",
      "overall_score": 87.5,
      "pass_rate": 90.0,
      "total_tests": 10,
      "passed_tests": 9,
      "failed_tests": 1,
      "total_time": 15234,
      "results": [...]
    }
  ]
}
```

## Tips and Tricks

1. **Run during off-peak hours** for faster execution
2. **Start small** (2 models, 5 tests) to validate setup
3. **Use consistent test data** for fair comparison
4. **Document your findings** for future reference
5. **Re-run periodically** as models improve

## Troubleshooting

### Model Execution Failed
- Check AWS credentials
- Verify model ID is correct
- Check AWS region configuration
- Review error message for details

### Slow Execution
- Reduce number of tests
- Use fewer models
- Check network connection
- Consider running during off-peak hours

### Inconsistent Results
- Run comparison multiple times
- Check for flaky tests
- Verify test inputs are deterministic
- Review temperature settings

## API Integration

You can also run model comparisons programmatically:

```javascript
// Execute tests for multiple models
const models = [
  'anthropic.claude-3-5-haiku-20241022-v1:0',
  'anthropic.claude-3-5-sonnet-20241022-v2:0'
];

for (const modelId of models) {
  const response = await fetch('http://localhost:3002/api/testing/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      agentId: 'your-agent-id',
      testIds: ['test-1', 'test-2', 'test-3'],
      options: {
        modelId: modelId,
        timeout: 30000
      }
    })
  });
  
  const result = await response.json();
  console.log(`${modelId}: ${result.data.summary.overall_score}%`);
}
```

## Future Enhancements

Planned features:
- Statistical significance testing
- Cost estimation per model
- Historical comparison tracking
- Automated model recommendations
- Parallel execution for faster results
- Custom model configurations
- Performance benchmarking

## Support

For issues or questions:
- Check the main testing documentation
- Review API documentation
- Check AWS Bedrock model availability
- Verify your AWS account has access to selected models
