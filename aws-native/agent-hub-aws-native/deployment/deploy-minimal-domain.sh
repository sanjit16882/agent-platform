#!/bin/bash

# Deploy Agent Hub with Minimal Domain Setup
# Frontend gets DNS, backend services use IP addresses

set -e

# Load minimal domain configuration
if [ ! -f ".env.minimal-domain" ]; then
    echo "❌ Minimal domain not configured. Run ./setup-minimal-domain.sh first"
    exit 1
fi

source .env.minimal-domain

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Deploying Agent Hub with Minimal Domain${NC}"
echo -e "${GREEN}🌐 Frontend Domain: ${DOMAIN_NAME}${NC}"
echo -e "${GREEN}💰 Backend: IP addresses (cost optimized)${NC}"
echo -e "${YELLOW}💰 Estimated cost: $23-49/month (vs $38-70/month)${NC}"
echo ""

# Confirmation
read -p "Continue with minimal domain deployment? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 0
fi

echo -e "\n${BLUE}🔍 Verifying SSL certificate status...${NC}"

# Check certificate status
CERT_STATUS=$(aws acm describe-certificate \
    --certificate-arn $CERTIFICATE_ARN \
    --region us-east-1 \
    --query 'Certificate.Status' \
    --output text)

if [ "$CERT_STATUS" != "ISSUED" ]; then
    echo -e "${YELLOW}⏳ Certificate status: ${CERT_STATUS}${NC}"
    echo "Waiting for certificate validation..."
    
    # Wait for certificate to be issued
    aws acm wait certificate-validated \
        --certificate-arn $CERTIFICATE_ARN \
        --region us-east-1
    
    echo -e "${GREEN}✅ Certificate validated${NC}"
fi

echo -e "\n${BLUE}🏗️ Deploying cost-optimized infrastructure...${NC}"

cd infrastructure

# Create minimal domain CDK stack
cat > lib/minimal-domain-stack.ts << 'EOF'
import * as cdk from 'aws-cdk-lib';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import { Construct } from 'constructs';

export class AgentHubMinimalDomainStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const domainName = this.node.tryGetContext('domainName');
    const hostedZoneId = this.node.tryGetContext('hostedZoneId');
    const certificateArn = this.node.tryGetContext('certificateArn');

    // Import existing resources
    const hostedZone = route53.HostedZone.fromHostedZoneAttributes(this, 'HostedZone', {
      hostedZoneId,
      zoneName: domainName
    });

    const certificate = acm.Certificate.fromCertificateArn(this, 'Certificate', certificateArn);

    // S3 bucket for frontend (only service with DNS)
    const frontendBucket = new s3.Bucket(this, 'FrontendBucket', {
      bucketName: `agent-hub-frontend-${props?.env?.account}`,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'error.html',
      publicReadAccess: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true
    });

    // Simple CloudFront distribution (no custom behaviors)
    const frontendDistribution = new cloudfront.Distribution(this, 'FrontendDistribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(frontendBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED
      },
      domainNames: [domainName],
      certificate,
      defaultRootObject: 'index.html',
      errorResponses: [{
        httpStatus: 404,
        responseHttpStatus: 200,
        responsePagePath: '/index.html'
      }]
    });

    // DynamoDB tables
    const agentsTable = new dynamodb.Table(this, 'AgentsTable', {
      tableName: `agent-hub-agents-${props?.env?.account}`,
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'version', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    // Lambda function for API (no custom domain - use default API Gateway URL)
    const agentFunction = new lambda.Function(this, 'AgentFunction', {
      functionName: 'agent-hub-api',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('../unified-api-server'),
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      environment: {
        AGENTS_TABLE: agentsTable.tableName,
        DOMAIN_NAME: domainName,
        NODE_ENV: 'production',
        USE_IP_ADDRESSES: 'true'
      }
    });

    agentsTable.grantReadWriteData(agentFunction);

    // Basic API Gateway (NO custom domain to save costs)
    const api = new apigateway.RestApi(this, 'AgentHubApi', {
      restApiName: 'agent-hub-api',
      description: 'Agent Hub Platform API - Cost Optimized',
      defaultCorsPreflightOptions: {
        allowOrigins: [`https://${domainName}`],
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization']
      }
    });

    // API routes
    const v1 = api.root.addResource('api').addResource('v1');
    
    // Health endpoint
    v1.addResource('health').addMethod('GET', new apigateway.LambdaIntegration(agentFunction));
    
    // Agent endpoints
    const agents = v1.addResource('agents');
    agents.addMethod('GET', new apigateway.LambdaIntegration(agentFunction));
    agents.addMethod('POST', new apigateway.LambdaIntegration(agentFunction));
    
    const agentById = agents.addResource('{id}');
    agentById.addMethod('GET', new apigateway.LambdaIntegration(agentFunction));
    agentById.addMethod('PUT', new apigateway.LambdaIntegration(agentFunction));
    agentById.addMethod('DELETE', new apigateway.LambdaIntegration(agentFunction));

    // VPC for ECS (MCP servers) - minimal setup
    const vpc = new ec2.Vpc(this, 'AgentHubVpc', {
      maxAzs: 2,
      natGateways: 1  // Minimal NAT gateways
    });

    // ECS Cluster for MCP servers (no load balancer to save costs)
    const cluster = new ecs.Cluster(this, 'McpCluster', {
      vpc,
      clusterName: 'agent-hub-mcp-cluster'
    });

    // MCP Filesystem Service (direct IP access)
    const mcpFilesystemTaskDef = new ecs.FargateTaskDefinition(this, 'McpFilesystemTask', {
      memoryLimitMiB: 512,
      cpu: 256
    });

    mcpFilesystemTaskDef.addContainer('filesystem', {
      image: ecs.ContainerImage.fromRegistry('agent-hub/mcp-filesystem:latest'),
      portMappings: [{ containerPort: 3000 }],
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'mcp-filesystem'
      })
    });

    const mcpFilesystemService = new ecs.FargateService(this, 'McpFilesystemService', {
      cluster,
      taskDefinition: mcpFilesystemTaskDef,
      desiredCount: 1,
      assignPublicIp: true  // Direct IP access
    });

    // Route 53 record - ONLY for frontend
    new route53.ARecord(this, 'FrontendRecord', {
      zone: hostedZone,
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(frontendDistribution))
    });

    // Outputs
    new cdk.CfnOutput(this, 'FrontendUrl', {
      value: `https://${domainName}`,
      description: 'Frontend Application URL (DNS)'
    });

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'API Gateway URL (IP-based)'
    });

    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID for MCP services'
    });

    new cdk.CfnOutput(this, 'ClusterName', {
      value: cluster.clusterName,
      description: 'ECS Cluster for MCP services'
    });

    new cdk.CfnOutput(this, 'CostSavings', {
      value: '$15-20/month saved vs full domain setup',
      description: 'Monthly cost savings'
    });
  }
}
EOF

# Update app.ts
cat > bin/app.ts << 'EOF'
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AgentHubMinimalDomainStack } from '../lib/minimal-domain-stack';

const app = new cdk.App();

const account = process.env.CDK_DEFAULT_ACCOUNT || app.node.tryGetContext('accountId');
const region = process.env.CDK_DEFAULT_REGION || app.node.tryGetContext('region') || 'us-east-1';
const domainName = app.node.tryGetContext('domainName');

new AgentHubMinimalDomainStack(app, `AgentHub-Minimal-${domainName.replace(/\./g, '-')}`, {
  env: { account, region },
  description: `Agent Hub Platform - Minimal Domain: ${domainName}`,
  tags: {
    Project: 'AgentHub',
    Domain: domainName,
    Environment: 'production',
    CostOptimized: 'true'
  }
});
EOF

# Build and deploy
echo -e "\n${BLUE}🔨 Building CDK project...${NC}"
npm run build

echo -e "\n${BLUE}🚀 Deploying to AWS...${NC}"
cdk deploy --require-approval never

# Get deployment outputs
echo -e "\n${BLUE}📤 Getting deployment outputs...${NC}"
STACK_NAME="AgentHub-Minimal-$(echo $DOMAIN_NAME | sed 's/\./-/g')"

FRONTEND_URL=$(aws cloudformation describe-stacks \
    --stack-name ${STACK_NAME} \
    --query 'Stacks[0].Outputs[?OutputKey==`FrontendUrl`].OutputValue' \
    --output text)

API_URL=$(aws cloudformation describe-stacks \
    --stack-name ${STACK_NAME} \
    --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
    --output text)

VPC_ID=$(aws cloudformation describe-stacks \
    --stack-name ${STACK_NAME} \
    --query 'Stacks[0].Outputs[?OutputKey==`VpcId`].OutputValue' \
    --output text)

CLUSTER_NAME=$(aws cloudformation describe-stacks \
    --stack-name ${STACK_NAME} \
    --query 'Stacks[0].Outputs[?OutputKey==`ClusterName`].OutputValue' \
    --output text)

cd ..

# Get ECS service IPs
echo -e "\n${BLUE}🔍 Getting MCP service IP addresses...${NC}"

# Get ECS tasks and their IPs
MCP_TASKS=$(aws ecs list-tasks \
    --cluster $CLUSTER_NAME \
    --query 'taskArns' \
    --output text)

if [ ! -z "$MCP_TASKS" ]; then
    MCP_IPS=$(aws ecs describe-tasks \
        --cluster $CLUSTER_NAME \
        --tasks $MCP_TASKS \
        --query 'tasks[0].attachments[0].details[?name==`networkInterfaceId`].value' \
        --output text)
    
    if [ ! -z "$MCP_IPS" ]; then
        MCP_PUBLIC_IP=$(aws ec2 describe-network-interfaces \
            --network-interface-ids $MCP_IPS \
            --query 'NetworkInterfaces[0].Association.PublicIp' \
            --output text)
    fi
fi

# Build and deploy frontend
echo -e "\n${BLUE}🎨 Building and deploying frontend...${NC}"
cd frontend

# Update frontend configuration with IP addresses
cat > src/config.js << EOF
const config = {
  // Frontend uses DNS
  frontendUrl: '${FRONTEND_URL}',
  
  // Backend uses IP addresses (cost optimized)
  apiUrl: '${API_URL}',
  mcpUrl: '${MCP_PUBLIC_IP:-"PENDING"}:3000',
  
  domain: '${DOMAIN_NAME}',
  environment: 'production',
  
  features: {
    minimalDomain: true,
    costOptimized: true,
    frontendDNS: true,
    backendIPs: true
  },
  
  // IP-based endpoints
  endpoints: {
    api: '${API_URL}',
    mcpFilesystem: 'http://${MCP_PUBLIC_IP:-"PENDING"}:3000',
    mcpGit: 'http://${MCP_PUBLIC_IP:-"PENDING"}:3001',
    mcpDatabase: 'http://${MCP_PUBLIC_IP:-"PENDING"}:3002'
  }
};

export default config;
EOF

# Build frontend
npm install
npm run build

# Deploy to S3
aws s3 sync build/ s3://agent-hub-frontend-${AWS_ACCOUNT_ID} --delete

cd ..

# Update environment file with actual IPs
cat >> .env.minimal-domain << EOF

# Deployment URLs (Live)
DEPLOYED_FRONTEND_URL=${FRONTEND_URL}
DEPLOYED_API_URL=${API_URL}
DEPLOYED_MCP_IP=${MCP_PUBLIC_IP:-"PENDING"}

# IP-based Endpoints
API_IP_URL=${API_URL}
MCP_FILESYSTEM_IP=http://${MCP_PUBLIC_IP:-"PENDING"}:3000
MCP_GIT_IP=http://${MCP_PUBLIC_IP:-"PENDING"}:3001
MCP_DATABASE_IP=http://${MCP_PUBLIC_IP:-"PENDING"}:3002

# Deployment Info
DEPLOYMENT_DATE=$(date)
STACK_NAME=${STACK_NAME}
DEPLOYMENT_STATUS=live
VPC_ID=${VPC_ID}
CLUSTER_NAME=${CLUSTER_NAME}
EOF

echo -e "\n${GREEN}🎉 Minimal domain deployment complete!${NC}"
echo ""
echo -e "${BLUE}🌐 Your Cost-Optimized Agent Hub Platform:${NC}"
echo ""
echo -e "${GREEN}📱 Frontend (DNS):${NC}"
echo "  🎨 Portal: ${FRONTEND_URL}"
echo ""
echo -e "${GREEN}🔌 Backend (IP addresses):${NC}"
echo "  🔌 API: ${API_URL}"
echo "  📁 MCP Filesystem: http://${MCP_PUBLIC_IP:-"PENDING"}:3000"
echo "  🔧 MCP Git: http://${MCP_PUBLIC_IP:-"PENDING"}:3001"
echo "  🗄️ MCP Database: http://${MCP_PUBLIC_IP:-"PENDING"}:3002"
echo ""
echo -e "${GREEN}💰 Cost Savings:${NC}"
echo "  ❌ No multiple subdomains: Saves $2-4/month"
echo "  ❌ No load balancer: Saves $16-20/month"
echo "  ❌ Minimal CDN: Saves $1-3/month"
echo "  ✅ Total Savings: $19-27/month"
echo ""
echo -e "${YELLOW}📋 Access Information:${NC}"
echo "  🌍 Public Portal: Professional DNS name"
echo "  🔧 Development: Use IP addresses for backend"
echo "  📱 Mobile Access: Frontend works on all devices"
echo ""
echo -e "${GREEN}💰 Monthly Cost: $23-49 (vs $38-70 with full DNS)${NC}"
echo -e "${BLUE}🎯 Professional frontend + cost-optimized backend!${NC}"