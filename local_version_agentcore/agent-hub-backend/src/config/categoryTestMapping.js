/**
 * Category Test Mapping Configuration
 * Maps agent categories and types to relevant tests
 * This is a temporary bridge until the full test metadata service is integrated
 */

const testMetadataService = require('../services/testMetadataService');

/**
 * Get relevant tests for an agent based on category and type
 * @param {string} category - Agent category
 * @param {string} agentType - Agent sub-type
 * @returns {string[]} Array of test IDs
 */
function getRelevantTestsForAgent(category, agentType) {
  if (!category || !agentType) {
    return [];
  }

  try {
    return testMetadataService.getCoreTestsForAgent(category, agentType);
  } catch (error) {
    console.error('Error getting relevant tests:', error);
    return [];
  }
}

/**
 * Get all available categories
 * @returns {Array} Array of category objects
 */
function getAllCategories() {
  try {
    return testMetadataService.getAllCategories();
  } catch (error) {
    console.error('Error getting categories:', error);
    return [];
  }
}

/**
 * Get agent types for a specific category
 * @param {string} category - Category ID
 * @returns {Array} Array of agent type objects
 */
function getAgentTypesForCategory(category) {
  try {
    return testMetadataService.getAgentTypesForCategory(category);
  } catch (error) {
    console.error('Error getting agent types:', error);
    return [];
  }
}

module.exports = {
  getRelevantTestsForAgent,
  getAllCategories,
  getAgentTypesForCategory
};
