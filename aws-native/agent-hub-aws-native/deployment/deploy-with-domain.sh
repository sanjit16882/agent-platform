#!/bin/bash

# Deploy Agent Hub with Custom Domain
# Creates professional URLs for remote access and demos

set -e

# Load domain configuration
if [ ! -f ".env.domain" ]; then
    echo "❌ Domain not configured. Run ./setup-domain.sh first"
    exit 1
fi

source .env.domain

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Deploying Agent Hub with Custom Domain${NC}"
echo -e "${GREEN}🌐 Domain: ${DOMAIN_NAME}${NC}"
echo -e "${YELLOW}💰 Estimated cost: $35-60/month${NC}"
echo ""

# Confirmation
read -p "Continue with domain deployment? (y/N): " -n 1 -r
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

echo -e "\n${BLUE}🏗️ Deploying infrastructure with custom domain...${NC}"

cd infrastructure

# Create domain-enabled CDK stack
cat > lib/domain-stack.ts << 'EOF'
import * as cdk from 'aws-cdk-lib';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import { Construct } from 'constructs';

export class AgentHubDomainStack extends cdk.Stack {
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

    // S3 bucket for frontend
    const frontendBucket = new s3.Bucket(this, 'FrontendBucket', {
      bucketName: `agent-hub-frontend-${props?.env?.account}`,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'error.html',
      publicReadAccess: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true
    });

    // CloudFront distribution for frontend
    const frontendDistribution = new cloudfront.Distribution(this, 'FrontendDistribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(frontendBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED
      },
      domainNames: [`app.${domainName}`],
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

    // Lambda functions
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
        NODE_ENV: 'production'
      }
    });

    agentsTable.grantReadWriteData(agentFunction);

    // API Gateway with custom domain
    const api = new apigateway.RestApi(this, 'AgentHubApi', {
      restApiName: 'agent-hub-api',
      description: 'Agent Hub Platform API',
      domainName: {
        domainName: `api.${domainName}`,
        certificate
      },
      defaultCorsPreflightOptions: {
        allowOrigins: [`https://app.${domainName}`],
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

    // VPC for ECS (MCP servers)
    const vpc = new ec2.Vpc(this, 'AgentHubVpc', {
      maxAzs: 2,
      natGateways: 1
    });

    // ECS Cluster for MCP servers
    const cluster = new ecs.Cluster(this, 'McpCluster', {
      vpc,
      clusterName: 'agent-hub-mcp-cluster'
    });

    // Application Load Balancer for MCP
    const mcpAlb = new elbv2.ApplicationLoadBalancer(this, 'McpALB', {
      vpc,
      internetFacing: true,
      loadBalancerName: 'agent-hub-mcp-alb'
    });

    // MCP Listener with SSL
    const mcpListener = mcpAlb.addListener('McpListener', {
      port: 443,
      protocol: elbv2.ApplicationProtocol.HTTPS,
      certificates: [certificate]
    });

    // Route 53 records
    new route53.ARecord(this, 'FrontendRecord', {
      zone: hostedZone,
      recordName: 'app',
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(frontendDistribution))
    });

    new route53.ARecord(this, 'ApiRecord', {
      zone: hostedZone,
      recordName: 'api',
      target: route53.RecordTarget.fromAlias(new targets.ApiGateway(api))
    });

    new route53.ARecord(this, 'McpRecord', {
      zone: hostedZone,
      recordName: 'mcp',
      target: route53.RecordTarget.fromAlias(new targets.LoadBalancerTarget(mcpAlb))
    });

    // Outputs
    new cdk.CfnOutput(this, 'FrontendUrl', {
      value: `https://app.${domainName}`,
      description: 'Frontend Application URL'
    });

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: `https://api.${domainName}`,
      description: 'API Gateway URL'
    });

    new cdk.CfnOutput(this, 'McpUrl', {
      value: `https://mcp.${domainName}`,
      description: 'MCP Services URL'
    });

    new cdk.CfnOutput(this, 'DomainName', {
      value: domainName,
      description: 'Custom Domain Name'
    });
  }
}
EOF

# Update app.ts
cat > bin/app.ts << 'EOF'
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AgentHubDomainStack } from '../lib/domain-stack';

const app = new cdk.App();

const account = process.env.CDK_DEFAULT_ACCOUNT || app.node.tryGetContext('accountId');
const region = process.env.CDK_DEFAULT_REGION || app.node.tryGetContext('region') || 'us-east-1';
const domainName = app.node.tryGetContext('domainName');

new AgentHubDomainStack(app, `AgentHub-${domainName.replace(/\./g, '-')}`, {
  env: { account, region },
  description: `Agent Hub Platform with custom domain: ${domainName}`,
  tags: {
    Project: 'AgentHub',
    Domain: domainName,
    Environment: 'production'
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
STACK_NAME="AgentHub-$(echo $DOMAIN_NAME | sed 's/\./-/g')"

FRONTEND_URL=$(aws cloudformation describe-stacks \
    --stack-name ${STACK_NAME} \
    --query 'Stacks[0].Outputs[?OutputKey==`FrontendUrl`].OutputValue' \
    --output text)

API_URL=$(aws cloudformation describe-stacks \
    --stack-name ${STACK_NAME} \
    --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
    --output text)

MCP_URL=$(aws cloudformation describe-stacks \
    --stack-name ${STACK_NAME} \
    --query 'Stacks[0].Outputs[?OutputKey==`McpUrl`].OutputValue' \
    --output text)

cd ..

# Build and deploy frontend
echo -e "\n${BLUE}🎨 Building and deploying frontend...${NC}"
cd frontend

# Update frontend configuration
cat > src/config.js << EOF
const config = {
  apiUrl: '${API_URL}',
  mcpUrl: '${MCP_URL}',
  domain: '${DOMAIN_NAME}',
  environment: 'production',
  features: {
    customDomain: true,
    ssl: true,
    remoteAccess: true
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

# Update environment file
cat >> .env.domain << EOF

# Deployment URLs (Live)
DEPLOYED_FRONTEND_URL=${FRONTEND_URL}
DEPLOYED_API_URL=${API_URL}
DEPLOYED_MCP_URL=${MCP_URL}

# Deployment Info
DEPLOYMENT_DATE=$(date)
STACK_NAME=${STACK_NAME}
DEPLOYMENT_STATUS=live
EOF

echo -e "\n${GREEN}🎉 Domain deployment complete!${NC}"
echo ""
echo -e "${BLUE}🌐 Your Agent Hub Platform is now live:${NC}"
echo ""
echo -e "${GREEN}📱 Application URLs:${NC}"
echo "  🎨 Frontend:  ${FRONTEND_URL}"
echo "  🔌 API:       ${API_URL}"
echo "  🛠️  MCP:       ${MCP_URL}"
echo ""
echo -e "${BLUE}🔗 Direct Links:${NC}"
echo "  📊 Dashboard: ${FRONTEND_URL}/dashboard"
echo "  🤖 Agents:    ${FRONTEND_URL}/agents"
echo "  ⚙️  Settings:  ${FRONTEND_URL}/settings"
echo ""
echo -e "${GREEN}✅ Features Available:${NC}"
echo "  🌍 Remote access from any device"
echo "  🔒 SSL/HTTPS encryption"
echo "  📱 Mobile-friendly interface"
echo "  🚀 Professional domain"
echo "  🎬 Perfect for demos"
echo ""
echo -e "${YELLOW}💰 Monthly Cost: ~$35-60${NC}"
echo -e "${BLUE}🎯 Share your platform with clients and stakeholders!${NC}"