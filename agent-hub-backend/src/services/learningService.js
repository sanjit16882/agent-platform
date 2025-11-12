// Continuous Learning and Improvement Service
class LearningService {
  constructor() {
    // In-memory storage for demo - in production, use database
    this.interactions = new Map();
    this.feedbackData = new Map();
    this.userPreferences = new Map();
    this.suggestionPerformance = new Map();
    this.abTestGroups = new Map();
  }

  // Track user interactions for learning
  async recordInteraction(userId, interactionData) {
    const interactionId = `interaction_${Date.now()}_${userId}`;
    
    const interaction = {
      id: interactionId,
      userId,
      timestamp: new Date().toISOString(),
      query: interactionData.query,
      intent: interactionData.analysis?.intent,
      confidence: interactionData.analysis?.confidence,
      suggestionsGenerated: interactionData.suggestions?.length || 0,
      topSuggestionType: interactionData.suggestions?.[0]?.type,
      topSuggestionConfidence: interactionData.suggestions?.[0]?.confidence,
      context: interactionData.context,
      sessionId: interactionData.sessionId || `session_${Date.now()}`
    };

    this.interactions.set(interactionId, interaction);
    
    console.log('📝 Learning: Recorded interaction', {
      interactionId,
      userId,
      intent: interaction.intent,
      suggestionsCount: interaction.suggestionsGenerated
    });

    // Update user behavior patterns
    await this.updateUserBehaviorPattern(userId, interaction);
    
    return interactionId;
  }

  // Track user feedback on suggestions
  async recordFeedback(userId, suggestionId, rating, feedback, interactionId) {
    const feedbackId = `feedback_${Date.now()}_${userId}`;
    
    const feedbackRecord = {
      id: feedbackId,
      userId,
      suggestionId,
      interactionId,
      rating, // 1-5 scale or 'up'/'down'
      feedback,
      timestamp: new Date().toISOString()
    };

    this.feedbackData.set(feedbackId, feedbackRecord);
    
    console.log('👍 Learning: Recorded feedback', {
      feedbackId,
      userId,
      suggestionId,
      rating
    });

    // Update suggestion performance metrics
    await this.updateSuggestionPerformance(suggestionId, rating);
    
    // Learn from feedback patterns
    await this.learnFromFeedback(userId, feedbackRecord);
    
    return feedbackId;
  }

  // Track when users accept suggestions
  async recordSuggestionAcceptance(userId, suggestionId, suggestionType, interactionId) {
    const acceptanceId = `acceptance_${Date.now()}_${userId}`;
    
    const acceptance = {
      id: acceptanceId,
      userId,
      suggestionId,
      suggestionType,
      interactionId,
      timestamp: new Date().toISOString(),
      outcome: 'accepted'
    };

    this.feedbackData.set(acceptanceId, acceptance);
    
    console.log('✅ Learning: Suggestion accepted', {
      acceptanceId,
      userId,
      suggestionType
    });

    // This is positive feedback - update performance
    await this.updateSuggestionPerformance(suggestionId, 5); // Max rating for acceptance
    
    // Learn user preferences from acceptance
    await this.learnUserPreferences(userId, suggestionType, 'positive');
    
    return acceptanceId;
  }

  // Update user behavior patterns
  async updateUserBehaviorPattern(userId, interaction) {
    if (!this.userPreferences.has(userId)) {
      this.userPreferences.set(userId, {
        userId,
        preferredIntents: {},
        preferredSuggestionTypes: {},
        complexityPreference: 'medium',
        confidenceThreshold: 0.7,
        interactionCount: 0,
        lastActive: new Date().toISOString(),
        learningProfile: {
          explorationLevel: 0.5, // 0 = conservative, 1 = exploratory
          feedbackFrequency: 0,
          acceptanceRate: 0
        }
      });
    }

    const profile = this.userPreferences.get(userId);
    
    // Update interaction count
    profile.interactionCount++;
    profile.lastActive = new Date().toISOString();
    
    // Track intent preferences
    if (interaction.intent) {
      profile.preferredIntents[interaction.intent] = 
        (profile.preferredIntents[interaction.intent] || 0) + 1;
    }
    
    // Update exploration level based on query complexity
    if (interaction.query && interaction.query.length > 100) {
      profile.learningProfile.explorationLevel = Math.min(
        profile.learningProfile.explorationLevel + 0.1, 
        1.0
      );
    }

    this.userPreferences.set(userId, profile);
  }

  // Learn from user feedback patterns
  async learnFromFeedback(userId, feedbackRecord) {
    const profile = this.userPreferences.get(userId);
    if (!profile) return;

    // Update feedback frequency
    profile.learningProfile.feedbackFrequency++;
    
    // Adjust confidence threshold based on feedback
    if (feedbackRecord.rating >= 4 || feedbackRecord.rating === 'up') {
      // Positive feedback - user is satisfied with current confidence levels
      profile.confidenceThreshold = Math.max(profile.confidenceThreshold - 0.05, 0.5);
    } else if (feedbackRecord.rating <= 2 || feedbackRecord.rating === 'down') {
      // Negative feedback - user wants higher quality suggestions
      profile.confidenceThreshold = Math.min(profile.confidenceThreshold + 0.1, 0.9);
    }

    this.userPreferences.set(userId, profile);
  }

  // Learn user preferences from suggestion acceptance
  async learnUserPreferences(userId, suggestionType, outcome) {
    const profile = this.userPreferences.get(userId);
    if (!profile) return;

    // Track suggestion type preferences
    if (!profile.preferredSuggestionTypes[suggestionType]) {
      profile.preferredSuggestionTypes[suggestionType] = { positive: 0, negative: 0 };
    }

    if (outcome === 'positive') {
      profile.preferredSuggestionTypes[suggestionType].positive++;
      profile.learningProfile.acceptanceRate = 
        (profile.learningProfile.acceptanceRate * 0.9) + (1.0 * 0.1); // Moving average
    } else {
      profile.preferredSuggestionTypes[suggestionType].negative++;
      profile.learningProfile.acceptanceRate = 
        (profile.learningProfile.acceptanceRate * 0.9) + (0.0 * 0.1); // Moving average
    }

    this.userPreferences.set(userId, profile);
  }

  // Update suggestion performance metrics
  async updateSuggestionPerformance(suggestionId, rating) {
    if (!this.suggestionPerformance.has(suggestionId)) {
      this.suggestionPerformance.set(suggestionId, {
        suggestionId,
        totalRatings: 0,
        averageRating: 0,
        positiveCount: 0,
        negativeCount: 0,
        acceptanceCount: 0,
        lastUpdated: new Date().toISOString()
      });
    }

    const performance = this.suggestionPerformance.get(suggestionId);
    
    // Convert rating to numeric if needed
    let numericRating = rating;
    if (rating === 'up') numericRating = 5;
    if (rating === 'down') numericRating = 1;
    
    // Update metrics
    performance.totalRatings++;
    performance.averageRating = 
      ((performance.averageRating * (performance.totalRatings - 1)) + numericRating) / performance.totalRatings;
    
    if (numericRating >= 4) {
      performance.positiveCount++;
    } else if (numericRating <= 2) {
      performance.negativeCount++;
    }
    
    if (numericRating === 5) {
      performance.acceptanceCount++;
    }
    
    performance.lastUpdated = new Date().toISOString();
    
    this.suggestionPerformance.set(suggestionId, performance);
  }

  // Get personalized suggestions based on user learning profile
  async getPersonalizedSuggestions(userId, baseSuggestions) {
    const profile = this.userPreferences.get(userId);
    if (!profile) return baseSuggestions;

    console.log('🎯 Learning: Personalizing suggestions for user', {
      userId,
      interactionCount: profile.interactionCount,
      confidenceThreshold: profile.confidenceThreshold,
      acceptanceRate: profile.learningProfile.acceptanceRate
    });

    // Filter suggestions based on user's confidence threshold
    let personalizedSuggestions = baseSuggestions.filter(suggestion => 
      suggestion.confidence >= profile.confidenceThreshold
    );

    // Reorder based on user preferences
    personalizedSuggestions = personalizedSuggestions.map(suggestion => {
      let personalizedConfidence = suggestion.confidence;
      
      // Boost confidence for preferred suggestion types
      const typePreference = profile.preferredSuggestionTypes[suggestion.type];
      if (typePreference) {
        const preferenceScore = typePreference.positive / (typePreference.positive + typePreference.negative + 1);
        personalizedConfidence = personalizedConfidence * (0.7 + (preferenceScore * 0.3));
      }
      
      // Boost confidence for preferred intents
      const intentCount = profile.preferredIntents[suggestion.actionData?.intent] || 0;
      if (intentCount > 0) {
        personalizedConfidence = personalizedConfidence * (1.0 + (intentCount * 0.05));
      }
      
      return {
        ...suggestion,
        confidence: Math.min(personalizedConfidence, 1.0),
        personalizedReason: this.generatePersonalizationReason(profile, suggestion)
      };
    });

    // Sort by personalized confidence
    personalizedSuggestions.sort((a, b) => b.confidence - a.confidence);
    
    return personalizedSuggestions;
  }

  // Generate reason for personalization
  generatePersonalizationReason(profile, suggestion) {
    const reasons = [];
    
    const typePreference = profile.preferredSuggestionTypes[suggestion.type];
    if (typePreference && typePreference.positive > typePreference.negative) {
      reasons.push(`You often prefer ${suggestion.type} suggestions`);
    }
    
    if (profile.learningProfile.acceptanceRate > 0.7) {
      reasons.push('Based on your high acceptance rate');
    }
    
    if (profile.interactionCount > 10) {
      reasons.push('Tailored to your usage patterns');
    }
    
    return reasons.length > 0 ? reasons.join('. ') : 'Personalized for you';
  }

  // A/B Testing Framework
  async assignABTestGroup(userId, testName) {
    const testKey = `${testName}_${userId}`;
    
    if (!this.abTestGroups.has(testKey)) {
      // Randomly assign to group A or B
      const group = Math.random() < 0.5 ? 'A' : 'B';
      
      this.abTestGroups.set(testKey, {
        userId,
        testName,
        group,
        assignedAt: new Date().toISOString(),
        interactions: 0,
        conversions: 0
      });
      
      console.log('🧪 A/B Test: Assigned user to group', {
        userId,
        testName,
        group
      });
    }
    
    return this.abTestGroups.get(testKey);
  }

  // Track A/B test results
  async trackABTestInteraction(userId, testName, converted = false) {
    const testKey = `${testName}_${userId}`;
    const testData = this.abTestGroups.get(testKey);
    
    if (testData) {
      testData.interactions++;
      if (converted) {
        testData.conversions++;
      }
      
      this.abTestGroups.set(testKey, testData);
    }
  }

  // Get A/B test results
  async getABTestResults(testName) {
    const results = { A: { interactions: 0, conversions: 0 }, B: { interactions: 0, conversions: 0 } };
    
    for (const [key, data] of this.abTestGroups.entries()) {
      if (data.testName === testName) {
        results[data.group].interactions += data.interactions;
        results[data.group].conversions += data.conversions;
      }
    }
    
    // Calculate conversion rates
    results.A.conversionRate = results.A.interactions > 0 ? 
      (results.A.conversions / results.A.interactions) : 0;
    results.B.conversionRate = results.B.interactions > 0 ? 
      (results.B.conversions / results.B.interactions) : 0;
    
    return results;
  }

  // Get learning analytics
  async getLearningAnalytics() {
    const totalUsers = this.userPreferences.size;
    const totalInteractions = this.interactions.size;
    const totalFeedback = this.feedbackData.size;
    
    // Calculate average metrics
    let totalAcceptanceRate = 0;
    let totalExplorationLevel = 0;
    let activeUsers = 0;
    const intentDistribution = {};
    const suggestionTypeDistribution = {};
    
    for (const [userId, profile] of this.userPreferences.entries()) {
      totalAcceptanceRate += profile.learningProfile.acceptanceRate;
      totalExplorationLevel += profile.learningProfile.explorationLevel;
      
      if (profile.interactionCount > 0) {
        activeUsers++;
      }
      
      // Aggregate intent preferences
      for (const [intent, count] of Object.entries(profile.preferredIntents)) {
        intentDistribution[intent] = (intentDistribution[intent] || 0) + count;
      }
      
      // Aggregate suggestion type preferences
      for (const [type, data] of Object.entries(profile.preferredSuggestionTypes)) {
        if (!suggestionTypeDistribution[type]) {
          suggestionTypeDistribution[type] = { positive: 0, negative: 0 };
        }
        suggestionTypeDistribution[type].positive += data.positive;
        suggestionTypeDistribution[type].negative += data.negative;
      }
    }
    
    const avgAcceptanceRate = totalUsers > 0 ? totalAcceptanceRate / totalUsers : 0;
    const avgExplorationLevel = totalUsers > 0 ? totalExplorationLevel / totalUsers : 0;
    
    // Calculate learning velocity (how fast users are learning)
    const recentInteractions = Array.from(this.interactions.values())
      .filter(i => new Date(i.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
    
    const learningVelocity = recentInteractions.length / Math.max(activeUsers, 1);
    
    // Calculate suggestion performance trends
    const suggestionPerformanceTrends = {};
    for (const [suggestionId, performance] of this.suggestionPerformance.entries()) {
      const type = suggestionId.split('_')[0] || 'unknown';
      if (!suggestionPerformanceTrends[type]) {
        suggestionPerformanceTrends[type] = { count: 0, avgRating: 0, acceptanceRate: 0 };
      }
      suggestionPerformanceTrends[type].count++;
      suggestionPerformanceTrends[type].avgRating += performance.averageRating;
      suggestionPerformanceTrends[type].acceptanceRate += 
        performance.totalRatings > 0 ? performance.acceptanceCount / performance.totalRatings : 0;
    }
    
    // Average the trends
    for (const type of Object.keys(suggestionPerformanceTrends)) {
      const trend = suggestionPerformanceTrends[type];
      trend.avgRating = trend.count > 0 ? trend.avgRating / trend.count : 0;
      trend.acceptanceRate = trend.count > 0 ? trend.acceptanceRate / trend.count : 0;
    }
    
    return {
      totalUsers,
      activeUsers,
      totalInteractions,
      totalFeedback,
      avgAcceptanceRate: Math.round(avgAcceptanceRate * 100),
      avgExplorationLevel: Math.round(avgExplorationLevel * 100),
      feedbackRate: totalInteractions > 0 ? Math.round((totalFeedback / totalInteractions) * 100) : 0,
      learningVelocity: Math.round(learningVelocity * 10) / 10,
      intentDistribution,
      suggestionTypeDistribution,
      suggestionPerformanceTrends,
      topIntents: Object.entries(intentDistribution)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([intent, count]) => ({ intent, count })),
      topSuggestionTypes: Object.entries(suggestionTypeDistribution)
        .sort(([,a], [,b]) => (b.positive - b.negative) - (a.positive - a.negative))
        .slice(0, 5)
        .map(([type, data]) => ({ 
          type, 
          score: data.positive - data.negative,
          positive: data.positive,
          negative: data.negative
        })),
      insights: this.generateLearningInsights(avgAcceptanceRate, avgExplorationLevel, learningVelocity)
    };
  }

  // Generate learning insights based on analytics
  generateLearningInsights(avgAcceptanceRate, avgExplorationLevel, learningVelocity) {
    const insights = [];
    
    if (avgAcceptanceRate > 0.8) {
      insights.push({
        type: 'success',
        title: 'High User Satisfaction',
        description: 'Users are accepting most suggestions, indicating good recommendation quality.',
        recommendation: 'Consider increasing exploration to introduce more diverse options.'
      });
    } else if (avgAcceptanceRate < 0.3) {
      insights.push({
        type: 'warning',
        title: 'Low Acceptance Rate',
        description: 'Users are rejecting many suggestions. Quality may need improvement.',
        recommendation: 'Increase confidence thresholds and gather more feedback data.'
      });
    }
    
    if (avgExplorationLevel < 0.3) {
      insights.push({
        type: 'info',
        title: 'Conservative User Base',
        description: 'Users prefer familiar, proven suggestions over experimental ones.',
        recommendation: 'Focus on refining existing suggestion types rather than introducing new ones.'
      });
    } else if (avgExplorationLevel > 0.8) {
      insights.push({
        type: 'info',
        title: 'Exploratory User Base',
        description: 'Users are open to trying new and experimental suggestions.',
        recommendation: 'Introduce more innovative suggestion types and features.'
      });
    }
    
    if (learningVelocity > 5) {
      insights.push({
        type: 'success',
        title: 'High Learning Velocity',
        description: 'Users are actively engaging and learning quickly.',
        recommendation: 'Maintain current learning algorithms and consider advanced features.'
      });
    } else if (learningVelocity < 1) {
      insights.push({
        type: 'warning',
        title: 'Low Learning Velocity',
        description: 'Users are not engaging frequently enough for effective learning.',
        recommendation: 'Improve onboarding and encourage more frequent interactions.'
      });
    }
    
    return insights;
  }

  // Export learning data for analysis
  async exportLearningData() {
    return {
      interactions: Array.from(this.interactions.values()),
      feedback: Array.from(this.feedbackData.values()),
      userPreferences: Array.from(this.userPreferences.values()),
      suggestionPerformance: Array.from(this.suggestionPerformance.values()),
      abTestResults: Array.from(this.abTestGroups.values())
    };
  }

  // Model improvement based on feedback patterns
  async improveModels() {
    console.log('🔧 Running model improvement analysis...');
    
    const improvements = {
      confidenceAdjustments: [],
      suggestionTypeOptimizations: [],
      intentRecognitionImprovements: [],
      personalizations: []
    };

    // Analyze confidence threshold effectiveness
    for (const [userId, profile] of this.userPreferences.entries()) {
      if (profile.learningProfile.feedbackFrequency > 5) {
        const shouldAdjust = this.shouldAdjustConfidenceThreshold(profile);
        if (shouldAdjust.adjust) {
          improvements.confidenceAdjustments.push({
            userId,
            currentThreshold: profile.confidenceThreshold,
            recommendedThreshold: shouldAdjust.newThreshold,
            reason: shouldAdjust.reason
          });
        }
      }
    }

    // Analyze suggestion type performance
    const suggestionTypePerformance = this.analyzeSuggestionTypePerformance();
    for (const [type, analysis] of Object.entries(suggestionTypePerformance)) {
      if (analysis.needsImprovement) {
        improvements.suggestionTypeOptimizations.push({
          type,
          currentPerformance: analysis.performance,
          issues: analysis.issues,
          recommendations: analysis.recommendations
        });
      }
    }

    // Analyze intent recognition accuracy
    const intentAccuracy = this.analyzeIntentRecognitionAccuracy();
    if (intentAccuracy.needsImprovement) {
      improvements.intentRecognitionImprovements.push({
        currentAccuracy: intentAccuracy.accuracy,
        problematicIntents: intentAccuracy.problematicIntents,
        recommendations: intentAccuracy.recommendations
      });
    }

    console.log('✅ Model improvement analysis complete:', {
      confidenceAdjustments: improvements.confidenceAdjustments.length,
      suggestionOptimizations: improvements.suggestionTypeOptimizations.length,
      intentImprovements: improvements.intentRecognitionImprovements.length
    });

    return improvements;
  }

  // Analyze if confidence threshold should be adjusted
  shouldAdjustConfidenceThreshold(profile) {
    const acceptanceRate = profile.learningProfile.acceptanceRate;
    const feedbackFrequency = profile.learningProfile.feedbackFrequency;
    
    // If acceptance rate is very high, user might benefit from lower threshold (more suggestions)
    if (acceptanceRate > 0.8 && feedbackFrequency > 10) {
      return {
        adjust: true,
        newThreshold: Math.max(profile.confidenceThreshold - 0.1, 0.5),
        reason: 'High acceptance rate suggests user would benefit from more suggestions'
      };
    }
    
    // If acceptance rate is very low, user needs higher quality suggestions
    if (acceptanceRate < 0.2 && feedbackFrequency > 5) {
      return {
        adjust: true,
        newThreshold: Math.min(profile.confidenceThreshold + 0.15, 0.9),
        reason: 'Low acceptance rate suggests user needs higher quality suggestions'
      };
    }
    
    return { adjust: false };
  }

  // Analyze suggestion type performance across all users
  analyzeSuggestionTypePerformance() {
    const typeAnalysis = {};
    
    for (const [userId, profile] of this.userPreferences.entries()) {
      for (const [type, data] of Object.entries(profile.preferredSuggestionTypes)) {
        if (!typeAnalysis[type]) {
          typeAnalysis[type] = { positive: 0, negative: 0, users: 0 };
        }
        typeAnalysis[type].positive += data.positive;
        typeAnalysis[type].negative += data.negative;
        typeAnalysis[type].users++;
      }
    }
    
    const results = {};
    for (const [type, data] of Object.entries(typeAnalysis)) {
      const total = data.positive + data.negative;
      const successRate = total > 0 ? data.positive / total : 0;
      
      results[type] = {
        performance: successRate,
        needsImprovement: successRate < 0.6 && total > 10,
        issues: [],
        recommendations: []
      };
      
      if (successRate < 0.4) {
        results[type].issues.push('Very low success rate');
        results[type].recommendations.push('Review suggestion generation logic');
      } else if (successRate < 0.6) {
        results[type].issues.push('Below average success rate');
        results[type].recommendations.push('Improve suggestion quality criteria');
      }
      
      if (data.users < 3) {
        results[type].issues.push('Limited user adoption');
        results[type].recommendations.push('Improve suggestion visibility or relevance');
      }
    }
    
    return results;
  }

  // Analyze intent recognition accuracy
  analyzeIntentRecognitionAccuracy() {
    const intentFeedback = {};
    let totalFeedback = 0;
    let positiveFeedback = 0;
    
    // Analyze feedback patterns by intent
    for (const [feedbackId, feedback] of this.feedbackData.entries()) {
      const interaction = this.interactions.get(feedback.interactionId);
      if (interaction && interaction.intent) {
        if (!intentFeedback[interaction.intent]) {
          intentFeedback[interaction.intent] = { positive: 0, negative: 0 };
        }
        
        totalFeedback++;
        if (feedback.rating >= 4 || feedback.rating === 'up') {
          intentFeedback[interaction.intent].positive++;
          positiveFeedback++;
        } else if (feedback.rating <= 2 || feedback.rating === 'down') {
          intentFeedback[interaction.intent].negative++;
        }
      }
    }
    
    const overallAccuracy = totalFeedback > 0 ? positiveFeedback / totalFeedback : 0;
    const problematicIntents = [];
    
    for (const [intent, data] of Object.entries(intentFeedback)) {
      const total = data.positive + data.negative;
      const accuracy = total > 0 ? data.positive / total : 0;
      
      if (accuracy < 0.5 && total > 5) {
        problematicIntents.push({
          intent,
          accuracy,
          sampleSize: total,
          issues: accuracy < 0.3 ? 'Very poor recognition' : 'Below average recognition'
        });
      }
    }
    
    return {
      accuracy: overallAccuracy,
      needsImprovement: overallAccuracy < 0.7 || problematicIntents.length > 0,
      problematicIntents,
      recommendations: [
        'Collect more training data for problematic intents',
        'Review intent classification algorithms',
        'Add more contextual features to intent analysis'
      ]
    };
  }

  // Auto-optimize user profiles based on patterns
  async autoOptimizeProfiles() {
    console.log('⚡ Running automatic profile optimization...');
    
    let optimizedCount = 0;
    const optimizations = [];
    
    for (const [userId, profile] of this.userPreferences.entries()) {
      if (profile.interactionCount > 10) {
        const shouldOptimize = this.shouldAdjustConfidenceThreshold(profile);
        
        if (shouldOptimize.adjust) {
          profile.confidenceThreshold = shouldOptimize.newThreshold;
          optimizedCount++;
          
          optimizations.push({
            userId,
            optimization: 'confidence_threshold',
            reason: shouldOptimize.reason,
            newValue: shouldOptimize.newThreshold
          });
        }
        
        // Optimize exploration level based on acceptance patterns
        if (profile.learningProfile.acceptanceRate > 0.8 && profile.learningProfile.explorationLevel < 0.7) {
          profile.learningProfile.explorationLevel = Math.min(
            profile.learningProfile.explorationLevel + 0.2, 1.0
          );
          optimizations.push({
            userId,
            optimization: 'exploration_level',
            reason: 'High acceptance rate allows for more exploration',
            newValue: profile.learningProfile.explorationLevel
          });
        }
        
        this.userPreferences.set(userId, profile);
      }
    }
    
    console.log(`✅ Auto-optimization complete: ${optimizedCount} profiles optimized`);
    
    return {
      optimizedProfiles: optimizedCount,
      optimizations,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = LearningService;