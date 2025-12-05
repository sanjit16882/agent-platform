const bedrockService = require('../src/services/bedrockService');

// Export the callBedrock function for the main server
module.exports = {
  callBedrock: bedrockService.callBedrock.bind(bedrockService),
  testConnection: bedrockService.testConnection.bind(bedrockService),
  models: bedrockService.models,
  agentModelMap: bedrockService.agentModelMap
};

console.log('✅ Bedrock integration module loaded successfully');