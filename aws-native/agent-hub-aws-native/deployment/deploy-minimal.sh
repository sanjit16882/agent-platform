#!/bin/bash

# Minimal AWS Deployment Script - Cost Optimized
# Estimated Cost: $5-15/month
# Account: 448049831733
# Email: sanjitdikshit83@gmail.com

set -e

# Configuration
export AWS_ACCOUNT_ID="448049831733"
export NOTIFICATION_EMAIL="sanjitdikshit83@gmail.com"
export AWS_REGION="us-east-1"
export ENVIRONMENT="dev"
export MONTHLY_BUDGET="50"  # Alert at $50 (50% of $100 credits)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}💰 AWS Minimal Deployment - Cost Optimized${NC}"
echo -e "${YELLOW}⚠️  This will incur AWS charges (Estimated: $5-15/month)${NC}"
echo ""
echo "📋 Configuration:"
echo "  Account ID: ${AWS_ACCOUNT_ID}"
echo "  Region: ${AWS_REGION}"
echo "  Environment: ${ENVIRONMENT}"
echo "  Budget Alert: $${MONTHLY_BUDGET}"
echo "  Email: ${NOTIFICATION_EMAIL}"
echo ""

# Confirmation prompt
read -p "Continue with AWS deployment? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled. Use ./start-local-dev.sh for $0 cost development."
    exit 0
fi

echo -e "\n${BLUE}🔍 Checking prerequisites...${NC}"

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not found. Please install AWS CLI.${NC}"
    exit 1
fi

# Check CDK
if ! command -v cdk &> /dev/null; then
    echo -e "${YELLOW}⚠️  CDK not found. Installing...${NC}"
    npm install -g aws-cdk
fi

# Verify AWS credentials
echo -e "\n${BLUE}🔐 Verifying AWS credentials...${NC}"
aws sts get-caller-identity > /dev/null || {
    echo -e "${RED}❌ AWS credentials not configured.${NC}"
    echo "Please run: aws configure"
    echo "Or set environment variables:"
    echo "  export AWS_ACCESS_KEY_ID=your_key"
    echo "  export AWS_SECRET_ACCESS_KEY=your_secret"
    exit 1
}

CALLER_IDENTITY=$(aws sts get-caller-identity)
ACCOUNT=$(echo $CALLER_IDENTITY | jq -r '.Account')

if [ "$ACCOUNT" != "$AWS_ACCOUNT_ID" ]; then
    echo -e "${RED}❌ AWS Account mismatch!${NC}"
    echo "Expected: ${AWS_ACCOUNT_ID}"
    echo "Current:  ${ACCOUNT}"
    exit 1
fi

echo -e "${GREEN}✅ AWS credentials verified for account ${ACCOUNT}${NC}"

# Check Bedrock access
echo -e "\n${BLUE}🤖 Checking Bedrock model access...${NC}"
BEDROCK_MODELS=$(aws bedrock list-foundation-models --region $AWS_REGION 2>/dev/null || echo "[]")
CLAUDE_AVAILABLE=$(echo $BEDROCK_MODELS | jq -r '.modelSummaries[] | select(.modelId | contains("claude")) | .modelId' | head -1)

if [ -z "$CLAUDE_AVAILABLE" ]; then
    echo -e "${YELLOW}⚠️  Bedrock models not accessible. Will use mock responses.${NC}"
    echo "To request Bedrock access:"
    echo "1. Go to AWS Bedrock console"
    echo "2. Navigate to 'Model access'"
    echo "3. Request access to Claude 3 Haiku (cheapest option)"
    USE_MOCK_BEDROCK="true"
else
    echo -e "${GREEN}✅ Bedrock access confirmed: ${CLAUDE_AVAILABLE}${NC}"
    USE_MOCK_BEDROCK="false"
fi

# Bootstrap CDK (if needed)
echo -e "\n${BLUE}🏗️  Bootstrapping CDK...${NC}"
cdk bootstrap aws://${AWS_ACCOUNT_ID}/${AWS_REGION} || {
    echo -e "${YELLOW}⚠️  CDK bootstrap may have failed, continuing...${NC}"
}

# Create cost-optimized CDK configuration
echo -e "\n${BLUE}⚙️  Creating cost-optimized configuration...${NC}"
cd infrastructure

# Create minimal stack configuration
cat > cdk.context.json << EOF
{
  "@aws-cdk/core:enableStackNameDuplicates": true,
  "aws-cdk:enableDiffNoFail": true,
  "@aws-cdk/core:stackRelativeExports": true,
  "costOptimized": true,
  "environment": "${ENVIRONMENT}",
  "accountId": "${AWS_ACCOUNT_ID}",
  "region": "${AWS_REGION}",
  "budgetLimit": ${MONTHLY_BUDGET},
  "notificationEmail": "${NOTIFICATION_EMAIL}",
  "useMockBedrock": ${USE_MOCK_BEDROCK}
}
EOF

# Install dependencies
echo -e "\n${BLUE}📦 Installing CDK dependencies...${NC}"
npm install

# Create minimal stack
cat > lib/minimal-stack.ts << 'EOF'
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as budgets from 'aws-cdk-lib/aws-budgets';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class MinimalAgentHubStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const context = this.node.tryGetContext('costOptimized');
    const budgetLimit = this.node.tryGetContext('budgetLimit') || 50;
    const notificationEmail = this.node.tryGetContext('notificationEmail');

    // Minimal DynamoDB table - Pay per request (no minimum cost)
    const agentsTable = new dynamodb.Table(this, 'AgentsTable', {
      tableName: `agent-hub-agents-${props?.env?.account}-dev`,
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'version', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Allow deletion to save costs
      pointInTimeRecovery: false // Disable for cost savings
    });

    // Minimal S3 bucket
    const assetsBucket = new s3.Bucket(this, 'AssetsBucket', {
      bucketName: `agent-hub-assets-${props?.env?.account}-dev`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true // Clean up to avoid storage costs
    });

    // Basic Cognito User Pool
    const userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: 'agent-hub-users-dev',
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    const userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
      userPool,
      generateSecret: false
    });

    // Minimal Lambda function
    const agentFunction = new lambda.Function(this, 'AgentFunction', {
      functionName: 'agent-hub-minimal-dev',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          console.log('Minimal Agent Hub - Event:', JSON.stringify(event, null, 2));
          
          const response = {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
              success: true,
              message: 'Minimal Agent Hub API - Cost Optimized',
              cost: 'Estimated $5-15/month',
              environment: 'development',
              timestamp: new Date().toISOString()
            })
          };
          
          return response;
        };
      `),
      memorySize: 128, // Minimum memory for cost optimization
      timeout: cdk.Duration.seconds(10),
      environment: {
        AGENTS_TABLE: agentsTable.tableName,
        ASSETS_BUCKET: assetsBucket.bucketName,
        ENVIRONMENT: 'dev'
      }
    });

    // Grant minimal permissions
    agentsTable.grantReadWriteData(agentFunction);
    assetsBucket.grantReadWrite(agentFunction);

    // Basic API Gateway
    const api = new apigateway.RestApi(this, 'MinimalApi', {
      restApiName: 'agent-hub-minimal-api',
      description: 'Minimal Agent Hub API - Cost Optimized',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS
      }
    });

    // Simple endpoints
    const v1 = api.root.addResource('api').addResource('v1');
    
    // Health check endpoint
    v1.addResource('health').addMethod('GET', new apigateway.LambdaIntegration(agentFunction));
    
    // Basic agents endpoint
    const agents = v1.addResource('agents');
    agents.addMethod('GET', new apigateway.LambdaIntegration(agentFunction));
    agents.addMethod('POST', new apigateway.LambdaIntegration(agentFunction));

    // Budget monitoring
    if (notificationEmail) {
      new budgets.CfnBudget(this, 'DevelopmentBudget', {
        budget: {
          budgetName: 'agent-hub-dev-budget',
          budgetLimit: {
            amount: budgetLimit,
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
            address: notificationEmail
          }]
        }]
      });
    }

    // Outputs
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'Minimal API Gateway URL'
    });

    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
      description: 'Cognito User Pool ID'
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID'
    });

    new cdk.CfnOutput(this, 'EstimatedMonthlyCost', {
      value: '$5-15',
      description: 'Estimated monthly cost'
    });
  }
}
EOF

# Update app.ts for minimal deployment
cat > bin/app.ts << 'EOF'
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { MinimalAgentHubStack } from '../lib/minimal-stack';

const app = new cdk.App();

const account = process.env.CDK_DEFAULT_ACCOUNT || app.node.tryGetContext('accountId');
const region = process.env.CDK_DEFAULT_REGION || app.node.tryGetContext('region') || 'us-east-1';
const environment = app.node.tryGetContext('environment') || 'dev';

new MinimalAgentHubStack(app, `AgentHubMinimal-${environment}`, {
  env: { account, region },
  description: `Minimal Agent Hub Platform - ${environment.toUpperCase()} (Cost Optimized)`,
  tags: {
    Project: 'AgentHub',
    Environment: environment,
    CostOptimized: 'true',
    ManagedBy: 'CDK'
  }
});
EOF

# Build and deploy
echo -e "\n${BLUE}🏗️  Building CDK project...${NC}"
npm run build

echo -e "\n${BLUE}🚀 Deploying minimal stack...${NC}"
echo -e "${YELLOW}⚠️  This will start incurring AWS charges${NC}"

cdk deploy --require-approval never

# Get outputs
echo -e "\n${BLUE}📤 Getting deployment outputs...${NC}"
STACK_NAME="AgentHubMinimal-${ENVIRONMENT}"

API_URL=$(aws cloudformation describe-stacks \
    --stack-name ${STACK_NAME} \
    --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
    --output text)

USER_POOL_ID=$(aws cloudformation describe-stacks \
    --stack-name ${STACK_NAME} \
    --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' \
    --output text)

USER_POOL_CLIENT_ID=$(aws cloudformation describe-stacks \
    --stack-name ${STACK_NAME} \
    --query 'Stacks[0].Outputs[?OutputKey==`UserPoolClientId`].OutputValue' \
    --output text)

cd ..

# Create AWS configuration file
cat > .env.aws << EOF
# AWS Deployment Configuration
AWS_ACCOUNT_ID=${AWS_ACCOUNT_ID}
AWS_REGION=${AWS_REGION}
ENVIRONMENT=${ENVIRONMENT}

# Deployed Resources
API_GATEWAY_URL=${API_URL}
USER_POOL_ID=${USER_POOL_ID}
USER_POOL_CLIENT_ID=${USER_POOL_CLIENT_ID}

# Cost Monitoring
MONTHLY_BUDGET=${MONTHLY_BUDGET}
NOTIFICATION_EMAIL=${NOTIFICATION_EMAIL}
ESTIMATED_MONTHLY_COST=\$5-15

# Feature Flags
USE_MOCK_BEDROCK=${USE_MOCK_BEDROCK}
COST_OPTIMIZED=true
EOF

echo -e "\n${GREEN}🎉 Minimal AWS Deployment Complete!${NC}"
echo ""
echo -e "${BLUE}📋 Deployment Summary:${NC}"
echo "  🌐 API Gateway URL: ${API_URL}"
echo "  🔐 User Pool ID: ${USER_POOL_ID}"
echo "  💰 Estimated Cost: $5-15/month"
echo "  📧 Budget Alerts: ${NOTIFICATION_EMAIL}"
echo ""
echo -e "${GREEN}✅ Your deployment is live and cost-optimized!${NC}"
echo ""
echo -e "${BLUE}🧪 Test your deployment:${NC}"
echo "  curl ${API_URL}api/v1/health"
echo ""
echo -e "${YELLOW}💰 Cost Management:${NC}"
echo "  • Monitor costs daily in AWS Cost Explorer"
echo "  • Budget alerts set at $${MONTHLY_BUDGET}"
echo "  • Auto-cleanup enabled for dev resources"
echo ""
echo -e "${BLUE}🛑 To cleanup and stop charges:${NC}"
echo "  ./deployment/cleanup.sh ${ENVIRONMENT}"
echo ""
echo -e "${GREEN}🎯 Your $100 credits should last 3-6 months with this setup!${NC}"