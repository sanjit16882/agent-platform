// Agent Similarity Search Service for Dynamic Intelligence
class AgentSimilarityService {
  constructor() {
    this.similarityThreshold = 0.3; // Minimum similarity to consider a match
  }

  async findSimilarAgents(semanticAnalysis, availableAgents) {
    const similarities = [];
    
    for (const agent of availableAgents) {
      const similarity = await this.calculateSimilarity(semanticAnalysis, agent);
      
      if (similarity.score >= this.similarityThreshold) {
        similarities.push({
          ...agent,
          similarity: Math.round(similarity.score * 100),
          matchReasons: similarity.reasons,
          commonFeatures: similarity.commonFeatures,
          suggestedModifications: similarity.modifications,
          usageStats: await this.getAgentUsageStats(agent.id)
        });
      }
    }
    
    // Sort by similarity score (highest first)
    return similarities.sort((a, b) => b.similarity - a.similarity);
  }

  async calculateSimilarity(semanticAnalysis, agent) {
    let score = 0;
    const reasons = [];
    const commonFeatures = [];
    const modifications = [];
    
    // 1. Intent/Category Matching (40% weight)
    const intentScore = this.calculateIntentSimilarity(semanticAnalysis, agent);
    score += intentScore.score * 0.4;
    if (intentScore.score > 0) {
      reasons.push(intentScore.reason);
      commonFeatures.push(...intentScore.features);
    }
    
    // 2. Technology Stack Matching (25% weight)
    const techScore = this.calculateTechnologySimilarity(semanticAnalysis, agent);
    score += techScore.score * 0.25;
    if (techScore.score > 0) {
      reasons.push(techScore.reason);
      commonFeatures.push(...techScore.features);
    }
    
    // 3. Input/Output Type Matching (20% weight)
    const ioScore = this.calculateIOSimilarity(semanticAnalysis, agent);
    score += ioScore.score * 0.2;
    if (ioScore.score > 0) {
      reasons.push(ioScore.reason);
      commonFeatures.push(...ioScore.features);
    }
    
    // 4. Semantic Keyword Matching (15% weight)
    const keywordScore = this.calculateKeywordSimilarity(semanticAnalysis, agent);
    score += keywordScore.score * 0.15;
    if (keywordScore.score > 0) {
      reasons.push(keywordScore.reason);
    }
    
    // Generate modification suggestions if similarity is partial
    if (score > 0.3 && score < 0.8) {
      modifications.push(...this.generateModificationSuggestions(semanticAnalysis, agent));
    }
    
    return {
      score: Math.min(score, 1.0),
      reasons: reasons.filter(r => r),
      commonFeatures: [...new Set(commonFeatures)],
      modifications
    };
  }

  calculateIntentSimilarity(semanticAnalysis, agent) {
    const intentMapping = {
      'code_review': ['Code Review', 'Security', 'Development', 'QE'],
      'security_scanning': ['Security', 'Code Review', 'DevOps'],
      'testing': ['QE', 'Testing', 'Development'],
      'data_processing': ['Data Processing', 'Business', 'Analytics'],
      'devops': ['DevOps', 'Infrastructure', 'Monitoring'],
      'api_integration': ['Development', 'Integration', 'Custom']
    };
    
    const expectedCategories = intentMapping[semanticAnalysis.intent] || [];
    const agentCategory = agent.category || agent.type || '';
    
    if (expectedCategories.includes(agentCategory)) {
      const exactMatch = expectedCategories[0] === agentCategory;
      return {
        score: exactMatch ? 1.0 : 0.7,
        reason: `${exactMatch ? 'Perfect' : 'Good'} category match: ${agentCategory}`,
        features: [agentCategory.toLowerCase()]
      };
    }
    
    // Check if agent name/description contains intent keywords
    const agentText = `${agent.name} ${agent.description}`.toLowerCase();
    const intentKeywords = this.getIntentKeywords(semanticAnalysis.intent);
    const matchingKeywords = intentKeywords.filter(keyword => agentText.includes(keyword));
    
    if (matchingKeywords.length > 0) {
      return {
        score: Math.min(matchingKeywords.length / intentKeywords.length, 0.6),
        reason: `Matches ${matchingKeywords.length} intent keywords`,
        features: matchingKeywords
      };
    }
    
    return { score: 0, reason: '', features: [] };
  }

  calculateTechnologySimilarity(semanticAnalysis, agent) {
    const agentTech = this.extractAgentTechnologies(agent);
    const queryTech = semanticAnalysis.technologies || [];
    
    if (queryTech.length === 0 || agentTech.length === 0) {
      return { score: 0, reason: '', features: [] };
    }
    
    const commonTech = queryTech.filter(tech => 
      agentTech.some(agentT => agentT.toLowerCase().includes(tech.toLowerCase()))
    );
    
    if (commonTech.length > 0) {
      const score = commonTech.length / Math.max(queryTech.length, agentTech.length);
      return {
        score,
        reason: `Shares ${commonTech.length} technologies: ${commonTech.join(', ')}`,
        features: commonTech
      };
    }
    
    return { score: 0, reason: '', features: [] };
  }

  calculateIOSimilarity(semanticAnalysis, agent) {
    const agentInputs = this.extractAgentInputTypes(agent);
    const agentOutputs = this.extractAgentOutputTypes(agent);
    const queryInputs = semanticAnalysis.inputTypes || [];
    const queryOutputs = semanticAnalysis.outputTypes || [];
    
    let score = 0;
    const features = [];
    let reason = '';
    
    // Check input similarity
    const commonInputs = queryInputs.filter(input => agentInputs.includes(input));
    if (commonInputs.length > 0) {
      score += 0.5 * (commonInputs.length / queryInputs.length);
      features.push(...commonInputs.map(i => `${i} input`));
    }
    
    // Check output similarity
    const commonOutputs = queryOutputs.filter(output => agentOutputs.includes(output));
    if (commonOutputs.length > 0) {
      score += 0.5 * (commonOutputs.length / queryOutputs.length);
      features.push(...commonOutputs.map(o => `${o} output`));
    }
    
    if (features.length > 0) {
      reason = `Compatible I/O: ${features.join(', ')}`;
    }
    
    return { score, reason, features };
  }

  calculateKeywordSimilarity(semanticAnalysis, agent) {
    const agentText = `${agent.name} ${agent.description}`.toLowerCase();
    const queryKeywords = semanticAnalysis.semanticKeywords || [];
    
    const matchingKeywords = queryKeywords.filter(keyword => 
      agentText.includes(keyword.toLowerCase())
    );
    
    if (matchingKeywords.length > 0) {
      const score = matchingKeywords.length / queryKeywords.length;
      return {
        score,
        reason: `${matchingKeywords.length} semantic keyword matches`,
        features: matchingKeywords
      };
    }
    
    return { score: 0, reason: '', features: [] };
  }

  generateModificationSuggestions(semanticAnalysis, agent) {
    const suggestions = [];
    
    // Technology gap suggestions
    const agentTech = this.extractAgentTechnologies(agent);
    const missingTech = semanticAnalysis.technologies.filter(tech => 
      !agentTech.some(agentT => agentT.toLowerCase().includes(tech.toLowerCase()))
    );
    
    if (missingTech.length > 0) {
      suggestions.push(`Add support for: ${missingTech.join(', ')}`);
    }
    
    // Input/Output modifications
    const agentInputs = this.extractAgentInputTypes(agent);
    const missingInputs = semanticAnalysis.inputTypes.filter(input => !agentInputs.includes(input));
    
    if (missingInputs.length > 0) {
      suggestions.push(`Add input types: ${missingInputs.join(', ')}`);
    }
    
    // Complexity adjustments
    if (semanticAnalysis.complexity === 'complex' && agent.complexity === 'simple') {
      suggestions.push('Enhance for complex scenarios');
    }
    
    return suggestions;
  }

  // Removed static keyword matching - now uses semantic similarity from dynamic intelligence
  getIntentKeywords(intent) {
    // Return empty array since we no longer use static keyword matching
    return [];
  }

  extractAgentTechnologies(agent) {
    const technologies = [];
    
    // Extract from supportedTechnologies field
    if (agent.supportedTechnologies) {
      technologies.push(...agent.supportedTechnologies);
    }
    
    // Extract from tags
    if (agent.tags) {
      technologies.push(...agent.tags);
    }
    
    // Extract from description
    const techPatterns = ['javascript', 'python', 'java', 'docker', 'kubernetes', 'aws', 'azure', 'react', 'node'];
    const agentText = `${agent.name} ${agent.description}`.toLowerCase();
    
    techPatterns.forEach(tech => {
      if (agentText.includes(tech)) {
        technologies.push(tech);
      }
    });
    
    return [...new Set(technologies)];
  }

  extractAgentInputTypes(agent) {
    const inputs = [];
    
    if (agent.inputs || agent.inputSchema) {
      const inputFields = agent.inputs || agent.inputSchema || [];
      inputFields.forEach(input => {
        if (input.type === 'file' || input.name.includes('file')) inputs.push('file');
        if (input.type === 'string' || input.type === 'text') inputs.push('text');
        if (input.name.includes('url') || input.name.includes('endpoint')) inputs.push('url');
      });
    }
    
    return inputs.length > 0 ? inputs : ['text'];
  }

  extractAgentOutputTypes(agent) {
    const outputs = [];
    
    if (agent.outputs || agent.outputSchema) {
      const outputFields = agent.outputs || agent.outputSchema || [];
      outputFields.forEach(output => {
        if (output.name.includes('report') || output.name.includes('analysis')) outputs.push('report');
        if (output.name.includes('file') || output.name.includes('document')) outputs.push('file');
        if (output.name.includes('notification') || output.name.includes('alert')) outputs.push('notification');
        outputs.push('data'); // Default
      });
    }
    
    return outputs.length > 0 ? outputs : ['data'];
  }

  async getAgentUsageStats(agentId) {
    // Mock usage stats - in production, this would query actual usage data
    return {
      usageCount: Math.floor(Math.random() * 100) + 10,
      successRate: Math.floor(Math.random() * 20) + 80,
      avgExecutionTime: Math.floor(Math.random() * 5000) + 1000,
      lastUsed: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: 'user-' + Math.floor(Math.random() * 100),
      rating: (Math.random() * 2 + 3).toFixed(1) // 3.0 to 5.0
    };
  }
}

module.exports = AgentSimilarityService;