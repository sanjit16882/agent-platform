# Agent Testing Integration Design Document

## Overview
Integrate agent testing results and model comparison directly into the Agent Catalog and Agent Executor pages to help users evaluate performance and choose the right model for each agent.

---

## 1. Agent Catalog Page - High-Level Insights

### Location: Agent Card (Bottom Section)

### What to Display (Non-Duplicate, Meaningful Insights):

```
┌─────────────────────────────────────────────────────────┐
│  QE Test Case Generator Pro                             │
│  Production-ready AI-powered test case generation...    │
│                                                          │
│  Category: QE  |  Usage: 1,247  |  Rating: ⭐⭐⭐⭐⭐    │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 🧪 Test Performance Summary                     │   │
│  │ ┌─────────────────────────────────────────────┐ │   │
│  │ │ Best Model: Claude 3.5 Sonnet    Score: 92% │ │   │
│  │ │ Last Tested: 2 hours ago         Tests: 15  │ │   │
│  │ │                                              │ │   │
│  │ │ Model Comparison:                            │ │   │
│  │ │ Claude 3.5 Sonnet  ████████████████░░  92%  │ │   │
│  │ │ Claude 3 Haiku     ████████████░░░░░░  78%  │ │   │
│  │ │ Titan Text         ██████████░░░░░░░░  65%  │ │   │
│  │ └─────────────────────────────────────────────┘ │   │
│  │                                                  │   │
│  │ [Run Quick Test]  [View Full Analysis →]        │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  [Execute Agent]  [Configure]  [View Details]           │
└─────────────────────────────────────────────────────────┘
```

### Key Metrics on Agent Card:

1. **Best Performing Model** (1 line)
   - Model name + Overall score
   - Example: "Claude 3.5 Sonnet - 92%"

2. **Last Test Info** (1 line)
   - When last tested + number of tests
   - Example: "2 hours ago • 15 tests"

3. **Model Comparison Bar Chart** (3-4 lines max)
   - Top 3 models with visual bars
   - Scores only (no detailed breakdown)
   - Color-coded: Green (>85%), Yellow (70-85%), Red (<70%)

4. **Quick Actions** (2 buttons)
   - "Run Quick Test" - Fast 5-test validation
   - "View Full Analysis" - Navigate to detailed page

### Design Principles:
- ✅ **Glanceable** - See best model in 2 seconds
- ✅ **Actionable** - Quick test or deep dive
- ✅ **Non-Intrusive** - Collapsible section (optional)
- ✅ **No Duplication** - Only summary, not details

---

## 2. Agent Executor Page - Deep Analysis

### Location: New Tab "Testing & Performance"

### What to Display (Detailed, Insightful Analysis):

```
┌─────────────────────────────────────────────────────────┐
│  QE Test Case Generator Pro - Testing & Performance     │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Tabs: [Execute] [Testing & Performance] [History] │ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  📊 Model Performance Comparison                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Select Models to Compare:                         │ │
│  │ ☑ Claude 3.5 Sonnet  ☑ Claude 3 Haiku  ☐ Titan   │ │
│  │                                                    │ │
│  │ [Run Comprehensive Test Suite]  [Export Results]  │ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Overall Performance Summary                             │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Model              │ Score │ Pass │ Cost │ Speed  │ │
│  ├───────────────────────────────────────────────────┤ │
│  │ Claude 3.5 Sonnet  │ 92%   │ 18/20│ $0.15│ 2.3s  │ │
│  │ Claude 3 Haiku     │ 78%   │ 15/20│ $0.05│ 1.1s  │ │
│  │ Titan Text         │ 65%   │ 13/20│ $0.03│ 0.8s  │ │
│  └───────────────────────────────────────────────────┘ │
│                                                          │
│  💡 Recommendation: Claude 3.5 Sonnet                   │
│  Best for: Quality-critical tasks                       │
│  Trade-off: 3x cost, 2x speed vs Haiku                 │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Category-by-Category Breakdown                          │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Hallucination Detection                           │ │
│  │ Claude 3.5: ████████████████████░  95%           │ │
│  │ Haiku:      ████████████████░░░░░  85%           │ │
│  │ Titan:      ████████████░░░░░░░░░  72%           │ │
│  │                                                    │ │
│  │ Functional Correctness                            │ │
│  │ Claude 3.5: ████████████████░░░░░  88%           │ │
│  │ Haiku:      ██████████████░░░░░░░  75%           │ │
│  │ Titan:      ████████████░░░░░░░░░  68%           │ │
│  │                                                    │ │
│  │ Safety & Compliance                               │ │
│  │ Claude 3.5: ████████████████████░  98%           │ │
│  │ Haiku:      ████████████████░░░░░  82%           │ │
│  │ Titan:      ██████████████░░░░░░░  75%           │ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Individual Test Results                                 │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Test Name              │ Claude 3.5│ Haiku │ Titan│ │
│  ├───────────────────────────────────────────────────┤ │
│  │ Basic Hallucination    │ ✅ 95%   │ ✅ 88%│ ⚠️ 72%│ │
│  │ Complex Reasoning      │ ✅ 92%   │ ⚠️ 75%│ ❌ 58%│ │
│  │ Edge Case Handling     │ ✅ 88%   │ ⚠️ 70%│ ❌ 62%│ │
│  │ Safety Check           │ ✅ 98%   │ ✅ 85%│ ⚠️ 78%│ │
│  │ ... (16 more tests)                               │ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Cost-Performance Analysis                               │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Cost per 1000 Queries vs Quality                  │ │
│  │                                                    │ │
│  │ Quality                                            │ │
│  │   100% │                    ● Claude 3.5 ($15)    │ │
│  │    90% │                                           │ │
│  │    80% │          ● Haiku ($5)                    │ │
│  │    70% │                                           │ │
│  │    60% │    ● Titan ($3)                          │ │
│  │        └────────────────────────────────────────  │ │
│  │         $0    $5    $10   $15   $20   Cost        │ │
│  │                                                    │ │
│  │ 💡 Sweet Spot: Haiku for cost-sensitive tasks    │ │
│  │    Use Claude 3.5 for critical operations         │ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Historical Performance Trends                           │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Score Over Time (Last 30 Days)                    │ │
│  │                                                    │ │
│  │ 100% │     ●─●─●─●─●  Claude 3.5                 │ │
│  │  90% │                                            │ │
│  │  80% │   ●─●─●─●─●─●  Haiku                      │ │
│  │  70% │                                            │ │
│  │  60% │ ●─●─●─●─●─●─●  Titan                      │ │
│  │      └────────────────────────────────────────   │ │
│  │       Nov 1    Nov 15    Nov 30                   │ │
│  │                                                    │ │
│  │ 📈 Trend: All models improving over time          │ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  AI-Powered Insights                                     │
│  ┌───────────────────────────────────────────────────┐ │
│  │ 🤖 Analysis by Claude 3.5                         │ │
│  │                                                    │ │
│  │ Key Findings:                                      │ │
│  │ • Claude 3.5 excels at complex reasoning (+17%)   │ │
│  │ • Haiku offers best cost/performance ratio        │ │
│  │ • Titan struggles with edge cases (-15%)          │ │
│  │                                                    │ │
│  │ Recommendations:                                   │ │
│  │ 1. Use Claude 3.5 for production QE tasks         │ │
│  │ 2. Use Haiku for development/testing              │ │
│  │ 3. Avoid Titan for complex test generation        │ │
│  │                                                    │ │
│  │ Optimization Opportunities:                        │ │
│  │ • Improve prompt for Haiku (+5% potential)        │ │
│  │ • Add examples for Titan edge cases               │ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Detailed Metrics on Executor Page:

1. **Overall Performance Table**
   - Score, Pass Rate, Cost, Speed for each model
   - Side-by-side comparison
   - Sortable columns

2. **Category Breakdown**
   - Hallucination, Functional, Safety, etc.
   - Visual bars for each model
   - Percentage scores

3. **Individual Test Results**
   - Test-by-test comparison
   - Pass/fail indicators
   - Scores for each model

4. **Cost-Performance Analysis**
   - Scatter plot: Cost vs Quality
   - Sweet spot identification
   - ROI recommendations

5. **Historical Trends**
   - Performance over time
   - Model comparison trends
   - Improvement tracking

6. **AI-Powered Insights**
   - Key findings
   - Specific recommendations
   - Optimization opportunities

---

## 3. Information Architecture

### Agent Catalog (Summary View)
```
Purpose: Quick decision-making
Audience: All users browsing agents
Goal: Identify best model at a glance

Metrics:
- Best model name + score (1 line)
- Last test date + count (1 line)
- Top 3 models bar chart (3 lines)
- Quick actions (2 buttons)

Total: ~7 lines, <100 words
```

### Agent Executor (Detailed View)
```
Purpose: Deep analysis and optimization
Audience: Users executing/configuring agents
Goal: Understand performance nuances

Metrics:
- Overall comparison table
- Category-by-category breakdown
- Individual test results
- Cost-performance analysis
- Historical trends
- AI insights

Total: Full page, ~500 words
```

---

## 4. Data Flow

### Agent Catalog Data:
```javascript
{
  agentId: "qe-test-generator-v2",
  testingSummary: {
    bestModel: {
      name: "Claude 3.5 Sonnet",
      score: 92,
      modelId: "anthropic.claude-3-5-sonnet-20241022-v2:0"
    },
    lastTested: "2025-11-26T10:00:00Z",
    totalTests: 15,
    modelComparison: [
      { model: "Claude 3.5 Sonnet", score: 92 },
      { model: "Claude 3 Haiku", score: 78 },
      { model: "Titan Text", score: 65 }
    ]
  }
}
```

### Agent Executor Data:
```javascript
{
  agentId: "qe-test-generator-v2",
  detailedAnalysis: {
    models: [
      {
        modelId: "anthropic.claude-3-5-sonnet-20241022-v2:0",
        modelName: "Claude 3.5 Sonnet",
        overallScore: 92,
        passRate: 90,
        totalCost: 0.15,
        avgSpeed: 2.3,
        categoryScores: {
          hallucination: 95,
          functional: 88,
          safety: 98
        },
        testResults: [
          {
            testName: "Basic Hallucination",
            score: 95,
            passed: true
          }
        ]
      }
    ],
    insights: {
      keyFindings: [...],
      recommendations: [...],
      optimizations: [...]
    },
    trends: {
      historical: [...]
    }
  }
}
```

---

## 5. API Endpoints Needed

### For Agent Catalog:
```
GET /api/agents/:agentId/testing/summary
Response: {
  bestModel: { name, score, modelId },
  lastTested: timestamp,
  totalTests: number,
  modelComparison: [{ model, score }]
}
```

### For Agent Executor:
```
GET /api/agents/:agentId/testing/detailed
Response: {
  models: [...],
  insights: {...},
  trends: {...}
}

POST /api/agents/:agentId/testing/run
Body: { models: [...], testSuiteId: "..." }
Response: { runId, status }
```

---

## 6. UI Components to Create

### Agent Catalog:
1. **TestingSummaryBadge** - Compact summary on card
2. **ModelComparisonMini** - Small bar chart (3 models)
3. **QuickTestButton** - Run 5-test validation

### Agent Executor:
1. **ModelComparisonTable** - Full comparison table
2. **CategoryBreakdownChart** - Detailed category bars
3. **TestResultsGrid** - Individual test comparison
4. **CostPerformanceScatter** - Cost vs quality plot
5. **TrendChart** - Historical performance
6. **AIInsightsPanel** - AI-generated recommendations

---

## 7. User Flows

### Flow 1: Quick Evaluation (Agent Catalog)
```
1. User browses Agent Catalog
2. Sees "Best Model: Claude 3.5 - 92%" on card
3. Sees bar chart: Claude 3.5 (92%), Haiku (78%), Titan (65%)
4. Decision: "Claude 3.5 is best, I'll use that"
5. Clicks "Execute Agent" → Goes to executor with Claude 3.5 pre-selected
```

### Flow 2: Deep Analysis (Agent Executor)
```
1. User clicks "View Full Analysis" on Agent Card
2. Navigates to Agent Executor → "Testing & Performance" tab
3. Sees detailed comparison table
4. Reviews category breakdown
5. Checks cost-performance analysis
6. Reads AI insights
7. Decision: "Use Claude 3.5 for production, Haiku for dev"
8. Configures agent with selected model
```

### Flow 3: Run New Test
```
1. User on Agent Executor page
2. Clicks "Run Comprehensive Test Suite"
3. Selects models to compare
4. Test runs (shows progress)
5. Results appear in all sections
6. AI generates new insights
7. User exports results for team
```

---

## 8. Design Principles

### Agent Catalog (Summary):
- ✅ **Glanceable** - 2-second decision
- ✅ **Non-intrusive** - Doesn't overwhelm card
- ✅ **Actionable** - Clear next steps
- ✅ **Consistent** - Same format for all agents

### Agent Executor (Detailed):
- ✅ **Comprehensive** - All relevant data
- ✅ **Comparative** - Easy model comparison
- ✅ **Insightful** - AI-powered recommendations
- ✅ **Exportable** - Share with team

---

## 9. Avoid Duplication

### What NOT to Show on Agent Catalog:
- ❌ Individual test results
- ❌ Category breakdowns
- ❌ Cost analysis
- ❌ Historical trends
- ❌ AI insights
- ❌ Detailed scores

### What NOT to Show on Agent Executor:
- ❌ Agent description (already on main tab)
- ❌ Basic agent info (already visible)
- ❌ Deployment status (not relevant here)

---

## 10. Implementation Priority

### Phase 1 (MVP):
1. Agent Catalog: Testing summary badge
2. Agent Catalog: Model comparison mini chart
3. Agent Executor: Comparison table
4. Agent Executor: Category breakdown
5. Backend: Summary and detailed APIs

### Phase 2 (Enhanced):
1. Agent Executor: Individual test results
2. Agent Executor: Cost-performance analysis
3. Agent Catalog: Quick test button
4. Backend: Run test endpoint

### Phase 3 (Advanced):
1. Agent Executor: Historical trends
2. Agent Executor: AI insights
3. Export functionality
4. Automated testing schedules

---

## Summary

**Agent Catalog**: Show only high-level summary (best model, scores, quick comparison)  
**Agent Executor**: Show comprehensive analysis (detailed comparison, insights, trends)  
**No Duplication**: Each view serves different purpose and audience  
**Actionable**: Clear recommendations and next steps at both levels
