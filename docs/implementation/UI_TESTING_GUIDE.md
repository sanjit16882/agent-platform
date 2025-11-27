# UI Testing Guide - DDATF Dashboard

Quick guide to test the DDATF UI components.

## Prerequisites

1. **Backend Running**
   ```bash
   cd local_version/agent-hub-backend
   npm install  # if not already done
   npm start
   ```
   Backend should be running on `http://localhost:3002`

2. **Frontend Running**
   ```bash
   cd local_version/agent-hub-ui
   npm install  # if not already done
   npm start
   ```
   Frontend should be running on `http://localhost:3001`

## Access the Dashboard

Navigate to: **http://localhost:3001/agent-testing**

Then click on the **"🎯 DDATF Framework"** tab (marked with a green "NEW" badge)

## Testing Checklist

### ✅ Test Execution Panel

1. **Load the Page**
   - [ ] Dashboard loads without errors
   - [ ] All tabs are visible
   - [ ] "Execute Tests" tab is active by default

2. **Model Selection**
   - [ ] Model dropdown shows 5 models
   - [ ] Can select different models
   - [ ] Model info shows (Cost, Speed)

3. **Execute Tests**
   - [ ] Click "Run Tests" button
   - [ ] Progress bar appears and animates
   - [ ] Status message shows "Running 50 tests..."
   - [ ] Progress reaches 100%
   - [ ] Success alert appears with results

4. **View Results**
   - [ ] Total tests count is correct (50)
   - [ ] Passed/Failed counts are shown
   - [ ] Pass rate is displayed with color coding
   - [ ] Total cost is shown
   - [ ] Cost per test is displayed
   - [ ] "View Detailed Results" button appears
   - [ ] "Run Again" button appears

### ✅ Model Comparison View

1. **Switch to Compare Tab**
   - [ ] Click "Compare Models" tab
   - [ ] Tab content loads

2. **Model Selection**
   - [ ] 5 model checkboxes are visible
   - [ ] Can check/uncheck models
   - [ ] At least 2 models are pre-selected
   - [ ] Button shows count (e.g., "Compare 2 Models")

3. **Run Comparison**
   - [ ] Click "Compare X Models" button
   - [ ] Progress bar appears
   - [ ] Status shows "Running tests on X models..."
   - [ ] Progress completes

4. **View Comparison Results**
   - [ ] Winners summary appears (Accuracy, Cheapest, Best Value)
   - [ ] Insights are displayed
   - [ ] Recommendation badge is shown
   - [ ] Comparison table shows all models
   - [ ] Winner badges appear in table
   - [ ] Bar chart displays correctly
   - [ ] All metrics are visible

### ✅ Cost Dashboard

1. **Switch to Cost Tab**
   - [ ] Click "Cost Analysis" tab
   - [ ] Tab content loads

2. **Summary Cards**
   - [ ] Total Cost card displays
   - [ ] Total Tokens card displays
   - [ ] Avg Cost/Test card displays
   - [ ] Total Tests card displays
   - [ ] All values are formatted correctly

3. **Cost Savings Analysis** (if comparison was run)
   - [ ] Cheapest model is identified
   - [ ] Most expensive model is shown
   - [ ] Savings percentage is calculated
   - [ ] Recommendation message appears

4. **Charts**
   - [ ] "Cost by Model" bar chart displays
   - [ ] "Cost Distribution" pie chart displays
   - [ ] Charts are interactive (hover tooltips)
   - [ ] Legend is visible

5. **Detailed Table**
   - [ ] Cost breakdown table displays
   - [ ] All columns are visible
   - [ ] Values are formatted correctly
   - [ ] Table is scrollable if needed

### ✅ Test Dimensions Tab

1. **Switch to Dimensions Tab**
   - [ ] Click "Test Dimensions" tab
   - [ ] Tab content loads

2. **Dimension Cards**
   - [ ] All 7 dimension cards are visible
   - [ ] Each card shows test count
   - [ ] Descriptions are readable
   - [ ] Test breakdowns are listed
   - [ ] Color coding is consistent

### ✅ Responsive Design

1. **Desktop (1920x1080)**
   - [ ] Layout looks good
   - [ ] All elements are visible
   - [ ] Charts render properly

2. **Tablet (768x1024)**
   - [ ] Layout adjusts appropriately
   - [ ] Cards stack correctly
   - [ ] Charts remain readable

3. **Mobile (375x667)**
   - [ ] Layout is mobile-friendly
   - [ ] Text is readable
   - [ ] Buttons are tappable
   - [ ] Tables scroll horizontally

### ✅ Error Handling

1. **Backend Offline**
   - [ ] Stop backend server
   - [ ] Try to execute tests
   - [ ] Error message appears
   - [ ] Error is user-friendly

2. **Invalid Selection**
   - [ ] Try to compare with only 1 model
   - [ ] Error message appears
   - [ ] Can recover from error

## Expected Behavior

### Demo Mode
- Tests execute in 30-60 seconds
- Results are simulated but realistic
- Costs are calculated based on token estimates
- All features work without AWS credentials

### Real Mode (Future)
- Tests execute against real AWS Bedrock
- Results are actual API responses
- Costs are real AWS charges
- Requires AWS credentials

## Common Issues

### Issue: "Cannot connect to backend"
**Solution**: Make sure backend is running on port 3002
```bash
cd local_version/agent-hub-backend
npm start
```

### Issue: "Charts not displaying"
**Solution**: Check browser console for errors. Recharts should be installed.
```bash
cd local_version/agent-hub-ui
npm install recharts
```

### Issue: "Page not found"
**Solution**: Make sure you're using the correct URL: `http://localhost:3001/agent-testing`

### Issue: "Styles look broken"
**Solution**: Make sure Bootstrap CSS is loaded. Check browser console.

## Browser Compatibility

Tested and working on:
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## Performance

Expected performance:
- **Initial Load**: < 2 seconds
- **Test Execution**: 30-60 seconds (demo mode)
- **Model Comparison**: 60-120 seconds (demo mode)
- **Chart Rendering**: < 1 second

## Model Comparison Feature

### NEW: Multi-Model Testing

The framework now includes a dedicated **Model Comparison** feature that allows you to:
- Run the same tests across multiple AI models simultaneously
- Compare performance, cost, and accuracy side-by-side
- Identify the best model for your specific use case

**Access**: Navigate to `/agent-testing/model-comparison`

**Documentation**: See `local_version/docs/MODEL_COMPARISON_GUIDE.md` for detailed usage instructions

### Testing Model Comparison

1. **Navigate to Model Comparison**
   - [ ] Click "🔬 Model Comparison" card from main testing page
   - [ ] Page loads without errors

2. **4-Step Workflow**
   - [ ] Step 1: Select an agent
   - [ ] Step 2: Select 2+ models to compare
   - [ ] Step 3: Select tests to run
   - [ ] Step 4: View comparison results

3. **Results Display**
   - [ ] Summary shows best model
   - [ ] Individual model cards show detailed metrics
   - [ ] Per-test breakdown is visible
   - [ ] Export button works

## Next Steps

After testing the UI:

1. **Integrate with Real Backend**
   - Connect to actual AWS Bedrock
   - Use real agent data
   - Store results in database

2. **Add Real-Time Updates**
   - WebSocket for live progress
   - Streaming test results
   - Live cost updates

3. **Export Features**
   - PDF report generation
   - CSV data export
   - Email reports

4. **Advanced Features**
   - Test history view
   - Scheduled testing
   - Custom test suites
   - Benchmark comparisons
   - Parallel model execution for faster comparisons

## Feedback

If you find any issues:
1. Check browser console for errors
2. Check backend logs
3. Verify API endpoints are working
4. Document the issue with screenshots

## Success Criteria

The UI is working correctly if:
- ✅ All tabs load without errors
- ✅ Test execution completes successfully
- ✅ Model comparison shows results
- ✅ Cost dashboard displays charts
- ✅ All dimensions are visible
- ✅ No console errors
- ✅ Responsive on all devices
- ✅ Error handling works

---

**Ready to test!** Navigate to `http://localhost:3001/agent-testing` and click the **"DDATF Framework"** tab! 🚀
