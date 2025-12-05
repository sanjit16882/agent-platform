const fs = require('fs');
const path = require('path');

class TestMetadataService {
  constructor() {
    this.metadata = null;
    this.metadataPath = path.join(__dirname, '../data/testMetadata.json');
    this.loadMetadata();
  }

  loadMetadata() {
    try {
      // Always reload from file for hot-reload support in development
      const data = fs.readFileSync(this.metadataPath, 'utf8');
      this.metadata = JSON.parse(data);
      console.log('✅ Test metadata loaded successfully (hot-reload enabled)');
    } catch (error) {
      console.error('❌ Failed to load test metadata:', error.message);
      // Initialize with empty structure if file doesn't exist
      this.metadata = {
        version: '1.0',
        lastUpdated: new Date().toISOString(),
        categories: {}
      };
    }
  }

  /**
   * Get CORE test IDs for a specific agent category and type
   * @param {string} category - Agent category (e.g., "QE", "DevOps")
   * @param {string} agentType - Agent sub-type (e.g., "Test Case Creation")
   * @returns {string[]} Array of test IDs
   */
  getCoreTestsForAgent(category, agentType) {
    // Reload metadata for hot-reload support
    this.loadMetadata();
    
    if (!category || !agentType) {
      return [];
    }

    if (!this.metadata.categories[category]) {
      console.warn(`Category not found: ${category}`);
      return [];
    }

    const categoryData = this.metadata.categories[category];
    if (!categoryData.agentTypes[agentType]) {
      console.warn(`Agent type not found: ${agentType} in category ${category}`);
      return [];
    }

    const testIds = categoryData.agentTypes[agentType].coreTests || [];
    console.log(`Found ${testIds.length} CORE tests for ${category}/${agentType}`);
    return testIds;
  }

  /**
   * Get all available categories
   * @returns {Array} Array of category objects
   */
  getAllCategories() {
    // Reload metadata for hot-reload support
    this.loadMetadata();
    
    return Object.keys(this.metadata.categories).map(key => ({
      id: key,
      displayName: this.metadata.categories[key].displayName,
      description: this.metadata.categories[key].description,
      agentTypeCount: Object.keys(this.metadata.categories[key].agentTypes).length
    }));
  }

  /**
   * Get agent types for a specific category
   * @param {string} category - Category ID
   * @returns {Array} Array of agent type objects
   */
  getAgentTypesForCategory(category) {
    // Reload metadata for hot-reload support
    this.loadMetadata();
    
    if (!this.metadata.categories[category]) {
      return [];
    }

    const agentTypes = this.metadata.categories[category].agentTypes;
    return Object.keys(agentTypes).map(key => ({
      id: key,
      description: agentTypes[key].description,
      coreTestCount: agentTypes[key].coreTests.length
    }));
  }

  /**
   * Add a new category
   * @param {string} categoryId - Category ID
   * @param {string} displayName - Display name
   * @param {string} description - Description
   */
  addCategory(categoryId, displayName, description) {
    if (this.metadata.categories[categoryId]) {
      throw new Error(`Category ${categoryId} already exists`);
    }

    this.metadata.categories[categoryId] = {
      displayName,
      description,
      agentTypes: {}
    };

    this.saveMetadata();
    console.log(`✅ Added category: ${categoryId}`);
  }

  /**
   * Add a new agent type to a category
   * @param {string} category - Category ID
   * @param {string} agentTypeId - Agent type ID
   * @param {string} description - Description
   * @param {string[]} coreTests - Array of test IDs
   */
  addAgentType(category, agentTypeId, description, coreTests = []) {
    if (!this.metadata.categories[category]) {
      throw new Error(`Category ${category} does not exist`);
    }

    if (this.metadata.categories[category].agentTypes[agentTypeId]) {
      throw new Error(`Agent type ${agentTypeId} already exists in category ${category}`);
    }

    this.metadata.categories[category].agentTypes[agentTypeId] = {
      description,
      coreTests
    };

    this.saveMetadata();
    console.log(`✅ Added agent type: ${agentTypeId} to category ${category}`);
  }

  /**
   * Assign a test to an agent type
   * @param {string} category - Category ID
   * @param {string} agentType - Agent type ID
   * @param {string} testId - Test ID to assign
   */
  assignTestToAgentType(category, agentType, testId) {
    const agentTypeData = this.metadata.categories[category]?.agentTypes[agentType];
    if (!agentTypeData) {
      throw new Error(`Agent type ${agentType} not found in category ${category}`);
    }

    if (!agentTypeData.coreTests.includes(testId)) {
      agentTypeData.coreTests.push(testId);
      this.saveMetadata();
      console.log(`✅ Assigned test ${testId} to ${category}/${agentType}`);
    } else {
      console.log(`Test ${testId} already assigned to ${category}/${agentType}`);
    }
  }

  /**
   * Unassign a test from an agent type
   * @param {string} category - Category ID
   * @param {string} agentType - Agent type ID
   * @param {string} testId - Test ID to unassign
   */
  unassignTestFromAgentType(category, agentType, testId) {
    const agentTypeData = this.metadata.categories[category]?.agentTypes[agentType];
    if (!agentTypeData) {
      throw new Error(`Agent type ${agentType} not found in category ${category}`);
    }

    agentTypeData.coreTests = agentTypeData.coreTests.filter(id => id !== testId);
    this.saveMetadata();
    console.log(`✅ Unassigned test ${testId} from ${category}/${agentType}`);
  }

  /**
   * Save metadata to file
   */
  saveMetadata() {
    try {
      // Update lastUpdated timestamp
      this.metadata.lastUpdated = new Date().toISOString();

      // Ensure directory exists
      const dir = path.dirname(this.metadataPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(this.metadataPath, JSON.stringify(this.metadata, null, 2));
      console.log('✅ Test metadata saved successfully');
    } catch (error) {
      console.error('❌ Failed to save test metadata:', error.message);
      throw error;
    }
  }

  /**
   * Validate metadata integrity
   * @returns {Object} Validation result
   */
  validateMetadata() {
    const errors = [];
    const warnings = [];

    // Load test library for validation
    const testLibraryPath = path.join(__dirname, '../data/testLibrary.json');
    let validTestIds = new Set();

    try {
      const testLibraryData = fs.readFileSync(testLibraryPath, 'utf8');
      const testLibrary = JSON.parse(testLibraryData);
      validTestIds = new Set(testLibrary.tests.map(t => t.id));
    } catch (error) {
      errors.push({
        type: 'CRITICAL',
        message: 'Cannot load test library for validation',
        error: error.message
      });
      return { valid: false, errors, warnings };
    }

    // Validate that all referenced test IDs exist in test library
    for (const [categoryId, category] of Object.entries(this.metadata.categories)) {
      for (const [agentTypeId, agentType] of Object.entries(category.agentTypes)) {
        for (const testId of agentType.coreTests) {
          if (!validTestIds.has(testId)) {
            errors.push({
              type: 'INVALID_TEST_ID',
              category: categoryId,
              agentType: agentTypeId,
              testId,
              message: `Test ID "${testId}" does not exist in test library`
            });
          }
        }

        // Warn if agent type has no tests
        if (agentType.coreTests.length === 0) {
          warnings.push({
            type: 'NO_TESTS',
            category: categoryId,
            agentType: agentTypeId,
            message: `Agent type "${agentTypeId}" has no CORE tests assigned`
          });
        }

        // Warn if agent type has very few tests
        if (agentType.coreTests.length < 3) {
          warnings.push({
            type: 'FEW_TESTS',
            category: categoryId,
            agentType: agentTypeId,
            testCount: agentType.coreTests.length,
            message: `Agent type "${agentTypeId}" has only ${agentType.coreTests.length} CORE tests (recommended: 5+)`
          });
        }
      }

      // Warn if category has no agent types
      if (Object.keys(category.agentTypes).length === 0) {
        warnings.push({
          type: 'NO_AGENT_TYPES',
          category: categoryId,
          message: `Category "${categoryId}" has no agent types defined`
        });
      }
    }

    const valid = errors.length === 0;
    console.log(`Validation complete: ${errors.length} errors, ${warnings.length} warnings`);

    return { valid, errors, warnings };
  }

  /**
   * Get metadata statistics
   * @returns {Object} Statistics object
   */
  getStatistics() {
    const stats = {
      totalCategories: Object.keys(this.metadata.categories).length,
      totalAgentTypes: 0,
      totalCoreTests: 0,
      categoriesWithNoTests: 0,
      agentTypesWithNoTests: 0
    };

    for (const category of Object.values(this.metadata.categories)) {
      const agentTypes = Object.values(category.agentTypes);
      stats.totalAgentTypes += agentTypes.length;

      let categoryHasTests = false;
      for (const agentType of agentTypes) {
        const testCount = agentType.coreTests.length;
        stats.totalCoreTests += testCount;

        if (testCount === 0) {
          stats.agentTypesWithNoTests++;
        } else {
          categoryHasTests = true;
        }
      }

      if (!categoryHasTests) {
        stats.categoriesWithNoTests++;
      }
    }

    return stats;
  }
}

// Export singleton instance
module.exports = new TestMetadataService();
