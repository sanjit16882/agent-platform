const { CostExplorerClient, GetCostAndUsageCommand, GetDimensionValuesCommand } = require('@aws-sdk/client-cost-explorer');

class AWSCostService {
  constructor() {
    this.client = null;
    this.isConfigured = false;
    this.initializeClient();
  }

  async initializeClient() {
    try {
      this.client = new CostExplorerClient({
        region: process.env.AWS_REGION || 'us-east-1'
      });
      
      await this.testConnection();
      this.isConfigured = true;
      console.log('✅ AWS Cost Explorer client initialized successfully');
    } catch (error) {
      console.log('⚠️ AWS Cost Explorer not configured:', error.message);
      this.isConfigured = false;
    }
  }

  async testConnection() {
    if (!this.client) throw new Error('AWS client not initialized');
    
    const testCommand = new GetDimensionValuesCommand({
      TimePeriod: {
        Start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        End: new Date().toISOString().split('T')[0]
      },
      Dimension: 'SERVICE'
    });
    
    await this.client.send(testCommand);
  }

  async getRealCostData(daysBack = 30) {
    if (!this.isConfigured || !this.client) {
      throw new Error('AWS Cost Explorer not configured. Please set up AWS credentials.');
    }

    try {
      const endDate = new Date();
      const startDate = new Date();
      
      if (daysBack > 0) {
        startDate.setDate(startDate.getDate() - daysBack);
      } else {
        startDate.setDate(1);
      }
      
      console.log(`📅 Fetching costs from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);

      const costCommand = new GetCostAndUsageCommand({
        TimePeriod: {
          Start: startDate.toISOString().split('T')[0],
          End: endDate.toISOString().split('T')[0]
        },
        Granularity: 'DAILY',
        Metrics: ['BlendedCost', 'UsageQuantity'],
        GroupBy: [
          {
            Type: 'DIMENSION',
            Key: 'SERVICE'
          }
        ]
      });

      const costResponse = await this.client.send(costCommand);
      return this.processCostData(costResponse, startDate, endDate);
    } catch (error) {
      console.error('❌ Error fetching real AWS costs:', error);
      throw error;
    }
  }

  processCostData(costResponse, startDate, endDate) {
    const services = {};
    let totalCost = 0;
    const dailyCosts = [];

    costResponse.ResultsByTime.forEach(result => {
      const date = result.TimePeriod.Start;
      let dailyTotal = 0;

      result.Groups.forEach(group => {
        const serviceName = group.Keys[0];
        const cost = parseFloat(group.Metrics.BlendedCost.Amount);
        
        if (!services[serviceName]) {
          services[serviceName] = {
            name: serviceName,
            totalCost: 0,
            dailyCosts: []
          };
        }
        
        services[serviceName].totalCost += cost;
        services[serviceName].dailyCosts.push({ date, cost });
        dailyTotal += cost;
      });

      dailyCosts.push({ date, cost: dailyTotal });
      totalCost += dailyTotal;
    });

    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const daysSoFar = new Date().getDate();
    const projectedMonthlyCost = (totalCost / daysSoFar) * daysInMonth;

    const allAWSServices = [
      'Claude 3 Haiku (Amazon Bedrock Edition)',
      'Amazon Simple Storage Service',
      'AWS Lambda', 
      'Amazon Elastic Compute Cloud - Compute',
      'AmazonCloudWatch',
      'AWS Key Management Service',
      'Amazon Route 53',
      'Amazon Virtual Private Cloud',
      'Amazon API Gateway',
      'Amazon DynamoDB',
      'AWS Secrets Manager',
      'EC2 - Other'
    ];

    const formattedServices = allAWSServices.map(serviceName => {
      const realService = services[serviceName];
      const hasRealCost = realService && realService.totalCost > 0;
      
      return {
        name: this.mapServiceName(serviceName),
        provider: 'AWS',
        dailyCost: hasRealCost ? Math.round((realService.totalCost / daysSoFar) * 100) / 100 : 0.00,
        monthlyCost: hasRealCost ? Math.round(realService.totalCost * 100) / 100 : 0.00,
        monthlyProjection: hasRealCost ? Math.round(((realService.totalCost / daysSoFar) * daysInMonth) * 100) / 100 : 0.00,
        costSavings: 0.00,
        usage: hasRealCost ? this.getUsageInfo(serviceName) : 'No Usage',
        trend: hasRealCost ? this.calculateTrend(realService.dailyCosts) : 'stable',
        description: hasRealCost ? 
          `Real ${this.mapServiceName(serviceName)} costs from AWS` : 
          `${this.mapServiceName(serviceName)} - No current usage or costs`
      };
    });

    formattedServices.sort((a, b) => {
      if (a.monthlyCost > 0 && b.monthlyCost === 0) return -1;
      if (a.monthlyCost === 0 && b.monthlyCost > 0) return 1;
      if (a.monthlyCost > 0 && b.monthlyCost > 0) return b.monthlyCost - a.monthlyCost;
      return a.name.localeCompare(b.name);
    });

    return {
      totalCost: Math.round(totalCost * 100) / 100,
      dailyAverage: Math.round((totalCost / daysSoFar) * 100) / 100,
      monthlyBudget: 5000,
      budgetUtilization: Math.round((totalCost / 5000) * 100 * 100) / 100,
      costTrend: totalCost > 100 ? 'increasing' : 'stable',
      services: formattedServices,
      dailyCosts: dailyCosts.map(day => ({
        date: day.date,
        cost: Math.round(day.cost * 100) / 100
      })),
      summary: {
        totalCost: Math.round(totalCost * 100) / 100,
        projectedMonthly: Math.round(projectedMonthlyCost * 100) / 100,
        budgetRemaining: Math.round((5000 - totalCost) * 100) / 100,
        costSavingsOpportunity: 0,
        roiPercentage: 150
      },
      dataInfo: {
        source: 'AWS Cost Explorer API',
        delay: '24-48 hours',
        note: 'Cost Explorer data may lag behind AWS Billing Console by 1-2 days',
        lastUpdated: new Date().toISOString(),
        dateRange: {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0]
        }
      }
    };
  }

  mapServiceName(awsServiceName) {
    const serviceMap = {
      'Claude 3 Haiku (Amazon Bedrock Edition)': 'AWS Bedrock (Claude 3 Haiku)',
      'Amazon Simple Storage Service': 'AWS S3 Storage',
      'AWS Lambda': 'AWS Lambda',
      'Amazon Elastic Compute Cloud - Compute': 'AWS EC2 (Compute)',
      'AmazonCloudWatch': 'AWS CloudWatch',
      'AWS Key Management Service': 'AWS KMS',
      'Amazon Route 53': 'AWS Route 53',
      'Amazon Virtual Private Cloud': 'AWS VPC',
      'Amazon API Gateway': 'AWS API Gateway',
      'Amazon DynamoDB': 'AWS DynamoDB',
      'AWS Secrets Manager': 'AWS Secrets Manager',
      'EC2 - Other': 'AWS EC2 (Other)'
    };
    
    return serviceMap[awsServiceName] || awsServiceName;
  }

  getUsageInfo(serviceName) {
    const usageMap = {
      'Claude 3 Haiku (Amazon Bedrock Edition)': 'API Calls',
      'Amazon Simple Storage Service': 'Storage',
      'AWS Lambda': 'Invocations',
      'Amazon Elastic Compute Cloud - Compute': 'Instances',
      'AmazonCloudWatch': 'Metrics',
      'AWS Key Management Service': 'Keys',
      'Amazon Route 53': 'DNS Queries',
      'Amazon Virtual Private Cloud': 'Network',
      'Amazon API Gateway': 'API Requests',
      'Amazon DynamoDB': 'Read/Write Units',
      'AWS Secrets Manager': 'Secrets',
      'EC2 - Other': 'Resources'
    };
    
    return usageMap[serviceName] || 'Service';
  }

  calculateTrend(dailyCosts) {
    if (dailyCosts.length < 2) return 'stable';
    
    const recent = dailyCosts.slice(-3).reduce((sum, day) => sum + day.cost, 0) / 3;
    const earlier = dailyCosts.slice(0, 3).reduce((sum, day) => sum + day.cost, 0) / 3;
    
    if (recent > earlier * 1.1) return 'increasing';
    if (recent < earlier * 0.9) return 'decreasing';
    return 'stable';
  }

  async getAccountInfo() {
    if (!this.isConfigured) {
      return { configured: false, message: 'AWS credentials not configured' };
    }

    try {
      return {
        configured: true,
        region: process.env.AWS_REGION || 'us-east-1',
        message: 'Connected to AWS Cost Explorer'
      };
    } catch (error) {
      return { configured: false, message: error.message };
    }
  }

  // ===== AGENT COST ESTIMATION METHODS =====
  
  async getCostEstimate(agentId) {
    const db = require('./database');
    
    try {
      const history = await db.query(
        `SELECT AVG(cost) as avg_cost, COUNT(*) as execution_count
         FROM test_costs 
         WHERE test_id = ?
         LIMIT 10`,
        [agentId]
      );
      
      if (history && history[0] && history[0].execution_count > 0) {
        return {
          agentId,
          estimatedCostPerExecution: history[0].avg_cost,
          basedOnExecutions: history[0].execution_count,
          confidence: 'high'
        };
      }
    } catch (error) {
      console.log('⚠️ Could not fetch historical cost data:', error.message);
    }
    
    return {
      agentId,
      estimatedCostPerExecution: 0.05,
      basedOnExecutions: 0,
      confidence: 'low',
      note: 'Estimate based on typical agent execution costs'
    };
  }

  async saveCostData(costData) {
    const db = require('./database');
    
    try {
      const result = await db.execute(
        `INSERT INTO test_costs (run_id, test_id, model_id, input_tokens, output_tokens, total_tokens, cost)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          costData.executionId || costData.runId,
          costData.agentId || costData.testId,
          costData.modelId || 'unknown',
          costData.inputTokens || 0,
          costData.outputTokens || 0,
          costData.totalTokens || 0,
          costData.cost || 0
        ]
      );
      
      return {
        id: result.lastID,
        saved: true,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Error saving cost data:', error);
      throw error;
    }
  }

  async getCostHistory(agentId, limit = 50) {
    const db = require('./database');
    
    try {
      const history = await db.query(
        `SELECT * FROM test_costs 
         WHERE test_id = ? 
         ORDER BY created_at DESC 
         LIMIT ?`,
        [agentId, limit]
      );
      
      return history || [];
    } catch (error) {
      console.error('❌ Error fetching cost history:', error);
      throw error;
    }
  }

  async getCostAnalytics(startDate, endDate) {
    const db = require('./database');
    
    try {
      const analytics = await db.query(
        `SELECT 
          test_id as agentId,
          model_id as modelId,
          COUNT(*) as executionCount,
          SUM(cost) as totalCost,
          AVG(cost) as avgCost,
          SUM(total_tokens) as totalTokens,
          AVG(total_tokens) as avgTokens
         FROM test_costs
         WHERE created_at >= ? AND created_at <= ?
         GROUP BY test_id, model_id
         ORDER BY totalCost DESC`,
        [startDate || '2024-01-01', endDate || new Date().toISOString()]
      );
      
      return {
        analytics: analytics || [],
        period: { startDate, endDate },
        totalExecutions: analytics.reduce((sum, a) => sum + a.executionCount, 0),
        totalCost: analytics.reduce((sum, a) => sum + a.totalCost, 0)
      };
    } catch (error) {
      console.error('❌ Error fetching cost analytics:', error);
      throw error;
    }
  }
}

module.exports = new AWSCostService();
