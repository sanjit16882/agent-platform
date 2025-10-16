#!/bin/bash
# AWS S3 Deployment Script for AgentHub Frontend
# Updated to use existing production bucket

echo "🚀 Deploying AgentHub Frontend to AWS S3..."

# Use existing production bucket
BUCKET_NAME="agenthub-prod-20251010150344"

echo "📦 Building production version..."
npm run build

echo "🌐 Uploading to S3 bucket: $BUCKET_NAME"
aws s3 sync build/ s3://$BUCKET_NAME --delete

echo "✅ Deployment Complete!"
echo "🌐 Your AgentHub is now live at:"
echo "http://$BUCKET_NAME.s3-website-us-east-1.amazonaws.com"
echo ""
echo "🎯 Production Features Deployed:"
echo "   • Conservative ROI Calculator"
echo "   • CloudWatch Metrics Dashboard"
echo "   • Professional React Icons"
echo "   • Two-tier Navigation"
echo "   • Interactive Agent Catalog"
echo "   • Integration Guide"
echo "   • Use Cases Page"