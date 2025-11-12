import express from 'express';
import { getRealAWSCosts, trackAgentExecution, getExecutionHistory } from '../aws-cost-service';

const router = express.Router();

/**
 * @route GET /api/v1/finops/dashboard
 * @desc Get real AWS cost data for FinOps dashboard
 * @access Private
 */
router.get('/dashboard', async (req, res) => {
  try {
    console.log('📊 FinOps Dashboard: Fetching real AWS costs...');
    
    const costData = await getRealAWSCosts();
    
    // Transform the data to match frontend expectations
    const services = [
      {
        name: 'AWS Bedrock (AI)',
        provider: 'AWS',
        monthlyCost: costData.serviceBreakdown.bedrock,
        monthlyProjection: costData.serviceBreakdown.bedrock * 30,
        costSavings: 0,
        trend: 'stable',
        usage: `${costData.modelBreakdown.reduce((sum, m) => sum + m.executionCount, 0)} API Calls`,
        description: 'Real AWS Bedrock AI model costs'
      },
      {
        name: 'AWS S3 Storage',
        provider: 'AWS',
        monthlyCost: costData.serviceBreakdown.s3,
        monthlyProjection: costData.serviceBreakdown.s3 * 30,
        costSavings: 0,
        trend: 'stable',
        usage: 'Agent Storage',
        description: 'Real AWS S3 storage costs'
      },
      {
        name: 'AWS Lambda',
        provider: 'AWS',
        monthlyCost: costData.serviceBreakdown.lambda,
        monthlyProjection: costData.serviceBreakdown.lambda * 30,
        costSavings: 0,
        trend: 'stable',
        usage: 'Serverless Functions',
        description: 'Real AWS Lambda execution costs'
      },
      {
        name: 'Compute Resources',
        provider: 'AWS',
        monthlyCost: costData.serviceBreakdown.compute,
        monthlyProjection: costData.serviceBreakdown.compute * 30,
        costSavings: 0,
        trend: 'stable',
        usage: 'EC2/ECS',
        description: 'Real AWS compute costs'
      }
    ];

    const response = {
      success: true,
      data: {
        totalCost: costData.totalCost,
        budgetUtilization: costData.budgetUtilization,
        activeAlerts: costData.activeAlerts,
        projectedMonthlyCost: costData.projectedMonthlyCost,
        serviceBreakdown: costData.serviceBreakdown,
        services,
        modelBreakdown: costData.modelBreakdown,
        dailyCosts: costData.dailyCosts,
        lastUpdated: new Date().toISOString()
      }
    };

    console.log('✅ FinOps Dashboard: Returning real AWS cost data');
    res.json(response);
  } catch (error) {
    console.error('❌ FinOps Dashboard Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch AWS cost data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /api/v1/finops/execution-history
 * @desc Get model execution history for cost tracking
 * @access Private
 */
router.get('/execution-history', async (req, res) => {
  try {
    const history = getExecutionHistory();
    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Error fetching execution history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch execution history'
    });
  }
});

/**
 * @route POST /api/v1/finops/track-execution
 * @desc Track agent execution for cost calculation
 * @access Private
 */
router.post('/track-execution', async (req, res) => {
  try {
    const { agentId, duration, inputTokens, outputTokens, model } = req.body;
    
    if (!agentId || !model) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: agentId, model'
      });
    }

    const cost = await trackAgentExecution(agentId, {
      duration: duration || 0,
      inputTokens: inputTokens || 0,
      outputTokens: outputTokens || 0,
      model
    });

    res.json({
      success: true,
      data: {
        cost,
        message: 'Execution tracked successfully'
      }
    });
  } catch (error) {
    console.error('Error tracking execution:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track execution'
    });
  }
});

export default router;
