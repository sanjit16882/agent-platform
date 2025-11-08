# Day 1 Deployment Script - Basic Infrastructure
# Deploy core AWS infrastructure for Agent Hub

Write-Host "🚀 Day 1 Deployment - Basic Infrastructure" -ForegroundColor Blue
Write-Host "⏱️ Estimated time: 15-20 minutes" -ForegroundColor Yellow
Write-Host ""

# Load domain configuration
if (Test-Path ".env.domain") {
    Get-Content ".env.domain" | ForEach-Object {
        if ($_ -match "^([^=]+)=(.*)$") {
            [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
        }
    }
    Write-Host "✅ Loaded domain configuration" -ForegroundColor Green
} else {
    Write-Host "❌ Domain configuration not found. Run setup-domain-simple.ps1 first" -ForegroundColor Red
    exit 1
}

# Set environment variables for CDK
$env:CDK_DEFAULT_ACCOUNT = "448049831733"
$env:CDK_DEFAULT_REGION = "us-east-1"
$env:ENVIRONMENT = "production"

Write-Host "🏗️ Installing CDK dependencies..." -ForegroundColor Blue
Set-Location infrastructure
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install CDK dependencies" -ForegroundColor Red
    exit 1
}

Write-Host "🔨 Building CDK project..." -ForegroundColor Blue
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to build CDK project" -ForegroundColor Red
    exit 1
}

Write-Host "📦 Installing Lambda dependencies..." -ForegroundColor Blue
Set-Location ../lambda-functions

# Install dependencies for each Lambda function
$lambdaDirs = @("agent-crud", "intelligence", "execution", "mcp", "analytics")
foreach ($dir in $lambdaDirs) {
    if (Test-Path $dir) {
        Write-Host "  📦 Installing $dir dependencies..." -ForegroundColor Cyan
        Set-Location $dir
        npm install
        Set-Location ..
    }
}

Set-Location ../infrastructure

Write-Host "🚀 Deploying CDK stack..." -ForegroundColor Blue
Write-Host "⚠️ This will create AWS resources and may take 10-15 minutes" -ForegroundColor Yellow

$deploy = Read-Host "Continue with deployment? (y/N)"
if ($deploy -ne "y" -and $deploy -ne "Y") {
    Write-Host "Deployment cancelled." -ForegroundColor Yellow
    exit 0
}

# Deploy the stack
cdk deploy --require-approval never

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "🎉 Day 1 Infrastructure Deployed Successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Next Steps:" -ForegroundColor Blue
    Write-Host "  1. Seed DynamoDB with agent data" -ForegroundColor Cyan
    Write-Host "  2. Deploy React frontend" -ForegroundColor Cyan
    Write-Host "  3. Configure domain DNS" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "💰 Estimated cost so far: $5-10/day" -ForegroundColor Green
} else {
    Write-Host "❌ Deployment failed. Check the error messages above." -ForegroundColor Red
    exit 1
}

Set-Location ..