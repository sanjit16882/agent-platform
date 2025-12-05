# 🚀 DDATF Framework - Quick Start Guide

## Overview

The Dimension-Driven AI Agent Testing Framework (DDATF) is now ready for basic testing!

---

## What's Implemented

✅ **Core Framework**
- DimensionOrchestrator
- ResultAggregator
- BaseDimensionExecutor

✅ **7 Dimension Executors**
- Functional (7 tests)
- Integration (5 tests)
- Conversational (10 tests)
- Performance (2 tests)
- Governance (2 tests)
- Security (4 tests)
- Advanced (18 tests)

✅ **48 Test Questions** across 24 categories

---

## Quick Test (Demo Mode)

### 1. Initialize Framework

```javascript
const FrameworkFactory = require('./FrameworkFactory');
const database = require('../services/database');

// Get database connection
const db = database.getDatabase();

// Create framework
const { orchestrator } = FrameworkFactory.create(db, {
  evaluator: null,  // Using simple evaluation
  hallucinationDetector: null,  // Not yet implemented
  vectorDBAdapter: null,  // Not yet implemented
  mcpAdapter: null  // Not yet implemented
});

console.log('Framework initialized!');
```

### 2. Run Tests

```javascript
// Run tests for an agent (demo mode)
const result = await orchestrator.executeTests('test-agent-123', {
  dimensions: FrameworkFactory.getDefaultDimensions(),
  models: ['claude-sonnet'],  // Single model
  parallel: false,  // Sequential for easier debugging
  timeout: 30000,
  mode: 'demo'  // Uses mock responses
});

console.log('Test Results:', JSON.stringify(result, null, 2));
```

### 3. View Results

```javascript
console.log(`Overall Score: ${result.summary.overallScore}/100`);
console.log(`Grade: ${result.summary.grade}`);
console.log(`Pass Rate: ${result.summary.passRate}%`);
console.log(`\nDimension Scores:`);
result.summary.dimensionScores.forEach(ds => {
  console.log(`  ${ds.dimension}: ${ds.score}/100 (${ds.passRate}%)`);
});
```

---

## Model Comparison Test

```javascript
// Compare multiple models
const comparison = await orchestrator.executeTests('test-agent-123', {
  dimensions: FrameworkFactory.getDefaultDimensions(),
  models: ['claude-haiku', 'claude-sonnet', 'amazon-titan'],
  parallel: false,
  timeout: 30000,
  mode: 'demo'
});

console.log('Model Comparison:');
console.log(`Winner: ${comparison.modelComparison.winners.overall}`);
console.log(`Recommendation: ${comparison.modelComparison.recommendation.model}`);
console.log(`Reason: ${comparison.modelComparison.recommendation.reason}`);
```

---

## Test Specific Dimension

```javascript
// Test only security dimension
const securityTest = await orchestrator.executeTests('test-agent-123', {
  dimensions: [
    {
      name: 'Security Testing',
      enabled: true,
      weight: 1.0,
      executor: 'security'
    }
  ],
  models: ['claude-sonnet'],
  mode: 'demo'
});

console.log('Security Test Results:');
console.log(`Score: ${securityTest.summary.dimensionScores[0].score}/100`);
console.log(`Tests: ${securityTest.summary.passed}/${securityTest.summary.totalTests} passed`);
```

---

## Event Listening

```javascript
// Listen to framework events
orchestrator.on('run:started', ({ runId, agentId }) => {
  console.log(`Test run started: ${runId} for agent ${agentId}`);
});

orchestrator.on('dimension:started', ({ dimension, progress }) => {
  console.log(`Testing dimension: ${dimension} (${progress.current}/${progress.total})`);
});

orchestrator.on('dimension:completed', ({ dimension, result }) => {
  console.log(`Completed: ${dimension} - ${result.passed}/${result.total} passed`);
});

orchestrator.on('run:completed', ({ runId, summary }) => {
  console.log(`Test run completed: ${runId}`);
  console.log(`Overall score: ${summary.overallScore}/100`);
});
```

---

## Configuration Options

### Dimension Configuration

```javascript
const customDimensions = [
  {
    name: 'Functional Validation',
    enabled: true,
    weight: 0.20,  // 20% of total score
    executor: 'functional'
  },
  {
    name: 'Security Testing',
    enabled: true,
    weight: 0.30,  // 30% of total score (higher priority)
    executor: 'security'
  },
  {
    name: 'Integration Testing',
    enabled: false,  // Skip this dimension
    weight: 0.0,
    executor: 'integration'
  }
];
```

### Execution Options

```javascript
const options = {
  dimensions: customDimensions,
  models: ['claude-sonnet'],
  parallel: true,  // Run dimensions in parallel
  timeout: 60000,  // 60 second timeout per test
  mode: 'demo'  // 'demo' or 'real' (real not yet implemented)
};
```

---

## Expected Output

### Single Model Test

```json
{
  "runId": "abc-123-def",
  "agentId": "test-agent-123",
  "status": "completed",
  "frameworkVersion": "2.0",
  "summary": {
    "model": "claude-sonnet",
    "overallScore": 94.5,
    "grade": "A",
    "totalTests": 48,
    "passed": 45,
    "failed": 3,
    "passRate": 93.75,
    "dimensionScores": [
      {
        "dimension": "Functional Validation",
        "score": 100,
        "weight": 0.15,
        "passed": 7,
        "total": 7,
        "passRate": 100
      },
      {
        "dimension": "Security Testing",
        "score": 100,
        "weight": 0.10,
        "passed": 4,
        "total": 4,
        "passRate": 100
      }
      // ... more dimensions
    ],
    "insights": [
      "Excellent performance across all dimensions",
      "Strong performance in Security Testing, Functional Validation"
    ],
    "recommendations": [
      {
        "dimension": "Overall",
        "priority": "low",
        "message": "Agent is performing well. Continue monitoring."
      }
    ]
  }
}
```

### Model Comparison

```json
{
  "modelComparison": {
    "models": [
      {
        "model": "claude-haiku",
        "overallScore": 89.2,
        "grade": "B+",
        "passRate": 87.5
      },
      {
        "model": "claude-sonnet",
        "overallScore": 96.8,
        "grade": "A+",
        "passRate": 95.8
      },
      {
        "model": "amazon-titan",
        "overallScore": 85.3,
        "grade": "B",
        "passRate": 83.3
      }
    ],
    "winners": {
      "overall": "claude-sonnet",
      "accuracy": "claude-sonnet",
      "performance": "claude-haiku",
      "value": "claude-haiku"
    },
    "recommendation": {
      "model": "claude-sonnet",
      "reason": "Best overall performance",
      "confidence": "high"
    }
  }
}
```

---

## Troubleshooting

### Issue: "Database not found"
**Solution**: Ensure database is initialized
```javascript
const database = require('../services/database');
await database.initializeDatabase();
```

### Issue: "Dimension executor not found"
**Solution**: Check executor name matches factory
```javascript
// Valid executor names:
// 'functional', 'integration', 'conversational', 
// 'performance', 'governance', 'security', 'advanced'
```

### Issue: "Tests timing out"
**Solution**: Increase timeout or use parallel execution
```javascript
const options = {
  timeout: 60000,  // Increase to 60 seconds
  parallel: true   // Enable parallel execution
};
```

---

## Next Steps

1. **Day 2**: Add advanced evaluators (HallucinationDetector, SafetyEvaluator)
2. **Day 3**: Add integration adapters (VectorDB, MCP)
3. **Week 2**: Connect to real agents
4. **Week 3**: Build UI

---

## Need Help?

- Check `IMPLEMENTATION_PROGRESS.md` for current status
- Check `DAY1_SUMMARY.md` for what's implemented
- Check `AGENT_TESTING_ENHANCEMENT_DESIGN.md` for full design

---

**Framework Version**: 2.0 (DDATF)
**Status**: Core framework complete, ready for testing
**Last Updated**: November 18, 2024
