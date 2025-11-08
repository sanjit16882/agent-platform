// Learning Analytics Service - Tracks and analyzes user learning patterns
const fs = require('fs').promises;
const path = require('path');

class LearningAnalyticsService {
  constructor() {
    this.dataDir = path.join(__dirname, '../data/learning');
    this.interactionsFile = path.join(this.dataDir, 'interactions.json');
    this.feedbackFile = path.join(this.dataDir, 'feedback.json');
    this.userProfilesFile = path.join(this.dataDir, 'user-profiles.json');
    this.abTestsFile = path.join(this.dataDir, 'ab-tests.json');
    
    this.initializeStorage();
  }

  async initializeStorage() {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
      
      // Initialize files if they don't exist
      const files = [
        { path: this.interactionsFile, data: [] },
        { path: this.feedbackFile, data: [] },
        { path: this.userProfilesFile, data: {} },
        { path: this.abTestsFile, data: {} }
      ];

      for (const file of files) {
        try {
          await fs.access(file.path);
        } catch {
          await fs.writeFile(file.path, JSON.stringify(file.data, null, 2));
        }
      }
      
      console.log('✅ Learning analytics storage initialized');
    } catch (error) {
      console.error('❌ Failed to initialize learning storage:', error);
    }
  }

  // Track user interaction
  async trackInteraction(data) {
    try {
      const interactions = await this.loadInteractions();
      
      const interaction = {
        id: `int_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: data.userId || 'anonymous',
        agentId: data.agentId,
        agentName: data.agentName,
        intent: data.intent,
        query: data.query,
        accepted: data.accepted !== false, // Default to true
        timestamp: new Date().toISOString(),
        executionTime: data.executionTime || 0,
        success: data.success !== false
      };

      interactions.push(interaction);
      
      // Keep only last 10000 interactions
      if (interactions.length > 10000) {
        interactions.splice(0, interactions.length - 10000);
      }

      await fs.writeFile(this.interactionsFile, JSON.stringify(interactions, null, 2));
      
      // Update user profile
      await this.updateUserProfile(interaction.userId, interaction);
      
      return interaction;
    } catch (error) {
      console.error('❌ Failed to track interaction:', error);
      return null;
    }
  }

  // Track user feedback
  async trackFeedback(data) {
    try {
      const feedbackList = await this.loadFeedback();
      
      const feedback = {
        id: `fb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: data.userId || 'anonymous',
        interactionId: data.interactionId,
        agentId: data.agentId,
        type: data.type, // 'positive', 'negative', 'neutral'
        rating: data.rating, // 1-5
        comment: data.comment,
        category: data.category,
        timestamp: new Date().toISOString()
      };

      feedbackList.push(feedback);
      
      // Keep only last 5000 feedback entries
      if (feedbackList.length > 5000) {
        feedbackList.splice(0, feedbackList.length - 5000);
      }

      await fs.writeFile(this.feedbackFile, JSON.stringify(feedbackList, null, 2));
      
      return feedback;
    } catch (error) {
      console.error('❌ Failed to track feedback:', error);
      return null;
    }
  }

  // Update user profile
  async updateUserProfile(userId, interaction) {
    try {
      const profiles = await this.loadUserProfiles();
      
      if (!profiles[userId]) {
        profiles[userId] = {
          userId,
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
      }

      const profile = profiles[userId];
      profile.interactionCount++;
      profile.lastActive = new Date().toISOString();
      profile.totalExecutionTime += interaction.executionTime || 0;

      if (interaction.accepted) {
        profile.acceptedCount++;
      } else {
        profile.rejectedCount++;
      }

      // Track intent usage
      if (interaction.intent) {
        profile.intents[interaction.intent] = (profile.intents[interaction.intent] || 0) + 1;
      }

      // Track agent usage
      if (interaction.agentId) {
        profile.agents[interaction.agentId] = (profile.agents[interaction.agentId] || 0) + 1;
      }

      await fs.writeFile(this.userProfilesFile, JSON.stringify(profiles, null, 2));
      
      return profile;
    } catch (error) {
      console.error('❌ Failed to update user profile:', error);
      return null;
    }
  }

  // Get learning analytics
  async getAnalytics() {
    try {
      const interactions = await this.loadInteractions();
      const feedbackList = await this.loadFeedback();
      const profiles = await this.loadUserProfiles();

      const now = Date.now();
      const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);
      
      // Filter recent interactions (last 7 days)
      const recentInteractions = interactions.filter(i => 
        new Date(i.timestamp).getTime() > oneWeekAgo
      );

      // Calculate metrics
      const totalUsers = Object.keys(profiles).length;
      const activeUsers = Object.values(profiles).filter(p => 
        new Date(p.lastActive).getTime() > oneWeekAgo
      ).length;

      const totalInteractions = recentInteractions.length;
      const acceptedInteractions = recentInteractions.filter(i => i.accepted).length;
      const avgAcceptanceRate = totalInteractions > 0 
        ? Math.round((acceptedInteractions / totalInteractions) * 100) 
        : 0;

      const totalFeedback = feedbackList.filter(f => 
        new Date(f.timestamp).getTime() > oneWeekAgo
      ).length;

      const feedbackRate = totalInteractions > 0 
        ? Math.round((totalFeedback / totalInteractions) * 100) 
        : 0;

      const learningVelocity = activeUsers > 0 
        ? Math.round(totalInteractions / activeUsers) 
        : 0;

      // Calculate average exploration level
      const avgExplorationLevel = totalUsers > 0
        ? Math.round(Object.values(profiles).reduce((sum, p) => sum + (p.explorationLevel || 50), 0) / totalUsers)
        : 50;

      // Get top intents
      const intentCounts = {};
      recentInteractions.forEach(i => {
        if (i.intent) {
          intentCounts[i.intent] = (intentCounts[i.intent] || 0) + 1;
        }
      });

      const topIntents = Object.entries(intentCounts)
        .map(([intent, count]) => ({ intent, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Get suggestion performance (based on feedback)
      const suggestionTypes = {};
      feedbackList.forEach(f => {
        const type = f.category || 'general';
        if (!suggestionTypes[type]) {
          suggestionTypes[type] = { positive: 0, negative: 0, neutral: 0 };
        }
        suggestionTypes[type][f.type]++;
      });

      const topSuggestionTypes = Object.entries(suggestionTypes)
        .map(([type, counts]) => ({
          type,
          score: counts.positive - counts.negative,
          positive: counts.positive,
          negative: counts.negative
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      // Generate insights
      const insights = this.generateInsights({
        avgAcceptanceRate,
        activeUsers,
        totalUsers,
        feedbackRate,
        learningVelocity
      });

      return {
        totalUsers,
        activeUsers,
        totalInteractions,
        totalFeedback,
        avgAcceptanceRate,
        avgExplorationLevel,
        feedbackRate,
        learningVelocity,
        topIntents,
        topSuggestionTypes,
        insights
      };
    } catch (error) {
      console.error('❌ Failed to get analytics:', error);
      return this.getDefaultAnalytics();
    }
  }

  // Generate insights based on metrics
  generateInsights(metrics) {
    const insights = [];

    // Acceptance rate insights
    if (metrics.avgAcceptanceRate >= 75) {
      insights.push({
        type: 'success',
        title: 'High Acceptance Rate',
        description: `Users are accepting ${metrics.avgAcceptanceRate}% of AI suggestions`,
        recommendation: 'Continue current suggestion strategy'
      });
    } else if (metrics.avgAcceptanceRate < 50) {
      insights.push({
        type: 'warning',
        title: 'Low Acceptance Rate',
        description: `Only ${metrics.avgAcceptanceRate}% of suggestions are being accepted`,
        recommendation: 'Review suggestion quality and relevance'
      });
    }

    // User growth insights
    if (metrics.activeUsers > 0) {
      const growthRate = metrics.totalUsers > 0 
        ? Math.round(((metrics.activeUsers / metrics.totalUsers) * 100))
        : 0;
      
      insights.push({
        type: 'info',
        title: 'User Engagement',
        description: `${metrics.activeUsers} active users (${growthRate}% of total)`,
        recommendation: growthRate < 50 ? 'Consider re-engagement campaigns' : 'Maintain current engagement level'
      });
    }

    // Feedback rate insights
    if (metrics.feedbackRate < 20) {
      insights.push({
        type: 'warning',
        title: 'Low Feedback Rate',
        description: `Only ${metrics.feedbackRate}% of interactions receive explicit feedback`,
        recommendation: 'Consider adding feedback prompts or incentives'
      });
    } else if (metrics.feedbackRate > 40) {
      insights.push({
        type: 'success',
        title: 'Strong Feedback Culture',
        description: `${metrics.feedbackRate}% of interactions receive feedback`,
        recommendation: 'Use this feedback to improve suggestions'
      });
    }

    // Learning velocity insights
    if (metrics.learningVelocity > 15) {
      insights.push({
        type: 'success',
        title: 'High Learning Velocity',
        description: `Users average ${metrics.learningVelocity} interactions per week`,
        recommendation: 'Users are highly engaged with the platform'
      });
    }

    return insights;
  }

  // Get user profile
  async getUserProfile(userId) {
    try {
      const profiles = await this.loadUserProfiles();
      const profile = profiles[userId];

      if (!profile) {
        return null;
      }

      const interactions = await this.loadInteractions();
      const userInteractions = interactions.filter(i => i.userId === userId);

      const acceptanceRate = userInteractions.length > 0
        ? Math.round((profile.acceptedCount / userInteractions.length) * 100)
        : 0;

      const learningProgress = Math.min(100, Math.round((profile.interactionCount / 100) * 100));

      // Generate recommendations
      const recommendations = this.generateUserRecommendations(profile, acceptanceRate);

      return {
        userId: profile.userId,
        interactionCount: profile.interactionCount,
        learningProgress,
        acceptanceRate,
        explorationLevel: profile.explorationLevel || 50,
        confidenceThreshold: profile.confidenceThreshold || 0.7,
        recommendations,
        lastActive: profile.lastActive
      };
    } catch (error) {
      console.error('❌ Failed to get user profile:', error);
      return null;
    }
  }

  // Generate user-specific recommendations
  generateUserRecommendations(profile, acceptanceRate) {
    const recommendations = [];

    if (profile.interactionCount < 10) {
      recommendations.push('Keep exploring! Try different agent types to discover what works best for you.');
    }

    if (acceptanceRate > 80) {
      recommendations.push('Your acceptance rate is excellent! Consider trying more advanced features.');
    } else if (acceptanceRate < 50) {
      recommendations.push('Try adjusting your confidence threshold to get more relevant suggestions.');
    }

    if (profile.explorationLevel < 30) {
      recommendations.push('Increase your exploration level to discover new agent capabilities.');
    }

    const topAgents = Object.entries(profile.agents || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    if (topAgents.length > 0) {
      recommendations.push(`You frequently use: ${topAgents.map(([id]) => id).join(', ')}. Try related agents!`);
    }

    return recommendations;
  }

  // Optimize user profile
  async optimizeProfile(userId, optimizationType) {
    try {
      const profiles = await this.loadUserProfiles();
      const profile = profiles[userId];

      if (!profile) {
        return { success: false, error: 'User profile not found' };
      }

      const changes = {};

      switch (optimizationType) {
        case 'confidence_threshold':
          // Adjust based on acceptance rate
          const acceptanceRate = profile.acceptedCount / profile.interactionCount;
          if (acceptanceRate > 0.8) {
            profile.confidenceThreshold = Math.max(0.5, profile.confidenceThreshold - 0.05);
            changes.confidenceThreshold = profile.confidenceThreshold;
          } else if (acceptanceRate < 0.5) {
            profile.confidenceThreshold = Math.min(0.9, profile.confidenceThreshold + 0.05);
            changes.confidenceThreshold = profile.confidenceThreshold;
          }
          break;

        case 'exploration_level':
          // Increase exploration if user is stuck in patterns
          const uniqueAgents = Object.keys(profile.agents || {}).length;
          if (uniqueAgents < 5) {
            profile.explorationLevel = Math.min(100, profile.explorationLevel + 10);
            changes.explorationLevel = profile.explorationLevel;
          }
          break;

        case 'full_optimization':
          // Comprehensive optimization
          const fullAcceptanceRate = profile.acceptedCount / profile.interactionCount;
          profile.confidenceThreshold = fullAcceptanceRate > 0.7 ? 0.65 : 0.75;
          profile.explorationLevel = Math.min(100, profile.explorationLevel + 5);
          changes.confidenceThreshold = profile.confidenceThreshold;
          changes.explorationLevel = profile.explorationLevel;
          break;
      }

      await fs.writeFile(this.userProfilesFile, JSON.stringify(profiles, null, 2));

      return { success: true, changes };
    } catch (error) {
      console.error('❌ Failed to optimize profile:', error);
      return { success: false, error: error.message };
    }
  }

  // Export learning data
  async exportData() {
    try {
      const interactions = await this.loadInteractions();
      const feedbackList = await this.loadFeedback();
      const profiles = await this.loadUserProfiles();
      const analytics = await this.getAnalytics();

      return {
        exportDate: new Date().toISOString(),
        analytics,
        totalInteractions: interactions.length,
        totalFeedback: feedbackList.length,
        totalUsers: Object.keys(profiles).length,
        interactions: interactions.slice(-100), // Last 100 interactions
        feedback: feedbackList.slice(-50), // Last 50 feedback entries
        userProfiles: Object.values(profiles).map(p => ({
          userId: p.userId,
          interactionCount: p.interactionCount,
          acceptanceRate: Math.round((p.acceptedCount / p.interactionCount) * 100),
          lastActive: p.lastActive
        }))
      };
    } catch (error) {
      console.error('❌ Failed to export data:', error);
      return null;
    }
  }

  // Helper methods to load data
  async loadInteractions() {
    try {
      const data = await fs.readFile(this.interactionsFile, 'utf8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  async loadFeedback() {
    try {
      const data = await fs.readFile(this.feedbackFile, 'utf8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  async loadUserProfiles() {
    try {
      const data = await fs.readFile(this.userProfilesFile, 'utf8');
      return JSON.parse(data);
    } catch {
      return {};
    }
  }

  // Default analytics for when no data exists
  getDefaultAnalytics() {
    return {
      totalUsers: 0,
      activeUsers: 0,
      totalInteractions: 0,
      totalFeedback: 0,
      avgAcceptanceRate: 0,
      avgExplorationLevel: 50,
      feedbackRate: 0,
      learningVelocity: 0,
      topIntents: [],
      topSuggestionTypes: [],
      insights: [{
        type: 'info',
        title: 'Getting Started',
        description: 'No learning data available yet',
        recommendation: 'Start using agents to generate learning insights'
      }]
    };
  }
}

module.exports = LearningAnalyticsService;
