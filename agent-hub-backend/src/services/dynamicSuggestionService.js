// Dynamic Suggestion Generation Service
class DynamicSuggestionService {
  constructor() {
    this.suggestionTypes = {
      EXISTING_AGENT: 'existing_agent',
      FORK_AGENT: 'fork_agent', 
      CREATE_NEW: 'create_new',
      OPTIMIZATION: 'optimization',
      TEMPLATE: 'template'
    };
  }

  async generateSuggestions(semanticAnalysis, similarAgents, userContext = {}) {
    const suggestions = [];
    
    // Generate suggestions based on similar agents found
    if (similarAgents.length > 0) {
      suggestions.push(...this.generateExistingAgentSuggestions(similarAgents, semanticAnalysis));
      suggestions.push(...this.generateForkSuggestions(similarAgents, semanticAnalysis));
    }
    
    // Always provide create new option
    suggestions.push(this.generateCreateNewSuggestion(semanticAnalysis, similarAgents.length));
    
    // Add optimization suggestions if applicable
    if (userContext.currentComponents && userContext.currentComponents.length > 0) {
      suggestions.push(...this.generateOptimizationSuggestions(semanticAnalysis, userContext));
    }
    
    // Add template suggestions
    suggestions.push(...this.generateTemplateSuggestions(semanticAnalysis));
    
    // Sort by confidence and relevance
    return suggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5); // Limit to top 5 suggestions
  }

  generateExistingAgentSuggestions(similarAgents, semanticAnalysis) {
    const suggestions = [];
    
    // Take top 2 most similar agents
    const topAgents = similarAgents.slice(0, 2);
    
    topAgents.forEach((agent, index) => {
      const confidence = agent.similarity / 100;
      
      suggestions.push({
        id: `existing_${agent.id}_${Date.now()}`,
        type: this.suggestionTypes.EXISTING_AGENT,
        title: `Use Existing: ${agent.name}`,
        description: `Found a ${agent.similarity}% match with proven track record (${agent.usageStats.usageCount} uses, ${agent.usageStats.successRate}% success rate)`,
        confidence,
        reasoning: this.generateExistingAgentReasoning(agent, semanticAnalysis),
        actionData: {
          agentId: agent.id,
          agentName: agent.name,
          similarity: agent.similarity,
          usageStats: agent.usageStats,
          commonFeatures: agent.commonFeatures,
          modifications: agent.suggestedModifications
        },
        semanticMatch: agent.commonFeatures,
        platformContext: {
          isExisting: true,
          usageCount: agent.usageStats.usageCount,
          successRate: agent.usageStats.successRate,
          lastUsed: agent.usageStats.lastUsed
        }
      });
    });
    
    return suggestions;
  }

  generateForkSuggestions(similarAgents, semanticAnalysis) {
    const suggestions = [];
    
    // Find agents with good similarity but need modifications
    const forkCandidates = similarAgents.filter(agent => 
      agent.similarity >= 60 && agent.similarity < 85 && agent.suggestedModifications.length > 0
    );
    
    forkCandidates.slice(0, 2).forEach(agent => {
      const confidence = (agent.similarity / 100) * 0.8; // Slightly lower than using existing
      
      suggestions.push({
        id: `fork_${agent.id}_${Date.now()}`,
        type: this.suggestionTypes.FORK_AGENT,
        title: `Fork & Customize: ${agent.name}`,
        description: `Customize existing agent (${agent.similarity}% match) with ${agent.suggestedModifications.length} modifications for your specific needs`,
        confidence,
        reasoning: this.generateForkReasoning(agent, semanticAnalysis),
        actionData: {
          baseAgentId: agent.id,
          baseAgentName: agent.name,
          similarity: agent.similarity,
          requiredChanges: agent.suggestedModifications,
          estimatedEffort: this.estimateForkEffort(agent.suggestedModifications),
          commonFeatures: agent.commonFeatures
        },
        semanticMatch: agent.commonFeatures,
        platformContext: {
          isFork: true,
          baseAgent: agent.name,
          modificationsNeeded: agent.suggestedModifications.length
        }
      });
    });
    
    return suggestions;
  }

  generateCreateNewSuggestion(semanticAnalysis, existingAgentsCount) {
    // Higher confidence if no similar agents found
    const baseConfidence = existingAgentsCount === 0 ? 0.9 : 0.7;
    
    // Adjust confidence based on complexity and clarity
    const complexityMultiplier = {
      'simple': 1.0,
      'medium': 0.9,
      'complex': 0.8
    };
    
    const confidence = baseConfidence * complexityMultiplier[semanticAnalysis.complexity];
    
    return {
      id: `create_new_${Date.now()}`,
      type: this.suggestionTypes.CREATE_NEW,
      title: existingAgentsCount === 0 ? 'Create New Agent' : 'Create Custom Agent',
      description: existingAgentsCount === 0 
        ? 'No existing agents match your requirements - create a new one tailored to your needs'
        : 'Create a completely new agent with custom architecture for your specific requirements',
      confidence,
      reasoning: this.generateCreateNewReasoning(semanticAnalysis, existingAgentsCount),
      actionData: {
        suggestedArchitecture: this.suggestArchitecture(semanticAnalysis),
        recommendedComponents: this.recommendComponents(semanticAnalysis),
        estimatedEffort: semanticAnalysis.estimatedEffort,
        technologies: semanticAnalysis.technologies,
        complexity: semanticAnalysis.complexity
      },
      semanticMatch: semanticAnalysis.semanticKeywords,
      platformContext: {
        isNew: true,
        noExistingMatch: existingAgentsCount === 0,
        estimatedDays: semanticAnalysis.estimatedEffort
      }
    };
  }

  generateOptimizationSuggestions(semanticAnalysis, userContext) {
    const suggestions = [];
    
    if (userContext.orchestrationMode === 'sequential' && userContext.components > 2) {
      suggestions.push({
        id: `optimization_parallel_${Date.now()}`,
        type: this.suggestionTypes.OPTIMIZATION,
        title: 'Enable Parallel Execution',
        description: `Your ${userContext.components} components could run in parallel to improve performance by ~${Math.round(userContext.components * 0.3 * 100)}%`,
        confidence: 0.75,
        reasoning: 'Components without dependencies can execute simultaneously, reducing total execution time',
        actionData: {
          optimizations: ['parallel-execution'],
          expectedImprovement: `${Math.round(userContext.components * 0.3 * 100)}% faster`,
          suggestedMode: 'parallel'
        },
        semanticMatch: ['performance', 'optimization'],
        platformContext: {
          isOptimization: true,
          currentMode: userContext.orchestrationMode,
          componentCount: userContext.components
        }
      });
    }
    
    return suggestions;
  }

  generateTemplateSuggestions(semanticAnalysis) {
    const suggestions = [];
    
    // Suggest templates based on intent
    const templateMap = {
      'code_review': {
        name: 'Code Quality Analyzer Template',
        description: 'Pre-built template for code analysis with security scanning and best practices validation'
      },
      'security_scanning': {
        name: 'Security Assessment Template', 
        description: 'Comprehensive security scanning template with vulnerability detection and compliance checking'
      },
      'testing': {
        name: 'Automated Testing Template',
        description: 'Complete testing framework template with unit, integration, and E2E test generation'
      },
      'data_processing': {
        name: 'Data Pipeline Template',
        description: 'ETL pipeline template with data validation, transformation, and quality checks'
      }
    };
    
    const template = templateMap[semanticAnalysis.intent];
    if (template) {
      suggestions.push({
        id: `template_${semanticAnalysis.intent}_${Date.now()}`,
        type: this.suggestionTypes.TEMPLATE,
        title: `Use ${template.name}`,
        description: template.description,
        confidence: 0.8,
        reasoning: `Template specifically designed for ${semanticAnalysis.intent} use cases with proven patterns`,
        actionData: {
          templateId: semanticAnalysis.intent,
          templateName: template.name,
          preConfigured: true,
          customizationNeeded: 'minimal'
        },
        semanticMatch: [semanticAnalysis.intent],
        platformContext: {
          isTemplate: true,
          intent: semanticAnalysis.intent
        }
      });
    }
    
    return suggestions;
  }

  generateExistingAgentReasoning(agent, semanticAnalysis) {
    const reasons = [];
    
    reasons.push(`${agent.similarity}% semantic similarity with your requirements`);
    
    if (agent.usageStats.usageCount > 50) {
      reasons.push(`Proven reliability with ${agent.usageStats.usageCount} successful uses`);
    }
    
    if (agent.usageStats.successRate > 90) {
      reasons.push(`High success rate of ${agent.usageStats.successRate}%`);
    }
    
    if (agent.commonFeatures.length > 0) {
      reasons.push(`Shares key features: ${agent.commonFeatures.slice(0, 3).join(', ')}`);
    }
    
    return reasons.join('. ') + '.';
  }

  generateForkReasoning(agent, semanticAnalysis) {
    const reasons = [];
    
    reasons.push(`${agent.similarity}% match with existing proven agent`);
    reasons.push(`Requires ${agent.suggestedModifications.length} modifications to meet your needs`);
    
    if (agent.usageStats.successRate > 80) {
      reasons.push(`Based on reliable foundation (${agent.usageStats.successRate}% success rate)`);
    }
    
    const effort = this.estimateForkEffort(agent.suggestedModifications);
    reasons.push(`Estimated ${effort} days to customize vs building from scratch`);
    
    return reasons.join('. ') + '.';
  }

  generateCreateNewReasoning(semanticAnalysis, existingAgentsCount) {
    const reasons = [];
    
    if (existingAgentsCount === 0) {
      reasons.push('No existing agents match your specific requirements');
      reasons.push('Custom solution will be optimally designed for your use case');
    } else {
      reasons.push('Existing agents require significant modifications');
      reasons.push('Custom agent will provide better long-term maintainability');
    }
    
    reasons.push(`Estimated ${semanticAnalysis.estimatedEffort} days development time`);
    reasons.push(`${semanticAnalysis.successProbability}% success probability based on requirements clarity`);
    
    return reasons.join('. ') + '.';
  }

  suggestArchitecture(semanticAnalysis) {
    const architectures = {
      'code_review': 'LLM + Static Analysis + Custom Rules Engine',
      'security_scanning': 'Security Scanner + LLM Analysis + Compliance Checker',
      'testing': 'Test Generator + Selenium/Playwright + Validation Engine',
      'data_processing': 'ETL Pipeline + Data Validator + Custom Transformers',
      'devops': 'Infrastructure Monitor + Automation Engine + Alert System',
      'api_integration': 'API Gateway + Custom Connectors + Data Mapper'
    };
    
    return architectures[semanticAnalysis.intent] || 'Custom Multi-Component Architecture';
  }

  recommendComponents(semanticAnalysis) {
    const componentMap = {
      'code_review': ['LLM Analyzer', 'Static Code Scanner', 'Quality Metrics Calculator'],
      'security_scanning': ['Vulnerability Scanner', 'Security Policy Checker', 'Compliance Validator'],
      'testing': ['Test Case Generator', 'Selenium Automation', 'Result Validator'],
      'data_processing': ['Data Extractor', 'Transformer Engine', 'Quality Checker'],
      'devops': ['Infrastructure Monitor', 'Deployment Automator', 'Alert Manager'],
      'api_integration': ['API Connector', 'Data Mapper', 'Response Handler']
    };
    
    return componentMap[semanticAnalysis.intent] || ['Custom Component', 'Data Processor', 'Output Generator'];
  }

  estimateForkEffort(modifications) {
    // Estimate effort in days based on modification complexity
    const effortMap = {
      'Add support for': 2,
      'Add input types': 1,
      'Enhance for complex': 3,
      'Update configuration': 1
    };
    
    let totalEffort = 0;
    modifications.forEach(mod => {
      const matchedKey = Object.keys(effortMap).find(key => mod.includes(key));
      totalEffort += effortMap[matchedKey] || 1;
    });
    
    return Math.max(totalEffort, 1);
  }
}

module.exports = DynamicSuggestionService;