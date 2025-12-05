/**
 * Dimension Executors Index
 * 
 * Exports all dimension executors for the DDATF framework
 */

const FunctionalExecutor = require('./FunctionalExecutor');
const IntegrationExecutor = require('./IntegrationExecutor');
const ConversationalExecutor = require('./ConversationalExecutor');
const PerformanceExecutor = require('./PerformanceExecutor');
const GovernanceExecutor = require('./GovernanceExecutor');
const SecurityExecutor = require('./SecurityExecutor');
const AdvancedExecutor = require('./AdvancedExecutor');

module.exports = {
  FunctionalExecutor,
  IntegrationExecutor,
  ConversationalExecutor,
  PerformanceExecutor,
  GovernanceExecutor,
  SecurityExecutor,
  AdvancedExecutor
};
