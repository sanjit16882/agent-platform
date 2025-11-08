#!/bin/bash

# Gradual AWS Migration Script
# Start local, add AWS services one by one

echo "🔄 Gradual AWS Migration Strategy"
echo "💰 Your Budget: $100 AWS Credits"

# Week 1: Everything Local (Cost: $0)
echo ""
echo "📅 Week 1: Pure Local Development"
echo "   Cost: $0/month"
echo "   Services: All local (LocalStack, Docker, Mock services)"
echo "   Goal: Build and test core functionality"

# Week 2: Add DynamoDB (Cost: $1-3/month)
echo ""
echo "📅 Week 2: Add Real DynamoDB"
echo "   Cost: $1-3/month"
echo "   Why: Test real database performance and queries"
echo "   Command: ./deploy-service.sh dynamodb"

# Week 3: Add S3 (Cost: $1-4/month total)
echo ""
echo "📅 Week 3: Add Real S3 Storage"
echo "   Cost: $1-4/month total"
echo "   Why: Test file uploads, downloads, and storage"
echo "   Command: ./deploy-service.sh s3"

# Week 4: Add Cognito (Cost: $1-4/month total - Cognito is free)
echo ""
echo "📅 Week 4: Add Real Authentication"
echo "   Cost: $1-4/month total (Cognito free tier)"
echo "   Why: Test user management and security"
echo "   Command: ./deploy-service.sh cognito"

# Week 5: Add API Gateway (Cost: $2-7/month total)
echo ""
echo "📅 Week 5: Add API Gateway"
echo "   Cost: $2-7/month total"
echo "   Why: Test real API endpoints and CORS"
echo "   Command: ./deploy-service.sh apigateway"

# Week 6: Add Lambda (Cost: $2-7/month total - Lambda has generous free tier)
echo ""
echo "📅 Week 6: Add Real Lambda Functions"
echo "   Cost: $2-7/month total (1M requests free)"
echo "   Why: Test serverless execution and scaling"
echo "   Command: ./deploy-service.sh lambda"

# Week 7+: Add Bedrock only when needed (Cost: $5-15/month total)
echo ""
echo "📅 Week 7+: Add Bedrock (Optional)"
echo "   Cost: $5-15/month total"
echo "   Why: Test real AI responses (keep mocked until needed)"
echo "   Command: ./deploy-service.sh bedrock"

echo ""
echo "💡 Strategy Benefits:"
echo "   ✅ Gradual cost increase"
echo "   ✅ Test each service individually"
echo "   ✅ Easy rollback if costs get high"
echo "   ✅ Your $100 credits last 6+ months"

echo ""
echo "🛑 Emergency Cleanup:"
echo "   ./cleanup-all-services.sh  # Removes everything, stops all charges"