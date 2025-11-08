# Setup Local Development Environment
# This allows us to develop locally and deploy to production when ready

Write-Host "🏗️ Setting up Local Development Environment" -ForegroundColor Blue

# Create local environment configuration
$localConfig = @"
# Local Development Configuration
NODE_ENV=development
AWS_REGION=us-east-1

# Local DynamoDB (using DynamoDB Local)
AGENTS_TABLE=agent-hub-agents-local
EXECUTIONS_TABLE=agent-hub-executions-local
INTELLIGENCE_TABLE=agent-hub-intelligence-local
CONNECTIONS_TABLE=agent-hub-connections-local

# Local API endpoints
API_BASE_URL=http://localhost:3000
WEBSOCKET_URL=ws://localhost:3001

# Mock services for local development
USE_MOCK_BEDROCK=true
USE_MOCK_DYNAMODB=false
USE_LOCAL_DYNAMODB=true

# Production endpoints (for testing)
PROD_API_URL=https://as8v96iank.execute-api.us-east-1.amazonaws.com/prod
PROD_WEBSOCKET_URL=wss://7z50pi1iz5.execute-api.us-east-1.amazonaws.com/prod
"@

$localConfig | Out-File -FilePath ".env.local" -Encoding UTF8

Write-Host "✅ Local environment configuration created" -ForegroundColor Green
Write-Host "📝 Next: Run 'npm run dev:local' to start local development" -ForegroundColor Cyan