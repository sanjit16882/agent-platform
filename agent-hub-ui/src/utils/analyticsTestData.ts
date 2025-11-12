// Enhanced test data generator for realistic business analytics
import { realAnalyticsService } from '../services/realAnalyticsService';
import { advancedAnalyticsService } from '../services/advancedAnalyticsService';

export const generateTestExecutions = () => {
  const agents = [
    { id: 'qe-test-generator-v2', category: 'QE', name: 'QE Test Generator Pro' },
    { id: 'devops-monitor-v1', category: 'DevOps', name: 'DevOps Infrastructure Monitor' },
    { id: 'security-scanner-pro', category: 'Security', name: 'Security Vulnerability Scanner' },
    { id: 'business-analyzer', category: 'Business', name: 'Business Intelligence Analyzer' },
    { id: 'custom-agent-1', category: 'Custom', name: 'Custom Data Processor' },
    { id: 'custom-agent-2', category: 'Custom', name: 'Custom Report Generator' }
  ];

  // Generate realistic execution patterns
  const scenarios = [
    // Morning rush (9-11 AM) - High QE and DevOps activity
    { timeRange: [9, 11], categories: ['QE', 'DevOps'], weight: 0.4, successRate: 0.92 },
    // Midday (11 AM - 2 PM) - Mixed activity
    { timeRange: [11, 14], categories: ['QE', 'DevOps', 'Security', 'Business'], weight: 0.3, successRate: 0.88 },
    // Afternoon (2-5 PM) - Security and Business focus
    { timeRange: [14, 17], categories: ['Security', 'Business', 'Custom'], weight: 0.2, successRate: 0.85 },
    // Evening (5-8 PM) - Custom and experimental
    { timeRange: [17, 20], categories: ['Custom'], weight: 0.1, successRate: 0.75 }
  ];

  // Generate 100 realistic executions over the last 30 days
  for (let i = 0; i < 100; i++) {
    // Choose scenario based on weights
    const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
    const category = scenario.categories[Math.floor(Math.random() * scenario.categories.length)];
    const agent = agents.find(a => a.category === category) || agents[0];
    
    // Generate realistic timestamp
    const daysAgo = Math.floor(Math.random() * 30);
    const hour = scenario.timeRange[0] + Math.random() * (scenario.timeRange[1] - scenario.timeRange[0]);
    const timestamp = new Date();
    timestamp.setDate(timestamp.getDate() - daysAgo);
    timestamp.setHours(Math.floor(hour), Math.floor(Math.random() * 60), Math.floor(Math.random() * 60));
    
    // Determine status based on scenario success rate
    const status = Math.random() < scenario.successRate ? 'completed' : 'failed';
    
    // Generate realistic duration based on category
    const baseDurations = {
      'QE': 2500,
      'DevOps': 4200,
      'Security': 6800,
      'Business': 3500,
      'Custom': 1800
    };
    const baseDuration = baseDurations[category as keyof typeof baseDurations];
    const duration = baseDuration + (Math.random() - 0.5) * baseDuration * 0.6;
    
    // Generate realistic input based on category
    const inputs = {
      'QE': [
        'Generate comprehensive test cases for user authentication flow',
        'Create automated tests for payment processing system',
        'Develop integration tests for API endpoints',
        'Generate performance test scenarios for web application'
      ],
      'DevOps': [
        'Monitor Kubernetes cluster health and performance',
        'Analyze CI/CD pipeline efficiency and bottlenecks',
        'Generate infrastructure cost optimization report',
        'Monitor application deployment status across environments'
      ],
      'Security': [
        'Scan web application for OWASP Top 10 vulnerabilities',
        'Analyze network traffic for suspicious patterns',
        'Generate security compliance report for SOC 2',
        'Perform penetration testing on API endpoints'
      ],
      'Business': [
        'Analyze customer churn patterns and predictions',
        'Generate quarterly revenue performance report',
        'Analyze market trends and competitive positioning',
        'Create executive dashboard for key business metrics'
      ],
      'Custom': [
        'Process customer feedback data for sentiment analysis',
        'Generate custom report for stakeholder presentation',
        'Analyze user behavior patterns in mobile app',
        'Create data visualization for marketing campaign performance'
      ]
    };
    
    const categoryInputs = inputs[category as keyof typeof inputs];
    const input = categoryInputs[Math.floor(Math.random() * categoryInputs.length)];
    
    const execution = {
      executionId: `realistic-exec-${i}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      agentId: agent.id,
      agentName: agent.name,
      status,
      duration: Math.max(500, Math.floor(duration)),
      input,
      timestamp,
      category,
      analysisType: ['standard', 'detailed', 'quick', 'comprehensive'][Math.floor(Math.random() * 4)],
      outputFormat: ['json', 'pdf', 'csv', 'html'][Math.floor(Math.random() * 4)],
      // Additional business context
      costSavings: Math.floor(Math.random() * 200) + 50, // $50-$250 per execution
      userId: `user-${Math.floor(Math.random() * 25) + 1}`, // 25 different users
      businessPriority: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)],
      complexity: input.length > 100 ? 'complex' : input.length > 50 ? 'moderate' : 'simple'
    };

    // Track in both services
    realAnalyticsService.trackExecution(execution);
    advancedAnalyticsService.trackExecution(execution);
  }

  console.log('✅ Generated 100 realistic business executions for advanced analytics');
};

// Generate business events for more realistic analytics
export const generateBusinessEvents = () => {
  const events = [
    { type: 'feature_release', impact: 'positive', description: 'New agent deployment feature released' },
    { type: 'system_upgrade', impact: 'neutral', description: 'Backend infrastructure upgraded' },
    { type: 'security_incident', impact: 'negative', description: 'Minor security vulnerability patched' },
    { type: 'user_onboarding', impact: 'positive', description: 'New enterprise customer onboarded' },
    { type: 'performance_optimization', impact: 'positive', description: 'Database query optimization deployed' }
  ];

  events.forEach((event, index) => {
    // const timestamp = new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000); // Last 14 days - Future use
    
    // Simulate business event tracking
    console.log(`📊 Business Event ${index + 1}: ${event.description} (${event.impact} impact)`);
  });
};

// Generate market intelligence data
export const generateMarketData = () => {
  const marketEvents = [
    'AI automation adoption increased 45% in Q4',
    'DevOps practices now standard in 78% of enterprises',
    'Security automation spending up 32% year-over-year',
    'Cloud-first strategies driving 25% cost reduction',
    'Real-time analytics becoming competitive advantage'
  ];

  marketEvents.forEach((event, index) => {
    console.log(`🌍 Market Trend ${index + 1}: ${event}`);
  });
};

// Generate comprehensive test data on import (for development)
if (process.env.NODE_ENV === 'development') {
  // Only generate test data once per session
  const testDataGenerated = sessionStorage.getItem('advanced-analytics-test-data-generated');
  if (!testDataGenerated) {
    setTimeout(() => {
      generateTestExecutions();
      generateBusinessEvents();
      generateMarketData();
      sessionStorage.setItem('advanced-analytics-test-data-generated', 'true');
    }, 3000); // Wait 3 seconds after app loads
  }
}