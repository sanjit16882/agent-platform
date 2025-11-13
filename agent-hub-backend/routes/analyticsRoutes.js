/**
 * Analytics Routes
 * 
 * Provides execution history, analytics, and cost optimization endpoints
 * for agent performance monitoring and recommendations
 */

const express = require('express');
const router = express.Router();
const db = require('../services/database');

/**
 * GET /api/v1/agents/:id/executions
 * 
 * List execution history for a specific agent
 * Supports filtering by execution mode, date range, and status
 */
router.get('/agents/:id/executions', async (req, res) => {
  try {
    const { id: agentId } = req.params;
    const {
      execution_mode,
      status,
      start_date,
      end_date,
      limit = 50,
      offset = 0
    } = req.query;

    // Build query with filters
    let query = `
      SELECT 
        id,
        agent_id,
        execution_mode,
        status,
        started_at,
        completed_at,
        duration_ms,
        documents_retrieved,
        tools_invoked,
        llm_cost,
        vector_db_cost,
        mcp_cost,
        total_cost,
        llm_latency_ms,
        vector_db_latency_ms,
        mcp_latency_ms,
        input_tokens,
        output_tokens,
        error_message,
        metadata
      FROM agent_execution_logs
      WHERE agent_id = ?
    `;
    
    const params = [agentId];

    // Add filters
    if (execution_mode) {
      query += ' AND execution_mode = ?';
      params.push(execution_mode);
    }

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (start_date) {
      query += ' AND started_at >= ?';
      params.push(start_date);
    }

    if (end_date) {
      query += ' AND started_at <= ?';
      params.push(end_date);
    }

    // Order by most recent first
    query += ' ORDER BY started_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const executions = await db.query(query, params);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM agent_execution_logs WHERE agent_id = ?';
    const countParams = [agentId];
    
    if (execution_mode) {
      countQuery += ' AND execution_mode = ?';
      countParams.push(execution_mode);
    }
    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }
    if (start_date) {
      countQuery += ' AND started_at >= ?';
      countParams.push(start_date);
    }
    if (end_date) {
      countQuery += ' AND started_at <= ?';
      countParams.push(end_date);
    }

    const [{ total }] = await db.query(countQuery, countParams);

    res.json({
      success: true,
      data: {
        executions: executions.map(exec => ({
          ...exec,
          metadata: exec.metadata ? JSON.parse(exec.metadata) : null
        })),
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: (parseInt(offset) + executions.length) < total
        }
      }
    });

  } catch (error) {
    console.error('❌ Error fetching execution history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch execution history',
      details: error.message
    });
  }
});

/**
 * GET /api/v1/agents/:id/analytics
 * 
 * Return comprehensive analytics for a specific agent
 * Includes execution mode distribution, cost breakdown, latency, and success rates
 */
router.get('/agents/:id/analytics', async (req, res) => {
  try {
    const { id: agentId } = req.params;
    const { days = 30 } = req.query;

    const dateFilter = `started_at >= datetime('now', '-${days} days')`;

    // Execution mode distribution
    const modeDistribution = await db.query(`
      SELECT 
        execution_mode,
        COUNT(*) as count,
        ROUND(AVG(duration_ms), 2) as avg_duration_ms,
        ROUND(AVG(total_cost), 6) as avg_cost
      FROM agent_execution_logs
      WHERE agent_id = ? AND ${dateFilter}
      GROUP BY execution_mode
    `, [agentId]);

    // Cost breakdown by mode
    const costBreakdown = await db.query(`
      SELECT 
        execution_mode,
        ROUND(SUM(llm_cost), 6) as total_llm_cost,
        ROUND(SUM(vector_db_cost), 6) as total_vector_db_cost,
        ROUND(SUM(mcp_cost), 6) as total_mcp_cost,
        ROUND(SUM(total_cost), 6) as total_cost,
        COUNT(*) as execution_count
      FROM agent_execution_logs
      WHERE agent_id = ? AND ${dateFilter}
      GROUP BY execution_mode
    `, [agentId]);

    // Latency breakdown by mode
    const latencyBreakdown = await db.query(`
      SELECT 
        execution_mode,
        ROUND(AVG(llm_latency_ms), 2) as avg_llm_latency,
        ROUND(AVG(vector_db_latency_ms), 2) as avg_vector_db_latency,
        ROUND(AVG(mcp_latency_ms), 2) as avg_mcp_latency,
        ROUND(AVG(duration_ms), 2) as avg_total_latency,
        ROUND(MAX(duration_ms), 2) as max_latency,
        ROUND(MIN(duration_ms), 2) as min_latency
      FROM agent_execution_logs
      WHERE agent_id = ? AND ${dateFilter}
      GROUP BY execution_mode
    `, [agentId]);

    // Success rates by mode
    const successRates = await db.query(`
      SELECT 
        execution_mode,
        COUNT(*) as total_executions,
        SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful_executions,
        SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as failed_executions,
        ROUND(
          (SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) * 100.0) / COUNT(*),
          2
        ) as success_rate
      FROM agent_execution_logs
      WHERE agent_id = ? AND ${dateFilter}
      GROUP BY execution_mode
    `, [agentId]);

    // Overall statistics
    const overallStats = await db.query(`
      SELECT 
        COUNT(*) as total_executions,
        SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful_executions,
        ROUND(AVG(duration_ms), 2) as avg_duration_ms,
        ROUND(SUM(total_cost), 6) as total_cost,
        ROUND(AVG(total_cost), 6) as avg_cost_per_execution,
        ROUND(AVG(documents_retrieved), 2) as avg_documents_retrieved,
        ROUND(AVG(tools_invoked), 2) as avg_tools_invoked
      FROM agent_execution_logs
      WHERE agent_id = ? AND ${dateFilter}
    `, [agentId]);

    // Daily trend (last 30 days)
    const dailyTrend = await db.query(`
      SELECT 
        DATE(started_at) as date,
        COUNT(*) as executions,
        SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful,
        ROUND(AVG(duration_ms), 2) as avg_duration,
        ROUND(SUM(total_cost), 6) as total_cost
      FROM agent_execution_logs
      WHERE agent_id = ? AND ${dateFilter}
      GROUP BY DATE(started_at)
      ORDER BY date ASC
    `, [agentId]);

    res.json({
      success: true,
      data: {
        agent_id: agentId,
        period_days: parseInt(days),
        overall: overallStats[0] || {},
        execution_mode_distribution: modeDistribution,
        cost_breakdown: costBreakdown,
        latency_breakdown: latencyBreakdown,
        success_rates: successRates,
        daily_trend: dailyTrend
      }
    });

  } catch (error) {
    console.error('❌ Error fetching agent analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch agent analytics',
      details: error.message
    });
  }
});

/**
 * GET /api/v1/analytics/vector-db
 * 
 * Return Vector DB usage statistics across all agents
 */
router.get('/analytics/vector-db', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const dateFilter = `started_at >= datetime('now', '-${days} days')`;

    // Overall Vector DB usage
    const overallStats = await db.query(`
      SELECT 
        COUNT(*) as total_rag_executions,
        ROUND(AVG(documents_retrieved), 2) as avg_documents_retrieved,
        ROUND(AVG(vector_db_latency_ms), 2) as avg_search_latency_ms,
        ROUND(MAX(vector_db_latency_ms), 2) as max_search_latency_ms,
        ROUND(MIN(vector_db_latency_ms), 2) as min_search_latency_ms,
        ROUND(SUM(vector_db_cost), 6) as total_vector_db_cost,
        ROUND(AVG(vector_db_cost), 6) as avg_cost_per_search
      FROM agent_execution_logs
      WHERE (execution_mode = 'rag' OR execution_mode = 'full-stack')
        AND ${dateFilter}
    `);

    // Vector DB usage by agent
    const usageByAgent = await db.query(`
      SELECT 
        agent_id,
        COUNT(*) as rag_executions,
        ROUND(AVG(documents_retrieved), 2) as avg_documents,
        ROUND(AVG(vector_db_latency_ms), 2) as avg_latency_ms,
        ROUND(SUM(vector_db_cost), 6) as total_cost
      FROM agent_execution_logs
      WHERE (execution_mode = 'rag' OR execution_mode = 'full-stack')
        AND ${dateFilter}
      GROUP BY agent_id
      ORDER BY rag_executions DESC
      LIMIT 20
    `);

    // Knowledge base usage (if metadata contains kb info)
    const kbUsage = await db.query(`
      SELECT 
        json_extract(metadata, '$.knowledge_base_id') as kb_id,
        COUNT(*) as usage_count,
        ROUND(AVG(documents_retrieved), 2) as avg_documents_retrieved
      FROM agent_execution_logs
      WHERE (execution_mode = 'rag' OR execution_mode = 'full-stack')
        AND ${dateFilter}
        AND metadata IS NOT NULL
        AND json_extract(metadata, '$.knowledge_base_id') IS NOT NULL
      GROUP BY kb_id
      ORDER BY usage_count DESC
    `);

    // Cache hit rate (simulated - would need actual cache tracking)
    const cacheHitRate = 0; // Placeholder for future implementation

    res.json({
      success: true,
      data: {
        period_days: parseInt(days),
        overall: overallStats[0] || {},
        usage_by_agent: usageByAgent,
        knowledge_base_usage: kbUsage,
        cache_hit_rate: cacheHitRate,
        note: 'Cache hit rate tracking not yet implemented'
      }
    });

  } catch (error) {
    console.error('❌ Error fetching Vector DB analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Vector DB analytics',
      details: error.message
    });
  }
});

/**
 * GET /api/v1/analytics/cost-optimization
 * 
 * Analyze agent execution patterns and generate cost optimization recommendations
 */
router.get('/analytics/cost-optimization', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const dateFilter = `started_at >= datetime('now', '-${days} days')`;

    // Find high-cost agents
    const highCostAgents = await db.query(`
      SELECT 
        agent_id,
        COUNT(*) as total_executions,
        ROUND(SUM(total_cost), 6) as total_cost,
        ROUND(AVG(total_cost), 6) as avg_cost_per_execution,
        execution_mode,
        ROUND(AVG(duration_ms), 2) as avg_duration_ms
      FROM agent_execution_logs
      WHERE ${dateFilter}
      GROUP BY agent_id, execution_mode
      HAVING total_cost > 1.0
      ORDER BY total_cost DESC
      LIMIT 10
    `);

    // Analyze execution mode efficiency
    const modeEfficiency = await db.query(`
      SELECT 
        execution_mode,
        COUNT(*) as executions,
        ROUND(AVG(total_cost), 6) as avg_cost,
        ROUND(AVG(duration_ms), 2) as avg_latency,
        SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as success_rate
      FROM agent_execution_logs
      WHERE ${dateFilter}
      GROUP BY execution_mode
    `);

    // Generate recommendations
    const recommendations = [];

    // Recommendation 1: Identify agents that could use simpler execution modes
    for (const agent of highCostAgents) {
      if (agent.execution_mode === 'full-stack' && agent.avg_cost_per_execution > 0.01) {
        const potentialSavings = agent.total_cost * 0.3; // Estimate 30% savings
        recommendations.push({
          type: 'execution_mode_optimization',
          priority: 'high',
          agent_id: agent.agent_id,
          current_mode: agent.execution_mode,
          suggested_mode: 'rag',
          reason: 'Agent uses full-stack mode but may not need all MCP tools',
          current_cost: agent.total_cost,
          estimated_savings: parseFloat(potentialSavings.toFixed(6)),
          impact: 'high'
        });
      }

      if (agent.execution_mode === 'rag' && agent.avg_duration_ms > 2000) {
        recommendations.push({
          type: 'vector_db_optimization',
          priority: 'medium',
          agent_id: agent.agent_id,
          reason: 'High Vector DB latency detected',
          current_latency: agent.avg_duration_ms,
          suggested_action: 'Reduce topK parameter or optimize knowledge base',
          estimated_improvement: '30-40% latency reduction',
          impact: 'medium'
        });
      }
    }

    // Recommendation 2: Identify underutilized Vector DB
    const ragStats = await db.query(`
      SELECT 
        agent_id,
        COUNT(*) as executions,
        ROUND(AVG(documents_retrieved), 2) as avg_docs
      FROM agent_execution_logs
      WHERE execution_mode IN ('rag', 'full-stack')
        AND ${dateFilter}
      GROUP BY agent_id
      HAVING avg_docs < 2
    `);

    for (const agent of ragStats) {
      recommendations.push({
        type: 'vector_db_underutilization',
        priority: 'low',
        agent_id: agent.agent_id,
        reason: 'Vector DB enabled but retrieving few documents',
        avg_documents_retrieved: agent.avg_docs,
        suggested_action: 'Consider disabling Vector DB or improving knowledge base content',
        estimated_savings: 0.001 * agent.executions,
        impact: 'low'
      });
    }

    // Recommendation 3: Token optimization
    const highTokenAgents = await db.query(`
      SELECT 
        agent_id,
        ROUND(AVG(input_tokens + output_tokens), 0) as avg_total_tokens,
        COUNT(*) as executions,
        ROUND(SUM(llm_cost), 6) as total_llm_cost
      FROM agent_execution_logs
      WHERE ${dateFilter}
        AND (input_tokens + output_tokens) > 5000
      GROUP BY agent_id
      ORDER BY avg_total_tokens DESC
      LIMIT 5
    `);

    for (const agent of highTokenAgents) {
      const potentialSavings = agent.total_llm_cost * 0.2; // Estimate 20% savings
      recommendations.push({
        type: 'token_optimization',
        priority: 'medium',
        agent_id: agent.agent_id,
        reason: 'High token usage detected',
        avg_tokens: agent.avg_total_tokens,
        suggested_action: 'Optimize prompts, reduce context length, or use smaller model',
        current_cost: agent.total_llm_cost,
        estimated_savings: parseFloat(potentialSavings.toFixed(6)),
        impact: 'medium'
      });
    }

    // Calculate total potential savings
    const totalPotentialSavings = recommendations.reduce(
      (sum, rec) => sum + (rec.estimated_savings || 0),
      0
    );

    // Sort recommendations by priority and impact
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    recommendations.sort((a, b) => {
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    res.json({
      success: true,
      data: {
        period_days: parseInt(days),
        high_cost_agents: highCostAgents,
        execution_mode_efficiency: modeEfficiency,
        recommendations: recommendations,
        summary: {
          total_recommendations: recommendations.length,
          high_priority: recommendations.filter(r => r.priority === 'high').length,
          medium_priority: recommendations.filter(r => r.priority === 'medium').length,
          low_priority: recommendations.filter(r => r.priority === 'low').length,
          total_potential_savings: parseFloat(totalPotentialSavings.toFixed(6))
        }
      }
    });

  } catch (error) {
    console.error('❌ Error generating cost optimization recommendations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate cost optimization recommendations',
      details: error.message
    });
  }
});

module.exports = router;
