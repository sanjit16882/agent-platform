// Template Analytics Service
// Provides comprehensive analytics, ROI tracking, and business intelligence for the template system

export interface TemplateROIMetrics {
  templateId: string;
  templateName: string;
  totalUsage: number;
  timeSavedPerUse: number; // minutes
  totalTimeSaved: number; // hours
  costSavingsPerUse: number; // dollars
  totalCostSavings: number; // dollars
  traditionalDevelopmentTime: number; // hours
  templateSetupTime: number; // minutes
  efficiencyGain: number; // percentage
  roi: number; // percentage
}

export interface TemplateUsageMetrics {
  templateId: string;
  templateName: string;
  category: string;
  totalExecutions: number;
  uniqueUsers: number;
  successRate: number;
  averageSetupTime: number;
  averageRating: number;
  lastUsed: Date;
  usageTrend: 'up' | 'down' | 'stable';
  trendPercentage: number;
  popularityRank: number;
}

export interface UserProductivityMetrics {
  userId: string;
  userName: string;
  templatesUsed: number;
  totalAgentsCreated: number;
  averageCreationTime: number;
  timeSaved: number; // hours
  costSavingsGenerated: number;
  productivityScore: number;
  favoriteCategory: string;
  expertiseLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
}

export interface CategoryPerformance {
  category: string;
  templateCount: number;
  totalUsage: number;
  averageRating: number;
  successRate: number;
  timeSaved: number; // hours
  costSavings: number; // dollars
  growthRate: number; // percentage
  topTemplates: string[];
}

export interface BusinessImpactMetrics {
  totalTemplates: number;
  totalAgentsCreated: number;
  totalTimeSaved: number; // hours
  totalCostSavings: number; // dollars
  averageROI: number; // percentage
  productivityIncrease: number; // percentage
  timeToMarket: number; // days reduction
  developerSatisfaction: number; // 1-10 scale
  adoptionRate: number; // percentage
  platformUtilization: number; // percentage
}

export interface TemplateHealthMetrics {
  templateId: string;
  templateName: string;
  healthScore: number; // 0-100
  reliability: number; // percentage
  performance: number; // response time in ms
  errorRate: number; // percentage
  supportTickets: number;
  maintenanceEffort: number; // hours per month
  userSatisfaction: number; // 1-10 scale
  lastUpdated: Date;
  nextMaintenanceDue: Date;
}

export interface ExecutiveDashboardData {
  businessMetrics: BusinessImpactMetrics;
  roiSummary: {
    totalROI: number;
    monthlyROI: number;
    projectedAnnualROI: number;
    paybackPeriod: number; // months
  };
  adoptionMetrics: {
    activeUsers: number;
    newUsersThisMonth: number;
    userGrowthRate: number;
    templateAdoptionRate: number;
  };
  operationalMetrics: {
    systemUptime: number;
    averageResponseTime: number;
    errorRate: number;
    supportTicketVolume: number;
  };
  trends: {
    usageTrend: 'up' | 'down' | 'stable';
    satisfactionTrend: 'up' | 'down' | 'stable';
    costSavingsTrend: 'up' | 'down' | 'stable';
  };
}

export interface TimeRange {
  start: Date;
  end: Date;
  period: 'day' | 'week' | 'month' | 'quarter' | 'year';
}

export class TemplateAnalyticsService {
  private static instance: TemplateAnalyticsService;
  private mockData: {
    templateMetrics: TemplateUsageMetrics[];
    userMetrics: UserProductivityMetrics[];
    roiData: TemplateROIMetrics[];
    healthMetrics: TemplateHealthMetrics[];
  };

  constructor() {
    this.mockData = this.generateMockData();
  }

  static getInstance(): TemplateAnalyticsService {
    if (!TemplateAnalyticsService.instance) {
      TemplateAnalyticsService.instance = new TemplateAnalyticsService();
    }
    return TemplateAnalyticsService.instance;
  }

  // Template Performance Analytics
  async getTemplateUsageMetrics(): Promise<TemplateUsageMetrics[]> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return this.mockData.templateMetrics.sort((a, b) => b.totalExecutions - a.totalExecutions);
  }

  async getTemplateROIMetrics(): Promise<TemplateROIMetrics[]> {
    await new Promise(resolve => setTimeout(resolve, 250));
    return this.mockData.roiData.sort((a, b) => b.totalCostSavings - a.totalCostSavings);
  }

  async getTemplateHealthMetrics(): Promise<TemplateHealthMetrics[]> {
    await new Promise(resolve => setTimeout(resolve, 180));
    return this.mockData.healthMetrics.sort((a, b) => b.healthScore - a.healthScore);
  }

  async getTemplatePerformance(templateId: string): Promise<TemplateUsageMetrics | null> {
    await new Promise(resolve => setTimeout(resolve, 150));
    return this.mockData.templateMetrics.find(t => t.templateId === templateId) || null;
  }

  // User Productivity Analytics
  async getUserProductivityMetrics(): Promise<UserProductivityMetrics[]> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return this.mockData.userMetrics.sort((a, b) => b.productivityScore - a.productivityScore);
  }

  async getTopPerformingUsers(limit: number = 10): Promise<UserProductivityMetrics[]> {
    await new Promise(resolve => setTimeout(resolve, 150));
    return this.mockData.userMetrics
      .sort((a, b) => b.costSavingsGenerated - a.costSavingsGenerated)
      .slice(0, limit);
  }

  // Category Analytics
  async getCategoryPerformance(): Promise<CategoryPerformance[]> {
    await new Promise(resolve => setTimeout(resolve, 200));

    const categories = ['QE', 'DevOps', 'Security', 'Business'];
    return categories.map(category => {
      const categoryTemplates = this.mockData.templateMetrics.filter(t => t.category === category);
      const categoryROI = this.mockData.roiData.filter(r => 
        this.mockData.templateMetrics.find(t => t.templateId === r.templateId)?.category === category
      );

      return {
        category,
        templateCount: categoryTemplates.length,
        totalUsage: categoryTemplates.reduce((sum, t) => sum + t.totalExecutions, 0),
        averageRating: categoryTemplates.reduce((sum, t) => sum + t.averageRating, 0) / categoryTemplates.length,
        successRate: categoryTemplates.reduce((sum, t) => sum + t.successRate, 0) / categoryTemplates.length,
        timeSaved: categoryROI.reduce((sum, r) => sum + r.totalTimeSaved, 0),
        costSavings: categoryROI.reduce((sum, r) => sum + r.totalCostSavings, 0),
        growthRate: 15 + Math.random() * 20, // 15-35% growth
        topTemplates: categoryTemplates
          .sort((a, b) => b.totalExecutions - a.totalExecutions)
          .slice(0, 3)
          .map(t => t.templateName)
      };
    });
  }

  // Business Impact Analytics
  async getBusinessImpactMetrics(): Promise<BusinessImpactMetrics> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const totalUsage = this.mockData.templateMetrics.reduce((sum, t) => sum + t.totalExecutions, 0);
    const totalTimeSaved = this.mockData.roiData.reduce((sum, r) => sum + r.totalTimeSaved, 0);
    const totalCostSavings = this.mockData.roiData.reduce((sum, r) => sum + r.totalCostSavings, 0);
    const averageROI = this.mockData.roiData.reduce((sum, r) => sum + r.roi, 0) / this.mockData.roiData.length;

    return {
      totalTemplates: this.mockData.templateMetrics.length,
      totalAgentsCreated: totalUsage,
      totalTimeSaved,
      totalCostSavings,
      averageROI,
      productivityIncrease: 185, // 185% increase
      timeToMarket: 75, // 75% reduction in time to market
      developerSatisfaction: 8.7, // 8.7/10 satisfaction score
      adoptionRate: 87, // 87% adoption rate
      platformUtilization: 92 // 92% platform utilization
    };
  }

  async getExecutiveDashboard(): Promise<ExecutiveDashboardData> {
    await new Promise(resolve => setTimeout(resolve, 400));

    const businessMetrics = await this.getBusinessImpactMetrics();
    const totalROI = businessMetrics.totalCostSavings;
    const platformCost = 180000; // Annual platform cost

    return {
      businessMetrics,
      roiSummary: {
        totalROI: totalROI - platformCost,
        monthlyROI: (totalROI - platformCost) / 12,
        projectedAnnualROI: totalROI * 1.2, // 20% growth projection
        paybackPeriod: 3 // 3 months payback period
      },
      adoptionMetrics: {
        activeUsers: 156,
        newUsersThisMonth: 23,
        userGrowthRate: 18.5, // 18.5% monthly growth
        templateAdoptionRate: 87.3 // 87.3% of users actively using templates
      },
      operationalMetrics: {
        systemUptime: 99.8, // 99.8% uptime
        averageResponseTime: 1.2, // 1.2 seconds
        errorRate: 0.8, // 0.8% error rate
        supportTicketVolume: 12 // 12 tickets this month
      },
      trends: {
        usageTrend: 'up',
        satisfactionTrend: 'up',
        costSavingsTrend: 'up'
      }
    };
  }

  // Time-based Analytics
  async getUsageTrends(timeRange: TimeRange): Promise<any[]> {
    await new Promise(resolve => setTimeout(resolve, 250));

    const trends = [];
    const days = this.getDaysBetween(timeRange.start, timeRange.end);

    for (let i = 0; i <= days; i++) {
      const date = new Date(timeRange.start);
      date.setDate(date.getDate() + i);

      trends.push({
        date,
        templateUsage: Math.floor(Math.random() * 50) + 20,
        agentsCreated: Math.floor(Math.random() * 30) + 10,
        timeSaved: Math.floor(Math.random() * 100) + 50, // hours
        costSavings: Math.floor(Math.random() * 5000) + 2000, // dollars
        userActivity: Math.floor(Math.random() * 80) + 30,
        successRate: 85 + Math.random() * 10 // 85-95%
      });
    }

    return trends;
  }

  async getROITrends(timeRange: TimeRange): Promise<any[]> {
    await new Promise(resolve => setTimeout(resolve, 200));

    const trends = [];
    const months = this.getMonthsBetween(timeRange.start, timeRange.end);

    for (let i = 0; i <= months; i++) {
      const date = new Date(timeRange.start);
      date.setMonth(date.getMonth() + i);

      const monthlyCostSavings = 80000 + Math.random() * 40000; // $80K - $120K per month
      const monthlyPlatformCost = 15000; // $15K per month

      trends.push({
        date,
        costSavings: monthlyCostSavings,
        platformCost: monthlyPlatformCost,
        netROI: monthlyCostSavings - monthlyPlatformCost,
        roiPercentage: ((monthlyCostSavings - monthlyPlatformCost) / monthlyPlatformCost) * 100,
        cumulativeROI: (i + 1) * (monthlyCostSavings - monthlyPlatformCost)
      });
    }

    return trends;
  }

  // Comparative Analytics
  async compareTemplatePerformance(templateIds: string[]): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const comparison = templateIds.map(id => {
      const usage = this.mockData.templateMetrics.find(t => t.templateId === id);
      const roi = this.mockData.roiData.find(r => r.templateId === id);
      const health = this.mockData.healthMetrics.find(h => h.templateId === id);

      return {
        templateId: id,
        templateName: usage?.templateName || 'Unknown',
        metrics: {
          usage: usage?.totalExecutions || 0,
          rating: usage?.averageRating || 0,
          successRate: usage?.successRate || 0,
          costSavings: roi?.totalCostSavings || 0,
          timeSaved: roi?.totalTimeSaved || 0,
          healthScore: health?.healthScore || 0,
          reliability: health?.reliability || 0
        }
      };
    });

    return {
      templates: comparison,
      summary: {
        bestPerforming: comparison.reduce((best, current) => 
          current.metrics.costSavings > best.metrics.costSavings ? current : best
        ),
        mostReliable: comparison.reduce((best, current) => 
          current.metrics.reliability > best.metrics.reliability ? current : best
        ),
        mostPopular: comparison.reduce((best, current) => 
          current.metrics.usage > best.metrics.usage ? current : best
        )
      }
    };
  }

  // Predictive Analytics
  async getPredictiveInsights(): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 350));

    return {
      usagePrediction: {
        nextMonth: {
          expectedUsage: 2800,
          confidenceLevel: 85,
          factors: ['Historical growth', 'New template releases', 'User onboarding']
        },
        nextQuarter: {
          expectedUsage: 9200,
          confidenceLevel: 78,
          factors: ['Seasonal trends', 'Platform improvements', 'Market expansion']
        }
      },
      roiProjection: {
        nextMonth: {
          projectedSavings: 125000,
          confidenceLevel: 88,
          factors: ['Current adoption rate', 'Template efficiency', 'User productivity']
        },
        nextYear: {
          projectedSavings: 1650000,
          confidenceLevel: 72,
          factors: ['Growth trajectory', 'New features', 'Market conditions']
        }
      },
      recommendations: [
        {
          type: 'Template Optimization',
          priority: 'High',
          description: 'Focus on improving QE templates as they show highest ROI potential',
          expectedImpact: '15% increase in cost savings'
        },
        {
          type: 'User Training',
          priority: 'Medium',
          description: 'Provide advanced training for power users to maximize productivity',
          expectedImpact: '10% increase in user efficiency'
        },
        {
          type: 'Template Expansion',
          priority: 'Medium',
          description: 'Develop more Security category templates based on demand trends',
          expectedImpact: '20% increase in Security template adoption'
        }
      ]
    };
  }

  // Export and Reporting
  async generateAnalyticsReport(reportType: 'executive' | 'operational' | 'technical'): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const businessMetrics = await this.getBusinessImpactMetrics();
    const categoryPerformance = await this.getCategoryPerformance();
    const topUsers = await this.getTopPerformingUsers(5);

    const baseReport = {
      generatedAt: new Date(),
      reportType,
      summary: businessMetrics,
      categoryBreakdown: categoryPerformance,
      timeRange: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date()
      }
    };

    switch (reportType) {
      case 'executive':
        return {
          ...baseReport,
          executiveSummary: 'Template system delivering exceptional ROI with 594% return on investment',
          keyHighlights: [
            '$1.25M in total cost savings achieved',
            '185% increase in developer productivity',
            '87% platform adoption rate',
            '99.8% system uptime maintained'
          ],
          strategicRecommendations: [
            'Expand template library in high-ROI categories',
            'Invest in advanced analytics capabilities',
            'Develop enterprise governance features'
          ]
        };

      case 'operational':
        return {
          ...baseReport,
          operationalMetrics: {
            systemPerformance: { uptime: 99.8, responseTime: 1.2, errorRate: 0.8 },
            userActivity: { activeUsers: 156, newUsers: 23, engagement: 87.3 },
            templateHealth: this.mockData.healthMetrics.slice(0, 10)
          },
          issues: [
            { severity: 'Low', description: 'Minor performance degradation in Security templates' },
            { severity: 'Medium', description: 'Documentation updates needed for 3 templates' }
          ]
        };

      case 'technical':
        return {
          ...baseReport,
          technicalMetrics: {
            templatePerformance: this.mockData.templateMetrics.slice(0, 10),
            systemHealth: this.mockData.healthMetrics,
            userProductivity: topUsers
          },
          recommendations: [
            'Optimize code generation for large templates',
            'Implement caching for frequently used templates',
            'Add monitoring for template execution times'
          ]
        };

      default:
        return baseReport;
    }
  }

  // Private helper methods
  private generateMockData() {
    const templateMetrics: TemplateUsageMetrics[] = [
      {
        templateId: 'web-ui-automation-pro-v3',
        templateName: 'Web UI Test Automation Pro',
        category: 'QE',
        totalExecutions: 1247,
        uniqueUsers: 89,
        successRate: 94.2,
        averageSetupTime: 12.5,
        averageRating: 4.7,
        lastUsed: new Date(Date.now() - 2 * 60 * 60 * 1000),
        usageTrend: 'up',
        trendPercentage: 15.3,
        popularityRank: 1
      },
      {
        templateId: 'api-test-automation-suite-v2',
        templateName: 'API Test Automation Suite',
        category: 'QE',
        totalExecutions: 892,
        uniqueUsers: 67,
        successRate: 91.8,
        averageSetupTime: 18.2,
        averageRating: 4.5,
        lastUsed: new Date(Date.now() - 45 * 60 * 1000),
        usageTrend: 'up',
        trendPercentage: 8.7,
        popularityRank: 2
      },
      {
        templateId: 'cicd-pipeline-builder-v1',
        templateName: 'CI/CD Pipeline Builder',
        category: 'DevOps',
        totalExecutions: 634,
        uniqueUsers: 45,
        successRate: 89.1,
        averageSetupTime: 28.5,
        averageRating: 4.6,
        lastUsed: new Date(Date.now() - 20 * 60 * 1000),
        usageTrend: 'stable',
        trendPercentage: 2.1,
        popularityRank: 3
      },
      {
        templateId: 'security-vulnerability-scanner-v2',
        templateName: 'Security Vulnerability Scanner',
        category: 'Security',
        totalExecutions: 456,
        uniqueUsers: 34,
        successRate: 96.1,
        averageSetupTime: 22.8,
        averageRating: 4.8,
        lastUsed: new Date(Date.now() - 30 * 60 * 1000),
        usageTrend: 'up',
        trendPercentage: 22.1,
        popularityRank: 4
      },
      {
        templateId: 'business-analytics-pipeline-v1',
        templateName: 'Business Analytics Pipeline',
        category: 'Business',
        totalExecutions: 289,
        uniqueUsers: 28,
        successRate: 87.3,
        averageSetupTime: 32.1,
        averageRating: 4.4,
        lastUsed: new Date(Date.now() - 3 * 60 * 60 * 1000),
        usageTrend: 'up',
        trendPercentage: 12.4,
        popularityRank: 5
      }
    ];

    const roiData: TemplateROIMetrics[] = templateMetrics.map(template => ({
      templateId: template.templateId,
      templateName: template.templateName,
      totalUsage: template.totalExecutions,
      timeSavedPerUse: 120 + Math.random() * 180, // 2-5 hours saved per use
      totalTimeSaved: template.totalExecutions * (2 + Math.random() * 3), // Total hours saved
      costSavingsPerUse: 200 + Math.random() * 300, // $200-500 saved per use
      totalCostSavings: template.totalExecutions * (200 + Math.random() * 300),
      traditionalDevelopmentTime: 8 + Math.random() * 16, // 8-24 hours traditional time
      templateSetupTime: template.averageSetupTime,
      efficiencyGain: 70 + Math.random() * 25, // 70-95% efficiency gain
      roi: 300 + Math.random() * 400 // 300-700% ROI
    }));

    const userMetrics: UserProductivityMetrics[] = [
      {
        userId: 'user-001',
        userName: 'Sarah Chen',
        templatesUsed: 8,
        totalAgentsCreated: 45,
        averageCreationTime: 18.5,
        timeSaved: 156,
        costSavingsGenerated: 85000,
        productivityScore: 94,
        favoriteCategory: 'QE',
        expertiseLevel: 'Expert'
      },
      {
        userId: 'user-002',
        userName: 'Mike Rodriguez',
        templatesUsed: 6,
        totalAgentsCreated: 32,
        averageCreationTime: 22.1,
        timeSaved: 128,
        costSavingsGenerated: 67000,
        productivityScore: 87,
        favoriteCategory: 'DevOps',
        expertiseLevel: 'Advanced'
      },
      {
        userId: 'user-003',
        userName: 'Emily Johnson',
        templatesUsed: 5,
        totalAgentsCreated: 28,
        averageCreationTime: 25.3,
        timeSaved: 98,
        costSavingsGenerated: 52000,
        productivityScore: 91,
        favoriteCategory: 'Security',
        expertiseLevel: 'Advanced'
      }
    ];

    const healthMetrics: TemplateHealthMetrics[] = templateMetrics.map(template => ({
      templateId: template.templateId,
      templateName: template.templateName,
      healthScore: 75 + Math.random() * 20, // 75-95 health score
      reliability: template.successRate,
      performance: 800 + Math.random() * 400, // 800-1200ms response time
      errorRate: (100 - template.successRate),
      supportTickets: Math.floor(Math.random() * 5),
      maintenanceEffort: 2 + Math.random() * 6, // 2-8 hours per month
      userSatisfaction: template.averageRating * 2, // Convert to 1-10 scale
      lastUpdated: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      nextMaintenanceDue: new Date(Date.now() + Math.random() * 60 * 24 * 60 * 60 * 1000)
    }));

    return {
      templateMetrics,
      userMetrics,
      roiData,
      healthMetrics
    };
  }

  private getDaysBetween(start: Date, end: Date): number {
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private getMonthsBetween(start: Date, end: Date): number {
    return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  }
}

// Global template analytics service instance
export const templateAnalyticsService = TemplateAnalyticsService.getInstance();