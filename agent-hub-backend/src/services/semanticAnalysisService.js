// Semantic Analysis Service for Dynamic Intelligence
class SemanticAnalysisService {
  constructor() {
    // No longer using static keyword patterns - using AI for semantic analysis
    console.log('🤖 SemanticAnalysisService initialized with AI-powered analysis');
  }

  async analyzeQuery(query) {
    console.log('🤖 Using REAL AI (Bedrock/Claude) for semantic analysis...');
    
    try {
      // Use real AI for analysis instead of keyword matching
      const bedrockService = require('./bedrockService');
      
      const aiPrompt = `You are an expert AI agent analyzer. Analyze this user request and return ONLY a valid JSON object with the exact structure specified.

User Request: "${query}"

Return ONLY this JSON structure (no other text):
{
  "intent": "code_review",
  "confidence": 0.95,
  "domain": "development",
  "technologies": ["javascript", "python"],
  "complexity": "medium",
  "inputTypes": ["code"],
  "outputTypes": ["report"],
  "businessValue": "high",
  "semanticKeywords": ["review", "quality"],
  "capabilities": ["static_analysis", "security_check"],
  "frameworks": ["react", "nodejs"],
  "languages": ["javascript", "python"],
  "estimatedEffort": "1-2 hours",
  "successProbability": 85
}

Rules:
- intent must be ONE of: code_review, security_scanning, testing, data_processing, devops, api_integration, automation, monitoring, general
- confidence must be a number between 0 and 1 (e.g., 0.95)
- domain must be ONE of: development, security, testing, data, infrastructure, business, general
- complexity must be ONE of: simple, medium, complex
- businessValue must be ONE of: high, medium, low
- successProbability must be a number between 0 and 100

Focus on semantic meaning, not just keywords.`;

      const aiResponse = await bedrockService.callBedrock('nlp-processor', aiPrompt, {
        context: 'semantic-analysis',
        query: query
      });

      if (aiResponse.success) {
        try {
          console.log('🔍 Raw AI Response:', aiResponse.content);
          
          // Parse AI response
          const aiAnalysis = JSON.parse(aiResponse.content);
          
          console.log('📊 Parsed AI Analysis:', aiAnalysis);
          
          // Handle nested intent object if AI returns it incorrectly
          let intent = aiAnalysis.intent;
          if (typeof intent === 'object' && intent.action) {
            intent = intent.action;
            console.log('🔧 Fixed nested intent:', intent);
          }
          
          console.log('✅ AI Semantic Analysis Result:', {
            intent: intent,
            confidence: `${Math.round(aiAnalysis.confidence * 100)}%`,
            domain: aiAnalysis.domain,
            technologies: aiAnalysis.technologies?.length || 0
          });
          
          return {
            intent: intent || 'general',
            confidence: aiAnalysis.confidence || 0.5,
            domain: aiAnalysis.domain || 'general',
            technologies: aiAnalysis.technologies || [],
            complexity: aiAnalysis.complexity || 'medium',
            inputTypes: aiAnalysis.inputTypes || [],
            outputTypes: aiAnalysis.outputTypes || [],
            businessValue: aiAnalysis.businessValue || 'medium',
            semanticKeywords: aiAnalysis.semanticKeywords || [],
            capabilities: aiAnalysis.capabilities || [],
            frameworks: aiAnalysis.frameworks || [],
            languages: aiAnalysis.languages || [],
            estimatedEffort: aiAnalysis.estimatedEffort || '1-2 hours',
            successProbability: aiAnalysis.successProbability || 75
          };
        } catch (parseError) {
          console.error('❌ Failed to parse AI response, using fallback');
          return this.getFallbackAnalysis(query);
        }
      } else {
        console.error('❌ AI analysis failed, using fallback');
        return this.getFallbackAnalysis(query);
      }
    } catch (error) {
      console.error('❌ Bedrock service error, using fallback:', error.message);
      return this.getFallbackAnalysis(query);
    }
  }

  getFallbackAnalysis(query) {
    // Simple fallback when AI is not available
    console.log('⚠️ Using simple fallback analysis (AI unavailable)');
    
    return {
      intent: 'general',
      confidence: 0.5,
      domain: 'general',
      technologies: [],
      complexity: 'medium',
      inputTypes: [],
      outputTypes: [],
      businessValue: 'medium',
      semanticKeywords: [],
      capabilities: ['automation'],
      frameworks: [],
      languages: [],
      estimatedEffort: '1-2 hours',
      successProbability: 50
    };
  }

  // Removed static keyword matching - now using AI for intent extraction

  extractTechnologies(queryLower) {
    const allTechnologies = new Set();
    
    // Extract from intent patterns
    Object.values(this.intentPatterns).forEach(pattern => {
      pattern.technologies.forEach(tech => {
        if (queryLower.includes(tech.toLowerCase())) {
          allTechnologies.add(tech);
        }
      });
    });
    
    // Additional technology detection
    const techPatterns = {
      'javascript': ['js', 'javascript', 'node', 'nodejs', 'react', 'vue', 'angular'],
      'python': ['python', 'py', 'django', 'flask', 'fastapi', 'pandas'],
      'java': ['java', 'spring', 'maven', 'gradle'],
      'docker': ['docker', 'container', 'containerize'],
      'kubernetes': ['k8s', 'kubernetes', 'kubectl'],
      'aws': ['aws', 'amazon', 'lambda', 'ec2', 's3'],
      'azure': ['azure', 'microsoft cloud'],
      'gcp': ['gcp', 'google cloud', 'firebase']
    };
    
    Object.entries(techPatterns).forEach(([tech, patterns]) => {
      if (patterns.some(pattern => queryLower.includes(pattern))) {
        allTechnologies.add(tech);
      }
    });
    
    return Array.from(allTechnologies);
  }

  identifyDomain(queryLower, intent) {
    const domainKeywords = {
      'finance': ['invoice', 'payment', 'accounting', 'financial', 'billing'],
      'healthcare': ['patient', 'medical', 'health', 'clinical'],
      'ecommerce': ['order', 'product', 'customer', 'shopping', 'cart'],
      'hr': ['employee', 'hr', 'human resources', 'payroll', 'onboarding'],
      'marketing': ['campaign', 'email', 'social media', 'analytics'],
      'operations': ['process', 'workflow', 'automation', 'monitoring'],
      'development': ['code', 'software', 'application', 'system']
    };
    
    for (const [domain, keywords] of Object.entries(domainKeywords)) {
      if (keywords.some(keyword => queryLower.includes(keyword))) {
        return domain;
      }
    }
    
    // Fallback based on intent
    const intentToDomain = {
      'code_review': 'development',
      'security_scanning': 'security',
      'testing': 'development',
      'data_processing': 'operations',
      'devops': 'operations',
      'api_integration': 'development'
    };
    
    return intentToDomain[intent] || 'general';
  }

  assessComplexity(queryLower, intent) {
    const complexityIndicators = {
      'simple': ['simple', 'basic', 'quick', 'easy'],
      'complex': ['complex', 'advanced', 'multiple', 'integrate', 'orchestrate', 'enterprise']
    };
    
    // Check for explicit complexity indicators
    for (const [level, indicators] of Object.entries(complexityIndicators)) {
      if (indicators.some(indicator => queryLower.includes(indicator))) {
        return level;
      }
    }
    
    // Default complexity based on intent
    const intentComplexity = this.intentPatterns[intent]?.complexity || 'medium';
    
    // Adjust based on query length and technical terms
    const wordCount = queryLower.split(' ').length;
    if (wordCount > 20) return 'complex';
    if (wordCount < 10) return 'simple';
    
    return intentComplexity;
  }

  identifyInputTypes(queryLower) {
    const inputPatterns = {
      'file': ['file', 'document', 'upload', 'csv', 'json', 'xml'],
      'text': ['text', 'string', 'message', 'content'],
      'url': ['url', 'website', 'link', 'endpoint'],
      'database': ['database', 'sql', 'query', 'table'],
      'api': ['api', 'rest', 'graphql', 'webhook']
    };
    
    const inputs = [];
    Object.entries(inputPatterns).forEach(([type, patterns]) => {
      if (patterns.some(pattern => queryLower.includes(pattern))) {
        inputs.push(type);
      }
    });
    
    return inputs.length > 0 ? inputs : ['text']; // Default to text input
  }

  identifyOutputTypes(queryLower) {
    const outputPatterns = {
      'report': ['report', 'summary', 'analysis'],
      'file': ['generate', 'create file', 'export'],
      'notification': ['notify', 'alert', 'email', 'message'],
      'data': ['data', 'result', 'output'],
      'dashboard': ['dashboard', 'chart', 'visualization']
    };
    
    const outputs = [];
    Object.entries(outputPatterns).forEach(([type, patterns]) => {
      if (patterns.some(pattern => queryLower.includes(pattern))) {
        outputs.push(type);
      }
    });
    
    return outputs.length > 0 ? outputs : ['data']; // Default to data output
  }

  assessBusinessValue(queryLower, intent) {
    const highValueKeywords = ['revenue', 'cost', 'efficiency', 'automation', 'scale', 'security', 'compliance'];
    const mediumValueKeywords = ['improve', 'optimize', 'streamline', 'enhance', 'monitor'];
    
    if (highValueKeywords.some(keyword => queryLower.includes(keyword))) {
      return 'high';
    }
    
    if (mediumValueKeywords.some(keyword => queryLower.includes(keyword))) {
      return 'medium';
    }
    
    // Default based on intent
    return this.intentPatterns[intent]?.businessValue || 'medium';
  }

  extractSemanticKeywords(queryLower) {
    // Extract meaningful keywords for similarity matching
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must'];
    
    return queryLower
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word))
      .slice(0, 10); // Limit to top 10 keywords
  }

  estimateEffort(complexity, techCount) {
    const baseEffort = {
      'simple': 1,
      'medium': 3,
      'complex': 7
    };
    
    const effort = baseEffort[complexity] + (techCount * 0.5);
    return Math.min(effort, 10); // Cap at 10 days
  }

  calculateSuccessProbability(intentConfidence, complexity) {
    const complexityMultiplier = {
      'simple': 1.0,
      'medium': 0.8,
      'complex': 0.6
    };
    
    return Math.round(intentConfidence * complexityMultiplier[complexity] * 100);
  }
}

module.exports = SemanticAnalysisService;