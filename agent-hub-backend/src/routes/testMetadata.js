const express = require('express');
const router = express.Router();
const testMetadataService = require('../services/testMetadataService');

// GET /api/v1/test-metadata/categories
// Get all available categories
router.get('/categories', (req, res) => {
  try {
    const categories = testMetadataService.getAllCategories();
    res.json({
      success: true,
      categories,
      count: categories.length
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/v1/test-metadata/agent-types/:category
// Get agent types for a specific category
router.get('/agent-types/:category', (req, res) => {
  try {
    const { category } = req.params;
    const agentTypes = testMetadataService.getAgentTypesForCategory(category);

    if (agentTypes.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Category "${category}" not found or has no agent types`
      });
    }

    res.json({
      success: true,
      category,
      agentTypes,
      count: agentTypes.length
    });
  } catch (error) {
    console.error('Error fetching agent types:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/v1/test-metadata/core-tests/:category/:agentType
// Get CORE tests for a specific category and agent type
router.get('/core-tests/:category/:agentType', (req, res) => {
  try {
    const { category, agentType } = req.params;
    const testIds = testMetadataService.getCoreTestsForAgent(category, agentType);

    if (testIds.length === 0) {
      return res.json({
        success: true,
        category,
        agentType,
        coreTests: [],
        count: 0,
        message: 'No CORE tests found for this agent type'
      });
    }

    // Load test details from test library
    const testLibraryService = require('../services/testLibraryService');
    const tests = testIds.map(id => testLibraryService.getTestById(id)).filter(t => t !== null);

    res.json({
      success: true,
      category,
      agentType,
      coreTests: tests,
      count: tests.length
    });
  } catch (error) {
    console.error('Error fetching CORE tests:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/v1/test-metadata/statistics
// Get metadata statistics
router.get('/statistics', (req, res) => {
  try {
    const stats = testMetadataService.getStatistics();
    res.json({
      success: true,
      statistics: stats
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/v1/test-metadata/suggest-tests
// Get LLM-based test suggestions (optional, advisory)
router.post('/suggest-tests', async (req, res) => {
  try {
    const { agentName, agentDescription, category, agentType } = req.body;

    if (!agentName || !category || !agentType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: agentName, category, agentType'
      });
    }

    // TODO: Implement LLM suggestion service
    // For now, return empty suggestions
    res.json({
      success: true,
      suggestedTests: [],
      confidence: 0,
      requiresReview: true,
      message: 'LLM suggestion service not yet implemented'
    });
  } catch (error) {
    console.error('Error suggesting tests:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// ADMIN ENDPOINTS (Protected)
// ============================================

// POST /api/v1/test-metadata/admin/category
// Add a new category
router.post('/admin/category', (req, res) => {
  try {
    const { categoryId, displayName, description } = req.body;

    if (!categoryId || !displayName || !description) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: categoryId, displayName, description'
      });
    }

    testMetadataService.addCategory(categoryId, displayName, description);

    res.json({
      success: true,
      message: `Category "${categoryId}" added successfully`
    });
  } catch (error) {
    console.error('Error adding category:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/v1/test-metadata/admin/agent-type
// Add a new agent type to a category
router.post('/admin/agent-type', (req, res) => {
  try {
    const { category, agentTypeId, description, coreTests } = req.body;

    if (!category || !agentTypeId || !description) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: category, agentTypeId, description'
      });
    }

    testMetadataService.addAgentType(
      category,
      agentTypeId,
      description,
      coreTests || []
    );

    res.json({
      success: true,
      message: `Agent type "${agentTypeId}" added to category "${category}"`
    });
  } catch (error) {
    console.error('Error adding agent type:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/v1/test-metadata/admin/assign-test
// Assign a test to an agent type
router.post('/admin/assign-test', (req, res) => {
  try {
    const { category, agentType, testId } = req.body;

    if (!category || !agentType || !testId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: category, agentType, testId'
      });
    }

    testMetadataService.assignTestToAgentType(category, agentType, testId);

    res.json({
      success: true,
      message: `Test "${testId}" assigned to ${category}/${agentType}`
    });
  } catch (error) {
    console.error('Error assigning test:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// DELETE /api/v1/test-metadata/admin/unassign-test
// Unassign a test from an agent type
router.delete('/admin/unassign-test', (req, res) => {
  try {
    const { category, agentType, testId } = req.body;

    if (!category || !agentType || !testId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: category, agentType, testId'
      });
    }

    testMetadataService.unassignTestFromAgentType(category, agentType, testId);

    res.json({
      success: true,
      message: `Test "${testId}" unassigned from ${category}/${agentType}`
    });
  } catch (error) {
    console.error('Error unassigning test:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/v1/test-metadata/admin/validate
// Validate metadata integrity
router.get('/admin/validate', (req, res) => {
  try {
    const validation = testMetadataService.validateMetadata();

    res.json({
      success: true,
      validation
    });
  } catch (error) {
    console.error('Error validating metadata:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
