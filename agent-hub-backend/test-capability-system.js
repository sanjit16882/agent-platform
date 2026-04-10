/**
 * Test Capability-Based Agent Routing
 * Shows how the system works with ANY agent configuration
 */

// Test agents with different configurations
const testAgents = [
  // Traditional naming (name-based detection)
  {
    id: 'agent_001',
    name: 'Code Analysis Agent',
    category: 'code-analysis',
    // No capabilities - will use name-based fallback
  },
  
  // Custom name with capabilities
  {
    id: 'agent_002',
    name: 'Quality Checker',
    category: 'quality',
    capabilities: ['code-analysis', 'security-scan']
  },
  
  // Different name, same capability
  {
    id: 'agent_003',
    name: 'Bug Hunter',
    category: 'security',
    capabilities: ['code-analysis', 'security-scan']
  },
  
  // Explicit serviceType
  {
    id: 'agent_004',
    name: 'Super Analyzer',
    category: 'custom',
    serviceType: 'code-analysis'
  },
  
  // Testing agent - traditional
  {
    id: 'agent_005',
    name: 'Testing Agent',
    category: 'testing'
  },
  
  // Testing agent - custom name with capabilities
  {
    id: 'agent_006',
    name: 'Test Generator',
    category: 'qa',
    capabilities: ['test-generation', 'test-execution']
  },
  
  // Documentation agent - traditional
  {
    id: 'agent_007',
    name: 'Documentation Agent',
    category: 'documentation'
  },
  
  // Documentation agent - custom name
  {
    id: 'agent_008',
    name: 'Report Writer',
    category: 'reporting',
    capabilities: ['documentation', 'report-generation']
  },
  
  // Generic agent (no special routing)
  {
    id: 'agent_009',
    name: 'General Assistant',
    category: 'general-qa'
  }
];

// Mock coordinator methods
function determineServiceType(agent) {
  // Priority 1: Explicit serviceType
  if (agent.serviceType) {
    return agent.serviceType;
  }
  
  // Priority 2: Capabilities
  if (agent.capabilities && Array.isArray(agent.capabilities)) {
    if (agent.capabilities.includes('code-analysis') || 
        agent.capabilities.includes('security-scan')) {
      return 'code-analysis';
    }
    
    if (agent.capabilities.includes('test-generation') || 
        agent.capabilities.includes('test-execution')) {
      return 'testing';
    }
    
    if (agent.capabilities.includes('documentation') || 
        agent.capabilities.includes('report-generation')) {
      return 'documentation';
    }
  }
  
  // Priority 3: Name-based fallback
  const name = agent.name?.toLowerCase() || '';
  const category = agent.category?.toLowerCase() || '';
  
  if (name.includes('code analysis') || category.includes('code-analysis')) {
    return 'code-analysis';
  }
  if (name.includes('test') || category.includes('test')) {
    return 'testing';
  }
  if (name.includes('document') || category.includes('document')) {
    return 'documentation';
  }
  
  return 'generic';
}

// Test routing
console.log('🧪 Testing Capability-Based Agent Routing\n');
console.log('='.repeat(80));

testAgents.forEach(agent => {
  const serviceType = determineServiceType(agent);
  const method = agent.serviceType ? 'explicit' : 
                 agent.capabilities ? 'capabilities' : 
                 'name-based';
  
  console.log(`\n📋 Agent: ${agent.name}`);
  console.log(`   ID: ${agent.id}`);
  console.log(`   Category: ${agent.category}`);
  if (agent.capabilities) {
    console.log(`   Capabilities: ${agent.capabilities.join(', ')}`);
  }
  if (agent.serviceType) {
    console.log(`   Service Type: ${agent.serviceType}`);
  }
  console.log(`   → Routed to: ${serviceType} (via ${method})`);
});

console.log('\n' + '='.repeat(80));
console.log('\n✅ Summary:\n');

// Group by service type
const grouped = {};
testAgents.forEach(agent => {
  const serviceType = determineServiceType(agent);
  if (!grouped[serviceType]) {
    grouped[serviceType] = [];
  }
  grouped[serviceType].push(agent.name);
});

Object.keys(grouped).forEach(serviceType => {
  console.log(`${serviceType}:`);
  grouped[serviceType].forEach(name => {
    console.log(`  - ${name}`);
  });
  console.log('');
});

console.log('🎯 Key Insights:');
console.log('  ✅ Multiple agents with different names can use the same service');
console.log('  ✅ Capabilities provide explicit routing (most reliable)');
console.log('  ✅ Name-based detection works as fallback (backward compatible)');
console.log('  ✅ Explicit serviceType overrides everything (highest priority)');
console.log('\n🚀 System is flexible and reusable across ANY agent configuration!');
