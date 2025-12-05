/**
 * Sample Prompt Service
 * Provides intelligent sample prompts based on test and agent characteristics
 * Uses relevance scoring to filter and rank prompts
 */

const fs = require('fs');
const path = require('path');

class SamplePromptService {
  constructor(db) {
    this.db = db;
    this.promptLibrary = null;
    this.loadPromptLibrary();
  }

  /**
   * Load sample prompt library from JSON file
   * @private
   */
  loadPromptLibrary() {
    try {
      const filePath = path.join(__dirname, '../data/samplePromptLibrary.json');
      const data = fs.readFileSync(filePath, 'utf8');
      this.promptLibrary = JSON.parse(data);
      console.log(`✅ Loaded ${this.promptLibrary.length} sample prompts from library`);
    } catch (error) {
      console.error('❌ Failed to load sample prompt library:', error.message);
      this.promptLibrary = [];
    }
  }

  /**
   * Get relevant sample prompts for a specific test and agent combination
   * @param {Object} agent - Agent object with category, subtype, etc.
   * @param {Object} test - Test object with category, subtype, etc.
   * @param {number} limit - Maximum number of prompts to return (default: 4)
   * @returns {Array<Object>} Array of relevant sample prompts with scores
   */
  getPromptsForTest(agent, test, limit = 4) {
    console.log(`\n🎯 Filtering prompts for:`);
    console.log(`   Agent: ${agent.name} (${agent.category}/${agent.subtype || 'none'})`);
    console.log(`   Test: ${test.name} (${test.category}/${test.subtype || 'none'})`);
    
    if (!this.promptLibrary || this.promptLibrary.length === 0) {
      console.warn('⚠️  Prompt library is empty');
      return [];
    }
    
    // Extract characteristics for matching
    const criteria = {
      testId: test.id,
      testCategory: test.category,
      testSubtype: test.subtype,
      agentCategory: agent.category,
      agentSubtype: agent.subtype,
      agentLanguage: this.inferPrimaryLanguage(agent)
    };
    
    console.log(`   Criteria:`, criteria);
    
    // Score and filter prompts
    const scoredPrompts = this.promptLibrary
      .map(prompt => ({
        prompt,
        score: this.calculateRelevanceScore(prompt, criteria)
      }))
      .filter(item => item.score > 0) // Only keep relevant prompts
      .sort((a, b) => b.score - a.score); // Sort by relevance (highest first)
    
    console.log(`   Found ${scoredPrompts.length} relevant prompts`);
    
    // Return top N prompts
    const topPrompts = scoredPrompts.slice(0, limit);
    
    if (topPrompts.length > 0) {
      console.log(`   Top ${topPrompts.length} prompts:`);
      topPrompts.forEach((item, i) => {
        console.log(`      ${i + 1}. [Score: ${item.score}] ${item.prompt.id} - ${item.prompt.prompt_text.substring(0, 60)}...`);
      });
    }
    
    return topPrompts.map(item => ({
      ...item.prompt,
      relevance_score: item.score
    }));
  }

  /**
   * Calculate relevance score for a sample prompt
   * Higher score = more relevant
   * @param {Object} prompt - Sample prompt object
   * @param {Object} criteria - Matching criteria (test + agent characteristics)
   * @returns {number} Relevance score (0-100+)
   */
  calculateRelevanceScore(prompt, criteria) {
    let score = 0;
    
    // Exact test match (highest priority)
    if (prompt.test_id && prompt.test_id === criteria.testId) {
      score += 50;
    }
    
    // Test category match (high priority)
    if (prompt.category === criteria.testCategory) {
      score += 30;
    }
    
    // Test subtype match (high priority)
    if (prompt.subtype && prompt.subtype === criteria.testSubtype) {
      score += 20;
    }
    
    // Agent category match (medium priority)
    if (prompt.agent_category && prompt.agent_category === criteria.agentCategory) {
      score += 10;
    }
    
    // Agent subtype match (medium priority)
    if (prompt.agent_subtype && prompt.agent_subtype === criteria.agentSubtype) {
      score += 15;
    }
    
    // Language match (low priority)
    if (prompt.language) {
      if (prompt.language === 'any') {
        score += 2; // Universal prompts get small boost
      } else if (prompt.language === criteria.agentLanguage) {
        score += 5; // Exact language match
      }
    }
    
    // Priority boost from library
    score += (prompt.priority || 0);
    
    return score;
  }

  /**
   * Infer primary programming language from agent configuration
   * @param {Object} agent - Agent object
   * @returns {string} Programming language
   */
  inferPrimaryLanguage(agent) {
    const description = (agent.description || '').toLowerCase();
    const name = (agent.name || '').toLowerCase();
    
    // Check description and name for language keywords
    if (description.includes('python') || name.includes('python')) return 'Python';
    if (description.includes('javascript') || name.includes('javascript') || name.includes('js')) return 'JavaScript';
    if (description.includes('typescript') || name.includes('typescript') || name.includes('ts')) return 'TypeScript';
    if (description.includes('java') && !description.includes('javascript')) return 'Java';
    if (description.includes('go') || name.includes('golang')) return 'Go';
    if (description.includes('rust')) return 'Rust';
    if (description.includes('c++') || description.includes('cpp')) return 'C++';
    if (description.includes('c#') || description.includes('csharp')) return 'C#';
    if (description.includes('ruby')) return 'Ruby';
    if (description.includes('php')) return 'PHP';
    if (description.includes('swift')) return 'Swift';
    if (description.includes('kotlin')) return 'Kotlin';
    if (description.includes('sql') || description.includes('database')) return 'SQL';
    
    return 'any'; // Default to language-agnostic
  }

  /**
   * Get all prompts for a specific category
   * @param {string} category - Category name
   * @param {string} subtype - Optional subtype
   * @returns {Array<Object>} Array of prompts
   */
  getPromptsByCategory(category, subtype = null) {
    if (!this.promptLibrary) return [];
    
    return this.promptLibrary.filter(prompt => {
      const categoryMatch = prompt.category === category;
      const subtypeMatch = !subtype || prompt.subtype === subtype;
      return categoryMatch && subtypeMatch;
    });
  }

  /**
   * Get prompt statistics
   * @returns {Object} Statistics about the prompt library
   */
  getStatistics() {
    if (!this.promptLibrary) {
      return { total: 0, byCategory: {}, byLanguage: {} };
    }
    
    const stats = {
      total: this.promptLibrary.length,
      byCategory: {},
      bySubtype: {},
      byLanguage: {}
    };
    
    this.promptLibrary.forEach(prompt => {
      // Count by category
      stats.byCategory[prompt.category] = (stats.byCategory[prompt.category] || 0) + 1;
      
      // Count by subtype
      if (prompt.subtype) {
        const key = `${prompt.category}/${prompt.subtype}`;
        stats.bySubtype[key] = (stats.bySubtype[key] || 0) + 1;
      }
      
      // Count by language
      stats.byLanguage[prompt.language || 'any'] = (stats.byLanguage[prompt.language || 'any'] || 0) + 1;
    });
    
    return stats;
  }

  /**
   * Reload prompt library (useful for hot-reload during development)
   */
  reload() {
    console.log('🔄 Reloading sample prompt library...');
    this.loadPromptLibrary();
  }
}

module.exports = SamplePromptService;
