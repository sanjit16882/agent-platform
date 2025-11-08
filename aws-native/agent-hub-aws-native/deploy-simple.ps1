# Simple Day 1 Deployment
Write-Host "🚀 Day 1 Deployment - Basic Infrastructure" -ForegroundColor Blue

# Set environment variables
$env:CDK_DEFAULT_ACCOUNT = "448049831733"
$env:CDK_DEFAULT_REGION = "us-east-1"
$env:ENVIRONMENT = "production"

# Install CDK dependencies
Write-Host "🏗️ Installing CDK dependencies..." -ForegroundColor Blue
Set-Location infrastructure
npm install

# Build CDK
Write-Host "🔨 Building CDK project..." -ForegroundColor Blue
npm run build

# Install Lambda dependencies
Write-Host "📦 Installing Lambda dependencies..." -ForegroundColor Blue
Set-Location ../lambda-functions/agent-crud
npm install
Set-Location ../intelligence
npm install
Set-Location ../execution
npm install
Set-Location ../mcp
npm install
Set-Location ../analytics
npm install

# Back to infrastructure
Set-Location ../../infrastructure

Write-Host "🚀 Deploying CDK stack..." -ForegroundColor Blue
Write-Host "⚠️ This will create AWS resources" -ForegroundColor Yellow

$deploy = Read-Host "Continue with deployment? (y/N)"
if ($deploy -eq "y" -or $deploy -eq "Y") {
    cdk deploy --require-approval never
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "🎉 Day 1 Infrastructure Deployed!" -ForegroundColor Green
    } else {
        Write-Host "❌ Deployment failed" -ForegroundColor Red
    }
} else {
    Write-Host "Deployment cancelled" -ForegroundColor Yellow
}

Set-Location ..