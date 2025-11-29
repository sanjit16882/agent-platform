/**
 * TestingDatabaseService.js
 * Database operations for the testing framework
 */

class TestingDatabaseService {
  constructor(db) {
    this.db = db;
  }

  /**
   * Store test run
   */
  async storeTestRun(runData) {
    const sql = `
      INSERT INTO test_runs (
        id, agent_id, model_id, status, total_tests,
        passed_tests, failed_tests, error_tests,
        started_at, completed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    return new Promise((resolve, reject) => {
      this.db.run(
        sql,
        [
          runData.id,
          runData.agentId,
          runData.modelId,
          runData.status,
          runData.totalTests,
          runData.passedTests,
          runData.failedTests,
          runData.errorTests,
          runData.startedAt,
          runData.completedAt
        ],
        (err) => {
          if (err) reject(err);
          else resolve({ id: runData.id });
        }
      );
    });
  }

  /**
   * Update test run status
   */
  async updateTestRun(runId, updates) {
    const fields = [];
    const values = [];

    if (updates.status !== undefined) {
      fields.push('status = ?');
      values.push(updates.status);
    }
    if (updates.totalTests !== undefined) {
      fields.push('total_tests = ?');
      values.push(updates.totalTests);
    }
    if (updates.passedTests !== undefined) {
      fields.push('passed_tests = ?');
      values.push(updates.passedTests);
    }
    if (updates.failedTests !== undefined) {
      fields.push('failed_tests = ?');
      values.push(updates.failedTests);
    }
    if (updates.errorTests !== undefined) {
      fields.push('error_tests = ?');
      values.push(updates.errorTests);
    }
    if (updates.completedAt !== undefined) {
      fields.push('completed_at = ?');
      values.push(updates.completedAt);
    }

    if (fields.length === 0) {
      return;
    }

    values.push(runId);

    const sql = `UPDATE test_runs SET ${fields.join(', ')} WHERE id = ?`;

    return new Promise((resolve, reject) => {
      this.db.run(sql, values, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  /**
   * Get test run by ID
   */
  async getTestRun(runId) {
    const sql = `SELECT * FROM test_runs WHERE id = ?`;

    return new Promise((resolve, reject) => {
      this.db.get(sql, [runId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  /**
   * Get test runs for an agent
   */
  async getTestRunsForAgent(agentId, limit = 10) {
    const sql = `
      SELECT * FROM test_runs 
      WHERE agent_id = ? 
      ORDER BY started_at DESC 
      LIMIT ?
    `;

    return new Promise((resolve, reject) => {
      this.db.all(sql, [agentId, limit], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  /**
   * Get test results for a run
   */
  async getTestResults(runId) {
    const sql = `SELECT * FROM test_results WHERE run_id = ? ORDER BY created_at`;

    return new Promise((resolve, reject) => {
      this.db.all(sql, [runId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  /**
   * Get cost data for a run
   */
  async getCostData(runId) {
    const sql = `SELECT * FROM test_costs WHERE run_id = ? ORDER BY created_at`;

    return new Promise((resolve, reject) => {
      this.db.all(sql, [runId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  /**
   * Get cost summary for a run
   */
  async getCostSummary(runId) {
    const sql = `SELECT * FROM run_costs_summary WHERE run_id = ?`;

    return new Promise((resolve, reject) => {
      this.db.get(sql, [runId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  /**
   * Get model costs for a run
   */
  async getModelCosts(runId) {
    const sql = `SELECT * FROM model_costs WHERE run_id = ? ORDER BY total_cost DESC`;

    return new Promise((resolve, reject) => {
      this.db.all(sql, [runId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  /**
   * Get cost analytics
   */
  async getCostAnalytics(runId = null) {
    let sql = `SELECT * FROM cost_analytics`;
    const params = [];

    if (runId) {
      sql += ` WHERE run_id = ?`;
      params.push(runId);
    }

    sql += ` ORDER BY total_cost DESC`;

    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  /**
   * Get model cost comparison
   */
  async getModelCostComparison(runId) {
    const sql = `SELECT * FROM model_cost_comparison WHERE run_id = ? ORDER BY cost_rank`;

    return new Promise((resolve, reject) => {
      this.db.all(sql, [runId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  /**
   * Get testing statistics
   */
  async getTestingStats() {
    const sql = `
      SELECT 
        COUNT(DISTINCT id) as total_runs,
        COUNT(DISTINCT agent_id) as total_agents,
        SUM(total_tests) as total_tests,
        SUM(passed_tests) as total_passed,
        SUM(failed_tests) as total_failed,
        SUM(error_tests) as total_errors,
        AVG(CAST(passed_tests AS FLOAT) / NULLIF(total_tests, 0) * 100) as avg_pass_rate
      FROM test_runs
      WHERE status = 'completed'
    `;

    return new Promise((resolve, reject) => {
      this.db.get(sql, [], (err, row) => {
        if (err) reject(err);
        else resolve(row || {});
      });
    });
  }

  /**
   * Get cost statistics
   */
  async getCostStats() {
    const sql = `
      SELECT 
        SUM(total_cost) as total_cost,
        SUM(total_tokens) as total_tokens,
        AVG(average_cost_per_test) as avg_cost_per_test,
        AVG(average_tokens_per_test) as avg_tokens_per_test,
        COUNT(*) as total_runs
      FROM run_costs_summary
    `;

    return new Promise((resolve, reject) => {
      this.db.get(sql, [], (err, row) => {
        if (err) reject(err);
        else resolve(row || {});
      });
    });
  }

  /**
   * Get recent test runs
   */
  async getRecentTestRuns(limit = 10) {
    const sql = `
      SELECT 
        tr.*,
        rcs.total_cost,
        rcs.total_tokens
      FROM test_runs tr
      LEFT JOIN run_costs_summary rcs ON tr.id = rcs.run_id
      ORDER BY tr.started_at DESC
      LIMIT ?
    `;

    return new Promise((resolve, reject) => {
      this.db.all(sql, [limit], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  /**
   * Delete test run and related data
   */
  async deleteTestRun(runId) {
    // Foreign key cascades will handle related data
    const sql = `DELETE FROM test_runs WHERE id = ?`;

    return new Promise((resolve, reject) => {
      this.db.run(sql, [runId], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  /**
   * Clean up old test runs
   */
  async cleanupOldRuns(daysToKeep = 30) {
    const sql = `
      DELETE FROM test_runs 
      WHERE started_at < datetime('now', '-' || ? || ' days')
    `;

    return new Promise((resolve, reject) => {
      this.db.run(sql, [daysToKeep], function(err) {
        if (err) reject(err);
        else resolve({ deleted: this.changes });
      });
    });
  }
}

module.exports = TestingDatabaseService;
