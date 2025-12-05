/**
 * Dimension Orchestrator
 * 
 * Core orchestrator for the Dimension-Driven AI Agent Testing Framework (DDATF)
 * Manages test execution across 8 quality dimensions
 */

const EventEmitter = require('events');
const { v4: uuidv4 } = require('uuid');

class DimensionOrchestrator extends EventEmitter {
  constructor(db, dimensionExecutors, resultAggregator) {
    super();
    this.db = db;
    this.dimensionExecutors = dimensionExecutors;
    this.resultAggregator = resultAggregator;
    this.activeRuns = new Map();
  }

  /**
   * Execute tests across configured dimensions
   * @param {string} agentId - Agent ID
   * @param {object} config - Test configuration
   * @returns {Promise<object>} - Test run result
   */
  async executeTests(agentId, config = {}) {
    const {
      dimensions = this.getDefaultDimensions(),
      models = [config.model || 'default'],
      parallel = true,
      timeout = 30000,
      mode = 'demo'
    } = config;

    const runId = uuidv4();
    const startTime = new Date().toISOString();

    try {
      // Initialize test run
      await this.createTestRun(runId, agentId, {
        status: 'queued',
        start_time: startTime,
        config: config,
        framework_version: '2.0'
      });

      this.activeRuns.set(runId, { 
        status: 'queued', 
        agentId,
        dimensions: dimensions.map(d => d.name)
      });

      this.emit('run:queued', { runId, agentId, dimensions });

      // Update status to running
      await this.updateTestRunStatus(runId, 'running');
      this.activeRuns.get(runId).status = 'running';
      this.emit('run:started', { runId, agentId });

      console.log(`✓ Starting dimension-driven test run: ${runId}`);
      console.log(`  Agent: ${agentId}`);
      console.log(`  Dimensions: ${dimensions.map(d => d.name).join(', ')}`);
      console.log(`  Models: ${models.join(', ')}`);

      // Execute tests for each model (if model comparison enabled)
      const modelResults = [];
      
      for (const model of models) {
        console.log(`\n📊 Testing with model: ${model}`);
        
        const dimensionResults = await this.executeDimensions(
          runId,
          agentId,
          model,
          dimensions,
          { parallel, timeout, mode }
        );

        modelResults.push({
          model,
          dimensions: dimensionResults
        });
      }

      // Aggregate results
      const aggregatedResults = await this.resultAggregator.aggregate(
        runId,
        agentId,
        modelResults,
        dimensions
      );

      // Update test run with results
      const endTime = new Date().toISOString();
      await this.updateTestRun(runId, {
        status: 'completed',
        end_time: endTime,
        summary: aggregatedResults.summary
      });

      this.activeRuns.delete(runId);
      this.emit('run:completed', { 
        runId, 
        agentId, 
        summary: aggregatedResults.summary 
      });

      console.log(`\n✓ Test run completed: ${runId}`);
      console.log(`  Overall Score: ${aggregatedResults.summary.overallScore}/100`);
      console.log(`  Grade: ${aggregatedResults.summary.grade}`);

      return {
        runId,
        agentId,
        status: 'completed',
        startTime,
        endTime,
        frameworkVersion: '2.0',
        ...aggregatedResults
      };

    } catch (error) {
      console.error(`✗ Test run failed: ${runId}`, error);
      
      await this.updateTestRun(runId, {
        status: 'failed',
        end_time: new Date().toISOString(),
        error: error.message
      });

      this.activeRuns.delete(runId);
      this.emit('run:failed', { runId, agentId, error: error.message });

      throw error;
    }
  }

  /**
   * Execute tests across all dimensions
   * @param {string} runId - Test run ID
   * @param {string} agentId - Agent ID
   * @param {string} model - Model ID
   * @param {Array} dimensions - Dimensions to test
   * @param {object} options - Execution options
   * @returns {Promise<Array>} - Dimension results
   */
  async executeDimensions(runId, agentId, model, dimensions, options) {
    const { parallel, timeout, mode } = options;
    const results = [];

    if (parallel) {
      // Execute dimensions in parallel
      const promises = dimensions.map(dimension =>
        this.executeDimension(runId, agentId, model, dimension, { timeout, mode })
      );

      const dimensionResults = await Promise.all(promises);
      results.push(...dimensionResults);
    } else {
      // Execute dimensions sequentially
      for (let i = 0; i < dimensions.length; i++) {
        const dimension = dimensions[i];
        
        this.emit('dimension:started', {
          runId,
          dimension: dimension.name,
          progress: { current: i + 1, total: dimensions.length }
        });

        const result = await this.executeDimension(
          runId,
          agentId,
          model,
          dimension,
          { timeout, mode }
        );

        results.push(result);

        this.emit('dimension:completed', {
          runId,
          dimension: dimension.name,
          result,
          progress: { current: i + 1, total: dimensions.length }
        });
      }
    }

    return results;
  }

  /**
   * Execute tests for a single dimension
   * @param {string} runId - Test run ID
   * @param {string} agentId - Agent ID
   * @param {string} model - Model ID
   * @param {object} dimension - Dimension configuration
   * @param {object} options - Execution options
   * @returns {Promise<object>} - Dimension result
   */
  async executeDimension(runId, agentId, model, dimension, options) {
    const { name, enabled, weight, executor } = dimension;

    if (!enabled) {
      console.log(`  ⏭️  Skipping dimension: ${name} (disabled)`);
      return {
        dimension: name,
        status: 'skipped',
        weight,
        score: 0,
        tests: []
      };
    }

    console.log(`  ▶️  Executing dimension: ${name}`);

    try {
      // Get dimension executor
      const dimensionExecutor = this.dimensionExecutors[executor];
      
      if (!dimensionExecutor) {
        throw new Error(`Dimension executor not found: ${executor}`);
      }

      // Execute dimension tests
      const result = await dimensionExecutor.execute(
        runId,
        agentId,
        model,
        dimension,
        options
      );

      console.log(`  ✓ Completed dimension: ${name} (${result.passed}/${result.total} passed)`);

      return {
        dimension: name,
        status: 'completed',
        weight,
        ...result
      };

    } catch (error) {
      console.error(`  ✗ Failed dimension: ${name}`, error.message);

      return {
        dimension: name,
        status: 'error',
        weight,
        score: 0,
        error: error.message,
        tests: []
      };
    }
  }

  /**
   * Get default dimension configuration
   * @returns {Array} - Default dimensions
   */
  getDefaultDimensions() {
    return [
      {
        name: 'Functional Validation',
        enabled: true,
        weight: 0.15,
        executor: 'functional'
      },
      {
        name: 'Integration Testing',
        enabled: true,
        weight: 0.25,
        executor: 'integration'
      },
      {
        name: 'Conversational Behavior',
        enabled: true,
        weight: 0.10,
        executor: 'conversational'
      },
      {
        name: 'Performance & Reliability',
        enabled: true,
        weight: 0.15,
        executor: 'performance'
      },
      {
        name: 'Governance & Safety',
        enabled: true,
        weight: 0.15,
        executor: 'governance'
      },
      {
        name: 'Security Testing',
        enabled: true,
        weight: 0.10,
        executor: 'security'
      },
      {
        name: 'Advanced Evaluation',
        enabled: true,
        weight: 0.10,
        executor: 'advanced'
      }
    ];
  }

  // ============================================================================
  // DATABASE OPERATIONS
  // ============================================================================

  /**
   * Create test run record
   * @param {string} runId - Run ID
   * @param {string} agentId - Agent ID
   * @param {object} data - Run data
   * @returns {Promise<void>}
   */
  async createTestRun(runId, agentId, data) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO test_runs (
          id, agent_id, suite_id, status, start_time, end_time, 
          summary, config, framework_version
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      this.db.run(
        query,
        [
          runId,
          agentId,
          data.suite_id || null,
          data.status,
          data.start_time,
          data.end_time || null,
          JSON.stringify(data.summary || {}),
          JSON.stringify(data.config || {}),
          data.framework_version || '2.0'
        ],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  /**
   * Update test run
   * @param {string} runId - Run ID
   * @param {object} updates - Fields to update
   * @returns {Promise<void>}
   */
  async updateTestRun(runId, updates) {
    const fields = [];
    const params = [];

    if (updates.status) {
      fields.push('status = ?');
      params.push(updates.status);
    }

    if (updates.end_time) {
      fields.push('end_time = ?');
      params.push(updates.end_time);
    }

    if (updates.summary) {
      fields.push('summary = ?');
      params.push(JSON.stringify(updates.summary));
    }

    if (updates.error) {
      fields.push('error = ?');
      params.push(updates.error);
    }

    if (fields.length === 0) return;

    params.push(runId);

    return new Promise((resolve, reject) => {
      const query = `UPDATE test_runs SET ${fields.join(', ')} WHERE id = ?`;
      
      this.db.run(query, params, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  /**
   * Update test run status
   * @param {string} runId - Run ID
   * @param {string} status - New status
   * @returns {Promise<void>}
   */
  async updateTestRunStatus(runId, status) {
    return this.updateTestRun(runId, { status });
  }

  /**
   * Get test run status
   * @param {string} runId - Run ID
   * @returns {Promise<object>} - Status information
   */
  async getTestRunStatus(runId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM test_runs WHERE id = ?',
        [runId],
        (err, row) => {
          if (err) {
            reject(err);
          } else if (!row) {
            resolve(null);
          } else {
            const activeRun = this.activeRuns.get(runId);
            resolve({
              runId: row.id,
              agentId: row.agent_id,
              status: row.status,
              startTime: row.start_time,
              endTime: row.end_time,
              summary: JSON.parse(row.summary || '{}'),
              frameworkVersion: row.framework_version,
              isActive: activeRun !== undefined
            });
          }
        }
      );
    });
  }
}

module.exports = DimensionOrchestrator;
