/**
 * Test Metadata API Routes
 * Provides endpoints for accessing test metadata and core test mappings
 */

const express = require('express');
const router = express.Router();
const testMetadataService = require('../src/services/testMetadataService');
const TestLibraryService = require('../services/testLibraryService');

// Initialize test library service
let testLibraryService;

router.use((req, res, next) => {
  if (!testLibraryService) {
    const db = req.app.locals.db || null;
    testLibraryService = new TestLibraryService(db);
  }
  next();
});

/**
 * GET /api/v1/test-metadata/core-tests/:category/:agentType
 * Get core tests for a specific agent category and type
 */
router.get('/core-tests/:category/:agentType', async (req, res) => {
  try {
    const { category, agentType } = req.params;
    
    console.log(`🎯 Getting core tests for ${category} - ${agentType}`);
    
    // Get core test IDs from metadata service
    const coreTestIds = testMetadataService.getCoreTestsForAgent(category, agentType);
    
    if (coreTestIds.length === 0) {
      console.warn(`⚠️ No core tests found for ${category} - ${agentType}`);
      return res.json({
        success: true,
        coreTests: [],
        message: `No core tests defined for ${category} - ${agentType}`
      });
    }
    
    // Load actual test objects from test library
    const allTests = await testLibraryService.listTests({});
    
    // Filter to get only the core tests
    const coreTests = allTests.filter(test => coreTestIds.includes(test.id));
    
    console.log(`✅ Found ${coreTests.length} core tests for ${category} - ${agentType}`);
    
    res.json({
      success: true,
      coreTests,
      metadata: {
        category,
        agentType,
        coreTestCount: coreTests.length,
        coreTestIds
      }
    });
    
  } catch (error) {
    console.error('❌ Error getting core tests:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * GET /api/v1/test-metadata/categories
 * Get all available categories
 */
router.get('/categories', async (req, res) => {
  try {
    const categories = testMetadataService.getAllCategories();
    
    res.json({
      success: true,
      categories,
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
 * GET /api/v1/test-metadata/agent-types/:category
 * Get agent types for a specific category
 */
router.get('/agent-types/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const agentTypes = testMetadataService.getAgentTypesForCategory(category);
    
    res.json({
      success: true,
      agentTypes,
      category,
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
 * GET /api/v1/test-metadata/statistics
 * Get metadata statistics
 */
router.get('/statistics', async (req, res) => {
  try {
    const stats = testMetadataService.getStatistics();
    
    res.json({
      success: true,
      statistics: stats
    });
    
  } catch (error) {
    console.error('❌ Error getting statistics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/v1/test-metadata/validate
 * Validate metadata integrity
 */
router.post('/validate', async (req, res) => {
  try {
    const validation = testMetadataService.validateMetadata();
    
    res.json({
      success: true,
      validation
    });
    
  } catch (error) {
    console.error('❌ Error validating metadata:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
