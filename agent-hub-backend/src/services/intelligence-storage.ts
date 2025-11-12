import fs from 'fs';
import path from 'path';

interface UserInteraction {
  id: string;
  userId: string;
  sessionId: string;
  query: string;
  recommendedAgent: string;
  actualAgent?: string;
  confidence: number;
  reasoning: string;
  feedback?: 'positive' | 'negative' | 'neutral';
  rating?: number;
  comment?: string;
  timestamp: Date;
  executionResult?: any;
}

interface UserProfile {
  userId: string;
  totalInteractions: number;
  successfulInteractions: number;
  preferredAgents: Map<string, number>;
  learningPatterns: Array<{
    pattern: string;
    frequency: number;
    lastUsed: Date;
  }>;
  feedbackHistory: Array<{
    feedback: string;
    timestamp: Date;
    agentId: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

interface AgentMetrics {
  agentId: string;
  totalUsage: number;
  successfulExecutions: number;
  averageRating: number;
  totalFeedback: number;
  positiveFeedback: number;
  negativeFeedback: number;
  averageExecutionTime: number;
  lastUsed: Date;
}

export class IntelligenceStorage {
  private dataDir: string;
  private interactionsFile: string;
  private profilesFile: string;
  private metricsFile: string;

  constructor() {
    this.dataDir = path.join(__dirname, '../../data');
    this.interactionsFile = path.join(this.dataDir, 'interactions.json');
    this.profilesFile = path.join(this.dataDir, 'user-profiles.json');
    this.metricsFile = path.join(this.dataDir, 'agent-metrics.json');
    
    this.ensureDataDirectory();
  }

  private ensureDataDirectory(): void {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
    
    // Initialize files if they don't exist
    if (!fs.existsSync(this.interactionsFile)) {
      fs.writeFileSync(this.interactionsFile, JSON.stringify([]));
    }
    if (!fs.existsSync(this.profilesFile)) {
      fs.writeFileSync(this.profilesFile, JSON.stringify({}));
    }
    if (!fs.existsSync(this.metricsFile)) {
      fs.writeFileSync(this.metricsFile, JSON.stringify({}));
    }
  }

  // Interaction Management
  async storeInteraction(interaction: Omit<UserInteraction, 'id'>): Promise<string> {
    const interactions = this.loadInteractions();
    const id = `int_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newInteraction: UserInteraction = {
      ...interaction,
      id,
      timestamp: new Date(interaction.timestamp)
    };
    
    interactions.push(newInteraction);
    this.saveInteractions(interactions);
    
    // Update user profile
    await this.updateUserProfile(interaction.userId, newInteraction);
    
    return id;
  }

  async updateInteractionFeedback(
    interactionId: string, 
    feedback: 'positive' | 'negative' | 'neutral',
    rating?: number,
    comment?: string
  ): Promise<void> {
    const interactions = this.loadInteractions();
    const interaction = interactions.find(i => i.id === interactionId);
    
    if (interaction) {
      interaction.feedback = feedback;
      interaction.rating = rating;
      interaction.comment = comment;
      
      this.saveInteractions(interactions);
      
      // Update agent metrics
      await this.updateAgentMetrics(interaction.recommendedAgent, {
        feedback,
        rating,
        executionTime: interaction.executionResult?.processingTime || 0
      });
    }
  }

  async getUserHistory(userId: string, limit: number = 50): Promise<UserInteraction[]> {
    const interactions = this.loadInteractions();
    return interactions
      .filter(i => i.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  // User Profile Management
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const profiles = this.loadProfiles();
    const profile = profiles[userId];
    
    if (!profile) {
      return null;
    }
    
    // Convert Map back from JSON
    profile.preferredAgents = new Map(Object.entries(profile.preferredAgents || {}));
    
    return profile;
  }

  async updateUserProfile(userId: string, interaction: UserInteraction): Promise<void> {
    const profiles = this.loadProfiles();
    let profile = profiles[userId];
    
    if (!profile) {
      profile = {
        userId,
        totalInteractions: 0,
        successfulInteractions: 0,
        preferredAgents: new Map(),
        learningPatterns: [],
        feedbackHistory: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
    
    // Update interaction counts
    profile.totalInteractions += 1;
    if (interaction.executionResult?.success) {
      profile.successfulInteractions += 1;
    }
    
    // Update preferred agents
    const agentUsage = profile.preferredAgents.get(interaction.recommendedAgent) || 0;
    profile.preferredAgents.set(interaction.recommendedAgent, agentUsage + 1);
    
    // Update learning patterns (extract from query)
    this.updateLearningPatterns(profile, interaction.query);
    
    // Add feedback to history
    if (interaction.feedback) {
      profile.feedbackHistory.push({
        feedback: interaction.feedback,
        timestamp: interaction.timestamp,
        agentId: interaction.recommendedAgent
      });
      
      // Keep only last 100 feedback entries
      if (profile.feedbackHistory.length > 100) {
        profile.feedbackHistory = profile.feedbackHistory.slice(-100);
      }
    }
    
    profile.updatedAt = new Date();
    
    // Convert Map to object for JSON storage
    const profileToSave = {
      ...profile,
      preferredAgents: Object.fromEntries(profile.preferredAgents)
    };
    
    profiles[userId] = profileToSave;
    this.saveProfiles(profiles);
  }

  private updateLearningPatterns(profile: UserProfile, query: string): void {
    // Extract patterns from query (simple keyword extraction)
    const keywords = query.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3);
    
    // Technology patterns
    const techPatterns = ['selenium', 'cypress', 'java', 'python', 'javascript', 'react', 'angular', 'vue'];
    const actionPatterns = ['test', 'monitor', 'analyze', 'scan', 'deploy', 'build'];
    
    const detectedPatterns = [
      ...techPatterns.filter(tech => keywords.includes(tech)),
      ...actionPatterns.filter(action => keywords.includes(action))
    ];
    
    detectedPatterns.forEach(pattern => {
      const existing = profile.learningPatterns.find(p => p.pattern === pattern);
      if (existing) {
        existing.frequency += 1;
        existing.lastUsed = new Date();
      } else {
        profile.learningPatterns.push({
          pattern,
          frequency: 1,
          lastUsed: new Date()
        });
      }
    });
    
    // Keep only top 20 patterns
    profile.learningPatterns.sort((a, b) => b.frequency - a.frequency);
    profile.learningPatterns = profile.learningPatterns.slice(0, 20);
  }

  // Agent Metrics Management
  async updateAgentMetrics(agentId: string, data: {
    feedback?: 'positive' | 'negative' | 'neutral';
    rating?: number;
    executionTime?: number;
  }): Promise<void> {
    const metrics = this.loadMetrics();
    let agentMetrics = metrics[agentId];
    
    if (!agentMetrics) {
      agentMetrics = {
        agentId,
        totalUsage: 0,
        successfulExecutions: 0,
        averageRating: 0,
        totalFeedback: 0,
        positiveFeedback: 0,
        negativeFeedback: 0,
        averageExecutionTime: 0,
        lastUsed: new Date()
      };
    }
    
    agentMetrics.totalUsage += 1;
    agentMetrics.lastUsed = new Date();
    
    if (data.feedback) {
      agentMetrics.totalFeedback += 1;
      if (data.feedback === 'positive') {
        agentMetrics.positiveFeedback += 1;
        agentMetrics.successfulExecutions += 1;
      } else if (data.feedback === 'negative') {
        agentMetrics.negativeFeedback += 1;
      }
    }
    
    if (data.rating) {
      // Update average rating
      const totalRatings = agentMetrics.totalFeedback;
      agentMetrics.averageRating = (
        (agentMetrics.averageRating * (totalRatings - 1)) + data.rating
      ) / totalRatings;
    }
    
    if (data.executionTime) {
      // Update average execution time
      agentMetrics.averageExecutionTime = (
        (agentMetrics.averageExecutionTime * (agentMetrics.totalUsage - 1)) + data.executionTime
      ) / agentMetrics.totalUsage;
    }
    
    metrics[agentId] = agentMetrics;
    this.saveMetrics(metrics);
  }

  async getAgentMetrics(agentId: string): Promise<AgentMetrics | null> {
    const metrics = this.loadMetrics();
    return metrics[agentId] || null;
  }

  async getAllAgentMetrics(): Promise<AgentMetrics[]> {
    const metrics = this.loadMetrics();
    return Object.values(metrics);
  }

  // Statistics
  async getIntelligenceStats(): Promise<any> {
    const interactions = this.loadInteractions();
    const profiles = this.loadProfiles();
    const metrics = this.loadMetrics();
    
    const totalQueries = interactions.length;
    const successfulQueries = interactions.filter(i => i.executionResult?.success).length;
    const totalUsers = Object.keys(profiles).length;
    const avgResponseTime = interactions.length > 0 
      ? interactions.reduce((sum, i) => sum + (i.executionResult?.processingTime || 0), 0) / interactions.length
      : 0;
    
    const feedbackInteractions = interactions.filter(i => i.feedback);
    const positiveRatings = feedbackInteractions.filter(i => i.rating && i.rating >= 4).length;
    const userSatisfaction = feedbackInteractions.length > 0 
      ? positiveRatings / feedbackInteractions.length 
      : 0;
    
    return {
      totalQueries,
      accuracyRate: totalQueries > 0 ? successfulQueries / totalQueries : 0,
      avgResponseTime: `${Math.round(avgResponseTime)}ms`,
      userSatisfaction: Math.round(userSatisfaction * 5 * 10) / 10, // Convert to 5-star scale
      totalUsers,
      learningInsights: Object.keys(metrics).length,
      communityImpact: totalUsers * 10 // Simplified calculation
    };
  }

  // File operations
  private loadInteractions(): UserInteraction[] {
    try {
      const data = fs.readFileSync(this.interactionsFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading interactions:', error);
      return [];
    }
  }

  private saveInteractions(interactions: UserInteraction[]): void {
    try {
      fs.writeFileSync(this.interactionsFile, JSON.stringify(interactions, null, 2));
    } catch (error) {
      console.error('Error saving interactions:', error);
    }
  }

  private loadProfiles(): Record<string, any> {
    try {
      const data = fs.readFileSync(this.profilesFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading profiles:', error);
      return {};
    }
  }

  private saveProfiles(profiles: Record<string, any>): void {
    try {
      fs.writeFileSync(this.profilesFile, JSON.stringify(profiles, null, 2));
    } catch (error) {
      console.error('Error saving profiles:', error);
    }
  }

  private loadMetrics(): Record<string, AgentMetrics> {
    try {
      const data = fs.readFileSync(this.metricsFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading metrics:', error);
      return {};
    }
  }

  private saveMetrics(metrics: Record<string, AgentMetrics>): void {
    try {
      fs.writeFileSync(this.metricsFile, JSON.stringify(metrics, null, 2));
    } catch (error) {
      console.error('Error saving metrics:', error);
    }
  }
}

export const intelligenceStorage = new IntelligenceStorage();