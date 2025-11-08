# Cost-Optimized AWS Deployment Strategy

## 💰 **Budget Management: $100 AWS Credits**

**Account**: 448049831733  
**Email**: sanjitdikshit83@gmail.com  
**Budget**: $100 AWS Credits  
**Goal**: Maximize development time while minimizing costs

## 🎯 **Cost Optimization Strategy**

### **Phase 1: Local Development First (Cost: $0)**
- Develop and test everything locally using LocalStack
- Use Docker containers for MCP servers
- Mock AWS services for development
- Only deploy to AWS when ready for integration testing

### **Phase 2: Minimal AWS Deployment (Cost: $5-15/month)**
- Deploy only essential services
- Use smallest instance sizes
- Enable auto-shutdown for non-production
- Implement cost monitoring and alerts

### **Phase 3: Full Production (Cost: $20-50/month)**
- Scale up only when needed
- Use reserved instances for predictable workloads
- Implement comprehensive cost optimization

## 🏠 **Local Development Setup**

### **1. LocalStack for AWS Services**
```bash
# Install LocalStack (Free tier)
pip install localstack
pip install awscli-local

# Start LocalStack with essential services
docker run --rm -it \
  -p 4566:4566 \
  -p 4510-4559:4510-4559 \
  -e SERVICES=lambda,dynamodb,s3,apigateway,cognito-idp,events \
  -e DEBUG=1 \
  -e DATA_DIR=/tmp/localstack/data \
  -v /tmp/localstack:/tmp/localstack \
  localstack/localstack
```

### **2. Local Development Environment**
```bash
# Create local development configuration
cat > AWS-Native-Agent-Hub/local-dev.env << 'EOF'
# Local Development Configuration
export AWS_ENDPOINT_URL="http://localhost:4566"
export AWS_ACCESS_KEY_ID="test"
export AWS_SECRET_ACCESS_KEY="test"
export AWS_DEFAULT_REGION="us-east-1"
export ENVIRONMENT="local"

# LocalStack specific
export LOCALSTACK_ENDPOINT="http://localhost:4566"
export USE_LOCALSTACK="true"

# Application settings
export API_BASE_URL="http://localhost:3000"
export FRONTEND_URL="http://localhost:3001"
export BEDROCK_MOCK="true"  # Use mock Bedrock responses
EOF
```

### **3. Docker Compose for Local Development**
```yaml
# AWS-Native-Agent-Hub/docker-compose.local.yml
version: '3.8'
services:
  localstack:
    image: localstack/localstack:latest
    ports:
      - "4566:4566"
      - "4510-4559:4510-4559"
    environment:
      - SERVICES=lambda,dynamodb,s3,apigateway,cognito-idp,events,sqs,sns
      - DEBUG=1
      - DATA_DIR=/tmp/localstack/data
      - LAMBDA_EXECUTOR=docker
      - DOCKER_HOST=unix:///var/run/docker.sock
    volumes:
      - "/tmp/localstack:/tmp/localstack"
      - "/var/run/docker.sock:/var/run/docker.sock"

  mcp-filesystem:
    build: ./mcp-servers/filesystem
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
    volumes:
      - "./test-data:/app/data"

  mcp-git:
    build: ./mcp-servers/git
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=development

  mcp-database:
    build: ./mcp-servers/database
    ports:
      - "3002:3002"
    environment:
      - NODE_ENV=development

  frontend:
    build: ./frontend
    ports:
      - "3003:3000"
    environment:
      - REACT_APP_API_URL=http://localhost:4566
      - REACT_APP_USE_MOCK_DATA=true
    depends_on:
      - localstack
```

### **4. Mock Bedrock Service**
```typescript
// AWS-Native-Agent-Hub/local-services/mock-bedrock.ts
export class MockBedrockService {
  async invokeModel(params: any) {
    // Simulate Bedrock responses locally
    const mockResponses = {
      'claude-3-sonnet': {
        content: [{
          text: JSON.stringify({
            frameworks: ['React', 'Node.js'],
            languages: ['JavaScript', 'TypeScript'],
            capabilities: ['Web Development', 'API Development'],
            confidence: 0.85,
            reasoning: 'Mock analysis for local development'
          })
        }]
      }
    };

    return {
      body: JSON.stringify(mockResponses['claude-3-sonnet'])
    };
  }
}
```

## 💸 **AWS Cost Optimization**

### **1. Minimal AWS Services (Phase 1: $5-10/month)**
```typescript
// infrastructure/lib/cost-optimized-stack.ts
export class CostOptimizedStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Use smallest DynamoDB configuration
    const agentsTable = new dynamodb.Table(this, 'AgentsTable', {
      tableName: 'agent-hub-agents-dev',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // No minimum cost
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Allow deletion
      pointInTimeRecovery: false // Disable for cost savings
    });

    // Minimal Lambda configuration
    const agentFunction = new lambda.Function(this, 'AgentFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('../lambda-functions/agent-crud'),
      memorySize: 128, // Minimum memory
      timeout: cdk.Duration.seconds(10), // Short timeout
      environment: {
        AGENTS_TABLE: agentsTable.tableName
      }
    });

    // Basic API Gateway (no custom domain)
    const api = new apigateway.RestApi(this, 'DevApi', {
      restApiName: 'agent-hub-dev-api',
      description: 'Development API - Cost Optimized'
    });
  }
}
```

### **2. Auto-Shutdown Configuration**
```typescript
// infrastructure/lib/auto-shutdown.ts
export class AutoShutdownConstruct extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Lambda function to shutdown resources
    const shutdownFunction = new lambda.Function(this, 'AutoShutdown', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'shutdown.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async () => {
          // Stop ECS services
          // Scale down Lambda provisioned concurrency
          // Pause non-essential services
          console.log('Auto-shutdown executed');
        };
      `),
      timeout: cdk.Duration.minutes(5)
    });

    // Schedule shutdown at 6 PM EST daily
    new events.Rule(this, 'ShutdownSchedule', {
      schedule: events.Schedule.cron({
        hour: '23', // 6 PM EST = 23 UTC
        minute: '0'
      }),
      targets: [new targets.LambdaFunction(shutdownFunction)]
    });

    // Schedule startup at 9 AM EST daily
    new events.Rule(this, 'StartupSchedule', {
      schedule: events.Schedule.cron({
        hour: '14', // 9 AM EST = 14 UTC
        minute: '0'
      }),
      targets: [new targets.LambdaFunction(shutdownFunction)]
    });
  }
}
```

### **3. Cost Monitoring & Alerts**
```typescript
// infrastructure/lib/cost-monitoring.ts
export class CostMonitoringConstruct extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Budget alert at $50 (50% of credits)
    const budget = new budgets.CfnBudget(this, 'DevelopmentBudget', {
      budget: {
        budgetName: 'agent-hub-development-budget',
        budgetLimit: {
          amount: 50,
          unit: 'USD'
        },
        timeUnit: 'MONTHLY',
        budgetType: 'COST'
      },
      notificationsWithSubscribers: [{
        notification: {
          notificationType: 'ACTUAL',
          comparisonOperator: 'GREATER_THAN',
          threshold: 80 // Alert at 80% of budget
        },
        subscribers: [{
          subscriptionType: 'EMAIL',
          address: 'sanjitdikshit83@gmail.com'
        }]
      }]
    });

    // Daily cost alert Lambda
    const costAlertFunction = new lambda.Function(this, 'CostAlert', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'cost-alert.handler',
      code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const costexplorer = new AWS.CostExplorer();
        
        exports.handler = async () => {
          const params = {
            TimePeriod: {
              Start: new Date(Date.now() - 24*60*60*1000).toISOString().split('T')[0],
              End: new Date().toISOString().split('T')[0]
            },
            Granularity: 'DAILY',
            Metrics: ['BlendedCost']
          };
          
          const result = await costexplorer.getCostAndUsage(params).promise();
          const dailyCost = result.ResultsByTime[0].Total.BlendedCost.Amount;
          
          console.log('Daily AWS Cost:', dailyCost);
          
          if (parseFloat(dailyCost) > 5) {
            // Send alert if daily cost exceeds $5
            console.log('HIGH COST ALERT: Daily cost exceeded $5');
          }
        };
      `),
      timeout: cdk.Duration.seconds(30)
    });

    // Daily cost check
    new events.Rule(this, 'DailyCostCheck', {
      schedule: events.Schedule.rate(cdk.Duration.hours(24)),
      targets: [new targets.LambdaFunction(costAlertFunction)]
    });
  }
}
```

## 📊 **Cost Breakdown Estimates**

### **Local Development (Cost: $0)**
- LocalStack: Free
- Docker containers: Free
- Local development: Free
- **Total: $0/month**

### **Minimal AWS Deployment (Cost: $5-15/month)**
- DynamoDB: $1-3/month (pay-per-request)
- Lambda: $0-2/month (1M requests free tier)
- API Gateway: $1-3/month (1M requests = $3.50)
- S3: $0-1/month (5GB free tier)
- Cognito: $0-2/month (50,000 MAU free)
- CloudWatch: $0-2/month (basic monitoring)
- **Total: $5-15/month**

### **Full Development (Cost: $15-30/month)**
- Add ECS Fargate: $5-10/month (minimal containers)
- Add EventBridge: $1-2/month
- Add SQS/SNS: $0-1/month
- Enhanced monitoring: $2-5/month
- **Total: $15-30/month**

### **Production Ready (Cost: $30-60/month)**
- Scale up resources
- Add redundancy
- Enhanced security
- **Total: $30-60/month**

## 🚀 **Deployment Strategy**

### **Week 1-2: Local Development**
```bash
# Set up local environment
cd AWS-Native-Agent-Hub
source local-dev.env
docker-compose -f docker-compose.local.yml up

# Develop and test locally (Cost: $0)
npm run dev:local
```

### **Week 3: Minimal AWS Deployment**
```bash
# Deploy minimal stack
export AWS_ACCOUNT_ID="448049831733"
export AWS_REGION="us-east-1"
export ENVIRONMENT="dev"
export NOTIFICATION_EMAIL="sanjitdikshit83@gmail.com"
export MONTHLY_BUDGET="50"

./deployment/deploy-minimal.sh
```

### **Week 4+: Gradual Scale-Up**
- Add services incrementally
- Monitor costs daily
- Scale up only when needed

## 💡 **Cost Optimization Tips**

### **1. Use AWS Free Tier**
- Lambda: 1M requests/month free
- DynamoDB: 25GB storage free
- S3: 5GB storage free
- API Gateway: 1M requests free
- Cognito: 50,000 MAU free

### **2. Development Best Practices**
- Use `PAY_PER_REQUEST` billing for DynamoDB
- Set short Lambda timeouts
- Use minimal memory allocations
- Delete unused resources immediately
- Use CloudFormation for easy cleanup

### **3. Monitoring & Alerts**
- Set budget alerts at $25, $50, $75
- Daily cost monitoring
- Resource utilization tracking
- Automatic shutdown of dev resources

### **4. Resource Cleanup**
```bash
# Easy cleanup script
./deployment/cleanup.sh dev  # Removes all dev resources
```

## 📋 **Next Steps**

1. **Start with Local Development**
   ```bash
   cd AWS-Native-Agent-Hub
   ./setup-local-dev.sh
   ```

2. **Request Bedrock Access** (Free, but required)
   - Go to AWS Bedrock console
   - Request access to Claude 3 Haiku (cheapest model)
   - Use for minimal testing only

3. **Deploy Minimal Stack** (When ready)
   ```bash
   ./deployment/deploy-minimal.sh
   ```

4. **Monitor Costs Daily**
   - Check AWS Cost Explorer
   - Review budget alerts
   - Scale down when not in use

**With this strategy, your $100 credits should last 3-6 months of development! 💰**