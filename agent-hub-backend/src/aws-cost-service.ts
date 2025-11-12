// AWS Cost Service - Real cost tracking using AWS Cost Explorer API
import AWS from 'aws-sdk';

// Check if AWS credentials are configured
const isAWSConfigured = () => {
  // Check environment variables first, then fall back to AWS CLI credentials
  return !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) || 
         !!(process.env.AWS_PROFILE || process.env.AWS_DEFAULT_PROFILE) ||
         // AWS SDK will automatically use credentials from ~/.aws/credentials
         true; // Let AWS SDK handle credential detection
};

// Configure AWS SDK only if credentials are available
let costExplorer: AWS.CostExplorer | null = null;
let cloudWatch: AWS.CloudWatch | null = null;

if (isAWSConfigured()) {
  try {
    costExplorer = new AWS.CostExplorer({
      region: process.env.AWS_REGION || 'us-east-1'
    });

    cloudWatch = new AWS.CloudWatch({
      region: process.env.AWS_REGION || 'us-east-1'
    });
    
    console.log('✅ AWS Cost Explorer and CloudWatch configured');
  } catch (error) {
    console.error('❌ Failed to configure AWS services:', error);
  }
} else {
  console.log('⚠️  AWS credentials not configured - FinOps will show zero costs');
}

// In-memory tracking for model usage (in production, use a database)
interface ModelUsageRecord {
  timestamp: Date;
  agentId: string;
  agentName: string;
  modelId: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
}

const modelUsageHistory: ModelUsageRecord[] = [];

// Model configurations from Bedrock config
const MODEL_CONFIGS = {
  'anthropic.claude-3-haiku-20240307-v1:0': {
    name: 'Claude 3 Haiku',
    costPer1MTokens: { input: 0.25, output: 1.25 }
  },
  'anthropic.claude-3-5-sonnet-20241022-v2:0': {
    name: 'Claude 3.5 Sonnet',
    costPer1MTokens: { input: 3.00, output: 15.00 }
  },
  'amazon.titan-text-express-v1': {
    name: 'Amazon Titan Text Express',
    costPer1MTokens: { input: 0.80, output: 0.80 }
  }
};

// Agent-to-model mapping from Bedrock config
const AGENT_MODEL_MAP = {
  'test-generator': 'anthropic.claude-3-haiku-20240307-v1:0',
  'security-scanner': 'anthropic.claude-3-5-sonnet-20241022-v2:0',
  'code-quality': 'anthropic.claude-3-haiku-20240307-v1:0',
  'documentation-generator': 'amazon.titan-text-express-v1',
  'failure-analyzer': 'anthropic.claude-3-5-sonnet-20241022-v2:0'
};

interface ModelCostBreakdown {
  modelId: string;
  modelName: string;
  cost: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  executionCount: number;
  avgCostPerExecution: number;
  agents: Array<{
    agentId: string;
    agentName: string;
    executionCount: number;
    cost: number;
    tokens: number;
  }>;
}

interface AWSCostData {
  totalCost: number;
  budgetUtilization: number;
  activeAlerts: number;
  serviceBreakdown: {
    bedrock: number;
    s3: number;
    lambda: number;
    compute: number;
  };
  dailyCosts: Array<{
    date: string;
    cost: number;
  }>;
  projectedMonthlyCost: number;
  modelBreakdown: ModelCostBreakdown[];
}

export async function getRealAWSCosts(): Promise<AWSCostData> {
  // If AWS is not configured, return zero costs
  if (!isAWSConfigured() || !costExplorer) {
    console.log('📊 AWS not configured - returning zero costs');
    return {
      totalCost: 0,
      budgetUtilization: 0,
      activeAlerts: 0,
      serviceBreakdown: {
        bedrock: 0,
        s3: 0,
        lambda: 0,
        compute: 0
      },
      dailyCosts: [],
      projectedMonthlyCost: 0,
      modelBreakdown: []
    };
  }

  try {
    // Get cost data for the last 30 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const costParams = {
      TimePeriod: {
        Start: startDate.toISOString().split('T')[0],
        End: endDate.toISOString().split('T')[0]
      },
      Granularity: 'DAILY',
      Metrics: ['BlendedCost'],
      GroupBy: [
        {
          Type: 'DIMENSION',
          Key: 'SERVICE'
        }
      ]
    };

    // Get cost and usage data
    const costData = await costExplorer.getCostAndUsage(costParams).promise();
    
    // Process the cost data
    const serviceBreakdown = {
      bedrock: 0,
      s3: 0,
      lambda: 0,
      compute: 0
    };

    let totalCost = 0;
    const dailyCosts: Array<{ date: string; cost: number }> = [];

    if (costData.ResultsByTime) {
      for (const result of costData.ResultsByTime) {
        const dayTotal = parseFloat(result.Total?.BlendedCost?.Amount || '0');
        totalCost += dayTotal;
        
        dailyCosts.push({
          date: result.TimePeriod?.Start || '',
          cost: dayTotal
        });

        // Process service breakdown
        if (result.Groups) {
          for (const group of result.Groups) {
            const serviceName = group.Keys?.[0] || '';
            const serviceCost = parseFloat(group.Metrics?.BlendedCost?.Amount || '0');
            
            if (serviceName.toLowerCase().includes('bedrock')) {
              serviceBreakdown.bedrock += serviceCost;
            } else if (serviceName.toLowerCase().includes('s3')) {
              serviceBreakdown.s3 += serviceCost;
            } else if (serviceName.toLowerCase().includes('lambda')) {
              serviceBreakdown.lambda += serviceCost;
            } else if (serviceName.toLowerCase().includes('ec2') || serviceName.toLowerCase().includes('compute')) {
              serviceBreakdown.compute += serviceCost;
            }
          }
        }
      }
    }

    // Calculate projected monthly cost
    const avgDailyCost = totalCost / 30;
    const projectedMonthlyCost = avgDailyCost * 30;

    // Get budget utilization (if budgets are configured)
    const budgetUtilization = await getBudgetUtilization(projectedMonthlyCost);

    // Get active CloudWatch alarms
    const activeAlerts = await getActiveAlerts();

    // Add sample data if no real usage exists (for demonstration)
    if (modelUsageHistory.length === 0) {
      addSampleModelUsage();
    }

    // Calculate model-specific breakdown
    const modelBreakdown = calculateModelBreakdown();

    return {
      totalCost,
      budgetUtilization,
      activeAlerts,
      serviceBreakdown,
      dailyCosts,
      projectedMonthlyCost,
      modelBreakdown
    };

  } catch (error) {
    console.error('Error fetching AWS costs:', error);
    
    // Return zero costs if no real data available
    return {
      totalCost: 0,
      budgetUtilization: 0,
      activeAlerts: 0,
      serviceBreakdown: {
        bedrock: 0,
        s3: 0,
        lambda: 0,
        compute: 0
      },
      dailyCosts: [],
      projectedMonthlyCost: 0,
      modelBreakdown: []
    };
  }
}

async function getBudgetUtilization(currentCost: number): Promise<number> {
  try {
    // This would require AWS Budgets API
    // For now, calculate based on a default budget of $1000/month
    const monthlyBudget = parseFloat(process.env.AWS_MONTHLY_BUDGET || '1000');
    return Math.min(100, (currentCost / monthlyBudget) * 100);
  } catch (error) {
    console.error('Error getting budget utilization:', error);
    return 0;
  }
}

async function getActiveAlerts(): Promise<number> {
  if (!cloudWatch) {
    return 0;
  }
  
  try {
    const alarms = await cloudWatch.describeAlarms({
      StateValue: 'ALARM'
    }).promise();
    
    return alarms.MetricAlarms?.length || 0;
  } catch (error) {
    console.error('Error getting CloudWatch alarms:', error);
    return 0;
  }
}

// Track individual agent execution costs
// Calculate model-specific cost breakdown
function calculateModelBreakdown(): ModelCostBreakdown[] {
  const modelStats = new Map<string, {
    cost: number;
    inputTokens: number;
    outputTokens: number;
    executionCount: number;
    agents: Map<string, { agentName: string; executionCount: number; cost: number; tokens: number; }>;
  }>();

  // Process usage history (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  modelUsageHistory
    .filter(record => record.timestamp >= thirtyDaysAgo)
    .forEach(record => {
      if (!modelStats.has(record.modelId)) {
        modelStats.set(record.modelId, {
          cost: 0,
          inputTokens: 0,
          outputTokens: 0,
          executionCount: 0,
          agents: new Map()
        });
      }

      const stats = modelStats.get(record.modelId)!;
      stats.cost += record.cost;
      stats.inputTokens += record.inputTokens;
      stats.outputTokens += record.outputTokens;
      stats.executionCount += 1;

      // Track agent usage
      if (!stats.agents.has(record.agentId)) {
        stats.agents.set(record.agentId, {
          agentName: record.agentName,
          executionCount: 0,
          cost: 0,
          tokens: 0
        });
      }

      const agentStats = stats.agents.get(record.agentId)!;
      agentStats.executionCount += 1;
      agentStats.cost += record.cost;
      agentStats.tokens += record.inputTokens + record.outputTokens;
    });

  // Convert to array format
  return Array.from(modelStats.entries()).map(([modelId, stats]) => ({
    modelId,
    modelName: MODEL_CONFIGS[modelId as keyof typeof MODEL_CONFIGS]?.name || modelId,
    cost: stats.cost,
    inputTokens: stats.inputTokens,
    outputTokens: stats.outputTokens,
    totalTokens: stats.inputTokens + stats.outputTokens,
    executionCount: stats.executionCount,
    avgCostPerExecution: stats.executionCount > 0 ? stats.cost / stats.executionCount : 0,
    agents: Array.from(stats.agents.entries()).map(([agentId, agentStats]) => ({
      agentId,
      agentName: agentStats.agentName,
      executionCount: agentStats.executionCount,
      cost: agentStats.cost,
      tokens: agentStats.tokens
    })).sort((a, b) => b.cost - a.cost) // Sort by cost descending
  })).sort((a, b) => b.cost - a.cost); // Sort by cost descending
}

// Get execution history for analytics
export function getExecutionHistory(): ModelUsageRecord[] {
  return modelUsageHistory.slice(); // Return a copy
}

export async function trackAgentExecution(agentId: string, executionData: {
  duration: number;
  inputTokens: number;
  outputTokens: number;
  model: string;
}) {
  try {
    // Calculate cost based on model pricing
    const modelCosts = {
      'anthropic.claude-3-haiku-20240307-v1:0': { input: 0.25, output: 1.25 },
      'anthropic.claude-3-5-sonnet-20241022-v2:0': { input: 3.00, output: 15.00 },
      'amazon.titan-text-express-v1': { input: 0.80, output: 0.80 }
    };

    const costs = modelCosts[executionData.model as keyof typeof modelCosts] || { input: 1.0, output: 1.0 };
    
    const inputCost = (executionData.inputTokens / 1000000) * costs.input;
    const outputCost = (executionData.outputTokens / 1000000) * costs.output;
    const totalCost = inputCost + outputCost;

    // Send custom metric to CloudWatch only if configured
    if (cloudWatch) {
      await cloudWatch.putMetricData({
        Namespace: 'AgentHub/Costs',
        MetricData: [
          {
            MetricName: 'ExecutionCost',
            Dimensions: [
              {
                Name: 'AgentId',
                Value: agentId
              },
              {
                Name: 'Model',
                Value: executionData.model
              }
            ],
            Value: totalCost,
            Unit: 'None',
            Timestamp: new Date()
          }
        ]
      }).promise();
    }

    // Record usage in our tracking system
    modelUsageHistory.push({
      timestamp: new Date(),
      agentId,
      agentName: agentId, // In production, get real agent name from database
      modelId: executionData.model,
      inputTokens: executionData.inputTokens,
      outputTokens: executionData.outputTokens,
      cost: totalCost
    });

    // Keep only last 1000 records to prevent memory issues
    if (modelUsageHistory.length > 1000) {
      modelUsageHistory.splice(0, modelUsageHistory.length - 1000);
    }

    console.log(`Tracked execution cost for ${agentId}: $${totalCost.toFixed(4)} (${executionData.model})`);
    return totalCost;

  } catch (error) {
    console.error('Error tracking agent execution cost:', error);
    return 0;
  }
}

// Add some sample data for demonstration (remove in production)
export function addSampleModelUsage() {
  const sampleData = [
    {
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      agentId: 'test-generator',
      agentName: 'QE Test Generator',
      modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
      inputTokens: 1500,
      outputTokens: 800,
      cost: 0.0023
    },
    {
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      agentId: 'security-scanner',
      agentName: 'Security Scanner',
      modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
      inputTokens: 2000,
      outputTokens: 1200,
      cost: 0.0240
    },
    {
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
      agentId: 'documentation-generator',
      agentName: 'Documentation Generator',
      modelId: 'amazon.titan-text-express-v1',
      inputTokens: 1000,
      outputTokens: 1500,
      cost: 0.0020
    },
    {
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      agentId: 'test-generator',
      agentName: 'QE Test Generator',
      modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
      inputTokens: 1800,
      outputTokens: 900,
      cost: 0.0027
    },
    {
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      agentId: 'failure-analyzer',
      agentName: 'Failure Analyzer',
      modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
      inputTokens: 2500,
      outputTokens: 1800,
      cost: 0.0345
    }
  ];

  modelUsageHistory.push(...sampleData);
  console.log('📊 Added sample model usage data for demonstration');
}