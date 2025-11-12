// Simple intelligence analysis fix
async function analyzeQueryDynamically(query, userId, context) {
  try {
    console.log('🔍 Analyzing query dynamically:', query.substring(0, 50) + '...');
    
    const lowerQuery = query.toLowerCase();
    let intent = 'create-agent';
    let confidence = 0.7;
    let frameworks = [];
    let languages = [];
    let capabilities = [];
    let keywords = query.split(/\s+/).filter(word => word.length > 2);

    // Detect frameworks and capabilities
    if (lowerQuery.includes('react') || lowerQuery.includes('jsx')) {
      frameworks.push('React');
      languages.push('JavaScript', 'TypeScript');
    }
    if (lowerQuery.includes('vue')) {
      frameworks.push('Vue.js');
      languages.push('JavaScript');
    }
    if (lowerQuery.includes('angular')) {
      frameworks.push('Angular');
      languages.push('TypeScript');
    }
    if (lowerQuery.includes('node') || lowerQuery.includes('express')) {
      frameworks.push('Node.js');
      languages.push('JavaScript');
    }
    if (lowerQuery.includes('python') || lowerQuery.includes('django') || lowerQuery.includes('flask')) {
      languages.push('Python');
      if (lowerQuery.includes('django')) frameworks.push('Django');
      if (lowerQuery.includes('flask')) frameworks.push('Flask');
    }

    // Detect capabilities
    if (lowerQuery.includes('code') || lowerQuery.includes('review')) {
      capabilities.push('Code Review');
    }
    if (lowerQuery.includes('api') || lowerQuery.includes('rest') || lowerQuery.includes('endpoint')) {
      capabilities.push('API Development');
    }
    if (lowerQuery.includes('database') || lowerQuery.includes('sql') || lowerQuery.includes('mongodb')) {
      capabilities.push('Database Integration');
    }
    if (lowerQuery.includes('auth') || lowerQuery.includes('login') || lowerQuery.includes('security')) {
      capabilities.push('Authentication');
    }
    if (lowerQuery.includes('test') || lowerQuery.includes('unit') || lowerQuery.includes('integration')) {
      capabilities.push('Testing');
    }
    if (lowerQuery.includes('deploy') || lowerQuery.includes('docker') || lowerQuery.includes('kubernetes')) {
      capabilities.push('Deployment');
    }

    // Check for existing agents
    let existingAgents = [];
    const commonAgents = [
      { 
        id: 'code-reviewer', 
        name: 'Code Review Agent', 
        description: 'Reviews code for quality, security, and best practices', 
        category: 'Development', 
        keywords: ['code', 'review', 'quality', 'security', 'analysis'] 
      },
      { 
        id: 'api-tester', 
        name: 'API Testing Agent', 
        description: 'Tests REST APIs and validates responses', 
        category: 'Testing', 
        keywords: ['api', 'test', 'rest', 'endpoint', 'validation'] 
      },
      { 
        id: 'deployment-manager', 
        name: 'Deployment Manager', 
        description: 'Manages application deployments and CI/CD', 
        category: 'DevOps', 
        keywords: ['deploy', 'deployment', 'cicd', 'docker', 'kubernetes'] 
      },
      { 
        id: 'security-scanner', 
        name: 'Security Scanner', 
        description: 'Scans code for security vulnerabilities', 
        category: 'Security', 
        keywords: ['security', 'vulnerability', 'scan', 'audit'] 
      }
    ];

    // Calculate matches
    for (const agent of commonAgents) {
      let matchScore = 0;
      const queryWords = lowerQuery.split(/\s+/);
      
      // Check keyword matches
      for (const keyword of agent.keywords) {
        if (lowerQuery.includes(keyword.toLowerCase())) {
          matchScore += 0.3;
        }
      }
      
      // Check description matches
      for (const queryWord of queryWords) {
        if (queryWord.length > 2 && agent.description.toLowerCase().includes(queryWord)) {
          matchScore += 0.15;
        }
      }
      
      if (matchScore > 0.4) {
        existingAgents.push({
          ...agent,
          matchScore: Math.min(1.0, matchScore),
          reason: `Existing "${agent.name}" matches your requirements`
        });
      }
    }

    // Sort by match score
    existingAgents.sort((a, b) => b.matchScore - a.matchScore);
    
    if (existingAgents.length > 0) {
      intent = 'use-existing-agent';
      confidence = Math.max(0.8, existingAgents[0].matchScore);
      console.log(`🎯 Found ${existingAgents.length} matching existing agents`);
    }

    // Detect frameworks
    if (lowerQuery.includes('react') || lowerQuery.includes('jsx')) {
      frameworks.push('React');
      languages.push('JavaScript', 'TypeScript');
    }
    if (lowerQuery.includes('vue')) {
      frameworks.push('Vue.js');
      languages.push('JavaScript');
    }
    if (lowerQuery.includes('angular')) {
      frameworks.push('Angular');
      languages.push('TypeScript');
    }
    if (lowerQuery.includes('node') || lowerQuery.includes('express')) {
      frameworks.push('Node.js');
      languages.push('JavaScript');
    }
    if (lowerQuery.includes('python') || lowerQuery.includes('django') || lowerQuery.includes('flask')) {
      languages.push('Python');
      if (lowerQuery.includes('django')) frameworks.push('Django');
      if (lowerQuery.includes('flask')) frameworks.push('Flask');
    }

    // Detect capabilities
    if (lowerQuery.includes('api') || lowerQuery.includes('rest') || lowerQuery.includes('endpoint')) {
      capabilities.push('API Development');
    }
    if (lowerQuery.includes('database') || lowerQuery.includes('sql') || lowerQuery.includes('mongodb')) {
      capabilities.push('Database Integration');
    }
    if (lowerQuery.includes('auth') || lowerQuery.includes('login') || lowerQuery.includes('security')) {
      capabilities.push('Authentication');
    }
    if (lowerQuery.includes('test') || lowerQuery.includes('unit') || lowerQuery.includes('integration')) {
      capabilities.push('Testing');
    }
    if (lowerQuery.includes('deploy') || lowerQuery.includes('docker') || lowerQuery.includes('kubernetes')) {
      capabilities.push('Deployment');
    }

    // Generate suggestions
    let suggestions = [];
    if (existingAgents.length > 0) {
      suggestions = existingAgents.slice(0, 2).map(agent => ({
        title: `Use Existing: ${agent.name}`,
        description: agent.reason,
        confidence: agent.matchScore,
        type: 'existing-agent',
        agentId: agent.id
      }));
      
      suggestions.push({
        title: 'Create New Agent Instead',
        description: 'Build a new specialized agent with custom requirements',
        confidence: 0.6,
        type: 'create-new'
      });
    } else {
      suggestions = [
        {
          title: 'Custom Development Agent',
          description: 'Build a specialized agent for your requirements',
          confidence: 0.8,
          type: 'create-new'
        },
        {
          title: 'API Integration Agent',
          description: 'Create an agent for API development and integration',
          confidence: 0.6,
          type: 'create-new'
        },
        {
          title: 'Full-Stack Development Agent',
          description: 'Comprehensive development agent with multiple capabilities',
          confidence: 0.7,
          type: 'create-new'
        }
      ];
    }

    return {
      success: true,
      analysis: {
        intent,
        confidence,
        frameworks,
        languages,
        capabilities,
        keywords: keywords.slice(0, 10) // Limit to 10 keywords
      },
      suggestions,
      existingAgents,
      metadata: {
        processingTime: Date.now(),
        analysisType: 'enhanced-keyword-based'
      }
    };

  } catch (error) {
    console.error('❌ Dynamic analysis failed:', error);
    return {
      success: false,
      analysis: {
        intent: 'create-agent',
        confidence: 0.5,
        frameworks: [],
        languages: [],
        capabilities: [],
        keywords: []
      },
      suggestions: [],
      existingAgents: [],
      error: error.message || 'Analysis failed'
    };
  }
}

module.exports = { analyzeQueryDynamically };