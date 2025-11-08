#!/usr/bin/env pwsh

# Deploy MCP Infrastructure for Agent Hub Platform
# This script deploys the ECS/Fargate infrastructure for MCP servers

param(
    [string]$Environment = "dev",
    [switch]$DryRun = $false,
    [switch]$Force = $false
)

Write-Host "🚀 Deploying MCP Infrastructure for Agent Hub Platform" -ForegroundColor Green
Write-Host "Environment: $Environment" -ForegroundColor Yellow

# Cost warning
Write-Host ""
Write-Host "💰 COST REMINDER:" -ForegroundColor Yellow
Write-Host "=================" -ForegroundColor Yellow
Write-Host "• This deployment will incur AWS charges" -ForegroundColor White
Write-Host "• Estimated daily cost: `$2.82-5.22 for dev environment" -ForegroundColor White
Write-Host "• Make sure your AWS credits are configured properly" -ForegroundColor White
Write-Host "• Run './monitor-daily-costs.ps1' to track spending" -ForegroundColor White
Write-Host ""

if (!$Force) {
    $confirm = Read-Host "Continue with deployment? (y/N)"
    if ($confirm -ne "y" -and $confirm -ne "Y") {
        Write-Host "Deployment cancelled by user." -ForegroundColor Yellow
        exit 0
    }
}

# Set environment variables
$env:ENVIRONMENT = $Environment
$env:CDK_DEFAULT_REGION = "us-east-1"

# Change to infrastructure directory
Set-Location "infrastructure"

try {
    # Install dependencies if needed
    if (!(Test-Path "node_modules")) {
        Write-Host "📦 Installing CDK dependencies..." -ForegroundColor Blue
        npm install
    }

    # Build TypeScript
    Write-Host "🔨 Building CDK project..." -ForegroundColor Blue
    npm run build

    if ($DryRun) {
        Write-Host "🔍 Running CDK diff (dry run)..." -ForegroundColor Blue
        npx cdk diff "MCPInfrastructureStack-$Environment"
    } else {
        # Deploy MCP Infrastructure stack
        Write-Host "🚀 Deploying MCP Infrastructure stack..." -ForegroundColor Blue
        
        $deployArgs = @("deploy", "MCPInfrastructureStack-$Environment", "--require-approval", "never")
        if ($Force) {
            $deployArgs += "--force"
        }
        
        npx cdk @deployArgs

        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ MCP Infrastructure deployment completed successfully!" -ForegroundColor Green
            
            # Get stack outputs
            Write-Host "📋 Stack Outputs:" -ForegroundColor Blue
            npx cdk list --long
            
            Write-Host ""
            Write-Host "🎯 Next Steps:" -ForegroundColor Yellow
            Write-Host "1. Build and push MCP server Docker images to ECR"
            Write-Host "2. Deploy MCP services to the ECS cluster"
            Write-Host "3. Configure OAuth credentials in AWS Secrets Manager"
            Write-Host "4. Test MCP server endpoints through the Application Load Balancer"
            
        } else {
            Write-Host "❌ MCP Infrastructure deployment failed!" -ForegroundColor Red
            exit 1
        }
    }

} catch {
    Write-Host "❌ Error during deployment: $_" -ForegroundColor Red
    exit 1
} finally {
    # Return to original directory
    Set-Location ".."
}

Write-Host ""
Write-Host "🏁 MCP Infrastructure deployment script completed." -ForegroundColor Green