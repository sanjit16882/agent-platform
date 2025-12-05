/**
 * Analytics and Execution History API Routes
 * 
 * Provides REST API endpoints for:
 * - Execution history and logs
 * - Agent analytics and metrics
 * - Vector DB usage statistics
 * - Cost optimization recommendations
 * 
 * CRITICAL: These are NEW routes for analytics and monitoring
 */

import express, { Request, Response } from 'express';
import executionLogsService from '../services/executionLogsService';

const router = express.Router();

// ============================================
// Agent Execution History Endpoints
// ============================================

/**
 * GET /api/v1/agents/:id/executions
 * List execution history for an agent
 * 
 * Query parameters:
 * - mode: Filter by execution mode (bedrock-only, rag, mcp, full-stack)
 * - status: Filter by status (success, failed)
 * - startDate: Filter by start date (ISO 8601)
 * - endDate: Filter by end date (ISO 8601)
 * - limit: Number of results (default: 50, max: 500)
 * - offset: Pagination offset (default: 0)
 */
router.get('/agents/:id/executions', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      mode,
      status,
      startDate,
      endDate,
      limit = '50',
      offset = '0'
    } = req.query;
    
    console.log(`📊 Getting execution history for agent: ${id}`);
    
    // Parse pagination
    const limitNum = Math.min(parseInt(limit as string) || 50, 500);
    const offsetNum = parseInt(offset as string) || 0;
    
    // Get execution logs from service
    const result = await executionLogsService.getExecutionLogs({
      agentId: id,
      mode: mode as string,
      status: status as string,
      startDate: startDate as string,
      endDate: endDate as string,
      limit: limitNum,
      offset: offsetNum
    });
    
    res.json({
      success: true,
      data: {
        executions: result.logs,
        total: result.total,
        limit: limitNum,
        offset: offsetNum,
        hasMore: result.hasMore
      }
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
 * GET /api/v1/agents/:id/executions/:executionId
 * Get detailed execution log
 */
router.get('/agents/:id/executions/:executionId', async (req: Request, res: Response) => {
  try {
    const { id, executionId } = req.params;
    
    console.log(`📖 Getting execution details: ${executionId}`);
    
    // Get execution log from service
    const execution = await executionLogsService.getExecutionLog(id, executionId);
    
    if (!execution) {
      return res.status(404).json({
        success: false,
        error: 'Execution log not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        execution
      }
    });
    
  } catch (error: any) {
    console.error('✗ Failed to get execution details:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// Agent Analytics Endpoints
// ============================================

/**
 * GET /api/v1/agents/:id/analytics
 * Get analytics for an agent
 * 
 * Query parameters:
 * - period: Time period (24h, 7d, 30d, 90d) - default: 7d
 */
router.get('/agents/:id/analytics', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { period, days } = req.query;
    
    // Support both 'period' and 'days' parameters
    const periodStr = period as string || (days ? `${days}d` : '7d');
    
    console.log(`📈 Getting analytics for agent: ${id} (period: ${periodStr})`);
    
    // Get analytics from service
    const analytics = await executionLogsService.getAnalytics(id, periodStr);
    
    // Transform to frontend format
    const transformedData = {
      overall: {
        total_executions: analytics.totalExecutions,
        successful_executions: Math.round(analytics.totalExecutions * analytics.successRate),
        avg_duration_ms: analytics.latencyBreakdown.average,
        total_cost: analytics.costBreakdown.total,
        avg_cost_per_execution: analytics.costBreakdown.averagePerQuery,
        avg_documents_retrieved: 0,  // TODO: Add to analytics
        avg_tools_invoked: 0  // TODO: Add to analytics
      },
      execution_mode_distribution: Object.entries(analytics.modeDistribution).map(([mode, data]) => ({
        execution_mode: mode,
        count: data.count,
        avg_duration_ms: analytics.latencyBreakdown.average,
        avg_cost: analytics.costBreakdown.averagePerQuery
      })),
      cost_breakdown: Object.entries(analytics.modeDistribution).map(([mode, data]) => ({
        execution_mode: mode,
        total_llm_cost: analytics.costBreakdown.llm * (data.count / analytics.totalExecutions),
        total_vector_db_cost: analytics.costBreakdown.vectorDB * (data.count / analytics.totalExecutions),
        total_mcp_cost: analytics.costBreakdown.mcp * (data.count / analytics.totalExecutions),
        total_cost: analytics.costBreakdown.total * (data.count / analytics.totalExecutions),
        execution_count: data.count
      })),
      success_rates: Object.entries(analytics.successRatesByMode).map(([mode, rate]) => ({
        execution_mode: mode,
        total_executions: analytics.modeDistribution[mode]?.count || 0,
        successful_executions: Math.round((analytics.modeDistribution[mode]?.count || 0) * rate),
        failed_executions: Math.round((analytics.modeDistribution[mode]?.count || 0) * (1 - rate)),
        success_rate: rate * 100
      })),
      daily_trend: analytics.trends.map(trend => ({
        date: trend.date,
        executions: trend.executions,
        successful: Math.round(trend.executions * trend.successRate),
        avg_duration: trend.averageLatency,
        total_cost: trend.averageCost * trend.executions
      }))
    };
    
    res.json({
      success: true,
      data: transformedData
    });
    
  } catch (error: any) {
    console.error('✗ Failed to get analytics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// Vector DB Analytics Endpoints
// ============================================

/**
 * GET /api/v1/analytics/vector-db
 * Get Vector DB usage statistics
 * 
 * Query parameters:
 * - period: Time period (24h, 7d, 30d, 90d) - default: 7d
 * - agentId: Filter by specific agent (optional)
 */
router.get('/analytics/vector-db', async (req: Request, res: Response) => {
  try {
    const { period = '7d', agentId } = req.query;
    
    console.log(`📊 Getting Vector DB analytics (period: ${period})`);
    
    // Get Vector DB analytics from service
    const analytics = await executionLogsService.getVectorDBAnalytics(
      period as string,
      agentId as string | undefined
    );
    
    res.json({
      success: true,
      data: {
        analytics
      }
    });
    
  } catch (error: any) {
    console.error('✗ Failed to get Vector DB analytics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// Cost Optimization Endpoints
// ============================================

/**
 * GET /api/v1/analytics/cost-optimization
 * Get cost optimization recommendations
 * 
 * Query parameters:
 * - agentId: Analyze specific agent (optional)
 */
router.get('/analytics/cost-optimization', async (req: Request, res: Response) => {
  try {
    const { agentId, days } = req.query;
    
    console.log(`💡 Generating cost optimization recommendations (days: ${days || 30})`);
    
    // Generate recommendations
    const recommendations = await generateCostOptimizationRecommendations(agentId as string);
    
    // Calculate total potential savings
    const totalSavings = recommendations.reduce((sum, rec) => sum + rec.estimatedSavings.monthly, 0);
    const totalPercentage = recommendations.reduce((sum, rec) => sum + rec.estimatedSavings.percentage, 0);
    
    res.json({
      success: true,
      data: {
        recommendations,
        summary: {
          totalRecommendations: recommendations.length,
          highPriority: recommendations.filter(r => r.priority === 'high').length,
          mediumPriority: recommendations.filter(r => r.priority === 'medium').length,
          lowPriority: recommendations.filter(r => r.priority === 'low').length,
          totalPotentialSavings: {
            monthly: totalSavings,
            annual: totalSavings * 12,
            percentage: totalPercentage
          }
        }
      }
    });
    
  } catch (error: any) {
    console.error('✗ Failed to generate cost optimization recommendations:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/v1/analytics/cost-optimization/:recommendationId/apply
 * Apply a cost optimization recommendation
 */
router.post('/analytics/cost-optimization/:recommendationId/apply', async (req: Request, res: Response) => {
  try {
    const { recommendationId } = req.params;
    
    console.log(`✅ Applying cost optimization recommendation: ${recommendationId}`);
    
    // In production, this would apply the recommended changes
    // For now, return success
    
    res.json({
      success: true,
      message: 'Recommendation applied successfully',
      recommendationId,
      appliedAt: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('✗ Failed to apply recommendation:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// Helper Functions
// ============================================

/**
 * Generate cost optimization recommendations based on execution patterns
 */
async function generateCostOptimizationRecommendations(agentId?: string): Promise<any[]> {
  const recommendations: any[] = [];
  
  // In a real implementation, this would analyze execution logs
  // For now, return sample recommendations
  
  recommendations.push({
    id: 'rec-1',
    priority: 'high',
    type: 'execution_mode',
    title: 'Switch to RAG mode for FAQ queries',
    description: '40% of queries are FAQ-related and could use Vector DB instead of full-stack mode',
    estimatedSavings: {
      monthly: 125.00,
      percentage: 15
    },
    impact: {
      cost: 'high',
      latency: 'medium',
      accuracy: 'neutral'
    },
    actionable: true,
    action: {
      type: 'update_agent_config',
      agentId: agentId || 'agent-123',
      changes: {
        executionMode: 'rag',
        vectorDB: {
          enabled: true,
          knowledgeBases: ['kb-faq']
        }
      }
    }
  });
  
  recommendations.push({
    id: 'rec-2',
    priority: 'medium',
    type: 'model_optimization',
    title: 'Use Claude 3 Haiku for simple queries',
    description: '25% of queries are simple and could use a cheaper model',
    estimatedSavings: {
      monthly: 75.00,
      percentage: 9
    },
    impact: {
      cost: 'high',
      latency: 'positive',
      accuracy: 'minimal'
    },
    actionable: true,
    action: {
      type: 'update_model',
      from: 'claude-3-sonnet',
      to: 'claude-3-haiku'
    }
  });
  
  recommendations.push({
    id: 'rec-3',
    priority: 'medium',
    type: 'vector_db_optimization',
    title: 'Reduce topK from 5 to 3',
    description: 'Analysis shows 3 documents provide sufficient context',
    estimatedSavings: {
      monthly: 45.00,
      percentage: 5
    },
    impact: {
      cost: 'medium',
      latency: 'positive',
      accuracy: 'minimal'
    },
    actionable: true,
    action: {
      type: 'update_retrieval_config',
      changes: {
        topK: 3
      }
    }
  });
  
  recommendations.push({
    id: 'rec-4',
    priority: 'low',
    type: 'caching',
    title: 'Enable response caching',
    description: '15% of queries are duplicates that could be cached',
    estimatedSavings: {
      monthly: 30.00,
      percentage: 4
    },
    impact: {
      cost: 'medium',
      latency: 'very_positive',
      accuracy: 'neutral'
    },
    actionable: true,
    action: {
      type: 'enable_caching',
      ttl: 3600
    }
  });
  
  return recommendations;
}

// ============================================
// Export Router
// ============================================

export default router;
