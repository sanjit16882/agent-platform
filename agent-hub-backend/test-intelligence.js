const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3002; // Use main port

// Middleware
app.use(cors());
app.use(express.json());

// Updated intelligence analysis with existing agent detection
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

    // Detect frameworks and capabilities (same as before)
    if (lowerQuery.includes('react') || lowerQuery.includes('jsx')) {
      frameworks.push('React');
      languages.push('JavaScript', 'TypeScript');
    }
    if (lowerQuery.includes('code') || lowerQuery.includes('review')) {
      capabilities.push('Code Review');
    }
    if (lowerQuery.includes('api') || lowerQuery.includes('rest')) {
      capabilities.push('API Development');
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
        keywords: keywords.slice(0, 10)
      },
      suggestions,
      existingAgents,
      metadata: {
        processingTime: Date.now(),
        analysisType: 'enhanced-with-existing-agents'
      }
    };

  } catch (error) {
    console.error('❌ Analysis failed:', error);
    return {
      success: false,
      analysis: { intent: 'create-agent', confidence: 0.5, frameworks: [], languages: [], capabilities: [], keywords: [] },
      suggestions: [],
      existingAgents: [],
      error: error.message
    };
  }
}

// Intelligence endpoint
app.post('/api/intelligence/analyze-query-dynamic', async (req, res) => {
  try {
    const { query, userId, context } = req.body;

    if (!query || !query.trim()) {
      return res.status(400).json({ 
        error: 'Query is required',
        success: false 
      });
    }

    console.log('🧠 Intelligence Analysis:', { 
      query: query.substring(0, 50) + '...', 
      userId: userId || 'anonymous'
    });

    const result = await analyzeQueryDynamically(query, userId, context);

    console.log('✅ Analysis Complete:', { 
      intent: result.analysis.intent,
      confidence: Math.round(result.analysis.confidence * 100) + '%',
      existingAgents: result.existingAgents.length,
      suggestions: result.suggestions.length
    });

    res.json(result);

  } catch (error) {
    console.error('❌ Intelligence error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze query',
      success: false,
      message: error.message
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'intelligence-test' });
});

app.listen(PORT, () => {
  console.log(`🧠 Intelligence Test Server running on port ${PORT}`);
  console.log(`🔗 Test endpoint: http://localhost:${PORT}/api/intelligence/analyze-query-dynamic`);
});