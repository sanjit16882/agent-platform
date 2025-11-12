const { CostExplorerClient, GetCostAndUsageCommand, GetDimensionValuesCommand } = require('@aws-sdk/client-cost-explorer');
const { fromEnv, fromIni } = require('@aws-sdk/credential-providers');

class AWSCostService {
  constructor() {
    this.client = null;
    this.isConfigured = false;
    this.initializeClient();
  }

  async initializeClient() {
    try {
      // Try to initialize AWS client with credentials (env vars, AWS CLI, or IAM roles)
      // The SDK will automatically try: env vars -> AWS CLI config -> IAM roles
      this.client = new CostExplorerClient({
        region: process.env.AWS_REGION || 'us-east-1'
        // Credentials will be automatically loaded by AWS SDK
      });
      
      // Test the connection
      await this.testConnection();
      this.isConfigured = true;
      console.log('✅ AWS Cost Explorer client initialized successfully');
      console.log('✅ Using AWS Account:', process.env.AWS_ACCOUNT_ID || 'auto-detected');
    } catch (error) {
      console.log('⚠️ AWS Cost Explorer not configured:', error.message);
      console.log('⚠️ Error details:', error);
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
      
      // Option 1: Fetch last N days
      if (daysBack > 0) {
        startDate.setDate(startDate.getDate() - daysBack);
      } else {
        // Option 2: Fetch current month only
        startDate.setDate(1); // First day of current month
      }
      
      console.log(`📅 Fetching costs from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);

      // Get cost and usage data
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
      
      // Log the raw response for debugging
      console.log('📊 Cost Explorer Response:', JSON.stringify({
        resultCount: costResponse.ResultsByTime?.length || 0,
        hasGroups: costResponse.ResultsByTime?.[0]?.Groups?.length || 0,
        dateRange: {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0]
        },
        sampleResult: costResponse.ResultsByTime?.[0] ? {
          date: costResponse.ResultsByTime[0].TimePeriod?.Start,
          groupCount: costResponse.ResultsByTime[0].Groups?.length,
          firstGroup: costResponse.ResultsByTime[0].Groups?.[0]
        } : null
      }, null, 2));
      
      // Process the response
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

    console.log('🔍 Processing Cost Explorer data...');
    console.log('📊 Total time periods:', costResponse.ResultsByTime?.length || 0);

    // Process results by time period
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

    console.log('💰 Total Cost Calculated:', totalCost);
    console.log('📊 Services with costs:', Object.keys(services).filter(s => services[s].totalCost > 0));
    
    // Log detailed breakdown
    Object.keys(services).filter(s => services[s].totalCost > 0).forEach(serviceName => {
      console.log(`   - ${serviceName}: $${services[serviceName].totalCost.toFixed(4)}`);
    });

    // Calculate projections and format data
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const daysSoFar = new Date().getDate();
    const projectedMonthlyCost = (totalCost / daysSoFar) * daysInMonth;

    // Get all AWS services from your actual account (both with costs and without costs)
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

    // Format services for frontend - include all services, showing real costs or $0.00
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

    // Sort by cost (services with costs first, then alphabetically)
    formattedServices.sort((a, b) => {
      if (a.monthlyCost > 0 && b.monthlyCost === 0) return -1;
      if (a.monthlyCost === 0 && b.monthlyCost > 0) return 1;
      if (a.monthlyCost > 0 && b.monthlyCost > 0) return b.monthlyCost - a.monthlyCost;
      return a.name.localeCompare(b.name);
    });

    return {
      totalCost: Math.round(totalCost * 100) / 100,
      dailyAverage: Math.round((totalCost / daysSoFar) * 100) / 100,
      monthlyBudget: 5000, // This could be fetched from AWS Budgets API
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
        costSavingsOpportunity: 0, // Would need additional analysis
        roiPercentage: 150 // Would need business metrics
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
    // This would ideally come from usage metrics
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

  // Get AWS account information
  async getAccountInfo() {
    if (!this.isConfigured) {
      return { configured: false, message: 'AWS credentials not configured' };
    }

    try {
      // This would use STS to get account info
      return {
        configured: true,
        region: process.env.AWS_REGION || 'us-east-1',
        message: 'Connected to AWS Cost Explorer'
      };
    } catch (error) {
      return { configured: false, message: error.message };
    }
  }
}

module.exports = new AWSCostService();