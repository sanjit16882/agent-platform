/**
 * Testing API Routes
 * REST API endpoints for the DDTF (Deep Diagnostic Test Framework)
 * Exposes test library, execution, and insights services
 */

const express = require('express');
const router = express.Router();
const { getRelevantTestsForAgent, getAllCategories, getAgentTypesForCategory } = require('../src/config/categoryTestMapping');
const TestLibraryService = require('../services/testLibraryService');
const TestExecutionService = require('../services/testExecutionService');
const InsightsService = require('../services/insightsService');
const samplePromptService = require('../services/samplePromptService');

// Initialize services
let testLibraryService;
let testExecutionService;
let insightsService;

// Middleware to initialize services with database
router.use((req, res, next) => {
  if (!testLibraryService) {
    // Initialize with database if available, otherwise use in-memory
    const db = req.app.locals.db || null;
    testLibraryService = new TestLibraryService(db);
    testExecutionService = new TestExecutionService(db, testLibraryService);
    insightsService = new InsightsService();
    
    if (!db) {
      console.log('⚠️ Testing services initialized without database - using in-memory storage');
    }
  }
  next();
});

// ============================================================================
// TEST LIBRARY ENDPOINTS
// ============================================================================

/**
 * POST /api/testing/library/create
 * Create a new test
 */
router.post('/library/create', async (req, res) => {
  try {
    const test = await testLibraryService.createTest(req.body);
    res.json({
      success: true,
      data: test,
      message: 'Test created successfully'
    });
  } catch (error) {
    console.error('Error creating test:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/testing/library/list
 * List all tests with optional filters
 */
router.get('/library/list', async (req, res) => {
  try {
    const filters = {
      type: req.query.type,
      category: req.query.category,
      input_format: req.query.input_format,
      search: req.query.search,
      tags: req.query.tags ? req.query.tags.split(',') : undefined,
      limit: parseInt(req.query.limit) || 100,
      offset: parseInt(req.query.offset) || 0
    };
    
    const tests = await testLibraryService.listTests(filters);
    
    res.json({
      success: true,
      data: tests,
      count: tests.length,
      filters: filters
    });
  } catch (error) {
    console.error('Error listing tests:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/testing/library/:id
 * Get a single test by ID
 */
router.get('/library/:id', async (req, res) => {
  try {
    const test = await testLibraryService.getTestById(req.params.id);
    res.json({
      success: true,
      data: test
    });
  } catch (error) {
    console.error('Error getting test:', error);
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/testing/library/:id/update
 * Update an existing test
 */
router.put('/library/:id/update', async (req, res) => {
  try {
    const test = await testLibraryService.updateTest(req.params.id, req.body);
    res.json({
      success: true,
      data: test,
      message: 'Test updated successfully'
    });
  } catch (error) {
    console.error('Error updating test:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/testing/library/:id
 * Delete a test
 */
router.delete('/library/:id', async (req, res) => {
  try {
    await testLibraryService.deleteTest(req.params.id);
    res.json({
      success: true,
      message: 'Test deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting test:', error);
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/testing/library/:id/versions
 * Get version history for a test
 */
router.get('/library/:id/versions', async (req, res) => {
  try {
    const versions = await testLibraryService.getVersionHistory(req.params.id);
    res.json({
      success: true,
      data: versions,
      count: versions.length
    });
  } catch (error) {
    console.error('Error getting version history:', error);
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/testing/library/:id/duplicate
 * Duplicate a test (create from template)
 */
router.post('/library/:id/duplicate', async (req, res) => {
  try {
    const newTest = await testLibraryService.duplicateTest(req.params.id, req.body);
    res.json({
      success: true,
      data: newTest,
      message: 'Test duplicated successfully'
    });
  } catch (error) {
    console.error('Error duplicating test:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/testing/library/system/tests
 * Get all system tests
 */
router.get('/library/system/tests', async (req, res) => {
  try {
    const tests = await testLibraryService.getSystemTests();
    res.json({
      success: true,
      data: tests,
      count: tests.length
    });
  } catch (error) {
    console.error('Error getting system tests:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/testing/library/templates
 * Get all test templates
 */
router.get('/library/templates', async (req, res) => {
  try {
    const templates = await testLibraryService.getTemplates();
    res.json({
      success: true,
      data: templates,
      count: templates.length
    });
  } catch (error) {
    console.error('Error getting templates:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/testing/library/statistics
 * Get test library statistics
 */
router.get('/library/statistics', async (req, res) => {
  try {
    const stats = await testLibraryService.getStatistics();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting statistics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================================
// TEST EXECUTION ENDPOINTS
// ============================================================================

/**
 * POST /api/testing/execute
 * Execute a single test or test suite
 */
router.post('/execute', async (req, res) => {
  try {
    const { agentId, testIds, tests, options = {} } = req.body;
    
    if (!agentId) {
      return res.status(400).json({
        success: false,
        error: 'agentId is required'
      });
    }
    
    // Accept either testIds (legacy) or tests (new - supports custom tests)
    const testsToExecute = tests || testIds;
    
    if (!testsToExecute || !Array.isArray(testsToExecute) || testsToExecute.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'tests or testIds array is required and must not be empty'
      });
    }
    
    // Execute test suite
    const result = await testExecutionService.executeTestSuite(
      agentId,
      testsToExecute,
      options
    );
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('Error executing tests:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/testing/execute/single
 * Execute a single test
 */
router.post('/execute/single', async (req, res) => {
  try {
    const { agentId, testId, options = {} } = req.body;
    
    if (!agentId || !testId) {
      return res.status(400).json({
        success: false,
        error: 'agentId and testId are required'
      });
    }
    
    const result = await testExecutionService.executeTest(agentId, testId, options);
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('Error executing test:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/testing/runs/:runId
 * Get test run by ID
 */
router.get('/runs/:runId', async (req, res) => {
  try {
    const run = await testExecutionService.getTestRun(req.params.runId);
    res.json({
      success: true,
      data: run
    });
  } catch (error) {
    console.error('Error getting test run:', error);
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/testing/runs/:runId/results
 * Get test results for a run
 */
router.get('/runs/:runId/results', async (req, res) => {
  try {
    const run = await testExecutionService.getTestRun(req.params.runId);
    res.json({
      success: true,
      data: {
        run_id: run.run_id,
        results: run.results,
        summary: run.summary
      }
    });
  } catch (error) {
    console.error('Error getting test results:', error);
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/testing/runs
 * Get all test runs (for version comparison)
 */
router.get('/runs', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const agentId = req.query.agentId;
    
    let runs = [];
    
    // If no database, use in-memory cache
    if (!testExecutionService.db) {
      console.log('📦 Using in-memory cache for test runs');
      runs = Array.from(testExecutionService.testRunsCache.values());
      
      // Filter by agent if specified
      if (agentId) {
        runs = runs.filter(run => run.agent_id === agentId);
      }
      
      // Sort by timestamp (newest first)
      runs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      // Limit results
      runs = runs.slice(0, limit);
    } else {
      // Get from database
      const query = agentId 
        ? 'SELECT * FROM test_runs WHERE agent_id = ? ORDER BY created_at DESC LIMIT ?'
        : 'SELECT * FROM test_runs ORDER BY created_at DESC LIMIT ?';
      
      const params = agentId ? [agentId, limit] : [limit];
      runs = await testExecutionService.db.all(query, params);
    }
    
    // Load agent names from S3 API
    const agentNames = {};
    try {
      const axios = require('axios');
      const agentsResponse = await axios.get('http://localhost:3002/api/v1/agents/s3');
      if (agentsResponse.data && agentsResponse.data.data) {
        agentsResponse.data.data.forEach(agent => {
          // Map both agent_id and id to name for compatibility
          if (agent.agent_id) {
            agentNames[agent.agent_id] = agent.name;
          }
          if (agent.id) {
            agentNames[agent.id] = agent.name;
          }
        });
        console.log(`✅ Loaded ${Object.keys(agentNames).length} agent names from S3`);
      }
    } catch (err) {
      console.warn('⚠️ Could not load agent names:', err.message);
    }
    
    // Filter out test runs for agents that don't exist in S3
    const validAgentIds = Object.keys(agentNames);
    const filteredRuns = runs.filter(run => {
      const exists = validAgentIds.includes(run.agent_id);
      if (!exists) {
        console.log(`🗑️ Filtering out test run for deleted agent: ${run.agent_id}`);
      }
      return exists;
    });
    
    console.log(`✅ Filtered ${runs.length} runs down to ${filteredRuns.length} (removed ${runs.length - filteredRuns.length} runs for deleted agents)`);
    
    // Transform runs to match Analytics Dashboard expected format
    const transformedRuns = filteredRuns.map(run => {
      // Parse summary if it's a string
      const summary = typeof run.summary === 'string' ? JSON.parse(run.summary) : run.summary;
      
      // Get agent name from S3
      const agentName = agentNames[run.agent_id] || run.agent_id;
      
      // Calculate total cost from test results
      const results = run.results || [];
      const totalCost = results.reduce((sum, result) => sum + (result.cost || 0), 0);
      
      return {
        id: run.run_id,
        agentId: run.agent_id,
        agentName: agentName,
        startTime: run.timestamp || run.created_at,
        status: run.status,
        totalTests: summary?.total || 0,
        passedTests: summary?.passed || 0,
        passRate: summary?.pass_rate || 0,
        averageScore: run.overall_score || 0,
        cost: totalCost,
        duration: run.duration || 0,
        results: results
      };
    });
    
    res.json({
      success: true,
      runs: transformedRuns,
      data: transformedRuns,
      count: transformedRuns.length
    });
  } catch (error) {
    console.error('Error getting test runs:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/testing/agents/:agentId/runs
 * Get test runs for an agent
 */
router.get('/agents/:agentId/runs', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const runs = await testExecutionService.getAgentTestRuns(req.params.agentId, limit);
    
    res.json({
      success: true,
      data: runs,
      count: runs.length
    });
  } catch (error) {
    console.error('Error getting agent test runs:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================================
// INSIGHTS ENDPOINTS
// ============================================================================

/**
 * POST /api/testing/insights/generate
 * Generate AI-powered insights from test results
 */
router.post('/insights/generate', async (req, res) => {
  try {
    const {
      agentName,
      testSuiteName,
      testType,
      overallScore,
      testResults,
      modelId
    } = req.body;
    
    if (!agentName || !testResults || !Array.isArray(testResults)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: agentName, testResults'
      });
    }
    
    const result = await insightsService.generateInsights(
      agentName,
      testSuiteName || 'Unknown Suite',
      testType || 'General',
      overallScore || 0,
      testResults,
      modelId
    );
    
    res.json(result);
    
  } catch (error) {
    console.error('Error generating insights:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/testing/insights/quick
 * Generate quick rule-based insights (no AI)
 */
router.post('/insights/quick', async (req, res) => {
  try {
    const { testResults } = req.body;
    
    if (!testResults || !Array.isArray(testResults)) {
      return res.status(400).json({
        success: false,
        error: 'testResults array is required'
      });
    }
    
    const result = insightsService.generateQuickInsights(testResults);
    
    res.json(result);
    
  } catch (error) {
    console.error('Error generating quick insights:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/testing/insights/compare
 * Compare insights between two test runs
 */
router.post('/insights/compare', async (req, res) => {
  try {
    const { insights1, insights2 } = req.body;
    
    if (!insights1 || !insights2) {
      return res.status(400).json({
        success: false,
        error: 'Both insights1 and insights2 are required'
      });
    }
    
    const comparison = insightsService.compareInsights(insights1, insights2);
    
    res.json({
      success: true,
      data: comparison
    });
    
  } catch (error) {
    console.error('Error comparing insights:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/testing/insights/health
 * Test Bedrock connection for insights
 */
router.get('/insights/health', async (req, res) => {
  try {
    const result = await insightsService.testConnection();
    res.json(result);
  } catch (error) {
    console.error('Error testing insights connection:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================================
// EXPORT ENDPOINTS
// ============================================================================

/**
 * GET /api/testing/runs/:runId/export
 * Export test results in JSON or CSV format
 */
router.get('/runs/:runId/export', async (req, res) => {
  try {
    const format = req.query.format || 'json';
    const run = await testExecutionService.getTestRun(req.params.runId);
    
    if (format === 'csv') {
      // Generate CSV
      const headers = ['Test Name', 'Category', 'Status', 'Score', 'Explanation', 'Input', 'Output'];
      const rows = run.results.map(r => [
        r.test_name || '',
        r.category || '',
        r.passed ? 'Passed' : 'Failed',
        r.score?.toFixed(1) || '0',
        (r.explanation || '').replace(/"/g, '""'),
        (r.input_used || '').replace(/"/g, '""'),
        (r.actual_output || '').replace(/"/g, '""')
      ]);
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="test-results-${req.params.runId}.csv"`);
      res.send(csvContent);
    } else {
      // JSON format
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="test-results-${req.params.runId}.json"`);
      res.json({
        exportDate: new Date().toISOString(),
        runId: run.run_id,
        agentId: run.agent_id,
        agentName: run.agent_name,
        testSuiteName: run.test_suite_name,
        timestamp: run.timestamp,
        summary: run.summary,
        overallScore: run.overall_score,
        scoresByCategory: run.scores_by_category,
        results: run.results
      });
    }
  } catch (error) {
    console.error('Error exporting test results:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/testing/runs/export/batch
 * Export multiple test runs for comparison
 */
router.post('/runs/export/batch', async (req, res) => {
  try {
    const { runIds, format = 'json' } = req.body;
    
    if (!runIds || !Array.isArray(runIds) || runIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'runIds array is required'
      });
    }
    
    const runs = await Promise.all(
      runIds.map(id => testExecutionService.getTestRun(id))
    );
    
    if (format === 'csv') {
      // Generate comparison CSV
      const headers = ['Run ID', 'Agent', 'Timestamp', 'Total Tests', 'Passed', 'Failed', 'Pass Rate', 'Overall Score'];
      const rows = runs.map(run => [
        run.run_id,
        run.agent_name || run.agent_id,
        run.timestamp,
        run.summary?.total || 0,
        run.summary?.passed || 0,
        run.summary?.failed || 0,
        run.summary?.pass_rate?.toFixed(1) || '0',
        run.overall_score?.toFixed(1) || '0'
      ]);
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="test-comparison.csv"');
      res.send(csvContent);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="test-comparison.json"');
      res.json({
        exportDate: new Date().toISOString(),
        runs: runs,
        count: runs.length
      });
    }
  } catch (error) {
    console.error('Error exporting batch results:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================================
// VERSION TRACKING ENDPOINTS
// ============================================================================

/**
 * GET /api/testing/agents/:agentId/versions
 * Get version history for an agent's test runs
 */
router.get('/agents/:agentId/versions', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const runs = await testExecutionService.getAgentTestRuns(req.params.agentId, limit);
    
    // Transform to version tracking format
    const versions = runs.map((run, index) => ({
      version: runs.length - index,
      runId: run.run_id,
      timestamp: run.timestamp || run.created_at,
      overallScore: run.overall_score,
      passRate: run.summary?.pass_rate || 0,
      totalTests: run.summary?.total || 0,
      passedTests: run.summary?.passed || 0,
      failedTests: run.summary?.failed || 0,
      scoresByCategory: run.scores_by_category,
      status: run.status
    }));
    
    res.json({
      success: true,
      data: versions,
      agentId: req.params.agentId,
      count: versions.length
    });
  } catch (error) {
    console.error('Error getting version history:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/testing/versions/compare
 * Compare two versions of test runs
 */
router.post('/versions/compare', async (req, res) => {
  try {
    const { runId1, runId2 } = req.body;
    
    if (!runId1 || !runId2) {
      return res.status(400).json({
        success: false,
        error: 'Both runId1 and runId2 are required'
      });
    }
    
    const [run1, run2] = await Promise.all([
      testExecutionService.getTestRun(runId1),
      testExecutionService.getTestRun(runId2)
    ]);
    
    // Calculate deltas
    const comparison = {
      run1: {
        runId: run1.run_id,
        timestamp: run1.timestamp,
        overallScore: run1.overall_score,
        passRate: run1.summary?.pass_rate || 0,
        totalTests: run1.summary?.total || 0
      },
      run2: {
        runId: run2.run_id,
        timestamp: run2.timestamp,
        overallScore: run2.overall_score,
        passRate: run2.summary?.pass_rate || 0,
        totalTests: run2.summary?.total || 0
      },
      deltas: {
        overallScore: run2.overall_score - run1.overall_score,
        passRate: (run2.summary?.pass_rate || 0) - (run1.summary?.pass_rate || 0),
        totalTests: (run2.summary?.total || 0) - (run1.summary?.total || 0)
      },
      categoryComparison: {},
      testComparison: []
    };
    
    // Compare categories
    const categories1 = run1.scores_by_category || {};
    const categories2 = run2.scores_by_category || {};
    const allCategories = new Set([...Object.keys(categories1), ...Object.keys(categories2)]);
    
    allCategories.forEach(category => {
      const score1 = categories1[category]?.score || categories1[category] || 0;
      const score2 = categories2[category]?.score || categories2[category] || 0;
      comparison.categoryComparison[category] = {
        score1,
        score2,
        delta: score2 - score1
      };
    });
    
    // Compare individual tests
    const results1Map = new Map(run1.results.map(r => [r.test_name, r]));
    const results2Map = new Map(run2.results.map(r => [r.test_name, r]));
    
    const allTestNames = new Set([...results1Map.keys(), ...results2Map.keys()]);
    
    allTestNames.forEach(testName => {
      const result1 = results1Map.get(testName);
      const result2 = results2Map.get(testName);
      
      if (result1 && result2) {
        comparison.testComparison.push({
          testName,
          score1: result1.score || 0,
          score2: result2.score || 0,
          delta: (result2.score || 0) - (result1.score || 0),
          status1: result1.passed ? 'passed' : 'failed',
          status2: result2.passed ? 'passed' : 'failed',
          statusChanged: result1.passed !== result2.passed
        });
      }
    });
    
    res.json({
      success: true,
      data: comparison
    });
  } catch (error) {
    console.error('Error comparing versions:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================================
// MULTIMODAL TESTING ENDPOINTS
// ============================================================================

/**
 * POST /api/testing/multimodal/execute
 * Execute multimodal tests (text, image, audio, video)
 */
router.post('/multimodal/execute', async (req, res) => {
  try {
    const { agentId, testId, inputs, options = {} } = req.body;
    
    if (!agentId || !testId || !inputs) {
      return res.status(400).json({
        success: false,
        error: 'agentId, testId, and inputs are required'
      });
    }
    
    // Validate multimodal inputs
    const validatedInputs = {
      text: inputs.text || '',
      image: inputs.image || null, // Base64 or URL
      audio: inputs.audio || null, // Base64 or URL
      video: inputs.video || null, // Base64 or URL
      metadata: inputs.metadata || {}
    };
    
    // Execute test with multimodal inputs
    const result = await testExecutionService.executeTest(agentId, testId, {
      ...options,
      multimodal: true,
      inputs: validatedInputs
    });
    
    res.json({
      success: true,
      data: result,
      inputTypes: Object.keys(validatedInputs).filter(k => validatedInputs[k])
    });
    
  } catch (error) {
    console.error('Error executing multimodal test:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/testing/multimodal/validate
 * Validate multimodal input formats
 */
router.post('/multimodal/validate', async (req, res) => {
  try {
    const { inputs } = req.body;
    
    if (!inputs) {
      return res.status(400).json({
        success: false,
        error: 'inputs object is required'
      });
    }
    
    const validation = {
      valid: true,
      errors: [],
      warnings: [],
      supportedFormats: {
        image: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        audio: ['mp3', 'wav', 'ogg', 'm4a'],
        video: ['mp4', 'webm', 'mov']
      }
    };
    
    // Validate image
    if (inputs.image) {
      if (typeof inputs.image !== 'string') {
        validation.valid = false;
        validation.errors.push('Image must be a base64 string or URL');
      } else if (inputs.image.startsWith('data:image/')) {
        // Base64 validation
        const match = inputs.image.match(/^data:image\/(\w+);base64,/);
        if (!match || !validation.supportedFormats.image.includes(match[1])) {
          validation.warnings.push(`Image format may not be supported: ${match?.[1]}`);
        }
      }
    }
    
    // Validate audio
    if (inputs.audio) {
      if (typeof inputs.audio !== 'string') {
        validation.valid = false;
        validation.errors.push('Audio must be a base64 string or URL');
      }
    }
    
    // Validate video
    if (inputs.video) {
      if (typeof inputs.video !== 'string') {
        validation.valid = false;
        validation.errors.push('Video must be a base64 string or URL');
      }
    }
    
    res.json({
      success: true,
      data: validation
    });
    
  } catch (error) {
    console.error('Error validating multimodal inputs:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/testing/multimodal/capabilities
 * Get multimodal testing capabilities
 */
router.get('/multimodal/capabilities', (req, res) => {
  res.json({
    success: true,
    data: {
      supported: true,
      inputTypes: ['text', 'image', 'audio', 'video'],
      imageFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      audioFormats: ['mp3', 'wav', 'ogg', 'm4a'],
      videoFormats: ['mp4', 'webm', 'mov'],
      maxSizes: {
        image: '10MB',
        audio: '25MB',
        video: '100MB'
      },
      features: [
        'Image analysis and description',
        'Audio transcription and analysis',
        'Video frame analysis',
        'Multi-input combination testing',
        'Cross-modal consistency validation'
      ]
    }
  });
});

// ============================================================================
// ============================================================================
// HEALTH CHECK
// ============================================================================

/**
 * GET /api/testing/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'DDTF Testing API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    services: {
      testLibrary: !!testLibraryService,
      testExecution: !!testExecutionService,
      insights: !!insightsService
    }
  });
});

/**
 * POST /api/testing/relevant-tests
 * Get relevant tests for a specific agent based on category and type
 */
router.post('/relevant-tests', async (req, res) => {
  try {
    const { agent } = req.body;
    
    if (!agent) {
      return res.status(400).json({
        success: false,
        error: 'Agent information is required'
      });
    }
    
    console.log('🎯 Getting relevant tests for agent:', agent);
    
    // Extract category and type from agent
    const category = agent.category || '';
    const agentType = agent.agentSubType || agent.agent_sub_type || agent.type || agent.agentType || '';
    
    // Get relevant test IDs from metadata service
    const relevantTestIds = getRelevantTestsForAgent(category, agentType);
    
    console.log(`📋 Found ${relevantTestIds.length} relevant test IDs for ${category}/${agentType}`);
    
    // Fetch actual test objects from testLibraryService
    const allTests = await testLibraryService.listTests({});
    
    // Filter tests to only include relevant ones by ID
    const coreTestObjects = allTests.filter(test => 
      relevantTestIds.includes(test.id)
    );
    
    // Get additional tests from same categories (but not already in core)
    const coreCategories = new Set(coreTestObjects.map(t => t.category));
    const additionalTestObjects = allTests.filter(test => 
      coreCategories.has(test.category) && !relevantTestIds.includes(test.id)
    );
    
    console.log(`✅ Found ${coreTestObjects.length} core tests and ${additionalTestObjects.length} additional tests`);
    
    res.json({
      success: true,
      data: {
        coreTests: coreTestObjects,
        additionalTests: additionalTestObjects,
        allTests: [...coreTestObjects, ...additionalTestObjects]
      },
      count: coreTestObjects.length + additionalTestObjects.length,
      metadata: {
        category,
        agentType,
        coreTestIds: relevantTestIds
      }
    });
    
  } catch (error) {
    console.error('❌ Error getting relevant tests:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

/**
 * GET /api/testing/categories
 * Get all available agent categories
 */
router.get('/categories', async (req, res) => {
  try {
    const categories = getAllCategories();
    
    res.json({
      success: true,
      data: categories,
      count: categories.length
    });
  } catch (error) {
    console.error('❌ Error getting categories:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/testing/categories/:category/agent-types
 * Get agent types for a specific category
 */
router.get('/categories/:category/agent-types', async (req, res) => {
  try {
    const { category } = req.params;
    const agentTypes = getAgentTypesForCategory(category);
    
    res.json({
      success: true,
      data: agentTypes,
      count: agentTypes.length
    });
  } catch (error) {
    console.error('❌ Error getting agent types:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/testing/agent-types/:category
 * Get available agent sub-types for a category
 */
router.get('/agent-types/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const testMetadataService = require('../src/services/testMetadataService');
    
    const agentTypes = testMetadataService.getAgentTypesForCategory(category);
    
    res.json({
      success: true,
      category: category,
      agentTypes: agentTypes,
      count: agentTypes.length
    });
  } catch (error) {
    console.error('❌ Error getting agent types for category:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;


// ============================================================================
// SAMPLE PROMPTS ENDPOINT
// ============================================================================

/**
 * POST /api/testing/sample-prompts
 * Get relevant sample prompts for a test and agent combination
 * 
 * Body:
 * {
 *   "agent": { "id": "...", "name": "...", "category": "...", "subtype": "..." },
 *   "test": { "id": "...", "name": "...", "category": "...", "subtype": "..." },
 *   "limit": 4  // optional, default 4
 * }
 */
router.post('/sample-prompts', async (req, res) => {
  try {
    const { agent, test, limit } = req.body;
    
    console.log('\n🔍 DEBUG: Sample Prompts API Request');
    console.log('Agent:', JSON.stringify(agent, null, 2));
    console.log('Test:', JSON.stringify(test, null, 2));
    console.log('Limit:', limit);
    
    if (!agent || !test) {
      return res.status(400).json({
        success: false,
        error: 'Both agent and test objects are required'
      });
    }
    
    // Initialize sample prompt service if not already done
    const SamplePromptService = require('../services/samplePromptService');
    const promptService = new SamplePromptService(null);
    
    // Get relevant prompts
    const prompts = promptService.getPromptsForTest(agent, test, limit || 4);
    
    console.log('🔍 DEBUG: Prompts returned:', prompts.length);
    
    res.json({
      success: true,
      data: {
        agent: {
          id: agent.id,
          name: agent.name,
          category: agent.category,
          subtype: agent.subtype
        },
        test: {
          id: test.id,
          name: test.name,
          category: test.category,
          subtype: test.subtype
        },
        prompts: prompts,
        count: prompts.length
      }
    });
    
  } catch (error) {
    console.error('Error getting sample prompts:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/testing/sample-prompts/statistics
 * Get statistics about the sample prompt library
 */
router.get('/sample-prompts/statistics', async (req, res) => {
  try {
    const SamplePromptService = require('../services/samplePromptService');
    const promptService = new SamplePromptService(null);
    
    const stats = promptService.getStatistics();
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('Error getting prompt statistics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
