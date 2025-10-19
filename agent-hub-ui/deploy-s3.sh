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
echo "   • Real-time Progress Tracking with WebSocket Simulation"
echo "   • Professional Analytics Dashboard ($1.25M ROI Metrics)"
echo "   • Syntax Highlighting for Generated Code (10+ Languages)"
echo "   • Export System (PDF, Excel, Word Reports)"
echo "   • Interactive Agent Performance Tables"
echo "   • Executive Business Intelligence Dashboard"
echo "   • Professional Code Display with Copy Functionality"
echo "   • Streaming Output with Live Progress Updates"
echo "   • Enhanced Agent Toggle Functionality"
echo "   • Conservative ROI Calculator"
echo "   • CloudWatch Metrics Dashboard"