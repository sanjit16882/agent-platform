// Analytics Service for professional dashboard metrics and business intelligence

export interface TimeRange {
  start: Date;
  end: Date;
  period: 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';
}

export interface ExecutionMetrics {
  totalExecutions: number;
  successRate: number;
  averageExecutionTime: number;
  activeUsers: number;
  costSavings: number;
  totalProcessingTime: number;
  peakConcurrentExecutions: number;
  errorRate: number;
}

export interface AgentPerformance {
  agentId: string;
  agentName: string;
  category: string;
  totalExecutions: number;
  successRate: number;
  averageExecutionTime: number;
  userRating: number;
  costPerExecution: number;
  totalCostSavings: number;
  popularityScore: number;
  lastUsed: Date;
  trendDirection: 'up' | 'down' | 'stable';
  trendPercentage: number;
}

export interface UsageTrend {
  timestamp: Date;
  executions: number;
  successfulExecutions: number;
  failedExecutions: number;
  uniqueUsers: number;
  averageResponseTime: number;
  costSavings: number;
}

export interface ROIData {
  totalCostSavings: number;
  platformCost: number;
  netROI: number;
  roiPercentage: number;
  timeToValue: number; // days
  productivityGain: number; // percentage
  automationHours: number;
  manualHoursReplaced: number;
}

export interface CategoryMetrics {
  category: string;
  executionCount: number;
  successRate: number;
  averageRating: number;
  costSavings: number;
  popularityTrend: number;
}

export interface UserActivity {
  userId: string;
  userName: string;
  totalExecutions: number;
  favoriteCategory: string;
  lastActive: Date;
  costSavingsGenerated: number;
  productivityScore: number;
}

export class AnalyticsService {
  private static instance: AnalyticsService;
  private mockData: {
    executions: any[];
    agents: AgentPerformance[];
    users: UserActivity[];
  };

  constructor() {
    this.mockData = this.generateMockData();
  }

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  // Get comprehensive execution metrics for dashboard overview
  async getExecutionMetrics(timeRange: TimeRange): Promise<ExecutionMetrics> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    const filteredExecutions = this.filterExecutionsByTimeRange(timeRange);
    const totalExecutions = filteredExecutions.length;
    const successfulExecutions = filteredExecutions.filter(e => e.status === 'success').length;
    
    return {
      totalExecutions,
      successRate: totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0,
      averageExecutionTime: this.calculateAverageExecutionTime(filteredExecutions),
      activeUsers: this.getActiveUsersCount(timeRange),
      costSavings: this.calculateTotalCostSavings(filteredExecutions),
      totalProcessingTime: this.calculateTotalProcessingTime(filteredExecutions),
      peakConcurrentExecutions: this.calculatePeakConcurrency(filteredExecutions),
      errorRate: totalExecutions > 0 ? ((totalExecutions - successfulExecutions) / totalExecutions) * 100 : 0
    };
  }

  // Get detailed agent performance data
  async getAgentPerformance(): Promise<AgentPerformance[]> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return this.mockData.agents.sort((a, b) => b.totalExecutions - a.totalExecutions);
  }

  // Get usage trends over time for charts
  async getUsageTrends(period: string, timeRange?: TimeRange): Promise<UsageTrend[]> {
    await new Promise(resolve => setTimeout(resolve, 250));
    
    const trends: UsageTrend[] = [];
    const now = new Date();
    const daysBack = this.getDaysBackForPeriod(period);
    
    for (let i = daysBack; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      trends.push({
        timestamp: date,
        executions: Math.floor(Math.random() * 150) + 50,
        successfulExecutions: Math.floor(Math.random() * 130) + 45,
        failedExecutions: Math.floor(Math.random() * 20) + 2,
        uniqueUsers: Math.floor(Math.random() * 80) + 20,
        averageResponseTime: Math.random() * 3 + 1.5,
        costSavings: Math.floor(Math.random() * 35) + 20 // $20 - $55 per day
      });
    }
    
    return trends;
  }

  // Get ROI and business value metrics
  async getROIMetrics(): Promise<ROIData> {
    await new Promise(resolve => setTimeout(resolve, 180));
    
    const totalCostSavings = 12500; // $12.5K - Realistic annual savings
    const platformCost = 1800; // $1.8K annually - Realistic platform cost
    
    return {
      totalCostSavings,
      platformCost,
      netROI: totalCostSavings - platformCost,
      roiPercentage: ((totalCostSavings - platformCost) / platformCost) * 100,
      timeToValue: 45, // days - Realistic time to value
      productivityGain: 185, // 185% increase - Believable productivity gain
      automationHours: 8500, // Realistic automation hours
      manualHoursReplaced: 15600 // Realistic manual hours replaced
    };
  }

  // Get category-wise performance metrics
  async getCategoryMetrics(): Promise<CategoryMetrics[]> {
    await new Promise(resolve => setTimeout(resolve, 150));
    
    return [
      {
        category: 'QE',
        executionCount: 1247,
        successRate: 94.2,
        averageRating: 4.7,
        costSavings: 2850, // Updated to match realistic values
        popularityTrend: 15.3
      },
      {
        category: 'DevOps',
        executionCount: 892,
        successRate: 91.8,
        averageRating: 4.5,
        costSavings: 1890, // Updated to match realistic values
        popularityTrend: 8.7
      },
      {
        category: 'Security',
        executionCount: 634,
        successRate: 96.1,
        averageRating: 4.8,
        costSavings: 1240, // Updated to match realistic values
        popularityTrend: 22.1
      },
      {
        category: 'Business',
        executionCount: 456,
        successRate: 89.3,
        averageRating: 4.4,
        costSavings: 780, // Updated to match realistic values
        popularityTrend: 12.4
      }
    ];
  }

  // Get top performing users
  async getTopUsers(limit: number = 10): Promise<UserActivity[]> {
    await new Promise(resolve => setTimeout(resolve, 120));
    
    return this.mockData.users
      .sort((a, b) => b.totalExecutions - a.totalExecutions)
      .slice(0, limit);
  }

  // Private helper methods
  private generateMockData() {
    const agents: AgentPerformance[] = [
      {
        agentId: 'qe-test-generator-v2',
        agentName: 'QE Test Case Generator Pro',
        category: 'QE',
        totalExecutions: 1247,
        successRate: 94.2,
        averageExecutionTime: 3.4,
        userRating: 4.7,
        costPerExecution: 0.35,
        totalCostSavings: 2850, // $2.85K
        popularityScore: 98,
        lastUsed: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        trendDirection: 'up',
        trendPercentage: 15.3
      },
      {
        agentId: 'devops-monitor-v1',
        agentName: 'DevOps Infrastructure Monitor',
        category: 'DevOps',
        totalExecutions: 892,
        successRate: 91.8,
        averageExecutionTime: 4.7,
        userRating: 4.5,
        costPerExecution: 0.42,
        totalCostSavings: 1890, // $1.89K
        popularityScore: 87,
        lastUsed: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
        trendDirection: 'up',
        trendPercentage: 8.7
      },
      {
        agentId: 'security-scanner-pro',
        agentName: 'Security Vulnerability Scanner',
        category: 'Security',
        totalExecutions: 634,
        successRate: 96.1,
        averageExecutionTime: 6.2,
        userRating: 4.8,
        costPerExecution: 0.58,
        totalCostSavings: 1240, // $1.24K
        popularityScore: 92,
        lastUsed: new Date(Date.now() - 20 * 60 * 1000), // 20 minutes ago
        trendDirection: 'up',
        trendPercentage: 22.1
      },
      {
        agentId: 'business-analyzer',
        agentName: 'Business Intelligence Analyzer',
        category: 'Business',
        totalExecutions: 456,
        successRate: 89.3,
        averageExecutionTime: 5.1,
        userRating: 4.4,
        costPerExecution: 0.48,
        totalCostSavings: 780, // $780
        popularityScore: 76,
        lastUsed: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
        trendDirection: 'stable',
        trendPercentage: 2.1
      }
    ];

    const users: UserActivity[] = [
      {
        userId: 'user-001',
        userName: 'Sarah Chen',
        totalExecutions: 234,
        favoriteCategory: 'QE',
        lastActive: new Date(Date.now() - 30 * 60 * 1000),
        costSavingsGenerated: 85000, // $85K
        productivityScore: 94
      },
      {
        userId: 'user-002',
        userName: 'Mike Rodriguez',
        totalExecutions: 189,
        favoriteCategory: 'DevOps',
        lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000),
        costSavingsGenerated: 67000, // $67K
        productivityScore: 87
      },
      {
        userId: 'user-003',
        userName: 'Emily Johnson',
        totalExecutions: 156,
        favoriteCategory: 'Security',
        lastActive: new Date(Date.now() - 15 * 60 * 1000),
        costSavingsGenerated: 52000, // $52K
        productivityScore: 91
      }
    ];

    const executions = this.generateMockExecutions();

    return { agents, users, executions };
  }

  private generateMockExecutions() {
    const executions = [];
    const now = new Date();
    
    for (let i = 0; i < 500; i++) {
      const executionDate = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000); // Last 30 days
      executions.push({
        id: `exec-${i}`,
        agentId: ['qe-test-generator-v2', 'devops-monitor-v1', 'security-scanner-pro', 'business-analyzer'][Math.floor(Math.random() * 4)],
        userId: `user-${String(Math.floor(Math.random() * 50) + 1).padStart(3, '0')}`,
        status: Math.random() > 0.08 ? 'success' : 'failed', // 92% success rate
        executionTime: Math.random() * 8 + 1, // 1-9 seconds
        timestamp: executionDate,
        costSavings: Math.floor(Math.random() * 12) + 8 // $8 - $20 per execution
      });
    }
    
    return executions;
  }

  private filterExecutionsByTimeRange(timeRange: TimeRange) {
    return this.mockData.executions.filter(exec => 
      exec.timestamp >= timeRange.start && exec.timestamp <= timeRange.end
    );
  }

  private calculateAverageExecutionTime(executions: any[]): number {
    if (executions.length === 0) return 0;
    const total = executions.reduce((sum, exec) => sum + exec.executionTime, 0);
    return Math.round((total / executions.length) * 100) / 100;
  }

  private getActiveUsersCount(timeRange: TimeRange): number {
    const uniqueUsers = new Set(
      this.filterExecutionsByTimeRange(timeRange).map(exec => exec.userId)
    );
    return uniqueUsers.size;
  }

  private calculateTotalCostSavings(executions: any[]): number {
    return executions.reduce((sum, exec) => sum + exec.costSavings, 0);
  }

  private calculateTotalProcessingTime(executions: any[]): number {
    return Math.round(executions.reduce((sum, exec) => sum + exec.executionTime, 0) * 100) / 100;
  }

  private calculatePeakConcurrency(executions: any[]): number {
    // Simplified peak concurrency calculation
    return Math.floor(executions.length / 24) + Math.floor(Math.random() * 10) + 5;
  }

  private getDaysBackForPeriod(period: string): number {
    switch (period) {
      case 'week': return 7;
      case 'month': return 30;
      case 'quarter': return 90;
      case 'year': return 365;
      default: return 30;
    }
  }
}

// Global analytics service instance
export const analyticsService = AnalyticsService.getInstance();