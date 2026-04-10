// Convert existing test run data to learning data format
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'data');
const learningDir = path.join(dataDir, 'learning');

// Read test runs
const testRunsPath = path.join(dataDir, 'test-runs-cache.json');
const testRuns = JSON.parse(fs.readFileSync(testRunsPath, 'utf8'));

// Initialize learning data structures
const interactions = [];
const userProfiles = {};
const feedback = [];

console.log('📊 Converting test runs to learning data...\n');

// Convert each test run to interactions
let interactionCount = 0;
let userCount = 0;

Object.entries(testRuns).forEach(([runId, run]) => {
  if (!run.agent_id || !run.results) return;
  
  const userId = 'test-user'; // You can customize this
  const agentId = run.agent_id;
  const agentName = `Agent ${agentId.substring(0, 20)}`;
  
  // Create interaction for each test result
  run.results.forEach((result, index) => {
    const interaction = {
      id: `int_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: userId,
      agentId: agentId,
      agentName: agentName,
      intent: result.test_category || 'testing',
      query: result.input_used ? result.input_used.substring(0, 100) : result.test_name,
      accepted: result.passed,
      timestamp: new Date(parseInt(runId.split('_')[1])).toISOString(),
      executionTime: result.duration || 0,
      success: result.passed
    };
    
    interactions.push(interaction);
    interactionCount++;
    
    // Create feedback if there's a score
    if (result.score !== undefined) {
      const feedbackEntry = {
        id: `fb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: userId,
        agentId: agentId,
        type: result.score >= 70 ? 'positive' : result.score >= 50 ? 'neutral' : 'negative',
        rating: Math.ceil(result.score / 20), // Convert 0-100 to 1-5
        comment: result.explanation ? result.explanation.substring(0, 100) : 'Test result',
        category: 'agent_recommendation',
        timestamp: interaction.timestamp
      };
      
      feedback.push(feedbackEntry);
    }
  });
  
  // Update user profile
  if (!userProfiles[userId]) {
    userProfiles[userId] = {
      userId: userId,
      interactionCount: 0,
      acceptedCount: 0,
      rejectedCount: 0,
      totalExecutionTime: 0,
      intents: {},
      agents: {},
      firstSeen: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      confidenceThreshold: 0.7,
      explorationLevel: 50
    };
    userCount++;
  }
  
  const profile = userProfiles[userId];
  
  run.results.forEach(result => {
    profile.interactionCount++;
    if (result.passed) {
      profile.acceptedCount++;
    } else {
      profile.rejectedCount++;
    }
    profile.totalExecutionTime += result.duration || 0;
    
    // Track intents
    const intent = result.test_category || 'testing';
    profile.intents[intent] = (profile.intents[intent] || 0) + 1;
    
    // Track agents
    profile.agents[agentId] = (profile.agents[agentId] || 0) + 1;
  });
});

// Save to learning data files
fs.writeFileSync(
  path.join(learningDir, 'interactions.json'),
  JSON.stringify(interactions, null, 2)
);

fs.writeFileSync(
  path.join(learningDir, 'user-profiles.json'),
  JSON.stringify(userProfiles, null, 2)
);

fs.writeFileSync(
  path.join(learningDir, 'feedback.json'),
  JSON.stringify(feedback, null, 2)
);

console.log('✅ Conversion complete!\n');
console.log(`📊 Statistics:`);
console.log(`   - Users: ${userCount}`);
console.log(`   - Interactions: ${interactionCount}`);
console.log(`   - Feedback entries: ${feedback.length}`);
console.log(`   - Agents: ${Object.keys(userProfiles).reduce((acc, userId) => {
  return acc + Object.keys(userProfiles[userId].agents).length;
}, 0)}`);
console.log(`\n✅ Learning data saved to: ${learningDir}`);
console.log(`\n🔄 Restart the backend to load the new data!`);
