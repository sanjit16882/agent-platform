import { s3AgentService } from './s3AgentService';

export interface AgentMetrics {
  totalExecutions: number;
  successRate: number;
  avgExecutionTime: number;
  lastExecuted?: string;
  errorCount: number;
  dailyExecutions: number[];
  weeklyExecutions: number[];
}

export interface AgentHealth {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  responseTime: number;
  errorRate: number;
  availability: number;
  lastHealthCheck: string;
  alerts: string[];
}

export interface ManagedAgent {
  id: string;
  name: string;
  description: string;
  category: string;
  status: 'active' | 'inactive' | 'deploying' | 'error';
  version: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  deploymentStatus: 'deployed' | 'pending' | 'failed' | 'not_deployed';
  
  // Metrics
  metrics: AgentMetrics;
  health: AgentHealth;
  
  // Configuration
  purpose?: string;
  capabilities: string[];
  customProcessingLogic?: string;
  inputSchema?: any;
  outputSchema?: any;
  
  // S3 specific
  s3Key?: string;
  size?: number;
}

export interface PlatformMetrics {
  totalAgents: number;
  deployedAgents: number;
  healthyAgents: number;
  activeAlerts: number;
  platformUptime: number;
  totalExecutions: number;
  avgResponseTime: number;
  errorRate: number;
}

class AgentManagementService {
  private executionHistory: Map<string, any[]> = new Map();
  private metricsCache: Map<string, AgentMetrics> = new Map();
  private healthCache: Map<string, AgentHealth> = new Map();
  private lastCacheUpdate: number = 0;
  private cacheTimeout: number = 5 * 60 * 1000; // 5 minutes

  /**
   * Get all managed agents with real metrics
   */
  async getAllManagedAgents(): Promise<ManagedAgent[]> {
    try {
      console.log('🔍 AgentManagementService: Fetching all agents from S3...');
      
      // Get all agents directly from S3 endpoint (most reliable source)
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3002'}/api/v1/agents/s3`);
      const s3Data = await response.json();
      
      if (!s3Data.success) {
        throw new Error(s3Data.error || 'Failed to fetch agents from S3');
      }
      
      const allAgents = s3Data.data || [];
      console.log('✅ All agents received from S3:', allAgents.length, allAgents);
      
      // Filter out template agents (they're not real manageable agents)
      const realAgents = allAgents.filter((agent: any) => agent.agent_type !== 'template' && agent.type !== 'template');
      console.log('✅ Filtered real agents (excluding templates):', realAgents.length, realAgents);
      
      // Convert catalog agents to managed agents with metrics
      const managedAgents = await Promise.all(
        realAgents.map(async (agent: any) => this.convertCatalogAgentToManagedAgent(agent))
      );

      console.log('✅ Converted to managed agents:', managedAgents.length, managedAgents);
      return managedAgents.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    } catch (error) {
      console.error('❌ Error fetching managed agents:', error);
      
      // Fallback to S3 only if main catalog fails
      try {
        console.log('⚠️ Falling back to S3 agents only...');
        const s3Agents = await s3AgentService.getAllAgents();
        const managedAgents = await Promise.all(
          s3Agents.map(async (agent) => this.convertToManagedAgent(agent))
        );
        return managedAgents.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      } catch (s3Error) {
        console.error('❌ S3 fallback also failed:', s3Error);
        return [];
      }
    }
  }

  /**
   * Get specific agent with detailed metrics
   */
  async getAgentDetails(agentId: string): Promise<ManagedAgent | null> {
    try {
      const s3Agent = await s3AgentService.getAgent(agentId);
      if (!s3Agent) return null;

      return await this.convertToManagedAgent(s3Agent);
    } catch (error) {
      console.error(`Error fetching agent details for ${agentId}:`, error);
      return null;
    }
  }

  /**
   * Get platform-wide metrics
   */
  async getPlatformMetrics(): Promise<PlatformMetrics> {
    try {
      const agents = await this.getAllManagedAgents();
      
      const totalAgents = agents.length;
      const deployedAgents = agents.filter(a => a.deploymentStatus === 'deployed').length;
      const healthyAgents = agents.filter(a => a.health.status === 'healthy').length;
      const activeAlerts = agents.reduce((sum, agent) => sum + agent.health.alerts.length, 0);
      
      // Calculate platform uptime based on agent availability
      const deployedAgentsWithHealth = agents.filter(a => a.deploymentStatus === 'deployed');
      const averageAvailability = deployedAgentsWithHealth.length > 0
        ? deployedAgentsWithHealth.reduce((sum, agent) => sum + agent.health.availability, 0) / deployedAgentsWithHealth.length
        : 100;

      // Calculate total executions
      const totalExecutions = agents.reduce((sum, agent) => sum + agent.metrics.totalExecutions, 0);
      
      // Calculate average response time
      const avgResponseTime = deployedAgentsWithHealth.length > 0
        ? deployedAgentsWithHealth.reduce((sum, agent) => sum + agent.health.responseTime, 0) / deployedAgentsWithHealth.length
        : 0;

      // Calculate error rate
      const totalErrors = agents.reduce((sum, agent) => sum + agent.metrics.errorCount, 0);
      const errorRate = totalExecutions > 0 ? (totalErrors / totalExecutions) * 100 : 0;

      return {
        totalAgents,
        deployedAgents,
        healthyAgents,
        activeAlerts,
        platformUptime: averageAvailability,
        totalExecutions,
        avgResponseTime: Math.round(avgResponseTime),
        errorRate: Math.round(errorRate * 100) / 100
      };
    } catch (error) {
      console.error('Error calculating platform metrics:', error);
      return {
        totalAgents: 0,
        deployedAgents: 0,
        healthyAgents: 0,
        activeAlerts: 0,
        platformUptime: 0,
        totalExecutions: 0,
        avgResponseTime: 0,
        errorRate: 0
      };
    }
  }

  /**
   * Record agent execution
   */
  async recordExecution(agentId: string, success: boolean, executionTime: number, error?: string): Promise<void> {
    try {
      const execution = {
        timestamp: new Date().toISOString(),
        success,
        executionTime,
        error
      };

      // Add to execution history
      if (!this.executionHistory.has(agentId)) {
        this.executionHistory.set(agentId, []);
      }
      
      const history = this.executionHistory.get(agentId)!;
      history.push(execution);
      
      // Keep only last 1000 executions
      if (history.length > 1000) {
        history.splice(0, history.length - 1000);
      }

      // Update metrics cache
      await this.updateMetricsCache(agentId);
      
      // In a real implementation, this would be stored in a database
      // For now, we'll store in localStorage as a fallback
      this.saveExecutionHistory();
      
    } catch (error) {
      console.error('Error recording execution:', error);
    }
  }

  /**
   * Update agent health status
   */
  async updateAgentHealth(agentId: string, health: Partial<AgentHealth>): Promise<void> {
    try {
      const currentHealth = this.healthCache.get(agentId) || this.getDefaultHealth();
      const updatedHealth = { ...currentHealth, ...health, lastHealthCheck: new Date().toISOString() };
      
      this.healthCache.set(agentId, updatedHealth);
      this.saveHealthCache();
    } catch (error) {
      console.error('Error updating agent health:', error);
    }
  }

  /**
   * Convert catalog agent to managed agent with metrics
   */
  private async convertCatalogAgentToManagedAgent(catalogAgent: any): Promise<ManagedAgent> {
    const metrics = await this.getAgentMetrics(catalogAgent.id);
    const health = await this.getAgentHealth(catalogAgent.id);

    return {
      id: catalogAgent.id,
      name: catalogAgent.name,
      description: catalogAgent.description,
      category: catalogAgent.category,
      status: this.mapStatus(catalogAgent.status),
      version: '1.0.0',
      author: catalogAgent.agent_type === 'builtin' ? 'AgentHub' : 'User',
      createdAt: catalogAgent.created_at,
      updatedAt: catalogAgent.created_at, // Use created_at as fallback
      deploymentStatus: 'deployed',
      
      metrics,
      health,
      
      purpose: this.getAgentPurpose(catalogAgent),
      capabilities: this.getAgentCapabilities(catalogAgent),
      customProcessingLogic: catalogAgent.agent_type === 's3_custom' ? 'Custom S3 stored agent' : undefined,
      inputSchema: undefined,
      outputSchema: undefined,
      
      s3Key: catalogAgent.agent_type === 's3_custom' ? `agents/${catalogAgent.id}.json` : undefined,
      size: catalogAgent.agent_type === 's3_custom' ? 1024 : undefined // Estimated size
    };
  }

  /**
   * Convert S3 agent to managed agent with metrics (kept for backward compatibility)
   */
  private async convertToManagedAgent(s3Agent: any): Promise<ManagedAgent> {
    const metrics = await this.getAgentMetrics(s3Agent.id);
    const health = await this.getAgentHealth(s3Agent.id);

    return {
      id: s3Agent.id,
      name: s3Agent.name,
      description: s3Agent.description,
      category: s3Agent.category,
      status: this.mapStatus(s3Agent.status),
      version: '1.0.0', // Default version
      author: 'User',
      createdAt: s3Agent.createdAt,
      updatedAt: s3Agent.updatedAt,
      deploymentStatus: 'deployed', // Assume deployed if in S3
      
      metrics,
      health,
      
      purpose: s3Agent.purpose,
      capabilities: s3Agent.capabilities || [],
      customProcessingLogic: s3Agent.customProcessingLogic,
      inputSchema: s3Agent.inputSchema,
      outputSchema: s3Agent.outputSchema,
      
      s3Key: `agents/${s3Agent.id}.json`,
      size: JSON.stringify(s3Agent).length
    };
  }

  /**
   * Get agent metrics (from cache or calculate)
   */
  private async getAgentMetrics(agentId: string): Promise<AgentMetrics> {
    // Check cache first
    if (this.metricsCache.has(agentId) && this.isCacheValid()) {
      return this.metricsCache.get(agentId)!;
    }

    // Try to get real execution data from analytics service
    try {
      const { advancedAnalyticsService } = await import('./advancedAnalyticsService');
      const agentInsights = await advancedAnalyticsService.getAgentInsights();
      const insight = agentInsights.find(i => i.agentId === agentId);
      
      if (insight && insight.executionCount > 0) {
        // Use real data from analytics service
        const metrics: AgentMetrics = {
          totalExecutions: insight.executionCount,
          successRate: insight.successRate,
          avgExecutionTime: insight.averageLatency,
          lastExecuted: new Date().toISOString(), // Use current time as approximation
          errorCount: Math.round(insight.executionCount * (1 - insight.successRate / 100)),
          dailyExecutions: [], // Could be calculated from execution history
          weeklyExecutions: []
        };
        
        this.metricsCache.set(agentId, metrics);
        return metrics;
      }
    } catch (error) {
      console.warn('Could not fetch real execution data, using fallback:', error);
    }

    // Fallback: Calculate metrics from local execution history
    const history = this.executionHistory.get(agentId) || [];
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const totalExecutions = history.length;
    const successfulExecutions = history.filter(e => e.success).length;
    const successRate = totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 100;
    
    const avgExecutionTime = totalExecutions > 0
      ? history.reduce((sum, e) => sum + e.executionTime, 0) / totalExecutions
      : 0;

    const errorCount = history.filter(e => !e.success).length;
    const lastExecuted = history.length > 0 ? history[history.length - 1].timestamp : undefined;

    // Daily executions (last 7 days)
    const dailyExecutions = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      const dayExecutions = history.filter(e => {
        const execTime = new Date(e.timestamp);
        return execTime >= dayStart && execTime < dayEnd;
      }).length;
      dailyExecutions.push(dayExecutions);
    }

    // Weekly executions (last 4 weeks)
    const weeklyExecutions = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
      const weekExecutions = history.filter(e => {
        const execTime = new Date(e.timestamp);
        return execTime >= weekStart && execTime < weekEnd;
      }).length;
      weeklyExecutions.push(weekExecutions);
    }

    const metrics: AgentMetrics = {
      totalExecutions,
      successRate: Math.round(successRate * 100) / 100,
      avgExecutionTime: Math.round(avgExecutionTime),
      lastExecuted,
      errorCount,
      dailyExecutions,
      weeklyExecutions
    };

    this.metricsCache.set(agentId, metrics);
    return metrics;
  }

  /**
   * Get agent health status
   */
  private async getAgentHealth(agentId: string): Promise<AgentHealth> {
    // Check cache first
    if (this.healthCache.has(agentId) && this.isCacheValid()) {
      return this.healthCache.get(agentId)!;
    }

    // Generate health based on recent executions
    const history = this.executionHistory.get(agentId) || [];
    const recentHistory = history.slice(-10); // Last 10 executions
    
    let status: AgentHealth['status'] = 'unknown';
    let responseTime = 0;
    let errorRate = 0;
    let availability = 100;
    const alerts: string[] = [];

    if (recentHistory.length > 0) {
      const successCount = recentHistory.filter(e => e.success).length;
      const successRate = (successCount / recentHistory.length) * 100;
      
      responseTime = recentHistory.reduce((sum, e) => sum + e.executionTime, 0) / recentHistory.length;
      errorRate = ((recentHistory.length - successCount) / recentHistory.length) * 100;
      availability = successRate;

      if (successRate >= 95 && responseTime < 5000) {
        status = 'healthy';
      } else if (successRate >= 80 && responseTime < 10000) {
        status = 'degraded';
        alerts.push('Performance degraded');
      } else {
        status = 'unhealthy';
        alerts.push('High error rate detected');
        if (responseTime >= 10000) {
          alerts.push('High response time');
        }
      }
    } else {
      // No execution history - assume healthy without alerts for clean UI
      status = 'healthy';
      // Don't add alerts for agents without execution history to keep UI clean
    }

    const health: AgentHealth = {
      status,
      responseTime: Math.round(responseTime),
      errorRate: Math.round(errorRate * 100) / 100,
      availability: Math.round(availability * 100) / 100,
      lastHealthCheck: new Date().toISOString(),
      alerts
    };

    this.healthCache.set(agentId, health);
    return health;
  }

  /**
   * Map S3 agent status to managed agent status
   */
  private mapStatus(s3Status: string): 'active' | 'inactive' | 'deploying' | 'error' {
    switch (s3Status?.toLowerCase()) {
      case 'active':
      case 'deployed':
        return 'active';
      case 'inactive':
      case 'disabled':
        return 'inactive';
      case 'deploying':
      case 'pending':
        return 'deploying';
      case 'error':
      case 'failed':
        return 'error';
      default:
        return 'active';
    }
  }

  /**
   * Get default health status
   */
  private getDefaultHealth(): AgentHealth {
    return {
      status: 'unknown',
      responseTime: 0,
      errorRate: 0,
      availability: 100,
      lastHealthCheck: new Date().toISOString(),
      alerts: ['No health data available']
    };
  }

  /**
   * Check if cache is still valid
   */
  private isCacheValid(): boolean {
    return Date.now() - this.lastCacheUpdate < this.cacheTimeout;
  }

  /**
   * Update metrics cache
   */
  private async updateMetricsCache(agentId: string): Promise<void> {
    this.metricsCache.delete(agentId); // Force recalculation
    await this.getAgentMetrics(agentId);
    this.lastCacheUpdate = Date.now();
  }

  /**
   * Save execution history to localStorage
   */
  private saveExecutionHistory(): void {
    try {
      const historyData: { [key: string]: any[] } = {};
      this.executionHistory.forEach((value, key) => {
        historyData[key] = value;
      });
      localStorage.setItem('agentExecutionHistory', JSON.stringify(historyData));
    } catch (error) {
      console.error('Error saving execution history:', error);
    }
  }

  /**
   * Load execution history from localStorage
   */
  private loadExecutionHistory(): void {
    try {
      const saved = localStorage.getItem('agentExecutionHistory');
      if (saved) {
        const historyData = JSON.parse(saved);
        Object.entries(historyData).forEach(([key, value]) => {
          this.executionHistory.set(key, value as any[]);
        });
      }
    } catch (error) {
      console.error('Error loading execution history:', error);
    }
  }

  /**
   * Save health cache to localStorage
   */
  private saveHealthCache(): void {
    try {
      const healthData: { [key: string]: AgentHealth } = {};
      this.healthCache.forEach((value, key) => {
        healthData[key] = value;
      });
      localStorage.setItem('agentHealthCache', JSON.stringify(healthData));
    } catch (error) {
      console.error('Error saving health cache:', error);
    }
  }

  /**
   * Load health cache from localStorage
   */
  private loadHealthCache(): void {
    try {
      const saved = localStorage.getItem('agentHealthCache');
      if (saved) {
        const healthData = JSON.parse(saved);
        Object.entries(healthData).forEach(([key, value]) => {
          this.healthCache.set(key, value as AgentHealth);
        });
      }
    } catch (error) {
      console.error('Error loading health cache:', error);
    }
  }

  /**
   * Get agent purpose based on type and description
   */
  private getAgentPurpose(catalogAgent: any): string {
    if (catalogAgent.agent_type === 's3_custom') {
      return 'Custom agent stored in S3';
    } else if (catalogAgent.agent_type === 'builtin') {
      return `Built-in ${catalogAgent.category} agent`;
    } else if (catalogAgent.agent_type === 'hybrid') {
      return 'Hybrid agent created with AgentHub builder';
    } else if (catalogAgent.agent_type === 'marketplace') {
      return 'Published marketplace agent';
    }
    return catalogAgent.description || 'Agent purpose not specified';
  }

  /**
   * Get agent capabilities from tags and type
   */
  private getAgentCapabilities(catalogAgent: any): string[] {
    const capabilities: string[] = [];
    
    // Add capabilities based on agent type
    if (catalogAgent.agent_type === 'builtin') {
      capabilities.push('Production Ready', 'Optimized Performance');
    } else if (catalogAgent.agent_type === 's3_custom') {
      capabilities.push('Custom Logic', 'S3 Storage');
    } else if (catalogAgent.agent_type === 'hybrid') {
      capabilities.push('Hybrid Architecture', 'Custom Built');
    } else if (catalogAgent.agent_type === 'marketplace') {
      capabilities.push('Community Verified', 'Marketplace');
    }

    // Add capabilities based on category
    switch (catalogAgent.category?.toLowerCase()) {
      case 'security':
        capabilities.push('Vulnerability Scanning', 'Security Analysis');
        break;
      case 'qa':
        capabilities.push('Test Generation', 'Quality Assurance');
        break;
      case 'finops':
        capabilities.push('Cost Analysis', 'Resource Optimization');
        break;
      case 'development':
        capabilities.push('Code Analysis', 'Development Tools');
        break;
      case 'documentation':
        capabilities.push('Documentation Generation', 'API Documentation');
        break;
      case 'database':
        capabilities.push('Schema Management', 'Migration Tools');
        break;
      case 'monitoring':
        capabilities.push('Performance Monitoring', 'Alerting');
        break;
    }

    // Add tags as capabilities
    if (catalogAgent.tags && Array.isArray(catalogAgent.tags)) {
      capabilities.push(...catalogAgent.tags.map((tag: string) => 
        tag.charAt(0).toUpperCase() + tag.slice(1)
      ));
    }

    // Remove duplicates and return
    return Array.from(new Set(capabilities));
  }

  /**
   * Update an existing agent
   */
  async updateAgent(updatedAgent: any): Promise<void> {
    try {
      console.log('🔄 Updating agent:', updatedAgent.id);
      
      // Update agent through S3 API endpoint
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:3002'}/api/v1/agents/s3/${updatedAgent.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedAgent),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update agent: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Agent updated successfully:', result);
      
      // Clear metrics cache to force refresh
      this.metricsCache.delete(updatedAgent.id);
      this.lastCacheUpdate = 0;
      
    } catch (error) {
      console.error('❌ Error updating agent:', error);
      throw error;
    }
  }

  /**
   * Initialize the service
   */
  constructor() {
    this.loadExecutionHistory();
    this.loadHealthCache();
    
    // Generate some sample execution data for demonstration
    this.generateSampleData();
  }

  /**
   * Reset and regenerate sample data
   */
  public resetSampleData(): void {
    this.executionHistory.clear();
    this.metricsCache.clear();
    this.healthCache.clear();
    localStorage.removeItem('agentExecutionHistory');
    localStorage.removeItem('agentHealthCache');
    this.generateSampleData();
  }

  /**
   * Generate sample execution data for demonstration
   */
  private generateSampleData(): void {
    // Only generate if no data exists
    if (this.executionHistory.size === 0) {
      // Generate sample data for all common agent types
      const sampleAgentIds = [
        'custom_1761766361776_6hfgi0h74', // Your code review agent
        'qe-test-generator-v2',
        'security-scanner',
        'qa-assistant', 
        'finops-analyzer',
        'devops-monitor-v1'
      ];

      sampleAgentIds.forEach(agentId => {
        const executions = [];
        const now = new Date();
        
        // Different performance profiles for different agent types
        let successRate = 0.96; // Default 96% success rate
        let maxExecutionTime = 3000; // Default max 3 seconds
        
        if (['security-scanner', 'qa-assistant', 'finops-analyzer'].includes(agentId)) {
          successRate = 0.98; // Built-in agents should be very reliable
          maxExecutionTime = 2000; // Fast execution
        } else if (agentId.startsWith('custom_')) {
          successRate = 0.94; // Custom agents might be slightly less reliable
          maxExecutionTime = 4000;
        }
        
        // Generate 50 sample executions over the last 30 days
        for (let i = 0; i < 50; i++) {
          const daysAgo = Math.floor(Math.random() * 30);
          const timestamp = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
          const success = Math.random() < successRate;
          const executionTime = Math.floor(Math.random() * maxExecutionTime) + 500; // 0.5s to maxExecutionTime
          
          executions.push({
            timestamp: timestamp.toISOString(),
            success,
            executionTime,
            error: success ? undefined : 'Sample error for demonstration'
          });
        }
        
        this.executionHistory.set(agentId, executions);
      });
      
      this.saveExecutionHistory();
    }
  }
}

export const agentManagementService = new AgentManagementService();
export default agentManagementService;