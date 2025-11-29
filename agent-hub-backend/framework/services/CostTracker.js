/**
 * CostTracker.js
 * Tracks token usage and costs across test runs
 */

class CostTracker {
  constructor(db) {
    this.db = db;
    this.sessionCosts = new Map(); // In-memory tracking for current session
  }

  /**
   * Track execution cost
   * @param {Object} params
   * @param {string} params.runId - Test run ID
   * @param {string} params.testId - Test ID
   * @param {string} params.modelId - Model ID
   * @param {Object} params.usage - Token usage
   * @param {number} params.cost - Calculated cost
   */
  async trackCost({ runId, testId, modelId, usage, cost }) {
    // Update session tracking
    if (!this.sessionCosts.has(runId)) {
      this.sessionCosts.set(runId, {
        runId,
        totalCost: 0,
        totalTokens: 0,
        tests: []
      });
    }

    const runCosts = this.sessionCosts.get(runId);
    runCosts.totalCost += cost;
    runCosts.totalTokens += usage.totalTokens;
    runCosts.tests.push({
      testId,
      modelId,
      usage,
      cost,
      timestamp: new Date().toISOString()
    });

    // Store in database (if available)
    if (this.db) {
      try {
        await this.storeCostInDatabase({ runId, testId, modelId, usage, cost });
      } catch (error) {
        console.error('Failed to store cost in database:', error.message);
      }
    }
  }

  /**
   * Store cost data in database
   */
  async storeCostInDatabase({ runId, testId, modelId, usage, cost }) {
    const sql = `
      INSERT INTO test_costs (
        run_id, test_id, model_id,
        input_tokens, output_tokens, total_tokens,
        cost, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `;

    return new Promise((resolve, reject) => {
      this.db.run(
        sql,
        [
          runId,
          testId,
          modelId,
          usage.inputTokens,
          usage.outputTokens,
          usage.totalTokens,
          cost
        ],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  /**
   * Get costs for a test run
   * @param {string} runId - Test run ID
   * @returns {Object} Cost summary
   */
  getCostsForRun(runId) {
    const runCosts = this.sessionCosts.get(runId);
    
    if (!runCosts) {
      return {
        runId,
        totalCost: 0,
        totalTokens: 0,
        tests: []
      };
    }

    return {
      ...runCosts,
      averageCostPerTest: runCosts.tests.length > 0
        ? runCosts.totalCost / runCosts.tests.length
        : 0,
      averageTokensPerTest: runCosts.tests.length > 0
        ? runCosts.totalTokens / runCosts.tests.length
        : 0
    };
  }

  /**
   * Get costs by model
   * @param {string} runId - Test run ID
   * @returns {Object} Costs grouped by model
   */
  getCostsByModel(runId) {
    const runCosts = this.sessionCosts.get(runId);
    
    if (!runCosts) {
      return {};
    }

    const byModel = {};
    
    for (const test of runCosts.tests) {
      if (!byModel[test.modelId]) {
        byModel[test.modelId] = {
          modelId: test.modelId,
          totalCost: 0,
          totalTokens: 0,
          testCount: 0
        };
      }
      
      byModel[test.modelId].totalCost += test.cost;
      byModel[test.modelId].totalTokens += test.usage.totalTokens;
      byModel[test.modelId].testCount++;
    }

    return byModel;
  }

  /**
   * Get total costs across all runs
   * @returns {Object} Total cost summary
   */
  getTotalCosts() {
    let totalCost = 0;
    let totalTokens = 0;
    let totalTests = 0;

    for (const runCosts of this.sessionCosts.values()) {
      totalCost += runCosts.totalCost;
      totalTokens += runCosts.totalTokens;
      totalTests += runCosts.tests.length;
    }

    return {
      totalCost,
      totalTokens,
      totalTests,
      averageCostPerTest: totalTests > 0 ? totalCost / totalTests : 0,
      averageTokensPerTest: totalTests > 0 ? totalTokens / totalTests : 0
    };
  }

  /**
   * Compare costs between models
   * @param {string} runId - Test run ID
   * @returns {Object} Cost comparison
   */
  compareModelCosts(runId) {
    const byModel = this.getCostsByModel(runId);
    const models = Object.values(byModel);

    if (models.length === 0) {
      return null;
    }

    // Find cheapest and most expensive
    const cheapest = models.reduce((min, model) => 
      model.totalCost < min.totalCost ? model : min
    );
    
    const mostExpensive = models.reduce((max, model) => 
      model.totalCost > max.totalCost ? model : max
    );

    // Calculate savings
    const savings = mostExpensive.totalCost - cheapest.totalCost;
    const savingsPercent = mostExpensive.totalCost > 0
      ? (savings / mostExpensive.totalCost) * 100
      : 0;

    return {
      cheapest: {
        modelId: cheapest.modelId,
        cost: cheapest.totalCost,
        costPerTest: cheapest.totalCost / cheapest.testCount
      },
      mostExpensive: {
        modelId: mostExpensive.modelId,
        cost: mostExpensive.totalCost,
        costPerTest: mostExpensive.totalCost / mostExpensive.testCount
      },
      savings: {
        amount: savings,
        percent: savingsPercent
      },
      recommendation: savingsPercent > 50
        ? `Using ${cheapest.modelId} could save ${savingsPercent.toFixed(1)}% in costs`
        : `Cost difference between models is minimal (${savingsPercent.toFixed(1)}%)`
    };
  }

  /**
   * Generate cost report
   * @param {string} runId - Test run ID
   * @returns {Object} Detailed cost report
   */
  generateCostReport(runId) {
    const runCosts = this.getCostsForRun(runId);
    const byModel = this.getCostsByModel(runId);
    const comparison = this.compareModelCosts(runId);

    return {
      summary: {
        runId,
        totalCost: runCosts.totalCost,
        totalTokens: runCosts.totalTokens,
        testCount: runCosts.tests.length,
        averageCostPerTest: runCosts.averageCostPerTest,
        averageTokensPerTest: runCosts.averageTokensPerTest
      },
      byModel,
      comparison,
      tests: runCosts.tests.map(test => ({
        testId: test.testId,
        modelId: test.modelId,
        cost: test.cost,
        tokens: test.usage.totalTokens,
        timestamp: test.timestamp
      }))
    };
  }

  /**
   * Clear session costs
   * @param {string} runId - Optional run ID to clear specific run
   */
  clearCosts(runId = null) {
    if (runId) {
      this.sessionCosts.delete(runId);
    } else {
      this.sessionCosts.clear();
    }
  }

  /**
   * Export costs to CSV
   * @param {string} runId - Test run ID
   * @returns {string} CSV data
   */
  exportToCSV(runId) {
    const runCosts = this.sessionCosts.get(runId);
    
    if (!runCosts) {
      return '';
    }

    const headers = 'Test ID,Model ID,Input Tokens,Output Tokens,Total Tokens,Cost,Timestamp\n';
    const rows = runCosts.tests.map(test => 
      `${test.testId},${test.modelId},${test.usage.inputTokens},${test.usage.outputTokens},${test.usage.totalTokens},${test.cost},${test.timestamp}`
    ).join('\n');

    return headers + rows;
  }
}

module.exports = CostTracker;
