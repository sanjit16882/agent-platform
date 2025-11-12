/**
 * Agent Testing Framework API Routes
 * Implements comprehensive testing for AI agents
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// S3 Storage for test runs
const S3TestRunStorage = require('../services/s3TestRunStorage');
const s3TestRunStorage = new S3TestRunStorage();

// S3 Storage for agents
const S3AgentStorage = require('../services/s3AgentStorage');
const s3AgentStorageInstance = new S3AgentStorage();

// Test Execution Engine
const TestExecutionEngine = require('../services/testExecutionEngine');
const testExecutionEngine = new TestExecutionEngine(s3AgentStorageInstance, s3TestRunStorage);

// In-memory cache for active test runs (will be synced to S3)
const activeTestRuns = new Map<string, any>();

// 7 Universal Test Categories with test cases
const UNIVERSAL_TEST_CATEGORIES = [
  {
    id: 'functional-validation',
    name: 'Functional Validation',
    description: 'Core functionality and output validation tests',
    testCount: 5,
    testCases: [
      {
        id: 'prompt-output-validation',
        name: 'Prompt Output Validation',
        description: 'Validates that agent produces expected output format',
        example: 'Input: "Summarize this text" → Expected: Valid summary with key points'
      },
      {
        id: 'intent-detection',
        name: 'Intent Detection Accuracy',
        description: 'Tests agent ability to understand user intent',
        example: 'Input: "Book a flight" → Expected: Correctly identifies booking intent'
      },
      {
        id: 'response-format',
        name: 'Response Format Validation',
        description: 'Ensures output matches required format (JSON, text, etc.)',
        example: 'Input: Request JSON → Expected: Valid JSON response'
      },
      {
        id: 'multi-turn-context',
        name: 'Multi-turn Context Handling',
        description: 'Tests conversation context retention',
        example: 'Turn 1: "My name is John" → Turn 2: "What\'s my name?" → Expected: "John"'
      },
      {
        id: 'error-handling',
        name: 'Error Handling & Fallback',
        description: 'Tests graceful error handling',
        example: 'Input: Invalid request → Expected: Helpful error message'
      }
    ]
  },
  {
    id: 'integration-testing',
    name: 'Integration Testing',
    description: 'External service and API integration tests',
    testCount: 3,
    testCases: [
      {
        id: 'mcp-api-integration',
        name: 'MCP / API Integration',
        description: 'Tests integration with external APIs',
        example: 'Call weather API → Expected: Valid weather data returned'
      },
      {
        id: 'webhook-handling',
        name: 'Webhook / Event Handling',
        description: 'Tests webhook and event processing',
        example: 'Receive webhook → Expected: Correct event processing'
      },
      {
        id: 'database-connection',
        name: 'Database or Knowledge Base Connection',
        description: 'Tests data retrieval from knowledge sources',
        example: 'Query knowledge base → Expected: Relevant information retrieved'
      }
    ]
  },
  {
    id: 'conversational-behavior',
    name: 'Conversational Behavior',
    description: 'Natural language quality and coherence tests',
    testCount: 3,
    testCases: [
      {
        id: 'tone-consistency',
        name: 'Tone & Style Consistency',
        description: 'Validates consistent tone across responses',
        example: 'Multiple queries → Expected: Consistent professional tone'
      },
      {
        id: 'coherence-relevance',
        name: 'Coherence & Relevance',
        description: 'Tests response relevance and coherence',
        example: 'Question about topic X → Expected: Relevant answer about X'
      },
      {
        id: 'hallucination-detection',
        name: 'Hallucination Detection',
        description: 'Detects fabricated or incorrect information',
        example: 'Factual question → Expected: Accurate answer, no fabrication'
      }
    ]
  },
  {
    id: 'performance-reliability',
    name: 'Performance & Reliability',
    description: 'Performance benchmarking and optimization tests',
    testCount: 3,
    testCases: [
      {
        id: 'response-time',
        name: 'Response Time Benchmarking',
        description: 'Measures response time performance',
        example: 'Standard query → Expected: Response < 3 seconds'
      },
      {
        id: 'load-stress',
        name: 'Load / Stress Testing',
        description: 'Tests performance under load',
        example: '100 concurrent requests → Expected: All complete successfully'
      },
      {
        id: 'token-cost-optimization',
        name: 'Token & Cost Optimization',
        description: 'Validates efficient token usage',
        example: 'Query → Expected: Minimal tokens used for quality output'
      }
    ]
  },
  {
    id: 'regression-version',
    name: 'Regression & Version Testing',
    description: 'Version comparison and regression detection',
    testCount: 3,
    testCases: [
      {
        id: 'behavior-drift',
        name: 'Behavior Drift Detection',
        description: 'Detects changes in agent behavior over time',
        example: 'Same input as v1 → Expected: Similar output quality'
      },
      {
        id: 'prompt-update-validation',
        name: 'Prompt Update Validation',
        description: 'Validates prompt changes don\'t break functionality',
        example: 'Updated prompt → Expected: Maintains or improves quality'
      },
      {
        id: 'snapshot-comparison',
        name: 'Snapshot Comparison',
        description: 'Compares current vs baseline snapshots',
        example: 'Current output vs baseline → Expected: Within tolerance'
      }
    ]
  },
  {
    id: 'governance-compliance',
    name: 'Governance, Compliance & Safety',
    description: 'Safety, compliance, and policy validation tests',
    testCount: 3,
    testCases: [
      {
        id: 'content-moderation',
        name: 'Content Moderation / Safety Checks',
        description: 'Tests content safety filters',
        example: 'Inappropriate input → Expected: Filtered or rejected'
      },
      {
        id: 'approval-workflow',
        name: 'Approval Workflow Enforcement',
        description: 'Validates approval requirements',
        example: 'High-risk action → Expected: Approval required'
      },
      {
        id: 'data-privacy',
        name: 'Data Privacy & Policy Validation',
        description: 'Tests data privacy compliance',
        example: 'PII in input → Expected: Properly handled per policy'
      }
    ]
  },
  {
    id: 'learning-feedback',
    name: 'Learning & Feedback',
    description: 'Continuous improvement and learning tests',
    testCount: 3,
    testCases: [
      {
        id: 'auto-healing',
        name: 'Auto-Healing Recommendation',
        description: 'Generates improvement recommendations',
        example: 'Failed tests → Expected: Actionable recommendations'
      },
      {
        id: 'continuous-learning',
        name: 'Continuous Learning from Results',
        description: 'Tests learning from feedback',
        example: 'Feedback provided → Expected: Improved performance'
      },
      {
        id: 'confidence-scoring',
        name: 'Confidence Scoring',
        description: 'Validates confidence score accuracy',
        example: 'Uncertain answer → Expected: Low confidence score'
      }
    ]
  }
];

// GET /api/testing/agents - Get all agents for testing
router.get('/agents', async (req, res) => {
  try {
    // Fetch agents from S3 service
    const S3AgentStorage = require('../services/s3AgentStorage');
    const s3Storage = new S3AgentStorage();
    const agents = await s3Storage.listAgents();
    
    res.json({
      success: true,
      agents: agents.map((agent: any) => ({
        id: agent.id,
        name: agent.name,
        description: agent.description,
        category: agent.category || 'General'
      }))
    });
  } catch (error) {
    console.error('Failed to fetch agents:', error);
    // Return empty array instead of error to allow UI to work
    res.json({
      success: true,
      agents: [],
      error: 'Could not fetch agents from S3'
    });
  }
});

// GET /api/testing/suites/universal - Get universal test categories
router.get('/suites/universal', async (req, res) => {
  try {
    res.json({
      success: true,
      categories: UNIVERSAL_TEST_CATEGORIES
    });
  } catch (error) {
    console.error('Failed to fetch universal test suites:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch test suites'
    });
  }
});

// POST /api/testing/run/category - Execute tests for a category on selected agents
router.post('/run/category', async (req, res) => {
  try {
    const { agentIds, categoryId } = req.body;
    
    if (!agentIds || !Array.isArray(agentIds) || agentIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Agent IDs are required'
      });
    }
    
    if (!categoryId) {
      return res.status(400).json({
        success: false,
        error: 'Category ID is required'
      });
    }
    
    // Find the category
    const category = UNIVERSAL_TEST_CATEGORIES.find(c => c.id === categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }
    
    // Create test run
    const runId = uuidv4();
    const testRun = {
      id: runId,
      categoryId,
      categoryName: category.name,
      agentIds,
      status: 'running',
      startTime: new Date().toISOString(),
      endTime: null,
      totalTests: category.testCases.length * agentIds.length,
      passedTests: 0,
      failedTests: 0
    };
    
    // Save to S3 and cache
    await s3TestRunStorage.saveTestRun(testRun);
    activeTestRuns.set(runId, testRun);
    
    // Execute tests asynchronously
    executeTestsAsync(runId, agentIds, category);
    
    res.json({
      success: true,
      runId,
      message: 'Test execution started',
      estimatedDuration: category.testCases.length * agentIds.length * 2 // 2 seconds per test
    });
    
  } catch (error) {
    console.error('Failed to start test execution:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start test execution'
    });
  }
});

// GET /api/testing/runs - Get test run history
router.get('/runs', async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    
    const allRuns = await s3TestRunStorage.listTestRuns();
    const sortedRuns = [...allRuns].sort((a: any, b: any) => 
      new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );
    
    const paginatedRuns = sortedRuns.slice(
      Number(offset),
      Number(offset) + Number(limit)
    );
    
    res.json({
      success: true,
      runs: paginatedRuns,
      total: allRuns.length
    });
  } catch (error) {
    console.error('Failed to fetch test runs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch test runs'
    });
  }
});

// GET /api/testing/test-runs - Alias for /runs (for frontend compatibility)
router.get('/test-runs', async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    
    // Load from S3
    const allRuns = await s3TestRunStorage.listTestRuns();
    
    const sortedRuns = allRuns.sort((a: any, b: any) => 
      new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );
    
    const paginatedRuns = sortedRuns.slice(
      Number(offset),
      Number(offset) + Number(limit)
    );
    
    res.json({
      success: true,
      runs: paginatedRuns,
      total: allRuns.length
    });
  } catch (error) {
    console.error('Failed to fetch test runs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch test runs'
    });
  }
});

// GET /api/testing/test-runs/:id - Get specific test run details (alias)
router.get('/test-runs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Try cache first, then S3
    let testRun = activeTestRuns.get(id);
    if (!testRun) {
      testRun = await s3TestRunStorage.getTestRun(id);
    }
    
    if (!testRun) {
      return res.status(404).json({
        success: false,
        error: 'Test run not found'
      });
    }
    
    // Get results from S3
    const runResults = await s3TestRunStorage.getTestResults(id);
    
    res.json({
      success: true,
      run: testRun,
      results: runResults
    });
  } catch (error) {
    console.error('Failed to fetch test run:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch test run'
    });
  }
});

// GET /api/testing/runs/:runId - Get specific test run details
router.get('/runs/:runId', async (req, res) => {
  try {
    const { runId } = req.params;
    
    const run = await s3TestRunStorage.getTestRun(runId);
    if (!run) {
      return res.status(404).json({
        success: false,
        error: 'Test run not found'
      });
    }
    
    const results = await s3TestRunStorage.getTestResults(runId);
    
    res.json({
      success: true,
      run: {
        ...run,
        results
      }
    });
  } catch (error) {
    console.error('Failed to fetch test run:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch test run'
    });
  }
});

// GET /api/testing/analytics/overview - Get testing overview metrics
router.get('/analytics/overview', async (req, res) => {
  try {
    // Fetch real agent count
    let totalAgents = 15; // Default
    try {
      const S3AgentStorage = require('../services/s3AgentStorage');
      const s3Storage = new S3AgentStorage();
      const agents = await s3Storage.listAgents();
      totalAgents = agents.length;
    } catch (agentError) {
      console.log('Could not fetch agents, using default count:', agentError);
    }
    
    // Calculate real metrics from test runs (load from S3)
    const allRuns = await s3TestRunStorage.listTestRuns();
    const completedRuns = allRuns.filter((r: any) => r.status === 'completed');
    const totalTests = completedRuns.reduce((sum: number, run: any) => sum + run.totalTests, 0);
    const passedTests = completedRuns.reduce((sum: number, run: any) => sum + run.passedTests, 0);
    const overallPassRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
    
    // Tests today
    const today = new Date().toDateString();
    const testsToday = allRuns.filter((r: any) => 
      new Date(r.startTime).toDateString() === today
    ).reduce((sum: number, run: any) => sum + run.totalTests, 0);
    
    // Quality distribution (simplified)
    const excellent = Math.floor(totalAgents * 0.5);
    const good = Math.floor(totalAgents * 0.33);
    const fair = Math.floor(totalAgents * 0.125);
    const poor = totalAgents - excellent - good - fair;
    
    // Recent runs
    const recentRuns = [...allRuns]
      .sort((a: any, b: any) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      .slice(0, 5)
      .map((run: any) => ({
        id: run.id,
        agentName: `Agent ${run.agentIds[0]}`,
        passRate: run.totalTests > 0 ? Math.round((run.passedTests / run.totalTests) * 100) : 0,
        timestamp: run.startTime,
        status: run.status
      }));
    
    // Trends (last 7 days) - Calculate from real test runs
    const trends = [];
    const dailyStats: Record<string, { passed: number; total: number }> = {};
    
    // Group test results by day for the last 7 days
    for (const run of completedRuns) {
      const runDate = new Date(run.startTime);
      const dateKey = runDate.toISOString().split('T')[0]; // YYYY-MM-DD
      
      if (!dailyStats[dateKey]) {
        dailyStats[dateKey] = { passed: 0, total: 0 };
      }
      
      dailyStats[dateKey].passed += run.passedTests || 0;
      dailyStats[dateKey].total += run.totalTests || 0;
    }
    
    // Generate trends for last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      
      const stats = dailyStats[dateKey];
      const passRate = stats && stats.total > 0 
        ? Math.round((stats.passed / stats.total) * 100)
        : 0; // 0% if no tests run that day
      
      trends.push({
        date: dayName,
        passRate,
        testsRun: stats?.total || 0
      });
    }
    
    res.json({
      totalAgents,
      testCoverage: completedRuns.length > 0 ? Math.min(100, Math.round((completedRuns.length / totalAgents) * 100)) : 0,
      overallPassRate,
      testsToday,
      qualityDistribution: {
        excellent,
        good,
        fair,
        poor
      },
      recentRuns,
      trends
    });
  } catch (error) {
    console.error('Failed to fetch analytics overview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics'
    });
  }
});

// Async function to execute tests using real test execution engine
async function executeTestsAsync(runId: string, agentIds: string[], category: any) {
  // Get run from cache
  let run = activeTestRuns.get(runId);
  if (!run) {
    run = await s3TestRunStorage.getTestRun(runId);
    if (!run) return;
  }
  
  try {
    console.log(`🧪 Starting real test execution for run ${runId}`);
    
    // Execute tests using the real test execution engine
    const executionResult = await testExecutionEngine.executeTestRun(
      runId,
      agentIds,
      category.testCases
    );
    
    // Update run status
    run.status = 'completed';
    run.endTime = new Date().toISOString();
    run.passedTests = executionResult.passedCount;
    run.failedTests = executionResult.failedCount;
    
    // Save to S3
    await s3TestRunStorage.updateTestRun(run);
    await s3TestRunStorage.saveTestResults(runId, executionResult.results);
    
    // Update cache
    activeTestRuns.set(runId, run);
    
    console.log(`✅ Test run ${runId} completed: ${executionResult.passedCount}/${executionResult.totalCount} passed`);
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    run.status = 'failed';
    run.endTime = new Date().toISOString();
    
    // Save failed status to S3
    await s3TestRunStorage.updateTestRun(run);
    activeTestRuns.set(runId, run);
  }
}

// GET /api/testing/metrics - Get testing metrics with cost analysis
router.get('/metrics', async (req, res) => {
  try {
    const { agentId, days } = req.query;
    const daysFilter = parseInt(days as string) || 30;
    const cutoffDate = new Date(Date.now() - daysFilter * 24 * 60 * 60 * 1000);
    
    // Load from S3
    const allRuns = await s3TestRunStorage.listTestRuns();
    
    // Filter by date and agent
    let relevantRuns = allRuns.filter((r: any) => new Date(r.startTime) >= cutoffDate);
    if (agentId) {
      relevantRuns = relevantRuns.filter((r: any) => r.agentIds?.includes(agentId as string));
    }
    
    const completedRuns = relevantRuns.filter((r: any) => r.status === 'completed');
    const totalTests = completedRuns.reduce((sum: number, r: any) => sum + (r.totalTests || 0), 0);
    const passedTests = completedRuns.reduce((sum: number, r: any) => sum + (r.passedTests || 0), 0);
    
    // Calculate costs and performance metrics
    let totalCost = 0;
    let totalTokens = 0;
    const costByAgent: Record<string, { cost: number; tests: number; tokens: number }> = {};
    const performanceData: any[] = [];
    const dailyStats: Record<string, { tests: number; passed: number; cost: number; duration: number; count: number }> = {};
    
    // Load test results for detailed metrics
    for (const run of completedRuns) {
      const results = await s3TestRunStorage.getTestResults(run.id);
      const runDate = new Date(run.startTime).toISOString().split('T')[0];
      
      if (!dailyStats[runDate]) {
        dailyStats[runDate] = { tests: 0, passed: 0, cost: 0, duration: 0, count: 0 };
      }
      
      for (const result of results) {
        // Calculate cost from token usage (if available)
        const tokens = result.tokenUsage || { input: 100, output: 200 }; // Default estimate
        const cost = (tokens.input / 1000000) * 0.25 + (tokens.output / 1000000) * 1.25; // Haiku pricing
        
        totalCost += cost;
        totalTokens += tokens.input + tokens.output;
        
        // Cost by agent
        const agentKey = result.agentName || result.agentId || 'Unknown';
        if (!costByAgent[agentKey]) {
          costByAgent[agentKey] = { cost: 0, tests: 0, tokens: 0 };
        }
        costByAgent[agentKey].cost += cost;
        costByAgent[agentKey].tests += 1;
        costByAgent[agentKey].tokens += tokens.input + tokens.output;
        
        // Daily stats
        dailyStats[runDate].tests += 1;
        dailyStats[runDate].passed += result.passed ? 1 : 0;
        dailyStats[runDate].cost += cost;
        dailyStats[runDate].duration += result.duration || 0;
        dailyStats[runDate].count += 1;
      }
    }
    
    // Format performance trends
    const sortedDates = Object.keys(dailyStats).sort();
    const last7Days = sortedDates.slice(-7);
    for (const date of last7Days) {
      const stats = dailyStats[date];
      performanceData.push({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        responseTime: stats.count > 0 ? Math.round(stats.duration / stats.count) : 0,
        tokenUsage: Math.round(totalTokens / stats.count) || 0,
        passRate: stats.tests > 0 ? Math.round((stats.passed / stats.tests) * 100) : 0,
        cost: stats.cost
      });
    }
    
    // Format cost by agent
    const costData = Object.entries(costByAgent)
      .map(([agent, data]) => ({
        agent,
        cost: data.cost,
        tests: data.tests,
        tokens: data.tokens,
        avgCostPerTest: data.tests > 0 ? data.cost / data.tests : 0
      }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 10);
    
    // Agent performance comparison
    const agentPerformance = Object.entries(costByAgent).map(([agent, data]) => ({
      agent,
      tests: data.tests,
      cost: data.cost,
      efficiency: data.cost > 0 ? data.tests / data.cost : 0
    })).sort((a, b) => b.efficiency - a.efficiency);
    
    const metrics = {
      summary: {
        totalRuns: relevantRuns.length,
        completedRuns: completedRuns.length,
        totalTests,
        passedTests,
        failedTests: totalTests - passedTests,
        passRate: totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0,
        avgExecutionTime: completedRuns.length > 0 
          ? completedRuns.reduce((sum: number, r: any) => {
              if (r.endTime && r.startTime) {
                return sum + (new Date(r.endTime).getTime() - new Date(r.startTime).getTime());
              }
              return sum;
            }, 0) / completedRuns.length / 1000
          : 0,
        totalCost: totalCost,
        totalTokens: totalTokens,
        avgCostPerTest: totalTests > 0 ? totalCost / totalTests : 0
      },
      performance: performanceData,
      costs: costData,
      agentPerformance: agentPerformance.slice(0, 10),
      timeRange: {
        days: daysFilter,
        from: cutoffDate.toISOString(),
        to: new Date().toISOString()
      }
    };
    
    res.json({
      success: true,
      metrics
    });
  } catch (error) {
    console.error('Failed to fetch metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch metrics'
    });
  }
});

// GET /api/testing/insights - Get testing insights and recommendations
router.get('/insights', async (req, res) => {
  try {
    const { agentId } = req.query;
    
    // Load from S3
    const allRuns = await s3TestRunStorage.listTestRuns();
    
    const relevantRuns = agentId 
      ? allRuns.filter((r: any) => r.agentIds?.includes(agentId as string))
      : allRuns;
    
    const completedRuns = relevantRuns.filter((r: any) => r.status === 'completed');
    
    // Generate recommendations and patterns
    const recommendations: any[] = [];
    const patterns: any[] = [];
    const failureReasons: Record<string, number> = {};
    let totalFailures = 0;
    let lowAccuracyCount = 0;
    let slowTestsCount = 0;
    
    // Analyze test results for patterns
    for (const run of completedRuns) {
      const results = await s3TestRunStorage.getTestResults(run.id);
      
      for (const result of results) {
        if (!result.passed) {
          totalFailures++;
          
          // Track failure reasons
          const reason = result.failureReason || 'Unknown failure';
          failureReasons[reason] = (failureReasons[reason] || 0) + 1;
          
          // Check for low accuracy
          if (result.evaluation?.accuracy && result.evaluation.accuracy < 0.7) {
            lowAccuracyCount++;
          }
        }
        
        // Check for slow tests
        if (result.duration && result.duration > 2000) {
          slowTestsCount++;
        }
      }
    }
    
    if (completedRuns.length > 0) {
      const totalTests = completedRuns.reduce((sum: number, r: any) => sum + (r.totalTests || 0), 0);
      const passedTests = completedRuns.reduce((sum: number, r: any) => sum + (r.passedTests || 0), 0);
      const passRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
      
      // Generate recommendations based on analysis
      if (passRate < 70) {
        recommendations.push({
          id: 'low-pass-rate',
          type: 'prompt_modification',
          priority: 'high',
          description: `Low pass rate detected (${passRate.toFixed(1)}%) across ${totalFailures} failing tests`,
          improvement: `Review and optimize agent prompts to improve test success rate by ~${(70 - passRate).toFixed(0)}%`
        });
      }
      
      if (lowAccuracyCount > 0) {
        recommendations.push({
          id: 'low-accuracy',
          type: 'model_switch',
          priority: 'high',
          description: `${lowAccuracyCount} test(s) showing accuracy below 70%`,
          improvement: 'Consider switching to a more capable model (e.g., Claude Sonnet) for better accuracy'
        });
      }
      
      if (slowTestsCount > 0) {
        recommendations.push({
          id: 'slow-tests',
          type: 'config_change',
          priority: 'medium',
          description: `${slowTestsCount} test(s) taking longer than 2 seconds`,
          improvement: 'Optimize agent configuration or reduce token limits to improve response time'
        });
      }
      
      if (completedRuns.length < 5) {
        recommendations.push({
          id: 'limited-coverage',
          type: 'test_expansion',
          priority: 'medium',
          description: 'Limited test coverage detected',
          improvement: 'Run more test suites to get comprehensive quality insights'
        });
      }
      
      // Generate failure patterns
      const sortedFailures = Object.entries(failureReasons)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);
      
      sortedFailures.forEach(([reason, count], idx) => {
        patterns.push({
          id: `pattern-${idx}`,
          type: reason.includes('accuracy') ? 'accuracy_issue' : 
                reason.includes('timeout') ? 'performance_issue' : 
                reason.includes('validation') ? 'validation_failure' : 'other',
          description: reason,
          occurrences: count
        });
      });
      
      // Add performance pattern if slow tests detected
      if (slowTestsCount > 0 && !patterns.some(p => p.type === 'performance_issue')) {
        patterns.push({
          id: 'slow-performance',
          type: 'performance_issue',
          description: 'Response time exceeding 2 seconds',
          occurrences: slowTestsCount
        });
      }
    } else {
      recommendations.push({
        id: 'no-data',
        type: 'test_execution',
        priority: 'low',
        description: 'No test data available yet',
        improvement: 'Start running tests to receive AI-powered insights and recommendations'
      });
    }
    
    res.json({
      success: true,
      insights: {
        recommendations,
        patterns,
        summary: {
          totalRuns: completedRuns.length,
          totalFailures,
          lowAccuracyCount,
          slowTestsCount
        }
      }
    });
  } catch (error) {
    console.error('Failed to fetch insights:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch insights'
    });
  }
});

export default router;
