/**
 * Analytics and Execution History Routes
 * 
 * Provides endpoints for:
 * - Execution history tracking
 * - Analytics and metrics
 * - Cost optimization recommendations
 * - Performance insights
 * 
 * CRITICAL: These are NEW routes for the modular agent builder
 */

import express, { Request, Response } from 'express';

const router = express.Router();

// In-memory storage for execution logs (in production, this would be in database)
const executionLogs: Map<string, any[]> = new Map();

// ============================================
// Execution History Endpoints
// ============================================

/**
 * GET /api/v1/agents/:id/executions
 * Get execution history for an agent
 */
router.get('/:id/executions', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      mode,
      startDate,
      endDate,
      limit = '50',
      offset = '0'
    } = req.query;
    
    console.log(`📋 Getting execution history for agent: ${id}`);
    
    // Get executions for this agent
    let executions = executionLogs.get(id) || [];
    
    // Filter by mode if specified
    if (mode) {
      executions = executions.filter(e => e.mode === mode);
    }
    
    // Filter by date range if specified
    if (startDate) {
      executions = executions.filter(e => 
        new Date(e.startedAt) >= new Date(startDate as string)
      );
    }
    
    if (endDate) {
      executions = executions.filter(e => 
        new Date(e.startedAt) <= new Date(endDate as string)
      );
    }
    
    // Calculate aggregates
    const aggregates = calculateAggregates(executions);
    
    // Pagination
    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);
    const paginatedExecutions = executions.slice(offsetNum, offsetNum + limitNum);
    
    res.json({
      success: true,
      executions: paginatedExecutions,
      total: executions.length,
      limit: limitNum,
      offset: offsetNum,
      aggregates
    });
    
  } catch (error: any) {
    console.error('✗ Failed to get execution history:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/v1/agents/:id/executions
 * Log an execution (internal use)
 */
router.post('/:id/executions', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const executionData = req.body;
    
    console.log(`📝 Logging execution for agent: ${id}`);
    
    // Get or create execution log array
    if (!executionLogs.has(id)) {
      executionLogs.set(id, []);
    }
    
    const logs = executionLogs.get(id)!;
    
    // Add execution log
    const executionLog = {
      id: `exec-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      agentId: id,
      ...executionData,
      startedAt: executionData.startedAt || new Date().toISOString(),
      completedAt: executionData.completedAt || new Date().toISOString()
    };
    
    logs.push(executionLog);
    
    // Keep only last 1000 executions per agent
    if (logs.length > 1000) {
      logs.shift();
    }
    
    res.status(201).json({
      success: true,
      execution: executionLog
    });
    
  } catch (error: any) {
    console.error('✗ Failed to log execution:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// Analytics Endpoints
// ============================================

/**
 * GET /api/v1/agents/:id/analytics
 * Get analytics for an agent
 */
router.get('/:id/analytics', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { timeRange = '7d' } = req.query;
    
    console.log(`📊 Getting analytics for agent: ${id} (${timeRange})`);
    
    // Get executions for this agent
    const executions = executionLogs.get(id) || [];
    
    // Filter by time range
    const filteredExecutions = filterByTimeRange(executions, timeRange as string);
    
    // Calculate analytics
    const analytics = {
      // Execution mode distribution
      modeDistribution: calculateModeDistribution(filteredExecutions),
      
      // Cost breakdown by mode
      costByMode: calculateCostByMode(filteredExecutions),
      
      // Latency by mode
      latencyByMode: calculateLatencyByMode(filteredExecutions),
      
      // Success rates by mode
      successRateByMode: calculateSuccessRateByMode(filteredExecutions),
      
      // Vector DB metrics
      vectorDBMetrics: calculateVectorDBMetrics(filteredExecutions),
      
      // MCP metrics
      mcpMetrics: calculateMCPMetrics(filteredExecutions),
      
      // Overall metrics
      overall: {
        totalExecutions: filteredExecutions.length,
        successRate: calculateOverallSuccessRate(filteredExecutions),
        avgLatency: calculateAvgLatency(filteredExecutions),
        totalCost: calculateTotalCost(filteredExecutions)
      }
    };
    
    res.json({
      success: true,
      analytics,
      timeRange
    });
    
  } catch (error: any) {
    console.error('✗ Failed to get analytics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/v1/analytics/vector-db
 * Get Vector DB usage statistics
 */
router.get('/vector-db', async (req: Request, res: Response) => {
  try {
    console.log('📊 Getting Vector DB analytics');
    
    // Aggregate across all agents
    let allExecutions: any[] = [];
    for (const logs of executionLogs.values()) {
      allExecutions = allExecutions.concat(logs);
    }
    
    // Filter executions that used Vector DB
    const vectorDBExecutions = allExecutions.filter(e => 
      e.mode === 'rag' || e.mode === 'full-stack'
    );
    
    const metrics = {
      totalSearches: vectorDBExecutions.length,
      avgDocumentsRetrieved: calculateAvg(
        vectorDBExecutions.map(e => e.metadata?.documentsRetrieved || 0)
      ),
      avgSearchLatency: calculateAvg(
        vectorDBExecutions.map(e => e.metadata?.vectorSearchLatency || 0)
      ),
      totalCost: vectorDBExecutions.reduce((sum, e) => sum + (e.cost?.vectorDB || 0), 0),
      cacheHitRate: 0.75  // Placeholder
    };
    
    res.json({
      success: true,
      metrics
    });
    
  } catch (error: any) {
    console.error('✗ Failed to get Vector DB analytics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/v1/analytics/cost-optimization
 * Get cost optimization recommendations
 */
router.get('/cost-optimization', async (req: Request, res: Response) => {
  try {
    console.log('💡 Generating cost optimization recommendations');
    
    const recommendations: any[] = [];
    
    // Analyze each agent
    for (const [agentId, logs] of executionLogs.entries()) {
      const recentLogs = logs.slice(-100);  // Last 100 executions
      
      // Check Vector DB usage
      const vectorDBUsage = recentLogs.filter(e => 
        e.mode === 'rag' || e.mode === 'full-stack'
      ).length / recentLogs.length;
      
      if (vectorDBUsage < 0.3 && vectorDBUsage > 0) {
        recommendations.push({
          agentId,
          type: 'disable-vector-db',
          priority: 'high',
          message: `Vector DB is rarely used (${(vectorDBUsage * 100).toFixed(0)}%). Consider disabling to save costs.`,
          estimatedSavings: calculateVectorDBSavings(recentLogs),
          currentCost: calculateAgentCost(recentLogs)
        });
      }
      
      // Check MCP usage
      const mcpUsage = recentLogs.filter(e => 
        e.mode === 'mcp' || e.mode === 'full-stack'
      ).length / recentLogs.length;
      
      if (mcpUsage < 0.2 && mcpUsage > 0) {
        recommendations.push({
          agentId,
          type: 'disable-mcp',
          priority: 'medium',
          message: `MCP tools are rarely used (${(mcpUsage * 100).toFixed(0)}%). Consider disabling to save costs.`,
          estimatedSavings: calculateMCPSavings(recentLogs),
          currentCost: calculateAgentCost(recentLogs)
        });
      }
      
      // Check model optimization
      const avgComplexity = calculateQueryComplexity(recentLogs);
      if (avgComplexity < 0.5) {
        recommendations.push({
          agentId,
          type: 'downgrade-model',
          priority: 'medium',
          message: 'Queries are simple. Consider using Claude Haiku instead of Sonnet.',
          estimatedSavings: calculateModelSavings(recentLogs),
          currentCost: calculateAgentCost(recentLogs)
        });
      }
    }
    
    // Sort by estimated savings
    recommendations.sort((a, b) => b.estimatedSavings - a.estimatedSavings);
    
    res.json({
      success: true,
      recommendations,
      totalPotentialSavings: recommendations.reduce((sum, r) => sum + r.estimatedSavings, 0)
    });
    
  } catch (error: any) {
    console.error('✗ Failed to generate recommendations:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/v1/analytics/trends
 * Get performance trends over time
 */
router.get('/trends', async (req: Request, res: Response) => {
  try {
    const { timeRange = '30d', metric = 'latency' } = req.query;
    
    console.log(`📈 Getting trends for ${metric} over ${timeRange}`);
    
    // Aggregate all executions
    let allExecutions: any[] = [];
    for (const logs of executionLogs.values()) {
      allExecutions = allExecutions.concat(logs);
    }
    
    // Filter by time range
    const filteredExecutions = filterByTimeRange(allExecutions, timeRange as string);
    
    // Group by day
    const trendData = groupByDay(filteredExecutions, metric as string);
    
    res.json({
      success: true,
      metric,
      timeRange,
      data: trendData
    });
    
  } catch (error: any) {
    console.error('✗ Failed to get trends:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// Helper Functions
// ============================================

function calculateAggregates(executions: any[]) {
  if (executions.length === 0) {
    return {
      totalCost: 0,
      avgLatency: 0,
      successRate: 0
    };
  }
  
  return {
    totalCost: executions.reduce((sum, e) => sum + (e.cost?.total || 0), 0),
    avgLatency: calculateAvg(executions.map(e => e.latency || 0)),
    successRate: executions.filter(e => e.success).length / executions.length
  };
}

function calculateModeDistribution(executions: any[]) {
  const distribution: any = {
    'bedrock-only': 0,
    'rag': 0,
    'mcp': 0,
    'full-stack': 0
  };
  
  executions.forEach(e => {
    if (distribution[e.mode] !== undefined) {
      distribution[e.mode]++;
    }
  });
  
  return distribution;
}

function calculateCostByMode(executions: any[]) {
  const costByMode: any = {
    'bedrock-only': 0,
    'rag': 0,
    'mcp': 0,
    'full-stack': 0
  };
  
  executions.forEach(e => {
    if (costByMode[e.mode] !== undefined) {
      costByMode[e.mode] += e.cost?.total || 0;
    }
  });
  
  return costByMode;
}

function calculateLatencyByMode(executions: any[]) {
  const latencyByMode: any = {};
  const countByMode: any = {};
  
  executions.forEach(e => {
    if (!latencyByMode[e.mode]) {
      latencyByMode[e.mode] = 0;
      countByMode[e.mode] = 0;
    }
    latencyByMode[e.mode] += e.latency || 0;
    countByMode[e.mode]++;
  });
  
  // Calculate averages
  for (const mode in latencyByMode) {
    latencyByMode[mode] = latencyByMode[mode] / countByMode[mode];
  }
  
  return latencyByMode;
}

function calculateSuccessRateByMode(executions: any[]) {
  const successByMode: any = {};
  const totalByMode: any = {};
  
  executions.forEach(e => {
    if (!successByMode[e.mode]) {
      successByMode[e.mode] = 0;
      totalByMode[e.mode] = 0;
    }
    if (e.success) successByMode[e.mode]++;
    totalByMode[e.mode]++;
  });
  
  // Calculate rates
  const rates: any = {};
  for (const mode in successByMode) {
    rates[mode] = successByMode[mode] / totalByMode[mode];
  }
  
  return rates;
}

function calculateVectorDBMetrics(executions: any[]) {
  const vectorDBExecutions = executions.filter(e => 
    e.mode === 'rag' || e.mode === 'full-stack'
  );
  
  if (vectorDBExecutions.length === 0) {
    return {
      avgDocumentsRetrieved: 0,
      avgSearchLatency: 0,
      cacheHitRate: 0
    };
  }
  
  return {
    avgDocumentsRetrieved: calculateAvg(
      vectorDBExecutions.map(e => e.metadata?.documentsRetrieved || 0)
    ),
    avgSearchLatency: calculateAvg(
      vectorDBExecutions.map(e => e.metadata?.vectorSearchLatency || 0)
    ),
    cacheHitRate: 0.75  // Placeholder
  };
}

function calculateMCPMetrics(executions: any[]) {
  const mcpExecutions = executions.filter(e => 
    e.mode === 'mcp' || e.mode === 'full-stack'
  );
  
  if (mcpExecutions.length === 0) {
    return {
      avgToolsInvoked: 0,
      avgToolLatency: 0,
      toolSuccessRate: 0
    };
  }
  
  return {
    avgToolsInvoked: calculateAvg(
      mcpExecutions.map(e => e.metadata?.toolsInvoked || 0)
    ),
    avgToolLatency: 500,  // Placeholder
    toolSuccessRate: 0.95  // Placeholder
  };
}

function calculateOverallSuccessRate(executions: any[]) {
  if (executions.length === 0) return 0;
  return executions.filter(e => e.success).length / executions.length;
}

function calculateAvgLatency(executions: any[]) {
  return calculateAvg(executions.map(e => e.latency || 0));
}

function calculateTotalCost(executions: any[]) {
  return executions.reduce((sum, e) => sum + (e.cost?.total || 0), 0);
}

function calculateAvg(numbers: number[]) {
  if (numbers.length === 0) return 0;
  return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
}

function filterByTimeRange(executions: any[], timeRange: string) {
  const now = new Date();
  const days = parseInt(timeRange.replace('d', ''));
  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  
  return executions.filter(e => 
    new Date(e.startedAt) >= cutoff
  );
}

function groupByDay(executions: any[], metric: string) {
  const grouped: any = {};
  
  executions.forEach(e => {
    const date = new Date(e.startedAt).toISOString().split('T')[0];
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(e);
  });
  
  // Calculate metric for each day
  const result: any[] = [];
  for (const date in grouped) {
    const dayExecutions = grouped[date];
    let value = 0;
    
    if (metric === 'latency') {
      value = calculateAvgLatency(dayExecutions);
    } else if (metric === 'cost') {
      value = calculateTotalCost(dayExecutions);
    } else if (metric === 'count') {
      value = dayExecutions.length;
    }
    
    result.push({ date, value });
  }
  
  return result.sort((a, b) => a.date.localeCompare(b.date));
}

function calculateVectorDBSavings(logs: any[]) {
  const vectorDBLogs = logs.filter(e => e.mode === 'rag' || e.mode === 'full-stack');
  return vectorDBLogs.reduce((sum, e) => sum + (e.cost?.vectorDB || 0), 0) * 0.7;
}

function calculateMCPSavings(logs: any[]) {
  const mcpLogs = logs.filter(e => e.mode === 'mcp' || e.mode === 'full-stack');
  return mcpLogs.reduce((sum, e) => sum + (e.cost?.mcp || 0), 0) * 0.8;
}

function calculateModelSavings(logs: any[]) {
  return logs.reduce((sum, e) => sum + (e.cost?.llm || 0), 0) * 0.4;
}

function calculateAgentCost(logs: any[]) {
  return logs.reduce((sum, e) => sum + (e.cost?.total || 0), 0);
}

function calculateQueryComplexity(logs: any[]) {
  // Placeholder: would analyze query length, tokens, etc.
  return 0.4;
}

// ============================================
// Export Router
// ============================================

export default router;
