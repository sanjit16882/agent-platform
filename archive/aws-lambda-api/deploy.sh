#!/bin/bash
# Deploy AgentHub API to AWS Lambda

echo "🚀 Deploying AgentHub API to AWS Lambda..."

# Install dependencies
npm install

# Create deployment package
zip -r agenthub-api.zip . -x "*.sh" "*.md"

# Deploy to Lambda (replace with your function name)
aws lambda update-function-code \
  --function-name AgentHubAPI \
  --zip-file fileb://agenthub-api.zip \
  --region us-east-1

echo "✅ Deployment complete!"
echo "🔗 API available at: https://z5ujq1k916.execute-api.us-east-1.amazonaws.com/prod/"