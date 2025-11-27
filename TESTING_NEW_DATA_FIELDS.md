# Testing New Data Fields - Step-by-Step Guide

## Quick Test Plan

### Step 1: Run a New Test (Generate New Data)
### Step 2: Verify Data in Analytics Dashboard
### Step 3: Check API Response
### Step 4: Verify Database (Optional)

---

## Step 1: Run a New Test

### Option A: Through UI (Recommended)

1. **Navigate to Agent Testing**
   ```
   http://localhost:3001/agent-testing/workflow
   ```

2. **Complete the Workflow**:
   - **Step 1**: Select an agent (e.g., "QE Test Case Generator Pro")
   - **Step 2**: Select models to test:
     - ☑ Claude 3.5 Sonnet
     - ☑ Claude 3 Haiku
   - **Step 3**: Select tests (choose 3-5 tests)
   - **Step 4**: Skip custom tests
   - **Step 5**: Provide input (use sample prompts)
   - **Step 6**: Review
   - **Step 7**: Execute tests

3. **Wait for Completion**
   - Tests will run (takes 30-60 seconds)
   - You'll see progress indicators

4. **Note the Run ID**
   - After completion, you'll see results
   - Copy the run ID (e.g., `run_1764183506648_b3e14012`)

### Option B: Through API (Quick)

```bash
# Run a quick test via API
curl -X POST http://localhost:3002/api/testing/execute \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "qe-test-generator-v2",
    "tests": [
      {
        "id": "test-hallucination-1",
        "name": "Basic Hallucination",
        "category": "hallucination",
        "input": "What is the capital of France?",
        "expected_behavior": "provide_factual_answer"
      }
    ],
    "options": {
      "agentName": "QE Test Case Generator Pro",
      "modelId": "anthropic.claude-3-5-sonnet-20241022-v2:0",
      "suiteName": "Quick Test"
    }
  }'
```

---

## Step 2: Verify Data in Analytics Dashboard

### 2.1 Navigate to Analytics
```
http://localhost:3001/agent-testing/analytics
```

### 2.2 Check Recent Test Runs Table

Look for your test run in the "Recent Test Runs" section.

**What to Verify**:

```
┌─────────────────────────────────────────────────────────┐
│ Recent Test Runs (Grouped by Agent)                     │
│ ┌───────────────────────────────────────────────────┐  │
│ │ ▼ QE Test Case Generator Pro    5 test runs      │  │
│ │   Avg Pass Rate: 90%  Avg Score: 85.0  Cost: $0.75│  │
│ │                                                    │  │
│ │   Date       │ Results │ Pass │ Score │ Cost     │  │
│ │   11/26 2:30 │ 5/5     │ 100% │ 92.0  │ $0.15 ✅ │  │
│ │              │         │      │       │ ↑ NEW!   │  │
│ └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

**Check**:
- ✅ Agent name shows "QE Test Case Generator Pro" (not just ID)
- ✅ Cost column shows actual cost (e.g., "$0.15")
- ✅ Score is displayed correctly

### 2.3 Click "View Details"

Click on the test run to see full details.

**What to Verify**:

```
┌─────────────────────────────────────────────────────────┐
│ Test Results                                             │
│ QE Test Case Generator Pro • 11/26/2025, 2:30 PM        │
│                                                          │
│ Model: Claude 3.5 Sonnet  ✅ (Should show readable name)│
│ Cost: $0.15               ✅ (Should show cost)         │
│ Duration: 5.2s            ✅ (Should show duration)     │
│ Tokens: 30,000            ✅ (Should show token count)  │
└─────────────────────────────────────────────────────────┘
```

---

## Step 3: Check API Response

### 3.1 Get Test Run via API

Use the run ID from Step 1:

```bash
# Replace with your actual run ID
curl http://localhost:3002/api/testing/runs/run_1764183506648_b3e14012
```

### 3.2 Verify Response Structure

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "run_id": "run_1764183506648_b3e14012",
    "agent_id": "qe-test-generator-v2",
    "agent_name": "QE Test Case Generator Pro",  // ✅ Check this
    "model_id": "anthropic.claude-3-5-sonnet-20241022-v2:0",
    "model_name": "Claude 3.5 Sonnet",            // ✅ Check this
    "overall_score": 92,
    "token_usage": {                              // ✅ Check this
      "input": 10000,
      "output": 20000,
      "total": 30000
    },
    "cost": 0.15,                                 // ✅ Check this
    "duration": 5234,
    "timestamp": "2025-11-26T14:30:00Z",
    "summary": {
      "total": 5,
      "passed": 5,
      "failed": 0,
      "pass_rate": 100
    }
  }
}
```

### 3.3 Verify Each New Field

**Checklist**:
- [ ] `agent_name` is present and readable
- [ ] `model_name` is present and readable (not just ID)
- [ ] `token_usage` object exists with input/output/total
- [ ] `cost` is a number (not null or 0)
- [ ] `duration` is present
- [ ] `timestamp` is present

---

## Step 4: Verify in Browser Console

### 4.1 Open Browser DevTools

1. Navigate to Analytics Dashboard
2. Press F12 to open DevTools
3. Go to "Console" tab

### 4.2 Check Network Requests

1. Click "Network" tab in DevTools
2. Filter by "testing" or "runs"
3. Click on a request to `/api/testing/runs`
4. Check the "Response" tab

**Look for**:
```json
{
  "data": [
    {
      "agent_name": "QE Test Case Generator Pro",  // ✅
      "model_name": "Claude 3.5 Sonnet",            // ✅
      "cost": 0.15,                                 // ✅
      "token_usage": { ... }                        // ✅
    }
  ]
}
```

### 4.3 Check Console Logs

Look for logs like:
```
✅ Loaded 5 test runs
📊 Test run data: Object
  - agent_name: "QE Test Case Generator Pro"
  - model_name: "Claude 3.5 Sonnet"
  - cost: 0.15
  - token_usage: {input: 10000, output: 20000, total: 30000}
```

---

## Step 5: Visual Verification Checklist

### In Analytics Dashboard:

#### Recent Test Runs Table:
- [ ] Agent names are readable (not IDs)
- [ ] Cost column shows dollar amounts
- [ ] All data loads without errors

#### Test Results Detail Page:
- [ ] Model name shows "Claude 3.5 Sonnet" (not long ID)
- [ ] Cost is displayed
- [ ] Token usage is shown
- [ ] Duration is displayed

---

## Troubleshooting

### Issue 1: Cost Shows $0.00

**Possible Causes**:
- Model ID not in pricing table
- Token usage calculation failed

**Fix**:
```javascript
// Check if model ID is recognized
const modelId = "anthropic.claude-3-5-sonnet-20241022-v2:0";
console.log('Model name:', getModelName(modelId));
// Should output: "Claude 3.5 Sonnet"
```

**Solution**: Add model to pricing table in `testExecutionService.js`

### Issue 2: Agent Name Shows ID

**Possible Causes**:
- Agent name not passed in options
- Old test run (before fix)

**Fix**: Run a new test with `agentName` in options:
```javascript
{
  agentId: "qe-test-generator-v2",
  options: {
    agentName: "QE Test Case Generator Pro"  // ✅ Add this
  }
}
```

### Issue 3: Token Usage is Null

**Possible Causes**:
- Test results don't have input/output
- Calculation failed

**Fix**: Check test results have `input_used` and `actual_output`:
```javascript
results.forEach(result => {
  console.log('Input:', result.input_used);
  console.log('Output:', result.actual_output);
});
```

### Issue 4: Model Name Shows Long ID

**Possible Causes**:
- Model ID not in MODEL_NAMES mapping
- New model not added

**Fix**: Add model to `getModelName()` in `testExecutionService.js`:
```javascript
const MODEL_NAMES = {
  'your-new-model-id': 'Your Model Name',
  // ... existing models
};
```

---

## Quick Verification Script

Create a test file `verify-new-fields.js`:

```javascript
const axios = require('axios');

async function verifyNewFields() {
  console.log('🧪 Verifying New Data Fields\n');
  
  // 1. Get recent test runs
  const response = await axios.get('http://localhost:3002/api/testing/runs?limit=1');
  const run = response.data.data[0];
  
  console.log('📊 Test Run:', run.run_id);
  console.log('');
  
  // 2. Check each new field
  const checks = {
    'Agent Name': run.agent_name,
    'Model Name': run.model_name,
    'Token Usage': run.token_usage,
    'Cost': run.cost,
    'Duration': run.duration,
    'Timestamp': run.timestamp
  };
  
  Object.entries(checks).forEach(([field, value]) => {
    const status = value ? '✅' : '❌';
    console.log(`${status} ${field}:`, value || 'MISSING');
  });
  
  console.log('');
  
  // 3. Verify token usage structure
  if (run.token_usage) {
    console.log('📈 Token Usage Details:');
    console.log('  Input:', run.token_usage.input);
    console.log('  Output:', run.token_usage.output);
    console.log('  Total:', run.token_usage.total);
  }
  
  console.log('');
  
  // 4. Verify cost calculation
  if (run.cost) {
    console.log('💰 Cost:', `$${run.cost.toFixed(4)}`);
  }
  
  console.log('\n✅ Verification Complete!');
}

verifyNewFields().catch(console.error);
```

Run it:
```bash
node verify-new-fields.js
```

**Expected Output**:
```
🧪 Verifying New Data Fields

📊 Test Run: run_1764183506648_b3e14012

✅ Agent Name: QE Test Case Generator Pro
✅ Model Name: Claude 3.5 Sonnet
✅ Token Usage: [object Object]
✅ Cost: 0.15
✅ Duration: 5234
✅ Timestamp: 2025-11-26T14:30:00Z

📈 Token Usage Details:
  Input: 10000
  Output: 20000
  Total: 30000

💰 Cost: $0.1500

✅ Verification Complete!
```

---

## Summary Checklist

### Before Testing:
- [ ] Backend server running (`npm start` in backend)
- [ ] Frontend server running (`npm start` in frontend)
- [ ] Database initialized

### During Testing:
- [ ] Run a new test (UI or API)
- [ ] Check Analytics Dashboard
- [ ] Verify API response
- [ ] Check browser console

### What to Verify:
- [ ] Agent name is readable (not ID)
- [ ] Model name is readable (not long ID)
- [ ] Cost is calculated and displayed
- [ ] Token usage is tracked
- [ ] Duration is recorded
- [ ] All fields are non-null

### Success Criteria:
- ✅ All new fields present in API response
- ✅ All new fields display correctly in UI
- ✅ Cost calculation is accurate
- ✅ Token usage is reasonable
- ✅ No console errors

---

## Next Steps After Verification

Once verified:
1. ✅ Data structure is correct
2. ✅ Ready to build Agent Catalog integration
3. ✅ Ready to build Agent Executor integration
4. ✅ Ready to build model comparison features

**If all checks pass, you're ready to proceed with the UI implementation!** 🚀
