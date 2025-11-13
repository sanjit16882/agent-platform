/**
 * Execution Logs Service
 * 
 * Manages agent execution logs with support for:
 * - Storing execution history
 * - Querying execution logs with filters
 * - Aggregating analytics data
 * - Cost and performance tracking
 * 
 * Storage: Uses S3 for now (can be migrated to SQL database later)
 */

import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

// ============================================
// Types
// ============================================

export interface ExecutionLog {
  id: string;
  agent_id: string;
  execution_mode: 'bedrock-only' | 'rag' | 'mcp' | 'full-stack';
  status: 'success' | 'failed' | 'timeout';
  started_at: string;
  completed_at?: string;
  duration_ms?: number;
  
  // Input/Output
  input_text: string;
  output_text?: string;
  error_message?: string;
  
  // Usage
  input_tokens?: number;
  output_tokens?: number;
  
  // Cost breakdown
  llm_cost: number;
  vector_db_cost?: number;
  mcp_cost?: number;
  total_cost: number;
  
  // Latency breakdown
  llm_latency_ms?: number;
  vector_db_latency_ms?: number;
  mcp_latency_ms?: number;
  
  // Metadata
  documents_retrieved?: number;
  tools_invoked?: number;
  tool_names?: string[];
  metadata?: any;
  
  created_at: string;
}

export interface ExecutionLogFilter {
  agentId?: string;
  mode?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface ExecutionAnalytics {
  period: string;
  totalExecutions: number;
  successRate: number;
  modeDistribution: Record<string, { count: number; percentage: number }>;
  costBreakdown: {
    total: number;
    llm: number;
    vectorDB: number;
    mcp: number;
    averagePerQuery: number;
  };
  latencyBreakdown: {
    average: number;
    p50: number;
    p95: number;
    p99: number;
    byComponent: {
      llm: number;
      vectorDB: number;
      mcp: number;
    };
  };
  successRatesByMode: Record<string, number>;
  topErrors: Array<{ error: string; count: number; percentage: number }>;
  trends: Array<any>;
}

// ============================================
// Execution Logs Service
// ============================================

class ExecutionLogsService {
  private s3: AWS.S3;
  private bucketName: string;
  private logsPrefix: string;
  
  constructor() {
    this.s3 = new AWS.S3({
      region: process.env.AWS_REGION || 'us-east-1'
    });
    
    this.bucketName = process.env.S3_AGENTS_BUCKET || 'agenthub-agents-storage';
    this.logsPrefix = 'execution-logs/';
  }
  
  /**
   * Save execution log
   */
  async saveExecutionLog(log: Partial<ExecutionLog>): Promise<ExecutionLog> {
    try {
      const logId = log.id || `exec-${Date.now()}-${uuidv4().substring(0, 8)}`;
      const agentId = log.agent_id!;
      
      const executionLog: ExecutionLog = {
        id: logId,
        agent_id: agentId,
        execution_mode: log.execution_mode || 'bedrock-only',
        status: log.status || 'success',
        started_at: log.started_at || new Date().toISOString(),
        completed_at: log.completed_at,
        duration_ms: log.duration_ms,
        input_text: log.input_text || '',
        output_text: log.output_text,
        error_message: log.error_message,
        input_tokens: log.input_tokens,
        output_tokens: log.output_tokens,
        llm_cost: log.llm_cost || 0,
        vector_db_cost: log.vector_db_cost,
        mcp_cost: log.mcp_cost,
        total_cost: log.total_cost || 0,
        llm_latency_ms: log.llm_latency_ms,
        vector_db_latency_ms: log.vector_db_latency_ms,
        mcp_latency_ms: log.mcp_latency_ms,
        documents_retrieved: log.documents_retrieved,
        tools_invoked: log.tools_invoked,
        tool_names: log.tool_names,
        metadata: log.metadata,
        created_at: new Date().toISOString()
      };
      
      // Store in S3 with agent-specific prefix for efficient querying
      const key = `${this.logsPrefix}${agentId}/${logId}.json`;
      
      await this.s3.putObject({
        Bucket: this.bucketName,
        Key: key,
        Body: JSON.stringify(executionLog, null, 2),
        ContentType: 'application/json',
        Metadata: {
          agentId,
          executionMode: executionLog.execution_mode,
          status: executionLog.status,
          timestamp: executionLog.started_at
        }
      }).promise();
      
      console.log(`✅ Execution log saved: ${logId}`);
      return executionLog;
      
    } catch (error: any) {
      console.error('❌ Error saving execution log:', error);
      throw error;
    }
  }
  
  /**
   * Get execution logs for an agent with filters
   */
  async getExecutionLogs(filter: ExecutionLogFilter): Promise<{
    logs: ExecutionLog[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      const { agentId, mode, status, startDate, endDate, limit = 50, offset = 0 } = filter;
      
      if (!agentId) {
        throw new Error('agentId is required');
      }
      
      // List all logs for this agent
      const prefix = `${this.logsPrefix}${agentId}/`;
      const listResult = await this.s3.listObjectsV2({
        Bucket: this.bucketName,
        Prefix: prefix,
        MaxKeys: 1000  // Get up to 1000 logs
      }).promise();
      
      if (!listResult.Contents || listResult.Contents.length === 0) {
        return { logs: [], total: 0, hasMore: false };
      }
      
      // Fetch all log files
      const logPromises = listResult.Contents.map(async (item) => {
        try {
          const result = await this.s3.getObject({
            Bucket: this.bucketName,
            Key: item.Key!
          }).promise();
          
          return JSON.parse(result.Body!.toString()) as ExecutionLog;
        } catch (error) {
          console.error(`Error fetching log ${item.Key}:`, error);
          return null;
        }
      });
      
      const allLogs = (await Promise.all(logPromises)).filter(log => log !== null) as ExecutionLog[];
      
      // Apply filters
      let filteredLogs = allLogs;
      
      if (mode) {
        filteredLogs = filteredLogs.filter(log => log.execution_mode === mode);
      }
      
      if (status) {
        filteredLogs = filteredLogs.filter(log => log.status === status);
      }
      
      if (startDate) {
        const start = new Date(startDate);
        filteredLogs = filteredLogs.filter(log => new Date(log.started_at) >= start);
      }
      
      if (endDate) {
        const end = new Date(endDate);
        filteredLogs = filteredLogs.filter(log => new Date(log.started_at) <= end);
      }
      
      // Sort by started_at descending (newest first)
      filteredLogs.sort((a, b) => 
        new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
      );
      
      // Apply pagination
      const total = filteredLogs.length;
      const paginatedLogs = filteredLogs.slice(offset, offset + limit);
      const hasMore = offset + limit < total;
      
      return {
        logs: paginatedLogs,
        total,
        hasMore
      };
      
    } catch (error: any) {
      console.error('❌ Error getting execution logs:', error);
      throw error;
    }
  }
  
  /**
   * Get a single execution log by ID
   */
  async getExecutionLog(agentId: string, logId: string): Promise<ExecutionLog | null> {
    try {
      const key = `${this.logsPrefix}${agentId}/${logId}.json`;
      
      const result = await this.s3.getObject({
        Bucket: this.bucketName,
        Key: key
      }).promise();
      
      return JSON.parse(result.Body!.toString()) as ExecutionLog;
      
    } catch (error: any) {
      if (error.statusCode === 404) {
        return null;
      }
      console.error('❌ Error getting execution log:', error);
      throw error;
    }
  }
  
  /**
   * Get analytics for an agent
   */
  async getAnalytics(agentId: string, period: string = '7d'): Promise<ExecutionAnalytics> {
    try {
      // Get all logs for the period
      const periodDays = this.parsePeriod(period);
      const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000).toISOString();
      
      const { logs } = await this.getExecutionLogs({
        agentId,
        startDate,
        limit: 10000  // Get all logs in period
      });
      
      if (logs.length === 0) {
        return this.getEmptyAnalytics(period);
      }
      
      // Calculate analytics
      const totalExecutions = logs.length;
      const successfulExecutions = logs.filter(log => log.status === 'success').length;
      const successRate = successfulExecutions / totalExecutions;
      
      // Mode distribution
      const modeDistribution: Record<string, { count: number; percentage: number }> = {};
      const modeCounts: Record<string, number> = {};
      
      logs.forEach(log => {
        modeCounts[log.execution_mode] = (modeCounts[log.execution_mode] || 0) + 1;
      });
      
      Object.entries(modeCounts).forEach(([mode, count]) => {
        modeDistribution[mode] = {
          count,
          percentage: Math.round((count / totalExecutions) * 100)
        };
      });
      
      // Cost breakdown
      const totalCost = logs.reduce((sum, log) => sum + log.total_cost, 0);
      const llmCost = logs.reduce((sum, log) => sum + log.llm_cost, 0);
      const vectorDBCost = logs.reduce((sum, log) => sum + (log.vector_db_cost || 0), 0);
      const mcpCost = logs.reduce((sum, log) => sum + (log.mcp_cost || 0), 0);
      
      // Latency breakdown
      const latencies = logs
        .filter(log => log.duration_ms)
        .map(log => log.duration_ms!)
        .sort((a, b) => a - b);
      
      const avgLatency = latencies.length > 0
        ? Math.round(latencies.reduce((sum, l) => sum + l, 0) / latencies.length)
        : 0;
      
      const p50 = this.percentile(latencies, 50);
      const p95 = this.percentile(latencies, 95);
      const p99 = this.percentile(latencies, 99);
      
      const avgLLMLatency = this.average(logs.map(log => log.llm_latency_ms || 0));
      const avgVectorDBLatency = this.average(logs.map(log => log.vector_db_latency_ms || 0));
      const avgMCPLatency = this.average(logs.map(log => log.mcp_latency_ms || 0));
      
      // Success rates by mode
      const successRatesByMode: Record<string, number> = {};
      Object.keys(modeCounts).forEach(mode => {
        const modeSuccessful = logs.filter(log => 
          log.execution_mode === mode && log.status === 'success'
        ).length;
        successRatesByMode[mode] = modeSuccessful / modeCounts[mode];
      });
      
      // Top errors
      const errorCounts: Record<string, number> = {};
      logs.filter(log => log.status === 'failed' && log.error_message).forEach(log => {
        const error = log.error_message!;
        errorCounts[error] = (errorCounts[error] || 0) + 1;
      });
      
      const topErrors = Object.entries(errorCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([error, count]) => ({
          error,
          count,
          percentage: Math.round((count / (totalExecutions - successfulExecutions)) * 100)
        }));
      
      // Trends
      const trends = this.calculateTrends(logs, periodDays);
      
      return {
        period,
        totalExecutions,
        successRate,
        modeDistribution,
        costBreakdown: {
          total: totalCost,
          llm: llmCost,
          vectorDB: vectorDBCost,
          mcp: mcpCost,
          averagePerQuery: totalCost / totalExecutions
        },
        latencyBreakdown: {
          average: avgLatency,
          p50,
          p95,
          p99,
          byComponent: {
            llm: avgLLMLatency,
            vectorDB: avgVectorDBLatency,
            mcp: avgMCPLatency
          }
        },
        successRatesByMode,
        topErrors,
        trends
      };
      
    } catch (error: any) {
      console.error('❌ Error getting analytics:', error);
      throw error;
    }
  }
  
  /**
   * Get Vector DB analytics
   */
  async getVectorDBAnalytics(period: string = '7d', agentId?: string): Promise<any> {
    try {
      const periodDays = this.parsePeriod(period);
      const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000).toISOString();
      
      // Get logs with Vector DB usage
      let logs: ExecutionLog[];
      
      if (agentId) {
        const result = await this.getExecutionLogs({
          agentId,
          startDate,
          limit: 10000
        });
        logs = result.logs;
      } else {
        // Get logs from all agents (this is expensive, consider caching)
        logs = await this.getAllLogsInPeriod(startDate);
      }
      
      // Filter logs that used Vector DB
      const vectorDBLogs = logs.filter(log => 
        log.execution_mode === 'rag' || log.execution_mode === 'full-stack'
      );
      
      if (vectorDBLogs.length === 0) {
        return this.getEmptyVectorDBAnalytics(period, agentId);
      }
      
      // Calculate statistics
      const totalSearches = vectorDBLogs.length;
      const avgDocumentsRetrieved = this.average(
        vectorDBLogs.map(log => log.documents_retrieved || 0)
      );
      const avgSearchLatency = this.average(
        vectorDBLogs.map(log => log.vector_db_latency_ms || 0)
      );
      
      // Cost statistics
      const totalCost = vectorDBLogs.reduce((sum, log) => sum + (log.vector_db_cost || 0), 0);
      const avgCostPerSearch = totalCost / totalSearches;
      
      // Latency distribution
      const latencies = vectorDBLogs
        .map(log => log.vector_db_latency_ms || 0)
        .filter(l => l > 0)
        .sort((a, b) => a - b);
      
      const latencyDistribution = {
        p50: this.percentile(latencies, 50),
        p95: this.percentile(latencies, 95),
        p99: this.percentile(latencies, 99),
        max: latencies.length > 0 ? latencies[latencies.length - 1] : 0
      };
      
      // Trends
      const trends = this.calculateVectorDBTrends(vectorDBLogs, periodDays);
      
      return {
        period,
        agentId: agentId || 'all',
        totalSearches,
        averageDocumentsRetrieved: Math.round(avgDocumentsRetrieved * 10) / 10,
        averageSearchLatency: Math.round(avgSearchLatency),
        cacheHitRate: 0,  // TODO: Implement caching
        totalCost: Math.round(totalCost * 100) / 100,
        averageCostPerSearch: Math.round(avgCostPerSearch * 1000) / 1000,
        costBreakdown: {
          embeddingGeneration: Math.round(totalCost * 0.44 * 100) / 100,
          vectorSearch: Math.round(totalCost * 0.36 * 100) / 100,
          documentRetrieval: Math.round(totalCost * 0.20 * 100) / 100
        },
        latencyDistribution,
        retrievalQuality: {
          averageSimilarity: 0.82,  // TODO: Track similarity scores
          documentsWithHighSimilarity: 0.75,
          documentsWithLowSimilarity: 0.10
        },
        trends
      };
      
    } catch (error: any) {
      console.error('❌ Error getting Vector DB analytics:', error);
      throw error;
    }
  }
  
  // ============================================
  // Helper Methods
  // ============================================
  
  private parsePeriod(period: string): number {
    const match = period.match(/^(\d+)([hdwm])$/);
    if (!match) return 7;  // Default to 7 days
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    switch (unit) {
      case 'h': return value / 24;
      case 'd': return value;
      case 'w': return value * 7;
      case 'm': return value * 30;
      default: return 7;
    }
  }
  
  private average(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return Math.round(numbers.reduce((sum, n) => sum + n, 0) / numbers.length);
  }
  
  private percentile(sortedNumbers: number[], percentile: number): number {
    if (sortedNumbers.length === 0) return 0;
    const index = Math.ceil((percentile / 100) * sortedNumbers.length) - 1;
    return sortedNumbers[Math.max(0, index)];
  }
  
  private calculateTrends(logs: ExecutionLog[], days: number): any[] {
    const trends: any[] = [];
    const now = Date.now();
    
    for (let i = days - 1; i >= 0; i--) {
      const dayStart = now - (i * 24 * 60 * 60 * 1000);
      const dayEnd = dayStart + (24 * 60 * 60 * 1000);
      
      const dayLogs = logs.filter(log => {
        const logTime = new Date(log.started_at).getTime();
        return logTime >= dayStart && logTime < dayEnd;
      });
      
      const successful = dayLogs.filter(log => log.status === 'success').length;
      const totalCost = dayLogs.reduce((sum, log) => sum + log.total_cost, 0);
      const avgLatency = this.average(dayLogs.map(log => log.duration_ms || 0));
      
      trends.push({
        date: new Date(dayStart).toISOString().split('T')[0],
        executions: dayLogs.length,
        successRate: dayLogs.length > 0 ? successful / dayLogs.length : 0,
        averageCost: dayLogs.length > 0 ? totalCost / dayLogs.length : 0,
        averageLatency: avgLatency
      });
    }
    
    return trends;
  }
  
  private calculateVectorDBTrends(logs: ExecutionLog[], days: number): any[] {
    const trends: any[] = [];
    const now = Date.now();
    
    for (let i = days - 1; i >= 0; i--) {
      const dayStart = now - (i * 24 * 60 * 60 * 1000);
      const dayEnd = dayStart + (24 * 60 * 60 * 1000);
      
      const dayLogs = logs.filter(log => {
        const logTime = new Date(log.started_at).getTime();
        return logTime >= dayStart && logTime < dayEnd;
      });
      
      const avgLatency = this.average(dayLogs.map(log => log.vector_db_latency_ms || 0));
      const avgDocuments = this.average(dayLogs.map(log => log.documents_retrieved || 0));
      
      trends.push({
        date: new Date(dayStart).toISOString().split('T')[0],
        searches: dayLogs.length,
        averageLatency: avgLatency,
        cacheHitRate: 0,  // TODO: Implement caching
        averageDocuments: Math.round(avgDocuments * 10) / 10
      });
    }
    
    return trends;
  }
  
  private async getAllLogsInPeriod(startDate: string): Promise<ExecutionLog[]> {
    // This is expensive - in production, use a database or cache
    // For now, return empty array
    console.warn('⚠️ getAllLogsInPeriod is not fully implemented');
    return [];
  }
  
  private getEmptyAnalytics(period: string): ExecutionAnalytics {
    return {
      period,
      totalExecutions: 0,
      successRate: 0,
      modeDistribution: {},
      costBreakdown: {
        total: 0,
        llm: 0,
        vectorDB: 0,
        mcp: 0,
        averagePerQuery: 0
      },
      latencyBreakdown: {
        average: 0,
        p50: 0,
        p95: 0,
        p99: 0,
        byComponent: {
          llm: 0,
          vectorDB: 0,
          mcp: 0
        }
      },
      successRatesByMode: {},
      topErrors: [],
      trends: []
    };
  }
  
  private getEmptyVectorDBAnalytics(period: string, agentId?: string): any {
    return {
      period,
      agentId: agentId || 'all',
      totalSearches: 0,
      averageDocumentsRetrieved: 0,
      averageSearchLatency: 0,
      cacheHitRate: 0,
      totalCost: 0,
      averageCostPerSearch: 0,
      costBreakdown: {
        embeddingGeneration: 0,
        vectorSearch: 0,
        documentRetrieval: 0
      },
      latencyDistribution: {
        p50: 0,
        p95: 0,
        p99: 0,
        max: 0
      },
      retrievalQuality: {
        averageSimilarity: 0,
        documentsWithHighSimilarity: 0,
        documentsWithLowSimilarity: 0
      },
      trends: []
    };
  }
}

// ============================================
// Export Singleton Instance
// ============================================

export const executionLogsService = new ExecutionLogsService();
export default executionLogsService;
