/**
 * Testing API Routes
 * Endpoints for test execution, cost tracking, and model comparison
 */

const express = require('express');
const router = express.Router();
const FrameworkFactory = require('../framework/FrameworkFactory');
const AgentExecutionService = require('../framework/services/AgentExecutionService');
const CostTracker = require('../framework/services/CostTracker');

// Initialize services (in production, these would be singletons)
let framework = null;
let executionService = null;
let costTracker = null;

/**
 * Initialize framework with database
 */
function initializeFramework(db) {
  if (!framework) {
    framework = FrameworkFactory.create(db);
    executionService = new AgentExecutionService();
    costTracker = new CostTracker(db);
  }
  return { framework, executionService, costTracker };
}

/**
 * POST /api/testing/execute
 * Execute tests for an agent
 */
router.post('/execute', async (req, res) => {
  try {
    const { agentId, modelId, testSuiteId, options = {} } = req.body;
    const db = req.app.locals.db;

    // Validate input
    if (!agentId) {
      return res.status(400).json({ error: 'agentId is required' });
    }
    if (!modelId) {
      return res.status(400).json({ error: 'modelId is required' });
    }

    // Initialize framework
    const { framework, executionService, costTracker } = initializeFramework(db);

    // Create test run
    const runId = `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Execute tests
    const dimensions = FrameworkFactory.getDefaultDimensions();
    const results = [];
    let totalCost = 0;

    for (const dimension of dimensions) {
      if (!dimension.enabled) continue;

      const executor = framework.dimensionExecutors[dimension.executor];
      if (!executor) continue;

      // Load tests for this dimension
      const loadMethod = `load${dimension.executor.charAt(0).toUpperCase() + dimension.executor.slice(1)}Tests`;
      if (typeof executor[loadMethod] !== 'function') continue;

      const tests = await executor[loadMethod]();

      // Execute each test
      for (const test of tests) {
        const result = await executor.executeTestCase(
          runId,
          agentId,
          modelId,
          test,
          {
            mode: options.mode || 'demo',
            executionService,
            timeout: options.timeout || 30000
          }
        );

        results.push(result);

        // Track cost
        if (result.cost) {
          await costTracker.trackCost({
            runId,
            testId: result.id,
            modelId,
            usage: result.usage || { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
            cost: result.cost
          });
          totalCost += result.cost;
        }
      }
    }

    // Aggregate results
    const passed = results.filter(r => r.status === 'passed').length;
    const failed = results.filter(r => r.status === 'failed').length;
    const errors = results.filter(r => r.status === 'error').length;

    // Get cost report
    const costReport = costTracker.generateCostReport(runId);

    res.json({
      runId,
      agentId,
      modelId,
      summary: {
        total: results.length,
        passed,
        failed,
        errors,
        passRate: results.length > 0 ? (passed / results.length) * 100 : 0
      },
      costs: {
        total: totalCost,
        perTest: results.length > 0 ? totalCost / results.length : 0,
        details: costReport
      },
      results: results.map(r => ({
        id: r.id,
        testId: r.test_case_id,
        status: r.status,
        duration: r.duration,
        cost: r.cost
      })),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Test execution error:', error);
    res.status(500).json({
      error: 'Test execution failed',
      message: error.message
    });
  }
});

/**
 * POST /api/testing/compare-models
 * Compare multiple models for an agent
 */
router.post('/compare-models', async (req, res) => {
  try {
    const { agentId, models, testSuiteId, options = {} } = req.body;
    const db = req.app.locals.db;

    // Validate input
    if (!agentId) {
      return res.status(400).json({ error: 'agentId is required' });
    }
    if (!models || !Array.isArray(models) || models.length === 0) {
      return res.status(400).json({ error: 'models array is required' });
    }

    // Initialize framework
    const { framework, executionService, costTracker } = initializeFramework(db);

    const comparisonId = `cmp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const modelResults = [];

    // Execute tests for each model
    for (const modelId of models) {
      const runId = `${comparisonId}_${modelId}`;
      const results = [];
      let totalCost = 0;

      const dimensions = FrameworkFactory.getDefaultDimensions();

      for (const dimension of dimensions) {
        if (!dimension.enabled) continue;

        const executor = framework.dimensionExecutors[dimension.executor];
        if (!executor) continue;

        const loadMethod = `load${dimension.executor.charAt(0).toUpperCase() + dimension.executor.slice(1)}Tests`;
        if (typeof executor[loadMethod] !== 'function') continue;

        const tests = await executor[loadMethod]();

        for (const test of tests) {
          const result = await executor.executeTestCase(
            runId,
            agentId,
            modelId,
            test,
            {
              mode: options.mode || 'demo',
              executionService,
              timeout: options.timeout || 30000
            }
          );

          results.push(result);

          if (result.cost) {
            await costTracker.trackCost({
              runId,
              testId: result.id,
              modelId,
              usage: result.usage || { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
              cost: result.cost
            });
            totalCost += result.cost;
          }
        }
      }

      const passed = results.filter(r => r.status === 'passed').length;
      const failed = results.filter(r => r.status === 'failed').length;

      modelResults.push({
        modelId,
        runId,
        accuracy: results.length > 0 ? (passed / results.length) * 100 : 0,
        totalTests: results.length,
        passed,
        failed,
        totalCost,
        avgCostPerTest: results.length > 0 ? totalCost / results.length : 0
      });
    }

    // Determine winners
    const bestAccuracy = modelResults.reduce((best, model) => 
      model.accuracy > best.accuracy ? model : best
    );
    const cheapest = modelResults.reduce((cheap, model) => 
      model.totalCost < cheap.totalCost ? model : cheap
    );
    const bestValue = modelResults.reduce((best, model) => {
      const value = model.accuracy / (model.totalCost || 1);
      const bestValue = best.accuracy / (best.totalCost || 1);
      return value > bestValue ? model : best;
    });

    // Generate insights
    const insights = [];
    if (bestAccuracy.modelId !== cheapest.modelId) {
      const costDiff = ((bestAccuracy.totalCost - cheapest.totalCost) / cheapest.totalCost) * 100;
      const accuracyDiff = bestAccuracy.accuracy - cheapest.accuracy;
      insights.push(
        `${bestAccuracy.modelId} is ${accuracyDiff.toFixed(1)}% more accurate but costs ${costDiff.toFixed(1)}% more`
      );
    }
    if (cheapest.accuracy >= 90) {
      insights.push(`${cheapest.modelId} offers excellent accuracy (${cheapest.accuracy.toFixed(1)}%) at the lowest cost`);
    }

    res.json({
      comparisonId,
      agentId,
      models: modelResults,
      winners: {
        bestAccuracy: bestAccuracy.modelId,
        cheapest: cheapest.modelId,
        bestValue: bestValue.modelId
      },
      insights,
      recommendation: bestValue.modelId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Model comparison error:', error);
    res.status(500).json({
      error: 'Model comparison failed',
      message: error.message
    });
  }
});

/**
 * GET /api/testing/costs/:runId
 * Get cost report for a test run
 */
router.get('/costs/:runId', async (req, res) => {
  try {
    const { runId } = req.params;
    const db = req.app.locals.db;

    const { costTracker } = initializeFramework(db);
    const report = costTracker.generateCostReport(runId);

    if (!report || report.summary.testCount === 0) {
      return res.status(404).json({ error: 'Cost data not found for this run' });
    }

    res.json(report);

  } catch (error) {
    console.error('Cost report error:', error);
    res.status(500).json({
      error: 'Failed to generate cost report',
      message: error.message
    });
  }
});

/**
 * GET /api/testing/costs/compare/:runId
 * Compare costs between models in a run
 */
router.get('/costs/compare/:runId', async (req, res) => {
  try {
    const { runId } = req.params;
    const db = req.app.locals.db;

    const { costTracker } = initializeFramework(db);
    const comparison = costTracker.compareModelCosts(runId);

    if (!comparison) {
      return res.status(404).json({ error: 'No cost comparison data available' });
    }

    res.json(comparison);

  } catch (error) {
    console.error('Cost comparison error:', error);
    res.status(500).json({
      error: 'Failed to compare costs',
      message: error.message
    });
  }
});

/**
 * GET /api/testing/stats
 * Get overall testing statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const db = req.app.locals.db;

    // Query database for stats
    const stats = await new Promise((resolve, reject) => {
      db.get(`
        SELECT 
          COUNT(DISTINCT run_id) as total_runs,
          COUNT(*) as total_tests,
          SUM(CASE WHEN status = 'passed' THEN 1 ELSE 0 END) as passed_tests,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_tests,
          AVG(duration) as avg_duration
        FROM test_results
      `, (err, row) => {
        if (err) reject(err);
        else resolve(row || {});
      });
    });

    // Get cost stats
    const costStats = await new Promise((resolve, reject) => {
      db.get(`
        SELECT 
          SUM(total_cost) as total_cost,
          SUM(total_tokens) as total_tokens,
          AVG(average_cost_per_test) as avg_cost_per_test
        FROM run_costs_summary
      `, (err, row) => {
        if (err) reject(err);
        else resolve(row || {});
      });
    });

    res.json({
      tests: {
        totalRuns: stats.total_runs || 0,
        totalTests: stats.total_tests || 0,
        passed: stats.passed_tests || 0,
        failed: stats.failed_tests || 0,
        passRate: stats.total_tests > 0 
          ? ((stats.passed_tests || 0) / stats.total_tests) * 100 
          : 0,
        avgDuration: stats.avg_duration || 0
      },
      costs: {
        totalCost: costStats.total_cost || 0,
        totalTokens: costStats.total_tokens || 0,
        avgCostPerTest: costStats.avg_cost_per_test || 0
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      error: 'Failed to get statistics',
      message: error.message
    });
  }
});

/**
 * POST /api/testing/export-costs/:runId
 * Export cost data as CSV
 */
router.post('/export-costs/:runId', async (req, res) => {
  try {
    const { runId } = req.params;
    const db = req.app.locals.db;

    const { costTracker } = initializeFramework(db);
    const csv = costTracker.exportToCSV(runId);

    if (!csv) {
      return res.status(404).json({ error: 'No cost data found for this run' });
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="costs_${runId}.csv"`);
    res.send(csv);

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      error: 'Failed to export cost data',
      message: error.message
    });
  }
});

module.exports = router;
