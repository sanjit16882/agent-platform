# Where to Find the Run ID - Visual Guide

## After Test Execution Completes

### Location: Step 8 - Results Page

When you complete the test workflow, you'll see the results page. The **Run ID** is now displayed prominently at the top.

---

## Visual Guide

```
┌─────────────────────────────────────────────────────────┐
│  Step 8 of 9: Results                                    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Test Results                                            │
│  View detailed test execution results                    │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Run ID: run_1764183506648_b3e14012    [📋 Copy]  │ │
│  │         ↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑  │ │
│  │         THIS IS YOUR RUN ID!                      │ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘

┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│  Total   │ │  Passed  │ │  Failed  │ │ Overall  │
│  Tests   │ │  Tests   │ │  Tests   │ │  Score   │
│   20     │ │   18     │ │    2     │ │  78.0%   │
└──────────┘ └──────────┘ └──────────┘ └──────────┘
```

---

## Step-by-Step Instructions

### 1. Complete Test Workflow

Navigate through all steps:
```
Step 1: Select Agent          ✅
Step 2: Select Models         ✅
Step 3: Select Tests          ✅
Step 4: Custom Tests (skip)   ✅
Step 5: Provide Input         ✅
Step 6: Review                ✅
Step 7: Execute               ✅ (Wait for completion)
Step 8: Results               ← YOU ARE HERE
```

### 2. Look at the Top of Results Page

The Run ID is displayed in a gray box at the very top:

```
┌─────────────────────────────────────────┐
│ Run ID: run_1764183506648_b3e14012      │
│                                [Copy]   │
└─────────────────────────────────────────┘
```

### 3. Copy the Run ID

**Option A: Click the Copy Button**
- Click the "📋 Copy" button
- Run ID is copied to clipboard
- You'll see "Run ID copied to clipboard!" alert

**Option B: Select and Copy**
- Click and drag to select the run ID text
- Press Ctrl+C (Windows) or Cmd+C (Mac)

---

## Alternative Ways to Find Run ID

### Method 1: Browser URL (After Clicking "View Details")

If you click "View Details" on a test run, the URL will contain the run ID:

```
http://localhost:3001/agent-testing/results/run_1764183506648_b3e14012
                                         ↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑
                                         THIS IS THE RUN ID
```

### Method 2: Browser Console

1. Open DevTools (F12)
2. Go to Console tab
3. Look for logs like:
   ```
   ✅ Test execution completed
   Run ID: run_1764183506648_b3e14012
   ```

### Method 3: Network Tab

1. Open DevTools (F12)
2. Go to Network tab
3. Look for requests to `/api/testing/runs/`
4. The run ID is in the URL

### Method 4: Analytics Dashboard

1. Go to: `http://localhost:3001/agent-testing/analytics`
2. Scroll to "Recent Test Runs"
3. Your latest run will be at the top
4. The run ID is in the first column (or hover to see)

---

## Run ID Format

Run IDs follow this pattern:
```
run_[timestamp]_[random-string]

Example:
run_1764183506648_b3e14012
    ↑↑↑↑↑↑↑↑↑↑↑↑↑ ↑↑↑↑↑↑↑↑↑↑↑↑
    Timestamp     Random ID
```

- **Timestamp**: Unix timestamp in milliseconds
- **Random String**: 12-character unique identifier

---

## What to Do With the Run ID

### Use Case 1: View Results Later
```
http://localhost:3001/agent-testing/results/YOUR_RUN_ID
```

### Use Case 2: API Access
```bash
curl http://localhost:3002/api/testing/runs/YOUR_RUN_ID
```

### Use Case 3: Export Results
```bash
curl http://localhost:3002/api/testing/runs/YOUR_RUN_ID/export?format=json
```

### Use Case 4: Compare Versions
1. Go to: `http://localhost:3001/agent-testing/comparison`
2. Select your agent
3. Choose this run ID in the dropdown
4. Compare with another run

---

## Troubleshooting

### Issue: "I don't see the Run ID box"

**Solution**: Make sure you're on Step 8 (Results) after test execution completes.

**Check**:
- Did tests finish executing?
- Are you on the Results step?
- Did the page load completely?

### Issue: "Run ID box is empty"

**Solution**: The test execution may have failed.

**Check**:
- Look for error messages
- Check browser console for errors
- Try running tests again

### Issue: "Copy button doesn't work"

**Solution**: Manually select and copy the text.

**Steps**:
1. Click and drag to select the run ID
2. Press Ctrl+C (Windows) or Cmd+C (Mac)

---

## Quick Reference

### Where to Find Run ID:

1. **Primary Location**: Step 8 Results page (top of page)
2. **URL**: After clicking "View Details"
3. **Console**: Browser DevTools console logs
4. **Analytics**: Recent Test Runs table
5. **Network**: DevTools Network tab

### How to Copy:

1. **Click**: "📋 Copy" button
2. **Select**: Click and drag, then Ctrl+C
3. **Console**: Copy from console logs

### What It Looks Like:

```
run_1764183506648_b3e14012
```

---

## Screenshot Reference

### Before (Old Version):
```
┌─────────────────────────────────────────┐
│  Test Results                           │
│  View detailed test execution results   │
│                                         │
│  ❌ No Run ID displayed                │
└─────────────────────────────────────────┘
```

### After (New Version):
```
┌─────────────────────────────────────────┐
│  Test Results                           │
│  View detailed test execution results   │
│  ┌─────────────────────────────────┐   │
│  │ Run ID: run_176...  [📋 Copy]  │   │
│  │ ✅ Run ID clearly visible       │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

---

## Summary

**Where**: Step 8 - Results page, at the top  
**Format**: `run_[timestamp]_[random]`  
**Copy**: Click "📋 Copy" button or select text  
**Use**: View results, API access, comparisons  

**Can't find it?** Check:
1. Are you on Step 8 (Results)?
2. Did tests complete successfully?
3. Is the page fully loaded?

**Still stuck?** Check browser console or Analytics dashboard!
