#!/bin/bash
# Quick AWS Deployment Script for AgentHub Frontend

echo "🚀 Deploying AgentHub Frontend to AWS..."

# Create S3 bucket for hosting
BUCKET_NAME="agenthub-frontend-$(date +%s)"
aws s3 mb s3://$BUCKET_NAME --region us-east-1

# Configure bucket for static website hosting
aws s3 website s3://$BUCKET_NAME --index-document index.html --error-document index.html

# Upload build files
cd agent-hub-ui
aws s3 sync build/ s3://$BUCKET_NAME --delete

# Make bucket public for website hosting
aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy '{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::'$BUCKET_NAME'/*"
    }
  ]
}'

echo "✅ Deployment Complete!"
echo "🌐 Your AgentHub is now live at:"
echo "http://$BUCKET_NAME.s3-website-us-east-1.amazonaws.com"