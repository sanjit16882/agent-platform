// Seed script to generate sample learning data
const LearningAnalyticsService = require('./services/learningAnalyticsService');

async function seedData() {
  const learningAnalytics = new LearningAnalyticsService();
  
  console.log('🌱 Seeding learning analytics data...\n');

  // Sample users
  const users = ['user_demo_001', 'alice_dev', 'bob_ops', 'charlie_qa', 'diana_sec'];
  
  // Sample agents
  const agents = [
    { id: 'code-reviewer', name: 'Code Review Agent', intent: 'code_review' },
    { id: 'api-tester', name: 'API Testing Agent', intent: 'api_testing' },
    { id: 'deployment-manager', name: 'Deployment Manager', intent: 'deployment' },
    { id: 'security-scanner', name: 'Security Scanner', intent: 'security_scan' },
    { id: 'database-optimizer', name: 'Database Optimizer', intent: 'database_optimization' },
    { id: 'log-analyzer', name: 'Log Analyzer', intent: 'log_analysis' }
  ];

  // Sample queries
  const queries = [
    'Review my code for best practices',
    'Test the REST API endpoints',
    'Deploy to production',
    'Scan for security vulnerabilities',
    'Optimize database queries',
    'Analyze application logs'
  ];

  // Generate interactions over the past 7 days
  const now = Date.now();
  const oneWeek = 7 * 24 * 60 * 60 * 1000;
  let interactionCount = 0;

  for (let i = 0; i < 150; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    const agent = agents[Math.floor(Math.random() * agents.length)];
    const query = queries[Math.floor(Math.random() * queries.length)];
    
    // Random timestamp within the last week
    const timestamp = new Date(now - Math.random() * oneWeek);
    
    // 80% acceptance rate
    const accepted = Math.random() > 0.2;
    
    // 90% success rate
    const success = Math.random() > 0.1;
    
    // Random execution time between 100ms and 5000ms
    const executionTime = Math.floor(Math.random() * 4900) + 100;

    await learningAnalytics.trackInteraction({
      userId: user,
      agentId: agent.id,
      agentName: agent.name,
      intent: agent.intent,
      query: query,
      accepted: accepted,
      success: success,
      executionTime: executionTime
    });

    interactionCount++;
    
    // Add feedback for 30% of interactions
    if (Math.random() < 0.3) {
      const feedbackTypes = ['positive', 'negative', 'neutral'];
      const feedbackType = accepted ? 
        (Math.random() > 0.2 ? 'positive' : 'neutral') : 
        (Math.random() > 0.3 ? 'negative' : 'neutral');
      
      const categories = ['agent_recommendation', 'parameter_suggestion', 'workflow_optimization', 'integration_hint'];
      
      await learningAnalytics.trackFeedback({
        userId: user,
        agentId: agent.id,
        type: feedbackType,
        rating: feedbackType === 'positive' ? (4 + Math.floor(Math.random() * 2)) : 
                feedbackType === 'negative' ? (1 + Math.floor(Math.random() * 2)) : 3,
        category: categories[Math.floor(Math.random() * categories.length)],
        comment: feedbackType === 'positive' ? 'Great suggestion!' : 
                 feedbackType === 'negative' ? 'Not quite what I needed' : 'It was okay'
      });
    }

    // Progress indicator
    if ((i + 1) % 30 === 0) {
      console.log(`✅ Generated ${i + 1} interactions...`);
    }
  }

  console.log(`\n🎉 Successfully seeded ${interactionCount} interactions!`);
  console.log('📊 Learning analytics data is now available.\n');
  
  // Show summary
  const analytics = await learningAnalytics.getAnalytics();
  console.log('📈 Summary:');
  console.log(`   Total Users: ${analytics.totalUsers}`);
  console.log(`   Active Users: ${analytics.activeUsers}`);
  console.log(`   Total Interactions: ${analytics.totalInteractions}`);
  console.log(`   Acceptance Rate: ${analytics.avgAcceptanceRate}%`);
  console.log(`   Feedback Rate: ${analytics.feedbackRate}%`);
  console.log(`   Learning Velocity: ${analytics.learningVelocity} interactions/user/week`);
  console.log('\n✨ Refresh the Continuous Learning page to see the data!\n');
}

seedData().catch(console.error);
