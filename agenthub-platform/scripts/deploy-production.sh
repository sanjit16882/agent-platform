#!/bin/bash
# AgentHub Production Deployment Script

echo "🚀 Deploying AgentHub to AWS Production..."

# Set variables
BUCKET_NAME="agenthub-prod-$(date +%s)"
REGION="us-east-1"

# Build the React app for production
echo "📦 Building React application..."
cd ../frontend
npm run build

# Create S3 bucket for hosting
echo "🪣 Creating S3 bucket: $BUCKET_NAME"
aws s3 mb s3://$BUCKET_NAME --region $REGION

# Configure bucket for static website hosting
echo "🌐 Configuring static website hosting..."
aws s3 website s3://$BUCKET_NAME --index-document index.html --error-document index.html

# Create bucket policy for public read access
echo "🔓 Setting up public access policy..."
cat > bucket-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::$BUCKET_NAME/*"
    }
  ]
}
EOF

aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy file://bucket-policy.json

# Upload build files to S3
echo "📤 Uploading files to S3..."
aws s3 sync build/ s3://$BUCKET_NAME --delete

# Clean up temporary files
rm bucket-policy.json

# Get the website URL
WEBSITE_URL="http://$BUCKET_NAME.s3-website-$REGION.amazonaws.com"

echo ""
echo "✅ Deployment Complete!"
echo "🌐 Production URL: $WEBSITE_URL"
echo "🔗 API Backend: https://z5ujq1k916.execute-api.us-east-1.amazonaws.com/prod/"
echo ""
echo "💡 Save this URL for demos!"
echo "💰 Estimated monthly cost: ~$0.79 (only when used)"
echo ""
echo "🎯 Next Steps:"
echo "1. Test the production URL"
echo "2. Bookmark for demos"
echo "3. Continue development locally"