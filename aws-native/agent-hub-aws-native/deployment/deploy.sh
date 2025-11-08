#!/bin/bash

# AWS Native Agent Hub Deployment Script
set -e

echo "🚀 Starting AWS Native Agent Hub Deployment"

# Configuration
ENVIRONMENT=${1:-dev}
AWS_REGION=${AWS_REGION:-us-east-1}
STACK_NAME="AgentHubStack-${ENVIRONMENT}"

echo "📋 Deployment Configuration:"
echo "  Environment: ${ENVIRONMENT}"
echo "  Region: ${AWS_REGION}"
echo "  Stack Name: ${STACK_NAME}"

# Check prerequisites
echo "🔍 Checking prerequisites..."

if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Please install AWS CLI."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install Node.js and npm."
    exit 1
fi

if ! command -v cdk &> /dev/null; then
    echo "❌ CDK not found. Installing AWS CDK..."
    npm install -g aws-cdk
fi

# Verify AWS credentials
echo "🔐 Verifying AWS credentials..."
aws sts get-caller-identity > /dev/null || {
    echo "❌ AWS credentials not configured. Please run 'aws configure'."
    exit 1
}

# Bootstrap CDK (if needed)
echo "🏗️ Bootstrapping CDK..."
cdk bootstrap aws://$(aws sts get-caller-identity --query Account --output text)/${AWS_REGION}

# Build and deploy infrastructure
echo "🏗️ Building and deploying infrastructure..."
cd infrastructure
npm install
npm run build
cdk deploy --require-approval never

# Get stack outputs
echo "📤 Getting stack outputs..."
API_GATEWAY_URL=$(aws cloudformation describe-stacks \
    --stack-name ${STACK_NAME} \
    --query 'Stacks[0].Outputs[?OutputKey==`ApiGatewayUrl`].OutputValue' \
    --output text)

USER_POOL_ID=$(aws cloudformation describe-stacks \
    --stack-name ${STACK_NAME} \
    --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' \
    --output text)

USER_POOL_CLIENT_ID=$(aws cloudformation describe-stacks \
    --stack-name ${STACK_NAME} \
    --query 'Stacks[0].Outputs[?OutputKey==`UserPoolClientId`].OutputValue' \
    --output text)

FRONTEND_BUCKET=$(aws cloudformation describe-stacks \
    --stack-name ${STACK_NAME} \
    --query 'Stacks[0].Outputs[?OutputKey==`FrontendBucketUrl`].OutputValue' \
    --output text)

echo "✅ Infrastructure deployed successfully!"
echo "  API Gateway URL: ${API_GATEWAY_URL}"
echo "  User Pool ID: ${USER_POOL_ID}"
echo "  Frontend URL: ${FRONTEND_BUCKET}"

# Build and deploy Lambda functions
echo "⚡ Building and deploying Lambda functions..."
cd ../lambda-functions

# Build each function
for function_dir in */; do
    if [ -d "$function_dir" ]; then
        echo "📦 Building ${function_dir%/}..."
        cd "$function_dir"
        npm install
        npm run build
        cd ..
    fi
done

echo "✅ Lambda functions built successfully!"

# Build and deploy frontend
echo "🎨 Building and deploying frontend..."
cd ../frontend

# Create environment file
cat > .env.production << EOF
REACT_APP_API_GATEWAY_URL=${API_GATEWAY_URL}
REACT_APP_USER_POOL_ID=${USER_POOL_ID}
REACT_APP_USER_POOL_CLIENT_ID=${USER_POOL_CLIENT_ID}
REACT_APP_AWS_REGION=${AWS_REGION}
EOF

# Install dependencies and build
npm install
npm run build

# Deploy to S3
BUCKET_NAME=$(echo ${FRONTEND_BUCKET} | sed 's|http://||' | sed 's|\.s3-website.*||')
echo "📤 Deploying to S3 bucket: ${BUCKET_NAME}"
aws s3 sync build/ s3://${BUCKET_NAME} --delete

echo "✅ Frontend deployed successfully!"

# Seed initial data
echo "🌱 Seeding initial data..."
cd ../database
node seed-data.js

echo "🎉 Deployment completed successfully!"
echo ""
echo "📋 Deployment Summary:"
echo "  🌐 Frontend URL: ${FRONTEND_BUCKET}"
echo "  🔗 API Gateway: ${API_GATEWAY_URL}"
echo "  🔐 User Pool ID: ${USER_POOL_ID}"
echo ""
echo "🚀 Your AWS Native Agent Hub is ready!"
echo "   Visit ${FRONTEND_BUCKET} to get started"